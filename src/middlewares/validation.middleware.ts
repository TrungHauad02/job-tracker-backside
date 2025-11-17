/**
 * Validation Middleware
 *
 * Provides middleware functions for request validation using Joi schemas.
 * Validates request body, params, and query parameters.
 */

import { Request, Response, NextFunction } from 'express';
import Joi, { Schema } from 'joi';

/**
 * Middleware to validate request body against a Joi schema
 * @param schema - Joi validation schema
 * @returns Express middleware function
 */
export const validateRequest = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown properties
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      res.status(400).json({
        success: false,
        error: errorMessages.join('; '),
        details: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
      return;
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

/**
 * Middleware to validate request params against a Joi schema
 * @param schema - Joi validation schema
 * @returns Express middleware function
 */
export const validateParams = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      res.status(400).json({
        success: false,
        error: errorMessages.join('; '),
        details: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
      return;
    }

    req.params = value;
    next();
  };
};

/**
 * Middleware to validate query parameters against a Joi schema
 * @param schema - Joi validation schema
 * @returns Express middleware function
 */
export const validateQuery = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      res.status(400).json({
        success: false,
        error: errorMessages.join('; '),
        details: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
      return;
    }

    req.query = value;
    next();
  };
};

/**
 * Create a validation schema for a single parameter
 * Useful for validating route parameters like :id
 * @param paramName - Name of the parameter
 * @param paramSchema - Joi schema for the parameter
 * @returns Joi object schema
 */
export const createParamSchema = (paramName: string, paramSchema: Schema) => {
  return Joi.isSchema(paramSchema)
    ? Joi.object({ [paramName]: paramSchema })
    : paramSchema;
};
