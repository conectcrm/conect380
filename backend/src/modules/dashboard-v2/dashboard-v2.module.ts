import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Oportunidade } from '../oportunidades/oportunidade.entity';
import { OportunidadeStageEvent } from '../oportunidades/oportunidade-stage-event.entity';
import { Proposta } from '../propostas/proposta.entity';
import { DashboardModule } from '../dashboard/dashboard.module';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { DashboardV2Controller } from './dashboard-v2.controller';
import { DashboardV2Service } from './dashboard-v2.service';
import { DashboardV2JobsService } from './dashboard-v2.jobs.service';
import { DashboardV2Processor } from './dashboard-v2.processor';
import { DashboardV2ReprocessSchedulerService } from './dashboard-v2.reprocess-scheduler.service';
import { DashboardV2ValidationSchedulerService } from './dashboard-v2.validation-scheduler.service';
import { DASHBOARD_V2_QUEUE } from './dashboard-v2.constants';
import { DashboardAgingStageDaily } from './entities/dashboard-aging-stage-daily.entity';
import { DashboardFunnelMetricsDaily } from './entities/dashboard-funnel-metrics-daily.entity';
import { DashboardPipelineSnapshotDaily } from './entities/dashboard-pipeline-snapshot-daily.entity';
import { DashboardRevenueMetricsDaily } from './entities/dashboard-revenue-metrics-daily.entity';
import { DashboardV2MetricDivergence } from './entities/dashboard-v2-metric-divergence.entity';
import { FeatureFlagTenant } from './entities/feature-flag-tenant.entity';
import { DashboardV2AggregationService } from './services/dashboard-v2-aggregation.service';
import { DashboardV2CacheService } from './services/dashboard-v2-cache.service';
import { DashboardV2FeatureFlagService } from './services/dashboard-v2-feature-flag.service';
import { DashboardV2ValidationService } from './services/dashboard-v2-validation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Empresa,
      Oportunidade,
      OportunidadeStageEvent,
      Proposta,
      DashboardPipelineSnapshotDaily,
      DashboardFunnelMetricsDaily,
      DashboardAgingStageDaily,
      DashboardRevenueMetricsDaily,
      FeatureFlagTenant,
      DashboardV2MetricDivergence,
    ]),
    BullModule.registerQueue({
      name: DASHBOARD_V2_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    DashboardModule,
  ],
  controllers: [DashboardV2Controller],
  providers: [
    DashboardV2Service,
    DashboardV2JobsService,
    DashboardV2Processor,
    DashboardV2ReprocessSchedulerService,
    DashboardV2ValidationSchedulerService,
    DashboardV2AggregationService,
    DashboardV2CacheService,
    DashboardV2FeatureFlagService,
    DashboardV2ValidationService,
  ],
  exports: [DashboardV2Service, DashboardV2JobsService, DashboardV2FeatureFlagService],
})
export class DashboardV2Module {}
