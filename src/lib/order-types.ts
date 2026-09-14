/**
 * Order types shared by server and client code. Kept free of any
 * node: imports so client components can import them safely.
 */

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "packed"
  | "shipped"
  | "out-for-delivery"
  | "delivered"
  | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out-for-delivery",
  "delivered",
  "cancelled",
];

/** Progress-timeline statuses in order (cancelled is handled separately) */
export const TRACKING_STEPS: OrderStatus[] = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out-for-delivery",
  "delivered",
];

export interface OrderItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  size: string;
  qty: number;
  /** unit price in paise */
  price: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface SavedAddress extends ShippingAddress {
  id: string;
  label: string;
}

export interface AppliedCoupon {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  discount: number;
}

export interface Order {
  /** human-friendly id like NT-7K2M9X */
  id: string;
  /** set when the buyer was logged in to a customer account */
  userId?: string;
  provider: "stripe" | "razorpay" | "cod";
  /** Stripe session id, Razorpay payment id, or "cod" */
  paymentRef: string;
  email: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  coupon?: AppliedCoupon;
  total: number;
  currency: string;
  status: OrderStatus;
  address?: ShippingAddress;
  paymentMethod?: "online" | "cod";
  /** delivery option id — standard / express */
  deliveryOption?: "standard" | "express";
  /** courier name + tracking number once shipped */
  courier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  invoiceNumber?: string;
  /** cancellation bookkeeping */
  cancelReason?: string;
  cancelledAt?: string;
  /** return bookkeeping */
  returnStatus?: "requested" | "approved" | "rejected" | "refunded";
  returnReason?: string;
  requestedAt?: string;
  refundStatus?: "pending" | "processed" | "completed";
  createdAt: string;
  updatedAt: string;
}

/** A status change / shipping event logged against an order */
export interface OrderEvent {
  at: string;
  label: string;
  note?: string;
}
