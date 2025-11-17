/**
 * Job Service
 *
 * Business logic layer for job management operations.
 * Handles CRUD operations and maintains Redis data consistency.
 */

import { v4 as uuidv4 } from 'uuid';
import { Job, CreateJobDTO, UpdateJobDTO, JobStatus } from '../types/job.types.js';
import { RedisKeys } from '../utils/redisKeys.js';
import * as redisService from './redis.service.js';

/**
 * Create a new job
 * @param data - Job creation data
 * @returns Created job object with generated ID and timestamps
 */
export const createJob = async (data: CreateJobDTO): Promise<Job> => {
  // Generate unique ID
  const id = uuidv4();
  const now = new Date().toISOString();

  // Construct complete job object
  const job: Job = {
    id,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  try {
    // Save job to Redis
    await redisService.setJob(id, job);

    // Add to all jobs set
    await redisService.addToSet(RedisKeys.allJobs(), id);

    // Add to status-specific set
    await redisService.addToSet(RedisKeys.jobsByStatus(job.status), id);

    return job;
  } catch (error) {
    console.error('Failed to create job:', error);
    throw new Error(`Failed to create job: ${error}`);
  }
};

/**
 * Get all jobs
 * @returns Array of all jobs
 */
export const getAllJobs = async (): Promise<Job[]> => {
  try {
    // Get all job IDs
    const jobIds = await redisService.getSetMembers(RedisKeys.allJobs());

    if (jobIds.length === 0) {
      return [];
    }

    // Fetch all job objects in parallel
    const jobPromises = jobIds.map((id) => redisService.getJob(id));
    const jobs = await Promise.all(jobPromises);

    // Filter out any null values (in case of corrupted data)
    return jobs.filter((job): job is Job => job !== null);
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
    const job = await redisService.getJob(id);
    return job;
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
    // Get existing job
    const existingJob = await redisService.getJob(id);

    if (!existingJob) {
      return null;
    }

    // Check if status is changing
    const statusChanged = data.status && data.status !== existingJob.status;
    const oldStatus = existingJob.status;

    // Merge update data with existing job
    const updatedJob: Job = {
      ...existingJob,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Save updated job
    await redisService.setJob(id, updatedJob);

    // Handle status set changes if status was updated
    if (statusChanged && data.status) {
      // Remove from old status set
      await redisService.removeFromSet(RedisKeys.jobsByStatus(oldStatus), id);
      // Add to new status set
      await redisService.addToSet(RedisKeys.jobsByStatus(data.status), id);
    }

    return updatedJob;
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
    // Get existing job to retrieve its status
    const existingJob = await redisService.getJob(id);

    if (!existingJob) {
      return false;
    }

    // Delete job key
    await redisService.deleteJobKey(id);

    // Remove from all jobs set
    await redisService.removeFromSet(RedisKeys.allJobs(), id);

    // Remove from status-specific set
    await redisService.removeFromSet(RedisKeys.jobsByStatus(existingJob.status), id);

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
    // Get job IDs with this status
    const jobIds = await redisService.getSetMembers(RedisKeys.jobsByStatus(status));

    if (jobIds.length === 0) {
      return [];
    }

    // Fetch all job objects in parallel
    const jobPromises = jobIds.map((id) => redisService.getJob(id));
    const jobs = await Promise.all(jobPromises);

    // Filter out null values and ensure status matches (data consistency check)
    return jobs.filter((job): job is Job => job !== null && job.status === status);
  } catch (error) {
    console.error(`Failed to get jobs with status ${status}:`, error);
    throw new Error(`Failed to retrieve jobs by status: ${error}`);
  }
};
