import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AtendenteService } from '../services/atendente.service';
import { CriarAtendenteDto, AtualizarAtendenteDto, AtualizarStatusAtendenteDto } from '../dto';

@Controller('atendimento/atendentes')
@UseGuards(JwtAuthGuard)
export class AtendentesController {
  constructor(private atendenteService: AtendenteService) {
    console.log('✅ AtendentesController inicializado');
  }

  @Get()
  async listar(@Req() req) {
    const empresaId = req.user.empresa_id || req.user.empresaId;
    const atendentes = await this.atendenteService.listar(empresaId);

    return {
      success: true,
      data: atendentes,
      total: atendentes.length,
    };
  }

  @Get(':id')
  async buscarPorId(@Req() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id || req.user.empresaId;
    const atendente = await this.atendenteService.buscarPorId(id, empresaId);

    return {
      success: true,
      data: atendente,
    };
  }

  @Post()
  async criar(@Req() req, @Body() dto: CriarAtendenteDto) {
    const empresaId = req.user.empresa_id || req.user.empresaId;

    // ⚡ Service cria User automaticamente se não existir
    const resultado = await this.atendenteService.criar(dto, empresaId);

    return {
      success: true,
      message: resultado.usuarioCriado
        ? 'Atendente criado! Usuário gerado automaticamente.'
        : 'Atendente criado e vinculado ao usuário existente',
      data: resultado.atendente,
      senhaTemporaria: resultado.senhaTemporaria, // ⚡ Frontend vai usar isso!
    };
  }

  @Put(':id')
  async atualizar(@Req() req, @Param('id') id: string, @Body() dto: AtualizarAtendenteDto) {
    const empresaId = req.user.empresa_id || req.user.empresaId;
    const atendente = await this.atendenteService.atualizar(id, dto, empresaId);

    return {
      success: true,
      message: 'Atendente atualizado com sucesso',
      data: atendente,
    };
  }

  @Delete(':id')
  async deletar(@Req() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id || req.user.empresaId;
    await this.atendenteService.deletar(id, empresaId);

    return {
      success: true,
      message: 'Atendente excluído com sucesso',
    };
  }

  @Put(':id/status')
  async atualizarStatus(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: AtualizarStatusAtendenteDto,
  ) {
    const empresaId = req.user.empresa_id || req.user.empresaId;
    const atendente = await this.atendenteService.atualizarStatus(id, dto.status, empresaId);

    return {
      success: true,
      message: 'Status atualizado com sucesso',
      data: atendente,
    };
  }
}
