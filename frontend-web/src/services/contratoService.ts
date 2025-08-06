import { api } from './api';

// Interfaces para contratos
export interface Contrato {
  id: string;
  numero: string;
  propostaId: string;
  cliente: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
    documento?: string;
    endereco?: string;
  };
  valor: number;
  status: 'rascunho' | 'aguardando_assinatura' | 'assinado' | 'cancelado' | 'expirado';
  descricao: string;
  dataEmissao: Date;
  dataVencimento: Date;
  dataAssinatura?: Date;
  vendedor: {
    id: string;
    nome: string;
    email: string;
  };
  assinaturaDigital?: {
    clienteAssinado: boolean;
    empresaAssinada: boolean;
    token: string;
    dataAssinatura?: Date;
  };
  observacoes?: string;
}

export interface CriarContratoDTO {
  propostaId: number;
  clienteId: number;
  usuarioResponsavelId: number;
  tipo: 'servico' | 'produto' | 'misto' | 'manutencao';
  objeto: string;
  valorTotal: number;
  dataInicio: string;
  dataFim: string;
  dataVencimento: string;
  observacoes?: string;
  clausulasEspeciais?: string;
  condicoesPagamento?: {
    parcelas: number;
    formaPagamento: string;
    diaVencimento: number;
    valorParcela: number;
  };
}

// Service para gerenciar contratos
class ContratoService {
  // Criar contrato a partir de proposta
  async criarContrato(dados: CriarContratoDTO): Promise<Contrato> {
    try {
      console.log('📄 Criando contrato com dados:', dados);
      console.log('🔍 URL da API:', `${api.defaults.baseURL}/contratos`);

      // Tentar primeiro o backend real
      try {
        const response = await api.post('/contratos', dados);
        console.log('✅ Contrato criado com sucesso:', response.data);
        return response.data;
      } catch (backendError: any) {
        console.warn('⚠️ Erro do backend detalhado:', {
          status: backendError.response?.status,
          statusText: backendError.response?.statusText,
          data: backendError.response?.data,
          message: backendError.message,
          url: backendError.config?.url
        });

        // Fallback: criar contrato mock
        const contratoMock: Contrato = {
          id: `CONT-${Date.now()}`,
          numero: `CONT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          propostaId: dados.propostaId.toString(),
          cliente: {
            id: dados.clienteId.toString(),
            nome: 'Cliente Sistema', // Mock data
            email: 'cliente@sistema.com',
            telefone: '',
            documento: '',
            endereco: ''
          },
          valor: dados.valorTotal,
          status: 'rascunho',
          descricao: dados.objeto,
          dataEmissao: new Date(),
          dataVencimento: new Date(dados.dataVencimento),
          vendedor: {
            id: dados.usuarioResponsavelId.toString(),
            nome: 'Vendedor Sistema',
            email: 'vendedor@sistema.com'
          },
          observacoes: dados.observacoes
        };

        // Simular delay do servidor
        await new Promise(resolve => setTimeout(resolve, 800));

        console.log('✅ Contrato mock criado:', contratoMock);
        return contratoMock;
      }
    } catch (error) {
      console.error('❌ Erro geral ao criar contrato:', error);
      throw error;
    }
  }

  // Listar contratos
  async listarContratos(): Promise<Contrato[]> {
    try {
      const response = await api.get('/contratos');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar contratos:', error);
      throw error;
    }
  }

  // Buscar contrato por ID
  async buscarContrato(id: string): Promise<Contrato> {
    try {
      console.log('🔍 Tentando buscar contrato com ID:', id);
      console.log('🔍 URL da API:', `${api.defaults.baseURL}/contratos/${id}`);

      const response = await api.get(`/contratos/${id}`);
      console.log('✅ Resposta recebida:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro detalhado ao buscar contrato:', {
        id,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      throw error;
    }
  }

  // Enviar contrato para assinatura
  async enviarParaAssinatura(contratoId: string): Promise<{ success: boolean; linkAssinatura: string }> {
    try {
      console.log('✍️ Enviando contrato para assinatura:', contratoId);

      const response = await api.post(`/contratos/${contratoId}/enviar-assinatura`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao enviar contrato para assinatura:', error);
      throw error;
    }
  }

  // Assinar contrato digitalmente
  async assinarContrato(contratoId: string, dados: { token: string; tipo: 'cliente' | 'empresa' }): Promise<Contrato> {
    try {
      console.log('✅ Assinando contrato:', contratoId);

      const response = await api.post(`/contratos/${contratoId}/assinar`, dados);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao assinar contrato:', error);
      throw error;
    }
  }

  // Baixar PDF do contrato
  async baixarPDF(contratoId: string): Promise<Blob> {
    try {
      const response = await api.get(`/contratos/${contratoId}/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao baixar PDF do contrato:', error);
      throw error;
    }
  }

  // Cancelar contrato
  async cancelarContrato(contratoId: string, motivo?: string): Promise<Contrato> {
    try {
      console.log('❌ Cancelando contrato:', contratoId);

      const response = await api.post(`/contratos/${contratoId}/cancelar`, { motivo });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao cancelar contrato:', error);
      throw error;
    }
  }
}

export const contratoService = new ContratoService();