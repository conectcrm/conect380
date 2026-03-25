import React, { useEffect, useMemo, useState } from 'react';
import { Building, Check, CreditCard, QrCode, Smartphone, X } from 'lucide-react';
import { getFinanceiroFeatureFlags } from '../../config/financeiroFeatureFlags';
import { Fatura } from '../../services/faturamentoService';
import { converterParaNumero, formatarValorCompletoBRL } from '../../utils/formatacao';

interface MetodoPagamento {
  id: string;
  nome: string;
  tipo: 'cartao' | 'pix' | 'boleto' | 'transferencia';
  icone: React.ReactNode;
  taxa: number;
  prazoCompensacao: number;
  ativo: boolean;
  configuracao: Record<string, unknown>;
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
    nome: 'Cartao de credito/debito',
    tipo: 'cartao',
    icone: <CreditCard className="h-6 w-6" />,
    taxa: 3.5,
    prazoCompensacao: 1,
    ativo: true,
    configuracao: {
      bandeiras: ['visa', 'mastercard', 'elo', 'amex'],
      parcelamento: true,
      maxParcelas: 12,
    },
  },
  {
    id: 'pix',
    nome: 'PIX',
    tipo: 'pix',
    icone: <Smartphone className="h-6 w-6" />,
    taxa: 0.5,
    prazoCompensacao: 0,
    ativo: true,
    configuracao: {
      tempoExpiracao: 30,
    },
  },
  {
    id: 'boleto',
    nome: 'Boleto bancario',
    tipo: 'boleto',
    icone: <Building className="h-6 w-6" />,
    taxa: 2.5,
    prazoCompensacao: 3,
    ativo: true,
    configuracao: {
      diasVencimento: 3,
    },
  },
];

