import api from './api';

export type StatusOperacionalCliente =
  | 'ativo'
  | 'em_risco'
  | 'bloqueado_automatico'
  | 'bloqueado_manual';

export interface InadimplenciaOperacionalCliente {
  id: string;
  empresaId: string;
  clienteId: string;
  statusOperacional: StatusOperacionalCliente;
  origemStatus: 'sistema' | 'automacao' | 'manual';
  motivo: string | null;
  bloqueioManual: boolean;
  saldoVencido: number;
  diasMaiorAtraso: number;
  quantidadeTitulosVencidos: number;
  ultimaAvaliacaoEm: string | null;
  bloqueadoEm: string | null;
  desbloqueadoEm: string | null;
  metadata: Record<string, unknown> | null;
  cliente: {
    id: string;
    nome: string;
    email: string;
    documento?: string | null;
  } | null;
}

export interface InadimplenciaOperacionalEvento {
  id: string;
  tipoEvento: string;
  estadoAnterior: string | null;
  estadoNovo: string | null;
  motivo: string | null;
  saldoVencido: number;
  diasMaiorAtraso: number;
  atorId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ResumoReprocessamentoInadimplenciaOperacional {
  empresaId: string;
  clientesAvaliados: number;
  bloqueados: number;
  emRisco: number;
  ativos: number;
  falhas: number;
}

export const inadimplenciaOperacionalService = {
  async listarClientes(params?: {
    status?: StatusOperacionalCliente;
    busca?: string;
    somenteComSaldoVencido?: boolean;
    limit?: number;
  }): Promise<InadimplenciaOperacionalCliente[]> {
    const search = new URLSearchParams();
    if (params?.status) search.set('status', params.status);
    if (params?.busca) search.set('busca', params.busca);
    if (typeof params?.somenteComSaldoVencido === 'boolean') {
      search.set('somenteComSaldoVencido', String(params.somenteComSaldoVencido));
    }
    if (params?.limit) search.set('limit', String(params.limit));
    const query = search.toString();
    const response = await api.get(
      `/inadimplencia-operacional/clientes${query ? `?${query}` : ''}`,
    );
    return response.data;
  },

  async obterCliente(clienteId: string): Promise<{
    status: InadimplenciaOperacionalCliente;
    eventos: InadimplenciaOperacionalEvento[];
  }> {
    const response = await api.get(`/inadimplencia-operacional/clientes/${clienteId}`);
    return response.data;
  },

  async reavaliarCliente(
    clienteId: string,
    motivo?: string,
  ): Promise<InadimplenciaOperacionalCliente> {
    const response = await api.post(`/inadimplencia-operacional/clientes/${clienteId}/reavaliar`, {
      motivo,
    });
    return response.data;
  },

  async bloquearManual(
    clienteId: string,
    motivo?: string,
  ): Promise<InadimplenciaOperacionalCliente> {
    const response = await api.post(
      `/inadimplencia-operacional/clientes/${clienteId}/bloquear-manual`,
      {
        motivo,
      },
    );
    return response.data;
  },

  async desbloquearManual(
    clienteId: string,
    motivo?: string,
  ): Promise<InadimplenciaOperacionalCliente> {
    const response = await api.post(
      `/inadimplencia-operacional/clientes/${clienteId}/desbloquear-manual`,
      {
        motivo,
      },
    );
    return response.data;
  },

  async reprocessarEmpresa(): Promise<ResumoReprocessamentoInadimplenciaOperacional> {
    const response = await api.post('/inadimplencia-operacional/reprocessar');
    return response.data;
  },
};

export default inadimplenciaOperacionalService;
