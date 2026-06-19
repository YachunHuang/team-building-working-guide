import { ActivatedRoute, RouterModule } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { ManualData, StorageService } from '../../services/storage.service';

import { CommonModule } from '@angular/common';
import { FooterComponent } from '../../shared/footer/footer.component';
import { ManualCardComponent } from '../../shared/manual-card/manual-card.component';

export type { ManualData };

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, RouterModule, ManualCardComponent, FooterComponent],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent implements OnInit {
  data: ManualData | null = null;
  errorMsg = '';

  constructor(
    private route: ActivatedRoute,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    const encoded = this.route.snapshot.queryParamMap.get('d');
    if (!encoded) {
      this.errorMsg = '找不到使用說明書資料，請重新填寫表單。';
      return;
    }
    try {
      const binStr = atob(encoded);
      const bytes = Uint8Array.from(binStr, (c) => c.charCodeAt(0));
      const json = new TextDecoder().decode(bytes);
      this.data = JSON.parse(json) as ManualData;
      this.storageService.save(this.data).catch((err) =>
        console.error('[CardComponent] 儲存失敗', err)
      );
    } catch {
      this.errorMsg = '資料解析失敗，請重新填寫表單。';
    }
  }
}
