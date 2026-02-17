import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { UpdateEmpresaConfigDto } from '../dto/update-empresa-config.dto';
import { EmpresaConfigService } from '../services/empresa-config.service';

@Controller('empresas/config')
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class EmpresaConfigController {
  constructor(private readonly configService: EmpresaConfigService) {}

  @Get()
  async getConfig(@EmpresaId() empresaId: string) {
    return this.configService.getByEmpresaId(empresaId);
  }

  @Put()
  async updateConfig(@EmpresaId() empresaId: string, @Body() updateDto: UpdateEmpresaConfigDto) {
    return this.configService.update(empresaId, updateDto);
  }

  @Post('reset')
  async resetConfig(@EmpresaId() empresaId: string) {
    return this.configService.resetToDefaults(empresaId);
  }
}
