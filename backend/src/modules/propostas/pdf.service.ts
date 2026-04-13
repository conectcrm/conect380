import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

type PlanoComponentePdf = {
  childItemId: string;
  componentRole: 'included' | 'required' | 'optional' | 'recommended' | 'addon';
  quantity?: number;
  nome?: string;
};

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly templatesPath: string;
  private readonly componentRoleLabels: Record<PlanoComponentePdf['componentRole'], string> = {
    included: 'Incluido',
    required: 'Obrigatorio',
    optional: 'Opcional',
    recommended: 'Recomendado',
    addon: 'Add-on',
  };

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
    // Helper para formatacao de moeda
    handlebars.registerHelper('formatarMoeda', (value: number) => {
      if (typeof value !== 'number') return 'R$ 0,00';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    });

    // Helper para formatacao de moeda (alias)
    handlebars.registerHelper('currency', (value: number) => {
      if (typeof value !== 'number') return 'R$ 0,00';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    });

    // Helper para adicao (usado em indices)
    handlebars.registerHelper('add', (a: number, b: number) => {
      return a + b;
    });

    // Helper para formatacao de data
    handlebars.registerHelper('formatDate', (date: string | Date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('pt-BR');
    });

    // Helper para formatacao percentual
    handlebars.registerHelper('formatarPercentual', (value: number) => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return '0,00';
      return parsed.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    });

    // Helper para formatacao de telefone
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
          `Template ${tipo} nao encontrado. Caminhos verificados: ${[templatePath, ...fallbackCandidates].join(' | ')}`,
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
    const executablePath = this.resolveBrowserExecutablePath();
    const launchProfiles = this.buildLaunchProfiles(executablePath);

    let lastError: unknown = null;
    for (const profile of launchProfiles) {
      const maxAttempts = 2;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        let browser: puppeteer.Browser | null = null;
        try {
          this.logger.log(
            `Gerando PDF com perfil de browser "${profile.name}" (tentativa ${attempt}/${maxAttempts})`,
          );

          browser = await puppeteer.launch(profile.options);

          const page = await browser.newPage();
          page.setDefaultNavigationTimeout(120000);
          page.setDefaultTimeout(120000);
          await page.setContent(html, { waitUntil: 'domcontentloaded' });
          await page.evaluate(async () => {
            if ((document as any).fonts?.ready) {
              await (document as any).fonts.ready;
            }
          });

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
        } catch (error) {
          lastError = error;
          const shouldRetry = attempt < maxAttempts && this.isRetryablePdfError(error);

          this.logger.warn(
            `Falha ao renderizar PDF com perfil "${profile.name}" (tentativa ${attempt}/${maxAttempts}): ${
              (error as Error)?.message || String(error)
            }`,
          );

          if (shouldRetry) {
            await this.delay(500 * attempt);
          } else {
            break;
          }
        } finally {
          if (browser) {
            await browser.close().catch(() => undefined);
          }
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Falha ao gerar PDF em todos os perfis de browser');
  }

  private buildLaunchProfiles(executablePath?: string): Array<{
    name: string;
    options: NonNullable<Parameters<typeof puppeteer.launch>[0]>;
  }> {
    const executableOption = executablePath ? { executablePath } : {};
    const isWindows = process.platform === 'win32';
    const baseOptions = {
      headless: true as const,
      timeout: 60000,
      protocolTimeout: 120000,
      ...executableOption,
    };

    const stableArgs = isWindows
      ? ['--disable-gpu', '--font-render-hinting=none']
      : [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--font-render-hinting=none',
        ];

    const compatibilityArgs = isWindows
      ? ['--disable-gpu']
      : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'];

    const constrainedArgs = isWindows
      ? ['--disable-gpu', '--no-zygote']
      : [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-zygote',
          '--single-process',
        ];

    return [
      {
        name: 'stable-default',
        options: {
          ...baseOptions,
          pipe: false,
          args: stableArgs,
        },
      },
      {
        name: 'compatibility-minimal',
        options: {
          ...baseOptions,
          pipe: false,
          args: compatibilityArgs,
        },
      },
      {
        name: 'constrained-legacy',
        options: {
          ...baseOptions,
          pipe: true,
          args: constrainedArgs,
        },
      },
    ];
  }

  private isRetryablePdfError(error: unknown): boolean {
    const message = String((error as { message?: unknown })?.message || '').toLowerCase();
    if (!message) {
      return false;
    }

    return [
      'socket hang up',
      'target closed',
      'session closed',
      'browser has disconnected',
      'econnreset',
      'protocol error',
      'navigation timeout',
      'timeout',
    ].some((snippet) => message.includes(snippet));
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private resolveBrowserExecutablePath(): string | undefined {
    const localAppData = process.env.LOCALAPPDATA || '';
    const candidates = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      process.env.CHROME_PATH,
      process.env.BROWSER_EXECUTABLE_PATH,
      localAppData ? path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
      localAppData ? path.join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe') : '',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/lib/chromium/chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
    ]
      .map((value) => String(value || '').trim())
      .filter((value) => value.length > 0);

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        this.logger.log(`Executavel de browser para PDF detectado: ${candidate}`);
        return candidate;
      }
    }

    this.logger.warn(
      'Nenhum executavel de browser especifico encontrado para PDF. Usando resolucao padrao do Puppeteer.',
    );
    return undefined;
  }

  private async processarDados(dados: any) {
    const agora = new Date();
    const numeroProposta = String(dados?.numeroProposta || dados?.numero || `PROP-${agora.getTime()}`);
    const tituloInformado = this.toNonEmptyString(dados?.titulo);
    const titulo = tituloInformado || 'Proposta comercial';
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

    const roundMoney = (value: number) =>
      Math.round((Number(value) + Number.EPSILON) * 100) / 100;

    const subtotalCalculado = roundMoney(
      itens.reduce((sum, item) => sum + this.toNumber(item.valorTotal, 0), 0),
    );
    const subtotalBrutoCalculado = roundMoney(
      itens.reduce(
        (sum, item) =>
          sum + this.toNumber(item.valorUnitario, 0) * this.toNumber(item.quantidade, 0),
        0,
      ),
    );
    const descontoItensCalculado = roundMoney(
      Math.max(0, subtotalBrutoCalculado - subtotalCalculado),
    );

    const subtotal = roundMoney(this.toNumber(dados?.subtotal, subtotalCalculado));
    const descontoItens = roundMoney(
      Math.max(0, this.toNumber(dados?.descontoItens, descontoItensCalculado)),
    );

    const percentualDescontoEntrada = this.toNumber(dados?.percentualDesconto, Number.NaN);
    const descontoGeralEntrada = Math.max(0, this.toNumber(dados?.descontoGeral, 0));
    const percentualDesconto = Number.isFinite(percentualDescontoEntrada)
      ? Math.min(100, Math.max(0, percentualDescontoEntrada))
      : subtotal > 0
        ? (descontoGeralEntrada / subtotal) * 100
        : 0;
    const descontoGeral = Number.isFinite(percentualDescontoEntrada)
      ? roundMoney(subtotal * (percentualDesconto / 100))
      : roundMoney(descontoGeralEntrada);

    const baseCalculoImpostos = roundMoney(Math.max(0, subtotal - descontoGeral));
    const percentualImpostosEntrada = this.toNumber(dados?.percentualImpostos, Number.NaN);
    const impostosEntrada = Math.max(0, this.toNumber(dados?.impostos, 0));
    const percentualImpostos = Number.isFinite(percentualImpostosEntrada)
      ? Math.min(100, Math.max(0, percentualImpostosEntrada))
      : baseCalculoImpostos > 0
        ? (impostosEntrada / baseCalculoImpostos) * 100
        : 0;
    const impostos = Number.isFinite(percentualImpostosEntrada)
      ? roundMoney(baseCalculoImpostos * (percentualImpostos / 100))
      : roundMoney(impostosEntrada);

    const totalDescontos = roundMoney(descontoItens + descontoGeral);
    const valorTotalCalculado = roundMoney(baseCalculoImpostos + impostos);
    const valorTotal = this.toNumber(
      dados?.valorTotal ?? dados?.total ?? dados?.valor,
      valorTotalCalculado,
    );

    const formaPagamento = this.descreverFormaPagamento(dados?.formaPagamento, dados?.parcelas);
    const prazoEntrega = this.toNonEmptyString(dados?.prazoEntrega);
    const garantia = this.toNonEmptyString(dados?.garantia);
    const validadeProposta =
      this.toNonEmptyString(dados?.validadeProposta) || `Ate ${dataValidade}`;
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
      nome: this.toNonEmptyString(clienteRaw?.nome) || 'Cliente nao informado',
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
    const temTituloPersonalizado = this.deveExibirTituloProposta(
      tituloInformado || titulo,
      cliente.nome,
      dataEmissao,
    );

    const incluirImpostosPDF = dados?.incluirImpostosPDF !== false;
    const temImpostos = incluirImpostosPDF && impostos > 0;

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
      subtotalBruto: subtotalBrutoCalculado,
      descontoItens,
      descontoGeral,
      totalDescontos,
      baseCalculoImpostos,
      percentualDesconto,
      percentualImpostos,
      impostos,
      valorTotal,
      formaPagamento,
      prazoEntrega,
      garantia,
      validadeProposta,
      condicoesGerais,
      observacoes,
      descricao,
      temTituloPersonalizado,
      temDescricao: Boolean(descricao),
      temObservacoes: Boolean(observacoes),
      temCondicoesGerais: condicoesGerais.length > 0,
      temDescontoItens: descontoItens > 0,
      temDescontoGeral: descontoGeral > 0,
      temTotalDescontos: totalDescontos > 0,
      temImpostos,
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
        const descricaoBase = this.toNonEmptyString(item?.descricao);
        const descricao = this.mergeDescricaoComComposicaoPlano(item, descricaoBase);
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

  private normalizePlanoComponentes(value: unknown): PlanoComponentePdf[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((raw) => {
        if (!raw || typeof raw !== 'object') {
          return null;
        }

        const record = raw as Record<string, unknown>;
        const childItemId = this.toNonEmptyString(record.childItemId || record.child_item_id);
        if (!childItemId) {
          return null;
        }

        const componentRoleRaw = this.toNonEmptyString(
          record.componentRole || record.component_role || 'included',
        ).toLowerCase();
        const componentRole = (
          ['included', 'required', 'optional', 'recommended', 'addon'].includes(componentRoleRaw)
            ? componentRoleRaw
            : 'included'
        ) as PlanoComponentePdf['componentRole'];

        const quantity = this.toNumber(record.quantity, 1);
        const nome = this.toNonEmptyString(record.nome);

        return {
          childItemId,
          componentRole,
          quantity: Number.isFinite(quantity) ? quantity : undefined,
          nome: nome || undefined,
        } as PlanoComponentePdf;
      })
      .filter((item): item is PlanoComponentePdf => Boolean(item));
  }

  private buildComposicaoPlanoDescricao(componentes: PlanoComponentePdf[], limit = 6): string {
    if (!Array.isArray(componentes) || componentes.length === 0) {
      return '';
    }

    const linhas = componentes.slice(0, limit).map((componente) => {
      const nome = this.toNonEmptyString(componente.nome) || 'Item da composicao';
      const quantidade =
        typeof componente.quantity === 'number' && componente.quantity > 1
          ? ` x${componente.quantity}`
          : '';
      const papel =
        this.componentRoleLabels[componente.componentRole || 'included'] || 'Incluido';
      return `- ${nome}${quantidade} (${papel})`;
    });

    if (componentes.length > limit) {
      linhas.push(`- +${componentes.length - limit} componente(s) adicional(is)`);
    }

    return `Composicao do plano:\n${linhas.join('\n')}`;
  }

  private mergeDescricaoComComposicaoPlano(item: any, descricaoBase: string): string {
    const tipoItem = this.toNonEmptyString(item?.tipoItem || item?.produto?.tipoItem).toLowerCase();
    const componentesPlano = this.normalizePlanoComponentes(
      item?.componentesPlano ??
        item?.componentes ??
        item?.produto?.componentesPlano ??
        item?.produto?.componentes,
    );
    const temComposicao = Array.isArray(componentesPlano) && componentesPlano.length > 0;
    if (tipoItem !== 'plano' && !temComposicao) {
      return descricaoBase;
    }

    const composicaoDescricao = this.buildComposicaoPlanoDescricao(componentesPlano);
    if (!composicaoDescricao) {
      return descricaoBase;
    }

    if (descricaoBase.toLowerCase().includes('composicao do plano')) {
      return descricaoBase;
    }

    return descricaoBase ? `${descricaoBase}\n\n${composicaoDescricao}` : composicaoDescricao;
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

  private normalizeComparableText(value: unknown): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[-_|]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private deveExibirTituloProposta(titulo: string, clienteNome: string, dataEmissao: string): boolean {
    const tituloNormalizado = this.normalizeComparableText(titulo);
    if (!tituloNormalizado) {
      return false;
    }

    const titulosGenericos = new Set([
      'proposta',
      'proposta comercial',
      'nova proposta',
      'nova proposta comercial',
    ]);
    if (titulosGenericos.has(tituloNormalizado)) {
      return false;
    }

    const clienteNormalizado = this.normalizeComparableText(clienteNome);
    const dataNormalizada = this.normalizeComparableText(dataEmissao);
    const tituloPadraoClienteData = this.normalizeComparableText(`${clienteNome} ${dataEmissao}`);

    if (clienteNormalizado && tituloNormalizado === clienteNormalizado) {
      return false;
    }

    if (
      clienteNormalizado &&
      dataNormalizada &&
      tituloPadraoClienteData &&
      tituloNormalizado === tituloPadraoClienteData
    ) {
      return false;
    }

    return true;
  }

  private descreverFormaPagamento(value: unknown, parcelas?: unknown): string {
    const normalized = String(value || '')
      .trim()
      .toLowerCase();
    const numeroParcelas = Number(parcelas || 0);

    const map: Record<string, string> = {
      avista: 'A vista',
      'a-vista': 'A vista',
      a_vista: 'A vista',
      boleto: 'Boleto bancario',
      cartao: 'Cartao de credito',
      cartao_credito: 'Cartao de credito',
      pix: 'PIX',
      recorrente: 'Recorrente',
      parcelado: numeroParcelas > 1 ? `Parcelado em ate ${numeroParcelas}x` : 'Parcelado',
    };

    return map[normalized] || this.toNonEmptyString(value) || 'Conforme negociacao comercial';
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
      negociacao: 'Em negociacao',
      approved: 'Aprovada',
      aprovada: 'Aprovada',
      contrato_gerado: 'Contrato gerado',
      contrato_assinado: 'Contrato assinado',
      dispensa_contrato_solicitada: 'Dispensa de contrato solicitada',
      dispensa_contrato_aprovada: 'Dispensa de contrato aprovada',
      faturamento_liberado: 'Faturamento liberado',
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
        'dispensa_contrato_solicitada',
        'dispensa_contrato_aprovada',
        'faturamento_liberado',
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
