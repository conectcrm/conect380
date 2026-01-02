import React, { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { KPICard } from '../../components/common/KPICard';
import {
  Settings,
  CheckSquare,
  Clock,
  AlertTriangle,
  Users,
  FileText,
  TrendingUp,
  Activity,
  Target,
  Calendar,
  Bell,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Zap,
  Timer,
  UserCheck,
  ClipboardList,
} from 'lucide-react';

const OperacionalDashboard: React.FC = () => {
  const { t } = useI18n();
  const { currentPalette } = useTheme();

  // Dados simulados operacionais
  const operacionalData = {
    tickets: {
      abertos: 42,
      emAndamento: 18,
      resolvidos: 156,
      vencidos: 3,
    },
    sla: {
      cumprimento: 92.5,
      tempoMedioResposta: 2.3, // horas
      tempoMedioResolucao: 8.7, // horas
      meta: 95,
    },
    processos: {
      automatizados: 78,
      manuais: 22,
      eficiencia: 87.3,
    },
    equipe: {
      online: 12,
      ocupados: 8,
      disponiveis: 4,
      ausentes: 2,
    },
  };

  const ticketsUrgentes = [
    {
      id: 'T001',
      titulo: 'Sistema de cobrança offline',
      cliente: 'Tech Solutions',
      prioridade: 'critica',
      tempo: '2h atrasado',
      responsavel: 'Carlos Santos',
    },
    {
      id: 'T002',
      titulo: 'Integração API falhando',
      cliente: 'StartUp Growth',
      prioridade: 'alta',
      tempo: '1h restante',
      responsavel: 'Ana Silva',
    },
    {
      id: 'T003',
      titulo: 'Relatório não gerado',
      cliente: 'Digital Pro',
      prioridade: 'media',
      tempo: '4h restantes',
      responsavel: 'João Oliveira',
    },
  ];

  const processosAtivos = [
    {
      id: 'P001',
      nome: 'Onboarding novo cliente',
      progresso: 75,
      etapa: '3 de 4',
      responsavel: 'Maria Costa',
      prazo: '2 dias',
    },
    {
      id: 'P002',
      nome: 'Migração de dados',
      progresso: 45,
      etapa: '2 de 5',
      responsavel: 'Pedro Alves',
      prazo: '5 dias',
    },
    {
      id: 'P003',
      nome: 'Auditoria de segurança',
      progresso: 90,
      etapa: '4 de 4',
      responsavel: 'Laura Santos',
      prazo: '1 dia',
    },
  ];

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'critica':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'alta':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baixa':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header Operacional - Design Suave */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center text-orange-900">
                <Settings className="h-8 w-8 mr-3 text-orange-600" />
                Dashboard Operacional
              </h1>
              <p className="mt-2 text-orange-700">Gestão de processos, tickets e SLA</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-900">
                  {operacionalData.sla.cumprimento}%
                </div>
                <div className="text-sm text-orange-600">SLA</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-900">
                  {operacionalData.tickets.abertos}
                </div>
                <div className="text-sm text-orange-600">Tickets Abertos</div>
              </div>
              <button className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg transition-colors flex items-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>Atualizar</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPIs Operacionais */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Tickets Abertos */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600">
                  Tickets Abertos
                </h3>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {operacionalData.tickets.abertos}
                </div>
                <div className="text-sm text-gray-500">
                  {operacionalData.tickets.emAndamento} em andamento
                </div>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <div className="flex items-center text-sm text-red-600">
              <ArrowUp className="w-4 h-4 mr-1" />
              <span>{operacionalData.tickets.vencidos} vencidos</span>
            </div>
          </div>

          {/* SLA Performance */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600">
                  Cumprimento SLA
                </h3>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {operacionalData.sla.cumprimento}%
                </div>
                <div className="text-sm text-gray-500">Meta: {operacionalData.sla.meta}%</div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Timer className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center text-sm text-blue-600">
              <Target className="w-4 h-4 mr-1" />
              <span>Resp: {operacionalData.sla.tempoMedioResposta}h</span>
            </div>
          </div>

          {/* Processos Automatizados */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600">
                  Automação
                </h3>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {operacionalData.processos.automatizados}%
                </div>
                <div className="text-sm text-gray-500">
                  {operacionalData.processos.manuais}% manuais
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Eficiência: {operacionalData.processos.eficiencia}%</span>
            </div>
          </div>

          {/* Equipe Status */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600">
                  Equipe Online
                </h3>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {operacionalData.equipe.online}
                </div>
                <div className="text-sm text-gray-500">
                  {operacionalData.equipe.disponiveis} disponíveis
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center text-sm text-purple-600">
              <UserCheck className="w-4 h-4 mr-1" />
              <span>{operacionalData.equipe.ocupados} ocupados</span>
            </div>
          </div>
        </div>

        {/* Tickets Urgentes e Processos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Tickets Urgentes */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tickets Urgentes</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Ver todos
              </button>
            </div>
            <div className="space-y-4">
              {ticketsUrgentes.map((ticket) => (
                <div key={ticket.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{ticket.titulo}</span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(ticket.prioridade)}`}
                        >
                          {ticket.prioridade.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">Cliente: {ticket.cliente}</div>
                      <div className="text-sm text-gray-600">Responsável: {ticket.responsavel}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">#{ticket.id}</div>
                      <div className="text-xs text-gray-500">{ticket.tempo}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Processos em Andamento */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Processos em Andamento</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Ver todos
              </button>
            </div>
            <div className="space-y-4">
              {processosAtivos.map((processo) => (
                <div key={processo.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-gray-900 mb-1">{processo.nome}</div>
                      <div className="text-sm text-gray-600">
                        Responsável: {processo.responsavel}
                      </div>
                      <div className="text-sm text-gray-600">Prazo: {processo.prazo}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{processo.progresso}%</div>
                      <div className="text-xs text-gray-500">Etapa {processo.etapa}</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${processo.progresso}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Métricas Detalhadas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <KPICard
            title="Tickets Resolvidos"
            value={operacionalData.tickets.resolvidos}
            icon={<CheckSquare size={24} />}
            trend={{
              value: 12,
              isPositive: true,
              label: 'vs semana anterior',
            }}
          />

          <KPICard
            title="Tempo Médio Resolução"
            value={`${operacionalData.sla.tempoMedioResolucao}h`}
            icon={<Clock size={24} />}
            trend={{
              value: 5,
              isPositive: false,
              label: 'vs semana anterior',
            }}
          />

          <KPICard
            title="Eficiência Operacional"
            value={`${operacionalData.processos.eficiencia}%`}
            icon={<Activity size={24} />}
            trend={{
              value: 3,
              isPositive: true,
              label: 'vs mês anterior',
            }}
          />

          <KPICard
            title="Satisfação Interna"
            value="4.2/5"
            icon={<Target size={24} />}
            trend={{
              value: 0.3,
              isPositive: true,
              label: 'vs mês anterior',
            }}
          />
        </div>

        {/* Status da Equipe */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status da Equipe Operacional</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {operacionalData.equipe.disponiveis}
              </div>
              <div className="text-sm text-gray-600">Disponíveis</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {operacionalData.equipe.ocupados}
              </div>
              <div className="text-sm text-gray-600">Ocupados</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {operacionalData.equipe.ausentes}
              </div>
              <div className="text-sm text-gray-600">Ausentes</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {operacionalData.equipe.online}
              </div>
              <div className="text-sm text-gray-600">Total Online</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperacionalDashboard;
