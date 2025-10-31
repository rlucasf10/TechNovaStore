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

export interface CartItem {
  product: Product
  quantity: number
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

// Re-exportar tipos de autenticación
export * from './auth.types';