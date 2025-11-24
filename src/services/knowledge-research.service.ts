import { AIResponseCacheModel } from '../models/ai-response-cache.model.js';
import { getGeminiModel, withRetry, getCacheExpiryDate } from '../config/gemini-client.js';
import {
  KnowledgeResearchInput,
  KnowledgeResearchOutput,
  ServiceResponse,
} from '../types/knowledge.types.js';
import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export const researchKnowledge = async (
  input: KnowledgeResearchInput
): Promise<ServiceResponse<KnowledgeResearchOutput>> => {
  const startTime = Date.now();

  try {
    // Validate input
    if (!input.knowledgeItem || !input.proficiencyLevel) {
      return {
        success: false,
        error: 'Missing required fields: knowledgeItem and proficiencyLevel are required',
      };
    }

    // Generate cache key from knowledge item and proficiency level
    const cacheKey = `research:${input.knowledgeItem.toLowerCase()}:${input.proficiencyLevel.toLowerCase()}`;

    // Check cache first (unless force refresh is requested)
    if (!input.forceRefresh) {
      const cachedResponse = await checkCache(cacheKey);
      if (cachedResponse) {
        const responseTime = Date.now() - startTime;
        return {
          success: true,
          data: {
            researchContent: cachedResponse,
            fromCache: true,
            responseTime,
          },
        };
      }
    } else {
      console.log(`Force refresh requested - skipping cache for key: ${cacheKey}`);
    }

    // Cache miss - call Gemini API
    const researchContent = await callGeminiForResearch(input);
    const responseTime = Date.now() - startTime;

    // Save to cache
    await saveToCache({
      cacheKey,
      knowledgeItem: input.knowledgeItem,
      proficiencyLevel: input.proficiencyLevel,
      responseContent: researchContent,
      responseTime,
    });

    return {
      success: true,
      data: {
        researchContent,
        fromCache: false,
        responseTime,
      },
    };
  } catch (error) {
    console.error('Knowledge research failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to research knowledge topic',
    };
  }
};

/**
 * Check cache for existing research content
 * 
 * @param cacheKey - Unique cache key
 * @returns Cached research content or null if not found
 */
const checkCache = async (cacheKey: string): Promise<string | null> => {
  try {
    const cached = await AIResponseCacheModel.findOne({
      cacheKey,
      cacheType: 'knowledge-research',
      expiresAt: { $gt: new Date() }, // Not expired
    }).lean();

    if (cached) {
      console.log(`Cache hit for key: ${cacheKey}`);
      return cached.responseContent;
    }

    console.log(`Cache miss for key: ${cacheKey}`);
    return null;
  } catch (error) {
    console.error('Cache lookup failed:', error);
    return null; // Fail gracefully - proceed without cache
  }
};

/**
 * Save research content to cache
 * 
 * @param data - Cache data to save
 */
const saveToCache = async (data: {
  cacheKey: string;
  knowledgeItem: string;
  proficiencyLevel: string;
  responseContent: string;
  responseTime: number;
}): Promise<void> => {
  try {
    // Use findOneAndUpdate with upsert to update existing cache or create new one
    // This prevents duplicate key errors when researching the same topic multiple times
    await AIResponseCacheModel.findOneAndUpdate(
      { cacheKey: data.cacheKey },
      {
        $set: {
          cacheType: 'knowledge-research',
          knowledgeItem: data.knowledgeItem,
          proficiencyLevel: data.proficiencyLevel,
          responseContent: data.responseContent,
          aiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
          responseTime: data.responseTime,
          expiresAt: getCacheExpiryDate(),
          updatedAt: new Date(),
        },
      },
      { 
        upsert: true, // Create if doesn't exist, update if exists
        new: true,    // Return the updated document
      }
    );

    console.log(`Saved/Updated cache with key: ${data.cacheKey}`);
  } catch (error) {
    // Log error but don't fail the request
    console.error('Failed to save to cache:', error);
  }
};

/**
 * Call Gemini API to research knowledge topic
 * Provides concise foundational knowledge overview
 * 
 * @param input - Knowledge item and proficiency level
 * @returns Research content tailored to proficiency level
 */
