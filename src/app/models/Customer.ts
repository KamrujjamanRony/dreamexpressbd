export interface CustomerM {
    id?: any;
    companyID: number;
    fullName: string;
    phone: string;
    pass: string;
    dist: string;
    address: string;
    shippingDistrict?: string;
    shippingCity?: string;
    shippingStreet?: string;
    shippingContact?: string;
    shippingType?: string;
    area?: string;
    token?: string;
}