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
import toast from 'react-hot-toast';

interface ModalDetalhesCotacaoProps {
  isOpen: boolean;
  onClose: () => void;
  cotacao: Cotacao | null;
  onEdit?: (cotacao: Cotacao) => void;
  onDelete?: (cotacaoId: string) => void;
  onStatusChange?: (cotacaoId: string, novoStatus: StatusCotacao) => void;
}

export const ModalDetalhesCotacao: React.FC<ModalDetalhesCotacaoProps> = ({
  isOpen,
  onClose,
  cotacao,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'itens' | 'anexos' | 'historico'>('info');
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  if (!isOpen || !cotacao) return null;

  const getStatusColor = (status: StatusCotacao) => {
    const colors = {
      rascunho: 'bg-gray-100 text-gray-800',
      enviada: 'bg-blue-100 text-blue-800',
      em_analise: 'bg-yellow-100 text-yellow-800',
      aprovada: 'bg-green-100 text-green-800',
      rejeitada: 'bg-red-100 text-red-800',
      vencida: 'bg-orange-100 text-orange-800',
      convertida: 'bg-purple-100 text-purple-800',
      cancelada: 'bg-gray-100 text-gray-600',
    };
    return colors[status] || colors.rascunho;
  };

  const getStatusIcon = (status: StatusCotacao) => {
    const icons = {
      rascunho: Clock,
      enviada: Send,
      em_analise: Eye,
      aprovada: CheckCircle,
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
      baixa: 'bg-green-100 text-green-800',
      media: 'bg-yellow-100 text-yellow-800',
      alta: 'bg-orange-100 text-orange-800',
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

  const handleStatusChange = async (novoStatus: StatusCotacao) => {
    if (!cotacao) return;

    setIsChangingStatus(true);
    try {
      await cotacaoService.alterarStatus(cotacao.id, novoStatus);
      toast.success('Status alterado com sucesso!');
      onStatusChange?.(cotacao.id, novoStatus);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleDuplicate = async () => {
    if (!cotacao) return;

    try {
      await cotacaoService.duplicar(cotacao.id);
      toast.success('Cotação duplicada com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao duplicar cotação:', error);
      toast.error('Erro ao duplicar cotação');
    }
  };

  const handleGeneratePDF = async () => {
    if (!cotacao) return;

    try {
      await cotacaoService.gerarPDF(cotacao.id);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  const handleSendEmail = async () => {
    if (!cotacao || !cotacao.fornecedor?.email) {
      toast.error('Fornecedor não possui email cadastrado');
      return;
    }

    try {
      await cotacaoService.enviarPorEmail(
        cotacao.id,
        [cotacao.fornecedor.email],
        'Segue em anexo a cotação solicitada.',
      );
      toast.success('Email enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toast.error('Erro ao enviar email');
    }
  };

  const isVencida = () => {
    const hoje = new Date();
    const vencimento = new Date(cotacao.dataVencimento);
    return vencimento < hoje && !['aprovada', 'convertida', 'cancelada'].includes(cotacao.status);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-[calc(100%-2rem)] sm:w-[700px] md:w-[800px] lg:w-[900px] xl:w-[1000px] max-w-[1100px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-[#159A9C]">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-semibold text-white">{cotacao.numero}</h2>
              <p className="text-[#DEEFE7] text-sm">{cotacao.titulo}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Status Badge */}
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(cotacao.status)}`}
            >
              {getStatusIcon(cotacao.status)}
              <span className="ml-1 capitalize">{cotacao.status.replace('_', ' ')}</span>
            </span>
            <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onEdit?.(cotacao)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              <Edit className="w-4 h-4" />
              <span>Editar</span>
            </button>

            <button
              onClick={handleDuplicate}
              className="flex items-center space-x-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
            >
              <Copy className="w-4 h-4" />
              <span>Duplicar</span>
            </button>

            <button
              onClick={handleGeneratePDF}
              className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>

            <button
              onClick={handleSendEmail}
              className="flex items-center space-x-2 px-3 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0d7a7c] transition-colors text-sm"
              disabled={!cotacao.fornecedor?.email}
            >
              <Send className="w-4 h-4" />
              <span>Enviar</span>
            </button>

            {cotacao.status === 'em_analise' && (
              <>
                <button
                  onClick={() => handleStatusChange('aprovada')}
                  disabled={isChangingStatus}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Aprovar</span>
                </button>

                <button
                  onClick={() => handleStatusChange('rejeitada')}
                  disabled={isChangingStatus}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Rejeitar</span>
                </button>
              </>
            )}

            <button
              onClick={() => onDelete?.(cotacao.id)}
              className="flex items-center space-x-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm ml-auto"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'info', label: 'Informações', icon: FileText },
              { id: 'itens', label: 'Itens', icon: Tag },
              { id: 'anexos', label: 'Anexos', icon: Paperclip },
              { id: 'historico', label: 'Histórico', icon: History },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
          {/* Tab: Informações */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Alertas */}
              {isVencida() && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
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
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
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
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
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
              {cotacao.descricao && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Descrição</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{cotacao.descricao}</p>
                </div>
              )}

              {/* Condições */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cotacao.condicoesPagamento && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Condições de Pagamento</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">
                      {cotacao.condicoesPagamento}
                    </p>
                  </div>
                )}

                {cotacao.prazoEntrega && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Prazo de Entrega</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">
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
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{cotacao.observacoes}</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Itens */}
          {activeTab === 'itens' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Itens da Cotação</h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qtd
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unidade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Unit.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
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
                  <tfoot className="bg-gray-50">
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
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
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
                          className="text-[#159A9C] hover:text-[#0d7a7c] transition-colors"
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
                <div className="bg-white border border-gray-200 rounded-lg p-6">
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
                        <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
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
                      <div key={entrada.id} className="border border-gray-200 rounded-lg p-4">
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
