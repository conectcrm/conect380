import { Injectable, Logger } from '@nestjs/common';
import { Contrato } from '../entities/contrato.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class PdfContratoService {
  private readonly logger = new Logger(PdfContratoService.name);
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'contratos');

  constructor() {
    this.ensureUploadsDirectory();
  }

  async gerarPDFContrato(contrato: Contrato): Promise<string> {
    try {
      // Garantir que o diretório existe
      this.ensureUploadsDirectory();

      // Por enquanto, gerar um arquivo HTML que pode ser convertido para PDF
      const nomeArquivo = `contrato-${contrato.numero || contrato.id}-${Date.now()}.html`;
      const caminhoCompleto = path.join(this.uploadsDir, nomeArquivo);

      // Gerar conteúdo HTML do contrato
      const htmlContent = this.gerarHTMLContrato(contrato);

      // Escrever arquivo
      fs.writeFileSync(caminhoCompleto, htmlContent, 'utf8');

      this.logger.log(
        `Contrato HTML gerado para ${contrato.numero || contrato.id}: ${caminhoCompleto}`,
      );

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
        throw new Error('Arquivo não encontrado');
      }

      return fs.readFileSync(caminhoArquivo);
    } catch (error) {
      this.logger.error(`Erro ao ler arquivo: ${error.message}`);
      throw error;
    }
  }

  private gerarHTMLContrato(contrato: Contrato): string {
    const empresaNome = process.env.EMPRESA_NOME || 'ConectCRM';
    const empresaCNPJ = process.env.EMPRESA_CNPJ || '00.000.000/0001-00';
    const empresaEndereco = process.env.EMPRESA_ENDERECO || 'Endereço da Empresa';
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrato ${contrato.numero || contrato.id}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 40px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .contract-number {
            text-align: right;
            margin-bottom: 20px;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 10px;
        }
        .signatures {
            margin-top: 50px;
        }
        .signature-line {
            border-bottom: 1px solid #000;
            width: 300px;
            margin: 30px 0 5px 0;
        }
        .footer {
            margin-top: 50px;
            font-size: 12px;
            text-align: center;
            color: #666;
        }
        .value {
            font-weight: bold;
            color: #2c3e50;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
    </div>

    <div class="contract-number">
        <strong>Contrato Nº: ${contrato.numero || 'N/A'}</strong>
    </div>

    <div class="section">
        <div class="section-title">CONTRATANTE:</div>
        <p>Empresa: ${empresaNome}<br>
        CNPJ: ${empresaCNPJ}<br>
        Endereço: ${empresaEndereco}</p>
    </div>

    <div class="section">
        <div class="section-title">CONTRATADO:</div>
        <p>Cliente ID: ${contrato.clienteId}<br>
        (Dados do cliente serão preenchidos automaticamente)</p>
    </div>

    <div class="section">
        <div class="section-title">1. OBJETO DO CONTRATO</div>
        <p>${contrato.objeto || 'Objeto não especificado'}</p>
    </div>

    <div class="section">
        <div class="section-title">2. VALOR E CONDIÇÕES DE PAGAMENTO</div>
        <p><span class="value">Valor Total: R$ ${contrato.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span></p>
        ${
          contrato.condicoesPagamento
            ? `
        <p>Forma de Pagamento: ${contrato.condicoesPagamento.formaPagamento}<br>
        Número de Parcelas: ${contrato.condicoesPagamento.parcelas}<br>
        Valor da Parcela: R$ ${contrato.condicoesPagamento.valorParcela?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}<br>
        Dia de Vencimento: ${contrato.condicoesPagamento.diaVencimento}</p>
        `
            : ''
        }
    </div>

    <div class="section">
        <div class="section-title">3. PRAZO DE VIGÊNCIA</div>
        <p>Data de Início: ${contrato.dataInicio ? new Date(contrato.dataInicio).toLocaleDateString('pt-BR') : 'N/A'}<br>
        Data de Término: ${contrato.dataFim ? new Date(contrato.dataFim).toLocaleDateString('pt-BR') : 'N/A'}</p>
    </div>

    ${
      contrato.clausulasEspeciais
        ? `
    <div class="section">
        <div class="section-title">4. CLÁUSULAS ESPECIAIS</div>
        <p>${contrato.clausulasEspeciais}</p>
    </div>
    `
        : ''
    }

    ${
      contrato.observacoes
        ? `
    <div class="section">
        <div class="section-title">5. OBSERVAÇÕES</div>
        <p>${contrato.observacoes}</p>
    </div>
    `
        : ''
    }

    <div class="section">
        <div class="section-title">6. CLÁUSULAS GERAIS</div>
        <p>6.1. Este contrato será regido pelas leis brasileiras.</p>
        <p>6.2. Qualquer alteração deste contrato deverá ser feita por escrito e assinada por ambas as partes.</p>
        <p>6.3. Em caso de descumprimento de qualquer cláusula, a parte lesada poderá rescindir o contrato.</p>
        <p>6.4. O foro competente para dirimir questões relativas a este contrato é o da comarca da sede da CONTRATANTE.</p>
    </div>

    <div class="section">
        <p><strong>Local e Data:</strong> ________________, ${dataAtual}</p>
    </div>

    <div class="signatures">
        <div class="signature-line"></div>
        <p><strong>CONTRATANTE</strong><br>${empresaNome}</p>
        
        <div class="signature-line"></div>
        <p><strong>CONTRATADO</strong><br>Cliente</p>
    </div>

    <div class="footer">
        <p>Documento gerado automaticamente em ${new Date().toLocaleString('pt-BR')}<br>
        ID do Contrato: ${contrato.id || 'N/A'}</p>
    </div>
</body>
</html>
    `;
  }

  private ensureUploadsDirectory(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
      this.logger.log(`Diretório de uploads criado: ${this.uploadsDir}`);
    }
  }
}
