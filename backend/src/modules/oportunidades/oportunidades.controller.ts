import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OportunidadesService } from './oportunidades.service';
import {
  CreateOportunidadeDto,
  UpdateOportunidadeDto,
  UpdateEstagioDto,
  MetricasQueryDto,
} from './dto/oportunidade.dto';
import { CreateAtividadeDto } from './dto/atividade.dto';
import { TipoAtividade } from './atividade.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
import { EstagioOportunidade } from './oportunidade.entity';
import { PropostasService } from '../propostas/propostas.service';

@Controller('oportunidades')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.CRM_OPORTUNIDADES_READ)
export class OportunidadesController {
  constructor(
    private readonly oportunidadesService: OportunidadesService,
    private readonly propostasService: PropostasService,
  ) {}

  @Post()
  @Permissions(Permission.CRM_OPORTUNIDADES_CREATE)
  create(@Body() createOportunidadeDto: CreateOportunidadeDto, @EmpresaId() empresaId: string) {
    return this.oportunidadesService.create(createOportunidadeDto, empresaId);
  }

  @Get()
  findAll(
    @EmpresaId() empresaId: string,
    @Query('estagio') estagio?: EstagioOportunidade,
    @Query('responsavel_id') responsavel_id?: string,
    @Query('cliente_id') cliente_id?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    const filters = {
      estagio,
      responsavel_id: responsavel_id || undefined,
      cliente_id: cliente_id || undefined,
      dataInicio,
      dataFim,
    };

    return this.oportunidadesService.findAll(empresaId, filters);
  }

  @Get('pipeline')
  getPipelineData(@EmpresaId() empresaId: string) {
    return this.oportunidadesService.getPipelineData(empresaId);
  }

  @Get('metricas')
  getMetricas(@EmpresaId() empresaId: string, @Query() queryDto?: MetricasQueryDto) {
    return this.oportunidadesService.getMetricas(empresaId, queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @EmpresaId() empresaId: string) {
    return this.oportunidadesService.findOne(id, empresaId);
  }

  @Patch(':id')
  @Permissions(Permission.CRM_OPORTUNIDADES_UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateOportunidadeDto: UpdateOportunidadeDto,
    @EmpresaId() empresaId: string,
    @Request() req,
  ) {
    return this.oportunidadesService.update(id, updateOportunidadeDto, empresaId, req.user?.id);
  }

  @Patch(':id/estagio')
  @Permissions(Permission.CRM_OPORTUNIDADES_UPDATE)
  updateEstagio(
    @Param('id') id: string,
    @Body() updateEstagioDto: UpdateEstagioDto,
    @EmpresaId() empresaId: string,
    @Request() req,
  ) {
    return this.oportunidadesService.updateEstagio(id, updateEstagioDto, empresaId, req.user?.id);
  }

  @Delete(':id')
  @Permissions(Permission.CRM_OPORTUNIDADES_DELETE)
  remove(@Param('id') id: string, @EmpresaId() empresaId: string) {
    return this.oportunidadesService.remove(id, empresaId);
  }

  @Get(':id/atividades')
  listarAtividades(@Param('id') id: string, @EmpresaId() empresaId: string) {
    return this.oportunidadesService.listarAtividades(id, empresaId);
  }

  @Post(':id/atividades')
  @Permissions(Permission.CRM_OPORTUNIDADES_UPDATE)
  createAtividade(
    @Param('id') id: string,
    @Body() createAtividadeDto: CreateAtividadeDto,
    @EmpresaId() empresaId: string,
    @Request() req,
  ) {
    createAtividadeDto.oportunidade_id = id;
    return this.oportunidadesService.createAtividade(createAtividadeDto, {
      userId: req.user?.id,
      empresaId,
    });
  }

  @Post(':id/gerar-proposta')
  @Permissions(Permission.CRM_OPORTUNIDADES_UPDATE, Permission.COMERCIAL_PROPOSTAS_CREATE)
  async gerarProposta(
    @Param('id') id: string,
    @EmpresaId() empresaId: string,
    @Request() req,
  ) {
    const oportunidade = await this.oportunidadesService.findOne(id, empresaId);

    const clientePayload = {
      id: oportunidade.cliente_id || null,
      nome:
        oportunidade.empresaContato ||
        oportunidade.nomeContato ||
        oportunidade.titulo ||
        'Cliente não informado',
      email: oportunidade.emailContato || '',
      telefone: oportunidade.telefoneContato || '',
      documento: '',
      status: 'lead',
    };

    const proposta = await this.propostasService.criarProposta(
      {
        titulo: oportunidade.titulo || `Proposta da oportunidade ${oportunidade.id}`,
        cliente: clientePayload,
        valor: Number(oportunidade.valor || 0),
        total: Number(oportunidade.valor || 0),
        status: 'rascunho',
        source: 'oportunidade',
        observacoes: `Gerada automaticamente a partir da oportunidade ${oportunidade.id}`,
      } as any,
      empresaId,
    );

    // Registrar atividade de histórico sem bloquear a criação da proposta
    try {
      await this.oportunidadesService.createAtividade(
        {
          tipo: TipoAtividade.NOTA,
          descricao: `Proposta ${proposta.numero || proposta.id} gerada a partir da oportunidade`,
          oportunidade_id: id,
        },
        { userId: req.user?.id, empresaId },
      );
    } catch {
      // no-op: histórico não deve quebrar a ação principal
    }

    return {
      success: true,
      message: 'Proposta gerada com sucesso',
      proposta,
    };
  }
}
