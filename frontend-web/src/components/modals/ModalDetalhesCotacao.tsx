import React, { useState } from 'react';
import {
  X,
  FileText,
  User,
  Calendar,
  DollarSign,
  Clock,
  Tag,
  Download,
  Edit,
  Trash2,
  Copy,
  Send,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Paperclip,
  History,
  Star,
  MessageSquare,
} from 'lucide-react';
import { Cotacao, StatusCotacao } from '../../types/cotacaoTypes';
import { cotacaoService } from '../../services/cotacaoService';
import { toastService } from '../../services/toastService';
import { useAuth } from '../../hooks/useAuth';
import { userHasPermission } from '../../config/menuConfig';

interface ModalDetalhesCotacaoProps {
  isOpen: boolean;
  onClose: () => void;
  cotacao: Cotacao | null;
  onEdit?: (cotacao: Cotacao) => void;
  onDelete?: (cotacaoId: string) => void;
  onStatusChange?: (cotacaoId: string, novoStatus: StatusCotacao) => void;
}

const detailActionPrimaryClass =
  'inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0F7B7D] disabled:cursor-not-allowed disabled:opacity-50';
const detailActionSecondaryClass =
  'inline-flex items-center gap-2 rounded-lg border border-[#B4BEC9] bg-white px-4 py-2 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9] disabled:cursor-not-allowed disabled:opacity-50';
const detailActionDangerClass =
  'inline-flex items-center gap-2 rounded-lg bg-[#B4233A] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#981E31] disabled:cursor-not-allowed disabled:opacity-50';

