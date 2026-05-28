import { Component, ElementRef, Input, ViewChild } from '@angular/core';

import { CommonModule } from '@angular/common';
import { ManualData } from '../../services/storage.service';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-manual-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manual-card.component.html',
  styleUrl: './manual-card.component.scss',
})
export class ManualCardComponent {
  @Input() data!: ManualData;
  @ViewChild('cardBody', { read: ElementRef }) cardBody!: ElementRef<HTMLElement>;

  isDownloading = false;

  async downloadCard(): Promise<void> {
    if (!this.cardBody || this.isDownloading) return;
    this.isDownloading = true;
    try {
      const canvas = await html2canvas(this.cardBody.nativeElement, {
        scale: 2, useCORS: true, backgroundColor: null, logging: false,
      });
      const link = document.createElement('a');
      link.download = `${this.data?.name ?? '我'}_工作使用說明書.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      this.isDownloading = false;
    }
  }
}
