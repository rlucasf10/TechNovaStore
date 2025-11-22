import mongoose, { Schema, Document } from 'mongoose';

export interface IProductRecommender extends Document {
  sku: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  brand: string;
  specifications: Record<string, any>;
  images: string[];
  our_price: number;
  is_active: boolean;
  tags: string[];
  features: number[]; // Feature vector for content-based filtering
  popularity_score: number;
  created_at: Date;
  updated_at: Date;
}

const ProductSchema = new Schema<IProductRecommender>({
  sku: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true, index: true },
  subcategory: { type: String, index: true },
  brand: { type: String, required: true, index: true },
  specifications: { type: Schema.Types.Mixed },
  images: [{ type: String }],
  our_price: { type: Number, required: true },
  is_active: { type: Boolean, default: true, index: true },
  tags: [{ type: String, index: true }],
  features: [{ type: Number }], // Normalized feature vector
  popularity_score: { type: Number, default: 0, index: true }
}, {
  timestamps: true
});

// Text search index
ProductSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  tags: 'text'
});

export const Product = mongoose.model<IProductRecommender>('Product', ProductSchema);