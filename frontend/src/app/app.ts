import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { KpiSectionComponent } from './components/kpi-section/kpi-section.component';
import { CorrelationChartComponent } from './components/correlation-chart/correlation-chart.component';
import { DataTableComponent } from './components/data-table/data-table.component';
import { FiltersComponent } from './components/filters/filters.component';
import { SalesStatsComponent } from './components/sales-stats/sales-stats.component';
import { RegionalChartComponent } from './components/regional-chart/regional-chart.component';
import { DataService } from './services/data.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    KpiSectionComponent,
    CorrelationChartComponent,
    DataTableComponent,
    FiltersComponent,
    SalesStatsComponent,
    RegionalChartComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private dataService = inject(DataService);
  private themeService = inject(ThemeService);

  error$ = this.dataService.error$;

  ngOnInit(): void {
    this.dataService.fetchAllData();
  }

  retry(): void {
    this.dataService.fetchAllData();
  }
}
