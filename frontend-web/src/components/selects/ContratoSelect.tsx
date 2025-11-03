import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Plus } from 'lucide-react';
import SearchSelect from '../common/SearchSelect';
import { contratoService, Contrato as ContratoService } from '../../services/contratoService';

interface Contrato {
  id: string;
  numero: string;
  cliente?: {
    id?: string;
    nome: string;
    email: string;
  };
  valor?: number;
  status?: string;
  dataEmissao?: Date;
  dataVencimento?: Date;
  descricao?: string;
}

interface ContratoSelectProps {
  value: Contrato | null;
  onChange: (contrato: Contrato | null) => void;
  clienteId?: string; // Filtrar contratos por cliente
  onCreateNew?: () => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function ContratoSelect({
  value,
  onChange,
  clienteId,
  onCreateNew,
  required = false,
  disabled = false,
  className = ""
}: ContratoSelectProps) {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Carregar contratos iniciais
  useEffect(() => {
    carregarContratos();
  }, [clienteId]);

  const carregarContratos = useCallback(async (busca?: string) => {
    try {
      setLoading(true);
      const response = await contratoService.listarContratos();

      // Filtrar por cliente se especificado
      let contratosFormatados = response.map((contrato: ContratoService): Contrato => ({
        id: String(contrato.id),
        numero: contrato.numero,
        cliente: contrato.cliente
          ? {
            ...contrato.cliente,
            id: contrato.cliente.id ? String(contrato.cliente.id) : contrato.cliente.id,
          }
          : undefined,
        valor: contrato.valor,
        status: contrato.status,
        dataEmissao: contrato.dataEmissao,
        dataVencimento: contrato.dataVencimento,
        descricao: contrato.descricao
      }));

      // Filtrar por busca
      if (busca?.trim()) {
        const query = busca.toLowerCase();
        contratosFormatados = contratosFormatados.filter(contrato =>
          contrato.numero.toLowerCase().includes(query) ||
          contrato.cliente?.nome.toLowerCase().includes(query) ||
          contrato.descricao?.toLowerCase().includes(query)
        );
      }

      // Filtrar por cliente se especificado
      if (clienteId) {
        contratosFormatados = contratosFormatados.filter(contrato =>
          contrato.cliente?.id ? String(contrato.cliente.id) === clienteId : false
        );
      }

      setContratos(contratosFormatados);
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
      setContratos([]);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  // Buscar contratos com debounce
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    carregarContratos(query);
  }, [carregarContratos]);

  // Converter contratos para opções do SearchSelect
  const options = contratos.map(contrato => {
    const status = contrato.status || 'Desconhecido';
    const valor = contrato.valor ? `R$ ${contrato.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
    const cliente = contrato.cliente?.nome || 'Cliente não identificado';

    return {
      id: contrato.id,
      label: `#${contrato.numero}`,
      subtitle: `${cliente}${valor ? ` • ${valor}` : ''}`,
      extra: `Status: ${status}${contrato.descricao ? ` • ${contrato.descricao.slice(0, 50)}${contrato.descricao.length > 50 ? '...' : ''}` : ''}`
    };
  });

  // Encontrar o valor atual nas opções
  const selectedOption = value ? options.find(opt => opt.id === value.id) || null : null;

  const handleChange = (option: any) => {
    if (option) {
      const contrato = contratos.find(c => c.id === option.id);
      onChange(contrato || null);
    } else {
      onChange(null);
    }
  };

  const formatarData = (data: Date | undefined) => {
    if (!data) return null;
    try {
      const dataObj = typeof data === 'string' ? new Date(data) : data;
      return dataObj.toLocaleDateString('pt-BR');
    } catch {
      return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'assinado':
        return 'bg-green-100 text-green-800';
      case 'aguardando_assinatura':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      case 'expirado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
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
            label="Contrato (opcional)"
            placeholder={clienteId ? "Busque contratos deste cliente..." : "Busque por número ou cliente..."}
            required={required}
            disabled={disabled}
            loading={loading}
            icon="file"
            emptyMessage={
              clienteId
                ? "Nenhum contrato encontrado para este cliente"
                : searchQuery
                  ? "Nenhum contrato encontrado"
                  : "Digite para buscar contratos"
            }
          />
        </div>

        {onCreateNew && (
          <button
            type="button"
            onClick={onCreateNew}
            className="px-3 py-2 border border-gray-300 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-1 transition-colors"
            title="Criar novo contrato"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo</span>
          </button>
        )}
      </div>

      {/* Informações do contrato selecionado */}
      {value && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-green-900">Contrato #{value.numero}</div>
              <div className="text-sm text-green-700 space-y-1">
                {value.cliente && (
                  <div>👤 {value.cliente.nome}</div>
                )}
                {value.valor && (
                  <div>💰 R$ {value.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                )}
                {value.status && (
                  <div className="flex items-center gap-2">
                    <span>Status:</span>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(value.status)}`}>
                      {value.status}
                    </span>
                  </div>
                )}
                <div className="text-xs text-green-600 flex gap-4">
                  {formatarData(value.dataEmissao) && (
                    <span>📅 Emissão: {formatarData(value.dataEmissao)}</span>
                  )}
                  {formatarData(value.dataVencimento) && (
                    <span>⏰ Vencimento: {formatarData(value.dataVencimento)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aviso quando cliente está selecionado */}
      {clienteId && contratos.length === 0 && !loading && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-700">
            ℹ️ Nenhum contrato encontrado para este cliente. O campo contrato é opcional.
          </div>
        </div>
      )}
    </div>
  );
}
