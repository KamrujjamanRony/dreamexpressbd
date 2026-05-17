export interface WishlistM {
    id?: number;
    companyID: number;
    userId: string;
    products: WishlistProductM[];
}

export interface WishlistProductM {
    productId: string;
    selectSize: string;
    selectColor: string;
}
