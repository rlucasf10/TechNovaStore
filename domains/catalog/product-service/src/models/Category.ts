import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  parent_id?: mongoose.Types.ObjectId;
  description: string;
  image?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const CategorySchema = new Schema<ICategory>({
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
  },
  parent_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'Category',
    default: null,
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: 500,
  },
  image: { 
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i.test(v);
      },
      message: 'Invalid image URL format'
    }
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
});

// Indexes
CategorySchema.index({ parent_id: 1, is_active: 1 });
CategorySchema.index({ slug: 1 });

// Update the updated_at field before saving
CategorySchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const Category = mongoose.model<ICategory>('Category', CategorySchema);