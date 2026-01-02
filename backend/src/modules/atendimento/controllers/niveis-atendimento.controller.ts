import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { NiveisAtendimentoService } from '../services/niveis-atendimento.service';

@Controller('atendimento/niveis')
@UseGuards(JwtAuthGuard)
export class NiveisAtendimentoController {
  constructor(
    private readonly niveisService: NiveisAtendimentoService,
  ) { }

  @Get()
  async listar(@Req() req: any) {
    const empresaId = req.user?.empresa_id;
    console.log(`[NiveisController] 📥 GET /niveis - empresaId do JWT: ${empresaId}`);
    return this.niveisService.listarPorEmpresa(empresaId);
  }

  @Get(':id')
  async buscar(@Param('id') id: string) {
    return this.niveisService.buscarPorId(id);
  }
}
