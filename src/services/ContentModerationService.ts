/**
 * Content Moderation Service for @rumenx/chatbot
 *
 * Provides AI-powered content moderation using OpenAI's Moderation API
 * and custom rule-based checks for comprehensive safety.
 *
 * Features:
 * - OpenAI Moderation API integration
 * - Custom rule-based moderation
 * - Configurable thresholds
 * - Detailed moderation results
 * - Rate limiting and caching
 */

import OpenAI from 'openai';

/**
 * Moderation categories from OpenAI
 */
export interface ModerationCategories {
  /** Content that expresses, incites, or promotes hate based on race, gender, ethnicity, religion, nationality, sexual orientation, disability status, or caste */
  hate: boolean;
  /** Hateful content that also includes violence or serious harm towards the targeted group */
  'hate/threatening': boolean;
  /** Content that promotes, encourages, or depicts acts of self-harm */
  'self-harm': boolean;
  /** Content where the speaker expresses that they are engaging or intend to engage in acts of self-harm */
  'self-harm/intent': boolean;
  /** Content that encourages performing acts of self-harm */
  'self-harm/instructions': boolean;
  /** Content meant to arouse sexual excitement */
  sexual: boolean;
  /** Sexual content that includes an individual who is under 18 years old */
  'sexual/minors': boolean;
  /** Content that depicts death, violence, or serious physical injury */
  violence: boolean;
  /** Content that promotes or glorifies violence or celebrates the suffering or humiliation of others */
  'violence/graphic': boolean;
}

/**
 * Moderation category scores (0-1)
 */
export interface ModerationCategoryScores {
  hate: number;
  'hate/threatening': number;
  'self-harm': number;
  'self-harm/intent': number;
  'self-harm/instructions': number;
  sexual: number;
  'sexual/minors': number;
  violence: number;
  'violence/graphic': number;
}

/**
 * OpenAI moderation result
 */
export interface OpenAIModerationResult {
  flagged: boolean;
  categories: ModerationCategories;
  category_scores: ModerationCategoryScores;
}

/**
 * Content moderation result
 */
export interface ModerationResult {
  /** Whether the content was flagged */
  flagged: boolean;
  /** Flagged categories */
  categories: string[];
  /** Category scores */
  scores: Record<string, number>;
  /** Whether to block the content */
  shouldBlock: boolean;
  /** Moderation provider used */
  provider: 'openai' | 'custom' | 'combined';
  /** Additional details */
  details?: string;
}

/**
 * Content moderation configuration
 */
export interface ModerationConfig {
  /** OpenAI API key for moderation */
  apiKey?: string;
  /** Whether to use OpenAI moderation API */
  useOpenAI?: boolean;
  /** Whether to use custom rule-based moderation */
  useCustomRules?: boolean;
  /** Threshold for blocking (0-1, default 0.5) */
  threshold?: number;
  /** Enable caching of moderation results */
  enableCache?: boolean;
  /** Cache TTL in milliseconds (default 5 minutes) */
  cacheTTL?: number;
  /** Maximum requests per minute (default 60) */
  rateLimitPerMinute?: number;
}

/**
 * Cache entry for moderation results
 */
interface CacheEntry {
  result: ModerationResult;
  timestamp: number;
}

/**
 * Content Moderation Service
 *
 * Analyzes content for harmful, inappropriate, or policy-violating material
 * using OpenAI's Moderation API and custom rules.
 */
export class ContentModerationService {
  private config: Required<ModerationConfig>;
  private openaiClient?: OpenAI;
  private cache: Map<string, CacheEntry>;
  private requestTimestamps: number[];

  constructor(config: ModerationConfig = {}) {
    this.config = {
      apiKey: config.apiKey || '',
      useOpenAI: config.useOpenAI ?? true,
      useCustomRules: config.useCustomRules ?? true,
      threshold: config.threshold ?? 0.5,
      enableCache: config.enableCache ?? true,
      cacheTTL: config.cacheTTL ?? 5 * 60 * 1000, // 5 minutes
      rateLimitPerMinute: config.rateLimitPerMinute ?? 60,
    };

    if (this.config.useOpenAI && this.config.apiKey) {
      this.openaiClient = new OpenAI({ apiKey: this.config.apiKey });
    }

    this.cache = new Map();
    this.requestTimestamps = [];
  }

