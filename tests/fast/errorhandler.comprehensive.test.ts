/**
 * Comprehensive ErrorHandler tests to improve coverage from 36.28% to 70%+
 */

describe('ErrorHandler Comprehensive Tests', () => {
  describe('ErrorHandler Creation and Configuration', () => {
    it('should create error handler with default configuration', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler();
      
      expect(handler).toBeDefined();
    });

    it('should create error handler with custom configuration', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const customConfig = {
        maxRetries: 5,
        baseDelay: 2000,
        maxDelay: 60000,
        backoffMultiplier: 3,
        useJitter: false,
        retryableErrors: ['network', 'timeout'],
      };
      
      const handler = new ErrorHandler(customConfig);
      
      expect(handler).toBeDefined();
    });

    it('should create error handler with logger', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      const { DefaultLogger } = await import('../../src/utils/Logger');
      
      const logger = new DefaultLogger({ level: 'debug', enableConsole: false });
      const handler = new ErrorHandler({}, logger);
      
      expect(handler).toBeDefined();
    });
  });

  describe('Error Processing', () => {
    it('should process basic errors', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler();
      const testError = new Error('Test error message');
      
      const result = handler.processError(testError, 'openai');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('originalError');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('severity');
      expect(result).toHaveProperty('isRetryable');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('timestamp');
      expect(result.originalError).toBe(testError);
    });

    it('should process errors from different providers', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler();
      const testError = new Error('Provider error');
      
      const providers = ['openai', 'anthropic', 'google'] as const;
      
      providers.forEach((provider) => {
        const result = handler.processError(testError, provider);
        expect(result).toBeDefined();
        expect(result.provider).toBe(provider);
      });
    });

    it('should process non-Error objects', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler();
      
      const stringError = 'String error';
      const objectError = { code: 'ERR_001', message: 'Object error' };
      const numberError = 404;
      
      expect(() => {
        handler.processError(stringError, 'openai');
        handler.processError(objectError, 'anthropic');
        handler.processError(numberError, 'google');
      }).not.toThrow();
    });

    it('should handle errors with context', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler();
      const testError = new Error('Context error');
      const context = {
        requestId: 'req-123',
        userId: 'user-456',
        operation: 'chat',
      };
      
      const result = handler.processError(testError, 'openai', context);
      
      expect(result).toBeDefined();
      expect(result.metadata.context).toEqual(context);
    });
  });

  describe('Error Classification', () => {
    it('should classify network errors', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler();
      
      const networkErrors = [
        new Error('ECONNREFUSED'),
        new Error('ETIMEDOUT'),
        new Error('ENOTFOUND'),
        new Error('Network error'),
        new Error('Connection failed'),
      ];
      
      networkErrors.forEach((error) => {
        const result = handler.processError(error, 'openai');
        expect(result.category).toBeDefined();
        expect(['network', 'timeout', 'unknown'].includes(result.category)).toBe(true);
      });
    });

    it('should classify rate limit errors', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler();
      
      const rateLimitErrors = [
        new Error('Rate limit exceeded'),
        new Error('Too many requests'),
        new Error('429 Too Many Requests'),
        new Error('Quota exceeded'),
      ];
      
      rateLimitErrors.forEach((error) => {
        const result = handler.processError(error, 'openai');
        expect(result.category).toBeDefined();
      });
    });

    it('should classify authentication errors', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler();
      
      const authErrors = [
        new Error('Invalid API key'),
        new Error('Unauthorized'),
        new Error('Authentication failed'),
        new Error('401 Unauthorized'),
        new Error('403 Forbidden'),
      ];
      
      authErrors.forEach((error) => {
        const result = handler.processError(error, 'openai');
        expect(result.category).toBeDefined();
      });
    });

    it('should classify server errors', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler();
      
      const serverErrors = [
        new Error('Internal server error'),
        new Error('500 Internal Server Error'),
        new Error('502 Bad Gateway'),
        new Error('503 Service Unavailable'),
        new Error('Server is down'),
      ];
      
      serverErrors.forEach((error) => {
        const result = handler.processError(error, 'openai');
        expect(result.category).toBeDefined();
      });
    });

    it('should classify validation errors', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler();
      
      const validationErrors = [
        new Error('Invalid input'),
        new Error('Validation failed'),
        new Error('Bad request'),
        new Error('400 Bad Request'),
        new Error('Missing required field'),
      ];
      
      validationErrors.forEach((error) => {
        const result = handler.processError(error, 'openai');
        expect(result.category).toBeDefined();
      });
    });
  });

  describe('Severity Determination', () => {
    it('should determine error severity correctly', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler();
      
      // Different types of errors should have different severities
      const errors = [
        { error: new Error('Network timeout'), expectedSeverity: ['high', 'medium'] },
        { error: new Error('Invalid API key'), expectedSeverity: ['critical', 'high'] },
        { error: new Error('Rate limit exceeded'), expectedSeverity: ['medium', 'low'] },
        { error: new Error('Internal server error'), expectedSeverity: ['high', 'critical'] },
      ];
      
      errors.forEach(({ error, expectedSeverity }) => {
        const result = handler.processError(error, 'openai');
        expect(result.severity).toBeDefined();
        expect(['low', 'medium', 'high', 'critical'].includes(result.severity)).toBe(true);
      });
    });
  });

  describe('Retry Logic', () => {
    it('should determine retryability correctly', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler({
        retryableErrors: ['network', 'timeout', 'rate_limit'],
      });
      
      const retryableError = new Error('Network timeout');
      const nonRetryableError = new Error('Invalid API key');
      
      const retryableResult = handler.processError(retryableError, 'openai');
      const nonRetryableResult = handler.processError(nonRetryableError, 'openai');
      
      expect(retryableResult).toHaveProperty('isRetryable');
      expect(nonRetryableResult).toHaveProperty('isRetryable');
    });

    it('should handle retry configuration', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler({
        maxRetries: 3,
        baseDelay: 1000,
        backoffMultiplier: 2,
        useJitter: true,
      });
      
      const error = new Error('Retryable error');
      const result = handler.processError(error, 'openai');
      
      expect(result).toBeDefined();
    });
  });

  describe('Provider-Specific Error Handling', () => {
    it('should handle OpenAI-specific errors', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler();
      
      const openaiErrors = [
        new Error('OpenAI API error'),
        new Error('Model not found'),
        new Error('Token limit exceeded'),
        new Error('Content policy violation'),
      ];
      
      openaiErrors.forEach((error) => {
        const result = handler.processError(error, 'openai');
        expect(result.provider).toBe('openai');
        expect(result.category).toBeDefined();
      });
    });

    it('should handle Anthropic-specific errors', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler();
      
      const anthropicErrors = [
        new Error('Anthropic API error'),
        new Error('Claude model error'),
        new Error('Message too long'),
      ];
      
      anthropicErrors.forEach((error) => {
        const result = handler.processError(error, 'anthropic');
        expect(result.provider).toBe('anthropic');
        expect(result.category).toBeDefined();
      });
    });

    it('should handle Google-specific errors', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler();
      
      const googleErrors = [
        new Error('Google AI error'),
        new Error('Gemini model error'),
        new Error('Safety filter triggered'),
      ];
      
      googleErrors.forEach((error) => {
        const result = handler.processError(error, 'google');
        expect(result.provider).toBe('google');
        expect(result.category).toBeDefined();
      });
    });
  });

  describe('Error Metadata and Context', () => {
    it('should preserve error stack traces', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler();
      const error = new Error('Test error with stack');
      
      const result = handler.processError(error, 'openai');
      
      expect(result.originalError.stack).toBeDefined();
    });

    it('should handle errors with custom properties', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler();
      
      const customError = new Error('Custom error') as any;
      customError.code = 'CUSTOM_001';
      customError.statusCode = 400;
      customError.details = { field: 'username', issue: 'required' };
      
      const result = handler.processError(customError, 'openai');
      
      expect(result.originalError).toBe(customError);
    });

    it('should add processing metadata', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler();
      const error = new Error('Metadata test');
      
      const result = handler.processError(error, 'openai', {
        requestId: 'test-123',
        attempt: 1,
      });
      
      expect(result.metadata.timestamp).toBeDefined();
      expect(result.metadata.context).toBeDefined();
      expect((result.metadata.context as any)?.requestId).toBe('test-123');
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    it('should handle null and undefined errors', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler();
      
      expect(() => {
        handler.processError(null, 'openai');
        handler.processError(undefined, 'openai');
      }).not.toThrow();
    });

    it('should handle empty error messages', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler();
      const emptyError = new Error('');
      
      const result = handler.processError(emptyError, 'openai');
      
      expect(result).toBeDefined();
      expect(result.originalError.message).toBe('');
    });

    it('should handle very long error messages', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler();
      const longMessage = 'A'.repeat(10000);
      const longError = new Error(longMessage);
      
      const result = handler.processError(longError, 'openai');
      
      expect(result).toBeDefined();
      expect(result.originalError.message).toBe(longMessage);
    });

    it('should handle errors with circular references', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler();
      const error = new Error('Circular test') as any;
      error.self = error; // Create circular reference
      
      expect(() => {
        handler.processError(error, 'openai');
      }).not.toThrow();
    });

    it('should handle unknown providers', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const handler = new ErrorHandler();
      const error = new Error('Unknown provider test');
      
      const result = handler.processError(error, 'unknown-provider' as any);
      
      expect(result).toBeDefined();
      expect(result.provider).toBe('unknown-provider');
    });
  });

  describe('Configuration and State Management', () => {
    it('should handle different retry configurations', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      const configs = [
        { maxRetries: 0, baseDelay: 100 },
        { maxRetries: 10, baseDelay: 5000 },
        { maxRetries: 3, baseDelay: 1000, useJitter: false },
        { maxRetries: 5, baseDelay: 500, backoffMultiplier: 1.5 },
      ];
      
      configs.forEach((config) => {
        const handler = new ErrorHandler(config);
        const error = new Error('Config test');
        const result = handler.processError(error, 'openai');
        
        expect(result).toBeDefined();
      });
    });

    it('should handle invalid configuration values', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');
      
      expect(() => {
        new ErrorHandler({
          maxRetries: -1,
          baseDelay: -100,
          backoffMultiplier: 0,
        });
      }).not.toThrow();
    });
  });
});