import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  Res,
  Put,
} from '@nestjs/common';
import { Response } from 'express';
import { PortalService } from './portal.service';
import { PdfService } from './pdf.service';

@Controller('api/portal')
export class PortalController {
  private readonly logger = new Logger(PortalController.name);

  constructor(
    private readonly portalService: PortalService,
    private readonly pdfService: PdfService,
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

  private maskToken(token?: string): string {
    if (!token) return '[token]';
    return token.length <= 8 ? `${token.slice(0, 2)}***` : `${token.slice(0, 4)}...${token.slice(-4)}`;
  }

  private resolvePortalErrorStatus(error: unknown): HttpStatus {
    const message = this.resolveErrorMessage(error, '').toLowerCase();
    if (
      message.includes('transicao de status invalida') ||
      message.includes('exige aprovacao interna')
    ) {
      return HttpStatus.BAD_REQUEST;
    }

    if (
      message.includes('token invalido') ||
      message.includes('token expirado') ||
      message.includes('expirado') ||
      message.includes('proposta nao encontrada')
    ) {
      return HttpStatus.NOT_FOUND;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private toFiniteNumber(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private toIsoDate(value: unknown, fallback: Date): string {
    if (!value) {
      return fallback.toISOString().slice(0, 10);
    }

    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) {
      return fallback.toISOString().slice(0, 10);
    }

    return parsed.toISOString().slice(0, 10);
  }

  private possuiItensComerciais(dadosProposta: any): boolean {
    if (!Array.isArray(dadosProposta?.itens) || dadosProposta.itens.length === 0) {
      return false;
    }

    return dadosProposta.itens.some((item: any) => {
      if (!item || typeof item !== 'object') {
        return false;
      }

      const nome = String(item.nome || item.titulo || item.descricao || '').trim();
      const quantidade = Number(item.quantidade ?? 1);
      return Boolean(nome && Number.isFinite(quantidade) && quantidade > 0);
    });
  }

  private construirPayloadPdfPublico(proposta: any): Record<string, unknown> {
    const agora = new Date();
    const empresaRaw = proposta?.empresa && typeof proposta.empresa === 'object' ? proposta.empresa : {};
    const clienteRaw = proposta?.cliente && typeof proposta.cliente === 'object' ? proposta.cliente : {};
    const vendedorRaw = proposta?.vendedor && typeof proposta.vendedor === 'object' ? proposta.vendedor : {};
    const observacoes =
      typeof proposta?.observacoes === 'string'
        ? proposta.observacoes
        : typeof proposta?.condicoes?.observacoes === 'string'
          ? proposta.condicoes.observacoes
          : '';

    const itens = (Array.isArray(proposta?.produtos) ? proposta.produtos : [])
      .map((produto: any, index: number) => {
        const quantidade = Math.max(0.01, this.toFiniteNumber(produto?.quantidade, 1));
        const valorUnitario = Math.max(
          0,
          this.toFiniteNumber(
            produto?.valorUnitario ?? produto?.precoUnitario ?? produto?.preco,
            0,
          ),
        );
        const desconto = Math.max(0, this.toFiniteNumber(produto?.desconto, 0));
        const subtotalInformado = this.toFiniteNumber(
          produto?.subtotal ?? produto?.valorTotal,
          Number.NaN,
        );
        const valorTotal = Number.isFinite(subtotalInformado)
          ? Math.max(0, subtotalInformado)
          : Math.max(0, valorUnitario * quantidade * (1 - desconto / 100));

        return {
          nome: String(produto?.nome || produto?.descricao || `Item ${index + 1}`),
          descricao: String(produto?.descricao || ''),
          quantidade,
          unidade: String(produto?.unidade || 'un'),
          valorUnitario,
          desconto,
          valorTotal,
        };
      })
      .filter((item) => item.nome);

    const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
    const subtotalItens = roundMoney(
      itens.reduce((sum, item) => sum + this.toFiniteNumber(item.valorTotal, 0), 0),
    );
    const subtotalBrutoItens = roundMoney(
      itens.reduce(
        (sum, item) =>
          sum +
          this.toFiniteNumber(item.valorUnitario, 0) * this.toFiniteNumber(item.quantidade, 0),
        0,
      ),
    );
    const subtotal = roundMoney(this.toFiniteNumber(proposta?.subtotal, subtotalItens));
    const descontoItens = roundMoney(Math.max(0, subtotalBrutoItens - subtotalItens));
    const percentualDesconto = Math.max(0, this.toFiniteNumber(proposta?.descontoGlobal, 0));
    const descontoGeral = roundMoney(subtotal * (percentualDesconto / 100));
    const baseCalculoImpostos = roundMoney(Math.max(0, subtotal - descontoGeral));
    const percentualImpostos = Math.max(0, this.toFiniteNumber(proposta?.impostos, 0));
    const impostos = roundMoney(baseCalculoImpostos * (percentualImpostos / 100));
    const totalCalculado = roundMoney(baseCalculoImpostos + impostos);
    const valorTotal = roundMoney(
      this.toFiniteNumber(proposta?.total ?? proposta?.valor ?? proposta?.valorTotal, totalCalculado),
    );

    const clienteDocumento = String(clienteRaw?.documento || '').trim();
    const documentoNumerico = clienteDocumento.replace(/\D/g, '');
    const tipoDocumento =
      documentoNumerico.length === 11
        ? 'CPF'
        : documentoNumerico.length === 14
          ? 'CNPJ'
          : undefined;

    return {
      numeroProposta: String(proposta?.numero || proposta?.id || `PROP-${Date.now()}`),
      titulo: String(proposta?.titulo || 'Proposta Comercial'),
      status: String(proposta?.status || 'enviada'),
      dataEmissao: this.toIsoDate(
        proposta?.emailDetails?.sentAt || proposta?.criadaEm || proposta?.createdAt,
        agora,
      ),
      dataValidade: this.toIsoDate(
        proposta?.dataVencimento || proposta?.dataValidade,
        new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000),
      ),
      empresa: {
        nome: String(empresaRaw?.nome || 'Conect CRM'),
        endereco: String(empresaRaw?.endereco || ''),
        telefone: String(empresaRaw?.telefone || ''),
        email: String(empresaRaw?.email || ''),
        logo: typeof empresaRaw?.logo === 'string' ? empresaRaw.logo : undefined,
      },
      cliente: {
        nome: String(clienteRaw?.nome || 'Cliente'),
        email: String(clienteRaw?.email || ''),
        telefone: String(clienteRaw?.telefone || ''),
        documento: clienteDocumento || undefined,
        tipoDocumento,
        endereco: String(clienteRaw?.endereco || ''),
      },
      vendedor: {
        nome: String(vendedorRaw?.nome || 'Equipe Comercial'),
        email: String(vendedorRaw?.email || ''),
        telefone: String(vendedorRaw?.telefone || ''),
      },
      itens,
      subtotal,
      descontoItens,
      descontoGeral,
      percentualDesconto,
      percentualImpostos,
      impostos,
      valorTotal,
      formaPagamento: String(proposta?.formaPagamento || proposta?.condicoes?.formaPagamento || 'A combinar'),
      prazoEntrega: String(proposta?.prazoEntrega || proposta?.condicoes?.prazoEntrega || 'A combinar'),
      garantia: String(proposta?.garantia || proposta?.condicoes?.garantia || ''),
      validadeProposta: String(proposta?.dataVencimento || proposta?.dataValidade || ''),
      condicoesGerais: observacoes ? [observacoes] : [],
      observacoes,
    };
  }

  @Get('proposta/:token/pdf')
  async baixarPdfPorToken(
    @Param('token') token: string,
    @Query('tipo') tipo = 'comercial',
    @Res() res: Response,
  ) {
    try {
      const tipoTemplate = String(tipo || 'comercial')
        .trim()
        .toLowerCase();
      const tiposPermitidos = ['comercial', 'simples'];

      if (!tiposPermitidos.includes(tipoTemplate)) {
        throw new BadRequestException('Tipo de template nao suportado');
      }

      const proposta = await this.portalService.obterPropostaPorToken(token);
      if (!proposta) {
        throw new HttpException(
          {
            success: false,
            message: 'Token invalido ou proposta nao encontrada',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const dadosPdf = this.construirPayloadPdfPublico(proposta);
      if (!this.possuiItensComerciais(dadosPdf)) {
        throw new BadRequestException(
          'A proposta precisa ter ao menos um item/produto antes de gerar o PDF final.',
        );
      }

      const pdfBuffer = await this.pdfService.gerarProposta(tipoTemplate, dadosPdf);
      await this.portalService.registrarAcaoPortal(token, 'download_pdf', {
        timestamp: new Date().toISOString(),
        template: tipoTemplate,
      });

      const numeroProposta = String(dadosPdf.numeroProposta || 'draft').replace(
        /[^a-zA-Z0-9-_]/g,
        '_',
      );

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proposta-${numeroProposta}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      res.end(pdfBuffer);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const statusCode = this.resolvePortalErrorStatus(error);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao gerar PDF da proposta',
          error: this.resolveErrorMessage(error, 'Falha ao gerar PDF da proposta'),
        },
        statusCode,
      );
    }
  }

  @Put('proposta/:token/status')
  async atualizarStatusPorToken(
    @Param('token') token: string,
    @Body()
    updateData: {
      status: string;
      timestamp?: string;
      ip?: string;
      userAgent?: string;
      motivoAjustes?: string;
    },
  ) {
    try {
      this.logger.log(
        `Portal: Atualizando status via token ${this.maskToken(token)} para: ${updateData.status}`,
      );

      const resultado = await this.portalService.atualizarStatusPorToken(token, updateData.status, {
        timestamp: updateData.timestamp,
        ip: updateData.ip,
        userAgent: updateData.userAgent,
        motivoAjustes: updateData.motivoAjustes,
      });

      return {
        success: true,
        message: 'Status atualizado via portal',
        proposta: resultado,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Portal: Erro ao atualizar status', error);
      const statusCode = this.resolvePortalErrorStatus(error);

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao atualizar status via portal',
          error: this.resolveErrorMessage(error, 'Falha ao atualizar status via portal'),
        },
        statusCode,
      );
    }
  }

  @Get('proposta/:token')
  async obterPropostaPorToken(@Param('token') token: string) {
    try {
      const proposta = await this.portalService.obterPropostaPorToken(token);

      if (!proposta) {
        throw new HttpException(
          {
            success: false,
            message: 'Token invalido ou proposta nao encontrada',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        proposta,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const statusCode = this.resolvePortalErrorStatus(error);

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar proposta via portal',
          error: this.resolveErrorMessage(error, 'Falha ao buscar proposta via portal'),
        },
        statusCode,
      );
    }
  }

  @Put('proposta/:token/view')
  async registrarVisualizacao(
    @Param('token') token: string,
    @Body()
    viewData: {
      ip?: string;
      userAgent?: string;
      timestamp?: string;
    },
  ) {
    try {
      await this.portalService.registrarVisualizacao(token, viewData);

      return {
        success: true,
        message: 'Visualizacao registrada',
      };
    } catch (error) {
      this.logger.error('Portal: Erro ao registrar visualizacao', error);
      return {
        success: false,
        message: 'Erro ao registrar visualizacao',
        error: this.resolveErrorMessage(error, 'Falha ao registrar visualizacao'),
      };
    }
  }

  @Post('proposta/:token/acao')
  async registrarAcao(
    @Param('token') token: string,
    @Body()
    acaoData: {
      acao: string;
      timestamp?: string;
      ip?: string;
      userAgent?: string;
      dados?: any;
    },
  ) {
    try {
      this.logger.log(
        `Portal: Registrando acao "${acaoData.acao}" para token ${this.maskToken(token)}`,
      );

      const resultado = await this.portalService.registrarAcaoCliente(token, acaoData.acao, {
        timestamp: acaoData.timestamp,
        ip: acaoData.ip,
        userAgent: acaoData.userAgent,
        dados: acaoData.dados,
      });

      return {
        success: resultado.sucesso,
        message: resultado.mensagem,
        status: resultado.status,
        acao: acaoData.acao,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Portal: Erro ao registrar acao', error);
      const statusCode = this.resolvePortalErrorStatus(error);
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao registrar acao',
          error: this.resolveErrorMessage(error, 'Falha ao registrar acao'),
        },
        statusCode,
      );
    }
  }
}
