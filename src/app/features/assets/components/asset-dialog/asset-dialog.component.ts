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
  templateUrl: './asset-dialog.component.html',
  styleUrl: './asset-dialog.component.scss'
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
      this.items = this.data.editRecord.items.map(i => ({
        ...i,
        category: i.category || 'none'
      }));
    } else {
      this.isEdit = false;
      this.date = new Date().toISOString().slice(0, 10);
      if (this.data?.lastItems && this.data.lastItems.length > 0) {
        this.loadLastItems();
      } else {
        this.items = [{ id: 'item_1', name: '', value: 0, category: 'none' }];
      }
    }
  }

  loadLastItems(): void {
    if (this.data?.lastItems) {
      this.items = this.data.lastItems.map(it => ({
        id: 'item_' + Math.random().toString(36).substring(2, 9),
        name: it.name,
        value: 0,
        category: it.category || 'none'
      }));
    }
  }

  addItem(): void {
    this.items.push({
      id: 'item_' + Math.random().toString(36).substring(2, 9),
      name: '',
      value: 0,
      category: 'none'
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
