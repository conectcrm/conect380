import { api } from './api';

export interface DadosProposta {
  numeroProposta?: string;
  titulo: string;
  descricao?: string;
  status?: 'draft' | 'sent' | 'approved' | 'rejected';
  dataEmissao?: string;
  dataValidade?: string;
  empresa?: {
    nome: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    telefone?: string;
    email?: string;
    cnpj?: string;
    logo?: string;
  };
  cliente: {
    nome: string;
    empresa?: string;
    email: string;
    telefone?: string;
    documento?: string;
    tipoDocumento?: string;
    endereco?: string;
  };
  vendedor: {
    nome: string;
    email: string;
    telefone?: string;
    cargo?: string;
  };
  itens: Array<{
    nome: string;
    descricao?: string;
    quantidade: number;
    valorUnitario: number;
    desconto?: number;
    valorTotal: number;
  }>;
  subtotal?: number;
  descontoGeral?: number;
  percentualDesconto?: number;
  impostos?: number;
  valorTotal: number;
  formaPagamento: string;
  prazoEntrega: string;
  garantia?: string;
  validadeProposta?: string;
  condicoesGerais?: string[];
  observacoes?: string;
}

export interface TemplateInfo {
  id: string;
  nome: string;
  descricao: string;
  preview: string;
}

class PdfPropostasService {
  private readonly baseUrl = '/propostas/pdf';

  async gerarPdf(tipo: string, dados: DadosProposta): Promise<Blob> {
    const response = await api.post(`${this.baseUrl}/gerar/${tipo}`, dados, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.data;
  }

  async downloadPdf(tipo: string, dados: DadosProposta): Promise<void> {
    try {
      const blob = await this.gerarPdf(tipo, dados);
      
      // Criar URL temporária para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `proposta-${dados.numeroProposta || 'draft'}.pdf`;
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar URL temporária
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao fazer download do PDF:', error);
      throw new Error('Não foi possível gerar o PDF da proposta');
    }
  }

  async previewHtml(tipo: string, dados: DadosProposta): Promise<string> {
    const response = await api.post(`${this.baseUrl}/preview/${tipo}`, dados, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.data;
  }

  async getTemplatesDisponiveis(): Promise<{ templates: TemplateInfo[] }> {
    const response = await api.get(`${this.baseUrl}/templates`);
    return response.data;
  }

  // Função auxiliar para criar dados de exemplo
  criarDadosExemplo(): DadosProposta {
    return {
      numeroProposta: `${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      titulo: 'Sistema de Gestão Empresarial',
      descricao: 'Desenvolvimento de sistema completo de gestão empresarial com módulos integrados.',
      status: 'draft',
      dataEmissao: new Date().toISOString().split('T')[0],
      dataValidade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      empresa: {
        nome: 'Conect CRM Solutions',
        endereco: 'Rua das Tecnologias, 123 - Sala 456',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234-567',
        telefone: '(11) 3333-4444',
        email: 'contato@conectcrm.com',
        cnpj: '12.345.678/0001-90',
      },
      cliente: {
        nome: 'João Silva',
        empresa: 'Silva & Associados Ltda',
        email: 'joao@silvaassociados.com',
        telefone: '(11) 99999-8888',
        documento: '12.345.678/0001-99',
        tipoDocumento: 'CNPJ',
        endereco: 'Av. Paulista, 1000 - Conj. 12',
      },
      vendedor: {
        nome: 'Maria Santos',
        email: 'maria@conectcrm.com',
        telefone: '(11) 98765-4321',
        cargo: 'Consultora de Vendas',
      },
      itens: [
        {
          nome: 'Módulo de Vendas',
          descricao: 'Sistema completo de gestão de vendas com controle de pipeline',
          quantidade: 1,
          valorUnitario: 5000,
          desconto: 0,
          valorTotal: 5000,
        },
        {
          nome: 'Módulo de Estoque',
          descricao: 'Controle completo de estoque com relatórios',
          quantidade: 1,
          valorUnitario: 3000,
          desconto: 10,
          valorTotal: 2700,
        },
        {
          nome: 'Treinamento',
          descricao: 'Treinamento para 5 usuários',
          quantidade: 5,
          valorUnitario: 200,
          desconto: 0,
          valorTotal: 1000,
        },
      ],
      subtotal: 8700,
      descontoGeral: 0,
      percentualDesconto: 0,
      impostos: 0,
      valorTotal: 8700,
      formaPagamento: '50% na assinatura e 50% na entrega',
      prazoEntrega: '60 dias úteis',
      garantia: '12 meses',
      validadeProposta: '30 dias',
      condicoesGerais: [
        'Os preços têm validade de 30 dias',
        'Prazo contado após aprovação do projeto',
        'Alterações no escopo podem gerar custos adicionais',
        'Suporte técnico incluso por 12 meses',
      ],
      observacoes: 'Proposta elaborada conforme necessidades apresentadas pelo cliente.',
    };
  }
}

export const pdfPropostasService = new PdfPropostasService();
