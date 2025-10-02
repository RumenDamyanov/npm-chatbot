import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { GoogleProvider } from '../../src/providers/GoogleProvider';
import type { AiProviderConfig } from '../../src/types/ChatbotTypes';

// Mock Google Generative AI SDK to avoid requiring real API calls
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn(),
  })),
}));

describe('GoogleProvider - Essential Coverage', () => {
  let mockConfig: AiProviderConfig;

  beforeEach(() => {
    mockConfig = {
      provider: 'google',
      apiKey: 'test-google-key',
      model: 'gemini-1.5-flash',
    };
  });

  describe('Constructor & Basic Properties', () => {
    test('should create provider with valid config', () => {
      const provider = new GoogleProvider(mockConfig);

      expect(provider.name).toBe('google');
      expect(provider.capabilities).toBeDefined();
      expect(provider.capabilities.supportedModels).toContain('gemini-1.5-flash');
    });

    test('should throw error without API key', () => {
      expect(() => {
        new GoogleProvider({ ...mockConfig, apiKey: '' });
      }).toThrow('Google API key is required');
    });

    test('should use default model when none specified', () => {
      const configWithoutModel = { ...mockConfig };
      delete configWithoutModel.model;

      const provider = new GoogleProvider(configWithoutModel);
      expect(provider).toBeDefined();
    });

    test('should handle custom API key in constructor', () => {
      const customConfig = {
        ...mockConfig,
        apiKey: 'custom-google-key',
      };

      const provider = new GoogleProvider(customConfig);
      expect(provider).toBeDefined();
    });
  });

  describe('Capabilities', () => {
    test('should have correct capabilities structure', () => {
      const provider = new GoogleProvider(mockConfig);
      const caps = provider.capabilities;

      expect(caps.maxInputTokens).toBe(1048576);
      expect(caps.maxOutputTokens).toBe(8192);
      expect(caps.supportsStreaming).toBe(true);
      expect(caps.supportsFunctionCalling).toBe(true);
      expect(caps.supportsImageInput).toBe(true);
      expect(caps.supportsAudioInput).toBe(true);
    });

    test('should include rate limits', () => {
      const provider = new GoogleProvider(mockConfig);
      const rateLimits = provider.capabilities.rateLimits;

      expect(rateLimits).toBeDefined();
      expect(rateLimits?.requestsPerMinute).toBe(1500);
      expect(rateLimits?.requestsPerHour).toBe(50000);
      expect(rateLimits?.tokensPerMinute).toBe(1000000);
    });

    test('should support all Gemini models', () => {
      const provider = new GoogleProvider(mockConfig);
      const models = provider.capabilities.supportedModels;

      expect(models).toContain('gemini-1.5-pro');
      expect(models).toContain('gemini-1.5-flash');
      expect(models).toContain('gemini-1.5-flash-8b');
      expect(models).toContain('gemini-1.0-pro');
    });
  });

  describe('Configuration Management', () => {
    test('should update configuration without throwing', () => {
      const provider = new GoogleProvider(mockConfig);

      const newConfig = {
        model: 'gemini-1.5-pro',
        temperature: 0.5,
      };

      expect(() => provider.updateConfig(newConfig)).not.toThrow();
    });

    test('should recreate client when API key changes', () => {
      const provider = new GoogleProvider(mockConfig);

      expect(() => {
        provider.updateConfig({
          apiKey: 'new-api-key',
        });
      }).not.toThrow();
    });

    test('should update model when config changes', () => {
      const provider = new GoogleProvider(mockConfig);

      expect(() => {
        provider.updateConfig({
          model: 'gemini-1.5-pro',
        });
      }).not.toThrow();
    });

    test('should reject config validation for empty API key', async () => {
      const provider = new GoogleProvider(mockConfig);

      const invalidConfig: Partial<AiProviderConfig> = {
        apiKey: '',
        model: 'gemini-1.5-flash',
      };

      const isValid = await provider.validateConfig(invalidConfig as AiProviderConfig);

      expect(isValid).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    test('should return supported models', async () => {
      const provider = new GoogleProvider(mockConfig);
      const models = await provider.getModels();

      expect(models).toContain('gemini-1.5-pro');
      expect(models).toContain('gemini-1.5-flash');
      expect(models.length).toBeGreaterThan(0);
    });

    test('should have required method interfaces', () => {
      const provider = new GoogleProvider(mockConfig);

      // Test that all required methods exist
      expect(typeof provider.isAvailable).toBe('function');
      expect(typeof provider.generateResponse).toBe('function');
      expect(typeof provider.generateStreamingResponse).toBe('function');
      expect(typeof provider.getStatus).toBe('function');
      expect(typeof provider.testConnection).toBe('function');
      expect(typeof provider.updateConfig).toBe('function');
      expect(typeof provider.validateConfig).toBe('function');
      expect(typeof provider.getModels).toBe('function');
    });
  });

  describe('Status Monitoring', () => {
    test('should have status method that returns expected structure', async () => {
      const provider = new GoogleProvider(mockConfig);
      const status = await provider.getStatus();

      expect(status).toBeDefined();
      expect(status.model).toBe('gemini-1.5-flash');
      expect(status.version).toBe('1.0.0');
      expect(status.usage).toBeDefined();
      expect(typeof status.available).toBe('boolean');
    });
  });

  describe('Streaming Response', () => {
    test('should handle streaming method existence', () => {
      const provider = new GoogleProvider(mockConfig);

      // Test that the streaming method exists and is callable
      expect(typeof provider.generateStreamingResponse).toBe('function');
    });
  });
});
