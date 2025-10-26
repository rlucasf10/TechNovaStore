import { Schema, model } from 'mongoose';
import { IPriceHistory } from '../types';

const priceHistorySchema = new Schema<IPriceHistory>({
  productSku: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  providerName: {
    type: String,
    required: true,
    enum: ['Amazon', 'AliExpress', 'Banggood', 'eBay', 'Newegg', 'Local'],
  },
  price: {
    type: Number,
    required: true,
    min: 0,
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
  recordedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for optimization
priceHistorySchema.index({ productSku: 1, recordedAt: -1 });
priceHistorySchema.index({ providerName: 1, recordedAt: -1 });
priceHistorySchema.index({ productSku: 1, providerName: 1, recordedAt: -1 });
priceHistorySchema.index({ recordedAt: -1 });

// Compound index for common queries
priceHistorySchema.index({ productSku: 1, providerName: 1, recordedAt: -1 });

// TTL index to automatically delete old records (keep 1 year of history)
priceHistorySchema.index({ recordedAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Static methods
priceHistorySchema.statics.getProductPriceHistory = function(productSku: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    productSku,
    recordedAt: { $gte: startDate },
  }).sort({ recordedAt: -1 });
};

priceHistorySchema.statics.getProviderPriceHistory = function(providerName: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    providerName,
    recordedAt: { $gte: startDate },
  }).sort({ recordedAt: -1 });
};

priceHistorySchema.statics.getPriceAnalytics = function(productSku: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        productSku,
        recordedAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$providerName',
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        currentPrice: { $last: '$price' },
        priceChanges: { $sum: 1 },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);
};

priceHistorySchema.statics.getMarketTrends = function(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        recordedAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$recordedAt' } },
          provider: '$providerName',
        },
        avgPrice: { $avg: '$price' },
        avgMarkup: { $avg: '$markupPercentage' },
        productCount: { $addToSet: '$productSku' },
      },
    },
    {
      $addFields: {
        uniqueProducts: { $size: '$productCount' },
      },
    },
    {
      $sort: { '_id.date': -1, '_id.provider': 1 },
    },
  ]);
};

// Instance methods
priceHistorySchema.methods.calculatePriceChange = async function() {
  const previousRecord = await (this.constructor as any).findOne({
    productSku: this.productSku,
    providerName: this.providerName,
    recordedAt: { $lt: this.recordedAt },
  }).sort({ recordedAt: -1 });
  
  if (!previousRecord) {
    return {
      change: 0,
      changePercentage: 0,
      trend: 'new' as const,
    };
  }
  
  const change = this.price - previousRecord.price;
  const changePercentage = (change / previousRecord.price) * 100;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (change > 0) trend = 'up';
  else if (change < 0) trend = 'down';
  
  return {
    change,
    changePercentage,
    trend,
    previousPrice: previousRecord.price,
  };
};

export const PriceHistory = model<IPriceHistory>('PriceHistory', priceHistorySchema);