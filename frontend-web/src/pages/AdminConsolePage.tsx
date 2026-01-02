import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Ban,
  BarChart3,
  Building2,
  CheckCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Database,
  DollarSign,
  Grid3x3,
  Eye,
  History,
  Layers,
  Package,
  PauseCircle,
  PlayCircle,
  PlugZap,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import adminEmpresasService, {
  type EmpresaAdmin,
  type FilterEmpresasParams,
} from '../services/adminEmpresasService';
import adminModulosService, {
  type HistoricoPlano,
  type ModuloEmpresa,
} from '../services/adminModulosService';
import { getErrorMessage } from '../utils/errorHandling';

const STATUS_OPTIONS = [
  { label: 'Todos', value: '' },
  { label: 'Ativas', value: 'active' },
  { label: 'Trials', value: 'trial' },
  { label: 'Suspensas', value: 'suspended' },
  { label: 'Canceladas', value: 'cancelled' },
  { label: 'Inadimplentes', value: 'past_due' },
] as const;

const PLANO_OPTIONS = [
  { label: 'Todos', value: '' },
  { label: 'Starter', value: 'starter' },
  { label: 'Professional', value: 'professional' },
  { label: 'Enterprise', value: 'enterprise' },
  { label: 'Custom', value: 'custom' },
] as const;

const STATUS_BADGES: Record<
  EmpresaAdmin['status'],
  { label: string; bg: string; text: string }
> = {
  active: { label: 'Ativa', bg: 'bg-[#16A34A]/10', text: 'text-[#16A34A]' },
  trial: { label: 'Trial', bg: 'bg-[#159A9C]/10', text: 'text-[#0F7B7D]' },
  suspended: { label: 'Suspensa', bg: 'bg-[#FBBF24]/20', text: 'text-[#92400E]' },
  cancelled: { label: 'Cancelada', bg: 'bg-[#B4BEC9]/20', text: 'text-[#002333]' },
  past_due: { label: 'Inadimplente', bg: 'bg-[#DC2626]/10', text: 'text-[#DC2626]' },
};

const DEFAULT_FILTERS: FilterEmpresasParams = {
  search: '',
  status: '',
  plano: '',
  page: 1,
  limit: 15,
};

const MODULO_METADATA: Record<
  ModuloEmpresa['modulo'],
  { label: string; description: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  crm: {
    label: 'CRM e Relacionamento',
    description: 'Contatos, oportunidades e cadências de relacionamento.',
    icon: BarChart3,
    color: 'text-[#159A9C]',
  },
  atendimento: {
    label: 'Atendimento Omnichannel',
    description: 'Filas, SLA e orquestração em tempo real.',
    icon: Activity,
    color: 'text-[#0F7B7D]',
  },
  comercial: {
    label: 'Funil Comercial',
    description: 'Cotações, propostas e integrações com ERP.',
    icon: TrendingUp,
    color: 'text-[#002333]',
  },
  financeiro: {
    label: 'Financeiro e Billing',
    description: 'MRR, cobranças e gateways conectados.',
    icon: CreditCard,
    color: 'text-[#159A9C]',
  },
  produtos: {
    label: 'Catálogo de Produtos',
    description: 'Gestão de SKUs, combos e estoques.',
    icon: Package,
    color: 'text-[#0F7B7D]',
  },
  configuracoes: {
    label: 'Governança e Segurança',
    description: 'Perfis, políticas e audit trails.',
    icon: Settings,
    color: 'text-[#002333]',
  },
};

