import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
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
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTableModule
  ],
  template: `
    <h2 mat-dialog-title>
      {{ isEdit ? '編輯資產記錄' : '新增資產記錄' }}
    </h2>

    <mat-dialog-content class="dialog-content">
      <div class="header-inputs">
        <mat-form-field appearance="outline" class="date-field">
          <mat-label>記錄日期</mat-label>
          <input matInput type="date" [(ngModel)]="date" required>
        </mat-form-field>

        @if (!isEdit && data.lastItems && data.lastItems.length > 0) {
          <button mat-stroked-button color="primary" type="button" (click)="loadLastItems()" class="load-last-btn">
            <mat-icon>history</mat-icon>
            帶入上次項目 ({{ data.lastItems.length }}項)
          </button>
        }
      </div>

      <div class="items-header">
        <h3>資產明細 (總計：NT$ {{ calculateTotal().toLocaleString() }})</h3>
        <button mat-mini-fab color="primary" (click)="addItem()" title="新增明細項目">
          <mat-icon>add</mat-icon>
        </button>
      </div>

      <div class="table-container">
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 50%;">項目名稱</th>
              <th style="width: 40%;">金額 (NT$)</th>
              <th style="width: 10%;">操作</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items; track item.id; let i = $index) {
              <tr>
                <td>
                  <mat-form-field appearance="outline" class="dense-field">
                    <input matInput [(ngModel)]="item.name" placeholder="例如：台幣活存、富邦證券" required>
                  </mat-form-field>
                </td>
                <td>
                  <mat-form-field appearance="outline" class="dense-field">
                    <input matInput type="number" [(ngModel)]="item.value" placeholder="金額" required>
                  </mat-form-field>
                </td>
                <td class="action-cell">
                  <button mat-icon-button color="warn" (click)="removeItem(i)" [disabled]="items.length === 1">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (errorMessage) {
        <p class="error-msg">{{ errorMessage }}</p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>取消</button>
      <button mat-flat-button color="primary" (click)="onSave()">儲存</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 550px;
      max-width: 750px;
      padding-top: 8px;
    }
    .header-inputs {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 8px;
    }
    .date-field {
      flex: 1;
    }
    .load-last-btn {
      height: 52px;
    }
    .items-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e0e0e0;
    }
    .items-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }
    .table-container {
      max-height: 380px;
      overflow-y: auto;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
    }
    .items-table th {
      text-align: left;
      padding: 8px;
      font-size: 13px;
      color: #666;
    }
    .items-table td {
      padding: 4px 6px;
    }
    .dense-field {
      width: 100%;
      margin-bottom: -16px;
    }
    .action-cell {
      text-align: center;
    }
    .error-msg {
      color: #f44336;
      font-size: 13px;
      margin-top: 12px;
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
