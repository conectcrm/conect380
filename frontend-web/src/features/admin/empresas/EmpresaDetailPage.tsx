import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BackToNucleus } from '../../../components/navigation/BackToNucleus';
import { useNotifications } from '../../../contexts/NotificationContext';
import { useGlobalConfirmation } from '../../../contexts/GlobalConfirmationContext';
import * as adminEmpresasService from '../../../services/adminEmpresasService';
import type { EmpresaAdmin } from '../../../services/adminEmpresasService';
import adminModulosService, { HistoricoPlano } from '../../../services/adminModulosService';
import {
  Building2,
  Users,
  DollarSign,
  Calendar,
  Activity,
  Settings,
  Edit2,
  Ban,
  CheckCircle,
  RefreshCw,
  ArrowLeft,
  TrendingUp,
  Package,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const EmpresaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { confirm } = useGlobalConfirmation();
  const { addNotification } = useNotifications();

  const [empresa, setEmpresa] = useState<EmpresaAdmin | null>(null);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [historicoPlanos, setHistoricoPlanos] = useState<HistoricoPlano[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotasModal, setShowNotasModal] = useState(false);
  const [notasInternas, setNotasInternas] = useState('');

  useEffect(() => {
    if (id) {
      carregarDados();
    }
  }, [id]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar empresa
      const empresaData = await adminEmpresasService.buscarPorId(id!);
      setEmpresa(empresaData);
      setNotasInternas(empresaData.notas_internas || '');

      // Carregar usuários
      const usuariosData = await adminEmpresasService.listarUsuarios(id!);
      setUsuarios(usuariosData);

      // Carregar histórico de planos
      try {
        const historicoData = await adminModulosService.historicoPlanos(id!);
        setHistoricoPlanos(Array.isArray(historicoData) ? historicoData : []);
      } catch (err) {
        console.warn('Erro ao carregar histórico de planos:', err);
        setHistoricoPlanos([]);
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar dados:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados da empresa';
      setError(errorMessage);

      addNotification({
        title: '❌ Erro ao Carregar',
        message: errorMessage,
        type: 'error',
        priority: 'high',
        entityType: 'cliente',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCalcularHealthScore = async () => {
    try {
      setLoadingAction(true);
      const result = await adminEmpresasService.calcularHealthScore(id!);

      if (empresa) {
        setEmpresa({ ...empresa, health_score: result.health_score });
      }

      addNotification({
        title: '✅ Health Score Atualizado',
        message: `Novo score: ${result.health_score}`,
        type: 'success',
        priority: 'medium',
        entityType: 'cliente',
      });
    } catch (err: unknown) {
      console.error('Erro ao calcular health score:', err);
      addNotification({
        title: '❌ Erro',
        message: 'Não foi possível calcular o health score',
        type: 'error',
        priority: 'high',
        entityType: 'cliente',
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSuspender = async () => {
    if (
      !(await confirm(
        'Tem certeza que deseja suspender esta empresa? Os usuários não poderão mais acessar o sistema.',
      ))
    ) {
      return;
    }

    const motivo = window.prompt('Motivo da suspensão:');
    if (!motivo) return;

    try {
      setLoadingAction(true);
      const result = await adminEmpresasService.suspender(id!, motivo);
      setEmpresa(result.empresa);

      addNotification({
        title: '⚠️ Empresa Suspensa',
        message: `${result.empresa.nome} foi suspensa com sucesso`,
        type: 'warning',
        priority: 'high',
        entityType: 'cliente',
      });
    } catch (err: unknown) {
      console.error('Erro ao suspender empresa:', err);
      addNotification({
        title: '❌ Erro',
        message: 'Não foi possível suspender a empresa',
        type: 'error',
        priority: 'high',
        entityType: 'cliente',
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReativar = async () => {
    if (!(await confirm('Tem certeza que deseja reativar esta empresa?'))) {
      return;
    }

    try {
      setLoadingAction(true);
      const result = await adminEmpresasService.reativar(id!);
      setEmpresa(result.empresa);

      addNotification({
        title: '✅ Empresa Reativada',
        message: `${result.empresa.nome} foi reativada com sucesso`,
        type: 'success',
        priority: 'high',
        entityType: 'cliente',
      });
    } catch (err: unknown) {
      console.error('Erro ao reativar empresa:', err);
      addNotification({
        title: '❌ Erro',
        message: 'Não foi possível reativar a empresa',
        type: 'error',
        priority: 'high',
        entityType: 'cliente',
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSalvarNotas = async () => {
    try {
      setLoadingAction(true);
      await adminEmpresasService.atualizar(id!, { notas_internas: notasInternas });

      if (empresa) {
        setEmpresa({ ...empresa, notas_internas: notasInternas });
      }

      addNotification({
        title: '✅ Notas Salvas',
        message: 'Notas internas atualizadas com sucesso',
        type: 'success',
        priority: 'low',
        entityType: 'cliente',
      });
      setShowNotasModal(false);
    } catch (err: unknown) {
      console.error('Erro ao salvar notas:', err);
      addNotification({
        title: '❌ Erro',
        message: 'Não foi possível salvar as notas',
        type: 'error',
        priority: 'high',
        entityType: 'cliente',
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ativa' },
      trial: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Trial' },
      suspended: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspensa' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelada' },
      past_due: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Inadimplente' },
    };
    const badge = badges[status as keyof typeof badges] || badges.cancelled;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#159A9C] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando detalhes da empresa...</p>
        </div>
      </div>
    );
  }

  if (error || !empresa) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao Carregar Empresa</h3>
          <p className="text-gray-500 mb-6">{error || 'Empresa não encontrada'}</p>
          <button
            onClick={() => navigate('/admin/empresas')}
            className="bg-[#159A9C] text-white px-6 py-3 rounded-lg hover:bg-[#138A8C] transition-colors"
          >
            Voltar para Lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus
          nucleusName="Gestão"
          nucleusPath="/nuclei/gestao"
          currentModuleName="Gestão de Empresas"
        />
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Cabeçalho da Empresa */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="h-16 w-16 rounded-lg bg-[#159A9C]/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-[#159A9C]" />
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-[#002333]">{empresa.nome}</h1>
                  {getStatusBadge(empresa.status)}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    {empresa.cnpj}
                  </span>
                  <span className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    {empresa.email}
                  </span>
                  {empresa.telefone && (
                    <span className="flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      {empresa.telefone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={carregarDados}
                disabled={loadingAction}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loadingAction ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>

              <button
                onClick={() => navigate(`/admin/empresas/${id}/modulos`)}
                className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Package className="w-4 h-4" />
                <span>Gerenciar Módulos</span>
              </button>

              {empresa.status === 'suspended' ? (
                <button
                  onClick={handleReativar}
                  disabled={loadingAction}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Reativar</span>
                </button>
              ) : (
                <button
                  onClick={handleSuspender}
                  disabled={loadingAction}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  <Ban className="w-4 h-4" />
                  <span>Suspender</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Grid de Informações */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Card: Plano e Faturamento */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-[#159A9C]/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-[#159A9C]" />
              </div>
              <h2 className="text-lg font-semibold text-[#002333]">Plano e Faturamento</h2>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Plano</p>
                <p className="text-lg font-semibold text-[#002333]">{empresa.plano}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Valor Mensal</p>
                <p className="text-lg font-semibold text-[#002333]">
                  R$ {Number(empresa.valor_mensal).toFixed(2)}
                </p>
              </div>
              {empresa.trial_end_date && (
                <div>
                  <p className="text-sm text-gray-500">Fim do Trial</p>
                  <p className="text-sm text-[#002333]">
                    {new Date(empresa.trial_end_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
              {empresa.stripe_customer_id && (
                <div>
                  <p className="text-sm text-gray-500">Stripe Customer ID</p>
                  <p className="text-xs text-gray-600 font-mono">{empresa.stripe_customer_id}</p>
                </div>
              )}
            </div>
          </div>

          {/* Card: Atividade */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-[#002333]">Atividade</h2>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Usuários Ativos</p>
                <p className="text-lg font-semibold text-[#002333]">{empresa.usuarios_ativos}</p>
              </div>
              {empresa.ultimo_acesso && (
                <div>
                  <p className="text-sm text-gray-500">Último Acesso</p>
                  <p className="text-sm text-[#002333]">
                    {new Date(empresa.ultimo_acesso).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Criada em</p>
                <p className="text-sm text-[#002333]">
                  {new Date(empresa.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          {/* Card: Health Score */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-[#002333]">Health Score</h2>
              </div>
              <button
                onClick={handleCalcularHealthScore}
                disabled={loadingAction}
                className="text-sm text-[#159A9C] hover:text-[#138A8C] disabled:opacity-50"
              >
                Recalcular
              </button>
            </div>

            <div className="text-center">
              <div
                className={`text-5xl font-bold mb-2 ${getHealthScoreColor(empresa.health_score)}`}
              >
                {empresa.health_score}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className={`h-2 rounded-full transition-all ${getHealthScoreBg(empresa.health_score)}`}
                  style={{ width: `${empresa.health_score}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                {empresa.health_score >= 80 && '🟢 Cliente saudável'}
                {empresa.health_score >= 50 && empresa.health_score < 80 && '🟡 Atenção necessária'}
                {empresa.health_score < 50 && '🔴 Risco de churn'}
              </p>
            </div>
          </div>
        </div>

        {/* Seção: Usuários */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-[#159A9C]" />
              <h2 className="text-lg font-semibold text-[#002333]">Usuários ({usuarios.length})</h2>
            </div>
          </div>

          {usuarios.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum usuário cadastrado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nome
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {usuario.nome}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {usuario.email}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {usuario.role}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            usuario.ativo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Seção: Histórico de Planos */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="h-6 w-6 text-[#159A9C]" />
            <h2 className="text-lg font-semibold text-[#002333]">
              Histórico de Planos ({historicoPlanos.length})
            </h2>
          </div>

          {historicoPlanos.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma mudança de plano registrada</p>
          ) : (
            <div className="space-y-3">
              {historicoPlanos.map((historico, index) => (
                <div
                  key={historico.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {historico.plano_anterior}
                        </span>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {historico.plano_novo}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Valor:</span> R${' '}
                          {Number(historico.valor_anterior).toFixed(2)} → R${' '}
                          {Number(historico.valor_novo).toFixed(2)}
                        </div>
                        <div>
                          <span className="font-medium">Data:</span>{' '}
                          {new Date(historico.data_alteracao).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      {historico.motivo && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Motivo:</span> {historico.motivo}
                        </div>
                      )}

                      {historico.alterado_por && (
                        <div className="mt-1 text-xs text-gray-500">
                          Alterado por: {historico.alterado_por}
                        </div>
                      )}
                    </div>

                    {index === 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Mais recente
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seção: Notas Internas */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-[#159A9C]" />
              <h2 className="text-lg font-semibold text-[#002333]">Notas Internas</h2>
            </div>
            <button
              onClick={() => setShowNotasModal(true)}
              className="text-sm text-[#159A9C] hover:text-[#138A8C] flex items-center space-x-1"
            >
              <Edit2 className="w-4 h-4" />
              <span>Editar</span>
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
            {empresa.notas_internas ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{empresa.notas_internas}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">Sem notas internas</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Notas */}
      {showNotasModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold text-[#002333]">Editar Notas Internas</h3>
            </div>
            <div className="p-6">
              <textarea
                value={notasInternas}
                onChange={(e) => setNotasInternas(e.target.value)}
                className="w-full h-40 border rounded-lg p-3 focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                placeholder="Adicione notas internas sobre esta empresa..."
              />
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowNotasModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarNotas}
                disabled={loadingAction}
                className="bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#138A8C] transition-colors disabled:opacity-50"
              >
                {loadingAction ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
