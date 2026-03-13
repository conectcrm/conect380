import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { PdfService } from './pdf.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';

@Controller('propostas/pdf')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.COMERCIAL_PROPOSTAS_READ)
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

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

  private resolveErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof BadRequestException) {
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

  @Post('gerar/:tipo')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_SEND)
  async gerarPdf(@Param('tipo') tipo: string, @Body() dadosProposta: any, @Res() res: Response) {
    try {
      const tiposPermitidos = ['comercial', 'simples'];

      if (!tiposPermitidos.includes(tipo)) {
        throw new BadRequestException('Tipo de template nao suportado');
      }

      if (!this.possuiItensComerciais(dadosProposta)) {
        throw new BadRequestException(
          'A proposta precisa ter ao menos um item/produto antes de gerar o PDF final.',
        );
      }

      const pdfBuffer = await this.pdfService.gerarProposta(tipo, dadosProposta);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proposta-${dadosProposta.numeroProposta || 'draft'}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      res.end(pdfBuffer);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        `Falha ao gerar PDF: ${this.resolveErrorMessage(error, 'erro interno')}`,
      );
    }
  }

  @Post('preview/:tipo')
  @Permissions(Permission.COMERCIAL_PROPOSTAS_SEND)
  async previewHtml(@Param('tipo') tipo: string, @Body() dadosProposta: any, @Res() res: Response) {
    try {
      const tiposPermitidos = ['comercial', 'simples'];

      if (!tiposPermitidos.includes(tipo)) {
        throw new BadRequestException('Tipo de template nao suportado');
      }

      const html = await this.pdfService.gerarHtml(tipo, dadosProposta);

      res.set({
        'Content-Type': 'text/html',
      });

      res.send(html);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        `Falha ao gerar preview: ${this.resolveErrorMessage(error, 'erro interno')}`,
      );
    }
  }

  @Get('templates')
  getTemplatesDisponiveis() {
    return {
      templates: [
        {
          id: 'comercial',
          nome: 'Proposta Comercial Completa',
          descricao: 'Template detalhado com todas as secoes e informacoes',
          preview: '/propostas/pdf/preview/comercial',
        },
        {
          id: 'simples',
          nome: 'Proposta Simples',
          descricao: 'Template simplificado para propostas rapidas',
          preview: '/propostas/pdf/preview/simples',
        },
      ],
    };
  }
}
