/**
 * Knowledge Types
 * 
 * Type definitions for knowledge extraction and research services.
 */

/**
 * Proficiency levels for knowledge requirements
 */
export enum ProficiencyLevel {
  DEEP_KNOWLEDGE = 'Deep knowledge',
  EXPERT_LEVEL = 'Expert level',
  INTERMEDIATE_UNDERSTANDING = 'Intermediate understanding',
  WORKING_KNOWLEDGE = 'Working knowledge',
  SURFACE_LEVEL = 'Surface level',
  BASIC_FAMILIARITY = 'Basic familiarity',
  KNOW_HOW_TO_DO = 'Know how to do',
  PRACTICAL_APPLICATION = 'Practical application',
  HANDS_ON_EXPERIENCE = 'Hands-on experience required',
  AWARENESS = 'Awareness',
  CONCEPTUAL_UNDERSTANDING = 'Conceptual understanding',
}

/**
 * Input for knowledge extraction service
 */
export interface KnowledgeExtractionInput {
  jobTitle: string;
  requirements: string;
  jobDescription: string;
  jobId?: string; // Optional: to link with job document
  forceRefresh?: boolean; // Optional: bypass cache and force new AI generation
}

/**
 * Output from knowledge extraction service
 */
export interface KnowledgeExtractionOutput {
  extractedKnowledge: string; // Bullet-point formatted list
  fromCache: boolean;
  tokensUsed?: number;
  responseTime?: number; // milliseconds
}

/**
 * Input for knowledge research service
 */
export interface KnowledgeResearchInput {
  knowledgeItem: string;
  proficiencyLevel: string;
  forceRefresh?: boolean; // Optional: bypass cache and force new AI generation
}

/**
 * Output from knowledge research service
 */
export interface KnowledgeResearchOutput {
  researchContent: string;
  fromCache: boolean;
  tokensUsed?: number;
  responseTime?: number; // milliseconds
}

/**
 * Generic service response wrapper
 */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Cache types for AI responses
 */
export type CacheType = 'knowledge-extraction' | 'knowledge-research';
