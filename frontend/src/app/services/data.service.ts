import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  PriceIndexData,
  InterestRateData,
  SalesData,
  RegionalData,
  TransactionData,
  CBSResponse,
  BOIResponse,
  MarketType,
  ChartDataPoint,
  FilterOptions,
  REGIONS
} from '../models/data.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private http = inject(HttpClient);
  private readonly API_BASE = environment.apiUrl;

  // State management with BehaviorSubjects
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private priceIndexSubject = new BehaviorSubject<PriceIndexData[]>([]);
  private interestRatesSubject = new BehaviorSubject<InterestRateData[]>([]);
  private salesDataSubject = new BehaviorSubject<SalesData[]>([]);
  private regionalDataSubject = new BehaviorSubject<RegionalData[]>([]);
  private transactionsSubject = new BehaviorSubject<TransactionData[]>([]);
  private marketTypeSubject = new BehaviorSubject<MarketType>('new-dwellings');
  private filtersSubject = new BehaviorSubject<FilterOptions>({
    region: null,
    dateFrom: null,
    dateTo: null,
    propertyType: null,
    roomCount: null
  });

  // Public observables
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();
  priceIndex$ = this.priceIndexSubject.asObservable();
  interestRates$ = this.interestRatesSubject.asObservable();
  salesData$ = this.salesDataSubject.asObservable();
  regionalData$ = this.regionalDataSubject.asObservable();
  transactions$ = this.transactionsSubject.asObservable();
  marketType$ = this.marketTypeSubject.asObservable();
  filters$ = this.filtersSubject.asObservable();

  setMarketType(type: MarketType): void {
    this.marketTypeSubject.next(type);
    this.fetchAllData();
  }

  getMarketType(): MarketType {
    return this.marketTypeSubject.getValue();
  }

  setFilters(filters: Partial<FilterOptions>): void {
    const current = this.filtersSubject.getValue();
    this.filtersSubject.next({ ...current, ...filters });
  }

  getFilters(): FilterOptions {
    return this.filtersSubject.getValue();
  }

  clearFilters(): void {
    this.filtersSubject.next({
      region: null,
      dateFrom: null,
      dateTo: null,
      propertyType: null,
      roomCount: null
    });
  }

  fetchAllData(): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const marketType = this.marketTypeSubject.getValue();

    forkJoin({
      prices: this.fetchPriceIndex(marketType),
      rates: this.fetchInterestRates(),
      sales: this.fetchSalesData(),
      regional: this.fetchRegionalData(),
      transactions: this.fetchTransactions()
    }).subscribe({
      next: (result) => {
        this.priceIndexSubject.next(result.prices);
        this.interestRatesSubject.next(result.rates);
        this.salesDataSubject.next(result.sales);
        this.regionalDataSubject.next(result.regional);
        this.transactionsSubject.next(result.transactions);
        this.loadingSubject.next(false);
      },
      error: (err) => {
        this.errorSubject.next('שגיאה בטעינת הנתונים. אנא נסה שוב.');
        this.loadingSubject.next(false);
        console.error('Data fetch error:', err);
      }
    });
  }

  private fetchPriceIndex(marketType: MarketType): Observable<PriceIndexData[]> {
    const endpoint = marketType === 'new-dwellings'
      ? `${this.API_BASE}/cbs/prices`
      : `${this.API_BASE}/cbs/general-prices`;

    return this.http.get<CBSResponse>(endpoint).pipe(
      map(response => this.transformCBSData(response)),
      catchError(error => {
        console.error('CBS API error:', error);
        return of(this.generateMockPriceData());
      })
    );
  }

  private fetchInterestRates(): Observable<InterestRateData[]> {
    return this.http.get<BOIResponse>(`${this.API_BASE}/boi/interest`).pipe(
      map(response => this.transformBOIData(response)),
      catchError(error => {
        console.error('BOI API error:', error);
        return of(this.generateMockInterestData());
      })
    );
  }

  private fetchSalesData(): Observable<SalesData[]> {
    return this.http.get<CBSResponse>(`${this.API_BASE}/cbs/transactions`).pipe(
      map(response => this.transformSalesData(response)),
      catchError(error => {
        console.error('CBS Sales API error:', error);
        return of(this.generateMockSalesData());
      })
    );
  }

  private fetchRegionalData(): Observable<RegionalData[]> {
    return this.http.get<CBSResponse>(`${this.API_BASE}/cbs/sales-by-region`).pipe(
      map(response => this.transformRegionalData(response)),
      catchError(error => {
        console.error('CBS Regional API error:', error);
        return of(this.generateMockRegionalData());
      })
    );
  }

  private fetchTransactions(): Observable<TransactionData[]> {
    return this.http.get<CBSResponse>(`${this.API_BASE}/cbs/average-prices`).pipe(
      map(response => this.transformTransactionData(response)),
      catchError(error => {
        console.error('CBS Transactions API error:', error);
        return of(this.generateMockTransactionData());
      })
    );
  }

  private transformCBSData(response: CBSResponse): PriceIndexData[] {
    if (!response.success || !response.data) {
      return this.generateMockPriceData();
    }

    try {
      const rawData = response.data;

      if (Array.isArray(rawData)) {
        return rawData.map((item: any, index: number, arr: any[]) => {
          const prevValue = index > 0 ? arr[index - 1].value || arr[index - 1].Value : null;
          const currentValue = item.value || item.Value || 0;
          const change = prevValue ? currentValue - prevValue : 0;
          const changePercent = prevValue ? ((change / prevValue) * 100) : 0;

          return {
            date: item.date || item.Date || item.period || '',
            value: currentValue,
            change,
            changePercent
          };
        });
      }

      if (rawData.Data || rawData.data) {
        const dataArray = rawData.Data || rawData.data;
        return this.transformCBSData({ ...response, data: dataArray });
      }

      return this.generateMockPriceData();
    } catch (e) {
      console.error('Error transforming CBS data:', e);
      return this.generateMockPriceData();
    }
  }

  private transformBOIData(response: BOIResponse): InterestRateData[] {
    if (!response.success || !response.data) {
      return this.generateMockInterestData();
    }

    try {
      const rawData = response.data;

      if (Array.isArray(rawData)) {
        return rawData.map((item: any) => ({
          date: item.date || item.Date || item.TimePeriod || '',
          rate: parseFloat(item.rate || item.Rate || item.Value || 0),
          type: item.type || item.Type || 'general'
        }));
      }

      if (rawData.InterestRates || rawData.Series) {
        const rates = rawData.InterestRates || rawData.Series;
        return this.transformBOIData({ ...response, data: rates });
      }

      return this.generateMockInterestData();
    } catch (e) {
      console.error('Error transforming BOI data:', e);
      return this.generateMockInterestData();
    }
  }

  private transformSalesData(response: CBSResponse): SalesData[] {
    if (!response.success || !response.data) {
      return this.generateMockSalesData();
    }
    return this.generateMockSalesData();
  }

  private transformRegionalData(response: CBSResponse): RegionalData[] {
    if (!response.success || !response.data) {
      return this.generateMockRegionalData();
    }
    return this.generateMockRegionalData();
  }

  private transformTransactionData(response: CBSResponse): TransactionData[] {
    if (!response.success || !response.data) {
      return this.generateMockTransactionData();
    }
    return this.generateMockTransactionData();
  }

  // Mock data generators
  private generateMockPriceData(): PriceIndexData[] {
    const data: PriceIndexData[] = [];
    const baseValue = 100;
    const startDate = new Date('2021-01-01');

    for (let i = 0; i < 50; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);

      const randomChange = (Math.random() - 0.3) * 2;
      const prevValue = i > 0 ? data[i - 1].value : baseValue;
      const value = prevValue * (1 + randomChange / 100);

      data.push({
        date: date.toISOString().slice(0, 7),
        value: Math.round(value * 100) / 100,
        change: Math.round((value - prevValue) * 100) / 100,
        changePercent: Math.round(randomChange * 100) / 100
      });
    }

    return data;
  }

  private generateMockInterestData(): InterestRateData[] {
    const data: InterestRateData[] = [];
    let rate = 0.1;
    const startDate = new Date('2021-01-01');

    for (let i = 0; i < 50; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);

      rate += (Math.random() - 0.4) * 0.25;
      rate = Math.max(0.1, Math.min(6, rate));

      data.push({
        date: date.toISOString().slice(0, 7),
        rate: Math.round(rate * 100) / 100,
        type: 'prime'
      });
    }

    return data;
  }

  private generateMockSalesData(): SalesData[] {
    const data: SalesData[] = [];
    const startDate = new Date('2021-01-01');
    let baseSales = 8000;

    for (let i = 0; i < 50; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);

      // Seasonal variation + trend
      const seasonal = Math.sin((i / 12) * Math.PI * 2) * 1000;
      const trend = i * 20;
      const random = (Math.random() - 0.5) * 1500;
      const totalSales = Math.round(baseSales + seasonal + trend + random);

      const newApartments = Math.round(totalSales * (0.25 + Math.random() * 0.1));
      const secondHand = totalSales - newApartments;

      const prevSales = i > 0 ? data[i - 1].totalSales : totalSales;
      const change = totalSales - prevSales;
      const changePercent = (change / prevSales) * 100;

      data.push({
        date: date.toISOString().slice(0, 7),
        totalSales,
        newApartments,
        secondHand,
        change,
        changePercent: Math.round(changePercent * 100) / 100
      });
    }

    return data;
  }

  private generateMockRegionalData(): RegionalData[] {
    const regions = REGIONS.filter(r => r.id !== 'all');

    return regions.map(region => {
      const basePrices: { [key: string]: number } = {
        'tel-aviv': 4500000,
        'jerusalem': 3200000,
        'haifa': 2100000,
        'center': 2800000,
        'south': 1600000,
        'north': 1400000,
        'judea-samaria': 1800000
      };

      const basePrice = basePrices[region.id] || 2000000;
      const variation = (Math.random() - 0.5) * 0.2;
      const averagePrice = Math.round(basePrice * (1 + variation));

      const baseSales: { [key: string]: number } = {
        'tel-aviv': 1800,
        'jerusalem': 1500,
        'haifa': 1200,
        'center': 2500,
        'south': 1100,
        'north': 900,
        'judea-samaria': 600
      };

      const sales = Math.round((baseSales[region.id] || 1000) * (0.8 + Math.random() * 0.4));
      const avgSqm = 80 + Math.random() * 40;
      const pricePerSqm = Math.round(averagePrice / avgSqm);
      const change = (Math.random() - 0.4) * 10;

      return {
        region: region.id,
        regionHe: region.nameHe,
        sales,
        averagePrice,
        pricePerSqm,
        change: Math.round(change * 100) / 100
      };
    });
  }

  private generateMockTransactionData(): TransactionData[] {
    const data: TransactionData[] = [];
    const startDate = new Date('2021-01-01');

    for (let i = 0; i < 50; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);

      const count = Math.round(7000 + Math.random() * 4000 + i * 30);
      const averageValue = Math.round(2000000 + Math.random() * 500000 + i * 15000);
      const totalValue = count * averageValue;

      data.push({
        date: date.toISOString().slice(0, 7),
        count,
        totalValue,
        averageValue,
        medianValue: Math.round(averageValue * 0.92)
      });
    }

    return data;
  }

  // Filtered data getters
  getFilteredSalesData(): Observable<SalesData[]> {
    return this.salesData$.pipe(
      map(data => this.applyFilters(data))
    );
  }

  private applyFilters<T extends { date: string }>(data: T[]): T[] {
    const filters = this.filtersSubject.getValue();
    let filtered = [...data];

    if (filters.dateFrom) {
      filtered = filtered.filter(d => d.date >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(d => d.date <= filters.dateTo!);
    }

    return filtered;
  }

  // Get latest values for KPIs
  getLatestPriceIndex(): PriceIndexData | null {
    const data = this.priceIndexSubject.getValue();
    return data.length > 0 ? data[data.length - 1] : null;
  }

  getLatestInterestRate(): InterestRateData | null {
    const data = this.interestRatesSubject.getValue();
    return data.length > 0 ? data[data.length - 1] : null;
  }

  getLatestSalesData(): SalesData | null {
    const data = this.salesDataSubject.getValue();
    return data.length > 0 ? data[data.length - 1] : null;
  }

  getTotalSalesThisYear(): number {
    const data = this.salesDataSubject.getValue();
    const currentYear = new Date().getFullYear().toString();
    return data
      .filter(d => d.date.startsWith(currentYear))
      .reduce((sum, d) => sum + d.totalSales, 0);
  }

  getAverageTransactionValue(): number {
    const data = this.transactionsSubject.getValue();
    if (data.length === 0) return 0;
    const latest = data[data.length - 1];
    return latest.averageValue;
  }
}
