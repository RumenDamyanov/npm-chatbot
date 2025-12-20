/**
 * xAI Grok Provider Example
 * 
 * This example demonstrates how to use the xAI Grok provider with @rumenx/chatbot.
 * 
 * Supported models:
 * - grok-2-latest (Latest Grok 2 model)
 * - grok-2-1212 (December 2024 version)
 * - grok-2-vision-1212 (Vision support)
 * - grok-beta (Beta features)
 * 
 * API endpoint: https://api.x.ai/v1
 */

import { Chatbot } from '../src/core/Chatbot';
import type { ChatbotConfig } from '../src/types/ChatbotTypes';

// Configuration
const config: ChatbotConfig = {
  provider: {
    provider: 'xai',
    apiKey: process.env.XAI_API_KEY || '',
    model: 'grok-2-latest', // Latest Grok 2
    endpoint: 'https://api.x.ai/v1',
  },
  systemPrompt: 'You are Grok, a helpful AI assistant by xAI with a witty personality.',
  temperature: 0.7,
  maxTokens: 1000,
  enableMemory: true,
  maxHistory: 10,
};

async function main() {
  console.log('🤖 xAI Grok Provider Example\n');

  // Check for API key
  if (!config.provider.apiKey) {
    console.error('❌ Error: XAI_API_KEY environment variable is required');
    console.log('\nTo get an API key:');
    console.log('1. Visit https://x.ai/');
    console.log('2. Sign up for xAI API access');
    console.log('3. Get your API key from the dashboard');
    console.log('\nThen set the environment variable:');
    console.log('export XAI_API_KEY=your-api-key-here');
    process.exit(1);
  }

  try {
    // Initialize chatbot
    const chatbot = new Chatbot(config);
    console.log('✅ Chatbot initialized with xAI Grok provider');
    console.log(`📝 Model: ${config.provider.model}`);
    console.log(`🔗 Endpoint: ${config.provider.endpoint}\n`);

    // Example 1: Simple chat
    console.log('Example 1: Simple Chat');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const response1 = await chatbot.chat({
      message: 'What is xAI and what makes Grok special?',
      metadata: {
        sessionId: 'xai-example-1',
        userId: 'demo-user',
      },
    });

    console.log('User: What is xAI and what makes Grok special?');
    console.log(`Grok: ${response1.content}\n`);

    if (response1.metadata?.usage) {
      console.log(`📊 Tokens used: ${response1.metadata.usage.totalTokens}`);
      console.log(`   - Prompt: ${response1.metadata.usage.promptTokens}`);
      console.log(`   - Completion: ${response1.metadata.usage.completionTokens}\n`);
    }

    // Example 2: Conversation with memory
    console.log('Example 2: Conversation with Memory');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const sessionId = 'grok-conversation';

    const response2 = await chatbot.chat({
      message: 'My name is Bob and I love space exploration.',
      metadata: { sessionId, userId: 'bob' },
    });
    console.log('User: My name is Bob and I love space exploration.');
    console.log(`Grok: ${response2.content}\n`);

    const response3 = await chatbot.chat({
      message: 'What is my name and what do I love?',
      metadata: { sessionId, userId: 'bob' },
    });
    console.log('User: What is my name and what do I love?');
    console.log(`Grok: ${response3.content}\n`);

    // Example 3: Streaming response
    console.log('Example 3: Streaming Response');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('User: Tell me a joke about AI in the style of Grok.');
    console.log('Grok: ');

    const stream = chatbot.chatStream({
      message: 'Tell me a joke about AI in the style of Grok.',
      metadata: {
        sessionId: 'grok-streaming',
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

    // Use specific version
    const response4 = await chatbot.chat({
      message: 'Explain quantum entanglement in one sentence.',
      metadata: {
        sessionId: 'grok-models',
        userId: 'demo-user',
        model: 'grok-2-1212', // December 2024 version
      },
    });

    console.log('User: Explain quantum entanglement in one sentence.');
    console.log(`Grok (grok-2-1212): ${response4.content}\n`);

    // Example 5: Grok's personality
    console.log('Example 5: Grok\'s Witty Personality');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const response5 = await chatbot.chat({
      message: 'What do you think about being an AI?',
      metadata: {
        sessionId: 'grok-personality',
        userId: 'demo-user',
      },
    });

    console.log('User: What do you think about being an AI?');
    console.log(`Grok: ${response5.content}\n`);

    // Example 6: Get conversation history
    console.log('Example 6: Conversation History');
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

