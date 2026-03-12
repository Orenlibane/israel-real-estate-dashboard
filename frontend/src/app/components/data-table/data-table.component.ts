import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataService } from '../../services/data.service';
import { PriceIndexData, InterestRateData } from '../../models/data.models';

interface TableRow {
  date: string;
  formattedDate: string;
  priceIndex: number | null;
  priceChange: number | null;
  priceChangePercent: number | null;
  interestRate: number | null;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss'
})
export class DataTableComponent {
  private dataService = inject(DataService);

  priceData = toSignal(this.dataService.priceIndex$, { initialValue: [] });
  interestData = toSignal(this.dataService.interestRates$, { initialValue: [] });
  loading = toSignal(this.dataService.loading$, { initialValue: false });
  marketType = toSignal(this.dataService.marketType$, { initialValue: 'new-dwellings' as const });

  searchQuery = signal('');
  sortColumn = signal<keyof TableRow>('date');
  sortDirection = signal<'asc' | 'desc'>('desc');

  tableData = computed<TableRow[]>(() => {
    const prices = this.priceData();
    const rates = this.interestData();

    const ratesMap = new Map(rates.map(r => [r.date, r.rate]));

    return prices.map((p, index) => {
      const prevPrice = index > 0 ? prices[index - 1] : null;
      const change = prevPrice ? p.value - prevPrice.value : null;
      const changePercent = prevPrice && change !== null
        ? (change / prevPrice.value) * 100
        : null;

      return {
        date: p.date,
        formattedDate: this.formatDate(p.date),
        priceIndex: p.value,
        priceChange: change !== null ? Math.round(change * 100) / 100 : null,
        priceChangePercent: changePercent !== null ? Math.round(changePercent * 100) / 100 : null,
        interestRate: ratesMap.get(p.date) || null
      };
    });
  });

  filteredData = computed(() => {
    const data = this.tableData();
    const query = this.searchQuery().toLowerCase();

    let filtered = query
      ? data.filter(row =>
          row.formattedDate.toLowerCase().includes(query) ||
          row.date.includes(query)
        )
      : data;

    // Sort
    const column = this.sortColumn();
    const direction = this.sortDirection();

    return [...filtered].sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];

      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  });

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  sort(column: keyof TableRow): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('desc');
    }
  }

  getSortIcon(column: keyof TableRow): string {
    if (this.sortColumn() !== column) return 'neutral';
    return this.sortDirection();
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('he-IL', {
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  getTrendClass(value: number | null): string {
    if (value === null) return '';
    if (value > 0) return 'trend-up';
    if (value < 0) return 'trend-down';
    return '';
  }

  exportCSV(): void {
    const data = this.filteredData();
    const headers = ['תאריך', 'מדד מחירים', 'שינוי', 'שינוי %', 'ריבית'];

    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.date,
        row.priceIndex ?? '',
        row.priceChange ?? '',
        row.priceChangePercent ?? '',
        row.interestRate ?? ''
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `real-estate-data-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }
}
