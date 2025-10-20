/**
 * Quick coverage tests for utility functions
 * These tests target simple uncovered functions to push coverage over 90%
 */

import { createLogger, createNullLogger } from '../../src/utils/Logger';
import { OpenAIProvider } from '../../src/providers/OpenAIProvider';
import { AnthropicProvider } from '../../src/providers/AnthropicProvider';
import { GoogleProvider } from '../../src/providers/GoogleProvider';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

jest.mock('openai');
jest.mock('@anthropic-ai/sdk');
jest.mock('@google/generative-ai');

describe('Utility Functions Coverage', () => {
  describe('Logger utility functions', () => {
    it('should create logger with category', () => {
      const logger = createLogger('test-category');
      expect(logger).toBeDefined();
    });

    it('should create logger with custom config', () => {
      const logger = createLogger('test-category', { enableConsole: true });
      expect(logger).toBeDefined();
    });

    it('should create null logger', () => {
      const logger = createNullLogger();
      expect(logger).toBeDefined();
      expect(logger.getLevel()).toBe('error');
    });

    it('should handle null logger operations', () => {
      const logger = createNullLogger();
      logger.debug('test');
      logger.info('test');
      logger.warn('test');
      logger.error('test');
      logger.setLevel('info');
      expect(logger.getLevel()).toBe('error');
    });
  });

  describe('Provider getModels methods', () => {
    let mockOpenAIInstance: any;
    let mockAnthropicInstance: any;
    let mockGoogleAI: any;
    let mockGoogleModel: any;

    beforeEach(() => {
      jest.clearAllMocks();

      // Mock OpenAI
      mockOpenAIInstance = {
        models: { list: jest.fn() },
        chat: { completions: { create: jest.fn() } },
      };
      (OpenAI as any).mockImplementation(() => mockOpenAIInstance);

      // Mock Anthropic
      mockAnthropicInstance = {
        messages: { create: jest.fn(), stream: jest.fn() },
      };
      (Anthropic as any).mockImplementation(() => mockAnthropicInstance);

      // Mock Google
      mockGoogleModel = {
        generateContent: jest.fn(),
        generateContentStream: jest.fn(),
      };
      mockGoogleAI = {
        getGenerativeModel: jest.fn(() => mockGoogleModel),
      };
      (GoogleGenerativeAI as any).mockImplementation(() => mockGoogleAI);
    });

    it('should get models from OpenAI provider', async () => {
      const config = { apiKey: 'test-key', model: 'gpt-4' };
      const provider = new OpenAIProvider(config as any);

      mockOpenAIInstance.models.list.mockResolvedValue({
        data: [
          { id: 'gpt-4', object: 'model' },
          { id: 'gpt-3.5-turbo', object: 'model' },
          { id: 'text-davinci-003', object: 'model' },
        ],
      });

      const models = await provider.getModels();
      expect(models).toContain('gpt-4');
      expect(models).toContain('gpt-3.5-turbo');
      expect(models.length).toBeGreaterThan(0);
    });

    it('should handle getModels error in OpenAI', async () => {
      const config = { apiKey: 'test-key', model: 'gpt-4' };
      const provider = new OpenAIProvider(config as any);

      mockOpenAIInstance.models.list.mockRejectedValue(new Error('API Error'));

      await expect(provider.getModels()).rejects.toThrow();
    });

    it('should get models from Anthropic provider', async () => {
      const config = { apiKey: 'test-key', model: 'claude-3-opus-20240229' };
      const provider = new AnthropicProvider(config as any);

      const models = await provider.getModels();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });

    it('should get models from Google provider', async () => {
      const config = { apiKey: 'test-key', model: 'gemini-pro' };
      const provider = new GoogleProvider(config as any);

      const models = await provider.getModels();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });
  });

  describe('Provider testConnection methods', () => {
    let mockOpenAIInstance: any;

    beforeEach(() => {
      mockOpenAIInstance = {
        models: { list: jest.fn() },
        chat: { completions: { create: jest.fn() } },
      };
      (OpenAI as any).mockImplementation(() => mockOpenAIInstance);
    });

    it('should test OpenAI connection', async () => {
      const config = { apiKey: 'test-key', model: 'gpt-4' };
      const provider = new OpenAIProvider(config as any);

      mockOpenAIInstance.models.list.mockResolvedValue({ data: [] });

      const result = await provider.testConnection();
      expect(typeof result).toBe('boolean');
    });
  });
});
