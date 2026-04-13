import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AssinaturasService } from '../planos/assinaturas.service';
import { toCanonicalAssinaturaStatus } from '../planos/entities/assinatura-empresa.entity';
import { hasSubscriptionAccess } from '../planos/subscription-state-machine';

interface AuthenticatedRequest extends Request {
  user?: {
    empresaId?: string;
    empresa_id?: string;
    userId?: string;
    id?: string;
    email?: string;
  };
}

type EntitlementModule =
  | 'CRM'
  | 'ATENDIMENTO'
  | 'VENDAS'
  | 'COMPRAS'
  | 'FINANCEIRO'
  | 'BILLING'
  | 'ADMINISTRACAO'
  | 'IA';

const PATH_PREFIX_TO_MODULE: Array<{ prefix: string; module: EntitlementModule }> = [
  { prefix: '/crm', module: 'CRM' },
  { prefix: '/clientes', module: 'CRM' },
  { prefix: '/contatos', module: 'CRM' },
  { prefix: '/leads', module: 'CRM' },
  { prefix: '/oportunidades', module: 'CRM' },
  { prefix: '/eventos', module: 'CRM' },
  { prefix: '/agenda-eventos', module: 'CRM' },
  { prefix: '/interacoes', module: 'CRM' },

  { prefix: '/propostas', module: 'VENDAS' },
  { prefix: '/contratos', module: 'VENDAS' },
  { prefix: '/metas', module: 'VENDAS' },
  { prefix: '/email', module: 'VENDAS' },
  { prefix: '/produtos', module: 'VENDAS' },
  { prefix: '/categorias-produtos', module: 'VENDAS' },
  { prefix: '/configuracoes-produtos', module: 'VENDAS' },
  { prefix: '/subcategorias-produtos', module: 'VENDAS' },
  { prefix: '/vehicle-inventory', module: 'VENDAS' },

  { prefix: '/cotacao', module: 'COMPRAS' },
  { prefix: '/orcamento', module: 'COMPRAS' },

  { prefix: '/financeiro', module: 'FINANCEIRO' },
  { prefix: '/faturamento', module: 'FINANCEIRO' },
  { prefix: '/pagamentos', module: 'FINANCEIRO' },
  { prefix: '/comissoes', module: 'VENDAS' },
  { prefix: '/mercadopago', module: 'FINANCEIRO' },
  { prefix: '/fornecedores', module: 'FINANCEIRO' },
  { prefix: '/contas-pagar', module: 'FINANCEIRO' },
  { prefix: '/centros-custo', module: 'FINANCEIRO' },
  { prefix: '/contas-bancarias', module: 'FINANCEIRO' },
  { prefix: '/conciliacao-bancaria', module: 'FINANCEIRO' },
  { prefix: '/atendimento', module: 'ATENDIMENTO' },
  { prefix: '/filas', module: 'ATENDIMENTO' },
  { prefix: '/triagem', module: 'ATENDIMENTO' },
  { prefix: '/distribuicao-avancada', module: 'ATENDIMENTO' },
  { prefix: '/configuracoes-tickets', module: 'ATENDIMENTO' },
  { prefix: '/nucleos', module: 'ATENDIMENTO' },
  { prefix: '/fluxos', module: 'ATENDIMENTO' },
  { prefix: '/equipes', module: 'ATENDIMENTO' },
  { prefix: '/departamentos', module: 'ATENDIMENTO' },
  { prefix: '/atribuicoes', module: 'ATENDIMENTO' },
  { prefix: '/demandas', module: 'ATENDIMENTO' },
  { prefix: '/tags', module: 'ATENDIMENTO' },
  { prefix: '/notas', module: 'ATENDIMENTO' },
  { prefix: '/redmine', module: 'ATENDIMENTO' },

  { prefix: '/ia', module: 'IA' },

];

const MODULE_ACCEPTED_CODES: Record<EntitlementModule, string[]> = {
  CRM: [
    'CRM',
    'CLIENTES',
    'LEADS',
    'OPORTUNIDADES',
    'PRODUTOS',
    'CATEGORIAS_PRODUTOS',
    'AGENDA',
    'INTERACOES',
  ],
  ATENDIMENTO: ['ATENDIMENTO', 'SUPORTE', 'WHATSAPP', 'CHAT', 'TRIAGEM'],
  VENDAS: ['VENDAS', 'PROPOSTAS', 'CONTRATOS', 'METAS', 'PRODUTOS', 'VEICULOS'],
  COMPRAS: ['COMPRAS', 'COTACAO', 'ORCAMENTO'],
  FINANCEIRO: [
    'FINANCEIRO',
    'FATURAMENTO',
    'PAGAMENTOS',
    'FORNECEDORES',
    'CONTAS_PAGAR',
    'CENTROS_CUSTO',
    'CONTAS_BANCARIAS',
    'CONCILIACAO_BANCARIA',
  ],
  BILLING: ['BILLING', 'ASSINATURAS', 'PLANOS', 'COBRANCAS'],
  ADMINISTRACAO: ['ADMINISTRACAO', 'ADMIN', 'USUARIOS', 'USERS', 'EMPRESAS'],
  IA: ['IA', 'CRM', 'ATENDIMENTO'],
};

