/**
 * Main Chatbot orchestrator class
 *
 * This is the primary interface for the @rumenx/chatbot package.
 * It manages provider interactions, conversation context, and configuration.
 */

import type {
  ChatbotConfig,
  ChatRequest,
  ChatResponse,
  ChatStreamChunk,
  ChatContext,
  ChatMessage,
  Logger,
} from '../types/ChatbotTypes';
import type { IAiProvider, ProviderStatus } from '../types/ProviderTypes';
import { ChatbotError } from '../types/ChatbotTypes';
import { ProviderFactory } from '../providers/ProviderFactory';
import { ConversationManager } from './ConversationManager';
import { SecurityManager } from './SecurityManager';
import { RateLimiter } from '../utils/RateLimiter';
import { DefaultLogger } from '../utils/Logger';

/**
 * Main Chatbot class
 */
export class Chatbot {
  private readonly config: ChatbotConfig;
  private readonly provider: IAiProvider;
  private readonly conversationManager: ConversationManager;
  private readonly securityManager: SecurityManager;
  private readonly rateLimiter?: RateLimiter;
  private readonly logger: Logger;

  /**
   * Create a new Chatbot instance
   */
  constructor(config: ChatbotConfig) {
    this.config = this.validateAndNormalizeConfig(config);
    this.logger =
      config.logging?.logger ?? new DefaultLogger({ level: config.logging?.level ?? 'info' });

    try {
      // Initialize provider
      this.provider = ProviderFactory.createProvider(config);

      // Initialize managers
      this.conversationManager = new ConversationManager({
        maxHistoryLength: config.maxHistory ?? 10,
        sessionTimeoutMinutes: 60,
      });

      this.securityManager = new SecurityManager(config.security);

      // Initialize rate limiter if configured
      if (config.rateLimit) {
        this.rateLimiter = new RateLimiter(config.rateLimit);
      }

      this.logger.info('Chatbot initialized successfully', {
        provider: config.provider.provider,
        model: config.provider.model,
        enableMemory: config.enableMemory,
        maxHistory: config.maxHistory,
      });
    } catch (error) {
      this.logger.error('Failed to initialize chatbot', error as Error, { config });
      throw new ChatbotError(
        `Failed to initialize chatbot: ${(error as Error).message}`,
        'CONFIGURATION_ERROR'
      );
    }
  }

  /**
   * Send a message and get a response
   */
  async chat(request: string | ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      // Normalize request
      const chatRequest = this.normalizeRequest(request);

      // Validate input
      await this.validateRequest(chatRequest);

      // Check rate limits
      if (this.rateLimiter) {
        const userId = (chatRequest.metadata?.['userId'] as string) || 'anonymous';
        await this.rateLimiter.checkLimit(userId);
      }

      // Apply security filters to input - validate the user message
      const userMessage: ChatMessage = {
        role: 'user',
        content: chatRequest.message,
        timestamp: new Date(),
        id: this.generateMessageId(),
        metadata: chatRequest.metadata ?? {},
      };

      const inputValidation = await this.securityManager.validateInput(
        userMessage,
        (chatRequest.metadata?.['userId'] as string) || 'anonymous',
        (chatRequest.metadata?.['sessionId'] as string) || this.generateSessionId()
      );

      if (!inputValidation.isValid) {
        throw new ChatbotError(
          `Input validation failed: ${inputValidation.reason}`,
          'VALIDATION_ERROR'
        );
      }

      const validatedMessage = inputValidation.filteredMessage ?? userMessage;

      // Get or create conversation context
      const context = this.getConversationContext(chatRequest);

      // Add user message to context
      const sessionId = context.sessionId ?? this.generateSessionId();
      this.conversationManager.addMessage(sessionId, validatedMessage);

      this.logger.debug('Processing chat request', {
        userId: (chatRequest.metadata?.['userId'] as string) || 'anonymous',
        sessionId: context.sessionId,
        messageLength: validatedMessage.content.length,
      });

      // Generate response from provider
      const response = await this.provider.generateResponse(validatedMessage.content, context, {
        temperature: chatRequest.config?.temperature ?? this.config.temperature ?? undefined,
        maxTokens: chatRequest.config?.maxTokens ?? this.config.maxTokens ?? undefined,
        timeout: chatRequest.config?.timeout ?? this.config.timeout ?? undefined,
      });

      // Apply security filters to output - create proper ChatResponse first
      const rawResponse: ChatResponse = {
        content: response.content || '',
        timestamp: new Date(),
        provider: this.config.provider.provider ?? 'unknown',
        metadata: {
          ...((response.metadata as Record<string, unknown>) || {}),
          processingTime: Date.now() - startTime,
        },
      };

      const filteredResponse = await this.securityManager.filterOutput(
        rawResponse,
        (chatRequest.metadata?.['userId'] as string) || 'anonymous',
        (chatRequest.metadata?.['sessionId'] as string) || context.sessionId
      );

      // Create assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: filteredResponse.content,
        timestamp: filteredResponse.timestamp,
        id: this.generateMessageId(),
        metadata: filteredResponse.metadata ?? {},
      };

