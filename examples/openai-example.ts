#!/usr/bin/env node

/**
 * Example usage of the npm-chatbot with real OpenAI provider
 *
 * Usage:
 * OPENAI_API_KEY=your_key_here npm run example:openai
 */

import { Chatbot } from '../src/core/Chatbot';
import type { ChatbotConfig } from '../src/types/ChatbotTypes';

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('Please set OPENAI_API_KEY environment variable');
    process.exit(1);
  }

  // Create chatbot configuration
  const config: ChatbotConfig = {
    provider: {
      provider: 'openai',
      apiKey,
      model: 'gpt-3.5-turbo',
    },
    systemPrompt: 'You are a helpful AI assistant built using the npm-chatbot library.',
    temperature: 0.7,
    maxTokens: 150,
    enableMemory: true,
    maxHistory: 10,
    security: {
      enableInputFilter: true,
      enableOutputFilter: true,
    },
    rateLimit: {
      enabled: true,
      requestsPerMinute: 10,
      requestsPerHour: 100,
    },
  };

  try {
    console.log('🚀 Initializing chatbot with real OpenAI provider...');

    const chatbot = new Chatbot(config);

    console.log('✅ Chatbot initialized successfully!');
    console.log('🔗 Testing connection to OpenAI...');

    // Test basic chat
    const response = await chatbot.chat({
      message: 'Hello! Can you introduce yourself?',
      metadata: {
        sessionId: 'test-session',
        userId: 'test-user',
      },
    });

    console.log('\n📝 Response from OpenAI:');
    console.log(response.content);
    console.log('\n📊 Response metadata:');
    console.log(JSON.stringify(response.metadata, null, 2));

    // Test follow-up message
    const followUp = await chatbot.chat({
      message: 'What can you help me with?',
      metadata: {
        sessionId: 'test-session',
        userId: 'test-user',
      },
    });

    console.log('\n📝 Follow-up response:');
    console.log(followUp.content);

    console.log('\n✅ OpenAI provider test completed successfully!');
  } catch (error) {
    console.error('❌ Error testing OpenAI provider:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
