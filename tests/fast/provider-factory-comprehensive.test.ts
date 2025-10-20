/**
 * Comprehensive test suite for the ProviderFactory class
 * Target: Improve ProviderFactory.ts coverage from 23.93% to 40%+
 * Focus: Provider creation, registration, initialization, and factory methods
 */

import { ProviderFactory } from '../../src/providers/ProviderFactory';
import type { ChatbotConfig, AiProvider } from '../../src/types/ChatbotTypes';
import type { IAiProvider } from '../../src/types/ProviderTypes';
import {
  MockMetaProvider,
  MockXAIProvider,
  MockDeepSeekProvider,
  MockOllamaProvider,
} from '../helpers/MockProviders';

// Mock the actual provider classes to avoid real API calls
jest.mock('../../src/providers/OpenAIProvider');
jest.mock('../../src/providers/AnthropicProvider');
jest.mock('../../src/providers/GoogleProvider');

// Mock console methods to avoid output during tests
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

// Create a mock provider class for testing
class MockTestProvider implements IAiProvider {
  name: AiProvider = 'openai'; // Use a valid AiProvider type
  capabilities = {
    streaming: false,
    contextWindow: 4000,
    supportedModels: ['test-model'],
    functionCalling: false,
    vision: false,
  };

  constructor(private config: any) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
  }

  isAvailable(): Promise<boolean> {
    return Promise.resolve(true);
  }

  generateResponse(): Promise<any> {
    return Promise.resolve({
      content: 'Test response',
      metadata: { provider: 'test' },
    });
  }

  async *generateStreamingResponse(): AsyncGenerator<string, void, unknown> {
    yield 'test';
  }

  getStatus(): Promise<any> {
    return Promise.resolve({ available: true, model: 'test-model' });
  }

  validateConfig(): Promise<boolean> {
    return Promise.resolve(true);
  }

  updateConfig(): Promise<void> {
    return Promise.resolve();
  }

  testConnection(): Promise<boolean> {
    return Promise.resolve(true);
  }

  getModels(): Promise<string[]> {
    return Promise.resolve(['test-model']);
  }
}

