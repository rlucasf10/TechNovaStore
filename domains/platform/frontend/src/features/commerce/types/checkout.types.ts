/**
 * Tipos TypeScript para Checkout
 * 
 * Define las interfaces para pedidos, items de pedido y métodos de pago.
 */

// ============================================================================
// Enums
// ============================================================================

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethodType {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  BANK_TRANSFER = 'bank_transfer',
}

export enum ShippingMethod {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight',
}

// ============================================================================
// Interfaces de Pedido
// ============================================================================

export interface OrderItem {
  productId: number;
  productName: string;
  productImage: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount?: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  instructions?: string;
}

export interface BillingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderSummaryData {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  summary: OrderSummaryData;
  shippingMethod: ShippingMethod;
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Interfaces de Pago
// ============================================================================

export interface PaymentMethod {
  id?: number;
  type: PaymentMethodType;
  isDefault?: boolean;
  // Para tarjetas
  cardNumber?: string;
  cardHolderName?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  cardBrand?: 'visa' | 'mastercard' | 'amex' | 'discover';
  last4?: string;
  // Para PayPal
  paypalEmail?: string;
  // Para Stripe
  stripePaymentMethodId?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret?: string;
}

// ============================================================================
// Interfaces de Request/Response
// ============================================================================

export interface CreateOrderRequest {
  items: Array<{
    productId: number;
    quantity: number;
  }>;
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  discountCode?: string;
  useSameAddressForBilling?: boolean;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: {
    order: Order;
    paymentIntent?: PaymentIntent;
  };
}

export interface ProcessPaymentRequest {
  orderId: number;
  paymentMethod: PaymentMethod;
  paymentIntentId?: string;
}

export interface ProcessPaymentResponse {
  success: boolean;
  message: string;
  data: {
    order: Order;
    transactionId: string;
    receiptUrl?: string;
  };
}

export interface ValidateDiscountCodeRequest {
  code: string;
  subtotal: number;
}

export interface ValidateDiscountCodeResponse {
  success: boolean;
  data: {
    valid: boolean;
    discountAmount: number;
    discountPercentage?: number;
    message?: string;
  };
}

export interface CalculateShippingRequest {
  items: Array<{
    productId: number;
    quantity: number;
  }>;
  shippingAddress: {
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  shippingMethod: ShippingMethod;
}

export interface CalculateShippingResponse {
  success: boolean;
  data: {
    cost: number;
    estimatedDays: number;
    carrier?: string;
  };
}

// ============================================================================
// Tipos de Error
// ============================================================================

export interface CheckoutError {
  code: CheckoutErrorCode;
  message: string;
  field?: string;
}

export type CheckoutErrorCode =
  | 'invalid-address'
  | 'invalid-payment-method'
  | 'payment-failed'
  | 'insufficient-stock'
  | 'invalid-discount-code'
  | 'order-creation-failed'
  | 'network-error'
  | 'server-error';
