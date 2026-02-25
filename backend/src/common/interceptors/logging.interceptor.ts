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
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  private isTestEnv(): boolean {
    return process.env.NODE_ENV === 'test' || process.env.APP_ENV === 'test';
  }

  private shouldLogHttpRequest(): boolean {
    if (!this.isTestEnv()) return true;
    return process.env.HTTP_LOG_REQUESTS_IN_TEST === 'true';
  }

  private shouldLogHttpError(statusCode: number): boolean {
    if (!this.isTestEnv()) return true;

    if (statusCode === 501) {
      return process.env.HTTP_LOG_UNIMPLEMENTED_IN_TEST === 'true';
    }

    // Em testes, mantemos apenas erros inesperados (5xx) por padrão.
    if (statusCode >= 500) return true;

    return process.env.HTTP_LOG_EXPECTED_ERRORS_IN_TEST === 'true';
  }

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

          if (!this.shouldLogHttpRequest()) {
            return;
          }

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

          const statusCode = error?.status || 500;
          const shouldSuppressStack = statusCode === 429;
          const logLevel: 'warn' | 'error' = statusCode === 429 ? 'warn' : 'error';

          if (!this.shouldLogHttpError(statusCode)) {
            return;
          }

          // Log de erro estruturado com Winston
          this.logger[logLevel]('HTTP Error', {
            context: 'HTTP',
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            userId,
            ip,
            userAgent,
            error: error.message,
            stack: shouldSuppressStack ? undefined : error.stack,
            timestamp: new Date().toISOString(),
          });
        },
      }),
    );
  }
}
