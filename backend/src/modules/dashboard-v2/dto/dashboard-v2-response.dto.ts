export class DashboardV2OverviewDto {
  receitaFechada: number;
  receitaPrevista: number;
  ticketMedio: number;
  cicloMedioDias: number;
  oportunidadesAtivas: number;
  cache: {
    hit: boolean;
    key: string;
    generatedAt: string;
  };
}

export class DashboardV2TrendPointDto {
  date: string;
  receitaFechada: number;
  receitaPrevista: number;
  ticketMedio: number;
  conversao: number;
}

export class DashboardV2TrendsDto {
  points: DashboardV2TrendPointDto[];
  cache: {
    hit: boolean;
    key: string;
    generatedAt: string;
  };
}

export class DashboardV2FunnelStepDto {
  fromStage: string;
  toStage: string;
  entered: number;
  progressed: number;
  conversionRate: number;
}

export class DashboardV2FunnelDto {
  steps: DashboardV2FunnelStepDto[];
  cache: {
    hit: boolean;
    key: string;
    generatedAt: string;
  };
}

export class DashboardV2PipelineStageDto {
  stage: string;
  quantidade: number;
  valor: number;
  agingMedioDias: number;
  paradas: number;
}

export class DashboardV2PipelineSummaryDto {
  totalValor: number;
  stages: DashboardV2PipelineStageDto[];
  cache: {
    hit: boolean;
    key: string;
    generatedAt: string;
  };
}

export class DashboardV2InsightDto {
  id: string;
  type: 'warning' | 'opportunity' | 'info';
  title: string;
  description: string;
  impact: 'alto' | 'medio' | 'baixo';
  action?: string;
}

export class DashboardV2InsightsDto {
  insights: DashboardV2InsightDto[];
  cache: {
    hit: boolean;
    key: string;
    generatedAt: string;
  };
}

export class DashboardV2FeatureFlagDto {
  enabled: boolean;
  source: 'disabled' | 'enabled' | 'rollout';
  rolloutPercentage: number;
}
