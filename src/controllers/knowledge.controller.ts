/**
 * Knowledge Controller
 *
 * Handles HTTP requests and responses for knowledge-related operations.
 * Acts as a bridge between routes and service layer.
 */

import { Request, Response } from 'express';
import * as knowledgeExtractionService from '../services/knowledge-extraction.service.js';
import * as knowledgeResearchService from '../services/knowledge-research.service.js';
import { ApiResponse } from '../types/response.types.js';
import {
  KnowledgeExtractionInput,
  KnowledgeExtractionOutput,
  KnowledgeResearchInput,
  KnowledgeResearchOutput,
} from '../types/knowledge.types.js';

/**
 * Extract knowledge requirements from job posting
 * POST /api/knowledge/extract
 */
export const extractKnowledgeHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const input: KnowledgeExtractionInput = req.body;
    
    const result = await knowledgeExtractionService.extractKnowledgeRequirements(input);

    if (!result.success) {
      const response: ApiResponse<never> = {
        success: false,
        error: result.error || 'Failed to extract knowledge requirements',
      };
      res.status(400).json(response);
      return;
    }

    const response: ApiResponse<KnowledgeExtractionOutput> = {
      success: true,
      data: result.data,
      message: result.data?.fromCache 
        ? 'Knowledge extracted successfully (from cache)' 
        : 'Knowledge extracted successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in extractKnowledgeHandler:', error);
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract knowledge requirements',
    };
    res.status(500).json(response);
  }
};

/**
 * Research knowledge topic for interview preparation
 * POST /api/knowledge/research
 */
export const researchKnowledgeHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const input: KnowledgeResearchInput = req.body;
    
    const result = await knowledgeResearchService.researchKnowledge(input);

    if (!result.success) {
      const response: ApiResponse<never> = {
        success: false,
        error: result.error || 'Failed to research knowledge topic',
      };
      res.status(400).json(response);
      return;
    }

    const response: ApiResponse<KnowledgeResearchOutput> = {
      success: true,
      data: result.data,
      message: result.data?.fromCache 
        ? 'Knowledge research completed successfully (from cache)' 
        : 'Knowledge research completed successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in researchKnowledgeHandler:', error);
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to research knowledge topic',
    };
    res.status(500).json(response);
  }
};
