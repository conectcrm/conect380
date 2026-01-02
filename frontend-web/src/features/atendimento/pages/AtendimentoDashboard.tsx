import React from 'react';
import { useI18n } from '../../../contexts/I18nContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { KPICard } from '../../../components/common/KPICard';
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
  Activity,
  Timer,
  UserCheck,
  BarChart3,
  Calendar,
  Target,
} from 'lucide-react';

const AtendimentoDashboard: React.FC = () => {
  const { t } = useI18n();
  const { currentPalette } = useTheme();

  // Dados simulados de atendimento
  const atendimentoData = {
    tickets: {
      abertos: 23,
      aguardandoAtendente: 8,
      emAtendimento: 15,
      resolvidosHoje: 47,
      satisfacao: 4.8,
    },
    tempo: {
      tempoMedioResposta: 4, // minutos
      tempoMedioAtendimento: 18, // minutos
      tempoMedioResolucao: 2.5, // horas
      slaAtendimento: 97.3, // %
    },
    canais: {
      whatsapp: { total: 28, porcentagem: 65 },
      chat: { total: 8, porcentagem: 18 },
      email: { total: 5, porcentagem: 12 },
      telefone: { total: 2, porcentagem: 5 },
    },
    atendentes: {
      online: 6,
      ocupados: 4,
      ausentes: 2,
      total: 12,
    },
  };

  const atendimentosRecentes = [
    {
      id: '1',
      cliente: 'Maria Silva',
      canal: 'whatsapp',
      assunto: 'Dúvida sobre cobrança',
      tempo: '5 min',
      status: 'em_atendimento',
      atendente: 'João Santos',
    },
    {
      id: '2',
      cliente: 'Carlos Oliveira',
      canal: 'chat',
      assunto: 'Suporte técnico',
      tempo: '12 min',
      status: 'aguardando',
      atendente: null,
    },
    {
      id: '3',
      cliente: 'Ana Costa',
      canal: 'email',
      assunto: 'Solicitação de cancelamento',
      tempo: '1h',
      status: 'resolvido',
      atendente: 'Maria Fernanda',
    },
    {
      id: '4',
      cliente: 'Pedro Almeida',
      canal: 'telefone',
      assunto: 'Informações sobre produto',
      tempo: '25 min',
      status: 'em_atendimento',
      atendente: 'Lucas Pereira',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'em_atendimento':
        return 'bg-blue-100 text-blue-800';
      case 'aguardando':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolvido':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'em_atendimento':
        return 'Em Atendimento';
      case 'aguardando':
        return 'Aguardando';
      case 'resolvido':
        return 'Resolvido';
      default:
        return status;
    }
  };

  const getCanalIcon = (canal: string) => {
    switch (canal) {
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'telefone':
        return <Phone className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header Atendimento */}
        <div className="bg-white border border-[#DEEFE7] rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center text-[#002333]">
                <HeadphonesIcon className="h-8 w-8 mr-3 text-[#159A9C]" />
                Dashboard de Atendimento
              </h1>
              <p className="mt-2 text-[#64748B]">
                Visão geral do atendimento omnichannel em tempo real
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#002333]">
                  {atendimentoData.tickets.abertos}
                </div>
                <div className="text-sm text-purple-600">Tickets Abertos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-900">
                  {atendimentoData.atendentes.online}
                </div>
                <div className="text-sm text-purple-600">Atendentes Online</div>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <KPICard
            title="Tickets Abertos"
            value={atendimentoData.tickets.abertos}
            icon={<MessageSquare className="h-6 w-6" />}
            trend={{
              value: 5,
              isPositive: true,
              label: 'novos hoje',
            }}
            color="blue"
          />

          <KPICard
            title="Tempo Médio de Resposta"
            value={`${atendimentoData.tempo.tempoMedioResposta} min`}
            icon={<Timer className="h-6 w-6" />}
            trend={{
              value: 2,
              isPositive: false,
              label: 'min vs ontem',
            }}
            color="green"
          />

          <KPICard
            title="Satisfação do Cliente"
            value={atendimentoData.tickets.satisfacao}
            icon={<Star className="h-6 w-6" />}
            trend={{
              value: 0.3,
              isPositive: true,
              label: 'vs mês anterior',
            }}
            color="purple"
          />

          <KPICard
            title="SLA Atendimento"
            value={`${atendimentoData.tempo.slaAtendimento}%`}
            icon={<Target className="h-6 w-6" />}
            trend={{
              value: 2.1,
              isPositive: true,
              label: '% vs mês anterior',
            }}
            color="orange"
          />
        </div>

        {/* Métricas Detalhadas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Status dos Tickets */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Status dos Tickets</h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Aguardando Atendente</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {atendimentoData.tickets.aguardandoAtendente}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Em Atendimento</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {atendimentoData.tickets.emAtendimento}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Resolvidos Hoje</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {atendimentoData.tickets.resolvidosHoje}
                </span>
              </div>
            </div>
          </div>

          {/* Canais de Atendimento */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Canais de Atendimento</h3>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              {Object.entries(atendimentoData.canais).map(([canal, dados]) => (
                <div key={canal} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 rounded-lg mr-3">{getCanalIcon(canal)}</div>
                    <span className="text-sm text-gray-600 capitalize">{canal}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">{dados.total}</span>
                    <span className="text-xs text-gray-500">({dados.porcentagem}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Atendimentos Recentes */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Atendimentos Recentes</h3>
              <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                Ver todos
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Canal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assunto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tempo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Atendente
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {atendimentosRecentes.map((atendimento) => (
                  <tr key={atendimento.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{atendimento.cliente}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-1 bg-gray-100 rounded mr-2">
                          {getCanalIcon(atendimento.canal)}
                        </div>
                        <span className="text-sm text-gray-600 capitalize">
                          {atendimento.canal}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{atendimento.assunto}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{atendimento.tempo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(atendimento.status)}`}
                      >
                        {getStatusText(atendimento.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{atendimento.atendente || '-'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtendimentoDashboard;
