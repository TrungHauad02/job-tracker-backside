/**
 * Redis Helper Service
 *
 * Provides type-safe wrappers around Redis operations for job management.
 * All methods handle JSON serialization/deserialization and error handling.
 */

import { redisClient } from '../config/redis.config.js';
import { Job } from '../types/job.types.js';

/**
 * Store a job object in Redis
 * @param id - Job UUID
 * @param job - Job object to store
 * @throws Error if Redis operation fails
 */
export const setJob = async (id: string, job: Job): Promise<void> => {
  try {
    const jobString = JSON.stringify(job);
    await redisClient.set(`job:${id}`, jobString);
  } catch (error) {
    console.error(`Failed to set job ${id}:`, error);
    throw new Error(`Failed to store job in Redis: ${error}`);
  }
};

/**
 * Retrieve a job object from Redis
 * @param id - Job UUID
 * @returns Job object or null if not found
 */
export const getJob = async (id: string): Promise<Job | null> => {
  try {
    const jobString = await redisClient.get(`job:${id}`);

    if (!jobString) {
      return null;
    }

    const job = JSON.parse(jobString) as Job;
    return job;
  } catch (error) {
    console.error(`Failed to get job ${id}:`, error);
    // Return null for missing keys, but throw for parsing errors
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse job data for ${id}: ${error}`);
    }
    return null;
  }
};

/**
 * Delete a job key from Redis
 * @param id - Job UUID
 * @returns Number of keys deleted (0 or 1)
 */
export const deleteJobKey = async (id: string): Promise<number> => {
  try {
    const result = await redisClient.del(`job:${id}`);
    return result;
  } catch (error) {
    console.error(`Failed to delete job ${id}:`, error);
    throw new Error(`Failed to delete job from Redis: ${error}`);
  }
};

/**
 * Add a value to a Redis set
 * @param setKey - Redis set key
 * @param value - Value to add to the set
 * @returns Number of elements added (0 if already exists, 1 if new)
 */
export const addToSet = async (setKey: string, value: string): Promise<number> => {
  try {
    const result = await redisClient.sAdd(setKey, value);
    return result;
  } catch (error) {
    console.error(`Failed to add ${value} to set ${setKey}:`, error);
    throw new Error(`Failed to add to Redis set: ${error}`);
  }
};

/**
 * Remove a value from a Redis set
 * @param setKey - Redis set key
 * @param value - Value to remove from the set
 * @returns Number of elements removed (0 if not exists, 1 if removed)
 */
export const removeFromSet = async (setKey: string, value: string): Promise<number> => {
  try {
    const result = await redisClient.sRem(setKey, value);
    return result;
  } catch (error) {
    console.error(`Failed to remove ${value} from set ${setKey}:`, error);
    throw new Error(`Failed to remove from Redis set: ${error}`);
  }
};

/**
 * Get all members of a Redis set
 * @param setKey - Redis set key
 * @returns Array of set members (empty array if set doesn't exist)
 */
export const getSetMembers = async (setKey: string): Promise<string[]> => {
  try {
    const members = await redisClient.sMembers(setKey);
    return members;
  } catch (error) {
    console.error(`Failed to get members of set ${setKey}:`, error);
    throw new Error(`Failed to get Redis set members: ${error}`);
  }
};
