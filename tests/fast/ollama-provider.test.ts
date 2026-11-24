import { OllamaProvider } from '../../src/providers/OllamaProvider';
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

describe('OllamaProvider', () => {
  const config: AiProviderConfig = {
    provider: 'ollama',
    model: 'llama3.3',
    apiUrl: 'http://localhost:11434',
    apiKey: 'local-key',
  };

  const context: ChatContext = {
    messages: [
      { role: 'user', content: 'earlier' },
      { role: 'assistant', content: 'reply' },
    ],
    systemPrompt: 'Be brief',
    metadata: { source: 'test' },
  };

  const options: GenerationOptions = {
    temperature: 0.4,
    maxTokens: 20,
    topP: 0.9,
    stop: ['END'],
  };

  let provider: OllamaProvider;

  beforeEach(() => {
    fetchMock.mockReset();
    provider = new OllamaProvider(config);
  });

  it('requires a model name and rejects an unsafe one', () => {
    expect(() => new OllamaProvider({ ...config, model: undefined })).toThrow(
      'Ollama model name is required'
    );
    expect(() => new OllamaProvider({ ...config, model: '../other' })).toThrow(/not allowed/);
  });

  it('reports availability from the tags endpoint', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ models: [] }));
    await expect(provider.isAvailable()).resolves.toBe(true);
    await expect(provider.testConnection()).resolves.toBe(true);
    fetchMock.mockReset();

    fetchMock.mockRejectedValueOnce('offline');
    await expect(provider.isAvailable()).resolves.toBe(false);
    expect(provider.getLastError()?.message).toBe('Unknown error');
  });

  it('returns a chat response with server timings', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        message: { content: 'Hello' },
        done: true,
        prompt_eval_count: 4,
        eval_count: 2,
        total_duration: 10,
        load_duration: 1,
        prompt_eval_duration: 2,
        eval_duration: 3,
      })
    );

    const response = await provider.generateResponse('Hi', context, options);

    expect(response.content).toBe('Hello');
    expect(response.provider).toBe('ollama');
    expect(response.metadata?.finishReason).toBe('stop');
    expect(response.metadata?.usage?.totalTokens).toBe(6);
    expect(response.metadata?.totalDuration).toBe(10);
    expect(response.metadata?.source).toBe('test');
  });

  it('rejects an empty completion and an HTTP error', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: {} }));
    await expect(provider.generateResponse('Hi', { messages: [] })).rejects.toThrow(
      'No response generated'
    );

    fetchMock.mockResolvedValueOnce(jsonResponse('nope', false, 400));
    await expect(provider.generateResponse('Hi', { messages: [] })).rejects.toThrow(
      'Ollama API error (400)'
    );
  });

  it('streams message content and skips malformed lines', async () => {
    fetchMock.mockResolvedValueOnce(
      streamResponse([
        '{"message":{"content":"Hi"},"done":false}\n',
        'not-json\n',
        '\n',
        '{"message":{"content":"!"},"done":true}\n',
      ])
    );

    const chunks: string[] = [];
    for await (const chunk of provider.generateStreamingResponse('Hi', context, options)) {
      chunks.push(chunk);
    }
    expect(chunks).toEqual(['Hi', '!']);
  });

  it('rejects a failed stream and a missing body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse('denied', false, 401));
    await expect(provider.generateStreamingResponse('Hi', { messages: [] }).next()).rejects.toThrow(
      'Ollama streaming error (401)'
    );

    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, body: null } as Response);
    await expect(provider.generateStreamingResponse('Hi', { messages: [] }).next()).rejects.toThrow(
      'No response body'
    );
  });

  it('lists, pulls, and deletes models', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ models: [{ name: 'llama3.3' }, { name: 'mistral' }] })
    );
    await expect(provider.getModels()).resolves.toEqual(['llama3.3', 'mistral']);

    fetchMock.mockResolvedValueOnce(jsonResponse('no', false, 500));
    await expect(provider.getModels()).rejects.toThrow('Failed to fetch models');

    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 'success' }));
    await expect(provider.pullModel('llama3.3')).resolves.toBeUndefined();

    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'missing' }));
    await expect(provider.pullModel('missing')).rejects.toThrow('missing');

    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    await expect(provider.deleteModel('llama3.3')).resolves.toBeUndefined();

    fetchMock.mockResolvedValueOnce(jsonResponse('no', false, 404));
    await expect(provider.deleteModel('missing')).rejects.toThrow('Failed to delete model');
  });

  it('validates that the configured model is installed', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ models: [{ name: 'llama3.3' }] }));
    await expect(provider.validateConfig(config)).resolves.toBe(true);

    fetchMock.mockResolvedValueOnce(jsonResponse({ models: [{ name: 'other' }] }));
    await expect(provider.validateConfig(config)).resolves.toBe(false);

    await expect(provider.validateConfig({ ...config, model: undefined })).resolves.toBe(false);

    fetchMock.mockRejectedValueOnce(new Error('down'));
    await expect(provider.validateConfig(config)).resolves.toBe(false);
  });

  it('reads the server version, updates config, and resets usage', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ version: '0.5.0' }));
    await expect(provider.getServerVersion()).resolves.toBe('0.5.0');

    fetchMock.mockResolvedValueOnce(jsonResponse({}, false, 500));
    await expect(provider.getServerVersion()).resolves.toBe('unknown');

    fetchMock.mockRejectedValueOnce(new Error('down'));
    await expect(provider.getServerVersion()).resolves.toBe('unknown');

    provider.updateConfig({ endpoint: 'http://127.0.0.1:11434', model: 'mistral', apiKey: '' });
    provider.resetUsage();

    fetchMock.mockResolvedValueOnce(jsonResponse({ models: [] }));
    const status = await provider.getStatus();
    expect(status.model).toBe('mistral');
    expect(status.available).toBe(true);
    expect(status.usage.requests).toBe(0);
  });
});
