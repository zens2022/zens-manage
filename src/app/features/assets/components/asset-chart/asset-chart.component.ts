import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
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
        <mat-card-title>資產趨勢分析 (Asset Trend)</mat-card-title>
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
    .chart-container {
      width: 100%;
      height: 320px;
    }
  `]
})
export class AssetChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() data: AssetRecord[] = [];
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef<HTMLDivElement>;

  private chartInstance: echarts.ECharts | null = null;
  private resizeObserver: ResizeObserver | null = null;

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
    this.updateChart();

    this.resizeObserver = new ResizeObserver(() => {
      this.chartInstance?.resize();
    });
    this.resizeObserver.observe(this.chartContainer.nativeElement);
  }

  private updateChart(): void {
    if (!this.chartInstance) return;

    // 按日期升序排列
    const sorted = [...this.data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const dates = sorted.map(d => d.date);
    const totals = sorted.map(d => d.total);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          if (!params || !params.length) return '';
          const p = params[0];
          return `<strong>${p.name}</strong><br/>總資產: <b>NT$ ${Number(p.value).toLocaleString()}</b>`;
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
          symbolSize: 8,
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
