import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AssetRecord, AssetCategory, getCategoryLabel } from '../../../../models/asset.model';

@Component({
  selector: 'app-asset-table',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule
  ],
  templateUrl: './asset-table.component.html',
  styleUrl: './asset-table.component.scss'
})
export class AssetTableComponent implements OnChanges {
  private snackBar = inject(MatSnackBar);

  @Input() assets: AssetRecord[] = [];
  @Output() edit = new EventEmitter<AssetRecord>();
  @Output() delete = new EventEmitter<AssetRecord>();

  pagedAssets = signal<AssetRecord[]>([]);

  displayedColumns = ['expand', 'date', 'total', 'actions'];
  expandedAssetIds = new Set<string>();
  highlightedId: string | null = null;

  pageIndex = 0;
  pageSize = 10;

  getCategoryLabel = getCategoryLabel;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assets']) {
      this.updatePagedAssets();
    }
  }

  updatePagedAssets(): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.pagedAssets.set(this.assets.slice(start, end));
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
   * Called externally: jump to record's page, expand detail, and trigger highlight flash
   */
  highlightRecord(record: AssetRecord): void {
    const index = this.assets.findIndex(a => a.id === record.id);
    if (index === -1) return;

    const targetPage = Math.floor(index / this.pageSize);
    if (this.pageIndex !== targetPage) {
      this.pageIndex = targetPage;
      this.updatePagedAssets();
    }

    this.expandedAssetIds.add(record.id);

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

    this.snackBar.open(`Jumped to and expanded records for ${record.date}`, 'OK', { duration: 2500 });
  }
}
