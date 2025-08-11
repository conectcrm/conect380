import React from 'react';
import { X, FileText, User, Calendar, DollarSign, CreditCard, MapPin, Phone, Mail, Eye, Download, Send, Link2, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import { Fatura, StatusFatura, faturamentoService } from '../../services/faturamentoService';
import { formatarValorMonetario } from '../../utils/formatacao';

interface ModalDetalhesFaturaProps {
  isOpen: boolean;
  onClose: () => void;
  fatura: Fatura;
  onEdit?: () => void;
  onGeneratePaymentLink?: (id: number) => void;
  onSendEmail?: (id: number) => void;
  onDownloadPDF?: (id: number) => void;
}

export default function ModalDetalhesFatura({
  isOpen,
  onClose,
  fatura,
  onEdit,
  onGeneratePaymentLink,
  onSendEmail,
  onDownloadPDF
}: ModalDetalhesFaturaProps) {

  if (!isOpen || !fatura) return null;

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
  const valorPago = fatura.pagamentos?.reduce((acc, pag) => acc + pag.valor, 0) || 0;
  const valorPendente = fatura.valorTotal - valorPago;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Fatura #{faturamentoService.formatarNumeroFatura(fatura.numero)}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(fatura.status)}
                <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(fatura.status)}`}>
                  {faturamentoService.formatarStatusFatura(fatura.status)}
                </span>
                {isVencida && fatura.status === StatusFatura.PENDENTE && (
                  <span className="px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                    VENCIDA
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Botões de Ação */}
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar Fatura"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {onDownloadPDF && (
              <button
                onClick={() => onDownloadPDF(fatura.id)}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Baixar PDF"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            {onSendEmail && (
              <button
                onClick={() => onSendEmail(fatura.id)}
                className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Enviar por Email"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
            {onGeneratePaymentLink && fatura.status !== StatusFatura.PAGA && (
              <button
                onClick={() => onGeneratePaymentLink(fatura.id)}
                className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                title="Gerar Link de Pagamento"
              >
                <Link2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações Principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {/* Informações da Fatura */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Informações da Fatura</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Tipo:</span>
                    <p className="font-medium">{faturamentoService.formatarTipoFatura(fatura.tipo)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Data de Emissão:</span>
                    <p className="font-medium">{new Date(fatura.dataEmissao).toLocaleDateString('pt-BR')}</p>
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
                      {fatura.formaPagamento ? faturamentoService.formatarFormaPagamento(fatura.formaPagamento) : 'Não definida'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informações do Cliente */}
              {fatura.cliente && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Cliente
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-gray-900">{fatura.cliente.nome || `Cliente ID: ${fatura.clienteId}`}</p>
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

              {/* Observações */}
              {fatura.observacoes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Observações</h3>
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
                    <span className="font-medium">R$ {formatarValorMonetario(fatura.valorBruto)}</span>
                  </div>
                  {fatura.valorDesconto > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Desconto:</span>
                      <span className="font-medium text-red-600">- R$ {formatarValorMonetario(fatura.valorDesconto)}</span>
                    </div>
                  )}
                  {fatura.valorImpostos > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Impostos:</span>
                      <span className="font-medium">R$ {formatarValorMonetario(fatura.valorImpostos)}</span>
                    </div>
                  )}
                  <hr className="border-gray-300" />
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total:</span>
                    <span className="font-semibold text-green-600">R$ {formatarValorMonetario(fatura.valorTotal)}</span>
                  </div>

                  {valorPago > 0 && (
                    <>
                      <hr className="border-gray-300" />
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor Pago:</span>
                        <span className="font-medium text-green-600">R$ {formatarValorMonetario(valorPago)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor Pendente:</span>
                        <span className={`font-medium ${valorPendente > 0 ? 'text-red-600' : 'text-green-600'}`}>
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
                      Descrição
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
                            <p className="text-xs text-gray-500">Código: {item.codigoProduto}</p>
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
                        {item.valorDesconto ? `- R$ ${formatarValorMonetario(item.valorDesconto)}` : '-'}
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

          {/* Histórico de Pagamentos */}
          {fatura.pagamentos && fatura.pagamentos.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Histórico de Pagamentos
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fatura.pagamentos.map((pagamento, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(pagamento.dataPagamento).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {faturamentoService.formatarFormaPagamento(pagamento.formaPagamento)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-green-600">
                          R$ {formatarValorMonetario(pagamento.valor)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${pagamento.status === 'aprovado'
                            ? 'bg-green-100 text-green-800'
                            : pagamento.status === 'rejeitado'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {pagamento.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
