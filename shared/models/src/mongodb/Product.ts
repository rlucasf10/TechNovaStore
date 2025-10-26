import { Schema, model } from 'mongoose';
import { IProduct, IProductProvider } from '../types';

// Provider subdocument schema
const providerSchema = new Schema<IProductProvider>({
  name: {
    type: String,
    required: true,
    enum: ['Amazon', 'AliExpress', 'Banggood', 'eBay', 'Newegg', 'Local'],
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  availability: {
    type: Boolean,
    required: true,
    default: true,
  },
  shippingCost: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  deliveryTime: {
    type: Number,
    required: true,
    min: 1,
    max: 365,
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now,
  },
  providerProductId: {
    type: String,
    required: true,
  },
  providerUrl: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Provider URL must be a valid HTTP/HTTPS URL',
    },
  },
}, { _id: false });

// Dimensions subdocument schema
const dimensionsSchema = new Schema({
  length: { type: Number, required: true, min: 0 },
  width: { type: Number, required: true, min: 0 },
  height: { type: Number, required: true, min: 0 },
}, { _id: false });

// Main product schema
const productSchema = new Schema<IProduct>({
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    match: /^[A-Z0-9-]+$/,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
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
  },
  subcategory: {
    type: String,
    required: true,
    trim: true,
  },
  brand: {
    type: String,
    required: true,
    trim: true,
  },
  specifications: {
    type: Schema.Types.Mixed,
    required: true,
    default: {},
  },
  images: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Image URL must be a valid HTTP/HTTPS URL ending with image extension',
    },
  }],
  providers: {
    type: [providerSchema],
    required: true,
    validate: {
      validator: function(v: IProductProvider[]) {
        return v.length > 0;
      },
      message: 'Product must have at least one provider',
    },
  },
  ourPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  markupPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 1000,
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  weight: {
    type: Number,
    min: 0,
  },
  dimensions: dimensionsSchema,
  seoTitle: {
    type: String,
    trim: true,
    maxlength: 60,
  },
  seoDescription: {
    type: String,
    trim: true,
    maxlength: 160,
  },
  seoKeywords: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for optimization
productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ ourPrice: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ updatedAt: -1 });

// Text search index
productSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  tags: 'text',
}, {
  weights: {
    name: 10,
    brand: 5,
    tags: 3,
    description: 1,
  },
  name: 'product_text_index',
});

// Compound indexes for common queries
productSchema.index({ category: 1, isActive: 1, ourPrice: 1 });
productSchema.index({ brand: 1, isActive: 1, ourPrice: 1 });

// Virtual for best provider (lowest total cost)
productSchema.virtual('bestProvider').get(function() {
  if (!this.providers || this.providers.length === 0) return null;
  
  return this.providers
    .filter(p => p.availability)
    .reduce((best, current) => {
      const currentTotal = current.price + current.shippingCost;
      const bestTotal = best.price + best.shippingCost;
      return currentTotal < bestTotal ? current : best;
    });
});

// Virtual for availability status
productSchema.virtual('inStock').get(function() {
  return this.providers && this.providers.some(p => p.availability);
});

// Virtual for minimum price
productSchema.virtual('minProviderPrice').get(function() {
  if (!this.providers || this.providers.length === 0) return 0;
  
  const availableProviders = this.providers.filter(p => p.availability);
  if (availableProviders.length === 0) return 0;
  
  return Math.min(...availableProviders.map(p => p.price + p.shippingCost));
});

// Pre-save middleware to calculate our price
productSchema.pre('save', function(next) {
  if (this.isModified('providers') || this.isModified('markupPercentage')) {
    // Calculate minimum price manually since virtual is not available in pre-save
    if (this.providers && this.providers.length > 0) {
      const availableProviders = this.providers.filter((p: any) => p.availability);
      if (availableProviders.length > 0) {
        const minPrice = Math.min(...availableProviders.map((p: any) => p.price + p.shippingCost));
        if (minPrice > 0) {
          this.ourPrice = minPrice * (1 + this.markupPercentage / 100);
        }
      }
    }
  }
  next();
});

// Static methods
productSchema.statics.findByCategory = function(category: string, subcategory?: string) {
  const query: any = { category, isActive: true };
  if (subcategory) {
    query.subcategory = subcategory;
  }
  return this.find(query);
};

productSchema.statics.findByBrand = function(brand: string) {
  return this.find({ brand, isActive: true });
};

productSchema.statics.findInStock = function() {
  return this.find({
    isActive: true,
    'providers.availability': true,
  });
};

productSchema.statics.searchProducts = function(searchTerm: string) {
  return this.find({
    $text: { $search: searchTerm },
    isActive: true,
  }, {
    score: { $meta: 'textScore' },
  }).sort({ score: { $meta: 'textScore' } });
};

// Instance methods
productSchema.methods.updateProviderPrice = function(providerName: string, newPrice: number) {
  const provider = this.providers.find((p: any) => p.name === providerName);
  if (provider) {
    provider.price = newPrice;
    provider.lastUpdated = new Date();
    return this.save();
  }
  throw new Error(`Provider ${providerName} not found`);
};

productSchema.methods.addProvider = function(providerData: IProductProvider) {
  const existingProvider = this.providers.find((p: any) => p.name === providerData.name);
  if (existingProvider) {
    Object.assign(existingProvider, providerData);
  } else {
    this.providers.push(providerData);
  }
  return this.save();
};

productSchema.methods.removeProvider = function(providerName: string) {
  this.providers = this.providers.filter((p: any) => p.name !== providerName);
  return this.save();
};

export const Product = model<IProduct>('Product', productSchema);