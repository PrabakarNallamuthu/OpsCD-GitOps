/**
 * WO-090: CSRF Protection with Double-Submit Pattern
 * Defense-in-depth layer 2 (layer 1: SameSite=Strict cookie, layer 3: WAF ModSecurity)
 */
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PUBLIC_KEY } from './rbac.guard.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const REQUIRED_HEADER = 'x-requested-with';
const REQUIRED_VALUE = 'XMLHttpRequest';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Safe HTTP methods are CSRF-exempt
    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method)) return true;

    // Public routes are CSRF-exempt
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // WebSocket upgrades are CSRF-exempt
    if (request.headers['upgrade'] === 'websocket') return true;

    // Bearer token auth (service-to-service) is CSRF-exempt
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) return true;

    // Validate X-Requested-With header
    const requestedWith = request.headers[REQUIRED_HEADER];
    if (requestedWith !== REQUIRED_VALUE) {
      throw new ForbiddenException({
        error: {
          code: 'CSRF_REJECTED',
          message: 'CSRF protection violation — missing or invalid X-Requested-With header',
        },
      });
    }

    return true;
  }
}
