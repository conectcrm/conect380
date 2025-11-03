import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';

/**
 * Middleware de Contexto de Tenant (Multi-Tenancy)
 * 
 * OBJETIVO: Definir automaticamente o tenant (empresaId) no PostgreSQL
 * para cada requisição autenticada, garantindo isolamento de dados via RLS.
 * 
 * COMO FUNCIONA:
 * 1. Extrai empresaId do usuário autenticado (JWT)
 * 2. Chama set_current_tenant(empresaId) no PostgreSQL
 * 3. Row Level Security usa esse valor para filtrar queries
 * 
 * IMPORTANTE: Este middleware é CRÍTICO para segurança multi-tenant!
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly dataSource: DataSource) { }

  async use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;

    // Se há um usuário autenticado com empresa_id
    if (user?.empresa_id) {
      try {
        // Criar query runner temporário para esta requisição
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();

        // Definir tenant context no PostgreSQL
        await queryRunner.query('SELECT set_current_tenant($1)', [
          user.empresa_id,
        ]);

        // Log para debug (remover em produção ou usar logger apropriado)
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `🔐 [TenantContext] Tenant definido: ${user.empresa_id} | User: ${user.email || user.id}`,
          );
        }

        // Armazenar query runner no request para cleanup posterior
        (req as any).tenantQueryRunner = queryRunner;

        // Cleanup após resposta ser enviada
        res.on('finish', async () => {
          try {
            if ((req as any).tenantQueryRunner) {
              await (req as any).tenantQueryRunner.release();
            }
          } catch (error) {
            console.error(
              '❌ [TenantContext] Erro ao liberar query runner:',
              error.message,
            );
          }
        });
      } catch (error) {
        console.error(
          '❌ [TenantContext] Erro ao definir tenant context:',
          error.message,
          error.stack,
        );

        // IMPORTANTE: Não bloquear requisição se houver erro
        // mas logar para investigação
      }
    } else {
      // Requisição sem autenticação ou sem empresa_id
      // RLS não será aplicado (guards devem bloquear rotas protegidas)
      if (process.env.NODE_ENV === 'development') {
        console.log(
          '⚠️  [TenantContext] Requisição sem tenant context:',
          req.path,
        );
      }
    }

    next();
  }
}
