/**
 * Error Handling Middleware
 *
 * Global error handler for Express application.
 * Catches all errors and returns consistent error responses.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Custom error interface with optional status code
 */
interface CustomError extends Error {
  status?: number;
  statusCode?: number;
}

/**
 * Global error handler middleware
 * Must be registered as the last middleware in the chain
 *
 * @param err - Error object
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error for debugging
  console.error('Error occurred:');
  console.error('Path:', req.method, req.path);
  console.error('Stack:', err.stack);

  // Determine status code
  const statusCode = err.status || err.statusCode || 500;

  // Determine error message
  const message = err.message || 'Internal Server Error';

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err,
    }),
  });
};
