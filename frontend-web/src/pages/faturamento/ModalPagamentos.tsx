import React, { useCallback, useEffect, useState } from 'react';
import { X, Plus, CreditCard, DollarSign, CheckCircle, Clock, RotateCcw } from 'lucide-react';
import {
  faturamentoService,
  Fatura,
  FormaPagamento,
  StatusPagamento,
} from '../../services/faturamentoService';
import MoneyInputNoPrefix from '../../components/inputs/MoneyInputNoPrefix';
import ModalMotivoEstorno from './ModalMotivoEstorno';
import { getFinanceiroFeatureFlags } from '../../config/financeiroFeatureFlags';

interface PagamentoHistorico {
  id: number;
  valor: number;
  data: string;
  metodo: string;
  status: StatusPagamento;
  tipo?: string;
  transacaoId?: string;
  comprovante?: string;
  observacoes?: string;
}

interface NovoPagamentoFormulario {
  valor: number;
  data: string;
  metodo: string;
  observacoes?: string;
}

interface EstornoAlvo {
  id: number;
  valor: number;
  transacaoId?: string;
}

interface ModalPagamentosProps {
  isOpen: boolean;
  onClose: () => void;
  fatura: Fatura;
  onRegistrarPagamento: (pagamento: NovoPagamentoFormulario) => Promise<void>;
  onEstornarPagamento: (pagamentoId: number, motivo: string) => Promise<void>;
}

