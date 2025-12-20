import type { IAiProvider } from '../types/ProviderTypes';
import type { ChatbotConfig } from '../types/ChatbotTypes';
import { OpenAIProvider } from './OpenAIProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { GoogleProvider } from './GoogleProvider';
import { MetaProvider } from './MetaProvider';
import { XaiProvider } from './XaiProvider';
import { DeepSeekProvider } from './DeepSeekProvider';

/**
 * Factory class for creating AI provider instances based on configuration
 */
export class ProviderFactory {
  private static providers = new Map<string, new (config: any) => IAiProvider>();
  private static logger = new (class {
    info(message: string) {
      console.log(`[ProviderFactory] ${message}`);
    }
    error(message: string) {
      console.error(`[ProviderFactory] ${message}`);
    }
  })();

  /**
   * Register a provider class
   */
  static registerProvider(type: string, providerClass: new (config: any) => IAiProvider): void {
    this.providers.set(type, providerClass);
    this.logger.info(`Registered provider: ${type}`);
  }

  /**
   * Create a provider instance based on configuration
   */
  static createProvider(config: ChatbotConfig): IAiProvider {
    if (!config.provider.provider) {
      throw new Error('AI provider type is required');
    }

    const ProviderClass = this.providers.get(config.provider.provider);
    if (!ProviderClass) {
      throw new Error(`Unsupported AI provider: ${config.provider.provider}`);
    }

    try {
      const provider = new ProviderClass(config.provider);
      this.logger.info(`Successfully created ${config.provider.provider} provider`);
      return provider;
    } catch (error) {
      throw new Error(
        `Failed to create ${config.provider.provider} provider: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get list of available providers
   */
  static getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider is available
   */
  static isProviderAvailable(type: string): boolean {
    return this.providers.has(type);
  }

  /**
   * Validate provider configuration
   */
  static async validateConfig(config: ChatbotConfig): Promise<boolean> {
    try {
      const provider = this.createProvider(config);
      return await provider.validateConfig(config.provider);
    } catch {
      return false;
    }
  }

  /**
   * Initialize with default providers
   */
  static initialize(): void {
    // Register real providers only
    // Mock providers for testing are registered in tests
    this.providers.set('openai', OpenAIProvider);
    this.providers.set('anthropic', AnthropicProvider);
    this.providers.set('google', GoogleProvider);
    this.providers.set('meta', MetaProvider);
    this.providers.set('xai', XaiProvider);
    this.providers.set('deepseek', DeepSeekProvider);

    this.logger.info('Initialized provider factory with OpenAI, Anthropic, Google, Meta, xAI, and DeepSeek providers');
  }
}

// NOTE: Mock providers have been moved to tests/helpers/MockProviders.ts
// This factory only registers real providers. Mock providers are registered during test initialization.

// Lazy initialization - will be called on first use or can be called explicitly
ProviderFactory.initialize();
