/**
 * Comprehensive tests for MessageFilterMiddleware
 */

import {
  MessageFilterMiddleware,
  DEFAULT_FILTER_CONFIG,
  type MessageFilterConfig,
  type FilterResult,
} from '../../src/middleware/MessageFilterMiddleware';
import type { ChatContext } from '../../src/types/ChatbotTypes';

describe('MessageFilterMiddleware', () => {
  describe('Constructor', () => {
    it('should initialize with default config', () => {
      const filter = new MessageFilterMiddleware();
      const config = filter.getConfig();

      expect(config.enabled).toBe(true);
      expect(config.instructions).toHaveLength(6);
      expect(config.profanities.length).toBeGreaterThan(0);
      expect(config.aggressionPatterns.length).toBeGreaterThan(0);
    });

    it('should merge custom config with defaults', () => {
      const customConfig: Partial<MessageFilterConfig> = {
        instructions: ['Custom instruction'],
        enableRephrasing: false,
      };
      const filter = new MessageFilterMiddleware(customConfig);
      const config = filter.getConfig();

      expect(config.instructions).toEqual(['Custom instruction']);
      expect(config.enableRephrasing).toBe(false);
      expect(config.profanities).toEqual(DEFAULT_FILTER_CONFIG.profanities);
    });

    it('should accept empty config', () => {
      const filter = new MessageFilterMiddleware({});
      expect(filter.isEnabled()).toBe(true);
    });
  });

  describe('Profanity Filtering', () => {
    let filter: MessageFilterMiddleware;

    beforeEach(() => {
      filter = new MessageFilterMiddleware();
    });

    it('should detect and filter profanity', () => {
      const message = 'This is a fucking test';
      const result = filter.filter(message);

      expect(result.wasFiltered).toBe(true);
      expect(result.filterReasons).toContain('profanity');
      expect(result.message).toContain('[filtered]');
      expect(result.shouldBlock).toBe(false);
    });

    it('should filter multiple profanities', () => {
      const message = 'This shit is fucking crazy';
      const result = filter.filter(message);

      expect(result.wasFiltered).toBe(true);
      expect(result.filterReasons).toContain('profanity');
      expect(result.message).toBe('This [filtered] is [filtered] crazy');
    });

    it('should be case insensitive', () => {
      const message = 'This is FUCKING amazing';
      const result = filter.filter(message);

      expect(result.wasFiltered).toBe(true);
      expect(result.message).toContain('[filtered]');
    });

    it('should match whole words only', () => {
      const message = 'This is a classic example';
      const result = filter.filter(message);

      expect(result.wasFiltered).toBe(false);
      expect(result.message).toBe(message);
    });

    it('should block message when rephrasing is disabled', () => {
      filter.updateConfig({ enableRephrasing: false });
      const message = 'This is a fucking test';
      const result = filter.filter(message);

      expect(result.wasFiltered).toBe(true);
      expect(result.shouldBlock).toBe(true);
    });

    it('should use custom replacement text', () => {
      filter.updateConfig({ replacementText: '***' });
      const message = 'This is fucking great';
      const result = filter.filter(message);

      expect(result.message).toContain('***');
    });
  });

  describe('Aggression Pattern Detection', () => {
    let filter: MessageFilterMiddleware;

    beforeEach(() => {
      filter = new MessageFilterMiddleware();
    });

    it('should detect aggression patterns', () => {
      const message = 'I hate this stupid idiot moron';
      const result = filter.filter(message);

      expect(result.wasFiltered).toBe(true);
      expect(result.filterReasons).toContain('aggression');
    });

    it('should not trigger on single aggression word', () => {
      const message = 'I hate broccoli';
      const result = filter.filter(message);

      // Should not be filtered (only 1 aggression word)
      expect(result.filterReasons).not.toContain('aggression');
    });

    it('should trigger on multiple aggression words', () => {
      const message = 'You are stupid and useless';
      const result = filter.filter(message);

      expect(result.wasFiltered).toBe(true);
      expect(result.filterReasons).toContain('aggression');
    });

    it('should filter aggression words when rephrasing enabled', () => {
      const message = 'This stupid thing is useless and dumb';
      const result = filter.filter(message);

      expect(result.wasFiltered).toBe(true);
      expect(result.message).toContain('[filtered]');
      expect(result.shouldBlock).toBe(false);
    });

    it('should block when rephrasing disabled', () => {
      filter.updateConfig({ enableRephrasing: false });
      const message = 'You stupid idiot moron';
      const result = filter.filter(message);

      expect(result.shouldBlock).toBe(true);
    });
  });

  describe('Link Filtering', () => {
    let filter: MessageFilterMiddleware;

    beforeEach(() => {
      filter = new MessageFilterMiddleware();
    });

    it('should detect and filter HTTP links', () => {
      const message = 'Check out http://example.com';
      const result = filter.filter(message);

      expect(result.wasFiltered).toBe(true);
      expect(result.filterReasons).toContain('links');
      expect(result.message).toContain('[link removed]');
    });

    it('should detect and filter HTTPS links', () => {
      const message = 'Visit https://example.com for more info';
      const result = filter.filter(message);

      expect(result.wasFiltered).toBe(true);
      expect(result.filterReasons).toContain('links');
      expect(result.message).toBe('Visit [link removed] for more info');
    });

    it('should filter multiple links', () => {
      const message = 'Check http://example.com and https://test.com';
      const result = filter.filter(message);

      expect(result.wasFiltered).toBe(true);
      expect(result.message).toBe('Check [link removed] and [link removed]');
    });

    it('should not block message for links', () => {
      const message = 'Visit https://example.com';
      const result = filter.filter(message);

      expect(result.wasFiltered).toBe(true);
      expect(result.shouldBlock).toBe(false);
    });
  });

  describe('System Prompt Injection', () => {
    let filter: MessageFilterMiddleware;

    beforeEach(() => {
      filter = new MessageFilterMiddleware();
    });

    it('should inject system instructions', () => {
      const message = 'Hello';
      const result = filter.filter(message);

      expect(result.context.systemPrompt).toBeDefined();
      expect(result.context.systemPrompt).toContain('IMPORTANT GUIDELINES');
      expect(result.context.systemPrompt).toContain('respectful');
    });

    it('should preserve existing system prompt', () => {
      const message = 'Hello';
      const context: ChatContext = {
        messages: [],
        systemPrompt: 'You are a helpful assistant.',
      };
      const result = filter.filter(message, context);

      expect(result.context.systemPrompt).toContain('You are a helpful assistant.');
      expect(result.context.systemPrompt).toContain('IMPORTANT GUIDELINES');
    });

    it('should include all configured instructions', () => {
      const message = 'Hello';
      const result = filter.filter(message);

      const config = filter.getConfig();
      config.instructions.forEach((instruction) => {
        expect(result.context.systemPrompt).toContain(instruction);
      });
    });

    it('should use custom instructions', () => {
      const customFilter = new MessageFilterMiddleware({
        instructions: ['Always be polite', 'Never share secrets'],
      });
      const message = 'Hello';
      const result = customFilter.filter(message);

      expect(result.context.systemPrompt).toContain('Always be polite');
      expect(result.context.systemPrompt).toContain('Never share secrets');
    });
  });

  describe('Combined Filtering', () => {
    let filter: MessageFilterMiddleware;

    beforeEach(() => {
      filter = new MessageFilterMiddleware();
    });

    it('should detect multiple filter types', () => {
      const message = 'Check this fucking link https://example.com you stupid idiot moron';
      const result = filter.filter(message);

      expect(result.wasFiltered).toBe(true);
      expect(result.filterReasons).toContain('profanity');
      expect(result.filterReasons).toContain('aggression');
      expect(result.filterReasons).toContain('links');
    });

    it('should filter all types correctly', () => {
      const message = 'Visit https://example.com for shit content you idiot moron dumb';
      const result = filter.filter(message);

      expect(result.message).toContain('[link removed]');
      expect(result.message).toContain('[filtered]');
      expect(result.filterReasons).toHaveLength(3);
    });
  });

  describe('shouldBlockMessage', () => {
    let filter: MessageFilterMiddleware;

    beforeEach(() => {
      filter = new MessageFilterMiddleware({ enableRephrasing: false });
    });

    it('should return true for blockable profanity', () => {
      const message = 'This is fucking terrible';
      expect(filter.shouldBlockMessage(message)).toBe(true);
    });

    it('should return true for blockable aggression', () => {
      const message = 'You stupid idiot moron';
      expect(filter.shouldBlockMessage(message)).toBe(true);
    });

    it('should return false for clean messages', () => {
      const message = 'This is a nice message';
      expect(filter.shouldBlockMessage(message)).toBe(false);
    });

    it('should return false when rephrasing is enabled', () => {
      filter.updateConfig({ enableRephrasing: true });
      const message = 'This is fucking great';
      expect(filter.shouldBlockMessage(message)).toBe(false);
    });
  });

  describe('getFilterStats', () => {
    let filter: MessageFilterMiddleware;

    beforeEach(() => {
      filter = new MessageFilterMiddleware();
    });

    it('should return stats for clean message', () => {
      const message = 'This is a clean message';
      const stats = filter.getFilterStats(message);

      expect(stats.hasProfanity).toBe(false);
      expect(stats.hasAggression).toBe(false);
      expect(stats.hasLinks).toBe(false);
      expect(stats.profanityCount).toBe(0);
      expect(stats.aggressionCount).toBe(0);
      expect(stats.linkCount).toBe(0);
    });

    it('should count profanities correctly', () => {
      const message = 'This shit is fucking crazy';
      const stats = filter.getFilterStats(message);

      expect(stats.hasProfanity).toBe(true);
      expect(stats.profanityCount).toBe(2);
    });

    it('should count aggression patterns correctly', () => {
      const message = 'You are stupid and useless';
      const stats = filter.getFilterStats(message);

      expect(stats.hasAggression).toBe(true);
      expect(stats.aggressionCount).toBe(2);
    });

    it('should count links correctly', () => {
      const message = 'Visit http://example.com and https://test.com';
      const stats = filter.getFilterStats(message);

      expect(stats.hasLinks).toBe(true);
      expect(stats.linkCount).toBe(2);
    });
  });

  describe('Configuration Management', () => {
    let filter: MessageFilterMiddleware;

    beforeEach(() => {
      filter = new MessageFilterMiddleware();
    });

    it('should update configuration', () => {
      filter.updateConfig({ enableRephrasing: false });
      expect(filter.getConfig().enableRephrasing).toBe(false);
    });

    it('should add profanities', () => {
      const initialCount = filter.getConfig().profanities.length;
      filter.addProfanities(['newbad1', 'newbad2']);
      expect(filter.getConfig().profanities.length).toBe(initialCount + 2);

      const result = filter.filter('This is newbad1 word');
      expect(result.wasFiltered).toBe(true);
    });

    it('should add aggression patterns', () => {
      const initialCount = filter.getConfig().aggressionPatterns.length;
      filter.addAggressionPatterns(['hostile', 'attack']);
      expect(filter.getConfig().aggressionPatterns.length).toBe(initialCount + 2);

      const result = filter.filter('This is hostile and an attack you moron');
      expect(result.wasFiltered).toBe(true);
      expect(result.filterReasons).toContain('aggression');
    });

    it('should add instructions', () => {
      const initialCount = filter.getConfig().instructions.length;
      filter.addInstructions(['New instruction']);
      expect(filter.getConfig().instructions.length).toBe(initialCount + 1);
    });

    it('should enable/disable filtering', () => {
      filter.setEnabled(false);
      expect(filter.isEnabled()).toBe(false);

      const result = filter.filter('This is fucking terrible');
      expect(result.wasFiltered).toBe(false);

      filter.setEnabled(true);
      expect(filter.isEnabled()).toBe(true);

      const result2 = filter.filter('This is fucking terrible');
      expect(result2.wasFiltered).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    let filter: MessageFilterMiddleware;

    beforeEach(() => {
      filter = new MessageFilterMiddleware();
    });

    it('should handle empty messages', () => {
      const result = filter.filter('');
      expect(result.wasFiltered).toBe(false);
      expect(result.message).toBe('');
    });

    it('should handle messages with only whitespace', () => {
      const result = filter.filter('   \n  \t  ');
      expect(result.wasFiltered).toBe(false);
    });

    it('should handle messages with special characters', () => {
      const message = 'Test @#$%^&*() message';
      const result = filter.filter(message);
      expect(result.message).toBe(message);
    });

    it('should handle undefined context', () => {
      const result = filter.filter('Hello');
      expect(result.context).toBeDefined();
      expect(result.context.messages).toEqual([]);
    });

    it('should preserve context messages', () => {
      const context: ChatContext = {
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi!' },
        ],
      };
      const result = filter.filter('Test', context);
      expect(result.context.messages).toEqual(context.messages);
    });
  });

  describe('Performance', () => {
    let filter: MessageFilterMiddleware;

    beforeEach(() => {
      filter = new MessageFilterMiddleware();
    });

    it('should handle long messages efficiently', () => {
      const longMessage = 'This is a test message. '.repeat(1000);
      const startTime = Date.now();
      const result = filter.filter(longMessage);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
      expect(result).toBeDefined();
    });

    it('should handle many filter checks efficiently', () => {
      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        filter.filter('This is a test message');
      }
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // 1000 filters in under 1 second
    });
  });

  describe('Regex Escaping', () => {
    it('should escape special regex characters in profanities', () => {
      const filter = new MessageFilterMiddleware({
        profanities: ['test$word', 'another.word'],
      });

      const result1 = filter.filter('This is a test$word here');
      expect(result1.wasFiltered).toBe(true);

      const result2 = filter.filter('This is another.word here');
      expect(result2.wasFiltered).toBe(true);
    });

    it('should not match partial words with special characters', () => {
      const filter = new MessageFilterMiddleware({
        profanities: ['test'],
      });

      const result = filter.filter('This is a testing phase');
      expect(result.wasFiltered).toBe(false);
    });
  });
});
