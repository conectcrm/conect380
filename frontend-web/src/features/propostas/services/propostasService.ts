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
  tipo?: 'produto' | 'combo'; // Novo campo para distinguir produto de combo
  produtosCombo?: Produto[]; // Para combos, lista dos produtos inclusos
  precoOriginal?: number; // Para combos, preço original antes do desconto
  desconto?: number; // Para combos, percentual de desconto
}

interface ProdutoProposta {
  produto: Produto;
  quantidade: number;
  desconto: number;
  subtotal: number;
}

interface PropostaFormData {
  titulo?: string; // Novo campo opcional para título da proposta
  vendedor: Vendedor | null; // Novo campo obrigatório para vendedor responsável
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
  criadaEm?: Date;
  atualizadaEm?: Date;
}

// Simulação de API - substituir por chamadas reais
class PropostasService {
  private baseUrl = '/api/propostas';
  private propostas: PropostaCompleta[] = []; // Armazenamento em memória para simulação

  // Método para obter produtos do sistema
  async obterProdutos(): Promise<Produto[]> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const todosProdutos: Produto[] = [];
    
    try {
      // 1. Carregar produtos individuais do backend
      const { produtosService } = await import('../../../services/produtosService');
      
      const produtosAPI = await produtosService.findAll();
      
      if (produtosAPI && produtosAPI.length > 0) {
        console.log('📦 Produtos individuais carregados do backend:', produtosAPI.length);
        
        // Converter produtos da API para o formato de propostas
        const produtosFormatados: Produto[] = produtosAPI.map((produto: any) => ({
          id: produto.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          nome: produto.nome || 'Produto sem nome',
          preco: produto.preco || 0,
          categoria: produto.categoria || 'Geral',
          descricao: produto.descricao || '',
          unidade: produto.unidadeMedida || 'unidade',
          tipo: 'produto'
        }));
        
        todosProdutos.push(...produtosFormatados);
      }
    } catch (error) {
      console.warn('Erro ao carregar produtos do backend:', error);
    }
    
    try {
      // 2. Carregar combos disponíveis
      const { combosService } = await import('../../../services/combosService');
      
      const combosAPI = await combosService.listarCombos();
      
      if (combosAPI && combosAPI.length > 0) {
        console.log('🎁 Combos carregados:', combosAPI.length);
        
        // Converter combos para formato de produtos de proposta
        const combosFormatados: Produto[] = combosAPI
          .filter(combo => combo.status === 'ativo') // Apenas combos ativos
          .map((combo: any) => ({
            id: `combo_${combo.id}`,
            nome: `${combo.nome} (Combo)`,
            preco: combo.precoCombo || combo.precoOriginal,
            categoria: `Combos - ${combo.categoria}`,
            descricao: `${combo.descricao} | Desconto: ${combo.desconto.toFixed(1)}% | Produtos: ${combo.produtos.map((p: any) => p.produto.nome).join(', ')}`,
            unidade: 'pacote',
            tipo: 'combo',
            precoOriginal: combo.precoOriginal,
            desconto: combo.desconto,
            produtosCombo: combo.produtos.map((produtoCombo: any) => ({
              id: produtoCombo.produto.id,
              nome: produtoCombo.produto.nome,
              preco: produtoCombo.produto.preco,
              categoria: produtoCombo.produto.categoria,
              descricao: produtoCombo.produto.descricao,
              unidade: produtoCombo.produto.unidade,
              quantidade: produtoCombo.quantidade
            }))
          }));
        
        todosProdutos.push(...combosFormatados);
      }
    } catch (error) {
      console.warn('Erro ao carregar combos:', error);
    }
    
    
    // 3. Se não há produtos do backend, tentar localStorage como fallback
    if (todosProdutos.length === 0) {
      try {
        const produtosSalvos = localStorage.getItem('fenixcrm_produtos');
        if (produtosSalvos) {
          const produtosParsed = JSON.parse(produtosSalvos);
          console.log('📦 Produtos carregados do localStorage (fallback):', produtosParsed.length);
          
          // Converter produtos do formato do sistema para o formato de propostas
          const produtosFormatados: Produto[] = produtosParsed.map((produto: any) => ({
            id: produto.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            nome: produto.nome || 'Produto sem nome',
            preco: produto.preco || produto.precoUnitario || 0,
            categoria: produto.categoria || 'Geral',
            descricao: produto.descricao || '',
            unidade: produto.unidadeMedida || produto.unidade || 'unidade',
            tipo: 'produto'
          }));
          
          todosProdutos.push(...produtosFormatados);
        }
      } catch (error) {
        console.warn('Erro ao carregar produtos do localStorage:', error);
      }
    }
    
