import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useEmpresas } from '../../contexts/EmpresaContextAPIReal';
import { ModalNovaEmpresa } from './components/ModalNovaEmpresa';
import {
  Building2,
  Plus,
  Settings,
  Users,
  BarChart3,
  Calendar,
  CreditCard,
  Shield,
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Edit3,
  Eye,
  MoreVertical,
  Zap,
  Target,
  ChevronRight,
  Crown,
  Activity,
} from 'lucide-react';

export const MinhasEmpresasPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { empresas, empresaAtiva, loading, switchEmpresa } = useEmpresas();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddEmpresa, setShowAddEmpresa] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa':
        return 'text-green-600 bg-green-100';
      case 'trial':
        return 'text-yellow-600 bg-yellow-100';
      case 'suspensa':
        return 'text-orange-600 bg-orange-100';
      case 'inativa':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativa':
        return <CheckCircle className="w-4 h-4" />;
      case 'trial':
        return <Clock className="w-4 h-4" />;
      case 'suspensa':
        return <AlertCircle className="w-4 h-4" />;
      case 'inativa':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPlanoBadge = (plano: string) => {
    switch (plano) {
      case 'Enterprise':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
            <Crown className="w-3 h-3" />
            Enterprise
          </span>
        );
      case 'Professional':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <Star className="w-3 h-3" />
            Professional
          </span>
        );
      case 'Starter':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <Zap className="w-3 h-3" />
            Starter
          </span>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const handleSwitchEmpresa = async (empresaId: string) => {
    try {
      await switchEmpresa(empresaId);

      // Navegar de volta para o dashboard após um delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      // Erro já é tratado no contexto
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#159A9C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando suas empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Minhas Empresas</h1>
                  <p className="text-sm text-gray-600">Gerencie e alterne entre suas empresas</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Lista
                </button>
              </div>

              <button
                onClick={() => setShowAddEmpresa(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#159A9C] text-white font-medium rounded-lg hover:bg-[#0F7B7D] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nova Empresa
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{empresas.length}</p>
                <p className="text-sm text-gray-600">Empresas Cadastradas</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {empresas.filter((e) => e.status === 'ativa').length}
                </p>
                <p className="text-sm text-gray-600">Empresas Ativas</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {empresas.length * 15} {/* Mock simples */}
                </p>
                <p className="text-sm text-gray-600">Usuários Ativos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(empresas.reduce((total, e) => total + e.plano.preco, 0))}
                </p>
                <p className="text-sm text-gray-600">Valor Mensal Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Empresas */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {empresas.map((empresa) => (
              <div
                key={empresa.id}
                className={`bg-white rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                  empresa.isActive
                    ? 'border-[#159A9C] shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Header do Card */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                          empresa.plano.nome === 'Enterprise'
                            ? 'bg-purple-500'
                            : empresa.plano.nome === 'Professional'
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                        }`}
                      >
                        {empresa.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {empresa.nome}
                        </h3>
                        <p className="text-sm text-gray-600">{empresa.cnpj}</p>
                      </div>
                    </div>
                    {empresa.isActive && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-[#159A9C]/10 text-[#159A9C] rounded-full text-xs font-medium">
                        <Activity className="w-3 h-3" />
                        Ativa
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(empresa.status)}`}
                    >
                      {getStatusIcon(empresa.status)}
                      {empresa.status.charAt(0).toUpperCase() + empresa.status.slice(1)}
                    </div>
                    {getPlanoBadge(empresa.plano.nome)}
                  </div>
                </div>

                {/* Estatísticas Rápidas */}
                <div className="p-6 border-b border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900">
                        {Math.floor(Math.random() * 50) + 10}
                      </p>
                      <p className="text-xs text-gray-600">Usuários Ativos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900">
                        {Math.floor(Math.random() * 500) + 100}
                      </p>
                      <p className="text-xs text-gray-600">Clientes</p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Próximo vencimento:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(empresa.dataVencimento)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-3">
                    {!empresa.isActive ? (
                      <button
                        onClick={() => handleSwitchEmpresa(empresa.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-[#159A9C] text-white font-medium rounded-lg hover:bg-[#0F7B7D] transition-colors"
                      >
                        <Target className="w-4 h-4" />
                        Ativar
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 font-medium rounded-lg cursor-not-allowed"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Ativa
                      </button>
                    )}

                    <button
                      onClick={() => navigate(`/empresas/${empresa.id}/configuracoes`)}
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Configurar
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <button
                      onClick={() => navigate(`/empresas/${empresa.id}/usuarios`)}
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      <Users className="w-4 h-4" />
                      Usuários
                    </button>

                    <button
                      onClick={() => navigate(`/empresas/${empresa.id}/relatorios`)}
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Relatórios
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* View Lista */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plano
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuários
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimento
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {empresas.map((empresa) => (
                    <tr
                      key={empresa.id}
                      className={empresa.isActive ? 'bg-[#159A9C]/5' : 'hover:bg-gray-50'}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                              empresa.plano.nome === 'Enterprise'
                                ? 'bg-purple-500'
                                : empresa.plano.nome === 'Professional'
                                  ? 'bg-blue-500'
                                  : 'bg-green-500'
                            }`}
                          >
                            {empresa.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{empresa.nome}</p>
                              {empresa.isActive && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-[#159A9C]/10 text-[#159A9C] rounded-full text-xs font-medium">
                                  <Activity className="w-3 h-3" />
                                  Ativa
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{empresa.cnpj}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(empresa.status)}`}
                        >
                          {getStatusIcon(empresa.status)}
                          {empresa.status.charAt(0).toUpperCase() + empresa.status.slice(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPlanoBadge(empresa.plano.nome)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">
                            {Math.floor(Math.random() * 30) + 5} ativos
                          </p>
                          <p className="text-gray-600">
                            de {Math.floor(Math.random() * 50) + 20} total
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(empresa.dataVencimento)}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {!empresa.isActive ? (
                            <button
                              onClick={() => handleSwitchEmpresa(empresa.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#159A9C] text-white font-medium rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm"
                            >
                              <Target className="w-3 h-3" />
                              Ativar
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-500 font-medium rounded-lg text-sm">
                              <CheckCircle className="w-3 h-3" />
                              Ativa
                            </span>
                          )}

                          <button
                            onClick={() => navigate(`/empresas/${empresa.id}/configuracoes`)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                            title="Configurações"
                          >
                            <Settings className="w-4 h-4" />
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
      </div>

      {/* Modal Nova Empresa */}
      <ModalNovaEmpresa isOpen={showAddEmpresa} onClose={() => setShowAddEmpresa(false)} />
    </div>
  );
};
