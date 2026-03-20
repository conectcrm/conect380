import { api } from './api';

// Enums
export enum StatusFatura {
  PENDENTE = 'pendente',
  ENVIADA = 'enviada',
  PAGA = 'paga',
  VENCIDA = 'vencida',
  CANCELADA = 'cancelada',
  PARCIALMENTE_PAGA = 'parcialmente_paga',
}

export enum TipoFatura {
  UNICA = 'unica',
  RECORRENTE = 'recorrente',
  PARCELA = 'parcela',
  ADICIONAL = 'adicional',
}

export enum FormaPagamento {
  PIX = 'pix',
  CARTAO_CREDITO = 'cartao_credito',
  CARTAO_DEBITO = 'cartao_debito',
  BOLETO = 'boleto',
  TRANSFERENCIA = 'transferencia',
  DINHEIRO = 'dinheiro',
  A_COMBINAR = 'a_combinar',
}

export enum StatusPagamento {
  PENDENTE = 'pendente',
  PROCESSANDO = 'processando',
  APROVADO = 'aprovado',
  REJEITADO = 'rejeitado',
  CANCELADO = 'cancelado',
  ESTORNADO = 'estornado',
}

// Interfaces
export interface ItemFatura {
  id?: number;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  unidade?: string;
  codigoProduto?: string;
  percentualDesconto?: number;
  valorDesconto?: number;
  valorTotal: number;
}

