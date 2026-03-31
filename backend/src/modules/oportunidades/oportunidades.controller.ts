import {
  BadRequestException,
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
  LifecycleTransitionDto,
  LifecycleViewOportunidade,
  MetricasQueryDto,
  OportunidadesListQueryDto,
  CreateOportunidadeItemPreliminarDto,
  StaleDealsQueryDto,
  UpdateOportunidadeItemPreliminarDto,
  UpdateLifecycleFeatureFlagDto,
  UpdateStalePolicyDto,
  UpdateSalesFeatureFlagsDto,
} from './dto/oportunidade.dto';
import { ConcluirAtividadeDto, CreateAtividadeDto } from './dto/atividade.dto';
import { TipoAtividade } from './atividade.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
import { EstagioOportunidade, LifecycleStatusOportunidade } from './oportunidade.entity';
import { PropostasService } from '../propostas/propostas.service';

@Controller('oportunidades')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.CRM_OPORTUNIDADES_READ)
export class OportunidadesController {
  constructor(
    private readonly oportunidadesService: OportunidadesService,
    private readonly propostasService: PropostasService,
  ) {}

  private buildLegacyPlaceholderProdutoFromOportunidade(
    oportunidade: Partial<{
      id: string | number;
      titulo: string;
      valor: number;
    }>,
  ) {
    const oportunidadeId = String(oportunidade?.id || '').trim();
    const nomeItem = String(oportunidade?.titulo || '').trim() || 'Item inicial da oportunidade';
    const valorBase = Number.isFinite(Number(oportunidade?.valor))
      ? Math.max(0, Number(oportunidade?.valor))
      : 0;
    const placeholderId = `placeholder-opp-${oportunidadeId || Date.now()}`;

    return {
      id: placeholderId,
      itemPreliminarId: placeholderId,
      nome: nomeItem,
      descricao: 'Item gerado automaticamente a partir do valor da oportunidade.',
      precoUnitario: valorBase,
      quantidade: 1,
      desconto: 0,
      subtotal: valorBase,
      origem: 'oportunidade_placeholder',
    };
  }

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
    @Query('lifecycle_status') lifecycle_status?: LifecycleStatusOportunidade,
    @Query('lifecycle_view') lifecycle_view?: LifecycleViewOportunidade,
    @Query('include_deleted') include_deleted?: string,
  ) {
    const includeDeleted = ['true', '1', 'yes'].includes(
      (include_deleted || '').toString().trim().toLowerCase(),
    );

    const filters = {
      estagio,
      responsavel_id: responsavel_id || undefined,
      cliente_id: cliente_id || undefined,
      dataInicio,
      dataFim,
      lifecycle_status,
      lifecycle_view,
      include_deleted: includeDeleted,
    };

    return this.oportunidadesService.findAll(empresaId, filters);
  }

  @Get('pipeline')
  getPipelineData(
    @EmpresaId() empresaId: string,
    @Query('lifecycle_status') lifecycle_status?: LifecycleStatusOportunidade,
    @Query('lifecycle_view') lifecycle_view?: LifecycleViewOportunidade,
    @Query('include_deleted') include_deleted?: string,
  ) {
    const filters: Partial<OportunidadesListQueryDto> = {
      lifecycle_status,
      lifecycle_view,
      include_deleted: ['true', '1', 'yes'].includes(
        (include_deleted || '').toString().trim().toLowerCase(),
      ),
    };
    return this.oportunidadesService.getPipelineData(empresaId, filters);
  }

  @Get('metricas')
  getMetricas(@EmpresaId() empresaId: string, @Query() queryDto?: MetricasQueryDto) {
    return this.oportunidadesService.getMetricas(empresaId, queryDto);
  }

  @Get('lifecycle/feature-flag')
  getLifecycleFeatureFlag(@EmpresaId() empresaId: string) {
    return this.oportunidadesService.getLifecycleFeatureFlag(empresaId);
  }

  @Patch('lifecycle/feature-flag')
  @Permissions(Permission.CONFIG_AUTOMACOES_MANAGE)
  setLifecycleFeatureFlag(
    @EmpresaId() empresaId: string,
    @Body() body: UpdateLifecycleFeatureFlagDto,
    @Request() req,
  ) {
    return this.oportunidadesService.setLifecycleFeatureFlag({
      empresaId,
      enabled: body.enabled,
      rolloutPercentage: body.rolloutPercentage,
      updatedBy: req.user?.id || null,
    });
  }

  @Get('lifecycle/stale-policy')
  getStalePolicy(@EmpresaId() empresaId: string) {
    return this.oportunidadesService.getStalePolicy(empresaId);
  }

  @Patch('lifecycle/stale-policy')
  @Permissions(Permission.CONFIG_AUTOMACOES_MANAGE)
  setStalePolicy(
    @EmpresaId() empresaId: string,
    @Body() body: UpdateStalePolicyDto,
    @Request() req,
  ) {
    return this.oportunidadesService.setStalePolicy({
      empresaId,
      enabled: body.enabled,
      thresholdDays: body.thresholdDays,
      autoArchiveEnabled: body.autoArchiveEnabled,
      autoArchiveAfterDays: body.autoArchiveAfterDays,
      updatedBy: req.user?.id || null,
    });
  }

  @Get('sales/feature-flags')
  getSalesFeatureFlags(@EmpresaId() empresaId: string) {
    return this.oportunidadesService.getSalesFeatureFlags(empresaId);
  }

  @Patch('sales/feature-flags')
  @Permissions(Permission.CONFIG_AUTOMACOES_MANAGE)
  setSalesFeatureFlags(
    @EmpresaId() empresaId: string,
    @Body() body: UpdateSalesFeatureFlagsDto,
    @Request() req,
  ) {
    return this.oportunidadesService.setSalesFeatureFlags({
      empresaId,
      pipelineDraftWithoutPlaceholder: body.pipelineDraftWithoutPlaceholder,
      opportunityPreliminaryItems: body.opportunityPreliminaryItems,
      strictPropostaTransitions: body.strictPropostaTransitions,
      discountPolicyPerTenant: body.discountPolicyPerTenant,
      updatedBy: req.user?.id || null,
    });
  }

  @Get('stale')
  listStaleDeals(@EmpresaId() empresaId: string, @Query() queryDto?: StaleDealsQueryDto) {
    const parsedThresholdDays = queryDto?.threshold_days ? Number(queryDto.threshold_days) : undefined;
    const parsedLimit = queryDto?.limit ? Number(queryDto.limit) : undefined;

    return this.oportunidadesService.listarOportunidadesParadas(empresaId, {
      thresholdDays: Number.isFinite(parsedThresholdDays) ? parsedThresholdDays : undefined,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });
  }

  @Post('stale/auto-archive/run')
  @Permissions(Permission.CONFIG_AUTOMACOES_MANAGE)
  runAutoArchiveStale(
    @EmpresaId() empresaId: string,
    @Query('dry_run') dryRun?: string,
  ) {
    const isDryRun = ['1', 'true', 'yes', 'sim'].includes((dryRun || '').toString().toLowerCase());
    return this.oportunidadesService.processarAutoArquivamentoStale(empresaId, {
      dryRun: isDryRun,
      trigger: 'manual',
    });
  }

  @Get('atividades/resumo-gerencial')
  @Permissions(Permission.DASHBOARD_READ)
  getResumoAtividadesComerciais(
    @EmpresaId() empresaId: string,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
    @Query('vendedorId') vendedorId?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.oportunidadesService.obterResumoAtividadesComerciais(empresaId, {
      periodStart,
      periodEnd,
      vendedorId,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });
  }

  @Get(':id/itens-preliminares')
  listarItensPreliminares(@Param('id') id: string, @EmpresaId() empresaId: string) {
    return this.oportunidadesService.listarItensPreliminares(id, empresaId);
  }

  @Post(':id/itens-preliminares')
  @Permissions(Permission.CRM_OPORTUNIDADES_UPDATE)
  createItemPreliminar(
    @Param('id') id: string,
    @Body() createDto: CreateOportunidadeItemPreliminarDto,
    @EmpresaId() empresaId: string,
  ) {
    return this.oportunidadesService.criarItemPreliminar(id, createDto, empresaId);
  }

  @Patch(':id/itens-preliminares/:itemId')
  @Permissions(Permission.CRM_OPORTUNIDADES_UPDATE)
  updateItemPreliminar(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() updateDto: UpdateOportunidadeItemPreliminarDto,
    @EmpresaId() empresaId: string,
  ) {
    return this.oportunidadesService.atualizarItemPreliminar(id, itemId, updateDto, empresaId);
  }

  @Delete(':id/itens-preliminares/:itemId')
  @Permissions(Permission.CRM_OPORTUNIDADES_UPDATE)
  removeItemPreliminar(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @EmpresaId() empresaId: string,
  ) {
    return this.oportunidadesService.removerItemPreliminar(id, itemId, empresaId);
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
    return this.oportunidadesService.updateEstagio(
      id,
      updateEstagioDto,
      empresaId,
      req.user?.id,
      req.user?.role,
    );
  }

  @Delete(':id')
  @Permissions(Permission.CRM_OPORTUNIDADES_DELETE)
  remove(@Param('id') id: string, @EmpresaId() empresaId: string, @Request() req) {
    return this.oportunidadesService.remove(id, empresaId, req.user?.id);
  }

  @Delete(':id/permanente')
  @Permissions(Permission.CRM_OPORTUNIDADES_DELETE, Permission.ADMIN_EMPRESAS_MANAGE)
  removePermanente(@Param('id') id: string, @EmpresaId() empresaId: string, @Request() req) {
    return this.oportunidadesService.removePermanente(id, empresaId, req.user?.id);
  }

  @Post(':id/arquivar')
  @Permissions(Permission.CRM_OPORTUNIDADES_UPDATE)
  arquivar(
    @Param('id') id: string,
    @EmpresaId() empresaId: string,
    @Body() body: LifecycleTransitionDto,
    @Request() req,
  ) {
    return this.oportunidadesService.arquivar(id, empresaId, req.user?.id, body);
  }

  @Post(':id/restaurar')
  @Permissions(Permission.CRM_OPORTUNIDADES_UPDATE)
  restaurar(
    @Param('id') id: string,
    @EmpresaId() empresaId: string,
    @Body() body: LifecycleTransitionDto,
    @Request() req,
  ) {
    return this.oportunidadesService.restaurar(id, empresaId, req.user?.id, body);
  }

  @Post(':id/reabrir')
  @Permissions(Permission.CRM_OPORTUNIDADES_UPDATE)
  reabrir(
    @Param('id') id: string,
    @EmpresaId() empresaId: string,
    @Body() body: LifecycleTransitionDto,
    @Request() req,
  ) {
    return this.oportunidadesService.reabrir(id, empresaId, req.user?.id, body);
  }

  @Get(':id/atividades')
  listarAtividades(@Param('id') id: string, @EmpresaId() empresaId: string) {
    return this.oportunidadesService.listarAtividades(id, empresaId);
  }

  @Get(':id/historico-estagios')
  listarHistoricoEstagios(
    @Param('id') id: string,
    @EmpresaId() empresaId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.oportunidadesService.listarHistoricoEstagios(
      id,
      empresaId,
      Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    );
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

  @Patch(':id/atividades/:atividadeId/concluir')
  @Permissions(Permission.CRM_OPORTUNIDADES_UPDATE)
  concluirAtividade(
    @Param('id') id: string,
    @Param('atividadeId') atividadeId: string,
    @Body() payload: ConcluirAtividadeDto,
    @EmpresaId() empresaId: string,
    @Request() req,
  ) {
    const atividadeIdNumber = Number(atividadeId);
    if (!Number.isFinite(atividadeIdNumber) || atividadeIdNumber <= 0) {
      throw new BadRequestException('atividadeId invalido');
    }

    return this.oportunidadesService.concluirAtividade(id, atividadeIdNumber, payload, {
      empresaId,
      userId: req.user?.id,
      userRole: req.user?.role,
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
    const lifecycleStatus =
      oportunidade.lifecycle_status ||
      (oportunidade.estagio === EstagioOportunidade.GANHO
        ? LifecycleStatusOportunidade.WON
        : oportunidade.estagio === EstagioOportunidade.PERDIDO
          ? LifecycleStatusOportunidade.LOST
          : LifecycleStatusOportunidade.OPEN);

    if (lifecycleStatus !== LifecycleStatusOportunidade.OPEN) {
      throw new BadRequestException(
        'Rascunho de proposta disponivel apenas para oportunidades abertas.',
      );
    }

    const estagiosPermitidosParaRascunho = new Set<EstagioOportunidade>([
      EstagioOportunidade.PROPOSTA,
      EstagioOportunidade.NEGOCIACAO,
      EstagioOportunidade.FECHAMENTO,
    ]);

    if (!estagiosPermitidosParaRascunho.has(oportunidade.estagio)) {
      throw new BadRequestException(
        'Rascunho de proposta disponivel apenas nos estagios Proposta, Negociacao ou Fechamento.',
      );
    }

    const salesFeatureFlags = await this.oportunidadesService.getSalesFeatureFlags(empresaId);
    const allowPreliminaryItems = salesFeatureFlags.opportunityPreliminaryItems.enabled;
    const draftWithoutPlaceholder = salesFeatureFlags.pipelineDraftWithoutPlaceholder.enabled;

    const itensPreliminares = allowPreliminaryItems
      ? await this.oportunidadesService.listarItensPreliminares(id, empresaId)
      : [];
    const produtosPreliminares = allowPreliminaryItems
      ? this.oportunidadesService.mapearItensPreliminaresParaProdutosProposta(itensPreliminares)
      : [];

    const produtosBase = [...produtosPreliminares];
    if (!draftWithoutPlaceholder && produtosBase.length === 0) {
      produtosBase.push(this.buildLegacyPlaceholderProdutoFromOportunidade(oportunidade));
    }

    const subtotalPreliminar = produtosBase.reduce(
      (total, item) => total + Number(item.subtotal || 0),
      0,
    );
    const valorBase = subtotalPreliminar > 0 ? subtotalPreliminar : Number(oportunidade.valor || 0);

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
        oportunidadeId: String(oportunidade.id),
        subtotal: valorBase,
        valor: valorBase,
        total: valorBase,
        produtos: produtosBase,
        status: 'rascunho',
        source: 'oportunidade',
        observacoes: draftWithoutPlaceholder
          ? ''
          : `Gerada automaticamente a partir da oportunidade ${String(oportunidade.id || '')}`,
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
      message: 'Rascunho de proposta criado com sucesso',
      proposta,
    };
  }
}
