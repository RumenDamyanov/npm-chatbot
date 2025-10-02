/**
 * Provider tests to improve coverage from ~18% to 40%+
 * Tests core functionality without making actual network calls
 */

describe('Provider Tests', () => {
  describe('OpenAI Provider', () => {
    it('should create OpenAI provider with valid config', async () => {
      const { OpenAIProvider } = await import('../../src/providers/OpenAIProvider');
      
      const config = {
        apiKey: 'test-api-key',
        model: 'gpt-4',
        organizationId: 'test-org',
        apiUrl: 'https://api.openai.com/v1',
      };
      
      const provider = new OpenAIProvider(config);
      
      expect(provider.name).toBe('openai');
      expect(provider.capabilities).toBeDefined();
      expect(provider.capabilities.maxInputTokens).toBe(128000);
      expect(provider.capabilities.supportedModels).toContain('gpt-4');
      expect(provider.capabilities.supportsStreaming).toBe(true);
    });

    it('should throw error when API key is missing', async () => {
      const { OpenAIProvider } = await import('../../src/providers/OpenAIProvider');
      
      const config = {
        model: 'gpt-4',
      };
      
      expect(() => new OpenAIProvider(config as any)).toThrow('OpenAI API key is required');
    });

    it('should have correct capabilities', async () => {
      const { OpenAIProvider } = await import('../../src/providers/OpenAIProvider');
      
      const config = {
        apiKey: 'test-api-key',
        model: 'gpt-3.5-turbo',
      };
      
      const provider = new OpenAIProvider(config);
      
      expect(provider.capabilities.maxInputTokens).toBe(128000);
      expect(provider.capabilities.maxOutputTokens).toBe(4096);
      expect(provider.capabilities.supportedModels).toEqual([
        'gpt-4',
        'gpt-4-turbo',
        'gpt-3.5-turbo',
        'gpt-4o',
        'gpt-4o-mini',
      ]);
      expect(provider.capabilities.supportsStreaming).toBe(true);
      expect(provider.capabilities.supportsFunctionCalling).toBe(true);
      expect(provider.capabilities.supportsImageInput).toBe(true);
      expect(provider.capabilities.supportsAudioInput).toBe(false);
      expect(provider.capabilities.rateLimits).toBeDefined();
    });

    it('should get current status', async () => {
      const { OpenAIProvider } = await import('../../src/providers/OpenAIProvider');
      
      const config = {
        apiKey: 'test-api-key',
        model: 'gpt-4',
      };
      
      const provider = new OpenAIProvider(config);
      const status = await provider.getStatus();
      
      expect(status).toBeDefined();
      expect(status.available).toBeDefined();
      expect(status.model).toBeDefined();
      expect(status.version).toBeDefined();
      expect(status.usage).toBeDefined();
    });

    it('should get last error', async () => {
      const { OpenAIProvider } = await import('../../src/providers/OpenAIProvider');
      
      const config = {
        apiKey: 'test-api-key',
        model: 'gpt-4',
      };
      
      const provider = new OpenAIProvider(config);
      const lastError = provider.getLastError();
      
      // Should be undefined initially
      expect(lastError).toBeUndefined();
    });

    it('should reset usage statistics', async () => {
      const { OpenAIProvider } = await import('../../src/providers/OpenAIProvider');
      
      const config = {
        apiKey: 'test-api-key',
        model: 'gpt-4',
      };
      
      const provider = new OpenAIProvider(config);
      
      // Should not throw
      provider.resetUsage();
      expect(true).toBe(true); // Test passed if no exception
    });
  });

  describe('Anthropic Provider', () => {
    it('should create Anthropic provider with valid config', async () => {
      const { AnthropicProvider } = await import('../../src/providers/AnthropicProvider');
      
      const config = {
        apiKey: 'test-api-key',
        model: 'claude-sonnet-4-5-20250929',
      };
      
      const provider = new AnthropicProvider(config);
      
      expect(provider.name).toBe('anthropic');
      expect(provider.capabilities).toBeDefined();
      expect(provider.capabilities.maxInputTokens).toBe(200000);
      expect(provider.capabilities.supportedModels).toContain('claude-sonnet-4-5-20250929');
    });

    it('should throw error when API key is missing', async () => {
      const { AnthropicProvider } = await import('../../src/providers/AnthropicProvider');
      
      const config = {
        model: 'claude-sonnet-4-5-20250929',
      };
      
      expect(() => new AnthropicProvider(config as any)).toThrow('Anthropic API key is required');
    });

    it('should have correct capabilities', async () => {
      const { AnthropicProvider } = await import('../../src/providers/AnthropicProvider');
      
      const config = {
        apiKey: 'test-api-key',
        model: 'claude-sonnet-4-5-20250929',
      };
      
      const provider = new AnthropicProvider(config);
      
      expect(provider.capabilities.maxInputTokens).toBe(200000);
      expect(provider.capabilities.maxOutputTokens).toBe(8192);
      expect(provider.capabilities.supportedModels).toContain('claude-sonnet-4-5-20250929');
      expect(provider.capabilities.supportsStreaming).toBe(true);
      expect(provider.capabilities.supportsFunctionCalling).toBe(true);
      expect(provider.capabilities.supportsImageInput).toBe(true);
      expect(provider.capabilities.supportsAudioInput).toBe(false);
    });

    it('should get current status', async () => {
      const { AnthropicProvider } = await import('../../src/providers/AnthropicProvider');
      
      const config = {
        apiKey: 'test-api-key',
        model: 'claude-sonnet-4-5-20250929',
      };
      
      const provider = new AnthropicProvider(config);
      const status = await provider.getStatus();
      
      expect(status).toBeDefined();
      expect(status.available).toBeDefined();
      expect(status.model).toBeDefined();
      expect(status.version).toBeDefined();
      expect(status.usage).toBeDefined();
    });

    it('should reset usage statistics', async () => {
      const { AnthropicProvider } = await import('../../src/providers/AnthropicProvider');
      
      const config = {
        apiKey: 'test-api-key',
        model: 'claude-sonnet-4-5-20250929',
      };
      
      const provider = new AnthropicProvider(config);
      
      // Should not throw
      provider.resetUsage();
      expect(true).toBe(true); // Test passed if no exception
    });
  });

  describe('Google Provider', () => {
    it('should create Google provider with valid config', async () => {
      const { GoogleProvider } = await import('../../src/providers/GoogleProvider');
      
      const config = {
        apiKey: 'test-api-key',
        model: 'gemini-pro',
      };
      
      const provider = new GoogleProvider(config);
      
      expect(provider.name).toBe('google');
      expect(provider.capabilities).toBeDefined();
      expect(provider.capabilities.maxInputTokens).toBe(1048576);
      expect(provider.capabilities.supportedModels).toContain('gemini-pro');
    });

    it('should throw error when API key is missing', async () => {
      const { GoogleProvider } = await import('../../src/providers/GoogleProvider');
      
      const config = {
        model: 'gemini-pro',
      };
      
      expect(() => new GoogleProvider(config as any)).toThrow('Google API key is required');
    });

    it('should have correct capabilities', async () => {
      const { GoogleProvider } = await import('../../src/providers/GoogleProvider');
      
      const config = {
        apiKey: 'test-api-key',
        model: 'gemini-pro',
      };
      
      const provider = new GoogleProvider(config);
      
      expect(provider.capabilities.maxInputTokens).toBe(1048576);
      expect(provider.capabilities.maxOutputTokens).toBe(8192);
      expect(provider.capabilities.supportedModels).toContain('gemini-pro');
      expect(provider.capabilities.supportsStreaming).toBe(true);
      expect(provider.capabilities.supportsFunctionCalling).toBe(true);
      expect(provider.capabilities.supportsImageInput).toBe(true);
      expect(provider.capabilities.supportsAudioInput).toBe(true);
    });

    it('should get current status', async () => {
      const { GoogleProvider } = await import('../../src/providers/GoogleProvider');
      
      const config = {
        apiKey: 'test-api-key',
        model: 'gemini-pro',
      };
      
      const provider = new GoogleProvider(config);
      const status = await provider.getStatus();
      
      expect(status).toBeDefined();
      expect(status.available).toBeDefined();
      expect(status.model).toBeDefined();
      expect(status.version).toBeDefined();
      expect(status.usage).toBeDefined();
    });

    it('should reset usage statistics', async () => {
      const { GoogleProvider } = await import('../../src/providers/GoogleProvider');
      
      const config = {
        apiKey: 'test-api-key',
        model: 'gemini-pro',
      };
      
      const provider = new GoogleProvider(config);
      
      // Should not throw
      provider.resetUsage();
      expect(true).toBe(true); // Test passed if no exception
    });
  });

  describe('Provider Factory', () => {
    it('should create OpenAI provider', async () => {
      const { ProviderFactory } = await import('../../src/providers/ProviderFactory');
      
      const config = {
        provider: {
          provider: 'openai' as const,
          apiKey: 'test-api-key',
          model: 'gpt-4',
        },
      };
      
      const provider = ProviderFactory.createProvider(config);
      
      expect(provider.name).toBe('openai');
    });

    it('should create Anthropic provider', async () => {
      const { ProviderFactory } = await import('../../src/providers/ProviderFactory');
      
      const config = {
        provider: {
          provider: 'anthropic' as const,
          apiKey: 'test-api-key',
          model: 'claude-sonnet-4-5-20250929',
        },
      };
      
      const provider = ProviderFactory.createProvider(config);
      
      expect(provider.name).toBe('anthropic');
    });

    it('should create Google provider', async () => {
      const { ProviderFactory } = await import('../../src/providers/ProviderFactory');
      
      const config = {
        provider: {
          provider: 'google' as const,
          apiKey: 'test-api-key',
          model: 'gemini-pro',
        },
      };
      
      const provider = ProviderFactory.createProvider(config);
      
      expect(provider.name).toBe('google');
    });

    it('should create mock provider', async () => {
      const { ProviderFactory } = await import('../../src/providers/ProviderFactory');
      const { MockMetaProvider } = await import('../helpers/MockProviders');
      
      // Register the mock provider for this test
      ProviderFactory.registerProvider('meta', MockMetaProvider);
      
      const config = {
        provider: {
          provider: 'meta' as const,
          apiKey: 'test-key',
          model: 'llama-2-70b',
        },
      };
      
      const provider = ProviderFactory.createProvider(config);
      
      expect(provider.name).toBe('Meta');
    });

    it('should throw error for unsupported provider', async () => {
      const { ProviderFactory } = await import('../../src/providers/ProviderFactory');
      
      const config = {
        provider: {
          provider: 'unsupported' as any,
          apiKey: 'test-api-key',
          model: 'test-model',
        },
      };
      
      expect(() => ProviderFactory.createProvider(config)).toThrow('Unsupported');
    });

    it('should get available providers', async () => {
      const { ProviderFactory } = await import('../../src/providers/ProviderFactory');
      
      const providers = ProviderFactory.getAvailableProviders();
      
      expect(Array.isArray(providers)).toBe(true);
      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');
      expect(providers).toContain('google');
      expect(providers).toContain('meta');
    });

    it('should validate provider configuration', async () => {
      const { ProviderFactory } = await import('../../src/providers/ProviderFactory');
      
      const validConfig = {
        provider: {
          provider: 'meta' as const,
          apiKey: 'test-key',
          model: 'llama-2-70b',
        },
      };
      
      // Should not throw for valid config
      const isValid = await ProviderFactory.validateConfig(validConfig);
      expect(isValid).toBe(true);
    });
  });

  describe('Provider Error Handling', () => {
    it('should handle configuration errors gracefully', async () => {
      const { OpenAIProvider } = await import('../../src/providers/OpenAIProvider');
      
      // Test with empty config
      expect(() => new OpenAIProvider({} as any)).toThrow();
    });

    it('should handle invalid model selection', async () => {
      const { OpenAIProvider } = await import('../../src/providers/OpenAIProvider');
      
      const config = {
        provider: 'openai' as const,
        apiKey: 'test-api-key',
        model: 'invalid-model',
      };
      
      // Should not throw during construction, only during usage
      const provider = new OpenAIProvider(config);
      expect(provider).toBeDefined();
    });

    it('should track usage statistics', async () => {
      const { OpenAIProvider } = await import('../../src/providers/OpenAIProvider');
      
      const config = {
        apiKey: 'test-api-key',
        model: 'gpt-4',
      };
      
      const provider = new OpenAIProvider(config);
      const status = await provider.getStatus();
      
      expect(status.usage).toBeDefined();
      expect(typeof status.usage?.requests).toBe('number');
      expect(typeof status.usage?.tokens).toBe('number');
    });
  });

  describe('Provider Capabilities', () => {
    it('should correctly report OpenAI capabilities', async () => {
      const { OpenAIProvider } = await import('../../src/providers/OpenAIProvider');
      
      const config = {
        apiKey: 'test-api-key',
        model: 'gpt-4',
      };
      
      const provider = new OpenAIProvider(config);
      const caps = provider.capabilities;
      
      expect(caps.maxInputTokens).toBeGreaterThan(0);
      expect(caps.maxOutputTokens).toBeGreaterThan(0);
      expect(caps.supportedModels.length).toBeGreaterThan(0);
      expect(caps.rateLimits).toBeDefined();
      expect(caps.rateLimits.requestsPerMinute).toBeGreaterThan(0);
    });

    it('should correctly report Anthropic capabilities', async () => {
      const { AnthropicProvider } = await import('../../src/providers/AnthropicProvider');
      
      const config = {
        apiKey: 'test-api-key',
        model: 'claude-sonnet-4-5-20250929',
      };
      
      const provider = new AnthropicProvider(config);
      const caps = provider.capabilities;
      
      expect(caps.maxInputTokens).toBeGreaterThan(0);
      expect(caps.maxOutputTokens).toBeGreaterThan(0);
      expect(caps.supportedModels.length).toBeGreaterThan(0);
      expect(caps.rateLimits).toBeDefined();
    });

    it('should correctly report Google capabilities', async () => {
      const { GoogleProvider } = await import('../../src/providers/GoogleProvider');
      
      const config = {
        apiKey: 'test-api-key',
        model: 'gemini-pro',
      };
      
      const provider = new GoogleProvider(config);
      const caps = provider.capabilities;
      
      expect(caps.maxInputTokens).toBeGreaterThan(0);
      expect(caps.maxOutputTokens).toBeGreaterThan(0);
      expect(caps.supportedModels.length).toBeGreaterThan(0);
      expect(caps.rateLimits).toBeDefined();
    });
  });

  describe('Provider Configuration', () => {
    it('should handle custom API URLs', async () => {
      const { OpenAIProvider } = await import('../../src/providers/OpenAIProvider');
      
      const config = {
        apiKey: 'test-api-key',
        model: 'gpt-4',
        apiUrl: 'https://custom-api.com/v1',
      };
      
      const provider = new OpenAIProvider(config);
      expect(provider).toBeDefined();
    });

    it('should handle organization IDs', async () => {
      const { OpenAIProvider } = await import('../../src/providers/OpenAIProvider');
      
      const config = {
        apiKey: 'test-api-key',
        model: 'gpt-4',
        organizationId: 'org-123',
      };
      
      const provider = new OpenAIProvider(config);
      expect(provider).toBeDefined();
    });

    it('should use default model when not specified', async () => {
      const { OpenAIProvider } = await import('../../src/providers/OpenAIProvider');
      
      const config = {
        apiKey: 'test-api-key',
      };
      
      const provider = new OpenAIProvider(config);
      expect(provider).toBeDefined();
    });
  });
});