export interface Fatura {
  id: number;
  numero: string;
  contratoId?: string;
  contrato?: any;
  clienteId: string;
  cliente?: any;
  usuarioResponsavelId: string;
  usuarioResponsavel?: any;
  tipo: TipoFatura;
  status: StatusFatura;
  dataEmissao: string;
  dataVencimento: string;
  valorBruto: number;
  valorDesconto: number;
  valorLiquido: number;
  valorImpostos: number;
  percentualImpostos?: number | null;
  diasCarenciaJuros?: number;
  percentualJuros?: number;
  percentualMulta?: number;
  detalhesTributarios?: Record<string, unknown> | null;
  valorTotal: number;
  // Pode vir do backend; usado nos aggregates quando disponível
  valorPago?: number;
  percentualDesconto?: number;
  formaPagamento?: FormaPagamento;
  formaPagamentoPreferida?: FormaPagamento;
  observacoes?: string;
  linkPagamento?: string;
  arquivoUrl?: string;
  notasFiscais?: string[];
  itens: ItemFatura[];
  pagamentos?: Pagamento[];
  diasVencimento?: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface NovaFatura {
  contratoId?: string;
  clienteId: string; // UUID string
  usuarioResponsavelId: string;
  tipo: TipoFatura;
  dataVencimento: string;
  formaPagamento?: FormaPagamento;
  observacoes?: string;
  percentualDesconto?: number;
  valorDesconto?: number;
  valorImpostos?: number;
  percentualImpostos?: number | null;
  diasCarenciaJuros?: number;
  percentualJuros?: number;
  percentualMulta?: number;
  detalhesTributarios?: Record<string, unknown>;
  itens: Omit<ItemFatura, 'id' | 'valorTotal'>[];
}

export interface AtualizarFatura extends Partial<NovaFatura> {
  status?: StatusFatura;
}

export interface Pagamento {
  id: number;
  faturaId: number;
  tipo?: string;
  valor: number;
  dataPagamento: string;
  metodoPagamento?: string;
  formaPagamento: FormaPagamento;
  status: StatusPagamento;
  transacaoId?: string;
  gatewayTransacaoId?: string;
  comprovante?: string;
  observacoes?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface NovoPagamento {
  faturaId: number;
  valor: number;
  dataPagamento: string;
  formaPagamento: FormaPagamento;
  transacaoId?: string;
  comprovante?: string;
  observacoes?: string;
}

const toPagamento = (raw: any): Pagamento => {
  const criadoEm = String(raw?.criadoEm || raw?.createdAt || new Date().toISOString());
  const atualizadoEm = String(raw?.atualizadoEm || raw?.updatedAt || criadoEm);
  const metodoNormalizado = String(raw?.formaPagamento || raw?.metodoPagamento || 'pix')
    .trim()
    .toLowerCase();

  return {
    id: Number(raw?.id || 0),
    faturaId: Number(raw?.faturaId || raw?.fatura_id || 0),
    tipo: String(raw?.tipo || 'pagamento'),
    valor: Number(raw?.valor || 0),
    dataPagamento: String(
      raw?.dataPagamento ||
        raw?.dataAprovacao ||
        raw?.dataProcessamento ||
        raw?.createdAt ||
        criadoEm,
    ),
    metodoPagamento: String(raw?.metodoPagamento || metodoNormalizado),
    formaPagamento: metodoNormalizado as FormaPagamento,
    status: String(raw?.status || StatusPagamento.PENDENTE) as StatusPagamento,
    transacaoId: raw?.transacaoId ? String(raw.transacaoId) : undefined,
    gatewayTransacaoId: raw?.gatewayTransacaoId ? String(raw.gatewayTransacaoId) : undefined,
    comprovante: raw?.comprovante ? String(raw.comprovante) : undefined,
    observacoes: raw?.observacoes ? String(raw.observacoes) : undefined,
    criadoEm,
    atualizadoEm,
  };
};

export interface EstatisticasPagamentos {
  totalPagamentos: number;
  valorTotal: number;
  valorLiquido: number;
  taxasTotal: number;
  porMetodo: Record<string, { quantidade: number; valor: number }>;
  porStatus: Record<string, { quantidade: number; valor: number }>;
}

export interface FiltrosFatura {
  busca?: string;
  status?: StatusFatura;
  tipo?: TipoFatura;
  clienteId?: number;
  contratoId?: number;
  dataInicial?: string;
  dataFinal?: string;
  periodoCampo?: 'emissao' | 'vencimento';
  valorMinimo?: number;
  valorMaximo?: number;
  usuarioResponsavelId?: number;
  formaPagamento?: FormaPagamento;
  vencidas?: boolean;
  page?: number;
  limit?: number;
  // Novos parâmetros opcionais compatíveis com backend
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  q?: string;
}

export interface PlanoCobranca {
  id: number;
  nome: string;
  descricao?: string;
  valor: number;
  tipo: 'mensal' | 'anual' | 'unico' | 'personalizado';
  status: 'ativo' | 'inativo' | 'arquivado';
  clienteId?: number;
  contratoId?: number;
  diasVencimento: number;
  formaPagamento: FormaPagamento;
  dataInicio: string;
  dataFim?: string;
  observacoes?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface NovoPlanoCobranca {
  nome: string;
  descricao?: string;
  valor: number;
  tipo: 'mensal' | 'anual' | 'unico' | 'personalizado';
  clienteId?: number;
  contratoId?: number;
  diasVencimento: number;
  formaPagamento: FormaPagamento;
  dataInicio: string;
  dataFim?: string;
  observacoes?: string;
}

// Tipos compartilhados
export type Aggregates = { valorTotal?: number; valorRecebido?: number; valorEmAberto?: number };

export type FaturasPaginadasResponse = {
  data: Fatura[];
  total: number;
  page: number;
  pageSize: number;
  aggregates?: Aggregates;
};

export interface EnvioFaturaEmailResultado {
  enviado: boolean;
  simulado: boolean;
  motivo?: string;
  detalhes?: string;
  message?: string;
}

export interface EnvioFaturaEmailPayload {
  email?: string;
  templateId?: string;
  assunto?: string;
  conteudo?: string;
}

export interface ResultadoCobrancaLoteItem {
  faturaId: number;
  numero?: string;
  statusOriginal?: StatusFatura;
  statusFinal?: StatusFatura;
  enviado: boolean;
  simulado: boolean;
  motivo?: string;
  detalhes?: string;
}

export interface ResultadoCobrancaLote {
  solicitadas: number;
  processadas: number;
  sucesso: number;
  simuladas: number;
  falhas: number;
  ignoradas: number;
  resultados: ResultadoCobrancaLoteItem[];
}

export type TipoDocumentoFiscal = 'nfse' | 'nfe';
export type AmbienteDocumentoFiscal = 'homologacao' | 'producao';
export type StatusDocumentoFiscal =
  | 'nao_iniciado'
  | 'rascunho'
  | 'pendente_emissao'
  | 'emitida'
  | 'erro'
  | 'cancelada';
export type OperacaoDocumentoFiscal = 'cancelar' | 'inutilizar';

export interface DocumentoFiscalHistoricoEvento {
  timestamp: string;
  acao: string;
  status: StatusDocumentoFiscal;
  mensagem?: string | null;
  usuarioId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface DocumentoFiscalStatus {
  faturaId: number;
  faturaNumero: string;
  tipo: TipoDocumentoFiscal | null;
  ambiente: AmbienteDocumentoFiscal;
  status: StatusDocumentoFiscal;
  provider: string | null;
  numeroDocumento: string | null;
  serie: string | null;
  chaveAcesso: string | null;
  protocolo: string | null;
  loteId: string | null;
  ultimaMensagem: string | null;
  atualizadoEm: string | null;
  historico: DocumentoFiscalHistoricoEvento[];
  resumo: {
    valorServicos: number;
    valorTributos: number;
    valorTotal: number;
  };
}

export interface DocumentoFiscalPayload {
  tipo?: TipoDocumentoFiscal;
  ambiente?: AmbienteDocumentoFiscal;
  observacoes?: string;
  forcarReemissao?: boolean;
}

export interface DocumentoFiscalCancelamentoPayload {
  tipoOperacao: OperacaoDocumentoFiscal;
  motivo: string;
  ambiente?: AmbienteDocumentoFiscal;
}

// Serviço
export const faturamentoService = {
  // ==================== FATURAS ====================

  // Novo tipo de resposta paginada com agregados
  async listarFaturasPaginadas(filtros?: FiltrosFatura): Promise<FaturasPaginadasResponse> {
    try {
      const params = new URLSearchParams();

      if (filtros) {
        // Mapeia chaves do frontend para o backend
        const mapping: Record<string, string> = {
          busca: 'q',
          page: 'page',
          limit: 'pageSize',
          pageSize: 'pageSize',
          sortBy: 'sortBy',
          sortOrder: 'sortOrder',
          status: 'status',
          tipo: 'tipo',
          clienteId: 'clienteId',
          dataInicial: 'dataInicio',
          dataFinal: 'dataFim',
          periodoCampo: 'periodoCampo',
          formaPagamento: 'formaPagamento',
          vencidas: 'vencidas',
          q: 'q',
        };

        Object.entries(filtros).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            const mapped = mapping[key] ?? key;
            params.append(mapped, String(value));
          }
        });
      }

