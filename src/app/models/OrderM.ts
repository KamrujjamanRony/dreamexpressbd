// models/OrderM.ts
export interface OrderM {
    id?: number;
    companyID: number;
    userId: string;
    userEmail: string;
    userName: string;
    userPhone: string;
    subtotal: number;
    deliveryCharge: number;
    discountToken?: string;
    discountType?: string;
    discountValue?: number;
    discountAmount?: number;
    totalAmount: number;
    paymentMethod: string;
    orderStatus: string;
    orderDate: string;
    shippingAddress: ShippingAddressM;
    orderItems: OrderItemM[];
}

export interface ShippingAddressM {
    district: string;
    city: string;
    street: string;
    contact: string;
    type?: string;
}

export interface OrderItemM {
    productId: number;
    productName: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
    image: string;
}