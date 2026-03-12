import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, FormControl, FormsModule } from '@angular/forms';

interface Option {
  key: string;
  value: string;
}

@Component({
  selector: 'multi-select',
  imports: [FormsModule],
  templateUrl: './multi-select.html',
  styleUrl: './multi-select.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiSelect),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MultiSelect),
      multi: true
    }
  ]
})
export class MultiSelect {
  @Input() placeholder: string = 'Select options';
  @Input() options: Option[] = []; // Change to Option array

  selectedOptions: Option[] = []; // Change to Option array
  isDropdownOpen = false;
  filteredOptions: Option[] = [];

  private onChange: (value: any) => void = () => { };
  private onTouched: () => void = () => { };

  ngOnInit() {
    this.filterOptions();
  }

  toggleDropdown(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) {
      this.filterOptions();
    }
  }

  filterOptions() {
    // Show only options that haven't been selected
    this.filteredOptions = this.options.filter(option =>
      !this.selectedOptions.some(selected => selected.key === option.key)
    );
  }

  selectOption(option: Option) {
    if (!this.selectedOptions.some(selected => selected.key === option.key)) {
      this.selectedOptions.push(option);
      this.onChange(this.selectedOptions);
      this.onTouched();
      this.filterOptions();
    }
  }

  removeOption(option: Option) {
    const index = this.selectedOptions.findIndex(selected => selected.key === option.key);
    if (index > -1) {
      this.selectedOptions.splice(index, 1);
      this.onChange(this.selectedOptions);
      this.onTouched();
      this.filterOptions();
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: Option[] | string[]): void {
    if (value && value.length > 0) {
      // Handle both cases: array of objects or array of strings
      if (typeof value[0] === 'string') {
        // If value is string[], map to Option[]
        this.selectedOptions = this.options.filter(option => 
          (value as string[]).includes(option.key)
        );
      } else {
        // If value is already Option[]
        this.selectedOptions = [...value as Option[]];
      }
    } else {
      this.selectedOptions = [];
    }
    this.filterOptions();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Implement if needed
  }

  validate(control: FormControl) {
    return null;
  }
}