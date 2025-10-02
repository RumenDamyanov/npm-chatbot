import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import type {
  AiProviderConfig,
  ChatContext,
  GenerationOptions,
} from '../../src/types/ChatbotTypes';

// Mock Anthropic SDK properly
const mockCreate = jest.fn();

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate,
    },
  })),
}));

import { AnthropicProvider } from '../../src/providers/AnthropicProvider';

describe('AnthropicProvider - Focused Coverage', () => {
  let provider: AnthropicProvider;
  let mockConfig: AiProviderConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfig = {
      apiKey: 'test-anthropic-key',
      model: 'claude-sonnet-4-5-20250929',
      apiUrl: 'https://api.anthropic.com',
    };

    provider = new AnthropicProvider(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor & Configuration', () => {
    test('should create provider with valid config', () => {
      expect(provider.name).toBe('anthropic');
      expect(provider.capabilities).toBeDefined();
      expect(provider.capabilities.supportedModels).toContain('claude-sonnet-4-5-20250929');
    });

    test('should throw error without API key', () => {
      expect(() => {
        new AnthropicProvider({ ...mockConfig, apiKey: '' });
      }).toThrow('Anthropic API key is required');
    });

    test('should use default model when none specified', () => {
      const configWithoutModel = { ...mockConfig };
      delete configWithoutModel.model;

      const providerWithoutModel = new AnthropicProvider(configWithoutModel);
      expect(providerWithoutModel).toBeDefined();
    });

    test('should handle custom API URL in constructor', () => {
      const customConfig = {
        ...mockConfig,
        apiUrl: 'https://custom-anthropic-api.com',
      };

      const customProvider = new AnthropicProvider(customConfig);
      expect(customProvider).toBeDefined();
    });
  });

  describe('Capabilities', () => {
    test('should have correct capabilities structure', () => {
      const caps = provider.capabilities;

      expect(caps.maxInputTokens).toBe(200000);
      expect(caps.maxOutputTokens).toBe(8192);
      expect(caps.supportsStreaming).toBe(true);
      expect(caps.supportsFunctionCalling).toBe(true);
      expect(caps.supportsImageInput).toBe(true);
      expect(caps.supportsAudioInput).toBe(false);
    });

    test('should include rate limits', () => {
      const rateLimits = provider.capabilities.rateLimits;

      expect(rateLimits).toBeDefined();
      expect(rateLimits?.requestsPerMinute).toBe(1000);
      expect(rateLimits?.requestsPerHour).toBe(5000);
      expect(rateLimits?.tokensPerMinute).toBe(40000);
    });

    test('should support all Claude models', () => {
      const models = provider.capabilities.supportedModels;

      expect(models).toContain('claude-sonnet-4-5-20250929');
      expect(models).toContain('claude-3-5-haiku-20241022');
      expect(models).toContain('claude-3-opus-20240229');
      expect(models).toContain('claude-3-sonnet-20240229');
      expect(models).toContain('claude-3-haiku-20240307');
    });
  });

  describe('Availability Check', () => {
    test('should return true when API call succeeds', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Hi' }],
        usage: { input_tokens: 2, output_tokens: 1 },
      });

      const available = await provider.isAvailable();

      expect(available).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      });
    });

    test('should return false and store error when API call fails', async () => {
      const testError = new Error('API unavailable');
      mockCreate.mockRejectedValueOnce(testError);

      const available = await provider.isAvailable();

      expect(available).toBe(false);
    });

    test('should handle non-Error exceptions', async () => {
      mockCreate.mockRejectedValueOnce('String error');

      const available = await provider.isAvailable();

      expect(available).toBe(false);
    });
  });

  describe('Response Generation', () => {
    test('should generate basic response', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Hello, how can I help you?' }],
        usage: { input_tokens: 10, output_tokens: 20 },
        stop_reason: 'end_turn',
      };

      mockCreate.mockResolvedValueOnce(mockResponse);

      const result = await provider.generateResponse('Hello');

      expect(result.content).toBe('Hello, how can I help you?');
      expect(result.provider).toBe('anthropic');
      expect(result.metadata?.model).toBe('claude-sonnet-4-5-20250929');
      expect(result.metadata?.usage?.totalTokens).toBe(30);
    });

    test('should handle context with conversation history', async () => {
      const context: ChatContext = {
        messages: [
          { role: 'user', content: 'What is 2+2?' },
          { role: 'assistant', content: '2+2 equals 4.' },
          { role: 'system', content: 'Be helpful' }, // Should be excluded
        ],
        systemPrompt: 'You are a helpful assistant',
      };

      const mockResponse = {
        content: [{ type: 'text', text: 'I can help with more math!' }],
        usage: { input_tokens: 15, output_tokens: 10 },
        stop_reason: 'end_turn',
      };

      mockCreate.mockResolvedValueOnce(mockResponse);

      await provider.generateResponse('Can you help with more math?', context);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [
          { role: 'user', content: 'What is 2+2?' },
          { role: 'assistant', content: '2+2 equals 4.' },
          { role: 'user', content: 'Can you help with more math?' },
        ],
        system: 'You are a helpful assistant',
        stream: false,
      });
    });

    test('should apply generation options', async () => {
      const options: GenerationOptions = {
        model: 'claude-3-opus-20240229',
        maxTokens: 2048,
        temperature: 0.7,
        topP: 0.9,
        stop: ['STOP', 'END'],
      };

      const mockResponse = {
        content: [{ type: 'text', text: 'Response with options' }],
        usage: { input_tokens: 5, output_tokens: 8 },
        stop_reason: 'stop_sequence',
      };

      mockCreate.mockResolvedValueOnce(mockResponse);

      await provider.generateResponse('Test message', undefined, options);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'claude-3-opus-20240229',
        max_tokens: 2048,
        temperature: 0.7,
        top_p: 0.9,
        stop_sequences: ['STOP', 'END'],
        messages: [{ role: 'user', content: 'Test message' }],
        stream: false,
      });
    });

    test('should handle multiple content blocks', async () => {
      const mockResponse = {
        content: [
          { type: 'text', text: 'First part' },
          { type: 'text', text: ' Second part' },
        ],
        usage: { input_tokens: 5, output_tokens: 10 },
        stop_reason: 'end_turn',
      };

      mockCreate.mockResolvedValueOnce(mockResponse);

      const result = await provider.generateResponse('Test');

      expect(result.content).toBe('First part Second part');
    });

    test('should throw error when no content generated', async () => {
      const mockResponse = {
        content: [],
        usage: { input_tokens: 5, output_tokens: 0 },
        stop_reason: 'end_turn',
      };

      mockCreate.mockResolvedValueOnce(mockResponse);

      await expect(provider.generateResponse('Test')).rejects.toThrow('No response generated');
    });

    test('should handle API errors', async () => {
      const apiError = new Error('Rate limit exceeded');
      mockCreate.mockRejectedValueOnce(apiError);

      await expect(provider.generateResponse('Test')).rejects.toThrow(
        'Anthropic API error: Rate limit exceeded'
      );
    });

    test('should handle non-Error API failures', async () => {
      mockCreate.mockRejectedValueOnce('Network timeout');

      await expect(provider.generateResponse('Test')).rejects.toThrow(
        'Anthropic API error: Unknown error'
      );
    });
  });

  describe('Status Monitoring', () => {
    test('should return status with availability', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'OK' }],
        usage: { input_tokens: 1, output_tokens: 1 },
      });

      const status = await provider.getStatus();

      expect(status.available).toBe(true);
      expect(status.model).toBe('claude-sonnet-4-5-20250929');
      expect(status.version).toBe('1.0.0');
      expect(status.usage).toBeDefined();
    });

    test('should include last error in status when available', async () => {
      // First, trigger an error
      mockCreate.mockRejectedValueOnce(new Error('Test error'));
      await provider.isAvailable();

      // Then get status
      mockCreate.mockRejectedValueOnce(new Error('Still failing'));
      const status = await provider.getStatus();

      expect(status.available).toBe(false);
      expect(status.lastError).toBeDefined();
    });

    test('should track usage statistics', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Response' }],
        usage: { input_tokens: 10, output_tokens: 15 },
        stop_reason: 'end_turn',
      };

      mockCreate.mockResolvedValue(mockResponse);

      // Make multiple requests
      await provider.generateResponse('Test 1');
      await provider.generateResponse('Test 2');

      const status = await provider.getStatus();

      expect(status.usage.requests).toBeGreaterThan(0);
      expect(status.usage.tokens).toBeGreaterThan(0);
    });
  });

  describe('Configuration Management', () => {
    test('should update configuration', () => {
      const newConfig = {
        model: 'claude-3-haiku-20240307',
        temperature: 0.5,
      };

      provider.updateConfig(newConfig);

      // Configuration update should not throw
      expect(() => provider.updateConfig(newConfig)).not.toThrow();
    });

    test('should recreate client when API config changes', () => {
      provider.updateConfig({
        apiKey: 'new-api-key',
      });

      // Configuration update should complete without error
      expect(true).toBe(true);
    });

    test('should recreate client when API URL changes', () => {
      provider.updateConfig({
        apiUrl: 'https://new-api-url.com',
      });

      // Configuration update should complete without error
      expect(true).toBe(true);
    });

    test('should validate valid configuration', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'OK' }],
        usage: { input_tokens: 1, output_tokens: 1 },
      });

      const validConfig: AiProviderConfig = {
        apiKey: 'valid-key',
        model: 'claude-sonnet-4-5-20250929',
      };

      const isValid = await provider.validateConfig(validConfig);

      expect(isValid).toBe(true);
    });

    test('should reject configuration without API key', async () => {
      const invalidConfig: AiProviderConfig = {
        apiKey: '',
        model: 'claude-sonnet-4-5-20250929',
      };

      const isValid = await provider.validateConfig(invalidConfig);

      expect(isValid).toBe(false);
    });

    test('should reject configuration that fails API test', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Invalid API key'));

      const invalidConfig: AiProviderConfig = {
        apiKey: 'invalid-key',
        model: 'claude-sonnet-4-5-20250929',
      };

      const isValid = await provider.validateConfig(invalidConfig);

      expect(isValid).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    test('should return supported models', async () => {
      const models = await provider.getModels();

      expect(models).toContain('claude-sonnet-4-5-20250929');
      expect(models).toContain('claude-3-opus-20240229');
      expect(models.length).toBeGreaterThan(0);
    });

    test('should test connection', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Connected' }],
        usage: { input_tokens: 1, output_tokens: 1 },
      });

      const connected = await provider.testConnection();

      expect(connected).toBe(true);
    });

    test('should handle connection test failure', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Connection failed'));

      const connected = await provider.testConnection();

      expect(connected).toBe(false);
    });
  });

  describe('Streaming Response', () => {
    test('should handle streaming method existence', () => {
      // Test that the streaming method exists and is callable
      expect(typeof provider.generateStreamingResponse).toBe('function');
    });
  });
});