  /**
   * Moderate content
   */
  public async moderate(content: string): Promise<ModerationResult> {
    // Check cache first
    if (this.config.enableCache) {
      const cached = this.getFromCache(content);
      if (cached) {
        return cached;
      }
    }

    // Check rate limit
    this.enforceRateLimit();

    let result: ModerationResult;

    if (this.config.useOpenAI && this.openaiClient) {
      if (this.config.useCustomRules) {
        result = await this.combinedModeration(content);
      } else {
        result = await this.openaiModeration(content);
      }
    } else if (this.config.useCustomRules) {
      result = this.customModeration(content);
    } else {
      // No moderation enabled
      result = {
        flagged: false,
        categories: [],
        scores: {},
        shouldBlock: false,
        provider: 'custom',
      };
    }

    // Cache result
    if (this.config.enableCache) {
      this.addToCache(content, result);
    }

    return result;
  }

  /**
   * OpenAI moderation
   */
  private async openaiModeration(content: string): Promise<ModerationResult> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.openaiClient.moderations.create({
        input: content,
      });

      const result = response.results[0];
      if (!result) {
        throw new Error('No moderation result returned from OpenAI');
      }

      const flaggedCategories: string[] = [];
      const scores: Record<string, number> = {};

      // Extract flagged categories and scores
      for (const [category, flagged] of Object.entries(result.categories)) {
        if (flagged) {
          flaggedCategories.push(category);
        }
        scores[category] = result.category_scores[category as keyof ModerationCategoryScores];
      }

