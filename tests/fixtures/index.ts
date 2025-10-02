/**
 * Test fixtures and mock data for npm-chatbot tests
 */

import type {
  ChatbotConfig,
  AiProviderConfig,
  ChatMessage,
  ChatResponse,
  ChatContext,
  ChatStreamChunk,
} from '../../src/types/ChatbotTypes';

/**
 * Mock provider configurations
 */
export const mockProviderConfigs: Record<string, AiProviderConfig> = {
  openai: {
    provider: 'openai',
    apiKey: 'sk-test-key-1234567890',
    model: 'gpt-4',
    organizationId: 'org-test',
  },
  anthropic: {
    provider: 'anthropic',
    apiKey: 'sk-ant-test-key-1234567890',
    model: 'claude-sonnet-4-5-20250929',
  },
  google: {
    provider: 'google',
    apiKey: 'test-google-api-key',
    model: 'gemini-1.5-flash',
  },
  invalid: {
    provider: 'openai',
    // Missing API key
    model: 'gpt-4',
  },
};

/**
 * Mock chatbot configurations
 */
export const mockChatbotConfigs: Record<string, ChatbotConfig> = {
  basic: {
    provider: mockProviderConfigs.openai,
    temperature: 0.7,
    maxTokens: 1000,
  },
  withMemory: {
    provider: mockProviderConfigs.openai,
    enableMemory: true,
    maxHistory: 10,
    systemPrompt: 'You are a helpful assistant.',
  },
  withSecurity: {
    provider: mockProviderConfigs.openai,
    security: {
      enableInputFilter: true,
      enableOutputFilter: true,
      profanityFilter: {
        enabled: true,
        strictMode: true,
      },
    },
  },
  withRateLimit: {
    provider: mockProviderConfigs.openai,
    rateLimit: {
      enabled: true,
      requestsPerMinute: 60,
      requestsPerHour: 1000,
    },
  },
};

/**
 * Mock chat messages
 */
export const mockMessages: Record<string, ChatMessage> = {
  user: {
    role: 'user',
    content: 'Hello, how are you?',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    id: 'msg_1',
    metadata: {},
  },
  assistant: {
    role: 'assistant',
    content: "Hello! I'm doing well, thank you for asking. How can I help you today?",
    timestamp: new Date('2024-01-01T10:00:01Z'),
    id: 'msg_2',
    metadata: {},
  },
  system: {
    role: 'system',
    content: 'You are a helpful assistant.',
    timestamp: new Date('2024-01-01T09:59:59Z'),
    id: 'msg_0',
    metadata: {},
  },
  long: {
    role: 'user',
    content: 'This is a very long message that exceeds normal limits. '.repeat(100),
    timestamp: new Date('2024-01-01T10:05:00Z'),
    id: 'msg_long',
    metadata: {},
  },
  empty: {
    role: 'user',
    content: '',
    timestamp: new Date('2024-01-01T10:06:00Z'),
    id: 'msg_empty',
    metadata: {},
  },
};

/**
 * Mock chat responses
 */
export const mockResponses: Record<string, ChatResponse> = {
  basic: {
    content: 'This is a mock response from the AI provider.',
    provider: 'openai',
    timestamp: new Date('2024-01-01T10:00:01Z'),
    metadata: {
      model: 'gpt-4',
      usage: {
        promptTokens: 10,
        completionTokens: 15,
        totalTokens: 25,
      },
      responseTime: 500,
    },
  },
  streaming: {
    content: 'This is a streaming response chunk.',
    provider: 'anthropic',
    timestamp: new Date('2024-01-01T10:00:02Z'),
    metadata: {
      model: 'claude-sonnet-4-5-20250929',
      chunkIndex: 1,
    },
  },
  error: {
    content: 'Error response for testing error handling.',
    provider: 'google',
    timestamp: new Date('2024-01-01T10:00:03Z'),
    metadata: {
      error: true,
      errorType: 'rate_limit',
    },
  },
};

/**
 * Mock streaming chunks
 */
export const mockStreamChunks: ChatStreamChunk[] = [
  {
    content: 'Hello',
    type: 'content',
    provider: 'openai',
    timestamp: new Date('2024-01-01T10:00:01.100Z'),
    metadata: { chunkIndex: 1 },
  },
  {
    content: ' there!',
    type: 'content',
    provider: 'openai',
    timestamp: new Date('2024-01-01T10:00:01.200Z'),
    metadata: { chunkIndex: 2 },
  },
  {
    content: ' How',
    type: 'content',
    provider: 'openai',
    timestamp: new Date('2024-01-01T10:00:01.300Z'),
    metadata: { chunkIndex: 3 },
  },
  {
    content: ' can I help?',
    type: 'content',
    provider: 'openai',
    timestamp: new Date('2024-01-01T10:00:01.400Z'),
    metadata: { chunkIndex: 4 },
  },
  {
    content: '',
    type: 'done',
    provider: 'openai',
    timestamp: new Date('2024-01-01T10:00:01.500Z'),
    metadata: {
      totalChunks: 4,
      finalContent: 'Hello there! How can I help?',
      processingTime: 500,
    },
  },
];

