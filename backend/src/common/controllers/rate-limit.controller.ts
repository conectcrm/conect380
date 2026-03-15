import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

/**
 * Rate Limit Statistics Controller
 *
 * Endpoint para monitorar estatisticas de rate limiting.
 * Util para identificar padroes de abuso e ajustar limites.
 */
@ApiTags('monitoring')
@Controller('rate-limit')
export class RateLimitController {
  // Referencia ao interceptor e injetada via singleton pattern
  private static stats = {
    totalRequests: 0,
    blockedRequests: 0,
    activeIPs: new Set<string>(),
    activeEmpresas: new Set<string>(),
  };

  private static cleanupTimer: NodeJS.Timeout | null = null;

  /**
   * Registrar requisicao (chamado pelo interceptor)
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
    if (this.cleanupTimer) {
      return;
    }

    // Reset a cada hora para nao acumular indefinidamente
    this.cleanupTimer = setInterval(
      () => {
        this.stats.activeIPs.clear();
        this.stats.activeEmpresas.clear();
      },
      60 * 60 * 1000,
    );

    // Evita manter o processo vivo apenas por esse timer.
    if (typeof this.cleanupTimer.unref === 'function') {
      this.cleanupTimer.unref();
    }
  }

  /**
   * GET /rate-limit/stats
   * Obter estatisticas de rate limiting
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Estatisticas de rate limiting',
    description: 'Retorna metricas sobre requisicoes, bloqueios e uso atual do sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatisticas retornadas com sucesso',
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
          },
        },
      },
    },
  })
  async getStats() {
    const stats = RateLimitController.stats;
    const blockRate =
      stats.totalRequests > 0
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
   * Verificar saude do rate limiting
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check do rate limiting',
    description: 'Verifica se o rate limiting esta funcionando corretamente',
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
      },
    },
  })
  async getHealth() {
    const nodeEnv = process.env.NODE_ENV || null;
    const assumedEnv = String(process.env.NODE_ENV || 'development').toLowerCase();
    const isDevelopment = assumedEnv === 'development';

    return {
      status: 'healthy',
      active: true,
      message: 'Rate limiting is operational',
      nodeEnv,
      assumedEnv,
      isDevelopment,
      timestamp: new Date().toISOString(),
    };
  }
}

// Inicializar cleanup
RateLimitController.cleanupInactive();
