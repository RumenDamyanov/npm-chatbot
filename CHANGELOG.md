# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-02

### 🎉 Initial Release

The first stable release of `@rumenx/chatbot` - a powerful, flexible, and type-safe AI chatbot library for TypeScript/JavaScript applications.

### ✨ Features

#### Core Functionality
- **Multiple AI Provider Support**
  - OpenAI (GPT-4, GPT-4 Turbo, GPT-3.5 Turbo)
  - Anthropic (Claude 3 Opus, Sonnet, Haiku)
  - Google AI (Gemini Pro)
  - Meta, xAI, DeepSeek, Ollama (experimental)
- **Type-Safe API** - Full TypeScript support with comprehensive type definitions
- **Conversation Memory** - Built-in conversation history management with configurable limits
- **Streaming Support** - Real-time response streaming for all supported providers

#### Security & Safety
- **Input/Output Filtering** - Content moderation and sanitization
- **Rate Limiting** - Per-minute, per-hour, and per-day rate limits
- **Security Manager** - Configurable security policies with pattern blocking
- **Content Validation** - Input length limits and validation

#### Developer Experience
- **Comprehensive Error Handling** - Detailed error categories with retry logic
- **Usage Tracking** - Token usage and cost tracking per request
- **Extensive Testing** - 94% test coverage with 880+ tests
- **Framework Integration** - Components for React, Vue, Angular, Express, Next.js, Fastify
- **Tree-Shakeable** - Optimized bundle size with ESM support
- **Universal** - Works in Node.js and modern browsers

#### Configuration
- **Flexible Configuration** - Extensive configuration options for all providers
- **Runtime Updates** - Update configuration at runtime
- **Environment Variables** - Support for environment-based configuration
- **Custom Prompts** - System prompts and conversation context management

### 📦 Package Structure

- **CommonJS Support** - Full CommonJS build in `dist/cjs`
- **ES Modules** - Native ESM build in `dist/esm`
- **TypeScript Declarations** - Complete type definitions in `dist/types`
- **Optional Peer Dependencies** - Only install what you need

### 🧪 Testing

- **880+ Tests** - Comprehensive test suite covering all features
- **94% Code Coverage** - High test coverage across all modules
- **Fast Test Suite** - Optimized test execution with parallel testing
- **Integration Tests** - Real-world usage scenarios tested

### 📚 Documentation

- **Comprehensive README** - Detailed usage examples and API reference
- **API Documentation** - Full TypeScript type definitions
- **Code Examples** - 8+ working examples for different providers and use cases
- **Framework Guides** - Integration guides for popular frameworks

### 🔧 Technical Details

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **TypeScript**: 5.3+
- **License**: MIT

### 🌍 Cross-Language Compatibility

Part of the chatbot family alongside:
- [php-chatbot](https://github.com/RumenDamyanov/php-chatbot) - PHP implementation
- [go-chatbot](https://github.com/RumenDamyanov/go-chatbot) - Go implementation

All implementations share the same API design and features for consistency across polyglot projects.

### 📋 API Surface

#### Classes
- `Chatbot` - Main chatbot class
- `ChatbotError` - Custom error class with detailed error information
- `DefaultLogger` - Built-in logging implementation
- `NullLogger` - No-op logger for production

#### Types
- `ChatbotConfig` - Complete configuration interface
- `ChatOptions` - Chat request options
- `ChatResponse` - Chat response structure
- `AiProviderConfig` - Provider-specific configuration
- `SecurityConfig` - Security settings
- `RateLimitConfig` - Rate limiting configuration

#### Providers (Built-in)
- `OpenAIProvider` - OpenAI GPT models
- `AnthropicProvider` - Anthropic Claude models
- `GoogleProvider` - Google Gemini models
- `ProviderFactory` - Provider management and registration

### 🎯 Use Cases

This library is suitable for:
- Chatbots and conversational AI applications
- Customer support automation
- Content generation systems
- AI-powered assistants
- Educational tools
- Research and experimentation
- Multi-tenant SaaS applications
- Integration with existing applications

### 🚀 Getting Started

```bash
npm install @rumenx/chatbot openai
```

```typescript
import { Chatbot } from '@rumenx/chatbot';

const chatbot = new Chatbot({
  provider: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4',
  },
});

const response = await chatbot.chat({
  message: 'Hello!',
  metadata: { sessionId: 'session-1', userId: 'user-1' },
});

console.log(response.content);
```

### 🙏 Acknowledgments

Thanks to all the contributors and early testers who helped shape this library.

---

## [Unreleased]

### Planned Features
- Function/tool calling support
- Image generation capabilities
- Voice/audio support
- Additional framework integrations (Svelte, SolidJS)
- Enhanced Ollama support
- Advanced prompt engineering utilities
- Conversation analytics and insights
- RAG (Retrieval Augmented Generation) support

---

**For upgrade instructions and breaking changes, see the [Migration Guide](./docs/MIGRATION.md) (coming soon).**
