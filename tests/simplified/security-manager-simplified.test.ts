/**
 * Simplified SecurityManager Tests
 *
 * Using simplified testing approach to avoid complex mocking issues.
 * Focuses on core security functionality with predictable inputs.
 */

import { SecurityManager } from '../../src/core/SecurityManager';
import type { ChatMessage } from '../../src/types/ChatbotTypes';

describe('SecurityManager - Simplified Tests', () => {
  let securityManager: SecurityManager;
  
  beforeEach(() => {
    // Create with simple configuration
    securityManager = new SecurityManager();
  });

  describe('Basic Input Validation', () => {
    it('should validate a simple valid message', async () => {
      const message: ChatMessage = {
        role: 'user',
        content: 'Hello, how are you today?',
        timestamp: new Date(),
        id: 'test-msg-1',
      };

      const result = await securityManager.validateInput(message);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should handle empty content gracefully', async () => {
      const message: ChatMessage = {
        role: 'user',
        content: '',
        timestamp: new Date(),
        id: 'test-msg-2',
      };

      const result = await securityManager.validateInput(message);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Empty input');
    });

    it('should block content with blocked words', async () => {
      const message: ChatMessage = {
        role: 'user',
        content: 'This message contains spam content',
        timestamp: new Date(),
        id: 'test-msg-3',
      };

      const result = await securityManager.validateInput(message);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('blocked');
    });

    it('should handle very long content', async () => {
      const longContent = 'A'.repeat(20000); // Exceed max length
      const message: ChatMessage = {
        role: 'user',
        content: longContent,
        timestamp: new Date(),
        id: 'test-msg-4',
      };

      const result = await securityManager.validateInput(message);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('maximum length');
    });
  });

  describe('Output Validation', () => {
    it('should validate simple output', async () => {
      const response = {
        content: 'This is a safe response',
        provider: 'openai' as const,
        metadata: {},
        timestamp: new Date(),
      };

      const result = await securityManager.filterOutput(response);
      
      expect(result).toBeDefined();
      expect(result.content).toBe('This is a safe response');
    });

    it('should block unsafe output content', async () => {
      const response = {
        content: 'This response contains spam instructions',
        provider: 'openai' as const,
        metadata: {},
        timestamp: new Date(),
      };

      const result = await securityManager.filterOutput(response);
      
      expect(result).toBeDefined();
      expect(result.content).not.toBe('This response contains spam instructions');
    });

    it('should handle output that exceeds length limits', async () => {
      const longContent = 'B'.repeat(15000); // Very long response
      const response = {
        content: longContent,
        provider: 'openai' as const,
        metadata: {},
        timestamp: new Date(),
      };

      const result = await securityManager.filterOutput(response);
      
      expect(result).toBeDefined();
      expect(result.content).not.toBe(longContent);
    });
  });

  describe('Security Configuration', () => {
    it('should create manager with default configuration', () => {
      const manager = new SecurityManager();
      
      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(SecurityManager);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null content gracefully', async () => {
      const message: ChatMessage = {
        role: 'user',
        content: null as any, // Simulate null content
        timestamp: new Date(),
        id: 'test-msg-null',
      };

      const result = await securityManager.validateInput(message);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
    });

    it('should handle undefined content gracefully', async () => {
      const message: ChatMessage = {
        role: 'user',
        content: undefined as any, // Simulate undefined content
        timestamp: new Date(),
        id: 'test-msg-undefined',
      };

      const result = await securityManager.validateInput(message);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
    });

    it('should handle whitespace-only content', async () => {
      const message: ChatMessage = {
        role: 'user',
        content: '   \n  \t  ',
        timestamp: new Date(),
        id: 'test-msg-whitespace',
      };

      const result = await securityManager.validateInput(message);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Empty input');
    });
  });
});