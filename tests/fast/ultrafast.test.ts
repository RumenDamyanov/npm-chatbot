/**
 * Ultra-fast stable tests without any background timers or complex async operations
 */

describe('Ultra Fast Core Tests', () => {
  describe('Basic Type Tests', () => {
    it('should create ChatbotError instances', async () => {
      const { ChatbotError } = await import('../../src/types/ChatbotTypes');

      const error = new ChatbotError('Test error', 'VALIDATION_ERROR', 'openai', 'TEST_CODE');

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.type).toBe('VALIDATION_ERROR');
      expect(error.provider).toBe('openai');
      expect(error.name).toBe('ChatbotError');
    });

    it('should export provider types', async () => {
      const types = await import('../../src/types/ProviderTypes');

      expect(types).toBeDefined();
    });
  });

  describe('Logger Tests', () => {
    it('should create logger without throwing', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'info' });
      expect(logger).toBeDefined();
    });

    it('should log messages without throwing', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'error' }); // Only log errors to reduce noise

      expect(() => {
        logger.error('Test error message', new Error('Test error'));
      }).not.toThrow();
    });
  });

  describe('ConversationManager Tests', () => {
    it('should create conversation manager', async () => {
      const { ConversationManager } = await import('../../src/core/ConversationManager');

      const manager = new ConversationManager({
        maxHistoryLength: 10,
      });

      expect(manager).toBeDefined();
    });

    it('should handle conversation operations', async () => {
      const { ConversationManager } = await import('../../src/core/ConversationManager');

      const manager = new ConversationManager({
        maxHistoryLength: 10,
      });

      const testMessage = {
        role: 'user' as const,
        content: 'Test message',
        timestamp: new Date(),
        id: 'test-1',
        metadata: {},
      };

      expect(() => {
        manager.addMessage('session-1', testMessage);
      }).not.toThrow();

      const history = manager.getConversationHistory('session-1');
      expect(Array.isArray(history)).toBe(true);
    });

    it('should manage multiple sessions', async () => {
      const { ConversationManager } = await import('../../src/core/ConversationManager');

      const manager = new ConversationManager({
        maxHistoryLength: 10,
      });

      const message1 = {
        role: 'user' as const,
        content: 'Session 1 message',
        timestamp: new Date(),
        id: 'test-1',
        metadata: {},
      };

      const message2 = {
        role: 'user' as const,
        content: 'Session 2 message',
        timestamp: new Date(),
        id: 'test-2',
        metadata: {},
      };

      manager.addMessage('session-1', message1);
      manager.addMessage('session-2', message2);

      const history1 = manager.getConversationHistory('session-1');
      const history2 = manager.getConversationHistory('session-2');

      expect(history1).toHaveLength(1);
      expect(history2).toHaveLength(1);
      expect(history1[0].content).toBe('Session 1 message');
      expect(history2[0].content).toBe('Session 2 message');
    });
  });

  describe('ConfigurationValidator Quick Tests', () => {
    it('should validate basic configurations', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');

      const validConfig = {
        provider: 'openai' as const,
        apiKey: 'sk-test1234567890',
        model: 'gpt-4',
      };

      const result = ConfigurationValidator.validateQuick(validConfig);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });

    it('should detect invalid API keys', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');

      const invalidConfig = {
        provider: 'openai' as const,
        apiKey: '',
        model: 'gpt-4',
      };

      const result = ConfigurationValidator.validateQuick(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should list supported providers', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');

      const providers = ConfigurationValidator.getSupportedProviders();

      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);
      expect(providers).toContain('openai');
    });

    it('should provide default configurations', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');

      const defaultConfig = ConfigurationValidator.getDefaultConfig('openai');

      expect(defaultConfig).toBeDefined();
      expect(defaultConfig).toHaveProperty('provider');
      expect(defaultConfig.provider).toBe('openai');
    });
  });

  describe('Security Manager Basic Tests', () => {
    it('should create security manager', async () => {
      const { SecurityManager } = await import('../../src/core/SecurityManager');

      const manager = new SecurityManager({
        enableInputSanitization: true,
        enableOutputFiltering: true,
        maxInputLength: 10000,
      });

      expect(manager).toBeDefined();
    });

    it('should validate basic input', async () => {
      const { SecurityManager } = await import('../../src/core/SecurityManager');

      const manager = new SecurityManager({
        enableInputSanitization: true,
        enableOutputFiltering: true,
        maxInputLength: 1000,
      });

      const testMessage = {
        role: 'user' as const,
        content: 'Hello World',
        timestamp: new Date(),
        id: 'test-1',
      };

      // validateInput expects a ChatMessage object and returns a promise
      const result = await manager.validateInput(testMessage);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
    });
  });

  describe('Error Handler Basic Tests', () => {
    it('should create error handler', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');

      const handler = new ErrorHandler({
        maxRetries: 3,
        baseDelay: 1000,
      });

      expect(handler).toBeDefined();
    });

    it('should process errors', async () => {
      const { ErrorHandler } = await import('../../src/core/ErrorHandler');

      const handler = new ErrorHandler({
        maxRetries: 1,
        baseDelay: 100,
      });

      const testError = new Error('Test error');

      // processError method should be available
      expect(handler).toBeDefined();
      expect(typeof handler.processError).toBe('function');

      const result = handler.processError(testError, 'openai');
      expect(result).toBeDefined();
    });
  });

  describe.skip('RateLimiter Static Tests', () => {
    it('should import RateLimiter class', async () => {
      const { RateLimiter } = await import('../../src/utils/RateLimiter');

      expect(RateLimiter).toBeDefined();
      expect(typeof RateLimiter).toBe('function'); // Constructor function
    });
  });
});
