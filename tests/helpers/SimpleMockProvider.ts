/**
 * Simplified mock provider for testing
 * Implements all required methods with predictable behavior
 */

import type {
  IAiProvider,
  ProviderCapabilities,
  ProviderStatus,
  GenerationOptions,
} from '../../src/types/ProviderTypes';
import type {
  AiProvider,
  ChatContext,
  ChatResponse,
  AiProviderConfig,
} from '../../src/types/ChatbotTypes';

export class SimpleMockProvider implements IAiProvider {
  readonly name: AiProvider = 'openai'; // Default to openai for compatibility
  readonly capabilities: ProviderCapabilities = {
    maxInputTokens: 4000,
    maxOutputTokens: 1000,
    supportedModels: ['mock-model'],
    supportsStreaming: true,
    supportsFunctionCalling: false,
    supportsImageInput: false,
    supportsAudioInput: false,
  };

  private _isAvailable = true;
  private _lastError?: Error;
  private _usage = { requests: 0, tokens: 0, resetAt: new Date() };

  constructor(private config: AiProviderConfig) {
    // Simple validation - throw if no API key
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
  }

  async isAvailable(): Promise<boolean> {
    return this._isAvailable;
  }

  async generateResponse(
    message: string,
    context?: ChatContext,
    options?: GenerationOptions
  ): Promise<ChatResponse> {
    // Simple response generation
    this._usage.requests++;
    this._usage.tokens += message.length + 20; // Approximate token count

    return {
      content: `Mock response to: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
      provider: this.config.provider || 'openai',
      timestamp: new Date(),
      metadata: {
        model: options?.model || this.config.model || 'mock-model',
        usage: {
          promptTokens: message.length,
          completionTokens: 20,
          totalTokens: message.length + 20,
        },
      },
    };
  }

  async *generateStreamingResponse(
    message: string,
    context?: ChatContext,
    options?: GenerationOptions
  ): AsyncGenerator<string, void, unknown> {
    const response = await this.generateResponse(message, context, options);
    const words = response.content.split(' ');

    for (const word of words) {
      yield `${word} `;
      // Small delay to simulate streaming
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
  }

  async getStatus(): Promise<ProviderStatus> {
    return {
      available: this._isAvailable,
      model: this.config.model || 'mock-model',
      version: '1.0.0',
      usage: {
        requests: this._usage.requests,
        tokens: this._usage.tokens,
        resetAt: this._usage.resetAt,
      },
      lastError: this._lastError,
    };
  }

  updateConfig(config: Partial<AiProviderConfig>): void {
    Object.assign(this.config, config);
  }

  async validateConfig(config: AiProviderConfig): Promise<boolean> {
    return !!(config.apiKey && config.provider);
  }

  // Additional helper methods for testing
  getLastError(): Error | undefined {
    return this._lastError;
  }

  resetUsage(): void {
    this._usage = { requests: 0, tokens: 0, resetAt: new Date() };
  }

  // Test helper methods
  setAvailable(available: boolean): void {
    this._isAvailable = available;
  }

  setError(error: Error): void {
    this._lastError = error;
    this._isAvailable = false;
  }

  clearError(): void {
    this._lastError = undefined;
    this._isAvailable = true;
  }
}
