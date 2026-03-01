import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  PieChart,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { Fatura, StatusFatura } from '../../services/faturamentoService';
import { converterParaNumero, formatarValorCompletoBRL } from '../../utils/formatacao';

interface RelatorioMetrica {
  label: string;
  valor: number;
  percentual: number;
  cor: string;
}

interface RelatoriosAvancadosProps {
  faturas: Fatura[];
  onExportar: (tipo: 'pdf' | 'excel' | 'csv') => void;
}

type PeriodoRelatorio = '7dias' | '30dias' | '90dias' | '1ano';
type TipoRelatorio = 'faturamento' | 'inadimplencia' | 'clientes' | 'produtos';

const CORES_PADRAO = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#14B8A6', '#334155', '#22C55E'];

const calcularDiasAtraso = (dataVencimento: string): number => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const vencimento = new Date(dataVencimento);
  vencimento.setHours(0, 0, 0, 0);

  const diffMs = hoje.getTime() - vencimento.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

export default function RelatoriosAvancados({ faturas, onExportar }: RelatoriosAvancadosProps) {
  const [periodoSelecionado, setPeriodoSelecionado] = useState<PeriodoRelatorio>('30dias');
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>('faturamento');
  const [dadosProcessados, setDadosProcessados] = useState<RelatorioMetrica[]>([]);

  const filtrarPorPeriodo = (lista: Fatura[], periodo: PeriodoRelatorio): Fatura[] => {
    const hoje = new Date();
    const dataLimite = new Date();

    if (periodo === '7dias') dataLimite.setDate(hoje.getDate() - 7);
    if (periodo === '30dias') dataLimite.setDate(hoje.getDate() - 30);
    if (periodo === '90dias') dataLimite.setDate(hoje.getDate() - 90);
    if (periodo === '1ano') dataLimite.setFullYear(hoje.getFullYear() - 1);

    return lista.filter((fatura) => new Date(fatura.dataEmissao) >= dataLimite);
  };

  const processarFaturamento = (lista: Fatura[]): RelatorioMetrica[] => {
    const totalGeral = lista.reduce((acc, f) => acc + converterParaNumero(f.valorTotal), 0);
    const agrupado = lista.reduce(
      (acc, fatura) => {
        const status = fatura.status;
        if (!acc[status]) acc[status] = { total: 0 };
        acc[status].total += converterParaNumero(fatura.valorTotal);
        return acc;
      },
      {} as Record<string, { total: number }>,
    );

    const coresStatus = {
      [StatusFatura.PAGA]: '#10B981',
      [StatusFatura.PENDENTE]: '#F59E0B',
      [StatusFatura.VENCIDA]: '#EF4444',
      [StatusFatura.CANCELADA]: '#6B7280',
      [StatusFatura.ENVIADA]: '#3B82F6',
      [StatusFatura.PARCIALMENTE_PAGA]: '#8B5CF6',
    };

    return Object.entries(agrupado).map(([status, dados]) => ({
      label: status,
      valor: dados.total,
      percentual: totalGeral > 0 ? (dados.total / totalGeral) * 100 : 0,
      cor: coresStatus[status as StatusFatura] || '#0EA5E9',
    }));
  };

  const processarInadimplencia = (lista: Fatura[]): RelatorioMetrica[] => {
    const vencidas = lista.filter((f) => {
      if ([StatusFatura.PAGA, StatusFatura.CANCELADA].includes(f.status)) return false;
      return calcularDiasAtraso(f.dataVencimento) > 0;
    });

    const totalVencido = vencidas.reduce((acc, f) => acc + converterParaNumero(f.valorTotal), 0);

    const faixas = [
      { label: '1-30 dias', filtro: (dias: number) => dias >= 1 && dias <= 30 },
      { label: '31-60 dias', filtro: (dias: number) => dias >= 31 && dias <= 60 },
      { label: '61-90 dias', filtro: (dias: number) => dias >= 61 && dias <= 90 },
      { label: 'Mais de 90 dias', filtro: (dias: number) => dias > 90 },
    ];

    return faixas.map((faixa, index) => {
      const valor = vencidas
        .filter((f) => faixa.filtro(calcularDiasAtraso(f.dataVencimento)))
        .reduce((acc, f) => acc + converterParaNumero(f.valorTotal), 0);

      return {
        label: faixa.label,
        valor,
        percentual: totalVencido > 0 ? (valor / totalVencido) * 100 : 0,
        cor: CORES_PADRAO[index % CORES_PADRAO.length],
      };
    });
  };

  const processarClientes = (lista: Fatura[]): RelatorioMetrica[] => {
    const agrupado = lista.reduce(
      (acc, fatura) => {
        const cliente = fatura.cliente?.nome || `Cliente #${fatura.clienteId || 'N/A'}`;
        if (!acc[cliente]) acc[cliente] = { total: 0 };
        acc[cliente].total += converterParaNumero(fatura.valorTotal);
        return acc;
      },
      {} as Record<string, { total: number }>,
    );

    const totalGeral = Object.values(agrupado).reduce((acc, item) => acc + item.total, 0);

    return Object.entries(agrupado)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 8)
      .map(([cliente, dados], index) => ({
        label: cliente,
        valor: dados.total,
        percentual: totalGeral > 0 ? (dados.total / totalGeral) * 100 : 0,
        cor: CORES_PADRAO[index % CORES_PADRAO.length],
      }));
  };

  const processarProdutos = (lista: Fatura[]): RelatorioMetrica[] => {
    const itensAgrupados = lista
      .flatMap((fatura) => fatura.itens || [])
      .reduce(
        (acc, item) => {
          const chave = (item.descricao || item.codigoProduto || 'Item sem descricao').trim();
          if (!acc[chave]) acc[chave] = 0;

          const valorItem =
            converterParaNumero(item.valorTotal) > 0
              ? converterParaNumero(item.valorTotal)
              : converterParaNumero(item.quantidade) * converterParaNumero(item.valorUnitario);

          acc[chave] += valorItem;
          return acc;
        },
        {} as Record<string, number>,
      );

    const entries = Object.entries(itensAgrupados).sort(([, a], [, b]) => b - a);
    const totalGeral = entries.reduce((acc, [, valor]) => acc + valor, 0);

    if (!entries.length) {
      return [
        {
          label: 'Sem itens faturados no período',
          valor: 0,
          percentual: 0,
          cor: '#94A3B8',
        },
      ];
    }

    return entries.slice(0, 8).map(([nome, valor], index) => ({
      label: nome,
      valor,
      percentual: totalGeral > 0 ? (valor / totalGeral) * 100 : 0,
      cor: CORES_PADRAO[index % CORES_PADRAO.length],
    }));
  };

  const processarDados = () => {
    const faturasFiltradas = filtrarPorPeriodo(faturas, periodoSelecionado);

    if (tipoRelatorio === 'faturamento') {
      setDadosProcessados(processarFaturamento(faturasFiltradas));
      return;
    }
    if (tipoRelatorio === 'inadimplencia') {
      setDadosProcessados(processarInadimplencia(faturasFiltradas));
      return;
    }
    if (tipoRelatorio === 'clientes') {
      setDadosProcessados(processarClientes(faturasFiltradas));
      return;
    }

    setDadosProcessados(processarProdutos(faturasFiltradas));
  };

  useEffect(() => {
    processarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faturas, periodoSelecionado, tipoRelatorio]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#D4E2E7] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#244455]">Período</label>
              <select
                value={periodoSelecionado}
                onChange={(e) => setPeriodoSelecionado(e.target.value as PeriodoRelatorio)}
                className="rounded-lg border border-[#D4E2E7] px-3 py-2 text-sm text-[#244455] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
              >
                <option value="7dias">Últimos 7 dias</option>
                <option value="30dias">Últimos 30 dias</option>
                <option value="90dias">Últimos 90 dias</option>
                <option value="1ano">Último ano</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#244455]">Tipo de relatório</label>
              <select
                value={tipoRelatorio}
                onChange={(e) => setTipoRelatorio(e.target.value as TipoRelatorio)}
                className="rounded-lg border border-[#D4E2E7] px-3 py-2 text-sm text-[#244455] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
              >
                <option value="faturamento">Faturamento por status</option>
                <option value="inadimplencia">Inadimplência</option>
                <option value="clientes">Top clientes</option>
                <option value="produtos">Produtos/serviços</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={processarDados}
              className="px-4 py-2 bg-[#159A9C] text-white rounded-md hover:bg-[#117C7E] flex items-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
            <button
              onClick={() => onExportar('csv')}
              className="px-4 py-2 bg-white border border-[#D4E2E7] text-[#244455] rounded-md hover:bg-[#F6FAFB] flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
            <button
              onClick={() => onExportar('excel')}
              className="px-4 py-2 bg-white border border-[#D4E2E7] text-[#244455] rounded-md hover:bg-[#F6FAFB] flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Exportar Excel
            </button>
            <button
              onClick={() => onExportar('pdf')}
              className="px-4 py-2 bg-white border border-[#D4E2E7] text-[#244455] rounded-md hover:bg-[#F6FAFB] flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#D4E2E7] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-[#159A9C]" />
          <h3 className="text-lg font-medium text-[#002333]">Distribuição ({tipoRelatorio})</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="relative">
            <div className="w-64 h-64 mx-auto relative">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                {dadosProcessados.map((item, index) => {
                  const offset = dadosProcessados
                    .slice(0, index)
                    .reduce((acc, prev) => acc + prev.percentual, 0);

                  return (
                    <circle
                      key={item.label}
                      cx="50"
                      cy="50"
                      r="25"
                      fill="none"
                      stroke={item.cor}
                      strokeWidth="10"
                      strokeDasharray={`${item.percentual * 1.57} 157`}
                      strokeDashoffset={-offset * 1.57}
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{dadosProcessados.length}</div>
                  <div className="text-sm text-gray-500">Categorias</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {dadosProcessados.map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: item.cor }} />
                  <span className="text-sm font-medium text-gray-900">{item.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">{formatarValorCompletoBRL(item.valor)}</div>
                  <div className="text-xs text-gray-500">{item.percentual.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#D4E2E7] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#E8F6F6] rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-[#159A9C]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatarValorCompletoBRL(dadosProcessados.reduce((acc, item) => acc + item.valor, 0))}
              </div>
              <div className="text-sm text-gray-500">Total do período</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#D4E2E7] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{dadosProcessados.length}</div>
              <div className="text-sm text-gray-500">Categorias</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#D4E2E7] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {periodoSelecionado === '7dias'
                  ? '7'
                  : periodoSelecionado === '30dias'
                    ? '30'
                    : periodoSelecionado === '90dias'
                      ? '90'
                      : '365'}
              </div>
              <div className="text-sm text-gray-500">Dias analisados</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
