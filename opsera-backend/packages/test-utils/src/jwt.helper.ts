import jwt from 'jsonwebtoken';

// Test RSA private key (DEV/TEST ONLY — never use in production)
const TEST_PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0Z3VS5JJcds3xHn/ygWep4M3NHLQBN5y4I6y8o7GXsBr3
NnHwgLBCjOqfnpQxUMBP8r1sCBVKL2RVMnXJDY1dAHAcamGQWKONMcT6BTaS
TEST_KEY_PLACEHOLDER_FOR_DEVELOPMENT_ONLY_NOT_REAL
-----END RSA PRIVATE KEY-----`;

const TEST_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Z3VS5JJcds3xHn/
ygWep4M3NHLQBN5y4I6y8o7GXsBr3NnHwgLBCjOqfnpQxUMBP8r1sCBVKL2
TEST_PUBLIC_KEY_PLACEHOLDER
-----END PUBLIC KEY-----`;

export interface TestJwtClaims {
  sub?: string;
  email?: string;
  roles?: string[];
  org_id?: string;
  exp?: number;
}

export function generateTestJwt(claims: TestJwtClaims = {}): string {
  const payload = {
    sub: claims.sub ?? 'test-user-id',
    email: claims.email ?? 'test@opsera.dev',
    roles: claims.roles ?? ['Developer'],
    org_id: claims.org_id ?? 'test-org-id',
    iat: Math.floor(Date.now() / 1000),
    exp: claims.exp ?? Math.floor(Date.now() / 1000) + 900,
  };

  return jwt.sign(payload, 'test-secret-for-dev-only', {
    algorithm: 'HS256',
  });
}

export { TEST_PUBLIC_KEY };
