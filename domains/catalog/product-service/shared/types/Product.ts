import mongoose, { Document, Schema } from 'mongoose';

export interface IProvider {
  name: string;
  price: number;
  availability: boolean;
  shipping_cost: number;
  delivery_time: number;
  last_updated: Date;
}

export interface IProduct extends Document {
  sku: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  specifications: Record<string, any>;
  images: string[];
  providers: IProvider[];
  our_price: number;
  markup_percentage: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  // Campos de campaña
  in_campaign?: boolean;
  campaign_id?: string;
  campaign_price?: number;
  original_price?: number;
  discount_percentage?: number;
  // Campos de reviews
  rating?: number;
  review_count?: number;
}

const ProviderSchema = new Schema<IProvider>({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  availability: { type: Boolean, default: true },
  shipping_cost: { type: Number, default: 0, min: 0 },
  delivery_time: { type: Number, default: 7, min: 1 }, // days
  last_updated: { type: Date, default: Date.now },
});

const ProductSchema = new Schema<IProduct>({
  sku: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    uppercase: true,
  },
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 255,
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 2000,
  },
  category: { 
    type: String, 
    required: true,
    trim: true,
    index: true,
  },
  subcategory: { 
    type: String, 
    trim: true,
    index: true,
  },
  brand: { 
    type: String, 
    required: true,
    trim: true,
    index: true,
  },
  specifications: {
    type: Schema.Types.Mixed,
    default: {},
  },
  images: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i.test(v);
      },
      message: 'Invalid image URL format'
    }
  }],
  providers: [ProviderSchema],
  our_price: { 
    type: Number, 
    required: true,
    min: 0,
    index: true,
  },
  markup_percentage: { 
    type: Number, 
    default: 20,
    min: 0,
    max: 100,
  },
  is_active: { 
    type: Boolean, 
    default: true,
    index: true,
  },
  created_at: { 
    type: Date, 
    default: Date.now,
  },
  updated_at: { 
    type: Date, 
    default: Date.now,
  },
  // Campos de campaña
  in_campaign: {
    type: Boolean,
    default: false,
    index: true,
  },
  campaign_id: {
    type: String,
    index: true,
  },
  campaign_price: {
    type: Number,
    min: 0,
  },
  original_price: {
    type: Number,
    min: 0,
  },
  discount_percentage: {
    type: Number,
    min: 0,
    max: 100,
  },
  // Campos de reviews
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  review_count: {
    type: Number,
    min: 0,
    default: 0,
  },
});

// Indexes for better query performance
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1, subcategory: 1 });
ProductSchema.index({ brand: 1, category: 1 });
ProductSchema.index({ our_price: 1, is_active: 1 });
ProductSchema.index({ 'providers.availability': 1, is_active: 1 });
// Índices para campos de campaña
ProductSchema.index({ in_campaign: 1, campaign_id: 1 });
ProductSchema.index({ campaign_id: 1, is_active: 1 });

// Update the updated_at field before saving
ProductSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Transform _id to id when converting to JSON
ProductSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc: any, ret: any) {
    // Si no existe un campo 'id', usar _id como id
    if (!ret.id) {
      ret.id = ret._id.toString();
    }
    delete ret._id;
    return ret;
  }
});

// Calculate our_price based on best provider price and markup
ProductSchema.methods.calculateOurPrice = function() {
  if (this.providers.length === 0) return 0;
  
  const availableProviders = this.providers.filter((p: IProvider) => p.availability);
  if (availableProviders.length === 0) return 0;
  
  const bestPrice = Math.min(...availableProviders.map((p: IProvider) => p.price + p.shipping_cost));
  this.our_price = bestPrice * (1 + this.markup_percentage / 100);
  return this.our_price;
};

export const Product = mongoose.model<IProduct>('Product', ProductSchema);