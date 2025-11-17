/**
 * Logger Middleware
 *
 * Logs incoming HTTP requests with timestamps and duration.
 * Useful for debugging and monitoring API usage.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Request logger middleware
 * Logs method, path, status code, and response time
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Log when request is received
  console.log(`[${timestamp}] ${req.method} ${req.path}`);

  // Log when response is finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusColor = res.statusCode >= 400 ? '🔴' : '🟢';

    console.log(
      `[${timestamp}] ${statusColor} ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};

/**
 * Simple request logger (minimal version)
 * Only logs method and path
 */
export const simpleLogger = (req: Request, res: Response, next: NextFunction): void => {
  console.log(`${req.method} ${req.path}`);
  next();
};
