import axios from 'axios';
import {
  Oportunidade,
  NovaOportunidade,
  AtualizarOportunidade,
  Atividade,
  NovaAtividade,
  FiltrosOportunidade,
  EstatisticasOportunidades,
  DadosKanban,
  EstagioOportunidade
} from '../types/oportunidades/index';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class OportunidadesService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/oportunidades`,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  constructor() {
    // Interceptor para adicionar token de autenticação - TEMPORARIAMENTE DESABILITADO
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // CRUD Oportunidades
  async listarOportunidades(filtros?: Partial<FiltrosOportunidade>): Promise<Oportunidade[]> {
    const response = await this.api.get('/', { params: filtros });
    return response.data.map((oportunidade: any) => this.formatarOportunidade(oportunidade));
  }

  async obterOportunidade(id: number): Promise<Oportunidade> {
    const response = await this.api.get(`/${id}`);
    return this.formatarOportunidade(response.data);
  }

  async criarOportunidade(oportunidade: NovaOportunidade): Promise<Oportunidade> {
    console.log('Service - Dados recebidos:', oportunidade);

    const cliente_id = oportunidade.clienteId ?? null;
    const dataFechamento = this.serializeDate(oportunidade.dataFechamentoEsperado);

    // Transformar campos para o formato esperado pelo backend
    const dadosBackend = {
      titulo: oportunidade.titulo,
      descricao: oportunidade.descricao,
      valor: oportunidade.valor,
      probabilidade: oportunidade.probabilidade,
      estagio: oportunidade.estagio,
      prioridade: oportunidade.prioridade,
      origem: oportunidade.origem,
      tags: oportunidade.tags,
      dataFechamentoEsperado: dataFechamento,
      responsavel_id: oportunidade.responsavelId,
      cliente_id,
      nomeContato: oportunidade.nomeContato,
      emailContato: oportunidade.emailContato,
      telefoneContato: oportunidade.telefoneContato,
      empresaContato: oportunidade.empresaContato,
      observacoes: oportunidade.observacoes
    };

    console.log('Service - Dados transformados:', dadosBackend);

    const response = await this.api.post('/', dadosBackend);
    return this.formatarOportunidade(response.data);
  }

  // Método auxiliar para validar UUID
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  async atualizarOportunidade(oportunidade: AtualizarOportunidade): Promise<Oportunidade> {
    const { id, ...dados } = oportunidade;
    const dataFechamento = this.serializeDate(dados.dataFechamentoEsperado);

    // Transformar campos para o formato esperado pelo backend
    const dadosBackend = {
      titulo: dados.titulo,
      descricao: dados.descricao,
      valor: dados.valor,
      probabilidade: dados.probabilidade,
      estagio: dados.estagio,
      prioridade: dados.prioridade,
      origem: dados.origem,
      tags: dados.tags,
      dataFechamentoEsperado: dataFechamento,
      responsavel_id: dados.responsavelId,
      cliente_id: dados.clienteId,
      nomeContato: dados.nomeContato,
      emailContato: dados.emailContato,
      telefoneContato: dados.telefoneContato,
      empresaContato: dados.empresaContato,
      observacoes: dados.observacoes
    };

    const response = await this.api.put(`/${id}`, dadosBackend);
    return this.formatarOportunidade(response.data);
  }

  async excluirOportunidade(id: number): Promise<void> {
    await this.api.delete(`/${id}`);
  }

  async moverOportunidade(id: number, novoEstagio: EstagioOportunidade): Promise<Oportunidade> {
    const response = await this.api.patch(`/${id}/mover`, { estagio: novoEstagio });
    return this.formatarOportunidade(response.data);
  }

  // Atividades
  async listarAtividades(oportunidadeId: number): Promise<Atividade[]> {
    const response = await this.api.get(`/${oportunidadeId}/atividades`);
    return response.data;
  }

  async criarAtividade(atividade: NovaAtividade): Promise<Atividade> {
    const response = await this.api.post(`/${atividade.oportunidadeId}/atividades`, atividade);
    return response.data;
  }

  async excluirAtividade(oportunidadeId: number, atividadeId: number): Promise<void> {
    await this.api.delete(`/${oportunidadeId}/atividades/${atividadeId}`);
  }

  // Estatísticas e relatórios
  async obterEstatisticas(filtros?: Partial<FiltrosOportunidade>): Promise<EstatisticasOportunidades> {
    const response = await this.api.get('/metricas', { params: filtros });
    return response.data;
  }

  async obterDadosKanban(filtros?: Partial<FiltrosOportunidade>): Promise<DadosKanban> {
    const response = await this.api.get('/pipeline', { params: filtros });

    // Converter formato do backend para o formato esperado pelo frontend
    const stages = response.data.stages || {};
    const estagios = Object.values(stages).map((stage: any) => ({
      estagio: stage.id,
      nome: stage.title,
      cor: stage.color,
      quantidade: stage.opportunities?.length || 0,
      valor: stage.opportunities?.reduce((total: number, opp: any) => total + parseFloat(opp.valor || 0), 0) || 0,
      oportunidades: stage.opportunities?.map((opp: any) => this.formatarOportunidade(opp)) || []
    }));

    return {
      estagios,
      totalValor: response.data.totalValue || 0,
      totalOportunidades: response.data.totalOpportunities || 0
    };
  }

  // Utilitários
  private formatarOportunidade(oportunidade: any): Oportunidade {
    const createdAt = oportunidade.createdAt ? new Date(oportunidade.createdAt) : new Date();
    const updatedAt = oportunidade.updatedAt ? new Date(oportunidade.updatedAt) : createdAt;

    return {
      id: oportunidade.id,
      titulo: oportunidade.titulo,
      descricao: oportunidade.descricao,
      valor: parseFloat(oportunidade.valor), // Converter string para number
      probabilidade: oportunidade.probabilidade,
      estagio: oportunidade.estagio,
      prioridade: oportunidade.prioridade,
      origem: oportunidade.origem,
      tags: oportunidade.tags || [],
      dataFechamentoEsperado: oportunidade.dataFechamentoEsperado
        ? new Date(oportunidade.dataFechamentoEsperado)
        : undefined,
      dataFechamentoReal: oportunidade.dataFechamentoReal
        ? new Date(oportunidade.dataFechamentoReal)
        : undefined,

      // Responsável (obrigatório)
      responsavel: oportunidade.responsavel ? {
        id: oportunidade.responsavel.id,
        nome: oportunidade.responsavel.nome,
        email: oportunidade.responsavel.email,
        avatar: oportunidade.responsavel.avatar_url
      } : {
        id: oportunidade.responsavel_id || '',
        nome: 'Não informado',
        email: '',
        avatar: undefined
      },

      // Cliente (opcional)
      cliente: oportunidade.cliente ? {
        id: oportunidade.cliente.id,
        nome: oportunidade.cliente.nome,
        email: oportunidade.cliente.email,
        telefone: oportunidade.cliente.telefone,
        empresa: oportunidade.cliente.empresa
      } : undefined,

      // Informações de contato direto
      nomeContato: oportunidade.nomeContato,
      emailContato: oportunidade.emailContato,
      telefoneContato: oportunidade.telefoneContato,
      empresaContato: oportunidade.empresaContato,
      observacoes: oportunidade.observacoes,
      criadoEm: oportunidade.criadoEm ?? createdAt,
      atualizadoEm: oportunidade.atualizadoEm ?? updatedAt,

      // Atividades
      atividades: oportunidade.atividades || [],

      // Metadados
      createdAt,
      updatedAt,

      // Campos calculados
      valorFormatado: this.formatarMoeda(oportunidade.valor ? parseFloat(oportunidade.valor) : 0),
      diasNoEstagio: this.calcularDiasNoEstagio(oportunidade.updatedAt),
      ultimaAtividade: oportunidade.ultimaAtividade
        ? new Date(oportunidade.ultimaAtividade)
        : undefined,
      tempoNoEstagio: this.formatarTempoNoEstagio(oportunidade.updatedAt),
      probabilidadeVisual: this.classificarProbabilidade(oportunidade.probabilidade)
    };
  }

  private serializeDate(value?: Date | string | null): string | null {
    if (!value) {
      return null;
    }

    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  }

  private formatarMoeda(valor: number): string {
    // Verificar se o valor é válido
    if (isNaN(valor) || valor === null || valor === undefined) {
      valor = 0;
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  private calcularDiasNoEstagio(dataAtualizacao: string): number {
    const agora = new Date();
    const dataAtualizacaoDate = new Date(dataAtualizacao);
    const diffTime = Math.abs(agora.getTime() - dataAtualizacaoDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private formatarTempoNoEstagio(dataAtualizacao: string): string {
    const dias = this.calcularDiasNoEstagio(dataAtualizacao);

    if (dias === 0) return 'Hoje';
    if (dias === 1) return '1 dia';
    if (dias < 7) return `${dias} dias`;
    if (dias < 30) return `${Math.floor(dias / 7)} semana${Math.floor(dias / 7) > 1 ? 's' : ''}`;
    if (dias < 365) return `${Math.floor(dias / 30)} mês${Math.floor(dias / 30) > 1 ? 'es' : ''}`;

    return `${Math.floor(dias / 365)} ano${Math.floor(dias / 365) > 1 ? 's' : ''}`;
  }

  private classificarProbabilidade(probabilidade: number): 'baixa' | 'media' | 'alta' {
    if (probabilidade < 30) return 'baixa';
    if (probabilidade < 70) return 'media';
    return 'alta';
  }

  // Busca e sugestões
  async buscarOportunidades(termo: string): Promise<Oportunidade[]> {
    const response = await this.api.get('/buscar', {
      params: { q: termo }
    });
    return response.data.map((oportunidade: any) => this.formatarOportunidade(oportunidade));
  }

  async obterSugestoesTags(): Promise<string[]> {
    const response = await this.api.get('/tags');
    return response.data;
  }

  async obterResponsaveis(): Promise<Array<{ id: string; nome: string; email: string; avatar?: string }>> {
    const response = await this.api.get('/responsaveis');
    return response.data;
  }

  // Clonagem e templates
  async clonarOportunidade(id: number): Promise<Oportunidade> {
    const response = await this.api.post(`/${id}/clonar`);
    return this.formatarOportunidade(response.data);
  }

  async exportarOportunidades(filtros?: Partial<FiltrosOportunidade>, formato: 'csv' | 'xlsx' = 'xlsx'): Promise<Blob> {
    const response = await this.api.get('/exportar', {
      params: { ...filtros, formato },
      responseType: 'blob'
    });
    return response.data;
  }
}

export const oportunidadesService = new OportunidadesService();
