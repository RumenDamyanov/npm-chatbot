/**
 * Meta/Llama Provider Example
 *
 * This example demonstrates how to use the Meta/Llama provider with @rumenx/chatbot.
 *
 * Supported models:
 * - llama-3.3-70b-instruct (Latest, most capable)
 * - llama-3.2-90b-vision-instruct (Vision support)
 * - llama-3.1-405b-instruct (Largest model)
 * - llama-3.1-70b-instruct
 * - llama-3.1-8b-instruct
 *
 * Supported API endpoints:
 * - Together AI: https://api.together.xyz/v1
 * - Groq: https://api.groq.com/openai/v1
 * - Replicate: https://api.replicate.com/v1
 * - Other OpenAI-compatible endpoints
 */

import { Chatbot } from '../src/core/Chatbot';
import type { ChatbotConfig } from '../src/types/ChatbotTypes';

// Configuration
const config: ChatbotConfig = {
  provider: {
    provider: 'meta',
    apiKey: process.env.META_API_KEY || process.env.TOGETHER_API_KEY || '',
    model: 'llama-3.3-70b-instruct', // Latest Llama 3.3
    endpoint: process.env.META_ENDPOINT || 'https://api.together.xyz/v1', // Together AI by default
  },
  systemPrompt: 'You are a helpful AI assistant powered by Meta Llama.',
  temperature: 0.7,
  maxTokens: 1000,
  enableMemory: true,
  maxHistory: 10,
};

async function main() {
  console.log('🦙 Meta/Llama Provider Example\n');

  // Check for API key
  if (!config.provider.apiKey) {
    console.error('❌ Error: META_API_KEY or TOGETHER_API_KEY environment variable is required');
    console.log('\nTo get an API key:');
    console.log('- Together AI: https://api.together.xyz/signup');
    console.log('- Groq: https://console.groq.com/');
    console.log('\nThen set the environment variable:');
    console.log('export META_API_KEY=your-api-key-here');
    console.log('# or');
    console.log('export TOGETHER_API_KEY=your-api-key-here');
    process.exit(1);
  }

  try {
    // Initialize chatbot
    const chatbot = new Chatbot(config);
    console.log('✅ Chatbot initialized with Meta/Llama provider');
    console.log(`📝 Model: ${config.provider.model}`);
    console.log(`🔗 Endpoint: ${config.provider.endpoint}\n`);

    // Example 1: Simple chat
    console.log('Example 1: Simple Chat');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const response1 = await chatbot.chat({
      message: 'What is Meta Llama and what makes it special?',
      metadata: {
        sessionId: 'meta-example-1',
        userId: 'demo-user',
      },
    });

    console.log('User: What is Meta Llama and what makes it special?');
    console.log(`Assistant: ${response1.content}\n`);

    if (response1.metadata?.usage) {
      console.log(`📊 Tokens used: ${response1.metadata.usage.totalTokens}`);
      console.log(`   - Prompt: ${response1.metadata.usage.promptTokens}`);
      console.log(`   - Completion: ${response1.metadata.usage.completionTokens}\n`);
    }

    // Example 2: Conversation with memory
    console.log('Example 2: Conversation with Memory');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const sessionId = 'meta-conversation';

    const response2 = await chatbot.chat({
      message: 'My name is Alice and I love programming.',
      metadata: { sessionId, userId: 'alice' },
    });
    console.log('User: My name is Alice and I love programming.');
    console.log(`Assistant: ${response2.content}\n`);

    const response3 = await chatbot.chat({
      message: 'What is my name and what do I love?',
      metadata: { sessionId, userId: 'alice' },
    });
    console.log('User: What is my name and what do I love?');
    console.log(`Assistant: ${response3.content}\n`);

    // Example 3: Streaming response
    console.log('Example 3: Streaming Response');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('User: Write a short poem about artificial intelligence.');
    console.log('Assistant: ');

    const stream = chatbot.chatStream({
      message: 'Write a short poem about artificial intelligence.',
      metadata: {
        sessionId: 'meta-streaming',
        userId: 'demo-user',
      },
    });

    for await (const chunk of stream) {
      process.stdout.write(chunk);
    }

    console.log('\n\n✅ Streaming complete!\n');

    // Example 4: Different models
    console.log('Example 4: Using Different Models');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Use smaller, faster model
    const response4 = await chatbot.chat({
      message: 'Explain quantum computing in one sentence.',
      metadata: {
        sessionId: 'meta-models',
        userId: 'demo-user',
        model: 'llama-3.1-8b-instruct', // Smaller, faster model
      },
    });

    console.log('User: Explain quantum computing in one sentence.');
    console.log(`Assistant (llama-3.1-8b): ${response4.content}\n`);

    // Example 5: Get conversation history
    console.log('Example 5: Conversation History');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const history = chatbot.getConversationHistory(sessionId);
    console.log(`📜 Conversation history for session "${sessionId}":`);
    console.log(`   Total messages: ${history.length}\n`);

    history.forEach((msg, index) => {
      console.log(`   ${index + 1}. [${msg.role}]: ${msg.content.substring(0, 60)}...`);
    });

    console.log('\n✨ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the example
main();
