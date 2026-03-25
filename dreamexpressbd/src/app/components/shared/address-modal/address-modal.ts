import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SData } from '../../../services/s-data';

interface Address {
  id: string;
  type: string;
  street: string;
  contact: string;
  isDefault: boolean;
  userId: string;
  division: string;  // Region name (e.g., "Dhaka")
  district: string;  // City name (e.g., "Dhaka-North")
  city: string;      // Area name (e.g., "Mohammadpur Mohammadia Non Housing Area")
}

interface Location {
  name: string;
  parent?: string;
}

@Component({
  selector: 'app-address-modal',
  imports: [FormsModule],
  templateUrl: './address-modal.html',
  styleUrl: './address-modal.css',
})
export class AddressModal {
  @Input() address: Address | null = null;
  @Input() isEditMode: boolean = false;
  @Output() submit = new EventEmitter<Address>();
  @Output() close = new EventEmitter<void>();

  private dataService = inject(SData);
  private cdr = inject(ChangeDetectorRef);

  showModal = true;
  regions: Location[] = [];
  cities: Location[] = [];
  areas: Location[] = [];
  isLoading = false;

  addressTypes = [
    { label: 'Home', value: 'Home' },
    { label: 'Work', value: 'Work' },
    { label: 'Other', value: 'Other' }
  ];

  formData = {
    id: '',
    userId: '',
    region: '',      // division in your data
    city: '',        // district in your data
    area: '',        // city in your data
    street: '',
    contact: '',
    type: 'Home',
    isDefault: false
  };

  async ngOnInit() {
    await this.loadRegions();
    if (this.address) {
      await this.initializeFormWithAddress();
    }
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['address'] && this.address && this.regions.length) {
      await this.initializeFormWithAddress();
    }
  }

  private async initializeFormWithAddress() {
    this.isLoading = true;
    try {
      // Set basic form data
      this.formData = {
        id: this.address?.id || '',
        type: this.address?.type || 'Home',
        street: this.address?.street || '',
        userId: this.address?.userId || '',
        contact: this.address?.contact || '',
        isDefault: this.address?.isDefault || false,
        region: this.address?.division || '',
        city: this.address?.district || '',
        area: this.address?.city || ''
      };

      // Load cities for the selected region
      if (this.formData.region) {
        await this.loadCities(this.formData.region);
      }

      // Load areas for the selected city
      if (this.formData.city) {
        await this.loadAreas(this.formData.city);
      }

    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private async loadRegions(): Promise<void> {
    this.isLoading = true;
    try {
      this.regions = await this.dataService.getRegions().toPromise() || [];
    } catch (error) {
      console.error('Error loading regions:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async onRegionChange(regionName: string) {
    this.formData.city = '';
    this.formData.area = '';
    this.cities = [];
    this.areas = [];

    if (regionName) {
      await this.loadCities(regionName);
    }
    this.cdr.detectChanges();
  }

  private async loadCities(regionName: string): Promise<void> {
    this.isLoading = true;
    try {
      this.cities = await this.dataService.getCitiesByRegion(regionName).toPromise() || [];
    } catch (error) {
      console.error('Error loading cities:', error);
      this.cities = [];
    } finally {
      this.isLoading = false;
    }
  }

  async onCityChange(cityName: string) {
    this.formData.area = '';
    this.areas = [];

    if (cityName) {
      await this.loadAreas(cityName);
    }
    this.cdr.detectChanges();
  }

  private async loadAreas(cityName: string): Promise<void> {
    this.isLoading = true;
    try {
      this.areas = await this.dataService.getAreasByCity(cityName).toPromise() || [];
    } catch (error) {
      console.error('Error loading areas:', error);
      this.areas = [];
    } finally {
      this.isLoading = false;
    }
  }

  onSubmit() {
    if (this.validateForm()) {
      const submissionData: Address = {
        id: this.formData.id || crypto.randomUUID(),
        type: this.formData.type,
        street: this.formData.street,
        contact: this.formData.contact,
        isDefault: this.formData.isDefault,
        userId: this.formData.userId || '',
        division: this.formData.region,
        district: this.formData.city,
        city: this.formData.area
      };

      this.submit.emit(submissionData);
      this.resetForm();
    }
  }

  onClose() {
    this.close.emit();
    this.resetForm();
  }

  private resetForm() {
    this.formData = {
      id: '',
      userId: '',
      region: '',
      city: '',
      area: '',
      street: '',
      contact: '',
      type: 'Home',
      isDefault: false
    };
    this.cities = [];
    this.areas = [];
  }

  private validateForm(): boolean {
    const requiredFields = ['region', 'city', 'street', 'contact'];
    const missingFields = requiredFields.filter(field => !this.formData[field as keyof typeof this.formData]);

    if (missingFields.length > 0) {
      alert(`Please fill all required fields: ${missingFields.join(', ')}`);
      return false;
    }

    if (!/^\d{10,15}$/.test(this.formData.contact)) {
      alert('Please enter a valid phone number (10-15 digits)');
      return false;
    }

    return true;
  }

}
