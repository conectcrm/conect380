import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../../common/decorators/user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Permission } from '../../../common/permissions/permissions.constants';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AtividadeTipo } from '../../users/entities/user-activity.entity';
import { User, UserRole } from '../../users/user.entity';
import { FilterEmpresasAdminDto } from '../dto/filter-empresas-admin.dto';
import { AdminBffAuditInterceptor } from '../interceptors/admin-bff-audit.interceptor';
import { AdminBffService } from '../services/admin-bff.service';

@Controller('admin/bff')
@UseGuards(JwtAuthGuard, EmpresaGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(AdminBffAuditInterceptor)
@Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.GERENTE)
@Permissions(Permission.USERS_READ)
export class AdminBffController {
  constructor(private readonly adminBffService: AdminBffService) {}

  @Get('overview')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getOverview(@CurrentUser() user: User) {
    return {
      success: true,
      data: await this.adminBffService.getOverview(user),
    };
  }

  @Get('users')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async listUsers(
    @CurrentUser() user: User,
    @Query('busca') busca?: string,
    @Query('role') role?: string,
    @Query('ativo') ativo?: string,
    @Query('ordenacao') ordenacao?: string,
    @Query('direcao') direcao?: string,
    @Query('limite') limite?: string,
    @Query('pagina') pagina?: string,
  ) {
    return {
      success: true,
      data: await this.adminBffService.listUsers(user, {
        busca,
        role,
        ativo: this.parseOptionalBoolean(ativo, 'ativo'),
        ordenacao,
        direcao,
        limite: this.parseOptionalPositiveInt(limite, 'limite'),
        pagina: this.parseOptionalPositiveInt(pagina, 'pagina'),
      }),
    };
  }

  @Get('access-change-requests')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async listAccessChangeRequests(
    @CurrentUser() user: User,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    const normalizedStatus = this.normalizeAccessChangeStatus(status);
    return {
      success: true,
      data: await this.adminBffService.listAccessChangeRequests(user, {
        status: normalizedStatus,
        limit: this.parseOptionalPositiveInt(limit, 'limit'),
      }),
    };
  }

