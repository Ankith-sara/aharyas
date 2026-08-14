export interface Address {
  _id?: string;
  label?: string;
  Name?: string;
  email?: string;
  street?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  zip?: string;
  country?: string;
  phone?: string;
  geolocation?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  } | null;
}

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'seller';
  phone?: string;
  image?: string;
  addresses?: Address[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discount: number;
  category: string;
  subCategory: string;
  sizes: string[];
  bestseller: boolean;
  onSale?: boolean;
  inStock?: boolean;
  images: string[];
  date: number;
  createdAt?: string | number;
  viewCount?: number;
  popularity?: number;
  rating?: number;
  company?: string;
  tags?: string[];
  slug?: string;
  isVisible?: boolean;
}

export interface CartSizeMap {
  [size: string]: number;
}

export interface CartItemsState {
  [productId: string]: CartSizeMap;
}

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  discount: number;
  size: string;
  quantity: number;
  images: string[];
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  quantity: number;
  size: string;
  image?: string | null;
}

export type OrderStatus =
  | 'Order Placed'
  | 'Packing'
  | 'Shipped'
  | 'Out for delivery'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod = 'COD' | 'Razorpay' | 'Stripe';

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  amount: number;
  discount?: number;
  couponCode?: string | null;
  address: Address;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  payment: boolean;
  date: number;
  trackingId?: string;
  estimatedDelivery?: string;
}

export interface Coupon {
  code: string;
  discount: number;
  type: 'fixed' | 'percentage' | 'flat';
  minAmount?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

export interface VercelAnalyticsData {
  byDay?: Array<{ day: string; pageviews: number; visitors: number }>;
  byPath?: Array<{ requestPath: string; pageviews: number; visitors: number }>;
  byDevice?: Array<{ deviceType: string; pageviews: number }>;
  byCountry?: Array<{ country: string; pageviews: number; visitors: number }>;
  byReferrer?: Array<{ referrerHostname: string; pageviews: number }>;
}

export interface AdminAnalyticsData {
  totalRevenue: number;
  todayRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  monthlySales: Array<{ _id: { month: number; year: number }; revenue: number; count: number }>;
  categoryBreakdown: Array<{ _id: string; count: number }>;
}
