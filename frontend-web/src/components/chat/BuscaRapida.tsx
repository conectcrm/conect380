import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE_URL } from '../../services/api';

const API_URL = API_BASE_URL;

// ============================
// INTERFACES TYPESCRIPT
// ============================

export enum TipoRecursoBusca {
  PROPOSTA = 'PROPOSTA',
  FATURA = 'FATURA',
  CLIENTE = 'CLIENTE',
  PEDIDO = 'PEDIDO',
  TICKET = 'TICKET',
}

interface ResultadoBusca {
  tipo: TipoRecursoBusca;
  id: string;
  titulo: string;
  subtitulo?: string;
  status?: string;
  valor?: number;
  data?: string;
  relevancia: number;
  dados: any;
}

interface RespostaBuscaGlobal {
  resultados: ResultadoBusca[];
  totalResultados: number;
  tempoMs: number;
  contadores: {
    propostas: number;
    faturas: number;
    clientes: number;
    pedidos: number;
    tickets: number;
  };
}

const API_URL = API_BASE_URL;
interface BuscaRapidaProps {
  isOpen: boolean;
  onClose: () => void;
  onSelecionarResultado?: (resultado: ResultadoBusca) => void;
  onEnviarNoChat?: (resultado: ResultadoBusca) => void;
}

// ============================
// COMPONENTE PRINCIPAL
// ============================

