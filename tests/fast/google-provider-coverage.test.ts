/**
 * Additional Google Provider tests to improve function coverage
 * Focuses on validateConfig, getModels, testConnection methods
 */

import { GoogleProvider } from '../../src/providers/GoogleProvider';
import { GoogleGenerativeAI } from '@google/generative-ai';

jest.mock('@google/generative-ai');

describe('Google Provider - Coverage Tests', () => {
  let mockGoogleAI: any;
  let mockModel: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockModel = {
      generateContent: jest.fn(),
      generateContentStream: jest.fn(),
      getGenerativeModel: jest.fn(),
    };

    mockGoogleAI = {
      getGenerativeModel: jest.fn(() => mockModel),
    };

    (GoogleGenerativeAI as any).mockImplementation(() => mockGoogleAI);
  });

  describe('validateConfig', () => {
    it('should return false when API key is missing', async () => {
      const config = {
        apiKey: '',
        model: 'gemini-pro',
      };

      const provider = new GoogleProvider({ ...config, apiKey: 'temp-key' } as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(false);
    });

    it('should return true when API key is valid', async () => {
      const config = {
        apiKey: 'valid-api-key',
        model: 'gemini-pro',
      };

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => 'Test response',
        },
      });

      const provider = new GoogleProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(true);
    });

    it('should return false on authentication error', async () => {
      const config = {
        apiKey: 'invalid-key',
        model: 'gemini-pro',
      };

      mockModel.generateContent.mockRejectedValue(new Error('Invalid API key'));

      const provider = new GoogleProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(false);
    });

    it('should handle network errors during validation', async () => {
      const config = {
        apiKey: 'valid-key',
        model: 'gemini-pro',
      };

      mockModel.generateContent.mockRejectedValue(new Error('Network error'));

      const provider = new GoogleProvider(config as any);
      const result = await provider.validateConfig(config as any);

      expect(result).toBe(false);
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      const config = {
        apiKey: 'valid-key',
        model: 'gemini-pro',
      };

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => 'Test',
        },
      });

      const provider = new GoogleProvider(config as any);
      const result = await provider.testConnection();

      expect(result).toBe(true);
    });

    it('should return false on connection failure', async () => {
      const config = {
        apiKey: 'invalid-key',
        model: 'gemini-pro',
      };

      mockModel.generateContent.mockRejectedValue(new Error('Connection failed'));

      const provider = new GoogleProvider(config as any);
      const result = await provider.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle rate limit errors', async () => {
      const config = {
        apiKey: 'valid-key',
        model: 'gemini-pro',
      };

      mockModel.generateContent.mockRejectedValue(new Error('Rate limit exceeded'));

      const provider = new GoogleProvider(config as any);
      const context = { messages: [{ role: 'user' as const, content: 'Hello' }] };

      await expect(provider.generateResponse('Hello', context)).rejects.toThrow();
    });

    it('should handle invalid model errors', async () => {
      const config = {
        apiKey: 'valid-key',
        model: 'invalid-model',
      };

      mockModel.generateContent.mockRejectedValue(new Error('Model not found'));

      const provider = new GoogleProvider(config as any);
      const context = { messages: [{ role: 'user' as const, content: 'Hello' }] };

      await expect(provider.generateResponse('Hello', context)).rejects.toThrow();
    });

    it('should handle quota exceeded errors', async () => {
      const config = {
        apiKey: 'valid-key',
        model: 'gemini-pro',
      };

      mockModel.generateContent.mockRejectedValue(new Error('Quota exceeded'));

      const provider = new GoogleProvider(config as any);
      const context = { messages: [{ role: 'user' as const, content: 'Hello' }] };

      await expect(provider.generateResponse('Hello', context)).rejects.toThrow();
    });
  });
});
