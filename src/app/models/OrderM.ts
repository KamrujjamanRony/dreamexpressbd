export interface OrderM{
    id: number;
    companyID: number;
    userID: number;
    userEmail: string;
    userName: string;
    userPhone: string;
    subtotal: number;
    deliveryCharge: number;
    discountToken: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    totalAmount: number;
    paymentMethod: string;
    orderStatus: string;
    orderDate: Date;
    shippingAddress: ShippingAddressM;
    orderItems: OrderItemM[];
}

export interface ShippingAddressM{
    contact: string;
    district: string;
    city: string;
    state: string;
    type: string;
}

export interface OrderItemM{
    id: number;
    productId: number;
    productName: string;
    quantity: number;
    price: number;
    size: string;
    color: string;
    image: string;
}