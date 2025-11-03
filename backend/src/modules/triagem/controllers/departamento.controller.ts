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
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import { DepartamentoService } from '../services/departamento.service';
import {
  CreateDepartamentoDto,
  UpdateDepartamentoDto,
  FilterDepartamentoDto,
} from '../dto/departamento.dto';

@Controller('departamentos')
@UseGuards(JwtAuthGuard)
export class DepartamentoController {
  constructor(private readonly departamentoService: DepartamentoService) { }

  /**
   * POST /departamentos
   * Cria um novo departamento
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() createDto: CreateDepartamentoDto) {
    const empresaId = req.user.empresa_id;
    return this.departamentoService.create(empresaId, createDto);
  }

  /**
   * GET /departamentos
   * Lista todos os departamentos com filtros opcionais
   */
  @Get()
  async findAll(@Request() req, @Query() filters: FilterDepartamentoDto) {
    const empresaId = req.user.empresa_id;
    return this.departamentoService.findAll(empresaId, filters);
  }

  /**
   * GET /departamentos/nucleo/:nucleoId
   * Lista departamentos ativos de um núcleo específico
   */
  @Get('nucleo/:nucleoId')
  async findByNucleo(@Request() req, @Param('nucleoId') nucleoId: string) {
    const empresaId = req.user.empresa_id;
    return this.departamentoService.findByNucleo(empresaId, nucleoId);
  }

  /**
   * GET /departamentos/:id
   * Busca um departamento específico
   */
  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id;
    return this.departamentoService.findOne(empresaId, id);
  }

  /**
   * GET /departamentos/:id/estatisticas
   * Busca estatísticas do departamento
   */
  @Get(':id/estatisticas')
  async getEstatisticas(@Request() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id;
    return this.departamentoService.getEstatisticas(empresaId, id);
  }

  /**
   * PUT /departamentos/:id
   * Atualiza um departamento
   */
  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateDepartamentoDto,
  ) {
    const empresaId = req.user.empresa_id;
    return this.departamentoService.update(empresaId, id, updateDto);
  }

  /**
   * DELETE /departamentos/:id
   * Remove um departamento
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id;
    await this.departamentoService.remove(empresaId, id);
  }

  /**
   * POST /departamentos/:id/atendentes/:atendenteId
   * Adiciona um atendente ao departamento
   */
  @Post(':id/atendentes/:atendenteId')
  async adicionarAtendente(
    @Request() req,
    @Param('id') id: string,
    @Param('atendenteId') atendenteId: string,
  ) {
    const empresaId = req.user.empresa_id;
    return this.departamentoService.adicionarAtendente(
      empresaId,
      id,
      atendenteId,
    );
  }

  /**
   * DELETE /departamentos/:id/atendentes/:atendenteId
   * Remove um atendente do departamento
   */
  @Delete(':id/atendentes/:atendenteId')
  async removerAtendente(
    @Request() req,
    @Param('id') id: string,
    @Param('atendenteId') atendenteId: string,
  ) {
    const empresaId = req.user.empresa_id;
    return this.departamentoService.removerAtendente(
      empresaId,
      id,
      atendenteId,
    );
  }

  /**
   * POST /departamentos/reordenar
   * Reordena os departamentos de um núcleo
   */
  @Post('reordenar')
  @HttpCode(HttpStatus.OK)
  async reordenar(
    @Request() req,
    @Body() body: { nucleoId: string; ordenacao: { id: string; ordem: number }[] },
  ) {
    const empresaId = req.user.empresa_id;
    await this.departamentoService.reordenar(
      empresaId,
      body.nucleoId,
      body.ordenacao,
    );
    return { message: 'Departamentos reordenados com sucesso' };
  }
}