export default function ModalPagamentos({
  isOpen,
  onClose,
  fatura,
  onRegistrarPagamento,
  onEstornarPagamento,
}: ModalPagamentosProps) {
  const financeiroFeatureFlags = getFinanceiroFeatureFlags();
  const metodosDisponiveis = [
    { value: 'pix', label: 'PIX' },
    { value: 'cartao_credito', label: 'Cartao de Credito' },
    { value: 'cartao_debito', label: 'Cartao de Debito' },
    ...(financeiroFeatureFlags.boletoEnabled ? [{ value: 'boleto', label: 'Boleto' }] : []),
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'dinheiro', label: 'Dinheiro' },
  ];

  const normalizarMetodoPagamento = (value: string): string => {
    return metodosDisponiveis.some((item) => item.value === value)
      ? value
      : metodosDisponiveis[0]?.value || 'pix';
  };

  const [pagamentos, setPagamentos] = useState<PagamentoHistorico[]>([]);
  const [novoPagamento, setNovoPagamento] = useState<NovoPagamentoFormulario>({
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    metodo: normalizarMetodoPagamento('pix'),
    observacoes: '',
  });
  const [carregando, setCarregando] = useState(false);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [estornandoPagamentoId, setEstornandoPagamentoId] = useState<number | null>(null);
  const [estornoAlvo, setEstornoAlvo] = useState<EstornoAlvo | null>(null);
  const [motivoEstorno, setMotivoEstorno] = useState('');
  const [erroEstorno, setErroEstorno] = useState<string | null>(null);
  const [erroHistorico, setErroHistorico] = useState<string | null>(null);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);

  const carregarHistoricoPagamentos = useCallback(async () => {
    setCarregandoHistorico(true);
    setErroHistorico(null);
    try {
      const lista = await faturamentoService.listarPagamentos(fatura.id);
      const historico: PagamentoHistorico[] = lista.map((pagamento) => ({
        id: pagamento.id,
        valor: pagamento.valor,
        data: pagamento.dataPagamento || pagamento.criadoEm,
        metodo: pagamento.formaPagamento || pagamento.metodoPagamento || 'pix',
        status: pagamento.status,
        tipo: pagamento.tipo,
        transacaoId: pagamento.transacaoId,
        comprovante: pagamento.comprovante,
        observacoes: pagamento.observacoes,
      }));
      setPagamentos(historico);
    } catch (error) {
      console.error('Erro ao carregar historico de pagamentos:', error);
      setPagamentos([]);
      setErroHistorico('Nao foi possivel carregar o historico de pagamentos desta fatura.');
    } finally {
      setCarregandoHistorico(false);
    }
  }, [fatura.id]);

  useEffect(() => {
    if (!isOpen) return;
    setNovoPagamento((prev) => ({
      ...prev,
      metodo: normalizarMetodoPagamento(prev.metodo),
    }));
    carregarHistoricoPagamentos();
  }, [isOpen, carregarHistoricoPagamentos]);

  const valorPago = pagamentos.reduce(
    (total, pagamento) =>
      pagamento.status === StatusPagamento.APROVADO ? total + pagamento.valor : total,
    0,
  );
  const valorRestante = Math.max(0, fatura.valorTotal - valorPago);
  const formatarMoeda = (valor: number): string =>
    valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handleRegistrarPagamento = async () => {
    if (novoPagamento.valor <= 0 || novoPagamento.valor > valorRestante) {
      setErroFormulario('Informe um valor valido, maior que zero e ate o valor restante.');
      return;
    }

    setErroFormulario(null);
    setCarregando(true);
    try {
      await onRegistrarPagamento(novoPagamento);

      setNovoPagamento({
        valor: 0,
        data: new Date().toISOString().split('T')[0],
        metodo: normalizarMetodoPagamento('pix'),
        observacoes: '',
      });

      await carregarHistoricoPagamentos();
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      setErroFormulario('Falha ao registrar pagamento. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const handleEstornarPagamento = (pagamento: PagamentoHistorico) => {
    const podeEstornar =
      pagamento.status === StatusPagamento.APROVADO &&
      String(pagamento.tipo || 'pagamento').toLowerCase() !== 'estorno' &&
      pagamento.valor > 0;

    if (!podeEstornar) {
      setErroFormulario('Este pagamento nao pode ser estornado.');
      return;
    }

    if (!pagamento.id || pagamento.id <= 0) {
      setErroFormulario('Pagamento invalido para estorno.');
      return;
    }

    setErroFormulario(null);
    setErroEstorno(null);
    setMotivoEstorno('');
    setEstornoAlvo({
      id: pagamento.id,
      valor: pagamento.valor,
      transacaoId: pagamento.transacaoId,
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
    if (!estornoAlvo || !estornoAlvo.id) {
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
      await carregarHistoricoPagamentos();
    } catch (error) {
      console.error('Erro ao estornar pagamento:', error);
      setErroEstorno('Falha ao estornar pagamento. Tente novamente.');
    } finally {
      setEstornandoPagamentoId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0D1F2A]/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !carregando) {
          onClose();
        }
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#DCE8EC] bg-white shadow-[0_30px_60px_-30px_rgba(7,36,51,0.55)]"
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E1EAEE] bg-white p-6">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold text-[#173A4D]">
              <CreditCard className="h-6 w-6 text-[#159A9C]" />
              Pagamentos - Fatura #{fatura.numero}
            </h2>
            <p className="mt-1 text-sm text-gray-600">Valor total: {formatarMoeda(fatura.valorTotal)}</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5E7784] transition hover:bg-[#F4F8FA]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Valor total</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{formatarMoeda(fatura.valorTotal)}</p>
            </div>

            <div className="rounded-lg bg-green-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Valor pago</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{formatarMoeda(valorPago)}</p>
            </div>

            <div className="rounded-lg bg-orange-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Restante</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">{formatarMoeda(valorRestante)}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Historico de pagamentos</h3>

            {carregandoHistorico ? (
              <div className="py-8 text-center text-gray-500">Carregando pagamentos...</div>
            ) : erroHistorico ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {erroHistorico}
              </div>
            ) : pagamentos.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <CreditCard className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p>Nenhum pagamento registrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pagamentos.map((pagamento) => (
                  <div key={pagamento.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          pagamento.tipo === 'estorno'
                            ? 'bg-orange-500'
                            : pagamento.status === StatusPagamento.APROVADO
                              ? 'bg-green-500'
                              : pagamento.status === StatusPagamento.PENDENTE
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                        }`}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{formatarMoeda(pagamento.valor)}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(pagamento.data).toLocaleDateString('pt-BR')} -{' '}
                          {faturamentoService.formatarFormaPagamento(pagamento.metodo as FormaPagamento)}
                          {pagamento.transacaoId ? ` - ${pagamento.transacaoId}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          pagamento.tipo === 'estorno'
                            ? 'bg-orange-100 text-orange-800'
                            : pagamento.status === StatusPagamento.APROVADO
                              ? 'bg-green-100 text-green-800'
                              : pagamento.status === StatusPagamento.PENDENTE
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {pagamento.tipo === 'estorno' ? 'estorno' : pagamento.status}
                      </span>
                      {pagamento.status === StatusPagamento.APROVADO &&
                      pagamento.tipo !== 'estorno' &&
                      pagamento.valor > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleEstornarPagamento(pagamento)}
                          disabled={estornandoPagamentoId === pagamento.id}
                          className="inline-flex items-center gap-1 rounded-md border border-orange-300 bg-white px-2 py-1 text-xs font-medium text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          {estornandoPagamentoId === pagamento.id ? 'Estornando...' : 'Estornar'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {valorRestante > 0 && (
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Registrar novo pagamento</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Valor do pagamento
                  </label>
                  <MoneyInputNoPrefix
                    value={novoPagamento.valor}
                    onValueChange={(value) =>
                      setNovoPagamento((prev) => ({
                        ...prev,
                        valor: Math.min(value || 0, valorRestante),
                      }))
                    }
                    isAllowed={({ floatValue }) =>
                      floatValue === undefined || floatValue <= valorRestante
                    }
                    className="w-full rounded-lg border border-[#D4E2E7] px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#159A9C]"
                    placeholder="0,00"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Maximo: {formatarMoeda(valorRestante)}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Data do pagamento
                  </label>
                  <input
                    type="date"
                    value={novoPagamento.data}
                    onChange={(e) =>
                      setNovoPagamento((prev) => ({
                        ...prev,
                        data: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-[#D4E2E7] px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#159A9C]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Metodo de pagamento
                  </label>
                  <select
                    value={novoPagamento.metodo}
                    onChange={(e) =>
                      setNovoPagamento((prev) => ({
                        ...prev,
                        metodo: normalizarMetodoPagamento(e.target.value),
                      }))
                    }
                    className="w-full rounded-lg border border-[#D4E2E7] px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#159A9C]"
                  >
                    {metodosDisponiveis.map((metodo) => (
                      <option key={metodo.value} value={metodo.value}>
                        {metodo.label}
                      </option>
                    ))}
                  </select>
                  {!financeiroFeatureFlags.boletoEnabled && (
                    <p className="mt-1 text-xs text-[#5E7784]">
                      {financeiroFeatureFlags.boletoDisabledReason}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Observacoes</label>
                  <input
                    type="text"
                    value={novoPagamento.observacoes}
                    onChange={(e) =>
                      setNovoPagamento((prev) => ({
                        ...prev,
                        observacoes: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-[#D4E2E7] px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#159A9C]"
                    placeholder="Observacoes do pagamento"
                  />
                </div>
              </div>

              {erroFormulario && (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {erroFormulario}
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4">
                <button
                  onClick={onClose}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRegistrarPagamento}
                  disabled={carregando || novoPagamento.valor <= 0}
                  className="flex items-center gap-2 rounded-lg bg-[#159A9C] px-6 py-2 text-white transition-colors hover:bg-[#117C7E] disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {carregando ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Registrar pagamento
                </button>
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