@Injectable()
export class AssinaturaMiddleware implements NestMiddleware {
  constructor(private readonly assinaturasService: AssinaturasService) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const coreAdminDocsPath = this.resolveCoreAdminDocsPath();
    const normalizedPath = String(req.path || '').toLowerCase();
    const skipRoutes = [
      '/auth/',
      '/planos',
      '/assinaturas',
      '/core-admin',
      '/health',
      '/docs',
      '/api-docs',
      `/${coreAdminDocsPath}`,
      `/${coreAdminDocsPath}-json`,
      '/metrics',
    ];
    const shouldSkip = skipRoutes.some((route) => normalizedPath.startsWith(route.toLowerCase()));
    if (shouldSkip) {
      return next();
    }

    const empresaId = req.user?.empresaId ?? req.user?.empresa_id;
    if (!empresaId) {
      return next();
    }

    try {
      const assinatura = await this.assinaturasService.buscarPorEmpresa(empresaId);
      const tenantPolicy =
        (assinatura as any)?.billingPolicy ||
        (await this.assinaturasService.obterPoliticaTenant(empresaId));
      if (!assinatura) {
        if (tenantPolicy.isPlatformOwner) {
          (req as any).subscription = {
            plano: 'OWNER_INTERNAL',
            status: 'active',
            billingPolicy: tenantPolicy,
          };
          next();
          return;
        }

        throw new HttpException(
          {
            message: 'Empresa nao possui assinatura ativa',
            code: 'NO_SUBSCRIPTION',
            redirect: '/billing',
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      const canonicalStatus = toCanonicalAssinaturaStatus(assinatura.status);
      if (!tenantPolicy.billingExempt && !hasSubscriptionAccess(canonicalStatus)) {
        throw new HttpException(
          {
            message: `Assinatura ${canonicalStatus}. Entre em contato com o suporte.`,
            code: 'SUBSCRIPTION_INACTIVE',
            status: canonicalStatus,
            redirect: '/billing',
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      const requiredModule = this.resolveRequiredModuleFromPath(req.path);
      if (
        requiredModule &&
        !tenantPolicy.fullModuleAccess &&
        !this.hasModuleEntitlement(assinatura, requiredModule)
      ) {
        throw new HttpException(
          {
            message: `Modulo ${requiredModule} nao incluido no plano atual`,
            code: 'MODULE_NOT_INCLUDED',
            module: requiredModule,
            currentPlan: assinatura.plano?.nome || null,
            redirect: '/billing/upgrade',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      if (this.isResourceConsumingOperation(req)) {
        const permitido = await this.assinaturasService.registrarChamadaApi(empresaId);
        if (!permitido && !tenantPolicy.monitorOnlyLimits) {
          throw new HttpException(
            {
              message: 'Limite de chamadas da API excedido para hoje',
              code: 'API_LIMIT_EXCEEDED',
              redirect: '/billing/upgrade',
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }

      (req as any).subscription = {
        plano: assinatura.plano?.nome,
        status: canonicalStatus,
        billingPolicy: tenantPolicy,
        limites: {
          usuarios: assinatura.plano?.limiteUsuarios,
          clientes: assinatura.plano?.limiteClientes,
          storage: assinatura.plano?.limiteStorage,
          apiCalls: assinatura.plano?.limiteApiCalls,
        },
        uso: {
          usuarios: assinatura.usuariosAtivos,
          clientes: assinatura.clientesCadastrados,
          storage: assinatura.storageUtilizado,
          apiCallsHoje: assinatura.apiCallsHoje,
        },
      };

      next();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          message: 'Falha ao validar entitlement da assinatura',
          code: 'SUBSCRIPTION_CHECK_FAILED',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private resolveCoreAdminDocsPath(): string {
    const rawPath = process.env.CORE_ADMIN_DOCS_PATH?.trim() || 'core-admin-docs';

    const sanitizedPath = rawPath.replace(/^\/+|\/+$/g, '').toLowerCase();
    return sanitizedPath || 'core-admin-docs';
  }

  private resolveRequiredModuleFromPath(path: string): EntitlementModule | null {
    const normalizedPath = String(path || '').toLowerCase();
    const pathWithoutApiPrefix = normalizedPath.startsWith('/api/')
      ? normalizedPath.slice('/api'.length)
      : normalizedPath;

    for (const entry of PATH_PREFIX_TO_MODULE) {
      if (
        normalizedPath.startsWith(entry.prefix) ||
        pathWithoutApiPrefix.startsWith(entry.prefix)
      ) {
        return entry.module;
      }
    }

    return null;
  }

  private hasModuleEntitlement(assinatura: any, requiredModule: EntitlementModule): boolean {
    const modulosInclusos = Array.isArray(assinatura?.plano?.modulosInclusos)
      ? assinatura.plano.modulosInclusos
      : [];

    if (modulosInclusos.length === 0) {
      return false;
    }

    const enabledCodes = new Set(
      modulosInclusos
        .map((item: any) => this.normalizeModuleCode(item?.modulo?.codigo))
        .filter((value: string | null): value is string => Boolean(value)),
    );

    const acceptedCodes = MODULE_ACCEPTED_CODES[requiredModule] || [];
    return acceptedCodes.some((code) =>
      enabledCodes.has(this.normalizeModuleCode(code) || ''),
    );
  }

  private normalizeModuleCode(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
    return normalized || null;
  }

  private isResourceConsumingOperation(req: Request): boolean {
    const resourceOperations = ['POST', 'PUT', 'PATCH', 'DELETE'];
    const monitoredPaths = ['/api/', '/export/', '/import/', '/upload/', '/reports/'];

    const isResourceMethod = resourceOperations.includes(req.method);
    const isMonitoredPath = monitoredPaths.some((path) => req.path.includes(path));
    return isResourceMethod || isMonitoredPath;
  }
}
