/**
 * 📊 Metrics Controller
 * 
 * Controller para expor métricas do Prometheus.
 * Endpoint consumido pelo Prometheus Scraper.
 */

import { Controller, Get, Header } from '@nestjs/common';
import { register } from '../../config/metrics';

@Controller('metrics')
export class MetricsController {
  /**
   * GET /metrics
   * Endpoint que retorna métricas no formato Prometheus
   */
  @Get()
  @Header('Content-Type', register.contentType)
  async getMetrics(): Promise<string> {
    return await register.metrics();
  }
}
