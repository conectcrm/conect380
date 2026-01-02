import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TiposServicoService } from '../services/tipos-servico.service';

@Controller('atendimento/tipos-servico')
@UseGuards(JwtAuthGuard)
export class TiposServicoController {
  constructor(
    private readonly tiposService: TiposServicoService,
  ) { }

  @Get()
  async listar(@Req() req: any) {
    const empresaId = req.user?.empresa_id;
    console.log(`[TiposController] 📥 GET /tipos - empresaId do JWT: ${empresaId}`);
    return this.tiposService.listarPorEmpresa(empresaId);
  }

  @Get(':id')
  async buscar(@Param('id') id: string) {
    return this.tiposService.buscarPorId(id);
  }
}
