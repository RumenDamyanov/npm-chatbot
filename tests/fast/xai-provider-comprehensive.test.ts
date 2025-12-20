/**
 * Comprehensive xAI Grok Provider Tests
 * Testing all functionality for xAI Grok provider
 */

import { XaiProvider } from '../../src/providers/XaiProvider';
import type { AiProviderConfig, ChatContext } from '../../src/types/ChatbotTypes';

// Mock fetch globally
global.fetch = jest.fn();

describe('xAI Provider - Comprehensive Coverage', () => {
  let provider: XaiProvider;

  const baseConfig: AiProviderConfig = {
    apiKey: 'test-xai-key',
    model: 'grok-2-latest',
    endpoint: 'https://api.x.ai/v1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new XaiProvider(baseConfig);
  });

  describe('Constructor and Initialization', () => {
    it('should create provider with valid config', () => {
      expect(provider).toBeInstanceOf(XaiProvider);
      expect(provider.name).toBe('xai');
      expect(provider.capabilities).toBeDefined();
    });

    it('should throw error without API key', () => {
      const invalidConfig = { ...baseConfig };
      delete invalidConfig.apiKey;

      expect(() => new XaiProvider(invalidConfig)).toThrow('xAI API key is required');
    });

    it('should use default endpoint when not specified', () => {
      const configNoEndpoint = { ...baseConfig };
      delete configNoEndpoint.endpoint;

      const providerNoEndpoint = new XaiProvider(configNoEndpoint);
      expect(providerNoEndpoint).toBeInstanceOf(XaiProvider);
    });

    it('should initialize with default model when not specified', () => {
      const configNoModel = { ...baseConfig };
      delete configNoModel.model;

      const providerNoModel = new XaiProvider(configNoModel);
      expect(providerNoModel).toBeInstanceOf(XaiProvider);
    });

    it('should have correct capabilities', () => {
      expect(provider.capabilities.supportsStreaming).toBe(true);
      expect(provider.capabilities.supportsFunctionCalling).toBe(true);
      expect(provider.capabilities.supportsImageInput).toBe(true);
      expect(provider.capabilities.supportedModels).toContain('grok-2-latest');
      expect(provider.capabilities.supportedModels).toContain('grok-2-vision-1212');
    });
  });

  describe('isAvailable', () => {
    it('should return true when API is available', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const available = await provider.isAvailable();
      expect(available).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.x.ai/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-xai-key',
          }),
        })
      );
    });

    it('should return false when API is unavailable', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      const available = await provider.isAvailable();
      expect(available).toBe(false);
    });

    it('should return false on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const available = await provider.isAvailable();
      expect(available).toBe(false);
    });
  });

  describe('generateResponse', () => {
    it('should generate response successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'This is a test response from Grok',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await provider.generateResponse('Hello, Grok!');

      expect(response).toBeDefined();
      expect(response.content).toBe('This is a test response from Grok');
      expect(response.provider).toBe('xai');
      expect(response.metadata?.usage?.totalTokens).toBe(30);
    });

    it('should include system prompt in request', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const context: ChatContext = {
        systemPrompt: 'You are Grok',
        messages: [],
      };

      await provider.generateResponse('Test', context);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.x.ai/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('You are Grok'),
        })
      );
    });

    it('should include conversation history', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const context: ChatContext = {
        messages: [
          { role: 'user', content: 'Previous message' },
          { role: 'assistant', content: 'Previous response' },
        ],
      };

      await provider.generateResponse('New message', context);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.messages).toHaveLength(3);
    });

    it('should handle API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(provider.generateResponse('Test')).rejects.toThrow();
    });

    it('should handle missing response content', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: {} }],
        }),
      });

      await expect(provider.generateResponse('Test')).rejects.toThrow(
        'No response generated from xAI Grok'
      );
    });

    it('should pass generation options', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.generateResponse('Test', undefined, {
        temperature: 0.8,
        maxTokens: 500,
        topP: 0.9,
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.temperature).toBe(0.8);
      expect(body.max_tokens).toBe(500);
      expect(body.top_p).toBe(0.9);
    });
  });

  describe('generateStreamingResponse', () => {
    it('should stream response chunks', async () => {
      const mockChunks = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n',
        'data: {"choices":[{"delta":{"content":" from"}}]}\n',
        'data: {"choices":[{"delta":{"content":" Grok"}}]}\n',
        'data: [DONE]\n',
      ];

      const mockReader = {
        read: jest
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(mockChunks[0]),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(mockChunks[1]),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(mockChunks[2]),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(mockChunks[3]),
          })
          .mockResolvedValueOnce({ done: true }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const chunks: string[] = [];
      const stream = provider.generateStreamingResponse('Test');

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' from', ' Grok']);
    });

    it('should handle streaming error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Streaming error',
      });

      const stream = provider.generateStreamingResponse('Test');

      await expect(async () => {
        for await (const chunk of stream) {
          // Should throw before yielding
        }
      }).rejects.toThrow();
    });

    it('should handle missing response body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: null,
      });

      const stream = provider.generateStreamingResponse('Test');

      await expect(async () => {
        for await (const chunk of stream) {
          // Should throw
        }
      }).rejects.toThrow('No response body for streaming');
    });
  });

  describe('getStatus', () => {
    it('should return status with availability', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      const status = await provider.getStatus();

      expect(status.available).toBe(true);
      expect(status.model).toBe('grok-2-latest');
      expect(status.version).toBe('1.0.0');
      expect(status.usage).toBeDefined();
    });

    it('should include last error in status', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

      await provider.isAvailable();

      const status = await provider.getStatus();
      expect(status.lastError).toBeDefined();
      expect(status.lastError?.message).toBe('Test error');
    });
  });

  describe('updateConfig', () => {
    it('should update API key', () => {
      provider.updateConfig({ apiKey: 'new-key' });
      expect(() => provider.updateConfig({ apiKey: 'new-key' })).not.toThrow();
    });

    it('should update endpoint', () => {
      provider.updateConfig({ endpoint: 'https://new-endpoint.com/v1' });
      expect(() => provider.updateConfig({ endpoint: 'https://new-endpoint.com/v1' })).not.toThrow();
    });

    it('should update model', () => {
      provider.updateConfig({ model: 'grok-beta' });
      expect(() => provider.updateConfig({ model: 'grok-beta' })).not.toThrow();
    });
  });

  describe('validateConfig', () => {
    it('should return false for missing API key', async () => {
      const invalidConfig = { ...baseConfig };
      delete invalidConfig.apiKey;

      const isValid = await provider.validateConfig(invalidConfig);
      expect(isValid).toBe(false);
    });

    it('should return true for valid config', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      const isValid = await provider.validateConfig(baseConfig);
      expect(isValid).toBe(true);
    });

    it('should return false on API error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API error'));

      const isValid = await provider.validateConfig(baseConfig);
      expect(isValid).toBe(false);
    });
  });

  describe('getModels', () => {
    it('should fetch and filter Grok models', async () => {
      const mockModels = {
        data: [
          { id: 'grok-2-latest' },
          { id: 'grok-2-vision-1212' },
          { id: 'gpt-4' }, // Should be filtered out
          { id: 'grok-beta' },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockModels,
      });

      const models = await provider.getModels();

      expect(models).toHaveLength(3);
      expect(models).toContain('grok-2-latest');
      expect(models).toContain('grok-2-vision-1212');
      expect(models).not.toContain('gpt-4');
    });

    it('should handle fetch error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(provider.getModels()).rejects.toThrow();
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      const result = await provider.testConnection();
      expect(result).toBe(true);
    });

    it('should fail connection test', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

      const result = await provider.testConnection();
      expect(result).toBe(false);
    });
  });

  describe('getLastError', () => {
    it('should return undefined when no error', () => {
      const error = provider.getLastError();
      expect(error).toBeUndefined();
    });

    it('should return last error after failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

      await provider.isAvailable();

      const error = provider.getLastError();
      expect(error).toBeDefined();
      expect(error?.message).toBe('Test error');
    });
  });

  describe('resetUsage', () => {
    it('should reset usage statistics', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
        }),
      });

      await provider.generateResponse('Test');

      provider.resetUsage();

      const status = await provider.getStatus();
      expect(status.usage?.requests).toBe(0);
      expect(status.usage?.tokens).toBe(0);
    });
  });
});

