import React, { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { KPICard } from '../../components/common/KPICard';
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard, Calendar,
  AlertTriangle, CheckSquare, Clock, FileText, PiggyBank,
  ArrowUp, ArrowDown, RefreshCw, BarChart3, Target
} from 'lucide-react';

const FinanceiroDashboard: React.FC = () => {
  const { t } = useI18n();
  const { currentPalette } = useTheme();

  // Dados simulados financeiros
  const financeiroData = {
    fluxoCaixa: {
      saldoAtual: 485000,
      entradas: 125000,
      saidas: 89000,
      projecao30dias: 521000
    },
    contasReceber: {
      total: 245000,
      vencidas: 12000,
      vencem30dias: 87000,
      inadimplencia: 2.3
    },
    contasPagar: {
      total: 156000,
      vencidas: 5000,
      vencem30dias: 45000,
      desconto: 1200
    },
    metas: {
      receitaMensal: 800000,
      receitaAtual: 625000,
      percentual: 78.1
    }
  };

  const contasVencidas = [
    {
      id: 'CR001',
      tipo: 'receber',
      cliente: 'Tech Solutions Ltda',
      valor: 15000,
      vencimento: '2025-07-28',
      dias: 7,
      status: 'vencida'
    },
    {
      id: 'CP001',
      tipo: 'pagar',
      fornecedor: 'Software Licensing Inc',
      valor: 3500,
      vencimento: '2025-08-01',
      dias: 3,
      status: 'vencida'
    },
    {
      id: 'CR002',
      tipo: 'receber',
      cliente: 'StartUp Growth Co',
      valor: 22000,
      vencimento: '2025-08-05',
      dias: 1,
      status: 'vence_hoje'
    }
  ];

  const indicadoresFinanceiros = [
    {
      titulo: 'Liquidez Corrente',
      valor: 2.45,
      sufixo: 'x',
      tendencia: 'positiva',
      descricao: 'Capacidade de pagamento'
    },
    {
      titulo: 'Margem Bruta',
      valor: 67.8,
      sufixo: '%',
      tendencia: 'positiva',
      descricao: 'Rentabilidade das vendas'
    },
    {
      titulo: 'ROI Mensal',
      valor: 18.5,
      sufixo: '%',
      tendencia: 'positiva',
      descricao: 'Retorno sobre investimento'
    },
    {
      titulo: 'Break-even',
      valor: 15,
      sufixo: ' dias',
      tendencia: 'negativa',
      descricao: 'Ponto de equilíbrio'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vencida': return 'bg-red-100 text-red-800 border-red-200';
      case 'vence_hoje': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'a_vencer': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header Financeiro - Design Suave */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center text-emerald-900">
                <DollarSign className="h-8 w-8 mr-3 text-emerald-600" />
                Dashboard Financeiro
              </h1>
              <p className="mt-2 text-emerald-700">
                Controle de fluxo de caixa e gestão financeira
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-900">{formatCurrency(financeiroData.fluxoCaixa.saldoAtual)}</div>
                <div className="text-sm text-emerald-600">Saldo Atual</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-900">{financeiroData.metas.percentual}%</div>
                <div className="text-sm text-emerald-600">Meta Mensal</div>
              </div>
              <button className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors flex items-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>Atualizar</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPIs Financeiros Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Fluxo de Caixa */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600">
                  Fluxo de Caixa
                </h3>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(financeiroData.fluxoCaixa.saldoAtual)}
                </div>
                <div className="text-sm text-gray-500">
                  Saldo atual em caixa
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <PiggyBank className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Projeção 30d: {formatCurrency(financeiroData.fluxoCaixa.projecao30dias)}</span>
            </div>
          </div>

          {/* Contas a Receber */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600">
                  Contas a Receber
                </h3>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(financeiroData.contasReceber.total)}
                </div>
                <div className="text-sm text-gray-500">
                  Total em aberto
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center text-sm text-red-600">
              <AlertTriangle className="w-4 h-4 mr-1" />
              <span>Vencidas: {formatCurrency(financeiroData.contasReceber.vencidas)}</span>
            </div>
          </div>

          {/* Contas a Pagar */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600">
                  Contas a Pagar
                </h3>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(financeiroData.contasPagar.total)}
                </div>
                <div className="text-sm text-gray-500">
                  Total em aberto
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center text-sm text-orange-600">
              <Clock className="w-4 h-4 mr-1" />
              <span>Vencem 30d: {formatCurrency(financeiroData.contasPagar.vencem30dias)}</span>
            </div>
          </div>

          {/* Meta de Receita */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600">
                  Meta Mensal
                </h3>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {financeiroData.metas.percentual}%
                </div>
                <div className="text-sm text-gray-500">
                  {formatCurrency(financeiroData.metas.receitaAtual)} de {formatCurrency(financeiroData.metas.receitaMensal)}
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${financeiroData.metas.percentual}%` }}
              />
            </div>
          </div>
        </div>

        {/* Contas Vencidas e Indicadores */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Contas Críticas */}
          <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Contas Críticas</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Ver todas
              </button>
            </div>
            <div className="space-y-4">
              {contasVencidas.map((conta) => (
                <div key={conta.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {conta.tipo === 'receber' ? conta.cliente : conta.fornecedor}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(conta.status)}`}>
                          {conta.status === 'vencida' ? 'VENCIDA' : 'VENCE HOJE'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Vencimento: {new Date(conta.vencimento).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {conta.dias > 0 ? `${conta.dias} dias em atraso` : 'Vence hoje'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(conta.valor)}
                      </div>
                      <div className="text-xs text-gray-500">#{conta.id}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Indicadores Financeiros */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Indicadores</h3>
            <div className="space-y-4">
              {indicadoresFinanceiros.map((indicador, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {indicador.titulo}
                    </span>
                    {indicador.tendencia === 'positiva' ? (
                      <ArrowUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {indicador.valor}{indicador.sufixo}
                  </div>
                  <div className="text-xs text-gray-500">
                    {indicador.descricao}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KPIs Secundários */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <KPICard
            title="Entradas do Mês"
            value={formatCurrency(financeiroData.fluxoCaixa.entradas)}
            icon={<TrendingUp size={24} />}
            trend={{
              value: 8,
              isPositive: true,
              label: "vs mês anterior"
            }}
          />

          <KPICard
            title="Saídas do Mês"
            value={formatCurrency(financeiroData.fluxoCaixa.saidas)}
            icon={<TrendingDown size={24} />}
            trend={{
              value: 3,
              isPositive: false,
              label: "vs mês anterior"
            }}
          />

          <KPICard
            title="Taxa Inadimplência"
            value={`${financeiroData.contasReceber.inadimplencia}%`}
            icon={<AlertTriangle size={24} />}
            trend={{
              value: 0.5,
              isPositive: false,
              label: "vs mês anterior"
            }}
          />

          <KPICard
            title="Descontos Obtidos"
            value={formatCurrency(financeiroData.contasPagar.desconto)}
            icon={<CheckSquare size={24} />}
            trend={{
              value: 15,
              isPositive: true,
              label: "vs mês anterior"
            }}
          />
        </div>

        {/* Resumo do Fluxo de Caixa */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Fluxo de Caixa</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(financeiroData.fluxoCaixa.entradas)}
              </div>
              <div className="text-sm text-gray-600">Entradas do Mês</div>
              <div className="text-xs text-green-600 mt-1">+8% vs anterior</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(financeiroData.fluxoCaixa.saidas)}
              </div>
              <div className="text-sm text-gray-600">Saídas do Mês</div>
              <div className="text-xs text-red-600 mt-1">+3% vs anterior</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(financeiroData.fluxoCaixa.entradas - financeiroData.fluxoCaixa.saidas)}
              </div>
              <div className="text-sm text-gray-600">Resultado Líquido</div>
              <div className="text-xs text-blue-600 mt-1">+{((financeiroData.fluxoCaixa.entradas - financeiroData.fluxoCaixa.saidas) / financeiroData.fluxoCaixa.saidas * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceiroDashboard;
