/**
 * Jest test setup file
 * Global test configuration and utilities
 */

// Extend Jest matchers
expect.extend({
  toBeValidChatResponse(received: unknown) {
    const pass = typeof received === 'string' && received.length > 0;

    if (pass) {
      return {
        message: () => `Expected ${received} not to be a valid chat response`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${received} to be a valid chat response (non-empty string)`,
        pass: false,
      };
    }
  },

  toBeValidProviderConfig(received: unknown) {
    const isObject = typeof received === 'object' && received !== null;
    const hasProvider = isObject && 'provider' in received;
    const pass = isObject && hasProvider;

    if (pass) {
      return {
        message: () => `Expected ${JSON.stringify(received)} not to be a valid provider config`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `Expected ${JSON.stringify(received)} to be a valid provider config with 'provider' property`,
        pass: false,
      };
    }
  },
});

// Global test utilities
(globalThis as any).mockChatResponse = (content: string, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(content), delay);
  });
};

(globalThis as any).mockProviderError = (message: string) => {
  throw new Error(`Provider Error: ${message}`);
};

// Console suppression for tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});
