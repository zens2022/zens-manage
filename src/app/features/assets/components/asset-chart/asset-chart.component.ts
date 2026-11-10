import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import * as echarts from 'echarts';
import { AssetRecord } from '../../../../models/asset.model';

@Component({
  selector: 'app-asset-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card class="chart-card">
      <mat-card-header>
        <mat-card-title class="chart-header-title">
          <span>資產趨勢分析 (Asset Trend)</span>
          <span class="hint-text">💡 點擊圖表中的資料點可直接跳轉至該筆明細</span>
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div #chartContainer class="chart-container"></div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .chart-card {
      margin-bottom: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }
    .chart-header-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      font-size: 18px;
    }
    .hint-text {
      font-size: 13px;
      font-weight: normal;
      color: #666;
    }
    .chart-container {
      width: 100%;
      height: 340px;
    }
  `]
})
export class AssetChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() data: AssetRecord[] = [];
  @Output() pointClick = new EventEmitter<AssetRecord>();
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef<HTMLDivElement>;

  private chartInstance: echarts.ECharts | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private sortedRecords: AssetRecord[] = [];

  ngOnInit(): void {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.chartInstance) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.chartInstance?.dispose();
  }

  private initChart(): void {
    if (!this.chartContainer?.nativeElement) return;

    this.chartInstance = echarts.init(this.chartContainer.nativeElement);

    // 監聽點擊資料點事件
    this.chartInstance.on('click', (params: any) => {
      if (params && params.dataIndex !== undefined) {
        const targetRecord = this.sortedRecords[params.dataIndex];
        if (targetRecord) {
          this.pointClick.emit(targetRecord);
        }
      }
    });

    this.updateChart();

    this.resizeObserver = new ResizeObserver(() => {
      this.chartInstance?.resize();
    });
    this.resizeObserver.observe(this.chartContainer.nativeElement);
  }

  private updateChart(): void {
    if (!this.chartInstance) return;

    // 按日期升序排列
    this.sortedRecords = [...this.data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const dates = this.sortedRecords.map(d => d.date);
    const totals = this.sortedRecords.map(d => d.total);
    const records = this.sortedRecords;

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        textStyle: { color: '#333' },
        extraCssText: 'box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12); border-radius: 8px; padding: 12px 16px;',
        formatter: (params: any) => {
          if (!params || !params.length) return '';
          const p = params[0];
          const dataIndex = p.dataIndex;
          const currentRecord = records[dataIndex];
          const currentTotal = Number(currentRecord.total) || 0;

          let diffContent = '';
          if (dataIndex === 0) {
            diffContent = `<div style="margin-top: 6px; font-size: 12.5px; color: #888;">📌 起始期記錄 (無前期資料)</div>`;
          } else {
            const prevRecord = records[dataIndex - 1];
            const prevTotal = Number(prevRecord.total) || 0;
            const diff = currentTotal - prevTotal;
            const diffPercent = prevTotal !== 0 ? ((diff / prevTotal) * 100).toFixed(2) : '0';

            const isPositive = diff > 0;
            const isZero = diff === 0;
            const color = isPositive ? '#2e7d32' : isZero ? '#555' : '#c62828';
            const sign = isPositive ? '+' : '';
            const arrow = isPositive ? '▲' : isZero ? '—' : '▼';

            diffContent = `
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e0e0e0; font-size: 13px;">
                <span style="color: #666;">前期 (${prevRecord.date}): </span>
                <span style="color: #444;">NT$ ${prevTotal.toLocaleString()}</span>
                <br/>
                <span style="color: #666;">較前期差額: </span>
                <strong style="color: ${color}; font-size: 13.5px;">
                  ${arrow} ${sign}NT$ ${diff.toLocaleString()} (${sign}${diffPercent}%)
                </strong>
              </div>
            `;
          }

          return `
            <div style="font-family: Roboto, -apple-system, sans-serif; min-width: 190px;">
              <div style="font-size: 13px; color: #666; margin-bottom: 4px;">📅 日期: <b>${p.name}</b></div>
              <div style="font-size: 16px; font-weight: bold; color: #1a237e;">
                總資產: NT$ ${currentTotal.toLocaleString()}
              </div>
              ${diffContent}
              <div style="margin-top: 8px; font-size: 11.5px; color: #3f51b5;">👉 點擊此點可跳至下方明細</div>
            </div>
          `;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '8%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#888' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (val: number) => {
            if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
            if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
            return val.toLocaleString();
          }
        },
        splitLine: { lineStyle: { color: '#f0f0f0' } }
      },
      series: [
        {
          name: '總資產',
          type: 'line',
          smooth: true,
          data: totals,
          symbolSize: 9,
          cursor: 'pointer',
          emphasis: {
            scale: 1.6,
            itemStyle: {
              borderColor: '#ff4081',
              borderWidth: 3
            }
          },
          lineStyle: {
            width: 3,
            color: '#3f51b5'
          },
          itemStyle: {
            color: '#3f51b5'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(63, 81, 181, 0.35)' },
              { offset: 1, color: 'rgba(63, 81, 181, 0.02)' }
            ])
          }
        }
      ]
    };

    this.chartInstance.setOption(option);
  }
}
