import React, { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { KPICard } from '../../components/common/KPICard';
import { useVendedorDashboard } from '../../hooks/useVendedorDashboard';
import {
  Target,
  TrendingUp,
  Users,
  Calendar,
  Phone,
  Mail,
  Clock,
  AlertTriangle,
  CheckSquare,
  Star,
  Trophy,
  Zap,
  DollarSign,
  FileText,
  UserPlus,
  ArrowUp,
  ArrowDown,
  Bell,
  RefreshCw,
  Award,
  TrendingDown,
  Activity,
  Eye,
} from 'lucide-react';

const VendedorDashboard: React.FC = () => {
  const { t } = useI18n();
  const { currentPalette } = useTheme();

  // Hook para dados reais do vendedor
  const { data, loading, error, refresh, insights } = useVendedorDashboard({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutos
  });

  // Loading state
  if (loading && !data.kpis.meta) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#159A9C] mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Carregando Dashboard</h3>
          <p className="text-gray-600">Buscando seus dados...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data.kpis.meta) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar dados</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const { kpis, propostas, agenda, leads, alertas } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header Personalizado do Vendedor - Design Suave */}
        <div className="bg-white border border-[#DEEFE7] rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center text-[#002333]">
                <Trophy className="h-8 w-8 mr-3 text-[#159A9C]" />
                Olá, Vendedor!
              </h1>
              <p className="mt-2 text-[#002333]/70">
                Você está em #{kpis.ranking?.posicao || 0} no ranking da equipe 🚀
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-col items-end">
              <div className="text-2xl font-bold text-[#002333]">{kpis.meta?.percentual || 0}%</div>
              <div className="text-sm text-[#002333]/70">da meta mensal</div>
              <div className="w-32 bg-[#DEEFE7] rounded-full h-2 mt-2">
                <div
                  className="bg-[#159A9C] h-2 rounded-full transition-all"
                  style={{ width: `${kpis.meta?.percentual || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* KPIs Pessoais */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Meta Mensal */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600">
                  Minha Meta
                </h3>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  R$ {kpis.meta?.atual?.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-gray-500">
                  de R$ {kpis.meta?.mensal?.toLocaleString() || '0'}
                </div>
              </div>
              <div className="p-3 bg-[#159A9C]/10 rounded-lg">
                <Target className="h-8 w-8 text-[#159A9C]" />
              </div>
            </div>
            <div className="flex items-center text-sm text-green-600">
              <ArrowUp className="w-4 h-4 mr-1" />
              <span>
                Faltam R$ {((kpis.meta?.mensal || 0) - (kpis.meta?.atual || 0)).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Pipeline Pessoal */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600">
                  Meu Pipeline
                </h3>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  R$ {kpis.pipeline?.valor?.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-gray-500">
                  {kpis.pipeline?.quantidade || 0} oportunidades
                </div>
              </div>
              <div className="p-3 bg-[#159A9C]/10 rounded-lg">
                <TrendingUp className="h-8 w-8 text-[#159A9C]" />
              </div>
            </div>
            <div className="flex items-center text-sm text-[#159A9C]">
              <Zap className="w-4 h-4 mr-1" />
              <span>{kpis.pipeline?.probabilidade || 0}% prob. média</span>
            </div>
          </div>

          {/* Ranking */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600">Ranking</h3>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  #{kpis.ranking?.posicao || 0}º lugar
                </div>
                <div className="text-sm text-gray-500">
                  de {kpis.ranking?.total || 0} vendedores
                </div>
              </div>
              <div className="p-3 bg-[#159A9C]/10 rounded-lg">
                <Star className="h-8 w-8 text-[#159A9C]" />
              </div>
            </div>
            <div className="flex items-center text-sm text-[#159A9C]">
              <Trophy className="w-4 h-4 mr-1" />
              <span>{kpis.ranking?.pontos || 0} pontos</span>
            </div>
          </div>

          {/* Atividades Hoje */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600">Hoje</h3>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {(kpis.atividades?.hoje?.calls || 0) +
                    (kpis.atividades?.hoje?.reunioes || 0) +
                    (kpis.atividades?.hoje?.followups || 0)}
                </div>
                <div className="text-sm text-gray-500">atividades</div>
              </div>
              <div className="p-3 bg-[#159A9C]/10 rounded-lg">
                <Calendar className="h-8 w-8 text-[#159A9C]" />
              </div>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Calls:</span>
                <span className="font-medium">{kpis.atividades?.hoje?.calls || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reuniões:</span>
                <span className="font-medium">{kpis.atividades?.hoje?.reunioes || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Follow-ups:</span>
                <span className="font-medium">{kpis.atividades?.hoje?.followups || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Minhas Propostas Ativas */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">🎯 Minhas Propostas Ativas</h3>
            <button className="text-[#159A9C] hover:text-[#0F7B7D] text-sm font-medium transition-colors">
              Ver todas (12)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Proposta 1 - Quente */}
            <div className="p-4 border border-green-200 rounded-lg bg-green-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium px-2 py-1 bg-green-600 text-white rounded">
                  🔥 QUENTE
                </span>
                <span className="text-sm font-bold text-green-700">R$ 45.000</span>
              </div>
              <h4 className="font-medium text-gray-900">Tech Solutions Ltda</h4>
              <p className="text-sm text-gray-600 mb-2">Proposta enviada há 2 dias</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-600">Prob: 85%</span>
                <button className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
                  Follow-up
                </button>
              </div>
            </div>

            {/* Proposta 2 - Morna */}
            <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium px-2 py-1 bg-yellow-600 text-white rounded">
                  🌟 MORNA
                </span>
                <span className="text-sm font-bold text-yellow-700">R$ 28.500</span>
              </div>
              <h4 className="font-medium text-gray-900">StartUp Growth</h4>
              <p className="text-sm text-gray-600 mb-2">Aguardando retorno</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-yellow-600">Prob: 60%</span>
                <button className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700">
                  Ligar
                </button>
              </div>
            </div>

            {/* Proposta 3 - Fria */}
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium px-2 py-1 bg-gray-600 text-white rounded">
                  ❄️ FRIA
                </span>
                <span className="text-sm font-bold text-gray-700">R$ 15.000</span>
              </div>
              <h4 className="font-medium text-gray-900">Digital Pro</h4>
              <p className="text-sm text-gray-600 mb-2">Primeira apresentação</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Prob: 30%</span>
                <button className="text-xs bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-800">
                  Proposta
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Agenda e To-Do */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Minha Agenda Hoje */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📅 Minha Agenda Hoje</h3>
              <span className="text-sm text-gray-500">3 compromissos</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center p-3 bg-[#159A9C]/5 rounded-lg border-l-4 border-[#159A9C]">
                <div className="p-2 bg-[#159A9C]/10 rounded-full mr-3">
                  <Phone className="w-4 h-4 text-[#159A9C]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Call - Tech Solutions</p>
                  <p className="text-sm text-gray-600">14:30 - Negociação final</p>
                </div>
                <span className="text-sm font-medium text-[#159A9C]">Em 2h</span>
              </div>

              <div className="flex items-center p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div className="p-2 bg-green-100 rounded-full mr-3">
                  <Users className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Reunião - StartUp Growth</p>
                  <p className="text-sm text-gray-600">16:00 - Apresentação</p>
                </div>
                <span className="text-sm font-medium text-green-600">Em 4h</span>
              </div>

              <div className="flex items-center p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                <div className="p-2 bg-orange-100 rounded-full mr-3">
                  <Mail className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Follow-up - Digital Pro</p>
                  <p className="text-sm text-gray-600">17:30 - Email + Liga</p>
                </div>
                <span className="text-sm font-medium text-orange-600">Em 5h</span>
              </div>
            </div>
          </div>

          {/* Leads Para Qualificar */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">🎯 Leads Para Qualificar</h3>
              <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded">5 novos</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">Inovação Digital</p>
                  <p className="text-sm text-gray-600">Site: precisa de CRM • Chegou há 2h</p>
                </div>
                <button className="text-xs bg-[#159A9C] text-white px-3 py-1 rounded hover:bg-[#0F7B7D] transition-colors">
                  Ligar
                </button>
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">Marketing Plus</p>
                  <p className="text-sm text-gray-600">WhatsApp: quer demo • Chegou há 4h</p>
                </div>
                <button className="text-xs bg-[#159A9C] text-white px-3 py-1 rounded hover:bg-[#0F7B7D] transition-colors">
                  Agendar
                </button>
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">Consultoria ABC</p>
                  <p className="text-sm text-gray-600">Form: empresa 50+ pessoas • Ontem</p>
                </div>
                <button className="text-xs bg-[#159A9C] text-white px-3 py-1 rounded hover:bg-[#0F7B7D] transition-colors">
                  Email
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Performance e Gamificação */}
        <div className="bg-white rounded-lg p-6 mb-8 border border-gray-200 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">🏆 Performance da Semana</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">42</div>
                  <div className="text-sm text-gray-600">Calls</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">12</div>
                  <div className="text-sm text-gray-600">Reuniões</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">28</div>
                  <div className="text-sm text-gray-600">Follow-ups</div>
                </div>
              </div>
            </div>

            <div className="mt-6 lg:mt-0 text-center">
              <div className="text-3xl font-bold mb-2 text-gray-900">9.2</div>
              <div className="text-sm text-gray-600 mb-3">Nota Semanal</div>
              <div className="flex items-center justify-center space-x-1 text-[#159A9C]">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={`w-5 h-5 ${i <= 4 ? 'fill-current' : 'opacity-30'}`} />
                ))}
              </div>
              <div className="text-xs mt-2 text-gray-500">Quase 5 estrelas! 🌟</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendedorDashboard;
