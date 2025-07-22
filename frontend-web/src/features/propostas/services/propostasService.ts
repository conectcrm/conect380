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

interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  descricao?: string;
  unidade: string;
}

interface ProdutoProposta {
  produto: Produto;
  quantidade: number;
  desconto: number;
  subtotal: number;
}

interface PropostaFormData {
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
export type { Cliente, Produto, ProdutoProposta, PropostaFormData, PropostaCompleta };
