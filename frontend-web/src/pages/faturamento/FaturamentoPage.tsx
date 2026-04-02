import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  FileText,
  DollarSign,
  Download,
  MoreVertical,
  Send,
  Link2,
  Copy,
  ExternalLink,
  Calendar,
  Activity,
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Building2,
  ChevronUp,
  ChevronDown,
  X,
  Loader2,
  BarChart3,
  Mail,
  CreditCard,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  faturamentoService,
  Fatura,
  NovaFatura,
  FormaPagamento,
  StatusFatura,
  TipoFatura,
  FiltrosFatura,
  ProntidaoCobranca,
} from '../../services/faturamentoService';
import ModalFatura from './ModalFatura';
import ModalDetalhesFatura from './ModalDetalhesFatura';
import ModalPagamentos from './ModalPagamentos';
import NotificacoesFaturamento from '../../components/notificacoes/NotificacoesFaturamento';
import SkeletonTable from '../../components/skeleton/SkeletonTable';
import RelatoriosAvancados from '../../components/analytics/RelatoriosAvancados';
import EmailAutomacao, {
  EnvioEmailAutomacaoPayload,
  ResultadoEnvioEmailAutomacao,
} from '../../components/email/EmailAutomacao';
import GatewayPagamento from '../../components/pagamento/GatewayPagamento';
import WorkflowAutomacao, { WorkflowExecutionResult } from '../../components/automacao/WorkflowAutomacao';
import { useFaturasPaginadas } from '../../hooks/useFaturasPaginadas';
import { useDebounce } from 'use-debounce';
import { obterNomeCliente, obterEmailCliente } from '../../utils/formatacao';
import ModalConfirmacao from '../../components/common/ModalConfirmacao';
import {
  useConfirmacaoInteligente,
  useValidacaoFinanceira,
} from '../../hooks/useConfirmacaoInteligente';
import NotificacaoSucesso from '../../components/common/NotificacaoSucesso';
import { useNotificacaoFinanceira } from '../../hooks/useNotificacao';
import { getPagamentosGatewayUiConfig } from '../../config/pagamentosGatewayFlags';
import {
  DataTableCard,
  FiltersBar,
  InlineStats,
  PageHeader,
  SectionCard,
} from '../../components/layout-v2';
import { exportToCSV, exportToExcel, ExportColumn } from '../../utils/exportUtils';

interface DashboardCards {
  totalFaturas: number;
  faturasVencidas: number;
  valorTotalPendente: number;
  valorTotalPago: number;
  faturasPagas: number;
  faturasDoMes: number;
}

type WorkflowConfig = Record<string, unknown>;

type PagamentoFormulario = {
  valor: number;
  data: string;
  metodo: string;
  observacoes?: string;
};

type StatusProntidao = 'ok' | 'alerta' | 'bloqueio';

const STATUS_BLOQUEIO_ACOES_FINANCEIRAS: StatusFatura[] = [
  StatusFatura.PAGA,
  StatusFatura.CANCELADA,
];
const STATUS_ELEGIVEIS_COBRANCA: StatusFatura[] = [
  StatusFatura.PENDENTE,
  StatusFatura.ENVIADA,
  StatusFatura.PARCIALMENTE_PAGA,
  StatusFatura.VENCIDA,
];

