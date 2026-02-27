import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  DollarSign,
  Eye,
  FileText,
  Filter,
  RefreshCw,
  Search,
  User,
  XCircle,
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
import ModalAcaoLote from '../../../components/modals/ModalAcaoLote';
import ModalAprovarCotacao from '../../../components/modals/ModalAprovarCotacao';
import { cotacaoService } from '../../../services/cotacaoService';
import { Cotacao } from '../../../types/cotacaoTypes';

type FiltroPrioridade = 'todas' | 'urgente' | 'alta' | 'media' | 'baixa';

const btnPrimary =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition hover:bg-[#117C7E] disabled:cursor-not-allowed disabled:opacity-60';
const btnSecondary =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60';
const btnSuccess =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#14804A] px-3 text-sm font-medium text-white transition hover:bg-[#0E6B3E] disabled:cursor-not-allowed disabled:opacity-60';
const btnDanger =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#C03449] px-3 text-sm font-medium text-white transition hover:bg-[#A32A3D] disabled:cursor-not-allowed disabled:opacity-60';

const moneyFmt = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function MinhasAprovacoesPage() {
  const navigate = useNavigate();
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  const [cotacoes, setCotacoes] = useState<Cotacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [busca, setBusca] = useState('');
  const [filtroPrioridade, setFiltroPrioridade] = useState<FiltroPrioridade>('todas');

  const [modalAberto, setModalAberto] = useState(false);
  const [cotacaoSelecionada, setCotacaoSelecionada] = useState<Cotacao | null>(null);
  const [cotacoesSelecionadas, setCotacoesSelecionadas] = useState<Set<string>>(new Set());
  const [modalLoteAberto, setModalLoteAberto] = useState(false);
  const [tipoAcaoLote, setTipoAcaoLote] = useState<'aprovar' | 'reprovar'>('aprovar');

  useEffect(() => {
    void carregarAprovacoes();
  }, []);

  useEffect(() => {
    setCotacoesSelecionadas((prev) => {
      const idsAtuais = new Set(cotacoes.map((cotacao) => cotacao.id));
      const proxima = new Set<string>();

      prev.forEach((id) => {
        if (idsAtuais.has(id)) {
          proxima.add(id);
        }
      });

      return proxima.size === prev.size ? prev : proxima;
    });
  }, [cotacoes]);

  const carregarAprovacoes = async () => {
    setCarregando(true);
    setErro(null);

    try {
      const dados = await cotacaoService.minhasAprovacoes();
      setCotacoes(Array.isArray(dados) ? dados : []);
    } catch (error: any) {
      console.error('Erro ao carregar aprovacoes:', error);
      const mensagem = error?.message || 'Erro ao carregar aprovacoes pendentes';
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setCarregando(false);
    }
  };

  const abrirModalAprovacao = (cotacao: Cotacao) => {
    setCotacaoSelecionada(cotacao);
    setModalAberto(true);
  };

  const handleAprovar = async (justificativa?: string) => {
    if (!cotacaoSelecionada) return;

    try {
      await cotacaoService.aprovar(cotacaoSelecionada.id, justificativa);
      toast.success('Cotacao aprovada com sucesso');
      setModalAberto(false);
      setCotacaoSelecionada(null);
      await carregarAprovacoes();
    } catch (error: any) {
      console.error('Erro ao aprovar cotacao:', error);
      toast.error(error?.message || 'Erro ao aprovar cotacao');
      throw error;
    }
  };

  const handleReprovar = async (justificativa: string) => {
    if (!cotacaoSelecionada) return;

    try {
      await cotacaoService.reprovar(cotacaoSelecionada.id, justificativa);
      toast.success('Cotacao reprovada');
      setModalAberto(false);
      setCotacaoSelecionada(null);
      await carregarAprovacoes();
    } catch (error: any) {
      console.error('Erro ao reprovar cotacao:', error);
      toast.error(error?.message || 'Erro ao reprovar cotacao');
      throw error;
    }
  };

  const toggleSelecionarCotacao = (cotacaoId: string) => {
    setCotacoesSelecionadas((prev) => {
      const proxima = new Set(prev);
      if (proxima.has(cotacaoId)) {
        proxima.delete(cotacaoId);
      } else {
        proxima.add(cotacaoId);
      }
      return proxima;
    });
  };

  const abrirModalLote = (tipo: 'aprovar' | 'reprovar') => {
    if (cotacoesSelecionadas.size === 0) {
      toast.error('Selecione ao menos uma cotacao');
      return;
    }
    setTipoAcaoLote(tipo);
    setModalLoteAberto(true);
  };

  const handleAcaoLote = async (justificativa?: string) => {
    if (cotacoesSelecionadas.size === 0) return;

    const ids = Array.from(cotacoesSelecionadas);

    try {
      if (tipoAcaoLote === 'aprovar') {
        const resultado = await cotacaoService.aprovarLote(ids, justificativa);
        if (resultado.falhas > 0) {
          toast.error(`${resultado.sucessos} aprovadas, ${resultado.falhas} falharam`);
        } else {
          toast.success(`${resultado.sucessos} cotacao(oes) aprovada(s)`);
        }
      } else {
        if (!justificativa) {
          toast.error('Justificativa e obrigatoria para reprovacao');
          return;
        }
        const resultado = await cotacaoService.reprovarLote(ids, justificativa);
        if (resultado.falhas > 0) {
          toast.error(`${resultado.sucessos} reprovadas, ${resultado.falhas} falharam`);
        } else {
          toast.success(`${resultado.sucessos} cotacao(oes) reprovada(s)`);
        }
      }

      setModalLoteAberto(false);
      setCotacoesSelecionadas(new Set());
      await carregarAprovacoes();
    } catch (error: any) {
      console.error('Erro na acao em lote:', error);
      toast.error(error?.message || 'Erro ao processar acao em lote');
    }
  };

  const normalizar = (valor: unknown) =>
    String(valor || '')
      .toLowerCase()
      .trim();

  const termoBusca = normalizar(busca);

  const cotacoesFiltradas = cotacoes.filter((cotacao) => {
    if (filtroPrioridade !== 'todas' && cotacao.prioridade !== filtroPrioridade) {
      return false;
    }

    if (!termoBusca) return true;

    const campos = [
      cotacao.numero,
      cotacao.titulo,
      cotacao.descricao,
      cotacao.fornecedor?.nome,
      cotacao.responsavel?.nome,
      cotacao.aprovador?.nome,
    ];

    return campos.some((campo) => normalizar(campo).includes(termoBusca));
  });

  const hasFilters = busca.trim().length > 0 || filtroPrioridade !== 'todas';
  const idsFiltrados = cotacoesFiltradas.map((cotacao) => cotacao.id);
  const selecionadasNaLista = idsFiltrados.filter((id) => cotacoesSelecionadas.has(id)).length;
  const todasVisiveisSelecionadas =
    cotacoesFiltradas.length > 0 && selecionadasNaLista === cotacoesFiltradas.length;
  const selecaoParcialVisivel =
    selecionadasNaLista > 0 && selecionadasNaLista < cotacoesFiltradas.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selecaoParcialVisivel;
    }
  }, [selecaoParcialVisivel, cotacoesFiltradas.length, todasVisiveisSelecionadas]);

  const toggleSelecionarTodasVisiveis = () => {
    if (!cotacoesFiltradas.length) return;

    setCotacoesSelecionadas((prev) => {
      const proxima = new Set(prev);

      if (todasVisiveisSelecionadas) {
        idsFiltrados.forEach((id) => proxima.delete(id));
      } else {
        idsFiltrados.forEach((id) => proxima.add(id));
      }

      return proxima;
    });
  };

  const limparSelecao = () => setCotacoesSelecionadas(new Set());

  const limparFiltros = () => {
    setBusca('');
    setFiltroPrioridade('todas');
  };

  const totalValorPendente = cotacoes.reduce((total, cotacao) => total + (cotacao.valorTotal || 0), 0);
  const totalUrgentes = cotacoes.filter((cotacao) => cotacao.prioridade === 'urgente').length;
  const totalComPrazoHojeOuAtrasado = cotacoes.filter((cotacao) => {
    if (!cotacao.prazoResposta) return false;
    const prazo = new Date(cotacao.prazoResposta);
    if (Number.isNaN(prazo.getTime())) return false;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    prazo.setHours(0, 0, 0, 0);
    return prazo.getTime() <= hoje.getTime();
  }).length;

  const getPrioridadeLabel = (prioridade: string) => {
    switch (prioridade) {
      case 'urgente':
        return 'Urgente';
      case 'alta':
        return 'Alta';
      case 'media':
        return 'Media';
      case 'baixa':
        return 'Baixa';
      default:
        return prioridade || 'N/A';
    }
  };

  const getPrioridadeBadge = (prioridade: string) => {
    let className = 'border-[#DCE8EC] bg-white text-[#476776]';

    switch (prioridade) {
      case 'urgente':
        className = 'border-[#F4C7CF] bg-[#FFF4F6] text-[#B4233A]';
        break;
      case 'alta':
        className = 'border-[#F9D9AA] bg-[#FFF7EA] text-[#A86400]';
        break;
      case 'media':
        className = 'border-[#CFE3FA] bg-[#F2F8FF] text-[#1E66B4]';
        break;
      case 'baixa':
        className = 'border-[#DCE8EC] bg-[#F8FBFC] text-[#476776]';
        break;
      default:
        break;
    }

    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}
      >
        {getPrioridadeLabel(prioridade)}
      </span>
    );
  };

  const formatarData = (data: string | Date | null | undefined) => {
    if (!data) return 'N/A';
    try {
      const dataObj = typeof data === 'string' ? new Date(data) : data;
      if (Number.isNaN(dataObj.getTime())) return 'N/A';
      return dataObj.toLocaleDateString('pt-BR');
    } catch {
      return 'N/A';
    }
  };

  const getPrazoInfo = (data: string | null | undefined) => {
    if (!data) {
      return { label: 'Sem prazo', statusLabel: '', overdue: false };
    }

    const prazo = new Date(data);
    if (Number.isNaN(prazo.getTime())) {
      return { label: 'Data invalida', statusLabel: '', overdue: false };
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    prazo.setHours(0, 0, 0, 0);

    if (prazo.getTime() < hoje.getTime()) {
      return { label: prazo.toLocaleDateString('pt-BR'), statusLabel: 'Atrasada', overdue: true };
    }

    if (prazo.getTime() === hoje.getTime()) {
      return { label: prazo.toLocaleDateString('pt-BR'), statusLabel: 'Vence hoje', overdue: false };
    }

    return { label: prazo.toLocaleDateString('pt-BR'), statusLabel: '', overdue: false };
  };

  const renderRowActions = (cotacao: Cotacao) => (
    <button
      type="button"
      onClick={() => abrirModalAprovacao(cotacao)}
      className={btnPrimary}
      title={`Analisar cotacao ${cotacao.numero}`}
    >
      <Eye className="h-4 w-4" />
      Analisar
    </button>
  );

  const renderListToolbar = () => (
    <div className="flex flex-col gap-3 border-b border-[#E1EAEE] bg-[#F8FBFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[#516F7D]">
        <span>
          {cotacoesFiltradas.length} registro{cotacoesFiltradas.length === 1 ? '' : 's'}
        </span>
        {hasFilters ? (
          <span className="rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-2 py-0.5 text-xs font-medium text-[#0F7B7D]">
            filtrados
          </span>
        ) : null}
        {cotacoesSelecionadas.size > 0 ? (
          <span className="rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-2 py-0.5 text-xs font-semibold text-[#0F7B7D]">
            {cotacoesSelecionadas.size} selecionada{cotacoesSelecionadas.size === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {cotacoesFiltradas.length > 0 ? (
          <button type="button" onClick={toggleSelecionarTodasVisiveis} className={btnSecondary}>
            <CheckCircle className="h-4 w-4" />
            {todasVisiveisSelecionadas ? 'Desmarcar visiveis' : 'Selecionar visiveis'}
          </button>
        ) : null}

        {cotacoesSelecionadas.size > 0 ? (
          <>
            <button type="button" onClick={() => abrirModalLote('aprovar')} className={btnSuccess}>
              <CheckCircle className="h-4 w-4" />
              Aprovar lote
            </button>
            <button type="button" onClick={() => abrirModalLote('reprovar')} className={btnDanger}>
              <XCircle className="h-4 w-4" />
              Reprovar lote
            </button>
            <button type="button" onClick={limparSelecao} className={btnSecondary}>
              Limpar selecao
            </button>
          </>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title="Minhas Aprovações"
          description={
            carregando
              ? 'Carregando cotacoes pendentes de aprovacao...'
              : `Acompanhe e decida cotações aguardando sua aprovacao (${cotacoesFiltradas.length} na lista).`
          }
          actions={
            <button
              type="button"
              onClick={() => void carregarAprovacoes()}
              disabled={carregando}
              className={btnSecondary}
            >
              <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          }
        />

        {!carregando && !erro ? (
          <InlineStats
            stats={[
              { label: 'Pendentes', value: String(cotacoes.length), tone: 'warning' },
              { label: 'Filtradas', value: String(cotacoesFiltradas.length), tone: 'neutral' },
              { label: 'Selecionadas', value: String(cotacoesSelecionadas.size), tone: 'accent' },
              { label: 'Urgentes', value: String(totalUrgentes), tone: 'warning' },
              { label: 'Prazo hoje/atrasado', value: String(totalComPrazoHojeOuAtrasado), tone: 'warning' },
              { label: 'Valor total', value: moneyFmt.format(totalValorPendente), tone: 'accent' },
            ]}
          />
        ) : null}
      </SectionCard>

      <FiltersBar className="p-4">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full sm:min-w-[280px] sm:flex-1">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AAEB8]" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Numero, titulo, fornecedor ou solicitante..."
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white pl-10 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              />
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Prioridade</label>
            <select
              value={filtroPrioridade}
              onChange={(e) => setFiltroPrioridade(e.target.value as FiltroPrioridade)}
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 sm:w-[180px]"
            >
              <option value="todas">Todas</option>
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button
              type="button"
              onClick={limparFiltros}
              className={btnSecondary}
              disabled={!hasFilters}
            >
              <Filter className="h-4 w-4" />
              Limpar filtros
            </button>
          </div>
        </div>
      </FiltersBar>

      {carregando ? <LoadingSkeleton lines={8} /> : null}

      {!carregando && erro ? (
        <EmptyState
          icon={<AlertCircle className="h-5 w-5" />}
          title="Erro ao carregar aprovacoes"
          description={erro}
          action={
            <button type="button" onClick={() => void carregarAprovacoes()} className={btnPrimary}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          }
        />
      ) : null}

      {!carregando && !erro && cotacoes.length === 0 ? (
        <EmptyState
          icon={<CheckCircle className="h-5 w-5" />}
          title="Nenhuma aprovacao pendente"
          description="Voce nao possui cotacoes aguardando sua aprovacao no momento."
          action={
            <button type="button" onClick={() => navigate('/vendas/cotacoes')} className={btnPrimary}>
              <FileText className="h-4 w-4" />
              Ver todas as cotacoes
            </button>
          }
        />
      ) : null}

      {!carregando && !erro && cotacoes.length > 0 && cotacoesFiltradas.length === 0 ? (
        <EmptyState
          icon={<Filter className="h-5 w-5" />}
          title="Nenhuma cotacao encontrada"
          description="Ajuste ou limpe os filtros para visualizar as aprovacoes pendentes."
          action={
            <button type="button" onClick={limparFiltros} className={btnSecondary}>
              <Filter className="h-4 w-4" />
              Limpar filtros
            </button>
          }
        />
      ) : null}

      {!carregando && !erro && cotacoesFiltradas.length > 0 ? (
        <DataTableCard>
          {renderListToolbar()}

          <div className="p-4 lg:hidden">
            <div className="grid grid-cols-1 gap-3">
              {cotacoesFiltradas.map((cotacao) => {
                const prazoInfo = getPrazoInfo(cotacao.prazoResposta);
                const itensCount = Array.isArray(cotacao.itens) ? cotacao.itens.length : 0;

                return (
                  <article
                    key={cotacao.id}
                    className={`rounded-xl border bg-white p-4 shadow-[0_10px_22px_-20px_rgba(15,57,74,0.4)] ${
                      cotacoesSelecionadas.has(cotacao.id)
                        ? 'border-[#159A9C] ring-1 ring-[#159A9C]/20'
                        : 'border-[#DFE9ED]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={cotacoesSelecionadas.has(cotacao.id)}
                            onChange={() => toggleSelecionarCotacao(cotacao.id)}
                            className="h-4 w-4 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                            aria-label={`Selecionar cotacao ${cotacao.numero}`}
                          />
                          <span className="text-sm font-semibold text-[#173A4D]">#{cotacao.numero}</span>
                          {getPrioridadeBadge(cotacao.prioridade)}
                        </div>
                        <p className="mt-1 truncate text-sm font-medium text-[#173A4D]">
                          {cotacao.titulo || 'Sem titulo'}
                        </p>
                        <p className="mt-1 truncate text-xs text-[#64808E]">
                          {cotacao.fornecedor?.nome || 'Fornecedor nao informado'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => abrirModalAprovacao(cotacao)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D4E2E7] text-[#244455] hover:bg-[#F6FAFB]"
                        title={`Analisar cotacao ${cotacao.numero}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                      <div className="rounded-lg border border-[#EDF3F5] bg-[#FAFCFD] px-3 py-2">
                        <div className="flex items-center gap-2 text-[#5F7B89]">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-xs uppercase tracking-wide">Valor</span>
                        </div>
                        <p className="mt-1 font-semibold text-[#173A4D]">
                          {moneyFmt.format(cotacao.valorTotal || 0)}
                        </p>
                      </div>

                      <div className="rounded-lg border border-[#EDF3F5] bg-[#FAFCFD] px-3 py-2">
                        <div className="flex items-center gap-2 text-[#5F7B89]">
                          <Calendar className="h-4 w-4" />
                          <span className="text-xs uppercase tracking-wide">Prazo</span>
                        </div>
                        <p
                          className={`mt-1 font-medium ${
                            prazoInfo.overdue ? 'text-[#B4233A]' : 'text-[#173A4D]'
                          }`}
                        >
                          {prazoInfo.label}
                        </p>
                        {prazoInfo.statusLabel ? (
                          <p className={`text-xs ${prazoInfo.overdue ? 'text-[#B4233A]' : 'text-[#A86400]'}`}>
                            {prazoInfo.statusLabel}
                          </p>
                        ) : null}
                      </div>

                      <div className="rounded-lg border border-[#EDF3F5] bg-[#FAFCFD] px-3 py-2">
                        <div className="flex items-center gap-2 text-[#5F7B89]">
                          <User className="h-4 w-4" />
                          <span className="text-xs uppercase tracking-wide">Solicitante</span>
                        </div>
                        <p className="mt-1 truncate font-medium text-[#173A4D]">
                          {cotacao.responsavel?.nome || 'Nao informado'}
                        </p>
                      </div>

                      <div className="rounded-lg border border-[#EDF3F5] bg-[#FAFCFD] px-3 py-2">
                        <div className="flex items-center gap-2 text-[#5F7B89]">
                          <FileText className="h-4 w-4" />
                          <span className="text-xs uppercase tracking-wide">Itens</span>
                        </div>
                        <p className="mt-1 font-medium text-[#173A4D]">
                          {itensCount} item{itensCount === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>

                    {cotacao.descricao ? (
                      <p className="mt-3 line-clamp-2 text-sm text-[#5A7684]">{cotacao.descricao}</p>
                    ) : null}

                    <div className="mt-3 flex justify-end border-t border-[#EDF3F5] pt-3">
                      {renderRowActions(cotacao)}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full min-w-[1040px] border-collapse">
                <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#E1EAEE]">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={todasVisiveisSelecionadas}
                        onChange={toggleSelecionarTodasVisiveis}
                        className="h-4 w-4 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                        aria-label="Selecionar todas as cotacoes visiveis"
                      />
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Cotacao
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Fornecedor
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Solicitante
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Prioridade
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Prazo resposta
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Valor total
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Itens
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Acoes
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white">
                  {cotacoesFiltradas.map((cotacao) => {
                    const prazoInfo = getPrazoInfo(cotacao.prazoResposta);
                    const itensCount = Array.isArray(cotacao.itens) ? cotacao.itens.length : 0;

                    return (
                      <tr key={cotacao.id} className="border-t border-[#EDF3F5] hover:bg-[#FAFCFD]">
                        <td className="px-4 py-4 align-top">
                          <input
                            type="checkbox"
                            checked={cotacoesSelecionadas.has(cotacao.id)}
                            onChange={() => toggleSelecionarCotacao(cotacao.id)}
                            className="h-4 w-4 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                            aria-label={`Selecionar cotacao ${cotacao.numero}`}
                          />
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="text-sm font-semibold text-[#173A4D]">#{cotacao.numero}</div>
                          <div className="mt-0.5 max-w-[250px] truncate text-sm text-[#64808E]">
                            {cotacao.titulo || 'Sem titulo'}
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="text-sm font-medium text-[#173A4D]">
                            {cotacao.fornecedor?.nome || 'Fornecedor nao informado'}
                          </div>
                          {cotacao.fornecedor?.email ? (
                            <div className="mt-0.5 max-w-[220px] truncate text-xs text-[#64808E]">
                              {cotacao.fornecedor.email}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="text-sm font-medium text-[#173A4D]">
                            {cotacao.responsavel?.nome || 'Nao informado'}
                          </div>
                          {cotacao.responsavel?.email ? (
                            <div className="mt-0.5 max-w-[220px] truncate text-xs text-[#64808E]">
                              {cotacao.responsavel.email}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-5 py-4 align-top">{getPrioridadeBadge(cotacao.prioridade)}</td>

                        <td className="px-5 py-4 align-top">
                          <div
                            className={`text-sm ${
                              prazoInfo.overdue ? 'font-semibold text-[#B4233A]' : 'text-[#173A4D]'
                            }`}
                          >
                            {prazoInfo.label}
                          </div>
                          {prazoInfo.statusLabel ? (
                            <div className={`text-xs ${prazoInfo.overdue ? 'text-[#B4233A]' : 'text-[#A86400]'}`}>
                              {prazoInfo.statusLabel}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-5 py-4 align-top text-sm font-semibold text-[#173A4D]">
                          {moneyFmt.format(cotacao.valorTotal || 0)}
                        </td>

                        <td className="px-5 py-4 align-top text-sm text-[#476776]">
                          {itensCount} item{itensCount === 1 ? '' : 's'}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="flex justify-end">{renderRowActions(cotacao)}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </DataTableCard>
      ) : null}

      {modalAberto && cotacaoSelecionada ? (
        <ModalAprovarCotacao
          cotacao={cotacaoSelecionada}
          onClose={() => {
            setModalAberto(false);
            setCotacaoSelecionada(null);
          }}
          onAprovar={handleAprovar}
          onReprovar={handleReprovar}
        />
      ) : null}

      {modalLoteAberto ? (
        <ModalAcaoLote
          tipo={tipoAcaoLote}
          quantidadeCotacoes={cotacoesSelecionadas.size}
          onClose={() => setModalLoteAberto(false)}
          onConfirmar={handleAcaoLote}
        />
      ) : null}
    </div>
  );
}

export default MinhasAprovacoesPage;
