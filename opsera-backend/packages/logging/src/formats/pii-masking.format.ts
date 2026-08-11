import { format } from 'winston';

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
const BEARER_PATTERN = /Bearer\s+[^\s"',]+/gi;

const SENSITIVE_FIELD_NAMES = new Set([
  'password',
  'secret',
  'authorization',
  'token',
  'apikey',
  'api_key',
  'access_token',
  'refresh_token',
  'private_key',
  'client_secret',
  'credentials',
]);

function maskString(value: string): string {
  return value
    .replace(EMAIL_PATTERN, '[REDACTED_EMAIL]')
    .replace(JWT_PATTERN, '[REDACTED_TOKEN]')
    .replace(BEARER_PATTERN, 'Bearer [REDACTED_TOKEN]');
}

function maskValue(key: string, value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || value === undefined) return value;

  if (SENSITIVE_FIELD_NAMES.has(key.toLowerCase())) {
    return '[REDACTED]';
  }

  if (typeof value === 'string') {
    return maskString(value);
  }

  if (Array.isArray(value)) {
    if (seen.has(value as object)) return '[Circular]';
    seen.add(value as object);
    return value.map((item) => maskValue('', item, seen));
  }

  if (typeof value === 'object') {
    if (seen.has(value as object)) return '[Circular]';
    seen.add(value as object);
    const masked: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      masked[k] = maskValue(k, v, seen);
    }
    return masked;
  }

  return value;
}

export const piiMaskingFormat = format((info) => {
  const seen = new WeakSet<object>();
  const masked = maskValue('', info, seen) as Record<string, unknown>;
  Object.assign(info, masked);
  return info;
});
