/**
 * Main entry point for @rumenx/chatbot
 */

// Core classes
export { Chatbot } from './core/Chatbot';
export { ConfigurationValidator } from './core/ConfigurationValidator';
export { ErrorHandler } from './core/ErrorHandler';

// Types
export type * from './types';
export type { ChatStreamChunk } from './types/ChatbotTypes';

// Version info
export const VERSION = '1.0.1';
