import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Building2,
  Edit3,
  Filter,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  Trash2,
  X,
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
import centroCustoService, {
  AtualizarCentroCusto,
  NovoCentroCusto,
} from '../../../services/centroCustoService';
import { CentroCusto } from '../../../types/financeiro';

type FiltroStatus = 'todos' | 'ativo' | 'inativo';

const btnPrimary =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition hover:bg-[#117C7E] disabled:cursor-not-allowed disabled:opacity-60';
const btnSecondary =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60';

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
    {ativo ? 'Ativo' : 'Inativo'}
  </span>
);

type ModalCentroCustoProps = {
  centroCusto: CentroCusto | null;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: NovoCentroCusto | AtualizarCentroCusto) => Promise<void>;
};

const ModalCentroCusto: React.FC<ModalCentroCustoProps> = ({
  centroCusto,
  saving,
  onClose,
  onSave,
}) => {
  const [codigo, setCodigo] = useState(centroCusto?.codigo || '');
  const [nome, setNome] = useState(centroCusto?.nome || '');
  const [descricao, setDescricao] = useState(centroCusto?.descricao || '');
  const [ativo, setAtivo] = useState<boolean>(centroCusto?.ativo ?? true);
  const [errors, setErrors] = useState<{ codigo?: string; nome?: string }>({});

  useEffect(() => {
    setCodigo(centroCusto?.codigo || '');
    setNome(centroCusto?.nome || '');
    setDescricao(centroCusto?.descricao || '');
    setAtivo(centroCusto?.ativo ?? true);
    setErrors({});
  }, [centroCusto]);

  const handleSubmit = async () => {
    const nextErrors: { codigo?: string; nome?: string } = {};
    const codigoNormalizado = codigo.trim().toUpperCase();
    const nomeNormalizado = nome.trim();

    if (!codigoNormalizado) {
      nextErrors.codigo = 'Codigo obrigatorio';
    }
    if (!nomeNormalizado) {
      nextErrors.nome = 'Nome obrigatorio';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSave({
      codigo: codigoNormalizado,
      nome: nomeNormalizado,
      descricao: descricao.trim() || undefined,
      ativo,
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-[#DCE8EC] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E1EAEE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#173A4D]">
            {centroCusto ? 'Editar centro de custo' : 'Novo centro de custo'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5E7A88] hover:bg-[#F2F7F8]"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#244455]">Codigo *</label>
            <input
              type="text"
              value={codigo}
              onChange={(event) => setCodigo(event.target.value)}
              maxLength={30}
              placeholder="Ex: ADM, COMERCIAL, TI"
              className={`h-10 w-full rounded-xl border bg-white px-3 text-sm text-[#244455] outline-none transition focus:ring-2 ${
                errors.codigo
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                  : 'border-[#D4E2E7] focus:border-[#1A9E87]/45 focus:ring-[#1A9E87]/15'
              }`}
            />
            {errors.codigo ? <p className="mt-1 text-xs text-red-600">{errors.codigo}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#244455]">Nome *</label>
            <input
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              maxLength={120}
              placeholder="Ex: Administrativo"
              className={`h-10 w-full rounded-xl border bg-white px-3 text-sm text-[#244455] outline-none transition focus:ring-2 ${
                errors.nome
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                  : 'border-[#D4E2E7] focus:border-[#1A9E87]/45 focus:ring-[#1A9E87]/15'
              }`}
            />
            {errors.nome ? <p className="mt-1 text-xs text-red-600">{errors.nome}</p> : null}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[#244455]">Descricao</label>
            <textarea
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Opcional. Informe observacoes sobre uso deste centro."
              className="w-full rounded-xl border border-[#D4E2E7] bg-white px-3 py-2 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-[#244455]">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(event) => setAtivo(event.target.checked)}
                className="h-4 w-4 rounded border-[#D4E2E7] text-[#159A9C] focus:ring-[#1A9E87]/20"
              />
              Centro ativo
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#E1EAEE] px-6 py-4">
          <button type="button" onClick={onClose} className={btnSecondary} disabled={saving}>
            Cancelar
          </button>
          <button type="button" onClick={() => void handleSubmit()} className={btnPrimary} disabled={saving}>
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? 'Salvando...' : centroCusto ? 'Salvar alteracoes' : 'Criar centro'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CentrosCustoPage() {
  const { confirm } = useGlobalConfirmation();
  const [centros, setCentros] = useState<CentroCusto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [centroEdicao, setCentroEdicao] = useState<CentroCusto | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    void carregarCentros();
  }, [filtroStatus]);

  const carregarCentros = async (searchTerm?: string) => {
    try {
      setCarregando(true);
      setErro(null);
      const dados = await centroCustoService.listar({
        busca: (searchTerm ?? busca).trim() || undefined,
        ativo: filtroStatus === 'todos' ? undefined : filtroStatus === 'ativo',
      });
      setCentros(Array.isArray(dados) ? dados : []);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Erro ao carregar centros de custo');
      setErro(mensagem);
      toast.error(mensagem);
      setCentros([]);
    } finally {
      setCarregando(false);
    }
  };

  const buscarCentros = async () => {
    await carregarCentros(busca);
  };

  const limparFiltros = async () => {
    setBusca('');
    setFiltroStatus('todos');
    await carregarCentros('');
  };

  const abrirModalCriacao = () => {
    setCentroEdicao(null);
    setModalAberto(true);
  };

  const abrirModalEdicao = (centro: CentroCusto) => {
    setCentroEdicao(centro);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setCentroEdicao(null);
  };

  const salvarCentro = async (payload: NovoCentroCusto | AtualizarCentroCusto) => {
    try {
      setSalvando(true);
      if (centroEdicao) {
        await centroCustoService.atualizar(centroEdicao.id, payload);
        toast.success('Centro de custo atualizado com sucesso');
      } else {
        await centroCustoService.criar(payload as NovoCentroCusto);
        toast.success('Centro de custo cadastrado com sucesso');
      }
      fecharModal();
      await carregarCentros();
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Nao foi possivel salvar o centro de custo');
      toast.error(mensagem);
      throw error;
    } finally {
      setSalvando(false);
    }
  };

  const alterarStatus = async (centro: CentroCusto) => {
    try {
      if (centro.ativo) {
        const confirmado = await confirm(
          `Desativar o centro "${centro.codigo} - ${centro.nome}"? Ele nao podera ser usado em novos lancamentos.`,
        );
        if (!confirmado) return;
        await centroCustoService.desativar(centro.id);
        toast.success('Centro de custo desativado');
      } else {
        await centroCustoService.atualizar(centro.id, { ativo: true });
        toast.success('Centro de custo ativado');
      }
      await carregarCentros();
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Nao foi possivel alterar status do centro');
      toast.error(mensagem);
    }
  };

  const excluirCentro = async (centro: CentroCusto) => {
    const confirmado = await confirm(
      `Excluir o centro "${centro.codigo} - ${centro.nome}"? Esta acao nao pode ser desfeita.`,
    );
    if (!confirmado) return;

    try {
      await centroCustoService.excluir(centro.id);
      toast.success('Centro de custo excluido');
      await carregarCentros();
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Nao foi possivel excluir o centro de custo');
      toast.error(mensagem);
    }
  };

  const centrosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return centros;
    return centros.filter((centro) =>
      `${centro.codigo} ${centro.nome} ${centro.descricao || ''}`.toLowerCase().includes(termo),
    );
  }, [busca, centros]);

  const total = centros.length;
  const ativos = centros.filter((item) => item.ativo).length;
  const inativos = total - ativos;
  const hasFilters = busca.trim().length > 0 || filtroStatus !== 'todos';

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title="Centros de Custo"
          description={
            carregando
              ? 'Carregando centros de custo...'
              : `Gerencie ${total} centro(s) de custo da empresa.`
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void carregarCentros()}
                className={btnSecondary}
                disabled={carregando}
              >
                <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button type="button" onClick={abrirModalCriacao} className={btnPrimary}>
                <Plus className="h-4 w-4" />
                Novo Centro
              </button>
            </div>
          }
        />

        {!carregando && !erro ? (
          <InlineStats
            stats={[
              { label: 'Total', value: String(total), tone: 'neutral' },
              { label: 'Ativos', value: String(ativos), tone: 'accent' },
              { label: 'Inativos', value: String(inativos), tone: 'warning' },
            ]}
          />
        ) : null}
      </SectionCard>

      <FiltersBar className="p-4">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full sm:min-w-[280px] sm:flex-1">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Buscar centro</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AAEB8]" />
              <input
                type="text"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void buscarCentros();
                  }
                }}
                placeholder="Codigo, nome ou descricao..."
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white pl-10 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              />
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Status</label>
            <select
              value={filtroStatus}
              onChange={(event) => setFiltroStatus(event.target.value as FiltroStatus)}
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 sm:w-[170px]"
            >
              <option value="todos">Todos</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button type="button" onClick={() => void buscarCentros()} className={btnPrimary}>
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
          title="Erro ao carregar centros de custo"
          description={erro}
          action={
            <button type="button" onClick={() => void carregarCentros()} className={btnPrimary}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          }
        />
      ) : null}

      {!carregando && !erro && centros.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title={
            hasFilters ? 'Nenhum centro de custo encontrado' : 'Nenhum centro de custo cadastrado'
          }
          description={
            hasFilters
              ? 'Ajuste os filtros ou faca uma nova busca.'
              : 'Cadastre centros de custo para organizar melhor os lancamentos financeiros.'
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
                Cadastrar primeiro centro
              </button>
            )
          }
        />
      ) : null}

      {!carregando && !erro && centrosFiltrados.length > 0 ? (
        <DataTableCard>
          <div className="flex flex-col gap-3 border-b border-[#E1EAEE] bg-[#F8FBFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[#516F7D]">
              <span>{centrosFiltrados.length} registro(s)</span>
              {hasFilters ? (
                <span className="rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-2 py-0.5 text-xs font-medium text-[#0F7B7D]">
                  filtros ativos
                </span>
              ) : null}
            </div>
          </div>

          <div className="p-4 lg:hidden">
            <div className="grid grid-cols-1 gap-3">
              {centrosFiltrados.map((centro) => (
                <article
                  key={centro.id}
                  className="rounded-xl border border-[#DFE9ED] bg-white p-4 shadow-[0_10px_22px_-20px_rgba(15,57,74,0.4)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#173A4D]">
                        {centro.codigo} - {centro.nome}
                      </p>
                      {centro.descricao ? (
                        <p className="mt-1 text-xs text-[#64808E]">{centro.descricao}</p>
                      ) : null}
                    </div>
                    {statusBadge(centro.ativo)}
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => abrirModalEdicao(centro)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#159A9C] hover:bg-[#ECF7F3]"
                      title="Editar"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void alterarStatus(centro)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                        centro.ativo
                          ? 'text-[#B56E16] hover:bg-[#FFF7EA]'
                          : 'text-[#137A42] hover:bg-[#F1FBF5]'
                      }`}
                      title={centro.ativo ? 'Desativar' : 'Ativar'}
                    >
                      {centro.ativo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => void excluirCentro(centro)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#B4233A] hover:bg-[#FFF2F4]"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full divide-y divide-[#E1EAEE] text-sm">
              <thead className="bg-[#F8FBFC]">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-[#4A6775]">Codigo</th>
                  <th className="px-5 py-3 text-left font-semibold text-[#4A6775]">Nome</th>
                  <th className="px-5 py-3 text-left font-semibold text-[#4A6775]">Descricao</th>
                  <th className="px-5 py-3 text-left font-semibold text-[#4A6775]">Status</th>
                  <th className="px-5 py-3 text-right font-semibold text-[#4A6775]">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF2F4] bg-white">
                {centrosFiltrados.map((centro) => (
                  <tr key={centro.id} className="hover:bg-[#FAFCFD]">
                    <td className="px-5 py-4 font-semibold text-[#173A4D]">{centro.codigo}</td>
                    <td className="px-5 py-4 text-[#244455]">{centro.nome}</td>
                    <td className="px-5 py-4 text-[#4F6D7B]">{centro.descricao || '-'}</td>
                    <td className="px-5 py-4">{statusBadge(centro.ativo)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => abrirModalEdicao(centro)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#159A9C] hover:bg-[#ECF7F3]"
                          title="Editar centro"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void alterarStatus(centro)}
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                            centro.ativo
                              ? 'text-[#B56E16] hover:bg-[#FFF7EA]'
                              : 'text-[#137A42] hover:bg-[#F1FBF5]'
                          }`}
                          title={centro.ativo ? 'Desativar centro' : 'Ativar centro'}
                        >
                          {centro.ativo ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => void excluirCentro(centro)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#B4233A] hover:bg-[#FFF2F4]"
                          title="Excluir centro"
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
        </DataTableCard>
      ) : null}

      {modalAberto ? (
        <ModalCentroCusto
          centroCusto={centroEdicao}
          saving={salvando}
          onClose={fecharModal}
          onSave={salvarCentro}
        />
      ) : null}
    </div>
  );
}
