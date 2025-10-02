/**
 * Comprehensive error handling for AI providers
 *
 * This module provides standardized error handling across all AI providers,
 * including network issues, API failures, rate limits, and provider-specific errors.
 */

import type { AiProvider } from '../types/ChatbotTypes';
import { ChatbotError, type ChatbotErrorType } from '../types/ChatbotTypes';
import type { Logger } from '../types/ChatbotTypes';

/**
 * Error classification types
 */
export type ErrorCategory =
  | 'network'
  | 'authentication'
  | 'rate_limit'
  | 'quota_exceeded'
  | 'invalid_request'
  | 'model_error'
  | 'content_policy'
  | 'timeout'
  | 'server_error'
  | 'unknown';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Retry strategy configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay between retries in milliseconds */
  baseDelay: number;
  /** Maximum delay between retries in milliseconds */
  maxDelay: number;
  /** Exponential backoff multiplier */
  backoffMultiplier: number;
  /** Whether to add jitter to delays */
  useJitter: boolean;
  /** Error types that should be retried */
  retryableErrors: ErrorCategory[];
}

/**
 * Processed error information
 */
export interface ProcessedError {
  /** Original error */
  originalError: Error;
  /** Error category */
  category: ErrorCategory;
  /** Error severity */
  severity: ErrorSeverity;
  /** Whether this error is retryable */
  isRetryable: boolean;
  /** Suggested retry delay in milliseconds */
  retryDelay?: number;
  /** User-friendly error message */
  userMessage: string;
  /** Provider that caused the error */
  provider: AiProvider;
  /** Additional error metadata */
  metadata: Record<string, unknown>;
  /** Chatbot error type */
  chatbotErrorType: ChatbotErrorType;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  useJitter: true,
  retryableErrors: ['network', 'rate_limit', 'timeout', 'server_error'],
};

/**
 * Comprehensive error handler for AI providers
 */
export class ErrorHandler {
  private readonly retryConfig: RetryConfig;
  private readonly logger?: Logger;

