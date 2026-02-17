import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Guard para validar se o usuário possui empresa_id
 *
 * Uso:
 * @UseGuards(JwtAuthGuard, EmpresaGuard)
 *
 * Ou para tornar opcional:
 * @UseGuards(JwtAuthGuard)
 * @SetMetadata('skipEmpresaValidation', true)
 */
@Injectable()
export class EmpresaGuard implements CanActivate {
  private readonly logger = new Logger(EmpresaGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Verificar se a rota tem metadata para pular validação
    const skipValidation = this.reflector.get<boolean>(
      'skipEmpresaValidation',
      context.getHandler(),
    );

    if (skipValidation) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Validar se usuário existe
    if (!user) {
      this.logger.warn('Tentativa de acesso sem usuário autenticado');
      throw new BadRequestException('Usuário não autenticado');
    }

    // Validar se usuário possui empresa_id
    if (!user.empresa_id) {
      this.logger.warn(`Usuário ${user.id} tentou acessar recurso sem empresa vinculada`);
      throw new BadRequestException(
        'Usuário não possui empresa vinculada. Entre em contato com o administrador.',
      );
    }

    // Log de sucesso (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`Usuário ${user.id} validado com empresa_id: ${user.empresa_id}`);
    }

    return true;
  }
}
