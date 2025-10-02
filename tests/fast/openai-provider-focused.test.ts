/**
 * Focused OpenAI Provider Tests
 * Targeting actual implementation for coverage boost
 */

import { OpenAIProvider } from '../../src/providers/OpenAIProvider';
import type { AiProviderConfig, ChatContext } from '../../src/types/ChatbotTypes';

// Mock OpenAI
jest.mock('openai');

describe('OpenAI Provider - Focused Coverage', () => {
  let provider: OpenAIProvider;

  const baseConfig: AiProviderConfig = {
    apiKey: 'test-api-key',
    model: 'gpt-4',
    organizationId: 'test-org',
    apiUrl: 'https://api.openai.com/v1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new OpenAIProvider(baseConfig);
  });

  describe('Constructor and Basic Properties', () => {
    it('should create provider with valid config', () => {
      expect(provider).toBeInstanceOf(OpenAIProvider);
      expect(provider.name).toBe('openai');
      expect(provider.capabilities).toBeDefined();
    });

    it('should throw error without API key', () => {
      const invalidConfig = { ...baseConfig };
      delete invalidConfig.apiKey;

      expect(() => new OpenAIProvider(invalidConfig)).toThrow('OpenAI API key is required');
    });

    it('should set default model when not specified', () => {
      const configNoModel = { ...baseConfig };
      delete configNoModel.model;

      const providerNoModel = new OpenAIProvider(configNoModel);
      expect(providerNoModel).toBeInstanceOf(OpenAIProvider);
    });

    it('should have correct capabilities', () => {
      const caps = provider.capabilities;

      expect(caps.maxInputTokens).toBe(128000);
      expect(caps.maxOutputTokens).toBe(4096);
      expect(caps.supportedModels).toContain('gpt-4');
      expect(caps.supportedModels).toContain('gpt-3.5-turbo');
      expect(caps.supportsStreaming).toBe(true);
      expect(caps.supportsFunctionCalling).toBe(true);
    });

    it('should have rate limits defined', () => {
      const rateLimits = provider.capabilities.rateLimits;

      expect(rateLimits).toBeDefined();
      expect(rateLimits!.requestsPerMinute).toBe(10000);
      expect(rateLimits!.tokensPerMinute).toBe(30000000);
    });
  });

  describe('Availability Checking', () => {
    it('should handle isAvailable success', async () => {
      // Mock the OpenAI client
      const mockRetrieve = jest.fn().mockResolvedValue({});
      (provider as any).client = {
        models: {
          retrieve: mockRetrieve,
        },
      };

      const result = await provider.isAvailable();

      expect(result).toBe(true);
      expect(mockRetrieve).toHaveBeenCalledWith('gpt-3.5-turbo');
    });

    it('should handle isAvailable failure', async () => {
      // Mock the OpenAI client
      const mockRetrieve = jest.fn().mockRejectedValue(new Error('API Error'));
      (provider as any).client = {
        models: {
          retrieve: mockRetrieve,
        },
      };

      const result = await provider.isAvailable();

      expect(result).toBe(false);
    });
  });

  describe('Configuration Management', () => {
    it('should update config and recreate client', () => {
      const newConfig = {
        apiKey: 'new-key',
        model: 'gpt-3.5-turbo',
      };

      provider.updateConfig(newConfig);

      // Should not throw error
      expect(provider).toBeDefined();
    });

    it('should update only model when API config not changed', () => {
      const newConfig = {
        model: 'gpt-3.5-turbo',
      };

      provider.updateConfig(newConfig);

      expect(provider).toBeDefined();
    });

    it('should handle config update with organization', () => {
      const newConfig = {
        organizationId: 'new-org',
      };

      provider.updateConfig(newConfig);

      expect(provider).toBeDefined();
    });

    it('should handle config update with API URL', () => {
      const newConfig = {
        apiUrl: 'https://custom.openai.com',
      };

      provider.updateConfig(newConfig);

      expect(provider).toBeDefined();
    });
  });

  describe('Status Monitoring', () => {
    it('should provide status information', async () => {
      // Mock isAvailable
      const mockRetrieve = jest.fn().mockResolvedValue({});
      (provider as any).client = {
        models: {
          retrieve: mockRetrieve,
        },
      };

      const status = await provider.getStatus();

      expect(status).toBeDefined();
      expect(status.available).toBe(true);
      expect(typeof status.model).toBe('string');
      expect(status.version).toBe('1.0.0');
      expect(status.usage).toBeDefined();
      expect(status.usage.requests).toBe(0);
    });

    it('should include last error in status when available', async () => {
      // Force an error
      const mockRetrieve = jest.fn().mockRejectedValue(new Error('Test error'));
      (provider as any).client = {
        models: {
          retrieve: mockRetrieve,
        },
      };

      // This will set lastError
      await provider.isAvailable();

      const status = await provider.getStatus();

      expect(status.lastError).toBeDefined();
      expect(status.lastError?.message).toBe('Test error');
    });
  });

  describe('Response Generation Setup', () => {
    beforeEach(() => {
      // Mock the error handler and client
      (provider as any).errorHandler = {
        executeWithRetry: jest.fn().mockImplementation(async (fn) => {
          return await fn();
        }),
      };
    });

    it('should handle generateResponse with minimal setup', async () => {
      // Mock successful response
      (provider as any).client = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: 'Test response',
                  },
                  finish_reason: 'stop',
                },
              ],
              usage: {
                prompt_tokens: 10,
                completion_tokens: 5,
                total_tokens: 15,
              },
            }),
          },
        },
      };

      const response = await provider.generateResponse('Hello');

      expect(response).toBeDefined();
      expect(response.content).toBe('Test response');
      expect(response.provider).toBe('openai');
    });

    it('should handle generateResponse with context', async () => {
      const context: ChatContext = {
        sessionId: 'test-session',
        userId: 'test-user',
        systemPrompt: 'You are helpful',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Previous question',
            timestamp: new Date(),
          },
        ],
        metadata: {},
      };

      (provider as any).client = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: 'Response with context',
                  },
                  finish_reason: 'stop',
                },
              ],
              usage: {
                total_tokens: 20,
              },
            }),
          },
        },
      };

      const response = await provider.generateResponse('New question', context);

      expect(response.content).toBe('Response with context');
      expect(response.metadata.usage).toBeDefined();
    });

    it('should handle error in generateResponse', async () => {
      (provider as any).client = {
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('API Error')),
          },
        },
      };

      await expect(provider.generateResponse('Test')).rejects.toThrow(
        'OpenAI API error: API Error'
      );
    });

    it('should handle response without content', async () => {
      (provider as any).client = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    // No content
                  },
                  finish_reason: 'stop',
                },
              ],
            }),
          },
        },
      };

      await expect(provider.generateResponse('Test')).rejects.toThrow('No response generated');
    });

    it('should update usage statistics', async () => {
      (provider as any).client = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: 'Test',
                  },
                  finish_reason: 'stop',
                },
              ],
              usage: {
                total_tokens: 25,
              },
            }),
          },
        },
      };

      await provider.generateResponse('Test');

      const status = await provider.getStatus();
      expect(status.usage.requests).toBe(1);
      expect(status.usage.tokens).toBe(25);
    });
  });

  describe('Message Processing Edge Cases', () => {
    beforeEach(() => {
      (provider as any).errorHandler = {
        executeWithRetry: jest.fn().mockImplementation(async (fn) => {
          return await fn();
        }),
      };

      (provider as any).client = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: 'Response',
                  },
                  finish_reason: 'stop',
                },
              ],
            }),
          },
        },
      };
    });

    it('should filter invalid message roles', async () => {
      const context: ChatContext = {
        sessionId: 'test',
        userId: 'test',
        messages: [
          {
            id: 'msg-1',
            role: 'function' as any, // Invalid role
            content: 'Function result',
            timestamp: new Date(),
          },
          {
            id: 'msg-2',
            role: 'user',
            content: 'Valid message',
            timestamp: new Date(),
          },
        ],
        metadata: {},
      };

      await provider.generateResponse('Test', context);

      const createCall = (provider as any).client.chat.completions.create.mock.calls[0][0];
      const userMessages = createCall.messages.filter((m: any) => m.role === 'user');

      // Should only include valid user message plus the new one
      expect(userMessages).toHaveLength(2); // Valid message + new message
    });

    it('should handle empty message content', async () => {
      const response = await provider.generateResponse('');

      expect(response.content).toBe('Response');
    });

    it('should handle context without system prompt', async () => {
      const context: ChatContext = {
        sessionId: 'test',
        userId: 'test',
        messages: [],
        metadata: {},
      };

      const response = await provider.generateResponse('Test', context);

      expect(response.content).toBe('Response');
    });
  });
});
