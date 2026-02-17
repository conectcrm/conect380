import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Health Check Controller
 *
 * Endpoints para monitoramento de saúde do sistema.
 *
 * ENDPOINTS:
 * - GET /health - Status geral rápido
 * - GET /health/detailed - Diagnóstico completo
 * - GET /health/ready - Readiness probe (K8s)
 * - GET /health/live - Liveness probe (K8s)
 * - GET /health/metrics - Métricas Prometheus
 *
 * USO EM PRODUÇÃO:
 * - ALB Target Group: /health (health check)
 * - K8s readinessProbe: /health/ready
 * - K8s livenessProbe: /health/live
 * - CloudWatch: /health/detailed (métricas)
 */

interface HealthMetrics {
  database: {
    connected: boolean;
    responseTime: number;
    connections: {
      active: number;
      idle: number;
      total: number;
    };
    tables: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    heapUsed: number;
    heapTotal: number;
  };
  uptime: {
    seconds: number;
    formatted: string;
  };
  environment: string;
  version: string;
}

@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  /**
   * Health Check Básico (rápido)
   * Para ALB/Load Balancer
   */
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Health Check Completo (diagnóstico)
   * Para monitoramento detalhado
   */
  @Get('detailed')
  async checkDetailed(): Promise<HealthMetrics> {
    // Testar conexão com banco
    let dbConnected = false;
    let dbResponseTime = 0;
    let dbConnections = { active: 0, idle: 0, total: 0 };
    let tableCount = 0;

    try {
      const dbStart = Date.now();
      await this.dataSource.query('SELECT 1');
      dbResponseTime = Date.now() - dbStart;
      dbConnected = true;

      // Obter estatísticas de conexões
      const stats = await this.dataSource.query(`
        SELECT 
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle,
          count(*) as total
        FROM pg_stat_activity 
        WHERE datname = current_database();
      `);

      if (stats[0]) {
        dbConnections = {
          active: parseInt(stats[0].active) || 0,
          idle: parseInt(stats[0].idle) || 0,
          total: parseInt(stats[0].total) || 0,
        };
      }

      // Contar tabelas
      const tables = await this.dataSource.query(`
        SELECT count(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public';
      `);
      tableCount = parseInt(tables[0].count) || 0;
    } catch (error) {
      console.error('❌ [Health] Erro ao verificar banco:', error);
    }

    // Memória
    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const freeMem = require('os').freemem();
    const usedMem = totalMem - freeMem;

    // Uptime
    const uptimeSeconds = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;

    return {
      database: {
        connected: dbConnected,
        responseTime: dbResponseTime,
        connections: dbConnections,
        tables: tableCount,
      },
      memory: {
        used: Math.round(usedMem / 1024 / 1024),
        total: Math.round(totalMem / 1024 / 1024),
        percentage: Math.round((usedMem / totalMem) * 100),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      },
      uptime: {
        seconds: uptimeSeconds,
        formatted: `${hours}h ${minutes}m ${seconds}s`,
      },
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  /**
   * Readiness Probe (Kubernetes)
   * Indica se o app está pronto para receber tráfego
   */
  @Get('ready')
  async checkReady() {
    try {
      // Verificar se banco está respondendo (timeout 3s)
      await Promise.race([
        this.dataSource.query('SELECT 1'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
      ]);

      return { status: 'ready', timestamp: new Date().toISOString() };
    } catch (error) {
      return {
        status: 'not_ready',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Liveness Probe (Kubernetes)
   * Indica se o app está vivo (não travado)
   */
  @Get('live')
  checkLive() {
    // Verificação simples e rápida
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Métricas Prometheus (opcional)
   */
  @Get('metrics')
  async getMetrics() {
    const detailed = await this.checkDetailed();

    // Formato Prometheus
    return `
# HELP nodejs_heap_size_used_bytes Process heap size used in bytes
# TYPE nodejs_heap_size_used_bytes gauge
nodejs_heap_size_used_bytes ${detailed.memory.heapUsed * 1024 * 1024}

# HELP nodejs_heap_size_total_bytes Process heap size total in bytes
# TYPE nodejs_heap_size_total_bytes gauge
nodejs_heap_size_total_bytes ${detailed.memory.heapTotal * 1024 * 1024}

# HELP db_connections_active Active database connections
# TYPE db_connections_active gauge
db_connections_active ${detailed.database.connections.active}

# HELP db_connections_idle Idle database connections
# TYPE db_connections_idle gauge
db_connections_idle ${detailed.database.connections.idle}

# HELP db_response_time_ms Database response time in milliseconds
# TYPE db_response_time_ms gauge
db_response_time_ms ${detailed.database.responseTime}

# HELP db_tables_count Total number of database tables
# TYPE db_tables_count gauge
db_tables_count ${detailed.database.tables}

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${detailed.uptime.seconds}

# HELP memory_usage_percentage Memory usage percentage
# TYPE memory_usage_percentage gauge
memory_usage_percentage ${detailed.memory.percentage}
`.trim();
  }
}
