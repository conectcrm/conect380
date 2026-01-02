/**
 * 📊 Chart Components - Componentes de gráficos para o Dashboard
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';

// Cores do sistema
const COLORS = {
  primary: '#159A9C',
  secondary: '#138A8C',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  purple: '#8B5CF6',
  orange: '#F97316',
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.info,
  COLORS.purple,
  COLORS.orange,
  COLORS.error,
];

// Interfaces para props dos componentes
interface VendasData {
  mes: string;
  valor: number;
  meta: number;
}

interface PropostasData {
  status: string;
  valor: number;
  color: string;
}

interface FunilData {
  etapa: string;
  quantidade: number;
  valor: number;
}

interface VendedorData {
  nome: string;
  vendas: number;
  valor: number;
}

interface AtividadesData {
  mes: string;
  reunioes: number;
  ligacoes: number;
  emails: number;
}

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50">
    <p className="text-sm font-medium text-gray-500">{message}</p>
  </div>
);

const hasData = <T,>(data?: T[]): data is T[] => Array.isArray(data) && data.length > 0;

// Componente de gráfico de vendas (Barras)
export const VendasChart: React.FC<{ data?: VendasData[] }> = ({ data }) => {
  const chartData = hasData(data) ? data : [];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Vendas vs Meta Mensal</h3>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `R$ ${value.toLocaleString('pt-BR')}`,
                name === 'valor' ? 'Vendas' : 'Meta',
              ]}
              labelStyle={{ color: '#374151' }}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="valor" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
            <Bar dataKey="meta" fill={COLORS.warning} radius={[4, 4, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState message="Sem dados de vendas para o período selecionado." />
      )}
    </div>
  );
};

// Componente de gráfico de propostas (Pizza)
export const PropostasChart: React.FC<{ data?: PropostasData[] }> = ({ data }) => {
  const chartData = hasData(data) ? data : [];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Status das Propostas</h3>

      {chartData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="valor"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value}%`, 'Percentual']}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legenda personalizada */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600">
                  {item.status} ({item.valor}%)
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState message="Sem dados de status de propostas." />
      )}
    </div>
  );
};

// Componente de funil de vendas
export const FunnelChart: React.FC<{ data?: FunilData[] }> = ({ data }) => {
  const chartData = hasData(data) ? data : [];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Funil de Vendas</h3>

      {chartData.length > 0 ? (
        <div className="space-y-3">
          {chartData.map((etapa, index) => {
            const maxQuantidade = Math.max(...chartData.map((entrada) => entrada.quantidade)) || 1;
            const porcentagem = (etapa.quantidade / maxQuantidade) * 100;

            return (
              <div key={etapa.etapa} className="relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-900">{etapa.etapa}</span>
                  <span className="text-sm text-gray-600">{etapa.quantidade} leads</span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(porcentagem, 100)}%`,
                      backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />
                </div>

                <div className="text-xs text-gray-500 mt-1">
                  R$ {etapa.valor.toLocaleString('pt-BR')} em oportunidades
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState message="Sem dados do funil de vendas." />
      )}
    </div>
  );
};

// Componente de vendas por vendedor
export const VendedoresChart: React.FC<{ data?: VendedorData[] }> = ({ data }) => {
  const chartData = hasData(data) ? data : [];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Performance dos Vendedores</h3>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              type="number"
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <YAxis type="category" dataKey="nome" stroke="#6b7280" fontSize={12} width={80} />
            <Tooltip
              formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Vendas']}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="valor" fill={COLORS.success} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState message="Nenhum vendedor com dados no período." />
      )}
    </div>
  );
};

// Componente de atividades mensais (Área)
export const AtividadesChart: React.FC<{ data?: AtividadesData[] }> = ({ data }) => {
  const chartData = hasData(data) ? data : [];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Atividades Mensais</h3>

      {chartData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="reunioes"
                stackId="1"
                stroke={COLORS.primary}
                fill={COLORS.primary}
                fillOpacity={0.8}
              />
              <Area
                type="monotone"
                dataKey="ligacoes"
                stackId="1"
                stroke={COLORS.success}
                fill={COLORS.success}
                fillOpacity={0.8}
              />
              <Area
                type="monotone"
                dataKey="emails"
                stackId="1"
                stroke={COLORS.info}
                fill={COLORS.info}
                fillOpacity={0.8}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Legenda */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }} />
              <span className="text-sm text-gray-600">Reuniões</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.success }} />
              <span className="text-sm text-gray-600">Ligações</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.info }} />
              <span className="text-sm text-gray-600">E-mails</span>
            </div>
          </div>
        </>
      ) : (
        <EmptyState message="Sem atividades registradas recentemente." />
      )}
    </div>
  );
};
