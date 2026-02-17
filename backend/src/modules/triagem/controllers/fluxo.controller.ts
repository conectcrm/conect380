import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import { CreateFluxoDto, PublicarFluxoDto, UpdateFluxoDto } from '../dto';
import { FluxoTriagemService } from '../services/fluxo-triagem.service';

@Controller('fluxos')
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class FluxoController {
  constructor(private readonly fluxoService: FluxoTriagemService) {}

  @Post()
  async create(@EmpresaId() empresaId: string, @Body() createFluxoDto: CreateFluxoDto) {
    return this.fluxoService.create(empresaId, createFluxoDto);
  }

  @Get()
  async findAll(
    @EmpresaId() empresaId: string,
    @Query('ativo') ativo?: string,
    @Query('publicado') publicado?: string,
    @Query('tipo') tipo?: string,
    @Query('canal') canal?: string,
  ) {
    const filtros: Record<string, unknown> = {};
    if (ativo !== undefined) filtros.ativo = ativo === 'true';
    if (publicado !== undefined) filtros.publicado = publicado === 'true';
    if (tipo) filtros.tipo = tipo;
    if (canal) filtros.canal = canal;

    return this.fluxoService.findAll(empresaId, filtros);
  }

  @Get('canal/:canal')
  async findByCanal(@EmpresaId() empresaId: string, @Param('canal') canal: string) {
    return this.fluxoService.findByCanal(empresaId, canal);
  }

  @Get('padrao/:canal')
  async findPadrao(@EmpresaId() empresaId: string, @Param('canal') canal: string) {
    const fluxo = await this.fluxoService.findFluxoPadrao(empresaId, canal);

    if (!fluxo) {
      return {
        encontrado: false,
        mensagem: `Nenhum fluxo padrao encontrado para o canal ${canal}`,
      };
    }

    return { encontrado: true, fluxo };
  }

  @Get(':id')
  async findOne(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return this.fluxoService.findOne(empresaId, id);
  }

  @Put(':id')
  async update(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() updateFluxoDto: UpdateFluxoDto,
  ) {
    return this.fluxoService.update(empresaId, id, updateFluxoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@EmpresaId() empresaId: string, @Param('id') id: string) {
    await this.fluxoService.remove(empresaId, id);
  }

  @Post(':id/publicar')
  async publicar(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() dto: PublicarFluxoDto,
    @Request() req: any,
  ) {
    return this.fluxoService.publicar(empresaId, id, dto, req.user.id);
  }

  @Post(':id/despublicar')
  async despublicar(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return this.fluxoService.despublicar(empresaId, id);
  }

  @Post(':id/duplicar')
  async duplicar(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body('novoNome') novoNome: string | undefined,
    @Request() req: any,
  ) {
    return this.fluxoService.duplicar(empresaId, id, novoNome, req.user.id);
  }

  @Get(':id/estatisticas')
  async getEstatisticas(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return this.fluxoService.getEstatisticas(empresaId, id);
  }

  @Get(':id/versoes')
  async getVersoes(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return this.fluxoService.getVersoes(empresaId, id);
  }

  @Get(':id/historico')
  async getHistoricoVersoes(@EmpresaId() empresaId: string, @Param('id') id: string) {
    const historico = await this.fluxoService.getHistoricoVersoes(empresaId, id);

    return {
      success: true,
      data: historico,
      total: historico.length,
    };
  }

  @Post(':id/salvar-versao')
  async salvarVersao(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body('descricao') descricao: string | undefined,
    @Request() req: any,
  ) {
    const fluxo = await this.fluxoService.salvarVersao(empresaId, id, req.user.id, descricao);

    return {
      success: true,
      message: `Versao ${fluxo.versaoAtual - 1} salva com sucesso`,
      data: fluxo,
    };
  }

  @Post(':id/restaurar-versao')
  async restaurarVersao(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body('numeroVersao') numeroVersao: number,
    @Request() req: any,
  ) {
    if (!numeroVersao || numeroVersao < 1) {
      throw new BadRequestException('Numero de versao invalido');
    }

    const fluxo = await this.fluxoService.restaurarVersao(
      empresaId,
      id,
      numeroVersao,
      req.user.id,
    );

    return {
      success: true,
      message: `Fluxo restaurado para versao ${numeroVersao} com sucesso`,
      data: fluxo,
    };
  }
}
