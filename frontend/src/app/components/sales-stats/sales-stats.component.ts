import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Chart, registerables } from 'chart.js';
import { DataService } from '../../services/data.service';
import { ThemeService } from '../../services/theme.service';

Chart.register(...registerables);

@Component({
  selector: 'app-sales-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-stats.component.html',
  styleUrl: './sales-stats.component.scss'
})
export class SalesStatsComponent implements OnInit, OnDestroy {
  @ViewChild('salesChart', { static: true }) salesChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('compositionChart', { static: true }) compositionChartCanvas!: ElementRef<HTMLCanvasElement>;

  private dataService = inject(DataService);
  private themeService = inject(ThemeService);

  private salesChart: Chart | null = null;
  private compositionChart: Chart | null = null;

  salesData = toSignal(this.dataService.salesData$, { initialValue: [] });
  loading = toSignal(this.dataService.loading$, { initialValue: false });

  constructor() {
    effect(() => {
      const data = this.salesData();
      const isDark = this.themeService.isDarkMode();

      if (data.length > 0) {
        this.updateCharts(data, isDark);
      }
    });
  }

  ngOnInit(): void {
    this.initCharts();
  }

  ngOnDestroy(): void {
    this.salesChart?.destroy();
    this.compositionChart?.destroy();
  }

  private initCharts(): void {
    this.initSalesChart();
    this.initCompositionChart();
  }

  private initSalesChart(): void {
    const ctx = this.salesChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const isDark = this.themeService.isDarkMode();
    const colors = this.getChartColors(isDark);

    this.salesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'דירות חדשות',
            data: [],
            backgroundColor: colors.newColor,
            borderRadius: 4,
          },
          {
            label: 'יד שנייה',
            data: [],
            backgroundColor: colors.secondHandColor,
            borderRadius: 4,
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
              font: { family: 'Rubik, Inter, sans-serif', size: 12 },
              usePointStyle: true,
              padding: 20,
            }
          },
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
                const value = context.parsed.y;
                return `${context.dataset.label}: ${value?.toLocaleString('he-IL') || 0} דירות`;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: {
              color: colors.textColor,
              font: { family: 'Rubik, Inter, sans-serif', size: 11 },
            }
          },
          y: {
            stacked: true,
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.textColor,
              font: { family: 'Rubik, Inter, sans-serif', size: 11 },
              callback: (value) => value.toLocaleString('he-IL')
            }
          }
        }
      }
    });
  }

  private initCompositionChart(): void {
    const ctx = this.compositionChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const isDark = this.themeService.isDarkMode();
    const colors = this.getChartColors(isDark);

    this.compositionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['דירות חדשות', 'יד שנייה'],
        datasets: [{
          data: [0, 0],
          backgroundColor: [colors.newColor, colors.secondHandColor],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            rtl: true,
            labels: {
              color: colors.textColor,
              font: { family: 'Rubik, Inter, sans-serif', size: 12 },
              usePointStyle: true,
              padding: 20,
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

  private updateCharts(data: any[], isDark: boolean): void {
    const colors = this.getChartColors(isDark);

    // Take last 12 months
    const recentData = data.slice(-12);
    const labels = recentData.map(d => this.formatDate(d.date));
    const newApartments = recentData.map(d => d.newApartments);
    const secondHand = recentData.map(d => d.secondHand);

    // Update sales chart
    if (this.salesChart) {
      this.salesChart.data.labels = labels;
      this.salesChart.data.datasets[0].data = newApartments;
      this.salesChart.data.datasets[0].backgroundColor = colors.newColor;
      this.salesChart.data.datasets[1].data = secondHand;
      this.salesChart.data.datasets[1].backgroundColor = colors.secondHandColor;

      const options = this.salesChart.options;
      if (options.plugins?.legend?.labels) {
        options.plugins.legend.labels.color = colors.textColor;
      }
      if (options.scales?.['x']?.ticks) {
        options.scales['x'].ticks.color = colors.textColor;
      }
      if (options.scales?.['y']) {
        options.scales['y'].grid = { color: colors.gridColor };
        options.scales['y'].ticks = { ...options.scales['y'].ticks, color: colors.textColor };
      }

      this.salesChart.update('none');
    }

    // Update composition chart with totals
    if (this.compositionChart) {
      const totalNew = recentData.reduce((sum, d) => sum + d.newApartments, 0);
      const totalSecondHand = recentData.reduce((sum, d) => sum + d.secondHand, 0);

      this.compositionChart.data.datasets[0].data = [totalNew, totalSecondHand];
      this.compositionChart.data.datasets[0].backgroundColor = [colors.newColor, colors.secondHandColor];

      if (this.compositionChart.options.plugins?.legend?.labels) {
        this.compositionChart.options.plugins.legend.labels.color = colors.textColor;
      }

      this.compositionChart.update('none');
    }
  }

  private getChartColors(isDark: boolean) {
    return {
      newColor: '#0066e6',
      secondHandColor: '#22c55e',
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

  getTotalSales(): number {
    const data = this.salesData();
    if (data.length === 0) return 0;
    return data.slice(-12).reduce((sum, d) => sum + d.totalSales, 0);
  }

  getAverageMonthlySales(): number {
    const data = this.salesData();
    if (data.length === 0) return 0;
    const recent = data.slice(-12);
    return Math.round(recent.reduce((sum, d) => sum + d.totalSales, 0) / recent.length);
  }
}
