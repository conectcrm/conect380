import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import { api } from '../services/api';

export type AssinaturaStatusCanonical = 'trial' | 'active' | 'past_due' | 'suspended' | 'canceled';

export interface ModuloSistema {
  id: string;
  nome: string;
  codigo: string;
  descricao: string;
  icone: string;
  cor?: string;
  ativo: boolean;
  essencial: boolean;
  ordem: number;
}

export interface Plano {
  id: string;
  nome: string;
  codigo: string;
  descricao: string;
  preco: number;
  limiteUsuarios: number;
  limiteClientes: number;
  limiteStorage: number; // bytes
  limiteApiCalls: number;
  whiteLabel: boolean;
  suportePrioritario: boolean;
  ativo: boolean;
  ordem?: number;
  modulosInclusos?: ModuloSistema[];
}

export interface AssinaturaEmpresa {
  id: string;
  empresaId: string;
  plano: Plano;
  status: AssinaturaStatusCanonical;
  statusOriginal?: string;
  dataInicio: string;
  dataFim?: string;
  proximoVencimento: string;
  valorMensal: number;
  renovacaoAutomatica: boolean;
  usuariosAtivos: number;
  clientesCadastrados: number;
  storageUtilizado: number; // bytes
  apiCallsHoje: number;
  observacoes?: string;
  billingPolicy?: BillingPolicy;
}

export interface BillingPolicy {
  isPlatformOwner: boolean;
  billingExempt: boolean;
  monitorOnlyLimits: boolean;
  fullModuleAccess: boolean;
  allowCheckout: boolean;
  allowPlanMutation: boolean;
  enforceLifecycleTransitions: boolean;
}

export interface BillingCapabilities {
  isPlatformOwner: boolean;
  billingExempt: boolean;
  monitorOnlyLimits: boolean;
  allowCheckout: boolean;
  allowPlanMutation: boolean;
  enforceLifecycleTransitions: boolean;
  checkoutEnabled: boolean;
  enabledGatewayProviders: string[];
}

export interface BillingResumoFinanceiro {
  totalFaturas: number;
  totalPagamentos: number;
  valorFaturadoTotal: number;
  valorRecebidoTotal: number;
  valorEmAberto: number;
  ultimoPagamentoEm: string | null;
  hasGatewayEnabled: boolean;
  gatewaysEnabled: string[];
}

export interface BillingHistoricoFatura {
  id: number;
  numero: string;
  status: string;
  valorTotal: number;
  valorPago: number;
  valorRestante: number;
  dataEmissao: string;
  dataVencimento: string;
  createdAt: string;
}

export interface BillingHistoricoPagamento {
  id: number;
  faturaId: number;
  transacaoId: string;
  status: string;
  tipo: string;
  valor: number;
  valorLiquido: number;
  metodoPagamento: string;
  gateway: string;
  dataAprovacao: string | null;
  createdAt: string;
}

export interface BillingHistorico {
  faturas: BillingHistoricoFatura[];
  pagamentos: BillingHistoricoPagamento[];
  limit: number;
  page: number;
  tipo: 'all' | 'faturas' | 'pagamentos';
  status: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  totalFaturas: number;
  totalPagamentos: number;
  hasNextFaturas: boolean;
  hasNextPagamentos: boolean;
}

export interface BillingHistoricoQuery {
  limit?: number;
  page?: number;
  tipo?: 'all' | 'faturas' | 'pagamentos';
  status?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
}

export interface LimitesInfo {
  usuariosAtivos: number;
  limiteUsuarios: number;
  clientesCadastrados: number;
  limiteClientes: number;
  storageUtilizado: number; // bytes
  limiteStorage: number; // bytes
  podeAdicionarUsuario: boolean;
  podeAdicionarCliente: boolean;
  storageDisponivel: number; // bytes
}

type StatusInfo = {
  status: AssinaturaStatusCanonical | 'none';
  cor: 'gray' | 'green' | 'yellow' | 'orange' | 'red';
  texto: string;
  descricao: string;
};

