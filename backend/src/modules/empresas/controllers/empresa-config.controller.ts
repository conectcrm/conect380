import { Body, Controller, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Permission } from '../../../common/permissions/permissions.constants';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { UserRole } from '../../users/user.entity';
import { TestSmtpDto } from '../dto/smtp-test.dto';
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

  @Post('smtp/test')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @Permissions(Permission.CONFIG_EMPRESA_UPDATE)
  async testSmtp(@EmpresaId() empresaId: string, @Body() smtpDto: TestSmtpDto) {
    return this.configService.testSmtpConnection(empresaId, smtpDto);
  }

  @Post('backup/execute')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @Permissions(Permission.CONFIG_EMPRESA_UPDATE)
  async executeBackup(@EmpresaId() empresaId: string) {
    return this.configService.executeBackupSnapshot(empresaId);
  }

  @Get('backup/history')
  async getBackupHistory(@EmpresaId() empresaId: string, @Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.configService.listBackupSnapshots(empresaId, parsedLimit);
  }
}
