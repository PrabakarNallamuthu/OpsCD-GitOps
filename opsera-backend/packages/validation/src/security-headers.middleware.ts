import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(_req: Request, res: Response, next: NextFunction): void {
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
    );
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    );
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.removeHeader('X-Powered-By');

    next();
  }
}
