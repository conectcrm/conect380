import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle,
  CreditCard,
  Download,
  DollarSign,
  Edit,
  Filter,
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
import ModalJustificativa from '../../../components/common/ModalJustificativa';
import { useConfirmacaoInteligente } from '../../../hooks/useConfirmacaoInteligente';
import ModalContaPagar from '../../../features/financeiro/components/ModalContaPagarNovo';
import contaBancariaService from '../../../services/contaBancariaService';
import contasPagarService from '../../../services/contasPagarService';
import fornecedorService from '../../../services/fornecedorService';
import {
  CategoriaContaPagar,
  CATEGORIA_LABELS,
  ContaBancaria,
  ContaPagar,
  FiltrosExportacaoContasPagar,
  FormaPagamento,
  FORMA_PAGAMENTO_LABELS,
  NovaContaPagar,
  PrioridadePagamento,
  PRIORIDADE_LABELS,
  RegistrarPagamento,
  ResumoFinanceiro,
  StatusContaPagar,
  STATUS_LABELS,
} from '../../../types/financeiro';

interface ContasPagarPageProps {
  className?: string;
}

type FiltroStatusUI = 'todos' | StatusContaPagar;
type FiltroCategoriaUI = 'todas' | CategoriaContaPagar;
type FiltroStatusExportacaoUI = 'todos' | StatusContaPagar;

