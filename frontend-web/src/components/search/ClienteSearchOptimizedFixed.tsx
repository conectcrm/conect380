import React, { useState, useMemo, useEffect } from 'react';
import { Search, User, X, Plus, RefreshCw, Building, Check } from 'lucide-react';
import { useDebounced } from '../../hooks/useDebounced';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  observacoes: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  tipoPessoa: 'fisica' | 'juridica';
}

interface ClienteSearchOptimizedProps {
  clientes: Cliente[];
  selectedCliente: Cliente | null;
  onClienteSelect: (cliente: Cliente | null) => void;
  onNewCliente?: () => void;
  onReloadClientes?: () => void;
  isLoading?: boolean;
  className?: string;
}

const ClienteSearchOptimized: React.FC<ClienteSearchOptimizedProps> = ({
  clientes,
  selectedCliente,
  onClienteSelect,
  onNewCliente,
  onReloadClientes,
  isLoading = false,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Usar nosso hook de debounce personalizado
  const debouncedSearchTerm = useDebounced(searchTerm, 300);

  // Filtros e busca otimizada (removido filtro de tipo)
  const clientesFiltrados = useMemo(() => {
    let filtered = clientes;

    // Busca por múltiplos campos usando o valor debounced
    if (debouncedSearchTerm.trim()) {
      const term = debouncedSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (cliente) =>
          cliente.nome.toLowerCase().includes(term) ||
          cliente.documento.replace(/\D/g, '').includes(term.replace(/\D/g, '')) ||
          cliente.email.toLowerCase().includes(term) ||
          cliente.telefone.replace(/\D/g, '').includes(term.replace(/\D/g, '')) ||
          (cliente.cidade && cliente.cidade.toLowerCase().includes(term)),
      );
    }

    return filtered.slice(0, 50); // Limitar resultados para performance
  }, [clientes, debouncedSearchTerm]);

  // Mostrar clientes mesmo sem busca (para melhor UX)
  const clientesParaExibir = useMemo(() => {
    if (searchTerm.trim()) {
      return clientesFiltrados;
    }
    // Se não há busca, mostrar os primeiros 20 clientes
    return clientes.slice(0, 20);
  }, [clientes, clientesFiltrados, searchTerm]);

  const handleClienteSelect = (cliente: Cliente) => {
    onClienteSelect(cliente);
    setIsOpen(false);
    setSearchTerm('');
  };

  const clearSelection = () => {
    onClienteSelect(null as any);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Campo de Busca Principal */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Buscar cliente por nome, documento, email ou telefone..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Cliente Selecionado - Preview Compacto */}
        {selectedCliente && !isOpen && (
          <div className="mt-2 p-3 bg-teal-50 border border-teal-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedCliente.tipoPessoa === 'juridica' ? (
                  <Building className="w-5 h-5 text-teal-600" />
                ) : (
                  <User className="w-5 h-5 text-teal-600" />
                )}
                <div>
                  <p className="font-medium text-gray-900 text-sm">{selectedCliente.nome}</p>
                  <p className="text-xs text-gray-500">
                    {selectedCliente.documento} •{' '}
                    {selectedCliente.tipoPessoa === 'juridica' ? 'PJ' : 'PF'}
                  </p>
                </div>
              </div>
              <button onClick={clearSelection} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Informações de Resultados */}
        <div className="flex items-center justify-between mt-2">
          {(searchTerm.trim() || clientesFiltrados.length > 0) && (
            <div className="text-xs text-gray-500">
              {clientesFiltrados.length} clientes encontrados
            </div>
          )}
          {!searchTerm.trim() && clientes.length > 0 && (
            <div className="text-xs text-gray-500">{clientes.length} clientes</div>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center justify-end mt-3">
          <div className="flex items-center space-x-2">
            {onReloadClientes && (
              <button
                onClick={onReloadClientes}
                className="flex items-center px-3 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Atualizar
              </button>
            )}
            {onNewCliente && (
              <button
                onClick={onNewCliente}
                className="flex items-center px-3 py-1 text-xs text-teal-600 hover:text-teal-800 transition-colors"
              >
                <Plus className="w-3 h-3 mr-1" />
                Novo Cliente
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown Content */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Carregando clientes...</p>
              </div>
            ) : clientesParaExibir.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {clientesParaExibir.map((cliente) => (
                  <div
                    key={cliente.id}
                    onClick={() => handleClienteSelect(cliente)}
                    className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                      selectedCliente?.id === cliente.id ? 'bg-teal-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {cliente.tipoPessoa === 'juridica' ? (
                          <Building className="w-4 h-4 text-gray-400" />
                        ) : (
                          <User className="w-4 h-4 text-gray-400" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {cliente.nome}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{cliente.documento}</span>
                            <span>•</span>
                            <span>{cliente.tipoPessoa === 'juridica' ? 'PJ' : 'PF'}</span>
                            {cliente.cidade && (
                              <>
                                <span>•</span>
                                <span>{cliente.cidade}</span>
                              </>
                            )}
                          </div>
                          {cliente.email && (
                            <p className="text-xs text-gray-400 truncate">{cliente.email}</p>
                          )}
                        </div>
                      </div>
                      {selectedCliente?.id === cliente.id && (
                        <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-2">
                  {searchTerm.trim() ? 'Nenhum cliente encontrado' : 'Nenhum cliente disponível'}
                </p>
                {searchTerm.trim() && (
                  <p className="text-xs text-gray-400 mb-3">
                    Tente pesquisar por nome, documento, e-mail ou telefone
                  </p>
                )}
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                    }}
                    className="text-sm text-teal-600 hover:text-teal-800"
                  >
                    Limpar busca
                  </button>
                  {onNewCliente && (
                    <>
                      <span className="text-gray-300">•</span>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          onNewCliente();
                        }}
                        className="text-sm text-teal-600 hover:text-teal-800"
                      >
                        Cadastrar cliente
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ClienteSearchOptimized;
