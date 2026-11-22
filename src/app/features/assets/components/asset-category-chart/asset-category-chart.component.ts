import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import * as echarts from 'echarts';
import { AssetRecord, ASSET_CATEGORIES } from '../../../../models/asset.model';

@Component({
  selector: 'app-asset-category-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './asset-category-chart.component.html',
  styleUrl: './asset-category-chart.component.scss'
})
export class AssetCategoryChartComponent implements OnInit, OnChanges, OnDestroy {
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

    this.sortedRecords = [...this.data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const dates = this.sortedRecords.map(d => d.date);

    const cashValues: number[] = [];
    const investmentValues: number[] = [];
    const otherValues: number[] = [];
    const noneValues: number[] = [];

    const categoryBreakdowns = this.sortedRecords.map(record => {
      let cash = 0;
      let investment = 0;
      let other = 0;
      let none = 0;

      for (const item of record.items || []) {
        const cat = item.category || 'none';
        const val = Number(item.value) || 0;
        if (cat === 'cash') cash += val;
        else if (cat === 'investment') investment += val;
        else if (cat === 'other') other += val;
        else none += val;
      }

      cashValues.push(cash);
      investmentValues.push(investment);
      otherValues.push(other);
      noneValues.push(none);

      const total = Number(record.total) || (cash + investment + other + none) || 1;

      return {
        total,
        cash,
        investment,
        other,
        none,
        cashPct: ((cash / total) * 100).toFixed(1),
        investmentPct: ((investment / total) * 100).toFixed(1),
        otherPct: ((other / total) * 100).toFixed(1),
        nonePct: ((none / total) * 100).toFixed(1)
      };
    });

    // 檢查是否有 none 或 other 資料，若全都為 0 則圖例預設可取消勾選或保留
    const hasNone = noneValues.some(v => v > 0);
    const hasOther = otherValues.some(v => v > 0);

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
          const idx = params[0].dataIndex;
          const dateStr = dates[idx];
          const info = categoryBreakdowns[idx];

          const rows = [
            { name: '現金', value: info.cash, pct: info.cashPct, color: '#1976d2' },
            { name: '投資', value: info.investment, pct: info.investmentPct, color: '#388e3c' },
            { name: '其他', value: info.other, pct: info.otherPct, color: '#f57c00' },
            { name: '未分類', value: info.none, pct: info.nonePct, color: '#757575' }
          ];

          const rowsHtml = rows
            .filter(r => r.value > 0 || r.name === '現金' || r.name === '投資')
            .map(r => `
              <div style="display: flex; justify-content: space-between; align-items: center; margin: 4px 0; gap: 16px;">
                <span style="display: flex; align-items: center; gap: 6px; color: #444;">
                  <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${r.color};"></span>
                  ${r.name}:
                </span>
                <span style="font-weight: 500; color: #111;">
                  NT$ ${r.value.toLocaleString()} <span style="font-size: 11.5px; color: #666;">(${r.pct}%)</span>
                </span>
              </div>
            `).join('');

          return `
            <div style="font-family: Roboto, -apple-system, sans-serif; min-width: 220px;">
              <div style="font-size: 13px; color: #666; margin-bottom: 4px;">📅 日期: <b>${dateStr}</b></div>
              <div style="font-size: 15px; font-weight: bold; color: #1a237e; margin-bottom: 6px;">
                總資產: NT$ ${info.total.toLocaleString()}
              </div>
              <div style="border-top: 1px dashed #e0e0e0; padding-top: 6px; font-size: 13px;">
                ${rowsHtml}
              </div>
              <div style="margin-top: 8px; font-size: 11.5px; color: #3f51b5;">👉 點擊此點可跳至下方明細</div>
            </div>
          `;
        }
      },
      legend: {
        data: ['現金', '投資', '其他', '未分類'],
        top: '2%',
        right: '2%',
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { fontSize: 12, color: '#555' },
        selected: {
          '現金': true,
          '投資': true,
          '其他': hasOther,
          '未分類': hasNone
        }
      },
      grid: {
        left: '2%',
        right: '4%',
        bottom: '8%',
        top: '16%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#888' } }
      },
      yAxis: {
        type: 'value',
        scale: true,
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
          name: '現金',
          type: 'line',
          smooth: true,
          data: cashValues,
          symbolSize: 7,
          cursor: 'pointer',
          lineStyle: { width: 2.5, color: '#1976d2' },
          itemStyle: { color: '#1976d2' }
        },
        {
          name: '投資',
          type: 'line',
          smooth: true,
          data: investmentValues,
          symbolSize: 7,
          cursor: 'pointer',
          lineStyle: { width: 2.5, color: '#388e3c' },
          itemStyle: { color: '#388e3c' }
        },
        {
          name: '其他',
          type: 'line',
          smooth: true,
          data: otherValues,
          symbolSize: 7,
          cursor: 'pointer',
          lineStyle: { width: 2.5, color: '#f57c00' },
          itemStyle: { color: '#f57c00' }
        },
        {
          name: '未分類',
          type: 'line',
          smooth: true,
          data: noneValues,
          symbolSize: 7,
          cursor: 'pointer',
          lineStyle: { width: 2, color: '#757575', type: 'dashed' },
          itemStyle: { color: '#757575' }
        }
      ]
    };

    this.chartInstance.setOption(option);
  }
}