const callGeminiForResearch = async (
  input: KnowledgeResearchInput
): Promise<string> => {
  const prompt = `You are a learning advisor expert. Create a concise knowledge summary about: ${input.knowledgeItem}

PROFICIENCY LEVEL: ${input.proficiencyLevel}

CRITICAL REQUIREMENTS:
- Keep content SHORT and EASY TO UNDERSTAND - focus on foundational knowledge
- Use simple, memorable language
- Format with bullet points for easy reading
- Maximum length: 300-400 words
- NO code examples or technical implementation details

REQUIRED STRUCTURE:

1. **Core Concepts** (2-3 sentences)
   - Clear, simple definition
   - Why this knowledge matters

2. **Essential Knowledge** (4-6 key points)
   - Core concepts you must understand
   - Important terminology and meanings
   - Focus on understanding, NOT code or technical details

3. **Practical Application** (2-3 points)
   - When and why to use this
   - Common use cases
   - Real-world context

PROFICIENCY LEVEL GUIDELINES:

IF "${input.proficiencyLevel}" indicates DEEP/EXPERT level (deep knowledge, expert, advanced):
- Cover core fundamentals first
- Mention advanced concepts and architectural considerations
- Briefly note trade-offs and scalability aspects
- Suggest areas for deeper exploration
- Keep it digestible - overview, not deep dive

IF "${input.proficiencyLevel}" indicates INTERMEDIATE level (intermediate, working knowledge):
- Focus on solid understanding of fundamentals
- Explain how concepts connect to larger systems
- Mention common patterns and best practices
- Provide practical context

IF "${input.proficiencyLevel}" indicates BASIC level (surface, basic, familiarity, awareness):
- Stick strictly to core fundamentals
- Explain the "what" and "why" clearly
- Keep technical depth minimal
- Focus on recognition and basic understanding

IF "${input.proficiencyLevel}" indicates PRACTICAL level (know how to do, hands-on, practical):
- Emphasize when and how to apply
- Focus on decision-making: when to use
- Discuss common workflows
- Keep it action-oriented but conceptual

FORMATTING RULES:
- Use **bold** for section headers
- Use bullet points (-) for lists
- Keep paragraphs to 2-3 sentences maximum
- No code blocks or syntax
- No external links

REMEMBER: This is for KNOWLEDGE OVERVIEW, not a tutorial. Focus on helping users understand what they need to know at their proficiency level. Keep it simple, clear, and foundational.`;

  return await withRetry(async () => {
    const model = getGeminiModel();
    
    // Configure safety settings to be more permissive
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];
    
    // Optimize generation parameters
    const generationConfig = {
      temperature: 1.0,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
      candidateCount: 1,
    };
    
    console.log(`[Gemini API] Calling research for: ${input.knowledgeItem} (${input.proficiencyLevel})`);
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
      safetySettings,
    });
    
    const response = result.response;
    
    // Enhanced debugging and validation
    console.log('[Gemini API] Response received');
    console.log('[Gemini API] Candidates:', response.candidates?.length || 0);
    
    // Check if response was blocked
    if (response.promptFeedback?.blockReason) {
      console.error('[Gemini API] Prompt was blocked:', response.promptFeedback.blockReason);
      throw new Error(`Prompt blocked: ${response.promptFeedback.blockReason}`);
    }
    
    // Check finish reason
    const candidate = response.candidates?.[0];
    if (candidate?.finishReason) {
      console.log('[Gemini API] Finish reason:', candidate.finishReason);
      
      // Handle different finish reasons
      if (candidate.finishReason === 'SAFETY') {
        console.error('[Gemini API] Response blocked by safety filters');
        console.error('[Gemini API] Safety ratings:', candidate.safetyRatings);
        throw new Error('Response blocked by safety filters. Try rephrasing the knowledge item.');
      }
      
      if (candidate.finishReason === 'RECITATION') {
        console.warn('[Gemini API] Response blocked due to recitation');
        throw new Error('Response may resemble training data. This is rare - please try again.');
      }
      
      if (candidate.finishReason === 'MAX_TOKENS') {
        console.warn('[Gemini API] Response truncated due to max tokens');
        // Continue anyway - we'll get partial content
      }
    }
    
    const text = response.text();
    
    // Better empty response handling
    if (!text || text.trim().length === 0) {
      console.error('[Gemini API] Empty response received');
      console.error('[Gemini API] Full response:', JSON.stringify(response, null, 2));
      
      // Try to get more information about why it's empty
      if (candidate) {
        console.error('[Gemini API] Candidate finish reason:', candidate.finishReason);
        console.error('[Gemini API] Candidate safety ratings:', candidate.safetyRatings);
      }
      
      throw new Error(
        'Empty response from Gemini API. This may be due to: ' +
        '1) Content filtering (even with BLOCK_NONE), ' +
        '2) Model internal restrictions, or ' +
        '3) Temporary API issues. Please try again or rephrase the knowledge item.'
      );
    }

    // Validate minimum content length
    if (text.trim().length < 100) {
      console.warn('[Gemini API] Response is very short:', text.length, 'characters');
      throw new Error('Response too short - may indicate API issue or content filtering');
    }
    
    // Validate that response contains expected sections
    const processedText = text.trim();
    const hasKeyContent = 
      processedText.includes('Core Concepts') || 
      processedText.includes('Essential Knowledge') ||
      processedText.includes('Practical Application');
    
    if (!hasKeyContent) {
      console.warn('[Gemini API] Response may not follow expected format');
      console.warn('[Gemini API] Response preview:', processedText.substring(0, 200));
      // Don't throw error - still return the content
    }
    
    console.log('[Gemini API] Successfully generated response:', processedText.length, 'characters');
    return processedText;
    
  }, 'Knowledge research API call');
};

/**
 * ALTERNATIVE SOLUTION: Fallback with simpler prompt if main prompt fails
 * Use this as a backup strategy
 */
const callGeminiForResearchWithFallback = async (
  input: KnowledgeResearchInput
): Promise<string> => {
  try {
    // Try main prompt first
    return await callGeminiForResearch(input);
  } catch (error: unknown) {
    console.warn('[Gemini API] Main prompt failed, trying simplified fallback...');
    
    // Fallback: Much simpler, shorter prompt
    const simplifiedPrompt = `Explain ${input.knowledgeItem} for a job interview. 
Keep it under 300 words. Include:
- What it is (2 sentences)
- Why it matters (2 sentences)
- 3 key concepts to know
- 2 common interview questions
Focus on ${input.proficiencyLevel} level understanding.`;
    
    return await withRetry(async () => {
      const model = getGeminiModel();
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: simplifiedPrompt }] }],
        generationConfig: {
          temperature: 1.0,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      });
      
      const text = result.response.text();
      if (!text || text.trim().length === 0) {
        throw new Error('Fallback prompt also returned empty response');
      }
      
      return text.trim();
    }, 'Knowledge research fallback API call');
  }
};