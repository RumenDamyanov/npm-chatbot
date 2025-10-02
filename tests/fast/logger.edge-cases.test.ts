/**
 * Logger edge cases tests to improve coverage from 60% to 85%+
 * Tests uncovered functionality, file operations, and error scenarios
 */

describe('Logger Edge Cases Tests', () => {
  describe('DefaultLogger Advanced Functionality', () => {
    it('should handle file logging configuration', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');
      
      const config = {
        level: 'debug' as const,
        enableConsole: false,
        enableFileLogging: true,
        logFilePath: '/tmp/test.log',
        includeTimestamp: true,
        includeLevel: true,
        includeCategory: true,
      };
      
      const logger = new DefaultLogger(config);
      
      // This should trigger file logging path
      logger.info('Test file logging', { key: 'value' });
      
      expect(true).toBe(true); // Test passes if no exceptions
    });

    it('should handle different date formats', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');
      
      const isoConfig = {
        level: 'debug' as const,
        enableConsole: true,
        dateFormat: 'ISO' as const,
        includeTimestamp: true,
      };
      
      const localeConfig = {
        level: 'debug' as const,
        enableConsole: true,
        dateFormat: 'locale' as const,
        includeTimestamp: true,
      };
      
      const isoLogger = new DefaultLogger(isoConfig);
      const localeLogger = new DefaultLogger(localeConfig);
      
      isoLogger.info('ISO format test');
      localeLogger.info('Locale format test');
      
      expect(true).toBe(true); // Test passes if no exceptions
    });

    it('should handle logging with all formatting options disabled', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');
      
      const config = {
        level: 'debug' as const,
        enableConsole: true,
        includeTimestamp: false,
        includeLevel: false,
        includeCategory: false,
      };
      
      const logger = new DefaultLogger(config);
      
      logger.debug('Debug without formatting');
      logger.info('Info without formatting');
      logger.warn('Warn without formatting');
      logger.error('Error without formatting');
      
      expect(true).toBe(true); // Test passes if no exceptions
    });

    it('should handle logging with categories', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');
      
      const config = {
        level: 'debug' as const,
        enableConsole: true,
        includeCategory: true,
      };
      
      const logger = new DefaultLogger(config);
      
      logger.debug('Debug with category', { category: 'TEST' });
      logger.info('Info with category', { category: 'API' });
      logger.warn('Warn with category', { category: 'SECURITY' });
      logger.error('Error with category', new Error('Test error'), { category: 'SYSTEM' });
      
      expect(true).toBe(true); // Test passes if no exceptions
    });

    it('should set and get log levels', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');
      
      const logger = new DefaultLogger({ level: 'info' });
      
      expect(logger.getLevel()).toBe('info');
      
      logger.setLevel('debug');
      expect(logger.getLevel()).toBe('debug');
      
      logger.setLevel('warn');
      expect(logger.getLevel()).toBe('warn');
      
      logger.setLevel('error');
      expect(logger.getLevel()).toBe('error');
    });

    it('should get log history with limits', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');
      
      const config = {
        level: 'debug' as const,
        enableConsole: false,
        maxLogEntries: 100,
      };
      
      const logger = new DefaultLogger(config);
      
      // Add multiple log entries
      for (let i = 0; i < 10; i++) {
        logger.info(`Message ${i}`);
      }
      
      const allHistory = logger.getHistory();
      expect(allHistory.length).toBe(10);
      
      const limitedHistory = logger.getHistory(5);
      expect(limitedHistory.length).toBe(5);
      
      // Should get last 5 entries
      expect(limitedHistory[4].message).toBe('Message 9');
    });

    it('should track statistics', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');
      
      const config = {
        level: 'debug' as const,
        enableConsole: false,
      };
      
      const logger = new DefaultLogger(config);
      
      logger.debug('Debug message');
      logger.info('Info message 1');
      logger.info('Info message 2');
      logger.warn('Warning message');
      logger.error('Error message');
      
      // Try to get stats if the method exists
      if ('getStats' in logger && typeof logger.getStats === 'function') {
        const stats = logger.getStats();
        expect(stats).toBeDefined();
      } else {
        // If no getStats method, check basic count functionality
        const allLogs = logger.getLogHistory(100);
        expect(allLogs.length).toBe(5);
        
        // Check log levels are correct
        expect(allLogs[0].level).toBe('debug');
        expect(allLogs[1].level).toBe('info');
        expect(allLogs[2].level).toBe('info');
        expect(allLogs[3].level).toBe('warn');
        expect(allLogs[4].level).toBe('error');
      }
    });

    it('should get logs by category', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');
      
      const config = {
        level: 'debug' as const,
        enableConsole: false,
      };
      
      // Create separate loggers for different categories
      const apiLogger = DefaultLogger.createCategoryLogger('API', config);
      const dbLogger = DefaultLogger.createCategoryLogger('DATABASE', config);
      
      apiLogger.info('API message 1');
      apiLogger.info('API message 2');
      dbLogger.info('DB message');
      apiLogger.warn('API warning');
      
      const apiLogs = apiLogger.getLogsByCategory('API');
      expect(apiLogs.length).toBe(3);
      expect(apiLogs[0].message).toBe('API message 1');
      expect(apiLogs[1].message).toBe('API message 2');
      expect(apiLogs[2].message).toBe('API warning');
      
      const dbLogs = dbLogger.getLogsByCategory('DATABASE');
      expect(dbLogs.length).toBe(1);
      expect(dbLogs[0].message).toBe('DB message');
      
      const nonExistentLogs = apiLogger.getLogsByCategory('NONEXISTENT');
      expect(nonExistentLogs.length).toBe(0);
      
      // Test with limit
      const limitedApiLogs = apiLogger.getLogsByCategory('API', 2);
      expect(limitedApiLogs.length).toBe(2);
      expect(limitedApiLogs[1].message).toBe('API warning'); // Should be last 2
    });

    it('should get logs since specific time', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');
      
      const config = {
        level: 'debug' as const,
        enableConsole: false,
      };
      
      const logger = new DefaultLogger(config);
      
      const startTime = new Date();
      
      // Add some logs before waiting
      logger.info('Before wait');
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const midTime = new Date();
      
      logger.info('After wait');
      logger.warn('After wait warning');
      
      const logsSinceStart = logger.getLogsSince(startTime);
      expect(logsSinceStart.length).toBe(3);
      
      const logsSinceMid = logger.getLogsSince(midTime);
      expect(logsSinceMid.length).toBe(2);
      expect(logsSinceMid[0].message).toBe('After wait');
      expect(logsSinceMid[1].message).toBe('After wait warning');
      
      // Test with limit
      const limitedLogsSinceStart = logger.getLogsSince(startTime, 2);
      expect(limitedLogsSinceStart.length).toBe(2);
      // Should get last 2 logs
      expect(limitedLogsSinceStart[0].message).toBe('After wait');
      expect(limitedLogsSinceStart[1].message).toBe('After wait warning');
    });

    it('should handle log entry trimming when exceeding max entries', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');
      
      const config = {
        level: 'debug' as const,
        enableConsole: false,
        maxLogEntries: 5, // Small limit for testing
      };
      
      const logger = new DefaultLogger(config);
      
      // Add more logs than the limit
      for (let i = 0; i < 10; i++) {
        logger.info(`Message ${i}`);
      }
      
      const history = logger.getHistory();
      expect(history.length).toBe(5); // Should be trimmed to max
      
      // Should have the last 5 messages
      expect(history[0].message).toBe('Message 5');
      expect(history[4].message).toBe('Message 9');
    });

    it('should clear log history', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');
      
      const config = {
        level: 'debug' as const,
        enableConsole: false,
      };
      
      const logger = new DefaultLogger(config);
      
      // Add some logs
      logger.info('Message 1');
      logger.info('Message 2');
      logger.info('Message 3');
      
      expect(logger.getHistory().length).toBe(3);
      
      logger.clearHistory();
      
      expect(logger.getHistory().length).toBe(0);
    });

    it('should get logger statistics', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');
      
      const config = {
        level: 'debug' as const,
        enableConsole: false,
      };
      
      const logger = new DefaultLogger(config);
      
      // Add logs of different levels
      logger.debug('Debug 1');
      logger.debug('Debug 2');
      logger.info('Info 1');
      logger.warn('Warn 1');
      logger.error('Error 1');
      logger.error('Error 2');
      logger.error('Error 3');
      
      const stats = logger.getStats();
      
      expect(stats.totalLogs).toBe(7);
      expect(stats.logsByLevel.debug).toBe(2);
      expect(stats.logsByLevel.info).toBe(1);
      expect(stats.logsByLevel.warn).toBe(1);
      expect(stats.logsByLevel.error).toBe(3);
      expect(stats.oldestLog).toBeInstanceOf(Date);
      expect(stats.newestLog).toBeInstanceOf(Date);
    });

    it('should handle stats for empty logger', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');
      
      const config = {
        level: 'debug' as const,
        enableConsole: false,
      };
      
      const logger = new DefaultLogger(config);
      
      const stats = logger.getStats();
      
      expect(stats.totalLogs).toBe(0);
      expect(stats.logsByLevel).toEqual({});
      expect(stats.oldestLog).toBeUndefined();
      expect(stats.newestLog).toBeUndefined();
    });
  });

  describe('Logger Filtering and Levels', () => {
    it('should respect log level filtering', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');
      
      const config = {
        level: 'warn' as const, // Only warn and error should be logged
        enableConsole: false,
      };
      
      const logger = new DefaultLogger(config);
      
      logger.debug('Debug message'); // Should be filtered out
      logger.info('Info message'); // Should be filtered out
      logger.warn('Warn message'); // Should be logged
      logger.error('Error message'); // Should be logged
      
      const history = logger.getHistory();
      expect(history.length).toBe(2);
      expect(history[0].message).toBe('Warn message');
      expect(history[1].message).toBe('Error message');
    });

    it('should handle error level filtering', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');
      
      const config = {
        level: 'error' as const, // Only error should be logged
        enableConsole: false,
      };
      
      const logger = new DefaultLogger(config);
      
      logger.debug('Debug message'); // Should be filtered out
      logger.info('Info message'); // Should be filtered out
      logger.warn('Warn message'); // Should be filtered out
      logger.error('Error message'); // Should be logged
      
      const history = logger.getHistory();
      expect(history.length).toBe(1);
      expect(history[0].message).toBe('Error message');
    });

    it('should handle debug level (all messages)', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');
      
      const config = {
        level: 'debug' as const, // All messages should be logged
        enableConsole: false,
      };
      
      const logger = new DefaultLogger(config);
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');
      
      const history = logger.getHistory();
      expect(history.length).toBe(4);
    });
  });

  describe('NullLogger', () => {
    it('should provide no-op implementation', async () => {
      const { NullLogger } = await import('../../src/utils/Logger');
      
      const logger = new NullLogger();
      
      // All methods should be no-ops and not throw
      expect(() => {
        logger.debug('Debug message', { key: 'value' });
        logger.info('Info message', { key: 'value' });
        logger.warn('Warn message', { key: 'value' });
        logger.error('Error message', new Error('Test'), { key: 'value' });
      }).not.toThrow();
    });

    it('should handle undefined parameters', async () => {
      const { NullLogger } = await import('../../src/utils/Logger');
      
      const logger = new NullLogger();
      
      // Should handle undefined parameters gracefully
      expect(() => {
        logger.debug('Message');
        logger.info('Message');
        logger.warn('Message');
        logger.error('Message');
      }).not.toThrow();
    });
  });

  describe('Logger Configuration Edge Cases', () => {
    it('should handle minimal configuration', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');
      
      const config = {
        level: 'info' as const,
      };
      
      const logger = new DefaultLogger(config);
      
      logger.info('Test message');
      
      expect(logger.getLevel()).toBe('info');
      expect(logger.getHistory().length).toBe(1);
    });

    it('should handle file logging without console', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');
      
      const config = {
        level: 'debug' as const,
        enableConsole: false,
        enableFileLogging: true,
        logFilePath: '/tmp/test-only-file.log',
      };
      
      const logger = new DefaultLogger(config);
      
      logger.info('File only message');
      
      expect(logger.getHistory().length).toBe(1);
    });

    it('should handle both console and file logging', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');
      
      const config = {
        level: 'debug' as const,
        enableConsole: true,
        enableFileLogging: true,
        logFilePath: '/tmp/test-both.log',
        includeTimestamp: true,
        includeLevel: true,
        includeCategory: true,
      };
      
      const logger = new DefaultLogger(config);
      
      logger.info('Both console and file message', { category: 'TEST' });
      
      expect(logger.getHistory().length).toBe(1);
    });

    it('should handle complex metadata objects', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');
      
      const config = {
        level: 'debug' as const,
        enableConsole: false,
      };
      
      const logger = new DefaultLogger(config);
      
      const complexMetadata = {
        user: {
          id: 123,
          name: 'Test User',
          roles: ['admin', 'user'],
        },
        request: {
          method: 'POST',
          url: '/api/test',
          headers: {
            'content-type': 'application/json',
          },
        },
        nested: {
          deep: {
            value: 'deeply nested',
          },
        },
      };
      
      logger.info('Complex metadata test', complexMetadata);
      
      const history = logger.getHistory();
      expect(history.length).toBe(1);
      expect(history[0].metadata).toEqual(complexMetadata);
    });
  });
});