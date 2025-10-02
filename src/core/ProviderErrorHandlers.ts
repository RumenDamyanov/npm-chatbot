/**
 * Provider-specific error handling utilities
 *
 * This module contains error handling utilities tailored for each AI provider,
 * with knowledge of their specific error patterns and best practices.
 */

import { ErrorHandler, type ErrorCategory, type ProcessedError } from './ErrorHandler';
import type { AiProvider, Logger } from '../types/ChatbotTypes';

/**
 * OpenAI-specific error handler
 */
export class OpenAIErrorHandler extends ErrorHandler {
  constructor(logger?: Logger) {
    super(
      {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        useJitter: true,
        retryableErrors: ['network', 'rate_limit', 'timeout', 'server_error'],
      },
      logger
    );
  }

  protected classifyOpenAIError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();

    // OpenAI-specific error patterns
    if (message.includes('rate_limit_exceeded')) return 'rate_limit';
    if (message.includes('insufficient_quota')) return 'quota_exceeded';
    if (message.includes('invalid_api_key')) return 'authentication';
    if (message.includes('model_not_found')) return 'model_error';
    if (message.includes('context_length_exceeded')) return 'invalid_request';
    if (message.includes('content_policy_violation')) return 'content_policy';
    if (message.includes('server_error')) return 'server_error';

    return 'unknown';
  }
}

/**
 * Anthropic-specific error handler
 */
export class AnthropicErrorHandler extends ErrorHandler {
  constructor(logger?: Logger) {
    super(
      {
        maxRetries: 3,
        baseDelay: 2000, // Anthropic recommends longer delays
        maxDelay: 60000,
        backoffMultiplier: 2,
        useJitter: true,
        retryableErrors: ['network', 'rate_limit', 'timeout', 'server_error'],
      },
      logger
    );
  }

  protected classifyAnthropicError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();

    // Anthropic-specific error patterns
    if (message.includes('rate_limit_error')) return 'rate_limit';
    if (message.includes('invalid_request_error')) return 'invalid_request';
    if (message.includes('authentication_error')) return 'authentication';
    if (message.includes('permission_error')) return 'authentication';
    if (message.includes('overloaded_error')) return 'server_error';
    if (message.includes('api_error')) return 'server_error';

    return 'unknown';
  }
}

/**
 * Google-specific error handler
 */
export class GoogleErrorHandler extends ErrorHandler {
  constructor(logger?: Logger) {
    super(
      {
        maxRetries: 3,
        baseDelay: 1500,
        maxDelay: 45000,
        backoffMultiplier: 2,
        useJitter: true,
        retryableErrors: ['network', 'rate_limit', 'timeout', 'server_error'],
      },
      logger
    );
  }

  protected classifyGoogleError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();

    // Google AI-specific error patterns
    if (message.includes('quota exceeded')) return 'quota_exceeded';
    if (message.includes('resource exhausted')) return 'rate_limit';
    if (message.includes('permission denied')) return 'authentication';
    if (message.includes('invalid argument')) return 'invalid_request';
    if (message.includes('not found')) return 'model_error';
    if (message.includes('internal error')) return 'server_error';
    if (message.includes('unavailable')) return 'server_error';

    return 'unknown';
  }
}

/**
 * Enhanced error handler that uses provider-specific knowledge
 */
export class ProviderAwareErrorHandler {
  private readonly openAIHandler: OpenAIErrorHandler;
  private readonly anthropicHandler: AnthropicErrorHandler;
  private readonly googleHandler: GoogleErrorHandler;
  private readonly defaultHandler: ErrorHandler;

  constructor(logger?: Logger) {
    this.openAIHandler = new OpenAIErrorHandler(logger);
    this.anthropicHandler = new AnthropicErrorHandler(logger);
    this.googleHandler = new GoogleErrorHandler(logger);
    this.defaultHandler = new ErrorHandler({}, logger);
  }

  /**
   * Get the appropriate error handler for a provider
   */
  getHandlerForProvider(provider: AiProvider): ErrorHandler {
    switch (provider) {
      case 'openai':
        return this.openAIHandler;
      case 'anthropic':
        return this.anthropicHandler;
      case 'google':
        return this.googleHandler;
      default:
        return this.defaultHandler;
    }
  }

  /**
   * Process error with provider-specific handling
   */
  processError(
    error: unknown,
    provider: AiProvider,
    context?: Record<string, unknown>
  ): ProcessedError {
    const handler = this.getHandlerForProvider(provider);
    return handler.processError(error, provider, context);
  }

  /**
   * Execute operation with provider-specific retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    provider: AiProvider,
    context?: Record<string, unknown>
  ): Promise<T> {
    const handler = this.getHandlerForProvider(provider);
    return handler.executeWithRetry(operation, provider, context);
  }
}

/**
 * Error handling utilities for common patterns
 */
export class ErrorUtils {
  /**
   * Check if an error is retryable
   */
  static isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const message = error.message.toLowerCase();

    // Common retryable patterns across providers
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('rate limit') ||
      message.includes('server error') ||
      message.includes('service unavailable') ||
      message.includes('overloaded') ||
      message.includes('503') ||
      message.includes('502') ||
      message.includes('429')
    );
  }

  /**
   * Extract error code from various error formats
   */
  static extractErrorCode(error: unknown): string | undefined {
    if (!(error instanceof Error)) return undefined;

    const message = error.message;

    // Try to extract HTTP status codes
    const httpCodeMatch = message.match(/\b(4\d{2}|5\d{2})\b/);
    if (httpCodeMatch) return httpCodeMatch[1];

    // Try to extract error codes from error names or messages
    const codeMatch =
      message.match(/code:\s*([A-Z_]+)/i) ||
      message.match(/error_code:\s*([A-Z_]+)/i) ||
      message.match(/([A-Z_]+_ERROR)/i);

    return codeMatch?.[1];
  }

  /**
   * Create a sanitized error message for logging
   */
  static sanitizeErrorForLogging(error: unknown): Record<string, unknown> {
    if (!(error instanceof Error)) {
      return { message: String(error), type: typeof error };
    }

    // Remove sensitive information from error messages
    const sanitizedMessage = error.message
      .replace(/api[_-]?key[:\s=][\w-]+/gi, 'api_key=***')
      .replace(/token[:\s=][\w-]+/gi, 'token=***')
      .replace(/authorization[:\s=][\w\s-]+/gi, 'authorization=***');

    return {
      name: error.name,
      message: sanitizedMessage,
      stack: error.stack,
      constructor: error.constructor.name,
    };
  }

  /**
   * Determine if error indicates a permanent failure
   */
  static isPermanentFailure(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const message = error.message.toLowerCase();

    return (
      message.includes('invalid api key') ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      message.includes('quota exceeded') ||
      message.includes('content policy') ||
      message.includes('model not found') ||
      message.includes('permission denied') ||
      message.includes('401') ||
      message.includes('403')
    );
  }
}

/**
 * Circuit breaker pattern for provider calls
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeout: number = 60000
  ) {}

  /**
   * Execute operation with circuit breaker pattern
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open - service temporarily unavailable');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  /**
   * Get current circuit breaker status
   */
  getStatus(): { state: string; failures: number; lastFailureTime: number } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }
}
