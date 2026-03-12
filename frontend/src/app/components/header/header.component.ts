import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { DataService } from '../../services/data.service';
import { MarketType } from '../../models/data.models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  themeService = inject(ThemeService);
  dataService = inject(DataService);

  marketType$ = this.dataService.marketType$;

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  setMarketType(type: MarketType): void {
    this.dataService.setMarketType(type);
  }
}
