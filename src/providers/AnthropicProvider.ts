import Anthropic from '@anthropic-ai/sdk';
import type {
  IAiProvider,
  ProviderCapabilities,
  ProviderStatus,
  GenerationOptions,
} from '../types/ProviderTypes';
import type {
  AiProvider,
  ChatContext,
  ChatResponse,
  AiProviderConfig,
} from '../types/ChatbotTypes';

/**
 * Anthropic Claude provider implementation
 */
export class AnthropicProvider implements IAiProvider {
  readonly name: AiProvider = 'anthropic';
  readonly capabilities: ProviderCapabilities = {
    maxInputTokens: 200000,
    maxOutputTokens: 8192,
    supportedModels: [
      'claude-sonnet-4-5-20250929',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ],
    supportsStreaming: true,
    supportsFunctionCalling: true,
    supportsImageInput: true,
    supportsAudioInput: false,
    rateLimits: {
      requestsPerMinute: 1000,
      requestsPerHour: 5000,
      tokensPerMinute: 40000,
    },
  };

  private client: Anthropic;
  private model: string;
  private lastError?: Error;
  private usage = {
    requests: 0,
    tokens: 0,
    resetAt: new Date(Date.now() + 60000), // Reset every minute
  };

  constructor(private config: AiProviderConfig) {
    if (!config.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.apiUrl,
    });

    this.model = config.model ?? 'claude-sonnet-4-5-20250929';
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test with a minimal request
      await this.client.messages.create({
        model: this.model,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      });
      return true;
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error('Unknown error');
      return false;
    }
  }

  async generateResponse(
    message: string,
    context?: ChatContext,
    options?: GenerationOptions
  ): Promise<ChatResponse> {
    try {
      const model = options?.model ?? this.model;

      // Build messages array for Anthropic format
      const messages: Anthropic.Messages.MessageParam[] = [];

      // Add conversation history (excluding system messages)
      if (context?.messages) {
        for (const msg of context.messages) {
          if (msg.role === 'user' || msg.role === 'assistant') {
            messages.push({
              role: msg.role,
              content: msg.content,
            });
          }
        }
      }

      // Add current message
      messages.push({
        role: 'user',
        content: message,
      });

      // Create the request
      const requestOptions: Anthropic.Messages.MessageCreateParams = {
        model,
        max_tokens: options?.maxTokens ?? 4096,
        messages,
        stream: false,
      };

      // Add optional parameters if provided
      if (options?.temperature !== undefined) {
        requestOptions.temperature = options.temperature;
      }

      if (options?.topP !== undefined) {
        requestOptions.top_p = options.topP;
      }

      if (options?.stop !== undefined) {
        requestOptions.stop_sequences = options.stop;
      }

      // Add system prompt if available
      if (context?.systemPrompt) {
        requestOptions.system = context.systemPrompt;
      }

      const response = await this.client.messages.create(requestOptions);

      // Extract content from response
      let content = '';
      if (response.content && response.content.length > 0) {
        for (const block of response.content) {
          if (block.type === 'text') {
            content += block.text;
          }
        }
      }

      if (!content) {
        throw new Error('No response generated');
      }

      // Update usage tracking
      this.usage.requests++;
      this.usage.tokens += response.usage.input_tokens + response.usage.output_tokens;

      const chatResponse: ChatResponse = {
        content,
        provider: 'anthropic',
        timestamp: new Date(),
        metadata: {
          model,
          stopReason: response.stop_reason,
          usage: {
            promptTokens: response.usage.input_tokens,
            completionTokens: response.usage.output_tokens,
            totalTokens: response.usage.input_tokens + response.usage.output_tokens,
          },
          ...context?.metadata,
        },
      };

      return chatResponse;
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error('Unknown error');
      throw new Error(`Anthropic API error: ${this.lastError.message}`, { cause: error });
    }
  }

  async getStatus(): Promise<ProviderStatus> {
    const status: ProviderStatus = {
      available: await this.isAvailable(),
      model: this.model,
      version: '1.0.0',
      usage: {
        requests: this.usage.requests,
        tokens: this.usage.tokens,
        resetAt: this.usage.resetAt,
      },
    };

    if (this.lastError) {
      status.lastError = this.lastError;
    }

    return status;
  }

  updateConfig(config: Partial<AiProviderConfig>): void {
    Object.assign(this.config, config);

    // Recreate client if API-related config changed
    if (config.apiKey ?? config.apiUrl) {
      this.client = new Anthropic({
        apiKey: this.config.apiKey,
        baseURL: this.config.apiUrl,
      });
    }

    if (config.model) {
      this.model = config.model;
    }
  }

  async validateConfig(config: AiProviderConfig): Promise<boolean> {
    if (!config.apiKey) {
      return false;
    }

    try {
      const testClient = new Anthropic({
        apiKey: config.apiKey,
        baseURL: config.apiUrl,
      });

      // Test with minimal request
      await testClient.messages.create({
        model: config.model ?? 'claude-sonnet-4-5-20250929',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Stream response from Anthropic
   */
  async *generateStreamingResponse(
    message: string,
    context?: ChatContext,
    options?: GenerationOptions
  ): AsyncGenerator<string, void, unknown> {
    try {
      const model = options?.model ?? this.model;

      // Build messages array (same as non-streaming)
      const messages: Anthropic.Messages.MessageParam[] = [];

      if (context?.messages) {
        for (const msg of context.messages) {
          if (msg.role === 'user' || msg.role === 'assistant') {
            messages.push({
              role: msg.role,
              content: msg.content,
            });
          }
        }
      }

      messages.push({
        role: 'user',
        content: message,
      });

      const requestOptions: Anthropic.Messages.MessageCreateParams = {
        model,
        max_tokens: options?.maxTokens ?? 4096,
        messages,
        stream: true,
      };

      if (options?.temperature !== undefined) {
        requestOptions.temperature = options.temperature;
      }

      if (options?.topP !== undefined) {
        requestOptions.top_p = options.topP;
      }

      if (options?.stop !== undefined) {
        requestOptions.stop_sequences = options.stop;
      }

      if (context?.systemPrompt) {
        requestOptions.system = context.systemPrompt;
      }

      const stream = await this.client.messages.create(requestOptions);

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield chunk.delta.text;
        }
      }

      // Update usage tracking (approximate for streaming)
      this.usage.requests++;
      this.usage.tokens += 200; // Estimate, we don't get exact tokens in streaming
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error('Unknown error');
      throw new Error(`Anthropic streaming error: ${this.lastError.message}`, { cause: error });
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<string[]> {
    // Anthropic doesn't provide a models endpoint, return supported models
    return this.capabilities.supportedModels ?? [];
  }

  /**
   * Test connection to Anthropic API
   */
  async testConnection(): Promise<boolean> {
    return this.isAvailable();
  }

  /**
   * Get the last error that occurred
   */
  getLastError(): Error | undefined {
    return this.lastError;
  }

  /**
   * Reset usage statistics
   */
  resetUsage(): void {
    this.usage = {
      requests: 0,
      tokens: 0,
      resetAt: new Date(Date.now() + 60000),
    };
  }
}
