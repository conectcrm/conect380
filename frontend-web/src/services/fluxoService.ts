import api from './api';

export type TipoFluxo = 'menu_simples' | 'arvore_decisao' | 'coleta_dados' | 'menu_opcoes' | 'keyword_match' | 'condicional';

export interface EstruturaFluxo {
  etapaInicial: string;
  etapas: Record<string, unknown>;
  variaveis?: Record<string, unknown>;
  versao?: string;
}

export interface FluxoTriagem {
  id: string;
  nome: string;
  descricao?: string;
  codigo?: string;
  tipo: TipoFluxo;
  ativo: boolean;
  publicado: boolean;
  versao: number;
  canais: string[];
  palavrasGatilho: string[];
  prioridade: number;
  estrutura: EstruturaFluxo;
  permiteVoltar: boolean;
  permiteSair: boolean;
  salvarHistorico: boolean;
  tentarEntenderTextoLivre: boolean;
  totalExecucoes: number;
  totalConclusoes: number;
  totalAbandonos: number;
  taxaConclusao: number;
  tempoMedioConclusaoSegundos: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface FilterFluxoDto {
  ativo?: boolean;
  publicado?: boolean;
  tipo?: string;
  canal?: string;
}

export interface CreateFluxoDto {
  nome: string;
  descricao: string;
  tipo: TipoFluxo;
  canais: string[];
  estrutura: EstruturaFluxo;
  ativo?: boolean;
  tags?: string[];
  configuracoes?: Record<string, unknown>;
}

export interface UpdateFluxoDto extends Partial<CreateFluxoDto> { }

export interface PublicarFluxoDto {
  mensagemPublicacao?: string;
  definirComoPadrao?: boolean;
  ativo?: boolean;
  criarNovaVersao?: boolean;
  motivoPublicacao?: string;
}

class FluxoService {
  async listar(filtros?: FilterFluxoDto): Promise<FluxoTriagem[]> {
    const params: Record<string, string> = {};

    if (filtros) {
      if (filtros.ativo !== undefined) params.ativo = String(filtros.ativo);
      if (filtros.publicado !== undefined) params.publicado = String(filtros.publicado);
      if (filtros.tipo) params.tipo = filtros.tipo;
      if (filtros.canal) params.canal = filtros.canal;
    }

    const response = await api.get<FluxoTriagem[]>('/fluxos', { params });
    return Array.isArray(response.data) ? response.data : [];
  }

  async buscarPorId(id: string): Promise<FluxoTriagem> {
    const response = await api.get<FluxoTriagem>(`/fluxos/${id}`);
    return response.data;
  }

  async criar(payload: CreateFluxoDto): Promise<FluxoTriagem> {
    const response = await api.post<FluxoTriagem>('/fluxos', payload);
    return response.data;
  }

  async atualizar(id: string, payload: UpdateFluxoDto): Promise<FluxoTriagem> {
    const response = await api.put<FluxoTriagem>(`/fluxos/${id}`, payload);
    return response.data;
  }

  async deletar(id: string): Promise<void> {
    await api.delete(`/fluxos/${id}`);
  }

  async publicar(id: string, payload: PublicarFluxoDto = {}): Promise<FluxoTriagem> {
    const response = await api.post<FluxoTriagem>(`/fluxos/${id}/publicar`, payload);
    return response.data;
  }

  async despublicar(id: string): Promise<FluxoTriagem> {
    const response = await api.post<FluxoTriagem>(`/fluxos/${id}/despublicar`);
    return response.data;
  }

  async duplicar(id: string, novoNome?: string): Promise<FluxoTriagem> {
    const response = await api.post<FluxoTriagem>(`/fluxos/${id}/duplicar`, { novoNome });
    return response.data;
  }

  async obterEstatisticas(id: string): Promise<Record<string, unknown>> {
    const response = await api.get<Record<string, unknown>>(`/fluxos/${id}/estatisticas`);
    return response.data;
  }

  async listarVersoes(id: string): Promise<Record<string, unknown>[]> {
    const response = await api.get<Record<string, unknown>[]>(`/fluxos/${id}/versoes`);
    return Array.isArray(response.data) ? response.data : [];
  }
}

export const fluxoService = new FluxoService();
export default fluxoService;
