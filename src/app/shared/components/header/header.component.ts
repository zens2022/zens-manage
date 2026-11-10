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
  template: `
    <mat-toolbar color="primary" class="header-toolbar">
      <div class="logo-area">
        <mat-icon class="logo-icon">account_balance_wallet</mat-icon>
        <span class="app-title">Zens Manage</span>
      </div>

      <div class="spacer"></div>

      <!-- 同步狀態指示區 -->
      <div class="sync-status-box" [matTooltip]="getSyncTooltip()">
        @switch (syncManager.syncStatus()) {
          @case ('syncing') {
            <mat-spinner diameter="18" class="inline-spinner"></mat-spinner>
            <span class="status-text">同步中...</span>
          }
          @case ('pending') {
            <mat-icon class="status-icon pending">cloud_queue</mat-icon>
            <span class="status-text">待同步</span>
          }
          @case ('synced') {
            <mat-icon class="status-icon synced">cloud_done</mat-icon>
            <span class="status-text">已上雲</span>
          }
          @case ('offline') {
            <mat-icon class="status-icon offline">cloud_off</mat-icon>
            <span class="status-text">離線模式</span>
          }
          @case ('error') {
            <mat-icon class="status-icon error">sync_problem</mat-icon>
            <span class="status-text">同步異常</span>
          }
        }
      </div>

      <!-- 立即強制同步按鈕 -->
      <button mat-icon-button (click)="syncManager.forceSync()" matTooltip="立即同步至 Google Drive">
        <mat-icon>sync</mat-icon>
      </button>

      <!-- 備份與資料選單 -->
      <button mat-icon-button [matMenuTriggerFor]="dataMenu" matTooltip="資料備份與匯入">
        <mat-icon>settings_backup_restore</mat-icon>
      </button>
      <mat-menu #dataMenu="matMenu">
        <button mat-menu-item (click)="fileInput.click()">
          <mat-icon>upload_file</mat-icon>
          <span>匯入 JSON 備份檔</span>
        </button>
        <button mat-menu-item (click)="exportBackup()">
          <mat-icon>download</mat-icon>
          <span>匯出本機資料 (JSON)</span>
        </button>
      </mat-menu>
      <input type="file" #fileInput (change)="onFileSelected($event)" accept=".json" style="display: none;">

      <!-- Google 使用者帳號區 -->
      @if (authService.isLoggedIn() && authService.currentUser(); as user) {
        <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
          <div class="user-btn-content">
            @if (user.picture) {
              <img [src]="user.picture" alt="Avatar" class="user-avatar">
            } @else {
              <mat-icon class="user-icon">account_circle</mat-icon>
            }
            <span class="user-name">{{ user.name }}</span>
          </div>
        </button>
        <mat-menu #userMenu="matMenu">
          <button mat-menu-item disabled>
            <mat-icon>email</mat-icon>
            <span>{{ user.email }}</span>
          </button>
          <button mat-menu-item (click)="authService.logout()">
            <mat-icon>logout</mat-icon>
            <span>登出 Google 帳號</span>
          </button>
        </mat-menu>
      } @else {
        <button mat-flat-button color="accent" (click)="authService.login()" class="login-btn">
          <mat-icon>login</mat-icon>
          <span>Google 登入</span>
        </button>
      }
    </mat-toolbar>
  `,
  styles: [`
    .header-toolbar {
      display: flex;
      align-items: center;
      padding: 0 16px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .logo-area {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .logo-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .sync-status-box {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-right: 8px;
      padding: 4px 10px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      font-size: 13px;
    }
    .status-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .status-icon.synced { color: #69f0ae; }
    .status-icon.pending { color: #ffe57f; }
    .status-icon.offline { color: #e0e0e0; }
    .status-icon.error { color: #ff80ab; }
    .inline-spinner {
      display: inline-block;
    }
    .user-btn {
      margin-left: 8px;
      height: 40px;
      padding: 0 12px !important;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.15);
      transition: background-color 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }

      ::ng-deep .mdc-button__label {
        display: flex !important;
        align-items: center !important;
        height: 100%;
      }
    }
    .user-btn-content {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 100%;
    }
    .user-avatar {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      object-fit: cover;
      display: block;
      border: 1px solid rgba(255, 255, 255, 0.6);
    }
    .user-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
      line-height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-name {
      font-size: 14px;
      font-weight: 500;
      max-width: 130px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 1;
      display: inline-block;
    }
    .login-btn {
      margin-left: 8px;
      font-weight: 500;
    }
  `]
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
