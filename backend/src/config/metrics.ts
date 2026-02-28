/**
 * 📊 Prometheus Metrics Configuration
 *
 * Configuração centralizada de métricas para observabilidade do sistema.
 * Permite monitorar KPIs de negócio e performance técnica.
 *
 * Features:
 * - Counters: Contadores crescentes (tickets criados, mensagens enviadas)
 * - Histograms: Distribuição de valores (tempo de atendimento, latência)
 * - Gauges: Valores instantâneos (atendentes online, tickets abertos)
 * - Labels: Segmentação de métricas (por empresa, departamento, canal)
 */

import * as promClient from 'prom-client';

// Registry global (singleton)
export const register = new promClient.Registry();

// Adicionar métricas padrão do Node.js (CPU, memória, GC, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: 'conectcrm_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5], // Buckets para GC
});

/**
 * ═══════════════════════════════════════════════════════════════
 * 📈 MÉTRICAS DE TICKETS
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Counter: Total de tickets criados
 * Labels: empresaId, canalId, departamentoId, origem (webhook, manual, bot)
 */
export const ticketsCriadosTotal = new promClient.Counter({
  name: 'conectcrm_tickets_criados_total',
  help: 'Total de tickets criados no sistema',
  labelNames: ['empresaId', 'canalId', 'departamentoId', 'origem'],
  registers: [register],
});

/**
 * Counter: Total de tickets encerrados
 * Labels: empresaId, departamentoId, motivo (resolvido, cancelado, spam)
 */
export const ticketsEncerradosTotal = new promClient.Counter({
  name: 'conectcrm_tickets_encerrados_total',
  help: 'Total de tickets encerrados',
  labelNames: ['empresaId', 'departamentoId', 'motivo'],
  registers: [register],
});

/**
 * Counter: Total de transferências de tickets
 * Labels: empresaId, departamentoOrigem, departamentoDestino
 */
export const ticketsTransferidosTotal = new promClient.Counter({
  name: 'conectcrm_tickets_transferidos_total',
  help: 'Total de tickets transferidos entre atendentes/departamentos',
  labelNames: ['empresaId', 'departamentoOrigem', 'departamentoDestino'],
  registers: [register],
});

/**
 * Gauge: Tickets abertos no momento (por status)
 * Labels: empresaId, status (ABERTO, EM_ATENDIMENTO, AGUARDANDO)
 */
export const ticketsAbertosGauge = new promClient.Gauge({
  name: 'conectcrm_tickets_abertos_atual',
  help: 'Quantidade atual de tickets abertos (snapshot)',
  labelNames: ['empresaId', 'status'],
  registers: [register],
});

/**
 * Histogram: Tempo de vida do ticket (criação → fechamento)
 * Buckets: 1min, 5min, 15min, 30min, 1h, 4h, 1dia
 */
export const ticketTempoVidaHistogram = new promClient.Histogram({
  name: 'conectcrm_ticket_tempo_vida_segundos',
  help: 'Tempo entre criação e fechamento do ticket (em segundos)',
  labelNames: ['empresaId', 'departamentoId'],
  buckets: [60, 300, 900, 1800, 3600, 14400, 86400], // segundos
  registers: [register],
});

/**
 * Histogram: Tempo até primeira resposta
 * Buckets: 30s, 1min, 3min, 5min, 10min, 30min
 */
export const ticketTempoPrimeiraRespostaHistogram = new promClient.Histogram({
  name: 'conectcrm_ticket_tempo_primeira_resposta_segundos',
  help: 'Tempo entre criação do ticket e primeira resposta do atendente',
  labelNames: ['empresaId', 'departamentoId', 'canalId'],
  buckets: [30, 60, 180, 300, 600, 1800], // segundos
  registers: [register],
});

/**
 * ═══════════════════════════════════════════════════════════════
 * 💬 MÉTRICAS DE MENSAGENS
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Counter: Total de mensagens enviadas
 * Labels: empresaId, canalId, remetente (ATENDENTE, BOT, SISTEMA)
 */
export const mensagensEnviadasTotal = new promClient.Counter({
  name: 'conectcrm_mensagens_enviadas_total',
  help: 'Total de mensagens enviadas pelo sistema',
  labelNames: ['empresaId', 'canalId', 'remetente'],
  registers: [register],
});

/**
 * Counter: Total de mensagens recebidas
 * Labels: empresaId, canalId
 */
export const mensagensRecebidasTotal = new promClient.Counter({
  name: 'conectcrm_mensagens_recebidas_total',
  help: 'Total de mensagens recebidas de clientes',
  labelNames: ['empresaId', 'canalId'],
  registers: [register],
});

