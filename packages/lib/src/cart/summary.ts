import { SHIPPING_FEE, STORE_PICKUP_FEE, type DeliveryMethod } from '../constants';

export interface CartSummaryItem {
  unitPrice: number;
  quantity: number;
}

export interface CartSummary {
  subtotal: number;
  shippingFee: number;
  total: number;
}

/**
 * Compute exact-arithmetic cart totals for display.
 *
 * Money is kept as exact integers through the entire cart pipeline (Convex
 * snapshots, order creation, etc.). Only the `formatMMK()` display helper
 * rounds to the nearest 100 Ks for visual output, per Phase 1 decision #9.
 * This means `subtotal` here is the precise sum of `unitPrice * quantity`
 * and may not be a multiple of 100.
 */
export function computeCartSummary(
  items: CartSummaryItem[],
  deliveryMethod: DeliveryMethod
): CartSummary {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shippingFee = deliveryMethod === 'shipping' ? SHIPPING_FEE : STORE_PICKUP_FEE;
  const total = subtotal + shippingFee;
  return { subtotal, shippingFee, total };
}
