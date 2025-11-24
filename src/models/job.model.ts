/**
 * Job Mongoose Model
 *
 * Defines the Mongoose schema and model for Job documents in MongoDB.
 * Includes automatic timestamps and indexing for optimized queries.
 */

import mongoose, { Schema, Document } from 'mongoose';
import { Job, JobStatus } from '../types/job.types.js';

/**
 * Job Document interface
 * Extends Job type with Mongoose Document properties
 */
export interface JobDocument extends Omit<Job, 'id' | 'createdAt' | 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Job Schema Definition
 */
const jobSchema = new Schema<JobDocument>(
  {
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    applicationLink: {
      type: String,
      required: true,
      trim: true,
    },
    companyLink: {
      type: String,
      trim: true,
    },
    requirements: {
      type: String,
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Reject', 'Interview', 'Hired'] as JobStatus[],
      default: 'Pending',
    },
    notes: {
      type: String,
      default: '',
    },
    appliedDate: {
      type: String,
      required: true,
    },
  },
  {
    // Automatically manage createdAt and updatedAt fields
    timestamps: true,
    // Use virtual 'id' field instead of '_id'
    toJSON: {
      virtuals: true,
      transform: function (doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        // Convert timestamps to ISO strings
        if (ret.createdAt instanceof Date) {
          ret.createdAt = ret.createdAt.toISOString();
        }
        if (ret.updatedAt instanceof Date) {
          ret.updatedAt = ret.updatedAt.toISOString();
        }
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        // Convert timestamps to ISO strings
        if (ret.createdAt instanceof Date) {
          ret.createdAt = ret.createdAt.toISOString();
        }
        if (ret.updatedAt instanceof Date) {
          ret.updatedAt = ret.updatedAt.toISOString();
        }
        return ret;
      },
    },
  }
);

/**
 * Indexes for optimized queries
 */
// Index on status for filtering by job status
jobSchema.index({ status: 1 });

// Compound index for status and date-based queries
jobSchema.index({ status: 1, createdAt: -1 });

// Index on company name for search operations
jobSchema.index({ companyName: 1 });

/**
 * Job Model
 * Used for all CRUD operations on the jobs collection
 */
export const JobModel = mongoose.model<JobDocument>('Job', jobSchema);
