import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import { AtribuicaoService } from '../services/atribuicao.service';
import {
  AtribuirAtendenteDto,
  AtribuirEquipeDto,
  BuscarAtendentesDisponiveisDto,
} from '../dto';

@Controller('atribuicoes')
@UseGuards(JwtAuthGuard)
export class AtribuicaoController {
  constructor(private readonly atribuicaoService: AtribuicaoService) { }

  // ========================================================================
  // ATRIBUIÇÕES DIRETAS DE ATENDENTE
  // ========================================================================

  /**
   * POST /atribuicoes/atendente
   * Atribui um atendente diretamente a um núcleo ou departamento
   */
  @Post('atendente')
  @HttpCode(HttpStatus.CREATED)
  async atribuirAtendente(@Body() dto: AtribuirAtendenteDto) {
    return this.atribuicaoService.atribuirAtendenteANucleoDepartamento(dto);
  }

  /**
   * DELETE /atribuicoes/atendente/:id
   * Remove uma atribuição de atendente
   */
  @Delete('atendente/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removerAtribuicaoAtendente(@Param('id') atribuicaoId: string) {
    await this.atribuicaoService.removerAtribuicaoAtendente(atribuicaoId);
  }

  /**
   * GET /atribuicoes/atendente/:atendenteId
   * Lista atribuições de um atendente específico
   */
  @Get('atendente/:atendenteId')
  async listarAtribuicoesAtendente(@Param('atendenteId') atendenteId: string) {
    return this.atribuicaoService.listarAtribuicoesAtendente(atendenteId);
  }

  // ========================================================================
  // ATRIBUIÇÕES DE EQUIPE
  // ========================================================================

  /**
   * POST /atribuicoes/equipe
   * Atribui uma equipe a um núcleo ou departamento
   */
  @Post('equipe')
  @HttpCode(HttpStatus.CREATED)
  async atribuirEquipe(@Body() dto: AtribuirEquipeDto) {
    console.log('🔍 [Controller] Recebido DTO:', JSON.stringify(dto, null, 2));
    console.log('🔍 [Controller] Tipos:', {
      equipeId: typeof dto.equipeId,
      nucleoId: typeof dto.nucleoId,
      departamentoId: typeof dto.departamentoId,
    });
    return this.atribuicaoService.atribuirEquipeANucleoDepartamento(dto);
  }

  /**
   * DELETE /atribuicoes/equipe/:id
   * Remove uma atribuição de equipe
   */
  @Delete('equipe/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removerAtribuicaoEquipe(@Param('id') atribuicaoId: string) {
    await this.atribuicaoService.removerAtribuicaoEquipe(atribuicaoId);
  }

  /**
   * GET /atribuicoes/equipe/:equipeId
   * Lista atribuições de uma equipe específica
   */
  @Get('equipe/:equipeId')
  async listarAtribuicoesEquipe(@Param('equipeId') equipeId: string) {
    return this.atribuicaoService.listarAtribuicoesEquipe(equipeId);
  }

  // ========================================================================
  // CONSULTA DE DISPONIBILIDADE
  // ========================================================================

  /**
   * GET /atribuicoes/disponiveis
   * Busca atendentes disponíveis para um núcleo/departamento
   */
  @Get('disponiveis')
  async buscarAtendentesDisponiveis(
    @Request() req,
    @Query() query: BuscarAtendentesDisponiveisDto,
  ) {
    const empresaId = req.user.empresa_id;
    return this.atribuicaoService.buscarAtendentesDisponiveis(
      empresaId,
      query.nucleoId,
      query.departamentoId,
    );
  }
}
