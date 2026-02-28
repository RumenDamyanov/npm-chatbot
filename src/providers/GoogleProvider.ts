import { GoogleGenerativeAI } from '@google/generative-ai';
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
 * Google Gemini provider implementation
 */
export class GoogleProvider implements IAiProvider {
  readonly name: AiProvider = 'google';
  readonly capabilities: ProviderCapabilities = {
    maxInputTokens: 1048576, // 1M tokens for Gemini 1.5 Pro
    maxOutputTokens: 8192,
    supportedModels: [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.0-pro',
      'gemini-pro', // Legacy name for gemini-1.0-pro
    ],
    supportsStreaming: true,
    supportsFunctionCalling: true,
    supportsImageInput: true,
    supportsAudioInput: true,
    rateLimits: {
      requestsPerMinute: 1500,
      requestsPerHour: 50000,
      tokensPerMinute: 1000000,
    },
  };

  private client: GoogleGenerativeAI;
  private model: string;
  private lastError?: Error;
  private usage = {
    requests: 0,
    tokens: 0,
    resetAt: new Date(Date.now() + 60000), // Reset every minute
  };

  constructor(private config: AiProviderConfig) {
    if (!config.apiKey) {
      throw new Error('Google API key is required');
    }

    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model ?? 'gemini-1.5-flash';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({ model: this.model });
      const result = await model.generateContent('Hello');
      return !!result.response.text();
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
      const modelName = options?.model ?? this.model;
      const model = this.client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
          topP: options?.topP,
          stopSequences: options?.stop,
        },
        systemInstruction: context?.systemPrompt,
      });

      // Build chat history for context
      const history: Array<{
        role: 'user' | 'model';
        parts: Array<{ text: string }>;
      }> = [];

      if (context?.messages) {
        for (const msg of context.messages) {
          if (msg.role === 'user') {
            history.push({
              role: 'user',
              parts: [{ text: msg.content }],
            });
          } else if (msg.role === 'assistant') {
            history.push({
              role: 'model',
              parts: [{ text: msg.content }],
            });
          }
        }
      }

      let result;
      if (history.length > 0) {
        // Start chat with history
        const chat = model.startChat({ history });
        result = await chat.sendMessage(message);
      } else {
        // Single message generation
        result = await model.generateContent(message);
      }

      const response = result.response;
      const content = response.text();

      if (!content) {
        throw new Error('No response generated');
      }

      // Update usage tracking
      this.usage.requests++;
      if (response.usageMetadata) {
        this.usage.tokens +=
          response.usageMetadata.promptTokenCount + response.usageMetadata.candidatesTokenCount;
      }

      const chatResponse: ChatResponse = {
        content,
        provider: 'google',
        timestamp: new Date(),
        metadata: {
          model: modelName,
          finishReason: response.candidates?.[0]?.finishReason,
          usage: response.usageMetadata
            ? {
                promptTokens: response.usageMetadata.promptTokenCount,
                completionTokens: response.usageMetadata.candidatesTokenCount,
                totalTokens: response.usageMetadata.totalTokenCount,
              }
            : undefined,
          ...context?.metadata,
        },
      };

      return chatResponse;
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error('Unknown error');
      throw new Error(`Google API error: ${this.lastError.message}`, { cause: error });
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

    // Recreate client if API key changed
    if (config.apiKey && this.config.apiKey) {
      this.client = new GoogleGenerativeAI(this.config.apiKey);
    }

    if (config.model && config.model) {
      this.model = config.model;
    }
  }

  async validateConfig(config: AiProviderConfig): Promise<boolean> {
    if (!config.apiKey) {
      return false;
    }

    try {
      const testClient = new GoogleGenerativeAI(config.apiKey);
      const model = testClient.getGenerativeModel({
        model: config.model ?? 'gemini-1.5-flash',
      });
      const result = await model.generateContent('Hello');
      return !!result.response.text();
    } catch {
      return false;
    }
  }

  /**
   * Stream response from Google Gemini
   */
  async *generateStreamingResponse(
    message: string,
    context?: ChatContext,
    options?: GenerationOptions
  ): AsyncGenerator<string, void, unknown> {
    try {
      const modelName = options?.model ?? this.model;
      const model = this.client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
          topP: options?.topP,
          stopSequences: options?.stop,
        },
        systemInstruction: context?.systemPrompt,
      });

      // Build chat history for context (same as non-streaming)
      const history: Array<{
        role: 'user' | 'model';
        parts: Array<{ text: string }>;
      }> = [];

      if (context?.messages) {
        for (const msg of context.messages) {
          if (msg.role === 'user') {
            history.push({
              role: 'user',
              parts: [{ text: msg.content }],
            });
          } else if (msg.role === 'assistant') {
            history.push({
              role: 'model',
              parts: [{ text: msg.content }],
            });
          }
        }
      }

      let result;
      if (history.length > 0) {
        const chat = model.startChat({ history });
        result = await chat.sendMessageStream(message);
      } else {
        result = await model.generateContentStream(message);
      }

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield chunkText;
        }
      }

      // Update usage tracking (approximate for streaming)
      this.usage.requests++;
      this.usage.tokens += 150; // Estimate
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error('Unknown error');
      throw new Error(`Google streaming error: ${this.lastError.message}`, { cause: error });
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<string[]> {
    // Google AI Studio doesn't provide a models list endpoint in the SDK
    // Return supported models from capabilities
    return this.capabilities.supportedModels ?? [];
  }

  /**
   * Test connection to Google AI API
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
