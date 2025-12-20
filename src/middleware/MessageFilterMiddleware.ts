/**
 * Message Filter Middleware for @rumenx/chatbot
 *
 * Provides content filtering and safety features for chatbot messages:
 * - Profanity filtering
 * - Aggression pattern detection
 * - Link/URL filtering
 * - System instruction injection
 * - Configurable rules
 *
 * Based on the PHP implementation from php-chatbot
 */

import type { ChatContext } from '../types/ChatbotTypes';

/**
 * Message filter configuration
 */
export interface MessageFilterConfig {
  /** System instructions to inject (not visible in chat history) */
  instructions: string[];
  /** List of profanity words to filter */
  profanities: string[];
  /** Patterns indicating aggression or harmful content */
  aggressionPatterns: string[];
  /** Regex pattern for detecting links/URLs */
  linkPattern: string;
  /** Whether to rephrase filtered content instead of blocking */
  enableRephrasing?: boolean;
  /** Custom replacement text for filtered content */
  replacementText?: string;
  /** Whether filtering is enabled */
  enabled?: boolean;
}

/**
 * Result of message filtering
 */
export interface FilterResult {
  /** Filtered/cleaned message */
  message: string;
  /** Whether the message was modified */
  wasFiltered: boolean;
  /** Reasons for filtering */
  filterReasons: string[];
  /** Updated context with system instructions */
  context: ChatContext;
  /** Whether the message should be blocked entirely */
  shouldBlock: boolean;
}

/**
 * Default filter configuration
 */
export const DEFAULT_FILTER_CONFIG: MessageFilterConfig = {
  instructions: [
    'You must maintain a respectful and helpful tone.',
    'Do not share external links or URLs unless specifically relevant.',
    'Avoid quoting controversial or unverified sources.',
    'Use appropriate, professional language at all times.',
    'Reject requests for harmful, dangerous, or illegal information.',
    'If a user is aggressive or rude, respond calmly and professionally to de-escalate.',
  ],
  profanities: [
    // Common profanity (can be extended)
    'fuck',
    'fucking',
    'fucked',
    'shit',
    'shitty',
    'damn',
    'damned',
    'hell',
    'ass',
    'bitch',
    'bastard',
    'crap',
    'crappy',
  ],
  aggressionPatterns: [
    'hate',
    'kill',
    'hurt',
    'destroy',
    'stupid',
    'idiot',
    'moron',
    'dumb',
    'useless',
    'worthless',
  ],
  linkPattern: 'https?:\\/\\/[\\w\\.-]+',
  enableRephrasing: true,
  replacementText: '[filtered]',
  enabled: true,
};

/**
 * Message Filter Middleware
 *
 * Filters user messages for inappropriate content and injects system instructions
 * to guide AI behavior.
 */
export class MessageFilterMiddleware {
  private config: MessageFilterConfig;
  private profanityRegex: RegExp;
  private aggressionRegex: RegExp;
  private linkRegex: RegExp;

