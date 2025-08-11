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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { AuditLog } from '../decorators/audit-log.decorator';
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
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CotacaoController {
  constructor(private readonly cotacaoService: CotacaoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova cotação' })
  @ApiResponse({ 
    status: 201, 
    description: 'Cotação criada com sucesso',
    type: CotacaoResponseDto 
  })
  @Permissions('cotacao.create')
  @AuditLog({ action: 'CREATE', entity: 'COTACAO' })
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
  @Permissions('cotacao.read')
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
  @Permissions('cotacao.read')
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
  @Permissions('cotacao.read')
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
  @Permissions('cotacao.read')
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
  @Permissions('cotacao.update')
  @AuditLog({ action: 'UPDATE', entity: 'COTACAO' })
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
  @Permissions('cotacao.delete')
  @AuditLog({ action: 'DELETE', entity: 'COTACAO' })
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
  @Permissions('cotacao.update')
  @AuditLog({ action: 'UPDATE_STATUS', entity: 'COTACAO' })
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
  @Permissions('cotacao.create')
  @AuditLog({ action: 'DUPLICATE', entity: 'COTACAO' })
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
  @Permissions('cotacao.approve')
  @AuditLog({ action: 'APPROVE', entity: 'COTACAO' })
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
  @Permissions('cotacao.approve')
  @AuditLog({ action: 'REJECT', entity: 'COTACAO' })
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
  @Permissions('cotacao.read')
  @AuditLog({ action: 'GENERATE_PDF', entity: 'COTACAO' })
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
  @Permissions('cotacao.read')
  @AuditLog({ action: 'SEND_EMAIL', entity: 'COTACAO' })
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
  @Permissions('cotacao.read')
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
  @Permissions('cotacao.convert')
  @AuditLog({ action: 'CONVERT_TO_ORDER', entity: 'COTACAO' })
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

  @Get('exportar/:formato')
  @ApiOperation({ summary: 'Exportar cotações' })
  @ApiResponse({ status: 200, description: 'Arquivo exportado com sucesso' })
  @Permissions('cotacao.export')
  @AuditLog({ action: 'EXPORT', entity: 'COTACAO' })
  async exportar(
    @Param('formato') formato: 'csv' | 'excel' | 'pdf',
    @Query() query: CotacaoQueryDto,
    @Res() res: Response,
    @Req() req: any
  ) {
    try {
      const { buffer, filename, mimeType } = await this.cotacaoService.exportar(
        formato, 
        query, 
        req.user.id
      );
      
      res.set({
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length
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
  @Permissions('cotacao.import')
  @AuditLog({ action: 'IMPORT', entity: 'COTACAO' })
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
  @Permissions('cotacao.read')
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
  @Permissions('cotacao.update')
  @AuditLog({ action: 'ADD_ATTACHMENT', entity: 'COTACAO' })
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
  @Permissions('cotacao.update')
  @AuditLog({ action: 'REMOVE_ATTACHMENT', entity: 'COTACAO' })
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