type RawRecord = Record<string, any>;

const ONE_MB = 1024 * 1024;
const DEFAULT_BILLING_POLICY: BillingPolicy = {
  isPlatformOwner: false,
  billingExempt: false,
  monitorOnlyLimits: false,
  fullModuleAccess: false,
  allowCheckout: true,
  allowPlanMutation: true,
  enforceLifecycleTransitions: true,
};

const DEFAULT_BILLING_CAPABILITIES: BillingCapabilities = {
  isPlatformOwner: false,
  billingExempt: false,
  monitorOnlyLimits: false,
  allowCheckout: true,
  allowPlanMutation: true,
  enforceLifecycleTransitions: true,
  checkoutEnabled: true,
  enabledGatewayProviders: [],
};

const normalizeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const toCanonicalStatus = (value: unknown): AssinaturaStatusCanonical => {
  const raw = String(value || '').toLowerCase();

  switch (raw) {
    case 'trial':
    case 'pendente':
      return 'trial';
    case 'active':
    case 'ativa':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'suspended':
    case 'suspensa':
      return 'suspended';
    case 'canceled':
    case 'cancelada':
      return 'canceled';
    default:
      return 'trial';
  }
};

const normalizeModulo = (input: any): ModuloSistema | null => {
  if (!input || typeof input !== 'object') {
    return null;
  }

  return {
    id: String(input.id || ''),
    nome: String(input.nome || ''),
    codigo: String(input.codigo || ''),
    descricao: String(input.descricao || ''),
    icone: String(input.icone || ''),
    cor: input.cor ? String(input.cor) : undefined,
    ativo: input.ativo !== false,
    essencial: Boolean(input.essencial),
    ordem: normalizeNumber(input.ordem, 0),
  };
};

const normalizePlano = (input: any): Plano => {
  const raw = (input || {}) as RawRecord;

  const modulosInclusos = Array.isArray(raw.modulosInclusos)
    ? raw.modulosInclusos
        .map((item: any) => normalizeModulo(item?.modulo ?? item))
        .filter((item: ModuloSistema | null): item is ModuloSistema => Boolean(item))
        .sort(
          (left, right) => left.ordem - right.ordem || left.nome.localeCompare(right.nome, 'pt-BR'),
        )
    : [];

  return {
    id: String(raw.id || ''),
    nome: String(raw.nome || ''),
    codigo: String(raw.codigo || ''),
    descricao: String(raw.descricao || ''),
    preco: normalizeNumber(raw.preco, 0),
    limiteUsuarios: normalizeNumber(raw.limiteUsuarios, 0),
    limiteClientes: normalizeNumber(raw.limiteClientes, 0),
    limiteStorage: normalizeNumber(raw.limiteStorage, 0),
    limiteApiCalls: normalizeNumber(raw.limiteApiCalls, 0),
    whiteLabel: Boolean(raw.whiteLabel),
    suportePrioritario: Boolean(raw.suportePrioritario),
    ativo: raw.ativo !== false,
    ordem: normalizeNumber(raw.ordem, 0),
    modulosInclusos,
  };
};

const normalizeAssinatura = (input: any): AssinaturaEmpresa | null => {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const raw = input as RawRecord;
  const statusOriginal = raw.status ? String(raw.status) : 'trial';

  return {
    id: String(raw.id || ''),
    empresaId: String(raw.empresaId || ''),
    plano: normalizePlano(raw.plano),
    status: toCanonicalStatus(raw.status),
    statusOriginal,
    dataInicio: String(raw.dataInicio || ''),
    dataFim: raw.dataFim ? String(raw.dataFim) : undefined,
    proximoVencimento: String(raw.proximoVencimento || ''),
    valorMensal: normalizeNumber(raw.valorMensal, 0),
    renovacaoAutomatica: raw.renovacaoAutomatica !== false,
    usuariosAtivos: normalizeNumber(raw.usuariosAtivos, 0),
    clientesCadastrados: normalizeNumber(raw.clientesCadastrados, 0),
    storageUtilizado: normalizeNumber(raw.storageUtilizado, 0),
    apiCallsHoje: normalizeNumber(raw.apiCallsHoje, 0),
    observacoes: raw.observacoes ? String(raw.observacoes) : undefined,
    billingPolicy: normalizeBillingPolicy(raw.billingPolicy),
  };
};

