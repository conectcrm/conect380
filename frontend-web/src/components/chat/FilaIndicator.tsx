/**
 * INDICADOR DE FILA - CONECT CRM
 * Badge compacto mostrando fila atual do ticket
 * Com tooltip expandido para detalhes completos
 */

import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Clock, CheckCircle, AlertCircle, X, BarChart3 } from 'lucide-react';
import { useFilaStore } from '../../stores/filaStore';
import { Fila, EstrategiaDistribuicao } from '../../services/filaService';
import { useAuth } from '../../hooks/useAuth';

interface FilaIndicatorProps {
  filaId: string;
  showTooltip?: boolean;
  onRemove?: () => void;
  variant?: 'compact' | 'full';
}

export const FilaIndicator: React.FC<FilaIndicatorProps> = ({
  filaId,
  showTooltip = true,
  onRemove,
  variant = 'compact',
}) => {
  const { user } = useAuth();
  const empresaId = user?.empresa?.id || '';

  const { filas, metricas, buscarFila, obterMetricas } = useFilaStore();

  const [fila, setFila] = useState<Fila | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carregar fila ao montar
  useEffect(() => {
    if (filaId && empresaId) {
      carregarFila();
    }
  }, [filaId, empresaId]);

  // Auto-carregar métricas se tooltip estiver aberto
  useEffect(() => {
    if (showDetails && fila && empresaId) {
      obterMetricas(fila.id, empresaId);
    }
  }, [showDetails, fila]);

  const carregarFila = async () => {
    try {
      setLoading(true);

      // Tentar pegar do cache primeiro
      const filaCache = filas.find((f) => f.id === filaId);
      if (filaCache) {
        setFila(filaCache);
        setLoading(false);
        return;
      }

      // Buscar do backend se não estiver em cache
      await buscarFila(filaId, empresaId);

      // Atualizar do cache após fetch (zustand já atualizou o store)
      const filaAtualizada = filas.find((f) => f.id === filaId);
      if (filaAtualizada) {
        setFila(filaAtualizada);
      }
    } catch (err) {
      console.error('Erro ao carregar fila:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Traduzir estratégia
  const traduzirEstrategia = (estrategia: EstrategiaDistribuicao): string => {
    switch (estrategia) {
      case EstrategiaDistribuicao.ROUND_ROBIN:
        return 'Round Robin';
      case EstrategiaDistribuicao.MENOR_CARGA:
        return 'Menor Carga';
      case EstrategiaDistribuicao.PRIORIDADE:
        return 'Por Prioridade';
      default:
        return estrategia;
    }
  };

  // Helper: Cor por estratégia
  const corPorEstrategia = (estrategia: EstrategiaDistribuicao) => {
    switch (estrategia) {
      case EstrategiaDistribuicao.ROUND_ROBIN:
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          border: 'border-blue-200',
        };
      case EstrategiaDistribuicao.MENOR_CARGA:
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          border: 'border-green-200',
        };
      case EstrategiaDistribuicao.PRIORIDADE:
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-700',
          border: 'border-purple-200',
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          border: 'border-gray-200',
        };
    }
  };

  if (loading) {
    return (
      <div className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-400 text-xs">
        <Users className="h-3 w-3 mr-1 animate-pulse" />
        Carregando...
      </div>
    );
  }

  if (!fila) {
    return (
      <div className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 text-red-700 text-xs">
        <AlertCircle className="h-3 w-3 mr-1" />
        Fila não encontrada
      </div>
    );
  }

  const cores = corPorEstrategia(fila.estrategiaDistribuicao);
  const metricasFila = metricas[fila.id];

  // Variant Compact (badge simples)
  if (variant === 'compact') {
    return (
      <div className="relative inline-block">
        {/* Badge Principal */}
        <div
          className={`inline-flex items-center px-2.5 py-1 rounded-md border ${cores.bg} ${cores.text} ${cores.border} text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity`}
          onClick={() => showTooltip && setShowDetails(!showDetails)}
          title={showTooltip ? 'Clique para ver detalhes' : undefined}
        >
          <Users className="h-3 w-3 mr-1.5" />
          {fila.nome}
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="ml-2 hover:bg-white/50 rounded p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Tooltip Expandido */}
        {showTooltip && showDetails && (
          <>
            {/* Overlay para fechar */}
            <div className="fixed inset-0 z-40" onClick={() => setShowDetails(false)} />

            {/* Tooltip Card */}
            <div className="absolute left-0 top-full mt-2 z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b">
                <h3 className="font-bold text-[#002333] text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#159A9C]" />
                  {fila.nome}
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Descrição */}
              {fila.descricao && <p className="text-xs text-gray-600 mb-3">{fila.descricao}</p>}

              {/* Informações da Fila */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Estratégia</p>
                  <p className="text-xs font-medium text-gray-900">
                    {traduzirEstrategia(fila.estrategiaDistribuicao)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Capacidade</p>
                  <p className="text-xs font-medium text-gray-900">
                    {fila.capacidadeMaxima} tickets/atendente
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Atendentes</p>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-gray-600" />
                    <span className="text-xs font-medium text-gray-900">
                      {fila.atendentes?.length || 0}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Distribuição</p>
                  <p className="text-xs font-medium text-gray-900">
                    {fila.distribuicaoAutomatica ? 'Automática ⚡' : 'Manual'}
                  </p>
                </div>
              </div>

              {/* Métricas */}
              {metricasFila ? (
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="h-4 w-4 text-[#159A9C]" />
                    <p className="text-xs font-semibold text-gray-700">Métricas em Tempo Real</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <Clock className="h-4 w-4 text-yellow-600 mx-auto mb-1" />
                      <p className="text-xs text-yellow-600 font-bold">
                        {metricasFila.ticketsAguardando}
                      </p>
                      <p className="text-xs text-yellow-600/70">Aguardando</p>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <Users className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                      <p className="text-xs text-blue-600 font-bold">
                        {metricasFila.ticketsEmAtendimento}
                      </p>
                      <p className="text-xs text-blue-600/70">Atendimento</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <CheckCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
                      <p className="text-xs text-green-600 font-bold">
                        {metricasFila.ticketsFinalizados}
                      </p>
                      <p className="text-xs text-green-600/70">Finalizados</p>
                    </div>
                  </div>

                  {/* Taxa de Resolução */}
                  <div className="mt-3 p-2 bg-[#159A9C]/5 rounded text-center">
                    <p className="text-xs text-gray-600 mb-1">Taxa de Resolução</p>
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="h-4 w-4 text-[#159A9C]" />
                      <span className="text-lg font-bold text-[#159A9C]">
                        {metricasFila.taxaResolucao?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t text-center">
                  <p className="text-xs text-gray-500">
                    Clique em "Métricas" na gestão de filas para visualizar
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Variant Full (card completo)
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border ${cores.bg} ${cores.border}`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-white/50 ${cores.text}`}>
          <Users className="h-5 w-5" />
        </div>
        <div>
          <p className={`text-sm font-bold ${cores.text}`}>{fila.nome}</p>
          <p className="text-xs text-gray-600">
            {traduzirEstrategia(fila.estrategiaDistribuicao)} • {fila.atendentes?.length || 0}{' '}
            atendentes
          </p>
        </div>
      </div>

      {metricasFila && (
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">Aguardando</p>
            <p className={`text-lg font-bold ${cores.text}`}>{metricasFila.ticketsAguardando}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Em Atendimento</p>
            <p className={`text-lg font-bold ${cores.text}`}>{metricasFila.ticketsEmAtendimento}</p>
          </div>
        </div>
      )}

      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-4 p-2 hover:bg-white/50 rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
