import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para forçar redirecionamento HTTP → HTTPS em produção
 * 
 * @description
 * Este middleware verifica se a requisição é HTTP e, se estiver em produção,
 * redireciona automaticamente para HTTPS (301 Permanent Redirect).
 * 
 * Em desenvolvimento, permite HTTP para facilitar testes locais.
 * 
 * @example
 * // Registrar no AppModule:
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer
 *       .apply(HttpsRedirectMiddleware)
 *       .forRoutes('*');
 *   }
 * }
 * 
 * @environment
 * - NODE_ENV=production → Força HTTPS
 * - NODE_ENV=development → Permite HTTP
 * - FORCE_HTTPS=true → Força HTTPS independente do NODE_ENV
 */
@Injectable()
export class HttpsRedirectMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const isProduction = process.env.NODE_ENV === 'production';
    const forceHttps = process.env.FORCE_HTTPS === 'true';
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';

    // Se já for HTTPS, continuar
    if (isHttps) {
      return next();
    }

    // Se for desenvolvimento e não forçar HTTPS, permitir HTTP
    if (!isProduction && !forceHttps) {
      return next();
    }

    // Redirecionar para HTTPS
    const httpsUrl = `https://${req.headers.host}${req.url}`;
    
    console.log(`🔒 [HTTPS Redirect] ${req.method} ${req.url} → ${httpsUrl}`);
    
    // 301 = Permanent Redirect (browsers vão cachear)
    return res.redirect(301, httpsUrl);
  }
}
