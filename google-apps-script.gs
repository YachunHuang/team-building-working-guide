/**
 * 團隊建設說明書 - Google Apps Script Backend
 * ─────────────────────────────────────────────────────
 * 部署步驟：
 * 1. 開啟 Google Sheets → 擴充功能 → Apps Script
 * 2. 把此檔案全部內容貼入 Code.gs，儲存
 * 3. 部署 → 新增部署作業
 *    - 類型：Web 應用程式
 *    - 執行身分：我
 *    - 誰可以存取：所有人（含匿名）
 * 4. 複製 Web App URL → 貼入 src/app/config/sheets.config.ts 的 scriptUrl
 * ─────────────────────────────────────────────────────
 */

const SHEET_NAME = 'manuals';
const COLS = ['name', 'about', 'qualities', 'fears', 'likes', 'pressure', 'environment', 'createdAt'];

// ── GET handler ───────────────────────────────────────────────────────────────
function doGet(e) {
  const action   = e.parameter.action   || '';
  const callback = e.parameter.callback || '';

  let result;
  if (action === 'getAll') {
    result = getAllRecords();
  } else if (action === 'save') {
    // 寫入也走 GET，讓 JSONP 完全繞過 CORS preflight
    try {
      const data = {
        name:        e.parameter.name        || '',
        about:       e.parameter.about       || '',
        qualities:   e.parameter.qualities   || '',
        fears:       e.parameter.fears       || '',
        likes:       e.parameter.likes       || '',
        pressure:    e.parameter.pressure    || '',
        environment: e.parameter.environment || '',
      };
      upsertRecord(data);
      result = { status: 'success' };
    } catch (err) {
      result = { status: 'error', message: String(err) };
    }
  } else {
    result = { status: 'error', message: 'Unknown action: ' + action };
  }

  // JSONP 支援（繞過瀏覽器 CORS）
  const output = callback
    ? callback + '(' + JSON.stringify(result) + ')'
    : JSON.stringify(result);
  const mime = callback
    ? ContentService.MimeType.JAVASCRIPT
    : ContentService.MimeType.JSON;

  return ContentService.createTextOutput(output).setMimeType(mime);
}

// ── POST handler ──────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    upsertRecord(data);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── 讀取所有記錄 ───────────────────────────────────────────────────────────────
function getAllRecords() {
  const sheet = getOrCreateSheet();
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return { status: 'success', records: [] };
  }

  const headers = values[0];
  const records = values.slice(1)
    .filter(row => row[0]) // 過濾 name 欄位為空的列
    .map(row => {
      const record = {};
      headers.forEach((h, i) => { record[h] = String(row[i] ?? ''); });
      return record;
    });

  return { status: 'success', records };
}

// ── 新增或更新記錄（以 name 為主鍵）─────────────────────────────────────────────
function upsertRecord(data) {
  const sheet    = getOrCreateSheet();
  const allData  = sheet.getDataRange().getValues();
  const headers  = allData[0];
  const nameIdx  = headers.indexOf('name');
  const createdIdx = headers.indexOf('createdAt');
  const normalizedName = normalizeName(data.name || '');

  // 找出是否已有同名列
  let existingRowNum = -1;
  let existingCreatedAt = '';

  for (let i = 1; i < allData.length; i++) {
    if (normalizeName(String(allData[i][nameIdx] || '')) === normalizedName) {
      existingRowNum   = i + 1; // Sheets 列號 1-indexed
      existingCreatedAt = String(allData[i][createdIdx] || '');
      break;
    }
  }

  const createdAt = existingCreatedAt
    || new Date().toLocaleString('zh-TW', {
         year: 'numeric', month: '2-digit', day: '2-digit',
         hour: '2-digit', minute: '2-digit', second: '2-digit',
         hour12: false
       });

  const row = COLS.map(col => {
    if (col === 'createdAt') return createdAt;
    if (col === 'name') return String(data[col] ?? '').trim();
    return data[col] ?? '';
  });

  if (existingRowNum > 0) {
    sheet.getRange(existingRowNum, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

function normalizeName(name) {
  return String(name || '').trim().toLowerCase();
}

// ── 取得（或初始化）工作表 ────────────────────────────────────────────────────
function getOrCreateSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let sheet   = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(COLS);
    // 凍結標題列
    sheet.setFrozenRows(1);
    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, COLS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f0a500');
  }

  return sheet;
}