/**
 * Counter: Erros ao enviar mensagens
 * Labels: empresaId, canalId, erro (timeout, api_error, validation_error)
 */
export const mensagensErrosTotal = new promClient.Counter({
  name: 'conectcrm_mensagens_erros_total',
  help: 'Total de erros ao enviar mensagens',
  labelNames: ['empresaId', 'canalId', 'erro'],
  registers: [register],
});

/**
 * Histogram: Tempo de envio de mensagem (latência)
 * Buckets: 100ms, 500ms, 1s, 2s, 5s, 10s
 */
export const mensagemLatenciaHistogram = new promClient.Histogram({
  name: 'conectcrm_mensagem_latencia_segundos',
  help: 'Latência de envio de mensagem (tempo de resposta da API)',
  labelNames: ['empresaId', 'canalId'],
  buckets: [0.1, 0.5, 1, 2, 5, 10], // segundos
  registers: [register],
});

/**
 * ═══════════════════════════════════════════════════════════════
 * 👥 MÉTRICAS DE ATENDENTES
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Gauge: Atendentes online no momento
 * Labels: empresaId, departamentoId
 */
export const atendentesOnlineGauge = new promClient.Gauge({
  name: 'conectcrm_atendentes_online_atual',
  help: 'Quantidade de atendentes online no momento',
  labelNames: ['empresaId', 'departamentoId'],
  registers: [register],
});

/**
 * Gauge: Capacidade disponível (atendentes * limite de tickets simultâneos)
 * Labels: empresaId, departamentoId
 */
export const capacidadeDisponivelGauge = new promClient.Gauge({
  name: 'conectcrm_capacidade_disponivel_atual',
  help: 'Capacidade disponível de atendimento (slots livres)',
  labelNames: ['empresaId', 'departamentoId'],
  registers: [register],
});

/**
 * Histogram: Tempo médio de atendimento por atendente
 * Buckets: 5min, 15min, 30min, 1h, 2h, 4h
 */
export const atendenteTempoAtendimentoHistogram = new promClient.Histogram({
  name: 'conectcrm_atendente_tempo_atendimento_segundos',
  help: 'Tempo médio de atendimento por atendente',
  labelNames: ['empresaId', 'atendenteId', 'departamentoId'],
  buckets: [300, 900, 1800, 3600, 7200, 14400], // segundos
  registers: [register],
});

/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 MÉTRICAS DE BOT/TRIAGEM
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Counter: Total de sessões de triagem iniciadas
 * Labels: empresaId, canalId
 */
export const triagemSessoesTotal = new promClient.Counter({
  name: 'conectcrm_triagem_sessoes_total',
  help: 'Total de sessões de triagem iniciadas',
  labelNames: ['empresaId', 'canalId'],
  registers: [register],
});

/**
 * Counter: Sessões de triagem completadas (com sucesso)
 * Labels: empresaId, departamentoSelecionado
 */
export const triagemCompletadasTotal = new promClient.Counter({
  name: 'conectcrm_triagem_completadas_total',
  help: 'Total de sessões de triagem completadas com sucesso',
  labelNames: ['empresaId', 'departamentoSelecionado'],
  registers: [register],
});

/**
 * Counter: Sessões de triagem abandonadas
 * Labels: empresaId, etapaAbandonada
 */
export const triagemAbandonadasTotal = new promClient.Counter({
  name: 'conectcrm_triagem_abandonadas_total',
  help: 'Total de sessões de triagem abandonadas pelo usuário',
  labelNames: ['empresaId', 'etapaAbandonada'],
  registers: [register],
});

/**
 * Histogram: Tempo de conclusão da triagem
 * Buckets: 30s, 1min, 2min, 5min, 10min
 */
export const triagemTempoHistogram = new promClient.Histogram({
  name: 'conectcrm_triagem_tempo_segundos',
  help: 'Tempo de conclusão da triagem (primeiro contato → departamento selecionado)',
  labelNames: ['empresaId'],
  buckets: [30, 60, 120, 300, 600], // segundos
  registers: [register],
});

/**
 * ═══════════════════════════════════════════════════════════════
 * 🔄 MÉTRICAS DE PERFORMANCE
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Histogram: Latência de queries do banco de dados
 * Buckets: 10ms, 50ms, 100ms, 500ms, 1s, 5s
 */
export const dbQueryLatenciaHistogram = new promClient.Histogram({
  name: 'conectcrm_db_query_latencia_segundos',
  help: 'Latência de queries do banco de dados',
  labelNames: ['operacao', 'tabela'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5], // segundos
  registers: [register],
});

/**
 * Counter: Erros de aplicação
 * Labels: tipo (database, api_external, validation, unknown)
 */