    // 4. Se ainda não há produtos, usar mock data
    if (todosProdutos.length === 0) {
      const produtosMock: Produto[] = [
        {
          id: 'soft1',
          nome: 'Sistema ERP - Licença Básica',
          preco: 2500.00,
          categoria: 'Software',
          descricao: 'Sistema de gestão empresarial básico',
          unidade: 'licença',
          tipo: 'produto'
        },
        {
          id: 'soft2',
          nome: 'Sistema ERP - Licença Premium',
          preco: 4500.00,
          categoria: 'Software',
          descricao: 'Sistema de gestão empresarial completo',
          unidade: 'licença',
          tipo: 'produto'
        },
        {
          id: 'cons1',
          nome: 'Consultoria Gestão Empresarial',
          preco: 300.00,
          categoria: 'Consultoria',
          descricao: 'Consultoria especializada em gestão',
          unidade: 'hora',
          tipo: 'produto'
        },
        {
          id: 'combo1',
          nome: 'Pacote Startup (Combo)',
          preco: 750.00,
          categoria: 'Combos - Startup',
          descricao: 'ERP Básico + 8h Consultoria | Desconto: 16.6% | Economia: R$ 149,00',
          unidade: 'pacote',
          tipo: 'combo',
          precoOriginal: 899.00,
          desconto: 16.6
        }
      ];
      
      console.log('📦 Usando produtos mock (nenhum produto cadastrado encontrado)');
      todosProdutos.push(...produtosMock);
    }
    
    console.log(`🎯 Total de itens disponíveis: ${todosProdutos.length} (${todosProdutos.filter(p => p.tipo === 'produto').length} produtos + ${todosProdutos.filter(p => p.tipo === 'combo').length} combos)`);
    return todosProdutos;
    
