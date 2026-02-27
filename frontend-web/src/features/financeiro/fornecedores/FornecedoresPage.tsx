import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle,
  Download,
  Edit3,
  FileSpreadsheet,
  Filter,
  Mail,
  Phone,
  Plus,
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
import ModalConfirmacao from '../../../components/common/ModalConfirmacao';
import { useGlobalConfirmation } from '../../../contexts/GlobalConfirmationContext';
import { useConfirmacaoInteligente } from '../../../hooks/useConfirmacaoInteligente';
import ModalFornecedor from '../components/ModalFornecedor';
import { fornecedorService, Fornecedor, NovoFornecedor } from '../../../services/fornecedorService';
import {
  exportToCSV,
  exportToExcel,
  formatDateForExport,
  formatStatusForExport,
  ExportColumn,
} from '../../../utils/exportUtils';

type FiltroStatus = 'todos' | 'ativo' | 'inativo';

const btnPrimary =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition hover:bg-[#117C7E] disabled:opacity-60 disabled:cursor-not-allowed';
const btnSecondary =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:opacity-60 disabled:cursor-not-allowed';
const btnDanger =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#C03449] px-3 text-sm font-medium text-white transition hover:bg-[#A32A3D] disabled:opacity-60 disabled:cursor-not-allowed';
const btnSuccess =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#14804A] px-3 text-sm font-medium text-white transition hover:bg-[#0E6B3E] disabled:opacity-60 disabled:cursor-not-allowed';
const btnWarning =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#B56E16] px-3 text-sm font-medium text-white transition hover:bg-[#955A10] disabled:opacity-60 disabled:cursor-not-allowed';

const exportColumns: ExportColumn[] = [
  { key: 'nome', label: 'Nome' },
  { key: 'cnpjCpf', label: 'CNPJ/CPF' },
  { key: 'email', label: 'E-mail' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'cidade', label: 'Cidade' },
  { key: 'estado', label: 'Estado' },
  { key: 'contato', label: 'Contato' },
  { key: 'cargo', label: 'Cargo' },
  { key: 'ativo', label: 'Status', format: formatStatusForExport },
  { key: 'criadoEm', label: 'Data de Cadastro', format: formatDateForExport },
];

const normalizeFornecedor = (fornecedor: Fornecedor): Fornecedor => ({
  ...fornecedor,
  cnpjCpf: fornecedor.cnpjCpf ?? fornecedor.cnpj ?? fornecedor.cpf ?? '',
});

const formatarCNPJCPF = (valor?: string) => {
  const input = valor ?? '';
  const numeros = input.replace(/\D/g, '');
  if (numeros.length === 11) {
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (numeros.length === 14) {
    return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return input || 'Nao informado';
};

const formatarTelefone = (valor?: string) => {
  if (!valor) return 'Nao informado';
  const numeros = valor.replace(/\D/g, '');
  if (numeros.length === 10) {
    return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  if (numeros.length === 11) {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return valor;
};

const formatarData = (data?: string) => {
  if (!data) return 'N/A';
  const value = new Date(data);
  if (Number.isNaN(value.getTime())) return 'N/A';
  return value.toLocaleDateString('pt-BR');
};

export default function FornecedoresPage() {
  const navigate = useNavigate();
  const { confirm } = useGlobalConfirmation();
  const confirmacao = useConfirmacaoInteligente();
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [fornecedorEdicao, setFornecedorEdicao] = useState<Fornecedor | null>(null);

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos');
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  useEffect(() => {
    void carregarFornecedores();
  }, [filtroStatus]);

  useEffect(() => {
    setSelecionados((prev) => {
      const ids = new Set(fornecedores.map((f) => f.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (ids.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [fornecedores]);

  const carregarFornecedores = async (searchTerm?: string) => {
    try {
      setCarregando(true);
      setErro(null);
      const filtros = {
        busca: (searchTerm ?? busca).trim(),
        ativo: filtroStatus === 'todos' ? undefined : filtroStatus === 'ativo',
      };
      const dados = await fornecedorService.listarFornecedores(filtros);
      setFornecedores((Array.isArray(dados) ? dados : []).map(normalizeFornecedor));
    } catch (error: any) {
      console.error('Erro ao carregar fornecedores:', error);
      const mensagem = error?.message || 'Erro ao carregar fornecedores';
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setCarregando(false);
    }
  };

  const buscarFornecedores = async () => {
    await carregarFornecedores(busca);
  };

  const limparFiltros = async () => {
    setBusca('');
    setFiltroStatus('todos');
    await carregarFornecedores('');
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      void buscarFornecedores();
    }
  };

  const abrirModalCriacao = () => {
    setFornecedorEdicao(null);
    setModalAberto(true);
  };

  const abrirModalEdicao = (fornecedor: Fornecedor) => {
    setFornecedorEdicao(fornecedor);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setFornecedorEdicao(null);
  };

  const abrirPerfilFornecedor = (fornecedor: Fornecedor) => {
    navigate(`/financeiro/fornecedores/${fornecedor.id}`);
  };

  const handleSalvarFornecedor = async (
    dadosFornecedor: NovoFornecedor | Partial<NovoFornecedor>,
  ) => {
    try {
      if (fornecedorEdicao) {
        await fornecedorService.atualizarFornecedor(fornecedorEdicao.id, dadosFornecedor);
        toast.success('Fornecedor atualizado com sucesso');
      } else {
        await fornecedorService.criarFornecedor(dadosFornecedor as NovoFornecedor);
        toast.success('Fornecedor criado com sucesso');
      }
      fecharModal();
      await carregarFornecedores();
    } catch (error: any) {
      console.error('Erro ao salvar fornecedor:', error);
      toast.error(error?.message || 'Erro ao salvar fornecedor');
    }
  };

  const excluirFornecedor = async (id: string) => {
    const fornecedor = fornecedores.find((f) => f.id === id);
    if (!fornecedor) return;

    confirmacao.confirmar(
      'excluir-transacao',
      async () => {
        await fornecedorService.excluirFornecedor(id);
        toast.success('Fornecedor excluido com sucesso');
        await carregarFornecedores();
      },
      {
        cliente: fornecedor.nome,
        observacoes: fornecedor.ativo ? 'Fornecedor ativo' : 'Fornecedor inativo',
      },
    );
  };

  const toggleSelecionarFornecedor = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selecionarTodos = () => {
    setSelecionados(new Set(fornecedores.map((f) => f.id)));
  };

  const deselecionarTodos = () => setSelecionados(new Set());

  const ativarSelecionados = async () => {
    if (!selecionados.size) return;
    if (!(await confirm(`Tem certeza que deseja ativar ${selecionados.size} fornecedor(es)?`))) return;

    try {
      for (const id of selecionados) {
        await fornecedorService.atualizarFornecedor(id, { ativo: true });
      }
      toast.success('Fornecedores ativados');
      deselecionarTodos();
      await carregarFornecedores();
    } catch (error: any) {
      console.error('Erro ao ativar fornecedores:', error);
      toast.error(error?.message || 'Erro ao ativar fornecedores');
    }
  };

  const desativarSelecionados = async () => {
    if (!selecionados.size) return;
    if (
      !(await confirm(`Tem certeza que deseja desativar ${selecionados.size} fornecedor(es)?`))
    ) {
      return;
    }

    try {
      for (const id of selecionados) {
        await fornecedorService.atualizarFornecedor(id, { ativo: false });
      }
      toast.success('Fornecedores desativados');
      deselecionarTodos();
      await carregarFornecedores();
    } catch (error: any) {
      console.error('Erro ao desativar fornecedores:', error);
      toast.error(error?.message || 'Erro ao desativar fornecedores');
    }
  };

  const excluirSelecionados = async () => {
    if (!selecionados.size) return;

    confirmacao.confirmar(
      'excluir-categoria-financeira',
      async () => {
        for (const id of selecionados) {
          await fornecedorService.excluirFornecedor(id);
        }
        toast.success('Fornecedores excluidos');
        deselecionarTodos();
        await carregarFornecedores();
      },
      { quantidadeItens: selecionados.size },
    );
  };

  const exportarParaCSV = () => {
    exportToCSV(
      fornecedores,
      exportColumns,
      `fornecedores_${new Date().toISOString().split('T')[0]}.csv`,
    );
  };

  const exportarParaExcel = () => {
    exportToExcel(
      fornecedores,
      exportColumns,
      `fornecedores_${new Date().toISOString().split('T')[0]}.xlsx`,
      'Fornecedores',
    );
  };

  const exportarSelecionados = () => {
    exportToExcel(
      fornecedores.filter((f) => selecionados.has(f.id)),
      exportColumns,
      `fornecedores_selecionados_${new Date().toISOString().split('T')[0]}.xlsx`,
      'Fornecedores Selecionados',
    );
  };

  const total = fornecedores.length;
  const ativos = fornecedores.filter((f) => f.ativo).length;
  const inativos = total - ativos;
  const hoje = new Date().toDateString();
  const novosHoje = fornecedores.filter((f) => {
    const data = new Date(f.criadoEm);
    return !Number.isNaN(data.getTime()) && data.toDateString() === hoje;
  }).length;

  const hasFilters = busca.trim().length > 0 || filtroStatus !== 'todos';
  const allSelected = fornecedores.length > 0 && selecionados.size === fornecedores.length;
  const partialSelected = selecionados.size > 0 && selecionados.size < fornecedores.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = partialSelected;
    }
  }, [partialSelected, allSelected, fornecedores.length]);

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

  const rowActions = (fornecedor: Fornecedor) => (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          abrirModalEdicao(fornecedor);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#159A9C] hover:bg-[#ECF7F3]"
        title="Editar fornecedor"
      >
        <Edit3 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          void excluirFornecedor(fornecedor.id);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#B4233A] hover:bg-[#FFF2F4]"
        title="Excluir fornecedor"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title="Fornecedores"
          description={
            carregando
              ? 'Carregando fornecedores...'
              : `Gerencie ${total} fornecedores e parceiros comerciais.`
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => void carregarFornecedores()} className={btnSecondary} disabled={carregando}>
                <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button type="button" onClick={exportarParaCSV} className={btnSecondary} disabled={!fornecedores.length}>
                <Download className="h-4 w-4" />
                CSV
              </button>
              <button type="button" onClick={exportarParaExcel} className={btnSecondary} disabled={!fornecedores.length}>
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </button>
              <button type="button" onClick={abrirModalCriacao} className={btnPrimary}>
                <Plus className="h-4 w-4" />
                Novo Fornecedor
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
              { label: 'Novos hoje', value: String(novosHoje), tone: 'neutral' },
              { label: 'Selecionados', value: String(selecionados.size), tone: 'accent' },
            ]}
          />
        ) : null}
      </SectionCard>

      <FiltersBar className="p-4">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full sm:min-w-[280px] sm:flex-1">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Buscar fornecedores</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AAEB8]" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Nome, CNPJ/CPF, email..."
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white pl-10 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              />
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as FiltroStatus)}
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 sm:w-[180px]"
            >
              <option value="todos">Todos</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button type="button" onClick={() => void buscarFornecedores()} className={btnPrimary}>
              <Search className="h-4 w-4" />
              Buscar
            </button>
            <button type="button" onClick={() => void limparFiltros()} className={btnSecondary} disabled={!hasFilters}>
              <Filter className="h-4 w-4" />
              Limpar
            </button>
          </div>
        </div>
      </FiltersBar>

      {selecionados.size > 0 ? (
        <SectionCard className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-3 py-1 font-semibold text-[#0F7B7D]">
                <CheckCircle className="h-4 w-4" />
                {selecionados.size} selecionado{selecionados.size === 1 ? '' : 's'}
              </span>
              <button type="button" onClick={deselecionarTodos} className={btnSecondary}>
                <X className="h-4 w-4" />
                Limpar selecao
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => void ativarSelecionados()} className={btnSuccess}>
                <Check className="h-4 w-4" />
                Ativar
              </button>
              <button type="button" onClick={() => void desativarSelecionados()} className={btnWarning}>
                <X className="h-4 w-4" />
                Desativar
              </button>
              <button type="button" onClick={exportarSelecionados} className={btnSecondary}>
                <Download className="h-4 w-4" />
                Exportar
              </button>
              <button type="button" onClick={() => void excluirSelecionados()} className={btnDanger}>
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {carregando ? <LoadingSkeleton lines={8} /> : null}

      {!carregando && erro ? (
        <EmptyState
          icon={<AlertCircle className="h-5 w-5" />}
          title="Erro ao carregar fornecedores"
          description={erro}
          action={
            <button type="button" onClick={() => void carregarFornecedores()} className={btnPrimary}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          }
        />
      ) : null}

      {!carregando && !erro && fornecedores.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title={hasFilters ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
          description={
            hasFilters
              ? 'Ajuste os filtros ou faca uma nova busca para localizar fornecedores.'
              : 'Comece criando o primeiro fornecedor.'
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
                Criar primeiro fornecedor
              </button>
            )
          }
        />
      ) : null}

      {!carregando && !erro && fornecedores.length > 0 ? (
        <DataTableCard>
          <div className="flex flex-col gap-3 border-b border-[#E1EAEE] bg-[#F8FBFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[#516F7D]">
              <span>{fornecedores.length} registro{fornecedores.length === 1 ? '' : 's'}</span>
              {hasFilters ? (
                <span className="rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-2 py-0.5 text-xs font-medium text-[#0F7B7D]">
                  filtros ativos
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={allSelected ? deselecionarTodos : selecionarTodos}
                className={btnSecondary}
              >
                <CheckCircle className="h-4 w-4" />
                {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>
          </div>

          <div className="p-4 lg:hidden">
            <div className="grid grid-cols-1 gap-3">
              {fornecedores.map((fornecedor) => (
                <article
                  key={fornecedor.id}
                  className={`cursor-pointer rounded-xl border bg-white p-4 shadow-[0_10px_22px_-20px_rgba(15,57,74,0.4)] ${
                    selecionados.has(fornecedor.id)
                      ? 'border-[#159A9C] ring-1 ring-[#159A9C]/20'
                      : 'border-[#DFE9ED]'
                  }`}
                  onClick={() => abrirPerfilFornecedor(fornecedor)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selecionados.has(fornecedor.id)}
                          onChange={() => toggleSelecionarFornecedor(fornecedor.id)}
                          onClick={(event) => event.stopPropagation()}
                          className="h-4 w-4 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                          aria-label={`Selecionar fornecedor ${fornecedor.nome}`}
                        />
                        {statusBadge(fornecedor.ativo)}
                      </div>
                      <p className="mt-2 truncate text-sm font-semibold text-[#173A4D]">{fornecedor.nome}</p>
                      <p className="mt-1 truncate text-xs text-[#64808E]">
                        {formatarCNPJCPF(fornecedor.cnpjCpf)}
                      </p>
                    </div>
                    <div
                      className="flex shrink-0 items-center"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {rowActions(fornecedor)}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <div className="rounded-lg border border-[#EDF3F5] bg-[#FAFCFD] px-3 py-2">
                      <div className="flex items-center gap-2 text-[#5F7B89]">
                        <Phone className="h-4 w-4" />
                        <span className="text-xs uppercase tracking-wide">Telefone</span>
                      </div>
                      <p className="mt-1 font-medium text-[#173A4D]">{formatarTelefone(fornecedor.telefone)}</p>
                    </div>
                    <div className="rounded-lg border border-[#EDF3F5] bg-[#FAFCFD] px-3 py-2">
                      <div className="flex items-center gap-2 text-[#5F7B89]">
                        <Mail className="h-4 w-4" />
                        <span className="text-xs uppercase tracking-wide">E-mail</span>
                      </div>
                      <p className="mt-1 truncate font-medium text-[#173A4D]">{fornecedor.email || 'Nao informado'}</p>
                    </div>
                    <div className="rounded-lg border border-[#EDF3F5] bg-[#FAFCFD] px-3 py-2">
                      <div className="flex items-center gap-2 text-[#5F7B89]">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs uppercase tracking-wide">Criado em</span>
                      </div>
                      <p className="mt-1 font-medium text-[#173A4D]">{formatarData(fornecedor.criadoEm)}</p>
                    </div>
                    <div className="rounded-lg border border-[#EDF3F5] bg-[#FAFCFD] px-3 py-2">
                      <div className="flex items-center gap-2 text-[#5F7B89]">
                        <Building2 className="h-4 w-4" />
                        <span className="text-xs uppercase tracking-wide">Cidade/UF</span>
                      </div>
                      <p className="mt-1 font-medium text-[#173A4D]">
                        {fornecedor.cidade || 'Nao informada'}
                        {fornecedor.estado ? ` / ${fornecedor.estado}` : ''}
                      </p>
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
                    <th className="px-4 py-3 text-left">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => (e.target.checked ? selecionarTodos() : deselecionarTodos())}
                        className="h-4 w-4 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                        aria-label="Selecionar todos os fornecedores"
                      />
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">Fornecedor</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">Documento</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">Contato</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">Criado em</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">Acoes</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {fornecedores.map((fornecedor) => (
                    <tr
                      key={fornecedor.id}
                      className="cursor-pointer border-t border-[#EDF3F5] hover:bg-[#FAFCFD]"
                      onClick={() => abrirPerfilFornecedor(fornecedor)}
                    >
                      <td className="px-4 py-4 align-top">
                        <input
                          type="checkbox"
                          checked={selecionados.has(fornecedor.id)}
                          onChange={() => toggleSelecionarFornecedor(fornecedor.id)}
                          onClick={(event) => event.stopPropagation()}
                          className="h-4 w-4 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                          aria-label={`Selecionar fornecedor ${fornecedor.nome}`}
                        />
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="text-sm font-semibold text-[#173A4D]">{fornecedor.nome}</div>
                        <div className="mt-0.5 max-w-[260px] truncate text-xs text-[#64808E]">
                          {fornecedor.contato || 'Contato nao informado'}
                          {fornecedor.cargo ? ` - ${fornecedor.cargo}` : ''}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top text-sm text-[#173A4D]">
                        {formatarCNPJCPF(fornecedor.cnpjCpf)}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-[#173A4D]">
                            <Mail className="h-3.5 w-3.5 text-[#6E8997]" />
                            <span className="max-w-[220px] truncate">{fornecedor.email || 'Nao informado'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[#476776]">
                            <Phone className="h-3.5 w-3.5 text-[#6E8997]" />
                            <span>{formatarTelefone(fornecedor.telefone)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">{statusBadge(fornecedor.ativo)}</td>
                      <td className="px-5 py-4 align-top text-sm text-[#476776]">{formatarData(fornecedor.criadoEm)}</td>
                      <td className="px-5 py-4 align-top">
                        <div
                          className="flex justify-end"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {rowActions(fornecedor)}
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
        <ModalFornecedor
          isOpen={modalAberto}
          onClose={fecharModal}
          onSave={handleSalvarFornecedor}
          fornecedor={fornecedorEdicao}
        />
      ) : null}

      {confirmacao.tipo ? (
        <ModalConfirmacao
          isOpen={confirmacao.isOpen}
          onClose={confirmacao.fechar}
          onConfirm={confirmacao.executarConfirmacao}
          tipo={confirmacao.tipo}
          dados={confirmacao.dados}
          loading={confirmacao.loading}
        />
      ) : null}
    </div>
  );
}
