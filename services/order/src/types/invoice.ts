/**
 * Shared invoice types and interfaces
 */

export interface CompanyInfo {
  name: string;
  cif: string; // Spanish tax ID
  address: {
    street: string;
    city: string;
    postal_code: string;
    province: string;
    country: string;
  };
  phone?: string;
  email?: string;
  website?: string;
}

export interface CustomerInfo {
  name: string;
  nif?: string; // Spanish personal tax ID
  cif?: string; // Spanish company tax ID
  address: {
    street: string;
    city: string;
    postal_code: string;
    province: string;
    country: string;
  };
  email?: string;
  phone?: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_rate: number;
  tax_amount: number;
}

export interface SpanishInvoiceData {
  invoice_number: string;
  issue_date: Date;
  due_date: Date;
  company_info: CompanyInfo;
  customer_info: CustomerInfo;
  line_items: InvoiceLineItem[];
  subtotal: number;
  total_tax: number;
  total_amount: number;
  currency: string;
  payment_method: string;
  notes?: string;
}

export interface InvoiceGenerationData {
  order_id: number;
  company_info?: CompanyInfo;
  customer_info?: CustomerInfo;
}