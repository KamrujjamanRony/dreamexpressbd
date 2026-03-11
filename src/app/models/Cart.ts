export interface CartM{
    id?: number;
    userId: any;
    subtotal: number;
    discountToken: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    totalAmount: number;
    products: CartProductM[];
}

export interface CartProductM{
    id?: number;
    productId: number;
    selectSize: string;
    selectColor: string;
    quantity: number;
    price: number;
    totalPrice: number;
}