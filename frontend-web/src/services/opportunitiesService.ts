// Service para integração com API de oportunidades
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Configurar axios com interceptor para token
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Opportunity {
  id: number;
  titulo: string;
  descricao?: string;
  valor: number;
  probabilidade: number;
  estagio: 'leads' | 'qualification' | 'proposal' | 'negotiation' | 'closing' | 'won' | 'lost';
  prioridade: 'low' | 'medium' | 'high';
  origem: 'website' | 'indicacao' | 'telefone' | 'email' | 'redes_sociais' | 'evento' | 'parceiro' | 'campanha';
  tags?: string[];
  dataFechamentoEsperado?: string;
  dataFechamentoReal?: string;
  responsavel: {
    id: number;
    nome: string;
    email: string;
  };
  cliente?: {
    id: number;
    nome: string;
    email: string;
  };
  nomeContato?: string;
  emailContato?: string;
  telefoneContato?: string;
  empresaContato?: string;
  atividades?: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: number;
  tipo: 'call' | 'email' | 'meeting' | 'note' | 'task';
  descricao: string;
  dataAtividade: string;
  criadoPor: {
    id: number;
    nome: string;
  };
  createdAt: string;
}

export interface CreateOpportunityDto {
  titulo: string;
  descricao?: string;
  valor: number;
  probabilidade: number;
  estagio: string;
  prioridade: string;
  origem: string;
  tags?: string[];
  dataFechamentoEsperado?: string;
  responsavel_id: string; // Corrigido: deve ser string, não number
  cliente_id?: number;
  nomeContato?: string;
  emailContato?: string;
  telefoneContato?: string;
  empresaContato?: string;
}

export interface CreateActivityDto {
  tipo: 'call' | 'email' | 'meeting' | 'note' | 'task';
  descricao: string;
  dataAtividade?: string;
}

export interface PipelineMetrics {
  totalOportunidades: number;
  valorTotalPipeline: number;
  valorGanho: number;
  taxaConversao: number;
  valorMedio: number;
  distribuicaoPorEstagio: {
    [key: string]: {
      quantidade: number;
      valor: number;
    };
  };
}

export interface PipelineData {
  stages: {
    [key: string]: {
      id: string;
      title: string;
      color: string;
      opportunities: Opportunity[];
    };
  };
  stageOrder: string[];
}

export const opportunitiesService = {
  // CRUD de oportunidades
  async getAll(filters?: {
    estagio?: string;
    responsavel_id?: number;
    cliente_id?: number;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<Opportunity[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await api.get(`/oportunidades?${params.toString()}`);
    return response.data;
  },

  async getById(id: number): Promise<Opportunity> {
    const response = await api.get(`/oportunidades/${id}`);
    return response.data;
  },

  async create(data: CreateOpportunityDto): Promise<Opportunity> {
    const response = await api.post('/oportunidades', data);
    return response.data;
  },

  async update(id: number, data: Partial<CreateOpportunityDto>): Promise<Opportunity> {
    const response = await api.patch(`/oportunidades/${id}`, data);
    return response.data;
  },

  async updateStage(id: number, estagio: string, dataFechamentoReal?: string): Promise<Opportunity> {
    const response = await api.patch(`/oportunidades/${id}/estagio`, {
      estagio,
      dataFechamentoReal
    });
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/oportunidades/${id}`);
  },

  // Pipeline e métricas
  async getPipelineData(): Promise<PipelineData> {
    const response = await api.get('/oportunidades/pipeline');
    return response.data;
  },

  async getMetrics(params?: any): Promise<PipelineMetrics> {
    try {
      // Se params for uma object com queryKey ou signal, ignorar (metadados do React Query)
      let filters: { dataInicio?: string; dataFim?: string } | undefined;
      
      if (params && typeof params === 'object' && !params.queryKey && !params.signal) {
        filters = params;
      }
      
      let url = '/oportunidades/metricas';
      
      if (filters && Object.keys(filters).length > 0) {
        const urlParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            urlParams.append(key, String(value));
          }
        });
        
        const queryString = urlParams.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }
      
      console.log('Fazendo requisição para:', url); // Debug
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      throw error;
    }
  },

  // Atividades
  async createActivity(opportunityId: number, data: CreateActivityDto): Promise<Activity> {
    const response = await api.post(`/oportunidades/${opportunityId}/atividades`, data);
    return response.data;
  }
};

// Hook para usar com React Query
export const useOpportunities = () => {
  return {
    // Queries
    getAll: (filters?: any) => ({
      queryKey: ['opportunities', filters],
      queryFn: () => opportunitiesService.getAll(filters),
    }),

    getById: (id: number) => ({
      queryKey: ['opportunity', id],
      queryFn: () => opportunitiesService.getById(id),
    }),

    getPipelineData: () => ({
      queryKey: ['pipeline'],
      queryFn: () => opportunitiesService.getPipelineData(),
    }),

    getMetrics: (filters?: any) => ({
      queryKey: ['metrics', filters],
      queryFn: () => opportunitiesService.getMetrics(filters),
    }),

    // Mutations
    create: {
      mutationFn: opportunitiesService.create,
    },

    update: {
      mutationFn: ({ id, data }: { id: number; data: any }) => 
        opportunitiesService.update(id, data),
    },

    updateStage: {
      mutationFn: ({ id, estagio, dataFechamentoReal }: { 
        id: number; 
        estagio: string; 
        dataFechamentoReal?: string 
      }) => opportunitiesService.updateStage(id, estagio, dataFechamentoReal),
    },

    delete: {
      mutationFn: opportunitiesService.delete,
    },

    createActivity: {
      mutationFn: ({ opportunityId, data }: { 
        opportunityId: number; 
        data: CreateActivityDto 
      }) => opportunitiesService.createActivity(opportunityId, data),
    },
  };
};

export default opportunitiesService;