const btnPrimary =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition hover:bg-[#117C7E] disabled:opacity-60 disabled:cursor-not-allowed';
const btnSecondary =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:opacity-60 disabled:cursor-not-allowed';
const btnDanger =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#C03449] px-3 text-sm font-medium text-white transition hover:bg-[#A32A3D] disabled:opacity-60 disabled:cursor-not-allowed';
const btnSuccess =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#14804A] px-3 text-sm font-medium text-white transition hover:bg-[#0E6B3E] disabled:opacity-60 disabled:cursor-not-allowed';

const moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('pt-BR');
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formasPagamento = Object.values(FormaPagamento);
const isFormaPagamento = (value?: string): value is FormaPagamento =>
  Boolean(value && formasPagamento.includes(value as FormaPagamento));

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

const getStatusBadge = (status: StatusContaPagar) => {
  const tone =
    status === StatusContaPagar.PAGO
      ? 'border-[#BEE6CF] bg-[#F1FBF5] text-[#137A42]'
      : status === StatusContaPagar.VENCIDO
        ? 'border-[#F4C7CF] bg-[#FFF4F6] text-[#B4233A]'
        : status === StatusContaPagar.AGENDADO
          ? 'border-[#CFE3FA] bg-[#F2F8FF] text-[#1E66B4]'
          : status === StatusContaPagar.CANCELADO
            ? 'border-[#DCE8EC] bg-[#F8FBFC] text-[#476776]'
            : 'border-[#F9D9AA] bg-[#FFF7EA] text-[#A86400]';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
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

const isContaAguardandoAprovacao = (conta: ContaPagar): boolean =>
  Boolean(
    conta.necessitaAprovacao &&
      !conta.dataAprovacao &&
      conta.status !== StatusContaPagar.CANCELADO &&
      conta.status !== StatusContaPagar.PAGO,
  );

const getAprovacaoBadge = () => (
  <span className="inline-flex items-center rounded-full border border-[#CFE3FA] bg-[#F2F8FF] px-2.5 py-1 text-xs font-semibold text-[#1E66B4]">
    Aguardando aprovacao
  </span>
);

const ContasPagarPage: React.FC<ContasPagarPageProps> = ({ className }) => {
  const confirmacao = useConfirmacaoInteligente();
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [contaSelecionada, setContaSelecionada] = useState<ContaPagar | null>(null);
  const [fornecedoresCadastro, setFornecedoresCadastro] = useState<
    Array<{ id: string; nome: string; cnpjCpf?: string }>
  >([]);
  const [loadingFornecedoresCadastro, setLoadingFornecedoresCadastro] = useState(false);
  const [erroFornecedoresCadastro, setErroFornecedoresCadastro] = useState<string | null>(null);
  const [contasBancariasCadastro, setContasBancariasCadastro] = useState<ContaBancaria[]>([]);
  const [loadingContasBancariasCadastro, setLoadingContasBancariasCadastro] = useState(false);
  const [erroContasBancariasCadastro, setErroContasBancariasCadastro] = useState<string | null>(
    null,
  );
  const [resumoFinanceiro, setResumoFinanceiro] = useState<ResumoFinanceiro | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalContaAberto, setModalContaAberto] = useState(false);
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
  const [modalExportacaoAberto, setModalExportacaoAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [contaReprovacaoSelecionada, setContaReprovacaoSelecionada] = useState<ContaPagar | null>(
    null,
  );
  const [processandoReprovacao, setProcessandoReprovacao] = useState(false);
  const [contaDetalhesSelecionada, setContaDetalhesSelecionada] = useState<ContaPagar | null>(null);
  const [comprovantePagamentoArquivo, setComprovantePagamentoArquivo] = useState<File | null>(null);
  const [exportando, setExportando] = useState(false);
  const [formatoExportacao, setFormatoExportacao] = useState<'csv' | 'xlsx'>('csv');
  const [statusExportacao, setStatusExportacao] = useState<FiltroStatusExportacaoUI>('todos');
  const [fornecedorExportacaoId, setFornecedorExportacaoId] = useState('');
  const [contaBancariaExportacaoId, setContaBancariaExportacaoId] = useState('');
  const [centroCustoExportacaoId, setCentroCustoExportacaoId] = useState('');
  const [dataVencimentoInicioExportacao, setDataVencimentoInicioExportacao] = useState('');
  const [dataVencimentoFimExportacao, setDataVencimentoFimExportacao] = useState('');
  const [dataEmissaoInicioExportacao, setDataEmissaoInicioExportacao] = useState('');
  const [dataEmissaoFimExportacao, setDataEmissaoFimExportacao] = useState('');
  const [tipoPagamentoSelecionado, setTipoPagamentoSelecionado] = useState<FormaPagamento>(
    FormaPagamento.PIX,
  );
  const [contaBancariaPagamentoId, setContaBancariaPagamentoId] = useState('');

  const [filtros] = useState<Record<string, never>>({});
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatusUI>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<FiltroCategoriaUI>('todas');
  const [contasSelecionadas, setContasSelecionadas] = useState<Set<string>>(new Set());

  useEffect(() => {
    void carregarDados();
  }, [filtros]);

  useEffect(() => {
    void carregarFornecedores();
    void carregarContasBancarias();
  }, []);

  useEffect(() => {
    setContasSelecionadas((prev) => {
      const ids = new Set(contas.map((c) => c.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (ids.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [contas]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      const [lista, resumo] = await Promise.all([
        contasPagarService.listar(),
        contasPagarService.obterResumo(),
      ]);
      setContas(lista);
      setResumoFinanceiro(resumo);
    } catch (err) {
      setError('Erro ao carregar dados das contas a pagar');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const carregarFornecedores = async () => {
    try {
      setLoadingFornecedoresCadastro(true);
      setErroFornecedoresCadastro(null);
      const fornecedores = await fornecedorService.buscarFornecedores({ ativo: true });
      setFornecedoresCadastro(
        fornecedores.map((fornecedor) => ({
          id: fornecedor.id,
          nome: fornecedor.nome,
          cnpjCpf: fornecedor.cnpjCpf,
        })),
      );
    } catch (err) {
      setFornecedoresCadastro([]);
      setErroFornecedoresCadastro(
        'Não foi possível carregar fornecedores para cadastro de contas.',
      );
      console.error('Erro ao carregar fornecedores para contas a pagar:', err);
    } finally {
      setLoadingFornecedoresCadastro(false);
    }
  };

  const carregarContasBancarias = async () => {
    try {
      setLoadingContasBancariasCadastro(true);
      setErroContasBancariasCadastro(null);
      const contasBancarias = await contaBancariaService.listarAtivas();
      setContasBancariasCadastro(contasBancarias);
    } catch (err) {
      setContasBancariasCadastro([]);
      setErroContasBancariasCadastro(
        'Nao foi possivel carregar contas bancarias para cadastro de contas.',
      );
      console.error('Erro ao carregar contas bancarias para contas a pagar:', err);
    } finally {
      setLoadingContasBancariasCadastro(false);
    }
  };

  const handleNovaConta = () => {
    setContaSelecionada(null);
    setModalContaAberto(true);
  };

  const handleEditarConta = (conta: ContaPagar) => {
    setContaSelecionada(conta);
    setModalContaAberto(true);
  };

  const handleRegistrarPagamento = (conta: ContaPagar) => {
    if (isContaAguardandoAprovacao(conta)) {
      toast.error('Conta aguardando aprovacao financeira antes do pagamento');
      return;
    }

    setContaSelecionada(conta);
    setComprovantePagamentoArquivo(null);
    setTipoPagamentoSelecionado(
      isFormaPagamento(conta.tipoPagamento) ? conta.tipoPagamento : FormaPagamento.PIX,
    );
    setContaBancariaPagamentoId(conta.contaBancariaId || '');
    setModalPagamentoAberto(true);
  };

  const handleAbrirDetalhes = (conta: ContaPagar) => {
    setContaDetalhesSelecionada(conta);
    setModalDetalhesAberto(true);
  };

  const handleFecharDetalhes = () => {
    setModalDetalhesAberto(false);
    setContaDetalhesSelecionada(null);
  };

  const handleExcluirConta = async (contaId: string) => {
    const conta = contas.find((c) => c.id === contaId);
    if (!conta) return;

    confirmacao.confirmar(
      'excluir-transacao',
      async () => {
        await contasPagarService.excluir(contaId);
        toast.success('Conta excluida com sucesso');
        await carregarDados();
      },
      {
        numero: conta.numero,
        valor: conta.valorTotal,
        cliente: conta.fornecedor?.nome,
        status: STATUS_LABELS[conta.status],
      },
    );
  };

  const handleAcaoMassa = async (acao: 'marcar_pago' | 'excluir') => {
    if (contasSelecionadas.size === 0) {
      toast.error('Selecione pelo menos uma conta');
      return;
    }

    if (acao === 'marcar_pago') {
      const selecionadas = contas.filter(
        (conta) =>
          contasSelecionadas.has(conta.id) &&
          conta.status !== StatusContaPagar.PAGO &&
          conta.status !== StatusContaPagar.CANCELADO &&
          !isContaAguardandoAprovacao(conta),
      );

      if (selecionadas.length === 0) {
        toast.error('Nenhuma conta selecionada esta apta para pagamento');
        return;
      }

      const resultados = await Promise.allSettled(
        selecionadas.map((conta) =>
          contasPagarService.registrarPagamento(conta.id, {
            contaId: conta.id,
            valorPago: conta.valorRestante || conta.valorTotal,
            dataPagamento: new Date().toISOString().slice(0, 10),
            tipoPagamento: FormaPagamento.PIX,
          }),
        ),
      );

      const sucesso = resultados.filter((r) => r.status === 'fulfilled').length;
      const falhas = resultados.length - sucesso;

      setContasSelecionadas(new Set());
      await carregarDados();
      if (falhas > 0) {
        toast.error(`${sucesso} conta(s) pagas e ${falhas} com erro`);
      } else {
        toast.success(`${sucesso} conta(s) marcadas como pagas`);
      }
      return;
    }

    confirmacao.confirmar(
      'excluir-categoria-financeira',
      async () => {
        const ids = Array.from(contasSelecionadas);
        const resultados = await Promise.allSettled(
          ids.map((id) => contasPagarService.excluir(id)),
        );
        const sucesso = resultados.filter((r) => r.status === 'fulfilled').length;
        const falhas = resultados.length - sucesso;
        setContasSelecionadas(new Set());
        await carregarDados();
        if (falhas > 0) {
          toast.error(`${sucesso} conta(s) excluidas e ${falhas} com erro`);
        } else {
          toast.success('Contas excluidas com sucesso');
        }
      },
      { quantidadeItens: contasSelecionadas.size },
    );
  };

  const handleSalvarConta = async (conta: NovaContaPagar) => {
    try {
      if (contaSelecionada) {
        await contasPagarService.atualizar(contaSelecionada.id, conta);
        toast.success('Conta atualizada com sucesso');
      } else {
        await contasPagarService.criar(conta);
        toast.success('Conta criada com sucesso');
      }
      setModalContaAberto(false);
      await carregarDados();
    } catch (err) {
      console.error('Erro ao salvar conta:', err);
      toast.error(getApiErrorMessage(err, 'Nao foi possivel salvar a conta'));
      throw err;
    }
  };

  const handleSalvarPagamento = async (pagamento: Partial<RegistrarPagamento> = {}) => {
    if (!contaSelecionada) return;

    try {
      const contaBancariaIdSelecionada = pagamento.contaBancariaId ?? contaBancariaPagamentoId;
      await contasPagarService.registrarPagamento(contaSelecionada.id, {
        contaId: contaSelecionada.id,
        valorPago:
          pagamento.valorPago || contaSelecionada.valorRestante || contaSelecionada.valorTotal,
        dataPagamento: pagamento.dataPagamento || new Date().toISOString().slice(0, 10),
        tipoPagamento: pagamento.tipoPagamento || tipoPagamentoSelecionado || FormaPagamento.PIX,
        contaBancariaId: contaBancariaIdSelecionada || undefined,
        observacoes: pagamento.observacoes,
        comprovante: pagamento.comprovante || comprovantePagamentoArquivo || undefined,
      });
      setModalPagamentoAberto(false);
      setComprovantePagamentoArquivo(null);
      setContaBancariaPagamentoId('');
      setTipoPagamentoSelecionado(FormaPagamento.PIX);
      toast.success('Pagamento registrado com sucesso');
      await carregarDados();
    } catch (err) {
      console.error('Erro ao registrar pagamento:', err);
      toast.error(getApiErrorMessage(err, 'Nao foi possivel registrar o pagamento'));
      throw err;
    }
  };

  const handleAprovarConta = async (conta: ContaPagar) => {
    try {
      await contasPagarService.aprovar(conta.id);
      toast.success('Conta aprovada com sucesso');
      await carregarDados();
    } catch (err) {
      console.error('Erro ao aprovar conta:', err);
      toast.error(getApiErrorMessage(err, 'Nao foi possivel aprovar a conta'));
    }
  };

  const handleReprovarConta = (conta: ContaPagar) => {
    setContaReprovacaoSelecionada(conta);
  };

  const fecharModalReprovacao = () => {
    if (processandoReprovacao) return;
    setContaReprovacaoSelecionada(null);
  };

  const confirmarReprovarConta = async (justificativa: string) => {
    if (!contaReprovacaoSelecionada) return;

    try {
      setProcessandoReprovacao(true);
      await contasPagarService.reprovar(contaReprovacaoSelecionada.id, {
        justificativa,
      });
      toast.success('Conta reprovada e cancelada');
      setContaReprovacaoSelecionada(null);
      await carregarDados();
    } catch (err) {
      console.error('Erro ao reprovar conta:', err);
      const mensagem = getApiErrorMessage(err, 'Nao foi possivel reprovar a conta');
      toast.error(mensagem);
      throw new Error(mensagem);
    } finally {
      setProcessandoReprovacao(false);
    }
  };

  const limparFiltrosExportacao = () => {
    setFormatoExportacao('csv');
    setStatusExportacao('todos');
    setFornecedorExportacaoId('');
    setContaBancariaExportacaoId('');
    setCentroCustoExportacaoId('');
    setDataVencimentoInicioExportacao('');
    setDataVencimentoFimExportacao('');
    setDataEmissaoInicioExportacao('');
    setDataEmissaoFimExportacao('');
  };

  const handleExportarContas = async () => {
    try {
      setExportando(true);
      const filtrosExportacao: FiltrosExportacaoContasPagar = {
        formato: formatoExportacao,
        status: statusExportacao === 'todos' ? undefined : [statusExportacao],
        fornecedorId: fornecedorExportacaoId || undefined,
        contaBancariaId: contaBancariaExportacaoId || undefined,
        centroCustoId: centroCustoExportacaoId || undefined,
        dataVencimentoInicio: dataVencimentoInicioExportacao || undefined,
        dataVencimentoFim: dataVencimentoFimExportacao || undefined,
        dataEmissaoInicio: dataEmissaoInicioExportacao || undefined,
        dataEmissaoFim: dataEmissaoFimExportacao || undefined,
      };

      const blob = await contasPagarService.exportar(filtrosExportacao);
      const extension = formatoExportacao === 'xlsx' ? 'xlsx' : 'csv';
      const dataRef = new Date().toISOString().slice(0, 10);
      const filename = `contas-pagar-${dataRef}.${extension}`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setModalExportacaoAberto(false);
      toast.success('Exportacao iniciada com sucesso');
    } catch (err) {
      console.error('Erro ao exportar contas a pagar:', err);
      toast.error(getApiErrorMessage(err, 'Nao foi possivel exportar contas a pagar'));
    } finally {
      setExportando(false);
    }
  };

  const contasFiltradas = useMemo(() => {
    const termo = termoBusca.trim().toLowerCase();
    return contas.filter((conta) => {
      if (filtroStatus !== 'todos' && conta.status !== filtroStatus) return false;
      if (filtroCategoria !== 'todas' && conta.categoria !== filtroCategoria) return false;
      if (!termo) return true;
      return (
        conta.numero.toLowerCase().includes(termo) ||
        conta.fornecedor.nome.toLowerCase().includes(termo) ||
        conta.descricao.toLowerCase().includes(termo) ||
        conta.numeroDocumento?.toLowerCase().includes(termo)
      );
    });
  }, [contas, termoBusca, filtroStatus, filtroCategoria]);

  const hasFilters =
    termoBusca.trim().length > 0 || filtroStatus !== 'todos' || filtroCategoria !== 'todas';
  const totalLista = contasFiltradas.length;
  const totalAberto = contas.filter((c) => c.status === StatusContaPagar.EM_ABERTO).length;
  const totalPago = contas.filter((c) => c.status === StatusContaPagar.PAGO).length;
  const totalVencido = contas.filter((c) => c.status === StatusContaPagar.VENCIDO).length;
  const valorLista = contasFiltradas.reduce((acc, conta) => acc + (conta.valorTotal || 0), 0);

  const selecionadasVisiveis = contasFiltradas.filter((c) => contasSelecionadas.has(c.id)).length;
  const allVisibleSelected = totalLista > 0 && selecionadasVisiveis === totalLista;
  const partialVisibleSelected = selecionadasVisiveis > 0 && selecionadasVisiveis < totalLista;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = partialVisibleSelected;
    }
  }, [partialVisibleSelected, totalLista, allVisibleSelected]);

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
        contasFiltradas.forEach((conta) => next.delete(conta.id));
      } else {
        contasFiltradas.forEach((conta) => next.add(conta.id));
      }
      return next;
    });
  };

  const limparFiltros = () => {
    setTermoBusca('');
    setFiltroStatus('todos');
    setFiltroCategoria('todas');
  };

  const limparSelecao = () => setContasSelecionadas(new Set());

  const getPrazoFlags = (conta: ContaPagar) => {
    const hoje = new Date();
    const venc = new Date(conta.dataVencimento);
    const vencida = venc.getTime() < hoje.getTime() && conta.status === StatusContaPagar.EM_ABERTO;
    const venceHoje = sameDay(venc, hoje) && conta.status === StatusContaPagar.EM_ABERTO;
    return { vencida, venceHoje };
  };

  const renderRowActions = (conta: ContaPagar) => (
    <div className="flex items-center gap-1">
      {isContaAguardandoAprovacao(conta) ? (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void handleAprovarConta(conta);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#137A42] hover:bg-[#F1FBF5]"
            title="Aprovar conta"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void handleReprovarConta(conta);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#B4233A] hover:bg-[#FFF2F4]"
            title="Reprovar conta"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      ) : null}
      {conta.status === StatusContaPagar.EM_ABERTO && !isContaAguardandoAprovacao(conta) ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleRegistrarPagamento(conta);
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#137A42] hover:bg-[#F1FBF5]"
          title="Registrar pagamento"
        >
          <CreditCard className="h-4 w-4" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          handleEditarConta(conta);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#159A9C] hover:bg-[#ECF7F3]"
        title="Editar"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          void handleExcluirConta(conta.id);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#B4233A] hover:bg-[#FFF2F4]"
        title="Excluir"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className={`space-y-4 pt-1 sm:pt-2 ${className || ''}`}>
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title={<span>Contas a Pagar</span>}
          description={
            loading
              ? 'Carregando contas a pagar...'
              : `Gerencie ${totalLista} obrigacoes financeiras na lista atual.`
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void carregarDados()}
                className={btnSecondary}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button
                type="button"
                onClick={() => setModalExportacaoAberto(true)}
                className={btnSecondary}
                disabled={loading || !contas.length}
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>
              <button type="button" onClick={handleNovaConta} className={btnPrimary}>
                <CreditCard className="h-4 w-4" />
                Nova Conta
              </button>
            </div>
          }
        />

        {!loading && !error && resumoFinanceiro ? (
          <InlineStats
            stats={[
              {
                label: 'Vencendo hoje',
                value: moneyFmt.format(resumoFinanceiro.totalVencendoHoje),
                tone: 'warning',
              },
              {
                label: 'Total do mes',
                value: moneyFmt.format(resumoFinanceiro.totalMes),
                tone: 'neutral',
              },
              {
                label: 'Atrasado',
                value: moneyFmt.format(resumoFinanceiro.totalAtrasado),
                tone: 'warning',
              },
              {
                label: 'Pago no mes',
                value: moneyFmt.format(resumoFinanceiro.totalPagoMes),
                tone: 'accent',
              },
              { label: 'Em aberto', value: String(totalAberto), tone: 'warning' },
              { label: 'Pagas', value: String(totalPago), tone: 'accent' },
              { label: 'Vencidas', value: String(totalVencido), tone: 'warning' },
              { label: 'Valor da lista', value: moneyFmt.format(valorLista), tone: 'neutral' },
            ]}
          />
        ) : null}
      </SectionCard>

      <FiltersBar className="p-4">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full sm:min-w-[300px] sm:flex-1">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Buscar contas</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AAEB8]" />
              <input
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="Número, fornecedor, descrição, documento..."
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white pl-10 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              />
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as FiltroStatusUI)}
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 sm:w-[180px]"
            >
              <option value="todos">Todos</option>
              <option value={StatusContaPagar.EM_ABERTO}>Em aberto</option>
              <option value={StatusContaPagar.PAGO}>Pago</option>
              <option value={StatusContaPagar.VENCIDO}>Vencido</option>
              <option value={StatusContaPagar.AGENDADO}>Agendado</option>
              <option value={StatusContaPagar.CANCELADO}>Cancelado</option>
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Categoria</label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value as FiltroCategoriaUI)}
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 sm:w-[190px]"
            >
              <option value="todas">Todas</option>
              {Object.values(CategoriaContaPagar).map((categoria) => (
                <option key={categoria} value={categoria}>
                  {CATEGORIA_LABELS[categoria]}
                </option>
              ))}
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
              Limpar
            </button>
          </div>
        </div>
      </FiltersBar>

      {contasSelecionadas.size > 0 ? (
        <SectionCard className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-3 py-1 font-semibold text-[#0F7B7D]">
                <CheckCircle className="h-4 w-4" />
                {contasSelecionadas.size} selecionada{contasSelecionadas.size === 1 ? '' : 's'}
              </span>
              {selecionadasVisiveis !== contasSelecionadas.size ? (
                <span className="text-xs text-[#64808E]">
                  {selecionadasVisiveis} visiveis na lista atual
                </span>
              ) : null}
              <button type="button" onClick={limparSelecao} className={btnSecondary}>
                <X className="h-4 w-4" />
                Limpar selecao
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void handleAcaoMassa('marcar_pago')}
                className={btnSuccess}
              >
                <Check className="h-4 w-4" />
                Marcar pago
              </button>
              <button
                type="button"
                onClick={() => void handleAcaoMassa('excluir')}
                className={btnDanger}
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {loading ? <LoadingSkeleton lines={8} /> : null}

      {!loading && error ? (
        <EmptyState
          icon={<AlertTriangle className="h-5 w-5" />}
          title="Erro ao carregar contas a pagar"
          description={error}
          action={
            <button type="button" onClick={() => void carregarDados()} className={btnPrimary}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          }
        />
      ) : null}

      {!loading && !error && contas.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-5 w-5" />}
          title="Nenhuma conta cadastrada"
          description="Crie uma conta a pagar para iniciar o fluxo financeiro."
          action={
            <button type="button" onClick={handleNovaConta} className={btnPrimary}>
              <CreditCard className="h-4 w-4" />
              Nova conta
            </button>
          }
        />
      ) : null}

      {!loading && !error && contas.length > 0 && contasFiltradas.length === 0 ? (
        <EmptyState
          icon={<Search className="h-5 w-5" />}
          title="Nenhuma conta encontrada"
          description="Ajuste ou limpe os filtros para visualizar outras contas."
          action={
            <button type="button" onClick={limparFiltros} className={btnSecondary}>
              <Filter className="h-4 w-4" />
              Limpar filtros
            </button>
          }
        />
      ) : null}

      {!loading && !error && contasFiltradas.length > 0 ? (
        <DataTableCard>
          <div className="flex flex-col gap-3 border-b border-[#E1EAEE] bg-[#F8FBFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[#516F7D]">
              <span>
                {contasFiltradas.length} registro{contasFiltradas.length === 1 ? '' : 's'}
              </span>
              {hasFilters ? (
                <span className="rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-2 py-0.5 text-xs font-medium text-[#0F7B7D]">
                  filtrados
                </span>
              ) : null}
              {contasSelecionadas.size > 0 ? (
                <span className="rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-2 py-0.5 text-xs font-semibold text-[#0F7B7D]">
                  {contasSelecionadas.size} selecionada{contasSelecionadas.size === 1 ? '' : 's'}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleSelecionarTodasVisiveis}
                className={btnSecondary}
              >
                <CheckCircle className="h-4 w-4" />
                {allVisibleSelected ? 'Desmarcar visiveis' : 'Selecionar visiveis'}
              </button>
            </div>
          </div>

          <div className="p-4 lg:hidden">
            <div className="grid grid-cols-1 gap-3">
              {contasFiltradas.map((conta) => {
                const prazo = getPrazoFlags(conta);
                const destaque = prazo.vencida
                  ? 'border-[#F4C7CF] bg-[#FFF9FA]'
                  : prazo.venceHoje
                    ? 'border-[#F9D9AA] bg-[#FFFBF4]'
                    : 'border-[#DFE9ED] bg-white';

                return (
                  <article
                    key={conta.id}
                    className={`cursor-pointer rounded-xl border p-4 shadow-[0_10px_22px_-20px_rgba(15,57,74,0.4)] ${destaque}`}
                    onClick={() => handleAbrirDetalhes(conta)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={contasSelecionadas.has(conta.id)}
                            onChange={() => toggleSelecionarConta(conta.id)}
                            onClick={(event) => event.stopPropagation()}
                            className="h-4 w-4 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                            aria-label={`Selecionar conta ${conta.numero}`}
                          />
                          <span className="text-sm font-semibold text-[#173A4D]">
                            {conta.numero}
                          </span>
                          {conta.recorrente ? (
                            <span className="inline-flex items-center rounded-full border border-[#E6D6FF] bg-[#F7F0FF] px-2 py-0.5 text-[11px] font-semibold text-[#6A3FB3]">
                              Recorrente
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-sm font-medium text-[#173A4D]">
                          {conta.fornecedor.nome}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-[#64808E]">
                          {conta.descricao}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        {getStatusBadge(conta.status)}
                        {isContaAguardandoAprovacao(conta) ? getAprovacaoBadge() : null}
                        {getPrioridadeBadge(conta.prioridade)}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                      <div className="rounded-lg border border-[#EDF3F5] bg-[#FAFCFD] px-3 py-2">
                        <div className="flex items-center gap-2 text-[#5F7B89]">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-xs uppercase tracking-wide">Valor</span>
                        </div>
                        <p className="mt-1 font-semibold text-[#173A4D]">
                          {moneyFmt.format(conta.valorTotal)}
                        </p>
                        {conta.valorPago > 0 ? (
                          <p className="text-xs text-[#137A42]">
                            Pago: {moneyFmt.format(conta.valorPago)}
                          </p>
                        ) : null}
                      </div>
                      <div className="rounded-lg border border-[#EDF3F5] bg-[#FAFCFD] px-3 py-2">
                        <div className="flex items-center gap-2 text-[#5F7B89]">
                          <Calendar className="h-4 w-4" />
                          <span className="text-xs uppercase tracking-wide">Vencimento</span>
                        </div>
                        <p
                          className={`mt-1 font-medium ${prazo.vencida ? 'text-[#B4233A]' : prazo.venceHoje ? 'text-[#A86400]' : 'text-[#173A4D]'}`}
                        >
                          {formatDate(conta.dataVencimento)}
                        </p>
                        {prazo.vencida ? <p className="text-xs text-[#B4233A]">Vencida</p> : null}
                        {prazo.venceHoje ? (
                          <p className="text-xs text-[#A86400]">Vence hoje</p>
                        ) : null}
                      </div>
                    </div>

                    <div
                      className="mt-3 flex justify-end border-t border-[#EDF3F5] pt-3"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {renderRowActions(conta)}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full min-w-[1180px] border-collapse">
                <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#E1EAEE]">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelecionarTodasVisiveis}
                        className="h-4 w-4 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                        aria-label="Selecionar contas visiveis"
                      />
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Conta
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Fornecedor
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Descrição
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
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Status
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {contasFiltradas.map((conta) => {
                    const prazo = getPrazoFlags(conta);
                    return (
                      <tr
                        key={conta.id}
                        className={`cursor-pointer border-t border-[#EDF3F5] hover:bg-[#FAFCFD] ${prazo.vencida ? 'bg-[#FFF9FA]' : prazo.venceHoje ? 'bg-[#FFFBF4]' : ''}`}
                        onClick={() => handleAbrirDetalhes(conta)}
                      >
                        <td className="px-4 py-4 align-top">
                          <input
                            type="checkbox"
                            checked={contasSelecionadas.has(conta.id)}
                            onChange={() => toggleSelecionarConta(conta.id)}
                            onClick={(event) => event.stopPropagation()}
                            className="h-4 w-4 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                            aria-label={`Selecionar conta ${conta.numero}`}
                          />
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="text-sm font-semibold text-[#173A4D]">{conta.numero}</div>
                          {conta.recorrente ? (
                            <span className="mt-1 inline-flex items-center rounded-full border border-[#E6D6FF] bg-[#F7F0FF] px-2 py-0.5 text-[11px] font-semibold text-[#6A3FB3]">
                              Recorrente
                            </span>
                          ) : null}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="text-sm font-medium text-[#173A4D]">
                            {conta.fornecedor.nome}
                          </div>
                          <div className="mt-0.5 text-xs text-[#64808E]">
                            {conta.fornecedor.cnpjCpf}
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div
                            className="max-w-[240px] truncate text-sm text-[#173A4D]"
                            title={conta.descricao}
                          >
                            {conta.descricao}
                          </div>
                          {conta.numeroDocumento ? (
                            <div className="mt-0.5 text-xs text-[#64808E]">
                              Doc: {conta.numeroDocumento}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-5 py-4 align-top text-sm text-[#173A4D]">
                          {CATEGORIA_LABELS[conta.categoria] || conta.categoria}
                        </td>
                        <td className="px-5 py-4 align-top">
                          {getPrioridadeBadge(conta.prioridade)}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div
                            className={`text-sm ${prazo.vencida ? 'font-semibold text-[#B4233A]' : prazo.venceHoje ? 'font-semibold text-[#A86400]' : 'text-[#173A4D]'}`}
                          >
                            {formatDate(conta.dataVencimento)}
                          </div>
                          {prazo.vencida ? (
                            <div className="text-xs text-[#B4233A]">Vencida</div>
                          ) : null}
                          {prazo.venceHoje ? (
                            <div className="text-xs text-[#A86400]">Vence hoje</div>
                          ) : null}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="text-sm font-semibold text-[#173A4D]">
                            {moneyFmt.format(conta.valorTotal)}
                          </div>
                          {conta.valorPago > 0 ? (
                            <div className="text-xs text-[#137A42]">
                              Pago: {moneyFmt.format(conta.valorPago)}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex flex-col items-start gap-1">
                            {getStatusBadge(conta.status)}
                            {isContaAguardandoAprovacao(conta) ? getAprovacaoBadge() : null}
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div
                            className="flex justify-end"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {renderRowActions(conta)}
                          </div>
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

      {modalContaAberto ? (
        <ModalContaPagar
          conta={contaSelecionada}
          fornecedores={fornecedoresCadastro}
          fornecedoresLoading={loadingFornecedoresCadastro}
          fornecedoresError={erroFornecedoresCadastro}
          contasBancarias={contasBancariasCadastro}
          contasBancariasLoading={loadingContasBancariasCadastro}
          contasBancariasError={erroContasBancariasCadastro}
          onClose={() => setModalContaAberto(false)}
          onSave={handleSalvarConta}
        />
      ) : null}

      {modalDetalhesAberto && contaDetalhesSelecionada ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#072433]/55 p-4 backdrop-blur-[1px]">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#DCE7EB] bg-white shadow-[0_30px_60px_-30px_rgba(7,36,51,0.55)]">
            <div className="flex items-center justify-between border-b border-[#E5EEF2] px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Detalhes da conta a pagar</h2>
                <p className="mt-1 text-sm text-[#607B89]">{contaDetalhesSelecionada.numero}</p>
              </div>
              <button
                type="button"
                onClick={handleFecharDetalhes}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-[#F3F8FA] hover:text-gray-600"
                aria-label="Fechar modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid gap-3 px-6 py-5 sm:px-7 sm:grid-cols-2">
              <div className="rounded-xl border border-[#E3EDF1] bg-[#FAFCFD] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                  Fornecedor
                </p>
                <p className="mt-1 text-sm font-semibold text-[#1D3B4D]">
                  {contaDetalhesSelecionada.fornecedor.nome}
                </p>
              </div>
              <div className="rounded-xl border border-[#E3EDF1] bg-[#FAFCFD] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6A8795]">Status</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {getStatusBadge(contaDetalhesSelecionada.status)}
                  {isContaAguardandoAprovacao(contaDetalhesSelecionada) ? getAprovacaoBadge() : null}
                </div>
              </div>
              <div className="rounded-xl border border-[#E3EDF1] bg-[#FAFCFD] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6A8795]">Aprovacao</p>
                <p className="mt-1 text-sm text-[#1D3B4D]">
                  {contaDetalhesSelecionada.dataAprovacao
                    ? `Aprovada em ${formatDate(contaDetalhesSelecionada.dataAprovacao)}`
                    : contaDetalhesSelecionada.necessitaAprovacao
                      ? 'Pendente de aprovacao'
                      : 'Nao requerida'}
                </p>
                {contaDetalhesSelecionada.aprovadoPor ? (
                  <p className="mt-1 text-xs text-[#64808E]">
                    Responsavel: {contaDetalhesSelecionada.aprovadoPor}
                  </p>
                ) : null}
              </div>
              <div className="rounded-xl border border-[#E3EDF1] bg-[#FAFCFD] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                  Descrição
                </p>
                <p className="mt-1 text-sm text-[#1D3B4D]">{contaDetalhesSelecionada.descricao}</p>
                {contaDetalhesSelecionada.numeroDocumento ? (
                  <>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                      Documento
                    </p>
                    <p className="mt-1 text-sm text-[#1D3B4D]">
                      {contaDetalhesSelecionada.numeroDocumento}
                    </p>
                  </>
                ) : null}
              </div>
              <div className="rounded-xl border border-[#E3EDF1] bg-[#FAFCFD] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                  Categoria
                </p>
                <p className="mt-1 text-sm font-semibold text-[#1D3B4D]">
                  {CATEGORIA_LABELS[contaDetalhesSelecionada.categoria] ||
                    contaDetalhesSelecionada.categoria}
                </p>
              </div>
              <div className="rounded-xl border border-[#E3EDF1] bg-[#FAFCFD] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                  Prioridade
                </p>
                <div className="mt-1">{getPrioridadeBadge(contaDetalhesSelecionada.prioridade)}</div>
              </div>
              <div className="rounded-xl border border-[#E3EDF1] bg-[#FAFCFD] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                  Forma de pagamento
                </p>
                <p className="mt-1 text-sm font-semibold text-[#1D3B4D]">
                  {contaDetalhesSelecionada.tipoPagamento
                    ? FORMA_PAGAMENTO_LABELS[contaDetalhesSelecionada.tipoPagamento]
                    : '-'}
                </p>
              </div>
              <div className="rounded-xl border border-[#E3EDF1] bg-[#FAFCFD] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6A8795]">Datas</p>
                <p className="mt-2 text-sm text-[#1D3B4D]">
                  Emissão: {formatDate(contaDetalhesSelecionada.dataEmissao)}
                </p>
                <p className="mt-1 text-sm text-[#1D3B4D]">
                  Vencimento: {formatDate(contaDetalhesSelecionada.dataVencimento)}
                </p>
                <p className="mt-1 text-sm text-[#1D3B4D]">
                  Pagamento: {formatDate(contaDetalhesSelecionada.dataPagamento)}
                </p>
              </div>
              <div className="rounded-xl border border-[#E3EDF1] bg-[#FAFCFD] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                  Valores
                </p>
                <p className="mt-2 text-sm text-[#1D3B4D]">
                  Original: {moneyFmt.format(contaDetalhesSelecionada.valorOriginal || 0)}
                </p>
                <p className="mt-1 text-sm text-[#1D3B4D]">
                  Desconto: {moneyFmt.format(contaDetalhesSelecionada.valorDesconto || 0)}
                </p>
                <p className="mt-1 text-sm text-[#1D3B4D]">
                  Pago: {moneyFmt.format(contaDetalhesSelecionada.valorPago || 0)}
                </p>
                <p className="mt-2 text-base font-bold text-[#173A4D]">
                  Total: {moneyFmt.format(contaDetalhesSelecionada.valorTotal || 0)}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#E5EEF2] px-6 py-4">
              <button type="button" onClick={handleFecharDetalhes} className={btnSecondary}>
                Fechar
              </button>
              {contaDetalhesSelecionada.status === StatusContaPagar.EM_ABERTO &&
              !isContaAguardandoAprovacao(contaDetalhesSelecionada) ? (
                <button
                  type="button"
                  onClick={() => {
                    handleFecharDetalhes();
                    handleRegistrarPagamento(contaDetalhesSelecionada);
                  }}
                  className={btnSuccess}
                >
                  Registrar pagamento
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  handleFecharDetalhes();
                  handleEditarConta(contaDetalhesSelecionada);
                }}
                className={btnPrimary}
              >
                Editar conta
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modalPagamentoAberto && contaSelecionada ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[#DCE8EC] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E1EAEE] px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-[#173A4D]">
                <CreditCard className="h-5 w-5" />
                Registrar pagamento
              </h2>
              <button
                type="button"
                onClick={() => {
                  setModalPagamentoAberto(false);
                  setComprovantePagamentoArquivo(null);
                  setContaBancariaPagamentoId('');
                  setTipoPagamentoSelecionado(FormaPagamento.PIX);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5E7A88] hover:bg-[#F2F7F8]"
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 px-6 py-5">
              <div className="rounded-xl border border-[#E8EFF2] bg-[#FAFCFD] p-4">
                <p className="text-sm text-[#64808E]">Conta: {contaSelecionada.numero}</p>
                <p className="mt-1 text-sm text-[#64808E]">
                  Fornecedor: {contaSelecionada.fornecedor.nome}
                </p>
                <p className="mt-2 text-lg font-semibold text-[#B4233A]">
                  Valor restante: {moneyFmt.format(contaSelecionada.valorRestante)}
                </p>
              </div>
              <p className="text-sm text-[#64808E]">
                Esta ação registra o pagamento integral da conta com os dados padrão desta tela.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#E8EFF2] bg-white p-4">
                  <label className="mb-2 block text-sm font-medium text-[#244455]">
                    Forma de pagamento
                  </label>
                  <select
                    value={tipoPagamentoSelecionado}
                    onChange={(e) => setTipoPagamentoSelecionado(e.target.value as FormaPagamento)}
                    className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                  >
                    {Object.entries(FORMA_PAGAMENTO_LABELS).map(([valor, label]) => (
                      <option key={valor} value={valor}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-xl border border-[#E8EFF2] bg-white p-4">
                  <label className="mb-2 block text-sm font-medium text-[#244455]">
                    Conta bancaria
                  </label>
                  {loadingContasBancariasCadastro ? (
                    <p className="mb-2 text-xs text-[#64808E]">Carregando contas bancarias...</p>
                  ) : null}
                  {erroContasBancariasCadastro ? (
                    <p className="mb-2 text-xs text-amber-700">{erroContasBancariasCadastro}</p>
                  ) : null}
                  <select
                    value={contaBancariaPagamentoId}
                    onChange={(e) => setContaBancariaPagamentoId(e.target.value)}
                    disabled={loadingContasBancariasCadastro}
                    className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 disabled:cursor-not-allowed disabled:bg-[#F4F8FA]"
                  >
                    <option value="">Selecionar conta (opcional)</option>
                    {contasBancariasCadastro.map((contaBancaria) => (
                      <option key={contaBancaria.id} value={contaBancaria.id}>
                        {contaBancaria.nome} - {contaBancaria.banco}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="rounded-xl border border-[#E8EFF2] bg-white p-4">
                <label className="mb-2 block text-sm font-medium text-[#244455]">
                  Comprovante (opcional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setComprovantePagamentoArquivo(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-[#5E7A88] file:mr-3 file:rounded-lg file:border-0 file:bg-[#ECF7F3] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#0F7B7D] hover:file:bg-[#DFF2EC]"
                />
                {comprovantePagamentoArquivo ? (
                  <p className="mt-2 text-xs text-[#5E7A88]">
                    Selecionado: {comprovantePagamentoArquivo.name}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[#E1EAEE] px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setModalPagamentoAberto(false);
                  setComprovantePagamentoArquivo(null);
                  setContaBancariaPagamentoId('');
                  setTipoPagamentoSelecionado(FormaPagamento.PIX);
                }}
                className={btnSecondary}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() =>
                  void handleSalvarPagamento({
                    tipoPagamento: tipoPagamentoSelecionado,
                    contaBancariaId: contaBancariaPagamentoId || undefined,
                  })
                }
                className={btnPrimary}
              >
                <Check className="h-4 w-4" />
                Registrar pagamento
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modalExportacaoAberto ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-[#DCE8EC] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E1EAEE] px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-[#173A4D]">
                <Download className="h-5 w-5" />
                Exportar contas a pagar
              </h2>
              <button
                type="button"
                onClick={() => {
                  if (!exportando) setModalExportacaoAberto(false);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5E7A88] hover:bg-[#F2F7F8]"
                aria-label="Fechar modal de exportacao"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#244455]">Formato</label>
                <select
                  value={formatoExportacao}
                  onChange={(event) => setFormatoExportacao(event.target.value as 'csv' | 'xlsx')}
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                >
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel (XLSX)</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#244455]">Status</label>
                <select
                  value={statusExportacao}
                  onChange={(event) => setStatusExportacao(event.target.value as FiltroStatusExportacaoUI)}
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                >
                  <option value="todos">Todos</option>
                  <option value={StatusContaPagar.EM_ABERTO}>Em aberto</option>
                  <option value={StatusContaPagar.PAGO}>Pago</option>
                  <option value={StatusContaPagar.VENCIDO}>Vencido</option>
                  <option value={StatusContaPagar.CANCELADO}>Cancelado</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#244455]">Fornecedor</label>
                <select
                  value={fornecedorExportacaoId}
                  onChange={(event) => setFornecedorExportacaoId(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                >
                  <option value="">Todos</option>
                  {fornecedoresCadastro.map((fornecedor) => (
                    <option key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#244455]">Conta bancaria</label>
                <select
                  value={contaBancariaExportacaoId}
                  onChange={(event) => setContaBancariaExportacaoId(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                >
                  <option value="">Todas</option>
                  {contasBancariasCadastro.map((contaBancaria) => (
                    <option key={contaBancaria.id} value={contaBancaria.id}>
                      {contaBancaria.nome} - {contaBancaria.banco}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#244455]">Centro de custo</label>
                <input
                  type="text"
                  value={centroCustoExportacaoId}
                  onChange={(event) => setCentroCustoExportacaoId(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                  placeholder="ID do centro de custo (opcional)"
                />
              </div>

              <div />

              <div>
                <label className="mb-2 block text-sm font-medium text-[#244455]">
                  Vencimento de
                </label>
                <input
                  type="date"
                  value={dataVencimentoInicioExportacao}
                  onChange={(event) => setDataVencimentoInicioExportacao(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#244455]">
                  Vencimento ate
                </label>
                <input
                  type="date"
                  value={dataVencimentoFimExportacao}
                  onChange={(event) => setDataVencimentoFimExportacao(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#244455]">Emissao de</label>
                <input
                  type="date"
                  value={dataEmissaoInicioExportacao}
                  onChange={(event) => setDataEmissaoInicioExportacao(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#244455]">Emissao ate</label>
                <input
                  type="date"
                  value={dataEmissaoFimExportacao}
                  onChange={(event) => setDataEmissaoFimExportacao(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                />
              </div>
            </div>

            <div className="flex justify-between gap-3 border-t border-[#E1EAEE] px-6 py-4">
              <button
                type="button"
                onClick={limparFiltrosExportacao}
                className={btnSecondary}
                disabled={exportando}
              >
                Limpar filtros
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalExportacaoAberto(false)}
                  className={btnSecondary}
                  disabled={exportando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleExportarContas()}
                  className={btnPrimary}
                  disabled={exportando}
                >
                  {exportando ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {exportando ? 'Exportando...' : 'Baixar arquivo'}
                </button>
              </div>
            </div>
          </div>
        </div>
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

      <ModalJustificativa
        isOpen={Boolean(contaReprovacaoSelecionada)}
        title="Reprovar conta"
        description={
          contaReprovacaoSelecionada
            ? `Informe a justificativa para reprovar a conta ${contaReprovacaoSelecionada.numero}.`
            : undefined
        }
        placeholder="Explique o motivo da reprovacao desta conta."
        confirmLabel="Reprovar conta"
        minLength={3}
        loading={processandoReprovacao}
        onClose={fecharModalReprovacao}
        onConfirm={confirmarReprovarConta}
      />
    </div>
  );
};

export default ContasPagarPage;
