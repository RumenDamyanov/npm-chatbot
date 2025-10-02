/**
 * Type definitions index for @rumenx/chatbot
 *
 * Re-exports all type definitions for easy consumption
 */

// Core chatbot types
export type {
  AiProvider,
  MessageRole,
  ChatMessage,
  ChatContext,
  ChatResponse,
  ChatRequest,
  ChatbotConfig,
  AiProviderConfig,
  SecurityConfig,
  RateLimitConfig,
  LoggingConfig,
  Logger,
  ChatbotErrorType,
} from './ChatbotTypes';

export { ChatbotError } from './ChatbotTypes';

// Provider types
export type {
  ProviderCapabilities,
  ProviderStatus,
  IAiProvider,
  GenerationOptions,
  StreamingResponse,
  IProviderFactory,
  OpenAiProviderConfig,
  AnthropicProviderConfig,
  GoogleProviderConfig,
  MetaProviderConfig,
  XaiProviderConfig,
  DeepSeekProviderConfig,
  OllamaProviderConfig,
  DefaultProviderConfig,
  ProviderConfig,
} from './ProviderTypes';
