import type { ChatMessage, ChatResponse, SecurityConfig } from '../types/ChatbotTypes';

/**
 * Security policy configuration
 */
export interface SecurityPolicy {
  // Content filtering
  enableContentFiltering: boolean;
  blockedWords: string[];
  blockedPatterns: RegExp[];
  maxMessageLength: number;

  // Input validation
  enableInputValidation: boolean;
  allowedCharacters?: RegExp;
  maxInputLength: number;

  // Output filtering
  enableOutputFiltering: boolean;
  removePersonalInfo: boolean;
  maskSensitiveData: boolean;

  // Rate limiting integration
  enableRateLimitChecks: boolean;
  maxRequestsPerMinute: number;

  // Logging and monitoring
  logSecurityEvents: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Security event types
 */
export interface SecurityEvent {
  type: 'blocked_content' | 'invalid_input' | 'rate_limit_exceeded' | 'suspicious_activity';
  message: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Default security policy
 */
const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  enableContentFiltering: true,
  blockedWords: [
    // Common inappropriate terms - basic list for MVP
    'spam',
    'scam',
    'phishing',
    'malware',
    'virus',
  ],
  blockedPatterns: [
    /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card patterns
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN patterns
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email patterns (for masking)
  ],
  maxMessageLength: 10000,

  enableInputValidation: true,
  maxInputLength: 5000,

  enableOutputFiltering: true,
  removePersonalInfo: true,
  maskSensitiveData: true,

  enableRateLimitChecks: true,
  maxRequestsPerMinute: 60,

  logSecurityEvents: true,
  logLevel: 'warn',
};

/**
 * Manages security policies and content filtering for the chatbot
 * Handles input validation, output filtering, and security monitoring
 */
export class SecurityManager {
  private policy: SecurityPolicy;
  private securityEvents: SecurityEvent[] = [];
  private readonly maxEventHistory = 1000;

  constructor(customConfig?: SecurityConfig) {
    // Convert SecurityConfig to SecurityPolicy
    const policy = this.convertConfigToPolicy(customConfig);
    this.policy = { ...DEFAULT_SECURITY_POLICY, ...policy };
  }

  /**
   * Convert SecurityConfig to SecurityPolicy
   */
  private convertConfigToPolicy(config?: SecurityConfig): Partial<SecurityPolicy> {
    if (!config) return {};

    return {
      enableContentFiltering: config.enableInputFilter ?? config.enableOutputFilter ?? true,
      enableInputValidation: config.enableInputFilter ?? true,
      enableOutputFiltering: config.enableOutputFilter ?? true,
      removePersonalInfo: config.contentSafety?.enabled ?? true,
      maskSensitiveData: config.contentSafety?.enabled ?? true,
      logSecurityEvents: true,
      logLevel: 'warn',
    };
  }

  /**
   * Validate and filter input message before processing
   */
  public async validateInput(
    message: ChatMessage,
    userId?: string,
    sessionId?: string
  ): Promise<{
    isValid: boolean;
    filteredMessage?: ChatMessage;
    reason?: string;
  }> {
    // Input validation
    if (this.policy.enableInputValidation) {
      const inputValidation = this.validateInputContent(message.content);
      if (!inputValidation.isValid) {
        await this.logSecurityEvent({
          type: 'invalid_input',
          message: `Input validation failed: ${inputValidation.reason}`,
          userId,
          sessionId,
          metadata: { originalContent: message.content },
        });
        return inputValidation;
      }
    }

    // Content filtering
    if (this.policy.enableContentFiltering) {
      const contentValidation = this.filterContent(message.content);
      if (!contentValidation.isValid) {
        await this.logSecurityEvent({
          type: 'blocked_content',
          message: `Content blocked: ${contentValidation.reason}`,
          userId,
          sessionId,
          metadata: { originalContent: message.content },
        });
        return contentValidation;
      }

      // Return filtered message if content was modified
      if (contentValidation.filteredContent !== message.content) {
        return {
          isValid: true,
          filteredMessage: {
            ...message,
            content: contentValidation.filteredContent,
          },
        };
      }
    }

    return { isValid: true, filteredMessage: message };
  }

  /**
   * Filter and validate output response before returning to user
   */
  public async filterOutput(
    response: ChatResponse,
    userId?: string,
    sessionId?: string
  ): Promise<ChatResponse> {
    if (!this.policy.enableOutputFiltering) {
      return response;
    }

    let filteredContent = response.content;

    // Remove or mask sensitive information
    if (this.policy.removePersonalInfo || this.policy.maskSensitiveData) {
      filteredContent = this.maskSensitiveInformation(filteredContent);
    }

    // Apply content filtering to output
    const contentValidation = this.filterContent(filteredContent);
    if (!contentValidation.isValid) {
      await this.logSecurityEvent({
        type: 'blocked_content',
        message: `Output content blocked: ${contentValidation.reason}`,
        userId,
        sessionId,
        metadata: { originalContent: response.content },
      });

      // Return a safe fallback response
      return {
        ...response,
        content:
          'I apologize, but I cannot provide that response due to content policy restrictions.',
        metadata: {
          ...response.metadata,
          securityFiltered: true,
          originalContentBlocked: true,
        },
      };
    }

    return {
      ...response,
      content: contentValidation.filteredContent,
      metadata: {
        ...response.metadata,
        securityFiltered: filteredContent !== response.content,
      },
    };
  }

