/**
 * Job Routes
 *
 * Defines all HTTP routes for job-related operations.
 * Routes are prefixed with /api/jobs in the main app.
 */

import express from 'express';
import multer from 'multer';
import * as jobController from '../controllers/job.controller.js';
import * as csvController from '../controllers/csv.controller.js';
import { validateRequest, validateParams } from '../middlewares/validation.middleware.js';
import { createJobSchema, updateJobSchema, jobIdSchema, statusSchema } from '../validators/job.validator.js';
import Joi from 'joi';

const router = express.Router();

// Configure multer for CSV file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

/**
 * GET /api/jobs/export
 * Export all jobs as CSV file
 * Response: CSV file download
 */
router.get('/export', csvController.exportJobsHandler);

/**
 * POST /api/jobs/import
 * Import jobs from CSV file
 * Body: multipart/form-data with 'file' field
 * Response: Import result with statistics
 */
router.post('/import', upload.single('file'), csvController.importJobsHandler);

/**
 * POST /api/jobs
 * Create a new job
 * Body: CreateJobDTO
 * Response: 201 with created job
 */
router.post(
  '/',
  validateRequest(createJobSchema),
  jobController.createJobHandler
);

/**
 * GET /api/jobs
 * Get all jobs
 * Response: 200 with array of jobs
 */
router.get(
  '/',
  jobController.getAllJobsHandler
);

/**
 * GET /api/jobs/status/:status
 * Get jobs filtered by status
 * Params: status (Pending | Reject | Interview | Hired)
 * Response: 200 with filtered jobs
 *
 * NOTE: This route MUST be defined before GET /api/jobs/:id
 * to avoid :status being interpreted as :id
 */
router.get(
  '/status/:status',
  validateParams(Joi.object({ status: statusSchema })),
  jobController.getJobsByStatusHandler
);

/**
 * GET /api/jobs/:id
 * Get a single job by ID
 * Params: id (UUID)
 * Response: 200 with job or 404 if not found
 */
router.get(
  '/:id',
  validateParams(Joi.object({ id: jobIdSchema })),
  jobController.getJobByIdHandler
);

/**
 * PUT /api/jobs/:id
 * Update a job
 * Params: id (UUID)
 * Body: UpdateJobDTO
 * Response: 200 with updated job or 404 if not found
 */
router.put(
  '/:id',
  validateParams(Joi.object({ id: jobIdSchema })),
  validateRequest(updateJobSchema),
  jobController.updateJobHandler
);

/**
 * DELETE /api/jobs/:id
 * Delete a job
 * Params: id (UUID)
 * Response: 200 on success or 404 if not found
 */
router.delete(
  '/:id',
  validateParams(Joi.object({ id: jobIdSchema })),
  jobController.deleteJobHandler
);

export default router;