export const errosAplicacaoTotal = new promClient.Counter({
  name: 'conectcrm_erros_aplicacao_total',
  help: 'Total de erros da aplicação por tipo',
  labelNames: ['tipo', 'servico'],
  registers: [register],
});

/**
 * ═══════════════════════════════════════════════════════════════
 * 🎯 MÉTRICAS DE NEGÓCIO (SLA)
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Counter: Tickets que violaram SLA de primeira resposta
 * Labels: empresaId, departamentoId
 */
export const slaViolacoesTotal = new promClient.Counter({
  name: 'conectcrm_sla_violacoes_total',
  help: 'Total de tickets que violaram SLA de primeira resposta',
  labelNames: ['empresaId', 'departamentoId', 'tipo_sla'],
  registers: [register],
});

/**
 * Gauge: Taxa de resolução no primeiro contato (FCR)
 * Labels: empresaId, departamentoId
 * Valor: 0-100 (percentual)
 */
export const fcrTaxaGauge = new promClient.Gauge({
  name: 'conectcrm_fcr_taxa_percentual',
  help: 'Taxa de resolução no primeiro contato (First Contact Resolution)',
  labelNames: ['empresaId', 'departamentoId'],
  registers: [register],
});

/**
 * Gauge: CSAT médio (Customer Satisfaction Score)
 * Labels: empresaId, departamentoId
 * Valor: 1-5 (escala de satisfação)
 */
export const csatMediaGauge = new promClient.Gauge({
  name: 'conectcrm_csat_media',
  help: 'CSAT médio (Customer Satisfaction Score) - escala 1 a 5',
  labelNames: ['empresaId', 'departamentoId'],
  registers: [register],
});

/**
 * Gauge: Success Rate (taxa de sucesso) nos últimos 30 dias
 * Labels: empresaId
 * Valor: 0-100 (percentual)
 */
export const successRate30dGauge = new promClient.Gauge({
  name: 'conectcrm_success_rate_30d_percentual',
  help: 'Taxa de sucesso de operações nos últimos 30 dias (percentual)',
  labelNames: ['empresaId'],
  registers: [register],
});

/**
 * Gauge: Taxa de erro (inverso de success rate)
 * Labels: empresaId
 * Valor: 0-100 (percentual)
 */
export const erroTaxaGauge = new promClient.Gauge({
  name: 'conectcrm_erro_taxa_percentual',
  help: 'Taxa de erro de operações (percentual)',
  labelNames: ['empresaId'],
  registers: [register],
});

/**
 * Histogram: Latência de requisições HTTP (para calcular P95)
 * Buckets: 50ms, 100ms, 200ms, 500ms, 1s, 2s, 5s, 10s
 */
export const httpRequestDurationHistogram = new promClient.Histogram({
  name: 'conectcrm_http_request_duration_seconds',
  help: 'Duração de requisições HTTP (para calcular P50, P95, P99)',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10], // segundos
  registers: [register],
});

/**
 * Counter: Total de requisições HTTP
 * Labels: method, route, status_code
 */
