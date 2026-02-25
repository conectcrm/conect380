import { Logger, Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permission } from '../../../common/permissions/permissions.constants';
import { NiveisAtendimentoService } from '../services/niveis-atendimento.service';

@Controller('atendimento/niveis')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.ATENDIMENTO_SLA_MANAGE)
export class NiveisAtendimentoController {
  private readonly logger = new Logger(NiveisAtendimentoController.name);
  constructor(private readonly niveisService: NiveisAtendimentoService) {}

  @Get()
  async listar(@EmpresaId() empresaId: string) {
    this.logger.log(`[NiveisController] 📥 GET /niveis - empresaId do JWT: ${empresaId}`);
    return this.niveisService.listarPorEmpresa(empresaId);
  }

  @Get(':id')
  async buscar(@Param('id') id: string, @EmpresaId() empresaId: string) {
    return this.niveisService.buscarPorId(id, empresaId);
  }
}
