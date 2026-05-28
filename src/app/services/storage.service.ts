import { Injectable } from '@angular/core';
import { sheetsConfig } from '../config/sheets.config';

export interface ManualData {
  name: string;
  about: string[];
  qualities: string[];
  fears: string[];
  likes: string[];
  pressure: string[];
  environment: string[];
}

const LOCAL_KEY  = 'team_building_manuals_v1';
const ARRAY_SEP  = ';;'; // 陣列欄位的分隔符
const POLL_MS    = 10_000; // 輪詢間隔（10 秒）

@Injectable({ providedIn: 'root' })
export class StorageService {

  private get scriptUrl(): string { return sheetsConfig.scriptUrl; }
  private get isConfigured(): boolean { return !!this.scriptUrl; }

  // ── 公開 API（介面與原 Firebase 版相同）─────────────────────────────────────

  /** 儲存一筆資料（name 為主鍵，自動 upsert） */
  async save(data: ManualData): Promise<void> {
    if (!this.isConfigured) { this.saveLocal(data); return; }

    // 使用 JSONP GET 寫入，完全避開 CORS preflight 問題
    const result = await this.jsonpRequest('save', {
      name:        data.name,
      about:       data.about.join(ARRAY_SEP),
      qualities:   data.qualities.join(ARRAY_SEP),
      fears:       data.fears.join(ARRAY_SEP),
      likes:       data.likes.join(ARRAY_SEP),
      pressure:    data.pressure.join(ARRAY_SEP),
      environment: data.environment.join(ARRAY_SEP),
    });
    console.log('[StorageService] save result:', result);
  }

  /** 一次性讀取所有紀錄 */
  async getAll(): Promise<ManualData[]> {
    if (!this.isConfigured) return this.getAllLocal();
    return this.fetchFromSheets();
  }

  /** 依姓名查詢既有資料（忽略前後空白與大小寫差異） */
  async getByName(name: string): Promise<ManualData | null> {
    const normalizedName = this.normalizeName(name);
    if (!normalizedName) return null;

    const all = await this.getAll();
    return all.find((manual) => this.normalizeName(manual.name) === normalizedName) ?? null;
  }

  /**
   * 訂閱資料更新（Sheets 版：每 10 秒輪詢）。
   * 未設定 scriptUrl 時自動 fallback 至 localStorage。
   * 回傳 unsubscribe 函式，元件 ngOnDestroy 時呼叫。
   */
  subscribe(onChange: (manuals: ManualData[]) => void): () => void {
    if (!this.isConfigured) {
      onChange(this.getAllLocal());
      return () => {};
    }

    // 立即載入一次
    this.fetchFromSheets().then(onChange).catch(() => onChange([]));

    // 定時輪詢
    const timer = setInterval(() => {
      this.fetchFromSheets().then(onChange).catch(() => {});
    }, POLL_MS);

    return () => clearInterval(timer);
  }

  // ── 私有工具 ─────────────────────────────────────────────────────────────────

  /** 通用 JSONP 請求（繞過 CORS，適用讀取與寫入） */
  private jsonpRequest(action: string, params: Record<string, string> = {}): Promise<unknown> {
    return new Promise((resolve) => {
      const cbName = `_gscb_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      const timeout = setTimeout(() => { cleanup(); resolve(null); }, 8_000);

      const cleanup = () => {
        clearTimeout(timeout);
        delete (window as unknown as Record<string, unknown>)[cbName];
        document.getElementById(cbName)?.remove();
      };

      (window as unknown as Record<string, unknown>)[cbName] = (data: unknown) => {
        cleanup();
        resolve(data);
      };

      const qs = new URLSearchParams({ action, callback: cbName, ...params });
      const script = document.createElement('script');
      script.id = cbName;
      script.src = `${this.scriptUrl}?${qs.toString()}`;
      console.log(`[StorageService] JSONP request: action=${action}`, script.src);
      script.onerror = (err) => { console.error('[StorageService] JSONP error:', err); cleanup(); resolve(null); };
      document.head.appendChild(script);
    });
  }

  /** 讀取所有紀錄 */
  private async fetchFromSheets(): Promise<ManualData[]> {
    const data = await this.jsonpRequest('getAll') as { status?: string; records?: unknown[] } | null;
    if (data?.status === 'success' && Array.isArray(data.records)) {
      return data.records.map((r) => this.toManual(r));
    }
    return [];
  }

  private toManual(raw: unknown): ManualData {
    const r = raw as Record<string, string>;
    return {
      name:        r['name']        ?? '',
      about:       r['about']       ? r['about'].split(ARRAY_SEP).filter(Boolean) : [],
      qualities:   r['qualities']   ? r['qualities'].split(ARRAY_SEP).filter(Boolean) : [],
      fears:       r['fears']       ? r['fears'].split(ARRAY_SEP).filter(Boolean) : [],
      likes:       r['likes']       ? r['likes'].split(ARRAY_SEP).filter(Boolean) : [],
      pressure:    r['pressure']    ? r['pressure'].split(ARRAY_SEP).filter(Boolean) : [],
      environment: r['environment'] ? r['environment'].split(ARRAY_SEP).filter(Boolean) : [],
    };
  }

  private saveLocal(data: ManualData): void {
    const all = this.getAllLocal();
    const normalizedName = this.normalizeName(data.name);
    const nextData = { ...data, name: data.name.trim() };
    const idx = all.findIndex((m) => this.normalizeName(m.name) === normalizedName);
    if (idx >= 0) all[idx] = nextData; else all.push(nextData);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
  }

  private getAllLocal(): ManualData[] {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? (JSON.parse(raw) as ManualData[]) : [];
    } catch { return []; }
  }

  private normalizeName(name: string): string {
    return name.trim().toLocaleLowerCase();
  }
}

