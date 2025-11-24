/**
 * Knowledge Extraction Service
 *
 * Analyzes job postings and extracts required knowledge areas with proficiency levels.
 * Implements caching to minimize API costs and improve response times.
 */

import crypto from 'crypto';
import { AIResponseCacheModel } from '../models/ai-response-cache.model.js';
import { getGeminiModel, withRetry, getCacheExpiryDate } from '../config/gemini-client.js';
import {
  KnowledgeExtractionInput,
  KnowledgeExtractionOutput,
  ServiceResponse,
} from '../types/knowledge.types.js';

/**
 * Extract knowledge requirements from job posting
 * 
 * Analyzes job title, requirements, and description to identify required
 * knowledge areas and their proficiency levels using Gemini AI.
 * Results are cached to minimize API calls.
 * 
 * @param input - Job posting information
 * @returns Service response with extracted knowledge or error
 * 
 * @example
 * ```typescript
 * const result = await extractKnowledgeRequirements({
 *   jobTitle: 'Senior Full Stack Developer',
 *   requirements: 'Strong React and Node.js experience...',
 *   jobDescription: 'We are looking for...',
 *   jobId: '507f1f77bcf86cd799439011'
 * });
 * 
 * if (result.success) {
 *   console.log(result.data.extractedKnowledge);
 *   console.log('From cache:', result.data.fromCache);
 * }
 * ```
 */
export const extractKnowledgeRequirements = async (
  input: KnowledgeExtractionInput
): Promise<ServiceResponse<KnowledgeExtractionOutput>> => {
  const startTime = Date.now();

  try {
    // Validate input
    if (!input.jobTitle || !input.requirements || !input.jobDescription) {
      return {
        success: false,
        error: 'Missing required fields: jobTitle, requirements, and jobDescription are required',
      };
    }

    // Generate hash for cache lookup
    const inputHash = generateInputHash(input);
    const cacheKey = `extraction:${inputHash}`;

    // Check cache first (unless force refresh is requested)
    if (!input.forceRefresh) {
      const cachedResponse = await checkCache(cacheKey);
      if (cachedResponse) {
        const responseTime = Date.now() - startTime;
        return {
          success: true,
          data: {
            extractedKnowledge: cachedResponse,
            fromCache: true,
            responseTime,
          },
        };
      }
    } else {
      console.log(`Force refresh requested - skipping cache for key: ${cacheKey}`);
    }

    // Cache miss - call Gemini API
    console.log('Calling Gemini API for knowledge extraction...');
    const extractedKnowledge = await callGeminiForExtraction(input);
    const responseTime = Date.now() - startTime;

    // Save to cache
    console.log('Saving response to cache...');
    await saveToCache({
      cacheKey,
      inputHash,
      jobId: input.jobId,
      responseContent: extractedKnowledge,
      responseTime,
    });

    return {
      success: true,
      data: {
        extractedKnowledge,
        fromCache: false,
        responseTime,
      },
    };
  } catch (error) {
    console.error('Knowledge extraction failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract knowledge requirements',
    };
  }
};

/**
 * Check cache for existing response
 * 
 * @param cacheKey - Unique cache key
 * @returns Cached response content or null if not found
 */
