import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AssinaturasService } from '../planos/assinaturas.service';

interface AuthenticatedRequest extends Request {
  user?: {
    empresaId: string;
    userId: string;
    email: string;
  };
}

@Injectable()
export class AssinaturaMiddleware implements NestMiddleware {
  constructor(private readonly assinaturasService: AssinaturasService) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Pular verificação para rotas de autenticação e planos
    const skipRoutes = ['/auth/', '/planos', '/assinaturas', '/health', '/docs'];

    const shouldSkip = skipRoutes.some((route) => req.path.startsWith(route));

    if (shouldSkip) {
      return next();
    }

    // Verificar se usuário está autenticado
    if (!req.user?.empresaId) {
      return next();
    }

    try {
      // Buscar assinatura da empresa
      const assinatura = await this.assinaturasService.buscarPorEmpresa(req.user.empresaId);

      if (!assinatura) {
        throw new HttpException(
          {
            message: 'Empresa não possui assinatura ativa',
            code: 'NO_SUBSCRIPTION',
            redirect: '/billing',
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      if (assinatura.status !== 'ativa') {
        throw new HttpException(
          {
            message: `Assinatura ${assinatura.status}. Entre em contato com o suporte.`,
            code: 'SUBSCRIPTION_INACTIVE',
            status: assinatura.status,
            redirect: '/billing',
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      // Verificar se o módulo está incluído no plano
      const moduloAtual = this.extrairModuloFromPath(req.path);

      if (moduloAtual) {
        const temAcesso = assinatura.plano.modulosInclusos?.some(
          (pm) => pm.modulo.codigo === moduloAtual,
        );

        if (!temAcesso) {
          throw new HttpException(
            {
              message: `Módulo ${moduloAtual} não incluído no plano atual`,
              code: 'MODULE_NOT_INCLUDED',
              module: moduloAtual,
              currentPlan: assinatura.plano.nome,
              redirect: '/billing/upgrade',
            },
            HttpStatus.FORBIDDEN,
          );
        }
      }

      // Registrar chamada da API se for uma operação que consome recursos
      if (this.isResourceConsumingOperation(req)) {
        const permitido = await this.assinaturasService.registrarChamadaApi(req.user.empresaId);

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

      // Adicionar informações da assinatura na requisição
      (req as any).subscription = {
        plano: assinatura.plano.nome,
        limites: {
          usuarios: assinatura.plano.limiteUsuarios,
          clientes: assinatura.plano.limiteClientes,
          storage: assinatura.plano.limiteStorage,
          apiCalls: assinatura.plano.limiteApiCalls,
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

      console.error('Erro ao verificar assinatura:', error);
      next();
    }
  }

  private extrairModuloFromPath(path: string): string | null {
    // Mapear rotas para módulos
    const moduleMap: Record<string, string> = {
      '/propostas': 'propostas',
      '/clientes': 'clientes',
      '/usuarios': 'usuarios',
      '/dashboard': 'dashboard',
      '/relatorios': 'relatorios',
      '/financeiro': 'financeiro',
      '/vendas': 'vendas',
      '/marketing': 'marketing',
      '/suporte': 'suporte',
      '/integracao': 'integracao',
      '/whatsapp': 'whatsapp',
      '/email': 'email',
      '/chat': 'chat',
      '/automacao': 'automacao',
      '/analytics': 'analytics',
    };

    for (const [route, module] of Object.entries(moduleMap)) {
      if (path.startsWith(route)) {
        return module;
      }
    }

    return null;
  }

  private isResourceConsumingOperation(req: Request): boolean {
    // Operações que consomem recursos da API
    const resourceOperations = ['POST', 'PUT', 'PATCH', 'DELETE'];

    // Ou operações específicas que queremos monitorar
    const monitoredPaths = ['/api/', '/export/', '/import/', '/upload/', '/reports/'];

    const isResourceMethod = resourceOperations.includes(req.method);
    const isMonitoredPath = monitoredPaths.some((path) => req.path.includes(path));

    return isResourceMethod || isMonitoredPath;
  }
}
