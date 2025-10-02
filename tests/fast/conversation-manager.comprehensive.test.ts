/**
 * Comprehensive ConversationManager tests to improve coverage
 */

describe('ConversationManager Comprehensive Tests', () => {
  describe('Configuration and Setup', () => {
    it('should create manager with custom configuration', async () => {
      const { ConversationManager } = await import('../../src/core/ConversationManager');

      const customConfig = {
        maxHistoryLength: 50,
        enablePersistence: false,
        enableCompression: true,
        compressionThreshold: 1000,
      };

      const manager = new ConversationManager(customConfig);

      expect(manager).toBeDefined();
    });

    it('should create manager with minimal configuration', async () => {
      const { ConversationManager } = await import('../../src/core/ConversationManager');

      const manager = new ConversationManager({ maxHistoryLength: 5 });

      expect(manager).toBeDefined();
    });
  });

  describe('Message Management', () => {
    it('should add multiple messages to same session', async () => {
      const { ConversationManager } = await import('../../src/core/ConversationManager');

      const manager = new ConversationManager({ maxHistoryLength: 10 });

      const messages = [
        {
          role: 'user' as const,
          content: 'Hello',
          timestamp: new Date(),
          id: 'msg-1',
          metadata: {},
        },
        {
          role: 'assistant' as const,
          content: 'Hi there!',
          timestamp: new Date(),
          id: 'msg-2',
          metadata: {},
        },
        {
          role: 'user' as const,
          content: 'How are you?',
          timestamp: new Date(),
          id: 'msg-3',
          metadata: {},
        },
      ];

      messages.forEach((msg) => {
        manager.addMessage('session-1', msg);
      });

      const history = manager.getConversationHistory('session-1');
      expect(history).toHaveLength(3);
      expect(history[0].content).toBe('Hello');
      expect(history[1].content).toBe('Hi there!');
      expect(history[2].content).toBe('How are you?');
    });

    it('should respect maxHistoryLength limit', async () => {
      const { ConversationManager } = await import('../../src/core/ConversationManager');

      const manager = new ConversationManager({ maxHistoryLength: 2 });

      // Add more messages than the limit
      for (let i = 1; i <= 5; i++) {
        manager.addMessage('session-1', {
          role: 'user' as const,
          content: `Message ${i}`,
          timestamp: new Date(),
          id: `msg-${i}`,
          metadata: {},
        });
      }

      const history = manager.getConversationHistory('session-1');
      expect(history).toHaveLength(2);
      // Should keep the most recent messages
      expect(history[0].content).toBe('Message 4');
      expect(history[1].content).toBe('Message 5');
    });

    it('should handle messages with metadata', async () => {
      const { ConversationManager } = await import('../../src/core/ConversationManager');

      const manager = new ConversationManager({ maxHistoryLength: 10 });

      const messageWithMetadata = {
        role: 'user' as const,
        content: 'Test message',
        timestamp: new Date(),
        id: 'msg-1',
        metadata: {
          userAgent: 'test-browser',
          ipAddress: '127.0.0.1',
          sessionData: { theme: 'dark' },
        },
      };

      manager.addMessage('session-1', messageWithMetadata);

      const history = manager.getConversationHistory('session-1');
      expect(history).toHaveLength(1);
      expect(history[0].metadata).toEqual(messageWithMetadata.metadata);
    });

    it('should handle system messages', async () => {
      const { ConversationManager } = await import('../../src/core/ConversationManager');

      const manager = new ConversationManager({ maxHistoryLength: 10 });

      const systemMessage = {
        role: 'system' as const,
        content: 'You are a helpful assistant.',
        timestamp: new Date(),
        id: 'sys-1',
        metadata: {},
      };

      manager.addMessage('session-1', systemMessage);

      const history = manager.getConversationHistory('session-1');
      expect(history).toHaveLength(1);
      expect(history[0].role).toBe('system');
    });
  });

  describe('Session Management', () => {
    it('should handle multiple independent sessions', async () => {
      const { ConversationManager } = await import('../../src/core/ConversationManager');

      const manager = new ConversationManager({ maxHistoryLength: 10 });

      // Add messages to different sessions
      manager.addMessage('session-a', {
        role: 'user' as const,
        content: 'Session A message',
        timestamp: new Date(),
        id: 'a-1',
        metadata: {},
      });

      manager.addMessage('session-b', {
        role: 'user' as const,
        content: 'Session B message',
        timestamp: new Date(),
        id: 'b-1',
        metadata: {},
      });

      manager.addMessage('session-c', {
        role: 'user' as const,
        content: 'Session C message',
        timestamp: new Date(),
        id: 'c-1',
        metadata: {},
      });

      // Each session should be independent
      expect(manager.getConversationHistory('session-a')).toHaveLength(1);
      expect(manager.getConversationHistory('session-b')).toHaveLength(1);
      expect(manager.getConversationHistory('session-c')).toHaveLength(1);

      expect(manager.getConversationHistory('session-a')[0].content).toBe('Session A message');
      expect(manager.getConversationHistory('session-b')[0].content).toBe('Session B message');
      expect(manager.getConversationHistory('session-c')[0].content).toBe('Session C message');
    });

    it('should return empty array for non-existent session', async () => {
      const { ConversationManager } = await import('../../src/core/ConversationManager');

      const manager = new ConversationManager({ maxHistoryLength: 10 });

      const history = manager.getConversationHistory('non-existent-session');
      expect(Array.isArray(history)).toBe(true);
      expect(history).toHaveLength(0);
    });

    it('should clear session history', async () => {
      const { ConversationManager } = await import('../../src/core/ConversationManager');

      const manager = new ConversationManager({ maxHistoryLength: 10 });

      // Add some messages
      manager.addMessage('session-1', {
        role: 'user' as const,
        content: 'Message 1',
        timestamp: new Date(),
        id: 'msg-1',
        metadata: {},
      });

      manager.addMessage('session-1', {
        role: 'assistant' as const,
        content: 'Response 1',
        timestamp: new Date(),
        id: 'msg-2',
        metadata: {},
      });

      expect(manager.getConversationHistory('session-1')).toHaveLength(2);

      // Clear the session
      manager.clearConversation('session-1');

      expect(manager.getConversationHistory('session-1')).toHaveLength(0);
    });

    it('should get all active sessions', async () => {
      const { ConversationManager } = await import('../../src/core/ConversationManager');

      const manager = new ConversationManager({ maxHistoryLength: 10 });

      // Add messages to multiple sessions
      ['session-1', 'session-2', 'session-3'].forEach((sessionId, index) => {
        manager.addMessage(sessionId, {
          role: 'user' as const,
          content: `Message for ${sessionId}`,
          timestamp: new Date(),
          id: `msg-${index}`,
          metadata: {},
        });
      });

      const activeSessions = manager.getActiveSessions();
      expect(Array.isArray(activeSessions)).toBe(true);
      expect(activeSessions).toHaveLength(3);
      expect(activeSessions).toContain('session-1');
      expect(activeSessions).toContain('session-2');
      expect(activeSessions).toContain('session-3');
    });
  });

  describe('Advanced Features', () => {
    it('should get conversation summary', async () => {
      const { ConversationManager } = await import('../../src/core/ConversationManager');

      const manager = new ConversationManager({ maxHistoryLength: 10 });

      // Add multiple messages
      for (let i = 1; i <= 5; i++) {
        manager.addMessage('session-1', {
          role: i % 2 === 1 ? ('user' as const) : ('assistant' as const),
          content: `Message ${i}`,
          timestamp: new Date(),
          id: `msg-${i}`,
          metadata: {},
        });
      }

      const summary = manager.getConversationStats('session-1');

      expect(summary).toBeDefined();
      expect(summary).toHaveProperty('messageCount');
      expect(summary).toHaveProperty('userMessages');
      expect(summary).toHaveProperty('assistantMessages');
      expect(summary).toHaveProperty('firstMessage');
      expect(summary).toHaveProperty('lastMessage');
      expect(summary.messageCount).toBe(5);
    });

    it('should get empty summary for non-existent session', async () => {
      const { ConversationManager } = await import('../../src/core/ConversationManager');

      const manager = new ConversationManager({ maxHistoryLength: 10 });

      const summary = manager.getConversationStats('non-existent');

      expect(summary).toBeDefined();
      expect(summary.messageCount).toBe(0);
      expect(summary.userMessages).toBe(0);
      expect(summary.assistantMessages).toBe(0);
    });

    it('should export and import conversation', async () => {
      const { ConversationManager } = await import('../../src/core/ConversationManager');

      const manager = new ConversationManager({ maxHistoryLength: 10 });

      // Add some messages
      manager.addMessage('session-1', {
        role: 'user' as const,
        content: 'Hello',
        timestamp: new Date(),
        id: 'msg-1',
        metadata: {},
      });

      manager.addMessage('session-1', {
        role: 'assistant' as const,
        content: 'Hi there!',
        timestamp: new Date(),
        id: 'msg-2',
        metadata: {},
      });

      // Export conversation
      const exported = manager.exportConversation('session-1');

      expect(exported).toBeDefined();
      expect(exported).toHaveProperty('sessionId');
      expect(exported).toHaveProperty('messages');
      expect(exported.sessionId).toBe('session-1');
      expect(exported.messages).toHaveLength(2);

      // Clear and import
      manager.clearConversation('session-1');
      expect(manager.getConversationHistory('session-1')).toHaveLength(0);

      manager.importConversation('session-1', exported.messages);
      expect(manager.getConversationHistory('session-1')).toHaveLength(2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty message content', async () => {
      const { ConversationManager } = await import('../../src/core/ConversationManager');

      const manager = new ConversationManager({ maxHistoryLength: 10 });

      const emptyMessage = {
        role: 'user' as const,
        content: '',
        timestamp: new Date(),
        id: 'empty-msg',
        metadata: {},
      };

      expect(() => {
        manager.addMessage('session-1', emptyMessage);
      }).not.toThrow();

      const history = manager.getConversationHistory('session-1');
      expect(history).toHaveLength(1);
      expect(history[0].content).toBe('');
    });

    it('should handle very long message content', async () => {
      const { ConversationManager } = await import('../../src/core/ConversationManager');

      const manager = new ConversationManager({ maxHistoryLength: 10 });

      const longContent = 'A'.repeat(10000); // Very long message

      const longMessage = {
        role: 'user' as const,
        content: longContent,
        timestamp: new Date(),
        id: 'long-msg',
        metadata: {},
      };

      expect(() => {
        manager.addMessage('session-1', longMessage);
      }).not.toThrow();

      const history = manager.getConversationHistory('session-1');
      expect(history).toHaveLength(1);
      expect(history[0].content).toBe(longContent);
    });

    it('should handle special characters in session ID', async () => {
      const { ConversationManager } = await import('../../src/core/ConversationManager');

      const manager = new ConversationManager({ maxHistoryLength: 10 });

      const specialSessionId = 'session-with-special-chars!@#$%^&*()';

      manager.addMessage(specialSessionId, {
        role: 'user' as const,
        content: 'Test message',
        timestamp: new Date(),
        id: 'msg-1',
        metadata: {},
      });

      const history = manager.getConversationHistory(specialSessionId);
      expect(history).toHaveLength(1);
    });

    it('should handle low maxHistoryLength', async () => {
      const { ConversationManager } = await import('../../src/core/ConversationManager');

      const manager = new ConversationManager({ maxHistoryLength: 1 });

      manager.addMessage('session-1', {
        role: 'user' as const,
        content: 'First message',
        timestamp: new Date(),
        id: 'msg-1',
        metadata: {},
      });

      manager.addMessage('session-1', {
        role: 'user' as const,
        content: 'Second message',
        timestamp: new Date(),
        id: 'msg-2',
        metadata: {},
      });

      const history = manager.getConversationHistory('session-1');
      expect(history).toHaveLength(1);
      expect(history[0].content).toBe('Second message'); // Should keep the latest
    });
  });
});