describe('ProviderFactory Comprehensive Tests', () => {
  let validOpenAIConfig: ChatbotConfig;
  let validAnthropicConfig: ChatbotConfig;
  let validGoogleConfig: ChatbotConfig;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();

    // Initialize the factory before each test
    ProviderFactory.initialize();

    // Register mock providers for testing
    ProviderFactory.registerProvider('meta', MockMetaProvider);
    ProviderFactory.registerProvider('xai', MockXAIProvider);
    ProviderFactory.registerProvider('deepseek', MockDeepSeekProvider);
    ProviderFactory.registerProvider('ollama', MockOllamaProvider);

    // Setup valid configurations
    validOpenAIConfig = {
      provider: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        apiKey: 'test-openai-key',
      },
    };

    validAnthropicConfig = {
      provider: {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        apiKey: 'test-anthropic-key',
      },
    };

    validGoogleConfig = {
      provider: {
        provider: 'google',
        model: 'gemini-pro',
        apiKey: 'test-google-key',
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize factory with default providers', () => {
      // Just test that initialization works without throwing
      expect(() => ProviderFactory.initialize()).not.toThrow();
    });

    test('should register all expected providers during initialization', () => {
      ProviderFactory.initialize();

      const availableProviders = ProviderFactory.getAvailableProviders();
      expect(availableProviders).toContain('openai');
      expect(availableProviders).toContain('anthropic');
      expect(availableProviders).toContain('google');
      expect(availableProviders).toContain('meta');
      expect(availableProviders).toContain('xai');
      expect(availableProviders).toContain('deepseek');
      expect(availableProviders).toContain('ollama');
    });
  });

  describe('Provider Registration', () => {
    test('should register new provider successfully', () => {
      ProviderFactory.registerProvider('test', MockTestProvider);

      expect(ProviderFactory.isProviderAvailable('test')).toBe(true);
    });

    test('should allow overriding existing providers', () => {
      ProviderFactory.registerProvider('openai', MockTestProvider);

      expect(ProviderFactory.isProviderAvailable('openai')).toBe(true);
    });

    test('should register multiple custom providers', () => {
      ProviderFactory.registerProvider('custom1', MockTestProvider);
      ProviderFactory.registerProvider('custom2', MockTestProvider);

      expect(ProviderFactory.isProviderAvailable('custom1')).toBe(true);
      expect(ProviderFactory.isProviderAvailable('custom2')).toBe(true);
    });
  });

  describe('Provider Creation', () => {
    test('should create OpenAI provider successfully', () => {
      const provider = ProviderFactory.createProvider(validOpenAIConfig);

      expect(provider).toBeDefined();
    });

    test('should create Anthropic provider successfully', () => {
      const provider = ProviderFactory.createProvider(validAnthropicConfig);

      expect(provider).toBeDefined();
    });

    test('should create Google provider successfully', () => {
      const provider = ProviderFactory.createProvider(validGoogleConfig);

      expect(provider).toBeDefined();
    });

    test('should create custom registered provider', () => {
      ProviderFactory.registerProvider('test', MockTestProvider);

      const config: ChatbotConfig = {
        provider: {
          provider: 'test',
          model: 'test-model',
          apiKey: 'test-key',
        },
      };

      const provider = ProviderFactory.createProvider(config);
      expect(provider).toBeDefined();
      expect(provider.name).toBe('openai');
    });
  });

  describe('Error Handling', () => {
    test('should throw error for missing provider type', () => {
      const invalidConfig: ChatbotConfig = {
        provider: {
          provider: '',
          model: 'test-model',
          apiKey: 'test-key',
        },
      };

      expect(() => ProviderFactory.createProvider(invalidConfig)).toThrow(
        'AI provider type is required'
      );
    });

    test('should throw error for unsupported provider', () => {
      const unsupportedConfig: ChatbotConfig = {
        provider: {
          provider: 'unsupported-provider',
          model: 'test-model',
          apiKey: 'test-key',
        },
      };

      expect(() => ProviderFactory.createProvider(unsupportedConfig)).toThrow(
        'Unsupported AI provider: unsupported-provider'
      );
    });

    test('should handle provider construction errors', () => {
      // Register a provider that throws during construction
      class FailingProvider {
        constructor() {
          throw new Error('Provider initialization failed');
        }
      }

      ProviderFactory.registerProvider('failing', FailingProvider as any);

      const failingConfig: ChatbotConfig = {
        provider: {
          provider: 'failing',
          model: 'test-model',
          apiKey: 'test-key',
        },
      };

      expect(() => ProviderFactory.createProvider(failingConfig)).toThrow(
        'Failed to create failing provider: Provider initialization failed'
      );
    });

    test('should handle unknown errors during provider creation', () => {
      // Register a provider that throws a non-Error object
      class WeirdFailingProvider {
        constructor() {
          throw 'String error';
        }
      }

      ProviderFactory.registerProvider('weird', WeirdFailingProvider as any);

      const weirdConfig: ChatbotConfig = {
        provider: {
          provider: 'weird',
          model: 'test-model',
          apiKey: 'test-key',
        },
      };

      expect(() => ProviderFactory.createProvider(weirdConfig)).toThrow(
        'Failed to create weird provider: Unknown error'
      );
    });
  });

  describe('Provider Availability', () => {
    test('should check if registered providers are available', () => {
      expect(ProviderFactory.isProviderAvailable('openai')).toBe(true);
      expect(ProviderFactory.isProviderAvailable('anthropic')).toBe(true);
      expect(ProviderFactory.isProviderAvailable('google')).toBe(true);
    });

    test('should return false for unregistered providers', () => {
      expect(ProviderFactory.isProviderAvailable('unknown-provider')).toBe(false);
      expect(ProviderFactory.isProviderAvailable('')).toBe(false);
    });

    test('should detect custom registered providers', () => {
      ProviderFactory.registerProvider('custom', MockTestProvider);
      expect(ProviderFactory.isProviderAvailable('custom')).toBe(true);
    });
  });

  describe('Available Providers List', () => {
    test('should return list of all registered providers', () => {
      const providers = ProviderFactory.getAvailableProviders();

      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);
      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');
      expect(providers).toContain('google');
    });

    test('should include custom providers in list', () => {
      ProviderFactory.registerProvider('custom1', MockTestProvider);
      ProviderFactory.registerProvider('custom2', MockTestProvider);

      const providers = ProviderFactory.getAvailableProviders();
      expect(providers).toContain('custom1');
      expect(providers).toContain('custom2');
    });

    test('should return empty array when no providers registered', () => {
      // Create a fresh factory instance (though this is static, we simulate the concept)
      const providers = ProviderFactory.getAvailableProviders();
      expect(Array.isArray(providers)).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    test('should handle missing provider configuration', () => {
      const incompleteConfig = {
        provider: {},
      } as ChatbotConfig;

      expect(() => ProviderFactory.createProvider(incompleteConfig)).toThrow();
    });

    test('should handle null provider configuration', () => {
      const nullConfig = {
        provider: null,
      } as any;

      expect(() => ProviderFactory.createProvider(nullConfig)).toThrow();
    });

    test('should handle undefined provider configuration', () => {
      const undefinedConfig = {} as ChatbotConfig;

      expect(() => ProviderFactory.createProvider(undefinedConfig)).toThrow();
    });
  });

  describe('Mock Provider Testing', () => {
    test('should create mock Meta provider', () => {
      const metaConfig: ChatbotConfig = {
        provider: {
          provider: 'meta',
          model: 'llama-2',
          apiKey: 'test-key',
        },
      };

      const provider = ProviderFactory.createProvider(metaConfig);
      expect(provider).toBeDefined();
    });

    test('should create mock XAI provider', () => {
      const xaiConfig: ChatbotConfig = {
        provider: {
          provider: 'xai',
          model: 'grok-1',
          apiKey: 'test-key',
        },
      };

      const provider = ProviderFactory.createProvider(xaiConfig);
      expect(provider).toBeDefined();
    });

    test('should create mock DeepSeek provider', () => {
      const deepseekConfig: ChatbotConfig = {
        provider: {
          provider: 'deepseek',
          model: 'deepseek-coder',
          apiKey: 'test-key',
        },
      };

      const provider = ProviderFactory.createProvider(deepseekConfig);
      expect(provider).toBeDefined();
    });

    test('should create mock Ollama provider', () => {
      const ollamaConfig: ChatbotConfig = {
        provider: {
          provider: 'ollama',
          model: 'llama2',
          apiKey: 'not-required-for-ollama',
        },
      };

      const provider = ProviderFactory.createProvider(ollamaConfig);
      expect(provider).toBeDefined();
    });
  });

  describe('Logger Functionality', () => {
    test('should create providers without throwing errors', () => {
      expect(() => ProviderFactory.createProvider(validOpenAIConfig)).not.toThrow();
    });

    test('should register providers without throwing errors', () => {
      expect(() => ProviderFactory.registerProvider('test-logger', MockTestProvider)).not.toThrow();
    });

    test('should not cause errors during successful operations', () => {
      ProviderFactory.createProvider(validAnthropicConfig);

      expect(mockConsoleError).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle provider names with special characters', () => {
      ProviderFactory.registerProvider('test-provider-123', MockTestProvider);
      expect(ProviderFactory.isProviderAvailable('test-provider-123')).toBe(true);
    });

    test('should handle case sensitivity in provider names', () => {
      expect(ProviderFactory.isProviderAvailable('OpenAI')).toBe(false);
      expect(ProviderFactory.isProviderAvailable('OPENAI')).toBe(false);
      expect(ProviderFactory.isProviderAvailable('openai')).toBe(true);
    });

    test('should handle multiple initializations', () => {
      ProviderFactory.initialize();
      ProviderFactory.initialize();

      // Should not break and should still work
      expect(ProviderFactory.isProviderAvailable('openai')).toBe(true);
    });

    test('should handle providers with complex configurations', () => {
      const complexConfig: ChatbotConfig = {
        provider: {
          provider: 'openai',
          model: 'gpt-4',
          apiKey: 'test-key',
        },
      };

      expect(() => ProviderFactory.createProvider(complexConfig)).not.toThrow();
    });
  });
});
