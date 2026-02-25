import React, { useEffect, useMemo, useState } from 'react';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  DollarSign,
  User,
  MapPin,
  Building2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { metaService, Meta, MetaTipo } from '../../services/metaService';
import { usuariosService } from '../../services/usuariosService';
import { UserRole } from '../../types/usuarios';
import { api } from '../../services/api';
import { useGlobalConfirmation } from '../../contexts/GlobalConfirmationContext';
import { toastService } from '../../services/toastService';
import {
  DataTableCard,
  EmptyState,
  FiltersBar,
  InlineStats,
  LoadingSkeleton,
  PageHeader,
  SectionCard,
} from '../../components/layout-v2';

interface FormularioMeta {
  tipo: MetaTipo;
  periodo: string;
  vendedorId?: string;
  regiao?: string;
  valor: string;
  descricao: string;
}

interface ErrorResponseShape {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
}

const getApiErrorMessage = (err: unknown): string | undefined => {
  if (typeof err !== 'object' || err === null) {
    return undefined;
  }

  const message = (err as ErrorResponseShape).response?.data?.message;
  return Array.isArray(message) ? message.join('. ') : message;
};

const DEFAULT_PERIOD = () => {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = (agora.getMonth() + 1).toString().padStart(2, '0');
  return `${ano}-${mes}`;
};

const isPeriodoValido = (tipo: MetaTipo, periodo: string): boolean => {
  const trimmed = periodo.trim();
  if (!trimmed) return false;
  if (trimmed.length > 20) return false;

  if (tipo === 'mensal') {
    return /^\d{4}-\d{2}$/.test(trimmed);
  }

  if (tipo === 'trimestral') {
    return /^\d{4}-Q[1-4]$/.test(trimmed);
  }

  return /^\d{4}$/.test(trimmed);
};

