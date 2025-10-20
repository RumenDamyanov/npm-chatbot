/**
 * Error Handling Examples
 *
 * This example demonstrates the comprehensive error handling capabilities
 * of the chatbot library, including retry logic, error classification,
 * and provider-specific error handling.
 */

import { Chatbot } from '../src/core/Chatbot';
import { ConfigurationValidator } from '../src/core/ConfigurationValidator';
import { ErrorHandler, ErrorUtils } from '../src/core/ErrorHandler';
import { ChatbotError } from '../src/types/ChatbotTypes';

async function errorHandlingExamples() {
  console.log('🚨 Testing Error Handling Capabilities\n');

  // Test 1: Configuration Validation Errors
  console.log('Test 1: Configuration Validation Errors');
  try {
    const invalidResult = await ConfigurationValidator.validateChatbotConfig({
      provider: {
        provider: 'openai',
        // Missing API key - should trigger validation error
        model: 'gpt-4o',
      },
    });

    if (!invalidResult.isValid) {
      console.log('✅ Configuration validation caught errors:');
      invalidResult.errors.forEach((error) => console.log(`  - ${error}`));
    }
  } catch (error) {
    console.log('❌ Unexpected error during validation:', error);
  }
  console.log('');

  // Test 2: Invalid API Key Error
  console.log('Test 2: Invalid API Key Error Handling');
  try {
    const chatbot = new Chatbot({
      provider: {
        provider: 'openai',
        apiKey: 'invalid-key-12345',
        model: 'gpt-4o',
      },
    });

    await chatbot.chat('Hello, test message');
  } catch (error) {
    if (error instanceof ChatbotError) {
      console.log('✅ Caught ChatbotError:');
      console.log(`  Type: ${error.type}`);
      console.log(`  Provider: ${error.provider}`);
      console.log(`  Message: ${error.message}`);
      console.log(`  Code: ${error.code}`);
      console.log(`  Metadata:`, error.metadata);
    } else {
      console.log('❌ Unexpected error type:', error);
    }
  }
  console.log('');

  // Test 3: Network Error Simulation
  console.log('Test 3: Network Error Handling');
  try {
    const chatbot = new Chatbot({
      provider: {
        provider: 'openai',
        apiKey: process.env['OPENAI_API_KEY'] ?? 'test-key',
        apiUrl: 'https://invalid-url-that-does-not-exist.com/v1',
        model: 'gpt-4o',
      },
    });

    await chatbot.chat('This should fail with network error');
  } catch (error) {
    if (error instanceof ChatbotError) {
      console.log('✅ Network error handled:');
      console.log(`  Type: ${error.type}`);
      console.log(`  Message: ${error.message}`);

      // Test error classification utilities
      const isRetryable = ErrorUtils.isRetryableError(error);
      const isPermanent = ErrorUtils.isPermanentFailure(error);

      console.log(`  Is Retryable: ${isRetryable}`);
      console.log(`  Is Permanent: ${isPermanent}`);
    }
  }
  console.log('');

  // Test 4: Error Handler Direct Usage
  console.log('Test 4: Direct Error Handler Usage');
  const errorHandler = new ErrorHandler({
    maxRetries: 2,
    baseDelay: 500,
    retryableErrors: ['network', 'timeout'],
  });

  try {
    await errorHandler.executeWithRetry(
      async () => {
        throw new Error('Simulated network timeout');
      },
      'openai',
      { operation: 'test' }
    );
  } catch (error) {
    console.log('✅ Error handler completed retries:');
    if (error instanceof ChatbotError) {
      console.log(`  Final error: ${error.message}`);
      console.log(`  Metadata:`, error.metadata);
    }
  }
  console.log('');

  // Test 5: Provider-Specific Error Patterns
  console.log('Test 5: Provider-Specific Error Classification');

  const testErrors = [
    { error: new Error('rate_limit_exceeded'), provider: 'openai' as const },
    { error: new Error('insufficient_quota'), provider: 'openai' as const },
    { error: new Error('authentication_error'), provider: 'anthropic' as const },
    { error: new Error('resource exhausted'), provider: 'google' as const },
    { error: new Error('connection refused'), provider: 'ollama' as const },
  ];

  testErrors.forEach(({ error, provider }) => {
    const processed = errorHandler.processError(error, provider);
    console.log(`  ${provider}: ${error.message}`);
    console.log(`    Category: ${processed.category}`);
    console.log(`    Severity: ${processed.severity}`);
    console.log(`    Retryable: ${processed.isRetryable}`);
    console.log(`    User Message: ${processed.userMessage}`);
  });
  console.log('');

  // Test 6: Error Sanitization for Logging
  console.log('Test 6: Error Sanitization for Logging');

  const sensitiveError = new Error(
    'Authentication failed: api_key=sk-1234567890abcdef token=bearer_abc123'
  );
  const sanitized = ErrorUtils.sanitizeErrorForLogging(sensitiveError);

  console.log('✅ Original error message contains sensitive data');
  console.log('✅ Sanitized for logging:');
  console.log(`  Message: ${sanitized.message}`);
  console.log('');

  // Test 7: Streaming Error Handling
  console.log('Test 7: Streaming Error Handling');
  if (process.env['OPENAI_API_KEY']) {
    try {
      const chatbot = new Chatbot({
        provider: {
          provider: 'openai',
          apiKey: 'invalid-key-for-streaming',
          model: 'gpt-4o',
        },
      });

      const stream = chatbot.chatStream('This should fail in streaming mode');

      for await (const chunk of stream) {
        if (chunk.type === 'done' && chunk.metadata?.['error']) {
          console.log('✅ Streaming error handled gracefully:');
          console.log(`  Error: ${chunk.metadata['error']}`);
          break;
        }
      }
    } catch (error) {
      console.log('✅ Streaming error caught:');
      console.log(`  Message: ${(error as Error).message}`);
    }
  } else {
    console.log('⏭️  Streaming test skipped (no API key)');
  }
  console.log('');

  // Test 8: Circuit Breaker Pattern (if implemented)
  console.log('Test 8: Multiple Failure Scenarios');

  const scenarios = [
    'rate_limit_exceeded',
    'insufficient_quota',
    'model_not_found',
    'content_policy_violation',
    'server_error',
  ];

  scenarios.forEach((scenario) => {
    const testError = new Error(scenario);
    const category = ErrorUtils.isRetryableError(testError) ? 'retryable' : 'non-retryable';
    const permanent = ErrorUtils.isPermanentFailure(testError) ? 'permanent' : 'temporary';

    console.log(`  ${scenario}: ${category}, ${permanent}`);
  });

  console.log('\n🎉 Error handling examples completed!');
}

