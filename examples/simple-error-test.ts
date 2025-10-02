/**
 * Simple Error Handling Test
 *
 * A basic test to verify error handling functionality works correctly
 */

import { Chatbot } from '../src/core/Chatbot';
import { ConfigurationValidator } from '../src/core/ConfigurationValidator';
import { ChatbotError } from '../src/types/ChatbotTypes';

async function testErrorHandling() {
  console.log('🚨 Testing Basic Error Handling...\n');

  // Test 1: Configuration Validation
  console.log('Test 1: Configuration Validation');
  const validationResult = await ConfigurationValidator.validateChatbotConfig({
    provider: {
      provider: 'openai',
      // Missing API key should trigger error
      model: 'gpt-4',
    },
  });

  if (!validationResult.isValid) {
    console.log('✅ Configuration validation works:');
    console.log(`  Errors: ${validationResult.errors.join(', ')}`);
  }
  console.log('');

  // Test 2: Invalid API Key
  console.log('Test 2: Invalid API Key Handling');
  try {
    const chatbot = new Chatbot({
      provider: {
        provider: 'openai',
        apiKey: 'invalid-key-test',
        model: 'gpt-4',
      },
    });

    await chatbot.chat('Hello');
  } catch (error) {
    if (error instanceof ChatbotError) {
      console.log('✅ ChatbotError caught:');
      console.log(`  Type: ${error.type}`);
      console.log(`  Provider: ${error.provider ?? 'unknown'}`);
      console.log(`  Message: ${error.message}`);
    } else {
      console.log('✅ Error caught:', (error as Error).message);
    }
  }
  console.log('');

  // Test 3: Network Error
  console.log('Test 3: Network Error Handling');
  try {
    const chatbot = new Chatbot({
      provider: {
        provider: 'openai',
        apiKey: process.env['OPENAI_API_KEY'] ?? 'test-key',
        apiUrl: 'https://nonexistent-api.example.com/v1',
        model: 'gpt-4',
      },
    });

    await chatbot.chat('This should fail');
  } catch (error) {
    console.log('✅ Network error handled:');
    console.log(`  Message: ${(error as Error).message}`);
  }
  console.log('');

  console.log('🎉 Error handling test completed!');
}

// Run the test
testErrorHandling().catch(console.error);

export { testErrorHandling };
