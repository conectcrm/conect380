import React from 'react';
import {
  Clock,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface ResumoFinanceiro {
  totalVencendoHoje: number;
  quantidadeVencendoHoje: number;
  totalMes: number;
  quantidadeMes: number;
  totalAtrasado: number;
  quantidadeAtrasado: number;
  totalPagoMes: number;
  quantidadePagoMes: number;
}

interface ResumoCardsProps {
  resumo: ResumoFinanceiro;
}

interface CardProps {
  title: string;
  value: string;
  count: number;
  icon: React.ReactNode;
  colorClass: string;
  trend?: string;
}

const Card: React.FC<CardProps> = ({ title, value, count, icon, colorClass, trend }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg ${colorClass}`}>
            {icon}
          </div>
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</h3>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">
            {count} {count === 1 ? 'conta' : 'contas'}
          </p>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600 font-medium">{trend}</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

export const ResumoCards: React.FC<ResumoCardsProps> = ({ resumo }) => {
  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Vencendo Hoje */}
      <Card
        title="Vencendo Hoje"
        value={formatMoney(resumo.totalVencendoHoje)}
        count={resumo.quantidadeVencendoHoje}
        icon={<Clock className="w-5 h-5 text-orange-600" />}
        colorClass="bg-orange-100"
        trend={resumo.quantidadeVencendoHoje === 0 ? "Em dia!" : undefined}
      />

      {/* Em Atraso */}
      <Card
        title="Em Atraso"
        value={formatMoney(resumo.totalAtrasado)}
        count={resumo.quantidadeAtrasado}
        icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
        colorClass="bg-red-100"
      />

      {/* Total do Mês */}
      <Card
        title="Total do Mês"
        value={formatMoney(resumo.totalMes)}
        count={resumo.quantidadeMes}
        icon={<DollarSign className="w-5 h-5 text-blue-600" />}
        colorClass="bg-blue-100"
      />

      {/* Pago no Mês */}
      <Card
        title="Pago no Mês"
        value={formatMoney(resumo.totalPagoMes)}
        count={resumo.quantidadePagoMes}
        icon={<CheckCircle className="w-5 h-5 text-green-600" />}
        colorClass="bg-green-100"
        trend={`${Math.round((resumo.totalPagoMes / resumo.totalMes) * 100)}% do total`}
      />
    </div>
  );
};

export default ResumoCards;
