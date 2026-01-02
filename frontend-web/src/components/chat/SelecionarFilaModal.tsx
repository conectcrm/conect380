/**
 * MODAL DE SELEÇÃO DE FILA - CONECT CRM
 * Componente para selecionar fila e distribuir ticket automaticamente
 * Integração com ChatOmnichannel.tsx
 */

import React, { useState, useEffect } from 'react';
import { X, Users, Clock, TrendingUp, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useFilaStore } from '../../stores/filaStore';
import { Fila, EstrategiaDistribuicao } from '../../services/filaService';
import { useAuth } from '../../hooks/useAuth';

interface SelecionarFilaModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  onFilaSelecionada?: (fila: Fila, atendenteId: string) => void;
}

export const SelecionarFilaModal: React.FC<SelecionarFilaModalProps> = ({
  isOpen,
  onClose,
  ticketId,
  onFilaSelecionada,
}) => {
  const { user } = useAuth();
  const empresaId = user?.empresa?.id || '';

  const {
    filas,
    loading,
    error,
    metricas,
    listarFilas,
    distribuirTicket,
    obterMetricas,
    resetError,
  } = useFilaStore();

  const [selectedFilaId, setSelectedFilaId] = useState<string>('');
  const [distribuindo, setDistribuindo] = useState(false);
  const [sucessoDistribuicao, setSucessoDistribuicao] = useState(false);
  const [atendenteAtribuido, setAtendenteAtribuido] = useState<string>('');

  // Carregar filas ao abrir modal
  useEffect(() => {
    if (isOpen && empresaId) {
      carregarFilas();
    }
  }, [isOpen, empresaId]);

  // Carregar métricas da fila selecionada
  useEffect(() => {
    if (selectedFilaId && empresaId) {
      obterMetricas(selectedFilaId, empresaId);
    }
  }, [selectedFilaId]);

  const carregarFilas = async () => {
    try {
      resetError();
      await listarFilas(empresaId);
    } catch (err) {
      console.error('Erro ao carregar filas:', err);
    }
  };

  const handleDistribuir = async () => {
    if (!selectedFilaId) return;

    try {
      setDistribuindo(true);
      resetError();
      setSucessoDistribuicao(false);

      const resultado = await distribuirTicket(empresaId, {
        ticketId,
        filaId: selectedFilaId,
        distribuicaoAutomatica: true,
      });

      // Sucesso!
      setSucessoDistribuicao(true);
      setAtendenteAtribuido(resultado.atendente?.nome || resultado.atendente?.id || 'Atendente');

      // Callback para componente pai
      if (onFilaSelecionada && resultado.atendente) {
        const filaEscolhida = filas.find((f) => f.id === selectedFilaId);
        if (filaEscolhida) {
          onFilaSelecionada(filaEscolhida, resultado.atendente.id);
        }
      }

      // Fechar após 2 segundos
      setTimeout(() => {
        onClose();
        // Reset states
        setTimeout(() => {
          setSucessoDistribuicao(false);
          setSelectedFilaId('');
          setAtendenteAtribuido('');
        }, 300);
      }, 2000);
    } catch (err) {
      console.error('Erro ao distribuir ticket:', err);
    } finally {
      setDistribuindo(false);
    }
  };

  // Filtrar apenas filas ativas
  const filasAtivas = filas.filter((f) => f.ativo);

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
  const corPorEstrategia = (estrategia: EstrategiaDistribuicao): string => {
    switch (estrategia) {
      case EstrategiaDistribuicao.ROUND_ROBIN:
        return 'text-blue-600 bg-blue-100';
      case EstrategiaDistribuicao.MENOR_CARGA:
        return 'text-green-600 bg-green-100';
      case EstrategiaDistribuicao.PRIORIDADE:
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-[#002333] flex items-center gap-2">
              <Users className="h-6 w-6 text-[#159A9C]" />
              Selecionar Fila de Atendimento
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Escolha a fila para distribuir este ticket automaticamente
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={distribuindo}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 text-[#159A9C] animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Carregando filas...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
              <button onClick={resetError} className="ml-auto text-red-600 hover:text-red-800">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && filasAtivas.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma fila ativa</h3>
              <p className="text-gray-500 mb-6">
                Crie pelo menos uma fila ativa para distribuir tickets
              </p>
            </div>
          )}

          {/* Sucesso na Distribuição */}
          {sucessoDistribuicao && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center mb-6">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-green-900 mb-2">
                Ticket Distribuído com Sucesso!
              </h3>
              <p className="text-green-800">
                Atribuído para: <span className="font-medium">{atendenteAtribuido}</span>
              </p>
              <p className="text-sm text-green-600 mt-2">Fechando automaticamente...</p>
            </div>
          )}

          {/* Lista de Filas */}
          {!loading && filasAtivas.length > 0 && !sucessoDistribuicao && (
            <div className="space-y-3">
              {filasAtivas.map((fila) => {
                const metricasFila = metricas[fila.id];
                const isSelected = selectedFilaId === fila.id;

                return (
                  <div
                    key={fila.id}
                    onClick={() => setSelectedFilaId(fila.id)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#159A9C] bg-[#159A9C]/5 ring-2 ring-[#159A9C]/20'
                        : 'border-gray-200 hover:border-[#159A9C] hover:bg-gray-50'
                    }`}
                  >
                    {/* Header do Card */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-[#002333] mb-1">{fila.nome}</h3>
                        {fila.descricao && (
                          <p className="text-sm text-gray-600">{fila.descricao}</p>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircle className="h-6 w-6 text-[#159A9C] flex-shrink-0 ml-2" />
                      )}
                    </div>

                    {/* Informações da Fila */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Estratégia</p>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${corPorEstrategia(
                            fila.estrategiaDistribuicao,
                          )}`}
                        >
                          {traduzirEstrategia(fila.estrategiaDistribuicao)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Atendentes</p>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">
                            {fila.atendentes?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Métricas (se disponível) */}
                    {metricasFila && (
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Aguardando</p>
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="h-3 w-3 text-yellow-600" />
                            <span className="text-sm font-bold text-yellow-600">
                              {metricasFila.ticketsAguardando}
                            </span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Em Atendimento</p>
                          <div className="flex items-center justify-center gap-1">
                            <Users className="h-3 w-3 text-blue-600" />
                            <span className="text-sm font-bold text-blue-600">
                              {metricasFila.ticketsEmAtendimento}
                            </span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Taxa Resolução</p>
                          <div className="flex items-center justify-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            <span className="text-sm font-bold text-green-600">
                              {metricasFila.taxaResolucao?.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Badge de Distribuição Automática */}
                    {fila.distribuicaoAutomatica && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[#159A9C]/10 text-[#159A9C]">
                          ⚡ Distribuição Automática Ativada
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && filasAtivas.length > 0 && !sucessoDistribuicao && (
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              disabled={distribuindo}
              className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleDistribuir}
              disabled={!selectedFilaId || distribuindo}
              className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              {distribuindo ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Distribuindo...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Distribuir Ticket
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
