import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  private readonly templatesPath = path.join(__dirname, '../../templates/pdf');

  constructor() {
    // Registrar helpers do Handlebars
    this.registerHandlebarsHelpers();
  }

  private registerHandlebarsHelpers() {
    // Helper para formatação de moeda
    handlebars.registerHelper('formatarMoeda', (value: number) => {
      if (typeof value !== 'number') return 'R$ 0,00';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    });

    // Helper para formatação de moeda (alias)
    handlebars.registerHelper('currency', (value: number) => {
      if (typeof value !== 'number') return 'R$ 0,00';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    });

    // Helper para adição (usado em índices)
    handlebars.registerHelper('add', (a: number, b: number) => {
      return a + b;
    });

    // Helper para formatação de data
    handlebars.registerHelper('formatDate', (date: string | Date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('pt-BR');
    });

    // Helper para formatação de telefone
    handlebars.registerHelper('formatPhone', (phone: string) => {
      if (!phone) return '';
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 11) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
      } else if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
      }
      return phone;
    });

    // Helper para conditional
    handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
      return arg1 == arg2 ? options.fn(this) : options.inverse(this);
    });
  }

  async gerarProposta(tipo: string, dados: any): Promise<Buffer> {
    const html = await this.gerarHtml(tipo, dados);
    return this.htmlParaPdf(html);
  }

  async gerarHtml(tipo: string, dados: any): Promise<string> {
    const templatePath = path.join(this.templatesPath, `proposta-${tipo}.html`);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template ${tipo} não encontrado em ${templatePath}`);
    }

    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);

    // Processar dados para o template
    const dadosProcessados = await this.processarDados(dados);

    return template(dadosProcessados);
  }

  private async htmlParaPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'a4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private async processarDados(dados: any) {
    const agora = new Date();

    // Dados padrão
    const dadosProcessados = {
      ...dados,
      dataGeracao: agora.toLocaleDateString('pt-BR'),
      horaGeracao: agora.toLocaleTimeString('pt-BR'),
    };

    // Processar datas
    if (dadosProcessados.dataEmissao) {
      dadosProcessados.dataEmissao = new Date(dadosProcessados.dataEmissao).toLocaleDateString(
        'pt-BR',
      );
    } else {
      dadosProcessados.dataEmissao = agora.toLocaleDateString('pt-BR');
    }

    if (dadosProcessados.dataValidade) {
      dadosProcessados.dataValidade = new Date(dadosProcessados.dataValidade).toLocaleDateString(
        'pt-BR',
      );
    }

    // Processar valores monetários - removendo formatação pois será feita no template
    // if (dadosProcessados.itens && Array.isArray(dadosProcessados.itens)) {
    //   dadosProcessados.itens = dadosProcessados.itens.map(item => ({
    //     ...item,
    //     valorUnitario: this.formatarMoeda(item.valorUnitario),
    //     valorTotal: this.formatarMoeda(item.valorTotal),
    //   }));
    // }

    // Processar totais - removendo formatação pois será feita no template
    // if (dadosProcessados.subtotal) {
    //   dadosProcessados.subtotal = this.formatarMoeda(dadosProcessados.subtotal);
    // }
    // if (dadosProcessados.valorTotal) {
    //   dadosProcessados.valorTotal = this.formatarMoeda(dadosProcessados.valorTotal);
    // }
    // if (dadosProcessados.descontoGeral) {
    //   dadosProcessados.descontoGeral = this.formatarMoeda(dadosProcessados.descontoGeral);
    // }
    // if (dadosProcessados.impostos) {
    //   dadosProcessados.impostos = this.formatarMoeda(dadosProcessados.impostos);
    // }

    // Processar status
    if (dadosProcessados.status) {
      dadosProcessados.statusText = this.getStatusText(dadosProcessados.status);
    }

    // Condições gerais padrão se não fornecidas
    if (!dadosProcessados.condicoesGerais || dadosProcessados.condicoesGerais.length === 0) {
      dadosProcessados.condicoesGerais = [
        'Os preços apresentados têm validade conforme especificado nesta proposta.',
        'O prazo de entrega será contado a partir da confirmação do pedido e aprovação do projeto.',
        'Eventuais alterações no escopo do projeto poderão gerar custos adicionais.',
        'O pagamento deverá ser realizado conforme as condições estabelecidas.',
        'Esta proposta não gera vínculo contratual até sua formal aceitação.',
      ];
    }

    // Dados da empresa padrão se não fornecidos
    if (!dadosProcessados.empresa) {
      dadosProcessados.empresa = {
        nome: 'Conect CRM',
        endereco: 'Rua Exemplo, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234-567',
        telefone: '(11) 99999-9999',
        email: 'contato@conectcrm.com',
        cnpj: '12.345.678/0001-90',
      };
    }

    return dadosProcessados;
  }

  private formatarMoeda(valor: number): string {
    if (typeof valor !== 'number') return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }

  private getStatusText(status: string): string {
    const statusMap = {
      draft: 'Rascunho',
      sent: 'Enviada',
      approved: 'Aprovada',
      rejected: 'Rejeitada',
    };
    return statusMap[status] || 'Desconhecido';
  }
}
