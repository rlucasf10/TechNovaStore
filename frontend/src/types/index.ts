export interface Product {
  id: string
  sku: string
  name: string
  description: string
  category: string
  subcategory: string
  brand: string
  specifications: Record<string, unknown>
  images: string[]
  providers: Provider[]
  our_price: number
  markup_percentage: number
  is_active: boolean
  created_at: string
  updated_at: string
  // Campos de rating y reviews
  rating?: number
  review_count?: number
  // Campo para precio original (antes de descuento)
  original_price?: number
  // Porcentaje de descuento
  discount_percentage?: number
  // Características destacadas del producto
  features?: string[]
}

export interface Provider {
  name: string
  price: number
  availability: boolean
  shipping_cost: number
  delivery_time: number
  last_updated: string
}

export interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string
  description: string
  image: string
  is_active: boolean
}

/**
 * Filtros para búsqueda de productos
 */
export interface ProductFilters {
  // Paginación
  page?: number;
  limit?: number;
  
  // Filtros básicos
  category?: string | string[];
  brand?: string | string[];
  search?: string;
  
  // Filtros de precio
  minPrice?: number;
  maxPrice?: number;
  
  // Filtros de disponibilidad
  inStock?: boolean;
  
  // Filtros de especificaciones técnicas
  specs?: Record<string, string | string[]>;
  
  // Ordenamiento
  sortBy?: 'price_asc' | 'price_desc' | 'name' | 'rating' | 'newest' | 'popularity';
}

/**
 * Categoría con subcategorías anidadas (árbol)
 */
export interface CategoryTree extends Category {
  children?: CategoryTree[];
}

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  phone?: string
  address?: Address
  role: 'customer' | 'admin'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Address {
  street: string
  city: string
  state: string
  postal_code: string
  country: string
}

export interface Order {
  id: number
  user_id: number
  order_number: string
  status: OrderStatus
  total_amount: number
  shipping_address: Address
  billing_address: Address
  payment_method: string
  payment_status: PaymentStatus
  provider_order_id?: string
  tracking_number?: string
  estimated_delivery?: string
  items: OrderItem[]
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: number
  order_id: number
  product_sku: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  provider_name: string
  provider_item_id?: string
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type PaymentStatus = 
  | 'pending'
  | 'completed'
  | 'failed'
  | 'refunded'

// Tipos del carrito (legacy - mantener para compatibilidad con CartContext)
export interface CartItem {
  product: Product
  quantity: number
}

// Tipos del carrito (nuevo servicio)
export interface CartItemNew {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  sku: string;
  brand?: string;
  maxQuantity?: number;
  inStock: boolean;
  addedAt: Date;
}

export interface Cart {
  id: string;
  userId?: string;
  items: CartItemNew[];
  subtotal: number;
  shipping: number;
  taxes: number;
  discount: number;
  total: number;
  itemCount: number;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Chatbot types
export interface ChatMessage {
  id: string
  content: string
  sender: 'user' | 'bot'
  timestamp: Date
  type: 'text' | 'product_recommendation' | 'quick_reply'
  metadata?: {
    products?: Product[]
    quick_replies?: string[]
    intent?: string
    confidence?: number
  }
}

export interface ChatSession {
  id: string
  user_id?: number
  messages: ChatMessage[]
  context: ChatContext
  created_at: Date
  updated_at: Date
}

export interface ChatContext {
  current_intent?: string
  user_preferences?: {
    category?: string
    price_range?: {
      min: number
      max: number
    }
    brand?: string
  }
  conversation_state?: 'greeting' | 'browsing' | 'product_inquiry' | 'support' | 'checkout_help'
  last_viewed_products?: string[]
}

export interface ProductRecommendation {
  product: Product
  reason: string
  confidence: number
}

export interface ChatbotResponse {
  message: string
  type: 'text' | 'product_recommendation' | 'quick_reply'
  products?: ProductRecommendation[]
  quick_replies?: string[]
  intent?: string
  confidence?: number
}

// Tipos de búsqueda
export interface SearchResult {
  type: 'product' | 'category' | 'brand';
  id: string;
  name: string;
  image?: string;
  price?: number;
  category?: string;
  slug?: string;
  productCount?: number; // Para categorías y marcas
}

export interface SearchResponse {
  products: SearchResult[];
  categories: SearchResult[];
  brands: SearchResult[];
  total: number;
}

// Re-exportar tipos de autenticación
export * from './auth.types';