const normalizeBillingPolicy = (input: any): BillingPolicy => {
  if (!input || typeof input !== 'object') {
    return DEFAULT_BILLING_POLICY;
  }

  const raw = input as RawRecord;
  return {
    isPlatformOwner: Boolean(raw.isPlatformOwner),
    billingExempt: Boolean(raw.billingExempt),
    monitorOnlyLimits:
      raw.monitorOnlyLimits !== undefined
        ? Boolean(raw.monitorOnlyLimits)
        : Boolean(raw.billingExempt),
    fullModuleAccess: Boolean(raw.fullModuleAccess),
    allowCheckout: raw.allowCheckout !== false,
    allowPlanMutation: raw.allowPlanMutation !== false,
    enforceLifecycleTransitions: raw.enforceLifecycleTransitions !== false,
  };
};

const normalizeLimites = (input: any): LimitesInfo | null => {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const raw = input as RawRecord;
  const limiteUsuarios = normalizeNumber(raw.limiteUsuarios, 0);
  const limiteClientes = normalizeNumber(raw.limiteClientes, 0);
  const limiteStorage = normalizeNumber(raw.limiteStorage, 0);

  return {
    usuariosAtivos: normalizeNumber(raw.usuariosAtivos, 0),
    limiteUsuarios,
    clientesCadastrados: normalizeNumber(raw.clientesCadastrados, 0),
    limiteClientes,
    storageUtilizado: normalizeNumber(raw.storageUtilizado, 0),
    limiteStorage,
    podeAdicionarUsuario:
      raw.podeAdicionarUsuario !== undefined
        ? Boolean(raw.podeAdicionarUsuario)
        : limiteUsuarios < 0 || normalizeNumber(raw.usuariosAtivos, 0) < limiteUsuarios,
    podeAdicionarCliente:
      raw.podeAdicionarCliente !== undefined
        ? Boolean(raw.podeAdicionarCliente)
        : limiteClientes < 0 || normalizeNumber(raw.clientesCadastrados, 0) < limiteClientes,
    storageDisponivel:
      raw.storageDisponivel !== undefined
        ? normalizeNumber(raw.storageDisponivel, 0)
        : limiteStorage < 0
          ? -1
          : Math.max(0, limiteStorage - normalizeNumber(raw.storageUtilizado, 0)),
  };
};

const normalizeBillingCapabilities = (input: any): BillingCapabilities => {
  if (!input || typeof input !== 'object') {
    return DEFAULT_BILLING_CAPABILITIES;
  }

  const raw = input as RawRecord;
  const enabledGatewayProviders = Array.isArray(raw.enabledGatewayProviders)
    ? raw.enabledGatewayProviders
        .map((item: unknown) =>
          String(item || '')
            .trim()
            .toLowerCase(),
        )
        .filter((item: string) => item.length > 0)
    : [];

  return {
    isPlatformOwner: Boolean(raw.isPlatformOwner),
    billingExempt: Boolean(raw.billingExempt),
    monitorOnlyLimits: Boolean(raw.monitorOnlyLimits),
    allowCheckout: raw.allowCheckout !== false,
    allowPlanMutation: raw.allowPlanMutation !== false,
    enforceLifecycleTransitions: raw.enforceLifecycleTransitions !== false,
    checkoutEnabled:
      raw.checkoutEnabled !== undefined
        ? Boolean(raw.checkoutEnabled)
        : raw.allowCheckout !== false && enabledGatewayProviders.length > 0,
    enabledGatewayProviders,
  };
};

