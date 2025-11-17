/**
 * Usage Examples for Redis Key Strategy
 *
 * This file demonstrates how to use the RedisKeys utility
 * in your services and controllers.
 */

import { RedisKeys, extractJobIdFromKey, isValidJobKey, getAllStatusKeys } from './redisKeys.js';
import type { JobStatus } from '../types/job.types.js';

// Example 1: Create a key for a specific job
const jobId = '123e4567-e89b-12d3-a456-426614174000';
const jobKey = RedisKeys.job(jobId);
console.log(jobKey); // Output: "job:123e4567-e89b-12d3-a456-426614174000"

// Example 2: Get the key for all jobs set
const allJobsKey = RedisKeys.allJobs();
console.log(allJobsKey); // Output: "jobs:all"

// Example 3: Get the key for jobs with a specific status
const status: JobStatus = 'Pending';
const pendingJobsKey = RedisKeys.jobsByStatus(status);
console.log(pendingJobsKey); // Output: "jobs:status:Pending"

// Example 4: Create a search index key (optional, for future use)
const searchKey = RedisKeys.searchIndex('companyName', 'Google');
console.log(searchKey); // Output: "jobs:search:companyName:Google"

// Example 5: Extract job ID from a Redis key
const extractedId = extractJobIdFromKey(jobKey);
console.log(extractedId); // Output: "123e4567-e89b-12d3-a456-426614174000"

// Example 6: Validate a job key format
const isValid = isValidJobKey(jobKey);
console.log(isValid); // Output: true

const invalidKey = isValidJobKey('invalid:key');
console.log(invalidKey); // Output: false

// Example 7: Get all status keys for cleanup operations
const statusKeys = getAllStatusKeys();
console.log(statusKeys);
// Output: [
//   "jobs:status:Pending",
//   "jobs:status:Reject",
//   "jobs:status:Interview",
//   "jobs:status:Hired"
// ]

/**
 * Real-world usage in a service:
 *
 * import { redisClient } from '../config/redis.config.js';
 * import { RedisKeys } from '../utils/redisKeys.js';
 *
 * // Store a job
 * await redisClient.set(RedisKeys.job(job.id), JSON.stringify(job));
 *
 * // Add job ID to the all jobs set
 * await redisClient.sAdd(RedisKeys.allJobs(), job.id);
 *
 * // Add job ID to the status-specific set
 * await redisClient.sAdd(RedisKeys.jobsByStatus(job.status), job.id);
 *
 * // Retrieve a job
 * const jobData = await redisClient.get(RedisKeys.job(jobId));
 *
 * // Get all job IDs with Pending status
 * const pendingIds = await redisClient.sMembers(RedisKeys.jobsByStatus('Pending'));
 */