interface MetaEmpresasState {
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

const AdminConsolePage: React.FC = () => {
  const navigate = useNavigate();

  const [empresas, setEmpresas] = useState<EmpresaAdmin[]>([]);
  const [metaEmpresas, setMetaEmpresas] = useState<MetaEmpresasState>({
    total: 0,
    totalPages: 0,
    page: DEFAULT_FILTERS.page ?? 1,
    limit: DEFAULT_FILTERS.limit ?? 15,
  });
  const [filtros, setFiltros] = useState<FilterEmpresasParams>({ ...DEFAULT_FILTERS });
  const [loadingEmpresas, setLoadingEmpresas] = useState<boolean>(true);
  const [erroEmpresas, setErroEmpresas] = useState<string | null>(null);
  const [empresaEmAcao, setEmpresaEmAcao] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string>('');
  const [empresaSelecionadaId, setEmpresaSelecionadaId] = useState<string>('');
  const [modulosEmpresa, setModulosEmpresa] = useState<ModuloEmpresa[]>([]);
  const [historicoPlanos, setHistoricoPlanos] = useState<HistoricoPlano[]>([]);
  const [loadingModulos, setLoadingModulos] = useState<boolean>(false);
  const [loadingHistorico, setLoadingHistorico] = useState<boolean>(false);
  const [erroModulos, setErroModulos] = useState<string | null>(null);
  const [erroHistorico, setErroHistorico] = useState<string | null>(null);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
      }),
    [],
  );

  const detailedCurrencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
      }),
    [],
  );

  const formatCurrency = useCallback((value: number) => currencyFormatter.format(value || 0), [currencyFormatter]);
  const formatCurrencyDetalhado = useCallback(
    (value: number) => detailedCurrencyFormatter.format(value || 0),
    [detailedCurrencyFormatter],
  );

  const formatDate = useCallback((value?: string | Date) => {
    if (!value) {
      return '--';
    }

    try {
      return new Date(value).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Erro ao formatar data', error);
      return '--';
    }
  }, []);

  const formatDateTime = useCallback((value?: string | Date) => {
    if (!value) {
      return '--';
    }

    try {
      return new Date(value).toLocaleString('pt-BR', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Erro ao formatar data/hora', error);
      return '--';
    }
  }, []);

  const calcularUsoPercentual = useCallback((modulo: ModuloEmpresa) => {
    const campos: (keyof ModuloEmpresa['limites'])[] = [
      'usuarios',
      'leads',
      'storage_mb',
      'api_calls_dia',
      'whatsapp_conexoes',
      'email_envios_dia',
    ];

    let maiorUso = 0;

    campos.forEach((campo) => {
      const limite = Number(modulo.limites?.[campo] ?? 0);
      const uso = Number(modulo.uso_atual?.[campo] ?? 0);

      if (limite > 0) {
        maiorUso = Math.max(maiorUso, uso / limite);
      }
    });

    if (!Number.isFinite(maiorUso) || maiorUso < 0) {
      return 0;
    }

    return Math.min(maiorUso, 1);
  }, []);

  const carregarEmpresas = useCallback(async () => {
    setLoadingEmpresas(true);
    setErroEmpresas(null);

    try {
      const response = await adminEmpresasService.listar(filtros);
      setEmpresas(response.data);

      if (response.meta) {
        setMetaEmpresas({
          total: response.meta.total,
          totalPages: response.meta.totalPages,
          page: response.meta.page,
          limit: response.meta.limit,
        });
      } else {
        const page = filtros.page ?? 1;
        const limit = filtros.limit ?? Math.max(response.data.length, 1);
        setMetaEmpresas({
          total: response.data.length,
          totalPages: limit ? Math.max(Math.ceil(response.data.length / limit), 1) : 1,
          page,
          limit,
        });
      }

      setEmpresaSelecionadaId((current) => {
        if (current && response.data.some((empresa) => empresa.id === current)) {
          return current;
        }
        return response.data[0]?.id ?? '';
      });

      setUltimaAtualizacao(new Date().toLocaleString('pt-BR'));
    } catch (error) {
      setErroEmpresas(getErrorMessage(error, 'Não foi possível carregar empresas'));
      setEmpresas([]);
      setMetaEmpresas((prev) => ({ ...prev, total: 0, totalPages: 0 }));
    } finally {
      setLoadingEmpresas(false);
    }
  }, [filtros]);

  const carregarContextoEmpresa = useCallback(async (empresaId: string) => {
    if (!empresaId) {
      setModulosEmpresa([]);
      setHistoricoPlanos([]);
      return;
    }

    setLoadingModulos(true);
    setErroModulos(null);
    setLoadingHistorico(true);
    setErroHistorico(null);

    try {
      const modulos = await adminModulosService.listarModulos(empresaId);
      setModulosEmpresa(modulos);
    } catch (error) {
      setErroModulos(getErrorMessage(error, 'Não foi possível carregar módulos da empresa'));
      setModulosEmpresa([]);
    } finally {
      setLoadingModulos(false);
    }

    try {
      const historico = await adminModulosService.historicoPlanos(empresaId);
      setHistoricoPlanos(historico);
    } catch (error) {
      setErroHistorico(getErrorMessage(error, 'Não foi possível carregar histórico de planos'));
      setHistoricoPlanos([]);
    } finally {
      setLoadingHistorico(false);
    }
  }, []);

  useEffect(() => {
    void carregarEmpresas();
  }, [carregarEmpresas]);

  useEffect(() => {
    if (!empresaSelecionadaId) {
      setModulosEmpresa([]);
      setHistoricoPlanos([]);
      return;
    }

    void carregarContextoEmpresa(empresaSelecionadaId);
  }, [empresaSelecionadaId, carregarContextoEmpresa]);

  const empresaSelecionada = useMemo(
    () => empresas.find((empresa) => empresa.id === empresaSelecionadaId) ?? null,
    [empresas, empresaSelecionadaId],
  );

  const metricasTopo = useMemo(() => {
    if (!empresas.length) {
      return {
        empresasAtivas: '0',
        trialsEmRisco: '0',
        modulosCriticos: '0',
        mrrEstimado: formatCurrency(0),
      };
    }

    const empresasAtivasCount = empresas.filter((empresa) => empresa.status === 'active').length;
    const trialsRiscoCount = empresas.filter(
      (empresa) => empresa.status === 'trial' && Number(empresa.health_score ?? 0) < 40,
    ).length;
    const modulosCriticosCount = modulosEmpresa.filter((modulo) => calcularUsoPercentual(modulo) >= 0.9).length;
    const mrr = empresas.reduce((total, empresa) => total + (Number(empresa.valor_mensal) || 0), 0);

    return {
      empresasAtivas: empresasAtivasCount.toString(),
      trialsEmRisco: trialsRiscoCount.toString(),
      modulosCriticos: modulosCriticosCount.toString(),
      mrrEstimado: formatCurrency(mrr),
    };
  }, [empresas, modulosEmpresa, formatCurrency, calcularUsoPercentual]);

  const modulosResumo = useMemo(() => {
    if (!modulosEmpresa.length) {
      return {
        ativos: 0,
        inativos: 0,
        alertas: [] as Array<{ modulo: ModuloEmpresa; uso: number }>,
        conectoresMonitorados: 0,
      };
    }

    let ativos = 0;
    let inativos = 0;
    const alertas: Array<{ modulo: ModuloEmpresa; uso: number }> = [];
    let conectoresMonitorados = 0;

    modulosEmpresa.forEach((modulo) => {
      if (modulo.ativo) {
        ativos += 1;
      } else {
        inativos += 1;
      }

      const usoPercentual = calcularUsoPercentual(modulo);
      if (usoPercentual >= 0.85) {
        alertas.push({ modulo, uso: usoPercentual });
      }

      if (modulo.configuracoes && Object.keys(modulo.configuracoes).length > 0) {
        conectoresMonitorados += 1;
      }
    });

    return { ativos, inativos, alertas, conectoresMonitorados };
  }, [modulosEmpresa, calcularUsoPercentual]);

  const maiorUsoModulo = useMemo(() => {
    if (!modulosEmpresa.length) {
      return 0;
    }

    return Math.round(
      Math.max(
        ...modulosEmpresa.map((modulo) => calcularUsoPercentual(modulo)),
      ) * 100,
    );
  }, [modulosEmpresa, calcularUsoPercentual]);

  const billingResumo = useMemo(() => {
    if (!empresas.length) {
      return {
        totalMRR: formatCurrency(0),
        inadimplentesValor: formatCurrencyDetalhado(0),
        inadimplentesQtd: 0,
        suspensasQtd: 0,
        trialsExpirando: 0,
      };
    }

    const totalMRR = empresas.reduce((total, empresa) => total + (Number(empresa.valor_mensal) || 0), 0);
    const inadimplentes = empresas.filter((empresa) => empresa.status === 'past_due');
    const suspensas = empresas.filter((empresa) => empresa.status === 'suspended');
    const trialsExpirando = empresas.filter((empresa) => {
      if (empresa.status !== 'trial' || !empresa.trial_end_date) {
        return false;
      }
      const diasRestantes = Math.ceil(
        (new Date(empresa.trial_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      return diasRestantes <= 7;
    });

    const inadimplentesValor = inadimplentes.reduce(
      (total, empresa) => total + (Number(empresa.valor_mensal) || 0),
      0,
    );

    return {
      totalMRR: formatCurrency(totalMRR),
      inadimplentesValor: formatCurrencyDetalhado(inadimplentesValor),
      inadimplentesQtd: inadimplentes.length,
      suspensasQtd: suspensas.length,
      trialsExpirando: trialsExpirando.length,
    };
  }, [empresas, formatCurrency, formatCurrencyDetalhado]);

  const empresasCriticas = useMemo(() => {
    return empresas
      .filter((empresa) => ['past_due', 'suspended', 'cancelled'].includes(empresa.status))
      .sort((a, b) => (Number(b.valor_mensal) || 0) - (Number(a.valor_mensal) || 0))
      .slice(0, 5);
  }, [empresas]);

  const handleFiltroChange = (field: keyof FilterEmpresasParams, value: string) => {
    setFiltros((prev) => ({
      ...prev,
      [field]: value,
      page: 1,
    }));
  };

  const handleResetFiltros = () => {
    setFiltros({ ...DEFAULT_FILTERS });
  };

  const handleNovaEmpresa = () => navigate('/admin/empresas');
  const handleVerDetalhes = (empresaId: string) => navigate(`/admin/empresas/${empresaId}`);

  const atualizarEmpresaLocal = (empresaAtualizada: EmpresaAdmin) => {
    setEmpresas((prev) => prev.map((empresa) => (empresa.id === empresaAtualizada.id ? empresaAtualizada : empresa)));
    setUltimaAtualizacao(new Date().toLocaleString('pt-BR'));
  };

  const handleSuspenderEmpresa = async (empresa: EmpresaAdmin) => {
    const motivo = window.prompt('Informe o motivo da suspensão desta empresa:');
    if (!motivo) {
      return;
    }

    try {
      setEmpresaEmAcao(empresa.id);
      const resultado = await adminEmpresasService.suspender(empresa.id, motivo);
      atualizarEmpresaLocal(resultado.empresa);
    } catch (error: unknown) {
      setErroEmpresas(getErrorMessage(error, 'Não foi possível suspender a empresa'));
    } finally {
      setEmpresaEmAcao(null);
    }
  };

  const handleReativarEmpresa = async (empresa: EmpresaAdmin) => {
    try {
      setEmpresaEmAcao(empresa.id);
      const resultado = await adminEmpresasService.reativar(empresa.id);
      atualizarEmpresaLocal(resultado.empresa);
    } catch (error: unknown) {
      setErroEmpresas(getErrorMessage(error, 'Não foi possível reativar a empresa'));
    } finally {
      setEmpresaEmAcao(null);
    }
  };

  const renderStatusBadge = (status: EmpresaAdmin['status']) => {
    const config = STATUS_BADGES[status] ?? STATUS_BADGES.active;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const renderHealthBadge = (score?: number) => {
    if (typeof score !== 'number') {
      return <span className="text-gray-500">--</span>;
    }

    const classes =
      score >= 80
        ? 'bg-[#16A34A]/10 text-[#16A34A]'
        : score >= 50
          ? 'bg-[#FBBF24]/20 text-[#92400E]'
          : 'bg-[#DC2626]/10 text-[#DC2626]';

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${classes}`}>
        {score}
      </span>
    );
  };

  const { empresasAtivas, trialsEmRisco, modulosCriticos, mrrEstimado } = metricasTopo;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="Administração" nucleusPath="/nuclei/administracao" />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="px-6 py-6">
              <div className="flex flex-col sm:flex-row justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                    <ShieldCheck className="h-8 w-8 mr-3 text-[#159A9C]" />
                    Dashboard Executivo
                  </h1>
                  <p className="mt-2 text-[#B4BEC9]">Orquestra empresas, módulos e planos com governança total.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <p className="text-sm text-gray-500">
                Última sincronização: {loadingEmpresas ? 'atualizando...' : ultimaAtualizacao || 'aguardando primeiro carregamento'}
              </p>
              <p className="text-sm text-gray-500">
                Monitorando {metaEmpresas.total} empresas | {metaEmpresas.totalPages} páginas de dados
              </p>
              {erroEmpresas && (
                <div className="mt-2 inline-flex items-center text-sm text-red-600 gap-2">
                  <AlertCircle className="h-4 w-4" /> {erroEmpresas}
                </div>
              )}
            </div>
            <button
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center gap-2 disabled:opacity-50"
              onClick={() => void carregarEmpresas()}
              disabled={loadingEmpresas}
            >
              <RefreshCw className={`w-4 h-4 ${loadingEmpresas ? 'animate-spin' : ''}`} /> Atualizar dados
            </button>
          </div>

          {/* KPI Cards - Dashboard Executivo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Empresas Ativas */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">Empresas Ativas</p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{empresasAtivas}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">Clientes em operação normal</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#16A34A]/10 flex items-center justify-center shadow-sm">
                  <Building2 className="h-6 w-6 text-[#16A34A]" />
                </div>
              </div>
            </div>

            {/* Trials em Risco */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">Trials Expirando</p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{trialsEmRisco}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">Próximos 7 dias - ação urgente</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#FBBF24]/20 flex items-center justify-center shadow-sm">
                  <Clock className="h-6 w-6 text-[#92400E]" />
                </div>
              </div>
            </div>

            {/* Módulos Críticos */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">Módulos Críticos</p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{modulosCriticos}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">Uso acima de 90% do limite</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#DC2626]/10 flex items-center justify-center shadow-sm">
                  <AlertTriangle className="h-6 w-6 text-[#DC2626]" />
                </div>
              </div>
            </div>

            {/* MRR Estimado */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">MRR Total</p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{mrrEstimado}</p>
                  <p className="mt-3 text-sm text-[#002333]/70">Receita mensal recorrente</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <DollarSign className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar empresa</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nome, CNPJ ou email..."
                    value={filtros.search || ''}
                    onChange={(e) => handleFiltroChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] text-sm"
                  />
                </div>
              </div>

              {/* Filtro Status */}
              <div className="w-full lg:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filtros.status || ''}
                  onChange={(e) => handleFiltroChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] text-sm"
                >
                  <option value="">Todos os status</option>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Plano */}
              <div className="w-full lg:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">Plano</label>
                <select
                  value={filtros.plano || ''}
                  onChange={(e) => handleFiltroChange('plano', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] text-sm"
                >
                  <option value="">Todos os planos</option>
                  {PLANO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botão Reset */}
              <div className="flex items-end">
                <button
                  onClick={handleResetFiltros}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Limpar
                </button>
              </div>
            </div>
          </div>

          {/* Tabela de Empresas */}
          <div className="bg-white rounded-lg shadow-sm border mb-8">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#002333]">Empresas Gerenciadas</h2>
              <button
                onClick={handleNovaEmpresa}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nova Empresa
              </button>
            </div>

            <div className="overflow-x-auto">
              {loadingEmpresas ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 text-[#159A9C] animate-spin" />
                  <span className="ml-3 text-gray-600">Carregando empresas...</span>
                </div>
              ) : empresas.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Nenhuma empresa encontrada</p>
                  <p className="text-sm mt-2">Ajuste os filtros ou cadastre uma nova empresa</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNPJ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plano</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor/Mês</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Acesso</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {empresas.map((empresa) => (
                      <tr key={empresa.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-[#159A9C]/10 flex items-center justify-center text-[#159A9C] font-bold">
                              {empresa.nome.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{empresa.nome}</div>
                              <div className="text-sm text-gray-500">{empresa.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{empresa.cnpj || '--'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#159A9C]/10 text-[#0F7B7D] border border-[#159A9C]/20 capitalize">
                            {empresa.plano}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(empresa.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{renderHealthBadge(empresa.health_score)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {empresa.valor_mensal ? formatCurrency(Number(empresa.valor_mensal)) : '--'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {empresa.ultimo_acesso ? formatDateTime(empresa.ultimo_acesso) : 'Nunca'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleVerDetalhes(empresa.id)}
                              className="p-2 text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors"
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {empresa.status === 'suspended' ? (
                              <button
                                onClick={() => void handleReativarEmpresa(empresa)}
                                disabled={empresaEmAcao === empresa.id}
                                className="p-2 text-[#16A34A] hover:bg-[#16A34A]/10 rounded-lg transition-colors disabled:opacity-50"
                                title="Reativar empresa"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => void handleSuspenderEmpresa(empresa)}
                                disabled={empresaEmAcao === empresa.id}
                                className="p-2 text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg transition-colors disabled:opacity-50"
                                title="Suspender empresa"
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Paginação */}
            {metaEmpresas.total > 0 && (
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {empresas.length} de {metaEmpresas.total} empresas
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFiltroChange('page', String(filtros.page - 1))}
                    disabled={filtros.page <= 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Página {filtros.page} de {metaEmpresas.totalPages}
                  </span>
                  <button
                    onClick={() => handleFiltroChange('page', String(filtros.page + 1))}
                    disabled={filtros.page >= metaEmpresas.totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Seção de Módulos */}
          <div className="bg-white rounded-lg shadow-sm border mb-8">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-[#002333] flex items-center">
                <Grid3x3 className="h-6 w-6 mr-3 text-[#159A9C]" />
                Gestão de Módulos
              </h2>
            </div>
            <div className="p-6">
              {/* Seletor de Empresa */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Selecione uma empresa para gerenciar módulos</label>
                <select
                  value={empresaSelecionadaId || ''}
                  onChange={(e) => setEmpresaSelecionadaId(e.target.value || '')}
                  className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                >
                  <option value="">-- Selecione uma empresa --</option>
                  {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nome} ({empresa.plano})
                    </option>
                  ))}
                </select>
              </div>

              {loadingModulos ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 text-[#159A9C] animate-spin" />
                  <span className="ml-3 text-gray-600">Carregando módulos...</span>
                </div>
              ) : empresaSelecionada && modulosEmpresa.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {modulosEmpresa.map((modulo) => {
                    const meta = MODULO_METADATA[modulo.modulo];
                    const Icon = meta.icon;
                    const usoPercentual = calcularUsoPercentual(modulo) * 100;
                    const isCritico = usoPercentual >= 90;

                    return (
                      <div
                        key={modulo.modulo}
                        className={`p-5 rounded-lg border ${isCritico ? 'border-[#DC2626]/40 bg-[#DC2626]/5' : 'border-[#DEEFE7]'}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-[#159A9C]/10 flex items-center justify-center">
                              <Icon className="h-5 w-5 text-[#0F7B7D]" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{meta.label}</h3>
                              <p className="text-xs text-gray-500">{meta.description}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Uso maior campo:</span>
                            <span className="font-semibold">{(usoPercentual).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${isCritico ? 'bg-[#DC2626]' : usoPercentual >= 70 ? 'bg-[#B45309]' : 'bg-[#16A34A]'}`}
                              style={{ width: `${Math.min(usoPercentual, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{usoPercentual.toFixed(1)}% utilizado</span>
                            {isCritico && <span className="text-[#DC2626] font-semibold">⚠️ Crítico</span>}
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t flex items-center justify-between">
                          <span className={`text-xs font-medium ${modulo.ativo ? 'text-[#16A34A]' : 'text-gray-400'}`}>
                            {modulo.ativo ? '✓ Ativo' : '○ Inativo'}
                          </span>
                          <button
                            className="text-xs text-[#159A9C] hover:text-[#0F7B7D] font-medium"
                            onClick={() => navigate(`/admin/empresas/${empresaSelecionadaId}/modulos/${modulo.modulo}`)}
                          >
                            Configurar →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : empresaSelecionada ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum módulo encontrado para esta empresa</p>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Grid3x3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Selecione uma empresa para visualizar os módulos</p>
                </div>
              )}
            </div>
          </div>

          {/* Billing Summary */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-[#002333] flex items-center">
                <DollarSign className="h-6 w-6 mr-3 text-[#159A9C]" />
                Resumo Financeiro
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* MRR Total */}
                <div className="p-4 rounded-lg border border-[#DEEFE7] bg-white shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">MRR Consolidado</p>
                  <p className="mt-2 text-2xl font-bold text-[#002333]">{billingResumo.totalMRR}</p>
                </div>

                {/* Inadimplentes */}
                <div className="p-4 rounded-lg border border-[#DEEFE7] bg-white shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">Inadimplentes</p>
                  <p className="mt-2 text-2xl font-bold text-[#DC2626]">{billingResumo.inadimplentesValor}</p>
                  <p className="text-xs text-[#DC2626] mt-1">{billingResumo.inadimplentesQtd} empresas</p>
                </div>

                {/* Suspensas */}
                <div className="p-4 rounded-lg border border-[#DEEFE7] bg-white shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">Suspensas</p>
                  <p className="mt-2 text-2xl font-bold text-[#B45309]">{billingResumo.suspensasQtd}</p>
                  <p className="text-xs text-[#B45309] mt-1">Reativação pendente</p>
                </div>

                {/* Trials Expirando */}
                <div className="p-4 rounded-lg border border-[#DEEFE7] bg-white shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">Trials em Risco</p>
                  <p className="mt-2 text-2xl font-bold text-[#92400E]">{billingResumo.trialsExpirando}</p>
                  <p className="text-xs text-[#92400E] mt-1">Próximos 7 dias</p>
                </div>
              </div>

              {/* Empresas Críticas */}
              {empresasCriticas.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-[#DC2626]" />
                    Empresas Críticas (Ação Imediata)
                  </h3>
                  <div className="space-y-3">
                    {empresasCriticas.map((empresa) => (
                      <div key={empresa.id} className="flex items-center justify-between p-4 bg-[#DC2626]/5 border border-[#DC2626]/30 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-[#DC2626]/10 flex items-center justify-center text-[#DC2626] font-bold">
                            {empresa.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{empresa.nome}</p>
                            <p className="text-sm text-gray-600">{empresa.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {renderStatusBadge(empresa.status)}
                          <span className="text-sm font-bold text-gray-900">
                            {empresa.valor_mensal ? formatCurrency(Number(empresa.valor_mensal)) : '--'}
                          </span>
                          <button
                            onClick={() => handleVerDetalhes(empresa.id)}
                            className="px-3 py-1 text-sm bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors"
                          >
                            Resolver
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cross-Navigation Link */}
          <div className="text-center py-6 border-t mt-8">
            <button
              onClick={() => navigate('/admin/empresas')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#159A9C] text-[#159A9C] rounded-lg hover:bg-[#159A9C]/5 transition-colors text-sm font-medium"
            >
              <Users className="h-5 w-5" />
              Acessar Gestão Completa de Empresas
              <span className="text-xs text-gray-500">(criar, editar, exportar)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminConsolePage;