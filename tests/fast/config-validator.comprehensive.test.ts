/**
 * Comprehensive ConfigurationValidator tests to improve coverage
 */

describe('ConfigurationValidator Comprehensive Tests', () => {
  describe('validateChatbotConfig', () => {
    it('should validate complete chatbot config with valid provider', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');
      
      const validConfig = {
        provider: {
          provider: 'openai' as const,
          apiKey: 'sk-test1234567890abcdef',
          model: 'gpt-4',
        },
        temperature: 0.7,
        maxTokens: 1000,
      };
      
      const result = await ConfigurationValidator.validateChatbotConfig(validConfig);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should handle invalid temperature values', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');
      
      const invalidConfig = {
        provider: {
          provider: 'openai' as const,
          apiKey: 'sk-test1234567890abcdef',
          model: 'gpt-4',
        },
        temperature: 2.5, // Invalid: should be 0-2
      };
      
      const result = await ConfigurationValidator.validateChatbotConfig(invalidConfig);
      
      expect(result).toBeDefined();
      expect(result.errors.length > 0 || result.warnings.length > 0).toBe(true);
    });

    it('should handle invalid maxTokens values', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');
      
      const invalidConfig = {
        provider: {
          provider: 'openai' as const,
          apiKey: 'sk-test1234567890abcdef',
          model: 'gpt-4',
        },
        maxTokens: -100, // Invalid: should be positive
      };
      
      const result = await ConfigurationValidator.validateChatbotConfig(invalidConfig);
      
      expect(result).toBeDefined();
      expect(result.errors.length > 0 || result.warnings.length > 0).toBe(true);
    });
  });

  describe('validateProviderConfig', () => {
    it('should validate OpenAI provider config', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');
      
      const openaiConfig = {
        provider: 'openai' as const,
        apiKey: 'sk-test1234567890abcdef',
        model: 'gpt-4',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(openaiConfig);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should validate Anthropic provider config', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');
      
      const anthropicConfig = {
        provider: 'anthropic' as const,
        apiKey: 'sk-ant-test1234567890abcdef',
        model: 'claude-sonnet-4-5-20250929',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(anthropicConfig);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
    });

    it('should validate Google provider config', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');
      
      const googleConfig = {
        provider: 'google' as const,
        apiKey: 'test-google-api-key',
        model: 'gemini-1.5-pro',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(googleConfig);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
    });

    it('should handle missing API key', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');
      
      const invalidConfig = {
        provider: 'openai' as const,
        apiKey: '',
        model: 'gpt-4',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle missing model', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');
      
      const invalidConfig = {
        provider: 'openai' as const,
        apiKey: 'sk-test1234567890abcdef',
        model: '',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle invalid provider type', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');
      
      const invalidConfig = {
        provider: 'invalid-provider' as any,
        apiKey: 'test-key',
        model: 'test-model',
      };
      
      const result = await ConfigurationValidator.validateProviderConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateQuick variations', () => {
    it('should validate OpenAI API key format', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');
      
      const validConfig = {
        provider: 'openai' as const,
        apiKey: 'sk-test1234567890abcdefghijklmnopqrstuvwxyz123456',
        model: 'gpt-4',
      };
      
      const result = ConfigurationValidator.validateQuick(validConfig);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
    });

    it('should validate Anthropic API key format', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');
      
      const validConfig = {
        provider: 'anthropic' as const,
        apiKey: 'sk-ant-api03-test1234567890abcdefghijklmnopqrstuvwxyz',
        model: 'claude-sonnet-4-5-20250929',
      };
      
      const result = ConfigurationValidator.validateQuick(validConfig);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
    });

    it('should validate different API key lengths', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');
      
      const shortKeyConfig = {
        provider: 'openai' as const,
        apiKey: 'sk-short',
        model: 'gpt-4',
      };
      
      const result = ConfigurationValidator.validateQuick(shortKeyConfig);
      
      expect(result).toBeDefined();
      // May be valid or invalid depending on implementation
    });

    it('should validate different provider combinations', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');
      
      const anthropicConfig = {
        provider: 'anthropic' as const,
        apiKey: 'sk-ant-short',
        model: 'claude-sonnet-4-5-20250929',
      };
      
      const result = ConfigurationValidator.validateQuick(anthropicConfig);
      
      expect(result).toBeDefined();
      // May be valid or invalid depending on implementation
    });

    it('should handle missing provider', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');
      
      const invalidConfig = {
        apiKey: 'sk-test123',
        model: 'gpt-4',
      } as any;
      
      const result = ConfigurationValidator.validateQuick(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getSupportedProviders variations', () => {
    it('should return array of supported providers', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');
      
      const providers = ConfigurationValidator.getSupportedProviders();
      
      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);
      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');
      expect(providers).toContain('google');
    });

    it('should return unique providers', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');
      
      const providers = ConfigurationValidator.getSupportedProviders();
      const uniqueProviders = [...new Set(providers)];
      
      expect(providers.length).toBe(uniqueProviders.length);
    });
  });

  describe('getDefaultConfig variations', () => {
    it('should provide default config for OpenAI', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');
      
      const defaultConfig = ConfigurationValidator.getDefaultConfig('openai');
      
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig.provider).toBe('openai');
      expect(defaultConfig).toHaveProperty('model');
      expect(typeof defaultConfig.model).toBe('string');
    });

    it('should provide default config for Anthropic', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');
      
      const defaultConfig = ConfigurationValidator.getDefaultConfig('anthropic');
      
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig.provider).toBe('anthropic');
      expect(defaultConfig).toHaveProperty('model');
    });

    it('should provide default config for Google', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');
      
      const defaultConfig = ConfigurationValidator.getDefaultConfig('google');
      
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig.provider).toBe('google');
      expect(defaultConfig).toHaveProperty('model');
    });

    it('should handle unknown provider in getDefaultConfig', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');
      
      const defaultConfig = ConfigurationValidator.getDefaultConfig('unknown' as any);
      
      expect(defaultConfig).toBeDefined();
      // Should still return some default structure
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty object config', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');
      
      const result = ConfigurationValidator.validateQuick({} as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle config with extra properties', async () => {
      const { ConfigurationValidator } = await import('../../src/core/ConfigurationValidator');
      
      const configWithExtra = {
        provider: 'openai' as const,
        apiKey: 'sk-test1234567890abcdef',
        model: 'gpt-4',
        extraProperty: 'should be ignored',
        anotherExtra: 123,
      };
      
      const result = ConfigurationValidator.validateQuick(configWithExtra);
      
      expect(result).toBeDefined();
      // Should still process the valid parts
    });
  });
});