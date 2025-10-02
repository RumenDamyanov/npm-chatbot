/**
 * Comprehensive Logger tests to improve coverage from 42.85% to 80%+
 */

describe('Logger Comprehensive Tests', () => {
  describe('Logger Creation and Configuration', () => {
    it('should create logger with default configuration', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger();

      expect(logger).toBeDefined();
      expect(logger.getLevel()).toBe('info'); // Default level
    });

    it('should create logger with custom configuration', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const customConfig = {
        level: 'debug' as const,
        enableConsole: true,
        enableFileLogging: false,
        maxLogEntries: 500,
        includeTimestamp: true,
        includeLevel: true,
        includeCategory: true,
      };

      const logger = new DefaultLogger(customConfig);

      expect(logger.getLevel()).toBe('debug');
    });

    it('should create category logger', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const categoryLogger = DefaultLogger.createCategoryLogger('test-category', {
        level: 'warn' as const,
        enableConsole: true,
      });

      expect(categoryLogger).toBeDefined();
    });

    it('should handle various log levels', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'debug' });

      const levels = ['debug', 'info', 'warn', 'error'] as const;
      levels.forEach((level) => {
        logger.setLevel(level);
        expect(logger.getLevel()).toBe(level);
      });
    });
  });

  describe('Logging Methods', () => {
    it('should log debug messages', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'debug', enableConsole: false });

      expect(() => {
        logger.debug('Debug message');
        logger.debug('Debug with metadata', { key: 'value' });
      }).not.toThrow();
    });

    it('should log info messages', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'info', enableConsole: false });

      expect(() => {
        logger.info('Info message');
        logger.info('Info with metadata', { userId: 123 });
      }).not.toThrow();
    });

    it('should log warning messages', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'warn', enableConsole: false });

      expect(() => {
        logger.warn('Warning message');
        logger.warn('Warning with metadata', { component: 'auth' });
      }).not.toThrow();
    });

    it('should log error messages', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'error', enableConsole: false });

      const testError = new Error('Test error');

      expect(() => {
        logger.error('Error message');
        logger.error('Error with error object', testError);
        logger.error('Error with metadata', testError, { context: 'test' });
      }).not.toThrow();
    });

    it('should use generic log method', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'debug', enableConsole: false });

      expect(() => {
        logger.log('debug', 'Debug via log method');
        logger.log('info', 'Info via log method', { data: 'test' });
        logger.log('warn', 'Warning via log method');
        logger.log('error', 'Error via log method', undefined, new Error('Test'));
      }).not.toThrow();
    });
  });

  describe('Log Level Filtering', () => {
    it('should respect log level filtering', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'warn', enableConsole: false });

      // Debug and info should be filtered out
      logger.debug('Should not appear');
      logger.info('Should not appear');

      // Warn and error should appear
      logger.warn('Should appear');
      logger.error('Should appear');

      const history = logger.getHistory();
      expect(history.length).toBe(2);
      expect(history[0].level).toBe('warn');
      expect(history[1].level).toBe('error');
    });

    it('should filter logs when level changes', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'debug', enableConsole: false });

      logger.debug('Debug message 1');
      logger.info('Info message 1');

      // Change level to warn
      logger.setLevel('warn');

      logger.debug('Debug message 2 (filtered)');
      logger.warn('Warning message 1');

      const history = logger.getHistory();
      expect(history.length).toBe(3); // Only messages logged before level change + warn
      expect(history[2].level).toBe('warn');
    });
  });

  describe('Log History and Retrieval', () => {
    it('should maintain log history', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'debug', enableConsole: false });

      logger.info('Message 1');
      logger.warn('Message 2');
      logger.error('Message 3');

      const history = logger.getHistory();
      expect(history.length).toBe(3);
      expect(history[0].message).toBe('Message 1');
      expect(history[1].message).toBe('Message 2');
      expect(history[2].message).toBe('Message 3');
    });

    it('should limit history retrieval', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'debug', enableConsole: false });

      for (let i = 1; i <= 10; i++) {
        logger.info(`Message ${i}`);
      }

      const limitedHistory = logger.getHistory(5);
      expect(limitedHistory.length).toBe(5);
      expect(limitedHistory[0].message).toBe('Message 6'); // Most recent 5
      expect(limitedHistory[4].message).toBe('Message 10');
    });

    it('should get logs by level', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'debug', enableConsole: false });

      logger.info('Info 1');
      logger.warn('Warning 1');
      logger.info('Info 2');
      logger.error('Error 1');
      logger.warn('Warning 2');

      const warningLogs = logger.getLogsByLevel('warn');
      expect(warningLogs.length).toBe(2);
      expect(warningLogs[0].message).toBe('Warning 1');
      expect(warningLogs[1].message).toBe('Warning 2');

      const infoLogs = logger.getLogsByLevel('info');
      expect(infoLogs.length).toBe(2);

      const errorLogs = logger.getLogsByLevel('error');
      expect(errorLogs.length).toBe(1);
    });

    it('should get logs by category', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const authLogger = DefaultLogger.createCategoryLogger('auth', {
        level: 'debug',
        enableConsole: false,
      });

      const dbLogger = DefaultLogger.createCategoryLogger('database', {
        level: 'debug',
        enableConsole: false,
      });

      authLogger.info('User login');
      dbLogger.info('Database query');
      authLogger.warn('Auth warning');

      const authLogs = authLogger.getLogsByCategory('auth');
      expect(authLogs.length).toBe(2);

      const dbLogs = dbLogger.getLogsByCategory('database');
      expect(dbLogs.length).toBe(1);
    });

    it('should get logs since timestamp', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'debug', enableConsole: false });

      const startTime = new Date();

      logger.info('Message before');

      // Wait a bit and record timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));
      const midTime = new Date();

      logger.info('Message after 1');
      logger.warn('Message after 2');

      const recentLogs = logger.getLogsSince(midTime);
      expect(recentLogs.length).toBe(2);
      expect(recentLogs[0].message).toBe('Message after 1');
      expect(recentLogs[1].message).toBe('Message after 2');
    });

    it('should clear history', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'debug', enableConsole: false });

      logger.info('Message 1');
      logger.warn('Message 2');

      expect(logger.getHistory().length).toBe(2);

      logger.clearHistory();

      expect(logger.getHistory().length).toBe(0);
    });
  });

  describe('Logger Statistics', () => {
    it('should provide logging statistics', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'debug', enableConsole: false });

      logger.debug('Debug message');
      logger.info('Info message 1');
      logger.info('Info message 2');
      logger.warn('Warning message');
      logger.error('Error message 1');
      logger.error('Error message 2');
      logger.error('Error message 3');

      const stats = logger.getStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalLogs');
      expect(stats).toHaveProperty('logsByLevel');
      expect(stats.totalLogs).toBe(7);
      expect(stats.logsByLevel.debug).toBe(1);
      expect(stats.logsByLevel.info).toBe(2);
      expect(stats.logsByLevel.warn).toBe(1);
      expect(stats.logsByLevel.error).toBe(3);
    });

    it('should provide stats for empty logger', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'debug', enableConsole: false });

      const stats = logger.getStats();

      expect(stats.totalLogs).toBe(0);
      expect(stats.logsByLevel.debug || 0).toBe(0);
      expect(stats.logsByLevel.info || 0).toBe(0);
      expect(stats.logsByLevel.warn || 0).toBe(0);
      expect(stats.logsByLevel.error || 0).toBe(0);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'info', enableConsole: true });

      expect(logger.getLevel()).toBe('info');

      logger.updateConfig({
        level: 'debug',
        maxLogEntries: 1000,
        includeTimestamp: false,
      });

      expect(logger.getLevel()).toBe('debug');

      const config = logger.getConfig();
      expect(config.level).toBe('debug');
      expect(config.maxLogEntries).toBe(1000);
      expect(config.includeTimestamp).toBe(false);
    });

    it('should get current configuration', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const customConfig = {
        level: 'warn' as const,
        enableConsole: false,
        maxLogEntries: 200,
        includeTimestamp: true,
        includeLevel: true,
      };

      const logger = new DefaultLogger(customConfig);
      const retrievedConfig = logger.getConfig();

      expect(retrievedConfig.level).toBe('warn');
      expect(retrievedConfig.enableConsole).toBe(false);
      expect(retrievedConfig.maxLogEntries).toBe(200);
      expect(retrievedConfig.includeTimestamp).toBe(true);
      expect(retrievedConfig.includeLevel).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle logging with null/undefined metadata', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'debug', enableConsole: false });

      expect(() => {
        logger.info('Message with null metadata', null as any);
        logger.info('Message with undefined metadata', undefined);
      }).not.toThrow();

      const history = logger.getHistory();
      expect(history.length).toBe(2);
    });

    it('should handle empty message strings', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'debug', enableConsole: false });

      expect(() => {
        logger.info('');
        logger.warn('   '); // Whitespace only
      }).not.toThrow();

      const history = logger.getHistory();
      expect(history.length).toBe(2);
    });

    it('should handle very large metadata objects', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'debug', enableConsole: false });

      const largeMetadata = {
        largeArray: new Array(1000).fill('data'),
        nestedObject: {
          level1: { level2: { level3: 'deep value' } },
        },
        numberData: 42,
        booleanData: true,
      };

      expect(() => {
        logger.info('Message with large metadata', largeMetadata);
      }).not.toThrow();

      const history = logger.getHistory();
      expect(history.length).toBe(1);
      expect(history[0].metadata).toEqual(largeMetadata);
    });

    it('should handle circular reference in metadata', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'debug', enableConsole: false });

      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj; // Create circular reference

      expect(() => {
        logger.info('Message with circular metadata', circularObj);
      }).not.toThrow();
    });

    it('should handle invalid log levels gracefully', async () => {
      const { DefaultLogger } = await import('../../src/utils/Logger');

      const logger = new DefaultLogger({ level: 'info', enableConsole: false });

      expect(() => {
        // This might throw or be handled gracefully depending on implementation
        logger.setLevel('invalid' as any);
      }).not.toThrow();
    });
  });

  describe('Silent Logger', () => {
    it('should create and use silent logger', async () => {
      const { NullLogger } = await import('../../src/utils/Logger');

      const nullLogger = new NullLogger();

      expect(() => {
        nullLogger.debug();
        nullLogger.info();
        nullLogger.warn();
        nullLogger.error();
        nullLogger.log();
      }).not.toThrow();

      // Silent logger should not maintain history or have any side effects
      expect(nullLogger).toBeDefined();
    });
  });
});
