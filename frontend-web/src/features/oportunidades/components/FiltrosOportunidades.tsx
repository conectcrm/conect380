import React, { useState, useEffect } from 'react';
import { 
  FiltrosOportunidade, 
  EstagioOportunidade, 
  PrioridadeOportunidade, 
  OrigemOportunidade 
} from '../../../types/oportunidades/index';
import { oportunidadesService } from '../../../services/oportunidadesService';
import {
  X,
  Calendar,
  DollarSign,
  User,
  Tag,
  Filter,
  RotateCcw,
  Search
} from 'lucide-react';

interface FiltrosOportunidadesProps {
  filtros: Partial<FiltrosOportunidade>;
  aplicarFiltros: (filtros: Partial<FiltrosOportunidade>) => void;
  limparFiltros: () => void;
  onClose: () => void;
}

export const FiltrosOportunidades: React.FC<FiltrosOportunidadesProps> = ({
  filtros,
  aplicarFiltros,
  limparFiltros,
  onClose
}) => {
  const [filtrosLocais, setFiltrosLocais] = useState<Partial<FiltrosOportunidade>>(filtros);
  const [responsaveis, setResponsaveis] = useState<Array<{ id: string; nome: string; email: string }>>([]);
  const [tagsDisponiveis, setTagsDisponiveis] = useState<string[]>([]);
  const [carregandoDados, setCarregandoDados] = useState(true);

  useEffect(() => {
    carregarDadosFiltros();
  }, []);

  const carregarDadosFiltros = async () => {
    try {
      setCarregandoDados(true);
      const [responsaveisData, tagsData] = await Promise.all([
        oportunidadesService.obterResponsaveis(),
        oportunidadesService.obterSugestoesTags()
      ]);
      
      setResponsaveis(responsaveisData);
      setTagsDisponiveis(tagsData);
    } catch (error) {
      console.error('Erro ao carregar dados dos filtros:', error);
    } finally {
      setCarregandoDados(false);
    }
  };

  const handleFiltroChange = (campo: keyof FiltrosOportunidade, valor: any) => {
    setFiltrosLocais(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleAplicarFiltros = () => {
    aplicarFiltros(filtrosLocais);
  };

  const handleLimparFiltros = () => {
    setFiltrosLocais({});
    limparFiltros();
  };

  const countFiltrosAtivos = () => {
    return Object.keys(filtrosLocais).filter(key => {
      const valor = filtrosLocais[key as keyof typeof filtrosLocais];
      return valor !== undefined && valor !== '' && valor !== null && 
             (Array.isArray(valor) ? valor.length > 0 : true);
    }).length;
  };

  const estagiosOptions = [
    { value: EstagioOportunidade.LEADS, label: 'Leads' },
    { value: EstagioOportunidade.QUALIFICACAO, label: 'Qualificação' },
    { value: EstagioOportunidade.PROPOSTA, label: 'Proposta' },
    { value: EstagioOportunidade.NEGOCIACAO, label: 'Negociação' },
    { value: EstagioOportunidade.FECHAMENTO, label: 'Fechamento' },
    { value: EstagioOportunidade.GANHO, label: 'Ganho' },
    { value: EstagioOportunidade.PERDIDO, label: 'Perdido' }
  ];

  const prioridadeOptions = [
    { value: PrioridadeOportunidade.ALTA, label: 'Alta' },
    { value: PrioridadeOportunidade.MEDIA, label: 'Média' },
    { value: PrioridadeOportunidade.BAIXA, label: 'Baixa' }
  ];

  const origemOptions = [
    { value: OrigemOportunidade.WEBSITE, label: 'Website' },
    { value: OrigemOportunidade.INDICACAO, label: 'Indicação' },
    { value: OrigemOportunidade.TELEFONE, label: 'Telefone' },
    { value: OrigemOportunidade.EMAIL, label: 'E-mail' },
    { value: OrigemOportunidade.REDES_SOCIAIS, label: 'Redes Sociais' },
    { value: OrigemOportunidade.EVENTO, label: 'Evento' },
    { value: OrigemOportunidade.PARCEIRO, label: 'Parceiro' },
    { value: OrigemOportunidade.CAMPANHA, label: 'Campanha' }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-[#159A9C]" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros Avançados</h3>
          {countFiltrosAtivos() > 0 && (
            <span className="bg-[#159A9C] text-white text-xs px-2 py-1 rounded-full">
              {countFiltrosAtivos()}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleLimparFiltros}
            className="text-gray-600 hover:text-gray-800 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-1"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Limpar</span>
          </button>
          
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Estágio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estágio
          </label>
          <select
            value={filtrosLocais.estagio || ''}
            onChange={(e) => handleFiltroChange('estagio', e.target.value as EstagioOportunidade || '')}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] bg-white"
          >
            <option value="">Todos os estágios</option>
            {estagiosOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Prioridade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prioridade
          </label>
          <select
            value={filtrosLocais.prioridade || ''}
            onChange={(e) => handleFiltroChange('prioridade', e.target.value as PrioridadeOportunidade || '')}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] bg-white"
          >
            <option value="">Todas as prioridades</option>
            {prioridadeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Origem */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Origem
          </label>
          <select
            value={filtrosLocais.origem || ''}
            onChange={(e) => handleFiltroChange('origem', e.target.value as OrigemOportunidade || '')}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] bg-white"
          >
            <option value="">Todas as origens</option>
            {origemOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Responsável */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            Responsável
          </label>
          <select
            value={filtrosLocais.responsavel || ''}
            onChange={(e) => handleFiltroChange('responsavel', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] bg-white"
            disabled={carregandoDados}
          >
            <option value="">Todos os responsáveis</option>
            {responsaveis.map(responsavel => (
              <option key={responsavel.id} value={responsavel.id}>
                {responsavel.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Valor Mínimo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Valor Mínimo
          </label>
          <input
            type="number"
            placeholder="0,00"
            value={filtrosLocais.valorMin || ''}
            onChange={(e) => handleFiltroChange('valorMin', parseFloat(e.target.value) || 0)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
          />
        </div>

        {/* Valor Máximo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Valor Máximo
          </label>
          <input
            type="number"
            placeholder="999.999,99"
            value={filtrosLocais.valorMax || ''}
            onChange={(e) => handleFiltroChange('valorMax', parseFloat(e.target.value) || 0)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
          />
        </div>

        {/* Data Início */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Data Início
          </label>
          <input
            type="date"
            value={filtrosLocais.dataInicio ? filtrosLocais.dataInicio.toISOString().split('T')[0] : ''}
            onChange={(e) => handleFiltroChange('dataInicio', e.target.value ? new Date(e.target.value) : undefined)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
          />
        </div>

        {/* Data Final */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Data Final
          </label>
          <input
            type="date"
            value={filtrosLocais.dataFim ? filtrosLocais.dataFim.toISOString().split('T')[0] : ''}
            onChange={(e) => handleFiltroChange('dataFim', e.target.value ? new Date(e.target.value) : undefined)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
          />
        </div>
      </div>

      {/* Tags */}
      {tagsDisponiveis.length > 0 && (
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Tag className="w-4 h-4 inline mr-1" />
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {tagsDisponiveis.map(tag => (
              <button
                key={tag}
                onClick={() => {
                  const tagsAtuais = filtrosLocais.tags || [];
                  const novasTags = tagsAtuais.includes(tag)
                    ? tagsAtuais.filter(t => t !== tag)
                    : [...tagsAtuais, tag];
                  handleFiltroChange('tags', novasTags);
                }}
                className={`
                  px-3 py-1 rounded-full text-sm transition-colors
                  ${(filtrosLocais.tags || []).includes(tag)
                    ? 'bg-[#159A9C] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {countFiltrosAtivos() > 0 && (
            <span>{countFiltrosAtivos()} filtro{countFiltrosAtivos() > 1 ? 's' : ''} ativo{countFiltrosAtivos() > 1 ? 's' : ''}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleLimparFiltros}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Limpar Filtros
          </button>
          
          <button
            onClick={handleAplicarFiltros}
            className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#138A8C] transition-colors"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  );
};
