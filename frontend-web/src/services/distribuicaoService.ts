/**
 * Service de Auto-Distribuição de Filas
 *
 * Gerencia a distribuição automática de tickets para atendentes
 * baseada em diferentes estratégias (Round-Robin, Menor Carga, Prioridade)
 *
 * @author ConectCRM
 * @date 07/11/2025
 */

import api from './api';
import { getErrorMessage } from '../utils/errorHandling';

// ============================================================
// INTERFACES E TYPES
// ============================================================

/**
 * Estratégias de distribuição disponíveis
 */
export enum EstrategiaDistribuicao {
  ROUND_ROBIN = 'ROUND_ROBIN', // Revezamento circular
  MENOR_CARGA = 'MENOR_CARGA', // Atendente com menos tickets
  PRIORIDADE = 'PRIORIDADE', // Baseado em prioridade configurada
}

/**
 * Configuração de distribuição automática de uma fila
 */
export interface ConfiguracaoDistribuicao {
  filaId: string;
  distribuicaoAutomatica: boolean;
  estrategiaDistribuicao: EstrategiaDistribuicao;
  capacidadeMaxima?: number;
  atendentes?: AtendenteCapacidade[];
}

/**
 * Configuração de capacidade de um atendente
 */
export interface AtendenteCapacidade {
  atendenteId: string;
  atendenteNome: string;
  capacidade: number;
  prioridade: number;
  ativo: boolean;
  ticketsAtivos?: number;
}

/**
 * Resultado da distribuição de um ticket
 */
export interface ResultadoDistribuicao {
  ticketId: string;
  atendenteId: string | null;
  atendenteNome?: string;
  sucesso: boolean;
  mensagem: string;
  algoritmoUsado?: EstrategiaDistribuicao;
}

/**
 * Resultado da redistribuição de uma fila
 */
export interface ResultadoRedistribuicao {
  filaId: string;
  distribuidos: number;
  total: number;
  sucesso: boolean;
  mensagem: string;
}

/**
 * Estatísticas de distribuição
 */
export interface EstatisticasDistribuicao {
  totalDistribuidos: number;
  totalPendentes: number;
  taxaDistribuicao: number;
  atendenteComMaisTickets: {
    nome: string;
    quantidade: number;
  } | null;
  distribuicaoPorAtendente: Array<{
    atendenteId: string;
    atendenteNome: string;
    quantidade: number;
    percentual: number;
  }>;
}

// ============================================================
// SERVICE METHODS
// ============================================================

/**
 * Distribui um ticket específico para um atendente disponível
 *
 * @param ticketId - ID do ticket a ser distribuído
 * @returns Resultado da distribuição
 */
export const distribuirTicket = async (ticketId: string): Promise<ResultadoDistribuicao> => {
  try {
    const response = await api.post(`/atendimento/distribuicao/${ticketId}`);
    const payload = response.data?.data ?? response.data?.ticket ?? null;

    return {
      ticketId,
      atendenteId: payload?.atendenteId || null,
      atendenteNome: payload?.atendente?.nome,
      sucesso: response.data.success,
      mensagem: response.data.message,
    };
  } catch (error: unknown) {
    console.error('Erro ao distribuir ticket:', error);

    return {
      ticketId,
      atendenteId: null,
      sucesso: false,
      mensagem: getErrorMessage(error, 'Erro ao distribuir ticket'),
    };
  }
};

/**
 * Redistribui todos os tickets pendentes de uma fila
 *
 * @param filaId - ID da fila
 * @returns Resultado da redistribuição
 */
export const redistribuirFila = async (filaId: string): Promise<ResultadoRedistribuicao> => {
  try {
    const response = await api.post(`/atendimento/distribuicao/fila/${filaId}/redistribuir`);
    const payload = response.data?.data ?? response.data ?? {};

    return {
      filaId,
      distribuidos: payload.distribuidos || 0,
      total: payload.total || payload.distribuidos || 0,
      sucesso: response.data.success,
      mensagem: response.data.message,
    };
  } catch (error: unknown) {
    console.error('Erro ao redistribuir fila:', error);

    return {
      filaId,
      distribuidos: 0,
      total: 0,
      sucesso: false,
      mensagem: getErrorMessage(error, 'Erro ao redistribuir fila'),
    };
  }
};

/**
 * Busca a configuração de distribuição automática de uma fila
 *
 * @param filaId - ID da fila
 * @param empresaId - ID da empresa
 * @returns Configuração da distribuição
 */
export const buscarConfiguracao = async (
  filaId: string,
  empresaId?: string,
): Promise<ConfiguracaoDistribuicao | null> => {
  try {
    const response = await api.get(`/atendimento/distribuicao/configuracao/${filaId}`, {
      ...(empresaId ? { params: { empresaId } } : {}),
    });

    if (response.data && response.data.success) {
      const data = response.data.data;

      return {
        filaId: data.filaId,
        distribuicaoAutomatica: data.autoDistribuicao,
        estrategiaDistribuicao: data.algoritmo as EstrategiaDistribuicao,
        capacidadeMaxima: 10,
        atendentes: [],
      };
    }

    return null;
  } catch (error: unknown) {
    console.error('Erro ao buscar configuração:', error);
    return null;
  }
};

