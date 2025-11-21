/**
 * Script para inicializar métricas com valores de demonstração
 * Isso permite testar o dashboard Grafana antes de ter tráfego real
 */

import {
  mensagensEnviadasTotal,
  mensagensRecebidasTotal,
  mensagensErrosTotal,
  errosAplicacaoTotal,
  slaViolacoesTotal,
  ticketsAbertosGauge as ticketsAbertosAtual,
  ticketsCriadosTotal,
  ticketsEncerradosTotal,
  csatMediaGauge as csatMedia,
  fcrTaxaGauge as fcrTaxaPercentual,
  capacidadeDisponivelGauge as capacidadeDisponivelAtual,
  successRate30dGauge,
  erroTaxaGauge,
  httpRequestDurationHistogram,
  httpRequestsTotal,
} from '../config/metrics';

/**
 * Inicializa métricas com valores de demonstração
 */
export function initializeMetricsWithDemoData() {
  console.log('🔧 Inicializando métricas com dados de demonstração...');

  // Mensagens enviadas (simular 1000 mensagens em diferentes contextos)
  mensagensEnviadasTotal.inc({ empresaId: '1', canalId: 'whatsapp-1', remetente: 'ATENDENTE' }, 450);
  mensagensEnviadasTotal.inc({ empresaId: '1', canalId: 'whatsapp-1', remetente: 'BOT' }, 300);
  mensagensEnviadasTotal.inc({ empresaId: '1', canalId: 'whatsapp-1', remetente: 'SISTEMA' }, 250);

  // Mensagens recebidas (simular 800 mensagens recebidas)
  mensagensRecebidasTotal.inc({ empresaId: '1', canalId: 'whatsapp-1' }, 800);

  // Erros de mensagens (simular poucos erros - 2% taxa de erro)
  mensagensErrosTotal.inc({ empresaId: '1', canalId: 'whatsapp-1', erro: 'timeout' }, 10);
  mensagensErrosTotal.inc({ empresaId: '1', canalId: 'whatsapp-1', erro: 'api_error' }, 8);
  mensagensErrosTotal.inc({ empresaId: '1', canalId: 'whatsapp-1', erro: 'validation_error' }, 2);

  // Erros de aplicação (simular alguns erros de sistema)
  errosAplicacaoTotal.inc({ tipo: 'database', servico: 'atendimento' }, 5);
  errosAplicacaoTotal.inc({ tipo: 'api_external', servico: 'whatsapp' }, 10);
  errosAplicacaoTotal.inc({ tipo: 'validation', servico: 'cotacoes' }, 15);

  // SLA violations (simular poucas violações - sistema saudável)
  slaViolacoesTotal.inc({ empresaId: '1', departamentoId: '1', tipo_sla: 'primeira_resposta' }, 3);
  slaViolacoesTotal.inc({ empresaId: '1', departamentoId: '1', tipo_sla: 'tempo_resolucao' }, 2);

  // Tickets (simular atividade de atendimento)
  ticketsAbertosAtual.set({ empresaId: '1', status: 'ABERTO' }, 20);
  ticketsAbertosAtual.set({ empresaId: '1', status: 'EM_ATENDIMENTO' }, 15);
  ticketsAbertosAtual.set({ empresaId: '1', status: 'AGUARDANDO' }, 10);

  ticketsCriadosTotal.inc({ empresaId: '1', canalId: 'whatsapp-1', departamentoId: '1', origem: 'webhook' }, 60);
  ticketsCriadosTotal.inc({ empresaId: '1', canalId: 'whatsapp-1', departamentoId: '1', origem: 'manual' }, 20);

  ticketsEncerradosTotal.inc({ empresaId: '1', departamentoId: '1', motivo: 'resolvido' }, 55);
  ticketsEncerradosTotal.inc({ empresaId: '1', departamentoId: '1', motivo: 'cancelado' }, 5);

  // Métricas de qualidade
  csatMedia.set({ empresaId: '1', departamentoId: '1' }, 4.2); // CSAT de 4.2/5 (bom)
  fcrTaxaPercentual.set({ empresaId: '1', departamentoId: '1' }, 78.5); // FCR de 78.5% (razoável)
  capacidadeDisponivelAtual.set({ empresaId: '1', departamentoId: '1' }, 12); // 12 slots disponíveis

  // Novas métricas: Success Rate e HTTP Performance
  successRate30dGauge.set({ empresaId: '1' }, 97.2); // 97.2% de sucesso nos últimos 30 dias (excelente)
  erroTaxaGauge.set({ empresaId: '1' }, 2.8); // 2.8% de taxa de erro (complementar ao success rate)

  // Simular requisições HTTP com diferentes latências
  // P50: ~150ms, P95: ~1.8s, P99: ~4.5s (dentro do SLO de 2s para P95)
  for (let i = 0; i < 100; i++) {
    const route = ['/api/tickets', '/api/mensagens', '/api/atendentes', '/api/empresas'][Math.floor(Math.random() * 4)];
    const method = ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)];
    const statusCode = Math.random() < 0.97 ? 200 : (Math.random() < 0.5 ? 400 : 500); // 97% sucesso

    // Distribuição realista de latências:
    // 60% entre 50-200ms (rápido)
    // 30% entre 200-500ms (normal)
    // 8% entre 500-1500ms (lento)
    // 2% entre 1500-5000ms (muito lento - próximo ao limite)
    let latency;
    const rand = Math.random();
    if (rand < 0.6) {
      latency = 0.05 + Math.random() * 0.15; // 50-200ms
    } else if (rand < 0.9) {
      latency = 0.2 + Math.random() * 0.3; // 200-500ms
    } else if (rand < 0.98) {
      latency = 0.5 + Math.random() * 1.0; // 500-1500ms
    } else {
      latency = 1.5 + Math.random() * 3.5; // 1500-5000ms
    }

    httpRequestDurationHistogram.observe({ method, route, status_code: statusCode.toString() }, latency);
    httpRequestsTotal.inc({ method, route, status_code: statusCode.toString() });
  }

  console.log('✅ Métricas inicializadas com sucesso!');
  console.log('📊 Dados de demonstração:');
  console.log('   - Mensagens enviadas: 1000 (450 atendente, 300 bot, 250 sistema)');
  console.log('   - Mensagens recebidas: 800');
  console.log('   - Taxa de erro: 2% (20 erros / 1000 mensagens)');
  console.log('   - Tickets abertos: 45');
  console.log('   - Tickets criados: 80 | encerrados: 60');
  console.log('   - CSAT: 4.2/5 | FCR: 78.5%');
  console.log('   - Capacidade disponível: 12 atendentes');
  console.log('   - Success Rate (30d): 97.2% | Erro: 2.8%');
  console.log('   - HTTP Requests: 100 simuladas | Latency P95: ~1.8s (dentro do SLO de 2s)');
  console.log('');
  console.log('🎯 Agora você pode acessar o Grafana e ver dados no dashboard!');
}

