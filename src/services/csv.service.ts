/**
 * CSV Service
 *
 * Handles CSV import/export operations for jobs.
 * Supports bulk upsert with _id preservation for cross-database imports.
 */

import { Job, CreateJobDTO } from '../types/job.types.js';
import { JobModel } from '../models/job.model.js';
import mongoose from 'mongoose';

export interface ImportJobDTO extends CreateJobDTO {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportResult {
  success: boolean;
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

/**
 * Export all jobs to CSV format
 * @returns Array of jobs with all fields including _id
 */
export const exportJobsToCSV = async (): Promise<Job[]> => {
  try {
    const jobs = await JobModel.find().sort({ createdAt: -1 }).lean();

    return jobs.map((job) => ({
      id: job._id.toString(),
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      applicationLink: job.applicationLink,
      companyLink: job.companyLink,
      requirements: job.requirements,
      jobDescription: job.jobDescription,
      status: job.status,
      notes: job.notes,
      appliedDate: job.appliedDate,
      createdAt: job.createdAt instanceof Date ? job.createdAt.toISOString() : job.createdAt,
      updatedAt: job.updatedAt instanceof Date ? job.updatedAt.toISOString() : job.updatedAt,
    }));
  } catch (error) {
    console.error('Failed to export jobs to CSV:', error);
    throw new Error(`Failed to export jobs: ${error}`);
  }
};

/**
 * Import jobs from CSV data with bulk upsert
 * Preserves _id when provided, creates new _id when not provided
 * @param jobs - Array of job data from CSV
 * @returns Import result with statistics
 */
export const importJobsFromCSV = async (jobs: ImportJobDTO[]): Promise<ImportResult> => {
  const result: ImportResult = {
    success: true,
    created: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  try {
    for (let i = 0; i < jobs.length; i++) {
      const jobData = jobs[i];
      
      try {
        // Validate required fields
        if (!jobData.jobTitle || !jobData.companyName || !jobData.applicationLink) {
          result.failed++;
          result.errors.push({
            row: i + 1,
            error: 'Missing required fields: jobTitle, companyName, or applicationLink',
          });
          continue;
        }

        // Check if _id is provided and valid
        let jobId: mongoose.Types.ObjectId | undefined;
        if (jobData._id) {
          if (mongoose.Types.ObjectId.isValid(jobData._id)) {
            jobId = new mongoose.Types.ObjectId(jobData._id);
          } else {
            result.failed++;
            result.errors.push({
              row: i + 1,
              error: `Invalid _id format: ${jobData._id}`,
            });
            continue;
          }
        }

        // Prepare job document data
        const jobDocData = {
          jobTitle: jobData.jobTitle,
          companyName: jobData.companyName,
          applicationLink: jobData.applicationLink,
          companyLink: jobData.companyLink,
          requirements: jobData.requirements || '',
          jobDescription: jobData.jobDescription || '',
          status: jobData.status || 'Pending',
          notes: jobData.notes || '',
          appliedDate: jobData.appliedDate || new Date().toISOString(),
        };

        if (jobId) {
          // Try to update existing job with this _id
          const existingJob = await JobModel.findById(jobId);
          
          if (existingJob) {
            // Update existing job
            await JobModel.findByIdAndUpdate(jobId, { $set: jobDocData }, { runValidators: true });
            result.updated++;
          } else {
            // Create new job with specified _id
            const newJob = new JobModel({
              _id: jobId,
              ...jobDocData,
            });
            await newJob.save();
            result.created++;
          }
        } else {
          // Create new job with auto-generated _id
          const newJob = new JobModel(jobDocData);
          await newJob.save();
          result.created++;
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Set success to false if all imports failed
    if (result.failed === jobs.length) {
      result.success = false;
    }

    return result;
  } catch (error) {
    console.error('Failed to import jobs from CSV:', error);
    throw new Error(`Failed to import jobs: ${error}`);
  }
};

/**
 * Bulk upsert jobs (alternative implementation using bulkWrite)
 * More efficient for large datasets
 * @param jobs - Array of job data from CSV
 * @returns Import result with statistics
 */
export const bulkUpsertJobs = async (jobs: ImportJobDTO[]): Promise<ImportResult> => {
  const result: ImportResult = {
    success: true,
    created: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  try {
    const bulkOps: any[] = [];
    const validJobs: ImportJobDTO[] = [];

    // Validate and prepare bulk operations
    for (let i = 0; i < jobs.length; i++) {
      const jobData = jobs[i];

      try {
        // Validate required fields
        if (!jobData.jobTitle || !jobData.companyName || !jobData.applicationLink) {
          result.failed++;
          result.errors.push({
            row: i + 1,
            error: 'Missing required fields: jobTitle, companyName, or applicationLink',
          });
          continue;
        }

        // Check if _id is provided and valid
        let jobId: mongoose.Types.ObjectId | undefined;
        if (jobData._id) {
          if (mongoose.Types.ObjectId.isValid(jobData._id)) {
            jobId = new mongoose.Types.ObjectId(jobData._id);
          } else {
            result.failed++;
            result.errors.push({
              row: i + 1,
              error: `Invalid _id format: ${jobData._id}`,
            });
            continue;
          }
        }

        const jobDocData = {
          jobTitle: jobData.jobTitle,
          companyName: jobData.companyName,
          applicationLink: jobData.applicationLink,
          companyLink: jobData.companyLink,
          requirements: jobData.requirements || '',
          jobDescription: jobData.jobDescription || '',
          status: jobData.status || 'Pending',
          notes: jobData.notes || '',
          appliedDate: jobData.appliedDate || new Date().toISOString(),
        };

        if (jobId) {
          // Upsert with specific _id
          bulkOps.push({
            updateOne: {
              filter: { _id: jobId },
              update: { $set: jobDocData },
              upsert: true,
            },
          });
        } else {
          // Insert new document
          bulkOps.push({
            insertOne: {
              document: jobDocData,
            },
          });
        }

        validJobs.push(jobData);
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Execute bulk operations
    if (bulkOps.length > 0) {
      const bulkResult = await JobModel.bulkWrite(bulkOps, { ordered: false });
      result.created = bulkResult.insertedCount + (bulkResult.upsertedCount || 0);
      result.updated = bulkResult.modifiedCount;
    }

    // Set success to false if all imports failed
    if (result.failed === jobs.length) {
      result.success = false;
    }

    return result;
  } catch (error) {
    console.error('Failed to bulk upsert jobs:', error);
    throw new Error(`Failed to bulk upsert jobs: ${error}`);
  }
};
