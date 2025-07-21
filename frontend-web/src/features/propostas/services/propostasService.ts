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

    // Em produção: fazer chamada para API
    // const response = await fetch(`${this.baseUrl}`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(proposta)
    // });
    // return response.json();

    console.log('Proposta criada:', proposta);
    return proposta;
  }

  async listarPropostas(): Promise<PropostaCompleta[]> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Em produção: fazer chamada para API
    // const response = await fetch(`${this.baseUrl}`);
    // return response.json();
    
    return [];
  }

  async obterProposta(id: string): Promise<PropostaCompleta | null> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Em produção: fazer chamada para API
    // const response = await fetch(`${this.baseUrl}/${id}`);
    // return response.json();
    
    return null;
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
