import React, { useState, useEffect } from 'react';
import { propostasService } from '../services/propostasService';
import './dashboard-responsive.css';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Clock,
  Users,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  FileText,
} from 'lucide-react';

interface MetricasPropostas {
  totalPropostas: number;
  valorTotalPipeline: number;
  taxaConversao: number;
  propostasAprovadas: number;
  estatisticasPorStatus: Record<string, number>;
  estatisticasPorVendedor: Record<string, number>;
}

interface DashboardPropostasProps {
  onRefresh?: () => void;
}

export const DashboardPropostas: React.FC<DashboardPropostasProps> = ({ onRefresh }) => {
  const [metricas, setMetricas] = useState<MetricasPropostas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarMetricas = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const dados = await propostasService.obterEstatisticas();
      setMetricas(dados);
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
      setError('Erro ao carregar métricas do dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarMetricas();
  }, []);

  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'aprovada':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50',
          label: 'Aprovadas',
        };
      case 'rejeitada':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Rejeitadas' };
      case 'enviada':
        return { icon: Send, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Enviadas' };
      case 'negociacao':
        return {
          icon: AlertCircle,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          label: 'Em Negociação',
        };
      default:
        return { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Rascunhos' };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <XCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={carregarMetricas}
            className="ml-auto px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!metricas) return null;

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border kip-card">
          <div className="flex items-center justify-between">
            <div className="text-container mr-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                Total de Propostas
              </p>
              <p className="currency-value font-bold text-gray-900 number-display">
                {metricas.totalPropostas}
              </p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 card-icon">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border kip-card">
          <div className="flex items-center justify-between">
            <div className="text-container mr-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                Pipeline Total
              </p>
              <p className="currency-value font-bold text-gray-900 number-display">
                {formatarMoeda(metricas.valorTotalPipeline)}
              </p>
            </div>
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 card-icon">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border kip-card">
          <div className="flex items-center justify-between">
            <div className="text-container mr-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Valor Médio</p>
              <p className="currency-value font-bold text-gray-900 number-display">
                {formatarMoeda(
                  metricas.totalPropostas > 0
                    ? metricas.valorTotalPipeline / metricas.totalPropostas
                    : 0,
                )}
              </p>
            </div>
            <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 card-icon">
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border kip-card">
          <div className="flex items-center justify-between">
            <div className="text-container mr-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                Taxa de Conversão
              </p>
              <p className="currency-value font-bold text-gray-900 number-display">
                {metricas.taxaConversao.toFixed(1)}%
              </p>
            </div>
            <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 card-icon">
              {metricas.taxaConversao >= 50 ? (
                <TrendingUp className="h-4 w-4 text-orange-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-orange-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Propostas por Status */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Propostas por Status</h3>
          <div className="space-y-3">
            {Object.entries(metricas.estatisticasPorStatus).map(([status, quantidade]) => {
              const config = getStatusConfig(status);
              const Icon = config.icon;
              const valorEstimado =
                quantidade * (metricas.valorTotalPipeline / metricas.totalPropostas);
              return (
                <div
                  key={status}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border stacked-card-content"
                >
                  <div className="flex items-center">
                    <div
                      className={`h-8 w-8 ${config.bg} rounded-full flex items-center justify-center mr-3 flex-shrink-0`}
                    >
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="text-container">
                      <p className="font-medium text-gray-900">{config.label}</p>
                      <p className="text-sm text-gray-500">{quantidade} propostas</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right ml-11 sm:ml-0">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base number-display">
                      {formatarMoeda(valorEstimado)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {metricas.totalPropostas > 0
                        ? ((quantidade / metricas.totalPropostas) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance por Vendedor */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance por Vendedor</h3>
          <div className="space-y-3">
            {Object.entries(metricas.estatisticasPorVendedor)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([vendedorNome, quantidade]) => {
                const valorEstimado =
                  quantidade * (metricas.valorTotalPipeline / metricas.totalPropostas);
                return (
                  <div
                    key={vendedorNome}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border stacked-card-content"
                  >
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Users className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="text-container">
                        <p className="font-medium text-gray-900 vendor-name" title={vendedorNome}>
                          {vendedorNome}
                        </p>
                        <p className="text-sm text-gray-500">{quantidade} propostas</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right ml-11 sm:ml-0">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base number-display">
                        {formatarMoeda(valorEstimado)}
                      </p>
                      <p className="text-sm text-gray-500 number-display">
                        {formatarMoeda(quantidade > 0 ? valorEstimado / quantidade : 0)} médio
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Métricas Adicionais */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Status das Propostas</h3>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border space-y-2 sm:space-y-0">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">Propostas Aprovadas</p>
                  <p className="text-sm text-gray-500">Status: Aprovadas</p>
                </div>
              </div>
              <div className="text-left sm:text-right ml-11 sm:ml-0">
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {metricas.propostasAprovadas}
                </p>
                <p className="text-sm text-gray-500">de {metricas.totalPropostas}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Métricas de Performance</h3>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">Meta de Conversão</p>
                  <p className="text-sm text-gray-500">Objetivo: 60%</p>
                </div>
              </div>
              <div className="text-left sm:text-right ml-13 sm:ml-0">
                <p
                  className={`text-xl sm:text-2xl font-bold ${metricas.taxaConversao >= 60 ? 'text-green-600' : 'text-orange-600'}`}
                >
                  {metricas.taxaConversao >= 60 ? '✓' : '○'}
                </p>
                <p className="text-sm text-gray-500">{metricas.taxaConversao.toFixed(1)}% atual</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botão de atualização */}
      <div className="flex justify-center pt-4">
        <button
          onClick={() => {
            carregarMetricas();
            onRefresh?.();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Atualizar Métricas
        </button>
      </div>
    </div>
  );
};

export default DashboardPropostas;
