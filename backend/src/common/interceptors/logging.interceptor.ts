import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

/**
 * 📊 Logging Interceptor
 *
 * Interceptor global que loga todas as requisições HTTP com informações estruturadas:
 * - Método, URL, status code
 * - Tempo de execução
 * - User ID (se autenticado)
 * - IP do cliente
 * - User agent
 *
 * Útil para:
 * - Debugging de problemas em produção
 * - Análise de performance
 * - Auditoria de acessos
 * - Detecção de anomalias
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';
    const userId = request.user?.id || 'Anonymous';

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const statusCode = response.statusCode;

          // Log estruturado com Winston
          this.logger.info('HTTP Request', {
            context: 'HTTP',
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            userId,
            ip,
            userAgent,
            timestamp: new Date().toISOString(),
          });
        },
        error: (error) => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          // Log de erro estruturado com Winston
          this.logger.error('HTTP Error', {
            context: 'HTTP',
            method,
            url,
            statusCode: error.status || 500,
            duration: `${duration}ms`,
            userId,
            ip,
            userAgent,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
          });
        },
      }),
    );
  }
}
