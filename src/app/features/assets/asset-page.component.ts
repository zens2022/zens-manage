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
import { AssetCategoryChartComponent } from './components/asset-category-chart/asset-category-chart.component';
import { AssetTimelineComponent } from './components/asset-timeline/asset-timeline.component';
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
    AssetCategoryChartComponent,
    AssetTimelineComponent
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

  @ViewChild('assetTimeline') assetTimeline?: AssetTimelineComponent;

  allAssets = signal<AssetRecord[]>([]);

  constructor() {
    effect(() => {
      // Listen to LocalStorageService appData changes (e.g. cloud download completed) and refresh
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
   * When user clicks a data point on chart, scroll and highlight in AssetTimeline
   */
  onChartPointClick(record: AssetRecord): void {
    this.assetTimeline?.highlightRecord(record);
  }

  openCreateDialog(): void {
    const assets = this.localService.getAssets();
    const lastRecord = assets.length > 0 ? assets[0] : undefined;
    const lastItems = this.localService.getLastItems();
    const dialogRef = this.dialog.open(AssetDialogComponent, {
      width: lastRecord ? '840px' : '740px',
      maxWidth: '95vw',
      data: { lastItems, lastRecordDate: lastRecord?.date }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.localService.saveAsset(result);
        this.syncManager.notifyLocalChange();
        this.refreshAssets();
        this.snackBar.open('Asset record saved!', 'Close', { duration: 3000 });
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
        this.snackBar.open('Asset record updated!', 'Close', { duration: 3000 });
      }
    });
  }

  confirmDelete(record: AssetRecord): void {
    if (confirm(`Are you sure you want to delete the asset record for ${record.date}? (This action cannot be undone)`)) {
      this.localService.deleteAsset(record.id);
      this.syncManager.notifyLocalChange();
      this.refreshAssets();
      this.snackBar.open('Record deleted', 'Close', { duration: 3000 });
    }
  }
}
