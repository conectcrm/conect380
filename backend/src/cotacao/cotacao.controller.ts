import { Logger,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { EmpresaGuard } from '../common/guards/empresa.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/permissions/permissions.constants';
import { CotacaoService } from './cotacao.service';
import {
  CriarCotacaoDto,
  AtualizarCotacaoDto,
  CotacaoQueryDto,
  AlterarStatusDto,
  DuplicarCotacaoDto,
  EnviarEmailDto,
  ConverterPedidoDto,
  GerarContaPagarDto,
  MarcarAdquiridoDto,
  CotacaoResponseDto,
} from './dto/cotacao.dto';
import { StatusCotacao } from './entities/cotacao.entity';

@ApiTags('Cotações')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.COMERCIAL_PROPOSTAS_READ)
@Controller('cotacao')
export class CotacaoController {
  private readonly logger = new Logger(CotacaoController.name);
  constructor(private readonly cotacaoService: CotacaoService) {}

  @Post()
  @Permissions(Permission.COMERCIAL_PROPOSTAS_CREATE)
  @ApiOperation({ summary: 'Criar nova cotação' })
  @ApiResponse({
    status: 201,
    description: 'Cotação criada com sucesso',
    type: CotacaoResponseDto,
  })
  async criar(
    @Body() criarCotacaoDto: CriarCotacaoDto,
    @Req() req: any,
  ): Promise<CotacaoResponseDto> {
    try {
      const cotacao = await this.cotacaoService.criar(criarCotacaoDto, req.user.id, req.user.empresa_id);
      return cotacao;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao criar cotação',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar cotações com filtros e paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cotações',
    type: [CotacaoResponseDto],
  })
  async listar(@Query() query: CotacaoQueryDto, @Req() req: any) {
    try {
      const result = await this.cotacaoService.listar(query, req.user.id, req.user.empresa_id);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao listar cotações',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('minhas-aprovacoes')
  @ApiOperation({ summary: 'Listar cotações pendentes de aprovação do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cotações pendentes de aprovação',
    type: [CotacaoResponseDto],
  })
  async minhasAprovacoes(@Req() req: any): Promise<CotacaoResponseDto[]> {
    try {
      return await this.cotacaoService.minhasAprovacoes(req.user.id, req.user.empresa_id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao listar aprovações pendentes',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('estatisticas')
  @ApiOperation({ summary: 'Obter estatísticas das cotações' })
  @ApiResponse({ status: 200, description: 'Estatísticas das cotações' })
  async obterEstatisticas(@Req() req: any) {
    try {
      const estatisticas = await this.cotacaoService.obterEstatisticas(req.user.id, req.user.empresa_id);
      return estatisticas;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao obter estatísticas',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Obter dados do dashboard de cotações' })
  @ApiResponse({ status: 200, description: 'Dados do dashboard' })
  async obterDashboard(@Req() req: any) {
    try {
      const dashboard = await this.cotacaoService.obterDashboard(req.user.id, req.user.empresa_id);
      return dashboard;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao obter dados do dashboard',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('metadata/criacao')
  @ApiOperation({
    summary: 'Obter metadata de criação/edição de cotação (fornecedores e aprovadores)',
  })
  @ApiResponse({ status: 200, description: 'Metadata de criação da cotação' })
  async obterMetadataCriacao(@Req() req: any) {
    try {
      return await this.cotacaoService.obterMetadataCriacao(req.user.id, req.user.empresa_id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao obter metadata de criação',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cotação por ID' })
  @ApiResponse({
    status: 200,
    description: 'Cotação encontrada',
    type: CotacaoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Cotação não encontrada' })
  async buscarPorId(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ): Promise<CotacaoResponseDto> {
    try {
      const cotacao = await this.cotacaoService.buscarPorId(id, req.user.id, req.user.empresa_id);
      if (!cotacao) {
        throw new HttpException('Cotação não encontrada', HttpStatus.NOT_FOUND);
      }
      return cotacao;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao buscar cotação',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_UPDATE)
  @ApiOperation({ summary: 'Atualizar cotação' })
  @ApiResponse({
    status: 200,
    description: 'Cotação atualizada com sucesso',
    type: CotacaoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Cotação não encontrada' })
  async atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() atualizarCotacaoDto: AtualizarCotacaoDto,
    @Req() req: any,
  ): Promise<CotacaoResponseDto> {
    try {
      const cotacao = await this.cotacaoService.atualizar(
        id,
        atualizarCotacaoDto,
        req.user.id,
        req.user.empresa_id,
      );
      return cotacao;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao atualizar cotação',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_DELETE)
  @ApiOperation({ summary: 'Deletar cotação' })
  @ApiResponse({ status: 200, description: 'Cotação deletada com sucesso' })
  @ApiResponse({ status: 404, description: 'Cotação não encontrada' })
  async deletar(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    try {
      await this.cotacaoService.deletar(id, req.user.id, req.user.empresa_id);
      return {
        success: true,
        message: 'Cotação deletada com sucesso',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao deletar cotação',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/enviar-para-aprovacao')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_SEND)
  @ApiOperation({ summary: 'Enviar cotação em rascunho para aprovação' })
  @ApiResponse({ status: 200, description: 'Cotação enviada para aprovação com sucesso' })
  @ApiResponse({ status: 404, description: 'Cotação não encontrada' })
  @ApiResponse({
    status: 400,
    description: 'Cotação não está em rascunho ou faltam dados obrigatórios',
  })
  @ApiResponse({ status: 403, description: 'Apenas o criador pode enviar para aprovação' })
  async enviarParaAprovacao(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    try {
      this.logger.log(`\n🎯 [CONTROLLER] Recebendo request para enviar cotação para aprovação`);
      this.logger.log(`   ID: ${id}`);
      this.logger.log(`   User: ${req.user?.id}`);

      const cotacao = await this.cotacaoService.enviarParaAprovacao(id, req.user.id, req.user.empresa_id);

      this.logger.log(`✅ [CONTROLLER] Sucesso ao enviar para aprovação`);

      return {
        success: true,
        message: 'Cotação enviada para aprovação com sucesso',
        data: cotacao,
      };
    } catch (error) {
      this.logger.error(`\n❌ [CONTROLLER] Erro ao enviar cotação para aprovação:`);
      this.logger.error(`   Message: ${error.message}`);
      this.logger.error(`   Status: ${error.status}`);
      this.logger.error(`   Name: ${error.name}`);
      this.logger.error(`   Stack: ${error.stack}`);

      throw new HttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'Erro ao enviar cotação para aprovação',
          error: error.name || 'InternalServerError',
          details: error.stack?.split('\n').slice(0, 3).join('\n'), // Primeiras 3 linhas do stack
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/aprovar')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_UPDATE)
  @ApiOperation({ summary: 'Aprovar cotação' })
  @ApiResponse({ status: 200, description: 'Cotação aprovada com sucesso' })
  @ApiResponse({ status: 404, description: 'Cotação não encontrada' })
  @ApiResponse({ status: 403, description: 'Usuário não é o aprovador desta cotação' })
  async aprovar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { justificativa?: string },
    @Req() req: any,
  ) {
    try {
      this.logger.log(`🔍 DEBUG Controller aprovar() - Request:`, {
        cotacaoId: id,
        userId: req.user?.id,
        userNome: req.user?.nome,
        justificativa: body.justificativa,
      });

      const cotacao = await this.cotacaoService.aprovar(
        id,
        req.user.id,
        req.user.empresa_id,
        body.justificativa,
      );
      return {
        success: true,
        message: 'Cotação aprovada com sucesso',
        data: cotacao,
      };
    } catch (error) {
      this.logger.error(`❌ Erro no controller aprovar():`, {
        message: error.message,
        status: error.status,
        stack: error.stack,
      });
      throw new HttpException(
        error.message || 'Erro ao aprovar cotação',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/reprovar')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_UPDATE)
  @ApiOperation({ summary: 'Reprovar cotação' })
  @ApiResponse({ status: 200, description: 'Cotação reprovada com sucesso' })
  @ApiResponse({ status: 404, description: 'Cotação não encontrada' })
  @ApiResponse({ status: 403, description: 'Usuário não é o aprovador desta cotação' })
  @ApiResponse({ status: 400, description: 'Justificativa é obrigatória para reprovação' })
  async reprovar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { justificativa: string },
    @Req() req: any,
  ) {
    try {
      if (!body.justificativa || body.justificativa.trim() === '') {
        throw new HttpException(
          'Justificativa é obrigatória para reprovar uma cotação',
          HttpStatus.BAD_REQUEST,
        );
      }

      const cotacao = await this.cotacaoService.reprovar(
        id,
        req.user.id,
        req.user.empresa_id,
        body.justificativa,
      );
      return {
        success: true,
        message: 'Cotação reprovada',
        data: cotacao,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao reprovar cotação',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('aprovar-lote')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_UPDATE)
  @ApiOperation({ summary: 'Aprovar múltiplas cotações de uma vez' })
  @ApiResponse({
    status: 200,
    description: 'Resultado da aprovação em lote',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        sucessos: { type: 'number' },
        falhas: { type: 'number' },
        cotacoesProcessadas: { type: 'array', items: { type: 'string' } },
        erros: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  async aprovarLote(
    @Body() body: { cotacaoIds: string[]; justificativa?: string },
    @Req() req: any,
  ) {
    try {
      const resultado = await this.cotacaoService.aprovarLote(
        body.cotacaoIds,
        req.user.id,
        req.user.empresa_id,
        body.justificativa,
      );
      return {
        success: true,
        message: `${resultado.sucessos} cotação(ões) aprovada(s) com sucesso`,
        data: resultado,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao aprovar cotações em lote',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('reprovar-lote')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_UPDATE)
  @ApiOperation({ summary: 'Reprovar múltiplas cotações de uma vez' })
  @ApiResponse({
    status: 200,
    description: 'Resultado da reprovação em lote',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        sucessos: { type: 'number' },
        falhas: { type: 'number' },
        cotacoesProcessadas: { type: 'array', items: { type: 'string' } },
        erros: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Justificativa é obrigatória para reprovação' })
  async reprovarLote(
    @Body() body: { cotacaoIds: string[]; justificativa: string },
    @Req() req: any,
  ) {
    try {
      if (!body.justificativa || body.justificativa.trim() === '') {
        throw new HttpException(
          'Justificativa é obrigatória para reprovar cotações',
          HttpStatus.BAD_REQUEST,
        );
      }

      const resultado = await this.cotacaoService.reprovarLote(
        body.cotacaoIds,
        req.user.id,
        req.user.empresa_id,
        body.justificativa,
      );
      return {
        success: true,
        message: `${resultado.sucessos} cotação(ões) reprovada(s)`,
        data: resultado,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao reprovar cotações em lote',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Put(':id/status')
  @Patch(':id/status')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_UPDATE)
  @ApiOperation({ summary: 'Alterar status da cotação' })
  @ApiResponse({
    status: 200,
    description: 'Status alterado com sucesso',
    type: CotacaoResponseDto,
  })
  async alterarStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() alterarStatusDto: AlterarStatusDto,
    @Req() req: any,
  ): Promise<CotacaoResponseDto> {
    try {
      const cotacao = await this.cotacaoService.alterarStatus(
        id,
        alterarStatusDto.status,
        alterarStatusDto.observacao,
        req.user.id,
        req.user.empresa_id,
      );
      return cotacao;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao alterar status',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/duplicar')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_CREATE)
  @ApiOperation({ summary: 'Duplicar cotação' })
  @ApiResponse({
    status: 201,
    description: 'Cotação duplicada com sucesso',
    type: CotacaoResponseDto,
  })
  async duplicar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() duplicarDto: DuplicarCotacaoDto,
    @Req() req: any,
  ): Promise<CotacaoResponseDto> {
    try {
      const cotacao = await this.cotacaoService.duplicar(id, duplicarDto, req.user.id, req.user.empresa_id);
      return cotacao;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao duplicar cotação',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Gerar PDF da cotação' })
  @ApiResponse({
    status: 200,
    description: 'PDF gerado com sucesso',
    content: { 'application/pdf': {} },
  })
  async gerarPDF(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response, @Req() req: any) {
    try {
      const pdfBuffer = await this.cotacaoService.gerarPDF(id, req.user.id, req.user.empresa_id);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cotacao-${id}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      res.send(pdfBuffer);
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao gerar PDF',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/enviar-email')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_SEND)
  @ApiOperation({ summary: 'Enviar cotação por email' })
  @ApiResponse({ status: 200, description: 'Email enviado com sucesso' })
  async enviarEmail(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() enviarEmailDto: EnviarEmailDto,
    @Req() req: any,
  ) {
    try {
      await this.cotacaoService.enviarEmail(id, enviarEmailDto, req.user.id, req.user.empresa_id);
      return {
        success: true,
        message: 'Email enviado com sucesso',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao enviar email',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/historico')
  @ApiOperation({ summary: 'Obter histórico da cotação' })
  @ApiResponse({ status: 200, description: 'Histórico da cotação' })
  async obterHistorico(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    try {
      const historico = await this.cotacaoService.obterHistorico(id, req.user.id, req.user.empresa_id);
      return historico;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao obter histórico',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/converter-pedido')
  @UseGuards(PermissionsGuard)
  @Permissions(Permission.COMERCIAL_PROPOSTAS_UPDATE)
  @ApiOperation({ summary: 'Converter cotação em pedido' })
  @ApiResponse({ status: 201, description: 'Pedido criado com sucesso' })
  async converterEmPedido(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ConverterPedidoDto,
    @Req() req: any,
  ) {
    try {
      const pedido = await this.cotacaoService.converterEmPedido(
        id,
        body.observacoes,
        req.user.id,
        req.user.empresa_id,
      );
      return pedido;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao converter em pedido',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/gerar-conta-pagar')
  @UseGuards(PermissionsGuard)
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  @ApiOperation({ summary: 'Gerar conta a pagar a partir de cotacao com pedido gerado' })
  @ApiResponse({ status: 201, description: 'Conta a pagar criada com sucesso' })
  async gerarContaPagar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: GerarContaPagarDto,
    @Req() req: any,
  ) {
    try {
      return await this.cotacaoService.gerarContaPagar(id, body, req.user.id, req.user.empresa_id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao gerar conta a pagar',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/marcar-adquirido')
  @UseGuards(PermissionsGuard)
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  @ApiOperation({ summary: 'Marcar cotação convertida como adquirida (compra concluída)' })
  @ApiResponse({ status: 200, description: 'Compra registrada como concluída', type: CotacaoResponseDto })
  async marcarAdquirido(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: MarcarAdquiridoDto,
    @Req() req: any,
  ): Promise<CotacaoResponseDto> {
    try {
      return await this.cotacaoService.marcarAdquirido(id, body, req.user.id, req.user.empresa_id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao marcar cotação como adquirida',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('proximo-numero')
  @ApiOperation({ summary: 'Buscar próximo número de cotação' })
  @ApiResponse({ status: 200, description: 'Próximo número de cotação' })
  async buscarProximoNumero(@Req() req: any) {
    try {
      const proximoNumero = await this.cotacaoService.buscarProximoNumero(req.user.id, req.user.empresa_id);
      return { proximoNumero };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao buscar próximo número',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('templates')
  @ApiOperation({ summary: 'Buscar templates de cotação' })
  @ApiResponse({ status: 200, description: 'Lista de templates' })
  async buscarTemplates(@Req() req: any) {
    try {
      const templates = await this.cotacaoService.buscarTemplates(req.user.id, req.user.empresa_id);
      return templates;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao buscar templates',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('templates')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_CREATE)
  @ApiOperation({ summary: 'Salvar template de cotação' })
  @ApiResponse({ status: 201, description: 'Template salvo com sucesso' })
  async salvarTemplate(
    @Body() body: { nome: string; descricao?: string; dados: any },
    @Req() req: any,
  ) {
    try {
      const template = await this.cotacaoService.salvarTemplate(body, req.user.id, req.user.empresa_id);
      return template;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao salvar template',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('exportar')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_READ)
  @ApiOperation({ summary: 'Exportar cotações' })
  @ApiResponse({ status: 200, description: 'Arquivo exportado com sucesso' })
  async exportar(@Query() query: any, @Res() res: Response, @Req() req: any) {
    try {
      const formato = query.formato || 'csv';
      const { buffer, filename, mimeType } = await this.cotacaoService.exportar(
        formato,
        query,
        req.user.id,
        req.user.empresa_id,
      );

      res.set({
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
      });

      res.send(buffer);
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao exportar dados',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('importar')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_CREATE)
  @ApiOperation({ summary: 'Importar cotações' })
  @ApiResponse({ status: 201, description: 'Cotações importadas com sucesso' })
  async importar(@Body() body: { dados: any[]; validarApenas?: boolean }, @Req() req: any) {
    try {
      const resultado = await this.cotacaoService.importar(
        body.dados,
        body.validarApenas || false,
        req.user.id,
        req.user.empresa_id,
      );
      return resultado;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao importar cotações',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/anexos')
  @ApiOperation({ summary: 'Listar anexos da cotação' })
  @ApiResponse({ status: 200, description: 'Lista de anexos' })
  async listarAnexos(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    try {
      const anexos = await this.cotacaoService.listarAnexos(id, req.user.id, req.user.empresa_id);
      return anexos;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao listar anexos',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/anexos')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_UPDATE)
  @ApiOperation({ summary: 'Adicionar anexo à cotação' })
  @ApiResponse({ status: 201, description: 'Anexo adicionado com sucesso' })
  async adicionarAnexo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { nome: string; tipo: string; url: string; tamanho: number },
    @Req() req: any,
  ) {
    try {
      const anexo = await this.cotacaoService.adicionarAnexo(id, body, req.user.id, req.user.empresa_id);
      return anexo;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao adicionar anexo',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id/anexos/:anexoId')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_UPDATE)
  @ApiOperation({ summary: 'Remover anexo da cotação' })
  @ApiResponse({ status: 200, description: 'Anexo removido com sucesso' })
  async removerAnexo(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('anexoId', ParseUUIDPipe) anexoId: string,
    @Req() req: any,
  ) {
    try {
      await this.cotacaoService.removerAnexo(id, anexoId, req.user.id, req.user.empresa_id);
      return {
        success: true,
        message: 'Anexo removido com sucesso',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao remover anexo',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}


