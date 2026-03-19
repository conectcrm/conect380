import {
  propostasService as sharedPropostasService,
  Proposta as PropostaBasica,
} from '../../../services/propostasService';
import { authService } from '../../../services/authService';
import { extrairItensComerciaisDaProposta } from '../utils/propostaItens';
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_REGEX.test(value.trim());

interface Cliente {
  id: string;
  nome: string;
  documento: string;
  email: string;
  telefone: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  tipoPessoa: 'fisica' | 'juridica';
}

interface Vendedor {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  tipo: 'vendedor' | 'gerente' | 'admin';
  ativo: boolean;
}

interface ProdutoComponentePlano {
  childItemId: string;
  componentRole: 'included' | 'required' | 'optional' | 'recommended' | 'addon';
  quantity?: number;
  sortOrder?: number;
  affectsPrice?: boolean;
  isDefault?: boolean;
  nome?: string;
  preco?: number;
  tipoItem?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  categoriaId?: string;
  subcategoria?: string;
  subcategoriaId?: string;
  configuracao?: string;
  configuracaoId?: string;
  descricao?: string;
  unidade: string;
  tipo?: 'produto' | 'combo' | 'software';
  status?: 'ativo' | 'inativo' | 'descontinuado' | 'rascunho';
  produtosCombo?: Produto[];
  precoOriginal?: number;
  desconto?: number;
  tipoItem?:
    | 'produto'
    | 'servico'
    | 'licenca'
    | 'modulo'
    | 'plano'
    | 'aplicativo'
    | 'peca'
    | 'acessorio'
    | 'pacote'
    | 'garantia';
  tipoLicenciamento?: string;
  periodicidadeLicenca?: string;
  renovacaoAutomatica?: boolean;
  quantidadeLicencas?: number;
  componentes?: ProdutoComponentePlano[];
}

interface ProdutoProposta {
  produto: Produto;
  quantidade: number;
  desconto: number;
  subtotal: number;
}

interface PropostaFormData {
  titulo?: string;
  vendedor: Vendedor | null;
  cliente: Cliente | null;
  produtos: ProdutoProposta[];
  descontoGlobal: number;
  impostos: number;
  formaPagamento: 'avista' | 'parcelado' | 'boleto' | 'cartao';
  parcelas?: number;
  validadeDias: number;
  observacoes: string;
  incluirImpostosPDF: boolean;
}

interface PropostaCompleta extends PropostaFormData {
  id?: string;
  numero?: string;
  oportunidade?: {
    id: string;
    titulo: string;
    estagio: string;
    valor: number;
  };
  isPropostaPrincipal?: boolean;
  subtotal: number;
  total: number;
  dataValidade: Date;
  status?:
    | 'rascunho'
    | 'enviada'
    | 'visualizada'
    | 'negociacao'
    | 'aprovada'
    | 'contrato_gerado'
    | 'contrato_assinado'
    | 'fatura_criada'
    | 'aguardando_pagamento'
    | 'pago'
    | 'rejeitada'
    | 'expirada';
  motivoPerda?: string;
  aprovacaoInterna?: {
    obrigatoria: boolean;
    status: 'nao_requer' | 'pendente' | 'aprovada' | 'rejeitada';
    limiteDesconto?: number;
    descontoDetectado?: number;
    motivo?: string;
    solicitadaEm?: string;
    solicitadaPorId?: string;
    solicitadaPorNome?: string;
    aprovadaEm?: string;
    aprovadaPorId?: string;
    aprovadaPorNome?: string;
    rejeitadaEm?: string;
    rejeitadaPorId?: string;
    rejeitadaPorNome?: string;
    observacoes?: string;
  };
  lembretes?: Array<{
    id: string;
    status: 'agendado' | 'enviado' | 'cancelado';
    agendadoPara?: string;
    criadoEm?: string;
    diasApos?: number;
    observacoes?: string;
  }>;
  historicoEventos?: Array<{
    id?: string;
    evento?: string;
    timestamp?: string;
    origem?: string;
    status?: string;
    detalhes?: string;
    ip?: string;
  }>;
  versoes?: Array<{
    versao: number;
    criadaEm?: string;
    origem?: string;
    descricao?: string;
  }>;
  tokenPortal?: string;
  criadaEm?: Date;
  atualizadaEm?: Date;
}

// Serviço com APIs reais apenas
class PropostasService {
  private baseUrl = 'http://localhost:3001/propostas';

  // Cache para vendedores para evitar múltiplas requisições
  private vendedoresCache: Vendedor[] | null = null;
  private vendedoresCacheTimestamp: number = 0;
  private vendedorAtualCache: Vendedor | null = null;
  private vendedorAtualCacheTimestamp: number = 0;

  // Cache para produtos para evitar múltiplas requisições
  private produtosCache: Produto[] | null = null;
  private produtosCacheTimestamp: number = 0;
  private isLoadingProdutos = false;

  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em milliseconds
  private isLoadingVendedores = false;