export const httpRequestsTotal = new promClient.Counter({
  name: 'conectcrm_http_requests_total',
  help: 'Total de requisições HTTP recebidas',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

/**
 * ═══════════════════════════════════════════════════════════════
 * 🧵 METRICAS DE FILAS (BULL)
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Counter: Total de jobs por fila e status
 * Labels: fila, status (enqueued, completed, failed)
 */
export const filaJobsTotal = new promClient.Counter({
  name: 'conectcrm_fila_jobs_total',
  help: 'Total de jobs processados por fila e status',
  labelNames: ['fila', 'status'],
  registers: [register],
});

/**
 * Histogram: Duracao de jobs por fila (segundos)
 * Labels: fila
 */
export const filaJobDuracaoHistogram = new promClient.Histogram({
  name: 'conectcrm_fila_job_duracao_segundos',
  help: 'Duracao de jobs por fila (segundos)',
  labelNames: ['fila'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

/**
 * Gauge: Jobs aguardando por fila
 * Labels: fila
 */
export const filaWaitingGauge = new promClient.Gauge({
  name: 'conectcrm_fila_jobs_waiting',
  help: 'Quantidade de jobs aguardando por fila',
  labelNames: ['fila'],
  registers: [register],
});

/**
 * Counter: Cache do Dashboard V2 (hit/miss/error)
 * Labels: empresaId, status
 */
export const dashboardV2CacheHitsTotal = new promClient.Counter({
  name: 'conectcrm_dashboard_v2_cache_total',
  help: 'Total de operacoes de cache do Dashboard V2 por status',
  labelNames: ['empresaId', 'status'],
  registers: [register],
});
/**
 * Counter: Total de ciclos do monitor automatico de alertas financeiros
 * Labels: status (success, partial, skipped_concurrent, fatal_error)
 */
export const financeiroAlertasMonitorCiclosTotal = new promClient.Counter({
  name: 'conectcrm_financeiro_alertas_monitor_ciclos_total',
  help: 'Total de ciclos do monitor automatico de alertas financeiros por status',
  labelNames: ['status'],
  registers: [register],
});

/**
 * Gauge: Timestamp do ultimo ciclo finalizado (epoch seconds)
 */
export const financeiroAlertasMonitorUltimoCicloTimestamp = new promClient.Gauge({
  name: 'conectcrm_financeiro_alertas_monitor_ultimo_ciclo_timestamp_seconds',
  help: 'Timestamp epoch do ultimo ciclo finalizado do monitor de alertas financeiros',
  registers: [register],
});

/**
 * Gauge: Duracao do ultimo ciclo finalizado (segundos)
 */
export const financeiroAlertasMonitorDuracaoUltimoCicloSegundos = new promClient.Gauge({
  name: 'conectcrm_financeiro_alertas_monitor_ultimo_ciclo_duracao_segundos',
  help: 'Duracao em segundos do ultimo ciclo finalizado do monitor de alertas financeiros',
  registers: [register],
});

/**
 * Gauge: Quantidade de empresas processadas no ultimo ciclo
 */
export const financeiroAlertasMonitorEmpresasProcessadasUltimoCiclo = new promClient.Gauge({
  name: 'conectcrm_financeiro_alertas_monitor_empresas_processadas_ultimo_ciclo',
  help: 'Quantidade de empresas processadas no ultimo ciclo do monitor de alertas financeiros',
  registers: [register],
});

/**
 * Gauge: Quantidade de empresas com falha no ultimo ciclo
 */
export const financeiroAlertasMonitorEmpresasFalhaUltimoCiclo = new promClient.Gauge({
  name: 'conectcrm_financeiro_alertas_monitor_empresas_falha_ultimo_ciclo',
  help: 'Quantidade de empresas com falha no ultimo ciclo do monitor de alertas financeiros',
  registers: [register],
});

/**
 * Gauge: Totais de alertas no ultimo ciclo
 * Labels: tipo (gerados, resolvidos, ativos)
 */
export const financeiroAlertasMonitorTotaisUltimoCiclo = new promClient.Gauge({
  name: 'conectcrm_financeiro_alertas_monitor_totais_ultimo_ciclo',
  help: 'Totais de alertas no ultimo ciclo do monitor de alertas financeiros',
  labelNames: ['tipo'],
  registers: [register],
});

/**
 * ═══════════════════════════════════════════════════════════════
 * 🛠️ HELPER FUNCTIONS
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Incrementa contador com tratamento de erro
 */
export function incrementCounter(
  counter: promClient.Counter<string>,
  labels: Record<string, string>,
): void {
  try {
    counter.inc(labels);
  } catch (error) {
    console.error('❌ Erro ao incrementar métrica:', error);
  }
}

/**
 * Registra valor em histogram com tratamento de erro
 */
export function observeHistogram(
  histogram: promClient.Histogram<string>,
  value: number,
  labels: Record<string, string>,
): void {
  try {
    histogram.observe(labels, value);
  } catch (error) {
    console.error('❌ Erro ao observar métrica:', error);
  }
}

/**
 * Define valor de gauge com tratamento de erro
 */
export function setGauge(
  gauge: promClient.Gauge<string>,
  value: number,
  labels: Record<string, string>,
): void {
  try {
    gauge.set(labels, value);
  } catch (error) {
    console.error('❌ Erro ao setar métrica:', error);
  }
}

/**
 * Timer helper para medir duração de operações
 */
export class MetricTimer {
  private startTime: number;
  private histogram: promClient.Histogram<string>;
  private labels: Record<string, string>;

  constructor(histogram: promClient.Histogram<string>, labels: Record<string, string>) {
    this.startTime = Date.now();
    this.histogram = histogram;
    this.labels = labels;
  }

  /**
   * Finaliza timer e registra duração no histogram
   */
  end(): void {
    const durationSeconds = (Date.now() - this.startTime) / 1000;
    observeHistogram(this.histogram, durationSeconds, this.labels);
  }
}

/**
 * Inicializa métricas (executar no bootstrap)
 */
export function initializeMetrics(): void {
  console.log('✅ Prometheus metrics initialized');
  console.log(`📊 Metrics configured: counters, histograms, gauges`);
}

