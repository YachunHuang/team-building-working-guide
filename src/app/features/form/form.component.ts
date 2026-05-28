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

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
})
export class FormComponent {
  form: FormGroup;
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

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      console.warn('[FormComponent] 表單驗證未通過', this.form.errors, this.form.value);
      return;
    }

    try {
      const raw = this.form.value;
      const toArr = (arr: string[]) => arr.map((s: string) => s.trim()).filter(Boolean);
      const data = {
        name: raw.name,
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

      this.storageService.save(data as ManualData).catch(err => console.error('[儲存失敗]', err));
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
}
