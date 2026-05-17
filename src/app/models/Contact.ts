export interface DeliveryChargeM {
  id?: number;
  name: string;
  amount: number;
  isActive: boolean;
  siteSettingId?: number;
}

export interface QuickInfoM {
  id?: number;
  title: string;
  description: string;
  icon: string;
}

export interface FaqM {
  id?: number;
  question: string;
  answer: string;
}

export interface ContactCardM {
  id?: number;
  type: string;
  title: string;
  value: string;
}

export interface ContactUsM {
  fullName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactM {
  id?: number;
  companyID: number;
  facebookLink?: string;
  iLink?: string;
  yLink?: string;
  wNum?: string;
  lat?: number;
  lng?: number;
  mapUrl?: string;
  othersLink1?: string;
  othersLink2?: string;
  quickInfo?: QuickInfoM[];
  faqs?: FaqM[];
  contactCards?: ContactCardM[];
  deliveryCharges?: DeliveryChargeM[];
}