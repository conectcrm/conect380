import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, User, CheckCircle, AlertCircle } from 'lucide-react';
import atendenteService, { Atendente, StatusAtendente } from '../../services/atendenteService';

// ========================================================================
// INTERFACES
// ========================================================================

interface AgentSelectorProps {
  /** IDs dos agentes já selecionados */
  selectedAgentIds?: string[];
  /** Callback quando seleção muda */
  onSelectionChange: (agentIds: string[]) => void;
  /** Permitir múltipla seleção */
  multiSelect?: boolean;
  /** Placeholder da busca */
  placeholder?: string;
  /** Mostrar apenas atendentes ativos */
  onlyActive?: boolean;
  /** Filtrar por status específico */
  statusFilter?: StatusAtendente[];
  /** Altura máxima da lista */
  maxHeight?: string;
  /** Modo compacto (sem descrições extras) */
  compact?: boolean;
}

// ========================================================================
// COMPONENTE PRINCIPAL
// ========================================================================

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  selectedAgentIds = [],
  onSelectionChange,
  multiSelect = true,
  placeholder = 'Buscar atendente por nome ou email...',
  onlyActive = true,
  statusFilter,
  maxHeight = '400px',
  compact = false,
}) => {
  // ========================================================================
  // STATES
  // ========================================================================

  const [atendentes, setAtendentes] = useState<Atendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    carregarAtendentes();
  }, []);

  // ========================================================================
  // FUNÇÕES
  // ========================================================================

  const carregarAtendentes = async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await atendenteService.listar();
      setAtendentes(dados || []);
    } catch (err: unknown) {
      console.error('Erro ao carregar atendentes:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar atendentes');
      setAtendentes([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleAgent = (agentId: string) => {
    if (multiSelect) {
      // Múltipla seleção
      if (selectedAgentIds.includes(agentId)) {
        onSelectionChange(selectedAgentIds.filter(id => id !== agentId));
      } else {
        onSelectionChange([...selectedAgentIds, agentId]);
      }
    } else {
      // Seleção única
      onSelectionChange(selectedAgentIds.includes(agentId) ? [] : [agentId]);
    }
  };

  const removeAgent = (agentId: string) => {
    onSelectionChange(selectedAgentIds.filter(id => id !== agentId));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  // ========================================================================
  // MEMOIZED VALUES
  // ========================================================================

  const atendentesFiltrados = useMemo(() => {
    let filtrados = [...atendentes];

    // Filtro: apenas ativos
    if (onlyActive) {
      filtrados = filtrados.filter(a => a.ativo);
    }

    // Filtro: por status
    if (statusFilter && statusFilter.length > 0) {
      filtrados = filtrados.filter(a => statusFilter.includes(a.status));
    }

    // Filtro: busca por nome/email
    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase();
      filtrados = filtrados.filter(
        a =>
          a.nome.toLowerCase().includes(termo) ||
          a.email.toLowerCase().includes(termo)
      );
    }

    return filtrados;
  }, [atendentes, onlyActive, statusFilter, searchTerm]);

  const atendentesSelecionados = useMemo(() => {
    return atendentes.filter(a => selectedAgentIds.includes(a.id));
  }, [atendentes, selectedAgentIds]);

  // ========================================================================
  // HELPERS
  // ========================================================================

  const getStatusBadge = (status: StatusAtendente) => {
    const badges = {
      [StatusAtendente.ONLINE]: 'bg-green-100 text-green-800 border-green-300',
      [StatusAtendente.OCUPADO]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      [StatusAtendente.AUSENTE]: 'bg-orange-100 text-orange-800 border-orange-300',
      [StatusAtendente.OFFLINE]: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return badges[status] || badges[StatusAtendente.OFFLINE];
  };

  const getStatusLabel = (status: StatusAtendente) => {
    const labels = {
      [StatusAtendente.ONLINE]: 'Online',
      [StatusAtendente.OCUPADO]: 'Ocupado',
      [StatusAtendente.AUSENTE]: 'Ausente',
      [StatusAtendente.OFFLINE]: 'Offline',
    };
    return labels[status] || 'Offline';
  };

  // ========================================================================
  // RENDER - LOADING
  // ========================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-gray-600">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-500 border-t-transparent"></div>
          <span>Carregando atendentes...</span>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER - ERRO
  // ========================================================================

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-medium">Erro ao carregar atendentes</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER - PRINCIPAL
  // ========================================================================

  return (
    <div className="space-y-4">
      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Chips de selecionados */}
      {selectedAgentIds.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 w-full justify-between mb-1">
            <span className="text-sm font-medium text-purple-900">
              Selecionados ({selectedAgentIds.length})
            </span>
            {multiSelect && (
              <button
                onClick={clearAll}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium"
              >
                Limpar todos
              </button>
            )}
          </div>
          {atendentesSelecionados.map(atendente => (
            <div
              key={atendente.id}
              className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-purple-300 rounded-full text-sm"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                {atendente.nome.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-900 font-medium">{atendente.nome}</span>
              <button
                onClick={() => removeAgent(atendente.id)}
                className="text-purple-600 hover:text-purple-800 ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lista de atendentes */}
      <div
        className="border border-gray-200 rounded-lg overflow-hidden"
        style={{ maxHeight, overflowY: 'auto' }}
      >
        {atendentesFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <User className="h-12 w-12 mb-2 text-gray-400" />
            <p className="font-medium">Nenhum atendente encontrado</p>
            {searchTerm && (
              <p className="text-sm">Tente ajustar sua busca</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {atendentesFiltrados.map(atendente => {
              const isSelected = selectedAgentIds.includes(atendente.id);
              return (
                <button
                  key={atendente.id}
                  onClick={() => toggleAgent(atendente.id)}
                  className={`w-full text-left p-4 transition-colors ${isSelected
                      ? 'bg-purple-50 hover:bg-purple-100'
                      : 'bg-white hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                        {atendente.nome.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 truncate">
                          {atendente.nome}
                        </p>
                        {isSelected && (
                          <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        )}
                      </div>

                      {!compact && (
                        <p className="text-sm text-gray-600 truncate mb-1">
                          {atendente.email}
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Badge de status */}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(
                            atendente.status
                          )}`}
                        >
                          {getStatusLabel(atendente.status)}
                        </span>

                        {/* Badge de ativo/inativo */}
                        {!atendente.ativo && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                            Inativo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer com contadores */}
      {!compact && (
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            Mostrando {atendentesFiltrados.length} de {atendentes.length} atendentes
          </span>
          {selectedAgentIds.length > 0 && (
            <span className="font-medium text-purple-600">
              {selectedAgentIds.length} selecionado{selectedAgentIds.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentSelector;
