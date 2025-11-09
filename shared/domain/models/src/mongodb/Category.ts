import { Schema, model } from 'mongoose';
import { ICategory } from '../types';

const categorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/,
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  image: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Image URL must be a valid HTTP/HTTPS URL ending with image extension',
    },
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
  },
  sortOrder: {
    type: Number,
    required: true,
    default: 0,
  },
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

// Indexes
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parentId: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ parentId: 1, sortOrder: 1 });

// Text search index
categorySchema.index({
  name: 'text',
  description: 'text',
}, {
  weights: {
    name: 10,
    description: 1,
  },
  name: 'category_text_index',
});

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId',
});

// Virtual for parent category
categorySchema.virtual('parent', {
  ref: 'Category',
  localField: 'parentId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for product count
categorySchema.virtual('productCount', {
  ref: 'Product',
  localField: 'name',
  foreignField: 'category',
  count: true,
});

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

// Static methods
categorySchema.statics.findRootCategories = function() {
  return this.find({ parentId: null, isActive: true }).sort({ sortOrder: 1 });
};

categorySchema.statics.findByParent = function(parentId: string) {
  return this.find({ parentId, isActive: true }).sort({ sortOrder: 1 });
};

categorySchema.statics.findBySlug = function(slug: string) {
  return this.findOne({ slug, isActive: true });
};

categorySchema.statics.searchCategories = function(searchTerm: string) {
  return this.find({
    $text: { $search: searchTerm },
    isActive: true,
  }, {
    score: { $meta: 'textScore' },
  }).sort({ score: { $meta: 'textScore' } });
};

// Instance methods
categorySchema.methods.getFullPath = async function() {
  const path = [this.name];
  let current = this;
  
  while (current.parentId) {
    current = await (this.constructor as any).findById(current.parentId);
    if (current) {
      path.unshift(current.name);
    } else {
      break;
    }
  }
  
  return path.join(' > ');
};

categorySchema.methods.getAllSubcategories = async function() {
  const subcategories: any[] = [];
  const queue = [this._id];
  
  while (queue.length > 0) {
    const parentId = queue.shift();
    const children = await (this.constructor as any).find({ parentId, isActive: true });
    
    for (const child of children) {
      subcategories.push(child);
      queue.push(child._id);
    }
  }
  
  return subcategories;
};

categorySchema.methods.hasProducts = async function() {
  const Product = model('Product');
  const count = await Product.countDocuments({ category: this.name, isActive: true });
  return count > 0;
};

export const Category = model<ICategory>('Category', categorySchema);