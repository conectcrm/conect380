import { api } from './api';
import { isBeforeTodayLocal } from '../utils/dateOnly';

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

export enum StatusPlanoCobranca {
  ATIVO = 'ativo',
  PAUSADO = 'pausado',
  CANCELADO = 'cancelado',
  EXPIRADO = 'expirado',
}

export enum TipoRecorrencia {
  MENSAL = 'mensal',
  TRIMESTRAL = 'trimestral',
  SEMESTRAL = 'semestral',
  ANUAL = 'anual',
  PERSONALIZADO = 'personalizado',
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

export interface FaturaBoletoMetadados {
  paymentId?: string | null;
  barcode?: string | null;
  linhaDigitavel?: string | null;
  pdfUrl?: string | null;
}

export interface FaturaMetadados {
  gateway?: string;
  transactionId?: string;
  paymentMethod?: string;
  boleto?: FaturaBoletoMetadados | null;
  [key: string]: unknown;
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
  codigoBoleto?: string;
  metadados?: FaturaMetadados | null;
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

export interface RegistrarPagamentoManualPayload {
  faturaId: number;
  valor: number;
  metodoPagamento: string;
  dataPagamento?: string;
  observacoes?: string;
  correlationId?: string;
  origemId?: string;
}

export interface ProcessarPagamentoPayload {
  gatewayTransacaoId: string;
  novoStatus: StatusPagamento;
  motivoRejeicao?: string;
  webhookData?: Record<string, unknown>;
  correlationId?: string;
  origemId?: string;
}

export interface WorkflowOperacaoResultado {
  processados: number;
  sucesso: number;
  falhas: number;
}

export interface GerarLinkPagamentoResultado {
  link: string;
  provider?: string;
  referenciaGateway?: string;
  preferenceId?: string;
  paymentId?: string;
  boletoPdfUrl?: string | null;
  boletoBarcode?: string | null;
  boletoLinhaDigitavel?: string | null;
  expiraEm?: string;
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
  codigo?: string;
  contratoId: number;
  contrato?: any;
  clienteId: string;
  usuarioResponsavelId: string;
  usuarioResponsavel?: any;
  nome: string;
  descricao?: string | null;
  tipoRecorrencia: TipoRecorrencia;
  intervaloRecorrencia?: number;
  status: StatusPlanoCobranca;
  valorRecorrente: number;
  diaVencimento: number;
  dataInicio: string;
  dataFim?: string | null;
  proximaCobranca?: string | null;
  limiteCiclos?: number | null;
  ciclosExecutados?: number;
  jurosAtraso?: number;
  multaAtraso?: number;
  diasTolerancia?: number;
  enviarLembrete?: boolean;
  diasAntesLembrete?: number;
  configuracoes?: {
    metodoPagamentoPreferido?: string;
    notificacoesEmail?: boolean;
    notificacoesSMS?: boolean;
    tentativasCobranca?: number;
    webhookUrl?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface NovoPlanoCobranca {
  contratoId: number;
  clienteId: string; // UUID string
  usuarioResponsavelId: string;
  nome: string;
  descricao?: string;
  tipoRecorrencia: TipoRecorrencia;
  intervaloRecorrencia?: number;
  valorRecorrente: number;
  diaVencimento: number;
  dataInicio: string;
  dataFim?: string;
  limiteCiclos?: number;
  jurosAtraso?: number;
  multaAtraso?: number;
  diasTolerancia?: number;
  enviarLembrete?: boolean;
  diasAntesLembrete?: number;
  configuracoes?: {
    metodoPagamentoPreferido?: string;
    notificacoesEmail?: boolean;
    notificacoesSMS?: boolean;
    tentativasCobranca?: number;
    webhookUrl?: string;
  };
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

export type StatusProntidaoCobranca = 'ok' | 'alerta' | 'bloqueio';

export interface CanalProntidaoCobranca {
  operacional: boolean;
  simulado: boolean;
  status: StatusProntidaoCobranca;
  detalhe: string;
  bloqueios: string[];
  alertas: string[];
}

export interface ProntidaoCobranca {
  statusGeral: StatusProntidaoCobranca;
  prontoParaCobrancaOnline: boolean;
  prontoParaCobrancaPorEmail: boolean;
  recomendacaoOperacional: string;
  gateway: CanalProntidaoCobranca;
  email: CanalProntidaoCobranca;
  geradoEm: string;
}

export type TipoDocumentoFinanceiro =
  | 'fatura'
  | 'recibo'
  | 'nfse'
  | 'nfe'
  | 'folha_pagamento'
  | 'outro';

export interface NumeroDocumentoFinanceiroGerado {
  tipoDocumento: TipoDocumentoFinanceiro;
  prefixo: string;
  ano: number;
  sequencial: number;
  numero: string;
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
export type ModoProcessamentoDocumentoFiscal = 'sincrono' | 'lote';

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
  modoProcessamento: ModoProcessamentoDocumentoFiscal;
  contingencia: boolean;
  codigoRetorno: string | null;
  referenciaExterna: string | null;
  historico: DocumentoFiscalHistoricoEvento[];
  resumo: {
    valorServicos: number;
    valorTributos: number;
    valorTotal: number;
  };
}

export interface DocumentoFiscalConfiguracaoDiagnostico {
  configurationSources?: {
    provider: 'tenant' | 'env' | 'default' | 'state';
    requireOfficialProvider: 'tenant' | 'env' | 'default' | 'state';
    officialHttpEnabled: 'tenant' | 'env' | 'default' | 'state';
    officialBaseUrl: 'tenant' | 'env' | 'default' | 'state';
    officialApiToken: 'tenant' | 'env' | 'default' | 'state';
    officialWebhookSecret: 'tenant' | 'env' | 'default' | 'state';
    officialStrictResponse: 'tenant' | 'env' | 'default' | 'state';
    webhookAllowInsecure: 'tenant' | 'env' | 'default' | 'state';
    officialCorrelationHeader: 'tenant' | 'env' | 'default' | 'state';
  };
  usingGlobalFallback?: boolean;
  globalFallbackFields?: string[];
  providerEfetivo: string;
  officialProviderSelected: boolean;
  readyForOfficialEmission: boolean;
  requireOfficialProvider: boolean;
  officialHttpEnabled: boolean;
  officialBaseUrlConfigured: boolean;
  officialStrictResponse: boolean;
  webhookSecretConfigured: boolean;
  webhookAllowInsecure: boolean;
  officialCorrelationHeader: string;
  responseRootPaths: string[];
  blockers: string[];
  warnings: string[];
  recommendations: string[];
  responseAliases: {
    status: string[];
    codigo: string[];
    numero: string[];
    serie: string[];
    chaveAcesso: string[];
    protocolo: string[];
    lote: string[];
    mensagem: string[];
    referenciaExterna: string[];
  };
}

export interface DocumentoFiscalConectividadeDiagnostico {
  providerEfetivo: string;
  officialProviderSelected: boolean;
  readyForOfficialEmission: boolean;
  officialHttpEnabled: boolean;
  officialBaseUrlConfigured: boolean;
  attempted: boolean;
  reachable: boolean;
  success: boolean;
  endpoint: string | null;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | null;
  httpStatus: number | null;
  latencyMs: number | null;
  requestId: string | null;
  correlationId: string | null;
  message: string;
  timestamp: string;
}

export interface DocumentoFiscalPreflightDiagnostico {
  providerEfetivo: string;
  readyForOfficialEmission: boolean;
  status: 'ok' | 'alerta' | 'bloqueio';
  blockers: string[];
  warnings: string[];
  recommendations: string[];
  configuracao: DocumentoFiscalConfiguracaoDiagnostico;
  conectividade: DocumentoFiscalConectividadeDiagnostico;
  timestamp: string;
}

export interface DocumentoFiscalPayload {
  tipo?: TipoDocumentoFiscal;
  ambiente?: AmbienteDocumentoFiscal;
  observacoes?: string;
  forcarReemissao?: boolean;
  modoProcessamento?: ModoProcessamentoDocumentoFiscal;
  contingencia?: boolean;
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

  async gerarCobrancaFaturasVencidas(): Promise<ResultadoCobrancaLote> {
    try {
      const response = await api.post('/faturamento/faturas/cobranca-vencidas');
      const responsePayload = response?.data ?? {};
      const data = responsePayload?.data ?? {};
      const resultadosRaw = Array.isArray(data?.resultados) ? data.resultados : [];

      return {
        solicitadas: Number(data?.solicitadas || 0),
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
      console.error('Erro ao gerar cobranca para faturas vencidas:', error);
      throw error;
    }
  },

  async gerarNumeroDocumentoFinanceiro(
    tipoDocumento: TipoDocumentoFinanceiro,
    anoReferencia?: number,
  ): Promise<NumeroDocumentoFinanceiroGerado> {
    try {
      const body: { tipoDocumento: TipoDocumentoFinanceiro; anoReferencia?: number } = {
        tipoDocumento,
      };
      if (typeof anoReferencia === 'number' && Number.isFinite(anoReferencia)) {
        body.anoReferencia = Math.trunc(anoReferencia);
      }
      const response = await api.post('/faturamento/faturas/documento/gerar-numero', body);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Erro ao gerar numero do documento financeiro:', error);
      throw error;
    }
  },

  async criarRascunhoDocumentoFiscal(
    id: number,
    payload?: DocumentoFiscalPayload,
  ): Promise<DocumentoFiscalStatus> {
    void id;
    void payload;
    throw new Error('Emissao fiscal fora do escopo desta fase do financeiro.');
  },

  async emitirDocumentoFiscal(
    id: number,
    payload?: DocumentoFiscalPayload,
  ): Promise<DocumentoFiscalStatus> {
    void id;
    void payload;
    throw new Error('Emissao fiscal fora do escopo desta fase do financeiro.');
  },

  async obterStatusDocumentoFiscal(
    id: number,
    options?: { sincronizar?: boolean },
  ): Promise<DocumentoFiscalStatus> {
    void id;
    void options;
    throw new Error('Emissao fiscal fora do escopo desta fase do financeiro.');
  },

  async cancelarOuInutilizarDocumentoFiscal(
    id: number,
    payload: DocumentoFiscalCancelamentoPayload,
  ): Promise<DocumentoFiscalStatus> {
    void id;
    void payload;
    throw new Error('Emissao fiscal fora do escopo desta fase do financeiro.');
  },

  async obterDiagnosticoConfiguracaoFiscal(): Promise<DocumentoFiscalConfiguracaoDiagnostico> {
    throw new Error('Emissao fiscal fora do escopo desta fase do financeiro.');
  },

  async testarConectividadeFiscal(): Promise<DocumentoFiscalConectividadeDiagnostico> {
    throw new Error('Emissao fiscal fora do escopo desta fase do financeiro.');
  },

  async executarPreflightFiscal(): Promise<DocumentoFiscalPreflightDiagnostico> {
    throw new Error('Emissao fiscal fora do escopo desta fase do financeiro.');
  },

  async gerarLinkPagamento(id: number): Promise<GerarLinkPagamentoResultado> {
    try {
      const response = await api.post(`/faturamento/faturas/${id}/link-pagamento`);
      const payload = response?.data?.data || response?.data || {};
      const link = typeof payload?.link === 'string' ? payload.link.trim() : '';
      if (!link) {
        throw new Error('API nao retornou um link de pagamento valido.');
      }
      const boletoPdfUrlRaw =
        typeof payload?.boletoPdfUrl === 'string'
          ? payload.boletoPdfUrl.trim()
          : '';
      return {
        link,
        provider: payload?.provider ? String(payload.provider) : undefined,
        referenciaGateway: payload?.referenciaGateway
          ? String(payload.referenciaGateway)
          : undefined,
        preferenceId: payload?.preferenceId ? String(payload.preferenceId) : undefined,
        paymentId: payload?.paymentId ? String(payload.paymentId) : undefined,
        boletoPdfUrl: boletoPdfUrlRaw || null,
        boletoBarcode: payload?.boletoBarcode ? String(payload.boletoBarcode) : null,
        boletoLinhaDigitavel: payload?.boletoLinhaDigitavel
          ? String(payload.boletoLinhaDigitavel)
          : null,
        expiraEm: payload?.expiraEm ? String(payload.expiraEm) : undefined,
      };
    } catch (error) {
      console.error('Erro ao gerar link de pagamento:', error);
      throw error;
    }
  },

  async baixarPDF(id: number): Promise<Blob> {
    try {
      const response = await api.get(`/faturamento/faturas/${id}/pdf`, {
        responseType: 'blob',
      });
      const payload = response.data;
      return payload instanceof Blob ? payload : new Blob([payload], { type: 'application/pdf' });
    } catch (error) {
      console.error('Erro ao baixar PDF da fatura:', error);
      throw error;
    }
  },

  suportaDownloadPdfFatura(): boolean {
    const envFlag = String(process.env.REACT_APP_FATURAMENTO_PDF_ENABLED || '')
      .trim()
      .toLowerCase();
    if (!envFlag) {
      return true;
    }
    return envFlag === 'true';
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

  async registrarPagamentoManual(dadosPagamento: RegistrarPagamentoManualPayload): Promise<Pagamento> {
    try {
      const response = await api.post('/faturamento/pagamentos/manual', dadosPagamento);
      return toPagamento(response.data.data || response.data);
    } catch (error) {
      console.error('Erro ao registrar pagamento manual:', error);
      throw error;
    }
  },

  async processarPagamento(
    id: number,
    dadosProcessamento: ProcessarPagamentoPayload,
  ): Promise<Pagamento> {
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

  async listarPlanosCobranca(filtros?: {
    status?: StatusPlanoCobranca;
    clienteId?: string;
    contratoId?: number;
  }): Promise<PlanoCobranca[]> {
    try {
      const params = new URLSearchParams();
      if (filtros?.status) params.append('status', String(filtros.status));
      if (filtros?.clienteId) params.append('clienteId', String(filtros.clienteId));
      if (typeof filtros?.contratoId === 'number' && Number.isFinite(filtros.contratoId)) {
        params.append('contratoId', String(filtros.contratoId));
      }

      const qs = params.toString();
      const response = await api.get(`/faturamento/planos-cobranca${qs ? `?${qs}` : ''}`);
      const payload = response.data?.data ?? response.data ?? [];
      return Array.isArray(payload) ? payload : [];
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

  async pausarPlanoCobranca(id: number): Promise<PlanoCobranca> {
    try {
      const response = await api.put(`/faturamento/planos-cobranca/${id}/pausar`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Erro ao pausar plano de cobranca:', error);
      throw error;
    }
  },

  async reativarPlanoCobranca(id: number): Promise<PlanoCobranca> {
    try {
      const response = await api.put(`/faturamento/planos-cobranca/${id}/reativar`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Erro ao reativar plano de cobranca:', error);
      throw error;
    }
  },

  async cancelarPlanoCobranca(id: number, motivo?: string): Promise<PlanoCobranca> {
    try {
      const response = await api.put(
        `/faturamento/planos-cobranca/${id}/cancelar`,
        motivo ? { motivo } : {},
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Erro ao cancelar plano de cobranca:', error);
      throw error;
    }
  },

  async gerarFaturaPlanoCobranca(id: number): Promise<Fatura> {
    try {
      const response = await api.post(`/faturamento/planos-cobranca/${id}/gerar-fatura`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Erro ao gerar fatura para plano de cobranca:', error);
      throw error;
    }
  },

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

  async enviarLembretesVencimento(): Promise<WorkflowOperacaoResultado> {
    try {
      const response = await api.post('/faturamento/enviar-lembretes-vencimento');
      return (
        response?.data?.data || {
          processados: 0,
          sucesso: 0,
          falhas: 0,
        }
      );
    } catch (error) {
      console.error('Erro ao enviar lembretes de vencimento:', error);
      throw error;
    }
  },

  async verificarFaturasVencidas(): Promise<WorkflowOperacaoResultado> {
    try {
      const response = await api.post('/faturamento/verificar-faturas-vencidas');
      return (
        response?.data?.data || {
          processados: 0,
          sucesso: 0,
          falhas: 0,
        }
      );
    } catch (error) {
      console.error('Erro ao verificar faturas vencidas:', error);
      throw error;
    }
  },

  async processarCobrancasRecorrentes(): Promise<WorkflowOperacaoResultado> {
    try {
      const response = await api.post('/faturamento/processar-cobrancas-recorrentes');
      return (
        response?.data?.data || {
          processados: 0,
          sucesso: 0,
          falhas: 0,
        }
      );
    } catch (error) {
      console.error('Erro ao processar cobrancas recorrentes:', error);
      throw error;
    }
  },

  async obterProntidaoCobranca(): Promise<ProntidaoCobranca> {
    try {
      const response = await api.get('/faturamento/operacao/prontidao-cobranca');
      return response?.data?.data || response?.data;
    } catch (error) {
      console.error('Erro ao obter prontidao de cobranca:', error);
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
    return isBeforeTodayLocal(dataVencimento);
  },
};

export default faturamentoService;
