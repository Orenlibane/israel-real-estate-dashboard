import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { REGIONS, ROOM_OPTIONS, PropertyType } from '../../models/data.models';

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filters.component.html',
  styleUrl: './filters.component.scss'
})
export class FiltersComponent {
  private dataService = inject(DataService);

  regions = REGIONS;
  roomOptions = ROOM_OPTIONS;

  selectedRegion = signal<string>('all');
  selectedRooms = signal<string>('all');
  selectedPropertyType = signal<PropertyType>('all');
  dateFrom = signal<string>('');
  dateTo = signal<string>('');

  isExpanded = signal(false);

  propertyTypes: { id: PropertyType; label: string }[] = [
    { id: 'all', label: 'הכל' },
    { id: 'new', label: 'דירות חדשות' },
    { id: 'second-hand', label: 'יד שנייה' }
  ];

  toggleExpand(): void {
    this.isExpanded.update(v => !v);
  }

  onRegionChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedRegion.set(select.value);
    this.applyFilters();
  }

  onRoomsChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedRooms.set(select.value);
    this.applyFilters();
  }

  onPropertyTypeChange(type: PropertyType): void {
    this.selectedPropertyType.set(type);
    this.applyFilters();
  }

  onDateFromChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.dateFrom.set(input.value);
    this.applyFilters();
  }

  onDateToChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.dateTo.set(input.value);
    this.applyFilters();
  }

  applyFilters(): void {
    this.dataService.setFilters({
      region: this.selectedRegion() === 'all' ? null : this.selectedRegion(),
      roomCount: this.selectedRooms() === 'all' ? null : this.selectedRooms(),
      propertyType: this.selectedPropertyType() === 'all' ? null : this.selectedPropertyType(),
      dateFrom: this.dateFrom() || null,
      dateTo: this.dateTo() || null
    });
  }

  clearFilters(): void {
    this.selectedRegion.set('all');
    this.selectedRooms.set('all');
    this.selectedPropertyType.set('all');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.dataService.clearFilters();
  }

  hasActiveFilters(): boolean {
    return (
      this.selectedRegion() !== 'all' ||
      this.selectedRooms() !== 'all' ||
      this.selectedPropertyType() !== 'all' ||
      this.dateFrom() !== '' ||
      this.dateTo() !== ''
    );
  }
}
