# Contributing to npm-chatbot

Thank you for your interest in contributing to npm-chatbot! We welcome
contributions from the community and are grateful for any help you can provide.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project adheres to a [Code of Conduct](./CODE_OF_CONDUCT.md). By
participating, you are expected to uphold this code. Please report unacceptable
behavior to contact@rumenx.com.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Git
- A GitHub account

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/npm-chatbot.git
cd npm-chatbot
```

3. Add the upstream repository:

```bash
git remote add upstream https://github.com/RumenDamyanov/npm-chatbot.git
```

## Development Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file (for running examples):

```bash
cp .env.example .env
# Add your API keys
```

3. Run tests to ensure everything works:

```bash
npm test
```

4. Build the project:

```bash
npm run build
```

### Development Scripts

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run fast tests only
npm run test:fast

# Type check
npm run typecheck

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Run all checks (before committing)
npm run validate

# Build the project
npm run build

# Clean build artifacts
npm run clean
```

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**Great bug reports** include:

- A clear, descriptive title
- Exact steps to reproduce the problem
- Expected vs. actual behavior
- Code samples or test cases
- Your environment (Node.js version, OS, etc.)
- Screenshots if applicable

**Use this template:**

```markdown
**Description** A clear description of the bug.

**To Reproduce** Steps to reproduce:

1. Initialize chatbot with...
2. Call method...
3. See error...

**Expected Behavior** What you expected to happen.

**Actual Behavior** What actually happened.

**Environment**

- Node.js version:
- npm version:
- Package version:
- OS:

**Additional Context** Any other relevant information.
```

### Suggesting Features

We love feature suggestions! Please:

1. Check if the feature has already been requested
2. Clearly describe the feature and its use case
3. Explain why it would be useful to most users
4. Provide examples of how it would work

### Contributing Code

1. **Pick an issue** - Look for issues labeled `good first issue` or
   `help wanted`
2. **Comment** - Let us know you're working on it
3. **Branch** - Create a new branch:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

4. **Code** - Make your changes following our
   [coding standards](#coding-standards)
5. **Test** - Add tests for your changes
6. **Commit** - Use clear commit messages (see below)
7. **Push** - Push to your fork
8. **PR** - Open a pull request

### Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```bash
feat(providers): add support for Claude 3.5 Sonnet

Adds support for the new Claude 3.5 Sonnet model with improved
capabilities and performance.

Closes #123

fix(streaming): handle connection timeouts correctly

Previously, streaming responses would hang indefinitely on network
timeouts. Now properly throws a timeout error after 30 seconds.

Fixes #456

docs(readme): add Vue 3 integration example

Adds a complete example showing how to integrate the chatbot
library with Vue 3 applications.

test(providers): increase OpenAI provider coverage

Adds tests for edge cases in token usage tracking and error
handling scenarios.
```

## Pull Request Process

1. **Update Documentation** - Update README.md and other docs as needed
2. **Add Tests** - Ensure your code is well-tested
3. **Run Validation** - Run `npm run validate` before submitting
4. **Update CHANGELOG** - Add an entry to CHANGELOG.md (Unreleased section)
5. **Keep PR Focused** - One feature/fix per PR
6. **Respond to Feedback** - Address review comments promptly

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to
      not work as expected)
- [ ] Documentation update

## How Has This Been Tested?

Describe the tests you ran

## Checklist

- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have updated the CHANGELOG.md

## Related Issues

Fixes #(issue number)
```

## Coding Standards

### TypeScript Style Guide

- Use TypeScript for all new code
- Follow existing code style (enforced by ESLint and Prettier)
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Avoid `any` type (use `unknown` if needed)
- Use strict null checks

### Code Organization

```typescript
// 1. Imports
import { Something } from './module';

// 2. Types/Interfaces
interface MyInterface {
  property: string;
}

// 3. Constants
const CONSTANT_VALUE = 100;

// 4. Class/Function implementation
export class MyClass {
  // Private properties first
  private privateProperty: string;

  // Public properties
  public publicProperty: number;

  // Constructor
  constructor() {
    // ...
  }

  // Public methods
  public publicMethod(): void {
    // ...
  }

  // Private methods
  private privateMethod(): void {
    // ...
  }
}
```

### Best Practices

- **Keep functions small** - Each function should do one thing
- **Avoid deep nesting** - Use early returns
- **Error handling** - Always handle errors appropriately
- **Async/await** - Prefer async/await over promises
- **Immutability** - Avoid mutating objects when possible
- **Type safety** - Leverage TypeScript's type system

### Example: Good vs Bad

❌ **Bad:**

```typescript
function processData(data: any) {
  if (data) {
    if (data.users) {
      for (let i = 0; i < data.users.length; i++) {
        if (data.users[i].active) {
          // process user
        }
      }
    }
  }
}
```

✅ **Good:**

```typescript
interface User {
  active: boolean;
  name: string;
}

interface Data {
  users: User[];
}

function processActiveUsers(data: Data): void {
  if (!data?.users) {
    return;
  }

  const activeUsers = data.users.filter((user) => user.active);

  for (const user of activeUsers) {
    processUser(user);
  }
}

function processUser(user: User): void {
  // Process single user
}
```

## Testing Guidelines

### Test Structure

- Use Jest for testing
- Follow the AAA pattern: Arrange, Act, Assert
- One assertion per test when possible
- Use descriptive test names

### Test Organization

```typescript
describe('Chatbot', () => {
  describe('chat method', () => {
    it('should return a response for valid input', async () => {
      // Arrange
      const chatbot = new Chatbot(config);
      const message = 'Hello';

      // Act
      const response = await chatbot.chat({ message });

      // Assert
      expect(response.content).toBeDefined();
      expect(response.metadata.provider).toBe('openai');
    });

    it('should throw error for empty message', async () => {
      // Arrange
      const chatbot = new Chatbot(config);

      // Act & Assert
      await expect(chatbot.chat({ message: '' })).rejects.toThrow(
        'Message cannot be empty'
      );
    });
  });
});
```

### Test Coverage

- Aim for >90% code coverage
- Test happy paths and error cases
- Test edge cases and boundary conditions
- Mock external dependencies

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="chat method"

# Run with coverage
npm run test:coverage
```

## Documentation

### Code Documentation

- Add JSDoc comments for all public APIs
- Include examples in JSDoc
- Document parameters and return values
- Explain complex logic with inline comments

````typescript
/**
 * Send a message to the chatbot and receive a response
 *
 * @param options - Chat options including message and metadata
 * @returns Promise resolving to chat response with content and metadata
 * @throws {ChatbotError} If message is invalid or API request fails
 *
 * @example
 * ```typescript
 * const response = await chatbot.chat({
 *   message: 'Hello!',
 *   metadata: { sessionId: 'session-1', userId: 'user-1' }
 * });
 * console.log(response.content);
 * ```
 */
async chat(options: ChatOptions): Promise<ChatResponse> {
  // Implementation
}
````

### README Updates

When adding features:

1. Update the features list
2. Add usage examples
3. Update API reference
4. Add to roadmap if incomplete

## Community

### Getting Help

- 💬
  [GitHub Discussions](https://github.com/RumenDamyanov/npm-chatbot/discussions) -
  Ask questions
- 🐛 [GitHub Issues](https://github.com/RumenDamyanov/npm-chatbot/issues) -
  Report bugs
- 📧 Email: contact@rumenx.com

### Recognition

Contributors will be:

- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Thanked in the README

## License

By contributing, you agree that your contributions will be licensed under the
MIT License.

---

Thank you for contributing to npm-chatbot! 🎉
