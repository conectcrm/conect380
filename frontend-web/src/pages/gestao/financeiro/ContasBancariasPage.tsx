import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Building2,
  CreditCard,
  Edit3,
  Filter,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import {
  DataTableCard,
  EmptyState,
  FiltersBar,
  InlineStats,
  LoadingSkeleton,
  PageHeader,
  SectionCard,
} from '../../../components/layout-v2';
import { useGlobalConfirmation } from '../../../contexts/GlobalConfirmationContext';
import ModalContaBancaria from '../../../features/financeiro/components/ModalContaBancaria';
import contaBancariaService, {
  NovaContaBancaria,
} from '../../../services/contaBancariaService';
import { ContaBancaria } from '../../../types/financeiro';

type FiltroStatus = 'todos' | 'ativo' | 'inativo';

const btnPrimary =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition hover:bg-[#117C7E] disabled:opacity-60 disabled:cursor-not-allowed';
const btnSecondary =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:opacity-60 disabled:cursor-not-allowed';
const btnDanger =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#C03449] px-3 text-sm font-medium text-white transition hover:bg-[#A32A3D] disabled:opacity-60 disabled:cursor-not-allowed';
const btnWarning =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#B56E16] px-3 text-sm font-medium text-white transition hover:bg-[#955A10] disabled:opacity-60 disabled:cursor-not-allowed';
const btnSuccess =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#14804A] px-3 text-sm font-medium text-white transition hover:bg-[#0E6B3E] disabled:opacity-60 disabled:cursor-not-allowed';

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
      const firstMessage = message.find((item) => typeof item === 'string' && item.trim());
      if (firstMessage) {
        return firstMessage.trim();
      }
    }
  }

  return fallback;
};

