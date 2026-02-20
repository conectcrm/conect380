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
} from 'lucide-react';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
import { metaService, Meta, MetaTipo } from '../../services/metaService';
import { usuariosService } from '../../services/usuariosService';
import { UserRole } from '../../types/usuarios';
import { api } from '../../services/api';

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

const MetasConfiguracao: React.FC = () => {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null);
  const [busca, setBusca] = useState('');
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
      return (
        meta.descricao?.toLowerCase().includes(termo) ||
        meta.regiao?.toLowerCase().includes(termo) ||
        meta.periodo.toLowerCase().includes(termo)
      );
    });
  }, [busca, metas]);

  const vendedoresDisponiveis = useMemo<Array<{ id: string; nome?: string }>>(() => {
    if (vendedores.length > 0) return vendedores;

    const valores = metas.map((m) => m.vendedorId).filter((v) => v !== undefined) as string[];
    const unicos = Array.from(new Set(valores)).map((id) => ({ id: String(id), nome: undefined }));
    return unicos;
  }, [metas, vendedores]);

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
      setLoading(true);

      const payload = {
        tipo: formulario.tipo,
        periodo: formulario.periodo,
        valor: parseValorParaNumero(formulario.valor),
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
    if (!window.confirm('Tem certeza que deseja excluir esta meta?')) return;
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

  const valorTotal = metas.reduce((acc, meta) => acc + (Number(meta.valor) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus
          nucleusName="Configurações"
          nucleusPath="/nuclei/configuracoes"
          currentModuleName="Metas Comerciais"
        />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow-sm border px-6 py-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 text-[#002333]">
                  <Target className="h-8 w-8 text-[#159A9C]" />
                  <h1 className="text-3xl font-bold">Metas Comerciais</h1>
                  {loading && (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#159A9C]"></div>
                  )}
                </div>
                <p className="text-sm text-[#002333]/70 mt-2 max-w-3xl">
                  Defina metas por período, vendedor ou região para acompanhar a performance
                  comercial no núcleo de Configurações.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="relative w-full sm:w-64">
                  <Search className="h-4 w-4 text-[#B4BEC9] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por período, região ou descrição"
                    className="w-full pl-9 pr-3 py-2 border border-[#B4BEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] text-sm"
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingMeta(null);
                    setShowForm(true);
                  }}
                  className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                  disabled={loading}
                >
                  <Plus className="h-4 w-4" />
                  Nova Meta
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Total de Metas
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{metas.length}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <Target className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Metas Ativas
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {metas.filter((m) => m.ativa).length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <User className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Valor Total
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {formatarValor(valorTotal)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <DollarSign className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#002333] flex items-center gap-2">
                <Target className="w-5 h-5 text-[#159A9C]" />
                Metas Configuradas
              </h3>
              <button
                onClick={carregarMetas}
                className="text-sm text-[#159A9C] hover:bg-[#159A9C]/10 px-3 py-1.5 rounded-lg transition-colors"
                disabled={loading}
              >
                Recarregar
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-[#002333]/70">
                <div className="mx-auto h-10 w-10 border-2 border-[#159A9C] border-t-transparent rounded-full animate-spin" />
                <p className="mt-3 text-sm">Carregando metas...</p>
              </div>
            ) : metasFiltradas.length === 0 ? (
              <div className="p-10 text-center">
                <div className="h-12 w-12 rounded-full bg-[#159A9C]/10 text-[#159A9C] flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6" />
                </div>
                <p className="text-lg font-semibold text-[#002333]">Nenhuma meta configurada</p>
                <p className="text-sm text-[#002333]/70 mt-1">
                  Crie sua primeira meta para acompanhar o desempenho comercial.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm font-medium"
                >
                  Criar Meta
                </button>
              </div>
            ) : (
              <div className="divide-y">
                {metasFiltradas.map((meta) => (
                  <div key={meta.id} className="px-6 py-5 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          {renderBadgetTipo(meta.tipo)}
                          <span className="text-lg font-semibold text-[#002333]">
                            {formatarValor(Number(meta.valor))}
                          </span>
                          <span className="text-sm text-[#002333]/70">
                            {formatarPeriodo(meta.tipo, meta.periodo)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-[#002333]/80">
                          {meta.vendedorId && (
                            <span className="inline-flex items-center gap-1">
                              <User className="h-4 w-4" />
                              Vendedor #{meta.vendedorId}
                            </span>
                          )}

                          {meta.regiao && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {meta.regiao}
                            </span>
                          )}

                          {!meta.vendedorId && !meta.regiao && (
                            <span className="inline-flex items-center gap-1 text-[#159A9C]">
                              <Building2 className="h-4 w-4" />
                              Meta Geral
                            </span>
                          )}
                        </div>

                        {meta.descricao && (
                          <p className="text-sm text-[#002333]/70">{meta.descricao}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(meta)}
                          className="p-2 text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors"
                          title="Editar meta"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(meta.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir meta"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