// Helper function to simulate different types of errors
function simulateProviderError(type: string): Error {
  switch (type) {
    case 'auth':
      return new Error('401 Unauthorized: Invalid API key');
    case 'rate_limit':
      return new Error('429 Too Many Requests: Rate limit exceeded');
    case 'quota':
      return new Error('403 Forbidden: Insufficient quota');
    case 'network':
      return new Error('ECONNRESET: Connection reset by peer');
    case 'timeout':
      return new Error('ETIMEDOUT: Request timeout');
    case 'server':
      return new Error('500 Internal Server Error');
    default:
      return new Error('Unknown error occurred');
  }
}

// Demonstrate error recovery strategies
async function demonstrateErrorRecovery() {
  console.log('\n🔄 Error Recovery Strategies\n');

  const errorHandler = new ErrorHandler({
    maxRetries: 3,
    baseDelay: 1000,
    backoffMultiplier: 2,
    useJitter: true,
  });

  // Simulate a service that fails a few times then succeeds
  let attemptCount = 0;
  const flakyOperation = async () => {
    attemptCount++;
    if (attemptCount < 3) {
      throw simulateProviderError('network');
    }
    return `Success after ${attemptCount} attempts`;
  };

  try {
    const result = await errorHandler.executeWithRetry(flakyOperation, 'openai');
    console.log(`✅ ${result}`);
  } catch (error) {
    console.log(`❌ Failed after retries: ${(error as Error).message}`);
  }
}

// Run all error handling examples
errorHandlingExamples()
  .then(() => demonstrateErrorRecovery())
  .catch(console.error);

export { errorHandlingExamples, demonstrateErrorRecovery };
