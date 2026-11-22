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
    // Listen for debounced auto-upload
    this.syncTrigger$.pipe(
      debounceTime(environment.syncDebounceMs || 3500)
    ).subscribe(() => {
      this.performCloudUpload();
    });

    // Listen for network status recovery
    effect(() => {
      const isOnline = this.networkService.isOnline();
      if (isOnline && this.pendingChanges) {
        this.syncTrigger$.next();
      } else if (!isOnline && this.pendingChanges) {
        this.syncStatus.set('offline');
      }
    });

    // Listen for auth state changes
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
   * Called when local data changes to schedule a sync
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
   * Initial cloud sync on startup
   */
  async initializeCloudSync(): Promise<void> {
    await this.syncWithCloud(false);
  }

  /**
   * Smart bidirectional sync: protects cloud data from being wiped by empty local state
   */
  async syncWithCloud(isManual: boolean = false): Promise<void> {
    const token = this.authService.accessToken();
    if (!token) return;

    if (!this.networkService.isOnline()) {
      this.syncStatus.set('offline');
      if (isManual) {
        this.snackBar.open('Currently offline. Cannot sync.', 'OK', { duration: 3000 });
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

        // Rule 1: Local is empty but cloud has data -> Download from cloud (prevent wipe)
        if (localCount === 0 && remoteCount > 0) {
          console.log(`[Sync] Local is empty, downloading ${remoteCount} records from cloud`);
          this.localService.saveData(remoteData, false);
          this.snackBar.open(`Downloaded ${remoteCount} asset records from Google Drive`, 'OK', { duration: 3500 });
        }
        // Rule 2: Local has data but cloud is empty -> Push local to cloud
        else if (localCount > 0 && remoteCount === 0) {
          console.log('[Sync] Cloud is empty, backing up local data to cloud');
          await this.driveService.updateFile(token, file.id, localData);
          if (isManual) {
            this.snackBar.open(`Backed up ${localCount} records to Google Drive`, 'OK', { duration: 3000 });
          }
        }
        // Rule 3: Both have data -> Compare last modified timestamp
        else if (localCount > 0 && remoteCount > 0) {
          if (remoteTime > localTime) {
            console.log('[Sync] Cloud data is newer, updating local');
            this.localService.saveData(remoteData, false);
            this.snackBar.open(`Updated latest asset records from cloud (${remoteCount} records)`, 'OK', { duration: 3500 });
          } else if (localTime > remoteTime) {
            console.log('[Sync] Local data is newer, updating cloud');
            await this.driveService.updateFile(token, file.id, localData);
            if (isManual) {
              this.snackBar.open(`Synchronized ${localCount} records to Google Drive`, 'OK', { duration: 3000 });
            }
          } else {
            console.log('[Sync] Local and cloud data are identical');
            if (isManual) {
              this.snackBar.open('Local and Google Drive data are already up to date', 'OK', { duration: 2500 });
            }
          }
        } else {
          // Both are empty
          if (isManual) {
            this.snackBar.open('No asset data currently found on local or cloud', 'OK', { duration: 2500 });
          }
        }
      } else {
        // No remote file yet
        if (localCount > 0) {
          console.log('[Sync] Creating initial backup file on Google Drive');
          const created = await this.driveService.createFile(token, environment.driveFileName, localData);
          this.driveFileId = created.id;
          if (isManual) {
            this.snackBar.open(`Created backup on Google Drive (${localCount} records)`, 'OK', { duration: 3000 });
          }
        } else {
          if (isManual) {
            this.snackBar.open('No asset data available to sync', 'OK', { duration: 2500 });
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
   * Background upload to Drive (includes anti-wipe guard)
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
        // Safety guard: if local has 0 records, do not blind-overwrite non-empty remote file
        if (localCount === 0) {
          const remoteData = await this.driveService.downloadFile(token, this.driveFileId);
          if (remoteData.assets && remoteData.assets.length > 0) {
            console.warn('[Sync Security] Refusing to overwrite cloud data with empty local data, downloading cloud data');
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
   * Manual force sync triggered by user
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
      this.errorMessage.set('Google authorization has expired. Please log in again.');
      this.authService.logout();
    } else {
      this.errorMessage.set('Cloud sync failed. Please check your network connection or try again later.');
    }
    this.syncStatus.set('error');
  }
}
