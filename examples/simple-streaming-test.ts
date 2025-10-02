/**
 * Simple Streaming Test
 *
 * A simple test to verify streaming functionality works correctly
 */

import { Chatbot } from '../src/core/Chatbot';

async function testStreaming() {
  console.log('🧪 Testing streaming functionality...\n');

  // Check for API key
  const apiKey = process.env['OPENAI_API_KEY'];
  if (!apiKey) {
    console.log('⚠️  No OPENAI_API_KEY found, testing will use mock responses');
    return;
  }

  try {
    // Create chatbot instance
    const chatbot = new Chatbot({
      provider: {
        provider: 'openai',
        apiKey,
        model: 'gpt-4',
      },
      temperature: 0.7,
    });

    console.log('✅ Chatbot initialized');
    console.log('📤 Sending message: "Count from 1 to 5 with explanations"');
    console.log('📥 Streaming response:\n');

    // Test streaming
    const stream = chatbot.chatStream('Count from 1 to 5 with explanations');

    let totalChunks = 0;
    const startTime = Date.now();

    for await (const chunk of stream) {
      if (chunk.type === 'content') {
        process.stdout.write(chunk.content);
        totalChunks++;
      } else if (chunk.type === 'done') {
        const endTime = Date.now();
        console.log('\n');
        console.log(`✅ Streaming completed!`);
        console.log(`📊 Stats: ${totalChunks} chunks in ${endTime - startTime}ms`);

        if (chunk.metadata?.['usage']) {
          console.log('💰 Token usage:', chunk.metadata['usage']);
        }

        break;
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testStreaming().catch(console.error);

export { testStreaming };
