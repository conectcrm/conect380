import api from './api';

export interface TemplateMensagem {
  id: string;
  nome: string;
  conteudo: string;
  atalho?: string;
  categoria?: string;
  ativo: boolean;
  ordem: number;
  empresaId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateTemplateMensagemDto {
  nome: string;
  conteudo: string;
  atalho?: string;
  categoria?: string;
  ativo?: boolean;
  ordem?: number;
  empresaId: string;
}

export interface UpdateTemplateMensagemDto {
  nome?: string;
  conteudo?: string;
  atalho?: string;
  categoria?: string;
  ativo?: boolean;
  ordem?: number;
}

class TemplateMensagemService {
  private readonly baseUrl = '/atendimento/templates-mensagens';

  async listar(empresaId: string): Promise<TemplateMensagem[]> {
    const response = await api.get<TemplateMensagem[]>(this.baseUrl, {
      params: { empresaId },
    });
    return response.data;
  }

  async listarTodos(empresaId: string): Promise<TemplateMensagem[]> {
    const response = await api.get<TemplateMensagem[]>(`${this.baseUrl}/todos`, {
      params: { empresaId },
    });
    return response.data;
  }

  async buscar(termo: string, empresaId: string): Promise<TemplateMensagem[]> {
    const response = await api.get<TemplateMensagem[]>(`${this.baseUrl}/buscar`, {
      params: { termo, empresaId },
    });
    return response.data;
  }

  async buscarPorAtalho(atalho: string, empresaId: string): Promise<TemplateMensagem | null> {
    try {
      const response = await api.get<TemplateMensagem>(`${this.baseUrl}/atalho/${atalho}`, {
        params: { empresaId },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async buscarPorId(id: string, empresaId: string): Promise<TemplateMensagem> {
    const response = await api.get<TemplateMensagem>(`${this.baseUrl}/${id}`, {
      params: { empresaId },
    });
    return response.data;
  }

  async criar(dto: CreateTemplateMensagemDto): Promise<TemplateMensagem> {
    const response = await api.post<TemplateMensagem>(this.baseUrl, dto);
    return response.data;
  }

  async atualizar(id: string, empresaId: string, dto: UpdateTemplateMensagemDto): Promise<TemplateMensagem> {
    const response = await api.put<TemplateMensagem>(`${this.baseUrl}/${id}`, dto, {
      params: { empresaId },
    });
    return response.data;
  }

  async deletar(id: string, empresaId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`, {
      params: { empresaId },
    });
  }
}

export const templateMensagemService = new TemplateMensagemService();
