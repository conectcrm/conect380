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
  | 'FINANCEIRO'
  | 'ADMINISTRACAO'
  | 'DASHBOARD'
  | 'IA';

const PATH_PREFIX_TO_MODULE: Array<{ prefix: string; module: EntitlementModule }> = [
  { prefix: '/clientes', module: 'CRM' },
  { prefix: '/leads', module: 'CRM' },
  { prefix: '/oportunidades', module: 'CRM' },
  { prefix: '/produtos', module: 'CRM' },
  { prefix: '/categorias-produtos', module: 'CRM' },
  { prefix: '/subcategorias-produtos', module: 'CRM' },
  { prefix: '/agenda-eventos', module: 'CRM' },
  { prefix: '/interacoes', module: 'CRM' },

  { prefix: '/propostas', module: 'VENDAS' },
  { prefix: '/contratos', module: 'VENDAS' },
  { prefix: '/metas', module: 'VENDAS' },

  { prefix: '/financeiro', module: 'FINANCEIRO' },
  { prefix: '/faturamento', module: 'FINANCEIRO' },
  { prefix: '/pagamentos', module: 'FINANCEIRO' },
  { prefix: '/mercadopago', module: 'FINANCEIRO' },
  { prefix: '/fornecedores', module: 'FINANCEIRO' },
  { prefix: '/contas-pagar', module: 'FINANCEIRO' },
  { prefix: '/contas-bancarias', module: 'FINANCEIRO' },
  { prefix: '/conciliacao-bancaria', module: 'FINANCEIRO' },

  { prefix: '/atendimento', module: 'ATENDIMENTO' },
  { prefix: '/triagem', module: 'ATENDIMENTO' },
  { prefix: '/nucleos', module: 'ATENDIMENTO' },
  { prefix: '/fluxos', module: 'ATENDIMENTO' },
  { prefix: '/equipes', module: 'ATENDIMENTO' },
  { prefix: '/departamentos', module: 'ATENDIMENTO' },
  { prefix: '/atribuicoes', module: 'ATENDIMENTO' },
  { prefix: '/demandas', module: 'ATENDIMENTO' },
  { prefix: '/tags', module: 'ATENDIMENTO' },
  { prefix: '/notas', module: 'ATENDIMENTO' },
  { prefix: '/redmine', module: 'ATENDIMENTO' },

  { prefix: '/dashboard', module: 'DASHBOARD' },
  { prefix: '/analytics', module: 'DASHBOARD' },
  { prefix: '/orquestrador', module: 'DASHBOARD' },

  { prefix: '/ia', module: 'IA' },

  { prefix: '/admin', module: 'ADMINISTRACAO' },
  { prefix: '/users', module: 'ADMINISTRACAO' },
  { prefix: '/users-debug', module: 'ADMINISTRACAO' },
  { prefix: '/empresas/modulos', module: 'ADMINISTRACAO' },
  { prefix: '/empresas/config', module: 'ADMINISTRACAO' },
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
  VENDAS: ['VENDAS', 'PROPOSTAS', 'CONTRATOS', 'METAS'],
  FINANCEIRO: ['FINANCEIRO', 'FATURAMENTO', 'PAGAMENTOS', 'BILLING'],
  ADMINISTRACAO: ['ADMINISTRACAO', 'ADMIN', 'USUARIOS', 'USERS', 'EMPRESAS'],
  DASHBOARD: ['DASHBOARD', 'ANALYTICS', 'CRM', 'VENDAS', 'FINANCEIRO', 'ATENDIMENTO'],
  IA: ['IA', 'CRM', 'ATENDIMENTO'],
};

@Injectable()
export class AssinaturaMiddleware implements NestMiddleware {
  constructor(private readonly assinaturasService: AssinaturasService) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const skipRoutes = [
      '/auth/',
      '/planos',
      '/assinaturas',
      '/health',
      '/docs',
      '/api-docs',
      '/guardian-docs',
      '/guardian-docs-json',
      '/metrics',
    ];
    const shouldSkip = skipRoutes.some((route) => req.path.startsWith(route));
    if (shouldSkip) {
      return next();
    }

    const empresaId = req.user?.empresaId ?? req.user?.empresa_id;
    if (!empresaId) {
      return next();
    }

    try {
      const assinatura = await this.assinaturasService.buscarPorEmpresa(empresaId);
      if (!assinatura) {
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
      if (!hasSubscriptionAccess(canonicalStatus)) {
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
      if (requiredModule && !this.hasModuleEntitlement(assinatura, requiredModule)) {
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
        if (!permitido) {
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
