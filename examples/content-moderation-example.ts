/**
 * Content Moderation Service Example for @rumenx/chatbot
 *
 * Demonstrates how to use the ContentModerationService to analyze
 * and filter harmful or inappropriate content.
 *
 * Setup:
 * 1. Copy .env.example to .env
 * 2. Add your OpenAI API key (optional, for OpenAI moderation)
 * 3. Run: npm run example:moderation
 */

import { ContentModerationService, type ModerationConfig } from '../src/index';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Example 1: Custom rule-based moderation
 */
async function customModerationExample(): Promise<void> {
  console.log('\n=== Example 1: Custom Rule-Based Moderation ===\n');

  // Create service with custom rules only
  const service = new ContentModerationService({
    useOpenAI: false,
    useCustomRules: true,
    threshold: 0.5,
  });

  // Test messages
  const testMessages = [
    'Hello, how are you today?',
    'I want to kill someone',
    'You are a stupid idiot',
    'Check out this explicit porn content',
    'I hate those racist bigots',
    'I want to commit suicide',
  ];

  for (const message of testMessages) {
    console.log(`\nMessage: "${message}"`);
    const result = await service.moderate(message);
    console.log(`  Flagged: ${result.flagged}`);
    console.log(`  Categories: ${result.categories.join(', ') || 'none'}`);
    console.log(`  Should Block: ${result.shouldBlock}`);
    if (result.flagged) {
      console.log(`  Scores:`, result.scores);
    }
  }
}

/**
 * Example 2: OpenAI moderation API
 */
async function openaiModerationExample(): Promise<void> {
  console.log('\n=== Example 2: OpenAI Moderation API ===\n');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('⚠️  Skipping - OpenAI API key not found');
    return;
  }

  // Create service with OpenAI moderation
  const service = new ContentModerationService({
    apiKey,
    useOpenAI: true,
    useCustomRules: false,
  });

  const testMessages = [
    'I love sunny days and flowers',
    'I hate you and want to hurt you',
    'How do I build a bomb?',
  ];

  for (const message of testMessages) {
    console.log(`\nMessage: "${message}"`);
    try {
      const result = await service.moderate(message);
      console.log(`  Provider: ${result.provider}`);
      console.log(`  Flagged: ${result.flagged}`);
      console.log(`  Categories: ${result.categories.join(', ') || 'none'}`);

      if (result.flagged) {
        console.log(`  Top Scores:`);
        const sortedScores = Object.entries(result.scores)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3);
        sortedScores.forEach(([category, score]) => {
          console.log(`    ${category}: ${(score * 100).toFixed(2)}%`);
        });
      }
    } catch (error) {
      console.error(`  Error: ${error}`);
    }
  }
}

/**
 * Example 3: Combined moderation (OpenAI + Custom)
 */
async function combinedModerationExample(): Promise<void> {
  console.log('\n=== Example 3: Combined Moderation ===\n');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('⚠️  Skipping - OpenAI API key not found');
    return;
  }

  // Create service with both OpenAI and custom rules
  const service = new ContentModerationService({
    apiKey,
    useOpenAI: true,
    useCustomRules: true,
    threshold: 0.5,
  });

  const message = 'I want to kill someone with violence';
  console.log(`\nMessage: "${message}"`);

  try {
    const result = await service.moderate(message);
    console.log(`  Provider: ${result.provider}`);
    console.log(`  Flagged: ${result.flagged}`);
    console.log(`  Categories: ${result.categories.join(', ')}`);
    console.log(`  Details: ${result.details}`);
    console.log(`  Should Block: ${result.shouldBlock}`);
  } catch (error) {
    console.error(`  Error: ${error}`);
  }
}

/**
 * Example 4: Moderation statistics
 */
async function moderationStatsExample(): Promise<void> {
  console.log('\n=== Example 4: Moderation Statistics ===\n');

  const service = new ContentModerationService({
    useOpenAI: false,
    useCustomRules: true,
  });

  const testMessages = [
    'This is a safe message',
    'I hate this',
    'I want to kill someone',
    'Check this explicit porn and nude content',
  ];

  for (const message of testMessages) {
    console.log(`\nMessage: "${message}"`);
    const stats = await service.getStats(message);
    console.log(`  Safe: ${stats.isSafe}`);
    console.log(`  Risk Level: ${stats.riskLevel}`);
    console.log(`  Flagged Categories: ${stats.flaggedCount}`);
    console.log(
      `  Highest Risk: ${stats.highestCategory} (${(stats.highestScore * 100).toFixed(2)}%)`
    );
  }
}

/**
 * Example 5: Custom threshold configuration
 */
