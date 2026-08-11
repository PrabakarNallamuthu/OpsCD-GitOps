import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  SetMetadata,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { SessionService, type TokenPayload } from '../session/session.service.js';

export const ROLES_KEY = 'roles';
export const PUBLIC_KEY = 'isPublic';

/** Decorate routes with required roles (OR semantics) */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/** Decorate routes to bypass auth entirely (OIDC callback, JWKS, health) */
export const Public = () => SetMetadata(PUBLIC_KEY, true);

@Injectable()
export class RbacGuard implements CanActivate {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly session: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Allow public routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException({
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
        },
      });
    }

    let payload: TokenPayload;
    try {
      payload = await this.session.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException({
        error: {
          code: 'AUTH_INVALID',
          message: 'Invalid or expired token',
        },
      });
    }

    // Attach user to request for downstream use
    (request as Request & { user?: TokenPayload }).user = payload;

    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Deny-by-default: no @Roles decorator means access denied for non-public routes
    if (!requiredRoles || requiredRoles.length === 0) {
      this.logger.warn(`Deny-by-default: no @Roles on ${request.method} ${request.path}`);
      throw new ForbiddenException({
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied — route requires explicit role assignment',
        },
      });
    }

    // OR semantics: user needs at least one of the required roles
    const userRoles = payload.roles ?? [];
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      this.logger.warn(
        `RBAC denied: user=${payload.sub} roles=[${userRoles.join(',')}] required=[${requiredRoles.join(',')}]`,
      );
      throw new ForbiddenException({
        error: {
          code: 'ACCESS_DENIED',
          message: `You do not have permission to perform this action. Required role: ${requiredRoles.join(' or ')}`,
          required_roles: requiredRoles,
          user_roles: userRoles,
        },
      });
    }

    return true;
  }

  private extractToken(request: Request): string | undefined {
    // Primary: httpOnly cookie
    const cookieToken = (request.cookies as Record<string, string>)?.['access_token'];
    if (cookieToken) return cookieToken;

    // Fallback: Bearer token for service-to-service (internal)
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return undefined;
  }
}
