import { api } from './api';

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type ContratoBackend = {
  id: number | string;
  numero: string;
  propostaId?: string | null;
  clienteId?: string | null;
  status?: string;
  objeto?: string;
  descricao?: string;
  valorTotal?: number | string;
  valor?: number | string;
  dataInicio?: string;
  dataFim?: string;
  dataVencimento?: string;
  dataAssinatura?: string | null;
  createdAt?: string;
  updatedAt?: string;
  observacoes?: string | null;
  caminhoArquivoPDF?: string | null;
  usuarioResponsavel?: {
    id: string;
    nome: string;
    email: string;
  } | null;
  vendedor?: {
    id: string;
    nome: string;
    email: string;
  } | null;
  assinaturas?: Array<{
    id: number | string;
    status?: string;
    tokenValidacao?: string;
    dataAssinatura?: string | null;
  }>;
};

type AssinaturaContratoBackend = {
  id: number | string;
  contratoId: number | string;
  usuarioId: string;
  tipo: 'digital' | 'eletronica' | 'presencial';
  status: 'pendente' | 'assinado' | 'rejeitado' | 'expirado';
  tokenValidacao?: string;
  dataAssinatura?: string | null;
  dataExpiracao?: string | null;
  motivoRejeicao?: string | null;
};

// Interfaces para contratos (compatibilidade com telas existentes)
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
  vendedor?: {
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
  criadoEm?: Date;
  atualizadoEm?: Date;
  caminhoArquivoPDF?: string;
}