export default function GatewayPagamento({
  fatura,
  onPagamentoConcluido,
  onFechar,
}: GatewayPagamentoProps) {
  const financeiroFeatureFlags = useMemo(() => getFinanceiroFeatureFlags(), []);
  const [metodoSelecionado, setMetodoSelecionado] = useState<MetodoPagamento | null>(null);
  const [processandoPagamento, setProcessandoPagamento] = useState(false);
  const [transacaoAtual, setTransacaoAtual] = useState<TransacaoPagamento | null>(null);
  const [dadosCartao, setDadosCartao] = useState({
    numero: '',
    nome: '',
    validade: '',
    cvv: '',
    parcelas: 1,
  });

  const metodosDisponiveis = useMemo(
    () =>
      METODOS_PAGAMENTO.filter((metodo) => {
        if (!metodo.ativo) {
          return false;
        }
        if (!financeiroFeatureFlags.boletoEnabled && metodo.tipo === 'boleto') {
          return false;
        }
        return true;
      }),
    [financeiroFeatureFlags.boletoEnabled],
  );

  useEffect(() => {
    if (!metodoSelecionado) {
      return;
    }
    const metodoAindaDisponivel = metodosDisponiveis.some((metodo) => metodo.id === metodoSelecionado.id);
    if (!metodoAindaDisponivel) {
      setMetodoSelecionado(null);
    }
  }, [metodoSelecionado, metodosDisponiveis]);

  const valorTotal = converterParaNumero(fatura.valorTotal);
  const valorComTaxa = metodoSelecionado ? valorTotal * (1 + metodoSelecionado.taxa / 100) : valorTotal;

  const processarPagamento = async () => {
    if (!metodoSelecionado) {
      return;
    }
    if (!financeiroFeatureFlags.boletoEnabled && metodoSelecionado.tipo === 'boleto') {
      setMetodoSelecionado(null);
      return;
    }

    setProcessandoPagamento(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const novaTransacao: TransacaoPagamento = {
      id: `txn_${Date.now()}`,
      faturaId: fatura.id,
      metodoPagamento: metodoSelecionado.id,
      valor: valorComTaxa,
      status: Math.random() > 0.1 ? 'aprovado' : 'rejeitado',
      dataTransacao: new Date(),
      codigoTransacao: `TXN${Math.random().toString(36).slice(2, 11).toUpperCase()}`,
    };

    if (metodoSelecionado.tipo === 'pix') {
      novaTransacao.qrCode = `00020126580014br.gov.bcb.pix013665e3b5b3-7b5f-4a5b-8b7f-2e4d8f9c1a0b52040000530398654${valorComTaxa.toFixed(2)}`;
      novaTransacao.linkPagamento = `https://pix.exemplo.com/pay/${novaTransacao.id}`;
    } else if (metodoSelecionado.tipo === 'boleto') {
      novaTransacao.codigoBarras = `23793.33120 60000.000000 00000.000000 1 90900000${(valorComTaxa * 100)
        .toFixed(0)
        .padStart(10, '0')}`;
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
      return `${validade.substring(0, 2)}/${validade.substring(2, 4)}`;
    }
    return validade;
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0D1F2A]/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !processandoPagamento) {
          onFechar();
        }
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#DCE8EC] bg-white shadow-[0_30px_60px_-30px_rgba(7,36,51,0.55)]"
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E1EAEE] bg-white p-6">
          <div>
            <h2 className="text-xl font-semibold text-[#173A4D]">Pagamento da fatura</h2>
            <p className="text-gray-600">
              #{fatura.numero} - {formatarValorCompletoBRL(fatura.valorTotal)}
            </p>
          </div>
          <button
            onClick={onFechar}
            disabled={processandoPagamento}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5E7784] transition hover:bg-[#F4F8FA] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {!transacaoAtual ? (
            <>
              <div>
                <h3 className="mb-4 text-lg font-medium text-gray-900">Escolha o metodo de pagamento</h3>
                {metodosDisponiveis.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Nenhum metodo de pagamento online esta disponivel no ambiente atual.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {metodosDisponiveis.map((metodo) => (
                      <button
                        key={metodo.id}
                        onClick={() => setMetodoSelecionado(metodo)}
                        className={`rounded-xl border-2 p-4 text-left transition-all ${
                          metodoSelecionado?.id === metodo.id
                            ? 'border-[#159A9C] bg-[#E8F6F6]'
                            : 'border-[#D4E2E7] hover:border-[#BFD3DA]'
                        }`}
                      >
                        <div className="mb-2 flex items-center gap-3">
                          <div className={metodoSelecionado?.id === metodo.id ? 'text-[#159A9C]' : 'text-gray-400'}>
                            {metodo.icone}
                          </div>
                          <span className="font-medium text-gray-900">{metodo.nome}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>Taxa: {metodo.taxa}%</div>
                          <div>
                            Compensacao:{' '}
                            {metodo.prazoCompensacao === 0 ? 'Imediata' : `${metodo.prazoCompensacao} dia(s)`}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {!financeiroFeatureFlags.boletoEnabled && financeiroFeatureFlags.boletoDisabledReason ? (
                  <p className="mt-3 text-xs text-[#6E8794]">{financeiroFeatureFlags.boletoDisabledReason}</p>
                ) : null}
              </div>

              {metodoSelecionado && (
                <div className="rounded-xl border border-[#D4E2E7] bg-[#F8FCFC] p-6">
                  <h4 className="mb-4 font-medium text-gray-900">Dados para {metodoSelecionado.nome}</h4>

                  {metodoSelecionado.tipo === 'cartao' && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-gray-700">Numero do cartao</label>
                        <input
                          type="text"
                          value={dadosCartao.numero}
                          onChange={(event) =>
                            setDadosCartao((prev) => ({
                              ...prev,
                              numero: formatarNumeroCartao(event.target.value),
                            }))
                          }
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          className="w-full rounded-lg border border-[#D4E2E7] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-gray-700">Nome no cartao</label>
                        <input
                          type="text"
                          value={dadosCartao.nome}
                          onChange={(event) =>
                            setDadosCartao((prev) => ({
                              ...prev,
                              nome: event.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="NOME COMO NO CARTAO"
                          className="w-full rounded-lg border border-[#D4E2E7] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Validade</label>
                        <input
                          type="text"
                          value={dadosCartao.validade}
                          onChange={(event) =>
                            setDadosCartao((prev) => ({
                              ...prev,
                              validade: formatarValidade(event.target.value),
                            }))
                          }
                          placeholder="MM/AA"
                          maxLength={5}
                          className="w-full rounded-lg border border-[#D4E2E7] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">CVV</label>
                        <input
                          type="text"
                          value={dadosCartao.cvv}
                          onChange={(event) =>
                            setDadosCartao((prev) => ({
                              ...prev,
                              cvv: event.target.value.replace(/\D/g, ''),
                            }))
                          }
                          placeholder="123"
                          maxLength={4}
                          className="w-full rounded-lg border border-[#D4E2E7] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-gray-700">Parcelas</label>
                        <select
                          value={dadosCartao.parcelas}
                          onChange={(event) =>
                            setDadosCartao((prev) => ({
                              ...prev,
                              parcelas: parseInt(event.target.value, 10),
                            }))
                          }
                          className="w-full rounded-lg border border-[#D4E2E7] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                        >
                          {Array.from(
                            { length: Number(metodoSelecionado.configuracao.maxParcelas) || 1 },
                            (_, i) => i + 1,
                          ).map((parcela) => (
                            <option key={parcela} value={parcela}>
                              {parcela}x de {formatarValorCompletoBRL(valorComTaxa / parcela)}
                              {parcela === 1 ? ' a vista' : ` (Total: ${formatarValorCompletoBRL(valorComTaxa)})`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {metodoSelecionado.tipo === 'pix' && (
                    <div className="text-center">
                      <QrCode className="mx-auto mb-4 h-24 w-24 text-gray-400" />
                      <p className="text-gray-600">Apos confirmar, sera gerado um QR Code para pagamento instantaneo.</p>
                    </div>
                  )}

                  {metodoSelecionado.tipo === 'boleto' && (
                    <div className="text-center">
                      <Building className="mx-auto mb-4 h-24 w-24 text-gray-400" />
                      <p className="text-gray-600">
                        Sera gerado um boleto bancario com vencimento em{' '}
                        {String(metodoSelecionado.configuracao.diasVencimento || 3)} dias.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {metodoSelecionado && (
                <div className="rounded-xl border border-[#D4E2E7] bg-white p-6">
                  <h4 className="mb-4 font-medium text-gray-900">Resumo do pagamento</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor da fatura:</span>
                      <span className="font-medium">{formatarValorCompletoBRL(valorTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxa do metodo ({metodoSelecionado.taxa}%):</span>
                      <span className="font-medium">
                        {formatarValorCompletoBRL((valorTotal * metodoSelecionado.taxa) / 100)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Total a pagar:</span>
                      <span className="text-lg font-semibold">{formatarValorCompletoBRL(valorComTaxa)}</span>
                    </div>
                  </div>
                </div>
              )}

              {metodoSelecionado && (
                <button
                  onClick={processarPagamento}
                  disabled={
                    processandoPagamento ||
                    (metodoSelecionado.tipo === 'cartao' &&
                      (!dadosCartao.numero || !dadosCartao.nome || !dadosCartao.validade || !dadosCartao.cvv))
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#159A9C] py-3 font-medium text-white transition hover:bg-[#117C7E] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processandoPagamento ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processando pagamento...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      Confirmar pagamento
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            <div className="text-center">
              {transacaoAtual.status === 'aprovado' ? (
                <div className="space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-green-900">Pagamento aprovado</h3>
                  <p className="text-gray-600">Transacao: {transacaoAtual.codigoTransacao}</p>

                  {transacaoAtual.qrCode && (
                    <div className="rounded-lg bg-gray-50 p-6">
                      <h4 className="mb-4 font-medium">QR Code PIX</h4>
                      <div className="inline-block rounded-lg bg-white p-4">
                        <QrCode className="h-32 w-32 text-gray-400" />
                      </div>
                      <p className="mt-2 text-sm text-gray-600">Escaneie o codigo ou use o link abaixo.</p>
                      {transacaoAtual.linkPagamento && (
                        <a
                          href={transacaoAtual.linkPagamento}
                          className="text-sm text-[#159A9C] hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Abrir link de pagamento
                        </a>
                      )}
                    </div>
                  )}

                  {transacaoAtual.codigoBarras && (
                    <div className="rounded-lg bg-gray-50 p-6">
                      <h4 className="mb-4 font-medium">Codigo de barras</h4>
                      <div className="rounded border bg-white p-4 font-mono text-sm">{transacaoAtual.codigoBarras}</div>
                      {transacaoAtual.linkPagamento && (
                        <a
                          href={transacaoAtual.linkPagamento}
                          className="mt-2 inline-block text-sm text-[#159A9C] hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Imprimir boleto
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                    <X className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-red-900">Pagamento rejeitado</h3>
                  <p className="text-gray-600">Verifique os dados e tente novamente com outro metodo.</p>
                  <button
                    onClick={() => {
                      setTransacaoAtual(null);
                      setMetodoSelecionado(null);
                    }}
                    className="rounded-lg bg-[#159A9C] px-6 py-2 text-white transition hover:bg-[#117C7E]"
                  >
                    Tentar novamente
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
