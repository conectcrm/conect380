import React, { useState, useEffect } from 'react';
import { X, Plus, CreditCard, DollarSign, Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Fatura, StatusPagamento } from '../../services/faturamentoService';

interface Pagamento {
  id: number;
  valor: number;
  data: string;
  metodo: string;
  status: StatusPagamento;
  comprovante?: string;
  observacoes?: string;
}

interface ModalPagamentosProps {
  isOpen: boolean;
  onClose: () => void;
  fatura: Fatura;
  onRegistrarPagamento: (pagamento: Omit<Pagamento, 'id'>) => Promise<void>;
}

export default function ModalPagamentos({
  isOpen,
  onClose,
  fatura,
  onRegistrarPagamento
}: ModalPagamentosProps) {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [novoPagamento, setNovoPagamento] = useState({
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    metodo: 'pix',
    observacoes: ''
  });
  const [carregando, setCarregando] = useState(false);

  const valorPago = pagamentos.reduce((total, p) =>
    p.status === StatusPagamento.APROVADO ? total + p.valor : total, 0
  );
  const valorRestante = fatura.valorTotal - valorPago;

  const handleRegistrarPagamento = async () => {
    if (novoPagamento.valor <= 0 || novoPagamento.valor > valorRestante) {
      alert('Valor inválido para pagamento');
      return;
    }

    setCarregando(true);
    try {
      await onRegistrarPagamento({
        ...novoPagamento,
        status: StatusPagamento.APROVADO
      });

      // Resetar formulário
      setNovoPagamento({
        valor: 0,
        data: new Date().toISOString().split('T')[0],
        metodo: 'pix',
        observacoes: ''
      });
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
    } finally {
      setCarregando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-green-600" />
              Pagamentos - Fatura #{fatura.numero}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Valor Total: R$ {fatura.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Status do Pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Valor Total</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                R$ {fatura.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Valor Pago</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                R$ {valorPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Restante</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">
                R$ {valorRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Histórico de Pagamentos */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Pagamentos</h3>

            {pagamentos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p>Nenhum pagamento registrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pagamentos.map((pagamento) => (
                  <div key={pagamento.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${pagamento.status === StatusPagamento.APROVADO ? 'bg-green-500' :
                          pagamento.status === StatusPagamento.PENDENTE ? 'bg-yellow-500' :
                            'bg-red-500'
                        }`} />
                      <div>
                        <p className="font-medium text-gray-900">
                          R$ {pagamento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(pagamento.data).toLocaleDateString('pt-BR')} • {pagamento.metodo.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${pagamento.status === StatusPagamento.APROVADO ? 'bg-green-100 text-green-800' :
                        pagamento.status === StatusPagamento.PENDENTE ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                      }`}>
                      {pagamento.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Registrar Novo Pagamento */}
          {valorRestante > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Registrar Novo Pagamento</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor do Pagamento
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    max={valorRestante}
                    value={novoPagamento.valor}
                    onChange={(e) => setNovoPagamento(prev => ({
                      ...prev,
                      valor: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0,00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo: R$ {valorRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data do Pagamento
                  </label>
                  <input
                    type="date"
                    value={novoPagamento.data}
                    onChange={(e) => setNovoPagamento(prev => ({
                      ...prev,
                      data: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pagamento
                  </label>
                  <select
                    value={novoPagamento.metodo}
                    onChange={(e) => setNovoPagamento(prev => ({
                      ...prev,
                      metodo: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="pix">PIX</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="boleto">Boleto</option>
                    <option value="transferencia">Transferência</option>
                    <option value="dinheiro">Dinheiro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <input
                    type="text"
                    value={novoPagamento.observacoes}
                    onChange={(e) => setNovoPagamento(prev => ({
                      ...prev,
                      observacoes: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Observações do pagamento"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRegistrarPagamento}
                  disabled={carregando || novoPagamento.valor <= 0}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {carregando ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Registrar Pagamento
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
