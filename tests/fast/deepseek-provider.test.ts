import { DeepSeekProvider } from '../../src/providers/DeepSeekProvider';
import type {
  AiProviderConfig,
  ChatContext,
  GenerationOptions,
} from '../../src/types/ChatbotTypes';

const fetchMock = jest.fn();
global.fetch = fetchMock;

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Bad Request',
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    json: async () => body,
  } as Response;
}

function streamResponse(chunks: string[], ok = true): Response {
  let index = 0;
  const encoder = new TextEncoder();
  return {
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? 'OK' : 'Error',
    text: async () => 'stream failed',
    body: {
      getReader: () => ({
        read: async () => {
          if (index >= chunks.length) {
            return { done: true, value: undefined };
          }
          const value = encoder.encode(chunks[index]);
          index += 1;
          return { done: false, value };
        },
      }),
    },
  } as unknown as Response;
}

describe('DeepSeekProvider', () => {
  const config: AiProviderConfig = {
    provider: 'deepseek',
    apiKey: 'test-key',
    model: 'deepseek-chat',
    endpoint: 'https://api.deepseek.com/v1',
  };

  const context: ChatContext = {
    messages: [
      { role: 'user', content: 'earlier' },
      { role: 'assistant', content: 'reply' },
      { role: 'system', content: 'note' },
    ],
    systemPrompt: 'Be brief',
    metadata: { source: 'test' },
  };

  const options: GenerationOptions = {
    temperature: 0.2,
    maxTokens: 40,
    topP: 0.8,
    frequencyPenalty: 0.1,
    presencePenalty: 0.2,
    stop: ['END'],
  };

  let provider: DeepSeekProvider;

  beforeEach(() => {
    fetchMock.mockReset();
    provider = new DeepSeekProvider(config);
  });

  it('requires an API key and rejects an unsafe model name', () => {
    expect(() => new DeepSeekProvider({ ...config, apiKey: undefined })).toThrow(
      'DeepSeek API key is required'
    );
    expect(() => new DeepSeekProvider({ ...config, model: '../other' })).toThrow(/not allowed/);
  });

  it('reports availability from the models endpoint', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [] }));
    await expect(provider.isAvailable()).resolves.toBe(true);
    await expect(provider.testConnection()).resolves.toBe(true);
    fetchMock.mockReset();

    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(provider.isAvailable()).resolves.toBe(false);
    expect(provider.getLastError()?.message).toBe('offline');
  });

  it('returns a chat response and tracks usage', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        choices: [{ message: { content: 'Hello' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5, reasoning_tokens: 1 },
      })
    );

    const response = await provider.generateResponse('Hi', context, options);

    expect(response.content).toBe('Hello');
    expect(response.provider).toBe('deepseek');
    expect(response.metadata?.usage?.totalTokens).toBe(5);
    expect(response.metadata?.reasoningTokens).toBe(1);
    expect(response.metadata?.source).toBe('test');
  });

  it('rejects an empty completion and an HTTP error', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ choices: [{}] }));
    await expect(provider.generateResponse('Hi', { messages: [] })).rejects.toThrow(
      'No response generated'
    );

    fetchMock.mockResolvedValueOnce(jsonResponse('nope', false, 400));
    await expect(provider.generateResponse('Hi', { messages: [] })).rejects.toThrow(
      'DeepSeek API error (400)'
    );
  });

  it('streams text deltas and skips malformed lines', async () => {
    fetchMock.mockResolvedValueOnce(
      streamResponse([
        'data: {"choices":[{"delta":{"content":"Hi"}}]}\n',
        'not-data\n',
        'data: {bad}\n',
        'data: [DONE]\n',
      ])
    );

    const chunks: string[] = [];
    for await (const chunk of provider.generateStreamingResponse('Hi', context, options)) {
      chunks.push(chunk);
    }
    expect(chunks).toEqual(['Hi']);
  });

  it('rejects a failed stream and a missing body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse('denied', false, 401));
    await expect(provider.generateStreamingResponse('Hi', { messages: [] }).next()).rejects.toThrow(
      'DeepSeek streaming error (401)'
    );

    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, body: null } as Response);
    await expect(provider.generateStreamingResponse('Hi', { messages: [] }).next()).rejects.toThrow(
      'No response body'
    );
  });

  it('lists models, updates config, and resets usage', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ data: [{ id: 'deepseek-chat' }, { id: 'other-model' }] })
    );
    await expect(provider.getModels()).resolves.toEqual(['deepseek-chat']);

    fetchMock.mockResolvedValueOnce(jsonResponse('no', false, 403));
    await expect(provider.getModels()).rejects.toThrow('Failed to fetch models');

    fetchMock.mockResolvedValueOnce(jsonResponse({}, true));
    await expect(provider.validateConfig(config)).resolves.toBe(true);
    await expect(provider.validateConfig({ ...config, apiKey: undefined })).resolves.toBe(false);
    fetchMock.mockRejectedValueOnce(new Error('down'));
    await expect(provider.validateConfig(config)).resolves.toBe(false);

    provider.updateConfig({
      apiKey: 'next',
      apiUrl: 'https://example.com/v1',
      model: 'deepseek-coder',
    });
    provider.resetUsage();

    fetchMock.mockResolvedValueOnce(jsonResponse({}, true));
    const status = await provider.getStatus();
    expect(status.model).toBe('deepseek-coder');
    expect(status.usage.requests).toBe(0);
    expect(status.lastError?.message).toContain('Failed to fetch models');
  });
});
