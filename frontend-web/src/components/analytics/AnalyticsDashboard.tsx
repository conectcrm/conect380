import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator } from '../ui/select';
import { Badge } from '../ui/badge';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, DollarSign, Clock, Target,
  FileText, CheckCircle, AlertTriangle, Calendar, Download
} from 'lucide-react';

interface AnalyticsData {
  vendas: {
    total_periodo: number;
    meta_periodo: number;
    crescimento_percentual: number;
    ticket_medio: number;
    conversao_geral: number;
  };
  funil: {
    propostas_criadas: number;
    propostas_enviadas: number;
    propostas_aprovadas: number;
    contratos_assinados: number;
    faturas_pagas: number;
    conversao_por_etapa: {
      criada_para_enviada: number;
      enviada_para_aprovada: number;
      aprovada_para_assinada: number;
      assinada_para_paga: number;
    };
  };
  tempo_medio: {
    proposta_para_envio: number;
    envio_para_aprovacao: number;
    aprovacao_para_assinatura: number;
    assinatura_para_pagamento: number;
    ciclo_completo: number;
  };
  vendedores: Array<{
    id: string;
    nome: string;
    propostas_criadas: number;
    propostas_fechadas: number;
    valor_vendido: number;
    ticket_medio: number;
    tempo_medio_fechamento: number;
    conversao: number;
  }>;
  evolucao_temporal: Array<{
    periodo: string;
    propostas: number;
    vendas: number;
    valor: number;
    conversao: number;
  }>;
  distribuicao_valores: Array<{
    faixa: string;
    quantidade: number;
    valor_total: number;
    percentual: number;
  }>;
  status_atual: Array<{
    status: string;
    quantidade: number;
    valor_total: number;
    tempo_medio_status: number;
  }>;
}

