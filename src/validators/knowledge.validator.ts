/**
 * Knowledge Validation Schemas
 *
 * Defines Joi validation schemas for knowledge extraction and research operations.
 * Ensures data integrity before it reaches the service layer.
 */

import Joi from 'joi';

/**
 * Validation schema for knowledge extraction request
 * Requires job title, requirements, and job description
 */
export const extractKnowledgeSchema = Joi.object({
  jobTitle: Joi.string()
    .required()
    .min(1)
    .max(500)
    .messages({
      'string.empty': 'Job title is required',
      'string.min': 'Job title must not be empty',
      'string.max': 'Job title must not exceed 500 characters',
      'any.required': 'Job title is required',
    }),

  requirements: Joi.string()
    .required()
    .min(1)
    .messages({
      'string.empty': 'Requirements are required',
      'string.min': 'Requirements must not be empty',
      'any.required': 'Requirements are required',
    }),

  jobDescription: Joi.string()
    .required()
    .min(1)
    .messages({
      'string.empty': 'Job description is required',
      'string.min': 'Job description must not be empty',
      'any.required': 'Job description is required',
    }),

  jobId: Joi.string()
    .optional()
    .messages({
      'string.base': 'Job ID must be a string',
    }),

  forceRefresh: Joi.boolean()
    .optional()
    .default(false)
    .messages({
      'boolean.base': 'Force refresh must be a boolean',
    }),
});

/**
 * Validation schema for knowledge research request
 * Requires knowledge item and proficiency level
 */
export const researchKnowledgeSchema = Joi.object({
  knowledgeItem: Joi.string()
    .required()
    .min(1)
    .max(200)
    .messages({
      'string.empty': 'Knowledge item is required',
      'string.min': 'Knowledge item must not be empty',
      'string.max': 'Knowledge item must not exceed 200 characters',
      'any.required': 'Knowledge item is required',
    }),

  proficiencyLevel: Joi.string()
    .required()
    .min(1)
    .max(100)
    .messages({
      'string.empty': 'Proficiency level is required',
      'string.min': 'Proficiency level must not be empty',
      'string.max': 'Proficiency level must not exceed 100 characters',
      'any.required': 'Proficiency level is required',
    }),

  forceRefresh: Joi.boolean()
    .optional()
    .default(false)
    .messages({
      'boolean.base': 'Force refresh must be a boolean',
    }),
});
