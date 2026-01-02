import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  AlertCircle,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { Fatura, StatusFatura } from '../../services/faturamentoService';

interface MetricaFinanceira {
  valor: number;
  variacao: number; // percentual de variação
  periodo: string;
  tendencia: 'alta' | 'baixa' | 'estavel';
}

interface DashboardAnalyticsProps {
  faturas: Fatura[];
  periodo: 'mes' | 'trimestre' | 'ano';
  onChangePeriodo: (periodo: 'mes' | 'trimestre' | 'ano') => void;
}

export default function DashboardAnalytics({
  faturas,
  periodo,
  onChangePeriodo,
}: DashboardAnalyticsProps) {
  const [metricas, setMetricas] = useState<{
    receitaTotal: MetricaFinanceira;
    receitaRecebida: MetricaFinanceira;
    inadimplencia: MetricaFinanceira;
    ticketMedio: MetricaFinanceira;
  }>({
    receitaTotal: { valor: 0, variacao: 0, periodo: '', tendencia: 'estavel' },
    receitaRecebida: { valor: 0, variacao: 0, periodo: '', tendencia: 'estavel' },
    inadimplencia: { valor: 0, variacao: 0, periodo: '', tendencia: 'estavel' },
    ticketMedio: { valor: 0, variacao: 0, periodo: '', tendencia: 'estavel' },
  });

  const [chartData, setChartData] = useState({
    evolucaoReceita: [],
    statusDistribuicao: [],
    topClientes: [],
  });

  useEffect(() => {
    calcularMetricas();
    gerarDadosCharts();
  }, [faturas, periodo]);

  const calcularMetricas = () => {
    const hoje = new Date();
    let dataInicio: Date;

    switch (periodo) {
      case 'mes':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        break;
      case 'trimestre':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1);
        break;
      case 'ano':
        dataInicio = new Date(hoje.getFullYear(), 0, 1);
        break;
    }

    const faturasPeriodo = faturas.filter((f) => new Date(f.dataEmissao) >= dataInicio);

    const faturasPagas = faturasPeriodo.filter((f) => f.status === StatusFatura.PAGA);

    const faturasVencidas = faturasPeriodo.filter((f) => {
      const vencimento = new Date(f.dataVencimento);
      return vencimento < hoje && f.status !== StatusFatura.PAGA;
    });

    const receitaTotal = faturasPeriodo.reduce((acc, f) => acc + f.valorTotal, 0);
    const receitaRecebida = faturasPagas.reduce((acc, f) => acc + f.valorTotal, 0);
    const valorInadimplencia = faturasVencidas.reduce((acc, f) => acc + f.valorTotal, 0);
    const percentualInadimplencia =
      receitaTotal > 0 ? (valorInadimplencia / receitaTotal) * 100 : 0;
    const ticketMedio = faturasPeriodo.length > 0 ? receitaTotal / faturasPeriodo.length : 0;

    // Calcular variações (simulado - em produção, comparar com período anterior)
    const variacaoReceita = Math.random() * 20 - 10; // -10% a +10%
    const variacaoRecebida = Math.random() * 15 - 5; // -5% a +10%
    const variacaoInadimplencia = Math.random() * 10 - 5; // -5% a +5%
    const variacaoTicket = Math.random() * 25 - 10; // -10% a +15%

    setMetricas({
      receitaTotal: {
        valor: receitaTotal,
        variacao: variacaoReceita,
        periodo: `vs ${periodo} anterior`,
        tendencia: variacaoReceita > 5 ? 'alta' : variacaoReceita < -5 ? 'baixa' : 'estavel',
      },
      receitaRecebida: {
        valor: receitaRecebida,
        variacao: variacaoRecebida,
        periodo: `vs ${periodo} anterior`,
        tendencia: variacaoRecebida > 5 ? 'alta' : variacaoRecebida < -5 ? 'baixa' : 'estavel',
      },
      inadimplencia: {
        valor: percentualInadimplencia,
        variacao: variacaoInadimplencia,
        periodo: `vs ${periodo} anterior`,
        tendencia:
          variacaoInadimplencia > 2 ? 'baixa' : variacaoInadimplencia < -2 ? 'alta' : 'estavel', // invertido: + inadimplência = tendência baixa
      },
      ticketMedio: {
        valor: ticketMedio,
        variacao: variacaoTicket,
        periodo: `vs ${periodo} anterior`,
        tendencia: variacaoTicket > 5 ? 'alta' : variacaoTicket < -5 ? 'baixa' : 'estavel',
      },
    });
  };

  const gerarDadosCharts = () => {
    // Distribuição por status
    const distribuicao = [
      {
        status: 'Pagas',
        quantidade: faturas.filter((f) => f.status === StatusFatura.PAGA).length,
        cor: '#10b981',
      },
      {
        status: 'Pendentes',
        quantidade: faturas.filter((f) => f.status === StatusFatura.PENDENTE).length,
        cor: '#f59e0b',
      },
      {
        status: 'Vencidas',
        quantidade: faturas.filter((f) => {
          const vencimento = new Date(f.dataVencimento);
          return vencimento < new Date() && f.status !== StatusFatura.PAGA;
        }).length,
        cor: '#ef4444',
      },
      {
        status: 'Canceladas',
        quantidade: faturas.filter((f) => f.status === StatusFatura.CANCELADA).length,
        cor: '#6b7280',
      },
    ];

    // Top 5 clientes por valor
    const clientesValor = faturas
      .filter((f) => f.cliente?.nome)
      .reduce(
        (acc, f) => {
          const cliente = f.cliente!.nome;
          acc[cliente] = (acc[cliente] || 0) + f.valorTotal;
          return acc;
        },
        {} as Record<string, number>,
      );

    const topClientes = Object.entries(clientesValor)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([nome, valor]) => ({ nome, valor }));

    setChartData({
      evolucaoReceita: [], // Implementar evolução temporal
      statusDistribuicao: distribuicao,
      topClientes,
    });
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const renderMetrica = (
    titulo: string,
    metrica: MetricaFinanceira,
    icone: React.ReactNode,
    formato: 'moeda' | 'percentual' | 'numero' = 'moeda',
  ) => {
    const valorFormatado =
      formato === 'moeda'
        ? formatarMoeda(metrica.valor)
        : formato === 'percentual'
          ? `${metrica.valor.toFixed(1)}%`
          : metrica.valor.toLocaleString('pt-BR');

    const corVariacao =
      metrica.variacao > 0
        ? 'text-green-600'
        : metrica.variacao < 0
          ? 'text-red-600'
          : 'text-gray-600';

    const iconeVariacao =
      metrica.tendencia === 'alta' ? (
        <TrendingUp className="w-4 h-4" />
      ) : metrica.tendencia === 'baixa' ? (
        <TrendingDown className="w-4 h-4" />
      ) : (
        <div className="w-4 h-4" />
      );

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{titulo}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{valorFormatado}</p>
            <div className={`flex items-center gap-1 mt-2 text-sm ${corVariacao}`}>
              {iconeVariacao}
              <span>
                {metrica.variacao > 0 ? '+' : ''}
                {metrica.variacao.toFixed(1)}%
              </span>
              <span className="text-gray-500 ml-1">{metrica.periodo}</span>
            </div>
          </div>
          <div className="text-blue-600">{icone}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header com seletor de período */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          Analytics Financeiro
        </h2>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Período:</span>
          <select
            value={periodo}
            onChange={(e) => onChangePeriodo(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="mes">Este Mês</option>
            <option value="trimestre">Últimos 3 Meses</option>
            <option value="ano">Este Ano</option>
          </select>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderMetrica('Receita Total', metricas.receitaTotal, <DollarSign className="w-8 h-8" />)}

        {renderMetrica(
          'Receita Recebida',
          metricas.receitaRecebida,
          <TrendingUp className="w-8 h-8" />,
        )}

        {renderMetrica(
          'Taxa de Inadimplência',
          metricas.inadimplencia,
          <AlertCircle className="w-8 h-8" />,
          'percentual',
        )}

        {renderMetrica('Ticket Médio', metricas.ticketMedio, <Users className="w-8 h-8" />)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-600" />
            Distribuição por Status
          </h3>

          <div className="space-y-3">
            {chartData.statusDistribuicao.map((item, index) => {
              const total = chartData.statusDistribuicao.reduce((acc, i) => acc + i.quantidade, 0);
              const percentual = total > 0 ? (item.quantidade / total) * 100 : 0;

              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.cor }} />
                    <span className="text-sm font-medium text-gray-700">{item.status}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{item.quantidade}</div>
                    <div className="text-xs text-gray-500">{percentual.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Clientes */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Top 5 Clientes
          </h3>

          <div className="space-y-3">
            {chartData.topClientes.map((cliente, index) => {
              const maxValor = Math.max(...chartData.topClientes.map((c) => c.valor));
              const largura = maxValor > 0 ? (cliente.valor / maxValor) * 100 : 0;

              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {cliente.nome}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatarMoeda(cliente.valor)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${largura}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Insights e Recomendações */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Insights e Recomendações
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">🎯 Oportunidades</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • Foque na cobrança das{' '}
                {
                  faturas.filter((f) => {
                    const vencimento = new Date(f.dataVencimento);
                    return vencimento < new Date() && f.status !== StatusFatura.PAGA;
                  }).length
                }{' '}
                faturas vencidas
              </li>
              <li>• Considere desconto para pagamento antecipado</li>
              <li>• Automatize lembretes de vencimento</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-blue-800 mb-2">📈 Performance</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • Taxa de conversão:{' '}
                {(
                  (faturas.filter((f) => f.status === StatusFatura.PAGA).length / faturas.length) *
                  100
                ).toFixed(1)}
                %
              </li>
              <li>• Tempo médio de recebimento: ~15 dias</li>
              <li>• Melhor dia para cobrança: Terça-feira</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
