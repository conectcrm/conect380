import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Building, Check, CreditCard, Smartphone, X } from 'lucide-react';
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
}

interface TransacaoPagamento {
  id: string;
  faturaId: number;
  metodoPagamento: string;
  valor: number;
  status: 'processando' | 'aprovado' | 'rejeitado' | 'pendente';
  dataTransacao: Date;
}

interface GatewayPagamentoProps {
  fatura: Fatura;
  onPagamentoConcluido: (transacao: TransacaoPagamento) => void;
  onFechar: () => void;
  onSolicitarLinkPagamento?: (
    faturaId: number,
    metodo: MetodoPagamento['tipo'],
  ) => Promise<void>;
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
  },
  {
    id: 'pix',
    nome: 'PIX',
    tipo: 'pix',
    icone: <Smartphone className="h-6 w-6" />,
    taxa: 0.5,
    prazoCompensacao: 0,
    ativo: true,
  },
  {
    id: 'boleto',
    nome: 'Boleto bancario',
    tipo: 'boleto',
    icone: <Building className="h-6 w-6" />,
    taxa: 2.5,
    prazoCompensacao: 3,
    ativo: true,
  },
];

const getResumoMetodo = (metodo: MetodoPagamento['tipo']): string => {
  if (metodo === 'pix') {
    return 'Pagamento instantaneo. O backend gera o link/QRCode oficial conforme configuracao.';
  }
  if (metodo === 'boleto') {
    return 'O backend gera o boleto oficial e controla vencimento, baixa e conciliacao.';
  }
  if (metodo === 'cartao') {
    return 'Captura e autorizacao devem ocorrer apenas no provedor configurado no backend.';
  }
  return 'Solicitacao enviada para o backend conforme configuracao da empresa.';
};

