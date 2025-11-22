import mongoose, { Schema, Document } from 'mongoose';

export interface IUserInteraction extends Document {
  user_id: string;
  product_sku: string;
  interaction_type: 'view' | 'purchase' | 'cart_add' | 'wishlist' | 'search';
  rating?: number;
  timestamp: Date;
  session_id?: string;
  metadata?: Record<string, any>;
}

const UserInteractionSchema = new Schema<IUserInteraction>({
  user_id: { type: String, required: true, index: true },
  product_sku: { type: String, required: true, index: true },
  interaction_type: { 
    type: String, 
    required: true,
    enum: ['view', 'purchase', 'cart_add', 'wishlist', 'search']
  },
  rating: { type: Number, min: 1, max: 5 },
  timestamp: { type: Date, default: Date.now, index: true },
  session_id: { type: String },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
UserInteractionSchema.index({ user_id: 1, timestamp: -1 });
UserInteractionSchema.index({ product_sku: 1, timestamp: -1 });
UserInteractionSchema.index({ interaction_type: 1, timestamp: -1 });

export const UserInteraction = mongoose.model<IUserInteraction>('UserInteraction', UserInteractionSchema);