      // Update conversation context
      if (this.config.enableMemory !== false) {
        const sessionId = context.sessionId ?? this.generateSessionId();
        this.conversationManager.addMessage(sessionId, assistantMessage);
      }

      // Create final response
      const finalResponse: ChatResponse = {
        ...filteredResponse,
        metadata: {
          ...filteredResponse.metadata,
          processingTime: Date.now() - startTime,
          userId: (chatRequest.metadata?.['userId'] as string) || 'anonymous',
          sessionId: context.sessionId,
        },
      };

      this.logger.info('Chat request completed', {
        provider: this.config.provider.provider,
        model: filteredResponse.metadata?.['model'] as string,
        processingTime: finalResponse.metadata?.['processingTime'] as number,
        tokenUsage: filteredResponse.metadata?.['usage'],
      });

      return finalResponse;
    } catch (error) {
      const processingTime = Date.now() - startTime;

      this.logger.error('Chat request failed', error as Error, {
        processingTime,
        request: typeof request === 'string' ? { message: request } : request,
      });

      if (error instanceof ChatbotError) {
        throw error;
      }

      throw new ChatbotError(
        `Chat request failed: ${(error as Error).message}`,
        'UNKNOWN_ERROR',
        this.config.provider.provider,
        undefined,
        { processingTime }
      );
    }
  }

  /**
   * Send a message and get a streaming response
   */
  async *chatStream(request: string | ChatRequest): AsyncGenerator<ChatStreamChunk, void, unknown> {
    const startTime = Date.now();

    try {
      // Normalize request
      const chatRequest = this.normalizeRequest(request);

      // Validate input
      await this.validateRequest(chatRequest);

      // Check rate limits
      if (this.rateLimiter) {
        const userId = (chatRequest.metadata?.['userId'] as string) || 'anonymous';
        await this.rateLimiter.checkLimit(userId);
      }

      // Apply security filters to input - validate the user message
      const userMessage: ChatMessage = {
        role: 'user',
        content: chatRequest.message,
        timestamp: new Date(),
        id: this.generateMessageId(),
        metadata: chatRequest.metadata ?? {},
      };

      const inputValidation = await this.securityManager.validateInput(
        userMessage,
        (chatRequest.metadata?.['userId'] as string) || 'anonymous',
        (chatRequest.metadata?.['sessionId'] as string) || this.generateSessionId()
      );

      if (!inputValidation.isValid) {
        throw new ChatbotError(
          `Input validation failed: ${inputValidation.reason}`,
          'VALIDATION_ERROR'
        );
      }

      const validatedMessage = inputValidation.filteredMessage ?? userMessage;

      // Get or create conversation context
      const context = this.getConversationContext(chatRequest);

      // Add user message to context
      const sessionId = context.sessionId ?? this.generateSessionId();
      this.conversationManager.addMessage(sessionId, validatedMessage);

      this.logger.debug('Processing streaming chat request', {
        userId: (chatRequest.metadata?.['userId'] as string) || 'anonymous',
        sessionId: context.sessionId,
        messageLength: validatedMessage.content.length,
      });

      // Generate streaming response from provider
      const streamGenerator = this.provider.generateStreamingResponse(
        validatedMessage.content,
        context,
        {
          temperature: chatRequest.config?.temperature ?? this.config.temperature ?? undefined,
          maxTokens: chatRequest.config?.maxTokens ?? this.config.maxTokens ?? undefined,
          timeout: chatRequest.config?.timeout ?? this.config.timeout ?? undefined,
        }
      );

      let fullContent = '';
      let chunkCount = 0;

      // Stream response chunks
      for await (const chunk of streamGenerator) {
        fullContent += chunk;
        chunkCount++;

        const streamChunk: ChatStreamChunk = {
          content: chunk,
          type: 'content',
          provider: this.config.provider.provider,
          timestamp: new Date(),
          metadata: {
            chunkIndex: chunkCount,
            sessionId: context.sessionId,
            userId: (chatRequest.metadata?.['userId'] as string) || 'anonymous',
          },
        };

        yield streamChunk;
      }

      // Create final assistant message for conversation memory
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: fullContent,
        timestamp: new Date(),
        id: this.generateMessageId(),
        metadata: {
          streamedResponse: true,
          chunkCount,
          processingTime: Date.now() - startTime,
        },
      };

      // Apply security filters to final content
      const mockResponse: ChatResponse = {
        content: fullContent,
        timestamp: new Date(),
        provider: this.config.provider.provider,
        metadata: {
          processingTime: Date.now() - startTime,
        },
      };

      const filteredResponse = await this.securityManager.filterOutput(
        mockResponse,
        (chatRequest.metadata?.['userId'] as string) || 'anonymous',
        (chatRequest.metadata?.['sessionId'] as string) || context.sessionId
      );

      // Update conversation context with filtered content
      if (this.config.enableMemory !== false) {
        assistantMessage.content = filteredResponse.content;
        this.conversationManager.addMessage(sessionId, assistantMessage);
      }

      // Send final chunk with metadata
      const finalChunk: ChatStreamChunk = {
        content: '',
        type: 'done',
        provider: this.config.provider.provider,
        timestamp: new Date(),
        metadata: {
          totalChunks: chunkCount,
          finalContent: filteredResponse.content,
          processingTime: Date.now() - startTime,
          sessionId: context.sessionId,
          userId: (chatRequest.metadata?.['userId'] as string) || 'anonymous',
          usage: mockResponse.metadata?.['usage'],
        },
      };

      yield finalChunk;

      this.logger.info('Streaming chat request completed', {
        provider: this.config.provider.provider,
        chunkCount,
        processingTime: Date.now() - startTime,
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;

      this.logger.error('Streaming chat request failed', error as Error, {
        processingTime,
        request: typeof request === 'string' ? { message: request } : request,
      });

      // Yield error chunk
      const errorChunk: ChatStreamChunk = {
        content: '',
        type: 'done',
        provider: this.config.provider.provider,
        timestamp: new Date(),
        metadata: {
          error: (error as Error).message,
          processingTime,
        },
      };

      yield errorChunk;

      if (error instanceof ChatbotError) {
        throw error;
      }

      throw new ChatbotError(
        `Streaming chat request failed: ${(error as Error).message}`,
        'UNKNOWN_ERROR',
        this.config.provider.provider,
        undefined,
        { processingTime }
      );
    }
  }

  /**
   * Get conversation history for a session
   */
  getConversationHistory(sessionId: string): ChatMessage[] {
    return this.conversationManager.getConversationHistory(sessionId);
  }

  /**
   * Clear conversation history for a session
   */
  clearConversation(sessionId: string): void {
    this.conversationManager.clearConversation(sessionId);
    this.logger.debug('Conversation cleared', { sessionId });
  }

  /**
   * Get provider status
   */
  async getProviderStatus(): Promise<ProviderStatus> {
    return this.provider.getStatus();
  }

  /**
   * Update chatbot configuration
   */
  updateConfig(updates: Partial<ChatbotConfig>): void {
    Object.assign(this.config, updates);

    if (updates.provider) {
      this.provider.updateConfig(updates.provider);
    }

    this.logger.info('Configuration updated', { updates });
  }

  /**
   * Validate and normalize configuration
   */
  private validateAndNormalizeConfig(config: ChatbotConfig): ChatbotConfig {
    if (!config.provider) {
      throw new ChatbotError('Provider configuration is required', 'CONFIGURATION_ERROR');
    }

    return {
      maxHistory: 10,
      temperature: 0.7,
      maxTokens: 1000,
      timeout: 30000,
      enableMemory: true,
      ...config,
    };
  }

  /**
   * Normalize request input
   */
  private normalizeRequest(request: string | ChatRequest): ChatRequest {
    if (typeof request === 'string') {
      return {
        message: request,
        metadata: {},
      };
    }

    return {
      metadata: {},
      ...request,
    };
  }

  /**
   * Validate chat request
   */
  private async validateRequest(request: ChatRequest): Promise<void> {
    if (!request.message || typeof request.message !== 'string') {
      throw new ChatbotError('Message is required and must be a string', 'VALIDATION_ERROR');
    }

    if (request.message.trim().length === 0) {
      throw new ChatbotError('Message cannot be empty', 'VALIDATION_ERROR');
    }

    if (request.message.length > 10000) {
      throw new ChatbotError('Message is too long (maximum 10,000 characters)', 'VALIDATION_ERROR');
    }
  }

  /**
   * Get or create conversation context
   */
  private getConversationContext(request: ChatRequest): ChatContext {
    if (request.context) {
      return request.context;
    }

    const sessionId = (request.metadata?.['sessionId'] as string) ?? this.generateSessionId();

    // Try to get existing conversation
    const existingMessages = this.conversationManager.getConversationHistory(sessionId);

    const context: ChatContext = {
      messages: existingMessages,
      sessionId,
      userId: (request.metadata?.['userId'] as string) ?? 'anonymous',
      systemPrompt: this.config.systemPrompt ?? '',
      metadata: request.metadata ?? {},
    };

    // Add system message if configured and not already present
    if (
      this.config.systemPrompt &&
      !existingMessages.some((m: ChatMessage) => m.role === 'system')
    ) {
      const systemMessage: ChatMessage = {
        role: 'system',
        content: this.config.systemPrompt,
        timestamp: new Date(),
        id: this.generateMessageId(),
        metadata: {},
      };
      context.messages.unshift(systemMessage);
    }

    return context;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
