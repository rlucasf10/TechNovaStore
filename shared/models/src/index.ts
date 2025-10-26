// Common model interfaces for TechNovaStore platform

import { BaseEntity, Address, UserRole, OrderStatus, PaymentStatus } from '@technovastore/shared-types';

// Re-export PostgreSQL models
export * from './postgresql';

export interface IUser extends BaseEntity {
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: Address;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
  last_login?: Date;
}

export interface IProduct extends BaseEntity {
  sku: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  brand: string;
  specifications: Record<string, any>;
  images: string[];
  providers: IProvider[];
  our_price: number;
  markup_percentage: number;
  is_active: boolean;
}

export interface IProvider {
  name: string;
  price: number;
  availability: boolean;
  shipping_cost: number;
  delivery_time: number;
  last_updated: Date;
}

export interface IOrder extends BaseEntity {
  user_id: number;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  shipping_address: Address;
  billing_address: Address;
  payment_method: string;
  payment_status: PaymentStatus;
  provider_order_id?: string;
  tracking_number?: string;
  estimated_delivery?: Date;
  notes?: string;
}

export interface IOrderItem extends BaseEntity {
  order_id: number;
  product_sku: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  provider_name?: string;
  provider_item_id?: string;
}

export interface IInvoice extends BaseEntity {
  order_id: number;
  invoice_number: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  tax_rate: number;
  currency: string;
  issued_date: Date;
  due_date: Date;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  pdf_url?: string;
}