      return {
        flagged: result.flagged,
        categories: flaggedCategories,
        scores,
        shouldBlock: result.flagged,
        provider: 'openai',
      };
    } catch (error) {
      console.error('OpenAI moderation error:', error);
      // Fall back to custom moderation
      return this.customModeration(content);
    }
  }

  /**
   * Custom rule-based moderation
   */
  private customModeration(content: string): ModerationResult {
    const flaggedCategories: string[] = [];
    const scores: Record<string, number> = {};

    // Violence patterns
    const violencePatterns = [
      /\b(kill|murder|assault|attack|hurt|harm|weapon|gun|knife|bomb)\b/gi,
      /\b(death|die|dead|blood|gore)\b/gi,
    ];
    const violenceScore = this.calculatePatternScore(content, violencePatterns);
    scores['violence'] = violenceScore;
    if (violenceScore > this.config.threshold) {
      flaggedCategories.push('violence');
    }

    // Hate speech patterns
    const hatePatterns = [
      /\b(hate|hating|hated|racist|racism|sexist|sexism|homophobic|transphobic|bigot|bigotry|nazi)\b/gi,
      /\b(slur|derogatory|discriminate|discriminatory|discrimination)\b/gi,
    ];
    const hateScore = this.calculatePatternScore(content, hatePatterns);
    scores['hate'] = hateScore;
    if (hateScore > this.config.threshold) {
      flaggedCategories.push('hate');
    }

    // Self-harm patterns
    const selfHarmPatterns = [
      /\b(suicide|suicidal|self-harm|self-harming|cut myself|end it all|kill myself|killing myself)\b/gi,
      /\b(overdose|overdosing|self-injury|self-injure)\b/gi,
    ];
    const selfHarmScore = this.calculatePatternScore(content, selfHarmPatterns);
    scores['self-harm'] = selfHarmScore;
    if (selfHarmScore > this.config.threshold) {
      flaggedCategories.push('self-harm');
    }

    // Sexual content patterns
    const sexualPatterns = [
      /\b(porn|nude|naked|sex|xxx|adult content)\b/gi,
      /\b(explicit|erotic)\b/gi,
    ];
    const sexualScore = this.calculatePatternScore(content, sexualPatterns);
    scores['sexual'] = sexualScore;
    if (sexualScore > this.config.threshold) {
      flaggedCategories.push('sexual');
    }

    const flagged = flaggedCategories.length > 0;

    return {
      flagged,
      categories: flaggedCategories,
      scores,
      shouldBlock: flagged,
      provider: 'custom',
    };
  }

  /**
   * Combined moderation (OpenAI + Custom)
   */
  private async combinedModeration(content: string): Promise<ModerationResult> {
    const [openaiResult, customResult] = await Promise.all([
      this.openaiModeration(content),
      Promise.resolve(this.customModeration(content)),
    ]);

    // Merge results
    const categories = [...new Set([...openaiResult.categories, ...customResult.categories])];

    const scores = {
      ...openaiResult.scores,
      ...customResult.scores,
    };

    const flagged = openaiResult.flagged || customResult.flagged;
    const shouldBlock = openaiResult.shouldBlock || customResult.shouldBlock;

    return {
      flagged,
      categories,
      scores,
      shouldBlock,
      provider: 'combined',
      details: `OpenAI: ${openaiResult.flagged}, Custom: ${customResult.flagged}`,
    };
  }

  /**
   * Calculate pattern matching score
   */
  private calculatePatternScore(content: string, patterns: RegExp[]): number {
    let matches = 0;
    let totalMatches = 0;

    for (const pattern of patterns) {
      const patternMatches = content.match(pattern);
      if (patternMatches) {
        matches++;
        totalMatches += patternMatches.length;
      }
    }

    // Normalize score to 0-1 range
    // Increased weights to be more sensitive: matches * 0.5 + totalMatches * 0.2
    const score = Math.min(matches * 0.5 + totalMatches * 0.2, 1);
    return Math.round(score * 100) / 100;
  }

  /**
   * Check if content should be blocked
   */
  public async shouldBlock(content: string): Promise<boolean> {
    const result = await this.moderate(content);
    return result.shouldBlock;
  }

  /**
   * Get moderation stats for content
   */
  public async getStats(content: string): Promise<{
    isSafe: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    flaggedCount: number;
    highestScore: number;
    highestCategory: string;
  }> {
    const result = await this.moderate(content);

    const highestScore = Math.max(...Object.values(result.scores), 0);
    const highestCategory = Object.entries(result.scores).reduce(
      (max, [cat, score]) => (score > max.score ? { cat, score } : max),
      { cat: 'none', score: 0 }
    ).cat;

    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (highestScore >= 0.8) {
      riskLevel = 'critical';
    } else if (highestScore >= 0.6) {
      riskLevel = 'high';
    } else if (highestScore >= 0.4) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    return {
      isSafe: !result.flagged,
      riskLevel,
      flaggedCount: result.categories.length,
      highestScore,
      highestCategory,
    };
  }

  /**
   * Enforce rate limiting
   */
  private enforceRateLimit(): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > oneMinuteAgo);

    // Check if we've exceeded the rate limit
    if (this.requestTimestamps.length >= this.config.rateLimitPerMinute) {
      throw new Error('Rate limit exceeded for content moderation');
    }

    // Add current timestamp
    this.requestTimestamps.push(now);
  }

  /**
   * Get from cache
   */
  private getFromCache(content: string): ModerationResult | null {
    const key = this.hashContent(content);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > this.config.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  /**
   * Add to cache
   */
  private addToCache(content: string, result: ModerationResult): void {
    const key = this.hashContent(content);
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    });

    // Cleanup old entries if cache gets too large
    if (this.cache.size > 1000) {
      const now = Date.now();
      for (const [k, v] of this.cache.entries()) {
        if (now - v.timestamp > this.config.cacheTTL) {
          this.cache.delete(k);
        }
      }
    }
  }

  /**
   * Simple hash function for cache keys
   */
  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<ModerationConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    // Reinitialize OpenAI client if API key changed
    if (config.apiKey && config.useOpenAI !== false) {
      this.openaiClient = new OpenAI({ apiKey: config.apiKey });
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): Required<ModerationConfig> {
    return { ...this.config };
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    size: number;
    hitRate: number;
  } {
    // Simple implementation - could be enhanced with actual hit tracking
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses
    };
  }
}
