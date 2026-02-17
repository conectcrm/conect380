import { ForbiddenException } from '@nestjs/common';

export function ensureDevelopmentOnly(route: string): void {
  if (process.env.NODE_ENV === 'production') {
    throw new ForbiddenException(
      `Endpoint bloqueado em produção: ${route}`,
    );
  }
}
