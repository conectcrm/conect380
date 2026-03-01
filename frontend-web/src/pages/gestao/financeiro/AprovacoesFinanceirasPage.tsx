import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertCircle, Check, Filter, RefreshCw, Search, X } from 'lucide-react';
import {
  DataTableCard,
  EmptyState,
  FiltersBar,
  InlineStats,
  LoadingSkeleton,
  PageHeader,
  SectionCard,
} from '../../../components/layout-v2';
import ModalJustificativa from '../../../components/common/ModalJustificativa';
import contasPagarService from '../../../services/contasPagarService';
import {
  CategoriaContaPagar,
  CATEGORIA_LABELS,
  ContaPagar,
  PRIORIDADE_LABELS,
  PrioridadePagamento,
} from '../../../types/financeiro';

const btnPrimary =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition hover:bg-[#117C7E] disabled:opacity-60 disabled:cursor-not-allowed';
const btnSecondary =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:opacity-60 disabled:cursor-not-allowed';
const btnSuccess =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#14804A] px-3 text-sm font-medium text-white transition hover:bg-[#0E6B3E] disabled:opacity-60 disabled:cursor-not-allowed';
const btnDanger =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#C03449] px-3 text-sm font-medium text-white transition hover:bg-[#A32A3D] disabled:opacity-60 disabled:cursor-not-allowed';

const moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('pt-BR');
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!error || typeof error !== 'object') return fallback;

  const response = (error as { response?: { data?: unknown } }).response;
  const data = response?.data;

  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }

  if (data && typeof data === 'object') {
    const message = (data as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
    if (Array.isArray(message)) {
      const first = message.find((item) => typeof item === 'string' && item.trim());
      if (first) {
        return first.trim();
      }
    }
  }

  return fallback;
};

const getPrioridadeBadge = (prioridade: PrioridadePagamento) => {
  const tone =
    prioridade === PrioridadePagamento.URGENTE
      ? 'border-[#F4C7CF] bg-[#FFF4F6] text-[#B4233A]'
      : prioridade === PrioridadePagamento.ALTA
        ? 'border-[#F9D9AA] bg-[#FFF7EA] text-[#A86400]'
        : prioridade === PrioridadePagamento.MEDIA
          ? 'border-[#CFE3FA] bg-[#F2F8FF] text-[#1E66B4]'
          : 'border-[#DCE8EC] bg-[#F8FBFC] text-[#476776]';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      {PRIORIDADE_LABELS[prioridade] || prioridade}
    </span>
  );
};

type ReprovacaoContexto =
  | { tipo: 'conta'; contaId: string }
  | { tipo: 'lote'; contaIds: string[] };

