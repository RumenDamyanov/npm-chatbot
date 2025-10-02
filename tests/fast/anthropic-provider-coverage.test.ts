/**
 * Additional Anthropic Provider tests to improve function coverage
 * Focuses on validateConfig, getModels, testConnection methods
 */

import { AnthropicProvider } from '../../src/providers/AnthropicProvider';
import Anthropic from '@anthropic-ai/sdk';

jest.mock('@anthropic-ai/sdk');

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('Anthropic Provider - Coverage Tests', () => {
  let mockAnthropicInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAnthropicInstance = {
      messages: {
        create: jest.fn(),
        stream: jest.fn(),
      },
      models: {
        list: jest.fn(),
      },
    };

    (Anthropic as any).mockImplementation(() => mockAnthropicInstance);
  });

  describe('validateConfig', () => {
    it('should return false when API key is missing', async () => {
      const config = {
        apiKey: '',
        model: 'claude-3-opus-20240229',
      };

      const provider = new AnthropicProvider({ ...config, apiKey: 'temp-key' } as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(false);
    });

    it('should return true when API key is valid', async () => {
      const config = {
        apiKey: 'valid-api-key',
        model: 'claude-3-opus-20240229',
      };

      mockAnthropicInstance.messages.create.mockResolvedValue({
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Hello!' }],
        model: 'claude-3-opus-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      const provider = new AnthropicProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(true);
    });

    it('should return false on authentication error', async () => {
      const config = {
        apiKey: 'invalid-key',
        model: 'claude-3-opus-20240229',
      };

      mockAnthropicInstance.messages.create.mockRejectedValue(
        new Error('Invalid API key')
      );

      const provider = new AnthropicProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(false);
    });

    it('should handle network errors during validation', async () => {
      const config = {
        apiKey: 'valid-key',
        model: 'claude-3-opus-20240229',
      };

      mockAnthropicInstance.messages.create.mockRejectedValue(
        new Error('Network error')
      );

      const provider = new AnthropicProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(false);
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      const config = {
        apiKey: 'valid-key',
        model: 'claude-3-opus-20240229',
      };

      mockAnthropicInstance.messages.create.mockResolvedValue({
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Test' }],
      });

      const provider = new AnthropicProvider(config as any);
      const result = await provider.testConnection();

      expect(result).toBe(true);
    });

    it('should return false on connection failure', async () => {
      const config = {
        apiKey: 'invalid-key',
        model: 'claude-3-opus-20240229',
      };

      mockAnthropicInstance.messages.create.mockRejectedValue(
        new Error('Connection failed')
      );

      const provider = new AnthropicProvider(config as any);
      const result = await provider.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle rate limit errors', async () => {
      const config = {
        apiKey: 'valid-key',
        model: 'claude-3-opus-20240229',
      };

      mockAnthropicInstance.messages.create.mockRejectedValue(
        new Error('Rate limit exceeded')
      );

      const provider = new AnthropicProvider(config as any);
      const context = { messages: [{ role: 'user' as const, content: 'Hello' }] };

      await expect(provider.generateResponse('Hello', context)).rejects.toThrow();
    });

    it('should handle invalid model errors', async () => {
      const config = {
        apiKey: 'valid-key',
        model: 'invalid-model',
      };

      mockAnthropicInstance.messages.create.mockRejectedValue(
        new Error('Model not found')
      );

      const provider = new AnthropicProvider(config as any);
      const context = { messages: [{ role: 'user' as const, content: 'Hello' }] };

      await expect(provider.generateResponse('Hello', context)).rejects.toThrow();
    });

    it('should handle quota exceeded errors', async () => {
      const config = {
        apiKey: 'valid-key',
        model: 'claude-3-opus-20240229',
      };

      mockAnthropicInstance.messages.create.mockRejectedValue(
        new Error('Quota exceeded')
      );

      const provider = new AnthropicProvider(config as any);
      const context = { messages: [{ role: 'user' as const, content: 'Hello' }] };

      await expect(provider.generateResponse('Hello', context)).rejects.toThrow();
    });
  });
});
