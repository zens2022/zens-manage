import { Injectable, signal, effect, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { SyncStatus, ZensAppData } from '../../models/asset.model';
import { AuthService } from '../auth/auth.service';
import { NetworkStatusService } from '../network/network-status.service';
import { DriveStorageService } from '../storage/drive-storage.service';
import { LocalStorageService } from '../storage/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class SyncManagerService {
  private authService = inject(AuthService);
  private localService = inject(LocalStorageService);
  private driveService = inject(DriveStorageService);
  private networkService = inject(NetworkStatusService);
  private snackBar = inject(MatSnackBar);

  readonly syncStatus = signal<SyncStatus>('synced');
  readonly lastSyncTime = signal<Date | null>(null);
  readonly errorMessage = signal<string | null>(null);

  private driveFileId: string | null = null;
  private pendingChanges = false;
  private syncTrigger$ = new Subject<void>();

  constructor() {
    // 監聽防抖自動上傳
    this.syncTrigger$.pipe(
      debounceTime(environment.syncDebounceMs || 3500)
    ).subscribe(() => {
      this.performCloudUpload();
    });

    // 監聽網路連線恢復
    effect(() => {
      const isOnline = this.networkService.isOnline();
      if (isOnline && this.pendingChanges) {
        this.syncTrigger$.next();
      } else if (!isOnline && this.pendingChanges) {
        this.syncStatus.set('offline');
      }
    });

    // 監聽登入狀態改變
    effect(() => {
      const isLoggedIn = this.authService.isLoggedIn();
      if (isLoggedIn) {
        this.initializeCloudSync();
      } else {
        this.driveFileId = null;
        this.syncStatus.set('synced');
      }
    });
  }

  /**
   * 當本地資料發生變更時，由外部呼叫此方法排程同步
   */
  notifyLocalChange(): void {
    this.pendingChanges = true;
    if (!this.networkService.isOnline()) {
      this.syncStatus.set('offline');
      return;
    }
    this.syncStatus.set('pending');
    this.syncTrigger$.next();
  }

  /**
   * 啟動初始化同步：比對雲端與本機時間戳與筆數
   */
  async initializeCloudSync(): Promise<void> {
    await this.syncWithCloud(false);
  }

  /**
   * 智慧雙向同步：保護雲端資料不被空白本機洗掉
   */
  async syncWithCloud(isManual: boolean = false): Promise<void> {
    const token = this.authService.accessToken();
    if (!token) return;

    if (!this.networkService.isOnline()) {
      this.syncStatus.set('offline');
      if (isManual) {
        this.snackBar.open('目前處於離線狀態，無法同步', '確定', { duration: 3000 });
      }
      return;
    }

    try {
      this.syncStatus.set('syncing');
      this.errorMessage.set(null);

      const file = await this.driveService.findFile(token, environment.driveFileName);
      const localData = this.localService.getData();
      const localCount = localData.assets?.length || 0;

      if (file) {
        this.driveFileId = file.id;
        const remoteData = await this.driveService.downloadFile(token, file.id);
        const remoteCount = remoteData.assets?.length || 0;

        const localTime = localData.lastModified ? new Date(localData.lastModified).getTime() : 0;
        const remoteTime = remoteData.lastModified ? new Date(remoteData.lastModified).getTime() : 0;

        // 規則 1：本機為空但雲端有資料 -> 絕對優先從雲端下載（防護洗白）
        if (localCount === 0 && remoteCount > 0) {
          console.log(`[Sync] 本機為空，從雲端下載 ${remoteCount} 筆資料`);
          this.localService.saveData(remoteData, false);
          this.snackBar.open(`已從 Google Drive 同步下載 ${remoteCount} 筆資產記錄`, '確定', { duration: 3500 });
        }
        // 規則 2：本機有資料但雲端為空 -> 本機推至雲端
        else if (localCount > 0 && remoteCount === 0) {
          console.log('[Sync] 雲端為空，將本機資料備份至雲端');
          await this.driveService.updateFile(token, file.id, localData);
          if (isManual) {
            this.snackBar.open(`已備份 ${localCount} 筆記錄至 Google Drive`, '確定', { duration: 3000 });
          }
        }
        // 規則 3：兩邊都有資料 -> 依據最後修改時間比較
        else if (localCount > 0 && remoteCount > 0) {
          if (remoteTime > localTime) {
            console.log('[Sync] 雲端資料較新，更新本機');
            this.localService.saveData(remoteData, false);
            this.snackBar.open(`已從雲端更新最新資產記錄 (${remoteCount} 筆)`, '確定', { duration: 3500 });
          } else if (localTime > remoteTime) {
            console.log('[Sync] 本機資料較新，更新雲端');
            await this.driveService.updateFile(token, file.id, localData);
            if (isManual) {
              this.snackBar.open(`已同步更新 ${localCount} 筆記錄至 Google Drive`, '確定', { duration: 3000 });
            }
          } else {
            console.log('[Sync] 本機與雲端資料一致');
            if (isManual) {
              this.snackBar.open('本機與 Google Drive 資料已是一致最新狀態', '確定', { duration: 2500 });
            }
          }
        } else {
          // 兩邊皆為空
          if (isManual) {
            this.snackBar.open('本機與雲端目前皆無資產資料', '確定', { duration: 2500 });
          }
        }
      } else {
        // 雲端尚無檔案
        if (localCount > 0) {
          console.log('[Sync] 在 Google Drive 建立初始備份檔案');
          const created = await this.driveService.createFile(token, environment.driveFileName, localData);
          this.driveFileId = created.id;
          if (isManual) {
            this.snackBar.open(`已在 Google Drive 建立備份 (${localCount} 筆記錄)`, '確定', { duration: 3000 });
          }
        } else {
          if (isManual) {
            this.snackBar.open('目前尚無資產資料可同步', '確定', { duration: 2500 });
          }
        }
      }

      this.pendingChanges = false;
      this.syncStatus.set('synced');
      this.lastSyncTime.set(new Date());
    } catch (err: any) {
      this.handleSyncError(err);
    }
  }

  /**
   * 執行背景上傳覆寫 Drive (包含防空白洗白防護)
   */
  private async performCloudUpload(): Promise<void> {
    const token = this.authService.accessToken();
    if (!token) return;

    if (!this.networkService.isOnline()) {
      this.syncStatus.set('offline');
      return;
    }

    try {
      this.syncStatus.set('syncing');
      this.errorMessage.set(null);

      const localData = this.localService.getData();
      const localCount = localData.assets?.length || 0;

      if (!this.driveFileId) {
        const file = await this.driveService.findFile(token, environment.driveFileName);
        if (file) {
          this.driveFileId = file.id;
        }
      }

      if (this.driveFileId) {
        // 安全防線：如果本地是 0 筆，禁止直接盲目覆寫已有資料的雲端檔案
        if (localCount === 0) {
          const remoteData = await this.driveService.downloadFile(token, this.driveFileId);
          if (remoteData.assets && remoteData.assets.length > 0) {
            console.warn('[Sync Security] 拒絕用空本機資料洗掉雲端備份，自動下載雲端資料');
            this.localService.saveData(remoteData, false);
            this.pendingChanges = false;
            this.syncStatus.set('synced');
            this.lastSyncTime.set(new Date());
            return;
          }
        }
        await this.driveService.updateFile(token, this.driveFileId, localData);
      } else if (localCount > 0) {
        const created = await this.driveService.createFile(token, environment.driveFileName, localData);
        this.driveFileId = created.id;
      }

      this.pendingChanges = false;
      this.syncStatus.set('synced');
      this.lastSyncTime.set(new Date());
    } catch (err: any) {
      this.handleSyncError(err);
    }
  }

  /**
   * 使用者點擊強制同步按鈕：執行完整雙向智能同步
   */
  async forceSync(): Promise<void> {
    if (!this.authService.isLoggedIn()) {
      await this.authService.login();
      return;
    }
    await this.syncWithCloud(true);
  }

  private handleSyncError(err: any): void {
    console.error('[Sync Error]', err);
    if (err?.message === 'UNAUTHORIZED') {
      this.errorMessage.set('Google 授權已過期，請重新登入');
      this.authService.logout();
    } else {
      this.errorMessage.set('雲端同步失敗，請檢查網路連線或稍後再試');
    }
    this.syncStatus.set('error');
  }
}
