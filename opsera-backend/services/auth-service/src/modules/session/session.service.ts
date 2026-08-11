import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type Redis from 'ioredis';
import { randomUUID, randomBytes } from 'crypto';
import { createPrivateKey, createPublicKey } from 'crypto';
import { SignJWT, jwtVerify, exportJWK, type JWTPayload } from 'jose';

export interface TokenPayload extends JWTPayload {
  sub: string;
  email: string;
  roles: string[];
  org_id: string;
  jti: string;
}

const REFRESH_TOKEN_TTL_DAYS = 7;
const ACCESS_TOKEN_TTL_SECS = 900; // 15 minutes

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly privateKey: ReturnType<typeof createPrivateKey>;
  private readonly publicKey: ReturnType<typeof createPublicKey>;

  constructor(
    @InjectRedis() private readonly redis: Redis,
  ) {
    // In production, keys come from Vault via ESO
    // For local dev, use env vars; for tests, generate a test key pair
    const privateKeyPem = process.env['JWT_PRIVATE_KEY']?.replace(/\\n/g, '\n')
      ?? this.generateDevPrivateKey();
    this.privateKey = createPrivateKey(privateKeyPem);
    this.publicKey = createPublicKey(this.privateKey);
  }

  async issueAccessToken(payload: Omit<TokenPayload, 'jti' | 'iat' | 'exp'>): Promise<string> {
    const jti = randomUUID();
    const token = await new SignJWT({ ...payload, jti })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt()
      .setExpirationTime(`${ACCESS_TOKEN_TTL_SECS}s`)
      .setIssuer('https://auth.opsera.internal')
      .setAudience('opsera-platform')
      .sign(this.privateKey);
    return token;
  }

  async issueRefreshToken(userId: string, familyId = randomUUID()): Promise<string> {
    const token = randomBytes(48).toString('base64url');
    const tokenHash = this.hashToken(token);
    const ttlSeconds = REFRESH_TOKEN_TTL_DAYS * 24 * 3600;

    const key = `refresh:${tokenHash}`;
    await this.redis.setex(
      key,
      ttlSeconds,
      JSON.stringify({ userId, familyId, issuedAt: Date.now() }),
    );
    return token;
  }

  async validateRefreshToken(
    token: string,
  ): Promise<{ userId: string; familyId: string }> {
    const tokenHash = this.hashToken(token);
    const key = `refresh:${tokenHash}`;
    const data = await this.redis.get(key);
    if (!data) {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }

    const { userId, familyId } = JSON.parse(data) as { userId: string; familyId: string };

    // Detect token reuse: revoke entire family if this token was already consumed
    const consumedKey = `refresh_consumed:${tokenHash}`;
    const alreadyConsumed = await this.redis.exists(consumedKey);
    if (alreadyConsumed) {
      await this.revokeFamily(familyId);
      throw new UnauthorizedException('Refresh token reuse detected — all sessions revoked');
    }

    // Mark as consumed (keeping for reuse detection, short TTL)
    await this.redis.setex(consumedKey, 3600, '1');
    await this.redis.del(key);

    return { userId, familyId };
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await this.redis.del(`refresh:${tokenHash}`);
  }

  async revokeFamily(familyId: string): Promise<void> {
    this.logger.warn(`Revoking all tokens in family ${familyId}`);
    await this.redis.set(`family_revoked:${familyId}`, '1', 'EX', 3600 * 24 * 8);
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    const publicKey = await import('jose').then(({ importSPKI }) =>
      importSPKI(this.publicKey.export({ type: 'spki', format: 'pem' }) as string, 'RS256'),
    );
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: 'https://auth.opsera.internal',
      audience: 'opsera-platform',
    });
    return payload as unknown as TokenPayload;
  }

  async getJwks(): Promise<{ keys: object[] }> {
    const jwk = await exportJWK(this.publicKey);
    return { keys: [{ ...jwk, alg: 'RS256', use: 'sig', kid: 'opsera-signing-key-1' }] };
  }

  private hashToken(token: string): string {
    const { createHash } = require('crypto') as typeof import('crypto');
    return createHash('sha256').update(token).digest('hex');
  }

  private generateDevPrivateKey(): string {
    const { generateKeyPairSync } = require('crypto') as typeof import('crypto');
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    return privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
  }
}
