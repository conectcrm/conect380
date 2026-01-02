import React from 'react';
import { EstatisticasOportunidades } from '../../../types/oportunidades/index';
import {
  Target,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  Award,
  AlertTriangle,
} from 'lucide-react';

interface EstatisticasCardsProps {
  estatisticas: EstatisticasOportunidades;
}

export const EstatisticasCards: React.FC<EstatisticasCardsProps> = ({ estatisticas }) => {
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
    }).format(valor);
  };

  const formatarPorcentagem = (valor: number) => {
    return `${Math.round(valor)}%`;
  };

  const cards = [
    {
      titulo: 'Total de Oportunidades',
      valor: estatisticas.totalOportunidades?.toString() || '0',
      subtitulo: 'oportunidades ativas',
      icone: Target,
      cor: 'text-blue-600',
      fundo: 'bg-blue-50',
      tendencia: null,
    },
    {
      titulo: 'Valor Total Pipeline',
      valor: formatarMoeda(estatisticas.valorTotalPipeline || 0),
      subtitulo: 'valor total em negociação',
      icone: DollarSign,
      cor: 'text-green-600',
      fundo: 'bg-green-50',
      tendencia: null,
    },
    {
      titulo: 'Receita Realizada',
      valor: formatarMoeda(estatisticas.valorGanho || 0),
      subtitulo: 'vendas fechadas',
      icone: Award,
      cor: 'text-purple-600',
      fundo: 'bg-purple-50',
      tendencia: null,
    },
    {
      titulo: 'Taxa de Conversão',
      valor: formatarPorcentagem(estatisticas.taxaConversao || 0),
      subtitulo: 'oportunidades ganhas',
      icone: TrendingUp,
      cor: 'text-orange-600',
      fundo: 'bg-orange-50',
      tendencia: (estatisticas.taxaConversao || 0) >= 30 ? 'positive' : 'negative',
    },
    {
      titulo: 'Valor Médio',
      valor: formatarMoeda(estatisticas.valorMedio || 0),
      subtitulo: 'por oportunidade',
      icone: BarChart3,
      cor: 'text-indigo-600',
      fundo: 'bg-indigo-50',
      tendencia: null,
    },
    {
      titulo: 'Distribuição',
      valor: Object.keys(estatisticas.distribuicaoPorEstagio || {}).length.toString(),
      subtitulo: 'estágios ativos',
      icone: Calendar,
      cor: 'text-cyan-600',
      fundo: 'bg-cyan-50',
      tendencia: null,
    },
  ];

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card, index) => {
          const Icone = card.icone;

          return (
            <div
              key={index}
              className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`p-2 rounded-lg ${card.fundo}`}>
                      <Icone className={`w-4 h-4 ${card.cor}`} />
                    </div>
                    {card.tendencia && (
                      <div
                        className={`
                        text-xs px-2 py-1 rounded-full
                        ${
                          card.tendencia === 'positive'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }
                      `}
                      >
                        {card.tendencia === 'positive' ? '↗' : '↘'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      {card.titulo}
                    </div>
                    <div className="text-lg font-bold text-gray-900">{card.valor}</div>
                    <div className="text-xs text-gray-500">{card.subtitulo}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Distribuição por Estágio */}
      <div className="mt-6 bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Estágio</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {Object.entries(estatisticas.distribuicaoPorEstagio || {}).map(([estagio, dados]) => {
            const quantidade = dados.quantidade || 0;
            const porcentagem =
              estatisticas.totalOportunidades > 0
                ? Math.round((quantidade / estatisticas.totalOportunidades) * 100)
                : 0;

            const estagioNomes = {
              leads: 'Leads',
              qualification: 'Qualificação',
              proposal: 'Proposta',
              negotiation: 'Negociação',
              closing: 'Fechamento',
              won: 'Ganho',
              lost: 'Perdido',
            };

            const estagioColors = {
              leads: 'text-gray-600 bg-gray-100',
              qualification: 'text-blue-600 bg-blue-100',
              proposal: 'text-yellow-600 bg-yellow-100',
              negotiation: 'text-orange-600 bg-orange-100',
              closing: 'text-purple-600 bg-purple-100',
              won: 'text-green-600 bg-green-100',
              lost: 'text-red-600 bg-red-100',
            };

            return (
              <div key={estagio} className="text-center">
                <div
                  className={`
                  w-12 h-12 mx-auto rounded-full flex items-center justify-center text-lg font-bold mb-2
                  ${estagioColors[estagio as keyof typeof estagioColors] || 'text-gray-600 bg-gray-100'}
                `}
                >
                  {quantidade}
                </div>
                <div className="text-xs font-medium text-gray-900">
                  {estagioNomes[estagio as keyof typeof estagioNomes] || estagio}
                </div>
                <div className="text-xs text-gray-500">{porcentagem}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
