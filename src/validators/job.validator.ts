/**
 * Job Validation Schemas
 *
 * Defines Joi validation schemas for job creation and update operations.
 * Ensures data integrity before it reaches the service layer.
 */

import Joi from 'joi';

/**
 * Validation schema for creating a new job
 * All fields except companyLink and notes are required
 */
export const createJobSchema = Joi.object({
  jobTitle: Joi.string()
    .required()
    .min(1)
    .max(200)
    .messages({
      'string.empty': 'Job title is required',
      'string.min': 'Job title must not be empty',
      'string.max': 'Job title must not exceed 200 characters',
      'any.required': 'Job title is required',
    }),

  companyName: Joi.string()
    .required()
    .min(1)
    .max(200)
    .messages({
      'string.empty': 'Company name is required',
      'string.min': 'Company name must not be empty',
      'string.max': 'Company name must not exceed 200 characters',
      'any.required': 'Company name is required',
    }),

  applicationLink: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'Application link must be a valid URL',
      'any.required': 'Application link is required',
    }),

  companyLink: Joi.string()
    .uri()
    .optional()
    .allow('')
    .messages({
      'string.uri': 'Company link must be a valid URL',
    }),

  requirements: Joi.string()
    .required()
    .messages({
      'string.empty': 'Requirements are required',
      'any.required': 'Requirements are required',
    }),

  jobDescription: Joi.string()
    .required()
    .messages({
      'string.empty': 'Job description is required',
      'any.required': 'Job description is required',
    }),

  status: Joi.string()
    .valid('Pending', 'Reject', 'Interview', 'Hired')
    .required()
    .messages({
      'any.only': 'Status must be one of: Pending, Reject, Interview, Hired',
      'any.required': 'Status is required',
    }),

  notes: Joi.string()
    .allow('')
    .optional()
    .default(''),

  appliedDate: Joi.string()
    .isoDate()
    .required()
    .messages({
      'string.isoDate': 'Applied date must be a valid ISO date (YYYY-MM-DD)',
      'any.required': 'Applied date is required',
    }),
});

/**
 * Validation schema for updating a job
 * All fields are optional, but at least one must be provided
 */
export const updateJobSchema = Joi.object({
  jobTitle: Joi.string()
    .min(1)
    .max(200)
    .messages({
      'string.min': 'Job title must not be empty',
      'string.max': 'Job title must not exceed 200 characters',
    }),

  companyName: Joi.string()
    .min(1)
    .max(200)
    .messages({
      'string.min': 'Company name must not be empty',
      'string.max': 'Company name must not exceed 200 characters',
    }),

  applicationLink: Joi.string()
    .uri()
    .messages({
      'string.uri': 'Application link must be a valid URL',
    }),

  companyLink: Joi.string()
    .uri()
    .allow('')
    .messages({
      'string.uri': 'Company link must be a valid URL',
    }),

  requirements: Joi.string(),

  jobDescription: Joi.string(),

  status: Joi.string()
    .valid('Pending', 'Reject', 'Interview', 'Hired')
    .messages({
      'any.only': 'Status must be one of: Pending, Reject, Interview, Hired',
    }),

  notes: Joi.string()
    .allow(''),

  appliedDate: Joi.string()
    .isoDate()
    .messages({
      'string.isoDate': 'Applied date must be a valid ISO date (YYYY-MM-DD)',
    }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

/**
 * Validation schema for job ID parameter
 * Validates UUID v4 format
 */
export const jobIdSchema = Joi.string()
  .uuid({ version: 'uuidv4' })
  .required()
  .messages({
    'string.guid': 'Job ID must be a valid UUID',
    'any.required': 'Job ID is required',
  });

/**
 * Validation schema for status parameter
 * Used in query/path parameters
 */
export const statusSchema = Joi.string()
  .valid('Pending', 'Reject', 'Interview', 'Hired')
  .required()
  .messages({
    'any.only': 'Status must be one of: Pending, Reject, Interview, Hired',
    'any.required': 'Status is required',
  });
