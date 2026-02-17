import { Logger, Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { StatusCustomizadosService } from '../services/status-customizados.service';

@Controller('atendimento/status-customizados')
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class StatusCustomizadosController {
  private readonly logger = new Logger(StatusCustomizadosController.name);
  constructor(private readonly statusService: StatusCustomizadosService) {}

  @Get()
  async listar(@EmpresaId() empresaId: string, @Query('nivelId') nivelId?: string) {
    this.logger.log(
      `[StatusController] 📥 GET /status - empresaId: ${empresaId}, nivelId: ${nivelId || 'todos'}`,
    );
    if (nivelId) {
      return this.statusService.listarPorNivel(empresaId, nivelId);
    }
    return this.statusService.listarPorEmpresa(empresaId);
  }

  @Get(':id')
  async buscar(@Param('id') id: string, @EmpresaId() empresaId: string) {
    return this.statusService.buscarPorId(id, empresaId);
  }
}