export const ModalDetalhesCotacao: React.FC<ModalDetalhesCotacaoProps> = ({
  isOpen,
  onClose,
  cotacao,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'itens' | 'anexos' | 'historico'>('info');
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  if (!isOpen || !cotacao) return null;

  const getStatusColor = (status: StatusCotacao) => {
    const colors = {
      rascunho: 'bg-gray-100 text-gray-800',
      enviada: 'bg-blue-100 text-blue-800',
      pendente: 'bg-amber-100 text-amber-800',
      em_analise: 'bg-yellow-100 text-yellow-800',
      aprovada: 'bg-green-100 text-green-800',
      pedido_gerado: 'bg-teal-100 text-teal-800',
      adquirido: 'bg-emerald-100 text-emerald-800',
      rejeitada: 'bg-red-100 text-red-800',
      vencida: 'bg-red-100 text-red-800',
      convertida: 'bg-green-100 text-green-800',
      cancelada: 'bg-gray-100 text-gray-600',
    };
    return colors[status] || colors.rascunho;
  };

  const getStatusIcon = (status: StatusCotacao) => {
    const icons = {
      rascunho: Clock,
      enviada: Send,
      pendente: Clock,
      em_analise: Eye,
      aprovada: CheckCircle,
      pedido_gerado: Star,
      adquirido: CheckCircle,
      rejeitada: XCircle,
      vencida: AlertCircle,
      convertida: Star,
      cancelada: XCircle,
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  const getPrioridadeColor = (prioridade: string) => {
    const colors = {
      baixa: 'bg-gray-100 text-gray-800',
      media: 'bg-blue-100 text-blue-800',
      alta: 'bg-yellow-100 text-yellow-800',
      urgente: 'bg-red-100 text-red-800',
    };
    return colors[prioridade as keyof typeof colors] || colors.media;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const compraStatus = cotacao.metadados?.compra?.status;
  const compraMeta = cotacao.metadados?.compra;
  const canUpdateCotacao = userHasPermission(user as any, 'comercial.propostas.update');
  const canDeleteCotacao = userHasPermission(user as any, 'comercial.propostas.delete');
  const canSendCotacao = userHasPermission(user as any, 'comercial.propostas.send');
  const canConverterPedido = userHasPermission(user as any, 'comercial.propostas.update');
  const canMarcarAdquirido = userHasPermission(user as any, 'financeiro.pagamentos.manage');
  const statusBadgeClass =
    (cotacao.status === StatusCotacao.CONVERTIDA || cotacao.status === StatusCotacao.ADQUIRIDO) &&
    compraStatus === 'adquirido'
      ? 'bg-emerald-100 text-emerald-800'
      : (cotacao.status === StatusCotacao.CONVERTIDA ||
          cotacao.status === StatusCotacao.PEDIDO_GERADO) &&
        compraStatus === 'pedido_gerado'
        ? 'bg-teal-100 text-teal-800'
        : getStatusColor(cotacao.status);
  const statusBadgeLabel =
    (cotacao.status === StatusCotacao.CONVERTIDA || cotacao.status === StatusCotacao.ADQUIRIDO) &&
    compraStatus === 'adquirido'
      ? 'adquirido'
      : (cotacao.status === StatusCotacao.CONVERTIDA ||
          cotacao.status === StatusCotacao.PEDIDO_GERADO) &&
        compraStatus === 'pedido_gerado'
        ? 'pedido_gerado'
        : cotacao.status;

  const handleStatusChange = async (novoStatus: StatusCotacao) => {
    if (!cotacao) return;

    let justificativa: string | undefined;
    if (novoStatus === StatusCotacao.REJEITADA) {
      const resposta = window.prompt('Informe a justificativa para reprovar esta cotacao:', '');
      if (resposta === null) return;

      justificativa = resposta.trim();
      if (!justificativa) {
        toastService.warning('Justificativa obrigatoria para reprovar');
        return;
      }
    }

    setIsChangingStatus(true);
    try {
      if (novoStatus === StatusCotacao.APROVADA) {
        await cotacaoService.aprovar(cotacao.id);
      } else if (novoStatus === StatusCotacao.REJEITADA) {
        await cotacaoService.reprovar(cotacao.id, justificativa!);
      } else {
        await cotacaoService.alterarStatus(cotacao.id, novoStatus);
      }
      toastService.success('Status alterado com sucesso!');
      onStatusChange?.(cotacao.id, novoStatus);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toastService.apiError(error, 'Erro ao alterar status');
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleConverterEmPedido = async () => {
    if (!cotacao) return;

    const resposta = window.prompt('Observacoes da conversao em pedido (opcional):', '');
    if (resposta === null) return;

    setIsChangingStatus(true);
    try {
      const pedido = await cotacaoService.converterEmPedido(cotacao.id, resposta.trim() || undefined);
      const contaPagarNumero = pedido.contaPagar?.numero || pedido.contaPagar?.id;
      if (pedido.contaPagarGeradaAutomaticamente && contaPagarNumero) {
        toastService.success(
          `Pedido ${pedido.id} criado e conta a pagar ${contaPagarNumero} gerada automaticamente!`,
        );
      } else if (pedido.contaPagarErro) {
        toastService.warning(
          `Pedido ${pedido.id} criado. Conta a pagar nao foi gerada automaticamente: ${pedido.contaPagarErro}`,
        );
      } else {
        toastService.success(`Pedido ${pedido.id} criado com sucesso!`);
      }
      onStatusChange?.(cotacao.id, StatusCotacao.PEDIDO_GERADO);
      onClose();
    } catch (error) {
      console.error('Erro ao converter em pedido:', error);
      toastService.apiError(error, 'Erro ao converter cotacao em pedido');
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleMarcarAdquirido = async () => {
    if (!cotacao) return;

    if (!window.confirm('Confirmar compra/pagamento externo concluido e marcar como adquirido?')) {
      return;
    }

    const numeroPedido =
      window.prompt('Numero do pedido/compra (opcional):', compraMeta?.numeroPedido || compraMeta?.pedidoId || '') ??
      null;
    if (numeroPedido === null) return;

    const referenciaPagamento =
      window.prompt(
        'Referencia do pagamento externo (opcional):',
        compraMeta?.referenciaPagamento || '',
      ) ?? null;
    if (referenciaPagamento === null) return;

    const observacoes =
      window.prompt('Observacoes da compra/pagamento externo (opcional):', compraMeta?.observacoes || '') ??
      null;
    if (observacoes === null) return;

    setIsChangingStatus(true);
    try {
      await cotacaoService.marcarAdquirido(cotacao.id, {
        numeroPedido: numeroPedido.trim() || undefined,
        referenciaPagamento: referenciaPagamento.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      });
      toastService.success('Compra marcada como adquirida com sucesso!');
      onStatusChange?.(cotacao.id, StatusCotacao.ADQUIRIDO);
      onClose();
    } catch (error) {
      console.error('Erro ao marcar cotacao como adquirida:', error);
      toastService.apiError(error, 'Erro ao marcar cotacao como adquirida');
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleGerarContaPagar = async () => {
    if (!cotacao) return;

    const dataVencimentoPadrao =
      (cotacao.prazoResposta && String(cotacao.prazoResposta).slice(0, 10)) ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const dataVencimento =
      window.prompt('Data de vencimento da conta a pagar (AAAA-MM-DD):', dataVencimentoPadrao) ??
      null;
    if (dataVencimento === null) return;

    const observacoes = window.prompt('Observacoes da conta a pagar (opcional):', '') ?? null;
    if (observacoes === null) return;

    setIsChangingStatus(true);
    try {
      const result = await cotacaoService.gerarContaPagar(cotacao.id, {
        dataVencimento: dataVencimento.trim() || undefined,
        categoria: 'fornecedores',
        prioridade: cotacao.prioridade,
        observacoes: observacoes.trim() || undefined,
      });

      if (result.alreadyExisted) {
        toastService.success(`Conta a pagar já existente: ${result.contaPagar.numero}`);
      } else {
        toastService.success(`Conta a pagar ${result.contaPagar.numero} gerada com sucesso!`);
      }

      onStatusChange?.(cotacao.id, cotacao.status);
      onClose();
    } catch (error) {
      console.error('Erro ao gerar conta a pagar:', error);
      toastService.apiError(error, 'Erro ao gerar conta a pagar');
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleDuplicate = async () => {
    if (!cotacao) return;

    try {
      await cotacaoService.duplicar(cotacao.id);
      toastService.success('Cotação duplicada com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao duplicar cotação:', error);
      toastService.apiError(error, 'Erro ao duplicar cotação');
    }
  };

  const handleGeneratePDF = async () => {
    if (!cotacao) return;

    try {
      const pdfBlob = await cotacaoService.gerarPDF(cotacao.id);

      const safeNumero = String(cotacao.numero || cotacao.id).replace(/[^a-zA-Z0-9-_]+/g, '-');
      const filename = `cotacao-${safeNumero}.pdf`;

      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toastService.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toastService.apiError(error, 'Erro ao gerar PDF');
    }
  };

  const handleSendEmail = async () => {
    if (!cotacao || !cotacao.fornecedor?.email) {
      toastService.error('Fornecedor não possui email cadastrado');
      return;
    }

    try {
      await cotacaoService.enviarPorEmail(
        cotacao.id,
        [cotacao.fornecedor.email],
        'Segue em anexo a cotação solicitada.',
      );
      toastService.success('Email enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toastService.apiError(error, 'Erro ao enviar email');
    }
  };

  const isVencida = () => {
    const hoje = new Date();
    const vencimento = new Date(cotacao.dataVencimento);
    return (
      vencimento < hoje &&
      ![
        StatusCotacao.APROVADA,
        StatusCotacao.PEDIDO_GERADO,
        StatusCotacao.ADQUIRIDO,
        StatusCotacao.CONVERTIDA,
        StatusCotacao.CANCELADA,
        StatusCotacao.REJEITADA,
      ].includes(
        cotacao.status,
      )
    );
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-[#0F172A]/35 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-detalhes-cotacao-title"
    >
      <div
        className="flex max-h-[92vh] w-[calc(100%-2rem)] max-w-[1100px] flex-col overflow-hidden rounded-2xl border border-[#DCE8EC] bg-white shadow-[0_24px_70px_-28px_rgba(15,57,74,0.45)] sm:w-[700px] md:w-[800px] lg:w-[900px] xl:w-[1000px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#128688] bg-[#159A9C] px-5 py-4 sm:px-6">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-white" />
            <div>
              <h2 id="modal-detalhes-cotacao-title" className="text-lg font-semibold text-white sm:text-xl">
                {cotacao.numero}
              </h2>
              <p className="text-[#DEEFE7] text-sm">{cotacao.titulo}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Status Badge */}
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadgeClass}`}
            >
              {getStatusIcon(cotacao.status)}
              <span className="ml-1 capitalize">{statusBadgeLabel.replace('_', ' ')}</span>
            </span>
            <button
              onClick={onClose}
              type="button"
              aria-label="Fechar modal"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="shrink-0 border-b border-[#E1EAEE] bg-[#F8FBFC] px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2.5">
            {canUpdateCotacao && (
              <button
                onClick={() => onEdit?.(cotacao)}
                className={detailActionPrimaryClass}
              >
                <Edit className="w-4 h-4" />
                <span>Editar</span>
              </button>
            )}

            <button
              onClick={handleDuplicate}
              className={detailActionSecondaryClass}
            >
              <Copy className="w-4 h-4" />
              <span>Duplicar</span>
            </button>

            <button
              onClick={handleGeneratePDF}
              className={detailActionSecondaryClass}
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>

            {canSendCotacao && (
              <button
                onClick={handleSendEmail}
                className={detailActionPrimaryClass}
                disabled={!cotacao.fornecedor?.email}
              >
                <Send className="w-4 h-4" />
                <span>Enviar</span>
              </button>
            )}

            {cotacao.status === StatusCotacao.APROVADA && canConverterPedido && (
              <button
                onClick={handleConverterEmPedido}
                disabled={isChangingStatus}
                className={detailActionSecondaryClass}
              >
                <Star className="w-4 h-4" />
                <span>Converter Pedido</span>
              </button>
            )}

            {[StatusCotacao.CONVERTIDA, StatusCotacao.PEDIDO_GERADO].includes(cotacao.status) &&
              !compraMeta?.contaPagarId &&
              canMarcarAdquirido && (
              <button
                onClick={handleGerarContaPagar}
                disabled={isChangingStatus}
                className={detailActionSecondaryClass}
              >
                <DollarSign className="w-4 h-4" />
                <span>Gerar Conta a Pagar</span>
              </button>
            )}

            {[StatusCotacao.CONVERTIDA, StatusCotacao.PEDIDO_GERADO].includes(cotacao.status) &&
              compraStatus !== 'adquirido' &&
              canMarcarAdquirido && (
              <button
                onClick={handleMarcarAdquirido}
                disabled={isChangingStatus}
                className={detailActionPrimaryClass}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Marcar Adquirido</span>
              </button>
            )}

            {canUpdateCotacao && [StatusCotacao.PENDENTE, StatusCotacao.EM_ANALISE].includes(cotacao.status) && (
              <>
                <button
                  onClick={() => handleStatusChange(StatusCotacao.APROVADA)}
                  disabled={isChangingStatus}
                  className={detailActionPrimaryClass}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Aprovar</span>
                </button>

                <button
                  onClick={() => handleStatusChange(StatusCotacao.REJEITADA)}
                  disabled={isChangingStatus}
                  className={detailActionDangerClass}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Rejeitar</span>
                </button>
              </>
            )}

            {canDeleteCotacao && (
              <button
                onClick={() => onDelete?.(cotacao.id)}
                className={`${detailActionDangerClass} ml-auto`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 border-b border-[#E1EAEE]">
          <nav className="flex overflow-x-auto px-4 sm:px-6">
            {[
              { id: 'info', label: 'Informações', icon: FileText },
              { id: 'itens', label: 'Itens', icon: Tag },
              { id: 'anexos', label: 'Anexos', icon: Paperclip },
              { id: 'historico', label: 'Histórico', icon: History },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`shrink-0 whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-[#159A9C] text-[#159A9C]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          {/* Tab: Informações */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Alertas */}
              {isVencida() && (
                <div className="rounded-xl border border-red-200 bg-red-50/80 p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800 font-medium">Cotação Vencida</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">
                    Esta cotação venceu em {formatDate(cotacao.dataVencimento)}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="border-b border-[#E1EAEE] pb-2 text-lg font-semibold text-[#173A4D]">
                    Informações Básicas
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Fornecedor</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{cotacao.fornecedor?.nome}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Responsável</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{cotacao.responsavel?.nome}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Prioridade</label>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPrioridadeColor(cotacao.prioridade)}`}
                        >
                          {cotacao.prioridade.charAt(0).toUpperCase() + cotacao.prioridade.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Origem</label>
                      <div className="mt-1">
                        <span className="text-gray-900 capitalize">{cotacao.origem}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Datas e Valores */}
                <div className="space-y-4">
                  <h3 className="border-b border-[#E1EAEE] pb-2 text-lg font-semibold text-[#173A4D]">
                    Datas e Valores
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Data de Criação</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{formatDateTime(cotacao.dataCriacao)}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Data de Vencimento
                      </label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span
                          className={`${isVencida() ? 'text-red-600 font-medium' : 'text-gray-900'}`}
                        >
                          {formatDate(cotacao.dataVencimento)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Valor Total</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-2xl font-bold text-[#159A9C]">
                          {formatCurrency(cotacao.valorTotal)}
                        </span>
                      </div>
                    </div>

                    {cotacao.valorDesconto && cotacao.valorDesconto > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Desconto</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-green-600 font-medium">
                            -{formatCurrency(cotacao.valorDesconto)}
                          </span>
                          {cotacao.percentualDesconto && (
                            <span className="text-sm text-gray-500">
                              ({cotacao.percentualDesconto}%)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Descrição */}
              {(
                [StatusCotacao.CONVERTIDA, StatusCotacao.PEDIDO_GERADO, StatusCotacao.ADQUIRIDO].includes(
                  cotacao.status,
                ) || compraMeta
              ) && (
                <div className="rounded-xl border border-[#DCE8EC] bg-[#F8FBFC] p-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#4F6F7E]">
                    Fluxo de Compra Interna
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-[#6B8795]">Etapa</p>
                      <p className="mt-1 font-medium text-[#173A4D]">
                        {compraStatus === 'adquirido'
                          ? 'Adquirido'
                          : compraStatus === 'pedido_gerado'
                            ? 'Pedido gerado'
                            : cotacao.status === StatusCotacao.ADQUIRIDO
                              ? 'Adquirido'
                              : cotacao.status === StatusCotacao.PEDIDO_GERADO
                                ? 'Pedido gerado'
                            : 'Convertida'}
                      </p>
                    </div>
                    {(compraMeta?.numeroPedido || compraMeta?.pedidoId) && (
                      <div>
                        <p className="text-xs text-[#6B8795]">Pedido</p>
                        <p className="mt-1 font-medium text-[#173A4D]">
                          {compraMeta?.numeroPedido || compraMeta?.pedidoId}
                        </p>
                      </div>
                    )}
                    {compraMeta?.referenciaPagamento && (
                      <div>
                        <p className="text-xs text-[#6B8795]">Ref. pagamento externo</p>
                        <p className="mt-1 font-medium text-[#173A4D]">
                          {compraMeta.referenciaPagamento}
                        </p>
                      </div>
                    )}
                    {compraMeta?.dataPedido && (
                      <div>
                        <p className="text-xs text-[#6B8795]">Data do pedido</p>
                        <p className="mt-1 font-medium text-[#173A4D]">
                          {formatDateTime(compraMeta.dataPedido)}
                        </p>
                      </div>
                    )}
                    {compraMeta?.dataAquisicao && (
                      <div>
                        <p className="text-xs text-[#6B8795]">Data da aquisição</p>
                        <p className="mt-1 font-medium text-[#173A4D]">
                          {formatDateTime(compraMeta.dataAquisicao)}
                        </p>
                      </div>
                    )}
                  </div>
                  {(compraMeta?.contaPagarNumero || compraMeta?.contaPagarId || compraMeta?.dataGeracaoContaPagar) && (
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {(compraMeta?.contaPagarNumero || compraMeta?.contaPagarId) && (
                        <div className="rounded-lg border border-[#E3EDF0] bg-white p-3">
                          <p className="text-xs text-[#6B8795]">Conta a pagar</p>
                          <p className="mt-1 text-sm font-medium text-[#173A4D]">
                            {compraMeta?.contaPagarNumero || compraMeta?.contaPagarId}
                          </p>
                        </div>
                      )}
                      {compraMeta?.dataGeracaoContaPagar && (
                        <div className="rounded-lg border border-[#E3EDF0] bg-white p-3">
                          <p className="text-xs text-[#6B8795]">Conta gerada em</p>
                          <p className="mt-1 text-sm font-medium text-[#173A4D]">
                            {formatDateTime(compraMeta.dataGeracaoContaPagar)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {compraMeta?.observacoes && (
                    <div className="mt-3 rounded-lg border border-[#E3EDF0] bg-white p-3">
                      <p className="text-xs text-[#6B8795]">Observações da compra</p>
                      <p className="mt-1 text-sm text-[#355563]">{compraMeta.observacoes}</p>
                    </div>
                  )}
                </div>
              )}

              {cotacao.descricao && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Descrição</h3>
                  <p className="rounded-xl border border-[#E6EFF2] bg-[#F8FBFC] p-4 text-[#355563]">{cotacao.descricao}</p>
                </div>
              )}

              {/* Condições */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cotacao.condicoesPagamento && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Condições de Pagamento</h4>
                    <p className="rounded-xl border border-[#E6EFF2] bg-[#F8FBFC] p-3 text-sm text-[#355563]">
                      {cotacao.condicoesPagamento}
                    </p>
                  </div>
                )}

                {cotacao.prazoEntrega && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Prazo de Entrega</h4>
                    <p className="rounded-xl border border-[#E6EFF2] bg-[#F8FBFC] p-3 text-sm text-[#355563]">
                      {cotacao.prazoEntrega}
                    </p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {cotacao.tags && cotacao.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {cotacao.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#159A9C] text-white"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Observações */}
              {cotacao.observacoes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Observações</h4>
                  <p className="rounded-xl border border-[#E6EFF2] bg-[#F8FBFC] p-4 text-[#355563]">{cotacao.observacoes}</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Itens */}
          {activeTab === 'itens' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Itens da Cotação</h3>

              <div className="overflow-x-auto rounded-xl border border-[#E1EAEE]">
                <table className="min-w-full divide-y divide-[#E1EAEE]">
                  <thead className="bg-[#F8FBFC]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                        Qtd
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                        Unidade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                        Valor Unit.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#EDF3F5]">
                    {cotacao.itens.map((item, index) => (
                      <tr key={item.id || index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.descricao}
                            </div>
                            {item.observacoes && (
                              <div className="text-sm text-gray-500">{item.observacoes}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantidade}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.unidade}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.valorUnitario)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#159A9C]">
                          {formatCurrency(item.valorTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#F8FBFC]">
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-right text-sm font-medium text-gray-900"
                      >
                        Total Geral:
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-[#159A9C]">
                        {formatCurrency(cotacao.valorTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Anexos */}
          {activeTab === 'anexos' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Anexos</h3>

              {cotacao.anexos && cotacao.anexos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cotacao.anexos.map((anexo) => (
                    <div
                      key={anexo.id}
                      className="rounded-xl border border-[#DCE8EC] bg-white p-4 transition-colors hover:bg-[#F8FBFC]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Paperclip className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{anexo.nome}</p>
                            <p className="text-sm text-gray-500">
                              {(anexo.tamanho / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => window.open(anexo.url, '_blank')}
                          className="text-[#159A9C] hover:text-[#0F7B7D] transition-colors"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Paperclip className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum anexo encontrado</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Histórico */}
          {activeTab === 'historico' && (
            <div className="space-y-6">
              {/* Seção de Aprovação */}
              {(cotacao.statusAprovacao || cotacao.aprovador) && (
                <div className="rounded-xl border border-[#DCE8EC] bg-white p-6 shadow-[0_8px_20px_-22px_rgba(15,57,74,0.35)]">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    {cotacao.statusAprovacao === 'aprovado' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : cotacao.statusAprovacao === 'reprovado' ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    )}
                    Status de Aprovação
                  </h3>

                  <div className="space-y-4">
                    {/* Status */}
                    <div className="flex items-start gap-3">
                      <div className="w-32 text-sm font-medium text-gray-500">Status:</div>
                      <div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            cotacao.statusAprovacao === 'aprovado'
                              ? 'bg-green-100 text-green-800'
                              : cotacao.statusAprovacao === 'reprovado'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {cotacao.statusAprovacao === 'aprovado' && (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          )}
                          {cotacao.statusAprovacao === 'reprovado' && (
                            <XCircle className="w-4 h-4 mr-1" />
                          )}
                          {!cotacao.statusAprovacao && <Clock className="w-4 h-4 mr-1" />}
                          {cotacao.statusAprovacao === 'aprovado'
                            ? 'Aprovado'
                            : cotacao.statusAprovacao === 'reprovado'
                              ? 'Reprovado'
                              : 'Aguardando Aprovação'}
                        </span>
                      </div>
                    </div>

                    {/* Aprovador */}
                    {cotacao.aprovador && (
                      <div className="flex items-start gap-3">
                        <div className="w-32 text-sm font-medium text-gray-500">Aprovador:</div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{cotacao.aprovador.nome}</span>
                          {cotacao.aprovador.email && (
                            <span className="text-gray-500 text-sm">
                              ({cotacao.aprovador.email})
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Data de Aprovação */}
                    {cotacao.dataAprovacao && (
                      <div className="flex items-start gap-3">
                        <div className="w-32 text-sm font-medium text-gray-500">Data:</div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {new Date(cotacao.dataAprovacao).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Justificativa */}
                    {cotacao.justificativaAprovacao && (
                      <div className="flex items-start gap-3">
                        <div className="w-32 text-sm font-medium text-gray-500">Justificativa:</div>
                        <div className="flex-1 rounded-xl border border-[#E1EAEE] bg-[#F8FBFC] p-4">
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {cotacao.justificativaAprovacao}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Histórico de Alterações */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Histórico de Alterações
                </h3>

                {cotacao.historico && cotacao.historico.length > 0 ? (
                  <div className="space-y-4">
                    {cotacao.historico.map((entrada) => (
                      <div key={entrada.id} className="rounded-xl border border-[#DCE8EC] bg-white p-4 shadow-[0_8px_20px_-22px_rgba(15,57,74,0.25)]">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <History className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="font-medium text-gray-900">{entrada.acao}</p>
                              <p className="text-gray-700 mt-1">{entrada.descricao}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>{entrada.usuario}</span>
                                <span>{formatDateTime(entrada.timestamp)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum histórico encontrado</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalDetalhesCotacao;
