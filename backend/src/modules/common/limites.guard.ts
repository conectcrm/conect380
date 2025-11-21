import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AssinaturasService } from '../planos/assinaturas.service';

export interface LimiteVerificacao {
  tipo: 'usuarios' | 'clientes' | 'storage';
  operacao: 'criar' | 'verificar';
  quantidadeAdicional?: number;
}

// Decorator para definir verificações de limite
export const VerificarLimites = (limite: LimiteVerificacao) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('limite-verificacao', limite, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class LimitesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly assinaturasService: AssinaturasService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const limite = this.reflector.get<LimiteVerificacao>(
      'limite-verificacao',
      context.getHandler(),
    );

    if (!limite) {
      return true; // Sem limite definido, permite acesso
    }

    const empresaId = request.user?.empresaId;

    if (!empresaId) {
      throw new HttpException('Usuário não autenticado', HttpStatus.UNAUTHORIZED);
    }

    try {
      const limitesInfo = await this.assinaturasService.verificarLimites(empresaId);

      switch (limite.tipo) {
        case 'usuarios':
          return this.verificarLimiteUsuarios(limitesInfo, limite);

        case 'clientes':
          return this.verificarLimiteClientes(limitesInfo, limite);

        case 'storage':
          return this.verificarLimiteStorage(limitesInfo, limite);

        default:
          return true;
      }
    } catch (error) {
      console.error('Erro ao verificar limites:', error);
      throw new HttpException('Erro interno do servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private verificarLimiteUsuarios(limites: any, verificacao: LimiteVerificacao): boolean {
    if (verificacao.operacao === 'criar') {
      if (!limites.podeAdicionarUsuario) {
        throw new HttpException(
          {
            message: `Limite de usuários atingido (${limites.usuariosAtivos}/${limites.limiteUsuarios})`,
            code: 'USER_LIMIT_EXCEEDED',
            current: limites.usuariosAtivos,
            limit: limites.limiteUsuarios,
            redirect: '/billing/upgrade',
          },
          HttpStatus.FORBIDDEN,
        );
      }
    }

    return true;
  }

  private verificarLimiteClientes(limites: any, verificacao: LimiteVerificacao): boolean {
    if (verificacao.operacao === 'criar') {
      if (!limites.podeAdicionarCliente) {
        throw new HttpException(
          {
            message: `Limite de clientes atingido (${limites.clientesCadastrados}/${limites.limiteClientes})`,
            code: 'CLIENT_LIMIT_EXCEEDED',
            current: limites.clientesCadastrados,
            limit: limites.limiteClientes,
            redirect: '/billing/upgrade',
          },
          HttpStatus.FORBIDDEN,
        );
      }
    }

    return true;
  }

  private verificarLimiteStorage(limites: any, verificacao: LimiteVerificacao): boolean {
    if (verificacao.operacao === 'criar' && verificacao.quantidadeAdicional) {
      const storageAposUpload = limites.storageUtilizado + verificacao.quantidadeAdicional;

      if (storageAposUpload > limites.limiteStorage) {
        const mbUtilizado = Math.round(limites.storageUtilizado / (1024 * 1024));
        const mbLimite = Math.round(limites.limiteStorage / (1024 * 1024));
        const mbAdicional = Math.round(verificacao.quantidadeAdicional / (1024 * 1024));

        throw new HttpException(
          {
            message: `Limite de armazenamento seria excedido (${mbUtilizado + mbAdicional}MB/${mbLimite}MB)`,
            code: 'STORAGE_LIMIT_EXCEEDED',
            currentMB: mbUtilizado,
            limitMB: mbLimite,
            additionalMB: mbAdicional,
            redirect: '/billing/upgrade',
          },
          HttpStatus.FORBIDDEN,
        );
      }
    }

    return true;
  }
}
