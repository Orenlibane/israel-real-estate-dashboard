import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Chart, registerables } from 'chart.js';
import { combineLatest } from 'rxjs';
import { DataService } from '../../services/data.service';
import { ThemeService } from '../../services/theme.service';
import { RegionalData, FilterOptions } from '../../models/data.models';

Chart.register(...registerables);

@Component({
  selector: 'app-regional-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './regional-chart.component.html',
  styleUrl: './regional-chart.component.scss'
})
export class RegionalChartComponent implements OnInit, OnDestroy {
  @ViewChild('priceChart', { static: true }) priceChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('salesChart', { static: true }) salesChartCanvas!: ElementRef<HTMLCanvasElement>;

  private dataService = inject(DataService);
  private themeService = inject(ThemeService);

  private priceChart: Chart | null = null;
  private salesChart: Chart | null = null;

  // Combine regional data with filters
  private defaultFilters: FilterOptions = {
    region: null,
    dateFrom: null,
    dateTo: null,
    propertyType: null,
    roomCount: null
  };

  combinedData = toSignal(
    combineLatest([
      this.dataService.regionalData$,
      this.dataService.filters$
    ])
  , { initialValue: [[], this.defaultFilters] as [RegionalData[], FilterOptions] });

  loading = toSignal(this.dataService.loading$, { initialValue: false });

  constructor() {
    effect(() => {
      const [rawData, filters] = this.combinedData() as [RegionalData[], FilterOptions];
      const isDark = this.themeService.isDarkMode();

      // Apply region filter
      let data = [...rawData];
      if (filters.region && filters.region !== 'all') {
        data = data.filter(d => d.region === filters.region);
      }

      if (data.length > 0) {
        this.updateCharts(data, isDark);
      }
    });
  }

  regionalData(): RegionalData[] {
    const [rawData, filters] = this.combinedData() as [RegionalData[], FilterOptions];
    let data = [...rawData];
    if (filters.region && filters.region !== 'all') {
      data = data.filter(d => d.region === filters.region);
    }
    return data;
  }

  ngOnInit(): void {
    this.initCharts();
  }

  ngOnDestroy(): void {
    this.priceChart?.destroy();
    this.salesChart?.destroy();
  }

  private initCharts(): void {
    this.initPriceChart();
    this.initSalesChart();
  }

  private initPriceChart(): void {
    const ctx = this.priceChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const isDark = this.themeService.isDarkMode();
    const colors = this.getChartColors(isDark);

    this.priceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'מחיר ממוצע (₪)',
          data: [],
          backgroundColor: this.generateGradientColors(7),
          borderRadius: 6,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            rtl: true,
            titleFont: { family: 'Rubik, Inter, sans-serif' },
            bodyFont: { family: 'Rubik, Inter, sans-serif' },
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            titleColor: colors.textColor,
            bodyColor: colors.textColor,
            borderColor: colors.borderColor,
            borderWidth: 1,
            callbacks: {
              label: (context) => {
                const value = context.parsed.x;
                return `מחיר ממוצע: ₪${value?.toLocaleString('he-IL') || 0}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.textColor,
              font: { family: 'Rubik, Inter, sans-serif', size: 11 },
              callback: (value) => `₪${(Number(value) / 1000000).toFixed(1)}M`
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              color: colors.textColor,
              font: { family: 'Rubik, Inter, sans-serif', size: 12 },
            }
          }
        }
      }
    });
  }

  private initSalesChart(): void {
    const ctx = this.salesChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const isDark = this.themeService.isDarkMode();
    const colors = this.getChartColors(isDark);

    this.salesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: this.generateGradientColors(7),
          borderWidth: 2,
          borderColor: isDark ? '#0f172a' : '#ffffff',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '50%',
        plugins: {
          legend: {
            position: 'right',
            rtl: true,
            labels: {
              color: colors.textColor,
              font: { family: 'Rubik, Inter, sans-serif', size: 11 },
              usePointStyle: true,
              padding: 12,
            }
          },
          tooltip: {
            rtl: true,
            titleFont: { family: 'Rubik, Inter, sans-serif' },
            bodyFont: { family: 'Rubik, Inter, sans-serif' },
            callbacks: {
              label: (context) => {
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const value = context.parsed;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${context.label}: ${value.toLocaleString('he-IL')} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  private updateCharts(data: RegionalData[], isDark: boolean): void {
    const colors = this.getChartColors(isDark);
    const sortedByPrice = [...data].sort((a, b) => b.averagePrice - a.averagePrice);

    // Update price chart
    if (this.priceChart) {
      this.priceChart.data.labels = sortedByPrice.map(d => d.regionHe);
      this.priceChart.data.datasets[0].data = sortedByPrice.map(d => d.averagePrice);

      const options = this.priceChart.options;
      if (options.scales?.['x']) {
        options.scales['x'].grid = { color: colors.gridColor };
        options.scales['x'].ticks = { ...options.scales['x'].ticks, color: colors.textColor };
      }
      if (options.scales?.['y']?.ticks) {
        options.scales['y'].ticks.color = colors.textColor;
      }

      this.priceChart.update('none');
    }

    // Update sales chart
    if (this.salesChart) {
      this.salesChart.data.labels = data.map(d => d.regionHe);
      this.salesChart.data.datasets[0].data = data.map(d => d.sales);
      this.salesChart.data.datasets[0].borderColor = isDark ? '#0f172a' : '#ffffff';

      if (this.salesChart.options.plugins?.legend?.labels) {
        this.salesChart.options.plugins.legend.labels.color = colors.textColor;
      }

      this.salesChart.update('none');
    }
  }

  private generateGradientColors(count: number): string[] {
    const baseColors = [
      '#0066e6', '#22c55e', '#f59e0b', '#ef4444',
      '#8b5cf6', '#ec4899', '#06b6d4'
    ];
    return baseColors.slice(0, count);
  }

  private getChartColors(isDark: boolean) {
    return {
      textColor: isDark ? '#f8fafc' : '#0f172a',
      gridColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      borderColor: isDark ? '#334155' : '#e2e8f0',
    };
  }

  getHighestPriceRegion(): RegionalData | null {
    const data = this.regionalData();
    if (data.length === 0) return null;
    return data.reduce((max, d) => d.averagePrice > max.averagePrice ? d : max, data[0]);
  }

  getLowestPriceRegion(): RegionalData | null {
    const data = this.regionalData();
    if (data.length === 0) return null;
    return data.reduce((min, d) => d.averagePrice < min.averagePrice ? d : min, data[0]);
  }

  getTotalRegionalSales(): number {
    return this.regionalData().reduce((sum, d) => sum + d.sales, 0);
  }
}
