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
 * DeepSeek provider implementation
 *
 * Supports DeepSeek-V3 (chat) and DeepSeek-R1 (reasoning) models
 *
 * @example
 * ```typescript
 * const provider = new DeepSeekProvider({
 *   provider: 'deepseek',
 *   apiKey: 'your-deepseek-api-key',
 *   model: 'deepseek-chat', // or 'deepseek-reasoner'
 *   endpoint: 'https://api.deepseek.com/v1'
 * });
 * ```
 */
export class DeepSeekProvider implements IAiProvider {
  readonly name: AiProvider = 'deepseek';
  readonly capabilities: ProviderCapabilities = {
    maxInputTokens: 64000, // DeepSeek context window
    maxOutputTokens: 8192,
    supportedModels: [
      'deepseek-chat', // DeepSeek-V3 for general chat
      'deepseek-reasoner', // DeepSeek-R1 for reasoning tasks
      'deepseek-coder', // Code-specific model
    ],
    supportsStreaming: true,
    supportsFunctionCalling: true,
    supportsImageInput: false,
    supportsAudioInput: false,
    rateLimits: {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      tokensPerMinute: 500000,
    },
  };

  private model: string;
  private endpoint: string;
  private apiKey: string;
  private lastError?: Error;
  private errorHandler: ErrorHandler;
  private usage = {
    requests: 0,
    tokens: 0,
    resetAt: new Date(Date.now() + 60000),
  };

  constructor(private config: AiProviderConfig) {
    if (!config.apiKey) {
      throw new Error('DeepSeek API key is required');
    }

    this.errorHandler = new ErrorHandler({
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      retryableErrors: ['network', 'rate_limit', 'timeout', 'server_error'],
    });

    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || config.apiUrl || 'https://api.deepseek.com/v1';
    this.model = config.model ?? 'deepseek-chat';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
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
      const messages: Array<{ role: string; content: string }> = [];

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

      const requestBody = {
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
      };

      const completion = await this.errorHandler.executeWithRetry(
        async () => {
          const response = await fetch(`${this.endpoint}/chat/completions`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
          }

          return await response.json();
        },
        'deepseek',
        { method: 'generateResponse', model }
      );

      const choice = completion.choices?.[0];
      if (!choice?.message?.content) {
        throw new Error('No response generated from DeepSeek');
      }

      // Update usage tracking
      this.usage.requests++;
      this.usage.tokens += completion.usage?.total_tokens || 0;

      const chatResponse: ChatResponse = {
        content: choice.message.content,
        provider: 'deepseek',
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
          // Include reasoning tokens for DeepSeek-R1 if available
          ...(completion.usage?.reasoning_tokens && {
            reasoningTokens: completion.usage.reasoning_tokens,
          }),
          ...context?.metadata,
        },
      };

      return chatResponse;
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error('Unknown error');
      throw new Error(`DeepSeek API error: ${this.lastError.message}`);
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

    if (config.apiKey) {
      this.apiKey = config.apiKey;
    }

    if (config.endpoint || config.apiUrl) {
      this.endpoint = config.endpoint || config.apiUrl || this.endpoint;
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
      const endpoint = config.endpoint || config.apiUrl || 'https://api.deepseek.com/v1';
      const response = await fetch(`${endpoint}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Stream response from DeepSeek
   */
  async *generateStreamingResponse(
    message: string,
    context?: ChatContext,
    options?: GenerationOptions
  ): AsyncGenerator<string, void, unknown> {
    try {
      const model = options?.model || this.model;

      // Build messages array
      const messages: Array<{ role: string; content: string }> = [];

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

      const requestBody = {
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
      };

      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek streaming error (${response.status}): ${errorText}`);
      }

      if (!response.body) {
        throw new Error('No response body for streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') {
            continue;
          }

          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip invalid JSON
              continue;
            }
          }
        }
      }

      // Update usage tracking (approximate for streaming)
      this.usage.requests++;
      this.usage.tokens += 100; // Estimate
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error('Unknown error');
      throw new Error(`DeepSeek streaming error: ${this.lastError.message}`);
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.endpoint}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      return (
        data.data
          ?.filter((model: { id: string }) => model.id.includes('deepseek'))
          .map((model: { id: string }) => model.id)
          .sort() || []
      );
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error('Unknown error');
      throw new Error(`Failed to fetch models: ${this.lastError.message}`);
    }
  }

  /**
   * Test connection to DeepSeek API
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
