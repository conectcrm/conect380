import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, QrCode, Building, Check, X, Clock, AlertCircle } from 'lucide-react';
import { Fatura } from '../../services/faturamentoService';
import { formatarValorCompletoBRL, converterParaNumero } from '../../utils/formatacao';

interface MetodoPagamento {
  id: string;
  nome: string;
  tipo: 'cartao' | 'pix' | 'boleto' | 'transferencia';
  icone: React.ReactNode;
  taxa: number; // percentual
  prazoCompensacao: number; // dias
  ativo: boolean;
  configuracao: any;
}

interface TransacaoPagamento {
  id: string;
  faturaId: number;
  metodoPagamento: string;
  valor: number;
  status: 'processando' | 'aprovado' | 'rejeitado' | 'pendente';
  dataTransacao: Date;
  codigoTransacao?: string;
  linkPagamento?: string;
  qrCode?: string;
  codigoBarras?: string;
}

interface GatewayPagamentoProps {
  fatura: Fatura;
  onPagamentoConcluido: (transacao: TransacaoPagamento) => void;
  onFechar: () => void;
}

const METODOS_PAGAMENTO: MetodoPagamento[] = [
  {
    id: 'cartao',
    nome: 'Cartão de Crédito/Débito',
    tipo: 'cartao',
    icone: <CreditCard className="w-6 h-6" />,
    taxa: 3.5,
    prazoCompensacao: 1,
    ativo: true,
    configuracao: {
      bandeiras: ['visa', 'mastercard', 'elo', 'amex'],
      parcelamento: true,
      maxParcelas: 12
    }
  },
  {
    id: 'pix',
    nome: 'PIX',
    tipo: 'pix',
    icone: <Smartphone className="w-6 h-6" />,
    taxa: 0.5,
    prazoCompensacao: 0,
    ativo: true,
    configuracao: {
      tempoExpiracao: 30 // minutos
    }
  },
  {
    id: 'boleto',
    nome: 'Boleto Bancário',
    tipo: 'boleto',
    icone: <Building className="w-6 h-6" />,
    taxa: 2.5,
    prazoCompensacao: 3,
    ativo: true,
    configuracao: {
      diasVencimento: 3
    }
  }
];

