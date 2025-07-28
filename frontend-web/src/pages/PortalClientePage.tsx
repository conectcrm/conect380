/**
 * Página de Gestão do Portal do Cliente
 * Central de controle e administração do portal
 */

import React, { useState } from 'react';
import {
  Globe,
  BarChart3,
  Settings,
  TestTube,
  Users,
  Eye,
  ExternalLink,
  Shield,
  Bell,
  FileText,
  Calendar,
  TrendingUp,
  Activity,
  Copy,
  Mail,
  Plus
} from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import { Link } from 'react-router-dom';

const PortalClientePage: React.FC = () => {
  console.log('DEBUG: PortalClientePage carregada');
  const [activeTab, setActiveTab] = useState('overview');

  // Dados simulados para demonstração
  const estatisticas = {
    totalAcessos: 1247,
    acessosHoje: 23,
    propostas: {
      enviadas: 156,
      visualizadas: 134,
      aceitas: 89,
      rejeitadas: 12
    },
    tempoMedioVisualizacao: '4.2 min'
  };

  const acessosRecentes = [
    {
      id: 1,
      cliente: 'João Silva Ltda',
      proposta: 'PROP-2025-001',
      dataAcesso: '2025-01-27 14:30',
      acao: 'Visualizou proposta',
      ip: '192.168.1.100'
    },
    {
      id: 2,
      cliente: 'Tech Solutions',
      proposta: 'PROP-2025-002',
      dataAcesso: '2025-01-27 13:15',
      acao: 'Aceitou proposta',
      ip: '10.0.0.45'
    },
    {
      id: 3,
      cliente: 'Marina Costa ME',
      proposta: 'PROP-2025-003',
      dataAcesso: '2025-01-27 11:20',
      acao: 'Rejeitou proposta',
      ip: '172.16.0.12'
    }
  ];

  const propostas = [
    {
      id: 'PROP-2025-001',
      cliente: 'João Silva Ltda',
      valor: 15500.00,
      status: 'Enviada',
      dataEnvio: '2025-01-25',
      acessos: 3,
      ultimoAcesso: '2025-01-27 14:30'
    },
    {
      id: 'PROP-2025-002',
      cliente: 'Tech Solutions',
      valor: 28900.00,
      status: 'Aceita',
      dataEnvio: '2025-01-24',
      acessos: 5,
      ultimoAcesso: '2025-01-27 13:15'
    },
    {
      id: 'PROP-2025-003',
      cliente: 'Marina Costa ME',
      valor: 7800.00,
      status: 'Rejeitada',
      dataEnvio: '2025-01-23',
      acessos: 2,
      ultimoAcesso: '2025-01-27 11:20'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'propostas', label: 'Propostas', icon: FileText },
    { id: 'acessos', label: 'Log de Acessos', icon: Activity },
    { id: 'configuracoes', label: 'Configurações', icon: Settings }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aceita':
        return 'bg-green-100 text-green-800';
      case 'Rejeitada':
        return 'bg-red-100 text-red-800';
      case 'Enviada':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* DEBUG: Título temporário para confirmar que a página carrega */}
      <div className="bg-red-500 text-white p-4 text-center font-bold">
        DEBUG: Portal do Cliente Carregado com Sucesso!
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <BackToNucleus
                nucleusPath="/nuclei/gestao"
                nucleusName="Gestão"
              />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] rounded-lg flex items-center justify-center">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Portal do Cliente</h1>
                  <p className="text-sm text-gray-600">Gestão e controle de acesso</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/teste-portal"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <TestTube className="h-4 w-4" />
                Testar Portal
              </Link>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Plus className="h-4 w-4" />
                Nova Proposta
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                      ? 'border-[#159A9C] text-[#159A9C]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total de Acessos</p>
                    <p className="text-2xl font-bold text-gray-900">{estatisticas.totalAcessos.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Eye className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Acessos Hoje</p>
                    <p className="text-2xl font-bold text-gray-900">{estatisticas.acessosHoje}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Taxa de Aceite</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round((estatisticas.propostas.aceitas / estatisticas.propostas.enviadas) * 100)}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                    <p className="text-2xl font-bold text-gray-900">{estatisticas.tempoMedioVisualizacao}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Atividade Recente</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {acessosRecentes.map((acesso) => (
                    <div key={acesso.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{acesso.cliente}</p>
                          <p className="text-sm text-gray-600">{acesso.acao} - {acesso.proposta}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{acesso.dataAcesso}</p>
                        <p className="text-xs text-gray-500">{acesso.ip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Propostas Tab */}
        {activeTab === 'propostas' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Propostas no Portal</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proposta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acessos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {propostas.map((proposta) => (
                    <tr key={proposta.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{proposta.id}</div>
                        <div className="text-sm text-gray-500">Enviada em {proposta.dataEnvio}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {proposta.cliente}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        R$ {proposta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(proposta.status)}`}>
                          {proposta.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{proposta.acessos} visualizações</div>
                        <div className="text-xs text-gray-500">Último: {proposta.ultimoAcesso}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <Copy className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <Mail className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Log de Acessos Tab */}
        {activeTab === 'acessos' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Log de Acessos Detalhado</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {acessosRecentes.map((acesso) => (
                  <div key={acesso.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-gray-900">{acesso.cliente}</p>
                        <p className="text-sm text-gray-600">{acesso.acao}</p>
                        <p className="text-xs text-gray-500">Proposta: {acesso.proposta}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{acesso.dataAcesso}</p>
                      <p className="text-xs text-gray-500">IP: {acesso.ip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Configurações Tab */}
        {activeTab === 'configuracoes' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Configurações do Portal</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Segurança</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Expiração automática de links</p>
                        <p className="text-sm text-gray-600">Links expiram automaticamente após o período configurado</p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="number"
                          defaultValue={30}
                          className="w-20 px-3 py-1 border border-gray-300 rounded mr-2"
                        />
                        <span className="text-sm text-gray-600">dias</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Notificações</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Notificar vendedor sobre acessos</p>
                        <p className="text-sm text-gray-600">Enviar email quando cliente acessar proposta</p>
                      </div>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Notificar sobre aceites/rejeições</p>
                        <p className="text-sm text-gray-600">Alerta imediato para decisões do cliente</p>
                      </div>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Personalização</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mensagem de boas-vindas
                      </label>
                      <textarea
                        rows={3}
                        defaultValue="Obrigado por acessar nossa proposta. Analise com cuidado e entre em contato se tiver dúvidas."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortalClientePage;
