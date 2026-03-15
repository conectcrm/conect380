import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permission } from '../../common/permissions/permissions.constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../users/user.entity';
import { GuardianMfaGuard } from './guardian-mfa.guard';
import { GuardianRuntimeAlertService } from './services/guardian-runtime-alert.service';

@Controller('guardian')
@UseGuards(JwtAuthGuard, GuardianMfaGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPERADMIN)
@Permissions(Permission.ADMIN_EMPRESAS_MANAGE)
export class GuardianController {
  constructor(private readonly guardianRuntimeAlertService: GuardianRuntimeAlertService) {}

  @Get('health')
  health(@Req() req: Request) {
    const user = (req as any)?.user;
    return {
      namespace: 'guardian',
      isolated: true,
      actor: user?.id || null,
      role: user?.role || null,
      timestamp: new Date().toISOString(),
    };
  }
}
