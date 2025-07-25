# 📊 Sistema de Analytics Avançado para SaaS

## 📋 **Business Intelligence por Cliente**

### 1. **📈 Métricas de Produto por Cliente**

```sql
-- Eventos de Tracking
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    usuario_id UUID,
    session_id VARCHAR(100),
    event_name VARCHAR(100) NOT NULL, -- 'page_view', 'button_click', 'feature_used'
    event_category VARCHAR(50), -- 'navigation', 'action', 'conversion'
    properties JSONB, -- Dados específicos do evento
    page_url VARCHAR(500),
    referrer VARCHAR(500),
    user_agent TEXT,
    ip_address INET,
    country VARCHAR(2),
    city VARCHAR(100),
    device_type VARCHAR(20), -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(50),
    os VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sessões de Usuário
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) UNIQUE NOT NULL,
    empresa_id UUID NOT NULL,
    usuario_id UUID,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    page_views INTEGER DEFAULT 0,
    actions_count INTEGER DEFAULT 0,
    device_info JSONB,
    location_info JSONB
);

-- Funil de Conversão
CREATE TABLE conversion_funnels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    funnel_name VARCHAR(100) NOT NULL,
    steps JSONB NOT NULL, -- Array de eventos que compõem o funil
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Dados de Conversão
CREATE TABLE conversion_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID REFERENCES conversion_funnels(id),
    empresa_id UUID NOT NULL,
    usuario_id UUID,
    session_id VARCHAR(100),
    step_reached INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    conversion_time_seconds INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. **🎯 Service de Analytics**

```typescript
@Injectable()
export class AnalyticsService {
  async trackEvent(event: AnalyticsEvent) {
    // Salvar evento
    await this.eventsRepository.save(event);
    
    // Processar em tempo real para dashboards
    await this.processEventForDashboard(event);
    
    // Verificar objetivos e conversões
    await this.checkGoalCompletion(event);
  }

  async getClientDashboard(empresaId: string, dateRange: DateRange) {
    return {
      // Métricas de Uso
      usage: {
        active_users: await this.getActiveUsers(empresaId, dateRange),
        sessions: await this.getSessionsCount(empresaId, dateRange),
        avg_session_duration: await this.getAvgSessionDuration(empresaId, dateRange),
        page_views: await this.getPageViews(empresaId, dateRange)
      },
      
      // Features Mais Usadas
      features: {
        most_used: await this.getMostUsedFeatures(empresaId, dateRange),
        adoption_rate: await this.getFeatureAdoptionRate(empresaId, dateRange),
        unused_features: await this.getUnusedFeatures(empresaId, dateRange)
      },
      
      // Performance do Negócio
      business: {
        clientes_adicionados: await this.getClientesAdicionados(empresaId, dateRange),
        propostas_criadas: await this.getPropostasCriadas(empresaId, dateRange),
        receita_gerada: await this.getReceitaGerada(empresaId, dateRange),
        conversion_rate: await this.getConversionRate(empresaId, dateRange)
      },
      
      // Dados Técnicos
      technical: {
        load_times: await this.getPageLoadTimes(empresaId, dateRange),
        error_rate: await this.getErrorRate(empresaId, dateRange),
        api_usage: await this.getApiUsage(empresaId, dateRange),
        device_breakdown: await this.getDeviceBreakdown(empresaId, dateRange)
      }
    };
  }