interface AnalyticsDashboardProps {
  periodo?: '7d' | '30d' | '90d' | '1y';
  vendedorId?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  periodo = '30d',
  vendedorId
}) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriodo, setSelectedPeriodo] = useState(periodo);
  const [selectedVendedor, setSelectedVendedor] = useState(vendedorId || 'todos');

  useEffect(() => {
    carregarDados();
  }, [selectedPeriodo, selectedVendedor]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/dashboard?periodo=${selectedPeriodo}&vendedor=${selectedVendedor}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarPercentual = (valor: number) => {
    return `${valor.toFixed(1)}%`;
  };

  const formatarTempo = (dias: number) => {
    if (dias < 1) {
      return `${Math.round(dias * 24)}h`;
    }
    return `${dias.toFixed(1)} dias`;
  };

  const exportarRelatorio = async () => {
    try {
      const response = await fetch(`/api/analytics/export?periodo=${selectedPeriodo}&vendedor=${selectedVendedor}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-vendas-${selectedPeriodo}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    }
  };

  const cores = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88', '#ff0088'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Erro ao carregar dados de analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Relatórios</h1>
          <p className="text-gray-600">Dashboard completo de performance de vendas</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="1y">1 ano</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os vendedores</SelectItem>
              {data.vendedores.map(vendedor => (
                <SelectItem key={vendedor.id} value={vendedor.id}>
                  {vendedor.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={exportarRelatorio} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vendas no Período</p>
                <p className="text-2xl font-bold">{formatarMoeda(data.vendas.total_periodo)}</p>
                <div className="flex items-center mt-1">
                  {data.vendas.crescimento_percentual >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${data.vendas.crescimento_percentual >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatarPercentual(Math.abs(data.vendas.crescimento_percentual))}
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa de Conversão</p>
                <p className="text-2xl font-bold">{formatarPercentual(data.vendas.conversao_geral)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Meta: {formatarPercentual(data.vendas.meta_periodo)}
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold">{formatarMoeda(data.vendas.ticket_medio)}</p>
                <p className="text-xs text-gray-500 mt-1">Por proposta fechada</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ciclo Médio</p>
                <p className="text-2xl font-bold">{formatarTempo(data.tempo_medio.ciclo_completo)}</p>
                <p className="text-xs text-gray-500 mt-1">Proposta até pagamento</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funil de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de Vendas - Conversão por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">Propostas Criadas</span>
                <Badge variant="outline">{data.funil.propostas_criadas}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium">Propostas Enviadas</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{data.funil.propostas_enviadas}</Badge>
                  <span className="text-sm text-gray-600">
                    ({formatarPercentual(data.funil.conversao_por_etapa.criada_para_enviada)})
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">Propostas Aprovadas</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{data.funil.propostas_aprovadas}</Badge>
                  <span className="text-sm text-gray-600">
                    ({formatarPercentual(data.funil.conversao_por_etapa.enviada_para_aprovada)})
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="font-medium">Contratos Assinados</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{data.funil.contratos_assinados}</Badge>
                  <span className="text-sm text-gray-600">
                    ({formatarPercentual(data.funil.conversao_por_etapa.aprovada_para_assinada)})
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                <span className="font-medium">Faturas Pagas</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{data.funil.faturas_pagas}</Badge>
                  <span className="text-sm text-gray-600">
                    ({formatarPercentual(data.funil.conversao_por_etapa.assinada_para_paga)})
                  </span>
                </div>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { etapa: 'Criadas', valor: data.funil.propostas_criadas },
                  { etapa: 'Enviadas', valor: data.funil.propostas_enviadas },
                  { etapa: 'Aprovadas', valor: data.funil.propostas_aprovadas },
                  { etapa: 'Assinadas', valor: data.funil.contratos_assinados },
                  { etapa: 'Pagas', valor: data.funil.faturas_pagas }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="etapa" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="valor" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evolução Temporal */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução no Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.evolucao_temporal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'valor' ? formatarMoeda(value as number) : value,
                    name === 'valor' ? 'Valor Vendido' :
                      name === 'vendas' ? 'Vendas Fechadas' :
                        name === 'propostas' ? 'Propostas Criadas' : 'Taxa de Conversão'
                  ]}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="propostas"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="Propostas"
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="vendas"
                  stackId="1"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name="Vendas"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="conversao"
                  stroke="#ff7300"
                  strokeWidth={3}
                  name="Conversão (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance por Vendedor */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Vendedor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Vendedor</th>
                  <th className="text-center p-2">Propostas</th>
                  <th className="text-center p-2">Fechadas</th>
                  <th className="text-center p-2">Conversão</th>
                  <th className="text-center p-2">Valor Vendido</th>
                  <th className="text-center p-2">Ticket Médio</th>
                  <th className="text-center p-2">Tempo Médio</th>
                </tr>
              </thead>
              <tbody>
                {data.vendedores.map((vendedor) => (
                  <tr key={vendedor.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{vendedor.nome}</td>
                    <td className="text-center p-2">{vendedor.propostas_criadas}</td>
                    <td className="text-center p-2">{vendedor.propostas_fechadas}</td>
                    <td className="text-center p-2">
                      <Badge variant={vendedor.conversao >= 20 ? "default" : "secondary"}>
                        {formatarPercentual(vendedor.conversao)}
                      </Badge>
                    </td>
                    <td className="text-center p-2">{formatarMoeda(vendedor.valor_vendido)}</td>
                    <td className="text-center p-2">{formatarMoeda(vendedor.ticket_medio)}</td>
                    <td className="text-center p-2">{formatarTempo(vendedor.tempo_medio_fechamento)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Distribuição de Valores e Status Atual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Valor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.distribuicao_valores}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ faixa, percentual }) => `${faixa} (${percentual.toFixed(1)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="quantidade"
                  >
                    {data.distribuicao_valores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={cores[index % cores.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, 'Quantidade']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Atual das Propostas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.status_atual.map((status, index) => (
                <div key={status.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: cores[index % cores.length] }}
                    />
                    <span className="font-medium">{status.status}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{status.quantidade}</div>
                    <div className="text-sm text-gray-600">{formatarMoeda(status.valor_total)}</div>
                    <div className="text-xs text-gray-500">
                      Tempo médio: {formatarTempo(status.tempo_medio_status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tempo Médio por Etapa */}
      <Card>
        <CardHeader>
          <CardTitle>Tempo Médio por Etapa do Fluxo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatarTempo(data.tempo_medio.proposta_para_envio)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Proposta → Envio</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {formatarTempo(data.tempo_medio.envio_para_aprovacao)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Envio → Aprovação</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatarTempo(data.tempo_medio.aprovacao_para_assinatura)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Aprovação → Assinatura</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {formatarTempo(data.tempo_medio.assinatura_para_pagamento)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Assinatura → Pagamento</div>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">
                {formatarTempo(data.tempo_medio.ciclo_completo)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Ciclo Completo</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
