import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AssetRecord,
  AssetCategory,
  ASSET_CATEGORIES,
  getCategoryLabel
} from '../../../../models/asset.model';

export interface ActiveCategoryCol {
  id: AssetCategory;
  label: string;
  color: string;
}

export interface TimelineEntry {
  record: AssetRecord;
  change: {
    diff: number;
    percent: number;
    isIncrease: boolean;
    isInitial: boolean;
  };
  categoryTotals: Record<AssetCategory, number>;
  isLatest: boolean;
}

@Component({
  selector: 'app-asset-timeline',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatTooltipModule
  ],
  templateUrl: './asset-timeline.component.html',
  styleUrl: './asset-timeline.component.scss'
})
export class AssetTimelineComponent implements OnChanges {
  private snackBar = inject(MatSnackBar);

  @Input() assets: AssetRecord[] = [];
  @Output() edit = new EventEmitter<AssetRecord>();
  @Output() delete = new EventEmitter<AssetRecord>();

  allEntries: TimelineEntry[] = [];
  pagedEntries = signal<TimelineEntry[]>([]);
  activeCategories: ActiveCategoryCol[] = [];

  expandedAssetIds = new Set<string>();
  highlightedId: string | null = null;

  pageIndex = 0;
  pageSize = 10;
  sortDirection: 'desc' | 'asc' = 'desc';

  getCategoryLabel = getCategoryLabel;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assets']) {
      this.processTimelineEntries();
    }
  }

  processTimelineEntries(): void {
    if (!this.assets || this.assets.length === 0) {
      this.allEntries = [];
      this.activeCategories = [];
      this.pagedEntries.set([]);
      return;
    }

    // Always sort chronologically descending (newest first) to compute delta vs previous historical record
    const chronological = [...this.assets].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const latestId = chronological[0]?.id;
    const usedCategories = new Set<AssetCategory>();
    const entriesMap = new Map<string, TimelineEntry>();

    chronological.forEach((record, idx) => {
      let change = { diff: 0, percent: 0, isIncrease: false, isInitial: true };
      if (idx < chronological.length - 1) {
        const prev = chronological[idx + 1];
        const diff = record.total - prev.total;
        const percent = prev.total !== 0 ? (diff / Math.abs(prev.total)) * 100 : 0;
        change = {
          diff,
          percent,
          isIncrease: diff >= 0,
          isInitial: false
        };
      }

      const categoryTotals: Record<AssetCategory, number> = {
        cash: 0,
        investment: 0,
        other: 0,
        none: 0
      };

      for (const item of record.items) {
        const cat = item.category || 'none';
        categoryTotals[cat] += item.value;
        if (item.value > 0) {
          usedCategories.add(cat);
        }
      }

      entriesMap.set(record.id, {
        record,
        change,
        categoryTotals,
        isLatest: record.id === latestId
      });
    });

    // Keep consistent column order across all rows so every category aligns vertically
    this.activeCategories = ASSET_CATEGORIES
      .filter(def => usedCategories.has(def.id))
      .map(def => ({ id: def.id, label: def.label, color: def.color }));

    const displayList = this.sortDirection === 'asc'
      ? [...chronological].reverse()
      : chronological;

    this.allEntries = displayList.map(r => entriesMap.get(r.id)!);
    this.updatePagedEntries();
  }

  updatePagedEntries(): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.pagedEntries.set(this.allEntries.slice(start, end));
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagedEntries();
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'desc' ? 'asc' : 'desc';
    this.processTimelineEntries();
  }

  isExpanded(id: string): boolean {
    return this.expandedAssetIds.has(id);
  }

  toggleExpand(id: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.expandedAssetIds.has(id)) {
      this.expandedAssetIds.delete(id);
    } else {
      this.expandedAssetIds.add(id);
    }
  }

  areAllExpanded(): boolean {
    if (this.pagedEntries().length === 0) return false;
    return this.pagedEntries().every(e => this.expandedAssetIds.has(e.record.id));
  }

  toggleExpandAll(): void {
    if (this.areAllExpanded()) {
      for (const e of this.pagedEntries()) {
        this.expandedAssetIds.delete(e.record.id);
      }
    } else {
      for (const e of this.pagedEntries()) {
        this.expandedAssetIds.add(e.record.id);
      }
    }
  }

  calculatePercentage(itemValue: number, total: number): number {
    if (!total || total === 0) return 0;
    return Math.round((itemValue / total) * 1000) / 10;
  }

  /**
   * Jump to record's page in timeline, expand detail, and scroll with pulse highlight
   */
  highlightRecord(record: AssetRecord): void {
    const index = this.allEntries.findIndex(e => e.record.id === record.id);
    if (index === -1) return;

    const targetPage = Math.floor(index / this.pageSize);
    if (this.pageIndex !== targetPage) {
      this.pageIndex = targetPage;
      this.updatePagedEntries();
    }

    this.expandedAssetIds.add(record.id);

    setTimeout(() => {
      const el = document.getElementById('timeline-node-' + record.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.highlightedId = record.id;
        setTimeout(() => {
          this.highlightedId = null;
        }, 2500);
      }
    }, 120);

    this.snackBar.open(`Jumped to record for ${record.date}`, 'OK', { duration: 2500 });
  }
}
