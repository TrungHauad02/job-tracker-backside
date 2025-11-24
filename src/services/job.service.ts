/**
 * Job Service
 *
 * Business logic layer for job management operations.
 * Handles CRUD operations using MongoDB/Mongoose.
 */

import { Job, CreateJobDTO, UpdateJobDTO, JobStatus } from '../types/job.types.js';
import { JobModel } from '../models/job.model.js';

/**
 * Create a new job
 * @param data - Job creation data
 * @returns Created job object with generated ID and timestamps
 */
export const createJob = async (data: CreateJobDTO): Promise<Job> => {
  try {
    // Create new job document
    const jobDoc = new JobModel(data);
    await jobDoc.save();

    const saved = jobDoc.toObject();
    return {
      id: saved._id.toString(),
      jobTitle: saved.jobTitle,
      companyName: saved.companyName,
      applicationLink: saved.applicationLink,
      companyLink: saved.companyLink,
      requirements: saved.requirements,
      jobDescription: saved.jobDescription,
      status: saved.status,
      notes: saved.notes,
      appliedDate: saved.appliedDate,
      createdAt: saved.createdAt instanceof Date ? saved.createdAt.toISOString() : saved.createdAt,
      updatedAt: saved.updatedAt instanceof Date ? saved.updatedAt.toISOString() : saved.updatedAt,
    };
  } catch (error) {
    console.error('Failed to create job:', error);
    throw new Error(`Failed to create job: ${error}`);
  }
};

/**
 * Get all jobs with pagination
 * @param page - Page number (starts from 1)
 * @param limit - Number of items per page
 * @returns Paginated jobs with metadata
 */
export const getAllJobs = async (
  page: number = 1,
  limit: number = 10
): Promise<{
  jobs: Job[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}> => {
  try {
    // Validate and sanitize inputs
    const pageNum = Math.max(1, page);
    const limitNum = Math.max(1, Math.min(100, limit)); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination metadata
    const totalItems = await JobModel.countDocuments();

    // Fetch paginated jobs from MongoDB, sorted by creation date (newest first)
    const jobs = await JobModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Convert MongoDB documents to Job type
    const formattedJobs = jobs.map((job) => ({
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

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / limitNum);

    return {
      jobs: formattedJobs,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    };
  } catch (error) {
    console.error('Failed to get all jobs:', error);
    throw new Error(`Failed to retrieve jobs: ${error}`);
  }
};

/**
 * Get a single job by ID
 * @param id - Job UUID
 * @returns Job object or null if not found
 */
export const getJobById = async (id: string): Promise<Job | null> => {
  try {
    const job = await JobModel.findById(id).lean();
    
    if (!job) {
      return null;
    }

    return {
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
    };
  } catch (error) {
    console.error(`Failed to get job ${id}:`, error);
    throw new Error(`Failed to retrieve job: ${error}`);
  }
};

/**
 * Update a job
 * @param id - Job UUID
 * @param data - Partial job data to update
 * @returns Updated job object or null if not found
 */
export const updateJob = async (id: string, data: UpdateJobDTO): Promise<Job | null> => {
  try {
    // Find and update the job
    const updatedJob = await JobModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedJob) {
      return null;
    }

    return {
      id: updatedJob._id.toString(),
      jobTitle: updatedJob.jobTitle,
      companyName: updatedJob.companyName,
      applicationLink: updatedJob.applicationLink,
      companyLink: updatedJob.companyLink,
      requirements: updatedJob.requirements,
      jobDescription: updatedJob.jobDescription,
      status: updatedJob.status,
      notes: updatedJob.notes,
      appliedDate: updatedJob.appliedDate,
      createdAt: updatedJob.createdAt instanceof Date ? updatedJob.createdAt.toISOString() : updatedJob.createdAt,
      updatedAt: updatedJob.updatedAt instanceof Date ? updatedJob.updatedAt.toISOString() : updatedJob.updatedAt,
    };
  } catch (error) {
    console.error(`Failed to update job ${id}:`, error);
    throw new Error(`Failed to update job: ${error}`);
  }
};

/**
 * Delete a job
 * @param id - Job UUID
 * @returns true if deleted, false if not found
 */
export const deleteJob = async (id: string): Promise<boolean> => {
  try {
    const result = await JobModel.findByIdAndDelete(id);
    
    if (!result) {
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Failed to delete job ${id}:`, error);
    throw new Error(`Failed to delete job: ${error}`);
  }
};

/**
 * Get jobs filtered by status
 * @param status - Job status to filter by
 * @returns Array of jobs with the specified status
 */
export const getJobsByStatus = async (status: JobStatus): Promise<Job[]> => {
  try {
    // Query MongoDB for jobs with the specified status
    const jobs = await JobModel.find({ status }).sort({ createdAt: -1 }).lean();

    // Convert MongoDB documents to Job type
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
    console.error(`Failed to get jobs with status ${status}:`, error);
    throw new Error(`Failed to retrieve jobs by status: ${error}`);
  }
};
