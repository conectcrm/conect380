import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  private readonly templatesPath: string;

  constructor() {
    this.templatesPath = this.resolveTemplatesPath();
    // Registrar helpers do Handlebars
    this.registerHandlebarsHelpers();
  }

  private resolveTemplatesPath(): string {
    const envTemplatesPath = process.env.PDF_TEMPLATES_DIR?.trim();
    const candidates = [
      envTemplatesPath ? path.resolve(envTemplatesPath) : null,
      path.join(__dirname, '../../templates/pdf'),
      path.resolve(process.cwd(), 'dist/src/templates/pdf'),
      path.resolve(process.cwd(), 'src/templates/pdf'),
      path.resolve(process.cwd(), 'backend/dist/src/templates/pdf'),
      path.resolve(process.cwd(), 'backend/src/templates/pdf'),
    ].filter((candidate): candidate is string => Boolean(candidate));

    for (const candidate of candidates) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        return candidate;
      }
    }

    throw new Error(
      `Diretorio de templates PDF nao encontrado. Caminhos verificados: ${candidates.join(' | ')}`,
    );
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
    const templateName = `proposta-${tipo}.html`;
    const templatePath = path.join(this.templatesPath, templateName);

    if (!fs.existsSync(templatePath)) {
      const fallbackCandidates = [
        path.resolve(process.cwd(), 'src/templates/pdf', templateName),
        path.resolve(process.cwd(), 'dist/src/templates/pdf', templateName),
        path.resolve(process.cwd(), 'backend/src/templates/pdf', templateName),
        path.resolve(process.cwd(), 'backend/dist/src/templates/pdf', templateName),
      ];
      const fallback = fallbackCandidates.find((candidate) => fs.existsSync(candidate));
      if (!fallback) {
        throw new Error(
          `Template ${tipo} não encontrado. Caminhos verificados: ${[templatePath, ...fallbackCandidates].join(' | ')}`,
        );
      }
      const templateSourceFallback = fs.readFileSync(fallback, 'utf8');
      const templateFallback = handlebars.compile(templateSourceFallback);
      const dadosProcessadosFallback = await this.processarDados(dados);
      return templateFallback(dadosProcessadosFallback);
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
    const numeroProposta = String(dados?.numeroProposta || dados?.numero || `PROP-${agora.getTime()}`);
    const titulo = String(dados?.titulo || 'Proposta comercial').trim();
    const statusNormalizado = String(dados?.status || 'rascunho')
      .trim()
      .toLowerCase();

    const dataEmissao = this.toDatePtBr(dados?.dataEmissao, agora);
    const dataValidade = this.toDatePtBr(
      dados?.dataValidade,
      new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000),
    );

    const valorTotalEntrada = this.toNumber(dados?.valorTotal ?? dados?.total ?? dados?.valor, 0);
    const itensOriginais = Array.isArray(dados?.itens) ? dados.itens : [];
    const itens = this.normalizarItens(itensOriginais, titulo, valorTotalEntrada);

    const subtotalCalculado = itens.reduce((sum, item) => sum + this.toNumber(item.valorTotal, 0), 0);
    const subtotal = this.toNumber(dados?.subtotal, subtotalCalculado);
    const descontoGeral = Math.max(0, this.toNumber(dados?.descontoGeral, 0));
    const impostos = Math.max(0, this.toNumber(dados?.impostos, 0));
    const valorTotalCalculado = subtotal - descontoGeral + impostos;
    const valorTotal = this.toNumber(
      dados?.valorTotal ?? dados?.total ?? dados?.valor,
      valorTotalCalculado,
    );
    const percentualDesconto = this.toNumber(
      dados?.percentualDesconto,
      subtotal > 0 ? (descontoGeral / subtotal) * 100 : 0,
    );

    const formaPagamento = this.descreverFormaPagamento(dados?.formaPagamento);
    const prazoEntrega = this.toNonEmptyString(dados?.prazoEntrega);
    const garantia = this.toNonEmptyString(dados?.garantia);
    const validadeProposta =
      this.toNonEmptyString(dados?.validadeProposta) || `Até ${dataValidade}`;
    const condicoesGerais = Array.isArray(dados?.condicoesGerais)
      ? dados.condicoesGerais
          .map((item: unknown) => this.toNonEmptyString(item))
          .filter((item): item is string => Boolean(item))
      : [];
    const observacoes = this.toNonEmptyString(dados?.observacoes);
    const descricao = this.toNonEmptyString(dados?.descricao);

    const empresaBase = {
      nome: 'ConectCRM',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      telefone: '',
      email: '',
      cnpj: '',
      logo: '',
    };
    const empresa = {
      ...empresaBase,
      ...(dados?.empresa || {}),
    };
    empresa.nome = this.toNonEmptyString(empresa.nome) || 'ConectCRM';

    const clienteRaw = dados?.cliente || {};
    const cliente = {
      nome: this.toNonEmptyString(clienteRaw?.nome) || 'Cliente não informado',
      empresa: this.toNonEmptyString(clienteRaw?.empresa),
      email: this.toNonEmptyString(clienteRaw?.email),
      telefone: this.toNonEmptyString(clienteRaw?.telefone),
      documento: this.toNonEmptyString(clienteRaw?.documento),
      tipoDocumento: this.toNonEmptyString(clienteRaw?.tipoDocumento),
      endereco: this.toNonEmptyString(clienteRaw?.endereco),
    };

    const vendedorRaw = dados?.vendedor || {};
    const vendedor = {
      nome: this.toNonEmptyString(vendedorRaw?.nome) || 'Equipe comercial',
      email: this.toNonEmptyString(vendedorRaw?.email),
      telefone: this.toNonEmptyString(vendedorRaw?.telefone),
      cargo: this.toNonEmptyString(vendedorRaw?.cargo),
    };

    return {
      ...dados,
      numeroProposta,
      titulo,
      status: statusNormalizado,
      statusText: this.getStatusText(statusNormalizado),
      statusClass: this.getStatusClass(statusNormalizado),
      dataEmissao,
      dataValidade,
      dataGeracao: agora.toLocaleDateString('pt-BR'),
      horaGeracao: agora.toLocaleTimeString('pt-BR'),
      empresa,
      cliente,
      vendedor,
      itens,
      subtotal,
      descontoGeral,
      percentualDesconto,
      impostos,
      valorTotal,
      formaPagamento,
      prazoEntrega,
      garantia,
      validadeProposta,
      condicoesGerais,
      observacoes,
      descricao,
      temDescricao: Boolean(descricao),
      temObservacoes: Boolean(observacoes),
      temCondicoesGerais: condicoesGerais.length > 0,
      temDescontoGeral: descontoGeral > 0,
      temImpostos: impostos > 0,
      temPrazoEntrega: Boolean(prazoEntrega),
      temGarantia: Boolean(garantia),
    };
  }

  private normalizarItens(
    itensOriginais: any[],
    tituloFallback: string,
    valorFallback: number,
  ): Array<{
    nome: string;
    descricao: string;
    quantidade: number;
    unidade: string;
    valorUnitario: number;
    desconto: number;
    valorTotal: number;
  }> {
    const itensProcessados = itensOriginais
      .map((item: any, index: number) => {
        const nome = this.toNonEmptyString(item?.nome || item?.descricao) || `Item ${index + 1}`;
        const descricao = this.toNonEmptyString(item?.descricao);
        const quantidade = Math.max(0.01, this.toNumber(item?.quantidade, 1));
        const unidade = this.toNonEmptyString(item?.unidade) || 'un';
        const valorUnitario = Math.max(
          0,
          this.toNumber(item?.valorUnitario ?? item?.precoUnitario ?? item?.preco, 0),
        );
        const desconto = Math.max(0, this.toNumber(item?.desconto, 0));
        const valorTotal =
          this.toNumber(item?.valorTotal ?? item?.subtotal, 0) ||
          valorUnitario * quantidade * (1 - desconto / 100);

        return {
          nome,
          descricao,
          quantidade,
          unidade,
          valorUnitario,
          desconto,
          valorTotal: Math.max(0, valorTotal),
        };
      })
      .filter((item) => item.nome);

    if (itensProcessados.length > 0) {
      return itensProcessados;
    }

    const valorUnitarioFallback = Math.max(0, this.toNumber(valorFallback, 0));
    return [
      {
        nome: tituloFallback || 'Item da proposta',
        descricao: '',
        quantidade: 1,
        unidade: 'un',
        valorUnitario: valorUnitarioFallback,
        desconto: 0,
        valorTotal: valorUnitarioFallback,
      },
    ];
  }

  private toNumber(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private toDatePtBr(value: unknown, fallback: Date): string {
    if (!value) {
      return fallback.toLocaleDateString('pt-BR');
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toLocaleDateString('pt-BR');
    }

    const raw = String(value).trim();
    if (!raw) {
      return fallback.toLocaleDateString('pt-BR');
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      const [dia, mes, ano] = raw.split('/').map((item) => Number(item));
      const parsedBr = new Date(ano, mes - 1, dia);
      if (!Number.isNaN(parsedBr.getTime())) {
        return parsedBr.toLocaleDateString('pt-BR');
      }
    }

    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('pt-BR');
    }

    return fallback.toLocaleDateString('pt-BR');
  }

  private toNonEmptyString(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    const text = String(value).trim();
    return text.length > 0 ? text : '';
  }

  private descreverFormaPagamento(value: unknown): string {
    const normalized = String(value || '')
      .trim()
      .toLowerCase();

    const map: Record<string, string> = {
      avista: 'À vista',
      'a-vista': 'À vista',
      a_vista: 'À vista',
      boleto: 'Boleto bancário',
      cartao: 'Cartão de crédito',
      cartao_credito: 'Cartão de crédito',
      pix: 'PIX',
      recorrente: 'Recorrente',
      parcelado: 'Parcelado',
    };

    return map[normalized] || this.toNonEmptyString(value) || 'Conforme negociação comercial';
  }

  private formatarMoeda(valor: number): string {
    if (typeof valor !== 'number') return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }

  private getStatusText(status: string): string {
    const normalized = String(status || '').trim().toLowerCase();
    const statusMap: Record<string, string> = {
      draft: 'Rascunho',
      rascunho: 'Rascunho',
      sent: 'Enviada',
      enviada: 'Enviada',
      viewed: 'Visualizada',
      visualizada: 'Visualizada',
      negociacao: 'Em negociação',
      approved: 'Aprovada',
      aprovada: 'Aprovada',
      contrato_gerado: 'Contrato gerado',
      contrato_assinado: 'Contrato assinado',
      fatura_criada: 'Fatura criada',
      aguardando_pagamento: 'Aguardando pagamento',
      pago: 'Pago',
      rejected: 'Rejeitada',
      rejeitada: 'Rejeitada',
      expired: 'Expirada',
      expirada: 'Expirada',
    };
    return statusMap[normalized] || 'Desconhecido';
  }

  private getStatusClass(status: string): string {
    const normalized = String(status || '').trim().toLowerCase();
    if (['rascunho', 'draft'].includes(normalized)) return 'status-muted';
    if (['enviada', 'sent', 'visualizada', 'viewed', 'negociacao'].includes(normalized)) {
      return 'status-info';
    }
    if (
      [
        'aprovada',
        'approved',
        'contrato_gerado',
        'contrato_assinado',
        'fatura_criada',
        'aguardando_pagamento',
      ].includes(normalized)
    ) {
      return 'status-warning';
    }
    if (['pago'].includes(normalized)) return 'status-success';
    if (['rejeitada', 'rejected', 'expirada', 'expired'].includes(normalized)) {
      return 'status-danger';
    }
    return 'status-muted';
  }
}