  @Post('access-change-requests/:id/approve')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @Permissions(Permission.USERS_UPDATE)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async approveAccessChangeRequest(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) requestId: string,
    @Body() body: { reason?: string },
  ) {
    return {
      success: true,
      data: await this.adminBffService.approveAccessChangeRequest(user, requestId, body?.reason),
      message: 'Solicitacao aprovada e aplicada com sucesso',
    };
  }

  @Post('access-change-requests/:id/reject')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @Permissions(Permission.USERS_UPDATE)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async rejectAccessChangeRequest(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) requestId: string,
    @Body() body: { reason?: string },
  ) {
    return {
      success: true,
      data: await this.adminBffService.rejectAccessChangeRequest(user, requestId, body?.reason),
      message: 'Solicitacao rejeitada com sucesso',
    };
  }

  @Get('break-glass/requests')
  @Permissions(Permission.USERS_READ)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async listBreakGlassRequests(
    @CurrentUser() user: User,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('target_user_id') targetUserId?: string,
  ) {
    return {
      success: true,
      data: await this.adminBffService.listBreakGlassRequests(user, {
        status,
        limit: this.parseOptionalPositiveInt(limit, 'limit'),
        targetUserId,
      }),
    };
  }

  @Post('break-glass/requests')
  @Permissions(Permission.USERS_UPDATE)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async requestBreakGlassAccess(
    @CurrentUser() user: User,
    @Body()
    body: {
      target_user_id?: string;
      permissions?: string[] | string;
      duration_minutes?: number;
      reason?: string;
    },
  ) {
    const targetUserId =
      typeof body?.target_user_id === 'string' ? body.target_user_id.trim() : '';
    if (!targetUserId) {
      throw new BadRequestException('Campo target_user_id obrigatorio');
    }

    const reason = this.normalizeOptionalReason(body?.reason);
    if (!reason) {
      throw new BadRequestException('Campo reason obrigatorio');
    }

    const permissions = this.normalizePermissionsInput(body?.permissions);

    return {
      success: true,
      data: await this.adminBffService.requestBreakGlassAccess(user, {
        targetUserId,
        scopePermissions: permissions,
        durationMinutes:
          typeof body?.duration_minutes === 'number'
            ? Math.trunc(body.duration_minutes)
            : undefined,
        reason,
      }),
      message: 'Solicitacao de acesso emergencial registrada com sucesso',
    };
  }

  @Post('break-glass/requests/:id/approve')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @Permissions(Permission.USERS_UPDATE)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async approveBreakGlassRequest(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) requestId: string,
    @Body() body: { reason?: string },
  ) {
    return {
      success: true,
      data: await this.adminBffService.approveBreakGlassRequest(user, requestId, body?.reason),
      message: 'Solicitacao de acesso emergencial aprovada',
    };
  }

  @Post('break-glass/requests/:id/reject')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @Permissions(Permission.USERS_UPDATE)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async rejectBreakGlassRequest(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) requestId: string,
    @Body() body: { reason?: string },
  ) {
    const reason = this.normalizeOptionalReason(body?.reason);
    if (!reason) {
      throw new BadRequestException('Campo reason obrigatorio');
    }

    return {
      success: true,
      data: await this.adminBffService.rejectBreakGlassRequest(user, requestId, reason),
      message: 'Solicitacao de acesso emergencial rejeitada',
    };
  }

  @Get('break-glass/active')
  @Permissions(Permission.USERS_READ)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async listActiveBreakGlassAccesses(
    @CurrentUser() user: User,
    @Query('limit') limit?: string,
    @Query('target_user_id') targetUserId?: string,
  ) {
    return {
      success: true,
      data: await this.adminBffService.listActiveBreakGlassAccesses(user, {
        limit: this.parseOptionalPositiveInt(limit, 'limit'),
        targetUserId,
      }),
    };
  }

  @Post('break-glass/:id/revoke')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @Permissions(Permission.USERS_UPDATE)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async revokeBreakGlassAccess(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) requestId: string,
    @Body() body: { reason?: string },
  ) {
    return {
      success: true,
      data: await this.adminBffService.revokeBreakGlassAccess(user, requestId, body?.reason),
      message: 'Acesso emergencial revogado com sucesso',
    };
  }

  @Get('access-review/report')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getAccessReviewReport(
    @CurrentUser() user: User,
    @Query('role') role?: string,
    @Query('include_inactive') includeInactive?: string,
    @Query('limit') limit?: string,
  ) {
    return {
      success: true,
      data: await this.adminBffService.generateAccessReviewReport(user, {
        role,
        includeInactive: this.parseOptionalBoolean(includeInactive, 'include_inactive'),
        limit: this.parseOptionalPositiveInt(limit, 'limit'),
      }),
    };
  }

  @Post('access-review/recertify')
  @Permissions(Permission.USERS_UPDATE)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async recertifyAccess(
    @CurrentUser() user: User,
    @Body()
    body: {
      target_user_id?: string;
      approved?: boolean;
      reason?: string;
    },
  ) {
    const targetUserId =
      typeof body?.target_user_id === 'string' ? body.target_user_id.trim() : '';
    if (!targetUserId) {
      throw new BadRequestException('Campo target_user_id obrigatorio');
    }
    if (typeof body?.approved !== 'boolean') {
      throw new BadRequestException('Campo approved obrigatorio e deve ser booleano');
    }

    const normalizedReason = this.normalizeOptionalReason(body?.reason);
    if (!body.approved && !normalizedReason) {
      throw new BadRequestException('Informe reason ao reprovar uma recertificacao');
    }

    return {
      success: true,
      data: await this.adminBffService.recertifyAccess(
        user,
        targetUserId,
        body.approved,
        normalizedReason,
      ),
      message: 'Recertificacao registrada com sucesso',
    };
  }

  @Get('companies')
  @Permissions(Permission.ADMIN_EMPRESAS_MANAGE)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async listCompanies(@Query() filters: FilterEmpresasAdminDto) {
    const result = await this.adminBffService.listCompanies(filters);
    return {
      success: true,
      data: result?.data ?? [],
      meta: result?.meta ?? null,
    };
  }

  @Get('audit/activities')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async listAuditActivities(
    @CurrentUser() user: User,
    @Query('limit') limit?: string,
    @Query('usuario_id') usuarioId?: string,
    @Query('tipo') tipo?: string,
    @Query('data_inicio') dataInicio?: string,
    @Query('data_fim') dataFim?: string,
    @Query('admin_only') adminOnly?: string,
  ) {
    return {
      success: true,
      data: await this.adminBffService.listAuditActivities(user, {
        limit: this.parseOptionalPositiveInt(limit, 'limit'),
        usuarioId,
        tipo: this.parseOptionalAtividadeTipo(tipo),
        dataInicio,
        dataFim,
        adminOnly: this.parseOptionalBoolean(adminOnly, 'admin_only'),
      }),
    };
  }

  private normalizeAccessChangeStatus(status?: string): string | undefined {
    if (!status) {
      return undefined;
    }

    const normalizedStatus = status.trim().toUpperCase();
    const allowed = new Set<string>(['REQUESTED', 'APPROVED', 'REJECTED']);
    if (!allowed.has(normalizedStatus)) {
      throw new BadRequestException('Status invalido. Use REQUESTED, APPROVED ou REJECTED.');
    }

    return normalizedStatus;
  }

  private parseOptionalPositiveInt(rawValue: string | undefined, fieldName: string): number | undefined {
    if (rawValue === undefined) {
      return undefined;
    }

    const parsed = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new BadRequestException(`Parametro ${fieldName} invalido`);
    }

    return parsed;
  }

  private parseOptionalBoolean(value: string | undefined, fieldName: string): boolean | undefined {
    if (value === undefined) {
      return undefined;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }

    if (normalized === 'false' || normalized === '0') {
      return false;
    }

    throw new BadRequestException(`Parametro ${fieldName} invalido`);
  }

  private parseOptionalAtividadeTipo(tipo?: string): AtividadeTipo | undefined {
    if (!tipo) {
      return undefined;
    }

    const candidate = tipo.trim().toUpperCase() as AtividadeTipo;
    const allowed = new Set<AtividadeTipo>(Object.values(AtividadeTipo));
    if (!allowed.has(candidate)) {
      throw new BadRequestException('Parametro tipo invalido');
    }

    return candidate;
  }

  private normalizePermissionsInput(input: unknown): string[] {
    if (Array.isArray(input)) {
      const parsed = input
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
      if (parsed.length > 0) {
        return parsed;
      }
      throw new BadRequestException('Campo permissions obrigatorio');
    }

    if (typeof input === 'string') {
      const parsed = input
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      if (parsed.length > 0) {
        return parsed;
      }
      throw new BadRequestException('Campo permissions obrigatorio');
    }

    throw new BadRequestException('Campo permissions obrigatorio');
  }

  private normalizeOptionalReason(input: unknown): string | undefined {
    if (input === undefined || input === null) {
      return undefined;
    }

    if (typeof input !== 'string') {
      throw new BadRequestException('Campo reason invalido');
    }

    const normalized = input.trim();
    if (!normalized) {
      return undefined;
    }

    return normalized.slice(0, 2000);
  }
}
