import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import {
  DollarSign,
  Target,
  TrendingUp,
  Users,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

interface KpiTempoReal {
  vendas_hoje: number;
  propostas_enviadas_hoje: number;
  taxa_resposta_24h: number;
  pipeline_valor: number;
  meta_mensal_progresso: number;
  vendedores_ativos: number;
  ultima_atualizacao: string;
}

interface Meta {
  nome: string;
  valor_atual: number;
  valor_meta: number;
  progresso: number;
  status: 'superado' | 'no_prazo' | 'atencao' | 'critico';
}

interface MetasProgressoData {
  metas: Meta[];
  previsao_cumprimento: number;
}

interface KpisTempoRealProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const KpisTempoReal: React.FC<KpisTempoRealProps> = ({
  autoRefresh = true,
  refreshInterval = 60000, // 1 minuto
}) => {
  const [kpis, setKpis] = useState<KpiTempoReal | null>(null);
  const [metas, setMetas] = useState<MetasProgressoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date>(new Date());

  useEffect(() => {
    carregarDados();

    if (autoRefresh) {
      const interval = setInterval(() => {
        carregarDados(false); // Não mostrar loading nas atualizações automáticas
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const carregarDados = async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      const [kpisResponse, metasResponse] = await Promise.all([
        fetch('/api/analytics/kpis-tempo-real', {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        }),
        fetch('/api/analytics/metas-progresso', {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        }),
      ]);

      if (kpisResponse.ok && metasResponse.ok) {
        const [kpisData, metasData] = await Promise.all([
          kpisResponse.json(),
          metasResponse.json(),
        ]);

        setKpis(kpisData);
        setMetas(metasData);
        setUltimaAtualizacao(new Date());
      }
    } catch (error) {
      console.error('Erro ao carregar KPIs:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarPercentual = (valor: number) => {
    return `${valor.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'superado':
        return 'text-green-600 bg-green-100';
      case 'no_prazo':
        return 'text-blue-600 bg-blue-100';
      case 'atencao':
        return 'text-yellow-600 bg-yellow-100';
      case 'critico':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'superado':
        return <TrendingUp className="h-4 w-4" />;
      case 'no_prazo':
        return <CheckCircle className="h-4 w-4" />;
      case 'atencao':
        return <AlertCircle className="h-4 w-4" />;
      case 'critico':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getProgressColor = (progresso: number) => {
    if (progresso >= 100) return 'bg-green-500';
    if (progresso >= 80) return 'bg-blue-500';
    if (progresso >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!kpis || !metas) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Erro ao carregar KPIs em tempo real</p>
        <Button onClick={() => carregarDados()} className="mt-2">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com última atualização */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">KPIs em Tempo Real</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          Atualizado: {ultimaAtualizacao.toLocaleTimeString('pt-BR')}
          <Button variant="outline" size="sm" onClick={() => carregarDados()} className="ml-2">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vendas Hoje</p>
                <p className="text-2xl font-bold">{formatarMoeda(kpis.vendas_hoje)}</p>
                <p className="text-xs text-green-600 mt-1">
                  +{kpis.propostas_enviadas_hoje} propostas enviadas
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa Resposta 24h</p>
                <p className="text-2xl font-bold">{formatarPercentual(kpis.taxa_resposta_24h)}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${kpis.taxa_resposta_24h}%` }}
                  ></div>
                </div>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pipeline Ativo</p>
                <p className="text-2xl font-bold">{formatarMoeda(kpis.pipeline_valor)}</p>
                <p className="text-xs text-purple-600 mt-1">
                  {kpis.vendedores_ativos} vendedores ativos
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Meta Mensal</p>
                <p className="text-2xl font-bold">
                  {formatarPercentual(kpis.meta_mensal_progresso)}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(kpis.meta_mensal_progresso)}`}
                    style={{ width: `${Math.min(kpis.meta_mensal_progresso, 100)}%` }}
                  ></div>
                </div>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progresso das Metas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Progresso das Metas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {metas.metas.map((meta, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{meta.nome}</span>
                  <Badge className={getStatusColor(meta.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(meta.status)}
                      {meta.status.replace('_', ' ').toUpperCase()}
                    </div>
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    {meta.nome.includes('Conversão') || meta.nome.includes('Taxa')
                      ? formatarPercentual(meta.valor_atual)
                      : formatarMoeda(meta.valor_atual)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Meta:{' '}
                    {meta.nome.includes('Conversão') || meta.nome.includes('Taxa')
                      ? formatarPercentual(meta.valor_meta)
                      : formatarMoeda(meta.valor_meta)}
                  </div>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(meta.progresso)}`}
                  style={{ width: `${Math.min(meta.progresso, 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span>{formatarPercentual(meta.progresso)} da meta</span>
                <span>
                  {meta.progresso >= 100
                    ? `+${formatarPercentual(meta.progresso - 100)} acima da meta`
                    : `${formatarPercentual(100 - meta.progresso)} restante`}
                </span>
              </div>
            </div>
          ))}

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Previsão de Cumprimento Geral:</span>
              <Badge
                className={
                  metas.previsao_cumprimento >= 90
                    ? 'bg-green-100 text-green-800'
                    : metas.previsao_cumprimento >= 70
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }
              >
                {formatarPercentual(metas.previsao_cumprimento)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicador de Status Geral */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Status Geral do Sistema</h3>
              <p className="text-gray-600">Todas as métricas sendo monitoradas em tempo real</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">Online</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KpisTempoReal;