/**
 * Atualiza a configuração de distribuição automática de uma fila
 *
 * @param filaId - ID da fila
 * @param empresaId - ID da empresa
 * @param configuracao - Nova configuração
 * @returns Sucesso da operação
 */
export const atualizarConfiguracao = async (
  filaId: string,
  empresaId: string | undefined,
  configuracao: Partial<ConfiguracaoDistribuicao>,
): Promise<boolean> => {
  try {
    const response = await api.patch(`/atendimento/distribuicao/configuracao/${filaId}`, {
      ...(empresaId ? { empresaId } : {}),
      autoDistribuicao: configuracao.distribuicaoAutomatica,
      algoritmo: configuracao.estrategiaDistribuicao,
    });

    return response.data && response.data.success;
  } catch (error: unknown) {
    console.error('Erro ao atualizar configuração:', error);
    return false;
  }
};

/**
 * Busca estatísticas de distribuição
 *
 * @param empresaId - ID da empresa
 * @returns Estatísticas da distribuição
 */
export const buscarEstatisticas = async (
  empresaId?: string,
): Promise<EstatisticasDistribuicao | null> => {
  try {
    const response = await api.get(`/atendimento/distribuicao/estatisticas`, {
      ...(empresaId ? { params: { empresaId } } : {}),
    });

    if (response.data && response.data.success) {
      const data = response.data.data;
      const totalDistribuidos =
        Number(data.totalDistribuidos ?? data.totalEmAtendimento ?? 0) +
        Number(data.totalFinalizados ?? 0);
      const totalPendentes = Number(data.totalPendentes ?? data.totalAguardando ?? 0);
      const totalConsiderado = totalDistribuidos + totalPendentes;
      const taxaDistribuicao =
        data.taxaDistribuicao !== undefined
          ? Number(data.taxaDistribuicao)
          : totalConsiderado > 0
            ? Number(((totalDistribuidos / totalConsiderado) * 100).toFixed(1))
            : 0;

      const distribuicaoPorAtendente = Array.isArray(data.distribuicaoPorAtendente)
        ? data.distribuicaoPorAtendente.map((item: any) => ({
            atendenteId: String(item.atendenteId ?? ''),
            atendenteNome: String(item.atendenteNome ?? 'Atendente'),
            quantidade: Number(item.quantidade ?? 0),
            percentual: Number(item.percentual ?? 0),
          }))
        : [];

      const atendenteComMaisTickets =
        data.atendenteComMaisTickets &&
        typeof data.atendenteComMaisTickets === 'object' &&
        data.atendenteComMaisTickets.nome
          ? {
              nome: String(data.atendenteComMaisTickets.nome),
              quantidade: Number(data.atendenteComMaisTickets.quantidade ?? 0),
            }
          : distribuicaoPorAtendente.length > 0
            ? {
                nome: distribuicaoPorAtendente[0].atendenteNome,
                quantidade: distribuicaoPorAtendente[0].quantidade,
              }
            : null;

      return {
        totalDistribuidos,
        totalPendentes,
        taxaDistribuicao,
        atendenteComMaisTickets,
        distribuicaoPorAtendente,
      };
    }

    return null;
  } catch (error: unknown) {
    console.error('Erro ao buscar estatísticas:', error);
    return null;
  }
};

/**
 * Lista todas as filas disponíveis para configuração
 *
 * @param empresaId - ID da empresa
 * @returns Lista de filas ativas
 */
interface FilaDistribuicao {
  id: string;
  nome: string;
  autoDistribuicao: boolean;
  algoritmo: EstrategiaDistribuicao | string;
}

export const listarFilas = async (empresaId?: string): Promise<FilaDistribuicao[]> => {
  try {
    const response = await api.get<{ success: boolean; data: FilaDistribuicao[] }>(
      '/atendimento/distribuicao/filas',
      empresaId ? { params: { empresaId } } : undefined,
    );

    return response.data?.success ? response.data.data : [];
  } catch (error: unknown) {
    console.error('Erro ao listar filas:', error);
    return [];
  }
};

/**
 * Helper: Descrição amigável de cada estratégia
 */
export const descricaoEstrategia = (estrategia: EstrategiaDistribuicao): string => {
  switch (estrategia) {
    case EstrategiaDistribuicao.ROUND_ROBIN:
      return 'Revezamento circular entre atendentes';
    case EstrategiaDistribuicao.MENOR_CARGA:
      return 'Atribui para quem tem menos tickets ativos';
    case EstrategiaDistribuicao.PRIORIDADE:
      return 'Baseado na prioridade configurada (1 = maior prioridade)';
    default:
      return 'Estratégia não definida';
  }
};

/**
 * Helper: Ícone para cada estratégia
 */
export const iconeEstrategia = (estrategia: EstrategiaDistribuicao): string => {
  switch (estrategia) {
    case EstrategiaDistribuicao.ROUND_ROBIN:
      return '🔄';
    case EstrategiaDistribuicao.MENOR_CARGA:
      return '⚖️';
    case EstrategiaDistribuicao.PRIORIDADE:
      return '⭐';
    default:
      return '📊';
  }
};

export default {
  distribuirTicket,
  redistribuirFila,
  buscarConfiguracao,
  atualizarConfiguracao,
  buscarEstatisticas,
  listarFilas,
  descricaoEstrategia,
  iconeEstrategia,
  EstrategiaDistribuicao,
};
