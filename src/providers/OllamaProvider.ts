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
 * Ollama provider implementation for local LLM models
 *
 * Supports running local models via Ollama server
 *
 * @example
 * ```typescript
 * const provider = new OllamaProvider({
 *   provider: 'ollama',
 *   apiUrl: 'http://localhost:11434', // Default Ollama server
 *   model: 'llama3.2:latest',
 *   apiKey: '', // Optional, only if auth is enabled
 * });
 * ```
 */
export class OllamaProvider implements IAiProvider {
  readonly name: AiProvider = 'ollama';
  readonly capabilities: ProviderCapabilities = {
    maxInputTokens: 128000, // Depends on model
    maxOutputTokens: 8192,
    supportedModels: [
      'llama3.2:latest',
      'llama3.1:latest',
      'mistral:latest',
      'mixtral:latest',
      'codellama:latest',
      'phi3:latest',
      'gemma2:latest',
      'qwen2.5:latest',
      // Custom models supported
    ],
    supportsStreaming: true,
    supportsFunctionCalling: false, // Most local models don't support this
    supportsImageInput: false, // Some models support vision
    supportsAudioInput: false,
    rateLimits: {
      requestsPerMinute: 1000, // Local server, no real limits
      requestsPerHour: 10000,
      tokensPerMinute: 1000000,
    },
  };

  private model: string;
  private apiUrl: string;
  private apiKey?: string;
  private lastError?: Error;
  private errorHandler: ErrorHandler;
  private usage = {
    requests: 0,
    tokens: 0,
    resetAt: new Date(Date.now() + 60000),
  };

  constructor(private config: AiProviderConfig) {
    if (!config.model) {
      throw new Error('Ollama model name is required');
    }

    this.errorHandler = new ErrorHandler({
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      retryableErrors: ['network', 'timeout', 'server_error'],
    });

    this.apiUrl = config.apiUrl || config.endpoint || 'http://localhost:11434';
    this.model = config.model;
    this.apiKey = config.apiKey; // Optional
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check if Ollama server is running
      const response = await fetch(`${this.apiUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
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
        options: {
          ...(options?.temperature !== undefined && { temperature: options.temperature }),
          ...(options?.topP !== undefined && { top_p: options.topP }),
          ...(options?.stop && { stop: options.stop }),
          // Ollama uses num_predict instead of max_tokens
          ...(options?.maxTokens !== undefined && { num_predict: options.maxTokens }),
        },
      };

      const completion = await this.errorHandler.executeWithRetry(
        async () => {
          const response = await fetch(`${this.apiUrl}/api/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama API error (${response.status}): ${errorText}`);
          }

          return await response.json();
        },
        'ollama',
        { method: 'generateResponse', model }
      );

      if (!completion.message?.content) {
        throw new Error('No response generated from Ollama');
      }

      // Update usage tracking
      this.usage.requests++;
      // Ollama doesn't always provide token counts
      this.usage.tokens += completion.prompt_eval_count || 0 + completion.eval_count || 0;

      const chatResponse: ChatResponse = {
        content: completion.message.content,
        provider: 'ollama',
        timestamp: new Date(),
        metadata: {
          model,
          finishReason: completion.done ? 'stop' : 'length',
          usage: {
            promptTokens: completion.prompt_eval_count || 0,
            completionTokens: completion.eval_count || 0,
            totalTokens: (completion.prompt_eval_count || 0) + (completion.eval_count || 0),
          },
          // Include Ollama-specific metrics
          ...(completion.total_duration && {
            totalDuration: completion.total_duration,
            loadDuration: completion.load_duration,
            promptEvalDuration: completion.prompt_eval_duration,
            evalDuration: completion.eval_duration,
          }),
          ...context?.metadata,
        },
      };

      return chatResponse;
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error('Unknown error');
      throw new Error(`Ollama API error: ${this.lastError.message}`);
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

    if (config.apiUrl || config.endpoint) {
      this.apiUrl = config.apiUrl || config.endpoint || this.apiUrl;
    }

    if (config.model) {
      this.model = config.model;
    }

    if (config.apiKey !== undefined) {
      this.apiKey = config.apiKey;
    }
  }

  async validateConfig(config: AiProviderConfig): Promise<boolean> {
    if (!config.model) {
      return false;
    }

    try {
      const apiUrl = config.apiUrl || config.endpoint || 'http://localhost:11434';
      const response = await fetch(`${apiUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
        },
      });

      if (!response.ok) {
        return false;
      }

      // Check if the model exists
      const data = await response.json();
      const models = data.models || [];
      return models.some((m: { name: string }) => m.name === config.model);
    } catch {
      return false;
    }
  }

  /**
   * Stream response from Ollama
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
        options: {
          ...(options?.temperature !== undefined && { temperature: options.temperature }),
          ...(options?.topP !== undefined && { top_p: options.topP }),
          ...(options?.stop && { stop: options.stop }),
          ...(options?.maxTokens !== undefined && { num_predict: options.maxTokens }),
        },
      };

      const response = await fetch(`${this.apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama streaming error (${response.status}): ${errorText}`);
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
          if (!trimmed) {
            continue;
          }

          try {
            const json = JSON.parse(trimmed);
            const content = json.message?.content;
            if (content) {
              yield content;
            }

            // Check if done
            if (json.done) {
              break;
            }
          } catch {
            // Skip invalid JSON
            continue;
          }
        }
      }

      // Update usage tracking (approximate for streaming)
      this.usage.requests++;
      this.usage.tokens += 100; // Estimate
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error('Unknown error');
      throw new Error(`Ollama streaming error: ${this.lastError.message}`);
    }
  }

  /**
   * Get available models from Ollama server
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      return (data.models || []).map((model: { name: string }) => model.name).sort();
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error('Unknown error');
      throw new Error(`Failed to fetch models: ${this.lastError.message}`);
    }
  }

  /**
   * Pull a model from Ollama library
   */
  async pullModel(modelName: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify({ name: modelName }),
      });

      if (!response.ok) {
        throw new Error(`Failed to pull model: ${response.statusText}`);
      }

      // Wait for pull to complete (simplified - in production you'd stream progress)
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error('Unknown error');
      throw new Error(`Failed to pull model: ${this.lastError.message}`);
    }
  }

  /**
   * Delete a model from Ollama
   */
  async deleteModel(modelName: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/api/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify({ name: modelName }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete model: ${response.statusText}`);
      }
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error('Unknown error');
      throw new Error(`Failed to delete model: ${this.lastError.message}`);
    }
  }

  /**
   * Test connection to Ollama server
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

  /**
   * Get server version info
   */
  async getServerVersion(): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/api/version`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        },
      });

      if (!response.ok) {
        return 'unknown';
      }

      const data = await response.json();
      return data.version || 'unknown';
    } catch {
      return 'unknown';
    }
  }
}
