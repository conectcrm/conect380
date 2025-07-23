import { Controller, Get, Post, Body, Param, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { PdfService } from './pdf.service';

@Controller('propostas/pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('gerar/:tipo')
  async gerarPdf(
    @Param('tipo') tipo: string,
    @Body() dadosProposta: any,
    @Res() res: Response,
  ) {
    try {
      const tiposPermitidos = ['comercial', 'simples'];
      
      if (!tiposPermitidos.includes(tipo)) {
        throw new BadRequestException('Tipo de template não suportado');
      }

      const pdfBuffer = await this.pdfService.gerarProposta(tipo, dadosProposta);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proposta-${dadosProposta.numeroProposta || 'draft'}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      res.end(pdfBuffer);
    } catch (error) {
      throw new BadRequestException(`Erro ao gerar PDF: ${error.message}`);
    }
  }

  @Post('preview/:tipo')
  async previewHtml(
    @Param('tipo') tipo: string,
    @Body() dadosProposta: any,
    @Res() res: Response,
  ) {
    try {
      const tiposPermitidos = ['comercial', 'simples'];
      
      if (!tiposPermitidos.includes(tipo)) {
        throw new BadRequestException('Tipo de template não suportado');
      }

      const html = await this.pdfService.gerarHtml(tipo, dadosProposta);
      
      res.set({
        'Content-Type': 'text/html',
      });

      res.send(html);
    } catch (error) {
      throw new BadRequestException(`Erro ao gerar preview: ${error.message}`);
    }
  }

  @Get('templates')
  getTemplatesDisponiveis() {
    return {
      templates: [
        {
          id: 'comercial',
          nome: 'Proposta Comercial Completa',
          descricao: 'Template detalhado com todas as seções e informações',
          preview: '/propostas/pdf/preview/comercial'
        },
        {
          id: 'simples',
          nome: 'Proposta Simples',
          descricao: 'Template simplificado para propostas rápidas',
          preview: '/propostas/pdf/preview/simples'
        }
      ]
    };
  }
}
