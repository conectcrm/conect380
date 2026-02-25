import { Injectable, Logger } from '@nestjs/common';
import { Contrato } from '../entities/contrato.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PdfContratoService {
  private readonly logger = new Logger(PdfContratoService.name);
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'contratos');

  constructor() {
    this.ensureUploadsDirectory();
  }

  async gerarPDFContrato(contrato: Contrato): Promise<string> {
    try {
      this.ensureUploadsDirectory();

      const nomeArquivo = `contrato-${contrato.numero || contrato.id}-${Date.now()}.pdf`;
      const caminhoCompleto = path.join(this.uploadsDir, nomeArquivo);
      const htmlContent = this.gerarHTMLContrato(contrato);
      const pdfBuffer = await this.htmlParaPdf(htmlContent);

      fs.writeFileSync(caminhoCompleto, pdfBuffer);

      this.logger.log(`Contrato PDF gerado para ${contrato.numero || contrato.id}: ${caminhoCompleto}`);
      return caminhoCompleto;
    } catch (error) {
      this.logger.error(`Erro ao gerar documento do contrato: ${error.message}`);
      throw error;
    }
  }

  async calcularHashDocumento(caminhoArquivo: string): Promise<string> {
    try {
      const fileBuffer = fs.readFileSync(caminhoArquivo);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      this.logger.log(`Hash calculado para ${caminhoArquivo}: ${hash}`);
      return hash;
    } catch (error) {
      this.logger.error(`Erro ao calcular hash do documento: ${error.message}`);
      throw error;
    }
  }

  async obterArquivoPDF(caminhoArquivo: string): Promise<Buffer> {
    try {
      if (!fs.existsSync(caminhoArquivo)) {
        throw new Error('Arquivo nao encontrado');
      }

      return fs.readFileSync(caminhoArquivo);
    } catch (error) {
      this.logger.error(`Erro ao ler arquivo: ${error.message}`);
      throw error;
    }
  }

  private async htmlParaPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private gerarHTMLContrato(contrato: Contrato): string {
    const empresaNome = process.env.EMPRESA_NOME || 'ConectCRM';
    const empresaCNPJ = process.env.EMPRESA_CNPJ || '00.000.000/0001-00';
    const empresaEndereco = process.env.EMPRESA_ENDERECO || 'Endereco da Empresa';
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const valorTotal = Number(contrato.valorTotal || 0);
    const valorTotalFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number.isFinite(valorTotal) ? valorTotal : 0);

    const dataInicio = contrato.dataInicio
      ? new Date(contrato.dataInicio).toLocaleDateString('pt-BR')
      : 'N/A';
    const dataFim = contrato.dataFim ? new Date(contrato.dataFim).toLocaleDateString('pt-BR') : 'N/A';

    const condicoesPagamento = contrato.condicoesPagamento
      ? `
        <p>Forma de Pagamento: ${contrato.condicoesPagamento.formaPagamento}<br>
        Numero de Parcelas: ${contrato.condicoesPagamento.parcelas}<br>
        Valor da Parcela: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(contrato.condicoesPagamento.valorParcela || 0))}<br>
        Dia de Vencimento: ${contrato.condicoesPagamento.diaVencimento}</p>
      `
      : '';

    const clausulasEspeciais = contrato.clausulasEspeciais
      ? `
      <div class="section">
        <div class="section-title">4. CLAUSULAS ESPECIAIS</div>
        <p>${this.escapeHtml(contrato.clausulasEspeciais)}</p>
      </div>
    `
      : '';

    const observacoes = contrato.observacoes
      ? `
      <div class="section">
        <div class="section-title">5. OBSERVACOES</div>
        <p>${this.escapeHtml(contrato.observacoes)}</p>
      </div>
    `
      : '';

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrato ${this.escapeHtml(contrato.numero || String(contrato.id || 'N/A'))}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.5;
      margin: 24px;
      color: #202124;
      font-size: 12px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #111827;
      padding-bottom: 12px;
    }
    .contract-number {
      text-align: right;
      margin-bottom: 16px;
      font-weight: bold;
    }
    .section {
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .section-title {
      font-weight: 700;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    p {
      margin: 4px 0;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .value {
      font-weight: bold;
      color: #111827;
    }
    .signatures {
      margin-top: 48px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
    }
    .signature-box {
      padding-top: 24px;
    }
    .signature-line {
      border-top: 1px solid #000;
      margin-top: 36px;
      padding-top: 6px;
    }
    .footer {
      margin-top: 36px;
      border-top: 1px solid #d1d5db;
      padding-top: 10px;
      font-size: 10px;
      color: #4b5563;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>CONTRATO DE PRESTACAO DE SERVICOS</h1>
  </div>

  <div class="contract-number">
    Contrato No: ${this.escapeHtml(contrato.numero || 'N/A')}
  </div>

  <div class="section">
    <div class="section-title">Contratante</div>
    <p>Empresa: ${this.escapeHtml(empresaNome)}</p>
    <p>CNPJ: ${this.escapeHtml(empresaCNPJ)}</p>
    <p>Endereco: ${this.escapeHtml(empresaEndereco)}</p>
  </div>

  <div class="section">
    <div class="section-title">Contratado</div>
    <p>Cliente ID: ${this.escapeHtml(String(contrato.clienteId || 'N/A'))}</p>
    <p>(Dados completos do cliente devem ser conferidos no cadastro do CRM)</p>
  </div>

  <div class="section">
    <div class="section-title">1. Objeto do Contrato</div>
    <p>${this.escapeHtml(contrato.objeto || 'Objeto nao especificado')}</p>
  </div>

  <div class="section">
    <div class="section-title">2. Valor e Condicoes de Pagamento</div>
    <p><span class="value">Valor Total: ${valorTotalFormatado}</span></p>
    ${condicoesPagamento}
  </div>

  <div class="section">
    <div class="section-title">3. Prazo de Vigencia</div>
    <p>Data de Inicio: ${this.escapeHtml(dataInicio)}</p>
    <p>Data de Termino: ${this.escapeHtml(dataFim)}</p>
    <p>Data de Vencimento para Assinatura: ${this.escapeHtml(
      contrato.dataVencimento ? new Date(contrato.dataVencimento).toLocaleDateString('pt-BR') : 'N/A',
    )}</p>
  </div>

  ${clausulasEspeciais}
  ${observacoes}

  <div class="section">
    <div class="section-title">6. Clausulas Gerais</div>
    <p>6.1. Este contrato sera regido pelas leis brasileiras.</p>
    <p>6.2. Qualquer alteracao devera ser formalizada por escrito e assinada pelas partes.</p>
    <p>6.3. Em caso de descumprimento, a parte lesada podera rescindir o contrato conforme legislacao aplicavel.</p>
    <p>6.4. O foro competente e o da comarca da sede da contratante, salvo disposicao legal diversa.</p>
  </div>

  <div class="section">
    <p><strong>Local e Data:</strong> ________________, ${this.escapeHtml(dataAtual)}</p>
  </div>

  <div class="signatures">
    <div class="signature-box">
      <div class="signature-line"></div>
      <p><strong>CONTRATANTE</strong></p>
      <p>${this.escapeHtml(empresaNome)}</p>
    </div>
    <div class="signature-box">
      <div class="signature-line"></div>
      <p><strong>CONTRATADO</strong></p>
      <p>Cliente</p>
    </div>
  </div>

  <div class="footer">
    <p>Documento gerado automaticamente em ${this.escapeHtml(
      new Date().toLocaleString('pt-BR'),
    )}</p>
    <p>ID do Contrato: ${this.escapeHtml(String(contrato.id || 'N/A'))}</p>
  </div>
</body>
</html>
    `;
  }

  private escapeHtml(value: string): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private ensureUploadsDirectory(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
      this.logger.log(`Diretorio de uploads criado: ${this.uploadsDir}`);
    }
  }
}
