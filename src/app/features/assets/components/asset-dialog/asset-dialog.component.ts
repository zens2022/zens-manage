import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AssetItem, AssetRecord } from '../../../../models/asset.model';

export interface AssetDialogData {
  editRecord?: AssetRecord;
  lastItems?: AssetItem[];
}

@Component({
  selector: 'app-asset-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="dialog-wrapper">
      <!-- 頂部標題與快速工具列 -->
      <div class="dialog-header">
        <div class="header-left">
          <mat-icon class="header-icon">{{ isEdit ? 'edit_note' : 'post_add' }}</mat-icon>
          <h2 class="dialog-title">{{ isEdit ? '編輯資產記錄' : '新增資產記錄' }}</h2>
        </div>

        <div class="header-actions">
          @if (!isEdit && data.lastItems && data.lastItems.length > 0) {
            <button mat-stroked-button color="primary" type="button" (click)="loadLastItems()" class="quick-btn">
              <mat-icon>history</mat-icon>
              帶入上次項目 ({{ data.lastItems.length }}項)
            </button>
          }
          <button mat-icon-button mat-dialog-close class="close-btn" title="關閉">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <!-- 控制列：記錄日期與總計徽章 -->
      <div class="control-bar">
        <div class="date-control">
          <label for="record-date" class="control-label">記錄日期</label>
          <input
            id="record-date"
            type="date"
            class="custom-date-input"
            [(ngModel)]="date"
            required
          />
        </div>

        <div class="control-spacer"></div>

        <div class="total-badge">
          <span class="total-label">資產總計</span>
          <span class="total-value">NT$ {{ calculateTotal().toLocaleString() }}</span>
        </div>

        <button mat-flat-button color="primary" type="button" (click)="addItem()" class="add-item-btn">
          <mat-icon>add</mat-icon>
          新增項目
        </button>
      </div>

      <!-- 緊湊型明細清單表格 -->
      <div class="table-container">
        <table class="compact-table">
          <thead>
            <tr>
              <th class="th-index">#</th>
              <th class="th-name">項目名稱</th>
              <th class="th-value">金額 (NT$)</th>
              <th class="th-action">操作</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items; track item.id; let i = $index) {
              <tr class="item-row">
                <td class="td-index">{{ i + 1 }}</td>
                <td class="td-name">
                  <input
                    type="text"
                    class="compact-input"
                    [(ngModel)]="item.name"
                    placeholder="項目名稱 (例如：台幣活存、富邦證券)"
                    required
                  />
                </td>
                <td class="td-value">
                  <div class="currency-input-wrap">
                    <span class="currency-prefix">NT$</span>
                    <input
                      type="number"
                      class="compact-input input-number"
                      [(ngModel)]="item.value"
                      (keydown.enter)="onEnterValue(i)"
                      placeholder="0"
                      required
                    />
                  </div>
                </td>
                <td class="td-action">
                  <button
                    mat-icon-button
                    type="button"
                    class="delete-btn"
                    color="warn"
                    (click)="removeItem(i)"
                    [disabled]="items.length === 1"
                    matTooltip="刪除此項目"
                  >
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (errorMessage) {
        <div class="error-banner">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <span>{{ errorMessage }}</span>
        </div>
      }

      <!-- 底部動作按鈕 -->
      <div class="dialog-actions">
        <div class="footer-hint">
          共 {{ items.length }} 個項目
        </div>
        <div class="actions-right">
          <button mat-button mat-dialog-close>取消</button>
          <button mat-flat-button color="primary" (click)="onSave()" class="save-btn">儲存記錄</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-wrapper {
      padding: 18px 24px 16px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      overflow: hidden;
    }

    /* 頂部 Header */
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 12px;
      border-bottom: 1px solid #eef0f4;
      margin-bottom: 12px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header-icon {
      color: #3f51b5;
      font-size: 26px;
      width: 26px;
      height: 26px;
    }
    .dialog-title {
      margin: 0;
      font-size: 19px;
      font-weight: 600;
      color: #1a237e;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .quick-btn {
      height: 34px;
      line-height: 34px;
      font-size: 13px;
    }
    .close-btn {
      width: 34px;
      height: 34px;
      color: #777;
    }

    /* 控制列 */
    .control-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 12px;
      background: #f8fafc;
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .date-control {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .control-label {
      font-size: 13px;
      font-weight: 500;
      color: #475569;
      white-space: nowrap;
    }
    .custom-date-input {
      height: 34px;
      padding: 4px 10px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 13.5px;
      font-family: inherit;
      color: #1e293b;
      background-color: #fff;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:focus {
        border-color: #3f51b5;
        box-shadow: inset 0 0 0 1px #3f51b5;
      }
    }
    .control-spacer {
      flex: 1 1 auto;
    }
    .total-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #e8f5e9;
      border: 1px solid #c8e6c9;
      padding: 4px 12px;
      border-radius: 16px;
    }
    .total-label {
      font-size: 12.5px;
      color: #2e7d32;
      font-weight: 500;
    }
    .total-value {
      font-size: 15px;
      font-weight: 700;
      color: #1b5e20;
    }
    .add-item-btn {
      height: 34px;
      line-height: 34px;
      font-size: 13px;
      font-weight: 500;
      padding: 0 12px;
    }

    /* 緊湊型清單表格 */
    .table-container {
      max-height: 52vh;
      overflow-y: auto;
      overflow-x: hidden; /* 徹底杜絕水平捲軸引發的抖動 */
      scrollbar-gutter: stable; /* 預留捲軸軌道，避免捲軸閃現導致寬度變化 */
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #fff;
      box-sizing: border-box;
      position: relative;
    }
    .compact-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      box-sizing: border-box;
    }
    .compact-table thead {
      position: sticky;
      top: 0;
      background: #f1f5f9;
      z-index: 2;
    }
    .compact-table th {
      padding: 7px 8px;
      font-size: 12.5px;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #cbd5e1;
      text-align: left;
      box-sizing: border-box;
      overflow: hidden;
      white-space: nowrap;
    }
    .th-index { width: 38px; text-align: center !important; }
    .th-name { width: calc(60% - 42px); }
    .th-value { width: calc(40% - 42px); }
    .th-action { width: 46px; text-align: center !important; }

    .item-row {
      height: 40px;
      border-bottom: 1px solid #f1f5f9;
      transition: background-color 0.15s;

      &:hover {
        background-color: #f8fafc;
      }
    }
    .compact-table td {
      padding: 3px 6px;
      vertical-align: middle;
      box-sizing: border-box;
      overflow: hidden;
    }
    .td-index {
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      font-weight: 500;
      white-space: nowrap;
    }
    .td-action {
      text-align: center;
      padding: 3px 2px;
      white-space: nowrap;
    }

    /* 緊湊輸入框 (使用 inset 陰影，絕不溢出觸發捲軸) */
    .compact-input {
      width: 100%;
      height: 32px;
      padding: 4px 8px;
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      font-size: 13.5px;
      font-family: inherit;
      color: #1e293b;
      box-sizing: border-box;
      outline: none;
      background-color: #fff;
      transition: border-color 0.15s, box-shadow 0.15s;

      &:hover {
        border-color: #94a3b8;
      }
      &:focus {
        border-color: #3f51b5;
        box-shadow: inset 0 0 0 1px #3f51b5; /* 使用內陰影，完全不產生外部尺寸擴散 */
      }
      &::placeholder {
        color: #94a3b8;
        font-size: 12.5px;
      }
    }

    .currency-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      box-sizing: border-box;
    }
    .currency-prefix {
      position: absolute;
      left: 8px;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      pointer-events: none;
    }
    .input-number {
      padding-left: 36px;
      text-align: right;
      font-weight: 600;
      color: #0f172a;
    }

    /* 消除 MDC 按鈕預設 48px touch-target 與 ripple 溢出 */
    .delete-btn {
      width: 28px !important;
      height: 28px !important;
      min-width: 28px !important;
      line-height: 28px !important;
      padding: 0 !important;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      ::ng-deep .mat-mdc-button-touch-target {
        display: none !important;
      }
      ::ng-deep .mat-mdc-focus-indicator {
        display: none !important;
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    /* 錯誤警示條 */
    .error-banner {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 10px;
      padding: 6px 12px;
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      color: #dc2626;
      font-size: 13px;
    }
    .error-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* 底部按鈕區 */
    .dialog-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px solid #eef0f4;
    }
    .footer-hint {
      font-size: 12.5px;
      color: #64748b;
    }
    .actions-right {
      display: flex;
      gap: 8px;
    }
    .save-btn {
      min-width: 100px;
      height: 36px;
    }
  `]
})
export class AssetDialogComponent implements OnInit {
  isEdit = false;
  date: string = new Date().toISOString().slice(0, 10);
  items: AssetItem[] = [];
  errorMessage = '';

  constructor(
    public dialogRef: MatDialogRef<AssetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssetDialogData
  ) {}

  ngOnInit(): void {
    if (this.data?.editRecord) {
      this.isEdit = true;
      this.date = this.data.editRecord.date;
      this.items = this.data.editRecord.items.map(i => ({ ...i }));
    } else {
      this.isEdit = false;
      this.date = new Date().toISOString().slice(0, 10);
      if (this.data?.lastItems && this.data.lastItems.length > 0) {
        this.loadLastItems();
      } else {
        this.items = [{ id: 'item_1', name: '', value: 0 }];
      }
    }
  }

  loadLastItems(): void {
    if (this.data?.lastItems) {
      this.items = this.data.lastItems.map(it => ({
        id: 'item_' + Math.random().toString(36).substring(2, 9),
        name: it.name,
        value: 0
      }));
    }
  }

  addItem(): void {
    this.items.push({
      id: 'item_' + Math.random().toString(36).substring(2, 9),
      name: '',
      value: 0
    });
  }

  onEnterValue(index: number): void {
    if (index === this.items.length - 1) {
      this.addItem();
    }
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.splice(index, 1);
    }
  }

  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  }

  onSave(): void {
    this.errorMessage = '';
    if (!this.date) {
      this.errorMessage = '請填寫記錄日期';
      return;
    }

    const invalidItem = this.items.find(i => !i.name || i.name.trim() === '');
    if (invalidItem) {
      this.errorMessage = '所有項目皆須填寫名稱';
      return;
    }

    this.dialogRef.close({
      date: this.date,
      items: this.items
    });
  }
}

