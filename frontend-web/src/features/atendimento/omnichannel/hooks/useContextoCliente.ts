/**
 * 📊 useContextoCliente - Hook para gerenciar contexto completo do cliente
 *
 * Funcionalidades:
 * - Carregar dados do cliente
 * - Estatísticas de atendimento
 * - Faturas pendentes
 * - Contratos ativos
 * - Auto-refresh quando cliente muda
 */

import { useState, useEffect, useCallback } from 'react';
import { atendimentoService } from '../services/atendimentoService';

interface ContextoCliente {
  cliente: {
    id: string;
    nome: string;
    telefone: string;
    email?: string;
    documento?: string;
  };
  estatisticas: {
    totalAtendimentos: number;
    atendimentosResolvidos: number;
    atendimentosAbertos: number;
    tempoMedioResposta: number;
    ultimaInteracao?: Date;
  };
  faturas?: Array<{
    id: string;
    numero: string;
    valor: number;
    vencimento: Date;
    status: string;
  }>;
  contratos?: Array<{
    id: string;
    plano: string;
    status: string;
    dataInicio: Date;
  }>;
}

interface UseContextoClienteOptions {
  clienteId?: string | null;
  telefone?: string | null;
  autoLoad?: boolean;
}

interface UseContextoClienteReturn {
  contexto: ContextoCliente | null;
  loading: boolean;
  error: string | null;
  recarregar: () => Promise<void>;
}

export const useContextoCliente = (
  options: UseContextoClienteOptions,
): UseContextoClienteReturn => {
  const { clienteId, telefone, autoLoad = true } = options;

  const [contexto, setContexto] = useState<ContextoCliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar contexto
  const carregarContexto = useCallback(async () => {
    // Precisa de pelo menos clienteId ou telefone
    if (!clienteId && !telefone) {
      setContexto(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let dados: ContextoCliente;

      if (clienteId) {
        dados = await atendimentoService.buscarContextoCliente(clienteId);
      } else if (telefone) {
        dados = await atendimentoService.buscarContextoPorTelefone(telefone);
      } else {
        throw new Error('clienteId ou telefone necessário');
      }

      setContexto(dados);
    } catch (err) {
      console.error('❌ Erro ao carregar contexto:', err);
      setError('Erro ao carregar dados do cliente');
      setContexto(null);
    } finally {
      setLoading(false);
    }
  }, [clienteId, telefone]);

  // Auto-load quando clienteId ou telefone muda
  useEffect(() => {
    if (autoLoad && (clienteId || telefone)) {
      carregarContexto();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, clienteId, telefone]); // ✅ Removido carregarContexto para evitar loop

  return {
    contexto,
    loading,
    error,
    recarregar: carregarContexto,
  };
};
