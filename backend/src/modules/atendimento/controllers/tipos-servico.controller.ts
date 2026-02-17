import { Logger, Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { TiposServicoService } from '../services/tipos-servico.service';

@Controller('atendimento/tipos-servico')
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class TiposServicoController {
  private readonly logger = new Logger(TiposServicoController.name);
  constructor(private readonly tiposService: TiposServicoService) {}

  @Get()
  async listar(@EmpresaId() empresaId: string) {
    this.logger.log(`[TiposController] 📥 GET /tipos - empresaId do JWT: ${empresaId}`);
    return this.tiposService.listarPorEmpresa(empresaId);
  }

  @Get(':id')
  async buscar(@Param('id') id: string, @EmpresaId() empresaId: string) {
    return this.tiposService.buscarPorId(id, empresaId);
  }
}
