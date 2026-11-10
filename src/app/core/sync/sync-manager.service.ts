import { Injectable, signal, effect, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
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
   * 啟動初始化同步：比對雲端與本機時間戳
   */
  async initializeCloudSync(): Promise<void> {
    const token = this.authService.accessToken();
    if (!token || !this.networkService.isOnline()) return;

    try {
      this.syncStatus.set('syncing');
      this.errorMessage.set(null);

      const file = await this.driveService.findFile(token, environment.driveFileName);
      const localData = this.localService.getData();

      if (file) {
        this.driveFileId = file.id;
        const remoteData = await this.driveService.downloadFile(token, file.id);

        const localTime = new Date(localData.lastModified || 0).getTime();
        const remoteTime = new Date(remoteData.lastModified || 0).getTime();

        if (remoteTime > localTime) {
          // 雲端較新，拉取並更新本機
          console.log('[Sync] Cloud data is newer, updating local storage');
          this.localService.saveData(remoteData, false);
        } else if (localTime > remoteTime && localData.assets.length > 0) {
          // 本機較新，上傳覆寫雲端
          console.log('[Sync] Local data is newer, updating Google Drive');
          await this.driveService.updateFile(token, file.id, localData);
        }
      } else {
        // 雲端無檔案，若本地有資料則建立初始檔案
        if (localData.assets && localData.assets.length > 0) {
          console.log('[Sync] Creating initial file on Google Drive');
          const created = await this.driveService.createFile(token, environment.driveFileName, localData);
          this.driveFileId = created.id;
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
   * 執行背景上傳覆寫 Drive
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

      if (!this.driveFileId) {
        const file = await this.driveService.findFile(token, environment.driveFileName);
        if (file) {
          this.driveFileId = file.id;
        }
      }

      if (this.driveFileId) {
        await this.driveService.updateFile(token, this.driveFileId, localData);
      } else {
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
   * 使用者點擊強制同步
   */
  async forceSync(): Promise<void> {
    if (!this.authService.isLoggedIn()) {
      await this.authService.login();
      return;
    }
    await this.performCloudUpload();
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