export function BuscaRapida({
  isOpen,
  onClose,
  onSelecionarResultado,
  onEnviarNoChat,
}: BuscaRapidaProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [tempoMs, setTempoMs] = useState<number | null>(null);
  const [totalResultados, setTotalResultados] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultadosRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus no input quando abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset ao fechar
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResultados([]);
      setSelectedIndex(0);
      setErro(null);
      setTempoMs(null);
    }
  }, [isOpen]);

  // Debounce na busca (300ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        realizarBusca(query.trim());
      }, 300);
    } else {
      setResultados([]);
      setTotalResultados(0);
      setTempoMs(null);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // Função de busca
  const realizarBusca = async (searchQuery: string) => {
    setLoading(true);
    setErro(null);

    try {
      const token = localStorage.getItem('authToken');
      const empresaId = user?.empresa?.id;

      if (!empresaId) {
        throw new Error('Usuário não possui empresa associada');
      }

      const response = await axios.post<RespostaBuscaGlobal>(
        `${API_URL}/api/atendimento/busca-global`,
        {
          query: searchQuery,
          empresaId,
          limite: 20,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setResultados(response.data.resultados);
      setTotalResultados(response.data.totalResultados);
      setTempoMs(response.data.tempoMs);
      setSelectedIndex(0);
    } catch (error: any) {
      console.error('[BuscaRapida] Erro ao buscar:', error);
      setErro(error.response?.data?.message || 'Erro ao realizar busca');
      setResultados([]);
    } finally {
      setLoading(false);
    }
  };

  // Navegação por teclado
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, resultados.length - 1));
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;

        case 'Enter':
          e.preventDefault();
          if (resultados[selectedIndex]) {
            handleSelecionarResultado(resultados[selectedIndex]);
          }
          break;

        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [isOpen, resultados, selectedIndex, onClose],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Scroll automático para item selecionado
  useEffect(() => {
    if (resultadosRef.current) {
      const selectedElement = resultadosRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Handlers
  const handleSelecionarResultado = (resultado: ResultadoBusca) => {
    if (onSelecionarResultado) {
      onSelecionarResultado(resultado);
    }
    onClose();
  };

  const handleEnviarNoChat = (resultado: ResultadoBusca, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEnviarNoChat) {
      onEnviarNoChat(resultado);
    }
    onClose();
  };

  // Agrupar resultados por tipo
  const resultadosAgrupados = resultados.reduce(
    (acc, resultado) => {
      if (!acc[resultado.tipo]) {
        acc[resultado.tipo] = [];
      }
      acc[resultado.tipo].push(resultado);
      return acc;
    },
    {} as Record<TipoRecursoBusca, ResultadoBusca[]>,
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 top-20 mx-auto max-w-2xl z-50 px-4">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header com Input */}
          <div className="p-4 border-b">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🔍</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar propostas, faturas, clientes, tickets..."
                className="w-full pl-11 pr-4 py-3 text-base border-0 focus:outline-none focus:ring-0"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                </div>
              )}
            </div>
          </div>

          {/* Resultados */}
          <div className="max-h-96 overflow-y-auto" ref={resultadosRef}>
            {erro ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">⚠️</div>
                <p className="text-red-600 font-medium mb-2">Erro ao buscar</p>
                <p className="text-sm text-gray-500">{erro}</p>
                <button
                  onClick={() => query && realizarBusca(query)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Tentar novamente
                </button>
              </div>
            ) : query.trim().length < 2 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-600 font-medium">Busca Rápida</p>
                <p className="text-sm text-gray-500 mt-2">
                  Digite pelo menos 2 caracteres para buscar
                </p>
              </div>
            ) : resultados.length === 0 && !loading ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">🤷</div>
                <p className="text-gray-600 font-medium">Nenhum resultado encontrado</p>
                <p className="text-sm text-gray-500 mt-2">
                  Tente buscar por nome, número ou descrição
                </p>
              </div>
            ) : (
              <>
                {/* Resultados agrupados por tipo */}
                {Object.entries(resultadosAgrupados).map(([tipo, items]) => (
                  <div key={tipo} className="border-b last:border-b-0">
                    <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {getTipoIcon(tipo as TipoRecursoBusca)}{' '}
                      {getTipoLabel(tipo as TipoRecursoBusca)} ({items.length})
                    </div>
                    {items.map((resultado, index) => {
                      const globalIndex = resultados.indexOf(resultado);
                      const isSelected = globalIndex === selectedIndex;

                      return (
                        <div
                          key={resultado.id}
                          className={`px-4 py-3 cursor-pointer transition-colors ${isSelected
                              ? 'bg-blue-50 border-l-4 border-blue-600'
                              : 'hover:bg-gray-50 border-l-4 border-transparent'
                            }`}
                          onClick={() => handleSelecionarResultado(resultado)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {resultado.titulo}
                                </h4>
                                {resultado.status && <StatusBadge status={resultado.status} />}
                              </div>
                              {resultado.subtitulo && (
                                <p className="text-sm text-gray-600 truncate">
                                  {resultado.subtitulo}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                {resultado.valor && (
                                  <span>💰 {formatarValor(resultado.valor)}</span>
                                )}
                                {resultado.data && <span>📅 {formatarData(resultado.data)}</span>}
                                <span className="text-blue-600">
                                  ⚡ {Math.round(resultado.relevancia * 100)}% relevante
                                </span>
                              </div>
                            </div>

                            {/* Botão enviar no chat */}
                            {onEnviarNoChat && (
                              <button
                                onClick={(e) => handleEnviarNoChat(resultado, e)}
                                className="flex-shrink-0 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                title="Enviar no chat"
                              >
                                💬 Enviar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span>
                ⌨️ <kbd className="px-1.5 py-0.5 bg-white border rounded">↑↓</kbd> navegar
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-white border rounded">Enter</kbd> selecionar
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-white border rounded">Esc</kbd> fechar
              </span>
            </div>
            {tempoMs !== null && (
              <span className="text-gray-500">
                ⚡ {totalResultados} resultados em {tempoMs}ms
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ============================
// COMPONENTES AUXILIARES
// ============================

function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    ABERTO: 'bg-blue-100 text-blue-800',
    EM_ATENDIMENTO: 'bg-yellow-100 text-yellow-800',
    RESOLVIDO: 'bg-green-100 text-green-800',
    FECHADO: 'bg-gray-100 text-gray-800',
    PAGO: 'bg-green-100 text-green-800',
    PENDENTE: 'bg-yellow-100 text-yellow-800',
    VENCIDO: 'bg-red-100 text-red-800',
    APROVADO: 'bg-green-100 text-green-800',
    REJEITADO: 'bg-red-100 text-red-800',
  };

  const color = statusColors[status] || 'bg-gray-100 text-gray-800';

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ============================
// FUNÇÕES AUXILIARES
// ============================

function getTipoIcon(tipo: TipoRecursoBusca): string {
  const icons: Record<TipoRecursoBusca, string> = {
    [TipoRecursoBusca.PROPOSTA]: '📄',
    [TipoRecursoBusca.FATURA]: '💰',
    [TipoRecursoBusca.CLIENTE]: '👤',
    [TipoRecursoBusca.PEDIDO]: '📦',
    [TipoRecursoBusca.TICKET]: '🎫',
  };
  return icons[tipo] || '📋';
}

function getTipoLabel(tipo: TipoRecursoBusca): string {
  const labels: Record<TipoRecursoBusca, string> = {
    [TipoRecursoBusca.PROPOSTA]: 'Propostas',
    [TipoRecursoBusca.FATURA]: 'Faturas',
    [TipoRecursoBusca.CLIENTE]: 'Clientes',
    [TipoRecursoBusca.PEDIDO]: 'Pedidos',
    [TipoRecursoBusca.TICKET]: 'Tickets',
  };
  return labels[tipo] || tipo;
}

function formatarValor(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

function formatarData(data: string): string {
  const date = new Date(data);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
