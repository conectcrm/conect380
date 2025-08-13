import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  HttpException
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CotacaoService } from './cotacao.service';
import {
  CriarCotacaoDto,
  AtualizarCotacaoDto,
  CotacaoQueryDto,
  AlterarStatusDto,
  DuplicarCotacaoDto,
  EnviarEmailDto,
  CotacaoResponseDto
} from './dto/cotacao.dto';
import { StatusCotacao } from './entities/cotacao.entity';

@ApiTags('Cotações')
@ApiBearerAuth()
@Controller('cotacao')
export class CotacaoController {
  constructor(private readonly cotacaoService: CotacaoService) { }

  @Post()
  @ApiOperation({ summary: 'Criar nova cotação' })
  @ApiResponse({
    status: 201,
    description: 'Cotação criada com sucesso',
    type: CotacaoResponseDto
  })


  async criar(
    @Body() criarCotacaoDto: CriarCotacaoDto,
    @Req() req: any
  ): Promise<CotacaoResponseDto> {
    try {
      const cotacao = await this.cotacaoService.criar(criarCotacaoDto, req.user.id);
      return cotacao;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao criar cotação',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar cotações com filtros e paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cotações',
    type: [CotacaoResponseDto]
  })

  async listar(
    @Query() query: CotacaoQueryDto,
    @Req() req: any
  ) {
    try {
      const result = await this.cotacaoService.listar(query, req.user.id);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao listar cotações',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('estatisticas')
  @ApiOperation({ summary: 'Obter estatísticas das cotações' })
  @ApiResponse({ status: 200, description: 'Estatísticas das cotações' })

  async obterEstatisticas(@Req() req: any) {
    try {
      const estatisticas = await this.cotacaoService.obterEstatisticas(req.user.id);
      return estatisticas;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao obter estatísticas',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Obter dados do dashboard de cotações' })
  @ApiResponse({ status: 200, description: 'Dados do dashboard' })

  async obterDashboard(@Req() req: any) {
    try {
      const dashboard = await this.cotacaoService.obterDashboard(req.user.id);
      return dashboard;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao obter dados do dashboard',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cotação por ID' })
  @ApiResponse({
    status: 200,
    description: 'Cotação encontrada',
    type: CotacaoResponseDto
  })
  @ApiResponse({ status: 404, description: 'Cotação não encontrada' })

  async buscarPorId(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any
  ): Promise<CotacaoResponseDto> {
    try {
      const cotacao = await this.cotacaoService.buscarPorId(id, req.user.id);
      if (!cotacao) {
        throw new HttpException('Cotação não encontrada', HttpStatus.NOT_FOUND);
      }
      return cotacao;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao buscar cotação',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar cotação' })
  @ApiResponse({
    status: 200,
    description: 'Cotação atualizada com sucesso',
    type: CotacaoResponseDto
  })
  @ApiResponse({ status: 404, description: 'Cotação não encontrada' })


  async atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() atualizarCotacaoDto: AtualizarCotacaoDto,
    @Req() req: any
  ): Promise<CotacaoResponseDto> {
    try {
      const cotacao = await this.cotacaoService.atualizar(id, atualizarCotacaoDto, req.user.id);
      return cotacao;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao atualizar cotação',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar cotação' })
  @ApiResponse({ status: 200, description: 'Cotação deletada com sucesso' })
  @ApiResponse({ status: 404, description: 'Cotação não encontrada' })


  async deletar(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any
  ) {
    try {
      await this.cotacaoService.deletar(id, req.user.id);
      return {
        success: true,
        message: 'Cotação deletada com sucesso'
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao deletar cotação',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Alterar status da cotação' })
  @ApiResponse({
    status: 200,
    description: 'Status alterado com sucesso',
    type: CotacaoResponseDto
  })


  async alterarStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() alterarStatusDto: AlterarStatusDto,
    @Req() req: any
  ): Promise<CotacaoResponseDto> {
    try {
      const cotacao = await this.cotacaoService.alterarStatus(
        id,
        alterarStatusDto.status,
        alterarStatusDto.observacao,
        req.user.id
      );
      return cotacao;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao alterar status',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/duplicar')
  @ApiOperation({ summary: 'Duplicar cotação' })
  @ApiResponse({
    status: 201,
    description: 'Cotação duplicada com sucesso',
    type: CotacaoResponseDto
  })


  async duplicar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() duplicarDto: DuplicarCotacaoDto,
    @Req() req: any
  ): Promise<CotacaoResponseDto> {
    try {
      const cotacao = await this.cotacaoService.duplicar(id, duplicarDto, req.user.id);
      return cotacao;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao duplicar cotação',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/aprovar')
  @ApiOperation({ summary: 'Aprovar cotação' })
  @ApiResponse({
    status: 200,
    description: 'Cotação aprovada com sucesso',
    type: CotacaoResponseDto
  })


  async aprovar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { observacao?: string },
    @Req() req: any
  ): Promise<CotacaoResponseDto> {
    try {
      const cotacao = await this.cotacaoService.aprovar(id, body.observacao, req.user.id);
      return cotacao;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao aprovar cotação',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/rejeitar')
  @ApiOperation({ summary: 'Rejeitar cotação' })
  @ApiResponse({
    status: 200,
    description: 'Cotação rejeitada com sucesso',
    type: CotacaoResponseDto
  })


  async rejeitar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { motivo: string },
    @Req() req: any
  ): Promise<CotacaoResponseDto> {
    try {
      const cotacao = await this.cotacaoService.rejeitar(id, body.motivo, req.user.id);
      return cotacao;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao rejeitar cotação',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Gerar PDF da cotação' })
  @ApiResponse({
    status: 200,
    description: 'PDF gerado com sucesso',
    content: { 'application/pdf': {} }
  })


  async gerarPDF(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @Req() req: any
  ) {
    try {
      const pdfBuffer = await this.cotacaoService.gerarPDF(id, req.user.id);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cotacao-${id}.pdf"`,
        'Content-Length': pdfBuffer.length
      });

      res.send(pdfBuffer);
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao gerar PDF',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/enviar-email')
  @ApiOperation({ summary: 'Enviar cotação por email' })
  @ApiResponse({ status: 200, description: 'Email enviado com sucesso' })


