import React from 'react';
import { Oportunidade, PrioridadeOportunidade } from '../../../types/oportunidades/index';
import {
  User,
  Calendar,
  DollarSign,
  Clock,
  Building,
  Phone,
  Mail,
  AlertTriangle,
  TrendingUp,
  Eye,
  Star
} from 'lucide-react';

interface KanbanCardProps {
  oportunidade: Oportunidade;
  onClick: () => void;
  isDragging?: boolean;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  oportunidade,
  onClick,
  isDragging = false
}) => {
  const getPrioridadeConfig = (prioridade: PrioridadeOportunidade) => {
    switch (prioridade) {
      case PrioridadeOportunidade.ALTA:
        return {
          cor: 'text-red-600 bg-red-50 border-red-200',
          icone: AlertTriangle,
          label: 'Alta'
        };
      case PrioridadeOportunidade.MEDIA:
        return {
          cor: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          icone: Clock,
          label: 'Média'
        };
      case PrioridadeOportunidade.BAIXA:
        return {
          cor: 'text-green-600 bg-green-50 border-green-200',
          icone: TrendingUp,
          label: 'Baixa'
        };
      default:
        return {
          cor: 'text-gray-600 bg-gray-50 border-gray-200',
          icone: Clock,
          label: 'Média'
        };
    }
  };

  const getProbabilidadeColor = (probabilidade: number) => {
    if (probabilidade >= 80) return 'text-green-600';
    if (probabilidade >= 60) return 'text-yellow-600';
    if (probabilidade >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatarTempo = (date: Date) => {
    const agora = new Date();
    const diff = agora.getTime() - date.getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (dias === 0) return 'Hoje';
    if (dias === 1) return '1 dia atrás';
    if (dias < 7) return `${dias} dias atrás`;
    if (dias < 30) return `${Math.floor(dias / 7)} sem atrás`;
    if (dias < 365) return `${Math.floor(dias / 30)} mês atrás`;
    return `${Math.floor(dias / 365)} ano atrás`;
  };

  const prioridadeConfig = getPrioridadeConfig(oportunidade.prioridade);
  const IconePrioridade = prioridadeConfig.icone;

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer
        ${isDragging ? 'shadow-2xl ring-2 ring-[#159A9C] ring-opacity-50' : 'hover:ring-1 hover:ring-gray-200'}
        group relative overflow-hidden
      `}
    >
      {/* Header do Card */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 flex-1">
            {oportunidade.titulo}
          </h3>
          
          {/* Indicador de Prioridade */}
          <div className={`ml-2 p-1 rounded-full border ${prioridadeConfig.cor}`}>
            <IconePrioridade className="w-3 h-3" />
          </div>
        </div>

        {/* Valor */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="font-bold text-green-600">
              {oportunidade.valorFormatado}
            </span>
          </div>
          
          {/* Probabilidade */}
          <div className={`text-xs font-medium ${getProbabilidadeColor(oportunidade.probabilidade)}`}>
            {oportunidade.probabilidade}%
          </div>
        </div>

        {/* Cliente/Contato */}
        <div className="mb-3">
          {oportunidade.cliente ? (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Building className="w-3 h-3" />
              <span className="truncate">{oportunidade.cliente.nome}</span>
            </div>
          ) : oportunidade.nomeContato && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-3 h-3" />
              <span className="truncate">{oportunidade.nomeContato}</span>
            </div>
          )}
          
          {oportunidade.empresaContato && !oportunidade.cliente && (
            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
              <Building className="w-3 h-3" />
              <span className="truncate">{oportunidade.empresaContato}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {oportunidade.tags && oportunidade.tags.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {oportunidade.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {oportunidade.tags.length > 2 && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  +{oportunidade.tags.length - 2}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer do Card */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          {/* Responsável */}
          <div className="flex items-center space-x-1">
            <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
              {oportunidade.responsavel.avatar ? (
                <img
                  src={oportunidade.responsavel.avatar}
                  alt={oportunidade.responsavel.nome}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <User className="w-3 h-3 text-gray-500" />
              )}
            </div>
            <span className="truncate max-w-[80px]">
              {oportunidade.responsavel.nome.split(' ')[0]}
            </span>
          </div>

          {/* Data de Fechamento Esperado ou Tempo no Estágio */}
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>
              {oportunidade.dataFechamentoEsperado 
                ? new Date(oportunidade.dataFechamentoEsperado).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit'
                  })
                : oportunidade.tempoNoEstagio
              }
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Probabilidade */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
        <div
          className={`h-full transition-all duration-300 ${
            oportunidade.probabilidade >= 80 
              ? 'bg-green-500' 
              : oportunidade.probabilidade >= 60 
                ? 'bg-yellow-500'
                : oportunidade.probabilidade >= 40
                  ? 'bg-orange-500'
                  : 'bg-red-500'
          }`}
          style={{ width: `${oportunidade.probabilidade}%` }}
        />
      </div>

      {/* Overlay de Hover */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-200 pointer-events-none" />
      
      {/* Ícone de Visualizar */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="bg-white rounded-full p-1 shadow-md">
          <Eye className="w-3 h-3 text-gray-600" />
        </div>
      </div>

      {/* Indicador de Atividade Recente */}
      {oportunidade.ultimaAtividade && (
        <div className="absolute top-2 left-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Atividade recente" />
        </div>
      )}

      {/* Indicador se está atrasado */}
      {oportunidade.dataFechamentoEsperado && 
       new Date(oportunidade.dataFechamentoEsperado) < new Date() && (
        <div className="absolute top-2 left-2">
          <div className="w-2 h-2 bg-red-500 rounded-full" title="Atrasado" />
        </div>
      )}
    </div>
  );
};
