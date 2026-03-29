export interface DeliveryChargeM {
  id?: number;
  name: string;
  amount: number;
  isActive: boolean;
  siteSettingId?: number;
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
  address1?: string;
  address2?: string;
  email?: string;
  phoneNumber1?: string;
  phoneNumber2?: string;
  phoneNumber3?: string;
  facebookLink?: string;
  othersLink1?: string;
  othersLink2?: string;
  deliveryCharges?: DeliveryChargeM[];
}