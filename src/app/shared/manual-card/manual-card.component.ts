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
      const filename = `${this.data?.name ?? '我'}_工作使用說明書.png`;

      if (this.isIOSDevice()) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (blob && await this.tryNativeShare(blob, filename)) {
          return;
        }
        if (blob) {
          this.openImageForLongPress(blob);
          return;
        }
      }

      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      this.isDownloading = false;
    }
  }

  private isIOSDevice(): boolean {
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return isIOS || isIPadOS;
  }

  private async tryNativeShare(blob: Blob, filename: string): Promise<boolean> {
    const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
    if (!nav.share) return false;

    const file = new File([blob], filename, { type: 'image/png' });
    const shareData: ShareData = { files: [file], title: filename };

    if (nav.canShare && !nav.canShare(shareData)) return false;

    try {
      await nav.share(shareData);
      return true;
    } catch {
      return false;
    }
  }

  private openImageForLongPress(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
}
