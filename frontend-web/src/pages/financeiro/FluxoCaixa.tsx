import React, { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Calendar, Filter } from 'lucide-react';

const FluxoCaixa: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  return (
    <div className="space-y-6">
      {/* Header da Página */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fluxo de Caixa</h1>
              <p className="text-gray-600">Acompanhamento de entradas e saídas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="12m">Últimos 12 meses</option>
            </select>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Resumo Atual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Saldo Atual</p>
              <p className="text-3xl font-bold text-blue-600">R$ 45.230,00</p>
              <p className="text-xs text-gray-500 mt-1">Última atualização: hoje</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Entradas (30d)</p>
              <p className="text-3xl font-bold text-green-600">R$ 125.430,00</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +12.5% vs mês anterior
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Saídas (30d)</p>
              <p className="text-3xl font-bold text-red-600">R$ 87.650,00</p>
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                +3.2% vs mês anterior
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Fluxo */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Evolução do Fluxo</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Entradas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Saídas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Saldo</span>
            </div>
          </div>
        </div>
        
        {/* Placeholder para gráfico */}
        <div className="h-80 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Gráfico de fluxo de caixa</p>
            <p className="text-sm text-gray-400">Integração com biblioteca de gráficos</p>
          </div>
        </div>
      </div>

      {/* Movimento Recente */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Movimentações Recentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saldo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  19/07/2025
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  Pagamento NF-001 - João Silva
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Recebimento
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Entrada
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600 font-medium">
                  +R$ 2.500,00
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                  R$ 45.230,00
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  18/07/2025
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  Pagamento Fornecedor - Tech Solutions
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Fornecedores
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    Saída
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600 font-medium">
                  -R$ 3.800,00
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                  R$ 42.730,00
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  17/07/2025
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  Transferência entre contas
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Transferência
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    Interno
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-blue-600 font-medium">
                  R$ 0,00
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                  R$ 46.530,00
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Projeção */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Projeção dos Próximos 30 Dias</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Entradas Previstas</p>
            <p className="text-xl font-bold text-green-600">R$ 86.380,00</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Saídas Previstas</p>
            <p className="text-xl font-bold text-red-600">R$ 66.850,00</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Saldo Projetado</p>
            <p className="text-xl font-bold text-blue-600">R$ 64.760,00</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FluxoCaixa;
