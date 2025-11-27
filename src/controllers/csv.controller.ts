/**
 * CSV Controller
 *
 * Handles HTTP requests for CSV import/export operations.
 */

import { Request, Response } from 'express';
import * as csvService from '../services/csv.service.js';
import { ApiResponse } from '../types/response.types.js';
import Papa from 'papaparse';

// Extend Express Request to include multer file
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

/**
 * Export all jobs as CSV
 * GET /api/jobs/export
 */
export const exportJobsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobs = await csvService.exportJobsToCSV();

    // Convert jobs to CSV format
    const csv = Papa.unparse(jobs, {
      columns: [
        'id',
        'jobTitle',
        'companyName',
        'applicationLink',
        'companyLink',
        'requirements',
        'jobDescription',
        'status',
        'notes',
        'appliedDate',
        'createdAt',
        'updatedAt',
      ],
      header: true,
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=jobs.csv');
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error in exportJobsHandler:', error);
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export jobs',
    };
    res.status(500).json(response);
  }
};

/**
 * Import jobs from CSV file
 * POST /api/jobs/import
 */
export const importJobsHandler = async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'No file uploaded',
      };
      res.status(400).json(response);
      return;
    }

    // Parse CSV file
    const csvText = req.file.buffer.toString('utf-8');
    
    const parseResult = await new Promise<Papa.ParseResult<csvService.ImportJobDTO>>((resolve, reject) => {
      Papa.parse<csvService.ImportJobDTO>(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        transformHeader: (header: string) => {
          // Map 'id' column to '_id' for import
          if (header.trim() === 'id') {
            return '_id';
          }
          return header.trim();
        },
        transform: (value: string) => value.trim(),
        complete: (results: Papa.ParseResult<csvService.ImportJobDTO>) => resolve(results),
        error: (error: Error) => reject(error),
      });
    });

    if (parseResult.errors.length > 0) {
      console.error('CSV parsing errors:', parseResult.errors);
      const response: ApiResponse<never> = {
        success: false,
        error: 'CSV parsing failed',
      };
      res.status(400).json(response);
      return;
    }

    // Import jobs using the service
    const importResult = await csvService.importJobsFromCSV(parseResult.data);

    const response: ApiResponse<typeof importResult> = {
      success: importResult.success,
      data: importResult,
      message: `Import completed: ${importResult.created} created, ${importResult.updated} updated, ${importResult.failed} failed`,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in importJobsHandler:', error);
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import jobs',
    };
    res.status(500).json(response);
  }
};