export default function FaturamentoPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const faturaIdParam = searchParams.get('faturaId');
  const clienteIdParam = (searchParams.get('clienteId') || '').trim();
  const clienteNomeParam = (searchParams.get('cliente') || '').trim();
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [modalPagamentosAberto, setModalPagamentosAberto] = useState(false);
  const [faturaEdicao, setFaturaEdicao] = useState<Fatura | null>(null);
  const [faturaDetalhes, setFaturaDetalhes] = useState<Fatura | null>(null);
  const [faturaPagamentos, setFaturaPagamentos] = useState<Fatura | null>(null);
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState<FiltrosFatura>({ periodoCampo: 'vencimento' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<string>('dataVencimento');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [aggregates, setAggregates] = useState<{
    valorTotal?: number;
    valorRecebido?: number;
    valorEmAberto?: number;
  }>({});
  const [buscaDebounced] = useDebounce(busca, 500);

  useEffect(() => {
    if (clienteNomeParam && !busca.trim()) {
      setBusca(clienteNomeParam);
    }
  }, [clienteNomeParam, busca]);

  useEffect(() => {
    if (!clienteIdParam) {
      return;
    }

    const clienteIdNumerico = Number(clienteIdParam);
    if (!Number.isInteger(clienteIdNumerico) || clienteIdNumerico <= 0) {
      return;
    }

    setFiltros((prev) => {
      if (prev.clienteId === clienteIdNumerico) {
        return prev;
      }

      return {
        ...prev,
        clienteId: clienteIdNumerico,
      };
    });
  }, [clienteIdParam]);

  // Estados para seleção múltipla
  const [faturasSelecionadas, setFaturasSelecionadas] = useState<number[]>([]);
  const [mostrarAcoesMassa, setMostrarAcoesMassa] = useState(false);
  const [processandoAcaoMassa, setProcessandoAcaoMassa] = useState(false);
  const [progressoAcaoMassa, setProgressoAcaoMassa] = useState(0);
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
  const [menuAcoesAbertoId, setMenuAcoesAbertoId] = useState<number | null>(null);

  // Estado para loading e skeleton

  // Estados para funcionalidades avançadas da Semana 2
  const [faturaGateway, setFaturaGateway] = useState<Fatura | null>(null);
  const [visaoAtiva, setVisaoAtiva] = useState<
    'dashboard' | 'prontidao' | 'relatorios' | 'email' | 'workflows'
  >('dashboard');

  const [dashboardCards, setDashboardCards] = useState<DashboardCards>({
    totalFaturas: 0,
    faturasVencidas: 0,
    valorTotalPendente: 0,
    valorTotalPago: 0,
    faturasPagas: 0,
    faturasDoMes: 0,
  });
  const [prontidaoCobranca, setProntidaoCobranca] = useState<ProntidaoCobranca | null>(null);
  const [carregandoProntidaoCobranca, setCarregandoProntidaoCobranca] = useState(false);
  const [erroProntidaoCobranca, setErroProntidaoCobranca] = useState<string | null>(null);

  // Hooks para confirmação inteligente
  const confirmacao = useConfirmacaoInteligente();
  const validacao = useValidacaoFinanceira();
  const notificacao = useNotificacaoFinanceira();
  const gatewayUiConfig = getPagamentosGatewayUiConfig();
  const gatewayFlagHabilitada = gatewayUiConfig.onlineGatewayUiEnabled;
  const linkFlagHabilitado = gatewayUiConfig.paymentLinkEnabled;
  const gatewayBackendOperacional = prontidaoCobranca?.prontoParaCobrancaOnline ?? true;
  const emailCobrancaOperacional = prontidaoCobranca?.prontoParaCobrancaPorEmail ?? true;
  const gatewayUiHabilitada = gatewayFlagHabilitada && gatewayBackendOperacional;
  const linkPagamentoHabilitado = linkFlagHabilitado && gatewayBackendOperacional;
  const motivoBloqueioGateway =
    prontidaoCobranca?.gateway?.detalhe ||
    gatewayUiConfig.motivoBloqueio ||
    'Gateway indisponivel no ambiente atual.';
  const motivoBloqueioEmailCobranca =
    prontidaoCobranca?.email?.detalhe || 'Envio de cobranca por e-mail indisponivel.';
  const cobrancaOnlineOperacional = gatewayUiHabilitada && linkPagamentoHabilitado;
  const fallbackOperacionalCobranca =
    prontidaoCobranca?.recomendacaoOperacional ||
    'Fluxo recomendado: enviar a fatura ao cliente e registrar o recebimento em "Registrar Pgto" apos a confirmacao bancaria.';
  const pdfDownloadHabilitado = faturamentoService.suportaDownloadPdfFatura();
  const statusPermiteAcoesFinanceiras = (status: StatusFatura): boolean =>
    !STATUS_BLOQUEIO_ACOES_FINANCEIRAS.includes(status);
  const statusPermiteCobranca = (status: StatusFatura): boolean =>
    STATUS_ELEGIVEIS_COBRANCA.includes(status);
  const obterFaturaPorId = (id: number): Fatura | undefined => faturas.find((item) => item.id === id);
  const resolverFormaPagamentoFatura = (fatura: Fatura): FormaPagamento =>
    (fatura.formaPagamento || fatura.formaPagamentoPreferida || FormaPagamento.PIX) as FormaPagamento;
  const formaPagamentoPermiteCobrancaOnline = (formaPagamento: FormaPagamento): boolean =>
    [
      FormaPagamento.PIX,
      FormaPagamento.CARTAO_CREDITO,
      FormaPagamento.CARTAO_DEBITO,
      FormaPagamento.BOLETO,
    ].includes(formaPagamento);

  // Dados paginados com aggregates (React Query)
  const faturasQuery = useFaturasPaginadas({
    ...filtros,
    busca: buscaDebounced.trim() || undefined,
    page,
    pageSize,
    sortBy,
    sortOrder,
  });
  const { data: respostaPaginada, isLoading, refetch } = faturasQuery;

  // Buscar automaticamente ao alterar a busca (debounced) ou filtros/sort/paginação via botão
  useEffect(() => {
    // Quando a busca (debounced) muda, reinicia página e busca
    setPage(1);
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaDebounced]);

  // Sincronizar estados locais com a resposta do hook
  useEffect(() => {
    setCarregando(isLoading);
    if (!respostaPaginada) return;

    const dados = respostaPaginada;
    setFaturas(dados.data);
    setTotal(dados.total || dados.data.length);
    setAggregates(dados.aggregates || {});

    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const vencidas = dados.data.filter(
      (f) =>
        f.status !== StatusFatura.PAGA &&
        f.status !== StatusFatura.CANCELADA &&
        new Date(f.dataVencimento) < hoje,
    ).length;
    const pagas = dados.data.filter((f) => f.status === StatusFatura.PAGA).length;
    const doMes = dados.data.filter((f) => new Date(f.dataEmissao) >= inicioMes).length;

    setDashboardCards({
      totalFaturas: dados.total || dados.data.length,
      faturasVencidas: vencidas,
      valorTotalPendente: dados.aggregates?.valorEmAberto ?? 0,
      valorTotalPago: dados.aggregates?.valorRecebido ?? 0,
      faturasPagas: pagas,
      faturasDoMes: doMes,
    });
  }, [respostaPaginada, isLoading]);


  const carregarFaturas = async () => {
    try {
      // Estratégia agressiva de atualização do cache
      await queryClient.removeQueries({ queryKey: ['faturas-paginadas'] }); // Remove completamente do cache
      await queryClient.invalidateQueries({ queryKey: ['faturas-paginadas'] }); // Invalida todas as queries relacionadas
      await queryClient.refetchQueries({ queryKey: ['faturas-paginadas'] }); // Força uma nova busca imediatamente
      await refetch();
    } catch (error) {
      console.error('Erro ao recarregar faturas:', error);
    }
  };

  const carregarProntidaoCobranca = async () => {
    try {
      setCarregandoProntidaoCobranca(true);
      setErroProntidaoCobranca(null);
      const prontidao = await faturamentoService.obterProntidaoCobranca();
      setProntidaoCobranca(prontidao);
    } catch (error) {
      console.error('Erro ao carregar prontidao de cobranca:', error);
      setErroProntidaoCobranca(
        obterMensagemErro(error, 'Nao foi possivel obter a prontidao operacional de cobranca.'),
      );
      setProntidaoCobranca(null);
    } finally {
      setCarregandoProntidaoCobranca(false);
    }
  };

  useEffect(() => {
    void carregarProntidaoCobranca();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buscarFaturas = async () => {
    setPage(1);
    carregarFaturas();
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      buscarFaturas();
    }
  };

  const abrirModalEdicao = (fatura: Fatura) => {
    setFaturaEdicao(fatura);
    setModalAberto(true);
  };

  const abrirModalCriacao = () => {
    setFaturaEdicao(null);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setFaturaEdicao(null);
  };

  const abrirModalDetalhes = (fatura: Fatura) => {
    setFaturaDetalhes(fatura);
    setModalDetalhesAberto(true);
  };

  const fecharModalDetalhes = () => {
    setModalDetalhesAberto(false);
    setFaturaDetalhes(null);
  };

  const abrirModalPagamentos = (fatura: Fatura) => {
    if (!statusPermiteAcoesFinanceiras(fatura.status)) {
      notificacao.mostrarAviso(
        'Acao indisponivel',
        `Nao e permitido registrar pagamento para faturas com status ${faturamentoService.formatarStatusFatura(fatura.status)}.`,
      );
      return;
    }
    setFaturaPagamentos(fatura);
    setModalPagamentosAberto(true);
  };

  const fecharModalPagamentos = () => {
    setModalPagamentosAberto(false);
    setFaturaPagamentos(null);
  };

  const alternarMenuAcoes = (event: React.MouseEvent, faturaId: number) => {
    event.stopPropagation();
    setMenuAcoesAbertoId((atual) => (atual === faturaId ? null : faturaId));
  };

  const fecharMenuAcoes = () => {
    setMenuAcoesAbertoId(null);
  };

  const marcarNotificacaoComoLida = (notificacaoId: string) => {
    void notificacaoId;
  };

  const obterMensagemErro = (error: unknown, fallback: string) => {
    const err = error as {
      response?: {
        data?: {
          message?: string;
          error?: string;
          errors?: string[];
        };
      };
      message?: string;
    };
    return (
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      (Array.isArray(err?.response?.data?.errors) ? err.response.data.errors.join(', ') : null) ||
      err?.message ||
      fallback
    );
  };

  const obterSinalErro = (error: unknown): { status?: number; texto: string } => {
    const err = error as {
      response?: {
        status?: number;
        data?: Record<string, unknown>;
      };
      message?: unknown;
    };

    const partes: string[] = [];
    const data = (err?.response?.data || {}) as Record<string, unknown>;

    const adicionarTexto = (valor: unknown) => {
      if (typeof valor === 'string' && valor.trim().length > 0) {
        partes.push(valor.trim());
      }
    };

    const mensagem = data.message;
    if (Array.isArray(mensagem)) {
      mensagem.forEach((item) => adicionarTexto(item));
    } else {
      adicionarTexto(mensagem);
    }

    adicionarTexto(data.error);
    const errors = data.errors;
    if (Array.isArray(errors)) {
      errors.forEach((item) => adicionarTexto(item));
    } else {
      adicionarTexto(errors);
    }
    adicionarTexto(data.detalhe);
    adicionarTexto(data.detalhes);
    adicionarTexto(data.code);
    adicionarTexto(data.codigo);
    adicionarTexto(err?.message);

    return {
      status: err?.response?.status,
      texto: partes.join(' | ').toLowerCase(),
    };
  };

  const erroIndicaIndisponibilidadeCobrancaOnline = (error: unknown): boolean => {
    const { status, texto } = obterSinalErro(error);
    if (status === 503) {
      return true;
    }

    const marcadores = [
      'mercado pago',
      'gateway',
      'checkout',
      'link de pagamento',
      'payment link',
      'access token',
      'access_token',
      'nao inicializado',
      'indisponivel',
      'url publica',
      'webhook',
    ];

    return marcadores.some((marcador) => texto.includes(marcador));
  };

  const erroIndicaFalhaEnvioCobranca = (detalhe: string | undefined): boolean => {
    const texto = String(detalhe || '').toLowerCase();
    if (!texto) {
      return false;
    }

    const marcadores = [
      'smtp',
      'email',
      'mailer',
      'mail',
      'transport',
      'autentic',
      'timeout',
      'connection',
      'conexao',
      'host',
      'socket',
    ];

    return marcadores.some((marcador) => texto.includes(marcador));
  };

  const aplicarFaturaAtualizadaNosEstados = (faturaAtualizada: Fatura) => {
    setFaturas((prev) =>
      prev.map((item) => (item.id === faturaAtualizada.id ? faturaAtualizada : item)),
    );
    setFaturaDetalhes((atual) =>
      atual && atual.id === faturaAtualizada.id ? faturaAtualizada : atual,
    );
    setFaturaPagamentos((atual) =>
      atual && atual.id === faturaAtualizada.id ? faturaAtualizada : atual,
    );
  };

  const sincronizarFaturaAtualizada = async (faturaId: number) => {
    const faturaAtualizada = await faturamentoService.obterFatura(faturaId);
    aplicarFaturaAtualizadaNosEstados(faturaAtualizada);
    return faturaAtualizada;
  };

  const abrirFaturaNotificacao = (faturaId: number) => {
    const fatura = faturas.find((f) => f.id === faturaId);
    if (fatura) {
      abrirModalDetalhes(fatura);
    }
  };

  useEffect(() => {
    if (!faturaIdParam) {
      return;
    }

    const faturaId = Number(faturaIdParam);
    if (!Number.isInteger(faturaId) || faturaId <= 0) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('faturaId');
      setSearchParams(nextParams, { replace: true });
      return;
    }

    let ativo = true;
    const abrirFaturaViaQuery = async () => {
      try {
        const faturaAlvo = await faturamentoService.obterFatura(faturaId);

        if (!ativo || !faturaAlvo) {
          return;
        }

        setVisaoAtiva('dashboard');
        abrirModalDetalhes(faturaAlvo);
      } catch (error) {
        if (!ativo) {
          return;
        }
        notificacao.erro.operacaoFalhou(
          'abrir fatura por link',
          obterMensagemErro(error, 'Nao foi possivel abrir a fatura informada.'),
        );
      } finally {
        if (!ativo) {
          return;
        }
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('faturaId');
        setSearchParams(nextParams, { replace: true });
      }
    };

    abrirFaturaViaQuery();

    return () => {
      ativo = false;
    };
  }, [faturaIdParam, setSearchParams]);

  useEffect(() => {
    if (menuAcoesAbertoId === null) {
      return;
    }

    const handleMouseDownForaMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-menu-acoes-root="true"]')) {
        return;
      }
      setMenuAcoesAbertoId(null);
    };

    document.addEventListener('mousedown', handleMouseDownForaMenu);
    return () => {
      document.removeEventListener('mousedown', handleMouseDownForaMenu);
    };
  }, [menuAcoesAbertoId]);

  // Handlers para funcionalidades avançadas da Semana 2
  const abrirModalGateway = (fatura: Fatura) => {
    if (!statusPermiteCobranca(fatura.status)) {
      notificacao.mostrarAviso(
        'Acao indisponivel',
        `Pagamento online nao permitido para faturas com status ${faturamentoService.formatarStatusFatura(fatura.status)}.`,
      );
      return;
    }
    if (!gatewayUiHabilitada) {
      notificacao.mostrarAviso('Gateway indisponivel', motivoBloqueioGateway);
      return;
    }
    setFaturaGateway(fatura);
  };

  const fecharModalGateway = () => {
    setFaturaGateway(null);
  };

  const handlePagamentoConcluido = async (transacao: unknown) => {
    try {
      await carregarFaturas();

      const statusTransacao =
        transacao && typeof transacao === 'object' && 'status' in transacao
          ? String((transacao as { status?: unknown }).status || '').toLowerCase()
          : '';

      if (statusTransacao === 'pendente') {
        notificacao.mostrarSucesso(
          'Solicitacao enviada',
          'Link/fluxo de pagamento gerado no backend. A baixa oficial depende do processamento e webhook.',
        );
      } else if (statusTransacao === 'aprovado') {
        notificacao.mostrarAviso(
          'Pagamento online em verificacao',
          'A baixa financeira oficial depende de confirmacao do backend (webhook/processamento).',
        );
      } else {
        notificacao.mostrarAviso(
          'Pagamento nao confirmado',
          'A fatura permanece com status controlado apenas pelo backend.',
        );
      }

      fecharModalGateway();
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
    }
  };

  const handleEnviarEmail = async (
    envios: EnvioEmailAutomacaoPayload[],
  ): Promise<ResultadoEnvioEmailAutomacao[]> => {
    try {
      if (!envios.length) {
        notificacao.mostrarAviso(
          'Seleção necessária',
          'Selecione ao menos uma fatura para envio.',
        );
        return [];
      }

      const resultados = await Promise.allSettled(
        envios.map((envio) =>
          faturamentoService.enviarFaturaPorEmail(envio.faturaId, {
            templateId: envio.templateId,
            assunto: envio.assunto,
            conteudo: envio.conteudo,
          }),
        ),
      );
      const detalhados: ResultadoEnvioEmailAutomacao[] = resultados.map((resultado, index) => {
        const faturaId = envios[index]?.faturaId || 0;
        if (resultado.status === 'fulfilled') {
          return {
            faturaId,
            status: resultado.value.simulado ? 'simulado' : 'enviado',
            detalhe: resultado.value.message || resultado.value.detalhes || resultado.value.motivo,
          };
        }
        return {
          faturaId,
          status: 'falha',
          detalhe: obterMensagemErro(resultado.reason, 'Falha ao enviar e-mail.'),
        };
      });

      const enviados = resultados.filter((r) => r.status === 'fulfilled').length;
      const simulados = resultados.filter(
        (r) => r.status === 'fulfilled' && Boolean(r.value.simulado),
      ).length;
      const reais = enviados - simulados;
      const falhas = resultados.length - enviados;
      const templateIds = Array.from(
        new Set(envios.map((envio) => envio.templateId).filter(Boolean)),
      );
      const sufixoTemplate =
        templateIds.length === 1
          ? ` (template ${templateIds[0]})`
          : templateIds.length > 1
            ? ` (${templateIds.length} templates)`
            : '';

      if (reais > 0) {
        notificacao.mostrarSucesso(
          'E-mails enviados',
          `${reais} e-mail(s) enviado(s) com sucesso${sufixoTemplate}.`,
        );
      }

      if (simulados > 0) {
        notificacao.mostrarAviso(
          'Envio simulado',
          `${simulados} e-mail(s) foram simulados. Verifique o SMTP da empresa para envio real.`,
        );
      }

      if (falhas > 0) {
        const primeiraFalha = resultados.find(
          (r): r is PromiseRejectedResult => r.status === 'rejected',
        );
        notificacao.erro.operacaoFalhou(
          'enviar e-mails em lote',
          `${falhas} envio(s) falharam. ${obterMensagemErro(primeiraFalha?.reason, 'Falha ao enviar e-mails.')}`,
        );
      }
      return detalhados;
    } catch (error) {
      console.error('Erro ao enviar emails:', error);
      notificacao.erro.operacaoFalhou(
        'enviar e-mails',
        obterMensagemErro(error, 'Erro ao enviar e-mails.'),
      );
      return envios.map((envio) => ({
        faturaId: envio.faturaId,
        status: 'falha',
        detalhe: obterMensagemErro(error, 'Erro ao enviar e-mails.'),
      }));
    }
  };

  const handleExportarRelatorio = (tipo: 'pdf' | 'excel' | 'csv') => {
    try {
      if (!faturas.length) {
        notificacao.mostrarAviso('Exportação indisponível', 'Não há faturas para exportar.');
        return;
      }

      const dataAtual = new Date().toISOString().split('T')[0];
      const nomeArquivoBase = 'relatorio_faturamento_' + dataAtual;
      const dadosRelatorio = faturas.map((fatura) => {
        const valorTotal = Number(fatura.valorTotal || 0);
        const valorPagoRaw = Number((fatura as any).valorPago || 0);
        const valorPago =
          valorPagoRaw > 0
            ? valorPagoRaw
            : fatura.status === StatusFatura.PAGA
              ? valorTotal
              : 0;

        return {
          numero: fatura.numero,
          cliente: obterNomeCliente(fatura.cliente, fatura.clienteId),
          status: faturamentoService.formatarStatusFatura(fatura.status),
          responsavel:
            (fatura as any).usuarioResponsavel?.nome ||
            (fatura as any).usuarioResponsavel?.name ||
            (fatura as any).usuarioResponsavelId ||
            '-',
          origem: faturamentoService.formatarTipoFatura(fatura.tipo),
          valorTotal,
          valorPago,
          valorAberto: Math.max(valorTotal - valorPago, 0),
          dataEmissao: new Date(fatura.dataEmissao).toLocaleDateString('pt-BR'),
          dataVencimento: new Date(fatura.dataVencimento).toLocaleDateString('pt-BR'),
          dataCriacao: new Date(fatura.criadoEm).toLocaleString('pt-BR'),
          dataAtualizacao: new Date(fatura.atualizadoEm).toLocaleString('pt-BR'),
        };
      });

      const colunasExportacao: ExportColumn[] = [
        { key: 'numero', label: 'Numero' },
        { key: 'cliente', label: 'Cliente' },
        { key: 'status', label: 'Status', transform: (value: unknown) => String(value || '') },
        { key: 'responsavel', label: 'Responsável' },
        { key: 'origem', label: 'Origem' },
        { key: 'valorTotal', label: 'Valor Total' },
        { key: 'valorPago', label: 'Valor Pago' },
        { key: 'valorAberto', label: 'Valor em Aberto' },
        { key: 'dataEmissao', label: 'Data Emissão' },
        { key: 'dataVencimento', label: 'Data Vencimento' },
        { key: 'dataCriacao', label: 'Criado em' },
        { key: 'dataAtualizacao', label: 'Atualizado em' },
      ];

      if (tipo === 'csv') {
        exportToCSV(dadosRelatorio, colunasExportacao, nomeArquivoBase);
        notificacao.mostrarSucesso('Relatório exportado', 'Arquivo CSV gerado com sucesso.');
        return;
      }

      if (tipo === 'excel') {
        exportToExcel(dadosRelatorio, colunasExportacao, nomeArquivoBase, 'Faturamento');
        notificacao.mostrarSucesso('Relatório exportado', 'Arquivo Excel gerado com sucesso.');
        return;
      }

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Relatório de Faturamento', 14, 18);
      doc.setFontSize(10);
      doc.text('Gerado em ' + new Date().toLocaleString('pt-BR'), 14, 25);
      doc.text('Total de faturas: ' + faturas.length, 14, 31);

      const linhasTabela = faturas.map((fatura) => [
        fatura.numero,
        obterNomeCliente(fatura.cliente, fatura.clienteId),
        faturamentoService.formatarStatusFatura(fatura.status),
        faturamentoService.formatarTipoFatura(fatura.tipo),
        String(
          (fatura as any).usuarioResponsavel?.nome ||
            (fatura as any).usuarioResponsavel?.name ||
            (fatura as any).usuarioResponsavelId ||
            '-',
        ),
        Number(fatura.valorTotal || 0).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        new Date(fatura.dataVencimento).toLocaleDateString('pt-BR'),
      ]);

      autoTable(doc, {
        startY: 38,
        head: [['Número', 'Cliente', 'Status', 'Origem', 'Responsável', 'Valor Total', 'Vencimento']],
        body: linhasTabela,
        theme: 'grid',
        headStyles: {
          fillColor: [21, 154, 156],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 45 },
          2: { cellWidth: 22 },
          3: { cellWidth: 20 },
          4: { cellWidth: 35 },
          5: { cellWidth: 28, halign: 'right' },
          6: { cellWidth: 20 },
        },
      });

      doc.save(nomeArquivoBase + '.pdf');
      notificacao.mostrarSucesso('Relatório exportado', 'Arquivo PDF gerado com sucesso.');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      notificacao.erro.operacaoFalhou(
        'exportar relatório',
        obterMensagemErro(error, 'Falha ao exportar relatório.'),
      );
    }
  };

  const handleExecutarWorkflow = async (
    acao: string,
    config: WorkflowConfig,
  ): Promise<WorkflowExecutionResult> => {
    try {
      void config;

      if (acao === 'workflow_lembrete_vencimento') {
        const resultadoBackend = await faturamentoService.enviarLembretesVencimento();
        const processados = Number(resultadoBackend.processados || 0);
        const sucesso = Number(resultadoBackend.sucesso || 0);
        const falhas = Number(resultadoBackend.falhas || 0);
        const mensagem =
          processados > 0
            ? falhas > 0
              ? 'Lembretes executados: ' + sucesso + ' sucesso(s) e ' + falhas + ' falha(s).'
              : sucesso + ' lembrete(s) de vencimento enviado(s).'
            : 'Nenhum lembrete elegivel encontrado pelo backend.';

        if (falhas > 0) {
          notificacao.mostrarAviso('Workflow com divergencias', mensagem);
        } else {
          notificacao.mostrarSucesso('Workflow executado', mensagem);
        }

        return {
          processados,
          sucesso,
          falhas,
          mensagem,
        };
      }

      if (acao === 'workflow_cobranca_vencidas') {
        const resultadoLote = await faturamentoService.gerarCobrancaFaturasVencidas();
        const sucesso = Number(resultadoLote.sucesso || 0);
        const falhas = Number(resultadoLote.falhas || 0);
        const simuladas = Number(resultadoLote.simuladas || 0);

        if (Number(resultadoLote.solicitadas || 0) === 0) {
          return {
            processados: 0,
            sucesso: 0,
            falhas: 0,
            mensagem: 'Nenhuma fatura vencida para cobranca neste momento.',
          };
        }

        if (sucesso > 0) {
          notificacao.mostrarSucesso('Workflow executado', sucesso + ' cobranca(s) enviada(s).');
        }
        if (simuladas > 0) {
          notificacao.mostrarAviso(
            'Workflow em modo simulado',
            simuladas + ' envio(s) foram simulados. Configure SMTP na empresa para envio real.',
          );
        }
        if (falhas > 0) {
          notificacao.mostrarAviso('Workflow com falhas', falhas + ' cobranca(s) nao puderam ser enviadas.');
        }

        return {
          processados: Number(resultadoLote.processadas || 0),
          sucesso,
          falhas,
          mensagem:
            'Lote de cobranca finalizado: ' +
            sucesso +
            ' envio(s) real(is), ' +
            simuladas +
            ' simulado(s), ' +
            falhas +
            ' falha(s).',
        };
      }

      if (acao === 'workflow_sincronizacao_financeira') {
        const [vencidas, recorrentes] = await Promise.all([
          faturamentoService.verificarFaturasVencidas(),
          faturamentoService.processarCobrancasRecorrentes(),
        ]);

        const processados = Number(vencidas.processados || 0) + Number(recorrentes.processados || 0);
        const sucesso = Number(vencidas.sucesso || 0) + Number(recorrentes.sucesso || 0);
        const falhas = Number(vencidas.falhas || 0) + Number(recorrentes.falhas || 0);

        await carregarFaturas();

        const mensagem =
          falhas > 0
            ? 'Sincronizacao concluida com ' + falhas + ' falha(s).'
            : 'Sincronizacao financeira executada com sucesso.';

        if (falhas > 0) {
          notificacao.mostrarAviso('Workflow com divergencias', mensagem);
        } else {
          notificacao.mostrarSucesso('Workflow executado', mensagem);
        }

        return {
          processados,
          sucesso,
          falhas,
          mensagem,
        };
      }

      const mensagem = 'Acao de workflow nao mapeada: ' + acao;
      notificacao.mostrarAviso('Workflow indisponivel', mensagem);
      return {
        processados: 0,
        sucesso: 0,
        falhas: 0,
        mensagem,
      };
    } catch (error) {
      console.error('Erro ao executar workflow:', error);
      notificacao.erro.operacaoFalhou(
        'executar workflow',
        obterMensagemErro(error, 'Erro ao executar workflow.'),
      );
      throw error;
    }
  };

  const handleSalvarFatura = async (dadosFatura: NovaFatura) => {
    try {
      if (faturaEdicao) {
        await faturamentoService.atualizarFatura(faturaEdicao.id, dadosFatura);
        notificacao.mostrarSucesso('Fatura atualizada', 'Fatura atualizada com sucesso.');
      } else {
        await faturamentoService.criarFatura(dadosFatura);
        notificacao.mostrarSucesso('Fatura criada', 'Fatura criada com sucesso.');
      }

      fecharModal();
      carregarFaturas();
    } catch (error) {
      console.error('Erro ao salvar fatura:', error);
      notificacao.erro.operacaoFalhou(
        'salvar fatura',
        obterMensagemErro(error, 'Erro ao salvar fatura.'),
      );
    }
  };

  const excluirFatura = async (id: number) => {
    try {
      // Buscar a fatura para validação
      const fatura = faturas.find((f) => f.id === id);
      if (!fatura) {
        console.error('Fatura não encontrada:', id);
        notificacao.mostrarAviso('Fatura não encontrada', `Não foi possível localizar a fatura ${id}.`);
        return;
      }

      // Determinar o tipo de confirmação baseado na fatura
      const tipoConfirmacao = validacao.validarExclusaoFatura(fatura);

      // Obter dados contextuais
      const dadosContexto = validacao.obterDadosContexto(fatura, tipoConfirmacao);

      // Mostrar confirmação inteligente
      confirmacao.confirmar(
        tipoConfirmacao,
        async () => {
          try {
            await faturamentoService.excluirFatura(id);

            // Estratégia agressiva de atualização do cache
            await queryClient.removeQueries({ queryKey: ['faturas-paginadas'] }); // Remove completamente do cache
            await queryClient.invalidateQueries({ queryKey: ['faturas-paginadas'] }); // Invalida todas as queries relacionadas
            await queryClient.refetchQueries({ queryKey: ['faturas-paginadas'] }); // Força uma nova busca imediatamente

            // Recarregar dados - Força atualização completa
            await refetch();

            // Também Força uma atualização do estado local para garantir
            setFaturas((prev) => prev.filter((f) => f.id !== id));

            // Atualizar faturas selecionadas removendo a excluída
            setFaturasSelecionadas((prev) => prev.filter((faturaId) => faturaId !== id));

            // Mostrar notificação de sucesso
            notificacao.mostrarSucesso(
              'Fatura excluída',
              `Fatura #${faturamentoService.formatarNumeroFatura(fatura.numero)} foi excluída com sucesso.`,
            );
          } catch (error) {
            console.error('Erro ao excluir fatura no serviço:', error);
            throw new Error(
              obterMensagemErro(error, 'Erro ao excluir fatura. Verifique se ela não possui dependências.'),
            );
          }
        },
        dadosContexto,
      );
    } catch (error) {
      console.error('Erro ao excluir fatura:', error);
      notificacao.erro.operacaoFalhou(
        'excluir fatura',
        obterMensagemErro(error, 'Erro ao excluir fatura.'),
      );
    }
  };

  const gerarLinkPagamento = async (id: number) => {
    const faturaAlvo = obterFaturaPorId(id);
    if (faturaAlvo && !statusPermiteCobranca(faturaAlvo.status)) {
      notificacao.mostrarAviso(
        'Acao indisponivel',
        `Nao e permitido gerar link de pagamento para faturas com status ${faturamentoService.formatarStatusFatura(faturaAlvo.status)}.`,
      );
      return;
    }
    if (faturaAlvo) {
      const formaPagamentoAtual = resolverFormaPagamentoFatura(faturaAlvo);
      if (!formaPagamentoPermiteCobrancaOnline(formaPagamentoAtual)) {
        notificacao.mostrarAviso(
          'Forma de pagamento manual',
          `A forma ${faturamentoService.formatarFormaPagamento(formaPagamentoAtual)} usa fluxo manual. Para cobranca online, selecione PIX, Cartao de Credito, Cartao de Debito ou Boleto na fatura.`,
        );
        return;
      }
    }

    if (!linkPagamentoHabilitado) {
      notificacao.mostrarAviso('Link de pagamento indisponivel', motivoBloqueioGateway);
      return;
    }

    try {
      const link = await faturamentoService.gerarLinkPagamento(id);
      navigator.clipboard.writeText(link);
      notificacao.mostrarSucesso(
        'Link de pagamento copiado',
        'O link de pagamento foi copiado para a área de transferência.',
      );
      carregarFaturas(); // Recarregar para atualizar o link
    } catch (error) {
      console.error('Erro ao gerar link de pagamento:', error);
      if (erroIndicaIndisponibilidadeCobrancaOnline(error)) {
        notificacao.mostrarAviso(
          'Cobranca online indisponivel',
          `${obterMensagemErro(error, 'Servico de cobranca online indisponivel no backend.')} ${fallbackOperacionalCobranca}`,
        );
        return;
      }
      notificacao.erro.operacaoFalhou(
        'gerar link de pagamento',
        obterMensagemErro(error, 'Recurso indisponível no backend atual.'),
      );
    }
  };

  const obterLinkPagamentoValido = (fatura: Fatura): string | null => {
    const link = String(fatura.linkPagamento || '').trim();
    return link.length > 0 ? link : null;
  };

  const abrirBoleto = (fatura: Fatura) => {
    const link = obterLinkPagamentoValido(fatura);
    if (!link) {
      notificacao.mostrarAviso(
        'Boleto indisponivel',
        'Esta fatura ainda nao possui link de pagamento. Gere o link primeiro.',
      );
      return;
    }

    const aba = window.open(link, '_blank', 'noopener,noreferrer');
    if (!aba) {
      notificacao.mostrarAviso(
        'Popup bloqueado',
        'Nao foi possivel abrir o boleto em nova aba. Verifique o bloqueador de popups.',
      );
      return;
    }

    notificacao.mostrarSucesso('Checkout aberto', 'O boleto foi aberto em uma nova aba.');
  };

  const copiarLinkBoleto = async (fatura: Fatura) => {
    const link = obterLinkPagamentoValido(fatura);
    if (!link) {
      notificacao.mostrarAviso(
        'Link indisponivel',
        'Esta fatura ainda nao possui link de pagamento. Gere o link primeiro.',
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      notificacao.mostrarSucesso(
        'Link copiado',
        'Link de pagamento copiado para a area de transferencia.',
      );
    } catch (error) {
      console.error('Erro ao copiar link de pagamento:', error);
      notificacao.erro.operacaoFalhou(
        'copiar link de pagamento',
        'Nao foi possivel copiar o link automaticamente.',
      );
    }
  };

  const enviarPorEmail = async (id: number) => {
    const faturaAlvo = obterFaturaPorId(id);
    if (faturaAlvo && !statusPermiteCobranca(faturaAlvo.status)) {
      notificacao.mostrarAviso(
        'Acao indisponivel',
        `Nao e permitido enviar cobranca para faturas com status ${faturamentoService.formatarStatusFatura(faturaAlvo.status)}.`,
      );
      return;
    }

    if (!emailCobrancaOperacional) {
      notificacao.mostrarAviso(
        'Envio de cobranca indisponivel',
        `${motivoBloqueioEmailCobranca} ${fallbackOperacionalCobranca}`,
      );
      return;
    }

    try {
      const resultado = await faturamentoService.enviarFaturaPorEmail(id);
      if (resultado.simulado) {
        notificacao.mostrarAviso(
          'Envio simulado',
          resultado.message ||
            resultado.detalhes ||
            'Envio executado em modo simulado. Verifique o SMTP da empresa para envio real.',
        );
        return;
      }
      notificacao.mostrarSucesso('E-mail enviado', 'Fatura enviada por e-mail com sucesso.');
      await carregarFaturas();
    } catch (error) {
      console.error('Erro ao enviar fatura por email:', error);
      notificacao.erro.operacaoFalhou(
        'enviar fatura por e-mail',
        obterMensagemErro(error, 'Falha ao enviar fatura por e-mail.'),
      );
    }
  };

  const baixarPDF = async (id: number) => {
    try {
      if (!pdfDownloadHabilitado) {
        notificacao.mostrarAviso(
          'Download de PDF indisponivel',
          'A API de PDF de faturas ainda nao foi habilitada neste ambiente.',
        );
        return [];
      }
      const blob = await faturamentoService.baixarPDF(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fatura-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      notificacao.erro.operacaoFalhou(
        'baixar PDF da fatura',
        obterMensagemErro(error, 'Download de PDF indisponível no backend atual.'),
      );
    }
  };

  const registrarPagamento = async (pagamento: PagamentoFormulario) => {
    try {
      if (!faturaPagamentos) {
        throw new Error('Fatura nao encontrada');
      }
      if (!statusPermiteAcoesFinanceiras(faturaPagamentos.status)) {
        notificacao.mostrarAviso(
          'Acao indisponivel',
          `Nao e permitido registrar pagamento para faturas com status ${faturamentoService.formatarStatusFatura(faturaPagamentos.status)}.`,
        );
        return;
      }

      const dadosPagamentoManual = {
        faturaId: faturaPagamentos.id,
        valor: pagamento.valor,
        dataPagamento: pagamento.data,
        metodoPagamento: pagamento.metodo,
        observacoes: pagamento.observacoes || '',
        origemId: 'financeiro.faturamento.ui',
        correlationId: 'manual_' + faturaPagamentos.id + '_' + Date.now(),
      };

      await faturamentoService.registrarPagamentoManual(dadosPagamentoManual);

      notificacao.sucesso.pagamentoRegistrado(pagamento.valor);

      // Estrategia agressiva de atualizacao do cache apos pagamento
      await queryClient.removeQueries({ queryKey: ['faturas-paginadas'] });
      await queryClient.invalidateQueries({ queryKey: ['faturas-paginadas'] });
      await queryClient.refetchQueries({ queryKey: ['faturas-paginadas'] });

      // Recarregar faturas apos registrar pagamento
      await carregarFaturas();

      // Fechar modal apos sucesso
      fecharModalPagamentos();
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      notificacao.erro.operacaoFalhou(
        'registrar pagamento',
        obterMensagemErro(error, 'Falha ao registrar pagamento no backend.'),
      );
      throw error;
    }
  };

  const estornarPagamento = async (pagamentoId: number, motivo: string) => {
    try {
      const pagamentoEstornado = await faturamentoService.estornarPagamento(pagamentoId, motivo);
      notificacao.mostrarSucesso('Estorno concluído', 'Pagamento estornado com sucesso.');

      await queryClient.removeQueries({ queryKey: ['faturas-paginadas'] });
      await queryClient.invalidateQueries({ queryKey: ['faturas-paginadas'] });
      await queryClient.refetchQueries({ queryKey: ['faturas-paginadas'] });
      await carregarFaturas();

      const faturaIdAtualizada = Number(pagamentoEstornado?.faturaId || 0);
      if (faturaIdAtualizada > 0) {
        try {
          const faturaAtualizada = await faturamentoService.obterFatura(faturaIdAtualizada);
          setFaturaDetalhes((atual) =>
            atual && atual.id === faturaIdAtualizada ? faturaAtualizada : atual,
          );
          setFaturaPagamentos((atual) =>
            atual && atual.id === faturaIdAtualizada ? faturaAtualizada : atual,
          );
        } catch {}
      }
    } catch (error) {
      console.error('Erro ao estornar pagamento:', error);
      notificacao.erro.operacaoFalhou(
        'estornar pagamento',
        obterMensagemErro(error, 'Falha ao estornar pagamento.'),
      );
      throw error;
    }
  };

  // Ações em massa melhoradas
  const handleAcaoMassa = async (acao: string) => {
    if (faturasSelecionadas.length === 0) {
      notificacao.mostrarAviso(
        'Seleção necessária',
        'Selecione pelo menos uma fatura para executar esta ação.',
      );
      return;
    }

    const faturasSelecionadasData = faturas.filter((f) => faturasSelecionadas.includes(f.id));

    if (acao === 'excluir') {
      confirmacao.confirmar(
        'excluir-multiplas-faturas',
        async () => {
          try {
            setProcessandoAcaoMassa(true);
            setProgressoAcaoMassa(0);

            for (let i = 0; i < faturasSelecionadas.length; i++) {
              const faturaId = faturasSelecionadas[i];
              await faturamentoService.excluirFatura(faturaId);
              setProgressoAcaoMassa(((i + 1) / faturasSelecionadas.length) * 100);
            }

            await queryClient.removeQueries({ queryKey: ['faturas-paginadas'] });
            await queryClient.invalidateQueries({ queryKey: ['faturas-paginadas'] });
            await queryClient.refetchQueries({ queryKey: ['faturas-paginadas'] });
            await carregarFaturas();

            setFaturasSelecionadas([]);
            setMostrarAcoesMassa(false);
          } catch (error) {
            console.error('Erro ao executar exclusão em massa:', error);
            throw new Error(obterMensagemErro(error, 'Erro ao excluir faturas selecionadas.'));
          } finally {
            setProcessandoAcaoMassa(false);
            setProgressoAcaoMassa(0);
          }
        },
        { quantidadeItens: faturasSelecionadas.length },
      );
      return;
    }

    try {
      setProcessandoAcaoMassa(true);
      setProgressoAcaoMassa(0);

      switch (acao) {
        case 'enviar-email': {
          const elegiveis = faturasSelecionadasData.filter((fatura) => statusPermiteCobranca(fatura.status));
          const ignoradas = faturasSelecionadasData.length - elegiveis.length;

          if (!emailCobrancaOperacional) {
            notificacao.mostrarAviso(
              'Envio de cobranca indisponivel',
              `${motivoBloqueioEmailCobranca} ${fallbackOperacionalCobranca}`,
            );
            break;
          }

          if (elegiveis.length === 0) {
            notificacao.mostrarAviso(
              'Acao indisponivel',
              'Nenhuma fatura selecionada esta elegivel para envio de cobranca por e-mail.',
            );
            break;
          }

          let sucesso = 0;
          let simuladas = 0;
          let falhas = 0;
          let primeiraFalha: unknown;

          for (let i = 0; i < elegiveis.length; i++) {
            const fatura = elegiveis[i];
            try {
              const resultado = await faturamentoService.enviarFaturaPorEmail(fatura.id);
              if (resultado.simulado) {
                simuladas += 1;
              } else {
                sucesso += 1;
              }
            } catch (error) {
              falhas += 1;
              if (!primeiraFalha) {
                primeiraFalha = error;
              }
            } finally {
              setProgressoAcaoMassa(((i + 1) / elegiveis.length) * 100);
            }
          }

          if (sucesso > 0) {
            notificacao.mostrarSucesso(
              'E-mails enviados',
              `${sucesso} e-mail(s) enviado(s) com sucesso.`,
            );
          }

          if (simuladas > 0) {
            notificacao.mostrarAviso(
              'Envio simulado',
              `${simuladas} e-mail(s) foram simulados. Verifique o SMTP da empresa para envio real.`,
            );
          }

          if (falhas > 0) {
            notificacao.erro.operacaoFalhou(
              'enviar e-mails em lote',
              `${falhas} envio(s) falharam. ${obterMensagemErro(primeiraFalha, 'Falha ao enviar e-mails.')}`,
            );
          }

          if (ignoradas > 0) {
            notificacao.mostrarAviso(
              'Faturas ignoradas',
              `${ignoradas} fatura(s) foram ignoradas por status nao elegivel para cobranca.`,
            );
          }

          await queryClient.invalidateQueries({ queryKey: ['faturas-paginadas'] });
          await carregarFaturas();
          break;
        }

        case 'baixar-pdfs':
          if (!pdfDownloadHabilitado) {
            notificacao.mostrarAviso(
              'Download de PDF indisponivel',
              'A API de PDF de faturas ainda nao foi habilitada neste ambiente.',
            );
            break;
          }
          for (let i = 0; i < faturasSelecionadas.length; i++) {
            const faturaId = faturasSelecionadas[i];
            await baixarPDF(faturaId);
            await new Promise((resolve) => setTimeout(resolve, 500));
            setProgressoAcaoMassa(((i + 1) / faturasSelecionadas.length) * 100);
          }
          break;

        case 'gerar-cobranca': {
          const elegiveis = faturasSelecionadasData.filter((fatura) => statusPermiteCobranca(fatura.status));
          const ignoradasPorStatus = faturasSelecionadasData.length - elegiveis.length;

          if (!emailCobrancaOperacional) {
            notificacao.mostrarAviso(
              'Geracao de cobranca indisponivel',
              `${motivoBloqueioEmailCobranca} ${fallbackOperacionalCobranca}`,
            );
            break;
          }

          if (elegiveis.length === 0) {
            notificacao.mostrarAviso(
              'Sem cobrancas processadas',
              'Nenhuma fatura selecionada estava apta para geracao de cobranca.',
            );
            break;
          }

          setProgressoAcaoMassa(25);
          const resultadoCobranca = await faturamentoService.gerarCobrancaEmLote(
            elegiveis.map((fatura) => fatura.id),
          );
          setProgressoAcaoMassa(80);

          if (resultadoCobranca.sucesso > 0) {
            notificacao.mostrarSucesso(
              'Cobrança em lote concluída',
              `${resultadoCobranca.sucesso} cobrança(s) enviada(s) com sucesso.` +
                (resultadoCobranca.simuladas > 0
                  ? ` ${resultadoCobranca.simuladas} envio(s) em modo simulado.`
                  : ''),
            );
          } else if (resultadoCobranca.simuladas > 0) {
            notificacao.mostrarAviso(
              'Cobrança em modo simulado',
              `${resultadoCobranca.simuladas} envio(s) processado(s) em simulação. Configure SMTP para envio real. ${fallbackOperacionalCobranca}`,
            );
          }

          const ignoradasTotais = resultadoCobranca.ignoradas + ignoradasPorStatus;
          if (ignoradasTotais > 0) {
            notificacao.mostrarAviso(
              'Faturas ignoradas',
              `${ignoradasTotais} fatura(s) foram ignoradas por status não elegível para cobrança.`,
            );
          }

          if (resultadoCobranca.falhas > 0) {
            const primeiraFalha = resultadoCobranca.resultados.find(
              (item) => !item.enviado && item.motivo !== 'status_nao_elegivel',
            );
            const existeFalhaOperacionalEntrega = resultadoCobranca.resultados.some(
              (item) =>
                !item.enviado &&
                item.motivo !== 'status_nao_elegivel' &&
                erroIndicaFalhaEnvioCobranca(item.detalhes),
            );
            notificacao.erro.operacaoFalhou(
              'gerar cobrança em lote',
              `${resultadoCobranca.falhas} fatura(s) falharam.` +
                (primeiraFalha?.detalhes ? ` ${primeiraFalha.detalhes}` : ''),
            );
            if (existeFalhaOperacionalEntrega) {
              notificacao.mostrarAviso(
                'Contingencia recomendada',
                `Falha operacional no envio automatico de cobrancas. ${fallbackOperacionalCobranca}`,
              );
            }
          }

          if (
            resultadoCobranca.sucesso === 0 &&
            resultadoCobranca.simuladas === 0 &&
            resultadoCobranca.falhas === 0
          ) {
            notificacao.mostrarAviso(
              'Sem cobranças processadas',
              'Nenhuma fatura selecionada estava apta para geração de cobrança.',
            );
          }

          await queryClient.invalidateQueries({ queryKey: ['faturas-paginadas'] });
          await carregarFaturas();
          setProgressoAcaoMassa(100);
          break;
        }
        case 'exportar': {
          setProgressoAcaoMassa(50);
          const csvData = faturasSelecionadasData
            .map(
              (f) =>
                `${f.numero},${obterNomeCliente(f.cliente, f.clienteId)},${f.valorTotal},${f.status},${f.dataVencimento}`,
            )
            .join('\n');
          const blob = new Blob([csvData], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'faturas_selecionadas.csv';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setProgressoAcaoMassa(100);
          break;
        }

        default:
          notificacao.mostrarAviso(
            'Ação indisponível',
            `A ação "${acao}" ainda não está disponível nesta versão.`,
          );
          setProgressoAcaoMassa(100);
      }

      setFaturasSelecionadas([]);
      setMostrarAcoesMassa(false);
    } catch (error) {
      console.error('Erro ao executar ação em massa:', error);
      notificacao.erro.operacaoFalhou(
        'executar ação em massa',
        obterMensagemErro(error, 'Erro ao executar ação em massa.'),
      );
    } finally {
      setProcessandoAcaoMassa(false);
      setProgressoAcaoMassa(0);
    }
  };

  const toggleSelecaoFatura = (id: number) => {
    setFaturasSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((faturaId) => faturaId !== id) : [...prev, id],
    );
  };

  const toggleSelecaoTodas = () => {
    const idsFiltrados = faturasFiltradas.map((fatura) => fatura.id);
    const todosFiltradosSelecionados =
      idsFiltrados.length > 0 &&
      idsFiltrados.every((id) => faturasSelecionadas.includes(id));

    if (todosFiltradosSelecionados) {
      setFaturasSelecionadas((prev) => prev.filter((id) => !idsFiltrados.includes(id)));
      return;
    }

    setFaturasSelecionadas((prev) => Array.from(new Set([...prev, ...idsFiltrados])));
  };

  const getStatusIcon = (status: StatusFatura, size: string = 'w-4 h-4') => {
    switch (status) {
      case StatusFatura.PAGA:
        return <CheckCircle className={`${size} text-green-500`} />;
      case StatusFatura.VENCIDA:
        return <AlertCircle className={`${size} text-red-500`} />;
      case StatusFatura.CANCELADA:
        return <XCircle className={`${size} text-gray-500`} />;
      case StatusFatura.ENVIADA:
        return <Send className={`${size} text-blue-500`} />;
      default:
        return <Clock className={`${size} text-yellow-500`} />;
    }
  };

  const getStatusColor = (status: StatusFatura) => {
    switch (status) {
      case StatusFatura.PAGA:
        return 'bg-green-100 text-green-800';
      case StatusFatura.VENCIDA:
        return 'bg-red-100 text-red-800';
      case StatusFatura.CANCELADA:
        return 'bg-gray-100 text-gray-800';
      case StatusFatura.ENVIADA:
        return 'bg-blue-100 text-blue-800';
      case StatusFatura.PARCIALMENTE_PAGA:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const termoBusca = busca.trim().toLowerCase();
  const faturasFiltradas = faturas.filter((fatura) => {
    if (clienteIdParam) {
      const clienteIdFatura = String((fatura as any).cliente?.id || fatura.clienteId || '').trim();
      if (clienteIdFatura && clienteIdFatura !== clienteIdParam) {
        return false;
      }
    }

    if (!termoBusca) {
      return true;
    }

    const numero = fatura.numero.toLowerCase();
    const nomeCliente = obterNomeCliente(fatura.cliente, fatura.clienteId).toLowerCase();
    const observacoes = fatura.observacoes?.toLowerCase() ?? '';

    return (
      numero.includes(termoBusca) ||
      nomeCliente.includes(termoBusca) ||
      observacoes.includes(termoBusca)
    );
  });

  useEffect(() => {
    setMostrarAcoesMassa(faturasSelecionadas.length > 0);
  }, [faturasSelecionadas]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value || 0));

  const btnPrimary =
    'inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition hover:bg-[#117C7E] disabled:cursor-not-allowed disabled:opacity-60';

  const statsResumo = [
    { label: 'Faturas', value: String(dashboardCards.totalFaturas) },
    { label: 'Vencidas', value: String(dashboardCards.faturasVencidas), tone: 'warning' as const },
    { label: 'Pendente', value: formatCurrency(dashboardCards.valorTotalPendente), tone: 'warning' as const },
    { label: 'Recebido', value: formatCurrency(dashboardCards.valorTotalPago), tone: 'accent' as const },
  ];

  const painelDivergencias = useMemo(() => {
    const divergenciasItensVsTotal = faturas.reduce<Array<{ numero: string; diferenca: number }>>(
      (acc, fatura) => {
        const totalItens = Array.isArray(fatura.itens)
          ? fatura.itens.reduce((sum, item) => sum + Number(item.valorTotal || 0), 0)
          : 0;
        const totalEsperado = Math.max(
          totalItens - Number(fatura.valorDesconto || 0) + Number(fatura.valorImpostos || 0),
          0,
        );
        const totalFatura = Number(fatura.valorTotal || 0);
        const diferenca = Number((totalEsperado - totalFatura).toFixed(2));
        if (Math.abs(diferenca) > 0.01) {
          acc.push({ numero: fatura.numero, diferenca });
        }
        return acc;
      },
      [],
    );

    const pagamentosParciaisSemBaixaFinal = faturas.filter((fatura) => {
      const total = Number(fatura.valorTotal || 0);
      const pago = Number(fatura.valorPago || 0);
      return fatura.status === StatusFatura.PARCIALMENTE_PAGA && pago > 0 && pago < total;
    });

    const estornosPendentesConciliacao = faturas.reduce((acc, fatura) => {
      const pagamentos = Array.isArray(fatura.pagamentos) ? fatura.pagamentos : [];
      const estornos = pagamentos.filter((pagamento) => {
        const tipo = String(pagamento.tipo || '').toLowerCase();
        const status = String(pagamento.status || '').toLowerCase();
        const valor = Number(pagamento.valor || 0);
        return (tipo === 'estorno' || valor < 0) && status === 'estornado';
      });
      return acc + estornos.length;
    }, 0);

    return {
      itensVsTotal: divergenciasItensVsTotal.length,
      parciaisSemBaixaFinal: pagamentosParciaisSemBaixaFinal.length,
      estornosPendentesConciliacao: estornosPendentesConciliacao,
      total:
        divergenciasItensVsTotal.length +
        pagamentosParciaisSemBaixaFinal.length +
        estornosPendentesConciliacao,
      primeiraDivergenciaItens: divergenciasItensVsTotal[0] || null,
    };
  }, [faturas]);

  const painelProntidao = useMemo(() => {
    const statusGatewayProntidao: StatusProntidao =
      prontidaoCobranca?.gateway?.status || (gatewayUiHabilitada ? 'ok' : 'alerta');
    const statusEmailProntidao: StatusProntidao = prontidaoCobranca?.email?.status || 'alerta';

    const itens: Array<{
      id: string;
      titulo: string;
      detalhe: string;
      status: StatusProntidao;
    }> = [
      {
        id: 'gateway-online',
        titulo: 'Gateway online habilitado',
        detalhe:
          prontidaoCobranca?.gateway?.detalhe ||
          (gatewayUiHabilitada
            ? 'Pagamento online disponivel para cobranca direta.'
            : motivoBloqueioGateway),
        status: statusGatewayProntidao,
      },
      {
        id: 'link-pagamento',
        titulo: 'Geracao de link de pagamento',
        detalhe: linkPagamentoHabilitado
          ? 'Link de pagamento liberado para envio ao cliente.'
          : prontidaoCobranca?.gateway?.detalhe || motivoBloqueioGateway,
        status: linkPagamentoHabilitado
          ? 'ok'
          : statusGatewayProntidao === 'bloqueio'
            ? 'bloqueio'
            : 'alerta',
      },
      {
        id: 'email-cobranca',
        titulo: 'Envio de cobranca por e-mail',
        detalhe:
          prontidaoCobranca?.email?.detalhe ||
          (carregandoProntidaoCobranca
            ? 'Carregando prontidao do backend para envio de cobranca.'
            : erroProntidaoCobranca || motivoBloqueioEmailCobranca),
        status: statusEmailProntidao,
      },
      {
        id: 'itens-vs-total',
        titulo: 'Consistencia dos totais',
        detalhe:
          painelDivergencias.itensVsTotal > 0
            ? `${painelDivergencias.itensVsTotal} fatura(s) com diferenca entre itens e valor total.`
            : 'Sem divergencias entre itens, descontos, impostos e total final.',
        status: painelDivergencias.itensVsTotal > 0 ? 'bloqueio' : 'ok',
      },
      {
        id: 'estornos',
        titulo: 'Estornos pendentes de conciliacao',
        detalhe:
          painelDivergencias.estornosPendentesConciliacao > 0
            ? `${painelDivergencias.estornosPendentesConciliacao} estorno(s) aguardando revisao bancaria.`
            : 'Nenhum estorno pendente de conciliacao.',
        status: painelDivergencias.estornosPendentesConciliacao > 0 ? 'alerta' : 'ok',
      },
      {
        id: 'parciais',
        titulo: 'Pagamentos parciais sem baixa final',
        detalhe:
          painelDivergencias.parciaisSemBaixaFinal > 0
            ? `${painelDivergencias.parciaisSemBaixaFinal} fatura(s) parcialmente paga(s) sem baixa final.`
            : 'Nao ha pendencia de baixa final em pagamentos parciais.',
        status: painelDivergencias.parciaisSemBaixaFinal > 0 ? 'alerta' : 'ok',
      },
    ];

    const bloqueios = itens.filter((item) => item.status === 'bloqueio').length;
    const alertas = itens.filter((item) => item.status === 'alerta').length;
    const statusGeral: StatusProntidao = bloqueios > 0 ? 'bloqueio' : alertas > 0 ? 'alerta' : 'ok';

    return {
      itens,
      bloqueios,
      alertas,
      statusGeral,
      prontoParaFechamento: bloqueios === 0 && alertas === 0,
    };
  }, [
    carregandoProntidaoCobranca,
    erroProntidaoCobranca,
    gatewayUiHabilitada,
    linkPagamentoHabilitado,
    motivoBloqueioEmailCobranca,
    motivoBloqueioGateway,
    painelDivergencias.estornosPendentesConciliacao,
    painelDivergencias.itensVsTotal,
    painelDivergencias.parciaisSemBaixaFinal,
    prontidaoCobranca?.email?.detalhe,
    prontidaoCobranca?.email?.status,
    prontidaoCobranca?.gateway?.detalhe,
    prontidaoCobranca?.gateway?.status,
  ]);

  const estilosStatusProntidao: Record<StatusProntidao, string> = {
    ok: 'border-[#CFEADB] bg-[#F2FBF6] text-[#1A7A4B]',
    alerta: 'border-[#F6D7B2] bg-[#FFF8EE] text-[#9B5A00]',
    bloqueio: 'border-[#F2CACA] bg-[#FFF5F5] text-[#A12D2D]',
  };

  const rotulosStatusProntidao: Record<StatusProntidao, string> = {
    ok: 'OK',
    alerta: 'Atencao',
    bloqueio: 'Bloqueio',
  };

  const visoes: Array<{
    id: 'dashboard' | 'prontidao' | 'relatorios' | 'email' | 'workflows';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'dashboard', label: 'Faturas', icon: FileText },
    { id: 'prontidao', label: 'Prontidao', icon: Activity },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'email', label: 'Automação de E-mails', icon: Mail },
    { id: 'workflows', label: 'Workflows', icon: Settings },
  ];

  const periodoCampoAtual = filtros.periodoCampo === 'emissao' ? 'emissao' : 'vencimento';

  const formatDateToInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const aplicarPeriodoRapido = (atalho: 'hoje' | '7d' | '30d' | 'mesAtual' | 'mesAnterior') => {
    const hoje = new Date();
    let inicio = new Date(hoje);
    let fim = new Date(hoje);

    if (atalho === '7d') {
      inicio = new Date(hoje);
      inicio.setDate(hoje.getDate() - 6);
    }

    if (atalho === '30d') {
      inicio = new Date(hoje);
      inicio.setDate(hoje.getDate() - 29);
    }

    if (atalho === 'mesAtual') {
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    }

    if (atalho === 'mesAnterior') {
      inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    }

    setFiltros((prev) => ({
      ...prev,
      periodoCampo: prev.periodoCampo === 'emissao' ? 'emissao' : 'vencimento',
      dataInicial: formatDateToInput(inicio),
      dataFinal: formatDateToInput(fim),
    }));
    setPage(1);
  };

  const filtrosAtivos =
    Boolean(busca) ||
    Boolean(filtros.status) ||
    Boolean(filtros.tipo) ||
    Boolean(filtros.dataInicial) ||
    Boolean(filtros.dataFinal) ||
    periodoCampoAtual !== 'vencimento' ||
    sortBy !== 'dataVencimento' ||
    sortOrder !== 'DESC';

  const filtrosAvancadosAtivosCount = [
    Boolean(filtros.tipo),
    Boolean(filtros.dataInicial),
    Boolean(filtros.dataFinal),
    periodoCampoAtual !== 'vencimento',
    sortBy !== 'dataVencimento',
    sortOrder !== 'DESC',
  ].filter(Boolean).length;

  const limparFiltros = () => {
    setBusca('');
    setFiltros({ periodoCampo: 'vencimento' });
    setSortBy('dataVencimento');
    setSortOrder('DESC');
    setPage(1);
    refetch();
  };

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#159A9C]" />
              Faturamento
            </span>
          }
          description={
            carregando
              ? 'Carregando faturas...'
              : `Gerencie ${dashboardCards.totalFaturas} faturas, cobranças e recebimentos.`
          }
          actions={
            <>
              <NotificacoesFaturamento
                faturas={faturas}
                onMarcarComoLida={marcarNotificacaoComoLida}
                onAbrirFatura={abrirFaturaNotificacao}
              />
              <button onClick={abrirModalCriacao} className={btnPrimary}>
                <Plus className="h-4 w-4" />
                Nova fatura
              </button>
            </>
          }
        />
        <InlineStats stats={statsResumo} />
      </SectionCard>

      <FiltersBar className="gap-2 p-2 sm:gap-3">
        {visoes.map((visao) => {
          const Icon = visao.icon;
          const ativo = visaoAtiva === visao.id;
          return (
            <button
              key={visao.id}
              onClick={() => setVisaoAtiva(visao.id)}
              className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition ${
                ativo
                  ? 'border-[#159A9C] bg-[#E8F6F6] text-[#0F7B7D] shadow-sm'
                  : 'border-[#D4E2E7] bg-white text-[#244455] hover:border-[#159A9C]/40 hover:bg-[#F6FAFB]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {visao.label}
            </button>
          );
        })}
      </FiltersBar>

        {/* Conteudo baseado na visao ativa */}
        {(visaoAtiva === 'dashboard' || visaoAtiva === 'prontidao') && (
          <div className="space-y-4">
            {visaoAtiva === 'prontidao' && (
              <SectionCard className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#476776]">Prontidao do fluxo</p>
                    <h3 className="mt-1 text-lg font-semibold text-[#173A4D]">Checklist operacional de faturamento</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => void carregarProntidaoCobranca()}
                      disabled={carregandoProntidaoCobranca}
                      className="inline-flex h-8 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-xs font-semibold text-[#355563] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {carregandoProntidaoCobranca ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Atualizando...
                        </>
                      ) : (
                        <>
                          <Activity className="h-3.5 w-3.5" />
                          Atualizar prontidao
                        </>
                      )}
                    </button>
                    {painelProntidao.bloqueios > 0 && (
                      <span className="inline-flex w-fit items-center rounded-full border border-[#F2CACA] bg-[#FFF5F5] px-3 py-1 text-xs font-semibold text-[#A12D2D]">
                        {painelProntidao.bloqueios} bloqueio(s)
                      </span>
                    )}
                    {painelProntidao.alertas > 0 && (
                      <span className="inline-flex w-fit items-center rounded-full border border-[#F6D7B2] bg-[#FFF8EE] px-3 py-1 text-xs font-semibold text-[#9B5A00]">
                        {painelProntidao.alertas} alerta(s)
                      </span>
                    )}
                    <span
                      className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                        estilosStatusProntidao[painelProntidao.statusGeral]
                      }`}
                    >
                      {painelProntidao.prontoParaFechamento ? 'Pronto para fechamento' : 'Requer ajustes'}
                    </span>
                  </div>
                </div>

                {erroProntidaoCobranca && (
                  <div className="mt-4 rounded-xl border border-[#F6D7B2] bg-[#FFF8EE] p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#9B5A00]">
                      Prontidao parcial
                    </p>
                    <p className="mt-1 text-sm text-[#7A4B00]">
                      {erroProntidaoCobranca}
                    </p>
                  </div>
                )}
                <div className="mt-4 space-y-2 rounded-xl border border-[#E3EDF1] bg-[#FAFCFD] p-3">
                  {painelProntidao.itens.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-2 rounded-lg border border-[#E6EEF2] bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#173A4D]">{item.titulo}</p>
                        <p className="text-xs text-[#5D7A88]">{item.detalhe}</p>
                      </div>
                      <span
                        className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                          estilosStatusProntidao[item.status]
                        }`}
                      >
                        {rotulosStatusProntidao[item.status]}
                      </span>
                    </div>
                  ))}
                </div>

                {!cobrancaOnlineOperacional && (
                  <div className="mt-4 rounded-xl border border-[#F6D7B2] bg-[#FFF8EE] p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#9B5A00]">
                      Operacao recomendada neste ambiente
                    </p>
                    <p className="mt-1 text-sm text-[#7A4B00]">{fallbackOperacionalCobranca}</p>
                  </div>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-[#E3EDF1] bg-[#FAFCFD] p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#5D7A88]">
                      Itens x total da fatura
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#173A4D]">{painelDivergencias.itensVsTotal}</p>
                    <p className="mt-1 text-xs text-[#5D7A88]">Validacao de subtotal + desconto + impostos.</p>
                  </div>

                  <div className="rounded-xl border border-[#E3EDF1] bg-[#FAFCFD] p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#5D7A88]">
                      Estorno pendente de conciliacao
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#173A4D]">
                      {painelDivergencias.estornosPendentesConciliacao}
                    </p>
                    <p className="mt-1 text-xs text-[#5D7A88]">
                      Pagamentos de estorno para revisao no fluxo bancario.
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#E3EDF1] bg-[#FAFCFD] p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#5D7A88]">
                      Parcial sem baixa final
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#173A4D]">
                      {painelDivergencias.parciaisSemBaixaFinal}
                    </p>
                    <p className="mt-1 text-xs text-[#5D7A88]">
                      Faturas com recebimento parcial ainda abertas.
                    </p>
                  </div>
                </div>

                {painelDivergencias.primeiraDivergenciaItens && (
                  <p className="mt-3 text-xs text-[#8A3C00]">
                    Exemplo: fatura {painelDivergencias.primeiraDivergenciaItens.numero} com diferenca de{' '}
                    {formatCurrency(painelDivergencias.primeiraDivergenciaItens.diferenca)} no fechamento.
                  </p>
                )}

                <p className="mt-2 text-xs text-[#5D7A88]">
                  Analise baseada nas faturas carregadas na tela atual.
                </p>
              </SectionCard>
            )}

            {visaoAtiva === 'dashboard' && (
              <>
                {/* Filtros e Busca */}
                <FiltersBar className="mb-3 p-4">
                  <div className="flex w-full flex-col gap-4">
                    <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-end">
                      <div className="w-full xl:flex-1">
                        <label className="mb-2 block text-sm font-medium text-[#385A6A]">Buscar faturas</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AAEB8]" />
                          <input
                            type="text"
                            placeholder="Buscar por numero, cliente ou observacoes..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            onKeyDown={handleSearch}
                            className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white pl-10 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                          />
                        </div>
                      </div>

                      <div className="w-full xl:w-[220px]">
                        <label className="mb-2 block text-sm font-medium text-[#385A6A]">Status</label>
                        <select
                          value={filtros.status || ''}
                          onChange={(e) =>
                            setFiltros((prev) => ({
                              ...prev,
                              status: (e.target.value as StatusFatura) || undefined,
                            }))
                          }
                          className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                        >
                          <option value="">Todos os status</option>
                          <option value={StatusFatura.PENDENTE}>Pendente</option>
                          <option value={StatusFatura.ENVIADA}>Enviada</option>
                          <option value={StatusFatura.PAGA}>Paga</option>
                          <option value={StatusFatura.VENCIDA}>Vencida</option>
                          <option value={StatusFatura.CANCELADA}>Cancelada</option>
                        </select>
                      </div>

                      <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:justify-end">
                        <button
                          type="button"
                          onClick={() => setMostrarFiltrosAvancados((atual) => !atual)}
                          className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors ${
                            mostrarFiltrosAvancados || filtrosAvancadosAtivosCount > 0
                              ? 'border-[#159A9C] bg-[#E8F6F6] text-[#0F7B7D]'
                              : 'border-[#B4BEC9] bg-white text-[#19384C] hover:bg-[#F6FAF9]'
                          }`}
                        >
                          <Settings className="h-4 w-4" />
                          Filtros avancados
                          {filtrosAvancadosAtivosCount > 0 && (
                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0F7B7D] px-1.5 text-xs font-semibold text-white">
                              {filtrosAvancadosAtivosCount}
                            </span>
                          )}
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${mostrarFiltrosAvancados ? 'rotate-180' : ''}`}
                          />
                        </button>

                        <button
                          onClick={buscarFaturas}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#159A9C] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0F7B7D]"
                          aria-label="Buscar"
                        >
                          <Search className="h-4 w-4" />
                          Buscar
                        </button>

                        {filtrosAtivos && (
                          <button
                            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#B4BEC9] bg-white px-3 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9]"
                            onClick={limparFiltros}
                          >
                            <X className="h-4 w-4" />
                            Limpar
                          </button>
                        )}
                      </div>
                    </div>

                    {mostrarFiltrosAvancados && (
                      <div className="rounded-xl border border-[#DCE8EC] bg-[#F8FBFC] p-3 sm:p-4">
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          <div className="w-full">
                            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                              Tipo
                            </label>
                            <select
                              value={filtros.tipo || ''}
                              onChange={(e) =>
                                setFiltros((prev) => ({
                                  ...prev,
                                  tipo: (e.target.value as TipoFatura) || undefined,
                                }))
                              }
                              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                            >
                              <option value="">Todos os tipos</option>
                              <option value={TipoFatura.UNICA}>Unica</option>
                              <option value={TipoFatura.RECORRENTE}>Recorrente</option>
                              <option value={TipoFatura.PARCELA}>Parcela</option>
                              <option value={TipoFatura.ADICIONAL}>Adicional</option>
                            </select>
                          </div>

                          <div className="w-full">
                            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                              Base periodo
                            </label>
                            <select
                              value={periodoCampoAtual}
                              onChange={(e) =>
                                setFiltros((prev) => ({
                                  ...prev,
                                  periodoCampo: e.target.value === 'emissao' ? 'emissao' : 'vencimento',
                                }))
                              }
                              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                            >
                              <option value="vencimento">Vencimento</option>
                              <option value="emissao">Emissao</option>
                            </select>
                          </div>

                          <div className="w-full">
                            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                              Data inicial
                            </label>
                            <input
                              type="date"
                              value={filtros.dataInicial || ''}
                              onChange={(e) =>
                                setFiltros((prev) => ({
                                  ...prev,
                                  dataInicial: e.target.value || undefined,
                                }))
                              }
                              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                            />
                          </div>

                          <div className="w-full">
                            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                              Data final
                            </label>
                            <input
                              type="date"
                              value={filtros.dataFinal || ''}
                              onChange={(e) =>
                                setFiltros((prev) => ({
                                  ...prev,
                                  dataFinal: e.target.value || undefined,
                                }))
                              }
                              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                            />
                          </div>

                          <div className="w-full">
                            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                              Ordenar por
                            </label>
                            <select
                              value={sortBy}
                              onChange={(e) => setSortBy(e.target.value)}
                              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                            >
                              <option value="dataVencimento">Vencimento</option>
                              <option value="dataEmissao">Emissao</option>
                              <option value="valorTotal">Valor</option>
                              <option value="status">Status</option>
                            </select>
                          </div>

                          <div className="w-full">
                            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#5E7987]">
                              Ordem
                            </label>
                            <select
                              value={sortOrder}
                              onChange={(e) => setSortOrder(e.target.value as 'ASC' | 'DESC')}
                              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                            >
                              <option value="DESC">Desc</option>
                              <option value="ASC">Asc</option>
                            </select>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#DFEAEE] pt-3">
                          <span className="text-xs font-medium text-[#607B89]">Atalhos de periodo:</span>
                          <button
                            type="button"
                            onClick={() => aplicarPeriodoRapido('hoje')}
                            className="inline-flex items-center rounded-full border border-[#D4E2E7] bg-white px-2.5 py-1 text-xs font-medium text-[#244455] transition hover:bg-[#F6FAFB]"
                          >
                            Hoje
                          </button>
                          <button
                            type="button"
                            onClick={() => aplicarPeriodoRapido('7d')}
                            className="inline-flex items-center rounded-full border border-[#D4E2E7] bg-white px-2.5 py-1 text-xs font-medium text-[#244455] transition hover:bg-[#F6FAFB]"
                          >
                            Ultimos 7 dias
                          </button>
                          <button
                            type="button"
                            onClick={() => aplicarPeriodoRapido('30d')}
                            className="inline-flex items-center rounded-full border border-[#D4E2E7] bg-white px-2.5 py-1 text-xs font-medium text-[#244455] transition hover:bg-[#F6FAFB]"
                          >
                            Ultimos 30 dias
                          </button>
                          <button
                            type="button"
                            onClick={() => aplicarPeriodoRapido('mesAtual')}
                            className="inline-flex items-center rounded-full border border-[#D4E2E7] bg-white px-2.5 py-1 text-xs font-medium text-[#244455] transition hover:bg-[#F6FAFB]"
                          >
                            Este mes
                          </button>
                          <button
                            type="button"
                            onClick={() => aplicarPeriodoRapido('mesAnterior')}
                            className="inline-flex items-center rounded-full border border-[#D4E2E7] bg-white px-2.5 py-1 text-xs font-medium text-[#244455] transition hover:bg-[#F6FAFB]"
                          >
                            Mes anterior
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Chips de filtros aplicados */}
                    {filtrosAtivos && (
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {busca && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#CDE2E8] bg-white px-3 py-1 text-xs text-[#446675]">
                            Busca: "{busca}"
                            <button
                              className="rounded-full p-0.5 text-[#7D98A4] hover:bg-[#EEF5F7] hover:text-[#456778]"
                              onClick={() => setBusca('')}
                              aria-label="Limpar busca"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        )}
                        {filtros.status && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#CDE2E8] bg-white px-3 py-1 text-xs text-[#446675]">
                            Status: {faturamentoService.formatarStatusFatura(filtros.status)}
                            <button
                              className="rounded-full p-0.5 text-[#7D98A4] hover:bg-[#EEF5F7] hover:text-[#456778]"
                              onClick={() => setFiltros((prev) => ({ ...prev, status: undefined }))}
                              aria-label="Limpar filtro de status"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        )}
                        {filtros.tipo && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#CDE2E8] bg-white px-3 py-1 text-xs text-[#446675]">
                            Tipo: {faturamentoService.formatarTipoFatura(filtros.tipo)}
                            <button
                              className="rounded-full p-0.5 text-[#7D98A4] hover:bg-[#EEF5F7] hover:text-[#456778]"
                              onClick={() => setFiltros((prev) => ({ ...prev, tipo: undefined }))}
                              aria-label="Limpar filtro de tipo"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        )}
                        {(filtros.dataInicial || filtros.dataFinal) && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#CDE2E8] bg-white px-3 py-1 text-xs text-[#446675]">
                            {periodoCampoAtual === 'vencimento' ? 'Vencimento' : 'Emissao'}:{' '}
                            {filtros.dataInicial
                              ? new Date(`${filtros.dataInicial}T00:00:00`).toLocaleDateString('pt-BR')
                              : '...'}{' '}
                            a{' '}
                            {filtros.dataFinal
                              ? new Date(`${filtros.dataFinal}T00:00:00`).toLocaleDateString('pt-BR')
                              : '...'}
                            <button
                              className="rounded-full p-0.5 text-[#7D98A4] hover:bg-[#EEF5F7] hover:text-[#456778]"
                              onClick={() =>
                                setFiltros((prev) => ({
                                  ...prev,
                                  dataInicial: undefined,
                                  dataFinal: undefined,
                                }))
                              }
                              aria-label="Limpar filtro de periodo"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        )}
                        {!filtros.dataInicial && !filtros.dataFinal && periodoCampoAtual === 'emissao' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#CDE2E8] bg-white px-3 py-1 text-xs text-[#446675]">
                            Base periodo: Emissao
                            <button
                              className="rounded-full p-0.5 text-[#7D98A4] hover:bg-[#EEF5F7] hover:text-[#456778]"
                              onClick={() =>
                                setFiltros((prev) => ({
                                  ...prev,
                                  periodoCampo: 'vencimento',
                                }))
                              }
                              aria-label="Voltar base para vencimento"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        )}
                        {(sortBy !== 'dataVencimento' || sortOrder !== 'DESC') && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#CDE2E8] bg-white px-3 py-1 text-xs text-[#446675]">
                            Ordenacao: {sortBy} ({sortOrder})
                            <button
                              className="rounded-full p-0.5 text-[#7D98A4] hover:bg-[#EEF5F7] hover:text-[#456778]"
                              onClick={() => {
                                setSortBy('dataVencimento');
                                setSortOrder('DESC');
                              }}
                              aria-label="Resetar ordenacao"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </FiltersBar>
              </>
            )}
            {/* Barra de Ações em Massa */}
            {mostrarAcoesMassa && (
              <div className="mb-4 rounded-xl border border-[#D4E2E7] bg-white p-3 sm:p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#D4E2E7] bg-[#F6FAFB] px-3 py-1 text-sm font-medium text-[#244455]">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#159A9C] text-white">
                          <CheckCircle className="h-3.5 w-3.5" />
                        </span>
                        {faturasSelecionadas.length} fatura(s) selecionada(s)
                      </span>
                      <button
                        onClick={() => setFaturasSelecionadas([])}
                        className="text-sm font-medium text-[#1A9E87] underline underline-offset-2 transition-colors hover:text-[#127A6B]"
                      >
                        Desmarcar todas
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleAcaoMassa('enviar-email')}
                        disabled={processandoAcaoMassa}
                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition-colors hover:bg-[#0F7B7D] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                        Enviar por Email
                      </button>
                      <button
                        onClick={() => handleAcaoMassa('baixar-pdfs')}
                        disabled={processandoAcaoMassa || !pdfDownloadHabilitado}
                        title={
                          !pdfDownloadHabilitado
                            ? 'Download de PDF indisponivel neste ambiente'
                            : 'Baixar PDFs'
                        }
                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition-colors hover:bg-[#0F7B7D] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Download className="h-4 w-4" />
                        {pdfDownloadHabilitado ? 'Baixar PDFs' : 'Baixar PDFs (off)'}
                      </button>
                      <button
                        onClick={() => handleAcaoMassa('gerar-cobranca')}
                        disabled={processandoAcaoMassa}
                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition-colors hover:bg-[#0F7B7D] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <AlertCircle className="h-4 w-4" />
                        Gerar Cobrança
                      </button>
                      <button
                        onClick={() => handleAcaoMassa('exportar')}
                        disabled={processandoAcaoMassa}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition-colors hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FileText className="h-4 w-4" />
                        Exportar
                      </button>
                      <button
                        onClick={() => handleAcaoMassa('excluir')}
                        disabled={processandoAcaoMassa}
                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#D92D20] px-3 text-sm font-medium text-white transition-colors hover:bg-[#B42318] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </button>
                    </div>
                  </div>

                  {processandoAcaoMassa && (
                    <div className="rounded-lg border border-[#D4E2E7] bg-[#F6FAFB] p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-[#1A9E87]" />
                        <span className="text-sm font-medium text-[#446675]">Processando ação...</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#DCECF0]">
                        <div
                          className="h-2 rounded-full bg-[#159A9C] transition-all duration-300"
                          style={{ width: `${progressoAcaoMassa}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lista de Faturas */}
            <DataTableCard>
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Lista de Faturas</h2>
              </div>

              {carregando ? (
                <SkeletonTable rows={pageSize || 10} columns={7} />
              ) : faturasFiltradas.length === 0 ? (
                <div className="p-10 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma fatura encontrada
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {busca
                      ? 'Nenhum resultado para a busca/filtros atuais.'
                      : 'Você ainda não possui faturas cadastradas.'}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={abrirModalCriacao}
                      className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm font-medium"
                      aria-label="Criar primeira fatura"
                    >
                      <Plus className="w-4 h-4" />
                      Criar Primeira Fatura
                    </button>
                    <button
                      onClick={() => refetch()}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm font-medium"
                      aria-label="Tentar novamente"
                    >
                      <Activity className="w-4 h-4" />
                      Tentar novamente
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden">
                  {/* Versão desktop - Grid moderno */}
                  <div className="hidden lg:block">
                    <div className="h-[calc(100vh-340px)] overflow-y-auto">
                      {/* Header do Grid */}
                      <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b border-gray-200 shadow-sm">
                        <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <div className="col-span-1 flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={
                                faturasFiltradas.length > 0 &&
                                faturasFiltradas.every((fatura) =>
                                  faturasSelecionadas.includes(fatura.id),
                                )
                              }
                              onChange={toggleSelecaoTodas}
                              className="w-4 h-4 text-[#159A9C] bg-white border-gray-300 rounded shadow-sm focus:ring-[#159A9C] focus:ring-2 transition-all"
                            />
                          </div>
                          <div className="col-span-2 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-blue-600" />
                            <span>Fatura</span>
                          </div>
                          <div className="col-span-2 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-blue-600" />
                            <span>Cliente</span>
                          </div>
                          <div className="col-span-2 flex items-center gap-1">
                            <Activity className="w-3 h-3 text-blue-600" />
                            <span>Status</span>
                          </div>
                          <div
                            className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => {
                              if (sortBy === 'dataVencimento') {
                                setSortOrder((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'));
                              } else {
                                setSortBy('dataVencimento');
                                setSortOrder('DESC');
                              }
                              setPage(1);
                              refetch();
                            }}
                            title="Ordenar por vencimento"
                          >
                            <Calendar className="w-3 h-3 text-blue-600" />
                            <span>Vencimento</span>
                            {sortBy === 'dataVencimento' &&
                              (sortOrder === 'DESC' ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronUp className="w-3 h-3" />
                              ))}
                          </div>
                          <div
                            className="col-span-2 flex items-center justify-end gap-1 cursor-pointer hover:text-blue-600 transition-colors pr-8"
                            onClick={() => {
                              if (sortBy === 'valorTotal') {
                                setSortOrder((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'));
                              } else {
                                setSortBy('valorTotal');
                                setSortOrder('DESC');
                              }
                              setPage(1);
                              refetch();
                            }}
                            title="Ordenar por valor"
                          >
                            <DollarSign className="w-3 h-3 text-blue-600" />
                            <span>Valor</span>
                            {sortBy === 'valorTotal' &&
                              (sortOrder === 'DESC' ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronUp className="w-3 h-3" />
                              ))}
                          </div>
                          <div className="col-span-1 flex items-center justify-center gap-1">
                            <Settings className="w-3 h-3 text-blue-600" />
                            <span>Ações</span>
                          </div>
                        </div>
                      </div>

                      {/* Body do Grid */}
                      <div className="divide-y divide-gray-100">
                        {faturasFiltradas.map((fatura) => {
                          const isVencida = faturamentoService.verificarVencimento(
                            fatura.dataVencimento,
                          );
                          const isSelected = faturasSelecionadas.includes(fatura.id);
                          const dataVencimento = new Date(fatura.dataVencimento);
                          const dataEmissao = new Date(fatura.dataEmissao);
                          const hoje = new Date();
                          const diasVencimento = Math.ceil(
                            (dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
                          );

                          // Definir classes de estilo baseado no status
                          let rowClass = `grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gradient-to-r hover:from-blue-25 hover:to-indigo-25 transition-all duration-200 group ${
                            isSelected
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 shadow-sm'
                              : ''
                          }`;

                          if (isVencida && fatura.status === StatusFatura.PENDENTE) {
                            rowClass +=
                              ' bg-gradient-to-r from-red-25 to-red-50 border-l-4 border-red-400';
                          } else if (
                            diasVencimento <= 7 &&
                            diasVencimento > 0 &&
                            fatura.status === StatusFatura.PENDENTE
                          ) {
                            rowClass +=
                              ' bg-gradient-to-r from-yellow-25 to-yellow-50 border-l-4 border-yellow-400';
                          }

                          return (
                            <div
                              key={fatura.id}
                              className={`${rowClass} cursor-pointer`}
                              role="button"
                              tabIndex={0}
                              onClick={() => abrirModalDetalhes(fatura)}
                              onKeyDown={(event) => {
                                if (event.target !== event.currentTarget) {
                                  return;
                                }
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  abrirModalDetalhes(fatura);
                                }
                              }}
                            >
                              {/* Checkbox */}
                              <div
                                className="col-span-1 flex items-center justify-center"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelecaoFatura(fatura.id)}
                                  onClick={(event) => event.stopPropagation()}
                                  className="w-4 h-4 text-[#159A9C] bg-white border-gray-300 rounded shadow-sm focus:ring-[#159A9C] focus:ring-2 transition-all"
                                />
                              </div>

                              {/* Número da Fatura */}
                              <div className="col-span-2 flex items-center">
                                <div
                                  className={`w-8 h-8 bg-gradient-to-br ${
                                    fatura.status === StatusFatura.PAGA
                                      ? 'from-emerald-100 to-emerald-200 shadow-emerald-200'
                                      : isVencida
                                        ? 'from-red-100 to-red-200 shadow-red-200'
                                        : 'from-blue-100 to-blue-200 shadow-blue-200'
                                  } rounded-xl flex items-center justify-center mr-3 shadow-md transition-all group-hover:shadow-lg group-hover:scale-105`}
                                >
                                  <FileText
                                    className={`w-4 h-4 ${
                                      fatura.status === StatusFatura.PAGA
                                        ? 'text-emerald-600'
                                        : isVencida
                                          ? 'text-red-600'
                                          : 'text-blue-600'
                                    }`}
                                  />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                    #{faturamentoService.formatarNumeroFatura(fatura.numero)}
                                  </div>
                                  <div className="text-xs text-gray-500 hidden sm:block">
                                    {faturamentoService.formatarTipoFatura(fatura.tipo)}
                                  </div>
                                </div>
                              </div>

                              {/* Cliente */}
                              <div className="col-span-2 flex items-center min-w-0">
                                <div className="w-7 h-7 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mr-3 shadow-md">
                                  <Building2 className="w-3 h-3 text-indigo-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                                    {obterNomeCliente(fatura.cliente, fatura.clienteId)}
                                  </div>
                                  {obterEmailCliente(fatura.cliente) && (
                                    <div
                                      className="text-xs text-gray-500 truncate hidden md:block"
                                      title={obterEmailCliente(fatura.cliente)!}
                                    >
                                      {obterEmailCliente(fatura.cliente)}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Status */}
                              <div className="col-span-2 flex items-center">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    {getStatusIcon(fatura.status, 'w-4 h-4')}
                                    <span
                                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shadow-sm transition-all group-hover:shadow-md ${getStatusColor(fatura.status)}`}
                                    >
                                      {faturamentoService.formatarStatusFatura(fatura.status)}
                                    </span>
                                  </div>
                                </div>
                                {/* Badges de alerta compactos */}
                                <div className="ml-2 flex flex-col gap-0.5">
                                  {isVencida && fatura.status === StatusFatura.PENDENTE && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 animate-pulse shadow-sm">
                                      <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                                      VENCIDA
                                    </span>
                                  )}
                                  {diasVencimento <= 7 &&
                                    diasVencimento > 0 &&
                                    fatura.status === StatusFatura.PENDENTE && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 shadow-sm">
                                        <Clock className="w-2.5 h-2.5 mr-0.5" />
                                        {diasVencimento}d
                                      </span>
                                    )}
                                </div>
                              </div>

                              {/* Vencimento */}
                              <div className="col-span-2 flex items-center">
                                <div>
                                  <div
                                    className={`text-sm font-medium tabular-nums ${
                                      isVencida
                                        ? 'text-red-600'
                                        : diasVencimento <= 7 &&
                                            diasVencimento > 0 &&
                                            fatura.status === StatusFatura.PENDENTE
                                          ? 'text-yellow-600'
                                          : 'text-gray-900'
                                    } group-hover:text-blue-700 transition-colors`}
                                  >
                                    {dataVencimento.toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: '2-digit',
                                    })}
                                  </div>
                                  <div className="text-xs text-gray-400 tabular-nums hidden sm:block">
                                    Em:{' '}
                                    {dataEmissao.toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                    })}
                                  </div>
                                </div>
                              </div>

                              {/* Valor */}
                              <div className="col-span-2 flex items-center justify-end pr-8">
                                <div className="text-right min-w-[140px]">
                                  <div className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors tabular-nums whitespace-nowrap">
                                    <span className="text-gray-500 mr-1 font-normal">R$</span>
                                    {Number(fatura.valorTotal).toLocaleString('pt-BR', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </div>
                                  {fatura.formaPagamento && (
                                    <div className="text-xs text-gray-500 truncate hidden md:block">
                                      {faturamentoService.formatarFormaPagamento(
                                        fatura.formaPagamento,
                                      )}
                                    </div>
                                  )}
                                  {fatura.status === StatusFatura.PAGA && (
                                    <div className="text-xs text-green-600 font-medium flex items-center justify-end gap-1">
                                      <CheckCircle className="w-3 h-3" />
                                      Pago
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Ações */}
                              <div
                                className="col-span-1 flex items-center justify-center min-w-[120px]"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                  {/* Ações principais sempre visíveis */}
                                  {fatura.status !== StatusFatura.PAGA &&
                                    fatura.status !== StatusFatura.CANCELADA && (
                                      <button
                                        onClick={() => {
                                          fecharMenuAcoes();
                                          abrirModalEdicao(fatura);
                                        }}
                                        className="p-2 text-[#159A9C] hover:text-[#0F7B7D] hover:bg-[#159A9C]/10 rounded-lg transition-all duration-200 border border-[#159A9C] hover:border-[#0F7B7D] shadow-sm hover:shadow-md"
                                        title="Editar Fatura"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                    )}

                                  {/* Menu dropdown para ações secundárias */}
                                  <div
                                    className="relative"
                                    data-menu-acoes-root="true"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <button
                                      onClick={(event) => alternarMenuAcoes(event, fatura.id)}
                                      aria-haspopup="menu"
                                      aria-expanded={menuAcoesAbertoId === fatura.id}
                                      className={`p-2 rounded-lg transition-all duration-200 border shadow-sm hover:shadow-md ${
                                        menuAcoesAbertoId === fatura.id
                                          ? 'text-gray-800 bg-gray-100 border-gray-300'
                                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                                      }`}
                                      title="Mais ações"
                                    >
                                      <MoreVertical className="w-3 h-3" />
                                    </button>

                                    {/* Dropdown menu compacto */}
                                    <div
                                      className={`absolute right-0 top-full mt-2 w-44 bg-white rounded-lg shadow-xl border border-gray-200 transition-all duration-200 z-50 overflow-hidden ${
                                        menuAcoesAbertoId === fatura.id
                                          ? 'opacity-100 visible translate-y-0'
                                          : 'opacity-0 invisible pointer-events-none -translate-y-1'
                                      }`}
                                    >
                                      <div className="py-1">
                                        {statusPermiteAcoesFinanceiras(fatura.status) && (
                                          <>
                                            <button
                                              onClick={() => {
                                                fecharMenuAcoes();
                                                enviarPorEmail(fatura.id);
                                              }}
                                              className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 transition-colors"
                                            >
                                              <Send className="w-3 h-3" />
                                              Enviar Email
                                            </button>
                                            <button
                                              onClick={() => {
                                                fecharMenuAcoes();
                                                abrirModalPagamentos(fatura);
                                              }}
                                              className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 transition-colors"
                                            >
                                              <DollarSign className="w-3 h-3" />
                                              Registrar Pgto
                                            </button>
                                            <button
                                              onClick={() => {
                                                fecharMenuAcoes();
                                                gerarLinkPagamento(fatura.id);
                                              }}
                                              disabled={!linkPagamentoHabilitado}
                                              title={
                                                !linkPagamentoHabilitado
                                                  ? motivoBloqueioGateway
                                                  : 'Gerar link de pagamento'
                                              }
                                              className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors ${
                                                linkPagamentoHabilitado
                                                  ? 'text-gray-700 hover:bg-orange-50 hover:text-orange-700'
                                                  : 'text-gray-400 cursor-not-allowed bg-gray-50'
                                              }`}
                                            >
                                              <Link2 className="w-3 h-3" />
                                              {linkPagamentoHabilitado ? 'Gerar Link' : 'Gerar Link (off)'}
                                            </button>
                                            <button
                                              onClick={() => {
                                                fecharMenuAcoes();
                                                abrirBoleto(fatura);
                                              }}
                                              className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 flex items-center gap-2 transition-colors"
                                            >
                                              <ExternalLink className="w-3 h-3" />
                                              Abrir Boleto
                                            </button>
                                            <button
                                              onClick={() => {
                                                fecharMenuAcoes();
                                                void copiarLinkBoleto(fatura);
                                              }}
                                              className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2 transition-colors"
                                            >
                                              <Copy className="w-3 h-3" />
                                              Copiar Link
                                            </button>
                                          </>
                                        )}

                                        <button
                                          onClick={() => {
                                            fecharMenuAcoes();
                                            baixarPDF(fatura.id);
                                          }}
                                          disabled={!pdfDownloadHabilitado}
                                          title={
                                            !pdfDownloadHabilitado
                                              ? 'Download de PDF indisponivel neste ambiente'
                                              : 'Baixar PDF'
                                          }
                                          className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors ${
                                            pdfDownloadHabilitado
                                              ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                                              : 'text-gray-400 cursor-not-allowed bg-gray-50'
                                          }`}
                                        >
                                          <Download className="w-3 h-3" />
                                          {pdfDownloadHabilitado ? 'Baixar PDF' : 'Baixar PDF (off)'}
                                        </button>

                                        <div className="border-t border-gray-100 my-1"></div>

                                        <button
                                          onClick={() => {
                                            fecharMenuAcoes();
                                            excluirFatura(fatura.id);
                                          }}
                                          className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          Excluir
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Versão mobile/tablet - cards */}
                  <div className="lg:hidden space-y-4 p-4">
                    {faturasFiltradas.map((fatura) => {
                      const isVencida = faturamentoService.verificarVencimento(
                        fatura.dataVencimento,
                      );
                      const isSelected = faturasSelecionadas.includes(fatura.id);
                      const dataVencimento = new Date(fatura.dataVencimento);
                      const dataEmissao = new Date(fatura.dataEmissao);
                      const hoje = new Date();
                      const diasVencimento = Math.ceil(
                        (dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
                      );

                      return (
                        <div
                          key={fatura.id}
                          className={`bg-white rounded-xl border-2 p-5 transition-all shadow-sm hover:shadow-md cursor-pointer ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 shadow-blue-100'
                              : isVencida && fatura.status === StatusFatura.PENDENTE
                                ? 'border-red-400 bg-red-50 shadow-red-100'
                                : diasVencimento <= 7 &&
                                    diasVencimento > 0 &&
                                    fatura.status === StatusFatura.PENDENTE
                                  ? 'border-yellow-400 bg-yellow-50 shadow-yellow-100'
                                  : 'border-gray-200 hover:border-gray-300'
                          }`}
                          role="button"
                          tabIndex={0}
                          onClick={() => abrirModalDetalhes(fatura)}
                          onKeyDown={(event) => {
                            if (event.target !== event.currentTarget) {
                              return;
                            }
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              abrirModalDetalhes(fatura);
                            }
                          }}
                        >
                          {/* Header do card aprimorado */}
                          <div className="flex items-start justify-between mb-4">
                            <div
                              className="flex items-center gap-3"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelecaoFatura(fatura.id)}
                                onClick={(event) => event.stopPropagation()}
                                className="w-4 h-4 text-[#159A9C] bg-gray-100 border-gray-300 rounded focus:ring-[#159A9C] focus:ring-2"
                              />
                              <div
                                className={`w-12 h-12 bg-gradient-to-br ${
                                  fatura.status === StatusFatura.PAGA
                                    ? 'from-green-100 to-green-200'
                                    : isVencida
                                      ? 'from-red-100 to-red-200'
                                      : 'from-blue-100 to-blue-200'
                                } rounded-xl flex items-center justify-center shadow-sm`}
                              >
                                <FileText
                                  className={`w-6 h-6 ${
                                    fatura.status === StatusFatura.PAGA
                                      ? 'text-green-600'
                                      : isVencida
                                        ? 'text-red-600'
                                        : 'text-blue-600'
                                  }`}
                                />
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 text-lg">
                                  #{faturamentoService.formatarNumeroFatura(fatura.numero)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {faturamentoService.formatarTipoFatura(fatura.tipo)}
                                </div>
                              </div>
                            </div>

                            {/* Status e badges aprimorados */}
                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(fatura.status)} shadow-sm`}
                              >
                                {getStatusIcon(fatura.status)}
                                <span className="ml-1.5">
                                  {faturamentoService.formatarStatusFatura(fatura.status)}
                                </span>
                              </span>
                              {isVencida && fatura.status === StatusFatura.PENDENTE && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  VENCIDA
                                </span>
                              )}
                              {diasVencimento <= 7 &&
                                diasVencimento > 0 &&
                                fatura.status === StatusFatura.PENDENTE && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {diasVencimento} dia{diasVencimento !== 1 ? 's' : ''}
                                  </span>
                                )}
                            </div>
                          </div>

                          {/* Informações principais aprimoradas */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                Cliente
                              </label>
                              <div className="font-semibold text-gray-900 mt-1">
                                {obterNomeCliente(fatura.cliente, fatura.clienteId)}
                              </div>
                              {obterEmailCliente(fatura.cliente) && (
                                <div
                                  className="text-sm text-gray-500 truncate mt-1"
                                  title={obterEmailCliente(fatura.cliente)!}
                                >
                                  {obterEmailCliente(fatura.cliente)}
                                </div>
                              )}
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                Valor
                              </label>
                              <div className="text-xl font-bold text-gray-900 mt-1">
                                R${' '}
                                {Number(fatura.valorTotal).toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                              {fatura.formaPagamento && (
                                <div className="text-sm text-gray-500 mt-1">
                                  {faturamentoService.formatarFormaPagamento(fatura.formaPagamento)}
                                </div>
                              )}
                              {fatura.status === StatusFatura.PAGA && (
                                <div className="text-sm text-green-600 font-medium flex items-center gap-1 mt-1">
                                  <CheckCircle className="w-4 h-4" />
                                  Pago
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Datas aprimoradas */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Vencimento
                              </label>
                              <div
                                className={`font-semibold mt-1 ${
                                  isVencida
                                    ? 'text-red-600'
                                    : diasVencimento <= 7 &&
                                        diasVencimento > 0 &&
                                        fatura.status === StatusFatura.PENDENTE
                                      ? 'text-yellow-600'
                                      : 'text-gray-900'
                                }`}
                              >
                                {dataVencimento.toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                                {isVencida && (
                                  <div className="text-xs text-red-500 font-normal mt-1">
                                    Venceu há {Math.abs(diasVencimento)} dia
                                    {Math.abs(diasVencimento) !== 1 ? 's' : ''}
                                  </div>
                                )}
                                {diasVencimento <= 7 &&
                                  diasVencimento > 0 &&
                                  fatura.status === StatusFatura.PENDENTE && (
                                    <div className="text-xs text-yellow-500 font-normal mt-1">
                                      Vence em {diasVencimento} dia{diasVencimento !== 1 ? 's' : ''}
                                    </div>
                                  )}
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Emissão
                              </label>
                              <div className="text-gray-900 font-semibold mt-1">
                                {dataEmissao.toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Ações aprimoradas */}
                          <div
                            className="flex items-center justify-between pt-4 border-t border-gray-200"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <div className="flex items-center gap-2">
                              {fatura.status !== StatusFatura.PAGA &&
                                fatura.status !== StatusFatura.CANCELADA && (
                                  <button
                                    onClick={() => {
                                      fecharMenuAcoes();
                                      abrirModalEdicao(fatura);
                                    }}
                                    className="px-4 py-2 text-sm text-[#159A9C] hover:text-[#0F7B7D] hover:bg-[#159A9C]/10 rounded-lg transition-all duration-200 flex items-center gap-2 border border-[#159A9C] hover:border-[#0F7B7D] shadow-sm hover:shadow-md font-medium"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                    Editar
                                  </button>
                                )}
                              {statusPermiteAcoesFinanceiras(fatura.status) && (
                                <button
                                  onClick={() => {
                                    fecharMenuAcoes();
                                    abrirModalPagamentos(fatura);
                                  }}
                                  className="px-4 py-2 text-sm bg-[#159A9C] hover:bg-[#0F7B7D] text-white rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md font-medium"
                                >
                                  <DollarSign className="w-4 h-4" />
                                  Pagar
                                </button>
                              )}
                            </div>

                            {/* Menu dropdown mobile aprimorado */}
                            <div
                              className="relative"
                              data-menu-acoes-root="true"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <button
                                onClick={(event) => alternarMenuAcoes(event, fatura.id)}
                                aria-haspopup="menu"
                                aria-expanded={menuAcoesAbertoId === fatura.id}
                                className={`p-2.5 rounded-lg transition-all duration-200 border shadow-sm hover:shadow-md ${
                                  menuAcoesAbertoId === fatura.id
                                    ? 'text-gray-800 bg-gray-100 border-gray-300'
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              <div
                                className={`absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 transition-all duration-200 z-50 overflow-hidden ${
                                  menuAcoesAbertoId === fatura.id
                                    ? 'opacity-100 visible translate-y-0'
                                    : 'opacity-0 invisible pointer-events-none -translate-y-1'
                                }`}
                              >
                                <div className="py-2">
                                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                    Mais Ações
                                  </div>

                                  {statusPermiteCobranca(fatura.status) && (
                                    <button
                                      onClick={() => {
                                        fecharMenuAcoes();
                                        abrirModalGateway(fatura);
                                      }}
                                      disabled={!gatewayUiHabilitada}
                                      title={
                                        !gatewayUiHabilitada
                                          ? motivoBloqueioGateway
                                          : 'Abrir pagamento online'
                                      }
                                      className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors ${
                                        gatewayUiHabilitada
                                          ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                                          : 'text-gray-400 bg-gray-50 cursor-not-allowed'
                                      }`}
                                    >
                                      <CreditCard className="w-4 h-4" />
                                      <div>
                                        <div className="font-medium">
                                          {gatewayUiHabilitada ? 'Pagar Online' : 'Pagar Online (off)'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {gatewayUiHabilitada ? 'Gateway' : 'Gateway indisponível'}
                                        </div>
                                      </div>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      fecharMenuAcoes();
                                      baixarPDF(fatura.id);
                                    }}
                                    disabled={!pdfDownloadHabilitado}
                                    title={
                                      !pdfDownloadHabilitado
                                        ? 'Download de PDF indisponivel neste ambiente'
                                        : 'Baixar PDF'
                                    }
                                    className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors ${
                                      pdfDownloadHabilitado
                                        ? 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                                        : 'text-gray-400 bg-gray-50 cursor-not-allowed'
                                    }`}
                                  >
                                    <Download className="w-4 h-4" />
                                    <div>
                                      <div className="font-medium">
                                        {pdfDownloadHabilitado ? 'Baixar PDF' : 'Baixar PDF (off)'}
                                      </div>
                                      <div className="text-xs text-gray-500">Documento</div>
                                    </div>
                                  </button>

                                  {statusPermiteCobranca(fatura.status) && (
                                    <button
                                      onClick={() => {
                                        fecharMenuAcoes();
                                        enviarPorEmail(fatura.id);
                                      }}
                                      className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-3 transition-colors"
                                    >
                                    <Send className="w-4 h-4" />
                                    <div>
                                      <div className="font-medium">Enviar Email</div>
                                      <div className="text-xs text-gray-500">Cobrança</div>
                                    </div>
                                    </button>
                                  )}

                                  {statusPermiteCobranca(fatura.status) && (
                                    <button
                                      onClick={() => {
                                        fecharMenuAcoes();
                                        gerarLinkPagamento(fatura.id);
                                      }}
                                      className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-3 transition-colors"
                                    >
                                      <Link2 className="w-4 h-4" />
                                      <div>
                                        <div className="font-medium">Gerar Link</div>
                                        <div className="text-xs text-gray-500">Pagamento</div>
                                      </div>
                                    </button>
                                  )}

                                  {statusPermiteCobranca(fatura.status) && (
                                    <button
                                      onClick={() => {
                                        fecharMenuAcoes();
                                        abrirBoleto(fatura);
                                      }}
                                      className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 flex items-center gap-3 transition-colors"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                      <div>
                                        <div className="font-medium">Abrir Boleto</div>
                                        <div className="text-xs text-gray-500">Checkout</div>
                                      </div>
                                    </button>
                                  )}

                                  {statusPermiteCobranca(fatura.status) && (
                                    <button
                                      onClick={() => {
                                        fecharMenuAcoes();
                                        void copiarLinkBoleto(fatura);
                                      }}
                                      className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-3 transition-colors"
                                    >
                                      <Copy className="w-4 h-4" />
                                      <div>
                                        <div className="font-medium">Copiar Link</div>
                                        <div className="text-xs text-gray-500">Pagamento</div>
                                      </div>
                                    </button>
                                  )}

                                  <div className="border-t border-gray-100 my-1"></div>

                                  <button
                                    onClick={() => {
                                      fecharMenuAcoes();
                                      excluirFatura(fatura.id);
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-3 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <div>
                                      <div className="font-medium">Excluir</div>
                                      <div className="text-xs text-red-400">Permanente</div>
                                    </div>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Barra de estatísticas otimizada */}
                  <div className="px-4 py-3 border-t bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-gray-600">Página atual:</span>
                        <span className="font-bold text-blue-700 tabular-nums whitespace-nowrap">
                          <span className="text-gray-500 mr-1 font-normal">R$</span>
                          {faturasFiltradas
                            .reduce((acc, f) => acc + Number(f.valorTotal || 0), 0)
                            .toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                        </span>
                        <span className="text-gray-500">({faturasFiltradas.length} itens)</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-600">Recebido:</span>
                        <span className="font-bold text-green-700 tabular-nums whitespace-nowrap">
                          <span className="text-gray-500 mr-1 font-normal">R$</span>
                          {Number(aggregates?.valorRecebido ?? 0).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-gray-600">Em aberto:</span>
                        <span className="font-bold text-orange-700 tabular-nums whitespace-nowrap">
                          <span className="text-gray-500 mr-1 font-normal">R$</span>
                          {Number(aggregates?.valorEmAberto ?? 0).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <div className="flex items-center gap-0.5">
                          <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
                          <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                          <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                        </div>
                        <span className="text-gray-600">Grid:</span>
                        <span className="font-bold text-purple-700">Otimizado</span>
                      </div>
                    </div>
                  </div>

                  {/* Paginação aprimorada */}
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-white">
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      Mostrando{' '}
                      <span className="font-semibold tabular-nums">
                        {(page - 1) * pageSize + 1}
                      </span>{' '}
                      -{' '}
                      <span className="font-semibold tabular-nums">
                        {Math.min(page * pageSize, total)}
                      </span>{' '}
                      de <span className="font-semibold tabular-nums">{total}</span> faturas
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Controles de navegação */}
                      <div className="flex items-center gap-2">
                        <button
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          <ChevronUp className="w-4 h-4 rotate-[-90deg]" />
                          Anterior
                        </button>

                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Página</span>
                          <input
                            type="number"
                            min={1}
                            max={Math.max(1, Math.ceil(total / pageSize))}
                            value={page}
                            onChange={(e) => {
                              const alvo = Number(e.target.value || '1');
                              const max = Math.max(1, Math.ceil(total / pageSize));
                              const pagina = Math.min(Math.max(1, alvo), max);
                              setPage(pagina);
                            }}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                            aria-label="Número da página"
                          />
                          <span className="text-sm text-gray-600">
                            de {Math.max(1, Math.ceil(total / pageSize))}
                          </span>
                        </div>

                        <button
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                          onClick={() => setPage((p) => (p * pageSize < total ? p + 1 : p))}
                          disabled={page * pageSize >= total}
                        >
                          Próxima
                          <ChevronUp className="w-4 h-4 rotate-90" />
                        </button>
                      </div>

                      {/* Seletor de itens por página */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Itens por página:</span>
                        <select
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          value={pageSize}
                          onChange={(e) => {
                            setPage(1);
                            setPageSize(parseInt(e.target.value, 10));
                          }}
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DataTableCard>
          </div>
        )}

        {/* Visão de Relatórios Avançados */}
        {visaoAtiva === 'relatorios' && (
          <RelatoriosAvancados faturas={faturas} onExportar={handleExportarRelatorio} />
        )}

        {/* Visão de Automação de E-mails */}
        {visaoAtiva === 'email' && (
          <EmailAutomacao faturas={faturas} onEnviarEmail={handleEnviarEmail} />
        )}

        {/* Visão de Workflows */}
        {visaoAtiva === 'workflows' && (
          <WorkflowAutomacao faturas={faturas} onExecutarAcao={handleExecutarWorkflow} />
        )}
      {/* Modais */}
      <ModalFatura
        isOpen={modalAberto}
        onClose={fecharModal}
        onSave={handleSalvarFatura}
        fatura={faturaEdicao}
      />

      {faturaDetalhes && (
        <ModalDetalhesFatura
          isOpen={modalDetalhesAberto}
          onClose={fecharModalDetalhes}
          fatura={faturaDetalhes}
          onEstornarPagamento={estornarPagamento}
          onEdit={() => {
            abrirModalEdicao(faturaDetalhes);
            fecharModalDetalhes();
          }}
          onGeneratePaymentLink={gerarLinkPagamento}
          onSendEmail={enviarPorEmail}
          onDownloadPDF={pdfDownloadHabilitado ? baixarPDF : undefined}
        />
      )}

      {faturaPagamentos && (
        <ModalPagamentos
          isOpen={modalPagamentosAberto}
          onClose={fecharModalPagamentos}
          fatura={faturaPagamentos}
          onRegistrarPagamento={registrarPagamento}
          onEstornarPagamento={estornarPagamento}
        />
      )}

      {/* Modal Gateway de Pagamento */}
      {faturaGateway && (
        <GatewayPagamento
          fatura={faturaGateway}
          onPagamentoConcluido={handlePagamentoConcluido}
          onSolicitarLinkPagamento={gerarLinkPagamento}
          onFechar={fecharModalGateway}
        />
      )}

      {/* Modal de Confirmação Inteligente */}
      {confirmacao.tipo && (
        <ModalConfirmacao
          isOpen={confirmacao.isOpen}
          onClose={confirmacao.fechar}
          onConfirm={confirmacao.executarConfirmacao}
          tipo={confirmacao.tipo}
          dados={confirmacao.dados}
          loading={confirmacao.loading}
        />
      )}

      {/* Sistema de Notificações */}
      {notificacao.notificacoes.map((notif, index) => (
        <div key={notif.id} style={{ top: `${index * 110 + 16}px` }}>
          <NotificacaoSucesso
            isOpen={true}
            tipo={notif.tipo}
            titulo={notif.titulo}
            mensagem={notif.mensagem}
            onClose={() => notificacao.fecharNotificacao(notif.id)}
            autoClose={notif.autoClose}
            duration={notif.duration}
          />
        </div>
      ))}
    </div>
  );
}




