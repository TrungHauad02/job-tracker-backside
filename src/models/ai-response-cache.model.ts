/**
 * AI Response Cache Mongoose Model
 *
 * Stores AI-generated responses to minimize API calls and reduce costs.
 * Implements TTL (Time To Live) for automatic cache expiration.
 */

import mongoose, { Schema, Document } from 'mongoose';
import { CacheType } from '../types/knowledge.types.js';

/**
 * AI Response Cache Document interface
 * Extends base cache data with Mongoose Document properties
 */
export interface AIResponseCacheDocument extends Document {
  cacheType: CacheType;
  cacheKey: string;
  
  // For knowledge extraction
  inputHash?: string;
  jobId?: mongoose.Types.ObjectId;
  
  // For knowledge research
  knowledgeItem?: string;
  proficiencyLevel?: string;
  
  // Response data
  responseContent: string;
  
  // Metadata
  aiModel: string;
  tokensUsed?: number;
  responseTime?: number; // milliseconds
  
  createdAt: Date;
  expiresAt: Date;
}

/**
 * AI Response Cache Schema Definition
 */
const aiResponseCacheSchema = new Schema<AIResponseCacheDocument>(
  {
    cacheType: {
      type: String,
      required: true,
      enum: ['knowledge-extraction', 'knowledge-research'] as CacheType[],
      index: true,
    },
    cacheKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    inputHash: {
      type: String,
      sparse: true, // Only for extraction type
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      sparse: true,
      index: true,
    },
    knowledgeItem: {
      type: String,
      sparse: true, // Only for research type
    },
    proficiencyLevel: {
      type: String,
      sparse: true, // Only for research type
    },
    responseContent: {
      type: String,
      required: true,
    },
    aiModel: {
      type: String,
      required: true,
      default: 'gemini-1.5-flash',
    },
    tokensUsed: {
      type: Number,
    },
    responseTime: {
      type: Number,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Indexes for optimized queries
 */

// Compound index for cache type and key lookups
aiResponseCacheSchema.index({ cacheType: 1, cacheKey: 1 });

// TTL index - MongoDB will automatically delete documents when expiresAt is reached
aiResponseCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * AI Response Cache Model
 * Used for caching AI-generated responses
 */
export const AIResponseCacheModel = mongoose.model<AIResponseCacheDocument>(
  'AIResponseCache',
  aiResponseCacheSchema
);
