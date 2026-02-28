import { OpenAI } from 'openai';
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
import { ErrorHandler } from '../core/ErrorHandler';

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider implements IAiProvider {
  readonly name: AiProvider = 'openai';
  readonly capabilities: ProviderCapabilities = {
    maxInputTokens: 128000,
    maxOutputTokens: 4096,
    supportedModels: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini'],
    supportsStreaming: true,
    supportsFunctionCalling: true,
    supportsImageInput: true,
    supportsAudioInput: false,
    rateLimits: {
      requestsPerMinute: 10000,
      requestsPerHour: 50000,
      tokensPerMinute: 30000000,
    },
  };

  private client: OpenAI;
  private model: string;
  private lastError?: Error;
  private errorHandler: ErrorHandler;
  private usage = {
    requests: 0,
    tokens: 0,
    resetAt: new Date(Date.now() + 60000), // Reset every minute
  };

  constructor(private config: AiProviderConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.errorHandler = new ErrorHandler({
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      retryableErrors: ['network', 'rate_limit', 'timeout', 'server_error'],
    });

    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organizationId,
      baseURL: config.apiUrl,
    });

    this.model = config.model ?? 'gpt-4';
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.models.retrieve('gpt-3.5-turbo');
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
      const model = options?.model || this.model;

      // Build messages array
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

      // Add system message if available
      if (context?.systemPrompt) {
        messages.push({
          role: 'system',
          content: context.systemPrompt,
        });
      }

      // Add conversation history
      if (context?.messages) {
        for (const msg of context.messages) {
          if (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system') {
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

      const completion = await this.errorHandler.executeWithRetry(
        async () => {
          return await this.client.chat.completions.create({
            model,
            messages,
            stream: false,
            ...(options?.temperature !== undefined && { temperature: options.temperature }),
            ...(options?.maxTokens !== undefined && { max_tokens: options.maxTokens }),
            ...(options?.topP !== undefined && { top_p: options.topP }),
            ...(options?.frequencyPenalty !== undefined && {
              frequency_penalty: options.frequencyPenalty,
            }),
            ...(options?.presencePenalty !== undefined && {
              presence_penalty: options.presencePenalty,
            }),
            ...(options?.stop && { stop: options.stop }),
          });
        },
        'openai',
        { method: 'generateResponse', model }
      );

      const choice = completion.choices[0];
      if (!choice?.message?.content) {
        throw new Error('No response generated');
      }

      // Update usage tracking
      this.usage.requests++;
      this.usage.tokens += completion.usage?.total_tokens || 0;

      const response: ChatResponse = {
        content: choice.message.content,
        provider: 'openai',
        timestamp: new Date(),
        metadata: {
          model,
          finishReason: choice.finish_reason,
          usage: completion.usage
            ? {
                promptTokens: completion.usage.prompt_tokens,
                completionTokens: completion.usage.completion_tokens,
                totalTokens: completion.usage.total_tokens,
              }
            : undefined,
          ...context?.metadata,
        },
      };

      return response;
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error('Unknown error');
      throw new Error(`OpenAI API error: ${this.lastError.message}`, { cause: error });
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
    if (config.apiKey || config.organizationId || config.apiUrl) {
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
        organization: this.config.organizationId,
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
      const testClient = new OpenAI({
        apiKey: config.apiKey,
        organization: config.organizationId,
        baseURL: config.apiUrl,
      });

      await testClient.models.list();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Stream response from OpenAI
   */
  async *generateStreamingResponse(
    message: string,
    context?: ChatContext,
    options?: GenerationOptions
  ): AsyncGenerator<string, void, unknown> {
    try {
      const model = options?.model || this.model;

      // Build messages array (same as non-streaming)
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

      if (context?.systemPrompt) {
        messages.push({
          role: 'system',
          content: context.systemPrompt,
        });
      }

      if (context?.messages) {
        for (const msg of context.messages) {
          if (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system') {
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

      const stream = await this.client.chat.completions.create({
        model,
        messages,
        stream: true,
        ...(options?.temperature !== undefined && { temperature: options.temperature }),
        ...(options?.maxTokens !== undefined && { max_tokens: options.maxTokens }),
        ...(options?.topP !== undefined && { top_p: options.topP }),
        ...(options?.frequencyPenalty !== undefined && {
          frequency_penalty: options.frequencyPenalty,
        }),
        ...(options?.presencePenalty !== undefined && {
          presence_penalty: options.presencePenalty,
        }),
        ...(options?.stop && { stop: options.stop }),
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }

      // Update usage tracking (approximate for streaming)
      this.usage.requests++;
      this.usage.tokens += 100; // Estimate, we don't get exact tokens in streaming
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error('Unknown error');
      throw new Error(`OpenAI streaming error: ${this.lastError.message}`, { cause: error });
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<string[]> {
    try {
      const models = await this.client.models.list();
      return models.data
        .filter(
          (model: { id: string }) => model.id.startsWith('gpt-') || model.id.startsWith('text-')
        )
        .map((model: { id: string }) => model.id)
        .sort();
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error('Unknown error');
      throw new Error(`Failed to fetch models: ${this.lastError.message}`, { cause: error });
    }
  }

  /**
   * Test connection to OpenAI API
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
