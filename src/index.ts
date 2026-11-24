/**
 * Main entry point for @rumenx/chatbot
 *
 * The version is a literal. Importing ../package.json from this file is
 * compiled into dist, where that relative path points at a missing
 * dist/package.json and Node cannot load the package.
 */

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

// Keep this equal to package.json "version". tests/fast/version.test.ts checks it.
export const VERSION = '2.1.1';
