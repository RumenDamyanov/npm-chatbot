/**
 * Streaming Chat Example
 *
 * This example shows how to use the new streaming chat functionality
 * to get real-time responses from AI providers.
 */

import { Chatbot } from '../src/core/Chatbot';

async function streamingChatExample() {
  console.log('🌊 Testing Streaming Chat Functionality\n');

  // Check for API key
  const apiKey = process.env['OPENAI_API_KEY'];
  if (!apiKey) {
    console.log('❌ Please set OPENAI_API_KEY environment variable');
    return;
  }

  // Create chatbot instance
  const chatbot = new Chatbot({
    provider: {
      provider: 'openai',
      apiKey,
      model: 'gpt-4',
    },
    temperature: 0.7,
    enableMemory: true,
  });

  console.log('✅ Chatbot initialized successfully\n');

  // Test 1: Basic streaming
  console.log('Test 1: Basic Streaming Response');
  console.log('User: "Tell me a short story about a robot learning to paint"');
  console.log('Assistant: ');

  try {
    const stream = chatbot.chatStream('Tell me a short story about a robot learning to paint');

    let fullResponse = '';
    let chunkCount = 0;

    for await (const chunk of stream) {
      if (chunk.type === 'content') {
        process.stdout.write(chunk.content);
        fullResponse += chunk.content;
        chunkCount++;
      } else if (chunk.type === 'done') {
        console.log('\n');
        console.log(
          `📊 Stream completed: ${chunkCount} chunks, ${String(chunk.metadata?.['processingTime'])}ms`
        );
        if (chunk.metadata?.['usage']) {
          console.log('💰 Token usage:', chunk.metadata['usage']);
        }
      }
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }

  console.log('\n');

  // Test 2: Streaming with conversation context
  console.log('Test 2: Streaming with Conversation Context');
  console.log('User: "Make the robot in that story blue and give it a name"');
  console.log('Assistant: ');

  try {
    const stream = chatbot.chatStream({
      message: 'Make the robot in that story blue and give it a name',
      metadata: {
        userId: 'test-user',
        sessionId: 'session-1',
      },
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content') {
        process.stdout.write(chunk.content);
      } else if (chunk.type === 'done') {
        console.log('\n');
        console.log(`📊 Stream completed: ${String(chunk.metadata?.['totalChunks'])} chunks`);
      }
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }

  console.log('\n');

  // Test 3: Error handling in streaming
  console.log('Test 3: Error Handling in Streaming');
  console.log('Testing with invalid configuration...');

  try {
    const invalidChatbot = new Chatbot({
      provider: {
        provider: 'openai',
        apiKey: 'invalid-key',
        model: 'gpt-4',
      },
    });

    const stream = invalidChatbot.chatStream('Hello');

    for await (const chunk of stream) {
      if (chunk.type === 'content') {
        process.stdout.write(chunk.content);
      } else if (chunk.type === 'done') {
        if (chunk.metadata?.['error']) {
          console.log('❌ Stream error:', String(chunk.metadata['error']));
        }
      }
    }
  } catch (error) {
    console.log('❌ Expected error:', (error as Error).message);
  }

  console.log('\n');

  // Test 4: Streaming with different providers (if API keys are available)
  console.log('Test 4: Testing Other Providers (if available)');

  // Test Anthropic if available
  const anthropicKey = process.env['ANTHROPIC_API_KEY'];
  if (anthropicKey) {
    console.log('🤖 Testing Anthropic streaming...');

    const anthropicBot = new Chatbot({
      provider: {
        provider: 'anthropic',
        apiKey: anthropicKey,
        model: 'claude-sonnet-4-5-20250929',
      },
    });

    try {
      const stream = anthropicBot.chatStream('Write a haiku about streaming data');

      console.log('Claude: ');
      for await (const chunk of stream) {
        if (chunk.type === 'content') {
          process.stdout.write(chunk.content);
        } else if (chunk.type === 'done') {
          console.log('\n✅ Anthropic streaming completed\n');
        }
      }
    } catch (error) {
      console.log('❌ Anthropic error:', (error as Error).message, '\n');
    }
  } else {
    console.log('⏭️  Anthropic test skipped (no API key)\n');
  }

  // Test Google if available
  const googleKey = process.env['GOOGLE_API_KEY'];
  if (googleKey) {
    console.log('🔍 Testing Google streaming...');

    const googleBot = new Chatbot({
      provider: {
        provider: 'google',
        apiKey: googleKey,
        model: 'gemini-1.5-flash',
      },
    });

    try {
      const stream = googleBot.chatStream('Explain streaming in 2 sentences');

      console.log('Gemini: ');
      for await (const chunk of stream) {
        if (chunk.type === 'content') {
          process.stdout.write(chunk.content);
        } else if (chunk.type === 'done') {
          console.log('\n✅ Google streaming completed\n');
        }
      }
    } catch (error) {
      console.log('❌ Google error:', (error as Error).message, '\n');
    }
  } else {
    console.log('⏭️  Google test skipped (no API key)\n');
  }

  console.log('🎉 Streaming examples completed!');
}

// Run the streaming examples
streamingChatExample().catch(console.error);

export { streamingChatExample };
