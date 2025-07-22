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
  AreaChart
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
  orange: '#F97316'
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.info,
  COLORS.purple,
  COLORS.orange,
  COLORS.error
];

// Dados simulados para os gráficos
export const chartData = {
  vendas: [
    { mes: 'Jan', valor: 125000, meta: 150000 },
    { mes: 'Fev', valor: 145000, meta: 150000 },
    { mes: 'Mar', valor: 165000, meta: 180000 },
    { mes: 'Abr', valor: 155000, meta: 170000 },
    { mes: 'Mai', valor: 185000, meta: 200000 },
    { mes: 'Jun', valor: 205000, meta: 220000 },
    { mes: 'Jul', valor: 195000, meta: 210000 }
  ],
  
  propostas: [
    { status: 'Em Análise', valor: 25, color: COLORS.warning },
    { status: 'Aprovadas', valor: 45, color: COLORS.success },
    { status: 'Rejeitadas', valor: 15, color: COLORS.error },
    { status: 'Aguardando', valor: 15, color: COLORS.info }
  ],
  
  funnelVendas: [
    { etapa: 'Leads', quantidade: 1250, valor: 2500000 },
    { etapa: 'Qualificados', quantidade: 750, valor: 1875000 },
    { etapa: 'Propostas', quantidade: 320, valor: 1280000 },
    { etapa: 'Negociação', quantidade: 180, valor: 900000 },
    { etapa: 'Fechamento', quantidade: 85, valor: 510000 }
  ],
  
  vendasPorVendedor: [
    { nome: 'João Silva', vendas: 15, valor: 185000 },
    { nome: 'Maria Santos', vendas: 12, valor: 165000 },
    { nome: 'Pedro Costa', vendas: 8, valor: 125000 },
    { nome: 'Ana Oliveira', vendas: 10, valor: 145000 },
    { nome: 'Carlos Lima', vendas: 6, valor: 95000 }
  ],
  
  atividadesMensais: [
    { mes: 'Jan', reunioes: 45, ligacoes: 125, emails: 280 },
    { mes: 'Fev', reunioes: 52, ligacoes: 138, emails: 295 },
    { mes: 'Mar', reunioes: 48, ligacoes: 142, emails: 310 },
    { mes: 'Abr', reunioes: 55, ligacoes: 156, emails: 285 },
    { mes: 'Mai', reunioes: 62, ligacoes: 168, emails: 320 },
    { mes: 'Jun', reunioes: 58, ligacoes: 172, emails: 295 },
    { mes: 'Jul', reunioes: 65, ligacoes: 185, emails: 340 }
  ]
};

// Componente de gráfico de vendas (Barras)
export const VendasChart: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📊 Vendas vs Meta Mensal
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData.vendas}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="mes" 
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              `R$ ${value.toLocaleString('pt-BR')}`,
              name === 'valor' ? 'Vendas' : 'Meta'
            ]}
            labelStyle={{ color: '#374151' }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Bar 
            dataKey="valor" 
            fill={COLORS.primary}
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="meta" 
            fill={COLORS.warning}
            radius={[4, 4, 0, 0]}
            opacity={0.7}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Componente de gráfico de propostas (Pizza)
export const PropostasChart: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🎯 Status das Propostas
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData.propostas}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="valor"
          >
            {chartData.propostas.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value}%`, 'Percentual']}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Legenda personalizada */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {chartData.propostas.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-600">
              {item.status} ({item.valor}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente de funil de vendas
export const FunnelChart: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📈 Funil de Vendas
      </h3>
      
      <div className="space-y-3">
        {chartData.funnelVendas.map((etapa, index) => {
          const maxQuantidade = chartData.funnelVendas[0].quantidade;
          const porcentagem = (etapa.quantidade / maxQuantidade) * 100;
          
          return (
            <div key={etapa.etapa} className="relative">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {etapa.etapa}
                </span>
                <span className="text-sm text-gray-600">
                  {etapa.quantidade} leads
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${porcentagem}%`,
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
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
    </div>
  );
};

// Componente de vendas por vendedor
export const VendedoresChart: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🏆 Performance dos Vendedores
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={chartData.vendasPorVendedor}
          layout="verseChart"
          margin={{ left: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            type="number"
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <YAxis 
            type="category"
            dataKey="nome"
            stroke="#6b7280"
            fontSize={12}
            width={80}
          />
          <Tooltip
            formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Vendas']}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Bar 
            dataKey="valor"
            fill={COLORS.success}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Componente de atividades mensais (Área)
export const AtividadesChart: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📅 Atividades Mensais
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData.atividadesMensais}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="mes" 
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
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
    </div>
  );
};
