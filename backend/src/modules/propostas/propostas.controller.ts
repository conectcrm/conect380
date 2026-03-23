import { Logger,
  Controller,
  Put,
  Param,
  Body,
  Request,
  HttpStatus,
  HttpException,
  Get,
  Post,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PropostasService, Proposta } from './propostas.service';
import {
  AtualizarStatusDto,
  AtualizarPropostaDto,
  CancelarVendaDto,
  PropostaResponseDto,
  CriarPropostaDto,
  PropostaDto,
} from './dto/proposta.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
import { PortalService } from './portal.service';

@Controller('propostas')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.COMERCIAL_PROPOSTAS_READ)
export class PropostasController {
  private readonly logger = new Logger(PropostasController.name);
  constructor(
    private readonly propostasService: PropostasService,
    private readonly portalService: PortalService,
  ) {}

  private resolveErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof HttpException) {
      const response = error.getResponse();

      if (typeof response === 'string' && response.trim()) {
        return response;
      }

      if (response && typeof response === 'object') {
        const responseRecord = response as Record<string, unknown>;
        const responseMessage = responseRecord.message;

        if (Array.isArray(responseMessage)) {
          const joined = responseMessage
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .join('. ');

          if (joined) {
            return joined;
          }
        }

        if (typeof responseMessage === 'string' && responseMessage.trim()) {
          return responseMessage;
        }
      }
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      const message = (error as { message: string }).message.trim();
      if (message) {
        return message;
      }
    }

    return fallbackMessage;
  }

  // Helper para converter Proposta para PropostaDto
  private toPropostaDto(proposta: Proposta): PropostaDto {
    const cliente =
      proposta?.cliente && typeof proposta.cliente === 'object'
        ? {
            id: proposta.cliente.id,
            nome: proposta.cliente.nome,
            email: proposta.cliente.email,
            telefone: proposta.cliente.telefone,
            documento: proposta.cliente.documento,
            status: proposta.cliente.status,
            endereco: (proposta.cliente as any)?.endereco,
            cidade: (proposta.cliente as any)?.cidade,
            estado: (proposta.cliente as any)?.estado,
            cep: (proposta.cliente as any)?.cep,
            tipoPessoa: (proposta.cliente as any)?.tipoPessoa,
          }
        : typeof proposta?.cliente === 'string'
          ? proposta.cliente
          : 'Cliente nao informado';

    return {
      id: proposta.id,
      numero: proposta.numero,
      titulo: proposta.titulo,
      status: proposta.status,
      motivoPerda: proposta.motivoPerda,
      cliente,
      produtos: Array.isArray(proposta.produtos) ? proposta.produtos : [],
      subtotal: Number(proposta.subtotal ?? 0),
      descontoGlobal: Number(proposta.descontoGlobal ?? 0),
      impostos: Number(proposta.impostos ?? 0),
      total: Number(proposta.total ?? proposta.valor ?? 0),
      valor: Number(proposta.valor ?? proposta.total ?? 0),
      dataVencimento: proposta.dataVencimento,
      incluirImpostosPDF: proposta.incluirImpostosPDF,
      observacoes: proposta.observacoes,
      createdAt: proposta.createdAt,
      updatedAt: proposta.updatedAt,
      criadaEm: proposta.criadaEm || proposta.createdAt,
      atualizadaEm: proposta.atualizadaEm || proposta.updatedAt,
      source: proposta.source,
      vendedor: proposta.vendedor,
      formaPagamento: proposta.formaPagamento,
      parcelas: (proposta as any).parcelas,
      validadeDias: proposta.validadeDias,
      oportunidade: proposta.oportunidade,
      isPropostaPrincipal: proposta.isPropostaPrincipal,
      aprovacaoInterna: proposta.aprovacaoInterna,
      lembretes: Array.isArray(proposta.lembretes) ? proposta.lembretes : undefined,
      historicoEventos: Array.isArray(proposta.historicoEventos) ? proposta.historicoEventos : undefined,
      versoes: Array.isArray(proposta.versoes) ? proposta.versoes : undefined,
      emailDetails:
        proposta.emailDetails && typeof proposta.emailDetails === 'object'
          ? proposta.emailDetails
          : undefined,
      tokenPortal:
        typeof (proposta as any).tokenPortal === 'string' ? String((proposta as any).tokenPortal) : undefined,
    };
  }

  /**
   * Lista todas as propostas
   */
  @Get()
  async listarPropostas(@EmpresaId() empresaId: string): Promise<any> {
    try {
      const propostas = await this.propostasService.listarPropostas(empresaId);

      return {
        success: true,
        propostas,
        total: propostas.length,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao listar propostas',
          error: this.resolveErrorMessage(error, 'Falha ao listar propostas'),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('estatisticas/dashboard')
  async obterEstatisticasDashboard(@EmpresaId() empresaId: string) {
    try {
      const dados = await this.propostasService.obterEstatisticasDashboard(empresaId);
      return {
        success: true,
        ...dados,
      };
    } catch (error) {
      this.logger.error('[PROPOSTAS] Erro ao carregar estatisticas do dashboard:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao carregar estatisticas do dashboard',
          error: this.resolveErrorMessage(error, 'Falha ao carregar estatisticas do dashboard'),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('expiradas')
  async obterPropostasExpiradas(
    @EmpresaId() empresaId: string,
    @Query('vendedorId') vendedorId?: string,
  ) {
    try {
      const propostas = await this.propostasService.listarPropostasExpiradas(empresaId, vendedorId);
      return propostas;
    } catch (error) {
      this.logger.error('[PROPOSTAS] Erro ao listar propostas expiradas:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao listar propostas expiradas',
          error: this.resolveErrorMessage(error, 'Falha ao listar propostas expiradas'),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/estatisticas')
  async obterEstatisticasProposta(
    @EmpresaId() empresaId: string,
    @Param('id') propostaId: string,
  ) {
    try {
      const dados = await this.propostasService.obterEstatisticasProposta(propostaId, empresaId);
      return dados;
    } catch (error) {
      this.logger.error('[PROPOSTAS] Erro ao obter estatisticas da proposta:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao obter estatisticas da proposta',
          error: this.resolveErrorMessage(error, 'Falha ao obter estatisticas da proposta'),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/agendar-lembrete')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_UPDATE)
  async agendarLembrete(
    @EmpresaId() empresaId: string,
    @Param('id') propostaId: string,
    @Body() body?: { diasApos?: number },
  ): Promise<any> {
    try {
      const lembrete = await this.propostasService.agendarLembrete(
        propostaId,
        body?.diasApos,
        empresaId,
      );
      return {
        success: true,
        message: 'Lembrete agendado com sucesso',
        lembrete,
      };
    } catch (error) {
      this.logger.error('[PROPOSTAS] Erro ao agendar lembrete:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao agendar lembrete',
          error: this.resolveErrorMessage(error, 'Falha ao agendar lembrete'),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/reativar')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_UPDATE)
  async reativarProposta(
    @EmpresaId() empresaId: string,
    @Param('id') propostaId: string,
    @Body() body: { novaDataValidade: string; expiresInDays?: number },
  ) {
    try {
      const proposta = await this.propostasService.reativarProposta(
        propostaId,
        body?.novaDataValidade,
        empresaId,
      );
      const tokenData = await this.portalService.gerarTokenParaProposta(
        propostaId,
        empresaId,
        body?.expiresInDays || 30,
      );

      return {
        success: true,
        message: 'Proposta reativada com sucesso',
        proposta: this.toPropostaDto(proposta),
        novoToken: tokenData.token,
        tokenExpiraEm: tokenData.expiresAt,
      };
    } catch (error) {
      this.logger.error('[PROPOSTAS] Erro ao reativar proposta:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao reativar proposta',
          error: this.resolveErrorMessage(error, 'Falha ao reativar proposta'),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/historico')
  async obterHistoricoProposta(
    @EmpresaId() empresaId: string,
    @Param('id') propostaId: string,
  ): Promise<any> {
    try {
      const historico = await this.propostasService.obterHistoricoProposta(propostaId, empresaId);
      return historico;
    } catch (error) {
      this.logger.error('[PROPOSTAS] Erro ao obter historico da proposta:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao obter historico da proposta',
          error: this.resolveErrorMessage(error, 'Falha ao obter historico da proposta'),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/aprovacao')
  async obterAprovacaoInterna(
    @EmpresaId() empresaId: string,
    @Param('id') propostaId: string,
  ): Promise<any> {
    try {
      const aprovacao = await this.propostasService.obterAprovacaoInterna(propostaId, empresaId);
      return {
        success: true,
        aprovacao,
      };
    } catch (error) {
      this.logger.error('[PROPOSTAS] Erro ao obter aprovacao interna da proposta:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao obter aprovacao interna',
          error: this.resolveErrorMessage(error, 'Falha ao obter aprovacao interna'),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/aprovacao/solicitar')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_UPDATE)
  async solicitarAprovacaoInterna(
    @EmpresaId() empresaId: string,
    @Param('id') propostaId: string,
    @Body()
    body?: {
      solicitadaPorId?: string;
      solicitadaPorNome?: string;
      observacoes?: string;
    },
  ): Promise<any> {
    try {
      const aprovacao = await this.propostasService.solicitarAprovacaoInterna(
        propostaId,
        {
          solicitadaPorId: body?.solicitadaPorId,
          solicitadaPorNome: body?.solicitadaPorNome,
          observacoes: body?.observacoes,
        },
        empresaId,
      );
      return {
        success: true,
        aprovacao,
      };
    } catch (error) {
      this.logger.error('[PROPOSTAS] Erro ao solicitar aprovacao interna:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao solicitar aprovacao interna',
          error: this.resolveErrorMessage(error, 'Falha ao solicitar aprovacao interna'),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/aprovacao/decidir')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_UPDATE)
  async decidirAprovacaoInterna(
    @EmpresaId() empresaId: string,
    @Param('id') propostaId: string,
    @Body()
    body: {
      aprovada: boolean;
      usuarioId?: string;
      usuarioNome?: string;
      observacoes?: string;
    },
  ): Promise<any> {
    try {
      const aprovacao = await this.propostasService.decidirAprovacaoInterna(
        propostaId,
        {
          aprovada: Boolean(body?.aprovada),
          usuarioId: body?.usuarioId,
          usuarioNome: body?.usuarioNome,
          observacoes: body?.observacoes,
        },
        empresaId,
      );

      return {
        success: true,
        aprovacao,
      };
    } catch (error) {
      this.logger.error('[PROPOSTAS] Erro ao decidir aprovacao interna:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao decidir aprovacao interna',
          error: this.resolveErrorMessage(error, 'Falha ao decidir aprovacao interna'),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Atualiza dados de uma proposta
   */
  @Put(':id')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_UPDATE)
  async atualizarProposta(
    @EmpresaId() empresaId: string,
    @Param('id') propostaId: string,
    @Body() dadosProposta: AtualizarPropostaDto,
  ): Promise<PropostaResponseDto> {
    try {
      this.logger.log(`[PROPOSTAS] Atualizando proposta: ${propostaId}`);

      const proposta = await this.propostasService.atualizarProposta(
        propostaId,
        dadosProposta as Partial<Proposta>,
        empresaId,
      );

      return {
        success: true,
        message: 'Proposta atualizada com sucesso',
        proposta: this.toPropostaDto(proposta),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('[PROPOSTAS] Erro ao atualizar proposta:', error);
      const message = this.resolveErrorMessage(error, 'Falha ao atualizar proposta');
      const statusCode = message.includes('nao encontrada')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.INTERNAL_SERVER_ERROR;

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao atualizar proposta',
          error: message,
        },
        statusCode,
      );
    }
  }

  /**
   * Atualiza o status de uma proposta
   */
  @Put(':id/status')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_UPDATE)
  async atualizarStatus(
    @EmpresaId() empresaId: string,
    @Param('id') propostaId: string,
    @Body() updateData: AtualizarStatusDto,
    @Request() req: any,
  ): Promise<PropostaResponseDto> {
    try {
      this.logger.log(`[PROPOSTAS] Atualizando status da proposta ${propostaId} para: ${updateData.status}`);

      const resultado = await this.propostasService.atualizarStatus(
        propostaId,
        updateData.status,
        updateData.source || 'api',
        updateData.observacoes,
        updateData.motivoPerda,
        empresaId,
        undefined,
        {
          actorUserId: req?.user?.id,
          actorPermissions: Array.isArray(req?.user?.permissions) ? req.user.permissions : [],
          allowDirectApprovalOverride: Boolean(updateData.forceDirectApproval),
          overrideReason: updateData.overrideReason,
        },
      );

      this.logger.log('[PROPOSTAS] Status atualizado com sucesso');

      return {
        success: true,
        message: 'Status atualizado com sucesso',
        proposta: this.toPropostaDto(resultado),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('[PROPOSTAS] Erro ao atualizar status:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao atualizar status da proposta',
          error: this.resolveErrorMessage(error, 'Falha ao atualizar status da proposta'),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/cancelar-venda')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_UPDATE)
  async cancelarVenda(
    @EmpresaId() empresaId: string,
    @Param('id') propostaId: string,
    @Body() payload: CancelarVendaDto,
    @Request() req: any,
  ): Promise<PropostaResponseDto> {
    try {
      this.logger.log(`[PROPOSTAS] Cancelando venda da proposta ${propostaId}`);

      const proposta = await this.propostasService.cancelarVenda(
        propostaId,
        {
          motivo: payload?.motivo,
          observacoes: payload?.observacoes,
          source: payload?.source || 'cancelamento-venda',
          actorUserId: req?.user?.id,
        },
        empresaId,
      );

      return {
        success: true,
        message: 'Venda cancelada com sucesso',
        proposta: this.toPropostaDto(proposta),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('[PROPOSTAS] Erro ao cancelar venda:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao cancelar venda da proposta',
          error: this.resolveErrorMessage(error, 'Falha ao cancelar venda da proposta'),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/principal')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_UPDATE)
  async definirComoPrincipal(
    @EmpresaId() empresaId: string,
    @Param('id') propostaId: string,
  ): Promise<PropostaResponseDto> {
    try {
      this.logger.log(`[PROPOSTAS] Definindo proposta principal: ${propostaId}`);

      const proposta = await this.propostasService.definirComoPrincipal(propostaId, empresaId);

      return {
        success: true,
        message: 'Proposta principal definida com sucesso',
        proposta: this.toPropostaDto(proposta),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('[PROPOSTAS] Erro ao definir proposta principal:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao definir proposta principal',
          error: this.resolveErrorMessage(error, 'Falha ao definir proposta principal'),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtem uma proposta por ID
   */
  @Get(':id')
  async obterProposta(
    @EmpresaId() empresaId: string,
    @Param('id') propostaId: string,
  ): Promise<PropostaResponseDto> {
    try {
      const proposta = await this.propostasService.obterProposta(propostaId, empresaId);

      if (!proposta) {
        throw new HttpException(
          {
            success: false,
            message: 'Proposta nao encontrada',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        proposta: this.toPropostaDto(proposta),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar proposta',
          error: this.resolveErrorMessage(error, 'Falha ao buscar proposta'),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Cria uma nova proposta
   */
  @Post()
  @Permissions(Permission.COMERCIAL_PROPOSTAS_CREATE)
  async criarProposta(
    @EmpresaId() empresaId: string,
    @Body() dadosProposta: CriarPropostaDto,
  ): Promise<PropostaResponseDto> {
    try {
      const payload = dadosProposta as any;
      this.logger.log(
        `[PROPOSTAS] Criando nova proposta (resumo): ${JSON.stringify({
          titulo: payload?.titulo ? String(payload.titulo).slice(0, 80) : null,
          clienteId: payload?.clienteId || payload?.cliente?.id || null,
          clienteNome: payload?.cliente?.nome
            ? String(payload.cliente.nome).slice(0, 60)
            : null,
          itens: Array.isArray(payload?.produtos) ? payload.produtos.length : 0,
          total: payload?.total ?? payload?.valor ?? null,
          status: payload?.status || null,
        })}`,
      );

      // Converter dados do frontend para formato interno
      const propostaParaCriar: Partial<Proposta> = {
        titulo: payload.titulo || `Proposta ${Date.now()}`,
        cliente: payload.cliente,
        oportunidadeId: payload.oportunidadeId || payload.oportunidade_id,
        produtos: payload.produtos || [],
        subtotal: payload.subtotal || 0,
        descontoGlobal: payload.descontoGlobal || 0,
        impostos: payload.impostos || 0,
        total: payload.total || payload.valor || 0,
        valor: payload.valor || payload.total || 0,
        formaPagamento: payload.formaPagamento || 'avista',
        validadeDias: payload.validadeDias || 30,
        observacoes: payload.observacoes,
        incluirImpostosPDF: payload.incluirImpostosPDF || false,
        vendedor: payload.vendedor,
      };

      const proposta = await this.propostasService.criarProposta(propostaParaCriar, empresaId);

      return {
        success: true,
        message: 'Proposta criada com sucesso',
        proposta: this.toPropostaDto(proposta),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('[PROPOSTAS] Erro ao criar proposta:', error);

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao criar proposta',
          error: this.resolveErrorMessage(error, 'Falha ao criar proposta'),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Gera token publico do portal para compartilhamento/envio de proposta
   */
  @Post(':id/gerar-token')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_UPDATE)
  async gerarTokenPortal(
    @EmpresaId() empresaId: string,
    @Param('id') propostaId: string,
    @Body() body?: { expiresInDays?: number },
  ) {
    try {
      const expiresInDays =
        typeof body?.expiresInDays === 'number' && Number.isFinite(body.expiresInDays)
          ? body.expiresInDays
          : 30;

      const tokenData = await this.portalService.gerarTokenParaProposta(
        propostaId,
        empresaId,
        expiresInDays,
      );

      const proposta = await this.propostasService.obterProposta(tokenData.propostaId, empresaId);

      return {
        success: true,
        token: tokenData.token,
        expiresAt: tokenData.expiresAt,
        linkPortal: proposta?.numero
          ? `/portal/${proposta.numero}/${tokenData.token}`
          : `/portal/proposta/${tokenData.token}`,
      };
    } catch (error) {
      this.logger.error('[PROPOSTAS] Erro ao gerar token de portal:', error);
      const message = this.resolveErrorMessage(error, 'Falha ao gerar token de portal');
      const statusCode = message.includes('nao encontrada')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao gerar token de portal',
          error: message,
        },
        statusCode,
      );
    }
  }

  /**
   * Remove uma proposta
   */
  @Delete(':id')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_DELETE)
  async removerProposta(
    @EmpresaId() empresaId: string,
    @Param('id') propostaId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`[PROPOSTAS] Removendo proposta: ${propostaId}`);

      await this.propostasService.removerProposta(propostaId, empresaId);

      return {
        success: true,
        message: 'Proposta removida com sucesso',
      };
    } catch (error) {
      this.logger.error('[PROPOSTAS] Erro ao remover proposta:', error);

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao remover proposta',
          error: this.resolveErrorMessage(error, 'Falha ao remover proposta'),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