export default function GatewayPagamento({
  fatura,
  onPagamentoConcluido,
  onFechar,
  onSolicitarLinkPagamento,
}: GatewayPagamentoProps) {
  const financeiroFeatureFlags = useMemo(() => getFinanceiroFeatureFlags(), []);
  const [metodoSelecionado, setMetodoSelecionado] = useState<MetodoPagamento | null>(null);
  const [processandoPagamento, setProcessandoPagamento] = useState(false);
  const [transacaoAtual, setTransacaoAtual] = useState<TransacaoPagamento | null>(null);
  const [erroOperacao, setErroOperacao] = useState<string | null>(null);

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
    const metodoAindaDisponivel = metodosDisponiveis.some(
      (metodo) => metodo.id === metodoSelecionado.id,
    );
    if (!metodoAindaDisponivel) {
      setMetodoSelecionado(null);
    }
  }, [metodoSelecionado, metodosDisponiveis]);

  const valorTotal = converterParaNumero(fatura.valorTotal);
  const valorComTaxa = metodoSelecionado
    ? valorTotal * (1 + metodoSelecionado.taxa / 100)
    : valorTotal;

  const processarPagamento = async () => {
    if (!metodoSelecionado) {
      return;
    }

    if (!financeiroFeatureFlags.boletoEnabled && metodoSelecionado.tipo === 'boleto') {
      setMetodoSelecionado(null);
      return;
    }

    setProcessandoPagamento(true);
    setErroOperacao(null);

    try {
      if (!onSolicitarLinkPagamento) {
        throw new Error(
          'Fluxo online nao configurado. Utilize o backend para gerar o link de pagamento.',
        );
      }

      await onSolicitarLinkPagamento(fatura.id, metodoSelecionado.tipo);

      const solicitacao: TransacaoPagamento = {
        id: `solicitacao_${fatura.id}_${Date.now()}`,
        faturaId: fatura.id,
        metodoPagamento: metodoSelecionado.id,
        valor: valorComTaxa,
        status: 'pendente',
        dataTransacao: new Date(),
      };

      setTransacaoAtual(solicitacao);
      onPagamentoConcluido(solicitacao);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : 'Nao foi possivel solicitar o pagamento online para esta fatura.';
      setErroOperacao(mensagem);
    } finally {
      setProcessandoPagamento(false);
    }
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
            <p className="text-sm text-[#5D7A88]">
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
              <div className="rounded-xl border border-[#F6D7B2] bg-[#FFF8EE] p-4 text-sm text-[#7A4B00]">
                <div className="mb-2 flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <strong>Protecao de regra de negocio ativa</strong>
                </div>
                Esta tela nao processa dados sensiveis nem aprova pagamentos no frontend. A
                operacao apenas solicita o fluxo oficial ao backend.
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium text-[#173A4D]">
                  Escolha o metodo de pagamento
                </h3>
                {metodosDisponiveis.length === 0 ? (
                  <div className="rounded-xl border border-[#F6D7B2] bg-[#FFF8EE] p-4 text-sm text-[#9B5A00]">
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
                          <div
                            className={
                              metodoSelecionado?.id === metodo.id
                                ? 'text-[#159A9C]'
                                : 'text-[#7C96A3]'
                            }
                          >
                            {metodo.icone}
                          </div>
                          <span className="font-medium text-[#173A4D]">{metodo.nome}</span>
                        </div>
                        <div className="text-sm text-[#5D7A88]">
                          <div>Taxa: {metodo.taxa}%</div>
                          <div>
                            Compensacao:{' '}
                            {metodo.prazoCompensacao === 0
                              ? 'Imediata'
                              : `${metodo.prazoCompensacao} dia(s)`}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {!financeiroFeatureFlags.boletoEnabled &&
                financeiroFeatureFlags.boletoDisabledReason ? (
                  <p className="mt-3 text-xs text-[#6E8794]">
                    {financeiroFeatureFlags.boletoDisabledReason}
                  </p>
                ) : null}
              </div>

              {metodoSelecionado ? (
                <div className="rounded-xl border border-[#D4E2E7] bg-[#F8FCFC] p-6">
                  <h4 className="mb-2 font-medium text-[#173A4D]">{metodoSelecionado.nome}</h4>
                  <p className="text-sm text-[#5D7A88]">{getResumoMetodo(metodoSelecionado.tipo)}</p>
                </div>
              ) : null}

              {metodoSelecionado ? (
                <div className="rounded-xl border border-[#D4E2E7] bg-white p-6">
                  <h4 className="mb-4 font-medium text-[#173A4D]">Resumo da solicitacao</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#5D7A88]">Valor da fatura:</span>
                      <span className="font-medium">{formatarValorCompletoBRL(valorTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5D7A88]">
                        Taxa do metodo ({metodoSelecionado.taxa}%):
                      </span>
                      <span className="font-medium">
                        {formatarValorCompletoBRL((valorTotal * metodoSelecionado.taxa) / 100)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Total estimado:</span>
                      <span className="text-lg font-semibold">{formatarValorCompletoBRL(valorComTaxa)}</span>
                    </div>
                  </div>
                </div>
              ) : null}

              {erroOperacao ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {erroOperacao}
                </div>
              ) : null}

              {metodoSelecionado ? (
                <button
                  onClick={processarPagamento}
                  disabled={processandoPagamento}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#159A9C] py-3 font-medium text-white transition hover:bg-[#117C7E] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processandoPagamento ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Solicitando pagamento...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      Solicitar pagamento no backend
                    </>
                  )}
                </button>
              ) : null}
            </>
          ) : (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ECF7F3]">
                <Check className="h-8 w-8 text-[#067647]" />
              </div>
              <h3 className="text-xl font-semibold text-[#0E4B35]">Solicitacao registrada</h3>
              <p className="text-[#5D7A88]">
                O backend recebeu a solicitacao. A baixa financeira depende da confirmacao oficial
                do processamento.
              </p>
              <p className="text-xs text-[#6D8794]">Referencia: {transacaoAtual.id}</p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={onFechar}
                  className="rounded-lg border border-[#D4E2E7] bg-white px-5 py-2 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB]"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    setTransacaoAtual(null);
                    setMetodoSelecionado(null);
                    setErroOperacao(null);
                  }}
                  className="rounded-lg bg-[#159A9C] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#117C7E]"
                >
                  Nova solicitacao
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
