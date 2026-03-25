import React from 'react';
import {
  X,
  FileText,
  User,
  DollarSign,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Pencil,
  Download,
  Send,
  Link2,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import {
  AmbienteDocumentoFiscal,
  DocumentoFiscalCancelamentoPayload,
  DocumentoFiscalPayload,
  Fatura,
  DocumentoFiscalStatus,
  DocumentoFiscalConfiguracaoDiagnostico,
  DocumentoFiscalConectividadeDiagnostico,
  DocumentoFiscalPreflightDiagnostico,
  ModoProcessamentoDocumentoFiscal,
  OperacaoDocumentoFiscal,
  StatusDocumentoFiscal,
  StatusFatura,
  StatusPagamento,
  faturamentoService,
} from '../../services/faturamentoService';
import { formatarValorMonetario } from '../../utils/formatacao';
import ModalMotivoEstorno from './ModalMotivoEstorno';
import { getFinanceiroFeatureFlags } from '../../config/financeiroFeatureFlags';

interface EstornoAlvo {
  id: number;
  valor: number;
  transacaoId?: string;
}

interface ModalDetalhesFaturaProps {
  isOpen: boolean;
  onClose: () => void;
  fatura: Fatura;
  fiscalFeatureEnabled?: boolean;
  onEdit?: () => void;
  onGeneratePaymentLink?: (id: number) => void;
  onSendEmail?: (id: number) => void;
  onDownloadPDF?: (id: number) => void;
  onEstornarPagamento?: (pagamentoId: number, motivo: string) => Promise<void>;
  documentoFiscalStatus?: DocumentoFiscalStatus | null;
  onCriarRascunhoFiscal?: (id: number, payload?: DocumentoFiscalPayload) => Promise<void> | void;
  onEmitirDocumentoFiscal?: (id: number, payload?: DocumentoFiscalPayload) => Promise<void> | void;
  onAtualizarStatusFiscal?: (id: number) => Promise<void> | void;
  onCancelarDocumentoFiscal?: (
    id: number,
    payload: DocumentoFiscalCancelamentoPayload,
  ) => Promise<void> | void;
  fiscalActionLoading?: boolean;
}

type TipoDocumentoFinanceiro =
  | 'fatura'
  | 'recibo'
  | 'nfse'
  | 'nfe'
  | 'folha_pagamento'
  | 'outro';

const TIPO_DOCUMENTO_LABELS: Record<TipoDocumentoFinanceiro, string> = {
  fatura: 'Fatura comercial',
  recibo: 'Recibo',
  nfse: 'NFS-e (servico)',
  nfe: 'NF-e (produto)',
  folha_pagamento: 'Folha de pagamento',
  outro: 'Outro documento',
};

interface DocumentoFinanceiroDetalhe {
  tipo: TipoDocumentoFinanceiro;
  modelo?: string;
  numero?: string;
  serie?: string;
  chaveAcesso?: string;
}

interface TributoDetalhadoVisual {
  codigo: string;
  descricao: string;
  valor: number;
  percentual: number;
}

const STATUS_FISCAL_LABELS: Record<StatusDocumentoFiscal, string> = {
  nao_iniciado: 'Nao iniciado',
  rascunho: 'Rascunho',
  pendente_emissao: 'Pendente emissao',
  emitida: 'Emitida',
  erro: 'Erro',
  cancelada: 'Cancelada',
};

const STATUS_FISCAL_CLASSES: Record<StatusDocumentoFiscal, string> = {
  nao_iniciado: 'bg-gray-100 text-gray-700 border-gray-200',
  rascunho: 'bg-amber-100 text-amber-700 border-amber-200',
  pendente_emissao: 'bg-blue-100 text-blue-700 border-blue-200',
  emitida: 'bg-green-100 text-green-700 border-green-200',
  erro: 'bg-red-100 text-red-700 border-red-200',
  cancelada: 'bg-gray-100 text-gray-700 border-gray-200',
};

const OPERACAO_FISCAL_LABELS: Record<OperacaoDocumentoFiscal, string> = {
  cancelar: 'Cancelar documento',
  inutilizar: 'Inutilizar numeracao',
};

const ACAO_HISTORICO_LABELS: Record<string, string> = {
  rascunho_criado: 'Rascunho criado',
  documento_emitido: 'Documento emitido',
  documento_reemitido: 'Documento reemitido',
  documento_enfileirado: 'Documento enfileirado',
  documento_cancelado: 'Documento cancelado',
  numeracao_inutilizada: 'Numeracao inutilizada',
  status_sincronizado: 'Status sincronizado',
  status_sincronizado_emitido: 'Status sincronizado (emitido)',
};

const MODO_PROCESSAMENTO_LABELS: Record<ModoProcessamentoDocumentoFiscal, string> = {
  sincrono: 'Sincrono',
  lote: 'Lote',
};

interface AuditoriaFiscalEventoVisual {
  operacao?: string;
  requestId?: string;
  correlationId?: string;
  httpStatus?: string;
  providerStatusBruto?: string;
  providerCodigoBruto?: string;
  payloadHash?: string;
}

const toNullableText = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const normalized = String(value).trim();
  return normalized ? normalized : undefined;
};

const extrairAuditoriaFiscalEvento = (
  metadata?: Record<string, unknown> | null,
): AuditoriaFiscalEventoVisual | null => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }

  const rawAudit = metadata.audit;
  if (!rawAudit || typeof rawAudit !== 'object' || Array.isArray(rawAudit)) {
    return null;
  }

  const audit = rawAudit as Record<string, unknown>;
  const visual: AuditoriaFiscalEventoVisual = {
    operacao: toNullableText(audit.operacao),
    requestId: toNullableText(audit.requestId),
    correlationId: toNullableText(audit.correlationId),
    httpStatus: toNullableText(audit.httpStatus),
    providerStatusBruto: toNullableText(audit.providerStatusBruto),
    providerCodigoBruto: toNullableText(audit.providerCodigoBruto),
    payloadHash: toNullableText(audit.payloadHash),
  };

  const hasValue = Object.values(visual).some((value) => Boolean(value));
  return hasValue ? visual : null;
};

const extrairDocumentoFinanceiro = (
  detalhes?: Record<string, unknown> | null,
): DocumentoFinanceiroDetalhe | null => {
  if (!detalhes || typeof detalhes !== 'object' || Array.isArray(detalhes)) {
    return null;
  }

  const documentoRaw = detalhes.documento;
  if (!documentoRaw || typeof documentoRaw !== 'object' || Array.isArray(documentoRaw)) {
    return null;
  }

  const documento = documentoRaw as Record<string, unknown>;
  const tipoRaw = String(documento.tipo || 'fatura').trim().toLowerCase() as TipoDocumentoFinanceiro;
  const tipo = Object.prototype.hasOwnProperty.call(TIPO_DOCUMENTO_LABELS, tipoRaw)
    ? tipoRaw
    : 'fatura';

  return {
    tipo,
    modelo: String(documento.modelo || '').trim() || undefined,
    numero: String(documento.numero || '').trim() || undefined,
    serie: String(documento.serie || '').trim() || undefined,
    chaveAcesso: String(documento.chaveAcesso || '').trim() || undefined,
  };
};

const extrairTributosDetalhados = (
  detalhes?: Record<string, unknown> | null,
): TributoDetalhadoVisual[] => {
  if (!detalhes || typeof detalhes !== 'object' || Array.isArray(detalhes)) {
    return [];
  }

  const tributosRaw = detalhes.tributos;
  if (!tributosRaw || typeof tributosRaw !== 'object' || Array.isArray(tributosRaw)) {
    return [];
  }

  const itens = (tributosRaw as Record<string, unknown>).itens;
  if (!Array.isArray(itens)) {
    return [];
  }

  return itens
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null;
      }
      const raw = item as Record<string, unknown>;
      const codigo = String(raw.codigo || '').trim().toUpperCase();
      const descricao = String(raw.descricao || codigo || 'Tributo').trim();
      const valor = Number(raw.valor || 0);
      const percentual = Number(raw.percentual || 0);
      return {
        codigo: codigo || descricao,
        descricao: descricao || codigo || 'Tributo',
        valor: Number.isFinite(valor) ? Math.max(0, valor) : 0,
        percentual: Number.isFinite(percentual) ? Math.max(0, percentual) : 0,
      };
    })
    .filter((item): item is TributoDetalhadoVisual => Boolean(item))
    .filter((item) => item.valor > 0 || item.percentual > 0);
};

