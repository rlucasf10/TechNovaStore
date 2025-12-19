import mongoose, { Document, Schema } from 'mongoose';

/**
 * Interfaz para un voto de utilidad de una review
 */
export interface IReviewVote {
  userId: string;
  helpful: boolean;
  createdAt: Date;
}

/**
 * Interfaz para una imagen de review
 */
export interface IReviewImage {
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
}

/**
 * Interfaz para una review de producto
 */
export interface IReview extends Document {
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  images: IReviewImage[];
  verified: boolean;
  votes: IReviewVote[];
  helpfulCount: number;
  notHelpfulCount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const ReviewVoteSchema = new Schema<IReviewVote>({
  userId: { type: String, required: true },
  helpful: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ReviewImageSchema = new Schema<IReviewImage>({
  url: { type: String, required: true },
  thumbnailUrl: { type: String },
  uploadedAt: { type: Date, default: Date.now },
});

const ReviewSchema = new Schema<IReview>({
  productId: { 
    type: String, 
    required: true,
    index: true,
  },
  userId: { 
    type: String, 
    required: true,
    index: true,
  },
  userName: { 
    type: String, 
    required: true,
    trim: true,
  },
  userAvatar: { 
    type: String,
    trim: true,
  },
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5,
    index: true,
  },
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100,
  },
  comment: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 2000,
  },
  images: [ReviewImageSchema],
  verified: { 
    type: Boolean, 
    default: false,
  },
  votes: [ReviewVoteSchema],
  helpfulCount: { 
    type: Number, 
    default: 0,
    min: 0,
  },
  notHelpfulCount: { 
    type: Number, 
    default: 0,
    min: 0,
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved', // Auto-aprobar por ahora
    index: true,
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true,
  },
  updatedAt: { 
    type: Date, 
    default: Date.now,
  },
});

// Índices compuestos para consultas frecuentes
ReviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ productId: 1, rating: 1 });
ReviewSchema.index({ userId: 1, productId: 1 }, { unique: true }); // Un usuario solo puede dejar una review por producto

// Actualizar updatedAt antes de guardar
ReviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Transformar _id a id cuando se convierte a JSON
ReviewSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (_doc: any, ret: any) {
    if (!ret.id) {
      ret.id = ret._id.toString();
    }
    delete ret._id;
    return ret;
  }
});

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
