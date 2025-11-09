import { Document } from 'mongoose';

// Common interfaces for MongoDB documents
export interface ITimestamps {
  createdAt: Date;
  updatedAt: Date;
}

// Product related interfaces
export interface IProductProvider {
  name: string;
  price: number;
  availability: boolean;
  shippingCost: number;
  deliveryTime: number;
  lastUpdated: Date;
  providerProductId: string;
  providerUrl?: string;
}

export interface IProductSpecification {
  [key: string]: string | number | boolean;
}

export interface IProduct extends Document, ITimestamps {
  sku: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  specifications: IProductSpecification;
  images: string[];
  providers: IProductProvider[];
  ourPrice: number;
  markupPercentage: number;
  isActive: boolean;
  tags: string[];
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

// Category related interfaces
export interface ICategory extends Document, ITimestamps {
  name: string;
  slug: string;
  parentId?: string;
  description: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

// Price history interface
export interface IPriceHistory extends Document, ITimestamps {
  productSku: string;
  providerName: string;
  price: number;
  ourPrice: number;
  markupPercentage: number;
  recordedAt: Date;
}

// Search and filtering types
export interface IProductFilter {
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  tags?: string[];
  search?: string;
}

export interface IProductSort {
  field: 'name' | 'ourPrice' | 'createdAt' | 'updatedAt' | 'brand';
  order: 'asc' | 'desc';
}

export interface IPaginationOptions {
  page: number;
  limit: number;
  sort?: IProductSort;
}

export interface IPaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}