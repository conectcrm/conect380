import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Fatura, StatusFatura } from '../../services/faturamentoService';
import { formatarValorCompletoBRL, converterParaNumero } from '../../utils/formatacao';

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

export default function RelatoriosAvancados({ faturas, onExportar }: RelatoriosAvancadosProps) {
  const [periodoSelecionado, setPeriodoSelecionado] = useState<
    '7dias' | '30dias' | '90dias' | '1ano'
  >('30dias');
  const [tipoRelatorio, setTipoRelatorio] = useState<
    'faturamento' | 'inadimplencia' | 'clientes' | 'produtos'
  >('faturamento');
  const [dadosProcessados, setDadosProcessados] = useState<RelatorioMetrica[]>([]);

  // Filtra faturas por período
  const filtrarPorPeriodo = (faturas: Fatura[], periodo: string) => {
    const hoje = new Date();
    const dataLimite = new Date();

    switch (periodo) {
      case '7dias':
        dataLimite.setDate(hoje.getDate() - 7);
        break;
      case '30dias':
        dataLimite.setDate(hoje.getDate() - 30);
        break;
      case '90dias':
        dataLimite.setDate(hoje.getDate() - 90);
        break;
      case '1ano':
        dataLimite.setFullYear(hoje.getFullYear() - 1);
        break;
    }

    return faturas.filter((fatura) => {
      const dataFatura = new Date(fatura.dataEmissao);
      return dataFatura >= dataLimite;
    });
  };

  // Processa dados baseado no tipo de relatório
  const processarDados = () => {
    const faturasFiltradas = filtrarPorPeriodo(faturas, periodoSelecionado);
    let dados: RelatorioMetrica[] = [];

    switch (tipoRelatorio) {
      case 'faturamento':
        dados = processarFaturamento(faturasFiltradas);
        break;
      case 'inadimplencia':
        dados = processarInadimplencia(faturasFiltradas);
        break;
      case 'clientes':
        dados = processarClientes(faturasFiltradas);
        break;
      case 'produtos':
        dados = processarProdutos(faturasFiltradas);
        break;
    }

    setDadosProcessados(dados);
  };

  const processarFaturamento = (faturas: Fatura[]): RelatorioMetrica[] => {
    const totalGeral = faturas.reduce((acc, f) => acc + converterParaNumero(f.valorTotal), 0);

    const agrupado = faturas.reduce(
      (acc, fatura) => {
        const status = fatura.status;
        if (!acc[status]) {
          acc[status] = { total: 0, count: 0 };
        }
        acc[status].total += converterParaNumero(fatura.valorTotal);
        acc[status].count++;
        return acc;
      },
      {} as Record<string, { total: number; count: number }>,
    );

    const cores = {
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
      cor: cores[status as StatusFatura] || '#8B5CF6',
    }));
  };

  const processarInadimplencia = (faturas: Fatura[]): RelatorioMetrica[] => {
    const hoje = new Date();
    const vencidas = faturas.filter((f) => {
      const dataVencimento = new Date(f.dataVencimento);
      return dataVencimento < hoje && f.status !== StatusFatura.PAGA;
    });

    const totalVencido = vencidas.reduce((acc, f) => acc + converterParaNumero(f.valorTotal), 0);
    const totalGeral = faturas.reduce((acc, f) => acc + converterParaNumero(f.valorTotal), 0);

    // Agrupa por faixas de atraso
    const faixas = {
      '1-30 dias': vencidas.filter((f) => getDiasAtraso(f) <= 30),
      '31-60 dias': vencidas.filter((f) => getDiasAtraso(f) > 30 && getDiasAtraso(f) <= 60),
      '61-90 dias': vencidas.filter((f) => getDiasAtraso(f) > 60 && getDiasAtraso(f) <= 90),
      'Mais de 90 dias': vencidas.filter((f) => getDiasAtraso(f) > 90),
    };

    const cores = ['#EF4444', '#F59E0B', '#8B5CF6', '#6B7280'];

    return Object.entries(faixas).map(([faixa, faturas], index) => {
      const valor = faturas.reduce((acc, f) => acc + converterParaNumero(f.valorTotal), 0);
      return {
        label: faixa,
        valor,
        percentual: totalVencido > 0 ? (valor / totalVencido) * 100 : 0,
        cor: cores[index],
      };
    });
  };

  const processarClientes = (faturas: Fatura[]): RelatorioMetrica[] => {
    const clientesAgrupados = faturas.reduce(
      (acc, fatura) => {
        const cliente = fatura.cliente?.nome || 'Cliente não informado';
        if (!acc[cliente]) {
          acc[cliente] = { total: 0, count: 0 };
        }
        acc[cliente].total += converterParaNumero(fatura.valorTotal);
        acc[cliente].count++;
        return acc;
      },
      {} as Record<string, { total: number; count: number }>,
    );

    const totalGeral = Object.values(clientesAgrupados).reduce((acc, c) => acc + c.total, 0);

    // Pega os top 5 clientes
    const topClientes = Object.entries(clientesAgrupados)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 5);

    const cores = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

    return topClientes.map(([cliente, dados], index) => ({
      label: cliente,
      valor: dados.total,
      percentual: totalGeral > 0 ? (dados.total / totalGeral) * 100 : 0,
      cor: cores[index],
    }));
  };

  const processarProdutos = (faturas: Fatura[]): RelatorioMetrica[] => {
    // Simulação de produtos - em um cenário real viria dos itens da fatura
    const produtos = [
      'Plano Básico',
      'Plano Premium',
      'Consultoria',
      'Suporte Técnico',
      'Treinamento',
    ];

    const totalGeral = faturas.reduce((acc, f) => acc + converterParaNumero(f.valorTotal), 0);
    const cores = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

    return produtos.map((produto, index) => {
      // Simulação de distribuição de produtos
      const fator = Math.random() * 0.3 + 0.1; // Entre 10% e 40%
      const valor = totalGeral * fator;

      return {
        label: produto,
        valor,
        percentual: fator * 100,
        cor: cores[index],
      };
    });
  };

  const getDiasAtraso = (fatura: Fatura): number => {
    const hoje = new Date();
    const dataVencimento = new Date(fatura.dataVencimento);
    const diffTime = hoje.getTime() - dataVencimento.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    processarDados();
  }, [faturas, periodoSelecionado, tipoRelatorio]);

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex flex-wrap gap-4">
            {/* Seletor de Período */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
              <select
                value={periodoSelecionado}
                onChange={(e) => setPeriodoSelecionado(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7dias">Últimos 7 dias</option>
                <option value="30dias">Últimos 30 dias</option>
                <option value="90dias">Últimos 90 dias</option>
                <option value="1ano">Último ano</option>
              </select>
            </div>

            {/* Seletor de Tipo de Relatório */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Relatório
              </label>
              <select
                value={tipoRelatorio}
                onChange={(e) => setTipoRelatorio(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="faturamento">Faturamento por Status</option>
                <option value="inadimplencia">Inadimplência</option>
                <option value="clientes">Top Clientes</option>
                <option value="produtos">Produtos/Serviços</option>
              </select>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2">
            <button
              onClick={processarDados}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>

            <div className="relative">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 text-sm"
                onClick={() => {
                  // Menu de exportação (simplificado)
                  onExportar('excel');
                }}
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Pizza */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Distribuição - {tipoRelatorio}</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Simulação de Gráfico de Pizza */}
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

              {/* Centro do gráfico */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{dadosProcessados.length}</div>
                  <div className="text-sm text-gray-500">Itens</div>
                </div>
              </div>
            </div>
          </div>

          {/* Legenda */}
          <div className="space-y-3">
            {dadosProcessados.map((item, index) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: item.cor }}></div>
                  <span className="text-sm font-medium text-gray-900">{item.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">
                    {formatarValorCompletoBRL(item.valor)}
                  </div>
                  <div className="text-xs text-gray-500">{item.percentual.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Métricas Resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatarValorCompletoBRL(
                  dadosProcessados.reduce((acc, item) => acc + item.valor, 0),
                )}
              </div>
              <div className="text-sm text-gray-500">Total do Período</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
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

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
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
              <div className="text-sm text-gray-500">Dias Analisados</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
