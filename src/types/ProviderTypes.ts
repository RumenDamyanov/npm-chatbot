/**
 * AI provider type definitions for @rumenx/chatbot
 */

import type { AiProvider, ChatContext, ChatResponse, AiProviderConfig } from './ChatbotTypes';

/**
 * Provider capabilities interface
 */
export interface ProviderCapabilities {
  /** Maximum input tokens */
  maxInputTokens?: number;
  /** Maximum output tokens */
  maxOutputTokens?: number;
  /** Supported models */
  supportedModels?: string[];
  /** Supports streaming responses */
  supportsStreaming?: boolean;
  /** Supports function calling */
  supportsFunctionCalling?: boolean;
  /** Supports image input */
  supportsImageInput?: boolean;
  /** Supports audio input */
  supportsAudioInput?: boolean;
  /** Rate limits */
  rateLimits?: {
    requestsPerMinute?: number;
    requestsPerHour?: number;
    tokensPerMinute?: number;
  };
}

/**
 * Provider status information
 */
export interface ProviderStatus {
  /** Provider is available */
  available: boolean;
  /** Current model being used */
  model?: string;
  /** Provider version */
  version?: string;
  /** Current usage statistics */
  usage?: {
    /** Current request count */
    requests: number;
    /** Request limit */
    requestLimit?: number;
    /** Current token count */
    tokens: number;
    /** Token limit */
    tokenLimit?: number;
    /** Reset time for limits */
    resetAt?: Date;
  };
  /** Last error if any */
  lastError?: Error;
}

/**
 * Base AI provider interface
 */
export interface IAiProvider {
  /** Provider name */
  readonly name: AiProvider;

  /** Provider capabilities */
  readonly capabilities: ProviderCapabilities;

  /** Check if provider is configured and available */
  isAvailable(): Promise<boolean>;

  /** Generate chat response */
  generateResponse(
    message: string,
    context?: ChatContext,
    options?: GenerationOptions
  ): Promise<ChatResponse>;

  /** Generate streaming chat response */
  generateStreamingResponse(
    message: string,
    context?: ChatContext,
    options?: GenerationOptions
  ): AsyncGenerator<string, void, unknown>;

  /** Get provider status */
  getStatus(): Promise<ProviderStatus>;

  /** Update provider configuration */
  updateConfig(config: Partial<AiProviderConfig>): void;

  /** Validate provider configuration */
  validateConfig(config: AiProviderConfig): Promise<boolean>;
}

/**
 * Generation options for provider requests
 */
export interface GenerationOptions {
  /** Model to use for this request */
  model?: string;
  /** Temperature for generation */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Stop sequences */
  stop?: string[];
  /** Top-p sampling */
  topP?: number;
  /** Frequency penalty */
  frequencyPenalty?: number;
  /** Presence penalty */
  presencePenalty?: number;
  /** Enable streaming */
  stream?: boolean;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Request timeout */
  timeout?: number;
}

/**
 * Streaming response interface
 */
export interface StreamingResponse {
  /** Async iterator for response chunks */
  [Symbol.asyncIterator](): AsyncIterator<string>;
  /** Stop streaming */
  stop(): void;
  /** Check if streaming is complete */
  isComplete(): boolean;
}

/**
 * Provider factory interface
 */
export interface IProviderFactory {
  /** Create provider instance */
  createProvider(config: AiProviderConfig): IAiProvider;

  /** Get list of supported providers */
  getSupportedProviders(): AiProvider[];

  /** Check if provider is supported */
  isProviderSupported(provider: AiProvider): boolean;

  /** Get default configuration for provider */
  getDefaultConfig(provider: AiProvider): Partial<AiProviderConfig>;
}

/**
 * Provider-specific configuration interfaces
 */

/**
 * OpenAI provider configuration
 */
export interface OpenAiProviderConfig extends AiProviderConfig {
  provider: 'openai';
  /** OpenAI API key */
  apiKey: string;
  /** Organization ID */
  organizationId?: string;
  /** Base URL for API */
  baseUrl?: string;
  /** Default model */
  model?: 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo' | string;
}

/**
 * Anthropic provider configuration
 */
export interface AnthropicProviderConfig extends AiProviderConfig {
  provider: 'anthropic';
  /** Anthropic API key */
  apiKey: string;
  /** Default model */
  model?:
    | 'claude-3-opus-20240229'
    | 'claude-3-sonnet-20240229'
    | 'claude-3-haiku-20240307'
    | string;
  /** API version */
  apiVersion?: string;
}

/**
 * Google AI provider configuration
 */
export interface GoogleProviderConfig extends AiProviderConfig {
  provider: 'google';
  /** Google AI API key */
  apiKey: string;
  /** Default model */
  model?: 'gemini-pro' | 'gemini-pro-vision' | string;
  /** Project ID */
  projectId?: string;
}

/**
 * Meta provider configuration
 */
export interface MetaProviderConfig extends AiProviderConfig {
  provider: 'meta';
  /** Meta API key */
  apiKey: string;
  /** Default model */
  model?: 'llama-2-70b' | 'llama-2-13b' | 'llama-2-7b' | string;
  /** API endpoint */
  endpoint?: string;
}

/**
 * xAI provider configuration
 */
export interface XaiProviderConfig extends AiProviderConfig {
  provider: 'xai';
  /** xAI API key */
  apiKey: string;
  /** Default model */
  model?: 'grok-1' | 'grok-1.5' | string;
}

/**
 * DeepSeek provider configuration
 */
export interface DeepSeekProviderConfig extends AiProviderConfig {
  provider: 'deepseek';
  /** DeepSeek API key */
  apiKey: string;
  /** Default model */
  model?: 'deepseek-chat' | 'deepseek-coder' | string;
}

/**
 * Ollama provider configuration
 */
export interface OllamaProviderConfig extends AiProviderConfig {
  provider: 'ollama';
  /** Ollama API URL */
  apiUrl: string;
  /** Default model */
  model: string;
  /** API key (if authentication is enabled) */
  apiKey?: string;
}

/**
 * Default provider configuration
 */
export interface DefaultProviderConfig extends AiProviderConfig {
  provider: 'default';
  /** Default responses */
  responses?: string[];
  /** Response delay simulation */
  delay?: number;
}

/**
 * Union type for all provider configurations
 */
export type ProviderConfig =
  | OpenAiProviderConfig
  | AnthropicProviderConfig
  | GoogleProviderConfig
  | MetaProviderConfig
  | XaiProviderConfig
  | DeepSeekProviderConfig
  | OllamaProviderConfig
  | DefaultProviderConfig;
