import React, { useMemo } from 'react';
import {
  AlertCircle,
  BarChart3,
  DollarSign,
  PieChart,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Fatura, StatusFatura } from '../../services/faturamentoService';

interface MetricaFinanceira {
  valor: number;
  variacao: number;
  periodo: string;
  tendencia: 'alta' | 'baixa' | 'estavel';
}

interface StatusDistribuicaoItem {
  status: string;
  quantidade: number;
  cor: string;
}

interface TopClienteItem {
  nome: string;
  valor: number;
}

interface DashboardAnalyticsProps {
  faturas: Fatura[];
  periodo: 'mes' | 'trimestre' | 'ano';
  onChangePeriodo: (periodo: 'mes' | 'trimestre' | 'ano') => void;
}

const parsePeriodo = (value: string): 'mes' | 'trimestre' | 'ano' => {
  if (value === 'trimestre' || value === 'ano') {
    return value;
  }
  return 'mes';
};

const calcularVariacao = (atual: number, anterior: number): number => {
  if (anterior <= 0) {
    return atual > 0 ? 100 : 0;
  }
  return ((atual - anterior) / anterior) * 100;
};

const formatarMoeda = (valor: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);

export default function DashboardAnalytics({
  faturas,
  periodo,
  onChangePeriodo,
}: DashboardAnalyticsProps): JSX.Element {
  const metricas = useMemo<{
    receitaTotal: MetricaFinanceira;
    receitaRecebida: MetricaFinanceira;
    inadimplencia: MetricaFinanceira;
    ticketMedio: MetricaFinanceira;
  }>(() => {
    const hoje = new Date();
    const dataFimAtual = hoje;
    let dataInicioAtual = new Date();
    let dataInicioAnterior = new Date();

    switch (periodo) {
      case 'mes':
        dataInicioAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataInicioAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        break;
      case 'trimestre':
        dataInicioAtual = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1);
        dataInicioAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 6, 1);
        break;
      case 'ano':
        dataInicioAtual = new Date(hoje.getFullYear(), 0, 1);
        dataInicioAnterior = new Date(hoje.getFullYear() - 1, 0, 1);
        break;
    }

    const dataFimAnterior = new Date(dataInicioAtual.getTime() - 1);

    const faturasPeriodoAtual = faturas.filter((fatura) => {
      const emissao = new Date(fatura.dataEmissao);
      return emissao >= dataInicioAtual && emissao <= dataFimAtual;
    });

    const faturasPeriodoAnterior = faturas.filter((fatura) => {
      const emissao = new Date(fatura.dataEmissao);
      return emissao >= dataInicioAnterior && emissao <= dataFimAnterior;
    });

    const calcularResumo = (lista: Fatura[], dataReferencia: Date) => {
      const pagas = lista.filter((fatura) => fatura.status === StatusFatura.PAGA);
      const vencidas = lista.filter((fatura) => {
        const vencimento = new Date(fatura.dataVencimento);
        return vencimento < dataReferencia && fatura.status !== StatusFatura.PAGA;
      });

      const receitaTotal = lista.reduce((acc, fatura) => acc + fatura.valorTotal, 0);
      const receitaRecebida = pagas.reduce((acc, fatura) => acc + fatura.valorTotal, 0);
      const valorInadimplencia = vencidas.reduce((acc, fatura) => acc + fatura.valorTotal, 0);
      const percentualInadimplencia =
        receitaTotal > 0 ? (valorInadimplencia / receitaTotal) * 100 : 0;
      const ticketMedio = lista.length > 0 ? receitaTotal / lista.length : 0;

      return {
        receitaTotal,
        receitaRecebida,
        percentualInadimplencia,
        ticketMedio,
      };
    };

    const resumoAtual = calcularResumo(faturasPeriodoAtual, hoje);
    const resumoAnterior = calcularResumo(faturasPeriodoAnterior, dataFimAnterior);

    const variacaoReceita = calcularVariacao(resumoAtual.receitaTotal, resumoAnterior.receitaTotal);
    const variacaoRecebida = calcularVariacao(
      resumoAtual.receitaRecebida,
      resumoAnterior.receitaRecebida,
    );
    const variacaoInadimplencia = calcularVariacao(
      resumoAtual.percentualInadimplencia,
      resumoAnterior.percentualInadimplencia,
    );
    const variacaoTicket = calcularVariacao(resumoAtual.ticketMedio, resumoAnterior.ticketMedio);

    return {
      receitaTotal: {
        valor: resumoAtual.receitaTotal,
        variacao: variacaoReceita,
        periodo: `vs ${periodo} anterior`,
        tendencia: variacaoReceita > 5 ? 'alta' : variacaoReceita < -5 ? 'baixa' : 'estavel',
      },
      receitaRecebida: {
        valor: resumoAtual.receitaRecebida,
        variacao: variacaoRecebida,
        periodo: `vs ${periodo} anterior`,
        tendencia: variacaoRecebida > 5 ? 'alta' : variacaoRecebida < -5 ? 'baixa' : 'estavel',
      },
      inadimplencia: {
        valor: resumoAtual.percentualInadimplencia,
        variacao: variacaoInadimplencia,
        periodo: `vs ${periodo} anterior`,
        tendencia:
          variacaoInadimplencia > 2 ? 'baixa' : variacaoInadimplencia < -2 ? 'alta' : 'estavel',
      },
      ticketMedio: {
        valor: resumoAtual.ticketMedio,
        variacao: variacaoTicket,
        periodo: `vs ${periodo} anterior`,
        tendencia: variacaoTicket > 5 ? 'alta' : variacaoTicket < -5 ? 'baixa' : 'estavel',
      },
    };
  }, [faturas, periodo]);

  const chartData = useMemo<{
    evolucaoReceita: unknown[];
    statusDistribuicao: StatusDistribuicaoItem[];
    topClientes: TopClienteItem[];
  }>(() => {
    const statusDistribuicao: StatusDistribuicaoItem[] = [
      {
        status: 'Pagas',
        quantidade: faturas.filter((fatura) => fatura.status === StatusFatura.PAGA).length,
        cor: '#10b981',
      },
      {
        status: 'Pendentes',
        quantidade: faturas.filter((fatura) => fatura.status === StatusFatura.PENDENTE).length,
        cor: '#f59e0b',
      },
      {
        status: 'Vencidas',
        quantidade: faturas.filter((fatura) => {
          const vencimento = new Date(fatura.dataVencimento);
          return vencimento < new Date() && fatura.status !== StatusFatura.PAGA;
        }).length,
        cor: '#ef4444',
      },
      {
        status: 'Canceladas',
        quantidade: faturas.filter((fatura) => fatura.status === StatusFatura.CANCELADA).length,
        cor: '#6b7280',
      },
    ];

    const clientesValor = faturas
      .filter((fatura) => fatura.cliente?.nome)
      .reduce(
        (acc, fatura) => {
          const nome = fatura.cliente?.nome ?? 'Sem nome';
          acc[nome] = (acc[nome] || 0) + fatura.valorTotal;
          return acc;
        },
        {} as Record<string, number>,
      );

    const topClientes = Object.entries(clientesValor)
      .sort(([, valorA], [, valorB]) => valorB - valorA)
      .slice(0, 5)
      .map(([nome, valor]) => ({ nome, valor }));

    return {
      evolucaoReceita: [],
      statusDistribuicao,
      topClientes,
    };
  }, [faturas]);

  const renderMetrica = (
    titulo: string,
    metrica: MetricaFinanceira,
    icone: React.ReactNode,
    formato: 'moeda' | 'percentual' | 'numero' = 'moeda',
  ): JSX.Element => {
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          Analytics Financeiro
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Periodo:</span>
          <select
            value={periodo}
            onChange={(event) => onChangePeriodo(parsePeriodo(event.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="mes">Este mes</option>
            <option value="trimestre">Ultimos 3 meses</option>
            <option value="ano">Este ano</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderMetrica('Receita total', metricas.receitaTotal, <DollarSign className="w-8 h-8" />)}
        {renderMetrica(
          'Receita recebida',
          metricas.receitaRecebida,
          <TrendingUp className="w-8 h-8" />,
        )}
        {renderMetrica(
          'Taxa de inadimplencia',
          metricas.inadimplencia,
          <AlertCircle className="w-8 h-8" />,
          'percentual',
        )}
        {renderMetrica('Ticket medio', metricas.ticketMedio, <Users className="w-8 h-8" />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-600" />
            Distribuicao por status
          </h3>
          <div className="space-y-3">
            {chartData.statusDistribuicao.map((item, index) => {
              const total = chartData.statusDistribuicao.reduce(
                (acc, curr) => acc + curr.quantidade,
                0,
              );
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

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Top 5 clientes
          </h3>
          <div className="space-y-3">
            {chartData.topClientes.map((cliente, index) => {
              const maxValor = Math.max(...chartData.topClientes.map((item) => item.valor), 0);
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
    </div>
  );
}