const statusBadge = (ativo: boolean) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
      ativo
        ? 'border-[#BEE6CF] bg-[#F1FBF5] text-[#137A42]'
        : 'border-[#F4C7CF] bg-[#FFF4F6] text-[#B4233A]'
    }`}
  >
    {ativo ? 'Ativa' : 'Inativa'}
  </span>
);

export default function ContasBancariasPage() {
  const { confirm } = useGlobalConfirmation();
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [contaEdicao, setContaEdicao] = useState<ContaBancaria | null>(null);
  const [salvandoConta, setSalvandoConta] = useState(false);

  useEffect(() => {
    void carregarContasBancarias();
  }, [filtroStatus]);

  const carregarContasBancarias = async (searchTerm?: string) => {
    try {
      setCarregando(true);
      setErro(null);
      const dados = await contaBancariaService.listar({
        busca: (searchTerm ?? busca).trim() || undefined,
        ativo: filtroStatus === 'todos' ? undefined : filtroStatus === 'ativo',
      });
      setContas(Array.isArray(dados) ? dados : []);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Erro ao carregar contas bancarias');
      setErro(mensagem);
      toast.error(mensagem);
      setContas([]);
    } finally {
      setCarregando(false);
    }
  };

  const buscarContas = async () => {
    await carregarContasBancarias(busca);
  };

  const limparFiltros = async () => {
    setBusca('');
    setFiltroStatus('todos');
    await carregarContasBancarias('');
  };

  const abrirModalCriacao = () => {
    setContaEdicao(null);
    setModalAberto(true);
  };

  const abrirModalEdicao = (conta: ContaBancaria) => {
    setContaEdicao(conta);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setContaEdicao(null);
  };

  const salvarConta = async (dados: NovaContaBancaria) => {
    try {
      setSalvandoConta(true);
      if (contaEdicao) {
        await contaBancariaService.atualizar(contaEdicao.id, dados);
        toast.success('Conta bancaria atualizada com sucesso');
      } else {
        await contaBancariaService.criar(dados);
        toast.success('Conta bancaria cadastrada com sucesso');
      }
      fecharModal();
      await carregarContasBancarias();
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Nao foi possivel salvar a conta bancaria');
      toast.error(mensagem);
      throw error;
    } finally {
      setSalvandoConta(false);
    }
  };

  const alterarStatusConta = async (conta: ContaBancaria) => {
    try {
      if (conta.ativo) {
        const confirmado = await confirm(
          `Desativar a conta "${conta.nome}"? Ela nao podera ser usada em novos pagamentos.`,
        );
        if (!confirmado) return;
        await contaBancariaService.desativar(conta.id);
        toast.success('Conta bancaria desativada');
      } else {
        await contaBancariaService.atualizar(conta.id, { ativo: true });
        toast.success('Conta bancaria ativada');
      }
      await carregarContasBancarias();
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Nao foi possivel alterar status da conta');
      toast.error(mensagem);
    }
  };

  const excluirConta = async (conta: ContaBancaria) => {
    const confirmado = await confirm(
      `Excluir a conta "${conta.nome}"? Esta acao nao pode ser desfeita.`,
    );
    if (!confirmado) return;

    try {
      await contaBancariaService.excluir(conta.id);
      toast.success('Conta bancaria excluida');
      await carregarContasBancarias();
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Nao foi possivel excluir a conta bancaria');
      toast.error(mensagem);
    }
  };

  const contasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return contas;
    return contas.filter((conta) => {
      const label = `${conta.nome} ${conta.banco} ${conta.agencia} ${conta.conta} ${conta.chavePix || ''}`;
      return label.toLowerCase().includes(termo);
    });
  }, [busca, contas]);

  const total = contas.length;
  const ativas = contas.filter((conta) => conta.ativo).length;
  const inativas = total - ativas;
  const saldoTotal = contas.reduce((acc, conta) => acc + Number(conta.saldo || 0), 0);
  const hasFilters = busca.trim().length > 0 || filtroStatus !== 'todos';

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title="Contas Bancarias"
          description={
            carregando
              ? 'Carregando contas bancarias...'
              : `Gerencie ${total} conta(s) bancaria(s) da empresa.`
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void carregarContasBancarias()}
                className={btnSecondary}
                disabled={carregando}
              >
                <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button type="button" onClick={abrirModalCriacao} className={btnPrimary}>
                <Plus className="h-4 w-4" />
                Nova Conta
              </button>
            </div>
          }
        />

        {!carregando && !erro ? (
          <InlineStats
            stats={[
              { label: 'Total', value: String(total), tone: 'neutral' },
              { label: 'Ativas', value: String(ativas), tone: 'accent' },
              { label: 'Inativas', value: String(inativas), tone: 'warning' },
              { label: 'Saldo total', value: moneyFmt.format(saldoTotal), tone: 'neutral' },
            ]}
          />
        ) : null}
      </SectionCard>

      <FiltersBar className="p-4">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full sm:min-w-[280px] sm:flex-1">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Buscar contas</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AAEB8]" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void buscarContas();
                  }
                }}
                placeholder="Nome, banco, agencia, conta ou chave PIX..."
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white pl-10 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              />
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as FiltroStatus)}
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 sm:w-[170px]"
            >
              <option value="todos">Todos</option>
              <option value="ativo">Ativas</option>
              <option value="inativo">Inativas</option>
            </select>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button type="button" onClick={() => void buscarContas()} className={btnPrimary}>
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
          title="Erro ao carregar contas bancarias"
          description={erro}
          action={
            <button type="button" onClick={() => void carregarContasBancarias()} className={btnPrimary}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          }
        />
      ) : null}

      {!carregando && !erro && contas.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title={hasFilters ? 'Nenhuma conta encontrada' : 'Nenhuma conta bancaria cadastrada'}
          description={
            hasFilters
              ? 'Ajuste os filtros ou faca uma nova busca.'
              : 'Cadastre a primeira conta bancaria para habilitar o fluxo completo de pagamentos.'
          }
          action={
            hasFilters ? (
              <button type="button" onClick={() => void limparFiltros()} className={btnSecondary}>
                <Filter className="h-4 w-4" />
                Limpar filtros
              </button>
            ) : (
              <button type="button" onClick={abrirModalCriacao} className={btnPrimary}>
                <Plus className="h-4 w-4" />
                Cadastrar primeira conta
              </button>
            )
          }
        />
      ) : null}

      {!carregando && !erro && contasFiltradas.length > 0 ? (
        <DataTableCard>
          <div className="flex flex-col gap-3 border-b border-[#E1EAEE] bg-[#F8FBFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[#516F7D]">
              <span>{contasFiltradas.length} registro(s)</span>
              {hasFilters ? (
                <span className="rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-2 py-0.5 text-xs font-medium text-[#0F7B7D]">
                  filtros ativos
                </span>
              ) : null}
            </div>
          </div>

          <div className="p-4 lg:hidden">
            <div className="grid grid-cols-1 gap-3">
              {contasFiltradas.map((conta) => (
                <article
                  key={conta.id}
                  className="rounded-xl border border-[#DFE9ED] bg-white p-4 shadow-[0_10px_22px_-20px_rgba(15,57,74,0.4)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#173A4D]">{conta.nome}</p>
                      <p className="mt-1 text-xs text-[#64808E]">
                        {conta.banco} • Ag {conta.agencia} • Cc {conta.conta}
                      </p>
                    </div>
                    {statusBadge(conta.ativo)}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#173A4D]">{moneyFmt.format(conta.saldo || 0)}</p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => abrirModalEdicao(conta)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#159A9C] hover:bg-[#ECF7F3]"
                        title="Editar"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void alterarStatusConta(conta)}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                          conta.ativo
                            ? 'text-[#B56E16] hover:bg-[#FFF7EA]'
                            : 'text-[#137A42] hover:bg-[#F1FBF5]'
                        }`}
                        title={conta.ativo ? 'Desativar conta' : 'Ativar conta'}
                      >
                        {conta.ativo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => void excluirConta(conta)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#B4233A] hover:bg-[#FFF2F4]"
                        title="Excluir conta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full min-w-[980px] border-collapse">
                <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#E1EAEE]">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Conta
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Banco / Dados
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Tipo
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Saldo
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Atualizado
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {contasFiltradas.map((conta) => (
                    <tr key={conta.id} className="border-t border-[#EDF3F5] hover:bg-[#FAFCFD]">
                      <td className="px-5 py-4 align-top">
                        <div className="text-sm font-semibold text-[#173A4D]">{conta.nome}</div>
                        {conta.chavePix ? (
                          <div className="mt-0.5 max-w-[240px] truncate text-xs text-[#64808E]">
                            PIX: {conta.chavePix}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 align-top text-sm text-[#173A4D]">
                        <div>{conta.banco}</div>
                        <div className="mt-0.5 text-xs text-[#64808E]">
                          Ag {conta.agencia} • Cc {conta.conta}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top text-sm text-[#173A4D]">
                        {conta.tipoConta === 'corrente' ? 'Corrente' : 'Poupanca'}
                      </td>
                      <td className="px-5 py-4 align-top text-sm font-semibold text-[#173A4D]">
                        {moneyFmt.format(conta.saldo || 0)}
                      </td>
                      <td className="px-5 py-4 align-top">{statusBadge(conta.ativo)}</td>
                      <td className="px-5 py-4 align-top text-sm text-[#476776]">
                        {formatDate(conta.atualizadoEm || conta.criadoEm)}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => abrirModalEdicao(conta)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#159A9C] hover:bg-[#ECF7F3]"
                            title="Editar conta"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void alterarStatusConta(conta)}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                              conta.ativo
                                ? 'text-[#B56E16] hover:bg-[#FFF7EA]'
                                : 'text-[#137A42] hover:bg-[#F1FBF5]'
                            }`}
                            title={conta.ativo ? 'Desativar conta' : 'Ativar conta'}
                          >
                            {conta.ativo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => void excluirConta(conta)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#B4233A] hover:bg-[#FFF2F4]"
                            title="Excluir conta"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DataTableCard>
      ) : null}

      {modalAberto ? (
        <ModalContaBancaria
          isOpen={modalAberto}
          conta={contaEdicao}
          loading={salvandoConta}
          onClose={fecharModal}
          onSave={salvarConta}
        />
      ) : null}

      {!carregando && !erro && contas.length > 0 && contasFiltradas.length === 0 ? (
        <EmptyState
          icon={<Search className="h-5 w-5" />}
          title="Nenhuma conta encontrada"
          description="Ajuste os filtros ou limpe a busca para visualizar outras contas."
          action={
            <button type="button" onClick={() => void limparFiltros()} className={btnSecondary}>
              <Filter className="h-4 w-4" />
              Limpar filtros
            </button>
          }
        />
      ) : null}
    </div>
  );
}
