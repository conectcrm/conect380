import api from './api';

// Base URL da API (ajustar conforme ambiente)

// Interface para métricas do dashboard
export interface DashboardMetrics {
  ticketsAbertos: number;
  ticketsResolvidos: number;
  ticketsPendentes: number;
  ticketsTotal: number;
  tempoMedioResposta: number; // minutos
  tempoMedioResolucao: number; // horas
  slaAtingido: number; // percentual
  satisfacaoCliente: number; // 1-5
  tendencia: {
    tickets: Array<{ data: string; valor: number }>;
  };
}

// Interface para desempenho de atendentes
export interface DesempenhoAtendente {
  atendenteId: string;
  nome: string;
  ticketsAtendidos: number;
  tempoMedioResposta: number; // minutos
  satisfacaoMedia: number; // 1-5
  slaAtingido: number; // percentual
}

// Interface para estatísticas de canais
export interface EstatisticasCanal {
  canalId: string;
  nome: string;
  tipo: string;
  ticketsTotal: number;
  ticketsAbertos: number;
  ticketsResolvidos: number;
  tempoMedioResposta: number; // minutos
}

// Interface para tendências
export interface PontoTendencia {
  data: string; // ISO date
  valor: number;
}

/**
 * Service para Analytics e Dashboard de Atendimento
 * Comunicação com backend para buscar métricas e estatísticas
 *
 * @author ConectCRM
 * @date 2025-11-18
 */
export const analyticsService = {
  /**
   * Busca métricas principais do dashboard
   * 🔐 SEGURANÇA: empresaId agora vem do JWT no backend
   */
  async getDashboardMetrics(params: {
    periodo?: '7d' | '30d' | '90d' | 'custom';
    dataInicio?: string;
    dataFim?: string;
  }): Promise<DashboardMetrics> {
    try {
      const queryParams = new URLSearchParams({
        periodo: params.periodo || '7d',
      });

      if (params.periodo === 'custom' && params.dataInicio && params.dataFim) {
        queryParams.append('dataInicio', params.dataInicio);
        queryParams.append('dataFim', params.dataFim);
      }

      const response = await api.get(`/api/atendimento/analytics/dashboard?${queryParams.toString()}`);

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar métricas do dashboard:', error);
      throw error;
    }
  },

  /**
   * Busca desempenho de atendentes
   * 🔐 SEGURANÇA: empresaId agora vem do JWT no backend
   */
  async getDesempenhoAtendentes(params: {
    periodo?: '7d' | '30d' | '90d';
    limite?: number;
  }): Promise<DesempenhoAtendente[]> {
    try {
      const queryParams = new URLSearchParams({
        periodo: params.periodo || '30d',
      });

      if (params.limite) {
        queryParams.append('limite', params.limite.toString());
      }

      const response = await api.get(
        `/api/atendimento/analytics/desempenho-atendentes?${queryParams.toString()}`,
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar desempenho de atendentes:', error);
      throw error;
    }
  },

  /**
   * Busca estatísticas por canal
   * 🔐 SEGURANÇA: empresaId agora vem do JWT no backend
   */
  async getEstatisticasCanais(params: {
    periodo?: '7d' | '30d' | '90d';
  }): Promise<EstatisticasCanal[]> {
    try {
      const queryParams = new URLSearchParams({
        periodo: params.periodo || '30d',
      });

      const response = await api.get(`/api/atendimento/analytics/canais?${queryParams.toString()}`);

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas de canais:', error);
      throw error;
    }
  },

  /**
   * Busca tendências ao longo do tempo
   * 🔐 SEGURANÇA: empresaId agora vem do JWT no backend
   */
  async getTendencias(params: {
    metrica: 'tickets' | 'tempo_resposta' | 'satisfacao' | 'sla';
    periodo?: '7d' | '30d' | '90d';
    granularidade?: 'hora' | 'dia' | 'semana';
  }): Promise<PontoTendencia[]> {
    try {
      const queryParams = new URLSearchParams({
        metrica: params.metrica,
        periodo: params.periodo || '30d',
        granularidade: params.granularidade || 'dia',
      });

      const response = await api.get(`/api/atendimento/analytics/tendencias?${queryParams.toString()}`);

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar tendências:', error);
      throw error;
    }
  },
};
