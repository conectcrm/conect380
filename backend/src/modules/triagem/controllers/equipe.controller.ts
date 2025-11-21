import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import { AtribuicaoService } from '../services/atribuicao.service';
import {
  CreateEquipeDto,
  UpdateEquipeDto,
  AdicionarAtendenteEquipeDto,
  RemoverAtendenteEquipeDto,
} from '../dto';

@Controller('equipes')
@UseGuards(JwtAuthGuard)
export class EquipeController {
  constructor(private readonly atribuicaoService: AtribuicaoService) {}

  // ========================================================================
  // GESTÃO DE EQUIPES
  // ========================================================================

  /**
   * POST /equipes
   * Cria uma nova equipe
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async criar(@Request() req, @Body() dto: CreateEquipeDto) {
    const empresaId = req.user.empresa_id;
    return this.atribuicaoService.criarEquipe(empresaId, dto);
  }

  /**
   * GET /equipes
   * Lista todas as equipes da empresa
   */
  @Get()
  async listar(@Request() req) {
    const empresaId = req.user.empresa_id;
    return this.atribuicaoService.listarEquipes(empresaId);
  }

  /**
   * GET /equipes/:id
   * Busca uma equipe específica
   */
  @Get(':id')
  async buscar(@Param('id') id: string) {
    return this.atribuicaoService.buscarEquipe(id);
  }

  /**
   * PUT /equipes/:id
   * Atualiza uma equipe
   */
  @Put(':id')
  async atualizar(@Param('id') id: string, @Body() dto: UpdateEquipeDto) {
    return this.atribuicaoService.atualizarEquipe(id, dto);
  }

  /**
   * DELETE /equipes/:id
   * Remove uma equipe
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remover(@Param('id') id: string) {
    await this.atribuicaoService.removerEquipe(id);
  }

  // ========================================================================
  // GESTÃO DE MEMBROS
  // ========================================================================

  /**
   * POST /equipes/:id/atendentes
   * Adiciona um atendente à equipe
   */
  @Post(':id/atendentes')
  @HttpCode(HttpStatus.CREATED)
  async adicionarAtendente(
    @Param('id') equipeId: string,
    @Body() dto: AdicionarAtendenteEquipeDto,
  ) {
    return this.atribuicaoService.adicionarAtendenteNaEquipe(
      equipeId,
      dto.atendenteId,
      dto.funcao || 'membro',
    );
  }

  /**
   * DELETE /equipes/:id/atendentes/:atendenteId
   * Remove um atendente da equipe
   */
  @Delete(':id/atendentes/:atendenteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removerAtendente(@Param('id') equipeId: string, @Param('atendenteId') atendenteId: string) {
    await this.atribuicaoService.removerAtendenteDaEquipe(equipeId, atendenteId);
  }

  /**
   * GET /equipes/:id/atendentes
   * Lista atendentes de uma equipe
   */
  @Get(':id/atendentes')
  async listarAtendentes(@Param('id') equipeId: string) {
    return this.atribuicaoService.listarAtendentesEquipe(equipeId);
  }

  /**
   * GET /equipes/:id/atribuicoes
   * Lista atribuições de uma equipe
   */
  @Get(':id/atribuicoes')
  async listarAtribuicoes(@Param('id') equipeId: string) {
    return this.atribuicaoService.listarAtribuicoesEquipe(equipeId);
  }
}
