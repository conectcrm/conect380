import {
  propostasService as sharedPropostasService,
  Proposta as PropostaBasica,
} from '../../../services/propostasService';

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

interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  descricao?: string;
  unidade: string;
  tipo?: 'produto' | 'combo' | 'software';
  produtosCombo?: Produto[];
  precoOriginal?: number;
  desconto?: number;
  tipoItem?: 'produto' | 'servico' | 'licenca' | 'modulo' | 'aplicativo';
  tipoLicenciamento?: string;
  periodicidadeLicenca?: string;
  renovacaoAutomatica?: boolean;
  quantidadeLicencas?: number;
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

  // Método para obter produtos do sistema com cache
  async obterProdutos(): Promise<Produto[]> {
    try {
      // Verificar se temos cache válido
      const now = Date.now();
      const isCacheValid =
        this.produtosCache && now - this.produtosCacheTimestamp < this.CACHE_DURATION;

      if (isCacheValid) {
        return this.produtosCache!;
      }

      // Se já está carregando, aguardar um pouco para evitar múltiplas requisições simultâneas
      if (this.isLoadingProdutos) {
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Verificar se o cache foi atualizado enquanto esperava
        if (this.produtosCache && Date.now() - this.produtosCacheTimestamp < this.CACHE_DURATION) {
          return this.produtosCache;
        }
      }

      this.isLoadingProdutos = true;

      // Carregar produtos do backend
      const { produtosService } = await import('../../../services/produtosService');
      const produtosAPI = await produtosService.findAll();

      if (produtosAPI && produtosAPI.length > 0) {
        // Converter produtos da API para o formato de propostas
        const produtosFormatados: Produto[] = produtosAPI.map((produto: any) => ({
          id: produto.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          nome: produto.nome || 'Produto sem nome',
          preco: produto.preco || 0,
          categoria: produto.categoria || 'Geral',
          descricao: produto.descricao || '',
          unidade: produto.unidade || 'unidade',
          tipo: produto.tipo || 'produto',
        }));

        // Atualizar cache
        this.produtosCache = produtosFormatados;
        this.produtosCacheTimestamp = Date.now();

        return produtosFormatados;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar produtos do backend:', error);
    } finally {
      this.isLoadingProdutos = false;
    }

    // Sem fallback mock: manter somente dados reais
    this.produtosCache = [];
    this.produtosCacheTimestamp = Date.now();
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
    if (!Array.isArray(proposta.produtos)) {
      return [];
    }

    return proposta.produtos.map((produto: any) => ({
      produto: {
        id: produto.id || produto.produtoId || `prod_${Date.now()}`,
        nome: produto.nome || produto.produtoNome || 'Produto',
        preco: produto.precoUnitario || produto.preco || 0,
        categoria: produto.categoria || 'Geral',
        unidade: produto.unidade || 'unidade',
        descricao: produto.descricao || '',
        tipo: 'produto',
      },
      quantidade: produto.quantidade || 1,
      desconto: produto.desconto || 0,
      subtotal:
        produto.subtotal ||
        (produto.precoUnitario || produto.preco || 0) * (produto.quantidade || 1),
    }));
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

    return {
      id: 'vendedor_desconhecido',
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

    return {
      id: propostaAny.id,
      numero: propostaAny.numero,
      titulo: propostaAny.titulo || propostaAny.numero || cliente.nome || 'Proposta Comercial',
      status: (propostaAny.status as any) || 'rascunho',
      motivoPerda: propostaAny.motivoPerda || undefined,
      cliente,
      vendedor,
      produtos,
      descontoGlobal: propostaAny.descontoGlobal ?? 0,
      impostos: propostaAny.impostos ?? 0,
      formaPagamento: (propostaAny.formaPagamento as any) || 'avista',
      validadeDias: propostaAny.validadeDias ?? 30,
      observacoes: propostaAny.observacoes || '',
      incluirImpostosPDF: Boolean(propostaAny.incluirImpostosPDF),
      subtotal: propostaAny.subtotal ?? propostaAny.total ?? propostaAny.valor ?? 0,
      total: propostaAny.total ?? propostaAny.valor ?? 0,
      dataValidade: propostaAny.dataVencimento
        ? new Date(propostaAny.dataVencimento)
        : new Date(Date.now() + (propostaAny.validadeDias ?? 30) * 24 * 60 * 60 * 1000),
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
      criadaEm: propostaAny.criadaEm ? new Date(propostaAny.criadaEm) : new Date(),
      atualizadaEm: propostaAny.atualizadaEm ? new Date(propostaAny.atualizadaEm) : new Date(),
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

        // Atualizar cache
        this.vendedoresCache = vendedoresFormatados;
        this.vendedoresCacheTimestamp = Date.now();

        return vendedoresFormatados;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar vendedores do backend:', error);
    } finally {
      this.isLoadingVendedores = false;
    }

    // Sem fallback mock: manter somente dados reais
    this.vendedoresCache = [];
    this.vendedoresCacheTimestamp = Date.now();
    return [];
  }

  // Gerar título automático para proposta
  gerarTituloAutomatico(cliente: Cliente | null): string {
    if (!cliente) {
      return 'Nova Proposta Comercial';
    }

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    return `${cliente.nome} - ${dataAtual}`;
  }

  // Criar nova proposta usando API real
  async criarProposta(dados: PropostaCompleta): Promise<PropostaCompleta> {
    try {
      // Preparar dados para o backend
      const dadosParaBackend = {
        titulo: dados.titulo || this.gerarTituloAutomatico(dados.cliente),
        cliente: dados.cliente?.nome || 'Cliente não informado',
        clienteId: dados.cliente?.id,
        valor: dados.total,
        observacoes: dados.observacoes || '',
        vendedor: dados.vendedor?.nome || '',
        formaPagamento: dados.formaPagamento || 'avista',
        validadeDias: dados.validadeDias || 30,
        descontoGlobal: dados.descontoGlobal ?? 0,
        impostos: dados.impostos ?? 0,
        incluirImpostosPDF: dados.incluirImpostosPDF ?? false,
        produtos:
          dados.produtos?.map((produto) => ({
            id: produto.produto.id,
            produtoId: produto.produto.id,
            nome: produto.produto.nome,
            quantidade: produto.quantidade,
            precoUnitario: produto.produto.preco,
            desconto: produto.desconto || 0,
            subtotal:
              (Number(produto.quantidade || 0) || 0) *
              (Number(produto.produto.preco || 0) || 0) *
              (1 - (Number(produto.desconto || 0) || 0) / 100),
          })) || [],
      };

      const propostaSalva = await sharedPropostasService.create(dadosParaBackend as unknown as any);

      sharedPropostasService.clearCache();

      return this.mapPropostaBasica({
        ...propostaSalva,
        cliente: propostaSalva.cliente || dadosParaBackend.cliente,
      } as PropostaBasica);
    } catch (error) {
      console.error('❌ Erro ao criar proposta:', error);
      throw new Error('Não foi possível criar a proposta. Tente novamente.');
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

      const vendedores = await Promise.race([this.obterVendedores(), timeoutPromise]);

      const vendedorAtual = vendedores.length > 0 ? vendedores[0] : null;

      // Atualizar cache do vendedor atual
      this.vendedorAtualCache = vendedorAtual;
      this.vendedorAtualCacheTimestamp = Date.now();

      return vendedorAtual;
    } catch (error) {
      console.error('❌ Erro ao obter vendedor atual:', error);
      return null;
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

