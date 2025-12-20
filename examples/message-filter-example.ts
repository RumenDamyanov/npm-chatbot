/**
 * Message Filter Middleware Example for @rumenx/chatbot
 *
 * Demonstrates how to use the MessageFilterMiddleware to filter
 * inappropriate content and inject system instructions.
 *
 * Setup:
 * 1. Copy .env.example to .env
 * 2. Add your API key (any provider will work)
 * 3. Run: npm run example:filter
 */

import {
  Chatbot,
  MessageFilterMiddleware,
  DEFAULT_FILTER_CONFIG,
  type MessageFilterConfig,
} from '../src/index';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Example 1: Basic filtering with default configuration
 */
async function basicFilteringExample(): Promise<void> {
  console.log('\n=== Example 1: Basic Filtering ===\n');

  // Create filter with default configuration
  const filter = new MessageFilterMiddleware();

  // Test messages
  const testMessages = [
    'Hello, how are you?',
    'This is fucking amazing!',
    'Check out https://example.com',
    'You are a stupid idiot moron',
    'This shit is crazy, visit https://test.com',
  ];

  for (const message of testMessages) {
    console.log(`\nOriginal: "${message}"`);
    const result = filter.filter(message);
    console.log(`Filtered: "${result.message}"`);
    console.log(`Was Filtered: ${result.wasFiltered}`);
    console.log(`Reasons: ${result.filterReasons.join(', ') || 'none'}`);
    console.log(`Should Block: ${result.shouldBlock}`);
  }
}

/**
 * Example 2: Custom filter configuration
 */
async function customFilterExample(): Promise<void> {
  console.log('\n=== Example 2: Custom Filter Configuration ===\n');

  // Create filter with custom configuration
  const customConfig: Partial<MessageFilterConfig> = {
    instructions: [
      'You are a professional customer service agent.',
      'Always respond with empathy and understanding.',
      'Never use informal language or slang.',
    ],
    profanities: [...DEFAULT_FILTER_CONFIG.profanities, 'darn', 'gosh'],
    aggressionPatterns: [...DEFAULT_FILTER_CONFIG.aggressionPatterns, 'annoying', 'terrible'],
    enableRephrasing: false, // Block instead of rephrase
    replacementText: '****',
  };

  const filter = new MessageFilterMiddleware(customConfig);

  const message = 'This is darn annoying and terrible';
  console.log(`\nOriginal: "${message}"`);
  const result = filter.filter(message);
  console.log(`Filtered: "${result.message}"`);
  console.log(`Should Block: ${result.shouldBlock}`);
  console.log(`System Prompt:\n${result.context.systemPrompt}`);
}

/**
 * Example 3: Filter statistics
 */
async function filterStatsExample(): Promise<void> {
  console.log('\n=== Example 3: Filter Statistics ===\n');

  const filter = new MessageFilterMiddleware();

  const message = 'This fucking shit is crazy, check https://example.com you stupid idiot';
  console.log(`\nMessage: "${message}"`);

  const stats = filter.getFilterStats(message);
  console.log('\nStatistics:');
  console.log(`  Has Profanity: ${stats.hasProfanity}`);
  console.log(`  Profanity Count: ${stats.profanityCount}`);
  console.log(`  Has Aggression: ${stats.hasAggression}`);
  console.log(`  Aggression Count: ${stats.aggressionCount}`);
  console.log(`  Has Links: ${stats.hasLinks}`);
  console.log(`  Link Count: ${stats.linkCount}`);
}

/**
 * Example 4: Integration with Chatbot
 */
async function chatbotIntegrationExample(): Promise<void> {
  console.log('\n=== Example 4: Chatbot Integration ===\n');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('Skipping chatbot integration example - no API key found');
    return;
  }

  // Create chatbot
  const chatbot = new Chatbot({
    provider: 'openai',
    apiKey,
    model: 'gpt-4o-mini',
  });

  // Create filter
  const filter = new MessageFilterMiddleware({
    instructions: [
      "If the user's message was filtered, acknowledge it politely.",
      'Respond professionally even if the user is being rude.',
    ],
  });

  // User messages (some inappropriate)
  const userMessages = [
    'Hello, how are you?',
    'This is fucking terrible service',
    'Can you help me with my order?',
  ];

  for (const userMessage of userMessages) {
    console.log(`\n--- User: "${userMessage}" ---`);

    // Filter the message
    const filterResult = filter.filter(userMessage);
    console.log(`Filtered: "${filterResult.message}"`);

    if (filterResult.shouldBlock) {
      console.log('⚠️  Message blocked due to inappropriate content');
      continue;
    }

    // Use filtered message with chatbot
    const response = await chatbot.chat(filterResult.message, filterResult.context);

    console.log(`Assistant: ${response.message}`);
  }
}

/**
 * Example 5: Dynamic filter updates
 */
async function dynamicFilterExample(): Promise<void> {
  console.log('\n=== Example 5: Dynamic Filter Updates ===\n');

  const filter = new MessageFilterMiddleware();

  // Test message
  const message = 'This is spam content';
  console.log(`\nOriginal: "${message}"`);

  // Initial filtering (won't catch 'spam')
  let result = filter.filter(message);
  console.log(`Initially Filtered: ${result.wasFiltered}`);

  // Add 'spam' as profanity
  console.log('\nAdding "spam" to profanity list...');
  filter.addProfanities(['spam']);

  // Filter again
  result = filter.filter(message);
  console.log(`Now Filtered: ${result.wasFiltered}`);
  console.log(`Filtered Message: "${result.message}"`);

  // Add custom instruction
  console.log('\nAdding custom instruction...');
  filter.addInstructions(['Never engage with spam content.']);

  result = filter.filter(message);
  console.log(
    `System Prompt includes new instruction: ${result.context.systemPrompt?.includes('spam content')}`
  );
}

/**
 * Example 6: Enable/Disable filtering
 */
async function toggleFilterExample(): Promise<void> {
  console.log('\n=== Example 6: Toggle Filtering ===\n');

  const filter = new MessageFilterMiddleware();
  const message = 'This is fucking great';

  console.log(`\nOriginal: "${message}"`);

  // With filtering enabled
  console.log('\nFiltering ENABLED:');
  let result = filter.filter(message);
  console.log(`  Filtered: "${result.message}"`);
  console.log(`  Was Filtered: ${result.wasFiltered}`);

  // Disable filtering
  filter.setEnabled(false);
  console.log('\nFiltering DISABLED:');
  result = filter.filter(message);
  console.log(`  Filtered: "${result.message}"`);
  console.log(`  Was Filtered: ${result.wasFiltered}`);

  // Re-enable filtering
  filter.setEnabled(true);
  console.log('\nFiltering RE-ENABLED:');
  result = filter.filter(message);
  console.log(`  Filtered: "${result.message}"`);
  console.log(`  Was Filtered: ${result.wasFiltered}`);
}

/**
 * Main function to run all examples
 */
async function main(): Promise<void> {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║   Message Filter Middleware Examples             ║');
  console.log('║   @rumenx/chatbot                                 ║');
  console.log('╚═══════════════════════════════════════════════════╝');

  try {
    await basicFilteringExample();
    await customFilterExample();
    await filterStatsExample();
    await dynamicFilterExample();
    await toggleFilterExample();
    await chatbotIntegrationExample();

    console.log('\n✅ All examples completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    process.exit(1);
  }
}

// Run examples
main();
