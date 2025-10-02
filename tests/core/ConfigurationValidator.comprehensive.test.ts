import { ConfigurationValidator } from '../../src/core/ConfigurationValidator';
import type { AiProviderConfig, ChatbotConfig } from '../../src/types/ChatbotTypes';
import { ProviderFactory } from '../../src/providers/ProviderFactory';

// Mock ProviderFactory to control test behavior
jest.mock('../../src/providers/ProviderFactory');
const mockProviderFactory = ProviderFactory as jest.Mocked<typeof ProviderFactory>;

describe('ConfigurationValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockProviderFactory.isProviderAvailable.mockReturnValue(true);
    mockProviderFactory.getAvailableProviders.mockReturnValue([
      'openai',
      'anthropic', 
      'google',
      'meta',
      'xai',
      'deepseek',
      'ollama',
      'default',
    ]);
    
    // Mock provider creation
    const mockProvider = {
      capabilities: {
        supportedModels: ['gpt-4', 'gpt-3.5-turbo'],
        maxOutputTokens: 4096,
        supportsStreaming: true,
        supportsSystemMessages: true,
        supportsFunctionCalling: false,
      },
      isAvailable: jest.fn().mockResolvedValue(true),
      getStatus: jest.fn().mockResolvedValue({
        available: true,
        model: 'gpt-4',
        lastError: null,
        usage: { requests: 0, tokens: 0, resetAt: new Date() },
        version: '1.0.0',
      }),
    };
    
    mockProviderFactory.createProvider.mockReturnValue(mockProvider as any);
  });

  describe('validateChatbotConfig', () => {
    const validChatbotConfig: ChatbotConfig = {
      provider: {
        provider: 'openai',
        apiKey: 'sk-test-1234567890abcdef1234567890abcdef',
        model: 'gpt-4',
      },
      temperature: 0.7,
      maxTokens: 1000,
      maxHistory: 10,
      timeout: 30000,
    };

    it('should validate a complete valid configuration', async () => {
      const result = await ConfigurationValidator.validateChatbotConfig(validChatbotConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.capabilities).toBeDefined();
      expect(result.status).toBeDefined();
    });

    it('should detect invalid provider configuration', async () => {
      const invalidConfig: ChatbotConfig = {
        provider: {
          provider: 'openai',
          // Missing required API key
        },
      };
      
      const result = await ConfigurationValidator.validateChatbotConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('OpenAI API key is required');
    });

    it('should validate temperature range and warn on out-of-bounds values', async () => {
      const configs = [
        { ...validChatbotConfig, temperature: -0.1 },
        { ...validChatbotConfig, temperature: 2.1 },
        { ...validChatbotConfig, temperature: 3.0 },
      ];
      
      for (const config of configs) {
        const result = await ConfigurationValidator.validateChatbotConfig(config);
        expect(result.warnings).toContain('Temperature should be between 0 and 2');
      }
    });

    it('should accept valid temperature values', async () => {
      const validTemperatures = [0, 0.1, 0.7, 1.0, 1.5, 2.0];
      
      for (const temperature of validTemperatures) {
        const config = { ...validChatbotConfig, temperature };
        const result = await ConfigurationValidator.validateChatbotConfig(config);
        expect(result.warnings).not.toContain('Temperature should be between 0 and 2');
      }
    });

    it('should validate maxTokens positive values', async () => {
      const invalidConfigs = [
        { ...validChatbotConfig, maxTokens: 0 },
        { ...validChatbotConfig, maxTokens: -1 },
        { ...validChatbotConfig, maxTokens: -100 },
      ];
      
      for (const config of invalidConfigs) {
        const result = await ConfigurationValidator.validateChatbotConfig(config);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('maxTokens must be greater than 0');
      }
    });

    it('should warn when maxTokens exceeds provider limits', async () => {
      const config = { ...validChatbotConfig, maxTokens: 10000 }; // Exceeds mocked limit of 4096
      
      const result = await ConfigurationValidator.validateChatbotConfig(config);
      
      expect(result.warnings.some(w => w.includes('exceeds provider limit'))).toBe(true);
    });

    it('should validate maxHistory positive values', async () => {
      const invalidConfigs = [
        { ...validChatbotConfig, maxHistory: 0 },
        { ...validChatbotConfig, maxHistory: -1 },
        { ...validChatbotConfig, maxHistory: -5 },
      ];
      
      for (const config of invalidConfigs) {
        const result = await ConfigurationValidator.validateChatbotConfig(config);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('maxHistory must be greater than 0');
      }
    });

    it('should validate timeout positive values', async () => {
      const invalidConfigs = [
        { ...validChatbotConfig, timeout: 0 },
        { ...validChatbotConfig, timeout: -1 },
        { ...validChatbotConfig, timeout: -1000 },
      ];
      
      for (const config of invalidConfigs) {
        const result = await ConfigurationValidator.validateChatbotConfig(config);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('timeout must be greater than 0');
      }
    });

    it('should handle provider validation failures gracefully', async () => {
      mockProviderFactory.isProviderAvailable.mockReturnValue(false);
      
      const result = await ConfigurationValidator.validateChatbotConfig(validChatbotConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unsupported provider: openai');
    });

    it('should handle provider connection failures', async () => {
      const mockProvider = {
        capabilities: { supportedModels: ['gpt-4'] },
        isAvailable: jest.fn().mockResolvedValue(false),
        getStatus: jest.fn(),
      };
      mockProviderFactory.createProvider.mockReturnValue(mockProvider as any);
      
      const result = await ConfigurationValidator.validateChatbotConfig(validChatbotConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Provider is not available (connection test failed)');
    });

    it('should handle provider creation errors', async () => {
      mockProviderFactory.createProvider.mockImplementation(() => {
        throw new Error('Provider initialization failed');
      });
      
      const result = await ConfigurationValidator.validateChatbotConfig(validChatbotConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Provider initialization failed'))).toBe(true);
    });

    it('should handle provider availability check errors', async () => {
      const mockProvider = {
        capabilities: { supportedModels: ['gpt-4'] },
        isAvailable: jest.fn().mockRejectedValue(new Error('Network error')),
        getStatus: jest.fn(),
      };
      mockProviderFactory.createProvider.mockReturnValue(mockProvider as any);
      
      const result = await ConfigurationValidator.validateChatbotConfig(validChatbotConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Provider connection test failed'))).toBe(true);
    });
  });

  describe('validateProviderConfig', () => {
    it('should validate OpenAI configuration with all required fields', async () => {
      const config: AiProviderConfig = {
        provider: 'openai',
        apiKey: 'sk-test-1234567890abcdef1234567890abcdef',
        organizationId: 'org-123456',
        model: 'gpt-4',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.capabilities).toBeDefined();
      expect(result.status).toBeDefined();
    });

    it('should reject OpenAI configuration without API key', async () => {
      const config: AiProviderConfig = {
        provider: 'openai',
        model: 'gpt-4',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('OpenAI API key is required');
    });

    it('should validate OpenAI organization ID type', async () => {
      const config: AiProviderConfig = {
        provider: 'openai',
        apiKey: 'sk-test-key',
        organizationId: 123 as any, // Invalid type
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('OpenAI organization ID must be a string');
    });

    it('should validate Anthropic configuration', async () => {
      const config: AiProviderConfig = {
        provider: 'anthropic',
        apiKey: 'sk-ant-test-key',
        model: 'claude-sonnet-4-5-20250929',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject Anthropic configuration without API key', async () => {
      const config: AiProviderConfig = {
        provider: 'anthropic',
        model: 'claude-sonnet-4-5-20250929',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Anthropic API key is required');
    });

    it('should validate Google configuration', async () => {
      const config: AiProviderConfig = {
        provider: 'google',
        apiKey: 'google-api-key',
        model: 'gemini-1.5-flash',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject Google configuration without API key', async () => {
      const config: AiProviderConfig = {
        provider: 'google',
        model: 'gemini-1.5-flash',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Google API key is required');
    });

    it('should validate Meta configuration', async () => {
      const config: AiProviderConfig = {
        provider: 'meta',
        apiKey: 'meta-api-key',
        model: 'llama-2-70b',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject Meta configuration without API key', async () => {
      const config: AiProviderConfig = {
        provider: 'meta',
        model: 'llama-2-70b',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Meta API key is required');
    });

    it('should validate xAI configuration', async () => {
      const config: AiProviderConfig = {
        provider: 'xai',
        apiKey: 'xai-api-key',
        model: 'grok-1',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject xAI configuration without API key', async () => {
      const config: AiProviderConfig = {
        provider: 'xai',
        model: 'grok-1',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('xAI API key is required');
    });

    it('should validate DeepSeek configuration', async () => {
      const config: AiProviderConfig = {
        provider: 'deepseek',
        apiKey: 'deepseek-api-key',
        model: 'deepseek-chat',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject DeepSeek configuration without API key', async () => {
      const config: AiProviderConfig = {
        provider: 'deepseek',
        model: 'deepseek-chat',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('DeepSeek API key is required');
    });

    it('should validate Ollama configuration', async () => {
      const config: AiProviderConfig = {
        provider: 'ollama',
        apiUrl: 'http://localhost:11434',
        model: 'llama2',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject Ollama configuration without API URL', async () => {
      const config: AiProviderConfig = {
        provider: 'ollama',
        model: 'llama2',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Ollama API URL is required');
    });

    it('should reject Ollama configuration without model', async () => {
      const config: AiProviderConfig = {
        provider: 'ollama',
        apiUrl: 'http://localhost:11434',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Ollama model name is required');
    });

    it('should validate API URL format', async () => {
      const validConfig: AiProviderConfig = {
        provider: 'ollama',
        apiUrl: 'https://api.example.com/v1',
        model: 'test-model',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(validConfig);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid API URL format', async () => {
      const invalidConfig: AiProviderConfig = {
        provider: 'ollama',
        apiUrl: 'not-a-valid-url',
        model: 'test-model',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid API URL format');
    });

    it('should reject unsupported provider', async () => {
      mockProviderFactory.isProviderAvailable.mockReturnValue(false);
      
      const config: AiProviderConfig = {
        provider: 'unsupported' as any,
        apiKey: 'test-key',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unsupported provider: unsupported');
    });

    it('should warn about unsupported models', async () => {
      const config: AiProviderConfig = {
        provider: 'openai',
        apiKey: 'sk-test-key',
        model: 'unsupported-model',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(config);
      
      expect(result.warnings.some(w => w.includes('may not be supported'))).toBe(true);
    });

    it('should handle provider without supported models list', async () => {
      const mockProvider = {
        capabilities: { supportedModels: null },
        isAvailable: jest.fn().mockResolvedValue(true),
        getStatus: jest.fn().mockResolvedValue({ available: true }),
      };
      mockProviderFactory.createProvider.mockReturnValue(mockProvider as any);
      
      const config: AiProviderConfig = {
        provider: 'openai',
        apiKey: 'sk-test-key',
        model: 'any-model',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).not.toContain(expect.stringContaining('may not be supported'));
    });

    it('should handle default provider without validation requirements', async () => {
      const config: AiProviderConfig = {
        provider: 'default',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateQuick', () => {
    it('should perform quick validation without provider instantiation', () => {
      const config: AiProviderConfig = {
        provider: 'openai',
        apiKey: 'sk-test-key',
      };
      
      const result = ConfigurationValidator.validateQuick(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.capabilities).toBeUndefined(); // Should not have capabilities in quick validation
      expect(result.status).toBeUndefined(); // Should not have status in quick validation
    });

    it('should detect missing required fields in quick validation', () => {
      const config: AiProviderConfig = {
        provider: 'openai',
        // Missing API key
      };
      
      const result = ConfigurationValidator.validateQuick(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('OpenAI API key is required');
    });

    it('should reject unsupported provider in quick validation', () => {
      mockProviderFactory.isProviderAvailable.mockReturnValue(false);
      
      const config: AiProviderConfig = {
        provider: 'unsupported' as any,
        apiKey: 'test-key',
      };
      
      const result = ConfigurationValidator.validateQuick(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unsupported provider: unsupported');
    });

    it('should validate all provider types in quick mode', () => {
      const providerConfigs: AiProviderConfig[] = [
        { provider: 'openai', apiKey: 'sk-test' },
        { provider: 'anthropic', apiKey: 'sk-ant-test' },
        { provider: 'google', apiKey: 'google-key' },
        { provider: 'meta', apiKey: 'meta-key' },
        { provider: 'xai', apiKey: 'xai-key' },
        { provider: 'deepseek', apiKey: 'deepseek-key' },
        { provider: 'ollama', apiUrl: 'http://localhost:11434', model: 'llama2' },
        { provider: 'default' },
      ];
      
      for (const config of providerConfigs) {
        const result = ConfigurationValidator.validateQuick(config);
        expect(result.isValid).toBe(true);
      }
    });
  });

  describe('getSupportedProviders', () => {
    it('should return list of supported providers', () => {
      const providers = ConfigurationValidator.getSupportedProviders();
      
      expect(providers).toEqual([
        'openai', 'anthropic', 'google', 'meta', 'xai', 'deepseek', 'ollama', 'default'
      ]);
      expect(mockProviderFactory.getAvailableProviders).toHaveBeenCalled();
    });

    it('should handle empty provider list', () => {
      mockProviderFactory.getAvailableProviders.mockReturnValue([]);
      
      const providers = ConfigurationValidator.getSupportedProviders();
      
      expect(providers).toEqual([]);
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default config for OpenAI', () => {
      const config = ConfigurationValidator.getDefaultConfig('openai');
      
      expect(config).toEqual({
        provider: 'openai',
        model: 'gpt-4',
      });
    });

    it('should return default config for Anthropic', () => {
      const config = ConfigurationValidator.getDefaultConfig('anthropic');
      
      expect(config).toEqual({
        provider: 'anthropic',
        model: 'claude-sonnet-4-5-20250929',
      });
    });

    it('should return default config for Google', () => {
      const config = ConfigurationValidator.getDefaultConfig('google');
      
      expect(config).toEqual({
        provider: 'google',
        model: 'gemini-1.5-flash',
      });
    });

    it('should return default config for Meta', () => {
      const config = ConfigurationValidator.getDefaultConfig('meta');
      
      expect(config).toEqual({
        provider: 'meta',
        model: 'llama-2-70b',
      });
    });

    it('should return default config for xAI', () => {
      const config = ConfigurationValidator.getDefaultConfig('xai');
      
      expect(config).toEqual({
        provider: 'xai',
        model: 'grok-1',
      });
    });

    it('should return default config for DeepSeek', () => {
      const config = ConfigurationValidator.getDefaultConfig('deepseek');
      
      expect(config).toEqual({
        provider: 'deepseek',
        model: 'deepseek-chat',
      });
    });

    it('should return default config for Ollama', () => {
      const config = ConfigurationValidator.getDefaultConfig('ollama');
      
      expect(config).toEqual({
        provider: 'ollama',
        apiUrl: 'http://localhost:11434',
        model: 'llama2',
      });
    });

    it('should return base config for default provider', () => {
      const config = ConfigurationValidator.getDefaultConfig('default');
      
      expect(config).toEqual({
        provider: 'default',
      });
    });

    it('should return base config for unknown provider', () => {
      const config = ConfigurationValidator.getDefaultConfig('unknown' as any);
      
      expect(config).toEqual({
        provider: 'unknown',
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle provider creation throwing non-Error objects', async () => {
      mockProviderFactory.createProvider.mockImplementation(() => {
        throw 'String error'; // Non-Error object
      });
      
      const config: AiProviderConfig = {
        provider: 'openai',
        apiKey: 'sk-test-key',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Unknown error'))).toBe(true);
    });

    it('should handle provider isAvailable throwing non-Error objects', async () => {
      const mockProvider = {
        capabilities: { supportedModels: ['gpt-4'] },
        isAvailable: jest.fn().mockRejectedValue('Network failure'),
        getStatus: jest.fn(),
      };
      mockProviderFactory.createProvider.mockReturnValue(mockProvider as any);
      
      const config: AiProviderConfig = {
        provider: 'openai',
        apiKey: 'sk-test-key',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Unknown error'))).toBe(true);
    });

    it('should handle undefined config values gracefully', async () => {
      const config: ChatbotConfig = {
        provider: {
          provider: 'openai',
          apiKey: 'sk-test-key',
        },
        temperature: undefined,
        maxTokens: undefined,
        maxHistory: undefined,
        timeout: undefined,
      };
      
      const result = await ConfigurationValidator.validateChatbotConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle complex validation scenarios', async () => {
      const mockProvider = {
        capabilities: {
          supportedModels: ['gpt-4'],
          maxOutputTokens: 2048,
        },
        isAvailable: jest.fn().mockResolvedValue(true),
        getStatus: jest.fn().mockResolvedValue({ available: true }),
      };
      mockProviderFactory.createProvider.mockReturnValue(mockProvider as any);
      
      const config: ChatbotConfig = {
        provider: {
          provider: 'openai',
          apiKey: 'sk-test-key',
          model: 'unsupported-model',
        },
        temperature: 2.5, // Out of range
        maxTokens: 5000, // Exceeds provider limit
        maxHistory: -1, // Invalid
      };
      
      const result = await ConfigurationValidator.validateChatbotConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('maxHistory must be greater than 0');
      expect(result.warnings).toContain('Temperature should be between 0 and 2');
      expect(result.warnings.some(w => w.includes('exceeds provider limit'))).toBe(true);
      expect(result.warnings.some(w => w.includes('may not be supported'))).toBe(true);
    });
  });
});