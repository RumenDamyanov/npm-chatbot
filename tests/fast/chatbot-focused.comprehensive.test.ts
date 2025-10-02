/**
 * Focused Chatbot test for maximum coverage impact
 * Target: Push Chatbot.ts coverage from current ~67% to 80%+
 * Strategy: Test actual public API methods that exist
 */

import { Chatbot } from '../../src/core/Chatbot';
import type { ChatbotConfig, ChatRequest } from '../../src/types/ChatbotTypes';

// Mock all dependencies properly
jest.mock('../../src/core/ConversationManager', () => ({
  ConversationManager: jest.fn().mockImplementation(() => ({
    addMessage: jest.fn(),
    getConversationHistory: jest.fn().mockReturnValue([]),
    clearConversation: jest.fn(),
    getContext: jest.fn().mockReturnValue([]),
    setMaxHistory: jest.fn(),
    getStats: jest.fn().mockReturnValue({ totalMessages: 0, totalTokens: 0 }),
  })),
}));

jest.mock('../../src/core/SecurityManager', () => ({
  SecurityManager: jest.fn().mockImplementation(() => ({
    validateInput: jest.fn().mockResolvedValue({ isValid: true, reason: null }),
    filterOutput: jest.fn().mockImplementation((response: any) => {
      // Return the response but with filtered content to simulate filtering
      return {
        ...response,
        content: `${response.content} (filtered)`,
      };
    }),
    logSecurityEvent: jest.fn(),
  })),
}));

jest.mock('../../src/core/ErrorHandler', () => ({
  ErrorHandler: jest.fn().mockImplementation(() => ({
    handleError: jest.fn(),
    getLastError: jest.fn().mockReturnValue(null),
    clearErrors: jest.fn(),
    getErrorHistory: jest.fn().mockReturnValue([]),
  })),
}));

jest.mock('../../src/utils/Logger', () => ({
  DefaultLogger: jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    setLevel: jest.fn(),
    getLevel: jest.fn().mockReturnValue('info'),
  })),
}));

jest.mock('../../src/utils/RateLimiter', () => ({
  RateLimiter: jest.fn().mockImplementation(() => ({
    checkLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 59 }),
    reset: jest.fn(),
    getStatus: jest.fn().mockReturnValue({ requests: 0, limit: 60 }),
  })),
}));

jest.mock('../../src/providers/ProviderFactory', () => ({
  ProviderFactory: {
    createProvider: jest.fn().mockReturnValue({
      generateResponse: jest.fn().mockResolvedValue({
        content: 'Mock response',
        id: 'mock-id',
        timestamp: new Date(),
        usage: { totalTokens: 10, promptTokens: 5, completionTokens: 5 },
      }),
      generateStreamingResponse: jest.fn().mockImplementation(async function* () {
        yield { content: 'Mock stream chunk', delta: 'Mock stream chunk' };
      }),
      getStatus: jest.fn().mockReturnValue({
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        isHealthy: true,
        lastRequest: new Date(),
        usage: { requests: 1, totalTokens: 10 },
      }),
      validateConfig: jest.fn().mockReturnValue({ isValid: true }),
      updateConfig: jest.fn(),
    }),
    getAvailableProviders: jest.fn().mockReturnValue(['openai', 'anthropic', 'google']),
    validateProviderConfig: jest.fn().mockReturnValue({ isValid: true }),
  },
}));

