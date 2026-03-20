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
  OperacaoDocumentoFiscal,
  StatusDocumentoFiscal,
  StatusFatura,
  StatusPagamento,
  faturamentoService,
} from '../../services/faturamentoService';
import { formatarValorMonetario } from '../../utils/formatacao';
import ModalMotivoEstorno from './ModalMotivoEstorno';

interface EstornoAlvo {
  id: number;
  valor: number;
  transacaoId?: string;
}

interface ModalDetalhesFaturaProps {
  isOpen: boolean;
  onClose: () => void;
  fatura: Fatura;
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
  documento_cancelado: 'Documento cancelado',
  numeracao_inutilizada: 'Numeracao inutilizada',
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
  const [estornandoPagamentoId, setEstornandoPagamentoId] = React.useState<number | null>(null);
  const [estornoAlvo, setEstornoAlvo] = React.useState<EstornoAlvo | null>(null);
  const [motivoEstorno, setMotivoEstorno] = React.useState('');
  const [erroEstorno, setErroEstorno] = React.useState<string | null>(null);
  const [ambienteFiscal, setAmbienteFiscal] = React.useState<AmbienteDocumentoFiscal>('homologacao');
  const [observacaoFiscal, setObservacaoFiscal] = React.useState('');
  const [motivoOperacaoFiscal, setMotivoOperacaoFiscal] = React.useState('');
  const [operacaoFiscal, setOperacaoFiscal] = React.useState<OperacaoDocumentoFiscal>('cancelar');

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
    tipoDocumentoFiscalAtual === 'nfse' || tipoDocumentoFiscalAtual === 'nfe';
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
    if (!onCriarRascunhoFiscal) {
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
    if (!onEmitirDocumentoFiscal) {
      return;
    }
    const payload: DocumentoFiscalPayload = {
      tipo: tipoDocumentoFiscalAtual || undefined,
      ambiente: ambienteFiscal,
      observacoes: observacaoFiscal.trim() || undefined,
      forcarReemissao: statusFiscalAtual === 'emitida',
    };
    void onEmitirDocumentoFiscal(fatura.id, payload);
  };

  const handleCancelarOuInutilizarDocumentoFiscal = () => {
    if (!onCancelarDocumentoFiscal) {
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
        className="max-h-[90vh] w-full max-w-[980px] overflow-y-auto rounded-2xl border border-[#DCE8EC] bg-white shadow-[0_30px_60px_-30px_rgba(7,36,51,0.55)]"
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
          <div className="flex items-center gap-2">
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
          {/* Informacoes Principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {/* Informacoes da Fatura */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Informacoes da Fatura</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Tipo:</span>
                    <p className="font-medium">
                      {faturamentoService.formatarTipoFatura(fatura.tipo)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Data de Emissao:</span>
                    <p className="font-medium">
                      {new Date(fatura.dataEmissao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Data de Vencimento:</span>
                    <p className={`font-medium ${isVencida ? 'text-red-600' : ''}`}>
                      {new Date(fatura.dataVencimento).toLocaleDateString('pt-BR')}
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
                  <div className="col-span-2">
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
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
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
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Observacoes</h3>
                  <p className="text-sm text-gray-600">{fatura.observacoes}</p>
                </div>
              )}
            </div>

            {/* Resumo Financeiro */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
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
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
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

              <div className="rounded-lg border border-[#DCE8EC] bg-white p-4">
                <h3 className="mb-3 text-sm font-medium text-gray-900">Documento Fiscal</h3>
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
                  <div className="flex justify-between">
                    <span>Ambiente:</span>
                    <strong className="text-[#173A4D] capitalize">{ambienteFiscal}</strong>
                  </div>
                  {documentoFiscalStatus?.provider && (
                    <div className="flex justify-between">
                      <span>Provider:</span>
                      <strong className="text-[#173A4D]">{documentoFiscalStatus.provider}</strong>
                    </div>
                  )}
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
                  <div className="mt-3 space-y-2">
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
                        className="h-8 w-full rounded-md border border-[#D4E2E7] bg-white px-2 text-xs text-[#28485A] focus:border-[#159A9C] focus:outline-none"
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
                        rows={2}
                        className="w-full resize-y rounded-md border border-[#D4E2E7] bg-white px-2 py-1.5 text-xs text-[#28485A] focus:border-[#159A9C] focus:outline-none"
                        placeholder="Opcional. Ex: emissao solicitada apos conferencia fiscal."
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={handleCriarRascunhoFiscal}
                        disabled={!onCriarRascunhoFiscal || fiscalActionLoading || fatura.status === StatusFatura.CANCELADA}
                        className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-[#D4E2E7] bg-white px-2 text-xs font-medium text-[#28485A] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {fiscalActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Criar rascunho
                      </button>
                      <button
                        type="button"
                        onClick={handleEmitirDocumentoFiscal}
                        disabled={!onEmitirDocumentoFiscal || fiscalActionLoading || fatura.status === StatusFatura.CANCELADA}
                        className="inline-flex h-8 items-center justify-center gap-1 rounded-md bg-[#159A9C] px-2 text-xs font-medium text-white transition hover:bg-[#117C7E] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {fiscalActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        {statusFiscalAtual === 'emitida' ? 'Reemitir documento' : 'Emitir documento'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void onAtualizarStatusFiscal?.(fatura.id)}
                        disabled={!onAtualizarStatusFiscal || fiscalActionLoading}
                        className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-[#D4E2E7] bg-white px-2 text-xs font-medium text-[#28485A] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {fiscalActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Atualizar status
                      </button>
                    </div>

                    <div className="rounded-md border border-[#E2ECEF] bg-[#F8FBFC] p-2">
                      <label className="mb-1 block text-[11px] font-medium text-[#4A6472]">
                        Operacao final
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setOperacaoFiscal('cancelar')}
                          disabled={fiscalActionLoading}
                          className={`h-8 rounded-md border text-xs font-medium transition ${
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
                          className={`h-8 rounded-md border text-xs font-medium transition ${
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
                        rows={2}
                        className="mt-2 w-full resize-y rounded-md border border-[#D4E2E7] bg-white px-2 py-1.5 text-xs text-[#28485A] focus:border-[#159A9C] focus:outline-none"
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
                        className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1 rounded-md border border-[#D4E2E7] bg-white px-2 text-xs font-medium text-[#28485A] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60"
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

                    {historicoFiscalOrdenado.length > 0 && (
                      <div className="rounded-md border border-[#E2ECEF] bg-white p-2">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#4A6472]">
                          Historico fiscal
                        </p>
                        <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
                          {historicoFiscalOrdenado.map((evento, index) => {
                            const statusEvento = STATUS_FISCAL_LABELS[evento.status] || evento.status;
                            const acaoEvento =
                              ACAO_HISTORICO_LABELS[evento.acao] ||
                              String(evento.acao || 'Atualizacao').replace(/_/g, ' ');
                            return (
                              <div key={`${evento.timestamp}-${index}`} className="rounded-md border border-[#EDF3F5] bg-[#FBFDFD] px-2 py-1.5">
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
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-[11px] text-[#5E7784]">
                    Documento atual nao exige emissao fiscal automatizada.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Itens da Fatura */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Itens da Fatura</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descricao
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qtd
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Unit.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Desconto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
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
              </table>
            </div>
          </div>

          {/* Historico de Pagamentos */}
          {pagamentosOrdenados.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Historico de Pagamentos
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Forma
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      {onEstornarPagamento && (
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acoes
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
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
