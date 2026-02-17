import React from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { KPICard } from '../../components/common/KPICard';
import {
  HeadphonesIcon,
  MessageSquare,
  Clock,
  CheckSquare,
  Star,
  Users,
  Phone,
  Mail,
  AlertTriangle,
  TrendingUp,
  ArrowUp,
} from 'lucide-react';

const SuporteDashboard: React.FC = () => {
  const { t } = useI18n();
  const { currentPalette } = useTheme();

  // Dados simulados de suporte
  const suporteData = {
    tickets: {
      abertos: 18,
      resolvidos: 142,
      pendentes: 7,
      satisfacao: 4.6,
    },
    atendimento: {
      tempoMedio: 12,
      primeiroContato: 3,
      resolucao: 24,
      sla: 96.5,
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header Suporte - Design Suave */}
        <div className="bg-white border border-[#DEEFE7] rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center text-[#002333]">
                <HeadphonesIcon className="h-8 w-8 mr-3 text-[#159A9C]" />
                Dashboard de Suporte
              </h1>
              <p className="mt-2 text-[#002333]/70">Atendimento ao cliente e gestão de tickets</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#002333]">
                  {suporteData.tickets.abertos}
                </div>
                <div className="text-sm text-[#002333]/70">Tickets Abertos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#002333]">
                  {suporteData.tickets.satisfacao}
                </div>
                <div className="text-sm text-[#002333]/70">Satisfação</div>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs Suporte */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <KPICard
            title="Tickets Resolvidos"
            value={suporteData.tickets.resolvidos}
            icon={<CheckSquare size={24} />}
            trend={{
              value: 12,
              isPositive: true,
              label: 'vs semana anterior',
            }}
          />

          <KPICard
            title="Tempo Médio Resposta"
            value={`${suporteData.atendimento.tempoMedio}min`}
            icon={<Clock size={24} />}
            trend={{
              value: 5,
              isPositive: false,
              label: 'vs semana anterior',
            }}
          />

          <KPICard
            title="Satisfação Cliente"
            value={`${suporteData.tickets.satisfacao}/5`}
            icon={<Star size={24} />}
            trend={{
              value: 0.2,
              isPositive: true,
              label: 'vs mês anterior',
            }}
          />

          <KPICard
            title="SLA Cumprimento"
            value={`${suporteData.atendimento.sla}%`}
            icon={<TrendingUp size={24} />}
            trend={{
              value: 2,
              isPositive: true,
              label: 'vs mês anterior',
            }}
          />
        </div>

        {/* Placeholder para futuras implementações */}
        <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm text-center">
          <HeadphonesIcon className="w-16 h-16 text-[#159A9C] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Dashboard de Suporte em Desenvolvimento
          </h3>
          <p className="text-gray-600 mb-4">
            Este dashboard será expandido com funcionalidades completas de atendimento ao cliente.
          </p>
          <div className="text-sm text-gray-500">
            Funcionalidades planejadas: Chat ao vivo, Base de conhecimento, Análise de satisfação,
            Relatórios de performance
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuporteDashboard;
