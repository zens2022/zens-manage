import { Component, OnInit, inject, signal, effect, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/auth.service';
import { LocalStorageService } from '../../core/storage/local-storage.service';
import { SyncManagerService } from '../../core/sync/sync-manager.service';
import { AssetRecord } from '../../models/asset.model';
import { AuthLockComponent } from './components/auth-lock/auth-lock.component';
import { AssetChartComponent } from './components/asset-chart/asset-chart.component';
import { AssetTableComponent } from './components/asset-table/asset-table.component';
import { AssetDialogComponent } from './components/asset-dialog/asset-dialog.component';

@Component({
  selector: 'app-asset-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    AuthLockComponent,
    AssetChartComponent,
    AssetTableComponent
  ],
  templateUrl: './asset-page.component.html',
  styleUrl: './asset-page.component.scss'
})
export class AssetPageComponent implements OnInit {
  public authService = inject(AuthService);
  private localService = inject(LocalStorageService);
  private syncManager = inject(SyncManagerService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild('assetTable') assetTable?: AssetTableComponent;

  allAssets = signal<AssetRecord[]>([]);

  constructor() {
    effect(() => {
      // 監聽 LocalStorageService appData 變更（如 Google Drive 同步下載完成），自動即時刷新畫面
      this.localService.appData();
      this.refreshAssets();
    });
  }

  ngOnInit(): void {
    this.refreshAssets();
  }

  refreshAssets(): void {
    const list = this.localService.getAssets();
    this.allAssets.set(list);
  }

  /**
   * 當使用者點擊 Trend 折線圖的資料點時，委託 AssetTable 元件執行跳轉與高亮
   */
  onChartPointClick(record: AssetRecord): void {
    this.assetTable?.highlightRecord(record);
  }

  openCreateDialog(): void {
    const lastItems = this.localService.getLastItems();
    const dialogRef = this.dialog.open(AssetDialogComponent, {
      width: '740px',
      maxWidth: '95vw',
      data: { lastItems }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.localService.saveAsset(result);
        this.syncManager.notifyLocalChange();
        this.refreshAssets();
        this.snackBar.open('資產記錄已儲存！', '關閉', { duration: 3000 });
      }
    });
  }

  openEditDialog(record: AssetRecord): void {
    const dialogRef = this.dialog.open(AssetDialogComponent, {
      width: '740px',
      maxWidth: '95vw',
      data: { editRecord: record }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.localService.saveAsset({ ...result, id: record.id });
        this.syncManager.notifyLocalChange();
        this.refreshAssets();
        this.snackBar.open('資產記錄已更新！', '關閉', { duration: 3000 });
      }
    });
  }

  confirmDelete(record: AssetRecord): void {
    if (confirm(`確定要刪除 ${record.date} 的資產記錄嗎？（此動作無法復原）`)) {
      this.localService.deleteAsset(record.id);
      this.syncManager.notifyLocalChange();
      this.refreshAssets();
      this.snackBar.open('記錄已刪除', '關閉', { duration: 3000 });
    }
  }
}
