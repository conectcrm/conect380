import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { UserRole } from '../users/user.entity';
import { UpdateSystemBrandingDto } from './dto/update-system-branding.dto';
import { SystemBrandingService } from './system-branding.service';

@Controller()
export class SystemBrandingController {
  constructor(private readonly systemBrandingService: SystemBrandingService) {}

  @Get('system-branding/public')
  async getPublicBranding() {
    return this.systemBrandingService.getPublicBranding();
  }

  @Get('admin/system-branding')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPERADMIN)
  @Permissions(Permission.ADMIN_EMPRESAS_MANAGE)
  async getAdminBranding() {
    return this.systemBrandingService.getAdminBranding();
  }

  @Put('admin/system-branding')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPERADMIN)
  @Permissions(Permission.ADMIN_EMPRESAS_MANAGE)
  async updateBranding(@Body() dto: UpdateSystemBrandingDto, @Req() req: any) {
    const updatedBy: string | null = req?.user?.id || null;
    return this.systemBrandingService.updateBranding(dto, updatedBy);
  }
}
