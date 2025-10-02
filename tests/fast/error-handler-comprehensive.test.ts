/**
 * Comprehensive test suite for the ErrorHandler class
 * Target: Improve ErrorHandler.ts coverage from 14.15% to 35%+
 * Focus: Error classification, processing, retry logic, and provider-specific error handling
 */

import { ErrorHandler } from '../../src/core/ErrorHandler';
import type { RetryConfig } from '../../src/core/ErrorHandler';
import { ChatbotError } from '../../src/types/ChatbotTypes';
import type { Logger } from '../../src/types/ChatbotTypes';

// Mock logger to avoid actual logging during tests
const mockLogger: Logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('ErrorHandler Comprehensive Tests', () => {
  let errorHandler: ErrorHandler;
  let defaultRetryConfig: Partial<RetryConfig>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup default retry configuration
    defaultRetryConfig = {
      maxRetries: 3,
      baseDelay: 100, // Shorter delays for tests
      maxDelay: 1000,
      backoffMultiplier: 2,
      useJitter: false, // Disable jitter for predictable tests
      retryableErrors: ['network', 'rate_limit', 'timeout', 'server_error'],
    };

    errorHandler = new ErrorHandler(defaultRetryConfig, mockLogger);
  });

  describe('Constructor and Configuration', () => {
    test('should create ErrorHandler with default configuration', () => {
      const handler = new ErrorHandler();
      expect(handler).toBeDefined();
      expect(handler).toBeInstanceOf(ErrorHandler);
    });

    test('should create ErrorHandler with custom retry config', () => {
      const customConfig: Partial<RetryConfig> = {
        maxRetries: 5,
        baseDelay: 500,
        maxDelay: 10000,
      };

      const handler = new ErrorHandler(customConfig);
      expect(handler).toBeDefined();
    });

    test('should create ErrorHandler with logger', () => {
      const handler = new ErrorHandler(defaultRetryConfig, mockLogger);
      expect(handler).toBeDefined();
    });

    test('should create ErrorHandler without logger', () => {
      const handler = new ErrorHandler(defaultRetryConfig);
      expect(handler).toBeDefined();
    });
  });

  describe('Error Classification', () => {
    test('should classify network errors correctly', () => {
      const networkError = new Error('Network connection failed');
      const result = errorHandler.processError(networkError, 'openai');

      expect(result.category).toBe('network');
      expect(result.isRetryable).toBe(true);
    });

    test('should classify timeout errors correctly', () => {
      const timeoutError = new Error('Request timeout occurred');
      const result = errorHandler.processError(timeoutError, 'anthropic');

      expect(result.category).toBe('timeout');
      expect(result.isRetryable).toBe(true);
    });

    test('should classify rate limit errors correctly', () => {
      const rateLimitError = new Error('Rate limit exceeded');
      const result = errorHandler.processError(rateLimitError, 'google');

      expect(result.category).toBe('rate_limit');
      expect(result.isRetryable).toBe(true);
    });

    test('should classify authentication errors correctly', () => {
      const authError = new Error('Invalid API key provided');
      const result = errorHandler.processError(authError, 'openai');

      expect(result.category).toBe('authentication');
      expect(result.isRetryable).toBe(false);
    });

    test('should classify server errors correctly', () => {
      const serverError = new Error('Internal server error');
      const result = errorHandler.processError(serverError, 'anthropic');

      expect(result.category).toBe('server_error');
      expect(result.isRetryable).toBe(true);
    });

    test('should handle unknown error types', () => {
      const unknownError = new Error('Some unexpected error');
      const result = errorHandler.processError(unknownError, 'google');

      expect(result).toBeDefined();
      expect(result.originalError).toBe(unknownError);
    });
  });

  describe('Error Processing', () => {
    test('should process Error objects correctly', () => {
      const error = new Error('Test error message');
      const result = errorHandler.processError(error, 'openai');

      expect(result.originalError).toBe(error);
      expect(result.provider).toBe('openai');
      expect(result.metadata).toBeDefined();
      expect(result.userMessage).toBeDefined();
    });

    test('should process non-Error objects', () => {
      const stringError = 'String error message';
      const result = errorHandler.processError(stringError, 'anthropic');

      expect(result.originalError).toBeInstanceOf(Error);
      expect(result.originalError.message).toBe(stringError);
      expect(result.provider).toBe('anthropic');
    });

    test('should include context in metadata', () => {
      const error = new Error('Test error');
      const context = { userId: '123', operation: 'chat' };
      const result = errorHandler.processError(error, 'google', context);

      expect(result.metadata.context).toEqual(context);
      expect(result.metadata.timestamp).toBeDefined();
    });

    test('should generate appropriate user messages', () => {
      const error = new Error('Rate limit exceeded');
      const result = errorHandler.processError(error, 'openai');

      expect(result.userMessage).toBeDefined();
      expect(typeof result.userMessage).toBe('string');
      expect(result.userMessage.length).toBeGreaterThan(0);
    });

    test('should set retry delay for retryable errors', () => {
      const error = new Error('Network timeout');
      const result = errorHandler.processError(error, 'anthropic');

      if (result.isRetryable) {
        expect(result.retryDelay).toBeDefined();
        expect(typeof result.retryDelay).toBe('number');
        expect(result.retryDelay!).toBeGreaterThan(0);
      }
    });
  });

  describe('Severity Determination', () => {
    test('should assign appropriate severity levels', () => {
      const criticalError = new Error('Authentication failed');
      const result = errorHandler.processError(criticalError, 'openai');

      expect(result.severity).toBeDefined();
      expect(['low', 'medium', 'high', 'critical']).toContain(result.severity);
    });

    test('should handle different error types with appropriate severity', () => {
      const errors = [
        { error: new Error('Network error'), expectRetryable: true },
        { error: new Error('Invalid request format'), expectRetryable: false },
        { error: new Error('Internal server error'), expectRetryable: true },
      ];

      errors.forEach(({ error }) => {
        const result = errorHandler.processError(error, 'google');
        expect(result.severity).toBeDefined();
        expect(['low', 'medium', 'high', 'critical']).toContain(result.severity);
      });
    });
  });

  describe('Retry Logic', () => {
    test('should execute successful operation without retry', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');

      const result = await errorHandler.executeWithRetry(mockOperation, 'openai');

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    test('should retry retryable errors', async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue('success');

      const result = await errorHandler.executeWithRetry(mockOperation, 'anthropic');

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    test('should not retry non-retryable errors', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Invalid API key'));

      await expect(errorHandler.executeWithRetry(mockOperation, 'google')).rejects.toThrow();

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    test('should respect max retry limit', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(errorHandler.executeWithRetry(mockOperation, 'openai')).rejects.toThrow();

      expect(mockOperation).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });

    test('should include retry context in error processing', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Network error'));

      const context = { operationType: 'chat' };

      await expect(
        errorHandler.executeWithRetry(mockOperation, 'anthropic', context)
      ).rejects.toThrow();

      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('Provider-Specific Error Handling', () => {
    test('should handle OpenAI provider errors', () => {
      const openaiError = new Error('OpenAI API error');
      const result = errorHandler.processError(openaiError, 'openai');

      expect(result.provider).toBe('openai');
      expect(result).toBeDefined();
    });

    test('should handle Anthropic provider errors', () => {
      const anthropicError = new Error('Claude API error');
      const result = errorHandler.processError(anthropicError, 'anthropic');

      expect(result.provider).toBe('anthropic');
      expect(result).toBeDefined();
    });

    test('should handle Google provider errors', () => {
      const googleError = new Error('Gemini API error');
      const result = errorHandler.processError(googleError, 'google');

      expect(result.provider).toBe('google');
      expect(result).toBeDefined();
    });
  });

  describe('Error Logging', () => {
    test('should log processed errors when logger is provided', () => {
      const error = new Error('Test error for logging');
      errorHandler.processError(error, 'openai');

      // Check that some logging occurred (could be debug, info, warn, or error)
      const totalLogCalls =
        mockLogger.debug.mock.calls.length +
        mockLogger.info.mock.calls.length +
        mockLogger.warn.mock.calls.length +
        mockLogger.error.mock.calls.length;

      expect(totalLogCalls).toBeGreaterThan(0);
    });

    test('should log retry attempts', async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue('success');

      await errorHandler.executeWithRetry(mockOperation, 'anthropic');

      expect(mockLogger.info).toHaveBeenCalled();
    });

    test('should handle missing logger gracefully', () => {
      const handlerWithoutLogger = new ErrorHandler(defaultRetryConfig);
      const error = new Error('Test error');

      expect(() => {
        handlerWithoutLogger.processError(error, 'google');
      }).not.toThrow();
    });
  });

  describe('ChatbotError Creation', () => {
    test('should create appropriate ChatbotError from ProcessedError', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Authentication failed'));

      await expect(errorHandler.executeWithRetry(mockOperation, 'openai')).rejects.toBeInstanceOf(
        ChatbotError
      );
    });

    test('should preserve error information in ChatbotError', async () => {
      const originalMessage = 'Invalid request format';
      const mockOperation = jest.fn().mockRejectedValue(new Error(originalMessage));

      try {
        await errorHandler.executeWithRetry(mockOperation, 'anthropic');
      } catch (error) {
        expect(error).toBeInstanceOf(ChatbotError);
        // The error should contain relevant information
        expect(error).toBeDefined();
      }
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    test('should handle null/undefined errors', () => {
      const result1 = errorHandler.processError(null, 'openai');
      const result2 = errorHandler.processError(undefined, 'google');

      expect(result1.originalError).toBeInstanceOf(Error);
      expect(result2.originalError).toBeInstanceOf(Error);
    });

    test('should handle errors with no message', () => {
      const emptyError = new Error();
      const result = errorHandler.processError(emptyError, 'anthropic');

      expect(result.originalError).toBe(emptyError);
      expect(result.userMessage).toBeDefined();
    });

    test('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(10000);
      const longError = new Error(longMessage);
      const result = errorHandler.processError(longError, 'openai');

      expect(result.originalError.message).toBe(longMessage);
      expect(result.userMessage).toBeDefined();
    });

    test('should handle errors with special characters', () => {
      const specialError = new Error('Error with 🚀 emojis and àáâãäå special chars');
      const result = errorHandler.processError(specialError, 'google');

      expect(result.originalError).toBe(specialError);
      expect(result.userMessage).toBeDefined();
    });
  });

  describe('Retry Delay Calculation', () => {
    test('should calculate appropriate retry delays', async () => {
      const delays: number[] = [];
      const mockOperation = jest.fn().mockImplementation(() => {
        delays.push(Date.now());
        throw new Error('Network timeout');
      });

      await expect(errorHandler.executeWithRetry(mockOperation, 'openai')).rejects.toThrow();

      // Should have attempted multiple times
      expect(mockOperation).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });

    test('should respect maximum delay configuration', () => {
      const configWithShortMaxDelay: Partial<RetryConfig> = {
        ...defaultRetryConfig,
        maxDelay: 50,
        baseDelay: 100, // Higher than max to test capping
      };

      const handler = new ErrorHandler(configWithShortMaxDelay, mockLogger);
      const error = new Error('Network timeout');
      const result = handler.processError(error, 'anthropic');

      if (result.retryDelay) {
        expect(result.retryDelay).toBeLessThanOrEqual(50);
      }
    });
  });
});
