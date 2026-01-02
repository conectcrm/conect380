/**
 * 📜 useHistoricoCliente - Hook para gerenciar histórico de atendimentos do cliente
 *
 * Funcionalidades:
 * - Carregar histórico completo
 * - Auto-refresh quando cliente muda
 * - Cache de dados
 */

import { useState, useEffect, useCallback } from 'react';
import { atendimentoService } from '../services/atendimentoService';
import { HistoricoAtendimento } from '../types';

interface UseHistoricoClienteOptions {
  clienteId: string | null;
  autoLoad?: boolean;
}

interface UseHistoricoClienteReturn {
  historico: HistoricoAtendimento[];
  loading: boolean;
  error: string | null;
  recarregar: () => Promise<void>;
}

export const useHistoricoCliente = (
  options: UseHistoricoClienteOptions,
): UseHistoricoClienteReturn => {
  const { clienteId, autoLoad = true } = options;

  const [historico, setHistorico] = useState<HistoricoAtendimento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar histórico
  const carregarHistorico = useCallback(async () => {
    if (!clienteId) {
      setHistorico([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dados = await atendimentoService.buscarHistoricoCliente(clienteId);
      setHistorico(dados);
    } catch (err) {
      console.error('❌ Erro ao carregar histórico:', err);
      setError('Erro ao carregar histórico');
      setHistorico([]); // Limpa em caso de erro
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  // Auto-load quando clienteId muda
  useEffect(() => {
    if (autoLoad && clienteId) {
      carregarHistorico();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, clienteId]); // ✅ Removido carregarHistorico para evitar loop

  return {
    historico,
    loading,
    error,
    recarregar: carregarHistorico,
  };
};
