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
} from 'lucide-react';
import { Fatura, StatusFatura, StatusPagamento, faturamentoService } from '../../services/faturamentoService';
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
}

type TipoDocumentoFinanceiro =
  | 'fatura'
  | 'recibo'
  | 'folha_pagamento'
  | 'outro';

const TIPO_DOCUMENTO_LABELS: Record<TipoDocumentoFinanceiro, string> = {
  fatura: 'Fatura comercial',
  recibo: 'Recibo',
  folha_pagamento: 'Folha de pagamento',
  outro: 'Outro documento',
};

interface DocumentoFinanceiroDetalhe {
  tipo: TipoDocumentoFinanceiro;
  referencia?: string;
  numero?: string;
}

interface TributoDetalhadoVisual {
  codigo: string;
  descricao: string;
  valor: number;
  percentual: number;
}

interface BoletoDetalheVisual {
  pdfUrl?: string;
  barcode?: string;
  linhaDigitavel?: string;
}

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
    referencia: String(documento.referencia || documento.modelo || '').trim() || undefined,
    numero: String(documento.numero || '').trim() || undefined,
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

const extrairBoletoDetalhes = (fatura: Fatura): BoletoDetalheVisual | null => {
  const metadados =
    fatura.metadados && typeof fatura.metadados === 'object' && !Array.isArray(fatura.metadados)
      ? (fatura.metadados as Record<string, unknown>)
      : null;
  const boletoRaw =
    metadados && typeof metadados.boleto === 'object' && !Array.isArray(metadados.boleto)
      ? (metadados.boleto as Record<string, unknown>)
      : null;

  const pdfUrl = String(boletoRaw?.pdfUrl || fatura.linkPagamento || '').trim() || undefined;
  const barcode = String(boletoRaw?.barcode || fatura.codigoBoleto || '').trim() || undefined;
  const linhaDigitavel =
    String(boletoRaw?.linhaDigitavel || fatura.codigoBoleto || '').trim() || undefined;

  if (!pdfUrl && !barcode && !linhaDigitavel) {
    return null;
  }

  return {
    pdfUrl,
    barcode,
    linhaDigitavel,
  };
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
}: ModalDetalhesFaturaProps) {
  const [estornandoPagamentoId, setEstornandoPagamentoId] = React.useState<number | null>(null);
  const [estornoAlvo, setEstornoAlvo] = React.useState<EstornoAlvo | null>(null);
  const [motivoEstorno, setMotivoEstorno] = React.useState('');
  const [erroEstorno, setErroEstorno] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !estornandoPagamentoId) {
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
  }, [isOpen, onClose, estornandoPagamentoId, estornoAlvo]);

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
  const boletoDetalhes = extrairBoletoDetalhes(fatura);
  const linkPagamento = String(fatura.linkPagamento || '').trim();
  const linkBoletoPdf = String(boletoDetalhes?.pdfUrl || '').trim();
  const totalTributosDetalhados = tributosDetalhados.reduce((acc, item) => acc + item.valor, 0);
  const ajusteManualImpostos = Math.max(valorImpostos - totalTributosDetalhados, 0);
  const podeEditarFatura =
    Boolean(onEdit) && ![StatusFatura.PAGA, StatusFatura.CANCELADA].includes(fatura.status);
  const podeEnviarEmailFatura = [StatusFatura.PENDENTE, StatusFatura.ENVIADA, StatusFatura.PARCIALMENTE_PAGA, StatusFatura.VENCIDA].includes(
    fatura.status,
  );
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

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0D1F2A]/45 p-4"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !estornandoPagamentoId &&
          !estornoAlvo
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
            {onSendEmail && podeEnviarEmailFatura && (
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
              disabled={Boolean(estornandoPagamentoId || estornoAlvo )}
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
                    </p>
                    {documentoFinanceiro?.referencia && (
                      <p className="text-xs text-gray-500">
                        Referencia: {documentoFinanceiro.referencia}
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

              {/* Link de Pagamento/Boleto */}
              {(linkPagamento || boletoDetalhes) && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Pagamento online
                  </h3>
                  <div className="space-y-2">
                    {linkPagamento && (
                      <a
                        href={linkPagamento}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-600 hover:text-blue-700 underline break-all"
                      >
                        {linkPagamento}
                      </a>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {linkPagamento && (
                        <a
                          href={linkPagamento}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-md border border-[#159A9C]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#0F7B7D] transition hover:bg-[#E9F7F7]"
                        >
                          Abrir pagamento
                        </a>
                      )}
                      {linkBoletoPdf && (
                        <a
                          href={linkBoletoPdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-md border border-[#2563EB]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#1D4ED8] transition hover:bg-[#EFF6FF]"
                        >
                          Baixar PDF do boleto
                        </a>
                      )}
                    </div>
                    {boletoDetalhes?.linhaDigitavel && (
                      <p className="text-xs text-[#2F4858] break-all">
                        Linha digitavel: <strong>{boletoDetalhes.linhaDigitavel}</strong>
                      </p>
                    )}
                    {boletoDetalhes?.barcode &&
                      boletoDetalhes.barcode !== boletoDetalhes.linhaDigitavel && (
                        <p className="text-xs text-[#2F4858] break-all">
                          Codigo de barras: <strong>{boletoDetalhes.barcode}</strong>
                        </p>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>

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
