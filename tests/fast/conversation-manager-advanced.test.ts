/**
 * Comprehensive ConversationManager Tests
 * Targeting conversation flow, message management, session lifecycle
 */

import { ConversationManager } from '../../src/core/ConversationManager';
import type { ChatMessage } from '../../src/types';

describe('ConversationManager - Advanced Coverage', () => {
  let conversationManager: ConversationManager;
  const testSessionId = 'test-session-123';
  const testUserId = 'user-456';

  beforeEach(() => {
    conversationManager = new ConversationManager();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default configuration', () => {
      const manager = new ConversationManager();
      expect(manager).toBeInstanceOf(ConversationManager);
      expect(manager.getSessionCount()).toBe(0);
    });

    it('should initialize with custom configuration', () => {
      const config = {
        maxHistoryLength: 50,
        sessionTimeout: 600000, // 10 minutes
        enableCleanupTask: false,
      };
      const manager = new ConversationManager(config);
      expect(manager).toBeInstanceOf(ConversationManager);
    });
  });

  describe('Message Management', () => {
    it('should add single message to conversation', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello world',
        timestamp: new Date(),
      };

      conversationManager.addMessage(testSessionId, message);
      const history = conversationManager.getConversationHistory(testSessionId);

      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(message);
    });

    it('should add multiple messages at once', () => {
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date(Date.now() - 1000),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Hi there!',
          timestamp: new Date(),
        },
      ];

      conversationManager.addMessages(testSessionId, messages);
      const history = conversationManager.getConversationHistory(testSessionId);

      expect(history).toHaveLength(2);
      expect(history).toEqual(messages);
    });

    it('should maintain message order', () => {
      const message1: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'First message',
        timestamp: new Date(Date.now() - 2000),
      };
      const message2: ChatMessage = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Second message',
        timestamp: new Date(Date.now() - 1000),
      };
      const message3: ChatMessage = {
        id: 'msg-3',
        role: 'user',
        content: 'Third message',
        timestamp: new Date(),
      };

      conversationManager.addMessage(testSessionId, message1);
      conversationManager.addMessage(testSessionId, message2);
      conversationManager.addMessage(testSessionId, message3);

      const history = conversationManager.getConversationHistory(testSessionId);
      expect(history).toEqual([message1, message2, message3]);
    });

    it('should handle empty message arrays', () => {
      conversationManager.addMessages(testSessionId, []);
      const history = conversationManager.getConversationHistory(testSessionId);
      expect(history).toHaveLength(0);
    });
  });

  describe('Conversation History Management', () => {
    beforeEach(() => {
      // Add some test messages
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date(Date.now() - 3000),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Hi!',
          timestamp: new Date(Date.now() - 2000),
        },
        {
          id: 'msg-3',
          role: 'user',
          content: 'How are you?',
          timestamp: new Date(Date.now() - 1000),
        },
        {
          id: 'msg-4',
          role: 'assistant',
          content: 'Good!',
          timestamp: new Date(),
        },
      ];
      conversationManager.addMessages(testSessionId, messages);
    });

    it('should get complete conversation history', () => {
      const history = conversationManager.getConversationHistory(testSessionId);
      expect(history).toHaveLength(4);
      expect(history[0].content).toBe('Hello');
      expect(history[3].content).toBe('Good!');
    });

    it('should return empty array for non-existent session', () => {
      const history = conversationManager.getConversationHistory('non-existent');
      expect(history).toEqual([]);
    });

    it('should get recent messages with specified count', () => {
      const recent = conversationManager.getRecentMessages(testSessionId, 2);
      expect(recent).toHaveLength(2);
      expect(recent[0].content).toBe('How are you?');
      expect(recent[1].content).toBe('Good!');
    });

    it('should handle count larger than available messages', () => {
      const recent = conversationManager.getRecentMessages(testSessionId, 10);
      expect(recent).toHaveLength(4);
    });

    it('should get messages since specific timestamp', () => {
      const since = new Date(Date.now() - 1500);
      const recentMessages = conversationManager.getMessagesSince(testSessionId, since);
      expect(recentMessages).toHaveLength(2);
      expect(recentMessages[0].content).toBe('How are you?');
    });

    it('should return empty array when no messages since timestamp', () => {
      const since = new Date(Date.now() + 1000); // Future timestamp
      const recentMessages = conversationManager.getMessagesSince(testSessionId, since);
      expect(recentMessages).toEqual([]);
    });
  });

  describe('Conversation Context', () => {
    it('should create conversation context with minimal parameters', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Test message',
        timestamp: new Date(),
      };
      conversationManager.addMessage(testSessionId, message);

      const context = conversationManager.getConversationContext(testSessionId);

      expect(context.sessionId).toBe(testSessionId);
      expect(context.userId).toBe('anonymous');
      expect(context.messages).toHaveLength(1);
      expect(context.metadata).toEqual({});
      expect(context.systemPrompt).toBeUndefined();
    });

    it('should create conversation context with all parameters', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Test message',
        timestamp: new Date(),
      };
      conversationManager.addMessage(testSessionId, message);

      const systemPrompt = 'You are a helpful assistant';
      const metadata = { theme: 'dark', language: 'en' };

      const context = conversationManager.getConversationContext(
        testSessionId,
        testUserId,
        systemPrompt,
        metadata
      );

      expect(context.sessionId).toBe(testSessionId);
      expect(context.userId).toBe(testUserId);
      expect(context.systemPrompt).toBe(systemPrompt);
      expect(context.metadata).toBe(metadata);
      expect(context.messages).toHaveLength(1);
    });
  });

  describe('Conversation Statistics', () => {
    beforeEach(() => {
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'system',
          content: 'System message',
          timestamp: new Date(Date.now() - 4000),
        },
        {
          id: 'msg-2',
          role: 'user',
          content: 'User message 1',
          timestamp: new Date(Date.now() - 3000),
        },
        {
          id: 'msg-3',
          role: 'assistant',
          content: 'Assistant response',
          timestamp: new Date(Date.now() - 2000),
        },
        {
          id: 'msg-4',
          role: 'user',
          content: 'User message 2',
          timestamp: new Date(Date.now() - 1000),
        },
        {
          id: 'msg-5',
          role: 'assistant',
          content: 'Another response',
          timestamp: new Date(),
        },
      ];
      conversationManager.addMessages(testSessionId, messages);
    });

    it('should calculate conversation statistics correctly', () => {
      const stats = conversationManager.getConversationStats(testSessionId);

      expect(stats.messageCount).toBe(5);
      expect(stats.userMessages).toBe(2);
      expect(stats.assistantMessages).toBe(2);
      expect(stats.systemMessages).toBe(1);
      expect(stats.firstMessage).toBeDefined();
      expect(stats.lastMessage).toBeDefined();
      expect(stats.lastMessage!.getTime()).toBeGreaterThan(stats.firstMessage!.getTime());
    });

    it('should handle empty conversation stats', () => {
      const stats = conversationManager.getConversationStats('empty-session');

      expect(stats.messageCount).toBe(0);
      expect(stats.userMessages).toBe(0);
      expect(stats.assistantMessages).toBe(0);
      expect(stats.systemMessages).toBe(0);
      expect(stats.firstMessage).toBeUndefined();
      expect(stats.lastMessage).toBeUndefined();
    });
  });

  describe('Session Management', () => {
    it('should track session activity', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Test',
        timestamp: new Date(),
      };

      conversationManager.addMessage(testSessionId, message);
      expect(conversationManager.isSessionActive(testSessionId)).toBe(true);
    });

    it('should get active sessions', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Test',
        timestamp: new Date(),
      };

      conversationManager.addMessage('session-1', message);
      conversationManager.addMessage('session-2', message);

      const activeSessions = conversationManager.getActiveSessions();
      expect(activeSessions).toContain('session-1');
      expect(activeSessions).toContain('session-2');
      expect(activeSessions).toHaveLength(2);
    });

    it('should get session count', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Test',
        timestamp: new Date(),
      };

      conversationManager.addMessage('session-1', message);
      conversationManager.addMessage('session-2', message);
      conversationManager.addMessage('session-3', message);

      expect(conversationManager.getSessionCount()).toBe(3);
    });

    it('should detect inactive sessions', () => {
      expect(conversationManager.isSessionActive('non-existent')).toBe(false);
    });
  });

  describe('Conversation Clearing', () => {
    beforeEach(() => {
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date(),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Hi!',
          timestamp: new Date(),
        },
      ];
      conversationManager.addMessages(testSessionId, messages);
      conversationManager.addMessages('other-session', messages);
    });

    it('should clear specific conversation', () => {
      expect(conversationManager.getConversationHistory(testSessionId)).toHaveLength(2);

      conversationManager.clearConversation(testSessionId);

      expect(conversationManager.getConversationHistory(testSessionId)).toHaveLength(0);
      expect(conversationManager.getConversationHistory('other-session')).toHaveLength(2);
    });

    it('should clear all conversations', () => {
      expect(conversationManager.getSessionCount()).toBe(2);

      conversationManager.clearAllConversations();

      expect(conversationManager.getSessionCount()).toBe(0);
      expect(conversationManager.getConversationHistory(testSessionId)).toHaveLength(0);
      expect(conversationManager.getConversationHistory('other-session')).toHaveLength(0);
    });
  });

  describe('Import/Export Functionality', () => {
    const testMessages: ChatMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date(Date.now() - 1000),
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: new Date(),
      },
    ];

    beforeEach(() => {
      conversationManager.addMessages(testSessionId, testMessages);
    });

    it('should export conversation correctly', () => {
      const exported = conversationManager.exportConversation(testSessionId);

      expect(exported.sessionId).toBe(testSessionId);
      expect(exported.messages).toEqual(testMessages);
      expect(exported.stats.messageCount).toBe(2);
      expect(exported.exportedAt).toBeInstanceOf(Date);
    });

    it('should import conversation successfully', () => {
      const newSessionId = 'imported-session';

      conversationManager.importConversation(newSessionId, testMessages);

      const history = conversationManager.getConversationHistory(newSessionId);
      expect(history).toEqual(testMessages);
      expect(conversationManager.isSessionActive(newSessionId)).toBe(true);
    });

    it('should prevent import overwrite by default', () => {
      expect(() => {
        conversationManager.importConversation(testSessionId, testMessages);
      }).toThrow('Session test-session-123 already exists');
    });

    it('should allow import overwrite when specified', () => {
      const newMessages: ChatMessage[] = [
        {
          id: 'new-msg',
          role: 'user',
          content: 'New content',
          timestamp: new Date(),
        },
      ];

      conversationManager.importConversation(testSessionId, newMessages, true);

      const history = conversationManager.getConversationHistory(testSessionId);
      expect(history).toEqual(newMessages);
      expect(history).toHaveLength(1);
    });

    it('should validate message format during import', () => {
      const invalidMessages = [
        { id: 'msg-1', role: 'user' } as ChatMessage, // Missing content and timestamp
      ];

      expect(() => {
        conversationManager.importConversation('new-session', invalidMessages);
      }).toThrow('Invalid message format');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle messages with same timestamps', () => {
      const timestamp = new Date();
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'First',
          timestamp,
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Second',
          timestamp,
        },
      ];

      conversationManager.addMessages(testSessionId, messages);
      const recent = conversationManager.getMessagesSince(testSessionId, timestamp);

      expect(recent).toHaveLength(2);
    });

    it('should handle very large conversation history', () => {
      const messages: ChatMessage[] = [];
      for (let i = 0; i < 100; i++) {
        messages.push({
          id: `msg-${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          timestamp: new Date(Date.now() + i),
        });
      }

      conversationManager.addMessages(testSessionId, messages);
      const history = conversationManager.getConversationHistory(testSessionId);

      expect(history).toHaveLength(100);
      expect(history[0].content).toBe('Message 0');
      expect(history[99].content).toBe('Message 99');
    });

    it('should handle special characters in session IDs', () => {
      const specialSessionId = 'session-with-special-chars!@#$%^&*()';
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Test with special session ID',
        timestamp: new Date(),
      };

      conversationManager.addMessage(specialSessionId, message);
      const history = conversationManager.getConversationHistory(specialSessionId);

      expect(history).toHaveLength(1);
      expect(history[0].content).toBe('Test with special session ID');
    });

    it('should handle empty string session IDs', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Test with empty session',
        timestamp: new Date(),
      };

      conversationManager.addMessage('', message);
      const history = conversationManager.getConversationHistory('');

      expect(history).toHaveLength(1);
    });

    it('should handle messages with empty content', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: '',
        timestamp: new Date(),
      };

      conversationManager.addMessage(testSessionId, message);
      const history = conversationManager.getConversationHistory(testSessionId);

      expect(history).toHaveLength(1);
      expect(history[0].content).toBe('');
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle rapid message additions', () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        const message: ChatMessage = {
          id: `rapid-msg-${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Rapid message ${i}`,
          timestamp: new Date(startTime + i),
        };
        conversationManager.addMessage(testSessionId, message);
      }

      const history = conversationManager.getConversationHistory(testSessionId);
      expect(history).toHaveLength(100);
    });

    it('should maintain correct session count with multiple operations', () => {
      // Add messages to multiple sessions
      for (let i = 0; i < 10; i++) {
        const message: ChatMessage = {
          id: `msg-${i}`,
          role: 'user',
          content: `Message ${i}`,
          timestamp: new Date(),
        };
        conversationManager.addMessage(`session-${i}`, message);
      }

      expect(conversationManager.getSessionCount()).toBe(10);

      // Clear some sessions
      conversationManager.clearConversation('session-0');
      conversationManager.clearConversation('session-1');

      expect(conversationManager.getSessionCount()).toBe(8);
    });
  });
});

import { ConversationManager } from '../../src/core/ConversationManager';
import type { ChatMessage } from '../../src/types';

describe('ConversationManager - Advanced Coverage', () => {
  let conversationManager: ConversationManager;
  const testSessionId = 'test-session-123';
  const testUserId = 'user-456';

  beforeEach(() => {
    conversationManager = new ConversationManager();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default configuration', () => {
      const manager = new ConversationManager();
      expect(manager).toBeInstanceOf(ConversationManager);
      expect(manager.getSessionCount()).toBe(0);
    });

    it('should initialize with custom configuration', () => {
      const config = {
        maxHistoryLength: 50,
        sessionTimeout: 600000, // 10 minutes
        enableCleanupTask: false,
      };
      const manager = new ConversationManager(config);
      expect(manager).toBeInstanceOf(ConversationManager);
    });
  });

  describe('Message Management', () => {
    it('should add single message to conversation', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello world',
        timestamp: new Date(),
      };

      conversationManager.addMessage(testSessionId, message);
      const history = conversationManager.getConversationHistory(testSessionId);

      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(message);
    });

    it('should add multiple messages at once', () => {
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date(Date.now() - 1000),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Hi there!',
          timestamp: new Date(),
        },
      ];

      conversationManager.addMessages(testSessionId, messages);
      const history = conversationManager.getConversationHistory(testSessionId);

      expect(history).toHaveLength(2);
      expect(history).toEqual(messages);
    });

    it('should maintain message order', () => {
      const message1: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'First message',
        timestamp: new Date(Date.now() - 2000),
      };
      const message2: ChatMessage = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Second message',
        timestamp: new Date(Date.now() - 1000),
      };
      const message3: ChatMessage = {
        id: 'msg-3',
        role: 'user',
        content: 'Third message',
        timestamp: new Date(),
      };

      conversationManager.addMessage(testSessionId, message1);
      conversationManager.addMessage(testSessionId, message2);
      conversationManager.addMessage(testSessionId, message3);

      const history = conversationManager.getConversationHistory(testSessionId);
      expect(history).toEqual([message1, message2, message3]);
    });

    it('should handle empty message arrays', () => {
      conversationManager.addMessages(testSessionId, []);
      const history = conversationManager.getConversationHistory(testSessionId);
      expect(history).toHaveLength(0);
    });
  });

  describe('Conversation History Management', () => {
    beforeEach(() => {
      // Add some test messages
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date(Date.now() - 3000),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Hi!',
          timestamp: new Date(Date.now() - 2000),
        },
        {
          id: 'msg-3',
          role: 'user',
          content: 'How are you?',
          timestamp: new Date(Date.now() - 1000),
        },
        {
          id: 'msg-4',
          role: 'assistant',
          content: 'Good!',
          timestamp: new Date(),
        },
      ];
      conversationManager.addMessages(testSessionId, messages);
    });

    it('should get complete conversation history', () => {
      const history = conversationManager.getConversationHistory(testSessionId);
      expect(history).toHaveLength(4);
      expect(history[0].content).toBe('Hello');
      expect(history[3].content).toBe('Good!');
    });

    it('should return empty array for non-existent session', () => {
      const history = conversationManager.getConversationHistory('non-existent');
      expect(history).toEqual([]);
    });

    it('should get recent messages with specified count', () => {
      const recent = conversationManager.getRecentMessages(testSessionId, 2);
      expect(recent).toHaveLength(2);
      expect(recent[0].content).toBe('How are you?');
      expect(recent[1].content).toBe('Good!');
    });

    it('should handle count larger than available messages', () => {
      const recent = conversationManager.getRecentMessages(testSessionId, 10);
      expect(recent).toHaveLength(4);
    });

    it('should get messages since specific timestamp', () => {
      const since = new Date(Date.now() - 1500);
      const recentMessages = conversationManager.getMessagesSince(testSessionId, since);
      expect(recentMessages).toHaveLength(2);
      expect(recentMessages[0].content).toBe('How are you?');
    });

    it('should return empty array when no messages since timestamp', () => {
      const since = new Date(Date.now() + 1000); // Future timestamp
      const recentMessages = conversationManager.getMessagesSince(testSessionId, since);
      expect(recentMessages).toEqual([]);
    });
  });

  describe('Conversation Context', () => {
    it('should create conversation context with minimal parameters', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Test message',
        timestamp: new Date(),
      };
      conversationManager.addMessage(testSessionId, message);

      const context = conversationManager.getConversationContext(testSessionId);

      expect(context.sessionId).toBe(testSessionId);
      expect(context.userId).toBe('anonymous');
      expect(context.messages).toHaveLength(1);
      expect(context.metadata).toEqual({});
      expect(context.systemPrompt).toBeUndefined();
    });

    it('should create conversation context with all parameters', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Test message',
        timestamp: new Date(),
      };
      conversationManager.addMessage(testSessionId, message);

      const systemPrompt = 'You are a helpful assistant';
      const metadata = { theme: 'dark', language: 'en' };

      const context = conversationManager.getConversationContext(
        testSessionId,
        testUserId,
        systemPrompt,
        metadata
      );

      expect(context.sessionId).toBe(testSessionId);
      expect(context.userId).toBe(testUserId);
      expect(context.systemPrompt).toBe(systemPrompt);
      expect(context.metadata).toBe(metadata);
      expect(context.messages).toHaveLength(1);
    });
  });

  describe('Conversation Statistics', () => {
    beforeEach(() => {
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          role: 'system',
          content: 'System message',
          timestamp: new Date(Date.now() - 4000),
        },
        {
          id: 'msg-2',
          role: 'user',
          content: 'User message 1',
          timestamp: new Date(Date.now() - 3000),
        },
        {
          id: 'msg-3',
          role: 'assistant',
          content: 'Assistant response',
          timestamp: new Date(Date.now() - 2000),
        },
        {
          id: 'msg-4',
          role: 'user',
          content: 'User message 2',
          timestamp: new Date(Date.now() - 1000),
        },
        { id: 'msg-5', role: 'assistant', content: 'Another response', timestamp: new Date() },
      ];
      conversationManager.addMessages(testSessionId, messages);
    });

    it('should calculate conversation statistics correctly', () => {
      const stats = conversationManager.getConversationStats(testSessionId);

      expect(stats.messageCount).toBe(5);
      expect(stats.userMessages).toBe(2);
      expect(stats.assistantMessages).toBe(2);
      expect(stats.systemMessages).toBe(1);
      expect(stats.firstMessage).toBeDefined();
      expect(stats.lastMessage).toBeDefined();
      expect(stats.lastMessage!.getTime()).toBeGreaterThan(stats.firstMessage!.getTime());
    });

    it('should handle empty conversation stats', () => {
      const stats = conversationManager.getConversationStats('empty-session');

      expect(stats.messageCount).toBe(0);
      expect(stats.userMessages).toBe(0);
      expect(stats.assistantMessages).toBe(0);
      expect(stats.systemMessages).toBe(0);
      expect(stats.firstMessage).toBeUndefined();
      expect(stats.lastMessage).toBeUndefined();
    });
  });

  describe('Session Management', () => {
    it('should track session activity', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Test',
        timestamp: new Date(),
      };

      conversationManager.addMessage(testSessionId, message);
      expect(conversationManager.isSessionActive(testSessionId)).toBe(true);
    });

    it('should get active sessions', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Test',
        timestamp: new Date(),
      };

      conversationManager.addMessage('session-1', message);
      conversationManager.addMessage('session-2', message);

      const activeSessions = conversationManager.getActiveSessions();
      expect(activeSessions).toContain('session-1');
      expect(activeSessions).toContain('session-2');
      expect(activeSessions).toHaveLength(2);
    });

    it('should get session count', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Test',
        timestamp: new Date(),
      };

      conversationManager.addMessage('session-1', message);
      conversationManager.addMessage('session-2', message);
      conversationManager.addMessage('session-3', message);

      expect(conversationManager.getSessionCount()).toBe(3);
    });

    it('should detect inactive sessions', () => {
      expect(conversationManager.isSessionActive('non-existent')).toBe(false);
    });
  });

  describe('Conversation Clearing', () => {
    beforeEach(() => {
      const messages: ChatMessage[] = [
        { id: 'msg-1', role: 'user', content: 'Hello', timestamp: new Date() },
        { id: 'msg-2', role: 'assistant', content: 'Hi!', timestamp: new Date() },
      ];
      conversationManager.addMessages(testSessionId, messages);
      conversationManager.addMessages('other-session', messages);
    });

    it('should clear specific conversation', () => {
      expect(conversationManager.getConversationHistory(testSessionId)).toHaveLength(2);

      conversationManager.clearConversation(testSessionId);

      expect(conversationManager.getConversationHistory(testSessionId)).toHaveLength(0);
      expect(conversationManager.getConversationHistory('other-session')).toHaveLength(2);
    });

    it('should clear all conversations', () => {
      expect(conversationManager.getSessionCount()).toBe(2);

      conversationManager.clearAllConversations();

      expect(conversationManager.getSessionCount()).toBe(0);
      expect(conversationManager.getConversationHistory(testSessionId)).toHaveLength(0);
      expect(conversationManager.getConversationHistory('other-session')).toHaveLength(0);
    });
  });

  describe('Import/Export Functionality', () => {
    const testMessages: ChatMessage[] = [
      { id: 'msg-1', role: 'user', content: 'Hello', timestamp: new Date(Date.now() - 1000) },
      { id: 'msg-2', role: 'assistant', content: 'Hi there!', timestamp: new Date() },
    ];

    beforeEach(() => {
      conversationManager.addMessages(testSessionId, testMessages);
    });

    it('should export conversation correctly', () => {
      const exported = conversationManager.exportConversation(testSessionId);

      expect(exported.sessionId).toBe(testSessionId);
      expect(exported.messages).toEqual(testMessages);
      expect(exported.stats.messageCount).toBe(2);
      expect(exported.exportedAt).toBeInstanceOf(Date);
    });

    it('should import conversation successfully', () => {
      const newSessionId = 'imported-session';

      conversationManager.importConversation(newSessionId, testMessages);

      const history = conversationManager.getConversationHistory(newSessionId);
      expect(history).toEqual(testMessages);
      expect(conversationManager.isSessionActive(newSessionId)).toBe(true);
    });

    it('should prevent import overwrite by default', () => {
      expect(() => {
        conversationManager.importConversation(testSessionId, testMessages);
      }).toThrow('Session test-session-123 already exists');
    });

    it('should allow import overwrite when specified', () => {
      const newMessages: ChatMessage[] = [
        { id: 'new-msg', role: 'user', content: 'New content', timestamp: new Date() },
      ];

      conversationManager.importConversation(testSessionId, newMessages, true);

      const history = conversationManager.getConversationHistory(testSessionId);
      expect(history).toEqual(newMessages);
      expect(history).toHaveLength(1);
    });

    it('should validate message format during import', () => {
      const invalidMessages = [
        { id: 'msg-1', role: 'user' } as ChatMessage, // Missing content and timestamp
      ];

      expect(() => {
        conversationManager.importConversation('new-session', invalidMessages);
      }).toThrow('Invalid message format');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle messages with same timestamps', () => {
      const timestamp = new Date();
      const messages: ChatMessage[] = [
        { id: 'msg-1', role: 'user', content: 'First', timestamp },
        { id: 'msg-2', role: 'assistant', content: 'Second', timestamp },
      ];

      conversationManager.addMessages(testSessionId, messages);
      const recent = conversationManager.getMessagesSince(testSessionId, timestamp);

      expect(recent).toHaveLength(2);
    });

    it('should handle special characters in session IDs', () => {
      const specialSessionId = 'session-with-special-chars!@#$%^&*()';
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Test with special session ID',
        timestamp: new Date(),
      };

      conversationManager.addMessage(specialSessionId, message);
      const history = conversationManager.getConversationHistory(specialSessionId);

      expect(history).toHaveLength(1);
      expect(history[0].content).toBe('Test with special session ID');
    });

    it('should handle empty string session IDs', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Test with empty session',
        timestamp: new Date(),
      };

      conversationManager.addMessage('', message);
      const history = conversationManager.getConversationHistory('');

      expect(history).toHaveLength(1);
    });

    it('should handle messages with empty content', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: '',
        timestamp: new Date(),
      };

      conversationManager.addMessage(testSessionId, message);
      const history = conversationManager.getConversationHistory(testSessionId);

      expect(history).toHaveLength(1);
      expect(history[0].content).toBe('');
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle rapid message additions', () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        const message: ChatMessage = {
          id: `rapid-msg-${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Rapid message ${i}`,
          timestamp: new Date(startTime + i),
        };
        conversationManager.addMessage(testSessionId, message);
      }

      const history = conversationManager.getConversationHistory(testSessionId);
      expect(history).toHaveLength(100);
    });

    it('should maintain correct session count with multiple operations', () => {
      // Add messages to multiple sessions
      for (let i = 0; i < 10; i++) {
        const message: ChatMessage = {
          id: `msg-${i}`,
          role: 'user',
          content: `Message ${i}`,
          timestamp: new Date(),
        };
        conversationManager.addMessage(`session-${i}`, message);
      }

      expect(conversationManager.getSessionCount()).toBe(10);

      // Clear some sessions
      conversationManager.clearConversation('session-0');
      conversationManager.clearConversation('session-1');

      expect(conversationManager.getSessionCount()).toBe(8);
    });
  });
});
