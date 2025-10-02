#!/usr/bin/env node

/**
 * Example usage of the npm-chatbot with real Google Gemini provider
 * 
 * Usage:
 * GOOGLE_API_KEY=your_key_here npm run example:google
 */

import { Chatbot } from '../src/core/Chatbot';
import type { ChatbotConfig } from '../src/types/ChatbotTypes';

async function main() {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.error('Please set GOOGLE_API_KEY environment variable');
    process.exit(1);
  }

  // Create chatbot configuration
  const config: ChatbotConfig = {
    provider: {
      provider: 'google',
      apiKey,
      model: 'gemini-1.5-flash',
    },
    systemPrompt: 'You are Gemini, a helpful AI assistant built using the npm-chatbot library.',
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
    console.log('🚀 Initializing chatbot with real Google Gemini provider...');
    
    const chatbot = new Chatbot(config);
    
    console.log('✅ Chatbot initialized successfully!');
    console.log('🔗 Testing connection to Google AI...');
    
    // Test basic chat
    const response = await chatbot.chat({
      message: 'Hello! Can you introduce yourself and tell me about Google Gemini?',
      metadata: {
        sessionId: 'test-session',
        userId: 'test-user',
      },
    });

    console.log('\n📝 Response from Gemini:');
    console.log(response.content);
    console.log('\n📊 Response metadata:');
    console.log(JSON.stringify(response.metadata, null, 2));
    
    // Test follow-up message with multimodal capabilities
    const followUp = await chatbot.chat({
      message: 'What are some interesting applications of multimodal AI?',
      metadata: {
        sessionId: 'test-session',
        userId: 'test-user',
      },
    });

    console.log('\n📝 Multimodal response:');
    console.log(followUp.content);
    
    console.log('\n✅ Google Gemini provider test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing Google provider:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}