describe('Chatbot Focused Coverage Tests', () => {
  let validConfig: ChatbotConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    
    validConfig = {
      provider: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        apiKey: 'test-key',
      },
      security: {
        enableContentFiltering: true,
        allowedDomains: ['example.com'],
        blockedWords: ['spam'],
      },
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
      },
      logging: {
        level: 'info' as const,
      },
    };
  });

  describe('Constructor and Configuration', () => {
    test('should create instance with valid config', () => {
      expect(() => new Chatbot(validConfig)).not.toThrow();
      const chatbot = new Chatbot(validConfig);
      expect(chatbot).toBeInstanceOf(Chatbot);
    });

    test('should handle minimal config', () => {
      const minimalConfig: ChatbotConfig = {
        provider: {
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          apiKey: 'test-key',
        },
      };
      
      expect(() => new Chatbot(minimalConfig)).not.toThrow();
    });

    test('should handle full config with all options', () => {
      const fullConfig: ChatbotConfig = {
        ...validConfig,
        maxHistory: 100,
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: 'You are a helpful assistant',
        conversationId: 'test-conversation',
      };
      
      expect(() => new Chatbot(fullConfig)).not.toThrow();
    });

    test('should handle config updates', () => {
      const chatbot = new Chatbot(validConfig);
      
      const updates = {
        temperature: 0.5,
        maxTokens: 1500,
      };
      
      expect(() => chatbot.updateConfig(updates)).not.toThrow();
    });
  });

  describe('Chat Operations', () => {
    test('should handle basic chat with string', async () => {
      const chatbot = new Chatbot(validConfig);
      
      const response = await chatbot.chat('Hello, world!');
      
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(response.content).toContain('Mock response (filtered)');
      expect(response.provider).toBe('openai');
      expect(response.timestamp).toBeInstanceOf(Date);
    });

    test('should handle chat with ChatRequest object', async () => {
      const chatbot = new Chatbot(validConfig);
      
      const request: ChatRequest = {
        message: 'Test message',
        metadata: { userId: 'test-user' },
      };
      
      const response = await chatbot.chat(request);
      
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(response.content).toContain('Mock response (filtered)');
      expect(response.provider).toBe('openai');
    });

    test('should handle streaming chat', async () => {
      const chatbot = new Chatbot(validConfig);
      
      const stream = chatbot.chatStream('Stream test');
      const chunks: string[] = [];
      
      for await (const chunk of stream) {
        chunks.push(chunk.content);
      }
      
      expect(chunks.length).toBeGreaterThan(0);
    });

    test('should handle streaming with ChatRequest object', async () => {
      const chatbot = new Chatbot(validConfig);
      
      const request: ChatRequest = {
        message: 'Stream test',
        metadata: { sessionId: 'test-session' },
      };
      
      const stream = chatbot.chatStream(request);
      const chunks: string[] = [];
      
      for await (const chunk of stream) {
        chunks.push(chunk.content);
      }
      
      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('Conversation Management', () => {
    test('should get conversation history', () => {
      const chatbot = new Chatbot(validConfig);
      
      const history = chatbot.getConversationHistory('test-session');
      
      expect(Array.isArray(history)).toBe(true);
    });

    test('should clear conversation', () => {
      const chatbot = new Chatbot(validConfig);
      
      expect(() => chatbot.clearConversation('test-session')).not.toThrow();
    });
  });

  describe('Provider Status', () => {
    test('should get provider status', async () => {
      const chatbot = new Chatbot(validConfig);
      
      const status = await chatbot.getProviderStatus();
      
      expect(status).toBeDefined();
      expect(status.provider).toBe('openai');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should reject empty messages', async () => {
      const chatbot = new Chatbot(validConfig);
      
      await expect(chatbot.chat('')).rejects.toThrow('Message is required');
    });

    test('should reject null/undefined messages', async () => {
      const chatbot = new Chatbot(validConfig);
      
      await expect(chatbot.chat(null as any)).rejects.toThrow('Message is required');
      await expect(chatbot.chat(undefined as any)).rejects.toThrow('Message is required');
    });

    test('should reject very long messages', async () => {
      const chatbot = new Chatbot(validConfig);
      
      const longMessage = 'A'.repeat(10001); // Over 10,000 character limit
      
      await expect(chatbot.chat(longMessage)).rejects.toThrow('Message is too long');
    });

    test('should handle messages at exact limit', async () => {
      const chatbot = new Chatbot(validConfig);
      
      const maxMessage = 'A'.repeat(10000); // Exactly 10,000 characters
      
      await expect(chatbot.chat(maxMessage)).resolves.toBeDefined();
    });

    test('should handle special characters', async () => {
      const chatbot = new Chatbot(validConfig);
      
      const specialMessage = '🚀 Hello! @#$%^&*()_+ 测试 العربية русский';
      
      await expect(chatbot.chat(specialMessage)).resolves.toBeDefined();
    });

    test('should handle whitespace-only messages', async () => {
      const chatbot = new Chatbot(validConfig);
      
      await expect(chatbot.chat('   ')).rejects.toThrow('Message cannot be empty');
      await expect(chatbot.chat('\t\n  ')).rejects.toThrow('Message cannot be empty');
    });
  });

  describe('Configuration Variations', () => {
    test('should handle different temperature values', () => {
      const configs = [
        { ...validConfig, temperature: 0 },
        { ...validConfig, temperature: 0.5 },
        { ...validConfig, temperature: 1.0 },
        { ...validConfig, temperature: 2.0 },
      ];
      
      configs.forEach(config => {
        expect(() => new Chatbot(config)).not.toThrow();
      });
    });

    test('should handle different maxTokens values', () => {
      const configs = [
        { ...validConfig, maxTokens: 1 },
        { ...validConfig, maxTokens: 100 },
        { ...validConfig, maxTokens: 4096 },
      ];
      
      configs.forEach(config => {
        expect(() => new Chatbot(config)).not.toThrow();
      });
    });

    test('should handle different providers', () => {
      const providers = ['openai', 'anthropic', 'google'];
      
      providers.forEach(provider => {
        const config = {
          ...validConfig,
          provider: {
            ...validConfig.provider,
            provider: provider as any,
          },
        };
        expect(() => new Chatbot(config)).not.toThrow();
      });
    });

    test('should handle optional security settings', () => {
      const configNoSecurity = {
        provider: validConfig.provider,
      };
      
      expect(() => new Chatbot(configNoSecurity)).not.toThrow();
    });

    test('should handle optional logging settings', () => {
      const configNoLogging = {
        provider: validConfig.provider,
      };
      
      expect(() => new Chatbot(configNoLogging)).not.toThrow();
    });
  });

  describe('Advanced Chat Scenarios', () => {
    test('should handle chat with context metadata', async () => {
      const chatbot = new Chatbot(validConfig);
      
      const request: ChatRequest = {
        message: 'Test with context',
        metadata: {
          sessionId: 'test-session',
          userId: 'test-user',
          conversationId: 'test-conv',
        },
      };
      
      const response = await chatbot.chat(request);
      
      expect(response).toBeDefined();
    });

    test('should handle multiple rapid chat requests', async () => {
      const chatbot = new Chatbot(validConfig);
      
      const promises = [
        chatbot.chat('Message 1'),
        chatbot.chat('Message 2'),
        chatbot.chat('Message 3'),
      ];
      
      const responses = await Promise.all(promises);
      
      expect(responses).toHaveLength(3);
      responses.forEach((response) => {
        expect(response).toBeDefined();
        expect(response.content).toBeDefined();
        expect(response.content).toContain('Mock response (filtered)');
        expect(response.provider).toBe('openai');
      });
    });

    test('should handle mixed chat and stream requests', async () => {
      const chatbot = new Chatbot(validConfig);
      
      const chatResponse = await chatbot.chat('Regular chat');
      expect(chatResponse).toBeDefined();
      
      const stream = chatbot.chatStream('Stream chat');
      const chunks: string[] = [];
      
      for await (const chunk of stream) {
        chunks.push(chunk.content);
      }
      
      expect(chunks.length).toBeGreaterThan(0);
    });
  });
});
