/**
 * 📊 Metrics Module
 * 
 * Módulo para expor métricas Prometheus
 */

import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';

@Module({
  controllers: [MetricsController],
})
export class MetricsModule { }
