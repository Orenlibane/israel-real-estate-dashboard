export interface PriceIndexData {
  date: string;
  value: number;
  change?: number;
  changePercent?: number;
}

export interface InterestRateData {
  date: string;
  rate: number;
  type?: string;
}

export interface SalesData {
  date: string;
  totalSales: number;
  newApartments: number;
  secondHand: number;
  change?: number;
  changePercent?: number;
}

export interface RegionalData {
  region: string;
  regionHe: string;
  sales: number;
  averagePrice: number;
  pricePerSqm: number;
  change?: number;
}

export interface ApartmentsByRooms {
  date: string;
  rooms: {
    [key: string]: number; // '1-2', '3', '4', '5+'
  };
}

export interface TransactionData {
  date: string;
  count: number;
  totalValue: number;
  averageValue: number;
  medianValue?: number;
}

export interface FilterOptions {
  region: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  propertyType: PropertyType | null;
  roomCount: string | null;
}

export type PropertyType = 'all' | 'new' | 'second-hand';

export type Region =
  | 'all'
  | 'tel-aviv'
  | 'jerusalem'
  | 'haifa'
  | 'center'
  | 'south'
  | 'north'
  | 'judea-samaria';

export const REGIONS: { id: Region; nameHe: string; nameEn: string }[] = [
  { id: 'all', nameHe: 'כל הארץ', nameEn: 'All Israel' },
  { id: 'tel-aviv', nameHe: 'תל אביב', nameEn: 'Tel Aviv' },
  { id: 'jerusalem', nameHe: 'ירושלים', nameEn: 'Jerusalem' },
  { id: 'haifa', nameHe: 'חיפה', nameEn: 'Haifa' },
  { id: 'center', nameHe: 'מרכז', nameEn: 'Center' },
  { id: 'south', nameHe: 'דרום', nameEn: 'South' },
  { id: 'north', nameHe: 'צפון', nameEn: 'North' },
  { id: 'judea-samaria', nameHe: 'יהודה ושומרון', nameEn: 'Judea & Samaria' },
];

export const ROOM_OPTIONS = [
  { id: 'all', label: 'הכל' },
  { id: '1-2', label: '1-2 חדרים' },
  { id: '3', label: '3 חדרים' },
  { id: '4', label: '4 חדרים' },
  { id: '5+', label: '5+ חדרים' },
];

export interface CBSResponse {
  success: boolean;
  data: any;
  source: string;
  indexId?: string;
  description: string;
  error?: string;
  message?: string;
}

export interface BOIResponse {
  success: boolean;
  data: any;
  source: string;
  error?: string;
  message?: string;
}

export interface DashboardData {
  priceIndex: PriceIndexData[];
  interestRates: InterestRateData[];
  sales: SalesData[];
  regionalData: RegionalData[];
  transactions: TransactionData[];
  lastUpdated: Date;
}

export interface KPIData {
  title: string;
  value: string | number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
  subtitle?: string;
  icon?: string;
}

export interface ChartDataPoint {
  date: string;
  priceIndex: number;
  interestRate: number;
  sales?: number;
}

export type MarketType = 'new-dwellings' | 'general';

export interface AppState {
  loading: boolean;
  error: string | null;
  marketType: MarketType;
  darkMode: boolean;
  filters: FilterOptions;
}
