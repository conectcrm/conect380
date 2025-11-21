import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';

/**
 * AsyncLocalStorage para propagar correlationId através do ciclo de vida da requisição
 */
export const correlationIdStorage = new AsyncLocalStorage<string>();

/**
 * Middleware para gerar/extrair correlation ID de requisições HTTP
 * 
 * Funcionalidade:
 * - Extrai X-Correlation-ID do header (se presente)
 * - Gera novo UUID se não fornecido
 * - Propaga via AsyncLocalStorage (disponível em toda a requisição)
 * - Adiciona ao response header para rastreamento client-side
 * 
 * Uso com AsyncLocalStorage:
 * ```typescript
 * import { correlationIdStorage } from './correlation-id.middleware';
 * 
 * const correlationId = correlationIdStorage.getStore();
 * logger.log({ correlationId, message: 'Processando...' });
 * ```
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 1. Tentar extrair do header (propagação entre serviços)
    let correlationId = req.header('x-correlation-id') || req.header('X-Correlation-ID');

    // 2. Se não existe, gerar novo UUID
    if (!correlationId) {
      correlationId = uuidv4();
    }

    // 3. Adicionar ao response header para cliente poder rastrear
    res.setHeader('X-Correlation-ID', correlationId);

    // 4. Propagar via AsyncLocalStorage (disponível em todo código assíncrono da requisição)
    correlationIdStorage.run(correlationId, () => {
      next();
    });
  }
}

/**
 * Helper para obter correlation ID do contexto atual
 * 
 * @returns correlationId ou undefined se fora de contexto de requisição
 */
export function getCorrelationId(): string | undefined {
  return correlationIdStorage.getStore();
}
