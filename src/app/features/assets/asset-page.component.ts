import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LocalStorageService } from '../../core/storage/local-storage.service';
import { SyncManagerService } from '../../core/sync/sync-manager.service';
import { AssetRecord } from '../../models/asset.model';
import { AssetChartComponent } from './components/asset-chart/asset-chart.component';
import { AssetDialogComponent } from './components/asset-dialog/asset-dialog.component';

@Component({
  selector: 'app-asset-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatPaginatorModule,
    MatSnackBarModule,
    AssetChartComponent
  ],
  templateUrl: './asset-page.component.html',
  styleUrl: './asset-page.component.scss'
})
export class AssetPageComponent implements OnInit {
  private localService = inject(LocalStorageService);
  private syncManager = inject(SyncManagerService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  allAssets = signal<AssetRecord[]>([]);
  pagedAssets = signal<AssetRecord[]>([]);

  displayedColumns = ['expand', 'date', 'total', 'actions'];
  expandedAssetIds = new Set<string>();
  highlightedId: string | null = null;

  pageIndex = 0;
  pageSize = 10;

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
    this.updatePagedAssets();
  }

  updatePagedAssets(): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.pagedAssets.set(this.allAssets().slice(start, end));
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagedAssets();
  }

  isExpanded(row: AssetRecord): boolean {
    return this.expandedAssetIds.has(row.id);
  }

  toggleExpand(row: AssetRecord): void {
    if (this.expandedAssetIds.has(row.id)) {
      this.expandedAssetIds.delete(row.id);
    } else {
      this.expandedAssetIds.add(row.id);
    }
  }

  /**
   * 當使用者點擊 Trend 折線圖的資料點時
   */
  onChartPointClick(record: AssetRecord): void {
    const list = this.allAssets();
    const index = list.findIndex(a => a.id === record.id);
    if (index === -1) return;

    // 計算該筆記錄在哪一頁
    const targetPage = Math.floor(index / this.pageSize);
    if (this.pageIndex !== targetPage) {
      this.pageIndex = targetPage;
      this.updatePagedAssets();
    }

    // 自動展開該列
    this.expandedAssetIds.add(record.id);

    // 平滑滾動至該列並給予高亮動畫
    setTimeout(() => {
      const el = document.getElementById('asset-row-' + record.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.highlightedId = record.id;
        setTimeout(() => {
          this.highlightedId = null;
        }, 2500);
      }
    }, 120);

    this.snackBar.open(`已為您跳轉並展開 ${record.date} 之記錄明細`, '好', { duration: 2500 });
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