  async getHealthScore(empresaId: string): Promise<number> {
    const metrics = await this.getClientDashboard(empresaId, { 
      start: moment().subtract(30, 'days').toDate(),
      end: new Date()
    });
    
    // Calcular score baseado em múltiplos fatores
    let score = 0;
    
    // Fator 1: Uso ativo (40% do score)
    const dailyActiveUsers = metrics.usage.active_users;
    const totalUsers = await this.getTotalUsers(empresaId);
    const usageScore = (dailyActiveUsers / totalUsers) * 40;
    
    // Fator 2: Adoção de features (30% do score)
    const featuresUsed = metrics.features.most_used.length;
    const totalFeatures = await this.getTotalFeatures();
    const adoptionScore = (featuresUsed / totalFeatures) * 30;
    
    // Fator 3: Crescimento do negócio (20% do score)
    const clientesGrowth = await this.getClientesGrowthRate(empresaId);
    const businessScore = Math.min(clientesGrowth * 20, 20);
    
    // Fator 4: Performance técnica (10% do score)
    const errorRate = metrics.technical.error_rate;
    const technicalScore = Math.max(0, (1 - errorRate) * 10);
    
    score = usageScore + adoptionScore + businessScore + technicalScore;
    
    return Math.round(score);
  }
}
```

### 3. **📊 Dashboard de Analytics Avançado**

```tsx
export const AdvancedAnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: moment().subtract(30, 'days').toDate(),
    end: new Date()
  });
  
  const { data: analytics, isLoading } = useQuery(
    ['analytics', dateRange],
    () => analyticsService.getClientDashboard(dateRange)
  );

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Analytics Avançado</h1>
          <DateRangePicker 
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Usuários Ativos"
          value={analytics?.usage.active_users}
          change={"+12%"}
          trend="up"
          icon={Users}
        />
        <MetricCard
          title="Health Score"
          value={analytics?.health_score}
          suffix="/100"
          trend="stable"
          icon={Heart}
        />
        <MetricCard
          title="Features Utilizadas"
          value={analytics?.features.most_used.length}
          suffix={`/${analytics?.features.total}`}
          trend="up"
          icon={Zap}
        />
        <MetricCard
          title="Tempo Médio de Sessão"
          value={moment.duration(analytics?.usage.avg_session_duration, 'seconds').humanize()}
          trend="up"
          icon={Clock}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uso ao Longo do Tempo */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Uso ao Longo do Tempo</h3>
          <LineChart
            data={analytics?.usage.daily_usage}
            xAxis="date"
            yAxis="users"
            height={300}
          />
        </div>

        {/* Features Mais Usadas */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Features Mais Usadas</h3>
          <BarChart
            data={analytics?.features.most_used}
            xAxis="feature"
            yAxis="usage_count"
            height={300}
          />
        </div>
      </div>

      {/* Funil de Conversão */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Funil de Conversão</h3>
        <FunnelChart data={analytics?.conversion.funnel_data} />
      </div>

      {/* Tabela de Eventos Recentes */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Eventos Recentes</h3>
        <EventsTable events={analytics?.recent_events} />
      </div>
    </div>
  );
};
```

### 4. **🔍 Análise Comportamental**

```typescript
@Injectable()
export class BehaviorAnalyticsService {
  async analyzeUserBehavior(empresaId: string) {
    return {
      // Padrões de Navegação
      navigation: {
        most_visited_pages: await this.getMostVisitedPages(empresaId),
        common_paths: await this.getCommonUserPaths(empresaId),
        exit_pages: await this.getExitPages(empresaId),
        bounce_rate: await this.getBounceRate(empresaId)
      },
      
      // Padrões de Uso
      usage: {
        peak_hours: await this.getPeakUsageHours(empresaId),
        feature_sequences: await this.getFeatureUsageSequences(empresaId),
        task_completion_rates: await this.getTaskCompletionRates(empresaId)
      },
      
      // Segmentação de Usuários
      segments: {
        power_users: await this.getPowerUsers(empresaId),
        occasional_users: await this.getOccasionalUsers(empresaId),
        at_risk_users: await this.getAtRiskUsers(empresaId),
        new_users: await this.getNewUsers(empresaId)
      },
      
      // Insights Automáticos
      insights: await this.generateInsights(empresaId)
    };
  }

  private async generateInsights(empresaId: string) {
    const insights = [];
    
    // Análise de abandono
    const abandonmentRate = await this.getFeatureAbandonmentRate(empresaId);
    if (abandonmentRate > 0.3) {
      insights.push({
        type: 'warning',
        title: 'Alta taxa de abandono',
        description: `${(abandonmentRate * 100).toFixed(1)}% dos usuários abandonam features sem completar`,
        recommendation: 'Considere melhorar a UX ou adicionar tutoriais',
        impact: 'high'
      });
    }
    
    // Análise de engajamento
    const engagementTrend = await this.getEngagementTrend(empresaId);
    if (engagementTrend < -0.1) {
      insights.push({
        type: 'alert',
        title: 'Queda no engajamento',
        description: 'Engajamento caiu 10% nas últimas semanas',
        recommendation: 'Revisar últimas mudanças ou oferecer treinamento',
        impact: 'high'
      });
    }
    
    // Oportunidades de upsell
    const unusedFeatures = await this.getUnusedPremiumFeatures(empresaId);
    if (unusedFeatures.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Oportunidade de upsell',
        description: `Cliente não usa ${unusedFeatures.length} features premium`,
        recommendation: 'Enviar material educativo sobre essas features',
        impact: 'medium'
      });
    }
    
    return insights;
  }
}
```

### 5. **📱 Analytics para Mobile (React Native)**

```typescript
// Service para tracking mobile
export class MobileAnalyticsService {
  async initializeTracking(empresaId: string, userId: string) {
    // Configurar tracking específico para mobile
    await this.setupDeviceInfo();
    await this.setupLocationTracking();
    await this.setupPerformanceMonitoring();
  }

  async trackScreenView(screenName: string, params?: any) {
    await this.trackEvent({
      event_name: 'screen_view',
      event_category: 'navigation',
      properties: {
        screen_name: screenName,
        ...params,
        platform: Platform.OS,
        app_version: getVersion(),
        device_info: await getDeviceInfo()
      }
    });
  }

  async trackUserAction(action: string, context?: any) {
    await this.trackEvent({
      event_name: action,
      event_category: 'user_action',
      properties: {
        ...context,
        network_type: await NetInfo.fetch().then(state => state.type),
        battery_level: await getBatteryLevel()
      }
    });
  }
}
```

## 🚀 **Dashboards Específicos**

### **Para Administradores SaaS:**
- 📊 Métricas consolidadas de todos os clientes
- 🎯 Health scores comparativos
- 📈 Trends de churn e growth
- 💰 Revenue por feature/módulo

### **Para Clientes Finais:**
- 📱 Uso da própria empresa
- 👥 Produtividade da equipe
- 🎯 ROI do sistema
- 📊 Comparativos com benchmarks do setor