const normalizeBillingResumoFinanceiro = (input: any): BillingResumoFinanceiro | null => {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const raw = input as RawRecord;
  const gatewaysEnabled = Array.isArray(raw.gatewaysEnabled)
    ? raw.gatewaysEnabled
        .map((item: unknown) =>
          String(item || '')
            .trim()
            .toLowerCase(),
        )
        .filter((item: string) => item.length > 0)
    : [];

  return {
    totalFaturas: normalizeNumber(raw.totalFaturas, 0),
    totalPagamentos: normalizeNumber(raw.totalPagamentos, 0),
    valorFaturadoTotal: normalizeNumber(raw.valorFaturadoTotal, 0),
    valorRecebidoTotal: normalizeNumber(raw.valorRecebidoTotal, 0),
    valorEmAberto: normalizeNumber(raw.valorEmAberto, 0),
    ultimoPagamentoEm:
      raw.ultimoPagamentoEm && typeof raw.ultimoPagamentoEm === 'string'
        ? raw.ultimoPagamentoEm
        : null,
    hasGatewayEnabled:
      raw.hasGatewayEnabled !== undefined
        ? Boolean(raw.hasGatewayEnabled)
        : gatewaysEnabled.length > 0,
    gatewaysEnabled,
  };
};

const normalizeBillingHistorico = (input: any): BillingHistorico | null => {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const raw = input as RawRecord;
  const faturasRaw = Array.isArray(raw.faturas) ? raw.faturas : [];
  const pagamentosRaw = Array.isArray(raw.pagamentos) ? raw.pagamentos : [];
  const limit = normalizeNumber(raw.limit, 20);
  const page = normalizeNumber(raw.page, 1);
  const tipoRaw = String(raw.tipo || 'all')
    .trim()
    .toLowerCase();
  const tipo: 'all' | 'faturas' | 'pagamentos' =
    tipoRaw === 'faturas' || tipoRaw === 'pagamentos' ? tipoRaw : 'all';
  const status =
    raw.status && typeof raw.status === 'string' && raw.status.trim().length > 0
      ? raw.status
      : null;
  const dataInicio =
    raw.dataInicio && typeof raw.dataInicio === 'string' && raw.dataInicio.trim().length > 0
      ? raw.dataInicio
      : null;
  const dataFim =
    raw.dataFim && typeof raw.dataFim === 'string' && raw.dataFim.trim().length > 0
      ? raw.dataFim
      : null;
  const totalFaturas = normalizeNumber(raw.totalFaturas, faturasRaw.length);
  const totalPagamentos = normalizeNumber(raw.totalPagamentos, pagamentosRaw.length);
  const hasNextFaturas =
    raw.hasNextFaturas !== undefined ? Boolean(raw.hasNextFaturas) : page * limit < totalFaturas;
  const hasNextPagamentos =
    raw.hasNextPagamentos !== undefined
      ? Boolean(raw.hasNextPagamentos)
      : page * limit < totalPagamentos;

  return {
    faturas: faturasRaw.map((item: RawRecord) => ({
      id: normalizeNumber(item.id, 0),
      numero: String(item.numero || ''),
      status: String(item.status || ''),
      valorTotal: normalizeNumber(item.valorTotal, 0),
      valorPago: normalizeNumber(item.valorPago, 0),
      valorRestante: normalizeNumber(item.valorRestante, 0),
      dataEmissao: String(item.dataEmissao || ''),
      dataVencimento: String(item.dataVencimento || ''),
      createdAt: String(item.createdAt || ''),
    })),
    pagamentos: pagamentosRaw.map((item: RawRecord) => ({
      id: normalizeNumber(item.id, 0),
      faturaId: normalizeNumber(item.faturaId, 0),
      transacaoId: String(item.transacaoId || ''),
      status: String(item.status || ''),
      tipo: String(item.tipo || ''),
      valor: normalizeNumber(item.valor, 0),
      valorLiquido: normalizeNumber(item.valorLiquido, 0),
      metodoPagamento: String(item.metodoPagamento || ''),
      gateway: String(item.gateway || ''),
      dataAprovacao:
        item.dataAprovacao && typeof item.dataAprovacao === 'string' ? item.dataAprovacao : null,
      createdAt: String(item.createdAt || ''),
    })),
    limit,
    page,
    tipo,
    status,
    dataInicio,
    dataFim,
    totalFaturas,
    totalPagamentos,
    hasNextFaturas,
    hasNextPagamentos,
  };
};