export default function ModalDetalhesFatura({
  isOpen,
  onClose,
  fatura,
  fiscalFeatureEnabled = true,
  onEdit,
  onGeneratePaymentLink,
  onSendEmail,
  onDownloadPDF,
  onEstornarPagamento,
  documentoFiscalStatus,
  onCriarRascunhoFiscal,
  onEmitirDocumentoFiscal,
  onAtualizarStatusFiscal,
  onCancelarDocumentoFiscal,
  fiscalActionLoading = false,
}: ModalDetalhesFaturaProps) {
  const financeiroFeatureFlags = getFinanceiroFeatureFlags();
  const fiscalFeatureAtiva =
    fiscalFeatureEnabled && financeiroFeatureFlags.fiscalDocumentsEnabled;

  const [estornandoPagamentoId, setEstornandoPagamentoId] = React.useState<number | null>(null);
  const [estornoAlvo, setEstornoAlvo] = React.useState<EstornoAlvo | null>(null);
  const [motivoEstorno, setMotivoEstorno] = React.useState('');
  const [erroEstorno, setErroEstorno] = React.useState<string | null>(null);
  const [ambienteFiscal, setAmbienteFiscal] = React.useState<AmbienteDocumentoFiscal>('homologacao');
  const [observacaoFiscal, setObservacaoFiscal] = React.useState('');
  const [modoProcessamentoFiscal, setModoProcessamentoFiscal] =
    React.useState<ModoProcessamentoDocumentoFiscal>('sincrono');
  const [contingenciaFiscal, setContingenciaFiscal] = React.useState(false);
  const [motivoOperacaoFiscal, setMotivoOperacaoFiscal] = React.useState('');
  const [operacaoFiscal, setOperacaoFiscal] = React.useState<OperacaoDocumentoFiscal>('cancelar');
  const [mostrarGestaoFiscalAvancada, setMostrarGestaoFiscalAvancada] = React.useState(false);
  const [diagnosticoFiscal, setDiagnosticoFiscal] =
    React.useState<DocumentoFiscalConfiguracaoDiagnostico | null>(null);
  const [carregandoDiagnosticoFiscal, setCarregandoDiagnosticoFiscal] = React.useState(false);
  const [erroDiagnosticoFiscal, setErroDiagnosticoFiscal] = React.useState<string | null>(null);
  const [conectividadeFiscal, setConectividadeFiscal] =
    React.useState<DocumentoFiscalConectividadeDiagnostico | null>(null);
  const [carregandoConectividadeFiscal, setCarregandoConectividadeFiscal] = React.useState(false);
  const [erroConectividadeFiscal, setErroConectividadeFiscal] = React.useState<string | null>(null);
  const [preflightFiscal, setPreflightFiscal] =
    React.useState<DocumentoFiscalPreflightDiagnostico | null>(null);
  const [carregandoPreflightFiscal, setCarregandoPreflightFiscal] = React.useState(false);
  const [erroPreflightFiscal, setErroPreflightFiscal] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !estornandoPagamentoId && !fiscalActionLoading) {
        if (estornoAlvo) {
          setEstornoAlvo(null);
          setMotivoEstorno('');
          setErroEstorno(null);
          return;
        }
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, estornandoPagamentoId, estornoAlvo, fiscalActionLoading]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }
    setObservacaoFiscal('');
    setMotivoOperacaoFiscal('');
    setOperacaoFiscal(documentoFiscalStatus?.status === 'emitida' ? 'cancelar' : 'inutilizar');
    setModoProcessamentoFiscal(documentoFiscalStatus?.modoProcessamento || 'sincrono');
    setContingenciaFiscal(Boolean(documentoFiscalStatus?.contingencia));
    setMostrarGestaoFiscalAvancada(false);
    setDiagnosticoFiscal(null);
    setErroDiagnosticoFiscal(null);
    setCarregandoDiagnosticoFiscal(false);
    setConectividadeFiscal(null);
    setErroConectividadeFiscal(null);
    setCarregandoConectividadeFiscal(false);
    setPreflightFiscal(null);
    setErroPreflightFiscal(null);
    setCarregandoPreflightFiscal(false);
  }, [isOpen, fatura?.id]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }
    setAmbienteFiscal(documentoFiscalStatus?.ambiente || 'homologacao');
  }, [isOpen, documentoFiscalStatus?.ambiente, fatura?.id]);

  if (!isOpen || !fatura) return null;

  const toFiniteNumber = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getStatusIcon = (status: StatusFatura) => {
    switch (status) {
      case StatusFatura.PAGA:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case StatusFatura.VENCIDA:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case StatusFatura.CANCELADA:
        return <XCircle className="w-5 h-5 text-gray-500" />;
      case StatusFatura.ENVIADA:
        return <Send className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: StatusFatura) => {
    switch (status) {
      case StatusFatura.PAGA:
        return 'bg-green-100 text-green-800 border-green-200';
      case StatusFatura.VENCIDA:
        return 'bg-red-100 text-red-800 border-red-200';
      case StatusFatura.CANCELADA:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case StatusFatura.ENVIADA:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case StatusFatura.PARCIALMENTE_PAGA:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const isVencida = faturamentoService.verificarVencimento(fatura.dataVencimento);
  const statusExibicao =
    isVencida && fatura.status === StatusFatura.PENDENTE ? StatusFatura.VENCIDA : fatura.status;
  const valorTotal = toFiniteNumber(fatura.valorTotal);
  const valorDescontoGlobal = toFiniteNumber(fatura.valorDesconto);
  const valorImpostos = toFiniteNumber(fatura.valorImpostos);
  const percentualImpostos =
    fatura.percentualImpostos === null || fatura.percentualImpostos === undefined
      ? null
      : toFiniteNumber(fatura.percentualImpostos);
  const percentualJuros = toFiniteNumber(fatura.percentualJuros);
  const percentualMulta = toFiniteNumber(fatura.percentualMulta);
  const diasCarenciaJuros = Math.max(0, Math.trunc(toFiniteNumber(fatura.diasCarenciaJuros)));
  const subtotalItensBruto = Array.isArray(fatura.itens)
    ? fatura.itens.reduce(
        (acc, item) => acc + toFiniteNumber(item.quantidade) * toFiniteNumber(item.valorUnitario),
        0,
      )
    : 0;
  const subtotalItensLiquido = Array.isArray(fatura.itens)
    ? fatura.itens.reduce((acc, item) => {
        const totalItem =
          toFiniteNumber(item.valorTotal) ||
          Math.max(
            toFiniteNumber(item.quantidade) * toFiniteNumber(item.valorUnitario) -
              toFiniteNumber(item.valorDesconto),
            0,
          );
        return acc + totalItem;
      }, 0)
    : 0;
  const valorDescontoItens = Math.max(subtotalItensBruto - subtotalItensLiquido, 0);
  const valorDescontoTotal = Math.max(valorDescontoItens + valorDescontoGlobal, 0);
  const valorBrutoOriginal = toFiniteNumber(fatura.valorBruto);
  const valorBrutoExibicao =
    valorBrutoOriginal > 0
      ? valorBrutoOriginal
      : subtotalItensBruto > 0
        ? subtotalItensBruto
        : Math.max(valorTotal + valorDescontoTotal - valorImpostos, 0);
  const valorPagoCalculadoAprovado = Array.isArray(fatura.pagamentos)
    ? fatura.pagamentos.reduce((acc, pagamento) => {
        if (pagamento.status !== StatusPagamento.APROVADO) {
          return acc;
        }
        return acc + toFiniteNumber(pagamento.valor);
      }, 0)
    : 0;
  const valorPago = fatura.valorPago !== undefined ? toFiniteNumber(fatura.valorPago) : valorPagoCalculadoAprovado;
  const valorPendente = Math.max(valorTotal - valorPago, 0);
  const formaPagamentoAtual = fatura.formaPagamento || fatura.formaPagamentoPreferida;
  const documentoFinanceiro = extrairDocumentoFinanceiro(fatura.detalhesTributarios);
  const tributosDetalhados = extrairTributosDetalhados(fatura.detalhesTributarios);
  const totalTributosDetalhados = tributosDetalhados.reduce((acc, item) => acc + item.valor, 0);
  const ajusteManualImpostos = Math.max(valorImpostos - totalTributosDetalhados, 0);
  const tipoDocumentoFiscalAtual =
    documentoFiscalStatus?.tipo || (documentoFinanceiro?.tipo === 'nfse' || documentoFinanceiro?.tipo === 'nfe'
      ? documentoFinanceiro.tipo
      : null);
  const statusFiscalAtual: StatusDocumentoFiscal = documentoFiscalStatus?.status || 'nao_iniciado';
  const numeroDocumentoFiscal =
    documentoFiscalStatus?.numeroDocumento || documentoFinanceiro?.numero || null;
  const serieDocumentoFiscal = documentoFiscalStatus?.serie || documentoFinanceiro?.serie || null;
  const chaveDocumentoFiscal =
    documentoFiscalStatus?.chaveAcesso || documentoFinanceiro?.chaveAcesso || null;
  const podeGerenciarDocumentoFiscal =
    fiscalFeatureAtiva && (tipoDocumentoFiscalAtual === 'nfse' || tipoDocumentoFiscalAtual === 'nfe');
  const historicoFiscalOrdenado = Array.isArray(documentoFiscalStatus?.historico)
    ? [...documentoFiscalStatus.historico].sort((a, b) => {
        const dataA = new Date(a.timestamp || 0).getTime();
        const dataB = new Date(b.timestamp || 0).getTime();
        return dataB - dataA;
      })
    : [];
  const podeCancelarDocumentoFiscal = statusFiscalAtual === 'emitida';
  const podeInutilizarDocumentoFiscal =
    ['nao_iniciado', 'rascunho', 'pendente_emissao', 'erro'].includes(statusFiscalAtual);
  const operacaoFiscalEfetiva: OperacaoDocumentoFiscal =
    operacaoFiscal === 'inutilizar' ? 'inutilizar' : 'cancelar';
  const operacaoFiscalHabilitada =
    operacaoFiscalEfetiva === 'cancelar'
      ? podeCancelarDocumentoFiscal
      : podeInutilizarDocumentoFiscal;
  const podeEditarFatura =
    Boolean(onEdit) && ![StatusFatura.PAGA, StatusFatura.CANCELADA].includes(fatura.status);
  const podeGerarLinkPagamento =
    Boolean(onGeneratePaymentLink) &&
    ![StatusFatura.PAGA, StatusFatura.CANCELADA].includes(fatura.status);
  const pagamentosOrdenados = Array.isArray(fatura.pagamentos)
    ? [...fatura.pagamentos].sort((a, b) => {
        const dataB = new Date(b.dataPagamento || b.criadoEm || 0).getTime();
        const dataA = new Date(a.dataPagamento || a.criadoEm || 0).getTime();
        return dataB - dataA;
      })
    : [];
  const diasAtraso = (() => {
    if (!isVencida) {
      return 0;
    }

    const vencimento = new Date(fatura.dataVencimento);
    const hoje = new Date();
    vencimento.setHours(0, 0, 0, 0);
    hoje.setHours(0, 0, 0, 0);
    const diff = Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 1);
  })();

  const getPagamentoBadge = (pagamento: { status?: string; tipo?: string }) => {
    const tipo = String(pagamento.tipo || '').toLowerCase();
    if (tipo === 'estorno') {
      return { label: 'estorno', className: 'bg-orange-100 text-orange-800' };
    }

    switch (pagamento.status) {
      case StatusPagamento.APROVADO:
        return { label: 'aprovado', className: 'bg-green-100 text-green-800' };
      case StatusPagamento.REJEITADO:
        return { label: 'rejeitado', className: 'bg-red-100 text-red-800' };
      case StatusPagamento.CANCELADO:
        return { label: 'cancelado', className: 'bg-gray-100 text-gray-700' };
      case StatusPagamento.PROCESSANDO:
        return { label: 'processando', className: 'bg-blue-100 text-blue-800' };
      case StatusPagamento.ESTORNADO:
        return { label: 'estornado', className: 'bg-orange-100 text-orange-800' };
      default:
        return { label: 'pendente', className: 'bg-yellow-100 text-yellow-800' };
    }
  };

  const handleEstornarPagamento = (
    pagamentoId?: number,
    valor?: number,
    transacaoId?: string,
  ) => {
    if (!onEstornarPagamento || !pagamentoId || pagamentoId <= 0) {
      return;
    }

    setErroEstorno(null);
    setMotivoEstorno('');
    setEstornoAlvo({
      id: pagamentoId,
      valor: Number(valor || 0),
      transacaoId,
    });
  };

  const fecharModalEstorno = () => {
    if (estornandoPagamentoId) {
      return;
    }

    setEstornoAlvo(null);
    setMotivoEstorno('');
    setErroEstorno(null);
  };

  const confirmarEstorno = async () => {
    if (!onEstornarPagamento || !estornoAlvo?.id) {
      return;
    }

    const motivo = motivoEstorno.trim();
    if (!motivo) {
      setErroEstorno('Motivo do estorno e obrigatorio.');
      return;
    }

    setErroEstorno(null);
    setEstornandoPagamentoId(estornoAlvo.id);
    try {
      await onEstornarPagamento(estornoAlvo.id, motivo);
      setEstornoAlvo(null);
      setMotivoEstorno('');
    } catch (error) {
      console.error('Erro ao estornar pagamento:', error);
      setErroEstorno('Falha ao estornar pagamento. Tente novamente.');
    } finally {
      setEstornandoPagamentoId(null);
    }
  };

  const handleCriarRascunhoFiscal = () => {
    if (!fiscalFeatureAtiva || !onCriarRascunhoFiscal) {
      return;
    }
    const payload: DocumentoFiscalPayload = {
      tipo: tipoDocumentoFiscalAtual || undefined,
      ambiente: ambienteFiscal,
      observacoes: observacaoFiscal.trim() || undefined,
    };
    void onCriarRascunhoFiscal(fatura.id, payload);
  };

  const handleEmitirDocumentoFiscal = () => {
    if (!fiscalFeatureAtiva || !onEmitirDocumentoFiscal) {
      return;
    }
    const payload: DocumentoFiscalPayload = {
      tipo: tipoDocumentoFiscalAtual || undefined,
      ambiente: ambienteFiscal,
      observacoes: observacaoFiscal.trim() || undefined,
      modoProcessamento: modoProcessamentoFiscal,
      contingencia: contingenciaFiscal,
      forcarReemissao: statusFiscalAtual === 'emitida',
    };
    void onEmitirDocumentoFiscal(fatura.id, payload);
  };

  const handleCancelarOuInutilizarDocumentoFiscal = () => {
    if (!fiscalFeatureAtiva || !onCancelarDocumentoFiscal) {
      return;
    }
    const motivo = motivoOperacaoFiscal.trim();
    if (!motivo) {
      return;
    }
    void onCancelarDocumentoFiscal(fatura.id, {
      tipoOperacao: operacaoFiscalEfetiva,
      motivo,
      ambiente: ambienteFiscal,
    });
  };

  const handleCarregarDiagnosticoFiscal = async () => {
    if (!fiscalFeatureAtiva) {
      return;
    }

    setErroDiagnosticoFiscal(null);
    setCarregandoDiagnosticoFiscal(true);
    try {
      const diagnostico = await faturamentoService.obterDiagnosticoConfiguracaoFiscal();
      setDiagnosticoFiscal(diagnostico);
    } catch (error) {
      console.error('Erro ao carregar diagnostico fiscal:', error);
      setErroDiagnosticoFiscal('Nao foi possivel carregar o diagnostico fiscal.');
    } finally {
      setCarregandoDiagnosticoFiscal(false);
    }
  };

  const handleTestarConectividadeFiscal = async () => {
    if (!fiscalFeatureAtiva) {
      return;
    }

    setErroConectividadeFiscal(null);
    setCarregandoConectividadeFiscal(true);
    try {
      const conectividade = await faturamentoService.testarConectividadeFiscal();
      setConectividadeFiscal(conectividade);
    } catch (error) {
      console.error('Erro ao testar conectividade fiscal:', error);
      setErroConectividadeFiscal('Nao foi possivel executar o teste de conectividade fiscal.');
    } finally {
      setCarregandoConectividadeFiscal(false);
    }
  };

  const handleExecutarPreflightFiscal = async () => {
    if (!fiscalFeatureAtiva) {
      return;
    }

    setErroPreflightFiscal(null);
    setCarregandoPreflightFiscal(true);
    try {
      const preflight = await faturamentoService.executarPreflightFiscal();
      setPreflightFiscal(preflight);
      setDiagnosticoFiscal(preflight.configuracao);
      setConectividadeFiscal(preflight.conectividade);
    } catch (error) {
      console.error('Erro ao executar preflight fiscal:', error);
      setErroPreflightFiscal('Nao foi possivel executar o preflight fiscal.');
    } finally {
      setCarregandoPreflightFiscal(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0D1F2A]/45 p-4"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !estornandoPagamentoId &&
          !estornoAlvo &&
          !fiscalActionLoading
        ) {
          onClose();
        }
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-[1180px] overflow-y-auto rounded-2xl border border-[#DCE8EC] bg-white shadow-[0_30px_60px_-30px_rgba(7,36,51,0.55)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-detalhes-fatura-titulo"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E1EAEE] bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ECF7F3]">
              <FileText className="h-5 w-5 text-[#159A9C]" />
            </div>
            <div>
              <h2
                id="modal-detalhes-fatura-titulo"
                className="text-xl font-semibold text-[#173A4D]"
              >
                Fatura #{faturamentoService.formatarNumeroFatura(fatura.numero)}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(statusExibicao)}
                <span
                  className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(statusExibicao)}`}
                >
                  {faturamentoService.formatarStatusFatura(statusExibicao)}
                </span>
                {statusExibicao === StatusFatura.VENCIDA && diasAtraso > 0 && (
                  <span className="text-xs font-medium text-red-700">
                    Atrasada ha {diasAtraso} dia(s)
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {/* Botoes de Acao */}
            {podeEditarFatura && (
              <button
                onClick={() => onEdit?.()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D4E2E7] text-[#244455] transition hover:bg-[#F6FAFB]"
                title="Editar Fatura"
                aria-label="Editar fatura"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {onDownloadPDF && (
              <button
                onClick={() => onDownloadPDF(fatura.id)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D4E2E7] text-[#244455] transition hover:bg-[#F6FAFB]"
                title="Baixar PDF"
                aria-label="Baixar PDF da fatura"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            {onSendEmail && (
              <button
                onClick={() => onSendEmail(fatura.id)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D4E2E7] text-[#244455] transition hover:bg-[#F6FAFB]"
                title="Enviar por Email"
                aria-label="Enviar fatura por email"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
            {podeGerarLinkPagamento && (
              <button
                onClick={() => onGeneratePaymentLink?.(fatura.id)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D4E2E7] text-[#244455] transition hover:bg-[#F6FAFB]"
                title="Gerar Link de Pagamento"
                aria-label="Gerar link de pagamento da fatura"
              >
                <Link2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              disabled={Boolean(estornandoPagamentoId || estornoAlvo || fiscalActionLoading)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5E7784] transition hover:bg-[#F4F8FA] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Fechar detalhes da fatura"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-lg border border-[#DCE8EC] bg-[#F8FBFC] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5E7784]">Emissao</p>
              <p className="mt-1 text-sm font-semibold text-[#173A4D]">
                {new Date(fatura.dataEmissao).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="rounded-lg border border-[#DCE8EC] bg-[#F8FBFC] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5E7784]">Vencimento</p>
              <p className={`mt-1 text-sm font-semibold ${isVencida ? 'text-red-600' : 'text-[#173A4D]'}`}>
                {new Date(fatura.dataVencimento).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="rounded-lg border border-[#DCE8EC] bg-[#F8FBFC] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5E7784]">Valor total</p>
              <p className="mt-1 text-sm font-semibold text-[#117C7E]">
                R$ {formatarValorMonetario(valorTotal)}
              </p>
            </div>
            <div className="rounded-lg border border-[#DCE8EC] bg-[#F8FBFC] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5E7784]">
                {valorPendente > 0 ? 'Saldo pendente' : 'Situacao'}
              </p>
              <p className={`mt-1 text-sm font-semibold ${valorPendente > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {valorPendente > 0 ? `R$ ${formatarValorMonetario(valorPendente)}` : 'Liquidada'}
              </p>
            </div>
          </div>

          {/* Informacoes Principais */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
            <div className="space-y-4">
              {/* Informacoes da Fatura */}
              <div className="rounded-xl border border-[#DCE8EC] bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-[#173A4D]">Informacoes da Fatura</h3>
                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-gray-500">Tipo:</span>
                    <p className="font-medium">
                      {faturamentoService.formatarTipoFatura(fatura.tipo)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Forma de Pagamento:</span>
                    <p className="font-medium">
                      {formaPagamentoAtual
                        ? faturamentoService.formatarFormaPagamento(formaPagamentoAtual)
                        : 'Nao definida'}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-500">Documento financeiro:</span>
                    <p className="font-medium">
                      {documentoFinanceiro
                        ? TIPO_DOCUMENTO_LABELS[documentoFinanceiro.tipo]
                        : 'Fatura comercial'}
                      {documentoFinanceiro?.numero ? ` #${documentoFinanceiro.numero}` : ''}
                      {documentoFinanceiro?.serie ? ` (serie ${documentoFinanceiro.serie})` : ''}
                    </p>
                    {documentoFinanceiro?.modelo && (
                      <p className="text-xs text-gray-500">Modelo: {documentoFinanceiro.modelo}</p>
                    )}
                    {documentoFinanceiro?.chaveAcesso && (
                      <p className="text-xs text-gray-500 break-all">
                        Chave/protocolo: {documentoFinanceiro.chaveAcesso}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Informacoes do Cliente */}
              {fatura.cliente && (
                <div className="rounded-xl border border-[#DCE8EC] bg-white p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#173A4D]">
                    <User className="w-4 h-4" />
                    Cliente
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-gray-900">
                      {fatura.cliente.nome || `Cliente ID: ${fatura.clienteId}`}
                    </p>
                    {fatura.cliente.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-3 h-3" />
                        {fatura.cliente.email}
                      </div>
                    )}
                    {fatura.cliente.telefone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-3 h-3" />
                        {fatura.cliente.telefone}
                      </div>
                    )}
                    {fatura.cliente.endereco && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {fatura.cliente.endereco}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Observacoes */}
              {fatura.observacoes && (
                <div className="rounded-xl border border-[#DCE8EC] bg-white p-4">
                  <h3 className="mb-3 text-sm font-semibold text-[#173A4D]">Observacoes</h3>
                  <p className="text-sm text-gray-600">{fatura.observacoes}</p>
                </div>
              )}
            </div>

            {/* Resumo Financeiro */}
            <div className="space-y-4 xl:sticky xl:top-24 self-start">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Resumo Financeiro
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor Bruto:</span>
                    <span className="font-medium">
                      R$ {formatarValorMonetario(valorBrutoExibicao)}
                    </span>
                  </div>
                  {valorDescontoTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Descontos:</span>
                      <span className="font-medium text-red-600">
                        - R$ {formatarValorMonetario(valorDescontoTotal)}
                      </span>
                    </div>
                  )}
                  {valorDescontoItens > 0 && (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Desconto nos itens</span>
                      <span>- R$ {formatarValorMonetario(valorDescontoItens)}</span>
                    </div>
                  )}
                  {valorDescontoGlobal > 0 && (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Desconto global</span>
                      <span>- R$ {formatarValorMonetario(valorDescontoGlobal)}</span>
                    </div>
                  )}
                  {valorImpostos > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Impostos{percentualImpostos !== null ? ` (${percentualImpostos.toFixed(2)}%)` : ''}:
                      </span>
                      <span className="font-medium">
                        + R$ {formatarValorMonetario(valorImpostos)}
                      </span>
                    </div>
                  )}
                  {tributosDetalhados.length > 0 && (
                    <div className="rounded-md border border-[#DCE8EC] bg-white/80 px-3 py-2 text-xs text-[#46616F]">
                      {tributosDetalhados.map((tributo) => (
                        <div key={tributo.codigo} className="flex justify-between py-0.5">
                          <span>
                            {tributo.descricao}
                            {tributo.percentual > 0 ? ` (${tributo.percentual.toFixed(2)}%)` : ''}
                          </span>
                          <strong>R$ {formatarValorMonetario(tributo.valor)}</strong>
                        </div>
                      ))}
                      <div className="mt-1 flex justify-between border-t border-[#E4ECEF] pt-1 font-semibold">
                        <span>Total tributos detalhados</span>
                        <span>R$ {formatarValorMonetario(totalTributosDetalhados)}</span>
                      </div>
                      {ajusteManualImpostos > 0 && (
                        <div className="mt-1 flex justify-between text-[11px] text-[#6B7F89]">
                          <span>Ajuste manual/outras taxas</span>
                          <span>R$ {formatarValorMonetario(ajusteManualImpostos)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {(percentualJuros > 0 || percentualMulta > 0) && (
                    <div className="rounded-md border border-[#DCE8EC] bg-white/80 px-3 py-2 text-xs text-[#46616F]">
                      <p>
                        Juros configurado: <strong>{percentualJuros.toFixed(2)}%</strong> | Multa:{' '}
                        <strong>{percentualMulta.toFixed(2)}%</strong>
                      </p>
                      <p>Carencia para juros: {diasCarenciaJuros} dia(s)</p>
                    </div>
                  )}
                  <hr className="border-gray-300" />
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total:</span>
                    <span className="font-semibold text-green-600">
                      R$ {formatarValorMonetario(valorTotal)}
                    </span>
                  </div>

                  {valorPago > 0 && (
                    <>
                      <hr className="border-gray-300" />
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor Pago:</span>
                        <span className="font-medium text-green-600">
                          R$ {formatarValorMonetario(valorPago)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor Pendente:</span>
                        <span
                          className={`font-medium ${valorPendente > 0 ? 'text-red-600' : 'text-green-600'}`}
                        >
                          R$ {formatarValorMonetario(valorPendente)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Link de Pagamento */}
              {fatura.linkPagamento && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Link de Pagamento
                  </h3>
                  <a
                    href={fatura.linkPagamento}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 underline break-all"
                  >
                    {fatura.linkPagamento}
                  </a>
                </div>
              )}

              <div className="rounded-xl border border-[#DCE8EC] bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-[#173A4D]">Documento Fiscal</h3>
                {!fiscalFeatureAtiva ? (
                  <p className="rounded-md border border-[#E2ECEF] bg-[#F8FBFC] p-2 text-[11px] text-[#5E7784]">
                    {financeiroFeatureFlags.fiscalDisabledReason ||
                      'Emissao fiscal (NF-e/NFS-e) desabilitada neste ambiente.'}
                  </p>
                ) : (
                  <>
                    <div className="space-y-2 text-xs text-[#47606C]">
                  <div className="flex justify-between">
                    <span>Tipo:</span>
                    <strong className="text-[#173A4D]">
                      {tipoDocumentoFiscalAtual === 'nfe'
                        ? 'NF-e'
                        : tipoDocumentoFiscalAtual === 'nfse'
                          ? 'NFS-e'
                          : 'Nao fiscal'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${STATUS_FISCAL_CLASSES[statusFiscalAtual]}`}
                    >
                      {STATUS_FISCAL_LABELS[statusFiscalAtual]}
                    </span>
                  </div>
                  {numeroDocumentoFiscal && (
                    <div className="flex justify-between">
                      <span>Numero:</span>
                      <strong className="text-[#173A4D]">{numeroDocumentoFiscal}</strong>
                    </div>
                  )}
                  {serieDocumentoFiscal && (
                    <div className="flex justify-between">
                      <span>Serie:</span>
                      <strong className="text-[#173A4D]">{serieDocumentoFiscal}</strong>
                    </div>
                  )}
                  {documentoFiscalStatus?.protocolo && (
                    <div className="flex justify-between">
                      <span>Protocolo:</span>
                      <strong className="text-[#173A4D]">{documentoFiscalStatus.protocolo}</strong>
                    </div>
                  )}
                  {documentoFiscalStatus?.modoProcessamento && (
                    <div className="flex justify-between">
                      <span>Processamento:</span>
                      <strong className="text-[#173A4D]">
                        {MODO_PROCESSAMENTO_LABELS[documentoFiscalStatus.modoProcessamento] ||
                          documentoFiscalStatus.modoProcessamento}
                      </strong>
                    </div>
                  )}
                  {documentoFiscalStatus && (
                    <div className="flex justify-between">
                      <span>Contingencia:</span>
                      <strong className="text-[#173A4D]">
                        {documentoFiscalStatus.contingencia ? 'Ativa' : 'Nao'}
                      </strong>
                    </div>
                  )}
                  {documentoFiscalStatus?.codigoRetorno && (
                    <div className="flex justify-between">
                      <span>Codigo retorno:</span>
                      <strong className="text-[#173A4D]">{documentoFiscalStatus.codigoRetorno}</strong>
                    </div>
                  )}
                  {documentoFiscalStatus?.referenciaExterna && (
                    <p className="break-all text-[11px] text-[#5E7784]">
                      Ref. provider: {documentoFiscalStatus.referenciaExterna}
                    </p>
                  )}
                  {documentoFiscalStatus?.resumo && (
                    <div className="rounded-md border border-[#E2ECEF] bg-[#F8FBFC] px-2 py-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span>Base servicos:</span>
                        <strong>R$ {formatarValorMonetario(documentoFiscalStatus.resumo.valorServicos)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Tributos:</span>
                        <strong>R$ {formatarValorMonetario(documentoFiscalStatus.resumo.valorTributos)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Total fiscal:</span>
                        <strong>R$ {formatarValorMonetario(documentoFiscalStatus.resumo.valorTotal)}</strong>
                      </div>
                    </div>
                  )}
                  {chaveDocumentoFiscal && (
                    <p className="break-all text-[11px] text-[#5E7784]">Chave: {chaveDocumentoFiscal}</p>
                  )}
                  {documentoFiscalStatus?.ultimaMensagem && (
                    <p className="rounded-md border border-[#E4ECEF] bg-[#F8FBFC] p-2 text-[11px] text-[#5E7784]">
                      {documentoFiscalStatus.ultimaMensagem}
                    </p>
                  )}
                  {documentoFiscalStatus?.atualizadoEm && (
                    <p className="text-[11px] text-[#6C808A]">
                      Atualizado em {new Date(documentoFiscalStatus.atualizadoEm).toLocaleString('pt-BR')}
                    </p>
                  )}
                    </div>

                    {podeGerenciarDocumentoFiscal ? (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => setMostrarGestaoFiscalAvancada((prev) => !prev)}
                          className="inline-flex h-8 items-center justify-center rounded-md border border-[#D4E2E7] bg-white px-3 text-xs font-medium text-[#2A4D5F] transition hover:bg-[#F6FAFB]"
                        >
                          {mostrarGestaoFiscalAvancada
                            ? 'Ocultar gestao fiscal avancada'
                            : 'Mostrar gestao fiscal avancada'}
                        </button>
                      </div>
                    ) : (
                      <p className="mt-3 text-[11px] text-[#5E7784]">
                        Documento atual nao exige emissao fiscal automatizada.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {podeGerenciarDocumentoFiscal && mostrarGestaoFiscalAvancada && (
            <div className="overflow-hidden rounded-xl border border-[#DCE8EC] bg-white">
              <div className="border-b border-[#E4ECEF] bg-[#F8FBFC] px-4 py-3">
                <h3 className="text-sm font-semibold text-[#173A4D]">Gestao Fiscal Avancada</h3>
                <p className="mt-1 text-xs text-[#5E7784]">
                  Operacoes de emissao, cancelamento/inutilizacao e historico fiscal centralizados.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-[#4A6472]">
                      Ambiente fiscal
                    </label>
                    <select
                      value={ambienteFiscal}
                      onChange={(event) =>
                        setAmbienteFiscal(
                          event.target.value === 'producao' ? 'producao' : 'homologacao',
                        )
                      }
                      disabled={fiscalActionLoading}
                      className="h-9 w-full rounded-md border border-[#D4E2E7] bg-white px-3 text-xs text-[#28485A] focus:border-[#159A9C] focus:outline-none"
                    >
                      <option value="homologacao">Homologacao</option>
                      <option value="producao">Producao</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-[#4A6472]">
                      Observacao da acao
                    </label>
                    <textarea
                      value={observacaoFiscal}
                      onChange={(event) => setObservacaoFiscal(event.target.value)}
                      disabled={fiscalActionLoading}
                      rows={3}
                      className="w-full resize-y rounded-md border border-[#D4E2E7] bg-white px-3 py-2 text-xs text-[#28485A] focus:border-[#159A9C] focus:outline-none"
                      placeholder="Opcional. Ex: emissao solicitada apos conferencia fiscal."
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-[#4A6472]">
                        Modo de emissao
                      </label>
                      <select
                        value={modoProcessamentoFiscal}
                        onChange={(event) =>
                          setModoProcessamentoFiscal(
                            event.target.value === 'lote' ? 'lote' : 'sincrono',
                          )
                        }
                        disabled={fiscalActionLoading}
                        className="h-9 w-full rounded-md border border-[#D4E2E7] bg-white px-3 text-xs text-[#28485A] focus:border-[#159A9C] focus:outline-none"
                      >
                        <option value="sincrono">Sincrono</option>
                        <option value="lote">Lote</option>
                      </select>
                    </div>
                    <label className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-[#4A6472]">
                      <input
                        type="checkbox"
                        checked={contingenciaFiscal}
                        onChange={(event) => setContingenciaFiscal(event.target.checked)}
                        disabled={fiscalActionLoading}
                        className="h-4 w-4 rounded border-[#C8D8DE] text-[#159A9C] focus:ring-[#159A9C]"
                      />
                      Emitir em contingencia
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={handleCriarRascunhoFiscal}
                      disabled={!onCriarRascunhoFiscal || fiscalActionLoading || fatura.status === StatusFatura.CANCELADA}
                      className="inline-flex h-9 items-center justify-center gap-1 rounded-md border border-[#D4E2E7] bg-white px-2 text-xs font-medium text-[#28485A] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {fiscalActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Criar rascunho
                    </button>
                    <button
                      type="button"
                      onClick={handleEmitirDocumentoFiscal}
                      disabled={!onEmitirDocumentoFiscal || fiscalActionLoading || fatura.status === StatusFatura.CANCELADA}
                      className="inline-flex h-9 items-center justify-center gap-1 rounded-md bg-[#159A9C] px-2 text-xs font-medium text-white transition hover:bg-[#117C7E] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {fiscalActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      {statusFiscalAtual === 'emitida' ? 'Reemitir' : 'Emitir'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void onAtualizarStatusFiscal?.(fatura.id)}
                      disabled={!onAtualizarStatusFiscal || fiscalActionLoading}
                      className="inline-flex h-9 items-center justify-center gap-1 rounded-md border border-[#D4E2E7] bg-white px-2 text-xs font-medium text-[#28485A] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {fiscalActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Atualizar status
                    </button>
                  </div>

                  <div className="rounded-md border border-[#E2ECEF] bg-[#F8FBFC] p-3">
                    <label className="mb-1 block text-[11px] font-medium text-[#4A6472]">
                      Operacao final
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOperacaoFiscal('cancelar')}
                        disabled={fiscalActionLoading}
                        className={`h-9 rounded-md border text-xs font-medium transition ${
                          operacaoFiscalEfetiva === 'cancelar'
                            ? 'border-[#159A9C] bg-[#E9F8F7] text-[#117C7E]'
                            : 'border-[#D4E2E7] bg-white text-[#3A5868]'
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => setOperacaoFiscal('inutilizar')}
                        disabled={fiscalActionLoading}
                        className={`h-9 rounded-md border text-xs font-medium transition ${
                          operacaoFiscalEfetiva === 'inutilizar'
                            ? 'border-[#159A9C] bg-[#E9F8F7] text-[#117C7E]'
                            : 'border-[#D4E2E7] bg-white text-[#3A5868]'
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        Inutilizar
                      </button>
                    </div>
                    <textarea
                      value={motivoOperacaoFiscal}
                      onChange={(event) => setMotivoOperacaoFiscal(event.target.value)}
                      disabled={fiscalActionLoading}
                      rows={3}
                      className="mt-2 w-full resize-y rounded-md border border-[#D4E2E7] bg-white px-3 py-2 text-xs text-[#28485A] focus:border-[#159A9C] focus:outline-none"
                      placeholder="Motivo obrigatorio para a operacao final."
                    />
                    <button
                      type="button"
                      onClick={handleCancelarOuInutilizarDocumentoFiscal}
                      disabled={
                        !onCancelarDocumentoFiscal ||
                        !motivoOperacaoFiscal.trim() ||
                        !operacaoFiscalHabilitada ||
                        fiscalActionLoading
                      }
                      className="mt-2 inline-flex h-9 w-full items-center justify-center gap-1 rounded-md border border-[#D4E2E7] bg-white px-2 text-xs font-medium text-[#28485A] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {fiscalActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      {OPERACAO_FISCAL_LABELS[operacaoFiscalEfetiva]}
                    </button>
                    {!operacaoFiscalHabilitada && (
                      <p className="mt-1 text-[11px] text-[#87614A]">
                        Operacao indisponivel para o status atual ({STATUS_FISCAL_LABELS[statusFiscalAtual]}).
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-md border border-[#E2ECEF] bg-[#F8FBFC] p-3 text-xs text-[#4A6472]">
                    <p>
                      Status atual: <strong>{STATUS_FISCAL_LABELS[statusFiscalAtual]}</strong>
                    </p>
                    {documentoFiscalStatus?.modoProcessamento && (
                      <p>
                        Processamento:{' '}
                        <strong>
                          {MODO_PROCESSAMENTO_LABELS[documentoFiscalStatus.modoProcessamento] ||
                            documentoFiscalStatus.modoProcessamento}
                        </strong>
                      </p>
                    )}
                    {documentoFiscalStatus && (
                      <p>
                        Contingencia:{' '}
                        <strong>{documentoFiscalStatus.contingencia ? 'Ativa' : 'Nao'}</strong>
                      </p>
                    )}
                    {numeroDocumentoFiscal && (
                      <p>
                        Documento: <strong>{numeroDocumentoFiscal}</strong>
                      </p>
                    )}
                    {documentoFiscalStatus?.codigoRetorno && (
                      <p>
                        Codigo retorno: <strong>{documentoFiscalStatus.codigoRetorno}</strong>
                      </p>
                    )}
                    {documentoFiscalStatus?.referenciaExterna && (
                      <p className="break-all">
                        Ref. provider: <strong>{documentoFiscalStatus.referenciaExterna}</strong>
                      </p>
                    )}
                  </div>

                  <div className="rounded-md border border-[#E2ECEF] bg-white p-3 text-xs text-[#4A6472]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-[#173A4D]">Diagnostico de configuracao fiscal</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handleExecutarPreflightFiscal()}
                          disabled={carregandoPreflightFiscal}
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-[#1C8E90] bg-[#159A9C] px-2 text-[11px] font-medium text-white transition hover:bg-[#117F81] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {carregandoPreflightFiscal ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : null}
                          Executar preflight
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleCarregarDiagnosticoFiscal()}
                          disabled={carregandoDiagnosticoFiscal}
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-[#D4E2E7] bg-white px-2 text-[11px] font-medium text-[#28485A] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {carregandoDiagnosticoFiscal ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : null}
                          Verificar config
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleTestarConectividadeFiscal()}
                          disabled={carregandoConectividadeFiscal}
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-[#159A9C] bg-[#EAF8F8] px-2 text-[11px] font-medium text-[#117C7E] transition hover:bg-[#DDF3F3] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {carregandoConectividadeFiscal ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : null}
                          Testar conexao
                        </button>
                      </div>
                    </div>
                    {erroDiagnosticoFiscal && (
                      <p className="mt-2 rounded border border-[#F1D3D3] bg-[#FFF3F3] px-2 py-1 text-[11px] text-[#9A3D3D]">
                        {erroDiagnosticoFiscal}
                      </p>
                    )}
                    {erroConectividadeFiscal && (
                      <p className="mt-2 rounded border border-[#F1D3D3] bg-[#FFF3F3] px-2 py-1 text-[11px] text-[#9A3D3D]">
                        {erroConectividadeFiscal}
                      </p>
                    )}
                    {erroPreflightFiscal && (
                      <p className="mt-2 rounded border border-[#F1D3D3] bg-[#FFF3F3] px-2 py-1 text-[11px] text-[#9A3D3D]">
                        {erroPreflightFiscal}
                      </p>
                    )}
                    {preflightFiscal && (
                      <div
                        className={`mt-2 rounded border px-2 py-1.5 text-[11px] ${
                          preflightFiscal.status === 'ok'
                            ? 'border-[#CDEADB] bg-[#F1FBF6] text-[#1B6D4A]'
                            : preflightFiscal.status === 'alerta'
                              ? 'border-[#F6E4C1] bg-[#FFF9EE] text-[#8A6A22]'
                              : 'border-[#F4D8D8] bg-[#FFF5F5] text-[#9A3D3D]'
                        }`}
                      >
                        <p className="font-semibold">Preflight fiscal</p>
                        <p>
                          Status: <strong>{preflightFiscal.status.toUpperCase()}</strong> | Pronto para emissao
                          oficial: <strong>{preflightFiscal.readyForOfficialEmission ? 'Sim' : 'Nao'}</strong>
                        </p>
                        <p>
                          Executado em:{' '}
                          <strong>{new Date(preflightFiscal.timestamp).toLocaleString('pt-BR')}</strong>
                        </p>
                      </div>
                    )}
                    {diagnosticoFiscal && (
                      <div className="mt-2 space-y-1.5 rounded border border-[#E8F0F3] bg-[#F9FCFD] p-2">
                        <p>
                          Pronto para emissao oficial:{' '}
                          <strong
                            className={
                              diagnosticoFiscal.readyForOfficialEmission ? 'text-[#117C7E]' : 'text-[#A8572A]'
                            }
                          >
                            {diagnosticoFiscal.readyForOfficialEmission ? 'Sim' : 'Nao'}
                          </strong>
                        </p>
                        <p>
                          Provider efetivo: <strong>{diagnosticoFiscal.providerEfetivo}</strong>
                        </p>
                        <p>
                          Provider oficial selecionado:{' '}
                          <strong>{diagnosticoFiscal.officialProviderSelected ? 'Sim' : 'Nao'}</strong>
                        </p>
                        <p>
                          Modo estrito: <strong>{diagnosticoFiscal.officialStrictResponse ? 'Ativo' : 'Desativado'}</strong>
                        </p>
                        <p>
                          HTTP oficial:{' '}
                          <strong>{diagnosticoFiscal.officialHttpEnabled ? 'Ativo' : 'Desativado'}</strong>
                        </p>
                        <p>
                          Base URL:{' '}
                          <strong>
                            {diagnosticoFiscal.officialBaseUrlConfigured ? 'Configurada' : 'Nao configurada'}
                          </strong>
                        </p>
                        <p>
                          Webhook secret:{' '}
                          <strong>
                            {diagnosticoFiscal.webhookSecretConfigured ? 'Configurado' : 'Nao configurado'}
                          </strong>
                        </p>
                        <p>
                          Root paths: <strong>{diagnosticoFiscal.responseRootPaths.join(', ') || '-'}</strong>
                        </p>
                        {diagnosticoFiscal.blockers.length > 0 && (
                          <div className="rounded border border-[#F4D8D8] bg-[#FFF5F5] px-2 py-1 text-[11px] text-[#9A3D3D]">
                            <p className="font-semibold">Bloqueios</p>
                            {diagnosticoFiscal.blockers.map((item, index) => (
                              <p key={`blocker-${index}`}>- {item}</p>
                            ))}
                          </div>
                        )}
                        {diagnosticoFiscal.warnings.length > 0 && (
                          <div className="rounded border border-[#F6E9CC] bg-[#FFF9EE] px-2 py-1 text-[11px] text-[#8A6A22]">
                            <p className="font-semibold">Alertas</p>
                            {diagnosticoFiscal.warnings.map((item, index) => (
                              <p key={`warning-${index}`}>- {item}</p>
                            ))}
                          </div>
                        )}
                        {diagnosticoFiscal.recommendations.length > 0 && (
                          <div className="rounded border border-[#D8E9F1] bg-[#F4FAFD] px-2 py-1 text-[11px] text-[#31576A]">
                            <p className="font-semibold">Recomendacoes</p>
                            {diagnosticoFiscal.recommendations.map((item, index) => (
                              <p key={`rec-${index}`}>- {item}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {conectividadeFiscal && (
                      <div className="mt-2 space-y-1.5 rounded border border-[#E0ECF0] bg-[#F6FBFD] p-2 text-[11px]">
                        <p className="font-semibold text-[#173A4D]">Teste ativo de conectividade</p>
                        <p>
                          Resultado:{' '}
                          <strong
                            className={
                              conectividadeFiscal.success
                                ? 'text-[#117C7E]'
                                : conectividadeFiscal.reachable
                                  ? 'text-[#A8572A]'
                                  : 'text-[#9A3D3D]'
                            }
                          >
                            {conectividadeFiscal.success
                              ? 'Sucesso'
                              : conectividadeFiscal.reachable
                                ? 'Provider respondeu com alerta'
                                : 'Falha de comunicacao'}
                          </strong>
                        </p>
                        <p>
                          Mensagem: <strong>{conectividadeFiscal.message}</strong>
                        </p>
                        <p>
                          Metodo/endpoint:{' '}
                          <strong>
                            {conectividadeFiscal.method || '-'} {conectividadeFiscal.endpoint || '-'}
                          </strong>
                        </p>
                        <p>
                          HTTP/latencia:{' '}
                          <strong>
                            {conectividadeFiscal.httpStatus ?? '-'} / {conectividadeFiscal.latencyMs ?? '-'} ms
                          </strong>
                        </p>
                        <p>
                          Request ID / Correlation ID:{' '}
                          <strong>
                            {conectividadeFiscal.requestId || '-'} / {conectividadeFiscal.correlationId || '-'}
                          </strong>
                        </p>
                        <p>
                          Executado em:{' '}
                          <strong>
                            {new Date(conectividadeFiscal.timestamp).toLocaleString('pt-BR')}
                          </strong>
                        </p>
                      </div>
                    )}
                  </div>

                  {historicoFiscalOrdenado.length > 0 ? (
                    <div className="rounded-md border border-[#E2ECEF] bg-white p-3">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#4A6472]">
                        Historico fiscal
                      </p>
                      <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                        {historicoFiscalOrdenado.map((evento, index) => {
                          const statusEvento = STATUS_FISCAL_LABELS[evento.status] || evento.status;
                          const acaoEvento =
                            ACAO_HISTORICO_LABELS[evento.acao] ||
                            String(evento.acao || 'Atualizacao').replace(/_/g, ' ');
                          const auditoriaEvento = extrairAuditoriaFiscalEvento(evento.metadata);
                          return (
                            <div
                              key={`${evento.timestamp}-${index}`}
                              className="rounded-md border border-[#EDF3F5] bg-[#FBFDFD] px-2 py-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <strong className="text-[11px] text-[#173A4D]">{acaoEvento}</strong>
                                <span
                                  className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${STATUS_FISCAL_CLASSES[evento.status]}`}
                                >
                                  {statusEvento}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#6C808A]">
                                {new Date(evento.timestamp).toLocaleString('pt-BR')}
                              </p>
                              {evento.mensagem && (
                                <p className="text-[11px] text-[#4A6472]">{evento.mensagem}</p>
                              )}
                              {auditoriaEvento && (
                                <div className="mt-1 rounded border border-[#E6EEF1] bg-white px-2 py-1 text-[10px] text-[#5F7480]">
                                  <p className="font-semibold uppercase tracking-wide text-[#6A808B]">
                                    Auditoria provider
                                  </p>
                                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                                    {auditoriaEvento.operacao && (
                                      <span>
                                        Operacao: <strong>{auditoriaEvento.operacao}</strong>
                                      </span>
                                    )}
                                    {auditoriaEvento.httpStatus && (
                                      <span>
                                        HTTP: <strong>{auditoriaEvento.httpStatus}</strong>
                                      </span>
                                    )}
                                    {auditoriaEvento.providerStatusBruto && (
                                      <span>
                                        Status bruto: <strong>{auditoriaEvento.providerStatusBruto}</strong>
                                      </span>
                                    )}
                                    {auditoriaEvento.providerCodigoBruto && (
                                      <span>
                                        Codigo bruto: <strong>{auditoriaEvento.providerCodigoBruto}</strong>
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                                    {auditoriaEvento.requestId && (
                                      <span>
                                        Request ID: <strong>{auditoriaEvento.requestId}</strong>
                                      </span>
                                    )}
                                    {auditoriaEvento.correlationId && (
                                      <span>
                                        Correlation ID: <strong>{auditoriaEvento.correlationId}</strong>
                                      </span>
                                    )}
                                  </div>
                                  {auditoriaEvento.payloadHash && (
                                    <p className="mt-0.5 break-all">
                                      Hash payload: <strong>{auditoriaEvento.payloadHash}</strong>
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border border-[#E2ECEF] bg-white p-3">
                      <p className="text-xs text-[#5E7784]">
                        Nenhum evento fiscal registrado ate o momento.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            {/* Itens da Fatura */}
            <div
              className={`overflow-hidden rounded-xl border border-[#DCE8EC] bg-white ${
                pagamentosOrdenados.length > 0 ? '' : '2xl:col-span-2'
              }`}
            >
            <div className="border-b border-[#E4ECEF] bg-[#F8FBFC] px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#173A4D]">
                <FileText className="h-4 w-4 text-[#159A9C]" />
                Itens da Fatura
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F8FBFC]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#607887] uppercase tracking-wider">
                      Descricao
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-[#607887] uppercase tracking-wider">
                      Qtd
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[#607887] uppercase tracking-wider">
                      Valor Unit.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[#607887] uppercase tracking-wider">
                      Desconto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[#607887] uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF3F5] bg-white">
                  {fatura.itens.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.descricao}</p>
                          {item.codigoProduto && (
                            <p className="text-xs text-gray-500">Codigo: {item.codigoProduto}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900">
                        {item.quantidade} {item.unidade}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">
                        R$ {formatarValorMonetario(item.valorUnitario)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-red-600">
                        {item.valorDesconto
                          ? `- R$ ${formatarValorMonetario(item.valorDesconto)}`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        R$ {formatarValorMonetario(item.valorTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-[#E4ECEF] bg-[#FBFDFE]">
                  <tr>
                    <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#607887]">
                      Resumo dos itens
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-[#607887]">
                      {fatura.itens.length} item(ns)
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-[#607887]">
                      Bruto:{' '}
                      <strong className="text-[#173A4D]">
                        R$ {formatarValorMonetario(subtotalItensBruto)}
                      </strong>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-[#607887]">
                      Desc.:{' '}
                      <strong className="text-red-600">
                        {valorDescontoItens > 0
                          ? `- R$ ${formatarValorMonetario(valorDescontoItens)}`
                          : 'R$ 0,00'}
                      </strong>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-[#607887]">
                      Liquido:{' '}
                      <strong className="text-[#117C7E]">
                        R$ {formatarValorMonetario(subtotalItensLiquido)}
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

            {/* Historico de Pagamentos */}
            {pagamentosOrdenados.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-[#DCE8EC] bg-white">
                <div className="border-b border-[#E4ECEF] bg-[#F8FBFC] px-4 py-3">
                  <h3 className="text-sm font-semibold text-[#173A4D] flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#159A9C]" />
                    Historico de Pagamentos
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F8FBFC]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#607887] uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#607887] uppercase tracking-wider">
                          Forma
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-[#607887] uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-[#607887] uppercase tracking-wider">
                          Status
                        </th>
                        {onEstornarPagamento && (
                          <th className="px-4 py-3 text-right text-xs font-medium text-[#607887] uppercase tracking-wider">
                            Acoes
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDF3F5] bg-white">
                      {pagamentosOrdenados.map((pagamento, index) => {
                        const badge = getPagamentoBadge(pagamento);
                        const tipoPagamento = String(pagamento.tipo || 'pagamento').toLowerCase();
                        const podeEstornar =
                          pagamento.status === StatusPagamento.APROVADO &&
                          tipoPagamento !== 'estorno' &&
                          Number(pagamento.valor || 0) > 0 &&
                          Number(pagamento.id || 0) > 0;
                        const valorPagamento = toFiniteNumber(pagamento.valor);
                        const valorClass =
                          tipoPagamento === 'estorno' || valorPagamento < 0
                            ? 'text-orange-700'
                            : 'text-green-600';

                        return (
                          <tr key={pagamento.id || index}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(
                                pagamento.dataPagamento || pagamento.criadoEm || Date.now(),
                              ).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div className="font-medium">
                                {faturamentoService.formatarFormaPagamento(pagamento.formaPagamento)}
                              </div>
                              {pagamento.transacaoId ? (
                                <div className="text-xs text-gray-500">Tx: {pagamento.transacaoId}</div>
                              ) : null}
                              {pagamento.observacoes ? (
                                <div
                                  className="max-w-[340px] truncate text-xs text-gray-500"
                                  title={pagamento.observacoes}
                                >
                                  {pagamento.observacoes}
                                </div>
                              ) : null}
                            </td>
                            <td className={`px-4 py-3 text-right text-sm font-medium ${valorClass}`}>
                              R$ {formatarValorMonetario(valorPagamento)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                            </td>
                            {onEstornarPagamento && (
                              <td className="px-4 py-3 text-right">
                                {podeEstornar ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleEstornarPagamento(
                                        pagamento.id,
                                        pagamento.valor,
                                        pagamento.transacaoId,
                                      )
                                    }
                                    disabled={estornandoPagamentoId === pagamento.id}
                                    className="inline-flex items-center gap-1 rounded-md border border-orange-300 bg-white px-2 py-1 text-xs font-medium text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    {estornandoPagamentoId === pagamento.id ? 'Estornando...' : 'Estornar'}
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalMotivoEstorno
        isOpen={Boolean(estornoAlvo)}
        pagamentoId={estornoAlvo?.id}
        valor={estornoAlvo?.valor}
        transacaoId={estornoAlvo?.transacaoId}
        motivo={motivoEstorno}
        loading={estornandoPagamentoId === estornoAlvo?.id}
        erro={erroEstorno}
        onMotivoChange={setMotivoEstorno}
        onCancel={fecharModalEstorno}
        onConfirm={() => void confirmarEstorno()}
      />
    </div>
  );
}
