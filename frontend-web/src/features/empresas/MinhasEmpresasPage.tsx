import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmpresas } from '../../contexts/EmpresaContextAPIReal';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
import { ModalNovaEmpresa } from './components/ModalNovaEmpresa';
import {
  Building2,
  Plus,
  Settings,
  Users,
  BarChart3,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Target,
  Activity,
} from 'lucide-react';

export const MinhasEmpresasPage: React.FC = () => {
  const navigate = useNavigate();
  const { empresas, loading, switchEmpresa } = useEmpresas();

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
    const trimmed = String(plano || '').trim();
    if (!trimmed) return null;

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#DEEFE7] text-[#002333] border border-[#B4BEC9]">
        {trimmed}
      </span>
    );
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
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="Dashboard" nucleusPath="/dashboard" currentModuleName="Minhas Empresas" />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <Building2 className="h-6 w-6 text-[#159A9C]" />
                </div>
                <p className="text-sm text-[#002333]/70">Gerencie e alterne entre suas empresas</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white text-[#002333] shadow-sm'
                        : 'text-[#002333]/70 hover:text-[#002333]'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white text-[#002333] shadow-sm'
                        : 'text-[#002333]/70 hover:text-[#002333]'
                    }`}
                  >
                    Lista
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddEmpresa(true)}
                  className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Nova Empresa
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">Empresas cadastradas</p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{empresas.length}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">Total de empresas vinculadas ao seu usuário.</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <Building2 className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">Empresas ativas</p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{empresas.filter((e) => e.status === 'ativa').length}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">Empresas com status operacional ativo.</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center shadow-sm">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">Usuários ativos</p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">—</p>
                  <p className="mt-3 text-sm text-[#002333]/70">Indicador ainda indisponível nesta versão.</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <Users className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">Valor mensal total</p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {formatCurrency(empresas.reduce((total, e) => total + e.plano.preco, 0))}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">Somatório do valor dos planos das empresas.</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <DollarSign className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>
          </div>

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
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg bg-[#159A9C]"
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
                      <p className="text-xl font-bold text-gray-900">—</p>
                      <p className="text-xs text-gray-600">Usuários Ativos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900">—</p>
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
                        type="button"
                        onClick={() => handleSwitchEmpresa(empresa.id)}
                        className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <Target className="h-4 w-4" />
                        Ativar
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Ativa
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => navigate(`/empresas/${empresa.id}/configuracoes`)}
                      className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Configurar
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/empresas/${empresa.id}/usuarios`)}
                      className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Usuários
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/empresas/${empresa.id}/relatorios`)}
                      className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
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
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold bg-[#159A9C]"
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
                          <p className="font-medium text-gray-900">—</p>
                          <p className="text-gray-600">Indisponível nesta versão</p>
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
                              type="button"
                              onClick={() => handleSwitchEmpresa(empresa.id)}
                              className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                            >
                              <Target className="h-4 w-4" />
                              Ativar
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-500 font-medium rounded-lg text-sm">
                              <CheckCircle className="w-3 h-3" />
                              Ativa
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => navigate(`/empresas/${empresa.id}/configuracoes`)}
                            className="p-2 text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors"
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
      </div>

      {/* Modal Nova Empresa */}
      <ModalNovaEmpresa isOpen={showAddEmpresa} onClose={() => setShowAddEmpresa(false)} />
    </div>
  );
};
