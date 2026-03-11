export interface ProductM {
  id: any;
  companyID: any;
  title: string;
  description: string;
  imageUrl: string;
  itemId: number;
  slItem: number;
  itemName: string;
  brand: string;
  model: string;
  origin: string;
  additionalInformation: string;
  specialFeature: string;
  catalogURL: string;
  sl: number;
  sku: string;
  sizes: string;
  regularPrice: number;
  offerPrice: number;
  image: string;
  images: string[];
  relatedProducts: number[];
  productsColors: ProductColorsM[];
  youtubeLink: string;
  facebookPost: string;
  others: string;
  isActive: boolean;
}


/** Nested content items under each specification */
export interface ProductColorsM {
  colorName: string;
  image: string;
}