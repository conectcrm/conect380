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
  proposta?: {
    id?: string | null;
    numero?: string | null;
  } | null;
  cliente?: {
    id?: string | number | null;
    nome?: string | null;
    email?: string | null;
    telefone?: string | null;
    documento?: string | null;
    endereco?: string | null;
  } | null;
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
    tipo?: 'digital' | 'eletronica' | 'presencial';
    status?: string;
    tokenValidacao?: string;
    dataAssinatura?: string | null;
    createdAt?: string;
    dataEnvio?: string | null;
    usuario?: {
      id: string;
      nome: string;
      email: string;
    } | null;
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
  propostaNumero?: string;
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
  assinaturas?: Array<{
    id: string;
    tipo?: 'digital' | 'eletronica' | 'presencial';
    status: 'pendente' | 'assinado' | 'rejeitado' | 'expirado';
    dataAssinatura?: Date;
    criadoEm?: Date;
    usuario?: {
      id: string;
      nome: string;
      email: string;
    };
  }>;
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

export interface ConfirmarAssinaturaExternaDTO {
  dataAssinatura?: string;
  observacoes?: string;
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

  const historicoAssinaturas = assinaturas
    .map((assinatura) => {
      const statusNormalizado = String(assinatura?.status || '').toLowerCase().trim();
      const status = (['pendente', 'assinado', 'rejeitado', 'expirado'].includes(statusNormalizado)
        ? statusNormalizado
        : 'pendente') as 'pendente' | 'assinado' | 'rejeitado' | 'expirado';

      return {
        id: String(assinatura?.id || ''),
        tipo: assinatura?.tipo,
        status,
        dataAssinatura: toDate(assinatura?.dataAssinatura || undefined),
        criadoEm: toDate(assinatura?.createdAt || assinatura?.dataEnvio || undefined),
        usuario: assinatura?.usuario
          ? {
              id: String(assinatura.usuario.id),
              nome: assinatura.usuario.nome,
              email: assinatura.usuario.email,
            }
          : undefined,
      };
    })
    .filter((assinatura) => assinatura.id);

  const vendedor = raw.usuarioResponsavel || raw.vendedor || undefined;
  const clienteRaw = raw.cliente || undefined;
  const clienteId = raw.clienteId
    ? String(raw.clienteId)
    : clienteRaw?.id !== undefined && clienteRaw?.id !== null
      ? String(clienteRaw.id)
      : '';
  const clienteNome = String(clienteRaw?.nome || '').trim() || 'Cliente nao identificado';
  const clienteEmail = String(clienteRaw?.email || '').trim();
  const propostaId = raw.propostaId
    ? String(raw.propostaId)
    : raw.proposta?.id
      ? String(raw.proposta.id)
      : '';
  const propostaNumero = String(raw.proposta?.numero || '').trim() || undefined;

  return {
    id: String(raw.id),
    numero: raw.numero || '',
    propostaId,
    propostaNumero,
    cliente: {
      id: clienteId,
      nome: clienteNome,
      email: clienteEmail,
      telefone: String(clienteRaw?.telefone || '').trim() || undefined,
      documento: String(clienteRaw?.documento || '').trim() || undefined,
      endereco: String(clienteRaw?.endereco || '').trim() || undefined,
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
    assinaturas: historicoAssinaturas.length > 0 ? historicoAssinaturas : undefined,
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
  async listarContratos(filtros?: {
    status?: string;
    clienteId?: string | number;
    propostaId?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<Contrato[]> {
    try {
      const params: Record<string, string> = {};

      if (filtros?.status) {
        params.status = String(filtros.status);
      }
      if (filtros?.clienteId !== undefined && filtros?.clienteId !== null && filtros?.clienteId !== '') {
        params.clienteId = String(filtros.clienteId);
      }
      if (filtros?.propostaId) {
        params.propostaId = String(filtros.propostaId);
      }
      if (filtros?.dataInicio) {
        params.dataInicio = String(filtros.dataInicio);
      }
      if (filtros?.dataFim) {
        params.dataFim = String(filtros.dataFim);
      }

      const response = await api.get('/contratos', { params });
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

  async buscarContratoPorPropostaId(propostaId: string): Promise<Contrato | null> {
    try {
      if (!propostaId?.trim()) {
        return null;
      }

      const contratos = await this.listarContratos({ propostaId: propostaId.trim() });
      if (!Array.isArray(contratos) || contratos.length === 0) {
        return null;
      }

      return (
        contratos.find((contrato) => String(contrato.status || '').toLowerCase() !== 'cancelado') ||
        contratos[0]
      );
    } catch (error) {
      console.error('Erro ao buscar contrato por proposta:', error);
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

  async confirmarAssinaturaExterna(
    contratoId: string | number,
    dados?: ConfirmarAssinaturaExternaDTO,
  ): Promise<Contrato> {
    try {
      const response = await api.post(
        `/contratos/${contratoId}/confirmar-assinatura-externa`,
        dados ?? {},
      );
      return this.parseContratoResponse(
        response.data,
        'Erro ao confirmar assinatura externa do contrato',
      );
    } catch (error) {
      console.error('Erro ao confirmar assinatura externa do contrato:', error);
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
