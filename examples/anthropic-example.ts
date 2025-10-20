#!/usr/bin/env node

/**
 * Example usage of the npm-chatbot with real Anthropic Claude provider
 *
 * Usage:
 * ANTHROPIC_API_KEY=your_key_here npm run example:anthropic
 */

import { Chatbot } from '../src/core/Chatbot';
import type { ChatbotConfig } from '../src/types/ChatbotTypes';

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('Please set ANTHROPIC_API_KEY environment variable');
    process.exit(1);
  }

  // Create chatbot configuration
  const config: ChatbotConfig = {
    provider: {
      provider: 'anthropic',
      apiKey,
      model: 'claude-sonnet-4-5-20250929', // Latest: Claude Sonnet 4.5 (September 2025)
    },
    systemPrompt: 'You are Claude, a helpful AI assistant built using the npm-chatbot library.',
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
    console.log('🚀 Initializing chatbot with real Anthropic Claude provider...');

    const chatbot = new Chatbot(config);

    console.log('✅ Chatbot initialized successfully!');
    console.log('🔗 Testing connection to Anthropic...');

    // Test basic chat
    const response = await chatbot.chat({
      message: 'Hello! Can you introduce yourself and explain what makes Claude unique?',
      metadata: {
        sessionId: 'test-session',
        userId: 'test-user',
      },
    });

    console.log('\n📝 Response from Claude:');
    console.log(response.content);
    console.log('\n📊 Response metadata:');
    console.log(JSON.stringify(response.metadata, null, 2));

    // Test follow-up message with reasoning
    const followUp = await chatbot.chat({
      message: 'Can you help me write a creative short story about a robot learning to paint?',
      metadata: {
        sessionId: 'test-session',
        userId: 'test-user',
      },
    });

    console.log('\n📝 Creative response:');
    console.log(followUp.content);

    console.log('\n✅ Anthropic Claude provider test completed successfully!');
  } catch (error) {
    console.error('❌ Error testing Anthropic provider:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