  private toFiniteNumber(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private toInteger(
    value: unknown,
    fallback: number,
    options?: { min?: number; max?: number },
  ): number {
    const parsed = this.toFiniteNumber(value, fallback);
    const rounded = Math.trunc(parsed);
    const min = options?.min;
    const max = options?.max;

    if (typeof min === 'number' && rounded < min) {
      return min;
    }
    if (typeof max === 'number' && rounded > max) {
      return max;
    }
    return rounded;
  }

  private mapRoleToVendedorTipo(role: unknown): Vendedor['tipo'] {
    const normalizedRole = typeof role === 'string' ? role.trim().toLowerCase() : '';

    if (normalizedRole === 'admin' || normalizedRole === 'superadmin') {
      return 'admin';
    }

    if (normalizedRole === 'gerente' || normalizedRole === 'manager') {
      return 'gerente';
    }

    return 'vendedor';
  }

  private getVendedorLogadoFallback(): Vendedor | null {
    try {
      const user = authService.getUser();
      if (!user) {
        return null;
      }

      const id = typeof user.id === 'string' ? user.id.trim() : '';
      const nome = typeof user.nome === 'string' ? user.nome.trim() : '';

      if (!id || !nome) {
        return null;
      }

      return {
        id,
        nome,
        email: typeof user.email === 'string' ? user.email : '',
        telefone: typeof user.telefone === 'string' ? user.telefone : '',
        tipo: this.mapRoleToVendedorTipo(user.role),
        ativo: true,
      };
    } catch {
      return null;
    }
  }

  private mergeVendedoresComFallback(vendedores: Vendedor[]): Vendedor[] {
    const base = Array.isArray(vendedores) ? vendedores.filter((item) => !!item?.id) : [];
    const vendedorFallback = this.getVendedorLogadoFallback();

    if (!vendedorFallback) {
      return base;
    }

    const existingIndex = base.findIndex((item) => item.id === vendedorFallback.id);
    if (existingIndex === -1) {
      return [vendedorFallback, ...base];
    }

    const merged = [...base];
    const existing = merged[existingIndex];
    merged[existingIndex] = {
      ...existing,
      nome: existing.nome || vendedorFallback.nome,
      email: existing.email || vendedorFallback.email,
      telefone: existing.telefone || vendedorFallback.telefone,
      ativo: true,
    };

    return merged;
  }

  private isComboItem(item: unknown): boolean {
    if (!item || typeof item !== 'object') {
      return false;
    }

    const record = item as Record<string, unknown>;
    const tipo = String(record.tipo ?? record.itemTipo ?? '').trim().toLowerCase();
    if (tipo === 'combo' || tipo.includes('combo')) {
      return true;
    }

    const origem = String(record.origem ?? '').trim().toLowerCase();
    if (origem === 'combo' || origem.includes('combo')) {
      return true;
    }

    const unidade = String(record.unidade ?? '').trim().toLowerCase();
    if (unidade === 'combo' || unidade === 'pacote') {
      return true;
    }

    if (record.comboId || record.combo_id || record.idCombo) {
      return true;
    }

    return Array.isArray(record.produtosCombo) && record.produtosCombo.length > 0;
  }

  private normalizeUsoItensVsCombos(payload: unknown) {
    const usage = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
    const itensAvulsos = Number(usage.itensAvulsos || 0);
    const combos = Number(usage.combos || 0);
    const totalItens = Math.max(itensAvulsos + combos, 0);
    const percentualItensAvulsosPayload = Number(usage.percentualItensAvulsos);
    const percentualCombosPayload = Number(usage.percentualCombos);

    return {
      itensAvulsos,
      combos,
      propostasComItensAvulsos: Number(usage.propostasComItensAvulsos || 0),
      propostasComCombos: Number(usage.propostasComCombos || 0),
      propostasMistas: Number(usage.propostasMistas || 0),
      percentualItensAvulsos:
        Number.isFinite(percentualItensAvulsosPayload) && percentualItensAvulsosPayload >= 0
          ? percentualItensAvulsosPayload
          : totalItens > 0
            ? Math.round((itensAvulsos / totalItens) * 10000) / 100
            : 0,
      percentualCombos:
        Number.isFinite(percentualCombosPayload) && percentualCombosPayload >= 0
          ? percentualCombosPayload
          : totalItens > 0
            ? Math.round((combos / totalItens) * 10000) / 100
            : 0,
    };
  }

  private calcularUsoItensVsCombos(propostas: PropostaCompleta[]) {
    let itensAvulsos = 0;
    let combos = 0;
    let propostasComItensAvulsos = 0;
    let propostasComCombos = 0;
    let propostasMistas = 0;

    propostas.forEach((proposta) => {
      let propostaTemItemAvulso = false;
      let propostaTemCombo = false;

      (proposta.produtos || []).forEach((item) => {
        if (this.isComboItem(item?.produto)) {
          combos += 1;
          propostaTemCombo = true;
          return;
        }

        itensAvulsos += 1;
        propostaTemItemAvulso = true;
      });

      if (propostaTemItemAvulso) {
        propostasComItensAvulsos += 1;
      }
      if (propostaTemCombo) {
        propostasComCombos += 1;
      }
      if (propostaTemItemAvulso && propostaTemCombo) {
        propostasMistas += 1;
      }
    });

    return this.normalizeUsoItensVsCombos({
      itensAvulsos,
      combos,
      propostasComItensAvulsos,
      propostasComCombos,
      propostasMistas,
    });
  }

  // Método para obter produtos do sistema com cache
  async obterProdutos(): Promise<Produto[]> {
    try {
      // Verificar se temos cache válido
      const now = Date.now();
      const isCacheValid =
        Array.isArray(this.produtosCache) &&
        this.produtosCache.length > 0 &&
        now - this.produtosCacheTimestamp < this.CACHE_DURATION;

      if (isCacheValid) {
        return this.produtosCache!;
      }

      // Se já está carregando, aguardar um pouco para evitar múltiplas requisições simultâneas
      if (this.isLoadingProdutos) {
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Verificar se o cache foi atualizado enquanto esperava
        if (
          Array.isArray(this.produtosCache) &&
          this.produtosCache.length > 0 &&
          Date.now() - this.produtosCacheTimestamp < this.CACHE_DURATION
        ) {
          return this.produtosCache;
        }
      }

      this.isLoadingProdutos = true;

      // Carregar catálogo de itens do backend
      const { produtosService } = await import('../../../services/produtosService');
      const PAGE_LIMIT = 100;
      let page = 1;
      let totalPages = 1;
      const produtosAPI: any[] = [];

      // Usa o mesmo fluxo paginado da tela de Catalogo de Itens para evitar divergencia.
      do {
        const response = await produtosService.listPaginated({
          page,
          limit: PAGE_LIMIT,
          sortBy: 'nome',
          sortOrder: 'ASC',
        });

        if (Array.isArray(response?.data) && response.data.length > 0) {
          produtosAPI.push(...response.data);
        }

        totalPages = Math.max(1, Number(response?.meta?.totalPages || 1));
        page += 1;
      } while (page <= totalPages);

      const itensCatalogo: Produto[] = Array.isArray(produtosAPI)
        ? produtosAPI
            .filter((produto: any) => (produto?.status || 'ativo') !== 'descontinuado')
            .map((produto: any) => ({
              id: produto.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              nome: produto.nome || 'Item sem nome',
              preco: Number(produto.preco || 0),
              categoria: produto.categoria || 'Geral',
              categoriaId: produto.categoriaId,
              subcategoria: produto.subcategoriaNome || undefined,
              subcategoriaId: produto.subcategoriaId || undefined,
              configuracao: produto.configuracaoNome || undefined,
              configuracaoId: produto.configuracaoId || undefined,
              descricao: produto.descricao || '',
              unidade: produto.unidade || produto.unidadeMedida || 'unidade',
              tipo:
                typeof produto?.tipoItem === 'string' &&
                ['plano', 'modulo', 'licenca', 'aplicativo'].includes(
                  produto.tipoItem.trim().toLowerCase(),
                )
                  ? 'software'
                  : 'produto',
              tipoItem: produto.tipoItem,
              status: produto.status || 'ativo',
              tipoLicenciamento: produto.tipoLicenciamento,
              periodicidadeLicenca: produto.periodicidadeLicenca,
              componentes: Array.isArray(produto.componentes)
                ? produto.componentes.map((componente: any) => ({
                    childItemId: componente.childItemId,
                    componentRole: componente.componentRole || 'included',
                    quantity:
                      componente.quantity === undefined || componente.quantity === null
                        ? 1
                        : Number(componente.quantity),
                    sortOrder:
                      componente.sortOrder === undefined || componente.sortOrder === null
                        ? undefined
                        : Number(componente.sortOrder),
                    affectsPrice:
                      componente.affectsPrice === undefined
                        ? undefined
                        : Boolean(componente.affectsPrice),
                    isDefault:
                      componente.isDefault === undefined
                        ? undefined
                        : Boolean(componente.isDefault),
                    nome: componente.nome,
                    preco:
                      componente.preco === undefined || componente.preco === null
                        ? undefined
                        : Number(componente.preco),
                    tipoItem: componente.tipoItem,
                    status: componente.status,
                    metadata:
                      componente.metadata && typeof componente.metadata === 'object'
                        ? componente.metadata
                        : undefined,
                  }))
                : undefined,
            }))
        : [];

      const produtosFormatados: Produto[] = [...itensCatalogo];

      if (produtosFormatados.length > 0) {
        // Atualizar cache
        this.produtosCache = produtosFormatados;
        this.produtosCacheTimestamp = Date.now();

        return produtosFormatados;
      }

      if (produtosAPI && produtosAPI.length > 0) {
        // Compatibilidade defensiva para payloads inesperados
        const fallbackFormatado: Produto[] = produtosAPI.map((produto: any) => ({
          id: produto.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          nome: produto.nome || 'Produto sem nome',
          preco: produto.preco || 0,
          categoria: produto.categoria || 'Geral',
          descricao: produto.descricao || '',
          unidade: produto.unidade || 'unidade',
          tipo: produto.tipo || 'produto',
          status: produto.status || 'ativo',
        }));

        // Atualizar cache
        this.produtosCache = fallbackFormatado;
        this.produtosCacheTimestamp = Date.now();

        return fallbackFormatado;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar produtos do backend:', error);
    } finally {
      this.isLoadingProdutos = false;
    }

    // Sem fallback mock: manter somente dados reais
    this.produtosCache = [];
    this.produtosCacheTimestamp = 0;
    return [];
  }

  private mapCliente(proposta: PropostaBasica): Cliente {
    if (proposta.cliente && typeof proposta.cliente === 'object') {
      return {
        id: proposta.cliente.id,
        nome: proposta.cliente.nome,
        documento: proposta.cliente.documento || '',
        email: proposta.cliente.email || '',
        telefone: proposta.cliente.telefone || '',
        endereco: (proposta.cliente as any)?.endereco || '',
        cidade: (proposta.cliente as any)?.cidade || '',
        estado: (proposta.cliente as any)?.estado || '',
        cep: (proposta.cliente as any)?.cep || '',
        tipoPessoa: (proposta.cliente as any)?.tipoPessoa || 'fisica',
      };
    }

    return {
      id: 'cliente_desconhecido',
      nome: typeof proposta.cliente === 'string' ? proposta.cliente : 'Cliente não informado',
      documento: '',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      tipoPessoa: 'fisica',
    };
  }

  private mapProdutos(proposta: PropostaBasica): ProdutoProposta[] {
    const propostaAny = proposta as any;
    const produtosOriginais = extrairItensComerciaisDaProposta(propostaAny);

    if (!Array.isArray(produtosOriginais) || produtosOriginais.length === 0) {
      return [];
    }

    return produtosOriginais.map((produto: any, index: number) => {
      if (!produto || typeof produto !== 'object') {
        return {
          produto: {
            id: `prod_${Date.now()}_${index}`,
            nome: 'Produto',
            preco: 0,
            categoria: 'Geral',
            unidade: 'unidade',
            descricao: '',
            tipo: 'produto',
            status: 'ativo',
            tipoItem: 'produto',
          },
          quantidade: 1,
          desconto: 0,
          subtotal: 0,
        };
      }

      const nestedProduto =
        produto?.produto && typeof produto.produto === 'object' ? produto.produto : null;
      const quantidadeRaw = Number(produto?.quantidade ?? nestedProduto?.quantidade ?? 1);
      const quantidade =
        Number.isFinite(quantidadeRaw) && quantidadeRaw > 0 ? quantidadeRaw : 1;
      const precoUnitarioRaw = Number(
        produto?.precoUnitario ??
          produto?.valorUnitario ??
          produto?.preco ??
          nestedProduto?.precoUnitario ??
          nestedProduto?.preco ??
          0,
      );
      const precoUnitario =
        Number.isFinite(precoUnitarioRaw) && precoUnitarioRaw > 0 ? precoUnitarioRaw : 0;
      const descontoRaw = Number(produto?.desconto ?? nestedProduto?.desconto ?? 0);
      const desconto = Number.isFinite(descontoRaw)
        ? Math.min(100, Math.max(0, descontoRaw))
        : 0;
      const subtotalComDesconto =
        quantidade * precoUnitario * (1 - desconto / 100);
      const subtotalInformado =
        produto?.subtotal ??
        produto?.valorTotal ??
        nestedProduto?.subtotal ??
        nestedProduto?.valorTotal;
      const subtotalNormalizado = Number(subtotalInformado);
      const componentes = Array.isArray(produto?.componentesPlano)
        ? (produto.componentesPlano as ProdutoComponentePlano[])
        : Array.isArray(produto?.componentes)
          ? (produto.componentes as ProdutoComponentePlano[])
          : Array.isArray(nestedProduto?.componentesPlano)
            ? (nestedProduto.componentesPlano as ProdutoComponentePlano[])
            : Array.isArray(nestedProduto?.componentes)
              ? (nestedProduto.componentes as ProdutoComponentePlano[])
              : undefined;
      const tipoItemRaw = String(
        produto?.tipoItem || nestedProduto?.tipoItem || nestedProduto?.tipo || 'produto',
      ).toLowerCase();
      const tipoItem: Produto['tipoItem'] =
        [
          'produto',
          'servico',
          'licenca',
          'modulo',
          'plano',
          'aplicativo',
          'peca',
          'acessorio',
          'pacote',
          'garantia',
        ].includes(tipoItemRaw)
          ? (tipoItemRaw as Produto['tipoItem'])
          : 'produto';

      return {
        produto: {
          id:
            produto?.id ||
            produto?.produtoId ||
            produto?.itemId ||
            nestedProduto?.id ||
            `prod_${Date.now()}_${index}`,
          nome: produto?.nome || produto?.produtoNome || nestedProduto?.nome || 'Produto',
          preco: precoUnitario,
          categoria: produto?.categoria || nestedProduto?.categoria || 'Geral',
          subcategoria: produto?.subcategoria || nestedProduto?.subcategoria || undefined,
          tipo:
            produto?.tipo === 'combo' || nestedProduto?.tipo === 'combo' ? 'combo' : 'produto',
          unidade: produto?.unidade || nestedProduto?.unidade || 'unidade',
          descricao: produto?.descricao || nestedProduto?.descricao || '',
          status: produto?.status || nestedProduto?.status || 'ativo',
          tipoItem,
          componentes,
          produtosCombo: Array.isArray(produto?.produtosCombo)
            ? produto.produtosCombo
            : Array.isArray(nestedProduto?.produtosCombo)
              ? nestedProduto.produtosCombo
              : undefined,
        },
        quantidade,
        desconto: Number.isFinite(desconto) ? desconto : 0,
        subtotal: Number.isFinite(subtotalNormalizado)
          ? subtotalNormalizado
          : Number.isFinite(subtotalComDesconto)
            ? subtotalComDesconto
            : 0,
      };
    });
  }

  private mapVendedor(proposta: PropostaBasica): Vendedor {
    if (proposta.vendedor && typeof proposta.vendedor === 'object') {
      return {
        id: proposta.vendedor.id,
        nome: proposta.vendedor.nome,
        email: proposta.vendedor.email,
        telefone: (proposta.vendedor as any)?.telefone || '',
        tipo: (proposta.vendedor as any)?.tipo || 'vendedor',
        ativo: (proposta.vendedor as any)?.ativo ?? true,
      };
    }

    if (typeof proposta.vendedor === 'string' && isUuid(proposta.vendedor)) {
      return {
        id: proposta.vendedor,
        nome: 'Vendedor nao informado',
        email: '',
        telefone: '',
        tipo: 'vendedor',
        ativo: true,
      };
    }

    return {
      id: '',
      nome: typeof proposta.vendedor === 'string' ? proposta.vendedor : 'Vendedor não informado',
      email: '',
      telefone: '',
      tipo: 'vendedor',
      ativo: true,
    };
  }

  private mapPropostaBasica(proposta: PropostaBasica): PropostaCompleta {
    const propostaAny = proposta as any;
    const cliente = this.mapCliente(proposta);
    const produtos = this.mapProdutos(proposta);
    const vendedor = this.mapVendedor(proposta);
    const criadaEmFonte =
      propostaAny.criadaEm ||
      propostaAny.createdAt ||
      propostaAny.criadoEm ||
      propostaAny.dataCriacao ||
      propostaAny.data_criacao;
    const atualizadaEmFonte =
      propostaAny.atualizadaEm ||
      propostaAny.updatedAt ||
      propostaAny.atualizadoEm ||
      propostaAny.dataAtualizacao ||
      propostaAny.data_atualizacao;
    const criadaEmDate = criadaEmFonte ? new Date(criadaEmFonte) : null;
    const atualizadaEmDate = atualizadaEmFonte ? new Date(atualizadaEmFonte) : null;
    const subtotalItens = produtos.reduce(
      (acumulado, item) => acumulado + this.toFiniteNumber(item?.subtotal, 0),
      0,
    );
    const descontoGlobal = this.toFiniteNumber(
      propostaAny.descontoGlobal ?? propostaAny.desconto_global,
      0,
    );
    const impostos = this.toFiniteNumber(
      propostaAny.impostos ?? propostaAny.imposto ?? propostaAny.taxaImpostos,
      0,
    );
    const subtotalInformado = this.toFiniteNumber(
      propostaAny.subtotal ?? propostaAny.valorSubtotal,
      Number.NaN,
    );
    const subtotal = Number.isFinite(subtotalInformado) ? subtotalInformado : subtotalItens;
    const totalInformado = this.toFiniteNumber(
      propostaAny.total ?? propostaAny.valor ?? propostaAny.valorTotal,
      Number.NaN,
    );
    const descontoPercentual = Math.min(100, Math.max(0, descontoGlobal));
    const impostosPercentual = Math.min(100, Math.max(0, impostos));
    const subtotalComDesconto = subtotal * (1 - descontoPercentual / 100);
    const totalCalculado = subtotalComDesconto * (1 + impostosPercentual / 100);
    const total = Number.isFinite(totalInformado) ? totalInformado : totalCalculado;
    const parcelasRaw =
      propostaAny.parcelas ?? propostaAny.qtdParcelas ?? propostaAny.qtd_parcelas;
    const validadeDiasRaw = Number(propostaAny.validadeDias ?? propostaAny.validade_dias ?? 30);
    const validadeDias =
      Number.isFinite(validadeDiasRaw) && validadeDiasRaw > 0 ? validadeDiasRaw : 30;

    return {
      id: propostaAny.id,
      numero: propostaAny.numero,
      oportunidade: propostaAny.oportunidade
        ? {
            id: String(propostaAny.oportunidade.id || '').trim(),
            titulo: propostaAny.oportunidade.titulo || 'Oportunidade vinculada',
            estagio: propostaAny.oportunidade.estagio || '',
            valor: Number(propostaAny.oportunidade.valor || 0),
          }
        : undefined,
      isPropostaPrincipal: Boolean(propostaAny.isPropostaPrincipal),
      titulo: propostaAny.titulo || propostaAny.numero || cliente.nome || 'Proposta Comercial',
      status: (propostaAny.status as any) || 'rascunho',
      motivoPerda: propostaAny.motivoPerda || undefined,
      cliente,
      vendedor,
      produtos,
      descontoGlobal,
      impostos,
      formaPagamento:
        (propostaAny.formaPagamento as any) ||
        (propostaAny.forma_pagamento as any) ||
        'avista',
      parcelas:
        parcelasRaw != null && parcelasRaw !== ''
          ? Number(parcelasRaw)
          : undefined,
      validadeDias,
      observacoes: propostaAny.observacoes || propostaAny.descricao || '',
      incluirImpostosPDF:
        propostaAny.incluirImpostosPDF ?? propostaAny.incluir_impostos_pdf ?? true,
      subtotal,
      total,
      dataValidade: propostaAny.dataVencimento
        ? new Date(propostaAny.dataVencimento)
        : new Date(Date.now() + validadeDias * 24 * 60 * 60 * 1000),
      aprovacaoInterna: propostaAny.aprovacaoInterna || propostaAny.emailDetails?.aprovacaoInterna,
      lembretes: Array.isArray(propostaAny.lembretes)
        ? propostaAny.lembretes
        : Array.isArray(propostaAny.emailDetails?.lembretes)
          ? propostaAny.emailDetails.lembretes
          : [],
      historicoEventos: Array.isArray(propostaAny.historicoEventos)
        ? propostaAny.historicoEventos
        : Array.isArray(propostaAny.emailDetails?.historicoEventos)
          ? propostaAny.emailDetails.historicoEventos
          : [],
      versoes: Array.isArray(propostaAny.versoes)
        ? propostaAny.versoes
        : Array.isArray(propostaAny.emailDetails?.versoes)
          ? propostaAny.emailDetails.versoes
          : [],
      criadaEm:
        criadaEmDate && Number.isFinite(criadaEmDate.getTime()) ? criadaEmDate : undefined,
      atualizadaEm:
        atualizadaEmDate && Number.isFinite(atualizadaEmDate.getTime())
          ? atualizadaEmDate
          : undefined,
      tokenPortal:
        typeof propostaAny.tokenPortal === 'string' && propostaAny.tokenPortal.trim()
          ? propostaAny.tokenPortal.trim()
          : undefined,
    };
  }

  // Método para obter clientes do sistema
  async obterClientes(): Promise<Cliente[]> {
    try {
      const { clientesService } = await import('../../../services/clientesService');

      // Usar o método correto para buscar clientes
      const clientesData = await clientesService.getClientes({ page: 1, limit: 1000 });

      if (clientesData?.data && clientesData.data.length > 0) {
        const clientesFormatados: Cliente[] = clientesData.data.map((cliente: any) => ({
          id: cliente.id || `cli_${Date.now()}`,
          nome: cliente.nome || 'Cliente sem nome',
          documento: cliente.documento || '',
          email: cliente.email || '',
          telefone: cliente.telefone || '',
          endereco: cliente.endereco || '',
          cidade: cliente.cidade || '',
          estado: cliente.estado || '',
          cep: cliente.cep || '',
          tipoPessoa: cliente.tipo === 'pessoa_fisica' ? 'fisica' : 'juridica',
        }));

        return clientesFormatados;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar clientes do backend:', error);
    }

    return [];
  }

  // Método para obter vendedores do sistema com cache
  async obterVendedores(): Promise<Vendedor[]> {
    try {
      // Verificar se temos cache válido
      const now = Date.now();
      const isCacheValid =
        this.vendedoresCache && now - this.vendedoresCacheTimestamp < this.CACHE_DURATION;

      if (isCacheValid) {
        return this.vendedoresCache!;
      }

      // Se já está carregando, aguardar um pouco para evitar múltiplas requisições simultâneas
      if (this.isLoadingVendedores) {
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Verificar se o cache foi atualizado enquanto esperava
        if (
          this.vendedoresCache &&
          Date.now() - this.vendedoresCacheTimestamp < this.CACHE_DURATION
        ) {
          return this.vendedoresCache;
        }
      }

      this.isLoadingVendedores = true;

      // Como não temos vendedoresService, vamos usar usuários como vendedores
      const { usuariosService } = await import('../../../services/usuariosService');

      // Adicionar timeout para evitar loading infinito
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao carregar vendedores')), 8000);
      });

      // Filtrar apenas usuários ativos com timeout
      const usuariosResult = await Promise.race([
        usuariosService.listarUsuarios({ ativo: true, limite: 1000 }),
        timeoutPromise,
      ]);

      const usuariosData = Array.isArray(usuariosResult)
        ? usuariosResult
        : (usuariosResult?.usuarios ?? []);

      if (usuariosData && usuariosData.length > 0) {
        const vendedoresFormatados: Vendedor[] = usuariosData
          .filter((usuario: any) => usuario.ativo === true) // Dupla verificação
          .map((usuario: any) => ({
            id: usuario.id || `vend_${Date.now()}`,
            nome: usuario.nome || usuario.name || 'Vendedor sem nome',
            email: usuario.email || '',
            telefone: usuario.telefone || '',
            tipo: 'vendedor',
            ativo: true, // Já filtrado, então todos são ativos
          }));

        const vendedoresComFallback = this.mergeVendedoresComFallback(vendedoresFormatados);

        // Atualizar cache
        this.vendedoresCache = vendedoresComFallback;
        this.vendedoresCacheTimestamp = Date.now();

        return vendedoresComFallback;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar vendedores do backend:', error);
    } finally {
      this.isLoadingVendedores = false;
    }

    // Sem fallback mock: manter somente dados reais
    this.vendedoresCache = this.mergeVendedoresComFallback([]);
    this.vendedoresCacheTimestamp = Date.now();
    return this.vendedoresCache;
  }

  // Gerar título automático para proposta
  gerarTituloAutomatico(cliente: Cliente | null): string {
    if (!cliente) {
      return 'Nova Proposta Comercial';
    }

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    return `${cliente.nome} - ${dataAtual}`;
  }

  private buildPropostaPayload(dados: PropostaCompleta) {
    const valorTotal = this.toFiniteNumber(dados.total, 0);
    const descontoGlobal = this.toFiniteNumber(dados.descontoGlobal, 0);
    const impostos = this.toFiniteNumber(dados.impostos, 0);
    const validadeDias = this.toInteger(dados.validadeDias, 30, { min: 1, max: 3650 });
    const parcelas =
      dados.formaPagamento === 'parcelado'
        ? this.toInteger(dados.parcelas, 1, { min: 1, max: 24 })
        : undefined;
    const subtotal = this.toFiniteNumber(
      dados.subtotal,
      (dados.produtos || []).reduce((acc, produto) => {
        const quantidade = this.toInteger(produto.quantidade, 1, { min: 1 });
        const preco = this.toFiniteNumber(produto.produto.preco, 0);
        const descontoItem = Math.min(
          100,
          Math.max(
            0,
            this.toFiniteNumber(
              produto.desconto ?? (produto.produto as Produto | undefined)?.desconto,
              0,
            ),
          ),
        );
        return acc + quantidade * preco * (1 - descontoItem / 100);
      }, 0),
    );
    const clientePayload = dados.cliente
      ? {
          id: dados.cliente.id,
          nome: dados.cliente.nome || 'Cliente nao informado',
          email: dados.cliente.email || '',
          telefone: dados.cliente.telefone || '',
          documento: dados.cliente.documento || '',
          endereco: dados.cliente.endereco || '',
          cidade: dados.cliente.cidade || '',
          estado: dados.cliente.estado || '',
          cep: dados.cliente.cep || '',
          tipoPessoa: dados.cliente.tipoPessoa || 'fisica',
        }
      : undefined;
    const vendedorPayload = dados.vendedor
      ? isUuid(dados.vendedor.id)
        ? {
            id: dados.vendedor.id.trim(),
            nome: dados.vendedor.nome || '',
            email: dados.vendedor.email || '',
            telefone: dados.vendedor.telefone || '',
            tipo: dados.vendedor.tipo || 'vendedor',
            ativo: dados.vendedor.ativo ?? true,
          }
        : undefined
      : undefined;
    const vendedorNomeFallback =
      dados.vendedor?.nome && dados.vendedor.nome.trim() ? dados.vendedor.nome.trim() : undefined;
    const vendedorId =
      dados.vendedor?.id && isUuid(dados.vendedor.id) ? dados.vendedor.id.trim() : undefined;

    return {
      titulo: dados.titulo || this.gerarTituloAutomatico(dados.cliente),
      cliente: clientePayload || dados.cliente?.nome || 'Cliente nao informado',
      clienteId: dados.cliente?.id,
      oportunidadeId: dados.oportunidade?.id,
      subtotal,
      total: valorTotal,
      valor: valorTotal,
      observacoes: dados.observacoes || '',
      vendedor: vendedorPayload || vendedorNomeFallback || '',
      vendedorId,
      formaPagamento: dados.formaPagamento || 'avista',
      parcelas,
      validadeDias,
      descontoGlobal,
      impostos,
      incluirImpostosPDF: dados.incluirImpostosPDF ?? false,
      status: dados.status || 'rascunho',
      produtos:
        dados.produtos?.map((produto) => {
          const quantidade = this.toInteger(produto.quantidade, 1, { min: 1 });
          const precoUnitario = this.toFiniteNumber(produto.produto.preco, 0);
          const descontoItem = Math.min(
            100,
            Math.max(
              0,
              this.toFiniteNumber(
                produto.desconto ?? (produto.produto as Produto | undefined)?.desconto,
                0,
              ),
            ),
          );

          return {
            id: produto.produto.id,
            produtoId: produto.produto.id,
            nome: produto.produto.nome,
            tipo: produto.produto.tipo || 'produto',
            status: produto.produto.status || 'ativo',
            categoria: produto.produto.categoria || 'Geral',
            descricao: produto.produto.descricao || '',
            unidade: produto.produto.unidade || 'unidade',
            tipoItem: produto.produto.tipoItem || 'produto',
            quantidade,
            precoUnitario,
            desconto: descontoItem,
            subtotal: quantidade * precoUnitario * (1 - descontoItem / 100),
            produtosCombo:
              produto.produto.tipo === 'combo' && Array.isArray(produto.produto.produtosCombo)
                ? produto.produto.produtosCombo.map((itemCombo) => ({
                    id: itemCombo.id,
                    nome: itemCombo.nome,
                    status: itemCombo.status || 'ativo',
                    categoria: itemCombo.categoria || 'Geral',
                    descricao: itemCombo.descricao || '',
                    unidade: itemCombo.unidade || 'unidade',
                    tipoItem: itemCombo.tipoItem || 'produto',
                    precoUnitario: Number(itemCombo.preco || 0),
                  }))
                : undefined,
            componentesPlano:
              produto.produto.tipoItem === 'plano' && Array.isArray(produto.produto.componentes)
                ? produto.produto.componentes.map((componente) => ({
                    childItemId: componente.childItemId,
                    componentRole: componente.componentRole || 'included',
                    quantity:
                      componente.quantity === undefined || componente.quantity === null
                        ? 1
                        : Number(componente.quantity),
                    sortOrder:
                      componente.sortOrder === undefined || componente.sortOrder === null
                        ? undefined
                        : Number(componente.sortOrder),
                    affectsPrice:
                      componente.affectsPrice === undefined
                        ? undefined
                        : Boolean(componente.affectsPrice),
                    isDefault:
                      componente.isDefault === undefined
                        ? undefined
                        : Boolean(componente.isDefault),
                    nome: componente.nome || '',
                    preco:
                      componente.preco === undefined || componente.preco === null
                        ? undefined
                        : Number(componente.preco),
                    tipoItem: componente.tipoItem,
                    status: componente.status,
                    metadata:
                      componente.metadata && typeof componente.metadata === 'object'
                        ? componente.metadata
                        : undefined,
                  }))
                : undefined,
          };
        }) || [],
    };
  }

  // Criar nova proposta usando API real
  async criarProposta(dados: PropostaCompleta): Promise<PropostaCompleta> {
    try {
      const dadosParaBackend = this.buildPropostaPayload(dados);

      const propostaSalva = await sharedPropostasService.create(dadosParaBackend as unknown as any);

      sharedPropostasService.clearCache();

      return this.mapPropostaBasica({
        ...propostaSalva,
        cliente: propostaSalva.cliente || dadosParaBackend.cliente,
      } as PropostaBasica);
    } catch (error) {
      console.error('Erro ao criar proposta:', error);
      throw new Error('Nao foi possivel criar a proposta. Tente novamente.');
    }
  }

  async atualizarProposta(id: string, dados: PropostaCompleta): Promise<PropostaCompleta> {
    try {
      const dadosParaBackend = this.buildPropostaPayload(dados);
      const propostaAtualizada = await sharedPropostasService.update(
        id,
        dadosParaBackend as unknown as any,
      );

      sharedPropostasService.clearCache();

      return this.mapPropostaBasica({
        ...propostaAtualizada,
        cliente: propostaAtualizada.cliente || dadosParaBackend.cliente,
      } as PropostaBasica);
    } catch (error) {
      console.error('Erro ao atualizar proposta:', error);
      throw new Error('Nao foi possivel atualizar a proposta. Tente novamente.');
    }
  }

  // Listar propostas usando API real
  async listarPropostas(): Promise<PropostaCompleta[]> {
    try {
      const propostas = await sharedPropostasService.findAll();

      if (!Array.isArray(propostas) || propostas.length === 0) {
        return [];
      }

      return propostas.map((prop) => this.mapPropostaBasica(prop));
    } catch (error) {
      console.error('❌ Erro ao listar propostas:', error);
      return [];
    }
  }

  // Obter proposta específica usando API real
  async obterProposta(id: string): Promise<PropostaCompleta | null> {
    try {
      const proposta = await sharedPropostasService.findById(id);

      if (!proposta) {
        return null;
      }

      return this.mapPropostaBasica(proposta);
    } catch (error) {
      console.error(`❌ Erro ao obter proposta ${id}:`, error);
      return null;
    }
  }

  // Remover proposta usando API real
  async removerProposta(id: string): Promise<boolean> {
    try {
      await sharedPropostasService.delete(id);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao remover proposta ${id}:`, error);
      return false;
    }
  }

  // Atualizar status de proposta
  async atualizarStatus(
    id: string,
    novoStatus: string,
    metadata?: { source?: string; observacoes?: string; motivoPerda?: string },
  ): Promise<PropostaCompleta | null> {
    try {
      const propostaAtualizada = await sharedPropostasService.updateStatus(
        id,
        novoStatus as PropostaBasica['status'],
        metadata,
      );

      return this.mapPropostaBasica(propostaAtualizada);
    } catch (error) {
      console.error(`❌ Erro ao atualizar status da proposta ${id}:`, error);
      return null;
    }
  }

  async definirComoPrincipal(id: string): Promise<PropostaCompleta | null> {
    try {
      const propostaAtualizada = await sharedPropostasService.definirComoPrincipal(id);
      return this.mapPropostaBasica(propostaAtualizada);
    } catch (error) {
      console.error(`Erro ao definir proposta principal ${id}:`, error);
      return null;
    }
  }

  // Estatísticas das propostas (calculadas do backend)
  async obterEstatisticas() {
    try {
      try {
        const dadosBackend = await sharedPropostasService.getEstatisticas();
        if (dadosBackend && typeof dadosBackend === 'object') {
          return {
            ...dadosBackend,
            motivosPerdaTop: Array.isArray((dadosBackend as any).motivosPerdaTop)
              ? (dadosBackend as any).motivosPerdaTop
              : [],
            conversaoPorVendedor: Array.isArray((dadosBackend as any).conversaoPorVendedor)
              ? (dadosBackend as any).conversaoPorVendedor
              : [],
            conversaoPorProduto: Array.isArray((dadosBackend as any).conversaoPorProduto)
              ? (dadosBackend as any).conversaoPorProduto
              : [],
            aprovacoesPendentes: Number((dadosBackend as any).aprovacoesPendentes || 0),
            followupsPendentes: Number((dadosBackend as any).followupsPendentes || 0),
            propostasComVersao: Number((dadosBackend as any).propostasComVersao || 0),
            mediaVersoesPorProposta: Number((dadosBackend as any).mediaVersoesPorProposta || 0),
            revisoesUltimos7Dias: Number((dadosBackend as any).revisoesUltimos7Dias || 0),
            usoItensVsCombos: this.normalizeUsoItensVsCombos(
              (dadosBackend as any).usoItensVsCombos,
            ),
          };
        }
      } catch (backendError) {
        console.warn('Falha ao obter estatisticas do backend, usando calculo local.');
      }

      const propostas = await this.listarPropostas();
      const statusGanho = new Set([
        'aprovada',
        'contrato_gerado',
        'contrato_assinado',
        'fatura_criada',
        'aguardando_pagamento',
        'pago',
      ]);

      const totalPropostas = propostas.length;
      const valorTotalPipeline = propostas.reduce((sum, p) => sum + p.total, 0);
      const usoItensVsCombos = this.calcularUsoItensVsCombos(propostas);

      const propostasAprovadas = propostas.filter((p) => p.status === 'aprovada').length;
      const taxaConversao = totalPropostas > 0 ? (propostasAprovadas / totalPropostas) * 100 : 0;

      const estatisticasPorStatus: Record<string, number> = {};
      propostas.forEach((proposta) => {
        const status = proposta.status || 'rascunho';
        estatisticasPorStatus[status] = (estatisticasPorStatus[status] || 0) + 1;
      });

      const estatisticasPorVendedor: Record<string, number> = {};
      propostas.forEach((proposta) => {
        const vendedor = proposta.vendedor?.nome || 'Sem vendedor';
        estatisticasPorVendedor[vendedor] = (estatisticasPorVendedor[vendedor] || 0) + 1;
      });

      const motivosPerdaMap: Record<string, number> = {};
      const vendedorMap: Record<string, { total: number; ganhas: number; perdidas: number }> = {};
      const produtoMap: Record<string, { total: number; ganhas: number; perdidas: number }> = {};
      let aprovacoesPendentes = 0;
      let followupsPendentes = 0;
      let propostasComVersao = 0;
      let totalVersoes = 0;
      let revisoesUltimos7Dias = 0;
      const limiteRevisaoRecente = Date.now() - 7 * 24 * 60 * 60 * 1000;

      propostas.forEach((proposta: any) => {
        const vendedor = proposta.vendedor?.nome || 'Sem vendedor';
        if (!vendedorMap[vendedor]) {
          vendedorMap[vendedor] = { total: 0, ganhas: 0, perdidas: 0 };
        }

        vendedorMap[vendedor].total += 1;
        if (statusGanho.has(proposta.status || '')) {
          vendedorMap[vendedor].ganhas += 1;
        }
        if (proposta.status === 'rejeitada') {
          vendedorMap[vendedor].perdidas += 1;
          const motivo = (proposta.motivoPerda || '').trim() || 'Nao informado';
          motivosPerdaMap[motivo] = (motivosPerdaMap[motivo] || 0) + 1;
        }

        (proposta.produtos || []).forEach((item: any) => {
          const nomeProduto = item?.produto?.nome || item?.nome || 'Produto nao informado';
          if (!produtoMap[nomeProduto]) {
            produtoMap[nomeProduto] = { total: 0, ganhas: 0, perdidas: 0 };
          }
          produtoMap[nomeProduto].total += 1;
          if (statusGanho.has(proposta.status || '')) {
            produtoMap[nomeProduto].ganhas += 1;
          }
          if (proposta.status === 'rejeitada') {
            produtoMap[nomeProduto].perdidas += 1;
          }
        });

        if (proposta.aprovacaoInterna?.status === 'pendente') {
          aprovacoesPendentes += 1;
        }
        followupsPendentes += (proposta.lembretes || []).filter(
          (lembrete: any) => lembrete?.status === 'agendado',
        ).length;

        const versoes = Array.isArray((proposta as any).versoes)
          ? (proposta as any).versoes
          : Array.isArray((proposta as any).emailDetails?.versoes)
            ? (proposta as any).emailDetails.versoes
            : [];
        const quantidadeVersoes = versoes.length;
        if (quantidadeVersoes > 1) {
          propostasComVersao += 1;
        }
        totalVersoes += Math.max(quantidadeVersoes, 1);

        const possuiRevisaoRecente = versoes.some((versao: any) => {
          const timestamp = new Date(versao?.criadaEm || versao?.timestamp || '').getTime();
          return Number.isFinite(timestamp) && timestamp >= limiteRevisaoRecente;
        });
        if (possuiRevisaoRecente) {
          revisoesUltimos7Dias += 1;
        }
      });

      const motivosPerdaTop = Object.entries(motivosPerdaMap)
        .map(([motivo, quantidade]) => ({ motivo, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 10);

      const conversaoPorVendedor = Object.entries(vendedorMap)
        .map(([vendedor, dados]) => ({
          vendedor,
          total: dados.total,
          ganhas: dados.ganhas,
          perdidas: dados.perdidas,
          taxaConversao: dados.total > 0 ? Math.round((dados.ganhas / dados.total) * 10000) / 100 : 0,
        }))
        .sort((a, b) => b.total - a.total);

      const conversaoPorProduto = Object.entries(produtoMap)
        .map(([produto, dados]) => ({
          produto,
          total: dados.total,
          ganhas: dados.ganhas,
          perdidas: dados.perdidas,
          taxaConversao: dados.total > 0 ? Math.round((dados.ganhas / dados.total) * 10000) / 100 : 0,
        }))
        .sort((a, b) => b.total - a.total);

      return {
        totalPropostas,
        valorTotalPipeline,
        taxaConversao: Math.round(taxaConversao * 100) / 100,
        propostasAprovadas,
        estatisticasPorStatus,
        estatisticasPorVendedor,
        motivosPerdaTop,
        conversaoPorVendedor,
        conversaoPorProduto,
        aprovacoesPendentes,
        followupsPendentes,
        propostasComVersao,
        mediaVersoesPorProposta:
          totalPropostas > 0 ? Math.round((totalVersoes / totalPropostas) * 100) / 100 : 0,
        revisoesUltimos7Dias,
        usoItensVsCombos,
      };
    } catch (error) {
      console.error('Erro ao calcular estatisticas:', error);
      return {
        totalPropostas: 0,
        valorTotalPipeline: 0,
        taxaConversao: 0,
        propostasAprovadas: 0,
        estatisticasPorStatus: {},
        estatisticasPorVendedor: {},
        motivosPerdaTop: [],
        conversaoPorVendedor: [],
        conversaoPorProduto: [],
        aprovacoesPendentes: 0,
        followupsPendentes: 0,
        propostasComVersao: 0,
        mediaVersoesPorProposta: 0,
        revisoesUltimos7Dias: 0,
        usoItensVsCombos: this.normalizeUsoItensVsCombos(null),
      };
    }
  }
  // Verificar status da conexão com o backend
  async verificarConexao(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('❌ Erro de conexão com backend:', error);
      return false;
    }
  }

  // Métodos adicionais para compatibilidade com o frontend existente

  // Clonar uma proposta existente
  async clonarProposta(id: string): Promise<PropostaCompleta | null> {
    try {
      const propostaOriginal = await this.obterProposta(id);
      if (!propostaOriginal) {
        throw new Error('Proposta original não encontrada');
      }

      // Criar nova proposta baseada na original
      const propostaClone: PropostaCompleta = {
        ...propostaOriginal,
        id: undefined,
        numero: undefined,
        titulo: `${propostaOriginal.titulo} (Cópia)`,
        status: 'rascunho',
        criadaEm: undefined,
        atualizadaEm: undefined,
      };

      // Preparar dados para o backend
      const dadosParaBackend = {
        titulo: propostaClone.titulo,
        cliente: propostaClone.cliente?.nome || 'Cliente não informado',
        valor: propostaClone.total,
        observacoes: propostaClone.observacoes || '',
        vendedor: propostaClone.vendedor?.nome || '',
        formaPagamento: propostaClone.formaPagamento || 'avista',
        validadeDias: propostaClone.validadeDias || 30,
      };

      const novaProposta = await sharedPropostasService.create(dadosParaBackend as unknown as any);

      sharedPropostasService.clearCache();

      return this.mapPropostaBasica(novaProposta);
    } catch (error) {
      console.error(`❌ Erro ao clonar proposta ${id}:`, error);
      return null;
    }
  }

  // Obter vendedor atual
  async obterVendedorAtual(): Promise<Vendedor | null> {
    try {
      // Verificar se temos cache válido para vendedor atual
      const now = Date.now();
      const isCacheValid =
        this.vendedorAtualCache && now - this.vendedorAtualCacheTimestamp < this.CACHE_DURATION;

      if (isCacheValid) {
        return this.vendedorAtualCache;
      }

      // Timeout para evitar loading infinito
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao obter vendedor atual')), 3000);
      });

      const vendedorLogado = this.getVendedorLogadoFallback();
      const vendedores = await Promise.race([this.obterVendedores(), timeoutPromise]);
      const vendedoresComFallback = this.mergeVendedoresComFallback(vendedores);

      const vendedorAtual = vendedorLogado
        ? vendedoresComFallback.find((item) => item.id === vendedorLogado.id) || vendedorLogado
        : vendedoresComFallback.length > 0
          ? vendedoresComFallback[0]
          : null;

      // Atualizar cache do vendedor atual
      this.vendedorAtualCache = vendedorAtual;
      this.vendedorAtualCacheTimestamp = Date.now();

      return vendedorAtual;
    } catch (error) {
      console.error('❌ Erro ao obter vendedor atual:', error);
      return this.getVendedorLogadoFallback();
    }
  }

  // Método para limpar todos os caches (útil em atualizações)
  limparCacheCompleto(): void {
    this.vendedoresCache = null;
    this.vendedoresCacheTimestamp = 0;
    this.vendedorAtualCache = null;
    this.vendedorAtualCacheTimestamp = 0;
    this.produtosCache = null;
    this.produtosCacheTimestamp = 0;
    this.isLoadingVendedores = false;
    this.isLoadingProdutos = false;
  }

  // Método para limpar cache de vendedores apenas (compatibilidade)
  limparCacheVendedores(): void {
    this.vendedoresCache = null;
    this.vendedoresCacheTimestamp = 0;
    this.vendedorAtualCache = null;
    this.vendedorAtualCacheTimestamp = 0;
    this.isLoadingVendedores = false;
  }

  // Preview de proposta (mock para compatibilidade)
  async previewProposta(dadosJson: string): Promise<{ html: string }> {
    try {
      const dados = JSON.parse(dadosJson);
      const html = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h2>Preview da Proposta</h2>
          <p><strong>Título:</strong> ${dados.titulo || 'Sem título'}</p>
          <p><strong>Cliente:</strong> ${dados.cliente?.nome || 'Cliente não informado'}</p>
          <p><strong>Valor:</strong> R$ ${(dados.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p><strong>Observações:</strong> ${dados.observacoes || 'Nenhuma observação'}</p>
        </div>
      `;
      return { html };
    } catch (error) {
      console.error('❌ Erro no preview da proposta:', error);
      return { html: '<div>Erro ao gerar preview</div>' };
    }
  }

  // Métodos para ações em lote (mock para compatibilidade)
  async atualizarStatusEmLote(ids: string[], novoStatus: string): Promise<void> {
    for (const id of ids) {
      await this.atualizarStatus(id, novoStatus);
    }
  }

  async excluirEmLote(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.removerProposta(id);
    }
  }

  async enviarEmailEmLote(ids: string[]): Promise<void> {
    // Mock implementation - em produção, integraria com EmailService
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

export const propostasService = new PropostasService();
export type { PropostaCompleta, PropostaFormData, Cliente, Vendedor, Produto, ProdutoProposta };
