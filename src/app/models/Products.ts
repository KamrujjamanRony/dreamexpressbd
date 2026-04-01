export interface ProductM {
  id: any;
  companyID: any;
  title: string;
  postBy: string;
  description: string;
  imageUrl: string;           // gallery ID (send as-is to API)
  resolvedImageUrl?: string;  // resolved display URL (populated by service)
  categoryId: number;
  sl: number;
  brand: string;
  model: string;
  origin: string;
  additionalInformation: string;
  specialFeature: string;
  catalogURL: string;
  sku: string;
  sizes: string;
  others: string;
  regularPrice: number;
  offerPrice: number;
  images: string[];            // gallery IDs
  resolvedImages?: string[];   // resolved display URLs
  relatedProducts: any[];
  productColors: ProductColorM[];
  youtubeLink: string;
  facebookPost: string;
  isActive: any;
}

/** Product color variant — id is a gallery ID */
export interface ProductColorM {
  cn: string;           // color name
  id: string;           // gallery ID for color swatch image
  resolvedUrl?: string; // resolved display URL (populated by service)
}