/**
 * Redis Key Strategy
 *
 * This module defines all Redis key patterns used in the application
 * to ensure consistency and avoid key conflicts.
 */

import { JobStatus } from '../types/job.types.js';

/**
 * Redis Key Patterns:
 * - job:{id} - Store individual job object
 * - jobs:all - Set of all job IDs
 * - jobs:status:{status} - Set of job IDs grouped by status
 * - jobs:search:{field}:{value} - Optional search indexes for future use
 */

export const RedisKeys = {
  /**
   * Key for storing a single job object
   * @param id - Job UUID
   * @returns Redis key string (e.g., "job:123e4567-e89b-12d3-a456-426614174000")
   */
  job: (id: string): string => `job:${id}`,

  /**
   * Key for the set containing all job IDs
   * @returns Redis key string ("jobs:all")
   */
  allJobs: (): string => 'jobs:all',

  /**
   * Key for the set containing job IDs filtered by status
   * @param status - Job status (Pending, Reject, Interview, Hired)
   * @returns Redis key string (e.g., "jobs:status:Pending")
   */
  jobsByStatus: (status: JobStatus): string => `jobs:status:${status}`,

  /**
   * Key for search index by specific field and value
   * This is optional and can be used for advanced search features
   * @param field - Field name (e.g., "companyName", "jobTitle")
   * @param value - Field value to index
   * @returns Redis key string (e.g., "jobs:search:companyName:Google")
   */
  searchIndex: (field: string, value: string): string => `jobs:search:${field}:${value}`,
};

/**
 * Helper function to extract job ID from a Redis job key
 * @param key - Redis key (e.g., "job:123e4567-e89b-12d3-a456-426614174000")
 * @returns Job ID or null if invalid format
 */
export const extractJobIdFromKey = (key: string): string | null => {
  const prefix = 'job:';
  if (key.startsWith(prefix)) {
    return key.substring(prefix.length);
  }
  return null;
};

/**
 * Validate if a key follows the expected job key pattern
 * @param key - Redis key to validate
 * @returns true if valid job key format
 */
export const isValidJobKey = (key: string): boolean => {
  return /^job:[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(key);
};

/**
 * Get all possible status set keys
 * Useful for cleanup or migration operations
 * @returns Array of all status set keys
 */
export const getAllStatusKeys = (): string[] => {
  const statuses: JobStatus[] = ['Pending', 'Reject', 'Interview', 'Hired'];
  return statuses.map(status => RedisKeys.jobsByStatus(status));
};
