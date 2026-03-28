import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class CoreAdminLegacyRoutesMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const originalUrl = String(req.url || '');
    if (this.shouldSkipRewrite(originalUrl)) {
      next();
      return;
    }

    const rewrittenUrl =
      this.rewritePrefix(originalUrl, '/api/admin', '/core-admin') ||
      this.rewritePrefix(originalUrl, '/api/guardian', '/core-admin') ||
      this.rewritePrefix(originalUrl, '/admin', '/core-admin') ||
      this.rewritePrefix(originalUrl, '/guardian', '/core-admin');

    if (rewrittenUrl) {
      res.setHeader('x-conect-legacy-route', originalUrl.split('?')[0] || originalUrl);
      req.url = rewrittenUrl;
    }

    next();
  }

  private shouldSkipRewrite(rawUrl: string): boolean {
    return (
      rawUrl.startsWith('/system-branding/public') ||
      rawUrl.startsWith('/system-branding/runtime')
    );
  }

  private rewritePrefix(rawUrl: string, fromPrefix: string, toPrefix: string): string | null {
    if (rawUrl === fromPrefix || rawUrl.startsWith(`${fromPrefix}/`)) {
      return `${toPrefix}${rawUrl.slice(fromPrefix.length)}`;
    }

    return null;
  }
}
