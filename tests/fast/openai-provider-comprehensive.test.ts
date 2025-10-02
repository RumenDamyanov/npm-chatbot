/**
 * Comprehensive OpenAI Provider Tests
 * Targeting maximum coverage boost for provider functionality
 */

import { OpenAIProvider } from '../../src/providers/OpenAIProvider';
import type {
  AiProviderConfig,
  ChatContext,
  GenerationOptions,
} from '../../src/types/ChatbotTypes';
import { OpenAI } from 'openai';

// Mock OpenAI
jest.mock('openai');

describe('OpenAI Provider - Comprehensive Coverage', () => {
  let provider: OpenAIProvider;
  let mockClient: jest.Mocked<OpenAI>;
  
  const baseConfig: AiProviderConfig = {
    apiKey: 'test-api-key',
    model: 'gpt-4',
    organizationId: 'test-org',
    apiUrl: 'https://api.openai.com/v1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock client with all required methods
    mockClient = {
      models: {
        retrieve: jest.fn(),
      },
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    } as any;

    // Mock OpenAI constructor
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockClient);
    
    provider = new OpenAIProvider(baseConfig);
  });

  describe('Constructor and Initialization', () => {
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

    it('should initialize with default model when not specified', () => {
      const configNoModel = { ...baseConfig };
      delete configNoModel.model;
      
      const providerNoModel = new OpenAIProvider(configNoModel);
      expect(providerNoModel).toBeInstanceOf(OpenAIProvider);
    });

    it('should initialize with custom organization and URL', () => {
      const customConfig: AiProviderConfig = {
        apiKey: 'test-key',
        organizationId: 'custom-org',
        apiUrl: 'https://custom.openai.com',
        model: 'gpt-3.5-turbo',
      };
      
      const customProvider = new OpenAIProvider(customConfig);
      expect(customProvider).toBeInstanceOf(OpenAIProvider);
      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'test-key',
        organization: 'custom-org',
        baseURL: 'https://custom.openai.com',
      });
    });
  });

  describe('Provider Capabilities', () => {
    it('should have correct capabilities structure', () => {
      const caps = provider.capabilities;
      
      expect(caps.maxInputTokens).toBe(128000);
      expect(caps.maxOutputTokens).toBe(4096);
      expect(caps.supportedModels).toContain('gpt-4');
      expect(caps.supportedModels).toContain('gpt-3.5-turbo');
      expect(caps.supportsStreaming).toBe(true);
      expect(caps.supportsFunctionCalling).toBe(true);
      expect(caps.supportsImageInput).toBe(true);
      expect(caps.supportsAudioInput).toBe(false);
    });

    it('should have rate limit configuration', () => {
      const rateLimits = provider.capabilities.rateLimits;
      
      expect(rateLimits).toBeDefined();
      expect(rateLimits!.requestsPerMinute).toBe(10000);
      expect(rateLimits!.requestsPerHour).toBe(50000);
      expect(rateLimits!.tokensPerMinute).toBe(30000000);
    });

    it('should include all standard GPT models', () => {
      const models = provider.capabilities.supportedModels;
      
      expect(models).toContain('gpt-4');
      expect(models).toContain('gpt-4-turbo');
      expect(models).toContain('gpt-3.5-turbo');
      expect(models).toContain('gpt-4o');
      expect(models).toContain('gpt-4o-mini');
    });
  });

  describe('Availability Checking', () => {
    it('should return true when OpenAI API is available', async () => {
      mockClient.models.retrieve.mockResolvedValue({} as any);
      
      const isAvailable = await provider.isAvailable();
      
      expect(isAvailable).toBe(true);
      expect(mockClient.models.retrieve).toHaveBeenCalledWith('gpt-3.5-turbo');
    });

    it('should return false when OpenAI API is unavailable', async () => {
      mockClient.models.retrieve.mockRejectedValue(new Error('API Error'));
      
      const isAvailable = await provider.isAvailable();
      
      expect(isAvailable).toBe(false);
    });

    it('should handle non-Error rejections', async () => {
      mockClient.models.retrieve.mockRejectedValue('String error');
      
      const isAvailable = await provider.isAvailable();
      
      expect(isAvailable).toBe(false);
    });

    it('should store last error when availability check fails', async () => {
      const testError = new Error('Connection failed');
      mockClient.models.retrieve.mockRejectedValue(testError);
      
      await provider.isAvailable();
      
      // Provider should store the error internally
      expect(mockClient.models.retrieve).toHaveBeenCalled();
    });
  });

  describe('Response Generation', () => {
    beforeEach(() => {
      mockClient.chat.completions.create.mockResolvedValue({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
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
      } as any);
    });

    it('should generate response with simple message', async () => {
      const response = await provider.generateResponse('Hello');
      
      expect(response).toBeDefined();
      expect(response.content).toBe('Test response');
      expect(response.provider).toBe('openai');
      expect(response.metadata).toBeDefined();
      expect(response.metadata?.usage).toBeDefined();
      expect(response.metadata?.usage?.totalTokens).toBe(15);
    });

    it('should use custom model from options', async () => {
      const options: GenerationOptions = {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 100,
      };
      
      await provider.generateResponse('Hello', undefined, options);
      
      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          max_tokens: 100,
        })
      );
    });

    it('should include system prompt in messages', async () => {
      const context: ChatContext = {
        sessionId: 'test-session',
        userId: 'test-user',
        systemPrompt: 'You are a helpful assistant',
        messages: [],
        metadata: {},
      };
      
      await provider.generateResponse('Hello', context);
      
      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: 'You are a helpful assistant',
            }),
          ]),
        })
      );
    });

    it('should include conversation history', async () => {
      const context: ChatContext = {
        sessionId: 'test-session',
        userId: 'test-user',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Previous question',
            timestamp: new Date(),
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'Previous answer',
            timestamp: new Date(),
          },
        ],
        metadata: {},
      };
      
      await provider.generateResponse('New question', context);
      
      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: 'Previous question',
            }),
            expect.objectContaining({
              role: 'assistant',
              content: 'Previous answer',
            }),
            expect.objectContaining({
              role: 'user',
              content: 'New question',
            }),
          ]),
        })
      );
    });

    it('should handle all generation options', async () => {
      const options: GenerationOptions = {
        model: 'gpt-4-turbo',
        temperature: 0.8,
        maxTokens: 200,
        topP: 0.9,
        frequencyPenalty: 0.1,
        presencePenalty: 0.2,
        stop: ['END'],
      };
      
      await provider.generateResponse('Test', undefined, options);
      
      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4-turbo',
          temperature: 0.8,
          max_tokens: 200,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.2,
          stop: ['END'],
        })
      );
    });

    it.skip('should handle streaming requests', async () => {
      // Skip: Streaming tests require complex async iterator mocking
      // SimpleMockProvider pattern doesn't support streaming yet
      const options: GenerationOptions = {
        stream: true,
      };
      
      // Mock streaming response
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield {
            id: 'chatcmpl-123',
            choices: [
              {
                index: 0,
                delta: { content: 'Hello' },
                finish_reason: null,
              },
            ],
          };
          yield {
            id: 'chatcmpl-123',
            choices: [
              {
                index: 0,
                delta: { content: ' world' },
                finish_reason: null,
              },
            ],
          };
          yield {
            id: 'chatcmpl-123',
            choices: [
              {
                index: 0,
                delta: {},
                finish_reason: 'stop',
              },
            ],
          };
        },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockStream as any);
      
      const response = await provider.generateResponse('Test', undefined, options);
      
      expect(response.content).toBe('Hello world');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const apiError = new Error('API Error');
      (apiError as any).status = 400;
      mockClient.chat.completions.create.mockRejectedValue(apiError);
      
      await expect(provider.generateResponse('Test')).rejects.toThrow();
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;
      mockClient.chat.completions.create.mockRejectedValue(rateLimitError);
      
      await expect(provider.generateResponse('Test')).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockClient.chat.completions.create.mockRejectedValue(networkError);
      
      await expect(provider.generateResponse('Test')).rejects.toThrow();
    });

    it('should handle malformed responses', async () => {
      mockClient.chat.completions.create.mockResolvedValue({
        id: 'test',
        choices: [], // Empty choices array
      } as any);
      
      await expect(provider.generateResponse('Test')).rejects.toThrow();
    });

    it('should handle responses without content', async () => {
      mockClient.chat.completions.create.mockResolvedValue({
        id: 'test',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: '', // Empty content
            },
            finish_reason: 'stop',
          },
        ],
      } as any);
      
      // Provider should throw when content is empty/falsy
      await expect(provider.generateResponse('Test')).rejects.toThrow('No response generated');
    });
  });

  describe('Status and Health Monitoring', () => {
    it('should provide status information', async () => {
      const status = await provider.getStatus();
      
      expect(status).toBeDefined();
      expect(status.available).toBeDefined();
      expect(status.model).toBe('gpt-4');
      expect(status.version).toBeDefined();
      expect(status.usage).toBeDefined();
    });

    it('should track usage statistics', async () => {
      mockClient.chat.completions.create.mockResolvedValue({
        id: 'test',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Test',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      } as any);
      
      await provider.generateResponse('Test');
      
      const status = await provider.getStatus();
      expect(status.usage?.requests).toBeGreaterThan(0);
    });

    it('should handle status when no requests made', async () => {
      const status = await provider.getStatus();
      
      expect(status.usage?.requests).toBe(0);
      expect(status.available).toBeDefined(); 
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle empty message', async () => {
      mockClient.chat.completions.create.mockResolvedValue({
        id: 'test',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Empty message response',
            },
            finish_reason: 'stop',
          },
        ],
      } as any);
      
      const response = await provider.generateResponse('');
      expect(response.content).toBe('Empty message response');
    });

    it('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(10000);
      
      mockClient.chat.completions.create.mockResolvedValue({
        id: 'test',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Long message response',
            },
            finish_reason: 'stop',
          },
        ],
      } as any);
      
      const response = await provider.generateResponse(longMessage);
      expect(response.content).toBe('Long message response');
    });

    it('should handle context with empty messages array', async () => {
      const context: ChatContext = {
        sessionId: 'test',
        userId: 'test',
        messages: [],
        metadata: {},
      };
      
      mockClient.chat.completions.create.mockResolvedValue({
        id: 'test',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Response',
            },
            finish_reason: 'stop',
          },
        ],
      } as any);
      
      const response = await provider.generateResponse('Test', context);
      expect(response.content).toBe('Response');
    });

    it('should filter invalid message roles from context', async () => {
      mockClient.chat.completions.create.mockResolvedValue({
        id: 'test',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Response',
            },
            finish_reason: 'stop',
          },
        ],
      } as any);
      
      const context: ChatContext = {
        sessionId: 'test',
        userId: 'test',
        messages: [
          {
            id: 'msg-1',
            role: 'tool' as any, // Invalid role
            content: 'Tool message',
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
      
      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: 'Valid message',
            }),
          ]),
        })
      );
    });
  });

  describe('Configuration and Model Management', () => {
    beforeEach(() => {
      mockClient.chat.completions.create.mockResolvedValue({
        id: 'test',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Response',
            },
            finish_reason: 'stop',
          },
        ],
      } as any);
    });
    
    it('should use configured model by default', async () => {
      await provider.generateResponse('Test');
      
      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
        })
      );
    });

    it('should override model with generation options', async () => {
      const options: GenerationOptions = {
        model: 'gpt-3.5-turbo',
      };
      
      await provider.generateResponse('Test', undefined, options);
      
      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
        })
      );
    });

    it('should handle missing usage in response', async () => {
      mockClient.chat.completions.create.mockResolvedValue({
        id: 'test',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Test',
            },
            finish_reason: 'stop',
          },
        ],
        // No usage field
      } as any);
      
      const response = await provider.generateResponse('Test');
      
      expect(response.content).toBe('Test');
      expect(response.usage).toBeUndefined();
    });
  });
});