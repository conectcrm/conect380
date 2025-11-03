import api from './api';

export type TipoDistribuicao =
  | 'round_robin'
  | 'load_balancing'
  | 'skill_based'
  | 'manual';

export interface Nucleo {
  id: string;
  nome: string;
  descricao?: string;
  codigo: string;
  cor?: string;
  icone?: string;
  ativo: boolean;
  visivelNoBot: boolean;
  prioridade: number;
  tipoDistribuicao: TipoDistribuicao;
  slaRespostaMinutos?: number;
  slaResolucaoHoras?: number;
  capacidadeMaxima?: number;
  capacidadeMaximaTickets?: number;
  totalTicketsAbertos: number;
  mensagemBoasVindas?: string;
  atendentesIds?: string[]; // IDs dos atendentes diretos do núcleo
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateNucleoDto {
  nome: string;
  descricao?: string;
  codigo: string;
  cor?: string;
  icone?: string;
  ativo?: boolean;
  visivelNoBot?: boolean;
  prioridade?: number;
  tipoDistribuicao: TipoDistribuicao;
  slaRespostaMinutos?: number;
  slaResolucaoHoras?: number;
  capacidadeMaxima?: number;
  mensagemBoasVindas?: string;
}

export interface UpdateNucleoDto {
  nome?: string;
  descricao?: string;
  codigo?: string;
  cor?: string;
  icone?: string;
  ativo?: boolean;
  prioridade?: number;
  tipoDistribuicao?: TipoDistribuicao;
  slaRespostaMinutos?: number;
  slaResolucaoHoras?: number;
  capacidadeMaxima?: number;
  mensagemBoasVindas?: string;
  atendentesIds?: string[]; // IDs dos atendentes diretos do núcleo
}

export interface FilterNucleoDto {
  nome?: string;
  ativo?: boolean;
  tipoDistribuicao?: TipoDistribuicao;
}

class NucleoService {
  /**
   * Lista todos os núcleos com filtros opcionais
   */
  async listar(filtros?: FilterNucleoDto): Promise<Nucleo[]> {
    const params = new URLSearchParams();

    if (filtros?.nome) params.append('nome', filtros.nome);
    if (filtros?.ativo !== undefined) params.append('ativo', String(filtros.ativo));
    if (filtros?.tipoDistribuicao) params.append('tipoDistribuicao', filtros.tipoDistribuicao);

    const query = params.toString();
    const url = query ? `/nucleos?${query}` : '/nucleos';
    const response = await api.get(url);
    // Backend retorna diretamente o array
    return response.data;
  }

  /**
   * Busca um núcleo por ID
   */
  async buscarPorId(id: string): Promise<Nucleo> {
    const response = await api.get(`/nucleos/${id}`);
    return response.data;
  }

  /**
   * Cria um novo núcleo
   */
  async criar(dados: CreateNucleoDto): Promise<Nucleo> {
    const response = await api.post('/nucleos', dados);
    return response.data;
  }

  /**
   * Atualiza um núcleo existente
   */
  async atualizar(id: string, dados: UpdateNucleoDto): Promise<Nucleo> {
    const response = await api.put(`/nucleos/${id}`, dados);
    return response.data;
  }

  /**
   * Deleta um núcleo
   */
  async deletar(id: string): Promise<void> {
    await api.delete(`/nucleos/${id}`);
  }

  /**
   * Incrementa contador de tickets abertos
   */
  async incrementarTickets(id: string): Promise<Nucleo> {
    const response = await api.post(`/nucleos/${id}/incrementar-tickets`);
    return response.data;
  }

  /**
   * Decrementa contador de tickets abertos
   */
  async decrementarTickets(id: string): Promise<Nucleo> {
    const response = await api.post(`/nucleos/${id}/decrementar-tickets`);
    return response.data;
  }
}

export default new NucleoService();
