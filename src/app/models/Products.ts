export interface Product {
  id: any;
  name: string;
  regularPrice: number;
  offerPrice: number;
  image: string;
  images: string[];
  shortDescription: string;
  productDetails: string;
  category: string;
  sizes: string[];
  colors: string[];
  brand: string;
  isFeatured: boolean;
  serial: number;
  relatedProducts: number[];
  specifications: Specification[];
  sku: string;
  availability: 'in stock' | 'out of stock' | 'pre-order' | string; // flexible
  createdDate: string | Date;
  updatedDate: string | Date;
  purchasedQuantity: number;
  totalSales: number;
  youtubeLink: string;
  facebookPost: string;
  twitterTweet: string;
  instagramPost: string;
  others: string;
  isActive: boolean;
}

/** Nested Specification structure */
export interface Specification {
  title: string;
  content: SpecificationItem[];
}

/** Nested content items under each specification */
export interface SpecificationItem {
  item: string;
  value: string;
}