  constructor(config: Partial<MessageFilterConfig> = {}) {
    // Merge with defaults
    this.config = {
      ...DEFAULT_FILTER_CONFIG,
      ...config,
      instructions: config.instructions || DEFAULT_FILTER_CONFIG.instructions,
      profanities: config.profanities || DEFAULT_FILTER_CONFIG.profanities,
      aggressionPatterns: config.aggressionPatterns || DEFAULT_FILTER_CONFIG.aggressionPatterns,
    };

    // Build regex patterns for efficient matching
    this.profanityRegex = new RegExp(
      this.config.profanities.map((word) => `\\b${this.escapeRegex(word)}\\b`).join('|'),
      'gi'
    );

    this.aggressionRegex = new RegExp(
      this.config.aggressionPatterns.map((word) => `\\b${this.escapeRegex(word)}\\b`).join('|'),
      'gi'
    );

    this.linkRegex = new RegExp(this.config.linkPattern, 'gi');
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Filter a message and return the result
   */
  public filter(message: string, context?: ChatContext): FilterResult {
    if (!this.config.enabled) {
      return {
        message,
        wasFiltered: false,
        filterReasons: [],
        context: context || { messages: [] },
        shouldBlock: false,
      };
    }

    let filteredMessage = message;
    const filterReasons: string[] = [];
    let shouldBlock = false;

    // 1. Check for profanity
    if (this.profanityRegex.test(message)) {
      filterReasons.push('profanity');
      if (this.config.enableRephrasing) {
        filteredMessage = filteredMessage.replace(
          this.profanityRegex,
          this.config.replacementText || '[filtered]'
        );
      } else {
        shouldBlock = true;
      }
    }

    // 2. Check for aggression patterns
    const aggressionMatches = message.match(this.aggressionRegex);
    if (aggressionMatches && aggressionMatches.length >= 2) {
      // Multiple aggression words indicate hostile intent
      filterReasons.push('aggression');
      if (this.config.enableRephrasing) {
        filteredMessage = filteredMessage.replace(
          this.aggressionRegex,
          this.config.replacementText || '[filtered]'
        );
      } else {
        shouldBlock = true;
      }
    }

    // 3. Check for links/URLs
    if (this.linkRegex.test(message)) {
      filterReasons.push('links');
      if (this.config.enableRephrasing) {
        filteredMessage = filteredMessage.replace(this.linkRegex, '[link removed]');
      }
      // Don't block for links, just filter them
    }

    // 4. Inject system instructions
    const updatedContext: ChatContext = {
      ...context,
      messages: context?.messages || [],
      systemPrompt: this.buildSystemPrompt(context?.systemPrompt),
    };

    return {
      message: filteredMessage,
      wasFiltered: filterReasons.length > 0,
      filterReasons,
      context: updatedContext,
      shouldBlock,
    };
  }

  /**
   * Build system prompt with filter instructions
   */
  private buildSystemPrompt(existingPrompt?: string): string {
    const instructions = this.config.instructions.join(' ');

    if (existingPrompt) {
      return `${existingPrompt}\n\nIMPORTANT GUIDELINES: ${instructions}`;
    }

    return `IMPORTANT GUIDELINES: ${instructions}`;
  }

  /**
   * Check if a message should be blocked
   */
  public shouldBlockMessage(message: string): boolean {
    const result = this.filter(message);
    return result.shouldBlock;
  }

  /**
   * Get filter statistics
   */
  public getFilterStats(message: string): {
    hasProfanity: boolean;
    hasAggression: boolean;
    hasLinks: boolean;
    profanityCount: number;
    aggressionCount: number;
    linkCount: number;
  } {
    const profanityMatches = message.match(this.profanityRegex);
    const aggressionMatches = message.match(this.aggressionRegex);
    const linkMatches = message.match(this.linkRegex);

    return {
      hasProfanity: !!profanityMatches,
      hasAggression: !!aggressionMatches,
      hasLinks: !!linkMatches,
      profanityCount: profanityMatches?.length || 0,
      aggressionCount: aggressionMatches?.length || 0,
      linkCount: linkMatches?.length || 0,
    };
  }

  /**
   * Update filter configuration
   */
  public updateConfig(config: Partial<MessageFilterConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    // Rebuild regex patterns
    if (config.profanities) {
      this.profanityRegex = new RegExp(
        this.config.profanities.map((word) => `\\b${this.escapeRegex(word)}\\b`).join('|'),
        'gi'
      );
    }

    if (config.aggressionPatterns) {
      this.aggressionRegex = new RegExp(
        this.config.aggressionPatterns.map((word) => `\\b${this.escapeRegex(word)}\\b`).join('|'),
        'gi'
      );
    }

    if (config.linkPattern) {
      this.linkRegex = new RegExp(this.config.linkPattern, 'gi');
    }
  }

  /**
   * Add profanity words
   */
  public addProfanities(words: string[]): void {
    this.config.profanities = [...this.config.profanities, ...words];
    this.profanityRegex = new RegExp(
      this.config.profanities.map((word) => `\\b${this.escapeRegex(word)}\\b`).join('|'),
      'gi'
    );
  }

  /**
   * Add aggression patterns
   */
  public addAggressionPatterns(patterns: string[]): void {
    this.config.aggressionPatterns = [...this.config.aggressionPatterns, ...patterns];
    this.aggressionRegex = new RegExp(
      this.config.aggressionPatterns.map((word) => `\\b${this.escapeRegex(word)}\\b`).join('|'),
      'gi'
    );
  }

  /**
   * Add system instructions
   */
  public addInstructions(instructions: string[]): void {
    this.config.instructions = [...this.config.instructions, ...instructions];
  }

  /**
   * Get current configuration
   */
  public getConfig(): MessageFilterConfig {
    return { ...this.config };
  }

  /**
   * Enable or disable filtering
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Check if filtering is enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled ?? true;
  }
}