  /**
   * Check if content contains blocked words or patterns
   */
  private filterContent(content: string): {
    isValid: boolean;
    filteredContent: string;
    reason?: string;
  } {
    let filteredContent = content;

    // Check message length
    if (content.length > this.policy.maxMessageLength) {
      return {
        isValid: false,
        filteredContent: content,
        reason: `Message exceeds maximum length of ${this.policy.maxMessageLength} characters`,
      };
    }

    // Check blocked words
    for (const blockedWord of this.policy.blockedWords) {
      const regex = new RegExp(`\\b${blockedWord}\\b`, 'gi');
      if (regex.test(content)) {
        return {
          isValid: false,
          filteredContent: content,
          reason: `Contains blocked word: ${blockedWord}`,
        };
      }
    }

    // Check blocked patterns
    for (const pattern of this.policy.blockedPatterns) {
      if (pattern.test(content)) {
        // For patterns, we might want to mask instead of block
        if (this.policy.maskSensitiveData) {
          filteredContent = filteredContent.replace(pattern, '[MASKED]');
        } else {
          return {
            isValid: false,
            filteredContent: content,
            reason: 'Contains blocked pattern',
          };
        }
      }
    }

    return {
      isValid: true,
      filteredContent,
    };
  }

  /**
   * Validate input content structure and format
   */
  private validateInputContent(content: string): {
    isValid: boolean;
    reason?: string;
  } {
    // Check for null/undefined content first
    if (!content) {
      return {
        isValid: false,
        reason: 'Empty input not allowed',
      };
    }

    // Check input length
    if (content.length > this.policy.maxInputLength) {
      return {
        isValid: false,
        reason: `Input exceeds maximum length of ${this.policy.maxInputLength} characters`,
      };
    }

    // Check for empty content
    if (!content.trim()) {
      return {
        isValid: false,
        reason: 'Empty input not allowed',
      };
    }

    // Check allowed characters if specified
    if (this.policy.allowedCharacters && !this.policy.allowedCharacters.test(content)) {
      return {
        isValid: false,
        reason: 'Input contains disallowed characters',
      };
    }

    return { isValid: true };
  }

  /**
   * Mask sensitive information in content
   */
  private maskSensitiveInformation(content: string): string {
    let maskedContent = content;

    // Mask email addresses
    maskedContent = maskedContent.replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      '[EMAIL]'
    );

    // Mask phone numbers
    maskedContent = maskedContent.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');

    // Mask credit card numbers
    maskedContent = maskedContent.replace(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, '[CREDIT_CARD]');

    // Mask SSN
    maskedContent = maskedContent.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');

    return maskedContent;
  }

  /**
   * Log security events
   */
  private async logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
    if (!this.policy.logSecurityEvents) {
      return;
    }

    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    this.securityEvents.push(securityEvent);

    // Trim event history if it exceeds max size
    if (this.securityEvents.length > this.maxEventHistory) {
      this.securityEvents = this.securityEvents.slice(-this.maxEventHistory);
    }

    // Log to console based on policy level
    if (
      this.policy.logLevel === 'debug' ||
      (this.policy.logLevel === 'info' &&
        ['blocked_content', 'invalid_input'].includes(event.type)) ||
      (this.policy.logLevel === 'warn' &&
        ['blocked_content', 'rate_limit_exceeded'].includes(event.type)) ||
      (this.policy.logLevel === 'error' && event.type === 'suspicious_activity')
    ) {
      console.log(
        `[SecurityManager] ${securityEvent.type}: ${securityEvent.message}`,
        securityEvent
      );
    }
  }

  /**
   * Get security events for monitoring
   */
  public getSecurityEvents(limit?: number): SecurityEvent[] {
    const events = this.securityEvents.slice();
    return limit ? events.slice(-limit) : events;
  }

  /**
   * Get security events by type
   */
  public getSecurityEventsByType(type: SecurityEvent['type'], limit?: number): SecurityEvent[] {
    const events = this.securityEvents.filter((event) => event.type === type);
    return limit ? events.slice(-limit) : events;
  }

  /**
   * Clear security event history
   */
  public clearSecurityEvents(): void {
    this.securityEvents = [];
  }

  /**
   * Update security policy
   */
  public updatePolicy(updates: Partial<SecurityPolicy>): void {
    this.policy = { ...this.policy, ...updates };
  }

  /**
   * Get current security policy
   */
  public getPolicy(): SecurityPolicy {
    return { ...this.policy };
  }

  /**
   * Get security statistics
   */
  public getSecurityStats(): {
    totalEvents: number;
    eventsByType: Record<SecurityEvent['type'], number>;
    recentEvents: number;
  } {
    const now = Date.now();
    const recentThreshold = 60 * 60 * 1000; // Last hour

    const eventsByType = this.securityEvents.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      },
      {} as Record<SecurityEvent['type'], number>
    );

    const recentEvents = this.securityEvents.filter(
      (event) => now - event.timestamp.getTime() < recentThreshold
    ).length;

    return {
      totalEvents: this.securityEvents.length,
      eventsByType,
      recentEvents,
    };
  }
}
