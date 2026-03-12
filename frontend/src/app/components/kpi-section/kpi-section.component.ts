import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataService } from '../../services/data.service';

interface KPICard {
  title: string;
  value: string;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  subtitle: string;
}

@Component({
  selector: 'app-kpi-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-section.component.html',
  styleUrl: './kpi-section.component.scss'
})
export class KpiSectionComponent {
  private dataService = inject(DataService);

  priceData = toSignal(this.dataService.priceIndex$, { initialValue: [] });
  interestData = toSignal(this.dataService.interestRates$, { initialValue: [] });
  salesData = toSignal(this.dataService.salesData$, { initialValue: [] });
  transactionsData = toSignal(this.dataService.transactions$, { initialValue: [] });
  loading = toSignal(this.dataService.loading$, { initialValue: false });
  marketType = toSignal(this.dataService.marketType$, { initialValue: 'new-dwellings' as const });

  kpiCards = computed<KPICard[]>(() => {
    const prices = this.priceData();
    const rates = this.interestData();
    const sales = this.salesData();
    const transactions = this.transactionsData();

    const cards: KPICard[] = [];

    // Price Index KPI
    if (prices.length > 0) {
      const latest = prices[prices.length - 1];
      const previous = prices.length > 1 ? prices[prices.length - 2] : null;
      const change = previous ? latest.value - previous.value : 0;
      const changePercent = previous ? ((change / previous.value) * 100) : 0;

      cards.push({
        title: this.marketType() === 'new-dwellings' ? 'מדד מחירי דירות חדשות' : 'מדד מחירי דירות כללי',
        value: latest.value.toFixed(2),
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
        icon: 'home',
        subtitle: `נכון ל-${this.formatDate(latest.date)}`
      });
    }

    // Monthly Sales KPI
    if (sales.length > 0) {
      const latest = sales[sales.length - 1];
      const previous = sales.length > 1 ? sales[sales.length - 2] : null;
      const change = previous ? latest.totalSales - previous.totalSales : 0;
      const changePercent = previous ? ((change / previous.totalSales) * 100) : 0;

      cards.push({
        title: 'מכירות חודשיות',
        value: latest.totalSales.toLocaleString('he-IL'),
        change,
        changePercent: Math.round(changePercent * 100) / 100,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
        icon: 'sales',
        subtitle: `${this.formatDate(latest.date)}`
      });
    }

    // Average Transaction Value KPI
    if (transactions.length > 0) {
      const latest = transactions[transactions.length - 1];
      const previous = transactions.length > 1 ? transactions[transactions.length - 2] : null;
      const change = previous ? latest.averageValue - previous.averageValue : 0;
      const changePercent = previous ? ((change / previous.averageValue) * 100) : 0;

      cards.push({
        title: 'מחיר עסקה ממוצע',
        value: `₪${(latest.averageValue / 1000000).toFixed(2)}M`,
        change,
        changePercent: Math.round(changePercent * 100) / 100,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
        icon: 'money',
        subtitle: 'ממוצע ארצי'
      });
    }

    // Interest Rate KPI
    if (rates.length > 0) {
      const latest = rates[rates.length - 1];
      const previous = rates.length > 1 ? rates[rates.length - 2] : null;
      const change = previous ? latest.rate - previous.rate : 0;

      cards.push({
        title: 'ריבית בנק ישראל',
        value: `${latest.rate.toFixed(2)}%`,
        change: Math.round(change * 100) / 100,
        changePercent: previous ? ((change / previous.rate) * 100) : 0,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
        icon: 'percent',
        subtitle: `נכון ל-${this.formatDate(latest.date)}`
      });
    }

    // Year over Year Price Change
    if (prices.length > 12) {
      const latest = prices[prices.length - 1];
      const yearAgo = prices[prices.length - 13];
      const yoyChange = latest.value - yearAgo.value;
      const yoyPercent = (yoyChange / yearAgo.value) * 100;

      cards.push({
        title: 'שינוי שנתי במחירים',
        value: `${yoyPercent >= 0 ? '+' : ''}${yoyPercent.toFixed(1)}%`,
        change: yoyChange,
        changePercent: yoyPercent,
        trend: yoyChange > 0 ? 'up' : yoyChange < 0 ? 'down' : 'neutral',
        icon: 'trending',
        subtitle: 'לעומת לפני שנה'
      });
    }

    // Estimated Mortgage Rate
    if (rates.length > 0) {
      const latest = rates[rates.length - 1];
      const previous = rates.length > 1 ? rates[rates.length - 2] : null;
      const change = previous ? latest.rate - previous.rate : 0;
      const avgMortgageRate = latest.rate + 1.5;

      cards.push({
        title: 'ריבית משכנתא משוערת',
        value: `${avgMortgageRate.toFixed(2)}%`,
        change,
        changePercent: 0,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
        icon: 'bank',
        subtitle: 'ריבית פריים + מרווח'
      });
    }

    return cards;
  });

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('he-IL', {
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  getTrendClass(trend: 'up' | 'down' | 'neutral'): string {
    switch (trend) {
      case 'up': return 'trend-up';
      case 'down': return 'trend-down';
      default: return 'trend-neutral';
    }
  }

  getCardClass(trend: 'up' | 'down' | 'neutral'): string {
    switch (trend) {
      case 'up': return 'positive';
      case 'down': return 'negative';
      default: return '';
    }
  }
}
