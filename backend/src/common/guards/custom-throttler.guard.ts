import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

/**
 * 🛡️ Guard de Rate Limiting Customizado
 * 
 * Protege APIs contra abuso e ataques de força bruta.
 * 
 * Limites aplicados:
 * - SHORT: 10 requisições/segundo
 * - MEDIUM: 100 requisições/minuto  
 * - LONG: 1000 requisições/15 minutos
 * 
 * Para bypasses em rotas específicas, use @SkipThrottle()
 * Para customizar limites, use @Throttle()
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  /**
   * Gera chave de tracking para rate limiting
   * Por padrão usa IP, mas pode ser customizado para usar user ID
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Se usuário autenticado, usar user ID ao invés de IP
    // Isso evita que múltiplos usuários atrás de um proxy compartilhem o mesmo limite
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }

    // Para requisições não autenticadas, usar IP
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  }

  /**
   * Customiza resposta de erro quando limite é excedido
   */
  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    throw new ThrottlerException(
      'Muitas requisições. Por favor, aguarde antes de tentar novamente.'
    );
  }
}