export default function GatewayPagamento({ fatura, onPagamentoConcluido, onFechar }: GatewayPagamentoProps) {
  const [metodoSelecionado, setMetodoSelecionado] = useState<MetodoPagamento | null>(null);
  const [processandoPagamento, setProcessandoPagamento] = useState(false);
  const [transacaoAtual, setTransacaoAtual] = useState<TransacaoPagamento | null>(null);
  const [dadosCartao, setDadosCartao] = useState({
    numero: '',
    nome: '',
    validade: '',
    cvv: '',
    parcelas: 1
  });

  const valorTotal = converterParaNumero(fatura.valorTotal);
  const valorComTaxa = metodoSelecionado ? valorTotal * (1 + metodoSelecionado.taxa / 100) : valorTotal;

  // Simula processamento de pagamento
  const processarPagamento = async () => {
    if (!metodoSelecionado) return;

    setProcessandoPagamento(true);

    // Simula delay do processamento
    await new Promise(resolve => setTimeout(resolve, 2000));

    const novaTransacao: TransacaoPagamento = {
      id: `txn_${Date.now()}`,
      faturaId: fatura.id,
      metodoPagamento: metodoSelecionado.id,
      valor: valorComTaxa,
      status: Math.random() > 0.1 ? 'aprovado' : 'rejeitado', // 90% de aprovação
      dataTransacao: new Date(),
      codigoTransacao: `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };

    // Adiciona dados específicos por método
    if (metodoSelecionado.tipo === 'pix') {
      novaTransacao.qrCode = `00020126580014br.gov.bcb.pix013665e3b5b3-7b5f-4a5b-8b7f-2e4d8f9c1a0b52040000530398654${valorComTaxa.toFixed(2)}`;
      novaTransacao.linkPagamento = `https://pix.exemplo.com/pay/${novaTransacao.id}`;
    } else if (metodoSelecionado.tipo === 'boleto') {
      novaTransacao.codigoBarras = `23793.33120 60000.000000 00000.000000 1 90900000${(valorComTaxa * 100).toFixed(0).padStart(10, '0')}`;
      novaTransacao.linkPagamento = `https://boleto.exemplo.com/print/${novaTransacao.id}`;
    }

    setTransacaoAtual(novaTransacao);

    if (novaTransacao.status === 'aprovado') {
      setTimeout(() => {
        onPagamentoConcluido(novaTransacao);
      }, 1000);
    }

    setProcessandoPagamento(false);
  };

  const formatarNumeroCartao = (valor: string) => {
    const numero = valor.replace(/\D/g, '');
    return numero.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatarValidade = (valor: string) => {
    const validade = valor.replace(/\D/g, '');
    if (validade.length >= 2) {
      return validade.substring(0, 2) + '/' + validade.substring(2, 4);
    }
    return validade;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Pagamento da Fatura</h2>
            <p className="text-gray-600">#{fatura.numero} - {formatarValorCompletoBRL(fatura.valorTotal)}</p>
          </div>
          <button
            onClick={onFechar}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!transacaoAtual ? (
            <>
              {/* Seleção de Método de Pagamento */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Escolha o método de pagamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {METODOS_PAGAMENTO.filter(m => m.ativo).map(metodo => (
                    <button
                      key={metodo.id}
                      onClick={() => setMetodoSelecionado(metodo)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${metodoSelecionado?.id === metodo.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`${metodoSelecionado?.id === metodo.id ? 'text-blue-600' : 'text-gray-400'}`}>
                          {metodo.icone}
                        </div>
                        <span className="font-medium text-gray-900">{metodo.nome}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Taxa: {metodo.taxa}%</div>
                        <div>Compensação: {metodo.prazoCompensacao === 0 ? 'Imediata' : `${metodo.prazoCompensacao} dia(s)`}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Formulário específico do método selecionado */}
              {metodoSelecionado && (
                <div className="border rounded-lg p-6 bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-4">
                    Dados para {metodoSelecionado.nome}
                  </h4>

                  {metodoSelecionado.tipo === 'cartao' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Número do Cartão
                        </label>
                        <input
                          type="text"
                          value={dadosCartao.numero}
                          onChange={(e) => setDadosCartao(prev => ({
                            ...prev,
                            numero: formatarNumeroCartao(e.target.value)
                          }))}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome no Cartão
                        </label>
                        <input
                          type="text"
                          value={dadosCartao.nome}
                          onChange={(e) => setDadosCartao(prev => ({ ...prev, nome: e.target.value.toUpperCase() }))}
                          placeholder="NOME COMO NO CARTÃO"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Validade
                        </label>
                        <input
                          type="text"
                          value={dadosCartao.validade}
                          onChange={(e) => setDadosCartao(prev => ({
                            ...prev,
                            validade: formatarValidade(e.target.value)
                          }))}
                          placeholder="MM/AA"
                          maxLength={5}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={dadosCartao.cvv}
                          onChange={(e) => setDadosCartao(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                          placeholder="123"
                          maxLength={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Parcelas
                        </label>
                        <select
                          value={dadosCartao.parcelas}
                          onChange={(e) => setDadosCartao(prev => ({ ...prev, parcelas: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Array.from({ length: metodoSelecionado.configuracao.maxParcelas }, (_, i) => i + 1).map(parcela => (
                            <option key={parcela} value={parcela}>
                              {parcela}x de {formatarValorCompletoBRL(valorComTaxa / parcela)}
                              {parcela === 1 ? ' à vista' : ` (Total: ${formatarValorCompletoBRL(valorComTaxa)})`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {metodoSelecionado.tipo === 'pix' && (
                    <div className="text-center">
                      <QrCode className="w-24 h-24 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">
                        Após confirmar, será gerado um QR Code para pagamento instantâneo
                      </p>
                    </div>
                  )}

                  {metodoSelecionado.tipo === 'boleto' && (
                    <div className="text-center">
                      <Building className="w-24 h-24 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">
                        Será gerado um boleto bancário com vencimento em {metodoSelecionado.configuracao.diasVencimento} dias
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Resumo do Pagamento */}
              {metodoSelecionado && (
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Resumo do Pagamento</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor da Fatura:</span>
                      <span className="font-medium">{formatarValorCompletoBRL(valorTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxa do método ({metodoSelecionado.taxa}%):</span>
                      <span className="font-medium">{formatarValorCompletoBRL(valorTotal * metodoSelecionado.taxa / 100)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-semibold">Total a Pagar:</span>
                      <span className="font-semibold text-lg">{formatarValorCompletoBRL(valorComTaxa)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Botão de Processamento */}
              {metodoSelecionado && (
                <button
                  onClick={processarPagamento}
                  disabled={processandoPagamento || (metodoSelecionado.tipo === 'cartao' && (!dadosCartao.numero || !dadosCartao.nome || !dadosCartao.validade || !dadosCartao.cvv))}
                  className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  {processandoPagamento ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processando Pagamento...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Confirmar Pagamento
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            /* Resultado da Transação */
            <div className="text-center">
              {transacaoAtual.status === 'aprovado' ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-green-900">Pagamento Aprovado!</h3>
                  <p className="text-gray-600">
                    Transação: {transacaoAtual.codigoTransacao}
                  </p>

                  {transacaoAtual.qrCode && (
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h4 className="font-medium mb-4">QR Code PIX</h4>
                      <div className="bg-white p-4 rounded-lg inline-block">
                        <QrCode className="w-32 h-32 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Escaneie o código ou use o link abaixo
                      </p>
                      {transacaoAtual.linkPagamento && (
                        <a
                          href={transacaoAtual.linkPagamento}
                          className="text-blue-600 hover:underline text-sm"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Abrir link de pagamento
                        </a>
                      )}
                    </div>
                  )}

                  {transacaoAtual.codigoBarras && (
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h4 className="font-medium mb-4">Código de Barras</h4>
                      <div className="font-mono text-sm bg-white p-4 rounded border">
                        {transacaoAtual.codigoBarras}
                      </div>
                      {transacaoAtual.linkPagamento && (
                        <a
                          href={transacaoAtual.linkPagamento}
                          className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Imprimir Boleto
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <X className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-red-900">Pagamento Rejeitado</h3>
                  <p className="text-gray-600">
                    Verifique os dados e tente novamente ou escolha outro método de pagamento.
                  </p>
                  <button
                    onClick={() => {
                      setTransacaoAtual(null);
                      setMetodoSelecionado(null);
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
