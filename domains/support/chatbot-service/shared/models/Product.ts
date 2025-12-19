import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interfaz del documento Product en MongoDB
 */
export interface IProduct extends Document {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  specifications?: any;
  images?: string[];
  providers?: Array<{
    name: string;
    price: number;
    availability: boolean;
    shipping_cost: number;
    delivery_time: number;
    last_updated: Date;
  }>;
  our_price?: number;
  markup_percentage?: number;
  is_active?: boolean;
  original_price?: number;
  discount_percentage?: number;
  rating?: number;
  review_count?: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Schema de Mongoose para Product
 */
const ProductSchema = new Schema<IProduct>({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  category: String,
  subcategory: String,
  brand: String,
  specifications: Schema.Types.Mixed,
  images: [String],
  providers: [{
    name: String,
    price: Number,
    availability: Boolean,
    shipping_cost: Number,
    delivery_time: Number,
    last_updated: Date,
  }],
  our_price: Number,
  markup_percentage: Number,
  is_active: Boolean,
  original_price: Number,
  discount_percentage: Number,
  rating: Number,
  review_count: Number,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

/**
 * Función helper para obtener el modelo Product
 * Evita el error "Cannot overwrite model once compiled"
 */
export function getProductModel() {
  try {
    // Intentar obtener el modelo si ya existe
    return mongoose.model<IProduct>('Product');
  } catch {
    // Si no existe, crearlo
    return mongoose.model<IProduct>('Product', ProductSchema);
  }
}

export default getProductModel;
