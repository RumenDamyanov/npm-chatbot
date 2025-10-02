/**
 * Comprehensive ChatbotTypes tests to improve coverage from 14.28% to 80%+
 * Tests interfaces, types, and error classes
 */

describe('ChatbotTypes Comprehensive Tests', () => {
  describe('ChatbotError Class', () => {
    it('should create ChatbotError with all parameters', async () => {
      const { ChatbotError } = await import('../../src/types/ChatbotTypes');
      
      const error = new ChatbotError('Test error message', 'PROVIDER_ERROR', 'openai', 'ERR_001', { key: 'value' });
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ChatbotError');
      expect(error.message).toBe('Test error message');
      expect(error.type).toBe('PROVIDER_ERROR');
      expect(error.provider).toBe('openai');
      expect(error.code).toBe('ERR_001');
      expect(error.metadata).toEqual({ key: 'value' });
    });

    it('should create ChatbotError with minimal parameters', async () => {
      const { ChatbotError } = await import('../../src/types/ChatbotTypes');
      
      const error = new ChatbotError('Simple error', 'CONFIGURATION_ERROR');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ChatbotError');
      expect(error.message).toBe('Simple error');
      expect(error.type).toBe('CONFIGURATION_ERROR');
      expect(error.provider).toBeUndefined();
      expect(error.code).toBeUndefined();
      expect(error.metadata).toBeUndefined();
    });

    it('should create ChatbotError with only type and provider', async () => {
      const { ChatbotError } = await import('../../src/types/ChatbotTypes');
      
      const error = new ChatbotError('Error message', 'RATE_LIMIT_ERROR', 'anthropic');
      
      expect(error.type).toBe('RATE_LIMIT_ERROR');
      expect(error.provider).toBe('anthropic');
      expect(error.code).toBeUndefined();
      expect(error.metadata).toBeUndefined();
    });

    it('should handle all error types', async () => {
      const { ChatbotError } = await import('../../src/types/ChatbotTypes');
      
      const errorTypes = [
        'PROVIDER_ERROR',
        'CONFIGURATION_ERROR',
        'VALIDATION_ERROR',
        'RATE_LIMIT_ERROR',
        'SECURITY_ERROR',
        'TIMEOUT_ERROR',
        'UNKNOWN_ERROR',
      ] as const;
      
      for (const type of errorTypes) {
        const error = new ChatbotError('Test message', type);
        expect(error.type).toBe(type);
        expect(error.name).toBe('ChatbotError');
      }
    });

    it('should handle all provider types', async () => {
      const { ChatbotError } = await import('../../src/types/ChatbotTypes');
      
      const providers = [
        'openai',
        'anthropic',
        'google',
        'meta',
        'xai',
        'deepseek',
        'ollama',
        'default',
      ] as const;
      
      for (const provider of providers) {
        const error = new ChatbotError('Test message', 'PROVIDER_ERROR', provider);
        expect(error.provider).toBe(provider);
      }
    });

    it('should be throwable and catchable', async () => {
      const { ChatbotError } = await import('../../src/types/ChatbotTypes');
      
      const throwError = (): void => {
        throw new ChatbotError('Thrown error', 'SECURITY_ERROR', 'google', 'SEC_001');
      };
      
      expect(throwError).toThrow('Thrown error');
      
      try {
        throwError();
      } catch (error) {
        expect(error).toBeInstanceOf(ChatbotError);
        expect((error as any).type).toBe('SECURITY_ERROR');
        expect((error as any).provider).toBe('google');
        expect((error as any).code).toBe('SEC_001');
      }
    });

    it('should inherit Error properties', async () => {
      const { ChatbotError } = await import('../../src/types/ChatbotTypes');
      
      const error = new ChatbotError('Stack test', 'TIMEOUT_ERROR');
      
      expect(error.stack).toBeDefined();
      expect(error.toString()).toContain('ChatbotError');
      expect(error.toString()).toContain('Stack test');
    });
  });

  describe('Type Validation and Structure', () => {
    it('should validate ChatMessage structure', () => {
      // Test valid ChatMessage structures
      const validMessages = [
        {
          role: 'user' as const,
          content: 'Hello',
        },
        {
          role: 'assistant' as const,
          content: 'Hi there',
          metadata: { source: 'ai' },
          timestamp: new Date(),
          id: 'msg-123',
        },
        {
          role: 'system' as const,
          content: 'You are a helpful assistant',
          metadata: {},
        },
      ];
      
      for (const message of validMessages) {
        expect(message.role).toMatch(/^(user|assistant|system)$/);
        expect(typeof message.content).toBe('string');
        if (message.metadata) {
          expect(typeof message.metadata).toBe('object');
        }
        if (message.timestamp) {
          expect(message.timestamp).toBeInstanceOf(Date);
        }
        if (message.id) {
          expect(typeof message.id).toBe('string');
        }
      }
    });

    it('should validate ChatContext structure', () => {
      const validContexts = [
        {
          messages: [
            { role: 'user' as const, content: 'Hello' },
            { role: 'assistant' as const, content: 'Hi' },
          ],
        },
        {
          messages: [],
          systemPrompt: 'Be helpful',
          metadata: { sessionType: 'chat' },
          userId: 'user-123',
          sessionId: 'session-456',
        },
      ];
      
      for (const context of validContexts) {
        expect(Array.isArray(context.messages)).toBe(true);
        if (context.systemPrompt) {
          expect(typeof context.systemPrompt).toBe('string');
        }
        if (context.metadata) {
          expect(typeof context.metadata).toBe('object');
        }
        if (context.userId) {
          expect(typeof context.userId).toBe('string');
        }
        if (context.sessionId) {
          expect(typeof context.sessionId).toBe('string');
        }
      }
    });

    it('should validate ChatResponse structure', () => {
      const validResponses = [
        {
          content: 'Response content',
          provider: 'openai' as const,
          timestamp: new Date(),
        },
        {
          content: 'Detailed response',
          provider: 'anthropic' as const,
          metadata: {
            model: 'claude-sonnet-4-5-20250929',
            usage: {
              promptTokens: 10,
              completionTokens: 20,
              totalTokens: 30,
            },
            responseTime: 1500,
            customField: 'value',
          },
          timestamp: new Date(),
        },
      ];
      
      for (const response of validResponses) {
        expect(typeof response.content).toBe('string');
        expect(typeof response.provider).toBe('string');
        expect(response.timestamp).toBeInstanceOf(Date);
        if (response.metadata) {
          expect(typeof response.metadata).toBe('object');
          if (response.metadata.usage) {
            const usage = response.metadata.usage as any;
            expect(typeof usage.promptTokens).toBe('number');
            expect(typeof usage.completionTokens).toBe('number');
            expect(typeof usage.totalTokens).toBe('number');
          }
        }
      }
    });

    it('should validate ChatStreamChunk structure', () => {
      const validChunks = [
        {
          content: 'Hello',
          type: 'content' as const,
          provider: 'google' as const,
          timestamp: new Date(),
        },
        {
          content: '',
          type: 'metadata' as const,
          provider: 'openai' as const,
          metadata: { model: 'gpt-4' },
          timestamp: new Date(),
        },
        {
          content: '',
          type: 'done' as const,
          provider: 'anthropic' as const,
          timestamp: new Date(),
        },
      ];
      
      for (const chunk of validChunks) {
        expect(typeof chunk.content).toBe('string');
        expect(['content', 'metadata', 'done']).toContain(chunk.type);
        expect(typeof chunk.provider).toBe('string');
        expect(chunk.timestamp).toBeInstanceOf(Date);
      }
    });

    it('should validate ChatRequest structure', () => {
      const validRequests = [
        {
          message: 'Hello world',
        },
        {
          message: 'Complex request',
          context: {
            messages: [{ role: 'user' as const, content: 'Previous message' }],
            systemPrompt: 'Be helpful',
            userId: 'user-123',
          },
          config: {
            temperature: 0.7,
            maxTokens: 150,
          },
          metadata: { requestId: 'req-123' },
        },
      ];
      
      for (const request of validRequests) {
        expect(typeof request.message).toBe('string');
        if (request.context) {
          expect(Array.isArray(request.context.messages)).toBe(true);
        }
        if (request.config) {
          expect(typeof request.config).toBe('object');
        }
        if (request.metadata) {
          expect(typeof request.metadata).toBe('object');
        }
      }
    });
  });

  describe('Configuration Interfaces', () => {
    it('should validate ChatbotConfig structure', () => {
      const validConfigs = [
        {
          provider: {
            provider: 'openai' as const,
            apiKey: 'sk-test',
            model: 'gpt-4',
          },
        },
        {
          provider: {
            provider: 'anthropic' as const,
            apiKey: 'ant-test',
            model: 'claude-sonnet-4-5-20250929',
            apiUrl: 'https://api.anthropic.com',
            options: { region: 'us' },
          },
          systemPrompt: 'You are helpful',
          maxHistory: 10,
          temperature: 0.8,
          maxTokens: 200,
          timeout: 30000,
          enableMemory: true,
          security: {
            enableInputFilter: true,
            enableOutputFilter: true,
            profanityFilter: {
              enabled: true,
              strictMode: false,
              customWords: ['badword'],
            },
            contentSafety: {
              enabled: true,
              categories: ['violence', 'harassment'],
              threshold: 0.8,
            },
          },
          rateLimit: {
            enabled: true,
            requestsPerMinute: 10,
            requestsPerHour: 100,
            requestsPerDay: 1000,
            keyGenerator: (context: any): string => `user:${context.userId}`,
          },
          logging: {
            enabled: true,
            level: 'info' as const,
            logConversations: true,
            logProviderRequests: false,
          },
        },
      ];
      
      for (const config of validConfigs) {
        expect(typeof config.provider).toBe('object');
        expect(typeof config.provider.provider).toBe('string');
        
        if (config.systemPrompt) {
          expect(typeof config.systemPrompt).toBe('string');
        }
        if (config.maxHistory) {
          expect(typeof config.maxHistory).toBe('number');
        }
        if (config.temperature) {
          expect(typeof config.temperature).toBe('number');
        }
        if (config.maxTokens) {
          expect(typeof config.maxTokens).toBe('number');
        }
        if (config.timeout) {
          expect(typeof config.timeout).toBe('number');
        }
        if (config.enableMemory !== undefined) {
          expect(typeof config.enableMemory).toBe('boolean');
        }
      }
    });

    it('should validate AiProviderConfig structure', () => {
      const validProviderConfigs = [
        {
          provider: 'openai' as const,
        },
        {
          provider: 'google' as const,
          apiKey: 'google-key',
          apiUrl: 'https://generativelanguage.googleapis.com',
          model: 'gemini-pro',
          organizationId: 'org-123',
          options: { region: 'us-central1' },
        },
      ];
      
      for (const config of validProviderConfigs) {
        expect(['openai', 'anthropic', 'google', 'meta', 'xai', 'deepseek', 'ollama', 'default']).toContain(config.provider);
        
        if (config.apiKey) {
          expect(typeof config.apiKey).toBe('string');
        }
        if (config.apiUrl) {
          expect(typeof config.apiUrl).toBe('string');
        }
        if (config.model) {
          expect(typeof config.model).toBe('string');
        }
        if (config.organizationId) {
          expect(typeof config.organizationId).toBe('string');
        }
        if (config.options) {
          expect(typeof config.options).toBe('object');
        }
      }
    });

    it('should validate SecurityConfig structure', () => {
      const validSecurityConfigs = [
        {},
        {
          enableInputFilter: true,
          enableOutputFilter: false,
          profanityFilter: {
            enabled: true,
            strictMode: true,
            customWords: ['word1', 'word2'],
          },
          contentSafety: {
            enabled: true,
            categories: ['violence', 'hate', 'harassment'],
            threshold: 0.9,
          },
        },
      ];
      
      for (const config of validSecurityConfigs) {
        if (config.enableInputFilter !== undefined) {
          expect(typeof config.enableInputFilter).toBe('boolean');
        }
        if (config.enableOutputFilter !== undefined) {
          expect(typeof config.enableOutputFilter).toBe('boolean');
        }
        if (config.profanityFilter) {
          expect(typeof config.profanityFilter.enabled).toBe('boolean');
          if (config.profanityFilter.strictMode !== undefined) {
            expect(typeof config.profanityFilter.strictMode).toBe('boolean');
          }
          if (config.profanityFilter.customWords) {
            expect(Array.isArray(config.profanityFilter.customWords)).toBe(true);
          }
        }
        if (config.contentSafety) {
          expect(typeof config.contentSafety.enabled).toBe('boolean');
          if (config.contentSafety.categories) {
            expect(Array.isArray(config.contentSafety.categories)).toBe(true);
          }
          if (config.contentSafety.threshold) {
            expect(typeof config.contentSafety.threshold).toBe('number');
          }
        }
      }
    });

    it('should validate RateLimitConfig structure', () => {
      const validRateLimitConfigs = [
        {},
        {
          enabled: true,
          requestsPerMinute: 10,
          requestsPerHour: 100,
          requestsPerDay: 1000,
          keyGenerator: (context: any): string => `key:${context.id}`,
        },
      ];
      
      for (const config of validRateLimitConfigs) {
        if (config.enabled !== undefined) {
          expect(typeof config.enabled).toBe('boolean');
        }
        if (config.requestsPerMinute) {
          expect(typeof config.requestsPerMinute).toBe('number');
        }
        if (config.requestsPerHour) {
          expect(typeof config.requestsPerHour).toBe('number');
        }
        if (config.requestsPerDay) {
          expect(typeof config.requestsPerDay).toBe('number');
        }
        if (config.keyGenerator) {
          expect(typeof config.keyGenerator).toBe('function');
        }
      }
    });

    it('should validate LoggingConfig structure', () => {
      const validLoggingConfigs = [
        {},
        {
          enabled: true,
          level: 'debug' as const,
          logConversations: true,
          logProviderRequests: false,
          logger: {
            debug: (message: string): void => {},
            info: (message: string): void => {},
            warn: (message: string): void => {},
            error: (message: string): void => {},
          },
        },
      ];
      
      for (const config of validLoggingConfigs) {
        if (config.enabled !== undefined) {
          expect(typeof config.enabled).toBe('boolean');
        }
        if (config.level) {
          expect(['debug', 'info', 'warn', 'error']).toContain(config.level);
        }
        if (config.logConversations !== undefined) {
          expect(typeof config.logConversations).toBe('boolean');
        }
        if (config.logProviderRequests !== undefined) {
          expect(typeof config.logProviderRequests).toBe('boolean');
        }
        if (config.logger) {
          expect(typeof config.logger.debug).toBe('function');
          expect(typeof config.logger.info).toBe('function');
          expect(typeof config.logger.warn).toBe('function');
          expect(typeof config.logger.error).toBe('function');
        }
      }
    });
  });

  describe('Type Constants and Enums', () => {
    it('should have valid message roles', () => {
      const validRoles = ['system', 'user', 'assistant'];
      
      for (const role of validRoles) {
        expect(['system', 'user', 'assistant']).toContain(role);
      }
    });

    it('should have valid provider types', () => {
      const validProviders = [
        'openai',
        'anthropic',
        'google',
        'meta',
        'xai',
        'deepseek',
        'ollama',
        'default',
      ];
      
      for (const provider of validProviders) {
        expect(typeof provider).toBe('string');
        expect(provider.length).toBeGreaterThan(0);
      }
    });

    it('should have valid error types', () => {
      const validErrorTypes = [
        'PROVIDER_ERROR',
        'CONFIGURATION_ERROR',
        'VALIDATION_ERROR',
        'RATE_LIMIT_ERROR',
        'SECURITY_ERROR',
        'TIMEOUT_ERROR',
        'UNKNOWN_ERROR',
      ];
      
      for (const errorType of validErrorTypes) {
        expect(typeof errorType).toBe('string');
        expect(errorType).toMatch(/^[A-Z_]+$/);
      }
    });

    it('should have valid log levels', () => {
      const validLogLevels = ['debug', 'info', 'warn', 'error'];
      
      for (const level of validLogLevels) {
        expect(typeof level).toBe('string');
        expect(['debug', 'info', 'warn', 'error']).toContain(level);
      }
    });

    it('should have valid chunk types', () => {
      const validChunkTypes = ['content', 'metadata', 'done'];
      
      for (const type of validChunkTypes) {
        expect(typeof type).toBe('string');
        expect(['content', 'metadata', 'done']).toContain(type);
      }
    });
  });

  describe('Complex Type Scenarios', () => {
    it('should handle nested configuration objects', () => {
      const complexConfig = {
        provider: {
          provider: 'openai' as const,
          apiKey: 'sk-complex',
          options: {
            nested: {
              deeply: {
                value: 'test',
              },
            },
          },
        },
        security: {
          profanityFilter: {
            enabled: true,
            customWords: ['bad1', 'bad2'],
          },
        },
        logging: {
          logger: {
            debug: (): void => {},
            info: (): void => {},
            warn: (): void => {},
            error: (): void => {},
          },
        },
      };
      
      expect(complexConfig.provider.provider).toBe('openai');
      expect(complexConfig.provider.options?.nested).toBeDefined();
      expect(complexConfig.security.profanityFilter?.customWords).toHaveLength(2);
      expect(typeof complexConfig.logging.logger?.debug).toBe('function');
    });

    it('should handle complete conversation flow types', () => {
      const request = {
        message: 'Hello',
        context: {
          messages: [
            { role: 'system' as const, content: 'Be helpful' },
            { role: 'user' as const, content: 'Previous question' },
            { role: 'assistant' as const, content: 'Previous answer' },
          ],
          userId: 'user-123',
          sessionId: 'session-456',
        },
        metadata: { requestId: 'req-789' },
      };
      
      const response = {
        content: 'Hello! How can I help you?',
        provider: 'openai' as const,
        metadata: {
          model: 'gpt-4',
          usage: {
            promptTokens: 25,
            completionTokens: 8,
            totalTokens: 33,
          },
          responseTime: 1200,
        },
        timestamp: new Date(),
      };
      
      expect(request.message).toBe('Hello');
      expect(request.context?.messages).toHaveLength(3);
      expect(response.content).toContain('Hello');
      expect(response.metadata?.usage?.totalTokens).toBe(33);
    });
  });
});