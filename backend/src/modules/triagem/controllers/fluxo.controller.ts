import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import { FluxoTriagemService } from '../services/fluxo-triagem.service';
import {
  CreateFluxoDto,
  UpdateFluxoDto,
  PublicarFluxoDto,
} from '../dto';

@Controller('fluxos')
@UseGuards(JwtAuthGuard)
export class FluxoController {
  constructor(private readonly fluxoService: FluxoTriagemService) { }

  /**
   * POST /fluxos
   * Criar novo fluxo de triagem
   */
  @Post()
  async create(@Request() req, @Body() createFluxoDto: CreateFluxoDto) {
    const empresaId = req.user.empresa_id;
    return this.fluxoService.create(empresaId, createFluxoDto);
  }

  /**
   * GET /fluxos
   * Listar fluxos com filtros opcionais
   */
  @Get()
  async findAll(
    @Request() req,
    @Query('ativo') ativo?: string,
    @Query('publicado') publicado?: string,
    @Query('tipo') tipo?: string,
    @Query('canal') canal?: string,
  ) {
    const empresaId = req.user.empresa_id;

    const filtros: any = {};
    if (ativo !== undefined) filtros.ativo = ativo === 'true';
    if (publicado !== undefined) filtros.publicado = publicado === 'true';
    if (tipo) filtros.tipo = tipo;
    if (canal) filtros.canal = canal;

    return this.fluxoService.findAll(empresaId, filtros);
  }

  /**
   * GET /fluxos/canal/:canal
   * Buscar fluxos por canal
   */
  @Get('canal/:canal')
  async findByCanal(@Request() req, @Param('canal') canal: string) {
    const empresaId = req.user.empresa_id;
    return this.fluxoService.findByCanal(empresaId, canal);
  }

  /**
   * GET /fluxos/padrao/:canal
   * Buscar fluxo padrão para um canal
   */
  @Get('padrao/:canal')
  async findPadrao(@Request() req, @Param('canal') canal: string) {
    const empresaId = req.user.empresa_id;
    const fluxo = await this.fluxoService.findFluxoPadrao(empresaId, canal);

    if (!fluxo) {
      return {
        encontrado: false,
        mensagem: `Nenhum fluxo padrão encontrado para o canal ${canal}`
      };
    }

    return { encontrado: true, fluxo };
  }

  /**
   * GET /fluxos/:id
   * Buscar fluxo por ID
   */
  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id;
    return this.fluxoService.findOne(empresaId, id);
  }

  /**
   * PUT /fluxos/:id
   * Atualizar fluxo
   */
  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateFluxoDto: UpdateFluxoDto,
  ) {
    const empresaId = req.user.empresa_id;
    return this.fluxoService.update(empresaId, id, updateFluxoDto);
  }

  /**
   * DELETE /fluxos/:id
   * Deletar fluxo (soft delete)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id;
    await this.fluxoService.remove(empresaId, id);
  }

  /**
   * POST /fluxos/:id/publicar
   * Publicar fluxo (tornar ativo para uso)
   */
  @Post(':id/publicar')
  async publicar(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: PublicarFluxoDto,
  ) {
    const empresaId = req.user.empresa_id;
    const usuarioId = req.user.id;
    return this.fluxoService.publicar(empresaId, id, dto, usuarioId);
  }

  /**
   * POST /fluxos/:id/despublicar
   * Despublicar fluxo (remover de uso ativo)
   */
  @Post(':id/despublicar')
  async despublicar(@Request() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id;
    return this.fluxoService.despublicar(empresaId, id);
  }

  /**
   * POST /fluxos/:id/duplicar
   * Duplicar fluxo existente
   */
  @Post(':id/duplicar')
  async duplicar(
    @Request() req,
    @Param('id') id: string,
    @Body('novoNome') novoNome?: string,
  ) {
    const empresaId = req.user.empresa_id;
    const usuarioId = req.user.id;
    return this.fluxoService.duplicar(empresaId, id, novoNome, usuarioId);
  }

  /**
   * GET /fluxos/:id/estatisticas
   * Buscar estatísticas de um fluxo
   */
  @Get(':id/estatisticas')
  async getEstatisticas(@Request() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id;
    return this.fluxoService.getEstatisticas(empresaId, id);
  }

  /**
   * GET /fluxos/:id/versoes
   * Listar versões de um fluxo
   */
  @Get(':id/versoes')
  async getVersoes(@Request() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id;
    return this.fluxoService.getVersoes(empresaId, id);
  }

  /**
   * GET /fluxos/:id/historico
   * Obter histórico de versões (snapshots) de um fluxo
   */
  @Get(':id/historico')
  async getHistoricoVersoes(@Request() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id;
    const historico = await this.fluxoService.getHistoricoVersoes(empresaId, id);

    return {
      success: true,
      data: historico,
      total: historico.length,
    };
  }

  /**
   * POST /fluxos/:id/salvar-versao
   * Salvar snapshot da versão atual
   */
  @Post(':id/salvar-versao')
  async salvarVersao(
    @Request() req,
    @Param('id') id: string,
    @Body('descricao') descricao?: string,
  ) {
    const empresaId = req.user.empresa_id;
    const usuarioId = req.user.id;

    const fluxo = await this.fluxoService.salvarVersao(
      empresaId,
      id,
      usuarioId,
      descricao,
    );

    return {
      success: true,
      message: `Versão ${fluxo.versaoAtual - 1} salva com sucesso`,
      data: fluxo,
    };
  }

  /**
   * POST /fluxos/:id/restaurar-versao
   * Restaurar uma versão anterior do fluxo
   */
  @Post(':id/restaurar-versao')
  async restaurarVersao(
    @Request() req,
    @Param('id') id: string,
    @Body('numeroVersao') numeroVersao: number,
  ) {
    const empresaId = req.user.empresa_id;
    const usuarioId = req.user.id;

    if (!numeroVersao || numeroVersao < 1) {
      throw new BadRequestException('Número de versão inválido');
    }

    const fluxo = await this.fluxoService.restaurarVersao(
      empresaId,
      id,
      numeroVersao,
      usuarioId,
    );

    return {
      success: true,
      message: `Fluxo restaurado para versão ${numeroVersao} com sucesso`,
      data: fluxo,
    };
  }
}
