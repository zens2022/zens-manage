import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../core/auth/auth.service';
import { SyncManagerService } from '../../../core/sync/sync-manager.service';
import { LocalStorageService } from '../../../core/storage/local-storage.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatMenuModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  authService = inject(AuthService);
  syncManager = inject(SyncManagerService);
  localService = inject(LocalStorageService);

  getSyncTooltip(): string {
    const status = this.syncManager.syncStatus();
    switch (status) {
      case 'synced': return '資料已成功同步至 Google Drive';
      case 'syncing': return '正在同步資料至 Google Drive...';
      case 'pending': return '有本機變更待上傳，即將自動同步';
      case 'offline': return '目前無網路連線，資料已暫存於本機 LocalStorage';
      case 'error': return this.syncManager.errorMessage() || '同步失敗';
      default: return '';
    }
  }

  exportBackup(): void {
    const data = this.localService.getData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zens_assets_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        this.localService.importData(json);
        this.syncManager.notifyLocalChange();
        alert(`成功匯入 ${json.assets?.length || 0} 筆資產記錄！`);
      } catch (err: any) {
        alert('匯入失敗：' + (err.message || '檔案格式不正確'));
      }
      input.value = '';
    };
    reader.readAsText(file);
  }
}
