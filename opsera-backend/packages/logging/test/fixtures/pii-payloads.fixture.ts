export interface PiiTestCase {
  description: string;
  input: Record<string, unknown>;
  expectedMasked: Record<string, unknown>;
}

export const piiTestCases: PiiTestCase[] = [
  {
    description: 'plain email in message',
    input: { message: 'User john.doe@example.com logged in' },
    expectedMasked: { message: 'User [REDACTED_EMAIL] logged in' },
  },
  {
    description: 'email in nested object',
    input: { user: { email: 'jane@company.org', name: 'Jane' } },
    expectedMasked: { user: { email: '[REDACTED_EMAIL]', name: 'Jane' } },
  },
  {
    description: 'JWT token in string',
    input: {
      message: 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyMSJ9.signature',
    },
    expectedMasked: { message: '[REDACTED_TOKEN]' },
  },
  {
    description: 'Bearer token in authorization header',
    input: { headers: { authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyMSJ9.sig' } },
    expectedMasked: { headers: { authorization: '[REDACTED]' } },
  },
  {
    description: 'password field regardless of value',
    input: { password: 'supersecretpassword123' },
    expectedMasked: { password: '[REDACTED]' },
  },
  {
    description: 'secret field',
    input: { client_secret: 'abc123', publicData: 'visible' },
    expectedMasked: { client_secret: '[REDACTED]', publicData: 'visible' },
  },
  {
    description: 'array of emails',
    input: { emails: ['a@b.com', 'c@d.org', 'safe-string'] },
    expectedMasked: { emails: ['[REDACTED_EMAIL]', '[REDACTED_EMAIL]', 'safe-string'] },
  },
  {
    description: 'mixed safe and unsafe content',
    input: {
      releaseId: '550e8400-e29b-41d4-a716-446655440000',
      triggeredBy: 'admin@opsera.io',
      commitSha: 'abc123def',
    },
    expectedMasked: {
      releaseId: '550e8400-e29b-41d4-a716-446655440000',
      triggeredBy: '[REDACTED_EMAIL]',
      commitSha: 'abc123def',
    },
  },
  {
    description: 'version strings are not masked',
    input: { version: '1.0.0', nodeVersion: 'v22.0.0' },
    expectedMasked: { version: '1.0.0', nodeVersion: 'v22.0.0' },
  },
  {
    description: 'deeply nested sensitive fields',
    input: {
      request: {
        body: {
          credentials: {
            username: 'john',
            password: 'secret123',
          },
        },
      },
    },
    expectedMasked: {
      request: {
        body: {
          credentials: '[REDACTED]',
        },
      },
    },
  },
  {
    description: 'file paths are not masked',
    input: { filePath: '/var/log/app.log', configPath: '/etc/config.json' },
    expectedMasked: { filePath: '/var/log/app.log', configPath: '/etc/config.json' },
  },
  {
    description: 'multiple emails in single string',
    input: { message: 'Sent to alice@opsera.io and bob@opsera.io' },
    expectedMasked: { message: 'Sent to [REDACTED_EMAIL] and [REDACTED_EMAIL]' },
  },
];
