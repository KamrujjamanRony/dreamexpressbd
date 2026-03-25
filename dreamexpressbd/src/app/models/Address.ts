export interface AddressM {
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

export interface LocationM {
  name: string;
  parent?: string;
}