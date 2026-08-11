/**
 * WO-088: AES-256-GCM PII Encryption with Vault Transit Engine
 * Transparent PII encryption using HashiCorp Vault Transit secrets engine.
 * Per-user encryption keys enable GDPR cryptographic erasure.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { type AxiosInstance } from 'axios';

const VAULT_TRANSIT_PATH = 'transit';
const KEY_NAME_PREFIX = 'pii-user-';

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private readonly vault: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    this.vault = axios.create({
      baseURL: `${config.getOrThrow<string>('VAULT_ADDR')}/v1`,
      headers: {
        'X-Vault-Token': config.getOrThrow<string>('VAULT_TOKEN'),
      },
      timeout: 5_000,
    });
  }

  async encrypt(userId: string, plaintext: string): Promise<{ ciphertext: string; keyVersion: string }> {
    const keyName = `${KEY_NAME_PREFIX}${userId}`;
    await this.ensureKeyExists(keyName);

    const b64 = Buffer.from(plaintext).toString('base64');
    const response = await this.vault.post<{
      data: { ciphertext: string };
    }>(`/${VAULT_TRANSIT_PATH}/encrypt/${keyName}`, { plaintext: b64 });

    const ciphertext = response.data.data.ciphertext;
    // Vault ciphertext is in format "vault:v{version}:..."
    const keyVersion = ciphertext.split(':')[1] ?? 'v1';
    return { ciphertext, keyVersion };
  }

  async decrypt(userId: string, ciphertext: string): Promise<string> {
    const keyName = `${KEY_NAME_PREFIX}${userId}`;
    const response = await this.vault.post<{
      data: { plaintext: string };
    }>(`/${VAULT_TRANSIT_PATH}/decrypt/${keyName}`, { ciphertext });

    return Buffer.from(response.data.data.plaintext, 'base64').toString('utf-8');
  }

  async createUserKey(userId: string): Promise<void> {
    const keyName = `${KEY_NAME_PREFIX}${userId}`;
    await this.ensureKeyExists(keyName);
  }

  /**
   * GDPR cryptographic erasure: destroy user's Vault key.
   * All ciphertexts encrypted with this key become permanently unrecoverable.
   */
  async destroyUserKey(userId: string): Promise<void> {
    const keyName = `${KEY_NAME_PREFIX}${userId}`;
    // First, allow deletion
    await this.vault.post(`/${VAULT_TRANSIT_PATH}/keys/${keyName}/config`, {
      deletion_allowed: true,
    });
    await this.vault.delete(`/${VAULT_TRANSIT_PATH}/keys/${keyName}`);
    this.logger.log(`GDPR: Vault key destroyed for user ${userId}`);
  }

  async rotateKey(userId: string): Promise<void> {
    const keyName = `${KEY_NAME_PREFIX}${userId}`;
    await this.vault.post(`/${VAULT_TRANSIT_PATH}/keys/${keyName}/rotate`, {});
  }

  private async ensureKeyExists(keyName: string): Promise<void> {
    try {
      await this.vault.post(`/${VAULT_TRANSIT_PATH}/keys/${keyName}`, {
        type: 'aes256-gcm96',
        exportable: false,
        allow_plaintext_backup: false,
      });
    } catch (err) {
      // 400 = key already exists, that's fine
      if ((err as { response?: { status?: number } }).response?.status !== 400) {
        throw err;
      }
    }
  }
}

/**
 * Mask PII fields in structured log output.
 */
export function maskPii(obj: unknown, depth = 0): unknown {
  if (depth > 10 || obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((item) => maskPii(item, depth + 1));

  const PII_FIELDS = new Set(['email', 'name', 'firstName', 'lastName', 'phone', 'address']);
  const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (PII_FIELDS.has(key)) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'string' && EMAIL_REGEX.test(value)) {
      result[key] = value.replace(EMAIL_REGEX, '[REDACTED_EMAIL]');
    } else {
      result[key] = maskPii(value, depth + 1);
    }
  }
  return result;
}