/**
 * Mock conversation contexts
 */
export const mockContexts: Record<string, ChatContext> = {
  empty: {
    messages: [],
    sessionId: 'session_1',
    userId: 'user_1',
    metadata: {},
  },
  withHistory: {
    messages: [mockMessages.system, mockMessages.user, mockMessages.assistant],
    sessionId: 'session_2',
    userId: 'user_1',
    systemPrompt: 'You are a helpful assistant.',
    metadata: { conversationStarted: '2024-01-01T10:00:00Z' },
  },
  longHistory: {
    messages: Array.from({ length: 20 }, (_, i) => ({
      ...mockMessages.user,
      id: `msg_${i}`,
      content: `Message ${i + 1}`,
    })) as ChatMessage[],
    sessionId: 'session_3',
    userId: 'user_2',
    metadata: {},
  },
};

/**
 * Mock API responses for different providers
 */
export const mockApiResponses = {
  openai: {
    success: {
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'Hello! How can I help you today?',
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 15,
        total_tokens: 25,
      },
      model: 'gpt-4',
    },
    rateLimitError: {
      error: {
        message: 'Rate limit exceeded',
        type: 'rate_limit_exceeded',
        code: 'rate_limit_exceeded',
      },
    },
    authError: {
      error: {
        message: 'Invalid API key provided',
        type: 'invalid_request_error',
        code: 'invalid_api_key',
      },
    },
  },
  anthropic: {
    success: {
      content: [
        {
          type: 'text',
          text: 'Hello! How can I assist you today?',
        },
      ],
      model: 'claude-sonnet-4-5-20250929',
      usage: {
        input_tokens: 10,
        output_tokens: 15,
      },
    },
    error: {
      error: {
        type: 'authentication_error',
        message: 'Authentication failed',
      },
    },
  },
  google: {
    success: {
      candidates: [
        {
          content: {
            parts: [
              {
                text: "Hello! I'm here to help. What can I do for you?",
              },
            ],
          },
          finishReason: 'STOP',
        },
      ],
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 18,
        totalTokenCount: 28,
      },
    },
    error: {
      error: {
        code: 429,
        message: 'Resource exhausted',
        status: 'RESOURCE_EXHAUSTED',
      },
    },
  },
};

/**
 * Mock error scenarios
 */
export const mockErrors = {
  network: new Error('ECONNRESET: Connection reset by peer'),
  timeout: new Error('ETIMEDOUT: Request timeout'),
  rateLimit: new Error('429 Too Many Requests: Rate limit exceeded'),
  authentication: new Error('401 Unauthorized: Invalid API key'),
  quotaExceeded: new Error('403 Forbidden: Quota exceeded'),
  invalidRequest: new Error('400 Bad Request: Invalid parameters'),
  serverError: new Error('500 Internal Server Error'),
  contentPolicy: new Error('Content policy violation detected'),
  modelNotFound: new Error('404 Not Found: Model not available'),
};

/**
 * Utility functions for tests
 */
export const testUtils = {
  /**
   * Create a mock provider response with delay
   */
  createMockResponse: (content: string, delay = 0): Promise<ChatResponse> => {
    return new Promise((resolve) => {
      globalThis.setTimeout(() => {
        resolve({
          content,
          provider: 'openai',
          timestamp: new Date(),
          metadata: {
            model: 'gpt-4',
            usage: {
              promptTokens: 10,
              completionTokens: content.split(' ').length,
              totalTokens: 10 + content.split(' ').length,
            },
          },
        });
      }, delay);
    });
  },

  /**
   * Create a mock streaming response
   */
  *createMockStream(chunks: string[]): Generator<string, void, unknown> {
    for (const chunk of chunks) {
      yield chunk;
    }
  },

  /**
   * Create a mock error with specific type
   */
  createMockError: (type: keyof typeof mockErrors): Error => {
    return new Error(mockErrors[type].message);
  },

  /**
   * Wait for a specified amount of time
   */
  wait: (ms: number): Promise<void> => {
    return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
  },

  /**
   * Generate random test data
   */
  randomString: (length = 10): string => {
    return Math.random()
      .toString(36)
      .substring(2, 2 + length);
  },

  randomNumber: (min = 0, max = 100): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
};
