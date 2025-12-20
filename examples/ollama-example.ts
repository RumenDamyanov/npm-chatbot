/**
 * Ollama Provider Example (Local Models)
 * 
 * This example demonstrates how to use local LLM models via Ollama.
 * 
 * Prerequisites:
 * 1. Install Ollama: https://ollama.ai/
 * 2. Pull a model: `ollama pull llama3.2`
 * 3. Start Ollama server (usually starts automatically)
 * 
 * Supported models (examples):
 * - llama3.2:latest (Meta's latest Llama)
 * - mistral:latest (Mistral AI)
 * - codellama:latest (Code-specialized)
 * - phi3:latest (Microsoft's Phi-3)
 * - gemma2:latest (Google's Gemma)
 * - Any custom fine-tuned model
 */

import { Chatbot } from '../src/core/Chatbot';
import type { ChatbotConfig } from '../src/types/ChatbotTypes';

// Configuration
const config: ChatbotConfig = {
  provider: {
    provider: 'ollama',
    apiUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    model: 'llama3.2:latest', // Change to your installed model
    // apiKey: '', // Optional, only if you enabled auth
  },
  systemPrompt: 'You are a helpful AI assistant running locally via Ollama.',
  temperature: 0.7,
  maxTokens: 1000,
  enableMemory: true,
  maxHistory: 10,
};

async function main() {
  console.log('🦙 Ollama Provider Example (Local Models)\n');

  try {
    // Initialize chatbot
    const chatbot = new Chatbot(config);
    console.log('✅ Chatbot initialized with Ollama provider');
    console.log(`📝 Model: ${config.provider.model}`);
    console.log(`🔗 Server: ${config.provider.apiUrl}\n`);

    // Check if Ollama is running
    console.log('🔍 Checking Ollama server status...');
    const provider = chatbot['_provider']; // Access private provider for demo

    if (!(await provider.isAvailable())) {
      console.error('\n❌ Error: Ollama server is not running!');
      console.log('\nTo start Ollama:');
      console.log('1. Install: https://ollama.ai/');
      console.log('2. Pull a model: ollama pull llama3.2');
      console.log('3. Server should start automatically');
      console.log('4. Or run: ollama serve');
      process.exit(1);
    }

    console.log('✅ Ollama server is running\n');

    // List available models
    console.log('📦 Available Models');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    try {
      const models = await provider.getModels();
      console.log(`Found ${models.length} models:\n`);
      models.forEach((model, index) => {
        console.log(`   ${index + 1}. ${model}`);
      });
      console.log();
    } catch (error) {
      console.log('⚠️  Could not list models\n');
    }

    // Example 1: Simple chat
    console.log('Example 1: Simple Chat with Local Model');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const response1 = await chatbot.chat({
      message: 'What are the benefits of running AI models locally?',
      metadata: {
        sessionId: 'ollama-example-1',
        userId: 'demo-user',
      },
    });

    console.log('User: What are the benefits of running AI models locally?');
    console.log(`Assistant: ${response1.content}\n`);

    if (response1.metadata?.usage) {
      console.log(`📊 Tokens used: ${response1.metadata.usage.totalTokens}`);
      console.log(`   - Prompt: ${response1.metadata.usage.promptTokens}`);
      console.log(`   - Completion: ${response1.metadata.usage.completionTokens}`);
      
      // Ollama provides additional metrics
      if (response1.metadata.totalDuration) {
        console.log(`⏱️  Duration: ${(response1.metadata.totalDuration as number / 1000000).toFixed(2)}ms`);
      }
      console.log();
    }

    // Example 2: Conversation with memory
    console.log('Example 2: Conversation with Memory');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const sessionId = 'ollama-conversation';

    const response2 = await chatbot.chat({
      message: 'My name is Charlie and I love open source.',
      metadata: { sessionId, userId: 'charlie' },
    });
    console.log('User: My name is Charlie and I love open source.');
    console.log(`Assistant: ${response2.content}\n`);

    const response3 = await chatbot.chat({
      message: 'What is my name and what do I love?',
      metadata: { sessionId, userId: 'charlie' },
    });
    console.log('User: What is my name and what do I love?');
    console.log(`Assistant: ${response3.content}\n`);

    // Example 3: Streaming response
    console.log('Example 3: Streaming Response (Real-time)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('User: Write a haiku about local AI models.');
    console.log('Assistant: ');

    const stream = chatbot.chatStream({
      message: 'Write a haiku about local AI models.',
      metadata: {
        sessionId: 'ollama-streaming',
        userId: 'demo-user',
      },
    });

    for await (const chunk of stream) {
      process.stdout.write(chunk);
    }

    console.log('\n\n✅ Streaming complete!\n');

    // Example 4: Using different models
    console.log('Example 4: Comparing Different Models');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
      // Try with current model
      const response4 = await chatbot.chat({
        message: 'Explain quantum computing in one sentence.',
        metadata: {
          sessionId: 'ollama-models',
          userId: 'demo-user',
        },
      });

      console.log('User: Explain quantum computing in one sentence.');
      console.log(`Assistant (${config.provider.model}): ${response4.content}\n`);
    } catch (error) {
      console.log('⚠️  Model not available, skipping comparison\n');
    }

    // Example 5: Privacy benefits
    console.log('Example 5: Privacy & Offline Capability');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const response5 = await chatbot.chat({
      message: 'This is sensitive company data that stays on my machine.',
      metadata: {
        sessionId: 'ollama-privacy',
        userId: 'demo-user',
      },
    });

    console.log('User: This is sensitive company data that stays on my machine.');
    console.log(`Assistant: ${response5.content}`);
    console.log('\n💡 Note: All processing happens locally - no data sent to cloud!\n');

    // Example 6: Model management
    console.log('Example 6: Model Management');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Available Ollama commands:');
    console.log('   • Pull model:   ollama pull llama3.2');
    console.log('   • List models:  ollama list');
    console.log('   • Delete model: ollama rm llama3.2');
    console.log('   • Show info:    ollama show llama3.2');
    console.log('   • Run chat:     ollama run llama3.2\n');

    // Get conversation history
    console.log('Example 7: Conversation History');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const history = chatbot.getConversationHistory(sessionId);
    console.log(`📜 Conversation history for session "${sessionId}":`);
    console.log(`   Total messages: ${history.length}\n`);

    history.forEach((msg, index) => {
      console.log(`   ${index + 1}. [${msg.role}]: ${msg.content.substring(0, 60)}...`);
    });

    console.log('\n✨ All examples completed successfully!');
    console.log('\n🎉 Ollama Benefits:');
    console.log('   ✓ Complete privacy - no data leaves your machine');
    console.log('   ✓ Works offline - no internet required');
    console.log('   ✓ No API costs - free to use');
    console.log('   ✓ Full control - custom models and fine-tuning');
    console.log('   ✓ Fast responses - no network latency');
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Is Ollama installed? https://ollama.ai/');
      console.log('2. Is Ollama running? Try: ollama serve');
      console.log('3. Is the model pulled? Try: ollama pull llama3.2');
      console.log('4. Check port 11434 is available');
    }
    
    process.exit(1);
  }
}

// Run the example
main();

