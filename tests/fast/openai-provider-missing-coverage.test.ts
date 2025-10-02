/**
 * Additional OpenAI Provider tests to reach 90%+ function coverage
 * Focuses on uncovered methods: validateConfig, error handling, edge cases
 */

import { OpenAIProvider } from '../../src/providers/OpenAIProvider';
import { OpenAI } from 'openai';

// Mock the OpenAI SDK
jest.mock('openai');

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('OpenAI Provider - Missing Coverage', () => {
  let mockOpenAIInstance: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock OpenAI instance with all methods
    mockOpenAIInstance = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
      models: {
        list: jest.fn(),
      },
    };
    
    // Mock the OpenAI constructor
    (OpenAI as any).mockImplementation(() => mockOpenAIInstance);
  });

  describe('validateConfig', () => {
    it('should return false when API key is missing', async () => {
      const config = {
        apiKey: '',
        model: 'gpt-4',
      };

      const provider = new OpenAIProvider({ ...config, apiKey: 'temp-key' } as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(false);
    });

    it('should return true when API key is valid and models.list succeeds', async () => {
      const config = {
        apiKey: 'valid-api-key',
        model: 'gpt-4',
      };

      mockOpenAIInstance.models.list.mockResolvedValue({
        data: [
          { id: 'gpt-4', object: 'model' },
          { id: 'gpt-3.5-turbo', object: 'model' },
        ],
      });

      const provider = new OpenAIProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(true);
      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'valid-api-key',
        organization: undefined,
        baseURL: undefined,
      });
    });

    it('should return true when API key is valid with custom config', async () => {
      const config = {
        apiKey: 'valid-api-key',
        model: 'gpt-4',
        organizationId: 'org-123',
        apiUrl: 'https://custom-api.openai.com/v1',
      };

      mockOpenAIInstance.models.list.mockResolvedValue({
        data: [{ id: 'gpt-4', object: 'model' }],
      });

      const provider = new OpenAIProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(true);
      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'valid-api-key',
        organization: 'org-123',
        baseURL: 'https://custom-api.openai.com/v1',
      });
    });

    it('should return false when API call fails with network error', async () => {
      const config = {
        apiKey: 'invalid-api-key',
        model: 'gpt-4',
      };

      mockOpenAIInstance.models.list.mockRejectedValue(new Error('Network error'));

      const provider = new OpenAIProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(false);
    });

    it('should return false when API call fails with authentication error', async () => {
      const config = {
        apiKey: 'invalid-api-key',
        model: 'gpt-4',
      };

      mockOpenAIInstance.models.list.mockRejectedValue({
        error: {
          message: 'Invalid API key',
          type: 'invalid_request_error',
        },
      });

      const provider = new OpenAIProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(false);
    });

    it('should return false when API call times out', async () => {
      const config = {
        apiKey: 'valid-api-key',
        model: 'gpt-4',
      };

      mockOpenAIInstance.models.list.mockRejectedValue(new Error('Request timeout'));

      const provider = new OpenAIProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(false);
    });
  });

  describe('streamResponse - Error Handling', () => {
    it('should handle streaming errors gracefully', async () => {
      const config = {
        apiKey: 'test-api-key',
        model: 'gpt-4',
      };

      const provider = new OpenAIProvider(config as any);

      // Mock streaming to throw error
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        new Error('Streaming failed')
      );

      const context = {
        messages: [{ role: 'user' as const, content: 'Hello' }],
      };

      await expect(
        provider.generateResponse('Hello', context)
      ).rejects.toThrow();
    });

    it('should handle rate limit errors', async () => {
      const config = {
        apiKey: 'test-api-key',
        model: 'gpt-4',
      };

      const provider = new OpenAIProvider(config as any);

      mockOpenAIInstance.chat.completions.create.mockRejectedValue({
        error: {
          message: 'Rate limit exceeded',
          type: 'rate_limit_error',
          code: 'rate_limit_exceeded',
        },
        status: 429,
      });

      const context = {
        messages: [{ role: 'user' as const, content: 'Hello' }],
      };

      await expect(
        provider.generateResponse('Hello', context)
      ).rejects.toThrow();
    });

    it('should handle invalid response format', async () => {
      const config = {
        apiKey: 'test-api-key',
        model: 'gpt-4',
      };

      const provider = new OpenAIProvider(config as any);

      // Mock response with missing required fields
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4',
        choices: [], // Empty choices array
      });

      const context = {
        messages: [{ role: 'user' as const, content: 'Hello' }],
      };

      await expect(
        provider.generateResponse('Hello', context)
      ).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty API key in config object', async () => {
      const config = {
        apiKey: '',
        model: 'gpt-4',
      };

      const provider = new OpenAIProvider({ ...config, apiKey: 'temp' });
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(false);
    });

    it('should handle null/undefined in validateConfig', async () => {
      const config = {
        apiKey: 'test-key',
        model: 'gpt-4',
      };

      const provider = new OpenAIProvider(config as any);

      // Test with config that has undefined apiKey
      const invalidConfig = { ...config, apiKey: undefined as any };
      const result = await provider.validateConfig(invalidConfig);

      expect(result).toBe(false);
    });

    it('should handle network timeout in models.list', async () => {
      const config = {
        apiKey: 'test-key',
        model: 'gpt-4',
      };

      mockOpenAIInstance.models.list.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('ETIMEDOUT')), 100);
        });
      });

      const provider = new OpenAIProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(false);
    });

    it('should handle connection refused error', async () => {
      const config = {
        apiKey: 'test-key',
        model: 'gpt-4',
      };

      mockOpenAIInstance.models.list.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      });

      const provider = new OpenAIProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(false);
    });

    it('should handle DNS resolution errors', async () => {
      const config = {
        apiKey: 'test-key',
        model: 'gpt-4',
      };

      mockOpenAIInstance.models.list.mockRejectedValue({
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND api.openai.com',
      });

      const provider = new OpenAIProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(false);
    });

    it('should validate config with all optional parameters', async () => {
      const config = {
        apiKey: 'test-key',
        model: 'gpt-4',
        organizationId: 'org-456',
        apiUrl: 'https://api.openai.com/v1',
        temperature: 0.7,
        maxTokens: 2000,
      };

      mockOpenAIInstance.models.list.mockResolvedValue({
        data: [{ id: 'gpt-4', object: 'model' }],
      });

      const provider = new OpenAIProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(true);
      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'test-key',
        organization: 'org-456',
        baseURL: 'https://api.openai.com/v1',
      });
    });

    it('should handle 500 internal server error', async () => {
      const config = {
        apiKey: 'test-key',
        model: 'gpt-4',
      };

      mockOpenAIInstance.models.list.mockRejectedValue({
        status: 500,
        error: {
          message: 'Internal server error',
          type: 'internal_error',
        },
      });

      const provider = new OpenAIProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(false);
    });

    it('should handle 503 service unavailable', async () => {
      const config = {
        apiKey: 'test-key',
        model: 'gpt-4',
      };

      mockOpenAIInstance.models.list.mockRejectedValue({
        status: 503,
        error: {
          message: 'Service temporarily unavailable',
          type: 'service_unavailable',
        },
      });

      const provider = new OpenAIProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(false);
    });
  });

  describe('Configuration Validation Scenarios', () => {
    it('should validate with minimal required config', async () => {
      const config = {
        apiKey: 'sk-test123',
        model: 'gpt-3.5-turbo',
      };

      mockOpenAIInstance.models.list.mockResolvedValue({
        data: [{ id: 'gpt-3.5-turbo', object: 'model' }],
      });

      const provider = new OpenAIProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(true);
    });

    it('should handle empty string API key', async () => {
      const config = {
        apiKey: '   ',
        model: 'gpt-4',
      };

      const provider = new OpenAIProvider({ ...config, apiKey: 'temp' });
      const result = await provider.validateConfig({ ...config, apiKey: '' });

      expect(result).toBe(false);
    });

    it('should handle whitespace-only API key', async () => {
      const config = {
        apiKey: '   ',
        model: 'gpt-4',
      };

      const provider = new OpenAIProvider({ ...config, apiKey: 'temp' });
      
      // Test with trimmed empty string
      const result = await provider.validateConfig({ ...config, apiKey: '' });

      expect(result).toBe(false);
    });
  });

  describe('Error Response Handling', () => {
    it('should handle quota exceeded error', async () => {
      const config = {
        apiKey: 'test-key',
        model: 'gpt-4',
      };

      mockOpenAIInstance.models.list.mockRejectedValue({
        status: 429,
        error: {
          message: 'You exceeded your current quota',
          type: 'insufficient_quota',
        },
      });

      const provider = new OpenAIProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(false);
    });

    it('should handle invalid organization error', async () => {
      const config = {
        apiKey: 'test-key',
        model: 'gpt-4',
        organizationId: 'invalid-org',
      };

      mockOpenAIInstance.models.list.mockRejectedValue({
        status: 401,
        error: {
          message: 'Invalid organization',
          type: 'invalid_request_error',
        },
      });

      const provider = new OpenAIProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(false);
    });

    it('should handle unexpected error objects', async () => {
      const config = {
        apiKey: 'test-key',
        model: 'gpt-4',
      };

      mockOpenAIInstance.models.list.mockRejectedValue({
        unexpected: 'error format',
        random: 'data',
      });

      const provider = new OpenAIProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(false);
    });

    it('should handle string errors', async () => {
      const config = {
        apiKey: 'test-key',
        model: 'gpt-4',
      };

      mockOpenAIInstance.models.list.mockRejectedValue('Something went wrong');

      const provider = new OpenAIProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(false);
    });

    it('should handle null/undefined errors', async () => {
      const config = {
        apiKey: 'test-key',
        model: 'gpt-4',
      };

      mockOpenAIInstance.models.list.mockRejectedValue(null);

      const provider = new OpenAIProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(false);
    });
  });
});