const checkCache = async (cacheKey: string): Promise<string | null> => {
  try {
    const cached = await AIResponseCacheModel.findOne({
      cacheKey,
      cacheType: 'knowledge-extraction',
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
 * Save response to cache
 * 
 * @param data - Cache data to save
 */
const saveToCache = async (data: {
  cacheKey: string;
  inputHash: string;
  jobId?: string;
  responseContent: string;
  responseTime: number;
}): Promise<void> => {
  try {
    // Use findOneAndUpdate with upsert to update existing cache or create new one
    // This prevents duplicate key errors when re-extracting
    await AIResponseCacheModel.findOneAndUpdate(
      { cacheKey: data.cacheKey },
      {
        $set: {
          cacheType: 'knowledge-extraction',
          inputHash: data.inputHash,
          jobId: data.jobId,
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
 * Generate SHA-256 hash from input for cache key
 * 
 * @param input - Knowledge extraction input
 * @returns Hexadecimal hash string
 */
const generateInputHash = (input: KnowledgeExtractionInput): string => {
  const content = `${input.jobTitle}|${input.requirements}|${input.jobDescription}`;
  return crypto.createHash('sha256').update(content).digest('hex');
};

/**
 * Call Gemini API to extract knowledge requirements
 * 
 * @param input - Job posting information
 * @returns Extracted knowledge as bullet-point list
 */
const callGeminiForExtraction = async (
  input: KnowledgeExtractionInput
): Promise<string> => {
  const prompt = `You are an expert technical recruiter with deep understanding of technology roles. Your task is to extract ONLY specific, concrete technical skills and knowledge areas from a job posting.

===== JOB INFORMATION =====
Job Title: ${input.jobTitle}

Requirements:
${input.requirements}

Job Description:
${input.jobDescription}

===== EXTRACTION RULES =====

WHAT TO EXTRACT:
✓ Programming languages with versions (e.g., "Python 3.10+", "Java 17", "JavaScript ES6+")
✓ Frameworks and libraries with versions (e.g., "React 18", "Spring Boot 3.x", "Django 4.0")
✓ Databases and data stores (e.g., "PostgreSQL", "MongoDB", "Redis", "Elasticsearch")
✓ Cloud platforms and services (e.g., "AWS EC2", "Azure Functions", "Google Cloud Run")
✓ DevOps tools and practices (e.g., "Docker", "Kubernetes", "Jenkins", "GitLab CI/CD")
✓ Development tools (e.g., "Git", "VS Code", "IntelliJ IDEA")
✓ Specific methodologies (e.g., "Agile/Scrum", "TDD", "CI/CD pipelines")
✓ Protocols and standards (e.g., "REST API", "GraphQL", "OAuth 2.0", "WebSocket")
✓ Architecture patterns (e.g., "Microservices", "Event-driven architecture", "MVC")
✓ Testing frameworks (e.g., "Jest", "Pytest", "JUnit", "Cypress")
✓ Data processing tools (e.g., "Apache Kafka", "Apache Spark", "Airflow")
✓ Security tools and practices (e.g., "OWASP", "Penetration Testing", "SSL/TLS")

WHAT NOT TO EXTRACT:
✗ Generic phrases like "Software Development", "Programming Experience", "Technology Research"
✗ Soft skills like "Problem Solving", "Communication", "Team Collaboration"
✗ Business concepts like "Stakeholder Management", "Project Management"
✗ General abilities like "Learning Ability", "Analytical Thinking"
✗ Job responsibilities like "Code Review", "Mentoring" (unless they specify a tool/method)
✗ Industry knowledge like "E-commerce Domain", "Healthcare Experience"
✗ Years of experience (extract the technology, not the duration)

===== PROFICIENCY LEVEL GUIDELINES =====

Use these EXACT phrases based on context clues in the job posting:

1. "Deep knowledge" - When the posting mentions:
   - "Deep understanding", "expert-level", "mastery"
   - "Architect", "design complex systems", "lead technical decisions"
   - "In-depth knowledge", "comprehensive understanding"
   
2. "Expert level" - When the posting mentions:
   - "Expert", "highly proficient", "advanced"
   - "Senior-level expertise", "specialist"
   - "Extensive experience", "proven track record"

3. "Intermediate understanding" - When the posting mentions:
   - "Solid understanding", "good knowledge", "proficient"
   - "Mid-level", "working proficiency"
   - "Comfortable with", "strong foundation"

4. "Working knowledge" - When the posting mentions:
   - "Familiarity with", "basic knowledge", "understanding of"
   - "Exposure to", "some experience"
   - "Ability to work with", "can use effectively"

5. "Hands-on experience required" - When the posting mentions:
   - "Must have used", "practical experience"
   - "Demonstrated experience", "proven ability"
   - "Built/developed using", "worked with in production"

6. "Practical application" - When the posting mentions:
   - "Apply in real scenarios", "use in projects"
   - "Implement solutions", "deliver results"
   - "Real-world experience", "production environment"

===== CONTEXT ANALYSIS TIPS =====

- If a technology is mentioned in "Required" or "Must have" → Assign higher proficiency
- If a technology is mentioned in "Nice to have" or "Bonus" → Assign lower proficiency
- If multiple related technologies are listed, extract each one separately
- If the job title suggests seniority (Senior, Lead, Principal) → Lean toward higher proficiency
- If the job title suggests entry-level (Junior, Associate) → Lean toward basic proficiency
- Look for action verbs: "architect" → Deep knowledge, "use" → Working knowledge
- Consider the context: "3+ years of React" → Expert level, "Experience with React" → Intermediate

===== OUTPUT FORMAT =====

Provide ONLY the extracted items in this format (one per line, no numbering, no headers, no extra text):

<Technology/Skill>: <Proficiency Level>

Ensure:
- Each line contains exactly ONE technology and ONE proficiency level
- Use exact proficiency level phrases from the list above
- Be specific with technology names and versions when mentioned
- List items from most important to least important based on context
- Extract 5-20 items typically (don't over-extract or under-extract)

===== EXAMPLES =====

GOOD EXTRACTION:
React 18: Expert level
Node.js: Deep knowledge
PostgreSQL 14: Intermediate understanding
Docker: Hands-on experience required
AWS Lambda: Practical application
TypeScript: Expert level
REST API Design: Deep knowledge
Jest: Working knowledge
Git: Hands-on experience required
CI/CD: Practical application

BAD EXTRACTION (DO NOT DO):
Software Development: Practical application ❌ (too generic)
Programming: Expert level ❌ (not specific)
Problem Solving: Deep knowledge ❌ (soft skill)
5+ years experience: Expert level ❌ (duration, not skill)
Team Leadership: Working knowledge ❌ (not technical)

===== BEGIN EXTRACTION =====

Now carefully analyze the job posting above and extract the technical knowledge requirements:`;

  return await withRetry(async () => {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from Gemini API');
    }

    return text.trim();
  }, 'Knowledge extraction API call');
};