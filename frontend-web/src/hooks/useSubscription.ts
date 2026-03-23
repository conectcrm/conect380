import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import { api } from '../services/api';

export type AssinaturaStatusCanonical =
  | 'trial'
  | 'active'
  | 'past_due'
  | 'suspended'
  | 'canceled';

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
        .sort((left, right) => left.ordem - right.ordem || left.nome.localeCompare(right.nome, 'pt-BR'))
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

const ACCESS_STATUSES: AssinaturaStatusCanonical[] = ['trial', 'active', 'past_due'];
const CANONICAL_PLAN_CODES = new Set(['starter', 'business', 'enterprise']);

export const useSubscription = () => {
  const { user } = useAuth();
  const [assinatura, setAssinatura] = useState<AssinaturaEmpresa | null>(null);
  const [limites, setLimites] = useState<LimitesInfo | null>(null);
  const [planos, setPlanos] = useState<Plano[]>([]);
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
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      const response = await api.get(`/assinaturas/empresa/${empresaId}`);
      const assinaturaNormalizada = normalizeAssinatura(response.data);
      setAssinatura(assinaturaNormalizada);
      setError(null);
      return assinaturaNormalizada;
    } catch (err: any) {
      if (err.response?.status === 404) {
        setAssinatura(null);
        setLimites(null);
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
      const planosNormalizados = Array.isArray(response.data)
        ? response.data.map((item: any) => normalizePlano(item))
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
        CANONICAL_PLAN_CODES.has(String(plano.codigo || '').trim().toLowerCase()),
      );

      const planosVisiveis = planosCanonicos.length > 0 ? planosCanonicos : planosAtivos;

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

      const target = String(codigoModulo || '').trim().toUpperCase();
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
      setLoading(false);
      return;
    }

    void buscarAssinatura();
    void buscarPlanos();
  }, [empresaId, buscarAssinatura, buscarPlanos]);

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
    loading,
    error,

    buscarAssinatura,
    buscarLimites,
    buscarPlanos,
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
    podeFazerCheckout: Boolean(assinatura?.billingPolicy?.allowCheckout ?? true),
    podeAlterarPlano: Boolean(assinatura?.billingPolicy?.allowPlanMutation ?? true),
    precisaUpgrade: (modulo: string) => !temAcessoModulo(modulo),
  };
};
