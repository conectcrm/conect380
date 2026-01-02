import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackToNucleus } from '../../../components/navigation/BackToNucleus';
import { EmpresaCard } from '../components/EmpresaCard';
import { EmpresaFilters } from '../components/EmpresaFilters';
import { EmpresaMetrics } from '../components/EmpresaMetrics';
import { ModalCadastroEmpresa } from '../components/ModalCadastroEmpresa';
import { useNotifications } from '../../../contexts/NotificationContext';
import * as adminEmpresasService from '../../../services/adminEmpresasService';
import type { EmpresaAdmin, FilterEmpresasParams } from '../../../services/adminEmpresasService';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Download,
  Settings,
  Users,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  BarChart,
} from 'lucide-react';

interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  plano: 'starter' | 'professional' | 'enterprise';
  status: 'ativa' | 'trial' | 'suspensa' | 'inativa';
  usuariosAtivos: number;
  clientesCadastrados: number;
  ultimoAcesso: Date;
  dataExpiracao: Date;
  valorMensal: number;
}

export const EmpresasListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showModalCadastro, setShowModalCadastro] = useState(false);
  const [empresaEditando, setEmpresaEditando] = useState<Empresa | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    plano: '',
    dataInicio: '',
    dataFim: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Mapear dados da API para formato do componente
  const mapEmpresaApiToLocal = (empresaApi: EmpresaAdmin): Empresa => {
    return {
      id: empresaApi.id,
      nome: empresaApi.nome,
      cnpj: empresaApi.cnpj,
      email: empresaApi.email,
      plano: empresaApi.plano.toLowerCase() as 'starter' | 'professional' | 'enterprise',
      status: mapStatusApiToLocal(empresaApi.status),
      usuariosAtivos: empresaApi.usuarios_ativos || 0,
      clientesCadastrados: empresaApi.uso_mensal?.clientes || 0,
      ultimoAcesso: empresaApi.ultimo_acesso ? new Date(empresaApi.ultimo_acesso) : new Date(),
      dataExpiracao: empresaApi.trial_end_date ? new Date(empresaApi.trial_end_date) : new Date(),
      valorMensal: Number(empresaApi.valor_mensal) || 0,
    };
  };

  const mapStatusApiToLocal = (status: string): 'ativa' | 'trial' | 'suspensa' | 'inativa' => {
    const statusMap: Record<string, 'ativa' | 'trial' | 'suspensa' | 'inativa'> = {
      active: 'ativa',
      trial: 'trial',
      suspended: 'suspensa',
      cancelled: 'inativa',
      past_due: 'inativa',
    };
    return statusMap[status] || 'inativa';
  };

  // Carregar empresas da API
  const carregarEmpresas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: FilterEmpresasParams = {
        search: searchTerm || undefined,
        status: filters.status || undefined,
        plano: filters.plano || undefined,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      };

      const response = await adminEmpresasService.listar(params);

      const empresasMapeadas = response.data.map(mapEmpresaApiToLocal);
      setEmpresas(empresasMapeadas);
      setPagination({
        ...pagination,
        total: response.meta.total,
        totalPages: response.meta.totalPages,
      });

      addNotification({
        title: '🏢 Empresas Carregadas',
        message: `${response.meta.total} empresa(s) encontrada(s)`,
        type: 'info',
        priority: 'low',
      });
    } catch (err: unknown) {
      console.error('Erro ao carregar empresas:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar empresas';
      setError(errorMessage);

      addNotification({
        title: '❌ Erro ao Carregar',
        message: errorMessage,
        type: 'error',
        priority: 'high',
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters, pagination.page, pagination.limit, addNotification]);

  // Carregar empresas ao montar e quando filtros mudarem
  useEffect(() => {
    carregarEmpresas();
  }, [carregarEmpresas]);

  // Filtros já aplicados na API, mas mantemos para compatibilidade
  const filteredEmpresas = empresas;

  const handleNovaEmpresa = () => {
    setEmpresaEditando(null);
    setShowModalCadastro(true);
  };

  const handleEditarEmpresa = (empresa: Empresa) => {
    setEmpresaEditando(empresa);
    setShowModalCadastro(true);
  };

  const handleSalvarEmpresa = async (dadosEmpresa: any) => {
    try {
      if (empresaEditando) {
        // Atualizar empresa existente
        await adminEmpresasService.atualizar(empresaEditando.id, {
          nome: dadosEmpresa.nome,
          status: dadosEmpresa.status,
          valor_mensal: dadosEmpresa.valorMensal,
          notas_internas: dadosEmpresa.notasInternas,
        });

        addNotification({
          title: '✅ Empresa Atualizada',
          message: `${dadosEmpresa.nome} foi atualizada com sucesso`,
          type: 'success',
          priority: 'medium',
          entityType: 'cliente',
        });

        // Recarregar lista
        await carregarEmpresas();
      } else {
        // Criar nova empresa
        await adminEmpresasService.criar({
          nome: dadosEmpresa.nome,
          cnpj: dadosEmpresa.cnpj,
          email: dadosEmpresa.email,
          telefone: dadosEmpresa.telefone,
          plano: dadosEmpresa.plano.toUpperCase(),
          trial_dias: 14,
          admin_nome: dadosEmpresa.adminNome,
          admin_email: dadosEmpresa.adminEmail,
          admin_senha: dadosEmpresa.adminSenha,
        });

        addNotification({
          title: '🎉 Nova Empresa Cadastrada',
          message: `${dadosEmpresa.nome} foi cadastrada com sucesso`,
          type: 'success',
          priority: 'medium',
          entityType: 'cliente',
        });

        // Recarregar lista
        await carregarEmpresas();
      }

      setShowModalCadastro(false);
    } catch (err: unknown) {
      console.error('Erro ao salvar empresa:', err);
      const errorMessage = err instanceof Error ? err.message : 'Não foi possível salvar a empresa';

      addNotification({
        title: '❌ Erro ao Salvar',
        message: errorMessage,
        type: 'error',
        priority: 'high',
        entityType: 'cliente',
      });
    }
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      plano: '',
      dataInicio: '',
      dataFim: '',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleEmpresaClick = (empresaId: string) => {
    // Navegar para página de detalhes
    navigate(`/admin/empresas/${empresaId}`);
  };

  const handleRefresh = () => {
    carregarEmpresas();
  };

  if (loading && empresas.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#159A9C] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando empresas...</p>
        </div>
      </div>
    );
  }

  if (error && empresas.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao Carregar Empresas</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-[#159A9C] text-white px-6 py-3 rounded-lg hover:bg-[#138A8C] transition-colors flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Tentar Novamente</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus
          nucleusName="Gestão"
          nucleusPath="/nuclei/gestao"
          currentModuleName="Gestão de Empresas"
        />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-[#159A9C]/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-[#159A9C]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#002333]">Gestão de Empresas</h1>
                  <p className="text-sm text-[#B4BEC9]">Cadastre, edite e acompanhe empresas do ambiente.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
                <button
                  onClick={() => navigate('/admin/console')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#159A9C] text-[#159A9C] rounded-lg hover:bg-[#159A9C]/5 transition-colors text-sm font-medium"
                  title="Ver métricas executivas e alertas do sistema"
                >
                  <BarChart className="h-4 w-4" />
                  Dashboard Executivo
                </button>

                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="px-3 py-2 rounded-lg border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  title="Atualizar lista"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Atualizar</span>
                </button>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`
                    px-3 py-2 rounded-lg border transition-colors flex items-center space-x-2
                    ${showFilters
                      ? 'bg-[#159A9C] text-white border-[#159A9C]'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <Filter className="w-4 h-4" />
                  <span>Filtros</span>
                </button>

                <button
                  onClick={handleNovaEmpresa}
                  className="bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#138A8C] transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Empresa</span>
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nome, CNPJ ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                />
              </div>
            </div>

            {showFilters && (
              <div className="mt-4">
                <EmpresaFilters filters={filters} onFiltersChange={setFilters} onReset={resetFilters} />
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <EmpresaMetrics empresas={empresas} />
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            {filteredEmpresas.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma empresa encontrada</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || Object.values(filters).some((f) => f)
                    ? 'Tente ajustar os filtros de busca'
                    : 'Não há empresas cadastradas no sistema'}
                </p>
                {!searchTerm && !Object.values(filters).some((f) => f) && (
                  <button
                    onClick={handleNovaEmpresa}
                    className="bg-[#159A9C] text-white px-6 py-3 rounded-lg hover:bg-[#138A8C] transition-colors"
                  >
                    Cadastrar Primeira Empresa
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredEmpresas.map((empresa) => (
                    <EmpresaCard
                      key={empresa.id}
                      empresa={empresa}
                      onClick={() => handleEmpresaClick(empresa.id)}
                    />
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-gray-600">
                      Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                      {pagination.total} empresa(s)
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1 || loading}
                        className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <span className="px-4 py-2 text-sm">
                        Página {pagination.page} de {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.totalPages || loading}
                        className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ModalCadastroEmpresa
        isOpen={showModalCadastro}
        onClose={() => setShowModalCadastro(false)}
        onSave={handleSalvarEmpresa}
        empresa={empresaEditando}
      />
    </div>
  );
};
