import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permission } from '../../common/permissions/permissions.constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User, UserRole } from '../users/user.entity';
import { CoreAdminMfaGuard } from './guards/core-admin-mfa.guard';
import {
  CoreAdminFeatureFlagService,
  CoreAdminTenantFlagInput,
} from './services/core-admin-feature-flag.service';

@Controller('core-admin/feature-flags')
@UseGuards(JwtAuthGuard, CoreAdminMfaGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPERADMIN)
@Permissions(Permission.ADMIN_EMPRESAS_MANAGE)
export class CoreAdminFeatureFlagsController {
  constructor(private readonly coreAdminFeatureFlagService: CoreAdminFeatureFlagService) {}

  @Get('catalog')
  async listCatalog() {
    return {
      success: true,
      data: await this.coreAdminFeatureFlagService.listCatalog(),
    };
  }

  @Get(':empresaId')
  async listByEmpresa(@Param('empresaId') empresaId: string) {
    return {
      success: true,
      data: await this.coreAdminFeatureFlagService.listByEmpresa(empresaId),
    };
  }

  @Patch()
  async upsertMany(
    @CurrentUser() user: User,
    @Body()
    body: {
      empresaId?: string;
      flags?: CoreAdminTenantFlagInput[];
    },
  ) {
    const empresaId = String(body?.empresaId || '').trim();
    const flags = Array.isArray(body?.flags) ? body.flags : [];

    return {
      success: true,
      data: await this.coreAdminFeatureFlagService.upsertMany(
        empresaId,
        flags.map((flag) => ({
          ...flag,
          updatedBy: user?.id || null,
        })),
      ),
      message: 'Feature flags atualizadas com sucesso',
    };
  }
}
