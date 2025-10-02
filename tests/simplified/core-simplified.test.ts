/**
 * Simplified core functionality tests
 * Focus on testing behavior, not implementation details
 */

import { SimpleMockProvider } from '../helpers/SimpleMockProvider';

describe('Core Functionality - Simplified Tests', () => {
  describe('Provider Basic Operations', () => {
    it('should create provider with valid config', () => {
      const config = {
        provider: 'openai' as const,
        apiKey: 'test-key',
        model: 'test-model',
      };

      expect(() => new SimpleMockProvider(config)).not.toThrow();
    });

    it('should throw error without API key', () => {
      const config = {
        provider: 'openai' as const,
        apiKey: '',
        model: 'test-model',
      };

      expect(() => new SimpleMockProvider(config)).toThrow('API key is required');
    });

    it('should generate simple response', async () => {
      const provider = new SimpleMockProvider({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'test-model',
      });

      const response = await provider.generateResponse('Hello world');

      expect(response).toBeDefined();
      expect(response.content).toContain('Mock response to: Hello world');
      expect(response.provider).toBe('openai');
      expect(response.metadata?.usage?.totalTokens).toBeGreaterThan(0);
    });

    it('should provide status information', async () => {
      const provider = new SimpleMockProvider({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'test-model',
      });

      const status = await provider.getStatus();

      expect(status).toBeDefined();
      expect(status.available).toBe(true);
      expect(status.model).toBe('test-model');
      expect(status.usage).toBeDefined();
    });

    it('should track usage statistics', async () => {
      const provider = new SimpleMockProvider({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'test-model',
      });

      // Initial usage should be zero
      const initialStatus = await provider.getStatus();
      expect(initialStatus.usage?.requests).toBe(0);

      // After one request, usage should increase
      await provider.generateResponse('Test message');
      const afterStatus = await provider.getStatus();
      expect(afterStatus.usage?.requests).toBe(1);
      expect(afterStatus.usage?.tokens).toBeGreaterThan(0);
    });

    it('should reset usage statistics', async () => {
      const provider = new SimpleMockProvider({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'test-model',
      });

      // Generate some usage
      await provider.generateResponse('Test message');

      // Reset usage
      provider.resetUsage();

      const status = await provider.getStatus();
      expect(status.usage?.requests).toBe(0);
      expect(status.usage?.tokens).toBe(0);
    });

    it('should handle streaming responses', async () => {
      const provider = new SimpleMockProvider({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'test-model',
      });

      const streamGenerator = provider.generateStreamingResponse('Test streaming');
      const chunks: string[] = [];

      for await (const chunk of streamGenerator) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join('')).toContain('Mock response');
    });

    it('should validate configuration', async () => {
      const provider = new SimpleMockProvider({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'test-model',
      });

      const validConfig = {
        provider: 'openai' as const,
        apiKey: 'valid-key',
        model: 'valid-model',
      };

      const invalidConfig = {
        provider: 'openai' as const,
        apiKey: '',
        model: 'valid-model',
      };

      expect(await provider.validateConfig(validConfig)).toBe(true);
      expect(await provider.validateConfig(invalidConfig)).toBe(false);
    });

    it('should handle availability checks', async () => {
      const provider = new SimpleMockProvider({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'test-model',
      });

      // Initially available
      expect(await provider.isAvailable()).toBe(true);

      // Set unavailable
      provider.setAvailable(false);
      expect(await provider.isAvailable()).toBe(false);

      // Set available again
      provider.setAvailable(true);
      expect(await provider.isAvailable()).toBe(true);
    });

    it('should handle error states', async () => {
      const provider = new SimpleMockProvider({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'test-model',
      });

      // Set an error
      const testError = new Error('Test error');
      provider.setError(testError);

      expect(await provider.isAvailable()).toBe(false);
      expect(provider.getLastError()).toBe(testError);

      const status = await provider.getStatus();
      expect(status.lastError).toBe(testError);

      // Clear error
      provider.clearError();
      expect(await provider.isAvailable()).toBe(true);
      expect(provider.getLastError()).toBeUndefined();
    });
  });

  describe('Provider Capabilities', () => {
    it('should have defined capabilities', () => {
      const provider = new SimpleMockProvider({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'test-model',
      });

      const caps = provider.capabilities;
      expect(caps).toBeDefined();
      expect(caps.maxInputTokens).toBeDefined();
      expect(caps.maxOutputTokens).toBeDefined();
      expect(caps.supportedModels).toBeDefined();
      expect(Array.isArray(caps.supportedModels)).toBe(true);
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration', async () => {
      const provider = new SimpleMockProvider({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'old-model',
      });

      provider.updateConfig({ model: 'new-model' });

      // We can't directly access private config, but we can verify through behavior
      const status = await provider.getStatus();
      expect(status.model).toBe('new-model');
    });
  });
});
