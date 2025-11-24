/**
 * Knowledge Routes
 *
 * Defines all HTTP routes for knowledge-related operations.
 * Routes are prefixed with /api/knowledge in the main app.
 */

import express from 'express';
import * as knowledgeController from '../controllers/knowledge.controller.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { extractKnowledgeSchema, researchKnowledgeSchema } from '../validators/knowledge.validator.js';

const router = express.Router();

/**
 * POST /api/knowledge/extract
 * Extract knowledge requirements from job posting
 * Body: { jobTitle, requirements, jobDescription, jobId? }
 * Response: 200 with extracted knowledge list
 */
router.post(
  '/extract',
  validateRequest(extractKnowledgeSchema),
  knowledgeController.extractKnowledgeHandler
);

/**
 * POST /api/knowledge/research
 * Research specific knowledge topic for interview preparation
 * Body: { knowledgeItem, proficiencyLevel }
 * Response: 200 with research content
 */
router.post(
  '/research',
  validateRequest(researchKnowledgeSchema),
  knowledgeController.researchKnowledgeHandler
);

export default router;
