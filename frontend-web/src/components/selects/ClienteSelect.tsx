import React, { useState, useEffect, useCallback } from 'react';
import { User, Plus } from 'lucide-react';
import SearchSelect from '../common/SearchSelect';
import { clientesService, Cliente as ClienteService } from '../../services/clientesService';

export interface ClienteSelectValue {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  documento?: string;
  tipo?: 'pessoa_fisica' | 'pessoa_juridica';
}

interface ClienteSelectProps {
  value: ClienteSelectValue | null;
  onChange: (cliente: ClienteSelectValue | null) => void;
  onCreateNew?: () => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string | null;
  error?: string;
}

export default function ClienteSelect({
  value,
  onChange,
  onCreateNew,
  required = false,
  disabled = false,
  className = '',
  label = 'Cliente',
  error,
}: ClienteSelectProps) {
  const [clientes, setClientes] = useState<ClienteSelectValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Carregar clientes iniciais
  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = useCallback(async (busca?: string) => {
    try {
      setLoading(true);
      const response = await clientesService.getClientes({
        limit: 50,
        search: busca?.trim() || undefined,
      });

      // Converter para o formato esperado
      const clientesFormatados = response.data.map(
        (cliente: ClienteService): ClienteSelectValue => ({
          id: cliente.id ? String(cliente.id) : '',
          nome: cliente.nome,
          email: cliente.email,
          telefone: cliente.telefone,
          documento: cliente.documento,
          tipo: cliente.tipo,
        }),
      );

      setClientes(clientesFormatados);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar clientes com debounce
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      carregarClientes(query);
    },
    [carregarClientes],
  );

  // Converter clientes para opções do SearchSelect
  const options = clientes.map((cliente) => ({
    id: cliente.id,
    label: cliente.nome,
    subtitle: cliente.documento
      ? `${cliente.documento}${cliente.email ? ` • ${cliente.email}` : ''}`
      : cliente.email,
    extra: cliente.telefone,
  }));

  // Encontrar o valor atual nas opções
  const selectedOption = value ? options.find((opt) => opt.id === value.id) || null : null;

  const handleChange = (option: any) => {
    if (option) {
      const cliente = clientes.find((c) => c.id === option.id);
      onChange(cliente || null);
    } else {
      onChange(null);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <SearchSelect
            options={options}
            value={selectedOption}
            onChange={handleChange}
            onSearch={handleSearch}
            label={label || undefined}
            placeholder="Busque por nome, documento ou email..."
            required={required}
            disabled={disabled}
            loading={loading}
            icon="user"
            emptyMessage={searchQuery ? 'Nenhum cliente encontrado' : 'Digite para buscar clientes'}
            error={error}
          />
        </div>

        {onCreateNew && (
          <button
            type="button"
            onClick={onCreateNew}
            className="px-3 py-2 border border-gray-300 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-1 transition-colors"
            title="Criar novo cliente"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo</span>
          </button>
        )}
      </div>

      {/* Informações do cliente selecionado */}
      {value && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-blue-900">{value.nome}</div>
              <div className="text-sm text-blue-700 space-y-1">
                {value.documento && <div>📄 {value.documento}</div>}
                {value.email && <div>📧 {value.email}</div>}
                {value.telefone && <div>📞 {value.telefone}</div>}
                {value.tipo && (
                  <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block">
                    {value.tipo === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
