import { SecurityManager } from '../../src/core/SecurityManager';
import type { ChatMessage, ChatResponse } from '../../src/types/ChatbotTypes';

describe('SecurityManager', () => {
  let securityManager: SecurityManager;
  const mockMessage: ChatMessage = {
    role: 'user',
    content: 'Hello world',
    timestamp: new Date(),
  };

  beforeEach(() => {
    securityManager = new SecurityManager();
  });

  describe('Constructor', () => {
    it('should initialize with default policy', () => {
      const policy = securityManager.getPolicy();
      expect(policy.maxInputLength).toBe(5000);
      expect(policy.maxMessageLength).toBe(10000);
      expect(policy.blockedWords).toEqual(['spam', 'scam', 'phishing', 'malware', 'virus']);
      expect(policy.removePersonalInfo).toBe(true);
      expect(policy.maskSensitiveData).toBe(true);
      expect(policy.logSecurityEvents).toBe(true);
      expect(policy.logLevel).toBe('warn');
    });

    it('should initialize with custom policy', () => {
      const customConfig = {
        enableInputFilter: true,
        enableOutputFilter: false,
        contentSafety: {
          enabled: false,
        },
      };
      const customManager = new SecurityManager(customConfig);
      const policy = customManager.getPolicy();
      expect(policy.enableInputValidation).toBe(true);
      expect(policy.enableOutputFiltering).toBe(false);
      expect(policy.removePersonalInfo).toBe(false);
      expect(policy.maskSensitiveData).toBe(false);
    });
  });

  describe('validateInput', () => {
    it('should validate normal input', async () => {
      const result = await securityManager.validateInput(mockMessage, 'user-1', 'session-1');
      expect(result.isValid).toBe(true);
      expect(result.filteredMessage).toEqual(mockMessage);
    });

    it('should reject input exceeding max length', async () => {
      const longMessage: ChatMessage = {
        ...mockMessage,
        content: 'a'.repeat(5001),
      };
      const result = await securityManager.validateInput(longMessage, 'user-1', 'session-1');
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Input exceeds maximum length');
    });

    it('should reject empty input', async () => {
      const emptyMessage: ChatMessage = {
        ...mockMessage,
        content: '   ',
      };
      const result = await securityManager.validateInput(emptyMessage, 'user-1', 'session-1');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Empty input not allowed');
    });

    it('should reject blocked words', async () => {
      const blockedMessage: ChatMessage = {
        ...mockMessage,
        content: 'This message contains spam content',
      };
      const result = await securityManager.validateInput(blockedMessage, 'user-1', 'session-1');
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Contains blocked word');
    });

    it('should mask email patterns when maskSensitiveData is true', async () => {
      const sensitiveMessage: ChatMessage = {
        ...mockMessage,
        content: 'Contact me at test@example.com',
      };
      const result = await securityManager.validateInput(sensitiveMessage, 'user-1', 'session-1');
      expect(result.isValid).toBe(true);
      expect(result.filteredMessage?.content).toBe('Contact me at [MASKED]');
    });

    it('should mask credit card patterns when enabled', async () => {
      const cardMessage: ChatMessage = {
        ...mockMessage,
        content: 'My card is 1234 5678 9012 3456',
      };
      const result = await securityManager.validateInput(cardMessage, 'user-1', 'session-1');
      expect(result.isValid).toBe(true);
      expect(result.filteredMessage?.content).toBe('My card is [MASKED]');
    });

    it('should mask SSN patterns when enabled', async () => {
      const ssnMessage: ChatMessage = {
        ...mockMessage,
        content: 'My SSN is 123-45-6789',
      };
      const result = await securityManager.validateInput(ssnMessage, 'user-1', 'session-1');
      expect(result.isValid).toBe(true);
      expect(result.filteredMessage?.content).toBe('My SSN is [MASKED]');
    });

    it('should log security events for blocked content', async () => {
      const blockedMessage: ChatMessage = {
        ...mockMessage,
        content: 'This contains virus content',
      };
      await securityManager.validateInput(blockedMessage, 'user-1', 'session-1');

      const events = securityManager.getSecurityEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('blocked_content');
      expect(events[0].userId).toBe('user-1');
      expect(events[0].sessionId).toBe('session-1');
    });
  });

  describe('filterOutput', () => {
    const mockResponse: ChatResponse = {
      content: 'This is a response',
      provider: 'openai',
      timestamp: new Date(),
      metadata: {},
    };

    it('should filter normal output', async () => {
      const result = await securityManager.filterOutput(mockResponse, 'user-1', 'session-1');
      expect(result.content).toBe('This is a response');
      expect(result.metadata?.securityFiltered).toBe(false);
    });

    it('should block output exceeding max message length', async () => {
      const longResponse: ChatResponse = {
        ...mockResponse,
        content: 'a'.repeat(10001),
      };
      const result = await securityManager.filterOutput(longResponse, 'user-1', 'session-1');
      expect(result.content).toBe(
        'I apologize, but I cannot provide that response due to content policy restrictions.'
      );
      expect(result.metadata?.securityFiltered).toBe(true);
      expect(result.metadata?.originalContentBlocked).toBe(true);
    });

    it('should block output with blocked words', async () => {
      const blockedResponse: ChatResponse = {
        ...mockResponse,
        content: 'This response contains malware information',
      };
      const result = await securityManager.filterOutput(blockedResponse, 'user-1', 'session-1');
      expect(result.content).toBe(
        'I apologize, but I cannot provide that response due to content policy restrictions.'
      );
      expect(result.metadata?.originalContentBlocked).toBe(true);
    });

    it('should mask sensitive information in output', async () => {
      const sensitiveResponse: ChatResponse = {
        ...mockResponse,
        content: 'Contact support at support@company.com or call 555-999-8888',
      };
      const result = await securityManager.filterOutput(sensitiveResponse, 'user-1', 'session-1');
      expect(result.content).toBe('Contact support at [EMAIL] or call [PHONE]');
      expect(result.metadata?.securityFiltered).toBe(true);
    });
  });

  describe('Security Event Management', () => {
    beforeEach(() => {
      securityManager.clearSecurityEvents();
    });

    it('should get all security events', () => {
      const events = securityManager.getSecurityEvents();
      expect(events).toEqual([]);
    });

    it('should get limited security events', async () => {
      const blockedMessage: ChatMessage = {
        ...mockMessage,
        content: 'spam content',
      };
      await securityManager.validateInput(blockedMessage, 'user-1', 'session-1');
      await securityManager.validateInput(blockedMessage, 'user-2', 'session-2');
      await securityManager.validateInput(blockedMessage, 'user-3', 'session-3');

      const limitedEvents = securityManager.getSecurityEvents(2);
      expect(limitedEvents).toHaveLength(2);
    });

    it('should get security events by type', async () => {
      const blockedMessage: ChatMessage = {
        ...mockMessage,
        content: 'spam content',
      };
      const longMessage: ChatMessage = {
        ...mockMessage,
        content: 'a'.repeat(5001),
      };

      await securityManager.validateInput(blockedMessage, 'user-1', 'session-1');
      await securityManager.validateInput(longMessage, 'user-2', 'session-2');

      const blockedContentEvents = securityManager.getSecurityEventsByType('blocked_content');
      expect(blockedContentEvents).toHaveLength(1);

      const invalidInputEvents = securityManager.getSecurityEventsByType('invalid_input');
      expect(invalidInputEvents).toHaveLength(1);
    });

    it('should clear security events', async () => {
      const blockedMessage: ChatMessage = {
        ...mockMessage,
        content: 'spam content',
      };
      await securityManager.validateInput(blockedMessage, 'user-1', 'session-1');

      expect(securityManager.getSecurityEvents()).toHaveLength(1);

      securityManager.clearSecurityEvents();
      expect(securityManager.getSecurityEvents()).toHaveLength(0);
    });
  });

  describe('Policy Management', () => {
    it('should update policy', () => {
      securityManager.updatePolicy({
        maxInputLength: 8000,
      });

      const updatedPolicy = securityManager.getPolicy();
      expect(updatedPolicy.maxInputLength).toBe(8000);
      expect(updatedPolicy.maxMessageLength).toBe(10000); // Should preserve original
    });

    it('should return copy of policy (not reference)', () => {
      const policy1 = securityManager.getPolicy();
      const policy2 = securityManager.getPolicy();

      expect(policy1).toEqual(policy2);
      expect(policy1).not.toBe(policy2); // Different objects
    });
  });

  describe('Security Statistics', () => {
    beforeEach(() => {
      securityManager.clearSecurityEvents();
    });

    it('should return empty stats when no events', () => {
      const stats = securityManager.getSecurityStats();
      expect(stats.totalEvents).toBe(0);
      expect(stats.eventsByType).toEqual({});
      expect(stats.recentEvents).toBe(0);
    });

    it('should count events by type', async () => {
      const blockedMessage: ChatMessage = {
        ...mockMessage,
        content: 'spam content',
      };
      const longMessage: ChatMessage = {
        ...mockMessage,
        content: 'a'.repeat(5001),
      };

      await securityManager.validateInput(blockedMessage, 'user-1', 'session-1');
      await securityManager.validateInput(blockedMessage, 'user-2', 'session-2');
      await securityManager.validateInput(longMessage, 'user-3', 'session-3');

      const stats = securityManager.getSecurityStats();
      expect(stats.totalEvents).toBe(3);
      expect(stats.eventsByType.blocked_content).toBe(2);
      expect(stats.eventsByType.invalid_input).toBe(1);
      expect(stats.recentEvents).toBe(3); // All should be recent
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple sensitive patterns in one message', async () => {
      const complexMessage: ChatMessage = {
        ...mockMessage,
        content: 'Contact John at john@company.com, SSN 123-45-6789, card 1234 5678 9012 3456',
      };

      const result = await securityManager.validateInput(complexMessage, 'user-1', 'session-1');
      expect(result.isValid).toBe(true);
      expect(result.filteredMessage?.content).toBe(
        'Contact John at [MASKED], SSN [MASKED], card [MASKED]'
      );
    });

    it('should handle disabled content filtering', async () => {
      const customConfig = {
        enableInputFilter: false,
      };
      const customManager = new SecurityManager(customConfig);

      const blockedMessage: ChatMessage = {
        ...mockMessage,
        content: 'This contains spam content',
      };

      const result = await customManager.validateInput(blockedMessage, 'user-1', 'session-1');
      expect(result.isValid).toBe(true); // Should pass because content filtering is disabled
    });

    it('should handle disabled output filtering', async () => {
      const customConfig = {
        enableOutputFilter: false,
      };
      const customManager = new SecurityManager(customConfig);

      const sensitiveResponse: ChatResponse = {
        content: 'Email me at test@example.com',
        provider: 'openai',
        timestamp: new Date(),
      };

      const result = await customManager.filterOutput(sensitiveResponse, 'user-1', 'session-1');
      expect(result.content).toBe('Email me at test@example.com');
    });
  });
});
