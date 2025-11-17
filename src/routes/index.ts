/**
 * Main Routes Index
 *
 * Combines all application routes into a single router.
 * This router is mounted at /api in the main application.
 */

import express from 'express';
import jobRoutes from './job.routes.js';

const router = express.Router();

/**
 * Job routes
 * Mounted at /api/jobs
 *
 * Available endpoints:
 * - POST   /api/jobs              - Create new job
 * - GET    /api/jobs              - Get all jobs
 * - GET    /api/jobs/status/:status - Get jobs by status
 * - GET    /api/jobs/:id          - Get job by ID
 * - PUT    /api/jobs/:id          - Update job
 * - DELETE /api/jobs/:id          - Delete job
 */
router.use('/jobs', jobRoutes);

/**
 * Health check endpoint
 * GET /api/health
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
