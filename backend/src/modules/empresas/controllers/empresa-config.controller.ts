import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Permission } from '../../../common/permissions/permissions.constants';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { UserRole } from '../../users/user.entity';
import { UpdateEmpresaConfigDto } from '../dto/update-empresa-config.dto';
import { EmpresaConfigService } from '../services/empresa-config.service';

@Controller('empresas/config')
@UseGuards(JwtAuthGuard, EmpresaGuard, RolesGuard, PermissionsGuard)
@Permissions(Permission.CONFIG_EMPRESA_READ)
export class EmpresaConfigController {
  constructor(private readonly configService: EmpresaConfigService) {}

  @Get()
  async getConfig(@EmpresaId() empresaId: string) {
    return this.configService.getByEmpresaId(empresaId);
  }

  @Put()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @Permissions(Permission.CONFIG_EMPRESA_UPDATE)
  async updateConfig(@EmpresaId() empresaId: string, @Body() updateDto: UpdateEmpresaConfigDto) {
    return this.configService.update(empresaId, updateDto);
  }

  @Post('reset')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @Permissions(Permission.CONFIG_EMPRESA_UPDATE)
  async resetConfig(@EmpresaId() empresaId: string) {
    return this.configService.resetToDefaults(empresaId);
  }
}
