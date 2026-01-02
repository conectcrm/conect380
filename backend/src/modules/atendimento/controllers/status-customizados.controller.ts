import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { StatusCustomizadosService } from '../services/status-customizados.service';

@Controller('atendimento/status-customizados')
@UseGuards(JwtAuthGuard)
export class StatusCustomizadosController {
  constructor(
    private readonly statusService: StatusCustomizadosService,
  ) { }

  @Get()
  async listar(
    @Req() req: any,
    @Query('nivelId') nivelId?: string,
  ) {
    const empresaId = req.user?.empresa_id;
    console.log(`[StatusController] 📥 GET /status - empresaId: ${empresaId}, nivelId: ${nivelId || 'todos'}`);
    if (nivelId) {
      return this.statusService.listarPorNivel(empresaId, nivelId);
    }
    return this.statusService.listarPorEmpresa(empresaId);
  }

  @Get(':id')
  async buscar(@Param('id') id: string) {
    return this.statusService.buscarPorId(id);
  }
}
