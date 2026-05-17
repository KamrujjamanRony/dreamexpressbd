export interface CustomerM {
    id?: any;
    companyID: number;
    fullName: string;
    email: string;
    pass: string;
    loginProvider?: string;
    providerKey?: string;
    profileImage?: string;
    token?: string;
    address: string;
    shippingDistrict?: string;
    shippingCity?: string;
    shippingStreet?: string;
    shippingContact?: string;
    shippingType?: string;
    area?: string;
}