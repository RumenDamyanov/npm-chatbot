import type { IAiProvider, ProviderStatus } from '../../src/types/ProviderTypes';
import type { AiProviderConfig } from '../../src/types/ChatbotTypes';

/**
 * Mock provider implementations for testing
 * These are test helpers and should not be included in production code coverage
 */

export class MockOpenAIProvider implements IAiProvider {
  name = 'OpenAI';
  capabilities = {
    streaming: true,
    contextWindow: 128000,
    supportedModels: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    functionCalling: true,
    vision: true,
  };

  constructor(private config: AiProviderConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generateResponse(
    message: string,
    context: any,
    options?: any
  ): Promise<{
    content: string;
    metadata?: Record<string, unknown>;
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  }> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      content: `Mock OpenAI response to: ${message}`,
      metadata: {
        model: this.config.model || 'gpt-4',
        provider: 'openai',
        mockResponse: true,
      },
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
    };
  }

  async *generateStreamingResponse(
    message: string,
    context?: any,
    options?: any
  ): AsyncGenerator<string, void, unknown> {
    const response = `Mock OpenAI streaming response to: ${message}`;
    const words = response.split(' ');

    for (const word of words) {
      yield `${word} `;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  async getStatus(): Promise<ProviderStatus> {
    return {
      available: true,
      model: this.config.model || 'gpt-4',
      version: '1.0.0',
    };
  }

  async validateConfig(): Promise<boolean> {
    return !!this.config.apiKey;
  }

  async updateConfig(newConfig: Partial<AiProviderConfig>): Promise<void> {
    Object.assign(this.config, newConfig);
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  async getModels(): Promise<string[]> {
    return this.capabilities.supportedModels;
  }
}

export class MockAnthropicProvider implements IAiProvider {
  name = 'Anthropic';
  capabilities = {
    streaming: true,
    contextWindow: 200000,
    supportedModels: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    functionCalling: true,
    vision: true,
  };

  constructor(private config: AiProviderConfig) {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generateResponse(
    message: string,
    context: any,
    options?: any
  ): Promise<{
    content: string;
    metadata?: Record<string, unknown>;
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  }> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return {
      content: `Mock Anthropic response to: ${message}`,
      metadata: {
        model: this.config.model || 'claude-3-sonnet',
        provider: 'anthropic',
        mockResponse: true,
      },
      usage: {
        promptTokens: 15,
        completionTokens: 25,
        totalTokens: 40,
      },
    };
  }

  async validateConfig(): Promise<boolean> {
    return true;
  }

  async updateConfig(newConfig: Partial<AiProviderConfig>): Promise<void> {
    Object.assign(this.config, newConfig);
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  async getModels(): Promise<string[]> {
    return this.capabilities.supportedModels;
  }
}

export class MockGoogleProvider implements IAiProvider {
  name = 'Google';
  capabilities = {
    streaming: true,
    contextWindow: 32000,
    supportedModels: ['gemini-pro', 'gemini-pro-vision'],
    functionCalling: true,
    vision: true,
  };

  constructor(private config: AiProviderConfig) {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generateResponse(
    message: string,
    context: any,
    options?: any
  ): Promise<{
    content: string;
    metadata?: Record<string, unknown>;
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  }> {
    await new Promise((resolve) => setTimeout(resolve, 120));
    return {
      content: `Mock Google response to: ${message}`,
      metadata: {
        model: this.config.model || 'gemini-pro',
        provider: 'google',
        mockResponse: true,
      },
      usage: {
        promptTokens: 12,
        completionTokens: 18,
        totalTokens: 30,
      },
    };
  }

  async validateConfig(): Promise<boolean> {
    return true;
  }

  async updateConfig(newConfig: Partial<AiProviderConfig>): Promise<void> {
    Object.assign(this.config, newConfig);
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  async getModels(): Promise<string[]> {
    return this.capabilities.supportedModels;
  }
}

export class MockMetaProvider implements IAiProvider {
  name = 'Meta';
  capabilities = {
    streaming: true,
    contextWindow: 8192,
    supportedModels: ['llama-2-70b', 'llama-2-13b'],
    functionCalling: false,
    vision: false,
  };

  constructor(private config: AiProviderConfig) {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generateResponse(
    message: string,
    context: any,
    options?: any
  ): Promise<{
    content: string;
    metadata?: Record<string, unknown>;
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  }> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      content: `Mock Meta response to: ${message}`,
      metadata: {
        model: this.config.model || 'llama-2-70b',
        provider: 'meta',
        mockResponse: true,
      },
      usage: {
        promptTokens: 8,
        completionTokens: 16,
        totalTokens: 24,
      },
    };
  }

  async validateConfig(): Promise<boolean> {
    return true;
  }

  async updateConfig(newConfig: Partial<AiProviderConfig>): Promise<void> {
    Object.assign(this.config, newConfig);
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  async getModels(): Promise<string[]> {
    return this.capabilities.supportedModels;
  }
}

export class MockXAIProvider implements IAiProvider {
  name = 'xAI';
  capabilities = {
    streaming: true,
    contextWindow: 32000,
    supportedModels: ['grok-1'],
    functionCalling: false,
    vision: false,
  };

  constructor(private config: AiProviderConfig) {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generateResponse(
    message: string,
    context: any,
    options?: any
  ): Promise<{
    content: string;
    metadata?: Record<string, unknown>;
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  }> {
    await new Promise((resolve) => setTimeout(resolve, 180));
    return {
      content: `Mock xAI response to: ${message}`,
      metadata: {
        model: this.config.model || 'grok-1',
        provider: 'xai',
        mockResponse: true,
      },
      usage: {
        promptTokens: 14,
        completionTokens: 22,
        totalTokens: 36,
      },
    };
  }

  async validateConfig(): Promise<boolean> {
    return true;
  }

  async updateConfig(newConfig: Partial<AiProviderConfig>): Promise<void> {
    Object.assign(this.config, newConfig);
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  async getModels(): Promise<string[]> {
    return this.capabilities.supportedModels;
  }
}

export class MockDeepSeekProvider implements IAiProvider {
  name = 'DeepSeek';
  capabilities = {
    streaming: true,
    contextWindow: 32000,
    supportedModels: ['deepseek-chat', 'deepseek-coder'],
    functionCalling: true,
    vision: false,
  };

  constructor(private config: AiProviderConfig) {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generateResponse(
    message: string,
    context: any,
    options?: any
  ): Promise<{
    content: string;
    metadata?: Record<string, unknown>;
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  }> {
    await new Promise((resolve) => setTimeout(resolve, 140));
    return {
      content: `Mock DeepSeek response to: ${message}`,
      metadata: {
        model: this.config.model || 'deepseek-chat',
        provider: 'deepseek',
        mockResponse: true,
      },
      usage: {
        promptTokens: 11,
        completionTokens: 19,
        totalTokens: 30,
      },
    };
  }

  async validateConfig(): Promise<boolean> {
    return true;
  }

  async updateConfig(newConfig: Partial<AiProviderConfig>): Promise<void> {
    Object.assign(this.config, newConfig);
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  async getModels(): Promise<string[]> {
    return this.capabilities.supportedModels;
  }
}

export class MockOllamaProvider implements IAiProvider {
  name = 'Ollama';
  capabilities = {
    streaming: true,
    contextWindow: 32000,
    supportedModels: ['llama2', 'mistral', 'codellama'],
    functionCalling: false,
    vision: false,
  };

  constructor(private config: AiProviderConfig) {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generateResponse(
    message: string,
    context: any,
    options?: any
  ): Promise<{
    content: string;
    metadata?: Record<string, unknown>;
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  }> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      content: `Mock Ollama response to: ${message}`,
      metadata: {
        model: this.config.model || 'llama2',
        provider: 'ollama',
        mockResponse: true,
      },
      usage: {
        promptTokens: 9,
        completionTokens: 17,
        totalTokens: 26,
      },
    };
  }

  async validateConfig(): Promise<boolean> {
    return true;
  }

  async updateConfig(newConfig: Partial<AiProviderConfig>): Promise<void> {
    Object.assign(this.config, newConfig);
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  async getModels(): Promise<string[]> {
    return this.capabilities.supportedModels;
  }
}
