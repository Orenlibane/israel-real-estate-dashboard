import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Chart, registerables } from 'chart.js';
import { combineLatest } from 'rxjs';
import { DataService } from '../../services/data.service';
import { ThemeService } from '../../services/theme.service';
import { PriceIndexData, InterestRateData, FilterOptions } from '../../models/data.models';

Chart.register(...registerables);

@Component({
  selector: 'app-correlation-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './correlation-chart.component.html',
  styleUrl: './correlation-chart.component.scss'
})
export class CorrelationChartComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  private dataService = inject(DataService);
  private themeService = inject(ThemeService);
  private chart: Chart | null = null;

  // Combine all data sources with filters
  private defaultFilters: FilterOptions = {
    region: null,
    dateFrom: null,
    dateTo: null,
    propertyType: null,
    roomCount: null
  };

  combinedData = toSignal(
    combineLatest([
      this.dataService.priceIndex$,
      this.dataService.interestRates$,
      this.dataService.filters$
    ])
  , { initialValue: [[], [], this.defaultFilters] as [PriceIndexData[], InterestRateData[], FilterOptions] });

  loading = toSignal(this.dataService.loading$, { initialValue: false });
  marketType = toSignal(this.dataService.marketType$, { initialValue: 'new-dwellings' as const });

  constructor() {
    effect(() => {
      const [rawPrices, rawRates, filters] = this.combinedData() as [PriceIndexData[], InterestRateData[], FilterOptions];
      const isDark = this.themeService.isDarkMode();

      // Apply date filters
      let prices = [...rawPrices];
      let rates = [...rawRates];

      if (filters.dateFrom) {
        prices = prices.filter(p => p.date >= filters.dateFrom!);
        rates = rates.filter(r => r.date >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        prices = prices.filter(p => p.date <= filters.dateTo!);
        rates = rates.filter(r => r.date <= filters.dateTo!);
      }

      if (prices.length > 0 || rates.length > 0) {
        this.updateChart(prices, rates, isDark);
      }
    });
  }

  ngOnInit(): void {
    this.initChart();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private initChart(): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const isDark = this.themeService.isDarkMode();
    const colors = this.getChartColors(isDark);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'מדד מחירי דירות',
            data: [],
            borderColor: colors.priceColor,
            backgroundColor: colors.priceColorAlpha,
            yAxisID: 'y',
            tension: 0.4,
            fill: true,
            pointRadius: 2,
            pointHoverRadius: 6,
            borderWidth: 2,
          },
          {
            label: 'ריבית בנק ישראל (%)',
            data: [],
            borderColor: colors.rateColor,
            backgroundColor: 'transparent',
            yAxisID: 'y1',
            tension: 0.4,
            fill: false,
            pointRadius: 2,
            pointHoverRadius: 6,
            borderWidth: 2,
            borderDash: [5, 5],
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            rtl: true,
            labels: {
              color: colors.textColor,
              font: {
                family: 'Rubik, Inter, sans-serif',
                size: 12,
              },
              usePointStyle: true,
              padding: 20,
            }
          },
          tooltip: {
            rtl: true,
            titleFont: {
              family: 'Rubik, Inter, sans-serif',
            },
            bodyFont: {
              family: 'Rubik, Inter, sans-serif',
            },
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            titleColor: colors.textColor,
            bodyColor: colors.textColor,
            borderColor: colors.borderColor,
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                if (value === null || value === undefined) return label;
                if (context.datasetIndex === 1) {
                  return `${label}: ${value.toFixed(2)}%`;
                }
                return `${label}: ${value.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: colors.gridColor,
            },
            ticks: {
              color: colors.textColor,
              font: {
                family: 'Rubik, Inter, sans-serif',
                size: 11,
              },
              maxRotation: 45,
              minRotation: 0,
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'מדד מחירים',
              color: colors.textColor,
              font: {
                family: 'Rubik, Inter, sans-serif',
                size: 12,
                weight: 500,
              }
            },
            grid: {
              color: colors.gridColor,
            },
            ticks: {
              color: colors.textColor,
              font: {
                family: 'Rubik, Inter, sans-serif',
                size: 11,
              }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'ריבית (%)',
              color: colors.textColor,
              font: {
                family: 'Rubik, Inter, sans-serif',
                size: 12,
                weight: 500,
              }
            },
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              color: colors.textColor,
              font: {
                family: 'Rubik, Inter, sans-serif',
                size: 11,
              },
              callback: (value) => `${value}%`
            }
          }
        }
      }
    });
  }

  private updateChart(
    prices: any[],
    rates: any[],
    isDark: boolean
  ): void {
    if (!this.chart) return;

    const colors = this.getChartColors(isDark);

    // Create a map for rates
    const ratesMap = new Map(rates.map(r => [r.date, r.rate]));

    // Combine data based on dates
    const labels = prices.map(p => this.formatDate(p.date));
    const priceValues = prices.map(p => p.value);
    const rateValues = prices.map(p => ratesMap.get(p.date) || null);

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = priceValues;
    this.chart.data.datasets[0].borderColor = colors.priceColor;
    this.chart.data.datasets[0].backgroundColor = colors.priceColorAlpha;

    this.chart.data.datasets[1].data = rateValues;
    this.chart.data.datasets[1].borderColor = colors.rateColor;

    // Update colors for theme change
    const options = this.chart.options;
    if (options.plugins?.legend?.labels) {
      options.plugins.legend.labels.color = colors.textColor;
    }
    if (options.plugins?.tooltip) {
      options.plugins.tooltip.backgroundColor = isDark ? '#1e293b' : '#ffffff';
      options.plugins.tooltip.titleColor = colors.textColor;
      options.plugins.tooltip.bodyColor = colors.textColor;
      options.plugins.tooltip.borderColor = colors.borderColor;
    }
    if (options.scales?.['x']) {
      options.scales['x'].grid = { color: colors.gridColor };
      options.scales['x'].ticks = { ...options.scales['x'].ticks, color: colors.textColor };
    }
    if (options.scales?.['y']) {
      options.scales['y'].grid = { color: colors.gridColor };
      options.scales['y'].ticks = { ...options.scales['y'].ticks, color: colors.textColor };
      const yScale = options.scales['y'] as any;
      if (yScale.title) {
        yScale.title.color = colors.textColor;
      }
    }
    if (options.scales?.['y1']) {
      options.scales['y1'].ticks = { ...options.scales['y1'].ticks, color: colors.textColor };
      const y1Scale = options.scales['y1'] as any;
      if (y1Scale.title) {
        y1Scale.title.color = colors.textColor;
      }
    }

    this.chart.update('none');
  }

  private getChartColors(isDark: boolean) {
    return {
      priceColor: '#0066e6',
      priceColorAlpha: isDark ? 'rgba(0, 102, 230, 0.2)' : 'rgba(0, 102, 230, 0.1)',
      rateColor: '#22c55e',
      textColor: isDark ? '#f8fafc' : '#0f172a',
      gridColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      borderColor: isDark ? '#334155' : '#e2e8f0',
    };
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('he-IL', {
      month: 'short',
      year: '2-digit'
    }).format(date);
  }
}