export interface CriarContratoDTO {
  propostaId?: string;
  clienteId: string;
  usuarioResponsavelId: string;
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

export interface AtualizarContratoDTO {
  objeto?: string;
  valorTotal?: number;
  dataInicio?: string;
  dataFim?: string;
  dataVencimento?: string;
  observacoes?: string;
  clausulasEspeciais?: string;
  condicoesPagamento?: {
    parcelas: number;
    formaPagamento: string;
    diaVencimento: number;
    valorParcela: number;
  };
  ativo?: boolean;
}

export interface CriarAssinaturaContratoDTO {
  usuarioId: string;
  tipo: 'digital' | 'eletronica' | 'presencial';
  certificadoDigital?: string;
  metadados?: {
    localizacao?: string;
    dispositivo?: string;
    navegador?: string;
    versaoApp?: string;
  };
  dataExpiracao?: string;
}

export interface ProcessarAssinaturaContratoDTO {
  tokenValidacao: string;
  hashAssinatura: string;
  ipAssinatura?: string;
  userAgent?: string;
  metadados?: {
    localizacao?: string;
    dispositivo?: string;
    navegador?: string;
    versaoApp?: string;
  };
}

export interface RejeitarAssinaturaContratoDTO {
  tokenValidacao: string;
  motivoRejeicao: string;
}

function toDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function toNumber(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function unwrapEnvelope<T>(payload: any, fallbackMessage: string): T {
  if (payload && typeof payload === 'object' && 'success' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    if (envelope.success === false) {
      throw new Error(envelope.message || fallbackMessage);
    }
    if ('data' in envelope) {
      return envelope.data as T;
    }
  }

  return payload as T;
}

function normalizeContratoStatus(
  status?: string,
): Contrato['status'] {
  const normalized = String(status || '').toLowerCase().trim();
  switch (normalized) {
    case 'aguardando_assinatura':
    case 'assinado':
    case 'cancelado':
    case 'expirado':
    case 'rascunho':
      return normalized;
    default:
      return 'aguardando_assinatura';
  }
}

function mapContrato(raw: ContratoBackend): Contrato {
  const assinaturas = Array.isArray(raw.assinaturas) ? raw.assinaturas : [];
  const assinaturasAssinadas = assinaturas.filter((a) => a?.status === 'assinado');
  const tokenAssinatura =
    assinaturas.find((a) => a?.tokenValidacao)?.tokenValidacao ||
    '';

  const vendedor = raw.usuarioResponsavel || raw.vendedor || undefined;
  const clienteId = raw.clienteId ? String(raw.clienteId) : '';

  return {
    id: String(raw.id),
    numero: raw.numero || '',
    propostaId: raw.propostaId ? String(raw.propostaId) : '',
    cliente: {
      id: clienteId,
      nome: clienteId ? `Cliente ${clienteId}` : 'Cliente nao identificado',
      email: '',
    },
    valor: toNumber(raw.valorTotal ?? raw.valor),
    status: normalizeContratoStatus(raw.status),
    descricao: raw.objeto || raw.descricao || '',
    dataEmissao: toDate(raw.createdAt) || new Date(),
    dataVencimento: toDate(raw.dataVencimento) || new Date(),
    dataAssinatura: toDate(raw.dataAssinatura || undefined),
    vendedor: vendedor
      ? {
          id: String(vendedor.id),
          nome: vendedor.nome,
          email: vendedor.email,
        }
      : undefined,
    assinaturaDigital:
      assinaturas.length > 0
        ? {
            clienteAssinado: assinaturasAssinadas.length >= 1,
            empresaAssinada: assinaturasAssinadas.length >= 2,
            token: tokenAssinatura,
            dataAssinatura: toDate(assinaturasAssinadas[0]?.dataAssinatura || undefined),
          }
        : undefined,
    observacoes: raw.observacoes || undefined,
    criadoEm: toDate(raw.createdAt),
    atualizadoEm: toDate(raw.updatedAt),
    caminhoArquivoPDF: raw.caminhoArquivoPDF || undefined,
  };
}

class ContratoService {
  private parseContratoResponse(payload: any, fallbackMessage: string): Contrato {
    const raw = unwrapEnvelope<ContratoBackend>(payload, fallbackMessage);
    return mapContrato(raw);
  }

  private parseAssinaturaResponse(payload: any, fallbackMessage: string): AssinaturaContratoBackend {
    return unwrapEnvelope<AssinaturaContratoBackend>(payload, fallbackMessage);
  }

  // Criar contrato a partir de proposta
  async criarContrato(dados: CriarContratoDTO): Promise<Contrato> {
    try {
      const response = await api.post('/contratos', dados);
      return this.parseContratoResponse(response.data, 'Erro ao criar contrato');
    } catch (error: any) {
      console.error('Erro ao criar contrato:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      throw error;
    }
  }

  // Listar contratos
  async listarContratos(): Promise<Contrato[]> {
    try {
      const response = await api.get('/contratos');
      const data = unwrapEnvelope<ContratoBackend[]>(
        response.data,
        'Erro ao listar contratos',
      );
      return Array.isArray(data) ? data.map(mapContrato) : [];
    } catch (error) {
      console.error('Erro ao listar contratos:', error);
      throw error;
    }
  }

  // Buscar contrato por ID
  async buscarContrato(id: string): Promise<Contrato> {
    try {
      const response = await api.get(`/contratos/${id}`);
      return this.parseContratoResponse(response.data, 'Erro ao buscar contrato');
    } catch (error: any) {
      console.error('Erro ao buscar contrato:', {
        id,
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      throw error;
    }
  }

  // Atualizar contrato
  async atualizarContrato(id: string, dados: AtualizarContratoDTO): Promise<Contrato> {
    try {
      const response = await api.put(`/contratos/${id}`, dados);
      return this.parseContratoResponse(response.data, 'Erro ao atualizar contrato');
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error);
      throw error;
    }
  }

  // Criar solicitação de assinatura
  async criarAssinatura(
    contratoId: string,
    dados: CriarAssinaturaContratoDTO,
  ): Promise<AssinaturaContratoBackend> {
    try {
      const response = await api.post(`/contratos/${contratoId}/assinaturas`, dados);
      return this.parseAssinaturaResponse(response.data, 'Erro ao criar assinatura');
    } catch (error) {
      console.error('Erro ao criar assinatura do contrato:', error);
      throw error;
    }
  }

  // Compatibilidade: "enviar para assinatura" passa a criar uma assinatura no backend real.
  async enviarParaAssinatura(
    contratoId: string,
    dados?: CriarAssinaturaContratoDTO,
  ): Promise<{ success: boolean; linkAssinatura: string }> {
    if (!dados) {
      throw new Error(
        'enviarParaAssinatura requer dados da assinatura (usuarioId/tipo) para usar a API atual',
      );
    }

    const assinatura = await this.criarAssinatura(contratoId, dados);
    const token = assinatura.tokenValidacao;

    return {
      success: true,
      linkAssinatura: token ? `/contratos/assinar/${token}` : '',
    };
  }

  // Processar assinatura pública (backend usa tokenValidacao + hashAssinatura)
  async assinarContrato(
    dados: ProcessarAssinaturaContratoDTO,
  ): Promise<AssinaturaContratoBackend> {
    try {
      const response = await api.post('/contratos/assinar/processar', dados);
      return this.parseAssinaturaResponse(response.data, 'Erro ao assinar contrato');
    } catch (error) {
      console.error('Erro ao assinar contrato:', error);
      throw error;
    }
  }

  async rejeitarAssinatura(dados: RejeitarAssinaturaContratoDTO): Promise<AssinaturaContratoBackend> {
    try {
      const response = await api.post('/contratos/assinar/rejeitar', dados);
      return this.parseAssinaturaResponse(response.data, 'Erro ao rejeitar assinatura');
    } catch (error) {
      console.error('Erro ao rejeitar assinatura:', error);
      throw error;
    }
  }

  // Baixar PDF/HTML do contrato (backend atual retorna HTML com nome .pdf pendente de hardening)
  async baixarPDF(contratoId: string | number): Promise<Blob> {
    try {
      const response = await api.get(`/contratos/${contratoId}/pdf`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao baixar PDF do contrato:', error);
      throw error;
    }
  }

  // Cancelar contrato (backend atual usa DELETE /contratos/:id)
  async cancelarContrato(contratoId: string, motivo?: string): Promise<Contrato> {
    try {
      const response = await api.delete(`/contratos/${contratoId}`, {
        data: motivo ? { motivo } : undefined,
      });
      return this.parseContratoResponse(response.data, 'Erro ao cancelar contrato');
    } catch (error) {
      console.error('Erro ao cancelar contrato:', error);
      throw error;
    }
  }
}

export const contratoService = new ContratoService();
