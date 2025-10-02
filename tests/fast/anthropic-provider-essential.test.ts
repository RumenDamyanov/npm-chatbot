import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { AnthropicProvider } from '../../src/providers/AnthropicProvider';
import type { AiProviderConfig } from '../../src/types/ChatbotTypes';

// Mock Anthropic SDK to avoid requiring real API calls
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(),
    },
  })),
}));

describe('AnthropicProvider - Essential Coverage', () => {
  let mockConfig: AiProviderConfig;

  beforeEach(() => {
    mockConfig = {
      provider: 'anthropic',
      apiKey: 'test-anthropic-key',
      model: 'claude-sonnet-4-5-20250929',
      apiUrl: 'https://api.anthropic.com',
    };
  });

  describe('Constructor & Basic Properties', () => {
    test('should create provider with valid config', () => {
      const provider = new AnthropicProvider(mockConfig);
      
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
      
      const provider = new AnthropicProvider(configWithoutModel);
      expect(provider).toBeDefined();
    });

    test('should handle custom API URL in constructor', () => {
      const customConfig = {
        ...mockConfig,
        apiUrl: 'https://custom-anthropic-api.com',
      };
      
      const provider = new AnthropicProvider(customConfig);
      expect(provider).toBeDefined();
    });
  });

  describe('Capabilities', () => {
    test('should have correct capabilities structure', () => {
      const provider = new AnthropicProvider(mockConfig);
      const caps = provider.capabilities;
      
      expect(caps.maxInputTokens).toBe(200000);
      expect(caps.maxOutputTokens).toBe(8192);
      expect(caps.supportsStreaming).toBe(true);
      expect(caps.supportsFunctionCalling).toBe(true);
      expect(caps.supportsImageInput).toBe(true);
      expect(caps.supportsAudioInput).toBe(false);
    });

    test('should include rate limits', () => {
      const provider = new AnthropicProvider(mockConfig);
      const rateLimits = provider.capabilities.rateLimits;
      
      expect(rateLimits).toBeDefined();
      expect(rateLimits?.requestsPerMinute).toBe(1000);
      expect(rateLimits?.requestsPerHour).toBe(5000);
      expect(rateLimits?.tokensPerMinute).toBe(40000);
    });

    test('should support all Claude models', () => {
      const provider = new AnthropicProvider(mockConfig);
      const models = provider.capabilities.supportedModels;
      
      expect(models).toContain('claude-sonnet-4-5-20250929');
      expect(models).toContain('claude-3-5-haiku-20241022');
      expect(models).toContain('claude-3-opus-20240229');
      expect(models).toContain('claude-3-sonnet-20240229');
      expect(models).toContain('claude-3-haiku-20240307');
    });
  });

  describe('Configuration Management', () => {
    test('should update configuration without throwing', () => {
      const provider = new AnthropicProvider(mockConfig);
      
      const newConfig = {
        model: 'claude-3-haiku-20240307',
        temperature: 0.5,
      };

      expect(() => provider.updateConfig(newConfig)).not.toThrow();
    });

    test('should recreate client when API config changes', () => {
      const provider = new AnthropicProvider(mockConfig);
      
      expect(() => {
        provider.updateConfig({
          apiKey: 'new-api-key',
        });
      }).not.toThrow();
    });

    test('should recreate client when API URL changes', () => {
      const provider = new AnthropicProvider(mockConfig);
      
      expect(() => {
        provider.updateConfig({
          apiUrl: 'https://new-api-url.com',
        });
      }).not.toThrow();
    });

    test('should reject config validation for empty API key', async () => {
      const provider = new AnthropicProvider(mockConfig);
      
      const invalidConfig: Partial<AiProviderConfig> = {
        apiKey: '',
        model: 'claude-sonnet-4-5-20250929',
      };

      const isValid = await provider.validateConfig(invalidConfig as AiProviderConfig);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    test('should return supported models', async () => {
      const provider = new AnthropicProvider(mockConfig);
      const models = await provider.getModels();
      
      expect(models).toContain('claude-sonnet-4-5-20250929');
      expect(models).toContain('claude-3-opus-20240229');
      expect(models.length).toBeGreaterThan(0);
    });

    test('should have required method interfaces', () => {
      const provider = new AnthropicProvider(mockConfig);
      
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
      const provider = new AnthropicProvider(mockConfig);
      const status = await provider.getStatus();
      
      expect(status).toBeDefined();
      expect(status.model).toBe('claude-sonnet-4-5-20250929');
      expect(status.version).toBe('1.0.0');
      expect(status.usage).toBeDefined();
      expect(typeof status.available).toBe('boolean');
    });
  });
});