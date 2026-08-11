import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Body,
  HttpCode,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { OidcService } from './oidc.service.js';
import { SessionService } from '../session/session.service.js';

const PKCE_SESSION_KEY = 'oidc_pkce_session';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

@Controller('api/v1/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly oidc: OidcService,
    private readonly session: SessionService,
  ) {}

  @Get('login')
  async login(@Req() req: Request, @Res() res: Response): Promise<void> {
    const pkce = this.oidc.generatePkceSession();
    // Store PKCE session in encrypted session cookie (handled by express-session)
    (req.session as Record<string, unknown>)[PKCE_SESSION_KEY] = pkce;
    const authUrl = await this.oidc.buildAuthorizationUrl(pkce);
    res.redirect(authUrl);
  }

  @Get('callback')
  async callback(@Req() req: Request, @Res() res: Response): Promise<void> {
    const pkce = (req.session as Record<string, unknown>)[PKCE_SESSION_KEY] as
      | ReturnType<OidcService['generatePkceSession']>
      | undefined;
    if (!pkce) {
      throw new UnauthorizedException('No PKCE session found');
    }

    const params = req.query as Record<string, string>;
    const { claims } = await this.oidc.exchangeCode(params, pkce);
    const roles = this.oidc.mapGroupsToRoles(claims.groups);

    const accessToken = await this.session.issueAccessToken({
      sub: claims.sub,
      email: claims.email,
      roles,
      org_id: process.env['DEFAULT_ORG_ID'] ?? '00000000-0000-0000-0000-000000000000',
    });

    const refreshToken = await this.session.issueRefreshToken(claims.sub);

    res.cookie('access_token', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 900 * 1000, // 15 minutes
    });
    res.cookie('refresh_token', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 3600 * 1000, // 7 days
    });

    delete (req.session as Record<string, unknown>)[PKCE_SESSION_KEY];
    this.logger.log(`Login successful for sub=${claims.sub}`);

    res.redirect(process.env['FRONTEND_URL'] ?? '/');
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ ok: boolean }> {
    const refreshToken = (req.cookies as Record<string, string>)['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    const { userId, familyId } = await this.session.validateRefreshToken(refreshToken);
    const newRefreshToken = await this.session.issueRefreshToken(userId, familyId);
    const newAccessToken = await this.session.issueAccessToken({
      sub: userId,
      email: '',
      roles: [],
      org_id: process.env['DEFAULT_ORG_ID'] ?? '00000000-0000-0000-0000-000000000000',
    });

    res.cookie('access_token', newAccessToken, { ...COOKIE_OPTIONS, maxAge: 900 * 1000 });
    res.cookie('refresh_token', newRefreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 3600 * 1000 });
    return { ok: true };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ ok: boolean }> {
    const refreshToken = (req.cookies as Record<string, string>)['refresh_token'];
    if (refreshToken) await this.session.revokeRefreshToken(refreshToken);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    req.session.destroy(() => {/* noop */});
    return { ok: true };
  }

  @Get('.well-known/jwks.json')
  async jwks(): Promise<{ keys: object[] }> {
    return this.session.getJwks();
  }
}
