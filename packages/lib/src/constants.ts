export const SHIPPING_FEE = 2500;
export const STORE_PICKUP_FEE = 0;

export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
export type SizeOption = (typeof SIZE_OPTIONS)[number];

export const LOW_STOCK_THRESHOLD = 5;
export const SHIPPING_DELIVERY_DAYS = '1–3 business days';
export const GUEST_CART_STORAGE_KEY = 'khit:guest-cart';
export const GUEST_CART_VERSION = 1;

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const DELIVERY_METHODS = ['shipping', 'pickup'] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export const PAYMENT_METHODS = ['cod'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_INVENTORY_PAGE_SIZE = 50;
