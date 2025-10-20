# 🤖 npm-chatbot

[![CI](https://github.com/RumenDamyanov/npm-chatbot/actions/workflows/ci.yml/badge.svg)](https://github.com/RumenDamyanov/npm-chatbot/actions)
[![CodeQL](https://github.com/RumenDamyanov/npm-chatbot/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/RumenDamyanov/npm-chatbot/actions/workflows/github-code-scanning/codeql)
[![Dependabot](https://github.com/RumenDamyanov/npm-chatbot/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/RumenDamyanov/npm-chatbot/actions/workflows/dependabot/dependabot-updates)
[![codecov](https://codecov.io/gh/RumenDamyanov/npm-chatbot/branch/master/graph/badge.svg)](https://codecov.io/gh/RumenDamyanov/npm-chatbot)
[![npm version](https://img.shields.io/npm/v/@rumenx/chatbot.svg)](https://www.npmjs.com/package/@rumenx/chatbot)

A powerful, flexible, and type-safe AI chatbot library for TypeScript/JavaScript
applications with support for OpenAI, Anthropic Claude, and Google Gemini.

## 📦 Part of the Chatbot Family

This is the **TypeScript/JavaScript** implementation of our multi-language
chatbot library:

- 📘 **[npm-chatbot](https://github.com/RumenDamyanov/npm-chatbot)** -
  TypeScript/JavaScript (this package)
- 🐘 **[php-chatbot](https://github.com/RumenDamyanov/php-chatbot)** - PHP
  implementation
- 🔷 **[go-chatbot](https://github.com/RumenDamyanov/go-chatbot)** - Go
  implementation

All implementations share the same API design and features, making it easy to
switch between languages or maintain consistency across polyglot projects.

---

## ✨ Features

- 🎯 **Three Major AI Providers** - OpenAI (GPT-4o, GPT-4 Turbo, o1), Anthropic
  (Claude Sonnet 4.5, Opus 4.1), Google AI (Gemini 2.0, 1.5 Pro)
- 📝 **Type-Safe** - Full TypeScript support with comprehensive type definitions
- 💾 **Conversation Memory** - Built-in conversation history management
- 🔒 **Security** - Input/output filtering, content moderation, rate limiting
- ⚡ **Streaming Support** - Real-time response streaming for all providers
- 🔄 **Error Handling** - Comprehensive error handling with retry logic
- 📊 **Usage Tracking** - Token usage and cost tracking
- 🧪 **Extensively Tested** - 94% test coverage with 880+ tests
- 🌐 **Universal** - Works in Node.js and modern browsers
- 📦 **Tree-Shakeable** - Optimized bundle size with ESM support

---

## 📋 Table of Contents

- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Usage Examples](#-usage-examples)
  - [OpenAI](#openai-example)
  - [Anthropic Claude](#anthropic-claude-example)
  - [Google Gemini](#google-gemini-example)
  - [Streaming Responses](#streaming-responses)
  - [Using with React](#using-with-react)
  - [Using with Express.js](#using-with-expressjs)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)

---

## 📦 Installation

```bash
# Using npm
npm install @rumenx/chatbot

# Using yarn
yarn add @rumenx/chatbot

# Using pnpm
pnpm add @rumenx/chatbot
```

### Peer Dependencies

Install the AI provider SDK(s) you plan to use:

```bash
# For OpenAI
npm install openai

# For Anthropic
npm install @anthropic-ai/sdk

# For Google AI
npm install @google/generative-ai
```

All provider dependencies are **optional peer dependencies**, so you only
install what you need.

---

## 🚀 Quick Start

```typescript
import { Chatbot } from '@rumenx/chatbot';

// Initialize chatbot with OpenAI
const chatbot = new Chatbot({
  provider: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o', // Latest: 'gpt-4o', 'gpt-4-turbo', 'o1-preview'
  },
  temperature: 0.7,
  maxTokens: 150,
});

// Send a message
const response = await chatbot.chat({
  message: 'Hello! How are you?',
  metadata: {
    sessionId: 'user-123',
    userId: 'user-123',
  },
});

console.log(response.content);
// Output: "Hello! I'm doing well, thank you for asking. How can I help you today?"
```

---

## 💡 Usage Examples

### OpenAI Example

```typescript
import { Chatbot } from '@rumenx/chatbot';
import type { ChatbotConfig } from '@rumenx/chatbot';

const config: ChatbotConfig = {
  provider: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o', // Latest: 'gpt-4o', 'gpt-4-turbo', 'o1-preview' (Note: gpt-3.5-turbo deprecated)
  },
  systemPrompt: 'You are a helpful AI assistant.',
  temperature: 0.7,
  maxTokens: 500,
  enableMemory: true,
  maxHistory: 20,
  security: {
    enableInputFilter: true,
    enableOutputFilter: true,
    maxInputLength: 4000,
  },
  rateLimit: {
    enabled: true,
    requestsPerMinute: 10,
    requestsPerHour: 100,
  },
};

const chatbot = new Chatbot(config);

// Simple chat
const response = await chatbot.chat({
  message: 'What is the capital of France?',
  metadata: {
    sessionId: 'session-1',
    userId: 'user-1',
  },
});

console.log(response.content); // "The capital of France is Paris."
console.log(response.metadata.usage); // { promptTokens: 15, completionTokens: 8, totalTokens: 23 }
```

### Anthropic Claude Example

```typescript
import { Chatbot } from '@rumenx/chatbot';

const chatbot = new Chatbot({
  provider: {
    provider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: 'claude-sonnet-4-5-20250929', // Latest: Claude Sonnet 4.5 (Sep 2025), Opus 4.1, Haiku 4.5
  },
  temperature: 0.8,
  maxTokens: 1000,
});

const response = await chatbot.chat({
  message: 'Explain quantum computing in simple terms.',
  metadata: {
    sessionId: 'session-2',
    userId: 'user-2',
  },
});

console.log(response.content);
```

### Google Gemini Example

```typescript
import { Chatbot } from '@rumenx/chatbot';

const chatbot = new Chatbot({
  provider: {
    provider: 'google',
    apiKey: process.env.GOOGLE_API_KEY!,
    model: 'gemini-2.0-flash-exp', // Latest: 'gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'
  },
  temperature: 0.9,
  maxTokens: 800,
});

const response = await chatbot.chat({
  message: 'Write a haiku about programming.',
  metadata: {
    sessionId: 'session-3',
    userId: 'user-3',
  },
});

console.log(response.content);
```

### Streaming Responses

Stream responses in real-time for better UX:

```typescript
import { Chatbot } from '@rumenx/chatbot';

const chatbot = new Chatbot({
  provider: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o',
  },
});

// Stream responses
const stream = chatbot.chatStream({
  message: 'Tell me a story about a robot.',
  metadata: {
    sessionId: 'session-4',
    userId: 'user-4',
  },
});

// Process the stream
for await (const chunk of stream) {
  process.stdout.write(chunk); // Print each chunk as it arrives
}

console.log('\n✅ Stream complete!');
```

### Conversation Memory

The chatbot automatically maintains conversation history:

```typescript
import { Chatbot } from '@rumenx/chatbot';

const chatbot = new Chatbot({
  provider: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o-mini', // Cost-effective model for conversations
  },
  enableMemory: true,
  maxHistory: 10, // Keep last 10 messages
});

const sessionId = 'user-session-123';

// First message
await chatbot.chat({
  message: 'My name is Alice.',
  metadata: { sessionId, userId: 'alice' },
});

// Second message - chatbot remembers the context
const response = await chatbot.chat({
  message: 'What is my name?',
  metadata: { sessionId, userId: 'alice' },
});

console.log(response.content); // "Your name is Alice."

// Get conversation history
const history = chatbot.getConversationHistory(sessionId);
console.log(history); // Array of all messages in the session
```

### Using with React

Here's an example of integrating the chatbot into a React application:

```tsx
import React, { useState } from 'react';
import { Chatbot } from '@rumenx/chatbot';

const chatbot = new Chatbot({
  provider: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o-mini',
  },
});

function ChatComponent() {
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    setLoading(true);

    try {
      const response = await chatbot.chat({
        message: input,
        metadata: {
          sessionId: 'react-session',
          userId: 'react-user',
        },
      });

      // Add assistant response
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.content },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default ChatComponent;
```

### Using with Express.js

Here's an example of using the chatbot in an Express.js API:

```typescript
import express from 'express';
import { Chatbot } from '@rumenx/chatbot';

const app = express();
app.use(express.json());

const chatbot = new Chatbot({
  provider: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o-mini',
  },
  enableMemory: true,
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId, userId } = req.body;

    if (!message || !sessionId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const response = await chatbot.chat({
      message,
      metadata: { sessionId, userId },
    });

    res.json({
      content: response.content,
      metadata: response.metadata,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Streaming endpoint
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { message, sessionId, userId } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = chatbot.chatStream({
      message,
      metadata: { sessionId, userId },
    });

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get conversation history
app.get('/api/chat/history/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = chatbot.getConversationHistory(sessionId);
    res.json({ history });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.listen(3000, () => {
  console.log('🚀 Chatbot API running on http://localhost:3000');
});
```

---

## ⚙️ Configuration

### Supported Models (October 2025)

#### OpenAI Models

| Model           | Status         | Use Case                                             |
| --------------- | -------------- | ---------------------------------------------------- |
| `gpt-4o`        | ✅ Recommended | Latest flagship model, best for complex tasks        |
| `gpt-4o-mini`   | ✅ Recommended | Cost-effective, great for most use cases             |
| `gpt-4-turbo`   | ✅ Supported   | High performance, large context window               |
| `o1-preview`    | ✅ Supported   | Advanced reasoning model                             |
| `o1-mini`       | ✅ Supported   | Faster reasoning model                               |
| `gpt-4`         | ⚠️ Legacy      | Still supported, but consider upgrading              |
| `gpt-3.5-turbo` | ❌ Deprecated  | Will be retired June 2025, use `gpt-4o-mini` instead |

#### Anthropic Models

| Model                        | Status         | Use Case                                              |
| ---------------------------- | -------------- | ----------------------------------------------------- |
| `claude-sonnet-4-5-20250929` | ✅ Recommended | Latest - smartest model for complex agents and coding |
| `claude-haiku-4-5-20251001`  | ✅ Recommended | Fastest model with near-frontier intelligence         |
| `claude-opus-4-1-20250805`   | ✅ Recommended | Exceptional model for specialized reasoning           |
| `claude-3-5-sonnet-20241022` | ✅ Supported   | Previous generation (legacy)                          |
| `claude-3-5-sonnet-20240620` | ⚠️ Legacy      | Consider upgrading to 4.5                             |
| `claude-3-opus-20240229`     | ⚠️ Legacy      | Consider upgrading to 4.1                             |

#### Google AI Models

| Model                  | Status         | Use Case                           |
| ---------------------- | -------------- | ---------------------------------- |
| `gemini-2.0-flash-exp` | ✅ Recommended | Latest experimental model          |
| `gemini-1.5-pro`       | ✅ Recommended | Production-ready, 2M token context |
| `gemini-1.5-flash`     | ✅ Recommended | Fast and efficient                 |
| `gemini-1.5-flash-8b`  | ✅ Supported   | Smallest, fastest, most affordable |
| `gemini-pro`           | ⚠️ Legacy      | Consider upgrading to 1.5 or 2.0   |

> **Note:** Model availability and naming may change. Check your provider's
> documentation for the latest model names.

### Complete Configuration Options

```typescript
import type { ChatbotConfig } from '@rumenx/chatbot';

const config: ChatbotConfig = {
  // Provider configuration (required)
  provider: {
    provider: 'openai', // 'openai' | 'anthropic' | 'google'
    apiKey: 'your-api-key',
    model: 'gpt-4',
    apiUrl: 'https://api.openai.com/v1', // Optional: custom API endpoint
    organizationId: 'org-123', // Optional: OpenAI organization ID
  },

  // Generation options
  temperature: 0.7, // 0.0 to 1.0 (higher = more creative)
  maxTokens: 500, // Maximum tokens in response
  topP: 0.9, // Optional: nucleus sampling
  frequencyPenalty: 0, // Optional: -2.0 to 2.0
  presencePenalty: 0, // Optional: -2.0 to 2.0
  stop: ['###'], // Optional: stop sequences

  // System configuration
  systemPrompt: 'You are a helpful AI assistant.', // Optional: system message
  enableMemory: true, // Enable conversation history
  maxHistory: 20, // Maximum messages to keep in memory
  timeout: 30000, // Request timeout in ms

  // Security settings
  security: {
    enableInputFilter: true, // Filter user input
    enableOutputFilter: true, // Filter AI responses
    maxInputLength: 4000, // Maximum input length
    blockedPatterns: [/password/i], // Regex patterns to block
  },

  // Rate limiting
  rateLimit: {
    enabled: true,
    requestsPerMinute: 10,
    requestsPerHour: 100,
    requestsPerDay: 1000,
  },

  // Logging
  logLevel: 'info', // 'debug' | 'info' | 'warn' | 'error'

  // Custom metadata
  metadata: {
    appName: 'My Chatbot App',
    version: '1.0.0',
  },
};
```

---

## 📚 API Reference

### Chatbot Class

#### Constructor

```typescript
new Chatbot(config: ChatbotConfig)
```

#### Methods

##### `chat(options: ChatOptions): Promise<ChatResponse>`

Send a message and get a response.

```typescript
const response = await chatbot.chat({
  message: 'Hello!',
  metadata: {
    sessionId: 'session-id',
    userId: 'user-id',
  },
});
```

##### `chatStream(options: ChatOptions): AsyncGenerator<string>`

Stream a response in real-time.

```typescript
for await (const chunk of chatbot.chatStream({ message: 'Hello!' })) {
  console.log(chunk);
}
```

##### `getConversationHistory(sessionId: string): ChatMessage[]`

Get conversation history for a session.

```typescript
const history = chatbot.getConversationHistory('session-id');
```

##### `clearConversationHistory(sessionId: string): void`

Clear conversation history for a session.

```typescript
chatbot.clearConversationHistory('session-id');
```

##### `updateConfig(config: Partial<ChatbotConfig>): void`

Update chatbot configuration.

```typescript
chatbot.updateConfig({
  temperature: 0.9,
  maxTokens: 1000,
});
```

##### `getProviderInfo(): ProviderInfo`

Get information about the current provider.

```typescript
const info = chatbot.getProviderInfo();
console.log(info); // { name: 'openai', model: 'gpt-4', ... }
```

### Types

```typescript
interface ChatbotConfig {
  provider: AiProviderConfig;
  temperature?: number;
  maxTokens?: number;
  enableMemory?: boolean;
  maxHistory?: number;
  security?: SecurityConfig;
  rateLimit?: RateLimitConfig;
  // ... more options
}

interface ChatOptions {
  message: string;
  metadata?: {
    sessionId?: string;
    userId?: string;
    [key: string]: unknown;
  };
}

interface ChatResponse {
  content: string;
  metadata: {
    provider: string;
    model: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    responseTime?: number;
  };
}
```

---

## 🎨 Usage with Popular Frameworks

This library is framework-agnostic and can be used with any JavaScript framework
or library. Here are examples for popular frameworks:

### React

```bash
npm install @rumenx/chatbot react
```

See [Using with React](#using-with-react) example above for a complete
integration.

### Vue 3

The library works seamlessly with Vue 3. Here's a basic example:

```bash
npm install @rumenx/chatbot vue
```

```vue
<template>
  <div class="chat-container">
    <div
      v-for="(msg, idx) in messages"
      :key="idx"
      :class="`message ${msg.role}`"
    >
      <strong>{{ msg.role }}:</strong> {{ msg.content }}
    </div>
    <input
      v-model="input"
      @keyup.enter="sendMessage"
      placeholder="Type a message..."
    />
    <button @click="sendMessage" :disabled="loading">
      {{ loading ? 'Sending...' : 'Send' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Chatbot } from '@rumenx/chatbot';

const chatbot = new Chatbot({
  provider: {
    provider: 'openai',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    model: 'gpt-3.5-turbo',
  },
});

const messages = ref<Array<{ role: string; content: string }>>([]);
const input = ref('');
const loading = ref(false);

const sendMessage = async () => {
  if (!input.value.trim()) return;

  messages.value.push({ role: 'user', content: input.value });
  loading.value = true;

  try {
    const response = await chatbot.chat({
      message: input.value,
      metadata: { sessionId: 'vue-session', userId: 'vue-user' },
    });

    messages.value.push({ role: 'assistant', content: response.content });
  } catch (error) {
    console.error('Chat error:', error);
  } finally {
    loading.value = false;
    input.value = '';
  }
};
</script>
```

### Next.js

```bash
npm install @rumenx/chatbot next
```

```typescript
// app/api/chat/route.ts
import { Chatbot } from '@rumenx/chatbot';
import { NextRequest, NextResponse } from 'next/server';

const chatbot = new Chatbot({
  provider: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-3.5-turbo',
  },
});

export async function POST(request: NextRequest) {
  const { message, sessionId, userId } = await request.json();

  try {
    const response = await chatbot.chat({
      message,
      metadata: { sessionId, userId },
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
```

---

## 🛡️ Error Handling

The library provides comprehensive error handling:

```typescript
import { Chatbot, ChatbotError } from '@rumenx/chatbot';

const chatbot = new Chatbot({
  provider: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4',
  },
});

try {
  const response = await chatbot.chat({
    message: 'Hello!',
    metadata: { sessionId: 'session-1', userId: 'user-1' },
  });
  console.log(response.content);
} catch (error) {
  if (error instanceof ChatbotError) {
    console.error('Error category:', error.category);
    console.error('Error severity:', error.severity);
    console.error('Is retryable:', error.isRetryable);
    console.error('Retry delay:', error.retryDelay);

    // Handle specific error types
    switch (error.category) {
      case 'authentication':
        console.error('Authentication failed. Check your API key.');
        break;
      case 'rate_limit':
        console.error('Rate limit exceeded. Retry after:', error.retryDelay);
        break;
      case 'validation':
        console.error('Invalid input:', error.userMessage);
        break;
      case 'network':
        console.error('Network error. Check your connection.');
        break;
      default:
        console.error('Unexpected error:', error.message);
    }
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Error Categories

- `authentication` - API key or authentication issues
- `rate_limit` - Rate limit exceeded
- `validation` - Invalid input or configuration
- `network` - Network connectivity issues
- `provider` - Provider-specific errors
- `timeout` - Request timeout
- `unknown` - Unexpected errors

---

## 🔒 Security

### Input/Output Filtering

```typescript
const chatbot = new Chatbot({
  provider: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-3.5-turbo',
  },
  security: {
    enableInputFilter: true, // Filter malicious input
    enableOutputFilter: true, // Filter inappropriate responses
    maxInputLength: 4000, // Prevent oversized inputs
    blockedPatterns: [/password/i, /credit card/i, /social security/i],
  },
});
```

### Rate Limiting

```typescript
const chatbot = new Chatbot({
  provider: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-3.5-turbo',
  },
  rateLimit: {
    enabled: true,
    requestsPerMinute: 10,
    requestsPerHour: 100,
    requestsPerDay: 1000,
  },
});
```

For more details, see [SECURITY.md](./SECURITY.md).

---

## 🗺️ Roadmap

We're constantly working to improve and expand the library. Here's what's
planned for future releases:

### 🔮 Planned Features (Not Yet Implemented)

#### Additional AI Providers

The following providers are **planned but not yet implemented**. Community
contributions are welcome!

| Provider       | Status     | Target Version | Notes                                                |
| -------------- | ---------- | -------------- | ---------------------------------------------------- |
| **Meta Llama** | 📋 Planned | v2.x           | Llama 3.3, 3.2, 3.1 support via Ollama or cloud APIs |
| **xAI Grok**   | 📋 Planned | v2.x           | Grok-2, Grok-2-mini integration                      |
| **DeepSeek**   | 📋 Planned | v2.x           | DeepSeek-V3 and DeepSeek-R1 support                  |
| **Ollama**     | 📋 Planned | v2.x           | Local LLM support with Ollama                        |
| **Mistral AI** | 📋 Planned | v2.x           | Mistral Large, Medium, Small models                  |
| **Cohere**     | 📋 Planned | v2.x           | Command R+, Command R models                         |
| **Perplexity** | 📋 Planned | v3.x           | pplx-7b-online, pplx-70b-online                      |

#### Framework Integrations

| Framework               | Status     | Target Version | Description                                                    |
| ----------------------- | ---------- | -------------- | -------------------------------------------------------------- |
| **React Components**    | 📋 Planned | v2.x           | Pre-built `<ChatWidget />`, `<ChatInput />`, `<MessageList />` |
| **Vue 3 Components**    | 📋 Planned | v2.x           | Composition API components                                     |
| **Angular Components**  | 📋 Planned | v3.x           | Standalone components for Angular 15+                          |
| **Svelte Components**   | 📋 Planned | v3.x           | Svelte 5 components                                            |
| **Express Middleware**  | 📋 Planned | v2.x           | `app.use(chatbot.middleware())`                                |
| **Next.js Integration** | 📋 Planned | v2.x           | Server actions and route handlers                              |
| **Fastify Plugin**      | 📋 Planned | v2.x           | `fastify.register(chatbotPlugin)`                              |

#### Advanced Features

- 🔮 **Function Calling / Tool Use** - Support for OpenAI functions, Anthropic
  tools
- 🔮 **Multi-Modal Support** - Image, audio, and video inputs
- 🔮 **RAG Integration** - Vector database integration for retrieval-augmented
  generation
- 🔮 **Prompt Templates** - Pre-built templates for common use cases
- 🔮 **Agent Framework** - Build autonomous agents with planning and execution
- 🔮 **Fine-tuning Support** - Train and deploy custom models
- 🔮 **Cost Optimization** - Automatic model selection based on budget
- 🔮 **A/B Testing** - Test different models and prompts

### ✅ Currently Implemented

- ✅ OpenAI (GPT-4o, GPT-4 Turbo, o1, GPT-4o-mini)
- ✅ Anthropic (Claude Sonnet 4.5, Haiku 4.5, Opus 4.1)
- ✅ Google AI (Gemini 2.0, Gemini 1.5 Pro/Flash)
- ✅ Streaming support for all providers
- ✅ Conversation memory management
- ✅ Type-safe TypeScript APIs
- ✅ Error handling with retries
- ✅ Rate limiting and security
- ✅ Token usage tracking
- ✅ 94% test coverage

### 🤝 Contributing to Roadmap

Want to help implement these features? Check out our
[Contributing Guide](./CONTRIBUTING.md) and:

1. **Pick a feature** from the roadmap
2. **Open an issue** to discuss implementation
3. **Submit a PR** with your implementation
4. **Get recognized** as a contributor!

Priority is given to features with community interest. Open an issue to vote on
features you'd like to see!

---

## 🧪 Testing

The library has 94% test coverage with 880+ tests.

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run fast tests only
npm run test:fast
```

### Writing Tests

```typescript
import { Chatbot } from '@rumenx/chatbot';

describe('Chatbot', () => {
  it('should send a message and receive a response', async () => {
    const chatbot = new Chatbot({
      provider: {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
      },
    });

    const response = await chatbot.chat({
      message: 'Hello!',
      metadata: { sessionId: 'test', userId: 'test' },
    });

    expect(response.content).toBeDefined();
    expect(response.metadata.provider).toBe('openai');
  });
});
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for
details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/RumenDamyanov/npm-chatbot.git
cd npm-chatbot

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

# Run examples
npm run example:openai
```

### Code of Conduct

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) before contributing.

---

## 📄 License

This project is licensed under the MIT License - see the
[LICENSE.md](./LICENSE.md) file for details.

---

## 💖 Support

If you find this library helpful, please consider:

- ⭐ Starring the repository
- 🐛 Reporting bugs via
  [GitHub Issues](https://github.com/RumenDamyanov/npm-chatbot/issues)
- 💡 Suggesting new features
- 📖 Improving documentation
- 💰 [Sponsoring the project](./FUNDING.md)

---

## 📊 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and release notes.

---

**Made with ❤️ by [Rumen Damyanov](https://github.com/RumenDamyanov)**
