import type { ChatMessage, ChatContext } from '../types/ChatbotTypes';

/**
 * Manages conversation history and context for chat sessions
 * Handles message storage, retrieval, and conversation lifecycle
 */
export class ConversationManager {
  private conversations: Map<string, ChatMessage[]> = new Map();
  private readonly maxHistoryLength: number;
  private readonly sessionTimeout: number; // in milliseconds
  private sessionLastActivity: Map<string, number> = new Map();

  constructor(options: { maxHistoryLength?: number; sessionTimeoutMinutes?: number } = {}) {
    this.maxHistoryLength = options.maxHistoryLength ?? 100;
    this.sessionTimeout = (options.sessionTimeoutMinutes ?? 60) * 60 * 1000; // Convert to milliseconds

    // Start cleanup task
    this.startCleanupTask();
  }

  /**
   * Get conversation history for a session
   */
  public getConversationHistory(sessionId: string): ChatMessage[] {
    this.updateSessionActivity(sessionId);
    return this.conversations.get(sessionId) ?? [];
  }

  /**
   * Add a message to conversation history
   */
  public addMessage(sessionId: string, message: ChatMessage): void {
    this.updateSessionActivity(sessionId);

    let messages = this.conversations.get(sessionId) ?? [];
    messages.push(message);

    // Trim history if it exceeds max length
    if (messages.length > this.maxHistoryLength) {
      messages = messages.slice(-this.maxHistoryLength);
    }

    this.conversations.set(sessionId, messages);
  }

  /**
   * Add multiple messages to conversation history
   */
  public addMessages(sessionId: string, messages: ChatMessage[]): void {
    for (const message of messages) {
      this.addMessage(sessionId, message);
    }
  }

  /**
   * Clear conversation history for a session
   */
  public clearConversation(sessionId: string): void {
    this.conversations.delete(sessionId);
    this.sessionLastActivity.delete(sessionId);
  }

  /**
   * Clear all conversations
   */
  public clearAllConversations(): void {
    this.conversations.clear();
    this.sessionLastActivity.clear();
  }

  /**
   * Get conversation context with history and metadata
   */
  public getConversationContext(
    sessionId: string,
    userId?: string,
    systemPrompt?: string,
    metadata?: Record<string, unknown>
  ): ChatContext {
    const messages = this.getConversationHistory(sessionId);

    return {
      messages,
      sessionId,
      userId: userId ?? 'anonymous',
      systemPrompt,
      metadata: metadata ?? {},
    };
  }

  /**
   * Get recent messages from conversation (useful for context window management)
   */
  public getRecentMessages(sessionId: string, count: number): ChatMessage[] {
    const messages = this.getConversationHistory(sessionId);
    return messages.slice(-count);
  }

  /**
   * Get messages since a specific timestamp
   */
  public getMessagesSince(sessionId: string, since: Date): ChatMessage[] {
    const messages = this.getConversationHistory(sessionId);
    return messages.filter((message) => message.timestamp && message.timestamp >= since);
  }

  /**
   * Get conversation statistics
   */
  public getConversationStats(sessionId: string): {
    messageCount: number;
    userMessages: number;
    assistantMessages: number;
    systemMessages: number;
    firstMessage?: Date;
    lastMessage?: Date;
  } {
    const messages = this.getConversationHistory(sessionId);

    const firstMsg = messages.length > 0 ? messages[0] : undefined;
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : undefined;

    const stats = {
      messageCount: messages.length,
      userMessages: messages.filter((m) => m.role === 'user').length,
      assistantMessages: messages.filter((m) => m.role === 'assistant').length,
      systemMessages: messages.filter((m) => m.role === 'system').length,
      firstMessage: firstMsg?.timestamp,
      lastMessage: lastMsg?.timestamp,
    };

    return stats;
  }

  /**
   * Get all active session IDs
   */
  public getActiveSessions(): string[] {
    const now = Date.now();
    const activeSessions: string[] = [];

    for (const [sessionId, lastActivity] of this.sessionLastActivity.entries()) {
      if (now - lastActivity < this.sessionTimeout) {
        activeSessions.push(sessionId);
      }
    }

    return activeSessions;
  }

  /**
   * Check if a session is active
   */
  public isSessionActive(sessionId: string): boolean {
    const lastActivity = this.sessionLastActivity.get(sessionId);
    if (!lastActivity) return false;

    const now = Date.now();
    return now - lastActivity < this.sessionTimeout;
  }

  /**
   * Get session count
   */
  public getSessionCount(): number {
    return this.getActiveSessions().length;
  }

  /**
   * Export conversation for backup/analysis
   */
  public exportConversation(sessionId: string): {
    sessionId: string;
    messages: ChatMessage[];
    stats: ReturnType<ConversationManager['getConversationStats']>;
    exportedAt: Date;
  } {
    return {
      sessionId,
      messages: this.getConversationHistory(sessionId),
      stats: this.getConversationStats(sessionId),
      exportedAt: new Date(),
    };
  }

  /**
   * Import conversation from backup
   */
  public importConversation(sessionId: string, messages: ChatMessage[], overwrite = false): void {
    if (!overwrite && this.conversations.has(sessionId)) {
      throw new Error(`Session ${sessionId} already exists. Use overwrite=true to replace.`);
    }

    // Validate messages
    for (const message of messages) {
      if (!message.id || !message.role || !message.content || !message.timestamp) {
        throw new Error('Invalid message format in import data');
      }
    }

    this.conversations.set(sessionId, [...messages]);
    this.updateSessionActivity(sessionId);
  }

  /**
   * Update session activity timestamp
   */
  private updateSessionActivity(sessionId: string): void {
    this.sessionLastActivity.set(sessionId, Date.now());
  }

  /**
   * Start background task to clean up expired sessions
   */
  private startCleanupTask(): void {
    setInterval(
      () => {
        this.cleanupExpiredSessions();
      },
      5 * 60 * 1000
    ); // Run every 5 minutes
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [sessionId, lastActivity] of this.sessionLastActivity.entries()) {
      if (now - lastActivity >= this.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      this.clearConversation(sessionId);
    }
  }
}
