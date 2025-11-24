/**
 * Job Controller
 *
 * Handles HTTP requests and responses for job-related operations.
 * Acts as a bridge between routes and service layer.
 */

import { Request, Response } from 'express';
import * as jobService from '../services/job.service.js';
import { CreateJobDTO, UpdateJobDTO, JobStatus } from '../types/job.types.js';
import { ApiResponse } from '../types/response.types.js';

/**
 * Create a new job
 * POST /api/jobs
 */
export const createJobHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobData: CreateJobDTO = req.body;
    const newJob = await jobService.createJob(jobData);

    const response: ApiResponse<typeof newJob> = {
      success: true,
      data: newJob,
      message: 'Job created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error in createJobHandler:', error);
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create job',
    };
    res.status(500).json(response);
  }
};

/**
 * Get all jobs with pagination
 * GET /api/jobs?page=1&limit=10
 */
export const getAllJobsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract pagination parameters from query string
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await jobService.getAllJobs(page, limit);

    const response: ApiResponse<typeof result.jobs> = {
      success: true,
      data: result.jobs,
      message: `Retrieved ${result.jobs.length} job(s) from page ${result.pagination.currentPage}`,
      pagination: result.pagination,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getAllJobsHandler:', error);
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve jobs',
    };
    res.status(500).json(response);
  }
};

/**
 * Get a single job by ID
 * GET /api/jobs/:id
 */
export const getJobByIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const job = await jobService.getJobById(id);

    if (!job) {
      const response: ApiResponse<never> = {
        success: false,
        error: `Job with ID ${id} not found`,
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<typeof job> = {
      success: true,
      data: job,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getJobByIdHandler:', error);
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve job',
    };
    res.status(500).json(response);
  }
};

/**
 * Update a job
 * PUT /api/jobs/:id
 */
export const updateJobHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateJobDTO = req.body;

    const updatedJob = await jobService.updateJob(id, updateData);

    if (!updatedJob) {
      const response: ApiResponse<never> = {
        success: false,
        error: `Job with ID ${id} not found`,
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<typeof updatedJob> = {
      success: true,
      data: updatedJob,
      message: 'Job updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in updateJobHandler:', error);
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update job',
    };
    res.status(500).json(response);
  }
};

/**
 * Delete a job
 * DELETE /api/jobs/:id
 */
export const deleteJobHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await jobService.deleteJob(id);

    if (!deleted) {
      const response: ApiResponse<never> = {
        success: false,
        error: `Job with ID ${id} not found`,
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<never> = {
      success: true,
      message: 'Job deleted successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in deleteJobHandler:', error);
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete job',
    };
    res.status(500).json(response);
  }
};

/**
 * Get jobs by status
 * GET /api/jobs/status/:status
 */
export const getJobsByStatusHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.params;

    // Validate status value
    const validStatuses: JobStatus[] = ['Pending', 'Reject', 'Interview', 'Hired'];
    if (!validStatuses.includes(status as JobStatus)) {
      const response: ApiResponse<never> = {
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      };
      res.status(400).json(response);
      return;
    }

    const jobs = await jobService.getJobsByStatus(status as JobStatus);

    const response: ApiResponse<typeof jobs> = {
      success: true,
      data: jobs,
      message: `Retrieved ${jobs.length} job(s) with status ${status}`,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getJobsByStatusHandler:', error);
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve jobs by status',
    };
    res.status(500).json(response);
  }
};
