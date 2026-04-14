import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type EmpresaInfo, useEmpresas } from '../../contexts/EmpresaContextAPIReal';
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
  PauseCircle,
  RotateCcw,
  Ban,
} from 'lucide-react';

type EmpresaActionType = 'suspender' | 'reativar' | 'cancelar-servico';

interface EmpresaActionModalState {
  type: EmpresaActionType;
  empresa: EmpresaInfo;
}

export const MinhasEmpresasPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    empresas,
    loading,
    switchEmpresa,
    suspenderEmpresa,
    reativarEmpresa,
    cancelarServicoEmpresa,
  } = useEmpresas();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddEmpresa, setShowAddEmpresa] = useState(false);
  const [pendingEmpresaId, setPendingEmpresaId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<EmpresaActionModalState | null>(null);
  const [actionReason, setActionReason] = useState('Suspensao administrativa');
  const [actionError, setActionError] = useState<string | null>(null);
  const totalUsuariosAtivos = empresas.reduce(
    (total, empresa) => total + (empresa.estatisticas?.usuariosAtivos ?? 0),
    0,
  );
  const totalClientes = empresas.reduce(
    (total, empresa) => total + (empresa.estatisticas?.clientesCadastrados ?? 0),
    0,
  );

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

  const isTrialExpired = (empresa: EmpresaInfo) =>
    empresa.status === 'trial' && empresa.dataVencimento.getTime() < Date.now();

  const isEmpresaSuspensaOuInativa = (empresa: EmpresaInfo) =>
    empresa.status === 'suspensa' || empresa.status === 'inativa';

  const isSwitchBlockedByStatus = (empresa: EmpresaInfo) =>
    isEmpresaSuspensaOuInativa(empresa) || isTrialExpired(empresa);

  const canSwitchToEmpresa = (empresa: EmpresaInfo) =>
    !empresa.isActive && !isSwitchBlockedByStatus(empresa);

  const canUseEmpresaContext = (empresa: EmpresaInfo) =>
    empresa.isActive || canSwitchToEmpresa(empresa);

  const ensureEmpresaContext = async (empresa: EmpresaInfo) => {
    if (empresa.isActive) {
      return;
    }

    await switchEmpresa(empresa.id);
  };

  const handleSwitchEmpresa = async (empresa: EmpresaInfo) => {
    try {
      setPendingEmpresaId(empresa.id);
      await ensureEmpresaContext(empresa);
      navigate('/dashboard');
    } catch {
      // Erro ja tratado no contexto
    } finally {
      setPendingEmpresaId(null);
    }
  };

  const handleNavigateWithEmpresaContext = async (empresa: EmpresaInfo, targetPath: string) => {
    try {
      setPendingEmpresaId(empresa.id);
      await ensureEmpresaContext(empresa);
      navigate(targetPath);
    } catch {
      // Erro ja tratado no contexto
    } finally {
      setPendingEmpresaId(null);
    }
  };

  const handleSuspenderEmpresa = (empresa: EmpresaInfo) => {
    setActionModal({ type: 'suspender', empresa });
    setActionReason('Suspensao administrativa');
    setActionError(null);
  };

  const handleReativarEmpresa = (empresa: EmpresaInfo) => {
    setActionModal({ type: 'reativar', empresa });
    setActionReason('');
    setActionError(null);
  };

  const handleCancelarServico = (empresa: EmpresaInfo) => {
    setActionModal({ type: 'cancelar-servico', empresa });
    setActionReason('');
    setActionError(null);
  };

  const closeActionModal = () => {
    if (pendingEmpresaId) {
      return;
    }

    setActionModal(null);
    setActionReason('Suspensao administrativa');
    setActionError(null);
  };

  const confirmActionModal = async () => {
    if (!actionModal) {
      return;
    }

    try {
      setPendingEmpresaId(actionModal.empresa.id);
      setActionError(null);

      if (actionModal.type === 'suspender') {
        const motivo = actionReason.trim();
        if (!motivo) {
          setActionError('Informe o motivo da suspensao.');
          return;
        }
        await suspenderEmpresa(actionModal.empresa.id, motivo);
      } else if (actionModal.type === 'reativar') {
        await reativarEmpresa(actionModal.empresa.id);
      } else {
        await cancelarServicoEmpresa(actionModal.empresa.id);
      }

      setActionModal(null);
      setActionReason('Suspensao administrativa');
      setActionError(null);
    } catch {
      // Erro tratado no contexto
    } finally {
      setPendingEmpresaId(null);
    }
  };

  const canManageEmpresas = empresas.some((empresa) => empresa.permissoes?.podeGerenciarEmpresas);
  const isActionSubmitting = Boolean(actionModal && pendingEmpresaId === actionModal.empresa.id);

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
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <Building2 className="h-6 w-6 text-[#159A9C]" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-[#002333]">
                    Minhas Empresas
                  </h1>
                  <p className="text-sm text-[#002333]/70">
                    Gerencie e alterne entre suas empresas
                  </p>
                </div>
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
                  disabled={!canManageEmpresas}
                  title={
                    canManageEmpresas
                      ? 'Cadastrar nova empresa'
                      : 'Seu perfil nao possui permissao para cadastrar empresas'
                  }
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Empresas cadastradas
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{empresas.length}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Total de empresas vinculadas ao seu usuário.
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <Building2 className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Empresas ativas
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {empresas.filter((e) => e.status === 'ativa').length}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Empresas com status operacional ativo.
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center shadow-sm">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Usuários ativos
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{totalUsuariosAtivos}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    {totalClientes} clientes cadastrados no total.
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <Users className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Valor mensal total
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {formatCurrency(empresas.reduce((total, e) => total + e.plano.preco, 0))}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Somatório do valor dos planos das empresas.
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <DollarSign className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {empresas.map((empresa) => {
                const canActivate = canSwitchToEmpresa(empresa);
                const canConfigure =
                  Boolean(empresa.permissoes?.podeEditarConfiguracoes) &&
                  canUseEmpresaContext(empresa);
                const canManageUsers =
                  Boolean(empresa.permissoes?.podeGerenciarUsuarios) &&
                  canUseEmpresaContext(empresa);
                const canViewReports =
                  Boolean(empresa.permissoes?.podeVerRelatorios) && canUseEmpresaContext(empresa);
                const canManageCompanyStatus = Boolean(empresa.permissoes?.podeGerenciarEmpresas);
                const canCancelService = Boolean(empresa.permissoes?.podeAlterarPlano);
                const isEmpresaSuspensa = isEmpresaSuspensaOuInativa(empresa);
                const actionDisabled = pendingEmpresaId !== null;

                return (
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
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg bg-[#159A9C]">
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
                            {empresa.estatisticas?.usuariosAtivos ?? 0}
                          </p>
                          <p className="text-xs text-gray-600">Usuários Ativos</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-gray-900">
                            {empresa.estatisticas?.clientesCadastrados ?? 0}
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
                            type="button"
                            onClick={() => void handleSwitchEmpresa(empresa)}
                            disabled={!canActivate || actionDisabled}
                            title={
                              canActivate
                                ? 'Alternar para esta empresa'
                                : 'Empresa indisponivel para alternancia no momento'
                            }
                            className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium ${
                              canActivate
                                ? 'bg-[#159A9C] text-white hover:bg-[#0F7B7D]'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            <Target className="h-4 w-4" />
                            {canActivate ? 'Ativar' : 'Indisponivel'}
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
                          onClick={() =>
                            void handleNavigateWithEmpresaContext(empresa, '/configuracoes/empresa')
                          }
                          disabled={!canConfigure || actionDisabled}
                          title={
                            canConfigure
                              ? 'Abrir configuracoes da empresa'
                              : 'Sem permissao ou empresa indisponivel para configuracao'
                          }
                          className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Settings className="h-4 w-4" />
                          Configurar
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <button
                          type="button"
                          onClick={() =>
                            void handleNavigateWithEmpresaContext(
                              empresa,
                              '/configuracoes/usuarios',
                            )
                          }
                          disabled={!canManageUsers || actionDisabled}
                          title={
                            canManageUsers
                              ? 'Abrir usuarios da empresa'
                              : 'Sem permissao ou empresa indisponivel para gerenciamento de usuarios'
                          }
                          className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Users className="h-4 w-4" />
                          Usuarios
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleNavigateWithEmpresaContext(empresa, '/dashboard')
                          }
                          disabled={!canViewReports || actionDisabled}
                          title={
                            canViewReports
                              ? 'Abrir dashboard da empresa'
                              : 'Sem permissao ou empresa indisponivel para relatorios'
                          }
                          className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <BarChart3 className="h-4 w-4" />
                          Relatorios
                        </button>
                      </div>

                      {(canManageCompanyStatus || canCancelService) && (
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          {isEmpresaSuspensa ? (
                            <button
                              type="button"
                              onClick={() => void handleReativarEmpresa(empresa)}
                              disabled={!canManageCompanyStatus || actionDisabled}
                              title={
                                canManageCompanyStatus
                                  ? 'Reativar empresa'
                                  : 'Sem permissao para gerenciar status da empresa'
                              }
                              className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Reativar
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void handleSuspenderEmpresa(empresa)}
                              disabled={!canManageCompanyStatus || actionDisabled}
                              title={
                                canManageCompanyStatus
                                  ? 'Suspender empresa'
                                  : 'Sem permissao para gerenciar status da empresa'
                              }
                              className="px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <PauseCircle className="h-4 w-4" />
                              Suspender
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => void handleCancelarServico(empresa)}
                            disabled={!canCancelService || actionDisabled}
                            title={
                              canCancelService
                                ? 'Cancelar assinatura da empresa'
                                : 'Sem permissao para cancelar o servico'
                            }
                            className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Ban className="h-4 w-4" />
                            Cancelar servico
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
                    {empresas.map((empresa) => {
                      const canManageCompanyStatus = Boolean(empresa.permissoes?.podeGerenciarEmpresas);
                      const canCancelService = Boolean(empresa.permissoes?.podeAlterarPlano);
                      const isEmpresaSuspensa = isEmpresaSuspensaOuInativa(empresa);
                      const actionDisabled = pendingEmpresaId !== null;

                      return (
                        <tr
                          key={empresa.id}
                          className={empresa.isActive ? 'bg-[#159A9C]/5' : 'hover:bg-gray-50'}
                        >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold bg-[#159A9C]">
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
                              {empresa.estatisticas?.usuariosAtivos ?? 0}
                            </p>
                            <p className="text-gray-600">
                              {empresa.estatisticas?.clientesCadastrados ?? 0} clientes
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(empresa.dataVencimento)}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap items-center gap-2">
                            {!empresa.isActive ? (
                              <button
                                type="button"
                                onClick={() => void handleSwitchEmpresa(empresa)}
                                disabled={!canSwitchToEmpresa(empresa) || actionDisabled}
                                title={
                                  canSwitchToEmpresa(empresa)
                                    ? 'Alternar para esta empresa'
                                    : 'Empresa indisponivel para alternancia no momento'
                                }
                                className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium ${
                                  canSwitchToEmpresa(empresa)
                                    ? 'bg-[#159A9C] text-white hover:bg-[#0F7B7D]'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                <Target className="h-4 w-4" />
                                {canSwitchToEmpresa(empresa) ? 'Ativar' : 'Indisponivel'}
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-500 font-medium rounded-lg text-sm">
                                <CheckCircle className="w-3 h-3" />
                                Ativa
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                void handleNavigateWithEmpresaContext(
                                  empresa,
                                  '/configuracoes/empresa',
                                )
                              }
                              disabled={
                                !(
                                  Boolean(empresa.permissoes?.podeEditarConfiguracoes) &&
                                  canUseEmpresaContext(empresa)
                                ) || actionDisabled
                              }
                              className="p-2 text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                Boolean(empresa.permissoes?.podeEditarConfiguracoes) &&
                                canUseEmpresaContext(empresa)
                                  ? 'Configuracoes'
                                  : 'Sem permissao ou empresa indisponivel para configuracao'
                              }
                            >
                              <Settings className="w-4 h-4" />
                            </button>

                            {(canManageCompanyStatus || canCancelService) && (
                              <>
                                {isEmpresaSuspensa ? (
                                  <button
                                    type="button"
                                    onClick={() => void handleReativarEmpresa(empresa)}
                                    disabled={!canManageCompanyStatus || actionDisabled}
                                    title={
                                      canManageCompanyStatus
                                        ? 'Reativar empresa'
                                        : 'Sem permissao para gerenciar status da empresa'
                                    }
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Reativar
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => void handleSuspenderEmpresa(empresa)}
                                    disabled={!canManageCompanyStatus || actionDisabled}
                                    title={
                                      canManageCompanyStatus
                                        ? 'Suspender empresa'
                                        : 'Sem permissao para gerenciar status da empresa'
                                    }
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Suspender
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => void handleCancelarServico(empresa)}
                                  disabled={!canCancelService || actionDisabled}
                                  title={
                                    canCancelService
                                      ? 'Cancelar assinatura da empresa'
                                      : 'Sem permissao para cancelar o servico'
                                  }
                                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Cancelar
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {actionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-xl border border-[#B4BEC9] bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div
                  className={`h-11 w-11 rounded-full flex items-center justify-center ${
                    actionModal.type === 'reativar'
                      ? 'bg-green-100 text-green-700'
                      : actionModal.type === 'suspender'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-red-100 text-red-700'
                  }`}
                >
                  {actionModal.type === 'reativar' ? (
                    <RotateCcw className="h-5 w-5" />
                  ) : actionModal.type === 'suspender' ? (
                    <PauseCircle className="h-5 w-5" />
                  ) : (
                    <Ban className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#002333]">
                    {actionModal.type === 'reativar'
                      ? 'Reativar empresa'
                      : actionModal.type === 'suspender'
                        ? 'Suspender empresa'
                        : 'Cancelar servico'}
                  </h3>
                  <p className="text-sm text-[#385A6A]">{actionModal.empresa.nome}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <p className="text-sm text-[#244455]">
                {actionModal.type === 'reativar'
                  ? 'Esta acao vai restaurar o acesso da empresa ao sistema.'
                  : actionModal.type === 'suspender'
                    ? 'A empresa sera bloqueada para acesso ate ser reativada.'
                    : 'A assinatura sera cancelada e o tenant pode perder acesso aos modulos contratados.'}
              </p>

              {actionModal.type === 'suspender' && (
                <div>
                  <label
                    htmlFor="empresa-action-motivo"
                    className="mb-2 block text-sm font-medium text-[#19384C]"
                  >
                    Motivo da suspensao
                  </label>
                  <textarea
                    id="empresa-action-motivo"
                    value={actionReason}
                    onChange={(event) => {
                      setActionReason(event.target.value);
                      if (actionError) {
                        setActionError(null);
                      }
                    }}
                    rows={3}
                    className="w-full rounded-lg border border-[#B4BEC9] px-3 py-2 text-sm text-[#19384C] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                    placeholder="Descreva o motivo da suspensao..."
                    disabled={isActionSubmitting}
                  />
                </div>
              )}

              {actionError && <p className="text-sm font-medium text-red-600">{actionError}</p>}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={closeActionModal}
                disabled={isActionSubmitting}
                className="rounded-lg border border-[#B4BEC9] bg-white px-4 py-2 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => void confirmActionModal()}
                disabled={isActionSubmitting}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  actionModal.type === 'reativar'
                    ? 'bg-green-600 hover:bg-green-700'
                    : actionModal.type === 'suspender'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isActionSubmitting
                  ? 'Processando...'
                  : actionModal.type === 'reativar'
                    ? 'Confirmar reativacao'
                    : actionModal.type === 'suspender'
                      ? 'Confirmar suspensao'
                      : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Empresa */}
      <ModalNovaEmpresa isOpen={showAddEmpresa} onClose={() => setShowAddEmpresa(false)} />
    </div>
  );
};
