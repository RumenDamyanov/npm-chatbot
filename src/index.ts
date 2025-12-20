/**
 * Main entry point for @rumenx/chatbot
 */

import packageJson from '../package.json';

// Core classes
export { Chatbot } from './core/Chatbot';
export { ConfigurationValidator } from './core/ConfigurationValidator';
export { ErrorHandler } from './core/ErrorHandler';

// Middleware
export { MessageFilterMiddleware, DEFAULT_FILTER_CONFIG } from './middleware';
export type { MessageFilterConfig, FilterResult } from './middleware';

// Services
export { ContentModerationService } from './services';
export type {
  ModerationResult,
  ModerationConfig,
  ModerationCategories,
  ModerationCategoryScores,
} from './services';

// Types
export type * from './types';
export type { ChatStreamChunk } from './types/ChatbotTypes';

// Version info (dynamically imported from package.json)
export const VERSION = packageJson.version;
