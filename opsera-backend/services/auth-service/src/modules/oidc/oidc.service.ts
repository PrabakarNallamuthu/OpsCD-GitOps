import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { Issuer, generators, type Client, type TokenSet } from 'openid-client';

export interface OidcClaims {
  sub: string;
  email: string;
  name: string;
  groups?: string[];
  iss: string;
}

export interface PkceSession {
  state: string;
  codeVerifier: string;
  nonce: string;
}

@Injectable()
export class OidcService {
  private readonly logger = new Logger(OidcService.name);
  private client: Client | null = null;

  constructor(private readonly config: ConfigService) {}

  async getClient(): Promise<Client> {
    if (!this.client) {
      const issuerUrl = this.config.getOrThrow<string>('OIDC_ISSUER_URL');
      const issuer = await Issuer.discover(issuerUrl);
      this.client = new issuer.Client({
        client_id: this.config.getOrThrow<string>('OIDC_CLIENT_ID'),
        client_secret: this.config.get<string>('OIDC_CLIENT_SECRET'),
        redirect_uris: [this.config.getOrThrow<string>('OIDC_REDIRECT_URI')],
        response_types: ['code'],
      });
    }
    return this.client;
  }

  generatePkceSession(): PkceSession {
    const codeVerifier = generators.codeVerifier();
    return {
      state: randomBytes(32).toString('hex'),
      codeVerifier,
      nonce: generators.nonce(),
    };
  }

  async buildAuthorizationUrl(pkce: PkceSession): Promise<string> {
    const client = await this.getClient();
    const codeChallenge = generators.codeChallenge(pkce.codeVerifier);
    return client.authorizationUrl({
      scope: 'openid profile email groups',
      state: pkce.state,
      nonce: pkce.nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
  }

  async exchangeCode(
    callbackParams: Record<string, string>,
    pkce: PkceSession,
  ): Promise<{ claims: OidcClaims; tokenSet: TokenSet }> {
    const client = await this.getClient();
    const tokenSet = await client.callback(
      this.config.getOrThrow<string>('OIDC_REDIRECT_URI'),
      callbackParams,
      {
        state: pkce.state,
        nonce: pkce.nonce,
        code_verifier: pkce.codeVerifier,
      },
    );

    const claims = tokenSet.claims() as unknown as OidcClaims;
    if (!claims.sub || !claims.email) {
      throw new UnauthorizedException('IdP did not return required claims (sub, email)');
    }

    this.logger.log(`OIDC code exchange successful for sub=${claims.sub}`);
    return { claims, tokenSet };
  }

  mapGroupsToRoles(groups: string[] = []): string[] {
    const mappings: Record<string, string> = {
      'opsera-admins': 'Admin',
      'opsera-release-managers': 'ReleaseManager',
      'opsera-sre': 'SRE',
      'opsera-developers': 'Developer',
      'opsera-leadership': 'Leadership',
      'opsera-auditors': 'Auditor',
    };
    const roles = groups.flatMap((g) => (mappings[g] ? [mappings[g]] : []));
    return roles.length > 0 ? roles : ['Developer'];
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
