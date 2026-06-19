import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ManualData, StorageService } from '../../services/storage.service';
import { Router, RouterModule } from '@angular/router';

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FooterComponent],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
})
export class FormComponent {
  form: FormGroup;
  existingManualLoaded = false;
  existingManualMessage = '';
  /** 控制自訂離開確認 Modal 的顯示狀態 */
  showLeaveConfirm = false;
  private readonly minItemsMap: Record<'about' | 'qualities' | 'fears' | 'likes' | 'pressure' | 'environment', number> = {
    about: 1,
    qualities: 3,
    fears: 3,
    likes: 3,
    pressure: 1,
    environment: 1,
  };

  constructor(private fb: FormBuilder, private router: Router, private storageService: StorageService) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      about: this.fb.array([this.fb.control('', Validators.required)]),
      qualities: this.fb.array([
        this.fb.control('', Validators.required),
      ]),
      fears: this.fb.array([
        this.fb.control('', Validators.required),
      ]),
      likes: this.fb.array([
        this.fb.control('', Validators.required),
      ]),
      pressure: this.fb.array([this.fb.control('', Validators.required)]),
      environment: this.fb.array([this.fb.control('', Validators.required)]),
    });
  }

  get about(): FormArray {
    return this.form.get('about') as FormArray;
  }

  get qualities(): FormArray {
    return this.form.get('qualities') as FormArray;
  }

  get fears(): FormArray {
    return this.form.get('fears') as FormArray;
  }

  get likes(): FormArray {
    return this.form.get('likes') as FormArray;
  }

  get pressure(): FormArray {
    return this.form.get('pressure') as FormArray;
  }

  get environment(): FormArray {
    return this.form.get('environment') as FormArray;
  }

  addItem(arrayName: 'about' | 'qualities' | 'fears' | 'likes' | 'pressure' | 'environment'): void {
    const arr = this.form.get(arrayName) as FormArray;
    arr.push(this.fb.control('', Validators.required));
  }

  removeItem(arrayName: 'about' | 'qualities' | 'fears' | 'likes' | 'pressure' | 'environment', index: number): void {
    const arr = this.form.get(arrayName) as FormArray;
    const min = this.minItemsMap[arrayName];
    if (arr.length > min) {
      arr.removeAt(index);
    }
  }

  async fetchExistingByName(): Promise<void> {
    const nameControl = this.form.get('name');
    const trimmedName = nameControl?.value?.trim() ?? '';

    this.resetExistingManualState();

    if (!trimmedName) {
      nameControl?.setValue('', { emitEvent: false });
      return;
    }

    nameControl?.setValue(trimmedName, { emitEvent: false });

    try {
      const existing = await this.storageService.getByName(trimmedName);
      if (!existing) return;

      this.patchForm(existing);
      this.existingManualLoaded = true;
      this.existingManualMessage = '已載入同名資料，這次送出會直接更新原內容。';
    } catch (err) {
      console.error('[FormComponent] 讀取同名資料失敗', err);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      console.warn('[FormComponent] 表單驗證未通過', this.form.errors, this.form.value);
      return;
    }

    try {
      const raw = this.form.value;
      const toArr = (arr: string[]) => arr.map((s: string) => s.trim()).filter(Boolean);
      const data = {
        name: raw.name.trim(),
        about: toArr(raw.about),
        qualities: toArr(raw.qualities),
        fears: toArr(raw.fears),
        likes: toArr(raw.likes),
        pressure: toArr(raw.pressure),
        environment: toArr(raw.environment),
      };
      console.log('[FormComponent] 送出資料', data);
      const json = JSON.stringify(data);
      const bytes = new TextEncoder().encode(json);
      const binStr = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
      const encoded = btoa(binStr);

      await this.storageService.save(data as ManualData);
      this.router.navigate(['/card'], { queryParams: { d: encoded } });
    } catch (err) {
      console.error('[FormComponent] 送出時發生錯誤', err);
    }
  }

  minItems(arrayName: 'about' | 'qualities' | 'fears' | 'likes' | 'pressure' | 'environment'): number {
    return this.minItemsMap[arrayName];
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  isArrayItemInvalid(arrayName: string, index: number): boolean {
    const arr = this.form.get(arrayName) as FormArray;
    const control = arr.at(index);
    return !!(control && control.invalid && control.touched);
  }

  private patchForm(data: ManualData): void {
    this.form.patchValue({ name: data.name }, { emitEvent: false });
    this.replaceArray('about', data.about);
    this.replaceArray('qualities', data.qualities);
    this.replaceArray('fears', data.fears);
    this.replaceArray('likes', data.likes);
    this.replaceArray('pressure', data.pressure);
    this.replaceArray('environment', data.environment);
  }

  private replaceArray(
    arrayName: 'about' | 'qualities' | 'fears' | 'likes' | 'pressure' | 'environment',
    items: string[]
  ): void {
    const arr = this.form.get(arrayName) as FormArray;
    arr.clear();
    const nextItems = items.length > 0 ? items : [''];
    nextItems.forEach((item) => arr.push(this.fb.control(item, Validators.required)));
  }

  /**
   * 判斷表單是否有任何欄位已填寫內容（非空白）。
   * 用於導航離開前的提示判斷。
   */
  private hasFormContent(): boolean {
    const raw = this.form.getRawValue();
    // 檢查 name 欄位
    if (raw.name?.trim()) return true;
    // 檢查所有 FormArray 欄位是否有任一項目有值
    const arrayFields: (keyof typeof raw)[] = ['about', 'qualities', 'fears', 'likes', 'pressure', 'environment'];
    for (const field of arrayFields) {
      const arr = raw[field] as string[];
      if (Array.isArray(arr) && arr.some((v: string) => v?.trim())) return true;
    }
    return false;
  }

  /**
   * 導航回大廳前，若表單已有填寫內容則開啟自訂確認 Modal。
   * 避免使用者意外遺失未送出的資料。
   */
  navigateToLobby(): void {
    if (this.hasFormContent()) {
      // 有填寫內容時顯示自訂風格確認 Modal
      this.showLeaveConfirm = true;
    } else {
      this.router.navigate(['/']);
    }
  }

  /**
   * 使用者於確認 Modal 點擊「繼續填寫」：關閉 Modal 並留在頁面。
   */
  onLeaveCancel(): void {
    this.showLeaveConfirm = false;
  }

  /**
   * 使用者於確認 Modal 點擊「確定離開」：關閉 Modal 並導航至大廳。
   */
  onLeaveConfirm(): void {
    this.showLeaveConfirm = false;
    this.router.navigate(['/']);
  }

  private resetExistingManualState(): void {
    this.existingManualLoaded = false;
    this.existingManualMessage = '';
  }
}
