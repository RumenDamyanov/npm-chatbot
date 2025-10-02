/**
 * Working SecurityManager tests that match the actual API
 */

describe('SecurityManager Working Tests', () => {
  describe('SecurityManager Creation and Configuration', () => {
    it('should create security manager with default configuration', async () => {
      const { SecurityManager } = await import('../../src/core/SecurityManager');
      
      const manager = new SecurityManager();
      
      expect(manager).toBeDefined();
    });

    it('should create security manager with custom configuration', async () => {
      const { SecurityManager } = await import('../../src/core/SecurityManager');
      
      const customConfig = {
        enableInputFilter: true,
        enableOutputFilter: true,
        contentSafety: {
          enabled: true,
          level: 'strict' as const,
        },
      };
      
      const manager = new SecurityManager(customConfig);
      
      expect(manager).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should validate basic text input', async () => {
      const { SecurityManager } = await import('../../src/core/SecurityManager');
      
      const manager = new SecurityManager();
      const validMessage = {
        content: 'This is a valid message for the chatbot.',
        role: 'user' as const,
        timestamp: new Date(),
      };
      
      const result = await manager.validateInput(validMessage);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.filteredMessage).toBeDefined();
    });

    it('should reject input that is too long', async () => {
      const { SecurityManager } = await import('../../src/core/SecurityManager');
      
      const manager = new SecurityManager();
      const longMessage = {
        content: 'A'.repeat(6000), // Exceeds default 5000 limit
        role: 'user' as const,
        timestamp: new Date(),
      };
      
      const result = await manager.validateInput(longMessage);
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('exceeds maximum length');
    });

    it('should detect blocked words', async () => {
      const { SecurityManager } = await import('../../src/core/SecurityManager');
      
      const manager = new SecurityManager();
      
      const spamMessage = {
        content: 'This contains spam content',
        role: 'user' as const,
        timestamp: new Date(),
      };
      
      const result = await manager.validateInput(spamMessage);
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('blocked word');
    });

    it('should handle empty inputs', async () => {
      const { SecurityManager } = await import('../../src/core/SecurityManager');
      
      const manager = new SecurityManager();
      
      const emptyMessage = {
        content: '',
        role: 'user' as const,
        timestamp: new Date(),
      };
      
      const result = await manager.validateInput(emptyMessage);
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Empty input');
    });
  });

  describe('Output Filtering', () => {
    it('should filter safe output', async () => {
      const { SecurityManager } = await import('../../src/core/SecurityManager');
      
      const manager = new SecurityManager();
      const safeResponse = {
        content: 'This is a safe response from the AI.',
        provider: 'openai' as const,
        model: 'gpt-4',
        timestamp: new Date(),
        usage: { inputTokens: 10, outputTokens: 15, totalTokens: 25 },
      };
      
      const result = await manager.filterOutput(safeResponse);
      
      expect(result).toBeDefined();
      expect(result.content).toBe(safeResponse.content);
    });

    it('should mask sensitive information in output', async () => {
      const { SecurityManager } = await import('../../src/core/SecurityManager');
      
      const manager = new SecurityManager();
      const sensitiveResponse = {
        content: 'Contact me at john@example.com or call 555-123-4567',
        provider: 'openai' as const,
        model: 'gpt-4',
        timestamp: new Date(),
        usage: { inputTokens: 10, outputTokens: 15, totalTokens: 25 },
      };
      
      const result = await manager.filterOutput(sensitiveResponse);
      
      expect(result.content).toContain('[EMAIL]');
      expect(result.content).toContain('[PHONE]');
      expect(result.metadata?.securityFiltered).toBe(true);
    });

    it('should block harmful output content', async () => {
      const { SecurityManager } = await import('../../src/core/SecurityManager');
      
      const manager = new SecurityManager();
      const harmfulResponse = {
        content: 'This response contains spam and malware instructions',
        provider: 'openai' as const,
        model: 'gpt-4',
        timestamp: new Date(),
        usage: { inputTokens: 10, outputTokens: 15, totalTokens: 25 },
      };
      
      const result = await manager.filterOutput(harmfulResponse);
      
      expect(result.content).toContain('content policy restrictions');
      expect(result.metadata?.originalContentBlocked).toBe(true);
    });
  });

  describe('Security Events and Logging', () => {
    it('should log security events', async () => {
      const { SecurityManager } = await import('../../src/core/SecurityManager');
      
      const manager = new SecurityManager();
      const blockedMessage = {
        content: 'This contains spam content',
        role: 'user' as const,
        timestamp: new Date(),
      };
      
      await manager.validateInput(blockedMessage, 'test-user', 'test-session');
      
      const events = manager.getSecurityEvents();
      expect(events.length).toBeGreaterThan(0);
      
      const lastEvent = events[events.length - 1];
      expect(lastEvent.type).toBe('blocked_content');
      expect(lastEvent.message).toContain('Content blocked');
    });

    it('should get security events by type', async () => {
      const { SecurityManager } = await import('../../src/core/SecurityManager');
      
      const manager = new SecurityManager();
      
      // Generate different types of events
      const spamMessage = {
        content: 'spam content',
        role: 'user' as const,
        timestamp: new Date(),
      };
      const emptyMessage = {
        content: '',
        role: 'user' as const,
        timestamp: new Date(),
      };
      
      await manager.validateInput(spamMessage);
      await manager.validateInput(emptyMessage);
      
      const blockedEvents = manager.getSecurityEventsByType('blocked_content');
      const invalidEvents = manager.getSecurityEventsByType('invalid_input');
      
      expect(blockedEvents.length).toBeGreaterThan(0);
      expect(invalidEvents.length).toBeGreaterThan(0);
    });

    it('should provide security statistics', async () => {
      const { SecurityManager } = await import('../../src/core/SecurityManager');
      
      const manager = new SecurityManager();
      
      // Generate some events
      const testMessage = {
        content: 'spam content',
        role: 'user' as const,
        timestamp: new Date(),
      };
      
      await manager.validateInput(testMessage);
      
      const stats = manager.getSecurityStats();
      
      expect(stats).toBeDefined();
      expect(stats.totalEvents).toBeGreaterThan(0);
      expect(stats.eventsByType).toBeDefined();
      expect(stats.recentEvents).toBeDefined();
    });

    it('should clear security events', async () => {
      const { SecurityManager } = await import('../../src/core/SecurityManager');
      
      const manager = new SecurityManager();
      
      // Generate an event
      const testMessage = {
        content: 'spam content',
        role: 'user' as const,
        timestamp: new Date(),
      };
      
      await manager.validateInput(testMessage);
      expect(manager.getSecurityEvents().length).toBeGreaterThan(0);
      
      manager.clearSecurityEvents();
      expect(manager.getSecurityEvents()).toEqual([]);
    });
  });

  describe('Policy Management', () => {
    it('should get current security policy', async () => {
      const { SecurityManager } = await import('../../src/core/SecurityManager');
      
      const manager = new SecurityManager();
      const policy = manager.getPolicy();
      
      expect(policy).toBeDefined();
      expect(policy).toHaveProperty('enableContentFiltering');
      expect(policy).toHaveProperty('enableInputValidation');
      expect(policy).toHaveProperty('enableOutputFiltering');
      expect(policy).toHaveProperty('maxMessageLength');
      expect(policy).toHaveProperty('maxInputLength');
    });

    it('should update security policy', async () => {
      const { SecurityManager } = await import('../../src/core/SecurityManager');
      
      const manager = new SecurityManager();
      
      const updates = {
        maxInputLength: 2000,
        maxMessageLength: 8000,
        enableContentFiltering: false,
      };
      
      manager.updatePolicy(updates);
      const updatedPolicy = manager.getPolicy();
      
      expect(updatedPolicy.maxInputLength).toBe(2000);
      expect(updatedPolicy.maxMessageLength).toBe(8000);
      expect(updatedPolicy.enableContentFiltering).toBe(false);
    });

    it('should handle policy updates with disabled features', async () => {
      const { SecurityManager } = await import('../../src/core/SecurityManager');
      
      const manager = new SecurityManager();
      
      // Disable input validation
      manager.updatePolicy({ enableInputValidation: false });
      
      const longMessage = {
        content: 'A'.repeat(6000),
        role: 'user' as const,
        timestamp: new Date(),
      };
      
      const result = await manager.validateInput(longMessage);
      
      // Should pass validation since it's disabled
      expect(result.isValid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only inputs', async () => {
      const { SecurityManager } = await import('../../src/core/SecurityManager');
      
      const manager = new SecurityManager();
      
      const whitespaceMessage = {
        content: '   \t  \n  ',
        role: 'user' as const,
        timestamp: new Date(),
      };
      
      const result = await manager.validateInput(whitespaceMessage);
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Empty input');
    });

    it('should handle concurrent validation requests', async () => {
      const { SecurityManager } = await import('../../src/core/SecurityManager');
      
      const manager = new SecurityManager();
      
      const messages = Array(5).fill(null).map((_, i) => ({
        content: `Test message ${i}`,
        role: 'user' as const,
        timestamp: new Date(),
      }));
      
      const concurrentValidations = messages.map((msg) => manager.validateInput(msg));
      const results = await Promise.all(concurrentValidations);
      
      // All should complete successfully
      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(result.isValid).toBe(true);
      });
    });
  });
});