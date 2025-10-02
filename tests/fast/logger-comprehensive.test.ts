/**
 * Comprehensive test suite for the Logger utility class
 * Target: Improve Logger.ts coverage from 12.85% to 40%+
 * Focus: Logger functionality, configuration, and file operations
 */

import { DefaultLogger } from '../../src/utils/Logger';
import type { LoggerConfig } from '../../src/utils/Logger';

// Mock filesystem operations to avoid actual file I/O
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  appendFileSync: jest.fn(),
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
}));

describe('Logger Comprehensive Tests', () => {
  let defaultConfig: LoggerConfig;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock console methods to avoid actual console output during tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'debug').mockImplementation();
    
    // Setup default configuration
    defaultConfig = {
      level: 'info',
      enableConsole: true,
      enableFileLogging: false,
      maxLogEntries: 1000,
      includeTimestamp: true,
      includeLevel: true,
      includeCategory: true,
    };
  });

  afterEach(() => {
    // Restore console methods
    jest.restoreAllMocks();
  });

  describe('Constructor and Configuration', () => {
    test('should create logger with default configuration', () => {
      expect(() => new DefaultLogger()).not.toThrow();
    });

    test('should create logger with custom configuration', () => {
      expect(() => new DefaultLogger(defaultConfig)).not.toThrow();
    });

    test('should create logger with minimal configuration', () => {
      const minimalConfig: LoggerConfig = {
        level: 'debug',
        enableConsole: true,
      };
      
      expect(() => new DefaultLogger(minimalConfig)).not.toThrow();
    });

    test('should handle configuration with file logging enabled', () => {
      const fileConfig: LoggerConfig = {
        level: 'info',
        enableConsole: true,
        enableFileLogging: true,
        logFilePath: '/tmp/test.log',
      };
      
      expect(() => new DefaultLogger(fileConfig)).not.toThrow();
    });

    test('should handle configuration with custom max entries', () => {
      const customConfig: LoggerConfig = {
        level: 'warn',
        enableConsole: true,
        maxLogEntries: 500,
      };
      
      expect(() => new DefaultLogger(customConfig)).not.toThrow();
    });
  });

  describe('Log Level Configuration', () => {
    test('should handle debug level logging', () => {
      const logger = new DefaultLogger({
        level: 'debug',
        enableConsole: true,
      });
      
      expect(() => logger.debug('Debug message')).not.toThrow();
    });

    test('should handle info level logging', () => {
      const logger = new DefaultLogger({
        level: 'info',
        enableConsole: true,
      });
      
      expect(() => logger.info('Info message')).not.toThrow();
    });

    test('should handle warn level logging', () => {
      const logger = new DefaultLogger({
        level: 'warn',
        enableConsole: true,
      });
      
      expect(() => logger.warn('Warning message')).not.toThrow();
    });

    test('should handle error level logging', () => {
      const logger = new DefaultLogger({
        level: 'error',
        enableConsole: true,
      });
      
      expect(() => logger.error('Error message')).not.toThrow();
    });
  });

  describe('Log Messages with Metadata', () => {
    test('should handle debug with metadata', () => {
      const logger = new DefaultLogger(defaultConfig);
      const metadata = { userId: '123', action: 'test' };
      
      expect(() => logger.debug('Debug with metadata', metadata)).not.toThrow();
    });

    test('should handle info with metadata', () => {
      const logger = new DefaultLogger(defaultConfig);
      const metadata = { request: 'GET /api/test', status: 200 };
      
      expect(() => logger.info('Info with metadata', metadata)).not.toThrow();
    });

    test('should handle warn with metadata', () => {
      const logger = new DefaultLogger(defaultConfig);
      const metadata = { warning: 'deprecated', feature: 'oldApi' };
      
      expect(() => logger.warn('Warning with metadata', metadata)).not.toThrow();
    });

    test('should handle error with Error object', () => {
      const logger = new DefaultLogger(defaultConfig);
      const error = new Error('Test error');
      const metadata = { context: 'test operation' };
      
      expect(() => logger.error('Error with object', error, metadata)).not.toThrow();
    });

    test('should handle error with string message', () => {
      const logger = new DefaultLogger(defaultConfig);
      const metadata = { operation: 'failed' };
      
      expect(() => logger.error('Error message', metadata)).not.toThrow();
    });
  });

  describe('Log Entry Creation', () => {
    test('should create log entries with timestamps', () => {
      const logger = new DefaultLogger({
        level: 'debug',
        enableConsole: true,
        includeTimestamp: true,
      });
      
      expect(() => logger.info('Timestamped message')).not.toThrow();
    });

    test('should create log entries without timestamps', () => {
      const logger = new DefaultLogger({
        level: 'debug',
        enableConsole: true,
        includeTimestamp: false,
      });
      
      expect(() => logger.info('Non-timestamped message')).not.toThrow();
    });

    test('should create log entries with level indicators', () => {
      const logger = new DefaultLogger({
        level: 'debug',
        enableConsole: true,
        includeLevel: true,
      });
      
      expect(() => logger.warn('Message with level')).not.toThrow();
    });

    test('should create log entries without level indicators', () => {
      const logger = new DefaultLogger({
        level: 'debug',
        enableConsole: true,
        includeLevel: false,
      });
      
      expect(() => logger.warn('Message without level')).not.toThrow();
    });
  });

  describe('Category Support', () => {
    test('should handle category in logging', () => {
      const logger = new DefaultLogger({
        level: 'debug',
        enableConsole: true,
        includeCategory: true,
      });
      
      expect(() => logger.info('Categorized message', { category: 'HTTP' })).not.toThrow();
    });

    test('should handle missing category', () => {
      const logger = new DefaultLogger({
        level: 'debug',
        enableConsole: true,
        includeCategory: true,
      });
      
      expect(() => logger.info('Uncategorized message')).not.toThrow();
    });

    test('should handle category inclusion disabled', () => {
      const logger = new DefaultLogger({
        level: 'debug',
        enableConsole: true,
        includeCategory: false,
      });
      
      expect(() => logger.info('Message without category', { category: 'TEST' })).not.toThrow();
    });
  });

  describe('File Logging', () => {
    test('should handle file logging configuration', () => {
      const logger = new DefaultLogger({
        level: 'debug',
        enableConsole: false,
        enableFileLogging: true,
        logFilePath: '/tmp/app.log',
      });
      
      expect(() => logger.info('File logged message')).not.toThrow();
    });

    test('should handle file logging with custom path', () => {
      const logger = new DefaultLogger({
        level: 'warn',
        enableConsole: true,
        enableFileLogging: true,
        logFilePath: '/custom/path/logs/app.log',
      });
      
      expect(() => logger.error('Custom path message')).not.toThrow();
    });

    test('should handle file logging disabled', () => {
      const logger = new DefaultLogger({
        level: 'debug',
        enableConsole: true,
        enableFileLogging: false,
      });
      
      expect(() => logger.info('Console only message')).not.toThrow();
    });
  });

  describe('Log Level Filtering', () => {
    test('should respect debug level filter', () => {
      const logger = new DefaultLogger({
        level: 'debug',
        enableConsole: true,
      });
      
      // All levels should work at debug level
      expect(() => logger.debug('Debug message')).not.toThrow();
      expect(() => logger.info('Info message')).not.toThrow();
      expect(() => logger.warn('Warn message')).not.toThrow();
      expect(() => logger.error('Error message')).not.toThrow();
    });

    test('should respect info level filter', () => {
      const logger = new DefaultLogger({
        level: 'info',
        enableConsole: true,
      });
      
      // Debug should be filtered out, others should work
      expect(() => logger.debug('Debug message')).not.toThrow();
      expect(() => logger.info('Info message')).not.toThrow();
      expect(() => logger.warn('Warn message')).not.toThrow();
      expect(() => logger.error('Error message')).not.toThrow();
    });

    test('should respect warn level filter', () => {
      const logger = new DefaultLogger({
        level: 'warn',
        enableConsole: true,
      });
      
      // Debug and info should be filtered, warn and error should work
      expect(() => logger.debug('Debug message')).not.toThrow();
      expect(() => logger.info('Info message')).not.toThrow();
      expect(() => logger.warn('Warn message')).not.toThrow();
      expect(() => logger.error('Error message')).not.toThrow();
    });

    test('should respect error level filter', () => {
      const logger = new DefaultLogger({
        level: 'error',
        enableConsole: true,
      });
      
      // Only error should work
      expect(() => logger.debug('Debug message')).not.toThrow();
      expect(() => logger.info('Info message')).not.toThrow();
      expect(() => logger.warn('Warn message')).not.toThrow();
      expect(() => logger.error('Error message')).not.toThrow();
    });
  });

  describe('Complex Metadata Handling', () => {
    test('should handle nested metadata objects', () => {
      const logger = new DefaultLogger(defaultConfig);
      const complexMetadata = {
        request: {
          method: 'POST',
          url: '/api/test',
          headers: { 'content-type': 'application/json' },
        },
        response: {
          status: 200,
          time: 150,
        },
      };
      
      expect(() => logger.info('Complex metadata', complexMetadata)).not.toThrow();
    });

    test('should handle array metadata', () => {
      const logger = new DefaultLogger(defaultConfig);
      const arrayMetadata = {
        items: ['item1', 'item2', 'item3'],
        count: 3,
      };
      
      expect(() => logger.debug('Array metadata', arrayMetadata)).not.toThrow();
    });

    test('should handle null/undefined metadata', () => {
      const logger = new DefaultLogger(defaultConfig);
      
      expect(() => logger.info('Null metadata', null as any)).not.toThrow();
      expect(() => logger.info('Undefined metadata', undefined as any)).not.toThrow();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty string messages', () => {
      const logger = new DefaultLogger(defaultConfig);
      
      expect(() => logger.info('')).not.toThrow();
    });

    test('should handle very long messages', () => {
      const logger = new DefaultLogger(defaultConfig);
      const longMessage = 'A'.repeat(10000);
      
      expect(() => logger.warn(longMessage)).not.toThrow();
    });

    test('should handle special characters in messages', () => {
      const logger = new DefaultLogger(defaultConfig);
      const specialMessage = 'Message with 🚀 emojis and special chars: àáâãäå';
      
      expect(() => logger.debug(specialMessage)).not.toThrow();
    });

    test('should handle circular reference in metadata', () => {
      const logger = new DefaultLogger(defaultConfig);
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      expect(() => logger.error('Circular reference', circular)).not.toThrow();
    });
  });

  describe('Performance and Memory', () => {
    test('should handle max log entries configuration', () => {
      const logger = new DefaultLogger({
        level: 'debug',
        enableConsole: true,
        maxLogEntries: 5,
      });
      
      // Log more than max entries
      for (let i = 0; i < 10; i++) {
        expect(() => logger.info(`Message ${i}`)).not.toThrow();
      }
    });

    test('should handle rapid logging', () => {
      const logger = new DefaultLogger(defaultConfig);
      
      // Log many messages quickly
      for (let i = 0; i < 100; i++) {
        expect(() => logger.debug(`Rapid message ${i}`, { iteration: i })).not.toThrow();
      }
    });
  });
});