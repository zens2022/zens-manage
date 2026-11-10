import { Component, OnInit, inject, signal } from '@angular/core';
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
  template: `
    <div class="page-container">
      <!-- 頂部操作與統計列 -->
      <div class="action-bar">
        <div>
          <h1 class="page-title">資產清單 (Assets)</h1>
          <p class="page-subtitle">共 {{ allAssets().length }} 筆歷史記錄</p>
        </div>
        <div class="action-buttons">
          <button mat-flat-button color="primary" (click)="openCreateDialog()" class="new-asset-btn">
            <mat-icon>add</mat-icon>
            新增資產記錄
          </button>
        </div>
      </div>

      <!-- 空資料引導卡片 -->
      @if (allAssets().length === 0) {
        <mat-card class="empty-card">
          <mat-card-content class="empty-content">
            <mat-icon class="empty-icon">account_balance</mat-icon>
            <h2>目前尚無資產記錄</h2>
            <p>您可以點擊「新增資產記錄」開始建立，或者由右上角選單匯入過往 JSON 備份檔。</p>
            <div class="empty-actions">
              <button mat-flat-button color="primary" (click)="openCreateDialog()">
                <mat-icon>add</mat-icon>
                開始第一筆記錄
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      } @else {
        <!-- 資產趨勢圖表 -->
        <app-asset-chart [data]="allAssets()"></app-asset-chart>

        <!-- 資產表格卡片 -->
        <mat-card class="table-card">
          <div class="table-responsive">
            <table mat-table [dataSource]="pagedAssets()" multiTemplateDataRows class="asset-table">
              
              <!-- 展開箭頭欄位 -->
              <ng-container matColumnDef="expand">
                <th mat-header-cell *matHeaderCellDef style="width: 48px;"></th>
                <td mat-cell *matCellDef="let element">
                  <button mat-icon-button (click)="toggleExpand(element); $event.stopPropagation()">
                    <mat-icon>{{ isExpanded(element) ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</mat-icon>
                  </button>
                </td>
              </ng-container>

              <!-- 日期欄位 -->
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>記錄日期</th>
                <td mat-cell *matCellDef="let element" class="font-medium">
                  {{ element.date }}
                </td>
              </ng-container>

              <!-- 總額欄位 -->
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>總資產</th>
                <td mat-cell *matCellDef="let element" class="total-cell font-bold">
                  NT$ {{ element.total.toLocaleString() }}
                </td>
              </ng-container>

              <!-- 操作欄位 -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef style="width: 120px; text-align: right;">操作</th>
                <td mat-cell *matCellDef="let element" style="text-align: right;">
                  <button mat-icon-button color="primary" (click)="openEditDialog(element)" title="編輯">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="confirmDelete(element)" title="刪除">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <!-- 展開明細列 -->
              <ng-container matColumnDef="expandedDetail">
                <td mat-cell *matCellDef="let element" [attr.colspan]="displayedColumns.length">
                  <div class="detail-wrapper" [class.collapsed]="!isExpanded(element)">
                    <div class="detail-box">
                      <h4 class="detail-title">資產明細清單</h4>
                      <table class="detail-table">
                        <thead>
                          <tr>
                            <th>項目名稱</th>
                            <th style="text-align: right;">金額</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (item of element.items; track item.id) {
                            <tr>
                              <td>{{ item.name }}</td>
                              <td style="text-align: right;">NT$ {{ item.value.toLocaleString() }}</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let element; columns: displayedColumns;"
                  class="element-row cursor-pointer"
                  (click)="toggleExpand(element)">
              </tr>
              <tr mat-row *matRowDef="let row; columns: ['expandedDetail']" class="detail-row"></tr>
            </table>
          </div>

          <mat-paginator
            [length]="allAssets().length"
            [pageSize]="pageSize"
            [pageSizeOptions]="[5, 10, 25, 50]"
            (page)="onPageChange($event)">
          </mat-paginator>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1140px;
      margin: 0 auto;
      padding: 24px 16px 48px;
    }
    .action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .page-title {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      color: #1a237e;
    }
    .page-subtitle {
      margin: 4px 0 0;
      color: #666;
      font-size: 14px;
    }
    .new-asset-btn {
      padding: 0 20px;
      height: 44px;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
    .empty-card {
      padding: 48px 16px;
      text-align: center;
      border-radius: 8px;
    }
    .empty-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #9fa8da;
    }
    .table-card {
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }
    .asset-table {
      width: 100%;
    }
    .element-row:hover {
      background-color: #f8f9fa;
    }
    .font-medium {
      font-weight: 500;
    }
    .font-bold {
      font-weight: 600;
    }
    .total-cell {
      color: #2e7d32;
      font-size: 15px;
    }
    .detail-row {
      height: 0;
    }
    .detail-wrapper {
      overflow: hidden;
      transition: max-height 0.3s ease-out;
      max-height: 500px;
    }
    .detail-wrapper.collapsed {
      max-height: 0;
    }
    .detail-box {
      margin: 12px 16px 16px 48px;
      padding: 16px;
      background: #fafafa;
      border-radius: 6px;
      border: 1px solid #eeeeee;
    }
    .detail-title {
      margin: 0 0 10px;
      font-size: 14px;
      font-weight: 600;
      color: #555;
    }
    .detail-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13.5px;
    }
    .detail-table th {
      padding: 6px 12px;
      color: #777;
      border-bottom: 1px solid #ddd;
    }
    .detail-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #eee;
    }
  `]
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

  pageIndex = 0;
  pageSize = 10;

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

  openCreateDialog(): void {
    const lastItems = this.localService.getLastItems();
    const dialogRef = this.dialog.open(AssetDialogComponent, {
      width: '640px',
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
      width: '640px',
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
