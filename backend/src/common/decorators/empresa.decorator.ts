import { SetMetadata } from '@nestjs/common';

/**
 * Decorator para pular validação de empresa_id
 * 
 * Uso:
 * @SkipEmpresaValidation()
 * @Get('public-endpoint')
 * async publicEndpoint() {
 *   // ...
 * }
 */
export const SkipEmpresaValidation = () =>
  SetMetadata('skipEmpresaValidation', true);

/**
 * Decorator para obter empresa_id do usuário logado
 * 
 * Uso:
 * @Get()
 * async listar(@EmpresaId() empresaId: string) {
 *   // empresaId já está disponível
 * }
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const EmpresaId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.empresa_id;
  },
);