    // Em produção: fazer chamada para API
    // const response = await fetch('/api/produtos');
    // return response.json();
  }

  // Método para obter vendedores (simulação)
  async obterVendedores(): Promise<Vendedor[]> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Dados simulados de vendedores
    const vendedores: Vendedor[] = [
      {
        id: 'vend_001',
        nome: 'Carlos Silva',
        email: 'carlos.silva@fenixcrm.com',
        tipo: 'vendedor',
        ativo: true
      },
      {
        id: 'vend_002',
        nome: 'Ana Costa',
        email: 'ana.costa@fenixcrm.com',
        tipo: 'vendedor',
        ativo: true
      },
      {
        id: 'vend_003',
        nome: 'Roberto Santos',
        email: 'roberto.santos@fenixcrm.com',
        tipo: 'gerente',
        ativo: true
      },
      {
        id: 'vend_004',
        nome: 'Maria Oliveira',
        email: 'maria.oliveira@fenixcrm.com',
        tipo: 'vendedor',
        ativo: true
      },
      {
        id: 'vend_005',
        nome: 'João Pereira',
        email: 'joao.pereira@fenixcrm.com',
        tipo: 'admin',
        ativo: true
      }
    ];

    // Em produção: fazer chamada para API
    // const response = await fetch('/api/vendedores');
    // return response.json();

    return vendedores.filter(v => v.ativo);
  }

  // Método para obter vendedor atual (usuário logado)
  async obterVendedorAtual(): Promise<Vendedor | null> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Simulação do usuário logado - em produção, pegar do contexto de autenticação
    const vendedorAtual: Vendedor = {
      id: 'vend_001',
      nome: 'Carlos Silva',
      email: 'carlos.silva@fenixcrm.com',
      tipo: 'vendedor',
      ativo: true
    };

    // Em produção: pegar do token JWT ou contexto de auth
    // const response = await fetch('/api/auth/me');
    // return response.json();

    return vendedorAtual;
  }

  // Método para gerar título automático da proposta
  gerarTituloAutomatico(cliente: Cliente | null): string {
    if (!cliente) {
      return `Nova Proposta - ${new Date().toLocaleDateString('pt-BR')}`;
    }
    
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    return `${cliente.nome} - ${dataAtual}`;
  }

  async criarProposta(dados: PropostaCompleta): Promise<PropostaCompleta> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const proposta: PropostaCompleta = {
      ...dados,
      id: `prop_${Date.now()}`,
      numero: `PROP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      status: 'rascunho',
      criadaEm: new Date(),
      atualizadaEm: new Date()
    };

    // Armazenar proposta na lista em memória
    this.propostas.unshift(proposta); // Adicionar no início da lista
    
    // Também salvar no localStorage para persistência entre reloads
    try {
      localStorage.setItem('fenixcrm_propostas', JSON.stringify(this.propostas));
    } catch (error) {
      console.warn('Não foi possível salvar no localStorage:', error);
    }

    // Em produção: fazer chamada para API
    // const response = await fetch(`${this.baseUrl}`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(proposta)
    // });
    // return response.json();

    console.log('✅ Proposta criada e armazenada:', proposta);
    console.log(`📋 Total de propostas armazenadas: ${this.propostas.length}`);
    return proposta;
  }

  async listarPropostas(): Promise<PropostaCompleta[]> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Carregar propostas do localStorage se ainda não carregadas
    if (this.propostas.length === 0) {
      try {
        const storedPropostas = localStorage.getItem('fenixcrm_propostas');
        if (storedPropostas) {
          this.propostas = JSON.parse(storedPropostas);
          console.log(`📋 Propostas carregadas do localStorage: ${this.propostas.length}`);
        }
      } catch (error) {
        console.warn('Erro ao carregar do localStorage:', error);
      }
    }
    
    // Em produção: fazer chamada para API
    // const response = await fetch(`${this.baseUrl}`);
    // return response.json();
    
    console.log(`📋 Listando ${this.propostas.length} propostas:`, this.propostas);
    return this.propostas;
  }

  async obterProposta(id: string): Promise<PropostaCompleta | null> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Buscar proposta na lista em memória
    const proposta = this.propostas.find(p => p.id === id);
    
    // Em produção: fazer chamada para API
    // const response = await fetch(`${this.baseUrl}/${id}`);
    // return response.json();
    
    return proposta || null;
  }

  // Método para limpar propostas (útil para desenvolvimento/testes)
  async limparPropostas(): Promise<void> {
    this.propostas = [];
    try {
      localStorage.removeItem('fenixcrm_propostas');
    } catch (error) {
      console.warn('Erro ao limpar localStorage:', error);
    }
    console.log('🗑️ Todas as propostas foram removidas');
  }

  // Método para obter estatísticas (útil para debug)
  getEstatisticas(): { total: number; status: Record<string, number> } {
    const stats = {
      total: this.propostas.length,
      status: {} as Record<string, number>
    };
    
    this.propostas.forEach(proposta => {
      const status = proposta.status || 'rascunho';
      stats.status[status] = (stats.status[status] || 0) + 1;
    });
    
    return stats;
  }

  async atualizarProposta(id: string, dados: Partial<PropostaCompleta>): Promise<PropostaCompleta> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const propostaAtualizada = {
      ...dados,
      id,
      atualizadaEm: new Date()
    } as PropostaCompleta;

    // Em produção: fazer chamada para API
    // const response = await fetch(`${this.baseUrl}/${id}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(dados)
    // });
    // return response.json();

    console.log('Proposta atualizada:', propostaAtualizada);
    return propostaAtualizada;
  }

  async excluirProposta(id: string): Promise<void> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Em produção: fazer chamada para API
    // await fetch(`${this.baseUrl}/${id}`, { method: 'DELETE' });
    
    console.log('Proposta excluída:', id);
  }

  async gerarPDF(id: string): Promise<Blob> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Em produção: fazer chamada para API
    // const response = await fetch(`${this.baseUrl}/${id}/pdf`);
    // return response.blob();
    
    // Simular PDF
    const pdfContent = `PDF da Proposta ${id}`;
    return new Blob([pdfContent], { type: 'application/pdf' });
  }

  async enviarPorEmail(id: string, email: string): Promise<void> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Em produção: fazer chamada para API
    // await fetch(`${this.baseUrl}/${id}/enviar`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email })
    // });
    
    console.log(`Proposta ${id} enviada para ${email}`);
  }

  // Utilitários
  formatarNumero(numero: string): string {
    return numero.replace(/(\d{4})-(\d{6})/, '$1-$2');
  }

  calcularDataVencimento(validadeDias: number): Date {
    const agora = new Date();
    agora.setDate(agora.getDate() + validadeDias);
    return agora;
  }

  validarProposta(dados: PropostaFormData): string[] {
    const erros: string[] = [];

    if (!dados.cliente) {
      erros.push('Cliente é obrigatório');
    }

    if (!dados.vendedor) {
      erros.push('Vendedor responsável é obrigatório');
    }

    if (!dados.produtos || dados.produtos.length === 0) {
      erros.push('Pelo menos um produto deve ser adicionado');
    }

    dados.produtos?.forEach((produto, index) => {
      if (produto.quantidade <= 0) {
        erros.push(`Quantidade do produto ${index + 1} deve ser maior que zero`);
      }
    });

    if (dados.validadeDias <= 0) {
      erros.push('Validade deve ser maior que zero');
    }

    return erros;
  }
}

export const propostasService = new PropostasService();
export default propostasService;

// Exportar tipos para uso em outras partes da aplicação
export type { Cliente, Vendedor, Produto, ProdutoProposta, PropostaFormData, PropostaCompleta };