const MetasConfiguracao: React.FC = () => {
  const { confirm } = useGlobalConfirmation();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingMetaId, setUpdatingMetaId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'ativas' | 'inativas'>('todas');
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('todos');
  const [vendedores, setVendedores] = useState<Array<{ id: string; nome?: string }>>([]);
  const [regioes, setRegioes] = useState<string[]>([]);
  const [loadingVendedores, setLoadingVendedores] = useState(false);
  const [loadingRegioes, setLoadingRegioes] = useState(false);

  const [formulario, setFormulario] = useState<FormularioMeta>({
    tipo: 'mensal',
    periodo: DEFAULT_PERIOD(),
    vendedorId: 'todos',
    regiao: 'todas',
    valor: '',
    descricao: '',
  });

  useEffect(() => {
    carregarMetas();
    carregarVendedores();
    carregarRegioes();
  }, []);

  const carregarMetas = async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await metaService.listar();
      const normalizados = Array.isArray(dados)
        ? dados.map((item) => ({ ...item, valor: Number(item.valor) || 0 }))
        : [];
      setMetas(normalizados);
    } catch (err: unknown) {
      console.error('Erro ao carregar metas:', err);
      const normalizedMessage = getApiErrorMessage(err);
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao carregar metas');
      setMetas([]);
    } finally {
      setLoading(false);
    }
  };

  const carregarVendedores = async () => {
    try {
      setLoadingVendedores(true);
      setError(null);

      const { usuarios } = await usuariosService.listarUsuarios({
        role: UserRole.VENDEDOR,
        ativo: true,
        limite: 1000,
      });

      const normalizados = usuarios.map((usuario) => ({
        id: String(usuario.id),
        nome: usuario.nome,
      }));

      if (normalizados.length === 0) {
        const fallbackIds = Array.from(
          new Set(
            metas
              .map((m) => m.vendedorId)
              .filter((v) => v !== undefined)
              .map(String),
          ),
        );
        setVendedores(fallbackIds.map((id) => ({ id })));
        return;
      }

      setVendedores(normalizados);
    } catch (err: unknown) {
      console.error('Erro ao carregar vendedores:', err);
      const normalizedMessage = getApiErrorMessage(err);
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao carregar vendedores');
    } finally {
      setLoadingVendedores(false);
    }
  };

  const carregarRegioes = async () => {
    try {
      setLoadingRegioes(true);
      setError(null);

      const response = await api.get('/dashboard/resumo', {
        params: { periodo: 'mensal' },
      });

      const regioesDisponiveis = response?.data?.metadata?.regioesDisponiveis;
      const normalizadas = Array.isArray(regioesDisponiveis)
        ? regioesDisponiveis.filter((regiao) => regiao && regiao.toLowerCase() !== 'todas')
        : [];

      if (normalizadas.length === 0) {
        const fallback = Array.from(
          new Set(metas.map((m) => m.regiao).filter(Boolean) as string[]),
        );
        setRegioes(fallback);
        return;
      }

      setRegioes(normalizadas);
    } catch (err: unknown) {
      console.error('Erro ao carregar regiões:', err);
      const normalizedMessage = getApiErrorMessage(err);
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao carregar regiões');
    } finally {
      setLoadingRegioes(false);
    }
  };

  const resetForm = () => {
    setFormulario({
      tipo: 'mensal',
      periodo: DEFAULT_PERIOD(),
      vendedorId: 'todos',
      regiao: 'todas',
      valor: '',
      descricao: '',
    });
    setShowForm(false);
    setEditingMeta(null);
  };

  const formatarValor = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const formatarPeriodo = (tipo: MetaTipo, periodo: string) => {
    if (tipo === 'mensal') {
      const [ano, mes] = periodo.split('-');
      const meses = [
        'Jan',
        'Fev',
        'Mar',
        'Abr',
        'Mai',
        'Jun',
        'Jul',
        'Ago',
        'Set',
        'Out',
        'Nov',
        'Dez',
      ];
      return `${meses[Number(mes) - 1]} ${ano}`;
    }
    if (tipo === 'trimestral') return periodo.replace('Q', 'T');
    return periodo;
  };

  const metasFiltradas = useMemo(() => {
    return metas.filter((meta) => {
      const termo = busca.toLowerCase();
      const statusOk =
        filtroStatus === 'todas'
          ? true
          : filtroStatus === 'ativas'
            ? Boolean(meta.ativa)
            : !meta.ativa;
      const periodoOk = filtroPeriodo === 'todos' ? true : meta.periodo === filtroPeriodo;

      if (!statusOk || !periodoOk) return false;

      return (
        meta.descricao?.toLowerCase().includes(termo) ||
        meta.regiao?.toLowerCase().includes(termo) ||
        meta.periodo.toLowerCase().includes(termo)
      );
    });
  }, [busca, filtroPeriodo, filtroStatus, metas]);

  const periodosDisponiveis = useMemo(() => {
    const mapa = new Map<string, MetaTipo>();

    metas.forEach((meta) => {
      if (!mapa.has(meta.periodo)) {
        mapa.set(meta.periodo, meta.tipo);
      }
    });

    return Array.from(mapa.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([periodo, tipo]) => ({ periodo, tipo }));
  }, [metas]);

  const vendedoresDisponiveis = useMemo<Array<{ id: string; nome?: string }>>(() => {
    if (vendedores.length > 0) return vendedores;

    const valores = metas.map((m) => m.vendedorId).filter((v) => v !== undefined) as string[];
    const unicos = Array.from(new Set(valores)).map((id) => ({ id: String(id), nome: undefined }));
    return unicos;
  }, [metas, vendedores]);

  const vendedoresById = useMemo(() => {
    return new Map(
      vendedoresDisponiveis.map((vendedor) => [String(vendedor.id), vendedor.nome]),
    );
  }, [vendedoresDisponiveis]);

  const getNomeVendedor = (vendedorId?: string) => {
    if (!vendedorId) return undefined;
    const nome = vendedoresById.get(String(vendedorId));
    return nome && nome.trim().length > 0 ? nome : undefined;
  };

  const regioesDisponiveis = useMemo(() => {
    if (regioes.length > 0) return regioes;

    const valores = metas.map((m) => m.regiao).filter(Boolean) as string[];
    return Array.from(new Set(valores));
  }, [metas, regioes]);

  const parseValorParaNumero = (valor: string) => {
    const somenteNumero = valor.replace(/\./g, '').replace(',', '.');
    const parsed = Number(somenteNumero);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);

      if (!isPeriodoValido(formulario.tipo, formulario.periodo)) {
        setError(
          formulario.tipo === 'trimestral'
            ? 'Período inválido. Use o formato YYYY-QN (ex.: 2025-Q1).'
            : formulario.tipo === 'anual'
              ? 'Período inválido. Use o formato YYYY (ex.: 2025).'
              : 'Período inválido. Use o formato YYYY-MM (ex.: 2025-02).',
        );
        return;
      }

      const valorNumerico = parseValorParaNumero(formulario.valor);
      if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
        setError('Valor inválido. Informe um valor maior que zero.');
        return;
      }

      setLoading(true);

      const payload = {
        tipo: formulario.tipo,
        periodo: formulario.periodo,
        valor: valorNumerico,
        vendedorId:
          formulario.vendedorId && formulario.vendedorId !== 'todos'
            ? formulario.vendedorId
            : undefined,
        regiao: formulario.regiao && formulario.regiao !== 'todas' ? formulario.regiao : undefined,
        descricao: formulario.descricao || undefined,
      };

      const metaSalva = editingMeta
        ? await metaService.atualizar(editingMeta.id, payload)
        : await metaService.criar(payload);
      const metaNormalizada = { ...metaSalva, valor: Number(metaSalva.valor) || 0 };

      if (payload.vendedorId && !metaSalva.vendedorId) {
        toastService.warning(
          'Atenção: o vendedor selecionado não pôde ser aplicado no backend (ID incompatível com o banco).',
        );
      }

      setMetas((prev) => {
        if (editingMeta) {
          return prev.map((m) => (m.id === editingMeta.id ? metaNormalizada : m));
        }
        return [...prev, metaNormalizada];
      });

      resetForm();
    } catch (err: unknown) {
      console.error('Erro ao salvar meta:', err);
      const normalizedMessage = getApiErrorMessage(err);
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao salvar meta');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (meta: Meta) => {
    setEditingMeta(meta);
    setFormulario({
      tipo: meta.tipo,
      periodo: meta.periodo,
      vendedorId: meta.vendedorId ? String(meta.vendedorId) : 'todos',
      regiao: meta.regiao || 'todas',
      valor: meta.valor.toLocaleString('pt-BR'),
      descricao: meta.descricao || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm('Tem certeza que deseja excluir esta meta?'))) return;
    try {
      setError(null);
      setLoading(true);
      await metaService.remover(id);
      setMetas((prev) => prev.filter((meta) => meta.id !== id));
    } catch (err: unknown) {
      console.error('Erro ao excluir meta:', err);
      const normalizedMessage = getApiErrorMessage(err);
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao excluir meta');
    } finally {
      setLoading(false);
    }
  };

  const renderBadgetTipo = (tipo: MetaTipo) => {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    return <span className={`${base} bg-[#159A9C]/10 text-[#159A9C] capitalize`}>{tipo}</span>;
  };

  const renderBadgeStatus = (ativa: boolean) => {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    return ativa ? (
      <span className={`${base} bg-green-100 text-green-800`}>Ativa</span>
    ) : (
      <span className={`${base} bg-gray-100 text-gray-800`}>Inativa</span>
    );
  };

  const handleToggleAtiva = async (meta: Meta) => {
    const proxima = !meta.ativa;

    if (!proxima) {
      const ok = await confirm(
        'Deseja desativar esta meta?\n\nEla não será considerada como ativa nos cálculos e buscas atuais.',
      );
      if (!ok) return;
    }

    try {
      setError(null);
      setUpdatingMetaId(meta.id);
      const atualizada = await metaService.atualizar(meta.id, { ativa: proxima });
      const metaNormalizada = { ...atualizada, valor: Number(atualizada.valor) || 0 };

      setMetas((prev) => prev.map((m) => (m.id === meta.id ? metaNormalizada : m)));
      toastService.success(proxima ? 'Meta ativada.' : 'Meta desativada.');
    } catch (err: unknown) {
      console.error('Erro ao atualizar status da meta:', err);
      const normalizedMessage = getApiErrorMessage(err);
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      const message = normalizedMessage || fallbackMessage || 'Erro ao atualizar status da meta';
      setError(message);
      toastService.error(message);
    } finally {
      setUpdatingMetaId(null);
    }
  };

  const valorTotal = metas.reduce((acc, meta) => acc + (Number(meta.valor) || 0), 0);

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              <Target className="h-5 w-5 text-[#159A9C]" />
              <span>Metas Comerciais</span>
              {loading ? (
                <span
                  aria-label="Carregando metas"
                  className="ml-1 inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#159A9C] border-t-transparent"
                />
              ) : null}
            </span>
          }
          description="Defina metas por período, vendedor ou região para acompanhar a performance comercial."
          actions={
            <button
              onClick={() => {
                setEditingMeta(null);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0F7B7D] disabled:opacity-50"
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
              Nova Meta
            </button>
          }
        />

        {!loading ? (
          <InlineStats
            stats={[
              { label: 'Total', value: String(metas.length), tone: 'neutral' },
              { label: 'Ativas', value: String(metas.filter((m) => m.ativa).length), tone: 'accent' },
              { label: 'Valor total', value: formatarValor(valorTotal), tone: 'neutral' },
            ]}
          />
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </SectionCard>

      <FiltersBar className="p-4">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="w-full sm:min-w-[260px] sm:flex-1">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Buscar metas</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AAEB8]" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por período, região ou descrição"
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white pl-10 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#159A9C]/45 focus:ring-2 focus:ring-[#159A9C]/15"
              />
            </div>
          </div>

          <div className="w-full sm:w-[220px]">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as 'todas' | 'ativas' | 'inativas')}
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#159A9C]/45 focus:ring-2 focus:ring-[#159A9C]/15"
              aria-label="Filtrar por status"
            >
              <option value="todas">Todas</option>
              <option value="ativas">Ativas</option>
              <option value="inativas">Inativas</option>
            </select>
          </div>

          <div className="w-full sm:w-[220px]">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Período</label>
            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#159A9C]/45 focus:ring-2 focus:ring-[#159A9C]/15"
              aria-label="Filtrar por período"
            >
              <option value="todos">Todos</option>
              {periodosDisponiveis.map(({ periodo, tipo }) => (
                <option key={periodo} value={periodo}>
                  {formatarPeriodo(tipo, periodo)}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Ações</label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={carregarMetas}
                className="inline-flex items-center gap-2 rounded-lg border border-[#B4BEC9] bg-white px-4 py-2 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                Recarregar
              </button>
            </div>
          </div>
        </div>
      </FiltersBar>

      <DataTableCard>
        <div className="flex items-center justify-between gap-3 border-b border-[#DCE8EC] px-4 py-3 sm:px-5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-[#1B3B4E]">
            <Target className="h-4 w-4 text-[#159A9C]" />
            Metas configuradas
          </h2>
          {!loading ? (
            <span className="text-xs font-medium text-[#6E8997]">
              Exibindo <strong className="text-[#1B3B4E]">{metasFiltradas.length}</strong> de{' '}
              <strong className="text-[#1B3B4E]">{metas.length}</strong>
            </span>
          ) : null}
        </div>

        {loading ? (
          <div className="p-4 sm:p-5">
            <LoadingSkeleton lines={6} className="border-0 shadow-none" />
          </div>
        ) : metasFiltradas.length === 0 ? (
          <div className="p-4 sm:p-5">
            <EmptyState
              title="Nenhuma meta configurada"
              description="Crie sua primeira meta para acompanhar o desempenho comercial."
              icon={<Target className="h-5 w-5" />}
              action={
                <button
                  onClick={() => {
                    setEditingMeta(null);
                    setShowForm(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0F7B7D]"
                >
                  <Plus className="h-4 w-4" />
                  Criar Meta
                </button>
              }
            />
          </div>
        ) : (
          <div className="divide-y">
            {metasFiltradas.map((meta) => (
              <div key={meta.id} className="px-4 py-4 transition-colors hover:bg-gray-50 sm:px-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      {renderBadgetTipo(meta.tipo)}
                      {renderBadgeStatus(meta.ativa)}
                      <span className="text-lg font-semibold text-[#002333]">
                        {formatarValor(Number(meta.valor))}
                      </span>
                      <span className="text-sm text-[#002333]/70">
                        {formatarPeriodo(meta.tipo, meta.periodo)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#002333]/80">
                      {meta.vendedorId ? (
                        <span className="inline-flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {getNomeVendedor(String(meta.vendedorId))
                            ? `Vendedor: ${getNomeVendedor(String(meta.vendedorId))}`
                            : `Vendedor #${meta.vendedorId}`}
                        </span>
                      ) : null}

                      {meta.regiao ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {meta.regiao}
                        </span>
                      ) : null}

                      {!meta.vendedorId && !meta.regiao ? (
                        <span className="inline-flex items-center gap-1 text-[#159A9C]">
                          <Building2 className="h-4 w-4" />
                          Meta Geral
                        </span>
                      ) : null}
                    </div>

                    {meta.descricao ? <p className="text-sm text-[#002333]/70">{meta.descricao}</p> : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAtiva(meta)}
                      className="rounded-lg p-2 text-[#19384C] transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                      title={meta.ativa ? 'Desativar meta' : 'Ativar meta'}
                      aria-label={meta.ativa ? 'Desativar meta' : 'Ativar meta'}
                      disabled={loading || updatingMetaId === meta.id}
                    >
                      {updatingMetaId === meta.id ? (
                        <span
                          aria-label="Atualizando status"
                          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#159A9C] border-t-transparent"
                        />
                      ) : meta.ativa ? (
                        <ToggleRight className="h-4 w-4 text-[#159A9C]" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(meta)}
                      className="rounded-lg p-2 text-[#159A9C] transition-colors hover:bg-[#159A9C]/10"
                      title="Editar meta"
                      disabled={loading || updatingMetaId === meta.id}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(meta.id)}
                      className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                      title="Excluir meta"
                      disabled={loading || updatingMetaId === meta.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DataTableCard>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#002333]/60 font-semibold">
                  {editingMeta ? 'Editar meta' : 'Nova meta'}
                </p>
                <h3 className="text-xl font-bold text-[#002333]">Configuração</h3>
              </div>
              <button
                onClick={resetForm}
                className="p-2 text-[#002333]/70 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-2">Tipo</label>
                  <select
                    value={formulario.tipo}
                    onChange={(e) =>
                      setFormulario((prev) => ({ ...prev, tipo: e.target.value as MetaTipo }))
                    }
                    className="w-full border border-[#B4BEC9] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#159A9C] text-sm"
                    required
                  >
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-2">Período</label>
                  <input
                    type={formulario.tipo === 'mensal' ? 'month' : 'text'}
                    value={formulario.periodo}
                    onChange={(e) =>
                      setFormulario((prev) => ({ ...prev, periodo: e.target.value }))
                    }
                    placeholder={
                      formulario.tipo === 'trimestral'
                        ? 'Ex: 2025-Q1'
                        : formulario.tipo === 'anual'
                          ? 'Ex: 2025'
                          : ''
                    }
                    className="w-full border border-[#B4BEC9] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#159A9C] text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-2">Vendedor</label>
                  <select
                    value={formulario.vendedorId}
                    onChange={(e) =>
                      setFormulario((prev) => ({ ...prev, vendedorId: e.target.value }))
                    }
                    className="w-full border border-[#B4BEC9] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#159A9C] text-sm"
                    disabled={loadingVendedores}
                  >
                    <option value="todos">
                      {loadingVendedores ? 'Carregando vendedores...' : 'Todos os vendedores'}
                    </option>
                    {vendedoresDisponiveis.map((vendedor) => (
                      <option key={vendedor.id} value={vendedor.id}>
                        {vendedor.nome || `Vendedor #${vendedor.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-2">Região</label>
                  <select
                    value={formulario.regiao}
                    onChange={(e) => setFormulario((prev) => ({ ...prev, regiao: e.target.value }))}
                    className="w-full border border-[#B4BEC9] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#159A9C] text-sm"
                    disabled={loadingRegioes}
                  >
                    <option value="todas">
                      {loadingRegioes ? 'Carregando regiões...' : 'Todas as regiões'}
                    </option>
                    {regioesDisponiveis.map((regiao) => {
                      const value = regiao;
                      return (
                        <option key={value} value={value}>
                          {regiao}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#002333] mb-2">
                  Valor da Meta
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B4BEC9] h-4 w-4" />
                  <input
                    type="text"
                    value={formulario.valor}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\D/g, '');
                      const formatado = new Intl.NumberFormat('pt-BR').format(Number(valor) || 0);
                      setFormulario((prev) => ({ ...prev, valor: formatado }));
                    }}
                    placeholder="450.000"
                    className="w-full pl-10 pr-3 py-2 border border-[#B4BEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#002333] mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={formulario.descricao}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, descricao: e.target.value }))
                  }
                  placeholder="Contextualize o objetivo desta meta"
                  rows={3}
                  className="w-full border border-[#B4BEC9] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#159A9C] text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {loading ? 'Salvando...' : editingMeta ? 'Atualizar Meta' : 'Criar Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetasConfiguracao;