export default function AprovacoesFinanceirasPage() {
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  const [pendencias, setPendencias] = useState<ContaPagar[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [contasSelecionadas, setContasSelecionadas] = useState<Set<string>>(new Set());
  const [processandoLote, setProcessandoLote] = useState(false);
  const [processandoReprovacao, setProcessandoReprovacao] = useState(false);
  const [reprovacaoContexto, setReprovacaoContexto] = useState<ReprovacaoContexto | null>(null);

  useEffect(() => {
    void carregarPendencias();
  }, []);

  const carregarPendencias = async (searchTerm?: string) => {
    try {
      setCarregando(true);
      setErro(null);
      const dados = await contasPagarService.listarPendenciasAprovacao({
        termo: (searchTerm ?? busca).trim() || undefined,
      });
      setPendencias(Array.isArray(dados) ? dados : []);
      setContasSelecionadas(new Set());
    } catch (error) {
      const mensagem = getApiErrorMessage(
        error,
        'Nao foi possivel carregar pendencias de aprovacao',
      );
      setErro(mensagem);
      toast.error(mensagem);
      setPendencias([]);
    } finally {
      setCarregando(false);
    }
  };

  const buscarPendencias = async () => {
    await carregarPendencias(busca);
  };

  const limparFiltros = async () => {
    setBusca('');
    await carregarPendencias('');
  };

  const pendenciasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return pendencias;

    return pendencias.filter((conta) => {
      const label = `${conta.numero} ${conta.fornecedor.nome} ${conta.descricao} ${conta.numeroDocumento || ''}`;
      return label.toLowerCase().includes(termo);
    });
  }, [busca, pendencias]);

  const total = pendenciasFiltradas.length;
  const valorTotal = pendenciasFiltradas.reduce((acc, conta) => acc + Number(conta.valorTotal || 0), 0);
  const selecionadasVisiveis = pendenciasFiltradas.filter((c) => contasSelecionadas.has(c.id)).length;
  const allVisibleSelected = total > 0 && selecionadasVisiveis === total;
  const partialVisibleSelected = selecionadasVisiveis > 0 && selecionadasVisiveis < total;
  const hasFilters = busca.trim().length > 0;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = partialVisibleSelected;
    }
  }, [partialVisibleSelected, total, allVisibleSelected]);

  const toggleSelecionarConta = (id: string) => {
    setContasSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelecionarTodasVisiveis = () => {
    setContasSelecionadas((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        pendenciasFiltradas.forEach((conta) => next.delete(conta.id));
      } else {
        pendenciasFiltradas.forEach((conta) => next.add(conta.id));
      }
      return next;
    });
  };

  const aprovarConta = async (id: string) => {
    try {
      await contasPagarService.aprovar(id);
      toast.success('Conta aprovada com sucesso');
      await carregarPendencias();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Nao foi possivel aprovar a conta'));
    }
  };

  const reprovarConta = (id: string) => {
    setReprovacaoContexto({ tipo: 'conta', contaId: id });
  };

  const processarLote = async (acao: 'aprovar' | 'reprovar') => {
    const ids = pendenciasFiltradas
      .filter((conta) => contasSelecionadas.has(conta.id))
      .map((conta) => conta.id);

    if (ids.length === 0) {
      toast.error('Selecione ao menos uma conta');
      return;
    }

    if (acao === 'reprovar') {
      setReprovacaoContexto({ tipo: 'lote', contaIds: ids });
      return;
    }

    try {
      setProcessandoLote(true);
      const resultado = await contasPagarService.aprovarLote({
        contaIds: ids,
        acao,
      });

      if (resultado.falha > 0) {
        toast.error(`${resultado.sucesso} conta(s) processadas e ${resultado.falha} com erro`);
      } else {
        toast.success(`${resultado.sucesso} conta(s) processadas com sucesso`);
      }

      await carregarPendencias();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Nao foi possivel processar lote'));
    } finally {
      setProcessandoLote(false);
    }
  };

  const fecharModalReprovacao = () => {
    if (processandoReprovacao) return;
    setReprovacaoContexto(null);
  };

  const confirmarReprovacao = async (justificativa: string) => {
    if (!reprovacaoContexto) return;

    try {
      setProcessandoReprovacao(true);

      if (reprovacaoContexto.tipo === 'conta') {
        await contasPagarService.reprovar(reprovacaoContexto.contaId, { justificativa });
        toast.success('Conta reprovada com sucesso');
      } else {
        setProcessandoLote(true);
        const resultado = await contasPagarService.aprovarLote({
          contaIds: reprovacaoContexto.contaIds,
          acao: 'reprovar',
          justificativa,
        });
        if (resultado.falha > 0) {
          toast.error(`${resultado.sucesso} conta(s) processadas e ${resultado.falha} com erro`);
        } else {
          toast.success(`${resultado.sucesso} conta(s) processadas com sucesso`);
        }
      }

      setReprovacaoContexto(null);
      await carregarPendencias();
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Nao foi possivel reprovar conta(s)');
      toast.error(mensagem);
      throw new Error(mensagem);
    } finally {
      setProcessandoReprovacao(false);
      setProcessandoLote(false);
    }
  };

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title="Aprovacoes Financeiras"
          description={
            carregando
              ? 'Carregando pendencias de aprovacao...'
              : `Gerencie ${total} conta(s) aguardando aprovacao financeira.`
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void carregarPendencias()}
                className={btnSecondary}
                disabled={carregando || processandoLote || processandoReprovacao}
              >
                <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button
                type="button"
                onClick={() => void processarLote('aprovar')}
                className={btnSuccess}
                disabled={processandoLote || processandoReprovacao}
              >
                <Check className="h-4 w-4" />
                Aprovar lote
              </button>
              <button
                type="button"
                onClick={() => void processarLote('reprovar')}
                className={btnDanger}
                disabled={processandoLote || processandoReprovacao}
              >
                <X className="h-4 w-4" />
                Reprovar lote
              </button>
            </div>
          }
        />

        {!carregando && !erro ? (
          <InlineStats
            stats={[
              { label: 'Pendentes', value: String(total), tone: 'warning' },
              { label: 'Selecionadas', value: String(selecionadasVisiveis), tone: 'accent' },
              { label: 'Valor total', value: moneyFmt.format(valorTotal), tone: 'neutral' },
            ]}
          />
        ) : null}
      </SectionCard>

      <FiltersBar className="p-4">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full sm:min-w-[280px] sm:flex-1">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Buscar pendencias</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AAEB8]" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void buscarPendencias();
                  }
                }}
                placeholder="Numero, fornecedor, descricao ou documento..."
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white pl-10 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              />
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button type="button" onClick={() => void buscarPendencias()} className={btnPrimary}>
              <Search className="h-4 w-4" />
              Buscar
            </button>
            <button
              type="button"
              onClick={() => void limparFiltros()}
              className={btnSecondary}
              disabled={!hasFilters}
            >
              <Filter className="h-4 w-4" />
              Limpar
            </button>
          </div>
        </div>
      </FiltersBar>

      {carregando ? <LoadingSkeleton lines={8} /> : null}

      {!carregando && erro ? (
        <EmptyState
          icon={<AlertCircle className="h-5 w-5" />}
          title="Erro ao carregar fila de aprovacoes"
          description={erro}
          action={
            <button type="button" onClick={() => void carregarPendencias()} className={btnPrimary}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          }
        />
      ) : null}

      {!carregando && !erro && pendencias.length === 0 ? (
        <EmptyState
          icon={<Check className="h-5 w-5" />}
          title="Nenhuma pendencia de aprovacao"
          description="Quando houver contas aguardando aprovacao financeira, elas aparecerao aqui."
        />
      ) : null}

      {!carregando && !erro && pendenciasFiltradas.length > 0 ? (
        <DataTableCard>
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full min-w-[980px] border-collapse">
              <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#E1EAEE]">
                <tr>
                  <th className="w-12 px-4 py-3 text-left">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelecionarTodasVisiveis}
                      className="h-4 w-4 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                      aria-label="Selecionar todas as pendencias"
                    />
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                    Numero
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                    Fornecedor
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                    Descricao
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                    Categoria
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                    Prioridade
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                    Vencimento
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                    Valor
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {pendenciasFiltradas.map((conta) => (
                  <tr key={conta.id} className="border-t border-[#EDF3F5] hover:bg-[#FAFCFD]">
                    <td className="px-4 py-4 align-top">
                      <input
                        type="checkbox"
                        checked={contasSelecionadas.has(conta.id)}
                        onChange={() => toggleSelecionarConta(conta.id)}
                        className="h-4 w-4 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                        aria-label={`Selecionar conta ${conta.numero}`}
                      />
                    </td>
                    <td className="px-5 py-4 align-top text-sm font-semibold text-[#173A4D]">
                      {conta.numero}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="text-sm font-medium text-[#173A4D]">{conta.fornecedor.nome}</div>
                      <div className="mt-0.5 text-xs text-[#64808E]">{conta.fornecedor.cnpjCpf}</div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="max-w-[240px] truncate text-sm text-[#173A4D]" title={conta.descricao}>
                        {conta.descricao}
                      </div>
                      {conta.numeroDocumento ? (
                        <div className="mt-0.5 text-xs text-[#64808E]">Doc: {conta.numeroDocumento}</div>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 align-top text-sm text-[#173A4D]">
                      {CATEGORIA_LABELS[conta.categoria as CategoriaContaPagar] || conta.categoria}
                    </td>
                    <td className="px-5 py-4 align-top">{getPrioridadeBadge(conta.prioridade)}</td>
                    <td className="px-5 py-4 align-top text-sm text-[#173A4D]">
                      {formatDate(conta.dataVencimento)}
                    </td>
                    <td className="px-5 py-4 align-top text-sm font-semibold text-[#173A4D]">
                      {moneyFmt.format(conta.valorTotal || 0)}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => void aprovarConta(conta.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#137A42] hover:bg-[#F1FBF5]"
                          title="Aprovar conta"
                          disabled={processandoLote || processandoReprovacao}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void reprovarConta(conta.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#B4233A] hover:bg-[#FFF2F4]"
                          title="Reprovar conta"
                          disabled={processandoLote || processandoReprovacao}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataTableCard>
      ) : null}

      {!carregando && !erro && pendencias.length > 0 && pendenciasFiltradas.length === 0 ? (
        <EmptyState
          icon={<Search className="h-5 w-5" />}
          title="Nenhuma pendencia encontrada"
          description="Ajuste os filtros para localizar as contas desejadas."
          action={
            <button type="button" onClick={() => void limparFiltros()} className={btnSecondary}>
              <Filter className="h-4 w-4" />
              Limpar filtros
            </button>
          }
        />
      ) : null}

      <ModalJustificativa
        isOpen={Boolean(reprovacaoContexto)}
        title={reprovacaoContexto?.tipo === 'lote' ? 'Reprovar contas em lote' : 'Reprovar conta'}
        description={
          reprovacaoContexto?.tipo === 'lote'
            ? `Informe a justificativa para reprovar ${reprovacaoContexto.contaIds.length} conta(s).`
            : 'Informe a justificativa para reprovar esta conta.'
        }
        placeholder="Explique o motivo da reprovacao."
        confirmLabel="Confirmar reprovacao"
        minLength={3}
        loading={processandoReprovacao}
        onClose={fecharModalReprovacao}
        onConfirm={confirmarReprovacao}
      />
    </div>
  );
}
