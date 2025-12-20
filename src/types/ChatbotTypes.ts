/**
 * Core chatbot type definitions for @rumenx/chatbot
 */

/**
 * Supported AI providers
 */
export type AiProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'meta'
  | 'xai'
  | 'deepseek'
  | 'ollama'
  | 'default';

/**
 * Chat message roles
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * Chat message interface
 */
export interface ChatMessage {
  /** Message role */
  role: MessageRole;
  /** Message content */
  content: string;
  /** Optional message metadata */
  metadata?: Record<string, unknown>;
  /** Message timestamp */
  timestamp?: Date;
  /** Message ID */
  id?: string;
}

/**
 * Chat conversation context
 */
export interface ChatContext {
  /** Conversation messages */
  messages: ChatMessage[];
  /** Custom system prompt */
  systemPrompt?: string;
  /** Additional context data */
  metadata?: Record<string, unknown>;
  /** User ID for tracking */
  userId?: string;
  /** Session ID */
  sessionId?: string;
}

/**
 * Chat response from AI provider
 */
export interface ChatResponse {
  /** Response content */
  content: string;
  /** Provider that generated the response */
  provider: AiProvider;
  /** Response metadata */
  metadata?: {
    /** Model used */
    model?: string;
    /** Token usage */
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    /** Response time in milliseconds */
    responseTime?: number;
    /** Additional provider-specific data */
    [key: string]: unknown;
  };
  /** Response timestamp */
  timestamp: Date;
}

/**
 * Streaming chat response chunk
 */
export interface ChatStreamChunk {
  /** Chunk content */
  content: string;
  /** Chunk type */
  type: 'content' | 'metadata' | 'done';
  /** Provider that generated the chunk */
  provider: AiProvider;
  /** Chunk metadata */
  metadata?: Record<string, unknown>;
  /** Chunk timestamp */
  timestamp: Date;
}

/**
 * Chat request configuration
 */
export interface ChatRequest {
  /** User message */
  message: string;
  /** Conversation context */
  context?: ChatContext;
  /** Request-specific configuration */
  config?: Partial<ChatbotConfig>;
  /** Additional request metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Chatbot configuration interface
 */
export interface ChatbotConfig {
  /** AI provider configuration */
  provider: AiProviderConfig;
  /** Default system prompt */
  systemPrompt?: string;
  /** Maximum conversation history */
  maxHistory?: number;
  /** Temperature for generation */
  temperature?: number;
  /** Maximum tokens for generation */
  maxTokens?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Enable conversation memory */
  enableMemory?: boolean;
  /** Security and filtering options */
  security?: SecurityConfig;
  /** Rate limiting configuration */
  rateLimit?: RateLimitConfig;
  /** Logging configuration */
  logging?: LoggingConfig;
}

/**
 * AI provider configuration
 */
export interface AiProviderConfig {
  /** Provider name */
  provider: AiProvider;
  /** API key */
  apiKey?: string;
  /** Custom API URL */
  apiUrl?: string;
  /** API endpoint (alias for apiUrl, used by some providers) */
  endpoint?: string;
  /** Model name */
  model?: string;
  /** Organization ID (for some providers) */
  organizationId?: string;
  /** Additional provider-specific options */
  options?: Record<string, unknown>;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  /** Enable input filtering */
  enableInputFilter?: boolean;
  /** Enable output filtering */
  enableOutputFilter?: boolean;
  /** Profanity filter settings */
  profanityFilter?: {
    enabled: boolean;
    strictMode?: boolean;
    customWords?: string[];
  };
  /** Content safety settings */
  contentSafety?: {
    enabled: boolean;
    categories?: string[];
    threshold?: number;
  };
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  /** Enable rate limiting */
  enabled?: boolean;
  /** Requests per minute */
  requestsPerMinute?: number;
  /** Requests per hour */
  requestsPerHour?: number;
  /** Requests per day */
  requestsPerDay?: number;
  /** Rate limit key generator */
  keyGenerator?: (context: any) => string;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  /** Enable logging */
  enabled?: boolean;
  /** Log level */
  level?: 'debug' | 'info' | 'warn' | 'error';
  /** Log conversations */
  logConversations?: boolean;
  /** Log provider requests */
  logProviderRequests?: boolean;
  /** Custom logger */
  logger?: Logger;
}

/**
 * Logger interface
 */
export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
}

/**
 * Chatbot error types
 */
export type ChatbotErrorType =
  | 'PROVIDER_ERROR'
  | 'CONFIGURATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'SECURITY_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Chatbot error class
 */
export class ChatbotError extends Error {
  public readonly type: ChatbotErrorType;
  public readonly provider?: AiProvider | undefined;
  public readonly code?: string | undefined;
  public readonly metadata?: Record<string, unknown> | undefined;

  constructor(
    message: string,
    type: ChatbotErrorType,
    provider?: AiProvider,
    code?: string,
    metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ChatbotError';
    this.type = type;
    this.provider = provider;
    this.code = code;
    this.metadata = metadata;
  }
}
