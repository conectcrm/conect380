import React, { useState, useEffect } from 'react';
import { propostasService } from '../services/propostasService';
import { shellFieldTokens, shellTokens } from '../../../components/layout-v2';
import {
  Filter,
  X,
  Calendar,
  DollarSign,
  Users,
  BarChart3,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';

interface FiltrosAvancadosProps {
  onFiltersChange: (filtros: {
    status?: string;
    vendedor?: string;
    dataInicio?: string;
    dataFim?: string;
    valorMin?: number;
    valorMax?: number;
    categoria?: string;
    probabilidadeMin?: number;
  }) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const FiltrosAvancados: React.FC<FiltrosAvancadosProps> = ({
  onFiltersChange,
  isOpen,
  onToggle,
}) => {
  const [filtros, setFiltros] = useState({
    status: '',
    vendedor: '',
    dataInicio: '',
    dataFim: '',
    valorMin: '',
    valorMax: '',
    categoria: '',
    probabilidadeMin: '',
  });

  const [vendedores, setVendedores] = useState<Array<{ id: string; nome: string }>>([]);
  const [isLoadingVendedores, setIsLoadingVendedores] = useState(false);

  // Carregar vendedores disponíveis
  useEffect(() => {
    const carregarVendedores = async () => {
      try {
        setIsLoadingVendedores(true);
        const vendedoresData = await propostasService.obterVendedores();
        setVendedores(vendedoresData.map((v) => ({ id: v.id, nome: v.nome })));
      } catch (error) {
        console.error('Erro ao carregar vendedores:', error);
      } finally {
        setIsLoadingVendedores(false);
      }
    };

    if (isOpen) {
      carregarVendedores();
    }
  }, [isOpen]);

  const handleFilterChange = (key: string, value: string) => {
    const novosFiltros = { ...filtros, [key]: value };
    setFiltros(novosFiltros);

    // Converter e aplicar filtros
    const filtrosConvertidos = {
      status: novosFiltros.status || undefined,
      vendedor: novosFiltros.vendedor || undefined,
      dataInicio: novosFiltros.dataInicio || undefined,
      dataFim: novosFiltros.dataFim || undefined,
      valorMin: novosFiltros.valorMin ? parseFloat(novosFiltros.valorMin) : undefined,
      valorMax: novosFiltros.valorMax ? parseFloat(novosFiltros.valorMax) : undefined,
      categoria: novosFiltros.categoria || undefined,
      probabilidadeMin: novosFiltros.probabilidadeMin
        ? parseFloat(novosFiltros.probabilidadeMin)
        : undefined,
    };

    onFiltersChange(filtrosConvertidos);
  };

  const limparFiltros = () => {
    const filtrosLimpos = {
      status: '',
      vendedor: '',
      dataInicio: '',
      dataFim: '',
      valorMin: '',
      valorMax: '',
      categoria: '',
      probabilidadeMin: '',
    };
    setFiltros(filtrosLimpos);
    onFiltersChange({});
  };

  const aplicarFiltroRapido = (tipo: string) => {
    const hoje = new Date();
    let dataInicio = '';
    let dataFim = '';

    switch (tipo) {
      case 'hoje':
        dataInicio = dataFim = hoje.toISOString().split('T')[0];
        break;
      case 'semana':
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        dataInicio = inicioSemana.toISOString().split('T')[0];
        dataFim = hoje.toISOString().split('T')[0];
        break;
      case 'mes':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
        dataFim = hoje.toISOString().split('T')[0];
        break;
      case 'trimestre':
        const mesAtual = hoje.getMonth();
        const inicioTrimestre = Math.floor(mesAtual / 3) * 3;
        dataInicio = new Date(hoje.getFullYear(), inicioTrimestre, 1).toISOString().split('T')[0];
        dataFim = hoje.toISOString().split('T')[0];
        break;
    }

    handleFilterChange('dataInicio', dataInicio);
    handleFilterChange('dataFim', dataFim);
  };

  const contarFiltrosAtivos = () => {
    return Object.values(filtros).filter((value) => value !== '').length;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={`${shellTokens.card} space-y-6 p-4 sm:p-5`}>
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-[#159A9C]" />
          <h3 className="text-lg font-medium text-[#19384C]">Filtros Avançados</h3>
          {contarFiltrosAtivos() > 0 && (
            <span className="rounded-full bg-[#159A9C]/10 px-2 py-1 text-xs font-semibold text-[#0F7B7D]">
              {contarFiltrosAtivos()} filtro(s) ativo(s)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={limparFiltros}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB]"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB]"
          >
            <ChevronUp className="h-4 w-4" />
            Recolher
          </button>
        </div>
      </div>

      {/* Filtros rápidos por período */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[#244455]">
          <Calendar className="mr-1 inline h-4 w-4" />
          Períodos Rápidos
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'hoje', label: 'Hoje' },
            { key: 'semana', label: 'Esta Semana' },
            { key: 'mes', label: 'Este Mês' },
            { key: 'trimestre', label: 'Este Trimestre' },
          ].map((periodo) => (
            <button
              key={periodo.key}
              type="button"
              onClick={() => aplicarFiltroRapido(periodo.key)}
              className="inline-flex h-9 items-center rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB]"
            >
              {periodo.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Status */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[#244455]">Status</label>
          <select
            value={filtros.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className={shellFieldTokens.base}
          >
            <option value="">Todos os Status</option>
            <option value="rascunho">Rascunho</option>
            <option value="enviada">Enviada</option>
            <option value="visualizada">Visualizada</option>
            <option value="negociacao">Em Negociação</option>
            <option value="aprovada">Aprovada</option>
            <option value="contrato_gerado">Aguardando Assinatura do Contrato</option>
            <option value="contrato_assinado">Contrato Assinado</option>
            <option value="dispensa_contrato_solicitada">Dispensa de Contrato Solicitada</option>
            <option value="dispensa_contrato_aprovada">Dispensa de Contrato Aprovada</option>
            <option value="faturamento_liberado">Faturamento Liberado</option>
            <option value="fatura_criada">Fatura Criada</option>
            <option value="aguardando_pagamento">Aguardando Pagamento</option>
            <option value="pago">Pago</option>
            <option value="rejeitada">Rejeitada</option>
            <option value="expirada">Expirada</option>
          </select>
        </div>

        {/* Vendedor */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[#244455]">
            <Users className="mr-1 inline h-4 w-4" />
            Vendedor
          </label>
          <select
            value={filtros.vendedor}
            onChange={(e) => handleFilterChange('vendedor', e.target.value)}
            disabled={isLoadingVendedores}
            className={`${shellFieldTokens.base} disabled:bg-[#EEF4F6]`}
          >
            <option value="">Todos os Vendedores</option>
            {vendedores.map((vendedor) => (
              <option key={vendedor.id} value={vendedor.id}>
                {vendedor.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Categoria */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[#244455]">Categoria</label>
          <select
            value={filtros.categoria}
            onChange={(e) => handleFilterChange('categoria', e.target.value)}
            className={shellFieldTokens.base}
          >
            <option value="">Todas as Categorias</option>
            <option value="software">Software</option>
            <option value="consultoria">Consultoria</option>
            <option value="treinamento">Treinamento</option>
            <option value="design">Design</option>
            <option value="ecommerce">E-commerce</option>
            <option value="proposta">Proposta Geral</option>
          </select>
        </div>

        {/* Data Início */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[#244455]">Data Início</label>
          <input
            type="date"
            value={filtros.dataInicio}
            onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
            className={shellFieldTokens.base}
          />
        </div>

        {/* Data Fim */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[#244455]">Data Fim</label>
          <input
            type="date"
            value={filtros.dataFim}
            onChange={(e) => handleFilterChange('dataFim', e.target.value)}
            className={shellFieldTokens.base}
          />
        </div>

        {/* Valor Mínimo */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[#244455]">
            <DollarSign className="mr-1 inline h-4 w-4" />
            Valor Mínimo
          </label>
          <input
            type="number"
            value={filtros.valorMin}
            onChange={(e) => handleFilterChange('valorMin', e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
            className={shellFieldTokens.base}
          />
        </div>

        {/* Valor Máximo */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[#244455]">
            <DollarSign className="mr-1 inline h-4 w-4" />
            Valor Máximo
          </label>
          <input
            type="number"
            value={filtros.valorMax}
            onChange={(e) => handleFilterChange('valorMax', e.target.value)}
            placeholder="Sem limite"
            min="0"
            step="0.01"
            className={shellFieldTokens.base}
          />
        </div>

        {/* Probabilidade Mínima */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[#244455]">
            <BarChart3 className="mr-1 inline h-4 w-4" />
            Probabilidade Mín. (%)
          </label>
          <input
            type="number"
            value={filtros.probabilidadeMin}
            onChange={(e) => handleFilterChange('probabilidadeMin', e.target.value)}
            placeholder="0"
            min="0"
            max="100"
            className={shellFieldTokens.base}
          />
        </div>
      </div>

      {/* Resumo dos filtros ativos */}
      {contarFiltrosAtivos() > 0 && (
        <div className="border-t border-[#E4EDF0] pt-4">
          <p className="mb-2 text-sm text-[#607B89]">Filtros ativos:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(filtros).map(([key, value]) => {
              if (!value) return null;

              let label = '';
              switch (key) {
                case 'status':
                  label = `Status: ${value}`;
                  break;
                case 'vendedor':
                  const vendedor = vendedores.find((v) => v.id === value);
                  label = `Vendedor: ${vendedor?.nome || value}`;
                  break;
                case 'dataInicio':
                  label = `De: ${new Date(value).toLocaleDateString('pt-BR')}`;
                  break;
                case 'dataFim':
                  label = `Até: ${new Date(value).toLocaleDateString('pt-BR')}`;
                  break;
                case 'valorMin':
                  label = `Valor mín: R$ ${parseFloat(value).toLocaleString('pt-BR')}`;
                  break;
                case 'valorMax':
                  label = `Valor máx: R$ ${parseFloat(value).toLocaleString('pt-BR')}`;
                  break;
                case 'categoria':
                  label = `Categoria: ${value}`;
                  break;
                case 'probabilidadeMin':
                  label = `Prob. mín: ${value}%`;
                  break;
              }

              return (
                <span
                  key={key}
                  className="inline-flex items-center rounded-full bg-[#159A9C]/10 px-2 py-1 text-xs font-medium text-[#0F7B7D]"
                >
                  {label}
                  <button
                    type="button"
                    onClick={() => handleFilterChange(key, '')}
                    className="ml-1 text-[#0F7B7D] transition hover:text-[#0A5F61]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FiltrosAvancados;
