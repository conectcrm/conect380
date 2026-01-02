// Service para gestão de contatos
import { contatosMock } from './contatosMock';

export interface Contato {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  cargo: string;
  status: 'ativo' | 'inativo' | 'prospecto' | 'cliente' | 'ex-cliente';
  tipo: 'lead' | 'cliente' | 'parceiro' | 'fornecedor' | 'outro';
  fonte: string;
  proprietario: string;
  data_criacao: string;
  data_ultima_interacao: string;
  data_nascimento?: string;
  endereco?: {
    rua: string;
    cidade: string;
    estado: string;
    cep: string;
    pais: string;
  };
  redes_sociais?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  tags: string[];
  pontuacao_lead: number;
  valor_potencial: number;
  notas: string;
  anexos: any[];
  atividades_recentes: number;
  oportunidades_abertas: number;
  vendas_realizadas: number;
  valor_total_vendas: number;
  categoria: string;
}

export interface ContatoMetricas {
  total: number;
  ativos: number;
  prospectos: number;
  leads: number;
  valorPotencial: number;
  pontuacaoMedia: number;
  novosMes: number;
  taxaConversao: number;
}

class ContatosService {
  private baseUrl = '/api/contatos';

  async listarContatos(): Promise<Contato[]> {
    try {
      // Simulação de API - retornando dados mock
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([...contatosMock]);
        }, 800);
      });
    } catch (error) {
      console.error('Erro ao listar contatos:', error);
      throw error;
    }
  }

  async obterContato(id: string): Promise<Contato | null> {
    try {
      // Simulação de API
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(null);
        }, 500);
      });
    } catch (error) {
      console.error('Erro ao obter contato:', error);
      throw error;
    }
  }

  async criarContato(contato: Omit<Contato, 'id'>): Promise<Contato> {
    try {
      // Simulação de API
      return new Promise((resolve) => {
        setTimeout(() => {
          const novoContato: Contato = {
            ...contato,
            id: Date.now().toString(),
          };
          resolve(novoContato);
        }, 1000);
      });
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      throw error;
    }
  }

  async atualizarContato(id: string, contato: Partial<Contato>): Promise<Contato> {
    try {
      // Simulação de API
      return new Promise((resolve) => {
        setTimeout(() => {
          const contatoAtualizado: Contato = {
            id,
            ...contato,
          } as Contato;
          resolve(contatoAtualizado);
        }, 1000);
      });
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
      throw error;
    }
  }

  async excluirContato(id: string): Promise<void> {
    try {
      // Simulação de API
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 500);
      });
    } catch (error) {
      console.error('Erro ao excluir contato:', error);
      throw error;
    }
  }

  async obterMetricas(): Promise<ContatoMetricas> {
    try {
      // Simulação de API
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            total: 0,
            ativos: 0,
            prospectos: 0,
            leads: 0,
            valorPotencial: 0,
            pontuacaoMedia: 0,
            novosMes: 0,
            taxaConversao: 0,
          });
        }, 500);
      });
    } catch (error) {
      console.error('Erro ao obter métricas:', error);
      throw error;
    }
  }

  async importarContatos(arquivo: File): Promise<Contato[]> {
    try {
      // Simulação de API
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([]);
        }, 2000);
      });
    } catch (error) {
      console.error('Erro ao importar contatos:', error);
      throw error;
    }
  }

  async exportarContatos(filtros?: any): Promise<Blob> {
    try {
      // Simulação de API
      return new Promise((resolve) => {
        setTimeout(() => {
          const csvContent = 'Nome,Email,Telefone,Empresa\n';
          const blob = new Blob([csvContent], { type: 'text/csv' });
          resolve(blob);
        }, 1000);
      });
    } catch (error) {
      console.error('Erro ao exportar contatos:', error);
      throw error;
    }
  }
}

export const contatosService = new ContatosService();