  constructor(retryConfig: Partial<RetryConfig> = {}, logger?: Logger) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    this.logger = logger;
  }

  /**
   * Process and classify an error from any provider
   */
  processError(
    error: unknown,
    provider: AiProvider,
    context?: Record<string, unknown>
  ): ProcessedError {
    const originalError = error instanceof Error ? error : new Error(String(error));

    // Classify the error based on provider and error characteristics
    const category = this.classifyError(originalError, provider);
    const severity = this.determineSeverity(category, originalError);
    const isRetryable = this.retryConfig.retryableErrors.includes(category);
    const userMessage = this.generateUserMessage(category, originalError, provider);
    const chatbotErrorType = this.mapToChatbotErrorType(category);

    // Calculate retry delay if retryable
    const retryDelay = isRetryable ? this.calculateRetryDelay(1) : undefined;

    const processedError: ProcessedError = {
      originalError,
      category,
      severity,
      isRetryable,
      retryDelay,
      userMessage,
      provider,
      metadata: {
        errorName: originalError.name,
        errorMessage: originalError.message,
        stack: originalError.stack,
        context: context ?? {},
        timestamp: new Date().toISOString(),
      },
      chatbotErrorType,
    };

    // Log the error
    this.logError(processedError);

    return processedError;
  }

  /**
   * Execute a function with automatic retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    provider: AiProvider,
    context?: Record<string, unknown>
  ): Promise<T> {
    let lastError: ProcessedError | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.processError(error, provider, {
          ...context,
          attempt: attempt + 1,
          maxRetries: this.retryConfig.maxRetries,
        });

        // If this is the last attempt or error is not retryable, throw
        if (attempt === this.retryConfig.maxRetries || !lastError.isRetryable) {
          throw this.createChatbotError(lastError);
        }

        // Wait before retry
        const delay = this.calculateRetryDelay(attempt + 1);
        this.logger?.info(`Retrying operation after ${delay}ms`, {
          provider,
          attempt: attempt + 1,
          maxRetries: this.retryConfig.maxRetries,
          errorCategory: lastError.category,
        });

        await this.sleep(delay);
      }
    }

    // Should never reach here, but just in case
    if (lastError) {
      throw this.createChatbotError(lastError);
    }
    throw new Error('Unexpected error: no error recorded');
  }

  /**
   * Classify error based on provider and error characteristics
   */
  private classifyError(error: Error, provider: AiProvider): ErrorCategory {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Network-related errors
    if (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('enotfound') ||
      name.includes('network')
    ) {
      return message.includes('timeout') ? 'timeout' : 'network';
    }

    // Authentication errors
    if (
      message.includes('unauthorized') ||
      message.includes('authentication') ||
      message.includes('invalid api key') ||
      message.includes('forbidden') ||
      error.message.includes('401') ||
      error.message.includes('403')
    ) {
      return 'authentication';
    }

    // Rate limiting
    if (
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('quota') ||
      error.message.includes('429')
    ) {
      return message.includes('quota') ? 'quota_exceeded' : 'rate_limit';
    }

    // Server errors
    if (
      message.includes('internal server error') ||
      message.includes('service unavailable') ||
      message.includes('bad gateway') ||
      error.message.includes('500') ||
      error.message.includes('502') ||
      error.message.includes('503')
    ) {
      return 'server_error';
    }

    // Content policy violations
    if (
      message.includes('content policy') ||
      message.includes('safety') ||
      message.includes('harmful') ||
      message.includes('blocked')
    ) {
      return 'content_policy';
    }

    // Provider-specific error classification
    return this.classifyProviderSpecificError(error, provider);
  }

  /**
   * Classify provider-specific errors
   */
  private classifyProviderSpecificError(error: Error, provider: AiProvider): ErrorCategory {
    const message = error.message.toLowerCase();

    switch (provider) {
      case 'openai':
        if (message.includes('invalid_request_error')) return 'invalid_request';
        if (message.includes('model_not_found')) return 'model_error';
        if (message.includes('context_length_exceeded')) return 'invalid_request';
        break;

      case 'anthropic':
        if (message.includes('invalid_request')) return 'invalid_request';
        if (message.includes('overloaded')) return 'server_error';
        break;

      case 'google':
        if (message.includes('invalid argument')) return 'invalid_request';
        if (message.includes('resource exhausted')) return 'rate_limit';
        if (message.includes('permission denied')) return 'authentication';
        break;

      case 'meta':
      case 'xai':
      case 'deepseek':
        if (message.includes('bad request')) return 'invalid_request';
        break;

      case 'ollama':
        if (message.includes('model not found')) return 'model_error';
        if (message.includes('connection refused')) return 'network';
        break;
    }

    return 'unknown';
  }

  /**
   * Determine error severity
   */
  private determineSeverity(category: ErrorCategory, _error: Error): ErrorSeverity {
    switch (category) {
      case 'authentication':
      case 'quota_exceeded':
        return 'critical';

      case 'model_error':
      case 'content_policy':
        return 'high';

      case 'rate_limit':
      case 'invalid_request':
        return 'medium';

      case 'network':
      case 'timeout':
      case 'server_error':
        return 'low';

      default:
        return 'medium';
    }
  }

  /**
   * Generate user-friendly error message
   */
  private generateUserMessage(category: ErrorCategory, error: Error, provider: AiProvider): string {
    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);

    switch (category) {
      case 'network':
        return `Network connection issue with ${providerName}. Please check your internet connection and try again.`;

      case 'authentication':
        return `Authentication failed with ${providerName}. Please check your API key and permissions.`;

      case 'rate_limit':
        return `Rate limit exceeded for ${providerName}. Please wait a moment before trying again.`;

      case 'quota_exceeded':
        return `Usage quota exceeded for ${providerName}. Please check your account limits.`;

      case 'invalid_request':
        return `Invalid request to ${providerName}. Please check your input parameters.`;

      case 'model_error':
        return `Model error with ${providerName}. The requested model may not be available.`;

      case 'content_policy':
        return `Content policy violation detected by ${providerName}. Please modify your request.`;

      case 'timeout':
        return `Request to ${providerName} timed out. Please try again.`;

      case 'server_error':
        return `${providerName} server error. Please try again later.`;

      default:
        return `An unexpected error occurred with ${providerName}: ${error.message}`;
    }
  }

  /**
   * Map error category to ChatbotErrorType
   */
  private mapToChatbotErrorType(category: ErrorCategory): ChatbotErrorType {
    switch (category) {
      case 'authentication':
        return 'PROVIDER_ERROR';
      case 'rate_limit':
      case 'quota_exceeded':
        return 'RATE_LIMIT_ERROR';
      case 'invalid_request':
        return 'VALIDATION_ERROR';
      case 'content_policy':
        return 'SECURITY_ERROR';
      case 'timeout':
        return 'TIMEOUT_ERROR';
      case 'network':
      case 'server_error':
      case 'model_error':
        return 'PROVIDER_ERROR';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(attempt: number): number {
    const exponentialDelay =
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);

    let delay = Math.min(exponentialDelay, this.retryConfig.maxDelay);

    // Add jitter to prevent thundering herd
    if (this.retryConfig.useJitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.round(delay);
  }

  /**
   * Create ChatbotError from ProcessedError
   */
  private createChatbotError(processedError: ProcessedError): ChatbotError {
    return new ChatbotError(
      processedError.userMessage,
      processedError.chatbotErrorType,
      processedError.provider,
      processedError.originalError.name,
      {
        category: processedError.category,
        severity: processedError.severity,
        isRetryable: processedError.isRetryable,
        originalMessage: processedError.originalError.message,
        ...processedError.metadata,
      }
    );
  }

  /**
   * Log error information
   */
  private logError(processedError: ProcessedError): void {
    const logMethod = this.getLogMethod(processedError.severity);

    this.logger?.[logMethod]?.(
      `Provider error: ${processedError.category}`,
      processedError.originalError as Error & Record<string, unknown>,
      {
        provider: processedError.provider,
        category: processedError.category,
        severity: processedError.severity,
        isRetryable: processedError.isRetryable,
        userMessage: processedError.userMessage,
        metadata: processedError.metadata,
      }
    );
  }

  /**
   * Get appropriate log method based on severity
   */
  private getLogMethod(severity: ErrorSeverity): keyof Logger {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      case 'low':
        return 'info';
      default:
        return 'warn';
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