      // Consumir apenas o endpoint padronizado com metadados dentro de data
      const response = await api.get(`/faturamento/faturas/paginadas?${params.toString()}`);
      const d = response.data;

      if (d?.data && Array.isArray(d?.data?.items)) {
        const items = d.data.items as Fatura[];
        const total = Number(d.data.total ?? items.length) || 0;
        const page = Number(d.data.page ?? filtros?.page ?? 1) || 1;
        const pageSize =
          Number(d.data.pageSize ?? filtros?.pageSize ?? filtros?.limit ?? items.length) ||
          items.length;
        const aggregates: Aggregates = d.data.aggregates ?? {
          valorTotal: 0,
          valorRecebido: 0,
          valorEmAberto: 0,
        };
        return { data: items, total, page, pageSize, aggregates };
      }

      throw new Error('Formato de resposta inesperado do endpoint /faturamento/faturas/paginadas');
    } catch (error) {
      console.error('Erro ao listar faturas:', error);
      throw error;
    }
  },

  // Mantém compatibilidade: retorna apenas o array de faturas
  async listarFaturas(filtros?: FiltrosFatura): Promise<Fatura[]> {
    const res = await this.listarFaturasPaginadas(filtros);
    return res.data;
  },

  async obterFatura(id: number): Promise<Fatura> {
    try {
      const response = await api.get(`/faturamento/faturas/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erro ao obter fatura:', error);
      throw error;
    }
  },

  async criarFatura(dadosFatura: NovaFatura): Promise<Fatura> {
    let backendData: any;
    try {
      console.log('💰 [FRONTEND] Dados originais da fatura:', JSON.stringify(dadosFatura, null, 2));

      // Transform data to match backend DTO structure
      backendData = {
        clienteId: dadosFatura.clienteId,
        usuarioResponsavelId: String(dadosFatura.usuarioResponsavelId), // Ensure it's a string for UUID validation
        tipo: dadosFatura.tipo,
        descricao: dadosFatura.observacoes || `Fatura ${dadosFatura.tipo}`, // Backend requires descricao field
        dataVencimento: dadosFatura.dataVencimento,
        observacoes: dadosFatura.observacoes,
        valorDesconto: dadosFatura.valorDesconto || 0,
        valorImpostos: dadosFatura.valorImpostos || 0,
        percentualImpostos:
          dadosFatura.percentualImpostos === null || dadosFatura.percentualImpostos === undefined
            ? undefined
            : dadosFatura.percentualImpostos,
        diasCarenciaJuros: dadosFatura.diasCarenciaJuros || 0,
        percentualJuros: dadosFatura.percentualJuros || 0,
        percentualMulta: dadosFatura.percentualMulta || 0,
        detalhesTributarios: dadosFatura.detalhesTributarios,
        itens: dadosFatura.itens.map((item) => ({
          descricao: item.descricao,
          quantidade: Math.max(item.quantidade, 0.01),
          valorUnitario: Math.max(item.valorUnitario, 0.01),
          unidade: item.unidade || 'un',
          codigoProduto: item.codigoProduto || '',
          percentualDesconto: item.percentualDesconto || 0,
          valorDesconto: item.valorDesconto || 0,
        })),
      };

      // Only include contratoId if it's a valid number
      if (
        dadosFatura.contratoId &&
        dadosFatura.contratoId !== '' &&
        !isNaN(Number(dadosFatura.contratoId))
      ) {
        backendData.contratoId = Number(dadosFatura.contratoId);
      }

      // Only include formaPagamentoPreferida if provided
      if (dadosFatura.formaPagamento) {
        backendData.formaPagamentoPreferida = dadosFatura.formaPagamento;
      }

      console.log(
        '💰 [FRONTEND] Dados transformados para backend:',
        JSON.stringify(backendData, null, 2),
      );

      const response = await api.post('/faturamento/faturas', backendData);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('❌ [FRONTEND] Erro detalhado ao criar fatura:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        originalData: dadosFatura,
        transformedData: backendData,
        fullError: error,
      });

      // Log específico da resposta do backend
      if (error.response?.data) {
        console.error('🔍 [BACKEND RESPONSE]:', JSON.stringify(error.response.data, null, 2));
      }

      throw error;
    }
  },

  async atualizarFatura(id: number, dadosFatura: AtualizarFatura): Promise<Fatura> {
    try {
      const backendData: Record<string, unknown> = {};

      if (dadosFatura.dataVencimento !== undefined) {
        backendData.dataVencimento = dadosFatura.dataVencimento;
      }

      if (dadosFatura.observacoes !== undefined) {
        backendData.observacoes = dadosFatura.observacoes;
      }

      if (dadosFatura.valorDesconto !== undefined) {
        backendData.valorDesconto = dadosFatura.valorDesconto;
      }

      if (dadosFatura.valorImpostos !== undefined) {
        backendData.valorImpostos = dadosFatura.valorImpostos;
      }

      if (dadosFatura.percentualImpostos !== undefined) {
        backendData.percentualImpostos = dadosFatura.percentualImpostos;
      }

      if (dadosFatura.diasCarenciaJuros !== undefined) {
        backendData.diasCarenciaJuros = dadosFatura.diasCarenciaJuros;
      }

      if (dadosFatura.percentualJuros !== undefined) {
        backendData.percentualJuros = dadosFatura.percentualJuros;
      }

      if (dadosFatura.percentualMulta !== undefined) {
        backendData.percentualMulta = dadosFatura.percentualMulta;
      }

      if (dadosFatura.detalhesTributarios !== undefined) {
        backendData.detalhesTributarios = dadosFatura.detalhesTributarios;
      }

      if (dadosFatura.formaPagamento !== undefined) {
        backendData.formaPagamentoPreferida = dadosFatura.formaPagamento;
      }

      if (dadosFatura.itens) {
        backendData.itens = dadosFatura.itens.map((item) => ({
          descricao: item.descricao,
          quantidade: Math.max(Number(item.quantidade || 0), 0.01),
          valorUnitario: Math.max(Number(item.valorUnitario || 0), 0.01),
          unidade: item.unidade || 'un',
          codigoProduto: item.codigoProduto || '',
          percentualDesconto: item.percentualDesconto || 0,
          valorDesconto: item.valorDesconto || 0,
        }));
      }

      const response = await api.put(`/faturamento/faturas/${id}`, backendData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erro ao atualizar fatura:', error);
      throw error;
    }
  },

  async marcarFaturaComoPaga(id: number, valorPago: number): Promise<Fatura> {
    try {
      const response = await api.put(`/faturamento/faturas/${id}/pagar`, { valorPago });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erro ao marcar fatura como paga:', error);
      throw error;
    }
  },

  async excluirFatura(id: number): Promise<void> {
    try {
      await api.delete(`/faturamento/faturas/${id}`);
    } catch (error) {
      console.error('Erro ao excluir fatura:', error);
      throw error;
    }
  },

  async gerarFaturaAutomatica(contratoId: number): Promise<Fatura> {
    try {
      // Ajuste para a rota real mapeada no backend
      const response = await api.post('/faturamento/faturas/automatica', { contratoId });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erro ao gerar fatura automática:', error);
      throw error;
    }
  },

  async enviarFaturaPorEmail(
    id: number,
    payload?: string | EnvioFaturaEmailPayload,
  ): Promise<EnvioFaturaEmailResultado> {
    try {
      const body = typeof payload === 'string' ? { email: payload } : payload || {};
      const response = await api.post(`/faturamento/faturas/${id}/enviar-email`, body);
      const responsePayload = response?.data ?? {};
      const data = responsePayload?.data ?? responsePayload ?? {};
      const enviado = typeof data?.enviado === 'boolean' ? data.enviado : true;
      const simulado = Boolean(data?.simulado);
      const motivo =
        typeof data?.motivo === 'string' && data.motivo.trim().length > 0 ? data.motivo : undefined;
      const detalhes =
        typeof data?.detalhes === 'string' && data.detalhes.trim().length > 0
          ? data.detalhes
          : undefined;
      const message =
        typeof responsePayload?.message === 'string' && responsePayload.message.trim().length > 0
          ? responsePayload.message
          : undefined;

      if (!enviado) {
        throw new Error(message || 'Falha ao enviar fatura por email.');
      }
      return { enviado, simulado, motivo, detalhes, message };
    } catch (error) {
      console.error('Erro ao enviar fatura por email:', error);
      throw error;
    }
  },

  async gerarCobrancaEmLote(faturaIds: number[]): Promise<ResultadoCobrancaLote> {
    try {
      const response = await api.post('/faturamento/faturas/gerar-cobranca-lote', { faturaIds });
      const responsePayload = response?.data ?? {};
      const data = responsePayload?.data ?? {};
      const resultadosRaw = Array.isArray(data?.resultados) ? data.resultados : [];

      return {
        solicitadas: Number(data?.solicitadas || faturaIds.length || 0),
        processadas: Number(data?.processadas || resultadosRaw.length || 0),
        sucesso: Number(data?.sucesso || 0),
        simuladas: Number(data?.simuladas || 0),
        falhas: Number(data?.falhas || 0),
        ignoradas: Number(data?.ignoradas || 0),
        resultados: resultadosRaw.map((item: any) => ({
          faturaId: Number(item?.faturaId || 0),
          numero: item?.numero ? String(item.numero) : undefined,
          statusOriginal: item?.statusOriginal as StatusFatura | undefined,
          statusFinal: item?.statusFinal as StatusFatura | undefined,
          enviado: Boolean(item?.enviado),
          simulado: Boolean(item?.simulado),
          motivo: item?.motivo ? String(item.motivo) : undefined,
          detalhes: item?.detalhes ? String(item.detalhes) : undefined,
        })),
      };
    } catch (error) {
      console.error('Erro ao gerar cobrança em lote:', error);
      throw error;
    }
  },

  async criarRascunhoDocumentoFiscal(
    id: number,
    payload?: DocumentoFiscalPayload,
  ): Promise<DocumentoFiscalStatus> {
    try {
      const body = payload || {};
      const response = await api.post(`/faturamento/faturas/${id}/documento-fiscal/rascunho`, body);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Erro ao criar rascunho fiscal:', error);
      throw error;
    }
  },

  async emitirDocumentoFiscal(
    id: number,
    payload?: DocumentoFiscalPayload,
  ): Promise<DocumentoFiscalStatus> {
    try {
      const body = payload || {};
      const response = await api.post(`/faturamento/faturas/${id}/documento-fiscal/emitir`, body);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Erro ao emitir documento fiscal:', error);
      throw error;
    }
  },

  async obterStatusDocumentoFiscal(id: number): Promise<DocumentoFiscalStatus> {
    try {
      const response = await api.get(`/faturamento/faturas/${id}/documento-fiscal/status`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Erro ao consultar status do documento fiscal:', error);
      throw error;
    }
  },

  async cancelarOuInutilizarDocumentoFiscal(
    id: number,
    payload: DocumentoFiscalCancelamentoPayload,
  ): Promise<DocumentoFiscalStatus> {
    try {
      const response = await api.post(`/faturamento/faturas/${id}/documento-fiscal/cancelar`, payload);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Erro ao cancelar/inutilizar documento fiscal:', error);
      throw error;
    }
  },

  async gerarLinkPagamento(id: number): Promise<string> {
    try {
      void id;
      throw new Error(
        'Link de pagamento ainda nao esta disponivel na API de faturamento desta versao',
      );
    } catch (error) {
      console.error('Erro ao gerar link de pagamento:', error);
      throw error;
    }
  },

  async baixarPDF(id: number): Promise<Blob> {
    try {
      void id;
      throw new Error(
        'Download de PDF de fatura ainda nao esta disponivel na API de faturamento desta versao',
      );
    } catch (error) {
      console.error('Erro ao baixar PDF da fatura:', error);
      throw error;
    }
  },

  // ==================== PAGAMENTOS ====================

  async listarPagamentos(faturaId?: number): Promise<Pagamento[]> {
    try {
      const url = faturaId
        ? `/faturamento/pagamentos?faturaId=${faturaId}`
        : '/faturamento/pagamentos';
      const response = await api.get(url);
      const payload = response.data.data || response.data || [];
      const lista = Array.isArray(payload) ? payload : [];
      return lista.map((item) => toPagamento(item));
    } catch (error) {
      console.error('Erro ao listar pagamentos:', error);
      throw error;
    }
  },

  async criarPagamento(dadosPagamento: NovoPagamento): Promise<Pagamento> {
    try {
      const response = await api.post('/faturamento/pagamentos', dadosPagamento);
      return toPagamento(response.data.data || response.data);
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      throw error;
    }
  },

  async processarPagamento(id: number, dadosProcessamento: any): Promise<Pagamento> {
    try {
      // O endpoint não usa o ID, mas sim o gatewayTransacaoId no body
      void id;
      const response = await api.post(`/faturamento/pagamentos/processar`, dadosProcessamento);
      return toPagamento(response.data.data || response.data);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      throw error;
    }
  },

  async estornarPagamento(id: number, motivo: string): Promise<Pagamento> {
    try {
      const response = await api.post(`/faturamento/pagamentos/${id}/estornar`, {
        motivo,
      });
      return toPagamento(response.data.data || response.data);
    } catch (error) {
      console.error('Erro ao estornar pagamento:', error);
      throw error;
    }
  },

  // ==================== PLANOS DE COBRANÇA ====================

  async listarPlanosCobranca(): Promise<PlanoCobranca[]> {
    try {
      const response = await api.get('/faturamento/planos-cobranca');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erro ao listar planos de cobrança:', error);
      throw error;
    }
  },

  async criarPlanoCobranca(dadosPlano: NovoPlanoCobranca): Promise<PlanoCobranca> {
    try {
      const response = await api.post('/faturamento/planos-cobranca', dadosPlano);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erro ao criar plano de cobrança:', error);
      throw error;
    }
  },

  // ==================== RELATÓRIOS ====================

  async obterEstatisticas(periodo?: { inicio: string; fim: string }) {
    try {
      const res = await this.listarFaturasPaginadas({
        dataInicial: periodo?.inicio,
        dataFinal: periodo?.fim,
        page: 1,
        pageSize: 1000,
      });

      const faturas = res.data || [];
      const totalFaturas = res.total ?? faturas.length;
      const valorTotal = Number(res.aggregates?.valorTotal ?? 0);
      const valorRecebido = Number(res.aggregates?.valorRecebido ?? 0);
      const valorEmAberto = Number(res.aggregates?.valorEmAberto ?? 0);

      return {
        totalFaturas,
        valorTotal,
        valorRecebido,
        valorEmAberto,
        faturasPagas: faturas.filter((f) => f.status === StatusFatura.PAGA).length,
        faturasPendentes: faturas.filter((f) =>
          [
            StatusFatura.PENDENTE,
            StatusFatura.ENVIADA,
            StatusFatura.PARCIALMENTE_PAGA,
          ].includes(f.status),
        ).length,
        faturasVencidas: faturas.filter((f) => f.status === StatusFatura.VENCIDA).length,
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  },

  async obterFaturasVencidas(): Promise<Fatura[]> {
    try {
      return await this.listarFaturas({
        status: StatusFatura.VENCIDA,
        page: 1,
        pageSize: 200,
      });
    } catch (error) {
      console.error('Erro ao obter faturas vencidas:', error);
      throw error;
    }
  },

  async obterEstatisticasPagamentos(periodo?: {
    dataInicio?: string;
    dataFim?: string;
    gateway?: string;
  }): Promise<EstatisticasPagamentos> {
    try {
      const params = new URLSearchParams();
      if (periodo?.dataInicio) params.append('dataInicio', periodo.dataInicio);
      if (periodo?.dataFim) params.append('dataFim', periodo.dataFim);
      if (periodo?.gateway) params.append('gateway', periodo.gateway);

      const response = await api.get(`/faturamento/pagamentos/estatisticas?${params.toString()}`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas de pagamentos:', error);
      throw error;
    }
  },

  async enviarLembretesVencimento(): Promise<void> {
    try {
      await api.post('/faturamento/enviar-lembretes-vencimento');
    } catch (error) {
      console.error('Erro ao enviar lembretes de vencimento:', error);
      throw error;
    }
  },

  async verificarFaturasVencidas(): Promise<void> {
    try {
      await api.post('/faturamento/verificar-faturas-vencidas');
    } catch (error) {
      console.error('Erro ao verificar faturas vencidas:', error);
      throw error;
    }
  },

  async processarCobrancasRecorrentes(): Promise<void> {
    try {
      await api.post('/faturamento/processar-cobrancas-recorrentes');
    } catch (error) {
      console.error('Erro ao processar cobrancas recorrentes:', error);
      throw error;
    }
  },

  // ==================== UTILITÁRIOS ====================

  formatarNumeroFatura(numero: string): string {
    return numero.padStart(6, '0');
  },

  formatarStatusFatura(status: StatusFatura): string {
    const statusMap = {
      [StatusFatura.PENDENTE]: 'Pendente',
      [StatusFatura.ENVIADA]: 'Enviada',
      [StatusFatura.PAGA]: 'Paga',
      [StatusFatura.VENCIDA]: 'Vencida',
      [StatusFatura.CANCELADA]: 'Cancelada',
      [StatusFatura.PARCIALMENTE_PAGA]: 'Parcialmente Paga',
    };
    return statusMap[status] || status;
  },

  formatarTipoFatura(tipo: TipoFatura): string {
    const tipoMap = {
      [TipoFatura.UNICA]: 'Única',
      [TipoFatura.RECORRENTE]: 'Recorrente',
      [TipoFatura.PARCELA]: 'Parcela',
      [TipoFatura.ADICIONAL]: 'Adicional',
    };
    return tipoMap[tipo] || tipo;
  },

  formatarFormaPagamento(forma: FormaPagamento): string {
    const formaMap = {
      [FormaPagamento.PIX]: 'PIX',
      [FormaPagamento.CARTAO_CREDITO]: 'Cartão de Crédito',
      [FormaPagamento.CARTAO_DEBITO]: 'Cartão de Débito',
      [FormaPagamento.BOLETO]: 'Boleto',
      [FormaPagamento.TRANSFERENCIA]: 'Transferência',
      [FormaPagamento.DINHEIRO]: 'Dinheiro',
      [FormaPagamento.A_COMBINAR]: 'A combinar',
    };
    return formaMap[forma] || forma;
  },

  calcularValorTotal(itens: ItemFatura[]): number {
    return itens.reduce((total, item) => {
      const subtotal = item.quantidade * item.valorUnitario;
      const desconto = item.valorDesconto || (subtotal * (item.percentualDesconto || 0)) / 100;
      return total + (subtotal - desconto);
    }, 0);
  },

  verificarVencimento(dataVencimento: string): boolean {
    return new Date(dataVencimento) < new Date();
  },
};

export default faturamentoService;
