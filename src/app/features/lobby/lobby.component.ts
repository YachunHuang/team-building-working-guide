import { Component, OnInit } from '@angular/core';
import { ManualData, StorageService } from '../../services/storage.service';

import { CommonModule } from '@angular/common';
import { ManualCardComponent } from '../../shared/manual-card/manual-card.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, RouterModule, ManualCardComponent],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss',
})
export class LobbyComponent implements OnInit {
  manuals: ManualData[] = [];
  loading = false;
  errorMsg = '';

  constructor(private storageService: StorageService) {}

  ngOnInit(): void {
    this.loadManuals();
  }

  /** 手動重新整理 */
  loadManuals(): void {
    this.loading = true;
    this.errorMsg = '';
    this.storageService.getAll()
      .then((manuals) => {
        this.manuals = manuals;
        this.loading = false;
      })
      .catch((err) => {
        console.error('[LobbyComponent] 載入失敗', err);
        this.errorMsg = '載入失敗，請按重新整理再試一次。';
        this.loading = false;
      });
  }
}
