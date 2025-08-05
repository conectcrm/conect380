import React, { useState, useMemo, useCallback } from 'react';
import { Search, User, X, Plus, RefreshCw, Check } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

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

export default function ClienteSearchOptimized({
  clientes,
  selectedCliente,
  onClienteSelect,
  onNewCliente,
  onReloadClientes,
  isLoading = false,
  className = ''
}: ClienteSearchOptimizedProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const clientesFiltrados = useMemo(() => {
    let filtered = clientes;

    // Filtro por busca
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(cliente =>
        cliente.nome.toLowerCase().includes(term) ||
        cliente.documento.toLowerCase().includes(term) ||
        (cliente.email && cliente.email.toLowerCase().includes(term)) ||
        (cliente.telefone && cliente.telefone.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [clientes, debouncedSearchTerm]);

  // Sempre mostra até 10 clientes por padrão
  const clientesParaExibir = useMemo(() => {
    return clientesFiltrados.slice(0, 10);
  }, [clientesFiltrados]);

  const handleClienteSelect = useCallback((cliente: Cliente) => {
    onClienteSelect(cliente);
  }, [onClienteSelect]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header com cliente selecionado */}
      {selectedCliente && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="font-medium text-teal-900 text-sm">{selectedCliente.nome}</p>
                <p className="text-xs text-teal-600">
                  {selectedCliente.documento}
                </p>
              </div>
            </div>
            <button
              onClick={() => onClienteSelect(null)}
              className="text-teal-400 hover:text-teal-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Campo de busca */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar Cliente
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o nome, documento, email ou telefone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Espaçamento onde estava o filtro */}
        <div className="mb-4"></div>

        {/* Ações */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {searchTerm && (
              <span className="text-sm text-gray-500">
                {clientesFiltrados.length} cliente(s) encontrado(s)
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {onReloadClientes && (
              <button
                onClick={onReloadClientes}
                className="inline-flex items-center px-3 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Atualizar
              </button>
            )}
            {onNewCliente && (
              <button
                onClick={onNewCliente}
                className="inline-flex items-center px-3 py-1 text-xs text-teal-600 hover:text-teal-800 transition-colors"
              >
                <Plus className="w-3 h-3 mr-1" />
                Novo Cliente
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de resultados */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Carregando clientes...</p>
          </div>
        ) : clientesParaExibir.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {clientesParaExibir.map((cliente) => (
              <div
                key={cliente.id}
                onClick={() => handleClienteSelect(cliente)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedCliente?.id === cliente.id ? 'bg-teal-50 border-l-4 border-teal-500' : ''
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {cliente.nome}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <span>{cliente.documento}</span>
                        {cliente.cidade && (
                          <>
                            <span>•</span>
                            <span>{cliente.cidade}</span>
                          </>
                        )}
                      </div>
                      {cliente.email && (
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {cliente.email}
                        </p>
                      )}
                    </div>
                  </div>
                  {selectedCliente?.id === cliente.id && (
                    <Check className="w-5 h-5 text-teal-600 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente disponível'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {searchTerm
                ? 'Tente ajustar sua pesquisa ou cadastre um novo cliente.'
                : 'Comece cadastrando seu primeiro cliente.'}
            </p>
            {onNewCliente && (
              <button
                onClick={onNewCliente}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Cliente
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