/**
 * Incrementa métricas periodicamente para simular tráfego contínuo
 */
export function startMetricsSimulation(intervalMs: number = 5000) {
  console.log(`🔄 Iniciando simulação de tráfego (a cada ${intervalMs}ms)...`);

  setInterval(() => {
    // Simular 5-15 mensagens a cada intervalo
    const mensagensCount = Math.floor(Math.random() * 10) + 5;
    mensagensEnviadasTotal.inc({ empresaId: '1', canalId: 'whatsapp-1', remetente: 'ATENDENTE' }, mensagensCount);

    // Simular 3-10 mensagens recebidas
    const recebidasCount = Math.floor(Math.random() * 7) + 3;
    mensagensRecebidasTotal.inc({ empresaId: '1', canalId: 'whatsapp-1' }, recebidasCount);

    // Simular erro ocasional (10% de chance)
    if (Math.random() < 0.1) {
      mensagensErrosTotal.inc({ empresaId: '1', canalId: 'whatsapp-1', erro: 'timeout' }, 1);
    }

    // Variar tickets abertos (±1-3)
    const ticketsVariation = Math.floor(Math.random() * 6) - 3;
    const currentTickets = Math.max(30, Math.min(60, 45 + ticketsVariation));
    ticketsAbertosAtual.set({ empresaId: '1', status: 'ABERTO' }, Math.floor(currentTickets * 0.4));
    ticketsAbertosAtual.set({ empresaId: '1', status: 'EM_ATENDIMENTO' }, Math.floor(currentTickets * 0.4));
    ticketsAbertosAtual.set({ empresaId: '1', status: 'AGUARDANDO' }, Math.floor(currentTickets * 0.2));

    // Variar capacidade (±1-2 atendentes)
    const capacidadeVariation = Math.floor(Math.random() * 4) - 2;
    const currentCapacidade = Math.max(5, Math.min(20, 12 + capacidadeVariation));
    capacidadeDisponivelAtual.set({ empresaId: '1', departamentoId: '1' }, currentCapacidade);

    // Simular requisições HTTP contínuas (2-5 por intervalo)
    const requestsCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < requestsCount; i++) {
      const route = ['/api/tickets', '/api/mensagens', '/api/atendentes', '/api/empresas'][Math.floor(Math.random() * 4)];
      const method = ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)];
      const isSuccess = Math.random() < 0.97; // 97% sucesso
      const statusCode = isSuccess ? 200 : (Math.random() < 0.5 ? 400 : 500);

      // Latência realista (maioria rápida, algumas lentas)
      let latency;
      const rand = Math.random();
      if (rand < 0.7) {
        latency = 0.05 + Math.random() * 0.15; // 70% rápido (50-200ms)
      } else if (rand < 0.95) {
        latency = 0.2 + Math.random() * 0.5; // 25% normal (200-700ms)
      } else {
        latency = 0.7 + Math.random() * 2.3; // 5% lento (700-3000ms)
      }

      httpRequestDurationHistogram.observe({ method, route, status_code: statusCode.toString() }, latency);
      httpRequestsTotal.inc({ method, route, status_code: statusCode.toString() });
    }

    // Variar Success Rate (manter próximo a 97%, ±0.5%)
    const successVariation = (Math.random() - 0.5) * 1.0; // -0.5 a +0.5%
    const currentSuccessRate = Math.max(95, Math.min(99, 97.2 + successVariation));
    successRate30dGauge.set({ empresaId: '1' }, currentSuccessRate);
    erroTaxaGauge.set({ empresaId: '1' }, 100 - currentSuccessRate);
  }, intervalMs);
}