const normalizePlanosVisiveis = (input: unknown): Plano[] => {
  const planosNormalizados = Array.isArray(input)
    ? input.map((item: any) => normalizePlano(item))
    : [];

  const planosAtivos = planosNormalizados
    .filter((plano) => plano.ativo)
    .sort((left, right) => {
      const ordemLeft = typeof left.ordem === 'number' ? left.ordem : 0;
      const ordemRight = typeof right.ordem === 'number' ? right.ordem : 0;

      if (ordemLeft !== ordemRight) {
        return ordemLeft - ordemRight;
      }

      if (left.preco !== right.preco) {
        return left.preco - right.preco;
      }

      return left.nome.localeCompare(right.nome, 'pt-BR');
    });

  const planosCanonicos = planosAtivos.filter((plano) =>
    CANONICAL_PLAN_CODES.has(
      String(plano.codigo || '')
        .trim()
        .toLowerCase(),
    ),
  );

  return planosCanonicos.length > 0 ? planosCanonicos : planosAtivos;
};

const ACCESS_STATUSES: AssinaturaStatusCanonical[] = ['trial', 'active', 'past_due'];
const CANONICAL_PLAN_CODES = new Set(['starter', 'business', 'enterprise']);

export const useSubscription = () => {
  const { user } = useAuth();
  const [assinatura, setAssinatura] = useState<AssinaturaEmpresa | null>(null);
  const [limites, setLimites] = useState<LimitesInfo | null>(null);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [billingCapabilities, setBillingCapabilities] = useState<BillingCapabilities | null>(null);
  const [billingResumoFinanceiro, setBillingResumoFinanceiro] =
    useState<BillingResumoFinanceiro | null>(null);
  const [billingHistorico, setBillingHistorico] = useState<BillingHistorico | null>(null);
  const [billingHistoricoLoading, setBillingHistoricoLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const empresaId = useMemo(() => {
    if (user?.empresa?.id) {
      return user.empresa.id;
    }

    if (typeof window !== 'undefined') {
      return localStorage.getItem('empresaAtiva');
    }

    return null;
  }, [user?.empresa?.id]);

  const buscarAssinatura = useCallback(async () => {
    if (!empresaId) {
      setAssinatura(null);
      setLimites(null);
      setBillingCapabilities(null);
      setBillingResumoFinanceiro(null);
      setBillingHistorico(null);
      setBillingHistoricoLoading(false);
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      try {
        const overviewResponse = await api.get('/billing/self-service/overview');
        const overviewPayload =
          overviewResponse?.data &&
          typeof overviewResponse.data === 'object' &&
          overviewResponse.data.data
            ? overviewResponse.data.data
            : overviewResponse?.data;

        if (overviewPayload && typeof overviewPayload === 'object') {
          const assinaturaNormalizada = normalizeAssinatura(
            (overviewPayload as RawRecord).assinatura,
          );
          const limitesNormalizados = normalizeLimites((overviewPayload as RawRecord).limites);
          const planosNormalizados = normalizePlanosVisiveis((overviewPayload as RawRecord).planos);

          setAssinatura(assinaturaNormalizada);
          setLimites(limitesNormalizados);
          if (planosNormalizados.length > 0) {
            setPlanos(planosNormalizados);
          }
          setBillingCapabilities(
            normalizeBillingCapabilities((overviewPayload as RawRecord).capabilities),
          );
          setBillingResumoFinanceiro(
            normalizeBillingResumoFinanceiro((overviewPayload as RawRecord).resumoFinanceiro),
          );
          setError(null);
          return assinaturaNormalizada;
        }
      } catch (_overviewError) {
        // fallback para endpoints legados abaixo
      }

      const response = await api.get(`/assinaturas/empresa/${empresaId}`);
      const assinaturaNormalizada = normalizeAssinatura(response.data);
      setAssinatura(assinaturaNormalizada);
      setBillingCapabilities(
        assinaturaNormalizada?.billingPolicy
          ? {
              isPlatformOwner: Boolean(assinaturaNormalizada.billingPolicy.isPlatformOwner),
              billingExempt: Boolean(assinaturaNormalizada.billingPolicy.billingExempt),
              monitorOnlyLimits: Boolean(assinaturaNormalizada.billingPolicy.monitorOnlyLimits),
              allowCheckout: Boolean(assinaturaNormalizada.billingPolicy.allowCheckout),
              allowPlanMutation: Boolean(assinaturaNormalizada.billingPolicy.allowPlanMutation),
              enforceLifecycleTransitions: Boolean(
                assinaturaNormalizada.billingPolicy.enforceLifecycleTransitions,
              ),
              checkoutEnabled: Boolean(assinaturaNormalizada.billingPolicy.allowCheckout),
              enabledGatewayProviders: [],
            }
          : DEFAULT_BILLING_CAPABILITIES,
      );
      setBillingResumoFinanceiro(null);
      setError(null);
      return assinaturaNormalizada;
    } catch (err: any) {
      if (err.response?.status === 404) {
        setAssinatura(null);
        setLimites(null);
        setBillingCapabilities(null);
        setBillingResumoFinanceiro(null);
        setBillingHistorico(null);
        setBillingHistoricoLoading(false);
        setError(null);
        return null;
      }

      console.error('Erro ao buscar assinatura:', err);
      setError('Erro ao carregar informacoes da assinatura');
      return null;
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  const buscarHistoricoBilling = useCallback(
    async (query: number | BillingHistoricoQuery = 20) => {
      if (!empresaId) {
        setBillingHistorico(null);
        setBillingHistoricoLoading(false);
        return null;
      }

      try {
        setBillingHistoricoLoading(true);
        const normalizedQuery: BillingHistoricoQuery =
          typeof query === 'number' ? { limit: query } : query;
        const params: Record<string, unknown> = {
          limit: normalizedQuery.limit ?? 20,
        };

        if (normalizedQuery.page && normalizedQuery.page > 0) {
          params.page = normalizedQuery.page;
        }
        if (normalizedQuery.tipo && normalizedQuery.tipo !== 'all') {
          params.tipo = normalizedQuery.tipo;
        } else if (normalizedQuery.tipo === 'all') {
          params.tipo = 'all';
        }
        if (normalizedQuery.status && String(normalizedQuery.status).trim().length > 0) {
          params.status = String(normalizedQuery.status).trim();
        }
        if (normalizedQuery.dataInicio) {
          params.dataInicio = normalizedQuery.dataInicio;
        }
        if (normalizedQuery.dataFim) {
          params.dataFim = normalizedQuery.dataFim;
        }

        const response = await api.get('/billing/self-service/history', {
          params,
        });
        const payload =
          response?.data && typeof response.data === 'object' && response.data.data
            ? response.data.data
            : response?.data;
        const historicoNormalizado = normalizeBillingHistorico(payload);
        setBillingHistorico(historicoNormalizado);
        return historicoNormalizado;
      } catch (err) {
        console.error('Erro ao buscar historico de billing:', err);
        setBillingHistorico(null);
        return null;
      } finally {
        setBillingHistoricoLoading(false);
      }
    },
    [empresaId],
  );

  const buscarLimites = useCallback(async () => {
    if (!empresaId || !assinatura) {
      return null;
    }

    try {
      const response = await api.get(`/assinaturas/empresa/${empresaId}/limites`);
      const limitesNormalizados = normalizeLimites(response.data);
      setLimites(limitesNormalizados);
      return limitesNormalizados;
    } catch (err) {
      console.error('Erro ao buscar limites:', err);
      return null;
    }
  }, [empresaId, assinatura]);

  const buscarPlanos = useCallback(async () => {
    try {
      const response = await api.get('/planos');
      const planosVisiveis = normalizePlanosVisiveis(response.data);

      setPlanos(planosVisiveis);
      return planosVisiveis;
    } catch (err) {
      console.error('Erro ao buscar planos:', err);
      return [];
    }
  }, []);

  const alterarPlano = useCallback(
    async (novoPlanoId: string) => {
      if (!empresaId) {
        throw new Error('Empresa nao identificada');
      }

      try {
        const response = await api.patch(`/assinaturas/empresa/${empresaId}/plano`, {
          novoPlanoId,
        });

        const assinaturaAtualizada = normalizeAssinatura(response.data);
        setAssinatura(assinaturaAtualizada);
        await buscarLimites();
        return assinaturaAtualizada;
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Erro ao alterar plano');
      }
    },
    [empresaId, buscarLimites],
  );

  const cancelarAssinatura = useCallback(
    async (dataFim?: string) => {
      if (!empresaId) {
        throw new Error('Empresa nao identificada');
      }

      try {
        const response = await api.patch(`/assinaturas/empresa/${empresaId}/cancelar`, {
          dataFim,
        });

        const assinaturaAtualizada = normalizeAssinatura(response.data);
        setAssinatura(assinaturaAtualizada);
        return assinaturaAtualizada;
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Erro ao cancelar assinatura');
      }
    },
    [empresaId],
  );

  const temAcessoModulo = useCallback(
    (codigoModulo: string): boolean => {
      if (!assinatura) {
        return false;
      }

      if (assinatura.billingPolicy?.fullModuleAccess) {
        return true;
      }

      const assinaturaComAcesso =
        assinatura.billingPolicy?.billingExempt || ACCESS_STATUSES.includes(assinatura.status);
      if (!assinaturaComAcesso) {
        return false;
      }

      const target = String(codigoModulo || '')
        .trim()
        .toUpperCase();
      if (!target) {
        return false;
      }

      const modulos = assinatura.plano.modulosInclusos || [];
      return modulos.some((modulo) => modulo.ativo && modulo.codigo.toUpperCase() === target);
    },
    [assinatura],
  );

  const podeExecutarAcao = useCallback(
    (tipo: 'usuario' | 'cliente' | 'storage', quantidade = 1): boolean => {
      if (!limites) {
        return false;
      }

      switch (tipo) {
        case 'usuario':
          return limites.limiteUsuarios < 0
            ? true
            : limites.usuariosAtivos + quantidade <= limites.limiteUsuarios;
        case 'cliente':
          return limites.limiteClientes < 0
            ? true
            : limites.clientesCadastrados + quantidade <= limites.limiteClientes;
        case 'storage':
          return limites.limiteStorage < 0
            ? true
            : limites.storageUtilizado + quantidade <= limites.limiteStorage;
        default:
          return false;
      }
    },
    [limites],
  );

  const calcularProgresso = useCallback(() => {
    if (!limites) {
      return null;
    }

    const percentual = (usado: number, total: number) => {
      if (total < 0) {
        return 0;
      }

      if (total === 0) {
        return 0;
      }

      return Math.min((usado / total) * 100, 100);
    };

    const usuariosTotal = limites.limiteUsuarios;
    const clientesTotal = limites.limiteClientes;
    const storageTotalBytes = limites.limiteStorage;
    const storageTotalMb = storageTotalBytes < 0 ? -1 : Math.round(storageTotalBytes / ONE_MB);

    return {
      usuarios: {
        usado: limites.usuariosAtivos,
        total: usuariosTotal,
        percentual: percentual(limites.usuariosAtivos, usuariosTotal),
      },
      clientes: {
        usado: limites.clientesCadastrados,
        total: clientesTotal,
        percentual: percentual(limites.clientesCadastrados, clientesTotal),
      },
      storage: {
        usado: Math.round(limites.storageUtilizado / ONE_MB),
        total: storageTotalMb,
        percentual: percentual(limites.storageUtilizado, storageTotalBytes),
      },
    };
  }, [limites]);

  const getStatusInfo = useCallback((): StatusInfo => {
    if (!assinatura) {
      return {
        status: 'none',
        cor: 'gray',
        texto: 'Sem assinatura',
        descricao: 'Empresa nao possui assinatura cadastrada',
      };
    }

    if (assinatura.billingPolicy?.isPlatformOwner) {
      return {
        status: 'active',
        cor: 'green',
        texto: 'Interno',
        descricao: 'Tenant proprietario com politica interna de cobranca',
      };
    }

    const map: Record<AssinaturaStatusCanonical, StatusInfo> = {
      trial: {
        status: 'trial',
        cor: 'yellow',
        texto: 'Trial',
        descricao: 'Periodo de avaliacao ou aguardando confirmacao',
      },
      active: {
        status: 'active',
        cor: 'green',
        texto: 'Ativa',
        descricao: 'Assinatura funcionando normalmente',
      },
      past_due: {
        status: 'past_due',
        cor: 'orange',
        texto: 'Inadimplente',
        descricao: 'Pagamento pendente, com acesso temporario',
      },
      suspended: {
        status: 'suspended',
        cor: 'red',
        texto: 'Suspensa',
        descricao: 'Acesso suspenso ate regularizacao',
      },
      canceled: {
        status: 'canceled',
        cor: 'gray',
        texto: 'Cancelada',
        descricao: 'Assinatura encerrada',
      },
    };

    return map[assinatura.status];
  }, [assinatura]);

  useEffect(() => {
    if (!empresaId) {
      setAssinatura(null);
      setLimites(null);
      setPlanos([]);
      setBillingCapabilities(null);
      setBillingResumoFinanceiro(null);
      setBillingHistorico(null);
      setBillingHistoricoLoading(false);
      setLoading(false);
      return;
    }

    void buscarAssinatura();
    void buscarPlanos();
    void buscarHistoricoBilling();
  }, [empresaId, buscarAssinatura, buscarPlanos, buscarHistoricoBilling]);

  useEffect(() => {
    if (assinatura) {
      void buscarLimites();
      return;
    }

    setLimites(null);
  }, [assinatura, buscarLimites]);

  return {
    assinatura,
    limites,
    planos,
    billingCapabilities: billingCapabilities || DEFAULT_BILLING_CAPABILITIES,
    billingResumoFinanceiro,
    billingHistorico,
    billingHistoricoLoading,
    loading,
    error,

    buscarAssinatura,
    buscarLimites,
    buscarPlanos,
    buscarHistoricoBilling,
    alterarPlano,
    cancelarAssinatura,

    temAcessoModulo,
    podeExecutarAcao,
    calcularProgresso,
    getStatusInfo,

    temAssinatura: !!assinatura,
    assinaturaAtiva: Boolean(
      assinatura && (assinatura.status === 'active' || assinatura.billingPolicy?.billingExempt),
    ),
    isOwnerTenant: Boolean(assinatura?.billingPolicy?.isPlatformOwner),
    billingPolicy: assinatura?.billingPolicy || DEFAULT_BILLING_POLICY,
    podeFazerCheckout: Boolean(
      billingCapabilities?.checkoutEnabled ?? assinatura?.billingPolicy?.allowCheckout ?? true,
    ),
    podeAlterarPlano: Boolean(
      billingCapabilities?.allowPlanMutation ??
      assinatura?.billingPolicy?.allowPlanMutation ??
      true,
    ),
    precisaUpgrade: (modulo: string) => !temAcessoModulo(modulo),
  };
};
