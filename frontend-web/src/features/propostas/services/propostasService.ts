import { propostasService as sharedPropostasService, Proposta as PropostaBasica } from '../../../services/propostasService';

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
  status?: 'rascunho' | 'enviada' | 'aprovada' | 'rejeitada';
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
      const isCacheValid = this.produtosCache &&
        (now - this.produtosCacheTimestamp) < this.CACHE_DURATION;

      if (isCacheValid) {
        return this.produtosCache!;
      }

      // Se já está carregando, aguardar um pouco para evitar múltiplas requisições simultâneas
      if (this.isLoadingProdutos) {
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verificar se o cache foi atualizado enquanto esperava
        if (this.produtosCache && (Date.now() - this.produtosCacheTimestamp) < this.CACHE_DURATION) {
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
          tipo: produto.tipo || 'produto'
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

    // Fallback com produtos básicos se não conseguir carregar do backend
    const fallbackProdutos = [
      {
        id: 'prod1',
        nome: 'Produto Básico',
        preco: 100.00,
        categoria: 'Geral',
        descricao: 'Produto de exemplo',
        unidade: 'unidade',
        tipo: 'produto' as const
      }
    ];

    // Cache o fallback também
    this.produtosCache = fallbackProdutos;
    this.produtosCacheTimestamp = Date.now();

    return fallbackProdutos;
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
          tipoPessoa: cliente.tipo === 'pessoa_fisica' ? 'fisica' : 'juridica'
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
      const isCacheValid = this.vendedoresCache &&
        (now - this.vendedoresCacheTimestamp) < this.CACHE_DURATION;

      if (isCacheValid) {
        return this.vendedoresCache!;
      }

      // Se já está carregando, aguardar um pouco para evitar múltiplas requisições simultâneas
      if (this.isLoadingVendedores) {
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verificar se o cache foi atualizado enquanto esperava
        if (this.vendedoresCache && (Date.now() - this.vendedoresCacheTimestamp) < this.CACHE_DURATION) {
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
        timeoutPromise
      ]);

      const usuariosData = Array.isArray(usuariosResult)
        ? usuariosResult
        : usuariosResult?.usuarios ?? [];

      if (usuariosData && usuariosData.length > 0) {
        const vendedoresFormatados: Vendedor[] = usuariosData
          .filter((usuario: any) => usuario.ativo === true) // Dupla verificação
          .map((usuario: any) => ({
            id: usuario.id || `vend_${Date.now()}`,
            nome: usuario.nome || usuario.name || 'Vendedor sem nome',
            email: usuario.email || '',
            telefone: usuario.telefone || '',
            tipo: 'vendedor',
            ativo: true // Já filtrado, então todos são ativos
          }));

        // Atualizar cache
        this.vendedoresCache = vendedoresFormatados;
        this.vendedoresCacheTimestamp = Date.now();

        return vendedoresFormatados;
      } else {
        // Nenhum usuário ativo encontrado, utilizar fallback padrão
      }
    } catch (error) {
      console.error('❌ Erro ao carregar vendedores do backend:', error);
    } finally {
      this.isLoadingVendedores = false;
    }

    // Fallback: retornar pelo menos um vendedor padrão
    const fallbackVendedores = [
      {
        id: 'vend_default',
        nome: 'Vendedor Padrão',
        email: 'vendedor@empresa.com',
        telefone: '',
        tipo: 'vendedor' as const,
        ativo: true
      }
    ];

    // Cache o fallback também
    this.vendedoresCache = fallbackVendedores;
    this.vendedoresCacheTimestamp = Date.now();

    return fallbackVendedores;
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
        valor: dados.total,
        observacoes: dados.observacoes || '',
        vendedor: dados.vendedor?.nome || '',
        formaPagamento: dados.formaPagamento || 'avista',
        validadeDias: dados.validadeDias || 30
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosParaBackend)
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();

      // Converter resposta do backend para formato do frontend
      const propostaCriada: PropostaCompleta = {
        ...dados,
        id: result.proposta?.id || `prop_${Date.now()}`,
        numero: result.proposta?.numero || `PROP-${Date.now()}`,
        status: (result.proposta?.status as any) || 'rascunho',
        criadaEm: new Date(result.proposta?.createdAt || Date.now()),
        atualizadaEm: new Date(result.proposta?.updatedAt || Date.now())
      };

      sharedPropostasService.clearCache();

      return propostaCriada;

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

      const propostasFormatadas: PropostaCompleta[] = propostas.map((prop: PropostaBasica) => {
        const cliente: Cliente = prop.cliente ? {
          id: prop.cliente.id,
          nome: prop.cliente.nome,
          documento: prop.cliente.documento || '',
          email: prop.cliente.email || '',
          telefone: prop.cliente.telefone || '',
          endereco: prop.cliente.endereco || '',
          cidade: prop.cliente.cidade || '',
          estado: prop.cliente.estado || '',
          cep: (prop.cliente as any)?.cep || '',
          tipoPessoa: (prop.cliente as any)?.tipoPessoa || 'fisica'
        } : {
          id: 'cliente_desconhecido',
          nome: 'Cliente não informado',
          documento: '',
          email: '',
          telefone: '',
          endereco: '',
          cidade: '',
          estado: '',
          cep: '',
          tipoPessoa: 'fisica'
        };

        const produtos: ProdutoProposta[] = Array.isArray(prop.produtos)
          ? prop.produtos.map((produto: any) => ({
              produto: {
                id: produto.id || produto.produtoId || `prod_${Date.now()}`,
                nome: produto.nome || produto.produtoNome || 'Produto',
                preco: produto.precoUnitario || produto.preco || 0,
                categoria: produto.categoria || 'Geral',
                unidade: produto.unidade || 'unidade',
                descricao: produto.descricao || '',
                tipo: 'produto'
              },
              quantidade: produto.quantidade || 1,
              desconto: produto.desconto || 0,
              subtotal: produto.subtotal || (produto.precoUnitario || produto.preco || 0) * (produto.quantidade || 1)
            }))
          : [];

        return {
          id: prop.id,
          numero: prop.numero,
          titulo: prop.numero || prop.observacoes || cliente.nome || 'Proposta Comercial',
          status: (prop.status as any) || 'rascunho',
          cliente,
          vendedor: prop.vendedor ? {
            id: prop.vendedor.id,
            nome: prop.vendedor.nome,
            email: prop.vendedor.email,
            telefone: prop.vendedor.telefone,
            tipo: (prop.vendedor.tipo as any) || 'vendedor',
            ativo: prop.vendedor.ativo ?? true
          } : {
            id: 'vendedor_desconhecido',
            nome: prop.vendedor?.nome || 'Vendedor não informado',
            email: prop.vendedor?.email || '',
            telefone: prop.vendedor?.telefone || '',
            tipo: 'vendedor',
            ativo: true
          },
          produtos,
          descontoGlobal: prop.descontoGlobal ?? 0,
          impostos: prop.impostos ?? 0,
          formaPagamento: (prop.formaPagamento as any) || 'avista',
          validadeDias: prop.validadeDias ?? 30,
          observacoes: prop.observacoes || '',
          incluirImpostosPDF: Boolean(prop.incluirImpostosPDF),
          subtotal: prop.subtotal ?? prop.total ?? prop.valor ?? 0,
          total: prop.total ?? prop.valor ?? 0,
          dataValidade: prop.dataVencimento ? new Date(prop.dataVencimento) : new Date(Date.now() + (prop.validadeDias ?? 30) * 24 * 60 * 60 * 1000),
          criadaEm: prop.criadaEm ? new Date(prop.criadaEm) : (prop.atualizadaEm ? new Date(prop.atualizadaEm) : new Date()),
          atualizadaEm: prop.atualizadaEm ? new Date(prop.atualizadaEm) : new Date()
        };
      });

      return propostasFormatadas;

    } catch (error) {
      console.error('❌ Erro ao listar propostas:', error);
      return [];
    }
  }

  // Obter proposta específica usando API real
  async obterProposta(id: string): Promise<PropostaCompleta | null> {
    try {

      const response = await fetch(`${this.baseUrl}/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (!result.proposta) {
        return null;
      }

      const prop = result.proposta;

      // Converter proposta do backend para formato do frontend
      const propostaFormatada: PropostaCompleta = {
        id: prop.id,
        numero: prop.numero,
        titulo: prop.titulo,
        status: prop.status,
        cliente: { nome: prop.cliente } as Cliente,
        vendedor: { nome: prop.vendedor || 'N/A' } as Vendedor,
        produtos: [],
        descontoGlobal: 0,
        impostos: 0,
        formaPagamento: (prop.formaPagamento as any) || 'avista',
        validadeDias: prop.validadeDias || 30,
        observacoes: prop.observacoes || '',
        incluirImpostosPDF: false,
        subtotal: prop.valor || 0,
        total: prop.valor || 0,
        dataValidade: new Date(Date.now() + (prop.validadeDias || 30) * 24 * 60 * 60 * 1000),
        criadaEm: new Date(prop.createdAt),
        atualizadaEm: new Date(prop.updatedAt)
      };

      return propostaFormatada;

    } catch (error) {
      console.error(`❌ Erro ao obter proposta ${id}:`, error);
      return null;
    }
  }

  // Remover proposta usando API real
  async removerProposta(id: string): Promise<boolean> {
    try {

      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();

      sharedPropostasService.clearCache();

      return true;

    } catch (error) {
      console.error(`❌ Erro ao remover proposta ${id}:`, error);
      return false;
    }
  }

  // Atualizar status de proposta
  async atualizarStatus(id: string, novoStatus: string): Promise<PropostaCompleta | null> {
    try {

      const response = await fetch(`${this.baseUrl}/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: novoStatus })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();

      sharedPropostasService.clearCache();

      // Retornar proposta atualizada
      return await this.obterProposta(id);

    } catch (error) {
      console.error(`❌ Erro ao atualizar status da proposta ${id}:`, error);
      return null;
    }
  }

  // Estatísticas das propostas (calculadas do backend)
  async obterEstatisticas() {
    try {
      const propostas = await this.listarPropostas();

      const totalPropostas = propostas.length;
      const valorTotalPipeline = propostas.reduce((sum, p) => sum + p.total, 0);

      const propostasAprovadas = propostas.filter(p => p.status === 'aprovada').length;
      const taxaConversao = totalPropostas > 0 ? (propostasAprovadas / totalPropostas) * 100 : 0;

      const estatisticasPorStatus: Record<string, number> = {};
      propostas.forEach(proposta => {
        const status = proposta.status || 'rascunho';
        estatisticasPorStatus[status] = (estatisticasPorStatus[status] || 0) + 1;
      });

      const estatisticasPorVendedor: Record<string, number> = {};
      propostas.forEach(proposta => {
        const vendedor = proposta.vendedor?.nome || 'Sem vendedor';
        estatisticasPorVendedor[vendedor] = (estatisticasPorVendedor[vendedor] || 0) + 1;
      });

      return {
        totalPropostas,
        valorTotalPipeline,
        taxaConversao: Math.round(taxaConversao * 100) / 100,
        propostasAprovadas,
        estatisticasPorStatus,
        estatisticasPorVendedor
      };

    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas:', error);
      return {
        totalPropostas: 0,
        valorTotalPipeline: 0,
        taxaConversao: 0,
        propostasAprovadas: 0,
        estatisticasPorStatus: {},
        estatisticasPorVendedor: {}
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
        atualizadaEm: undefined
      };

      // Preparar dados para o backend
      const dadosParaBackend = {
        titulo: propostaClone.titulo,
        cliente: propostaClone.cliente?.nome || 'Cliente não informado',
        valor: propostaClone.total,
        observacoes: propostaClone.observacoes || '',
        vendedor: propostaClone.vendedor?.nome || '',
        formaPagamento: propostaClone.formaPagamento || 'avista',
        validadeDias: propostaClone.validadeDias || 30
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosParaBackend)
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();

      sharedPropostasService.clearCache();

      return {
        ...propostaClone,
        id: result.proposta?.id || `prop_${Date.now()}`,
        numero: result.proposta?.numero || `PROP-${Date.now()}`,
        criadaEm: new Date(result.proposta?.createdAt || Date.now()),
        atualizadaEm: new Date(result.proposta?.updatedAt || Date.now())
      };

    } catch (error) {
      console.error(`❌ Erro ao clonar proposta ${id}:`, error);
      return null;
    }
  }

  // Obter vendedor atual (mock para compatibilidade)
  async obterVendedorAtual(): Promise<Vendedor | null> {
    try {
      // Verificar se temos cache válido para vendedor atual
      const now = Date.now();
      const isCacheValid = this.vendedorAtualCache &&
        (now - this.vendedorAtualCacheTimestamp) < this.CACHE_DURATION;

      if (isCacheValid) {
        return this.vendedorAtualCache;
      }

      // Timeout para evitar loading infinito
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao obter vendedor atual')), 3000);
      });

      const vendedores = await Promise.race([
        this.obterVendedores(),
        timeoutPromise
      ]);

      const vendedorAtual = vendedores.length > 0 ? vendedores[0] : null;

      // Atualizar cache do vendedor atual
      this.vendedorAtualCache = vendedorAtual;
      this.vendedorAtualCacheTimestamp = Date.now();

      return vendedorAtual;
    } catch (error) {
      console.error('❌ Erro ao obter vendedor atual:', error);

      // Fallback: retornar vendedor padrão
      const fallbackVendedor = {
        id: 'vend_atual_default',
        nome: 'Vendedor Atual',
        email: 'atual@empresa.com',
        telefone: '',
        tipo: 'vendedor' as const,
        ativo: true
      };

      // Cache o fallback também
      this.vendedorAtualCache = fallbackVendedor;
      this.vendedorAtualCacheTimestamp = Date.now();

      return fallbackVendedor;
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
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

export const propostasService = new PropostasService();
export type { PropostaCompleta, PropostaFormData, Cliente, Vendedor, Produto, ProdutoProposta };