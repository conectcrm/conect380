import api from './api';

export enum ModuloEnum {
  ATENDIMENTO = 'ATENDIMENTO',
  CRM = 'CRM',
  VENDAS = 'VENDAS',
  FINANCEIRO = 'FINANCEIRO',
  BILLING = 'BILLING',
  ADMINISTRACAO = 'ADMINISTRACAO',
}

export enum PlanoEnum {
  STARTER = 'STARTER',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
}

export interface EmpresaModulo {
  id: string;
  empresa_id: string;
  modulo: ModuloEnum;
  ativo: boolean;
  data_ativacao: string;
  data_expiracao: string | null;
  plano: PlanoEnum | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEmpresaModuloDto {
  modulo: ModuloEnum;
  ativo?: boolean;
  data_expiracao?: string;
  plano?: PlanoEnum;
}

const MODULOS_ATIVOS_CACHE_TTL_MS = 60_000;
const RATE_LIMIT_BACKOFF_MS = 60_000;

let modulosAtivosCache: ModuloEnum[] | null = null;
let modulosAtivosCacheAt = 0;
let modulosAtivosRequest: Promise<ModuloEnum[]> | null = null;
let modulosAtivosRateLimitedUntil = 0;

const isRateLimitError = (error: unknown): boolean => {
  return Boolean((error as any)?.response?.status === 429);
};

const getCachedModulosAtivos = (): ModuloEnum[] | null => {
  if (!modulosAtivosCache) {
    return null;
  }

  if (Date.now() - modulosAtivosCacheAt > MODULOS_ATIVOS_CACHE_TTL_MS) {
    modulosAtivosCache = null;
    return null;
  }

  return [...modulosAtivosCache];
};

const setCachedModulosAtivos = (modulos: ModuloEnum[]): void => {
  modulosAtivosCache = [...modulos];
  modulosAtivosCacheAt = Date.now();
};

/**
 * Service para gerenciar licenciamento de modulos da empresa.
 */
export const modulosService = {
  /**
   * Lista modulos ativos da empresa logada.
   * Possui cache de curta duracao + dedupe de request em voo.
   */
  async listarModulosAtivos(): Promise<ModuloEnum[]> {
    const cached = getCachedModulosAtivos();
    if (cached) {
      return cached;
    }

    if (Date.now() < modulosAtivosRateLimitedUntil && modulosAtivosCache) {
      return [...modulosAtivosCache];
    }

    if (modulosAtivosRequest) {
      return modulosAtivosRequest;
    }

    modulosAtivosRequest = api
      .get('/empresas/modulos/ativos')
      .then((response) => {
        const modulos = Array.isArray(response.data?.data) ? response.data.data : [];
        setCachedModulosAtivos(modulos);
        modulosAtivosRateLimitedUntil = 0;
        return [...modulos];
      })
      .catch((error) => {
        if (isRateLimitError(error)) {
          modulosAtivosRateLimitedUntil = Date.now() + RATE_LIMIT_BACKOFF_MS;

          // Se houver cache, usa o ultimo snapshot para nao quebrar a UX.
          if (modulosAtivosCache) {
            return [...modulosAtivosCache];
          }
        }

        throw error;
      })
      .finally(() => {
        modulosAtivosRequest = null;
      });

    return modulosAtivosRequest;
  },

  /**
   * Lista todos os modulos (ativos e inativos).
   */
  async listar(): Promise<EmpresaModulo[]> {
    const response = await api.get('/empresas/modulos');
    return response.data.data;
  },

  /**
   * Verifica se modulo esta ativo.
   */
  async isModuloAtivo(modulo: ModuloEnum): Promise<boolean> {
    const response = await api.get(`/empresas/modulos/verificar/${modulo}`);
    return response.data.data.ativo;
  },

  /**
   * Retorna plano atual da empresa.
   */
  async getPlanoAtual(): Promise<PlanoEnum | null> {
    const response = await api.get('/empresas/modulos/plano');
    return response.data.data.plano;
  },

  /**
   * Ativa modulo.
   */
  async ativar(dto: CreateEmpresaModuloDto): Promise<EmpresaModulo> {
    const response = await api.post('/empresas/modulos/ativar', dto);
    return response.data.data;
  },

  /**
   * Desativa modulo.
   */
  async desativar(modulo: ModuloEnum): Promise<void> {
    await api.delete(`/empresas/modulos/${modulo}`);
  },

  /**
   * Ativa plano completo (Starter, Business, Enterprise).
   */
  async ativarPlano(plano: PlanoEnum): Promise<void> {
    await api.post(`/empresas/modulos/plano/${plano}`);
  },
};