  async enviarEmail(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() enviarEmailDto: EnviarEmailDto,
    @Req() req: any
  ) {
    try {
      await this.cotacaoService.enviarEmail(id, enviarEmailDto, req.user.id);
      return {
        success: true,
        message: 'Email enviado com sucesso'
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao enviar email',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/historico')
  @ApiOperation({ summary: 'Obter histórico da cotação' })
  @ApiResponse({ status: 200, description: 'Histórico da cotação' })

  async obterHistorico(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any
  ) {
    try {
      const historico = await this.cotacaoService.obterHistorico(id, req.user.id);
      return historico;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao obter histórico',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/converter-pedido')
  @ApiOperation({ summary: 'Converter cotação em pedido' })
  @ApiResponse({ status: 201, description: 'Pedido criado com sucesso' })


  async converterEmPedido(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { observacoes?: string },
    @Req() req: any
  ) {
    try {
      const pedido = await this.cotacaoService.converterEmPedido(id, body.observacoes, req.user.id);
      return pedido;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao converter em pedido',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('proximo-numero')
  @ApiOperation({ summary: 'Buscar próximo número de cotação' })
  @ApiResponse({ status: 200, description: 'Próximo número de cotação' })
  async buscarProximoNumero(@Req() req: any) {
    try {
      const proximoNumero = await this.cotacaoService.buscarProximoNumero(req.user.id);
      return { proximoNumero };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao buscar próximo número',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('templates')
  @ApiOperation({ summary: 'Buscar templates de cotação' })
  @ApiResponse({ status: 200, description: 'Lista de templates' })
  async buscarTemplates(@Req() req: any) {
    try {
      const templates = await this.cotacaoService.buscarTemplates(req.user.id);
      return templates;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao buscar templates',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('templates')
  @ApiOperation({ summary: 'Salvar template de cotação' })
  @ApiResponse({ status: 201, description: 'Template salvo com sucesso' })
  async salvarTemplate(
    @Body() body: { nome: string; descricao?: string; dados: any },
    @Req() req: any
  ) {
    try {
      const template = await this.cotacaoService.salvarTemplate(body, req.user.id);
      return template;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao salvar template',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('exportar')
  @ApiOperation({ summary: 'Exportar cotações' })
  @ApiResponse({ status: 200, description: 'Arquivo exportado com sucesso' })
  async exportar(
    @Query() query: any,
    @Res() res: Response,
    @Req() req: any
  ) {
    try {
      const formato = query.formato || 'csv';
      const { buffer, filename, mimeType } = await this.cotacaoService.exportar(
        formato,
        query,
        req.user.id
      );

      res.set({
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString()
      });

      res.send(buffer);
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao exportar dados',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('importar')
  @ApiOperation({ summary: 'Importar cotações' })
  @ApiResponse({ status: 201, description: 'Cotações importadas com sucesso' })


  async importar(
    @Body() body: { dados: any[]; validarApenas?: boolean },
    @Req() req: any
  ) {
    try {
      const resultado = await this.cotacaoService.importar(
        body.dados,
        body.validarApenas || false,
        req.user.id
      );
      return resultado;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao importar cotações',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/anexos')
  @ApiOperation({ summary: 'Listar anexos da cotação' })
  @ApiResponse({ status: 200, description: 'Lista de anexos' })

  async listarAnexos(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any
  ) {
    try {
      const anexos = await this.cotacaoService.listarAnexos(id, req.user.id);
      return anexos;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao listar anexos',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/anexos')
  @ApiOperation({ summary: 'Adicionar anexo à cotação' })
  @ApiResponse({ status: 201, description: 'Anexo adicionado com sucesso' })


  async adicionarAnexo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { nome: string; tipo: string; url: string; tamanho: number },
    @Req() req: any
  ) {
    try {
      const anexo = await this.cotacaoService.adicionarAnexo(id, body, req.user.id);
      return anexo;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao adicionar anexo',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id/anexos/:anexoId')
  @ApiOperation({ summary: 'Remover anexo da cotação' })
  @ApiResponse({ status: 200, description: 'Anexo removido com sucesso' })


  async removerAnexo(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('anexoId', ParseUUIDPipe) anexoId: string,
    @Req() req: any
  ) {
    try {
      await this.cotacaoService.removerAnexo(id, anexoId, req.user.id);
      return {
        success: true,
        message: 'Anexo removido com sucesso'
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao remover anexo',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
