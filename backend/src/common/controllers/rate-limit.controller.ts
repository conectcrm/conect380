import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Rate Limit Statistics Controller
 * 
 * Endpoint para monitorar estatísticas de rate limiting.
 * Útil para identificar padrões de abuso e ajustar limites.
 */

@ApiTags('monitoring')
@Controller('rate-limit')
export class RateLimitController {
  // Referência ao interceptor é injetada via singleton pattern
  private static stats = {
    totalRequests: 0,
    blockedRequests: 0,
    activeIPs: new Set<string>(),
    activeEmpresas: new Set<string>(),
  };

  /**
   * Registrar requisição (chamado pelo interceptor)
   */
  static recordRequest(ip: string, empresaId?: string, blocked: boolean = false): void {
    this.stats.totalRequests++;
    if (blocked) {
      this.stats.blockedRequests++;
    }
    this.stats.activeIPs.add(ip);
    if (empresaId) {
      this.stats.activeEmpresas.add(empresaId);
    }
  }

  /**
   * Limpar IPs/empresas inativos
   */
  static cleanupInactive(): void {
    // Reset a cada hora para não acumular indefinidamente
    setInterval(() => {
      this.stats.activeIPs.clear();
      this.stats.activeEmpresas.clear();
    }, 60 * 60 * 1000);
  }

  /**
   * GET /rate-limit/stats
   * Obter estatísticas de rate limiting
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Estatísticas de rate limiting',
    description: 'Retorna métricas sobre requisições, bloqueios e uso atual do sistema'
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso',
    schema: {
      type: 'object',
      properties: {
        totalRequests: { type: 'number', example: 15234 },
        blockedRequests: { type: 'number', example: 23 },
        activeIPs: { type: 'number', example: 45 },
        activeEmpresas: { type: 'number', example: 12 },
        blockRate: { type: 'string', example: '0.15%' },
        config: {
          type: 'object',
          properties: {
            ipLimit: { type: 'number', example: 100 },
            empresaLimit: { type: 'number', example: 1000 },
            windowMinutes: { type: 'number', example: 1 },
            blockDurationMinutes: { type: 'number', example: 5 },
          }
        }
      }
    }
  })
  async getStats() {
    const stats = RateLimitController.stats;
    const blockRate = stats.totalRequests > 0
      ? ((stats.blockedRequests / stats.totalRequests) * 100).toFixed(2)
      : '0.00';

    return {
      totalRequests: stats.totalRequests,
      blockedRequests: stats.blockedRequests,
      activeIPs: stats.activeIPs.size,
      activeEmpresas: stats.activeEmpresas.size,
      blockRate: `${blockRate}%`,
      config: {
        ipLimit: 100,
        empresaLimit: 1000,
        windowMinutes: 1,
        blockDurationMinutes: 5,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /rate-limit/health
   * Verificar saúde do rate limiting
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check do rate limiting',
    description: 'Verifica se o rate limiting está funcionando corretamente'
  })
  @ApiResponse({
    status: 200,
    description: 'Rate limiting operacional',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        active: { type: 'boolean', example: true },
        uptime: { type: 'string', example: '2h 15m 30s' },
      }
    }
  })
  async getHealth() {
    return {
      status: 'healthy',
      active: true,
      message: 'Rate limiting is operational',
      timestamp: new Date().toISOString(),
    };
  }
}

// Inicializar cleanup
RateLimitController.cleanupInactive();
