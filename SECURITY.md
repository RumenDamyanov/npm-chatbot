# Security Policy

## Supported Versions

We take security seriously and actively maintain the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Features

The npm-chatbot library includes several built-in security features:

### 1. Input Validation and Filtering

Protect against malicious input:

```typescript
const chatbot = new Chatbot({
  provider: {
    /* ... */
  },
  security: {
    enableInputFilter: true,
    maxInputLength: 4000,
    blockedPatterns: [
      /password/i,
      /credit card/i,
      /social security/i,
      /api[_-]?key/i,
    ],
  },
});
```

### 2. Output Filtering

Filter potentially harmful or inappropriate AI responses:

```typescript
const chatbot = new Chatbot({
  provider: {
    /* ... */
  },
  security: {
    enableOutputFilter: true,
  },
});
```

### 3. Rate Limiting

Prevent abuse and control costs:

```typescript
const chatbot = new Chatbot({
  provider: {
    /* ... */
  },
  rateLimit: {
    enabled: true,
    requestsPerMinute: 10,
    requestsPerHour: 100,
    requestsPerDay: 1000,
  },
});
```

### 4. Request Timeouts

Prevent hanging requests:

```typescript
const chatbot = new Chatbot({
  provider: {
    /* ... */
  },
  timeout: 30000, // 30 seconds
});
```

## Best Practices

### API Key Management

**❌ Never commit API keys to version control:**

```typescript
// BAD - Hardcoded API key
const chatbot = new Chatbot({
  provider: {
    provider: 'openai',
    apiKey: 'sk-1234567890abcdef', // Never do this!
    model: 'gpt-4',
  },
});
```

**✅ Use environment variables:**

```typescript
// GOOD - Environment variable
const chatbot = new Chatbot({
  provider: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4',
  },
});
```

**✅ Use secret management services:**

- AWS Secrets Manager
- Azure Key Vault
- Google Secret Manager
- HashiCorp Vault
- Doppler
- 1Password

### Input Sanitization

Always validate and sanitize user input before sending to the chatbot:

```typescript
import validator from 'validator';

function sanitizeInput(input: string): string {
  // Escape HTML
  let sanitized = validator.escape(input);

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length
  if (sanitized.length > 4000) {
    sanitized = sanitized.substring(0, 4000);
  }

  return sanitized;
}

const userInput = sanitizeInput(req.body.message);
const response = await chatbot.chat({ message: userInput });
```

### Session Management

Implement proper session management to prevent unauthorized access:

```typescript
import { randomUUID } from 'crypto';

function createSecureSession(userId: string): string {
  // Generate cryptographically secure session ID
  const sessionId = `${userId}_${randomUUID()}`;

  // Store session with expiration
  sessionStore.set(sessionId, {
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 3600000, // 1 hour
  });

  return sessionId;
}

// Validate session before processing
function validateSession(sessionId: string): boolean {
  const session = sessionStore.get(sessionId);

  if (!session) {
    return false;
  }

  if (Date.now() > session.expiresAt) {
    sessionStore.delete(sessionId);
    return false;
  }

  return true;
}
```

### Content Filtering

Implement content filtering for sensitive applications:

```typescript
const chatbot = new Chatbot({
  provider: {
    /* ... */
  },
  security: {
    enableInputFilter: true,
    enableOutputFilter: true,
    blockedPatterns: [
      // Personal Information
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email

      // Sensitive keywords
      /password/i,
      /secret/i,
      /private key/i,
      /api[_-]?key/i,

      // Profanity (customize as needed)
      /offensive-word/i,
    ],
  },
});
```

### Secure Error Handling

Don't leak sensitive information in error messages:

```typescript
try {
  const response = await chatbot.chat({ message: userInput });
  res.json(response);
} catch (error) {
  // ❌ BAD - Exposes internal details
  // res.status(500).json({ error: error.message });

  // ✅ GOOD - Generic error message
  console.error('Chat error:', error); // Log internally
  res.status(500).json({
    error: 'An error occurred processing your request',
  });
}
```

### HTTPS/TLS

Always use HTTPS in production:

```typescript
import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem'),
};

const server = https.createServer(options, app);
server.listen(443, () => {
  console.log('Secure server running on port 443');
});
```

### Dependency Security

Regularly audit and update dependencies:

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Update dependencies
npm update

# Use tools like Snyk or Dependabot
```

## Reporting a Vulnerability

We take all security vulnerabilities seriously. Thank you for improving the
security of npm-chatbot.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to:

**security@rumenx.com**

### What to Include

Please include the following information:

1. **Description** - A clear description of the vulnerability
2. **Impact** - What an attacker could do with this vulnerability
3. **Steps to Reproduce** - Detailed steps to reproduce the issue
4. **Proof of Concept** - Code or commands demonstrating the vulnerability
5. **Affected Versions** - Which versions are affected
6. **Suggested Fix** - If you have ideas on how to fix it (optional)

### Example Report

```markdown
Subject: [SECURITY] Potential API Key Exposure in Logs

Description: API keys may be logged in plain text when debug logging is enabled,
potentially exposing them to unauthorized users with log access.

Impact: An attacker with access to application logs could extract API keys and
use them to make unauthorized API requests.

Steps to Reproduce:

1. Enable debug logging
2. Initialize chatbot with API key
3. Make a chat request
4. Check logs - API key is visible

Proof of Concept: [Include code snippet or log output]

Affected Versions: 1.0.0 - 1.0.5

Suggested Fix: Redact API keys in log output by replacing with asterisks after
the first 4 characters.
```

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 1-7 days
  - High: 7-14 days
  - Medium: 14-30 days
  - Low: 30-90 days

### Disclosure Policy

- We will confirm receipt of your report within 48 hours
- We will provide regular updates on our progress
- We will notify you when the vulnerability is fixed
- We will publicly disclose the vulnerability after a fix is released
- We will credit you for the discovery (unless you prefer to remain anonymous)

### Security Updates

Security updates will be released as:

- **Critical**: Immediate patch release (1.0.x)
- **High**: Patch release within 7 days
- **Medium**: Included in next minor release
- **Low**: Included in next major/minor release

## Security Hall of Fame

We would like to thank the following people for responsibly disclosing security
issues:

<!-- Contributors will be listed here -->

_No vulnerabilities reported yet._

## Additional Resources

- [OWASP API Security Project](https://owasp.org/www-project-api-security/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## Contact

For security-related questions or concerns, contact:

- **Security Email**: security@rumenx.com
- **General Contact**: contact@rumenx.com
- **GitHub Security Advisory**:
  [Create Advisory](https://github.com/RumenDamyanov/npm-chatbot/security/advisories/new)

---

**Last Updated**: October 2, 2025
