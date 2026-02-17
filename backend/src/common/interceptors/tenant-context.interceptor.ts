import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { runWithTenant } from '../tenant/tenant-context';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const empresaId = request?.user?.empresa_id || request?.user?.empresaId;

    if (!empresaId) {
      return next.handle();
    }

    return runWithTenant(empresaId, () => next.handle()) as Observable<unknown>;
  }
}