async function customThresholdExample(): Promise<void> {
  console.log('\n=== Example 5: Custom Threshold ===\n');

  const message = 'I hate this stupid thing';

  // Low threshold (strict)
  console.log('\nLow Threshold (0.3) - Strict:');
  const strictService = new ContentModerationService({
    useOpenAI: false,
    useCustomRules: true,
    threshold: 0.3,
  });
  const strictResult = await strictService.moderate(message);
  console.log(`  Flagged: ${strictResult.flagged}`);
  console.log(`  Categories: ${strictResult.categories.join(', ') || 'none'}`);

  // Medium threshold (balanced)
  console.log('\nMedium Threshold (0.5) - Balanced:');
  const balancedService = new ContentModerationService({
    useOpenAI: false,
    useCustomRules: true,
    threshold: 0.5,
  });
  const balancedResult = await balancedService.moderate(message);
  console.log(`  Flagged: ${balancedResult.flagged}`);
  console.log(`  Categories: ${balancedResult.categories.join(', ') || 'none'}`);

  // High threshold (lenient)
  console.log('\nHigh Threshold (0.8) - Lenient:');
  const lenientService = new ContentModerationService({
    useOpenAI: false,
    useCustomRules: true,
    threshold: 0.8,
  });
  const lenientResult = await lenientService.moderate(message);
  console.log(`  Flagged: ${lenientResult.flagged}`);
  console.log(`  Categories: ${lenientResult.categories.join(', ') || 'none'}`);
}

/**
 * Example 6: Caching demonstration
 */
async function cachingExample(): Promise<void> {
  console.log('\n=== Example 6: Caching ===\n');

  const service = new ContentModerationService({
    useOpenAI: false,
    useCustomRules: true,
    enableCache: true,
    cacheTTL: 5000, // 5 seconds
  });

  const message = 'Test message for caching';

  console.log('First request (will be processed):');
  const start1 = Date.now();
  await service.moderate(message);
  const end1 = Date.now();
  console.log(`  Time: ${end1 - start1}ms`);

  console.log('\nSecond request (from cache):');
  const start2 = Date.now();
  await service.moderate(message);
  const end2 = Date.now();
  console.log(`  Time: ${end2 - start2}ms`);

  const stats = service.getCacheStats();
  console.log(`\nCache Stats:`);
  console.log(`  Size: ${stats.size}`);
  console.log(`  Hit Rate: ${stats.hitRate}`);

  console.log('\nClearing cache...');
  service.clearCache();
  const newStats = service.getCacheStats();
  console.log(`  New Size: ${newStats.size}`);
}

/**
 * Example 7: shouldBlock helper
 */
async function shouldBlockExample(): Promise<void> {
  console.log('\n=== Example 7: shouldBlock Helper ===\n');

  const service = new ContentModerationService({
    useOpenAI: false,
    useCustomRules: true,
  });

  const messages = ['Hello, how are you?', 'I want to kill someone', 'This is spam'];

  for (const message of messages) {
    const shouldBlock = await service.shouldBlock(message);
    console.log(`\nMessage: "${message}"`);
    console.log(`  Should Block: ${shouldBlock ? '🚫 Yes' : '✅ No'}`);
  }
}

/**
 * Example 8: Real-time chat integration
 */
async function chatIntegrationExample(): Promise<void> {
  console.log('\n=== Example 8: Chat Integration ===\n');

  const service = new ContentModerationService({
    useOpenAI: false,
    useCustomRules: true,
    threshold: 0.5,
  });

  // Simulate chat messages
  const chatMessages = [
    { user: 'Alice', message: 'Hello everyone!' },
    { user: 'Bob', message: 'I hate you all' },
    { user: 'Charlie', message: 'Check out my website' },
    { user: 'Dave', message: 'I want to kill someone' },
    { user: 'Eve', message: 'Great discussion!' },
  ];

  console.log('Processing chat messages:\n');

  for (const chat of chatMessages) {
    const result = await service.moderate(chat.message);

    console.log(`[${chat.user}]: "${chat.message}"`);

    if (result.shouldBlock) {
      console.log(`  🚫 BLOCKED - ${result.categories.join(', ')}`);
    } else if (result.flagged) {
      console.log(`  ⚠️  WARNING - ${result.categories.join(', ')}`);
    } else {
      console.log(`  ✅ ALLOWED`);
    }
    console.log();
  }
}

/**
 * Main function to run all examples
 */
async function main(): Promise<void> {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║   Content Moderation Service Examples            ║');
  console.log('║   @rumenx/chatbot                                 ║');
  console.log('╚═══════════════════════════════════════════════════╝');

  try {
    await customModerationExample();
    await moderationStatsExample();
    await customThresholdExample();
    await shouldBlockExample();
    await cachingExample();
    await chatIntegrationExample();
    await openaiModerationExample();
    await combinedModerationExample();

    console.log('\n✅ All examples completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    process.exit(1);
  }
}

// Run examples
main();
