import React from 'react';

interface TicketStatsProps {
  tickets: Array<{
    id: string;
    status: string;
    prioridade?: string;
    [key: string]: any;
  }>;
}

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color, bgColor }) => {
  return (
    <div className={`${bgColor} rounded-lg p-3 flex flex-col items-center justify-center transition-all hover:shadow-md`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-2xl font-bold ${color} mb-1`}>{value}</div>
      <div className="text-xs text-gray-600 font-medium text-center">{label}</div>
    </div>
  );
};

export const TicketStats: React.FC<TicketStatsProps> = ({ tickets }) => {
  // Calcular estatísticas
  const stats = {
    total: tickets.length,
    abertos: tickets.filter(t => t.status === 'aberto').length,
    emAtendimento: tickets.filter(t => t.status === 'em_atendimento').length,
    resolvidos: tickets.filter(t => t.status === 'resolvido').length,
  };

  return (
    <div className="bg-white border-b">
      <div className="grid grid-cols-4 gap-2 p-3">
        <StatCard
          icon="📊"
          label="Total"
          value={stats.total}
          color="text-gray-700"
          bgColor="bg-gray-50"
        />
        <StatCard
          icon="📬"
          label="Abertos"
          value={stats.abertos}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon="💬"
          label="Em Atendimento"
          value={stats.emAtendimento}
          color="text-yellow-600"
          bgColor="bg-yellow-50"
        />
        <StatCard
          icon="✅"
          label="Resolvidos"
          value={stats.resolvidos}
          color="text-green-600"
          bgColor="bg-green-50"
        />
      </div>
    </div>
  );
};
