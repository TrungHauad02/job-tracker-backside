/**
 * Not Found Middleware
 *
 * Handles 404 errors for undefined routes.
 * Should be registered before the global error handler.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 404 Not Found handler
 * Catches all requests that don't match any defined routes
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
    message: 'The requested resource does not exist',
  });
};
