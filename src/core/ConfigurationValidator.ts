import type { ProviderCapabilities, ProviderStatus } from '../types/ProviderTypes';
import type { AiProvider, AiProviderConfig, ChatbotConfig } from '../types/ChatbotTypes';
import { ProviderFactory } from '../providers/ProviderFactory';

/**
 * Configuration validation result
 */
export interface ValidationResult {
  /** Whether the configuration is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Provider capabilities if valid */
  capabilities?: ProviderCapabilities;
  /** Provider status if valid */
  status?: ProviderStatus;
}

/**
 * Provider configuration validator
 */
export class ConfigurationValidator {
  /**
   * Validate a complete chatbot configuration
   */
  static async validateChatbotConfig(config: ChatbotConfig): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validate provider configuration
    const providerResult = await this.validateProviderConfig(config.provider);
    result.errors.push(...providerResult.errors);
    result.warnings.push(...providerResult.warnings);

    if (providerResult.capabilities) {
      result.capabilities = providerResult.capabilities;
    }
    if (providerResult.status) {
      result.status = providerResult.status;
    }

    if (providerResult.errors.length > 0) {
      result.isValid = false;
    }

    // Validate temperature
    if (config.temperature !== undefined) {
      if (config.temperature < 0 || config.temperature > 2) {
        result.warnings.push('Temperature should be between 0 and 2');
      }
    }

    // Validate maxTokens
    if (config.maxTokens !== undefined) {
      if (config.maxTokens <= 0) {
        result.errors.push('maxTokens must be greater than 0');
        result.isValid = false;
      }
      if (
        result.capabilities?.maxOutputTokens &&
        config.maxTokens > result.capabilities.maxOutputTokens
      ) {
        result.warnings.push(
          `maxTokens (${config.maxTokens}) exceeds provider limit (${result.capabilities.maxOutputTokens})`
        );
      }
    }

    // Validate maxHistory
    if (config.maxHistory !== undefined && config.maxHistory <= 0) {
      result.errors.push('maxHistory must be greater than 0');
      result.isValid = false;
    }

    // Validate timeout
    if (config.timeout !== undefined && config.timeout <= 0) {
      result.errors.push('timeout must be greater than 0');
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate a provider configuration
   */
  static async validateProviderConfig(config: AiProviderConfig): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Check if provider type is supported
    if (!ProviderFactory.isProviderAvailable(config.provider)) {
      result.errors.push(`Unsupported provider: ${config.provider}`);
      result.isValid = false;
      return result;
    }

    // Validate basic requirements
    const validationErrors = this.validateBasicRequirements(config);
    result.errors.push(...validationErrors);

    if (validationErrors.length > 0) {
      result.isValid = false;
      return result;
    }

    try {
      // Create provider instance to test configuration
      const provider = ProviderFactory.createProvider({ provider: config } as ChatbotConfig);

      // Get capabilities
      result.capabilities = provider.capabilities;

      // Validate model if specified
      if (config.model) {
        const supportedModels = result.capabilities.supportedModels;
        if (supportedModels && !supportedModels.includes(config.model)) {
          result.warnings.push(
            `Model "${config.model}" may not be supported. Supported models: ${supportedModels.join(', ')}`
          );
        }
      }

      // Test provider availability
      try {
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          result.errors.push('Provider is not available (connection test failed)');
          result.isValid = false;
        } else {
          // Get provider status if available
          result.status = await provider.getStatus();
        }
      } catch (error) {
        result.errors.push(
          `Provider connection test failed: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
        result.isValid = false;
      }
    } catch (error) {
      result.errors.push(
        `Provider initialization failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate basic provider requirements
   */
  private static validateBasicRequirements(config: AiProviderConfig): string[] {
    const errors: string[] = [];

    // Provider-specific validation
    switch (config.provider) {
      case 'openai':
        if (!config.apiKey) {
          errors.push('OpenAI API key is required');
        }
        if (config.organizationId && typeof config.organizationId !== 'string') {
          errors.push('OpenAI organization ID must be a string');
        }
        break;

      case 'anthropic':
        if (!config.apiKey) {
          errors.push('Anthropic API key is required');
        }
        break;

      case 'google':
        if (!config.apiKey) {
          errors.push('Google API key is required');
        }
        break;

      case 'meta':
        if (!config.apiKey) {
          errors.push('Meta API key is required');
        }
        break;

      case 'xai':
        if (!config.apiKey) {
          errors.push('xAI API key is required');
        }
        break;

      case 'deepseek':
        if (!config.apiKey) {
          errors.push('DeepSeek API key is required');
        }
        break;

      case 'ollama':
        if (!config.apiUrl) {
          errors.push('Ollama API URL is required');
        }
        if (!config.model) {
          errors.push('Ollama model name is required');
        }
        break;

      default:
        // For custom providers, we can't validate specific requirements
        break;
    }

    // Validate API URL if provided
    if (config.apiUrl) {
      try {
        new URL(config.apiUrl);
      } catch {
        errors.push('Invalid API URL format');
      }
    }

    return errors;
  }

  /**
   * Quick validation without provider instantiation
   */
  static validateQuick(config: AiProviderConfig): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Check if provider type is supported
    if (!ProviderFactory.isProviderAvailable(config.provider)) {
      result.errors.push(`Unsupported provider: ${config.provider}`);
      result.isValid = false;
    }

    // Validate basic requirements
    const validationErrors = this.validateBasicRequirements(config);
    result.errors.push(...validationErrors);

    if (validationErrors.length > 0) {
      result.isValid = false;
    }

    return result;
  }

  /**
   * Get list of supported providers
   */
  static getSupportedProviders(): AiProvider[] {
    return ProviderFactory.getAvailableProviders() as AiProvider[];
  }

  /**
   * Get default configuration for a provider
   */
  static getDefaultConfig(provider: AiProvider): Partial<AiProviderConfig> {
    const base: Partial<AiProviderConfig> = {
      provider,
    };

    switch (provider) {
      case 'openai':
        return {
          ...base,
          model: 'gpt-4',
        };

      case 'anthropic':
        return {
          ...base,
          model: 'claude-sonnet-4-5-20250929',
        };

      case 'google':
        return {
          ...base,
          model: 'gemini-1.5-flash',
        };

      case 'meta':
        return {
          ...base,
          model: 'llama-2-70b',
        };

      case 'xai':
        return {
          ...base,
          model: 'grok-1',
        };

      case 'deepseek':
        return {
          ...base,
          model: 'deepseek-chat',
        };

      case 'ollama':
        return {
          ...base,
          apiUrl: 'http://localhost:11434',
          model: 'llama2',
        };

      default:
        return base;
    }
  }
}
