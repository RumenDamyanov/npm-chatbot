/**
 * Configuration Validation Example
 *
 * This example shows how to use the ConfigurationValidator
 * to validate provider configurations before using them.
 */

import { ConfigurationValidator } from '../src/core/ConfigurationValidator';
import type { ChatbotConfig } from '../src/types/ChatbotTypes';

async function validateConfigurations() {
  console.log('🔍 Testing Configuration Validation\n');

  // Test 1: Valid OpenAI configuration
  console.log('Test 1: Valid OpenAI Configuration');
  const validOpenAiConfig: ChatbotConfig = {
    provider: {
      provider: 'openai',
      apiKey: process.env['OPENAI_API_KEY'] ?? 'sk-test-key',
      model: 'gpt-4',
    },
    temperature: 0.7,
    maxTokens: 1000,
  };

  try {
    const result = await ConfigurationValidator.validateChatbotConfig(validOpenAiConfig);
    console.log('✅ Result:', result);
    console.log('Valid:', result.isValid);
    if (result.capabilities) {
      console.log('Capabilities:', result.capabilities.supportedModels?.slice(0, 3), '...');
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }
  console.log('');

  // Test 2: Invalid configuration (missing API key)
  console.log('Test 2: Invalid Configuration (Missing API Key)');
  const invalidConfig: ChatbotConfig = {
    provider: {
      provider: 'openai',
      // apiKey is missing
      model: 'gpt-4',
    },
  };

  const invalidResult = await ConfigurationValidator.validateChatbotConfig(invalidConfig);
  console.log('❌ Result:', invalidResult);
  console.log('Valid:', invalidResult.isValid);
  console.log('Errors:', invalidResult.errors);
  console.log('');

  // Test 3: Quick validation (without provider instantiation)
  console.log('Test 3: Quick Validation');
  const quickResult = ConfigurationValidator.validateQuick({
    provider: 'anthropic',
    apiKey: 'test-key',
    model: 'claude-sonnet-4-5-20250929',
  });
  console.log('⚡ Quick validation result:', quickResult);
  console.log('');

  // Test 4: Get supported providers
  console.log('Test 4: Supported Providers');
  const supportedProviders = ConfigurationValidator.getSupportedProviders();
  console.log('📋 Supported providers:', supportedProviders);
  console.log('');

  // Test 5: Get default configurations
  console.log('Test 5: Default Configurations');
  for (const provider of ['openai', 'anthropic', 'google'] as const) {
    const defaultConfig = ConfigurationValidator.getDefaultConfig(provider);
    console.log(`🔧 Default ${provider} config:`, defaultConfig);
  }
  console.log('');

  // Test 6: Validate Google configuration
  console.log('Test 6: Google Configuration');
  const googleConfig: ChatbotConfig = {
    provider: {
      provider: 'google',
      apiKey: process.env['GOOGLE_API_KEY'] ?? 'test-key',
      model: 'gemini-1.5-flash',
    },
    temperature: 0.5,
  };

  const googleResult = await ConfigurationValidator.validateChatbotConfig(googleConfig);
  console.log('🤖 Google validation result:', googleResult);
  console.log('');

  // Test 7: Ollama configuration
  console.log('Test 7: Ollama Configuration');
  const ollamaConfig: ChatbotConfig = {
    provider: {
      provider: 'ollama',
      apiUrl: 'http://localhost:11434',
      model: 'llama2',
    },
  };

  const ollamaResult = await ConfigurationValidator.validateChatbotConfig(ollamaConfig);
  console.log('🦙 Ollama validation result:', ollamaResult);
  console.log('');

  // Test 8: Configuration with warnings
  console.log('Test 8: Configuration with Warnings');
  const warningConfig: ChatbotConfig = {
    provider: {
      provider: 'openai',
      apiKey: process.env['OPENAI_API_KEY'] ?? 'test-key',
      model: 'some-unknown-model', // This should generate a warning
    },
    temperature: 3.0, // This should generate a warning
    maxTokens: 1000000, // This might generate a warning if it exceeds limits
  };

  const warningResult = await ConfigurationValidator.validateChatbotConfig(warningConfig);
  console.log('⚠️  Warning validation result:', warningResult);
  console.log('');
}

// Run the validation examples
validateConfigurations().catch(console.error);

export { validateConfigurations };