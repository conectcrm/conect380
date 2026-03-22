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
  Eye,
  Send,
  Link2,
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
  AmbienteDocumentoFiscal,
  DocumentoFiscalCancelamentoPayload,
  DocumentoFiscalPayload,
  DocumentoFiscalPreflightDiagnostico,
  faturamentoService,
  DocumentoFiscalStatus,
  Fatura,
  FormaPagamento,
  TipoDocumentoFiscal,
  NovaFatura,
  StatusFatura,
  TipoFatura,
  FiltrosFatura,
} from '../../services/faturamentoService';
import ModalFatura from './ModalFatura';
import ModalDetalhesFatura from './ModalDetalhesFatura';
import ModalPagamentos from './ModalPagamentos';
import NotificacoesFaturamento from '../../components/notificacoes/NotificacoesFaturamento';
import SkeletonTable from '../../components/skeleton/SkeletonTable';
import RelatoriosAvancados from '../../components/analytics/RelatoriosAvancados';
import EmailAutomacao, {
  EnvioEmailAutomacaoPayload,
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
  const [documentoFiscalStatus, setDocumentoFiscalStatus] = useState<DocumentoFiscalStatus | null>(
    null,
  );
  const [fiscalActionLoading, setFiscalActionLoading] = useState(false);
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

  // Estado para loading e skeleton

  // Estados para funcionalidades avançadas da Semana 2
  const [faturaGateway, setFaturaGateway] = useState<Fatura | null>(null);
  const [visaoAtiva, setVisaoAtiva] = useState<
    'dashboard' | 'prontidao' | 'relatorios' | 'email' | 'workflows'
  >('dashboard');
  const [preflightFiscalProntidao, setPreflightFiscalProntidao] =
    useState<DocumentoFiscalPreflightDiagnostico | null>(null);
  const [carregandoPreflightFiscalProntidao, setCarregandoPreflightFiscalProntidao] =
    useState(false);
  const [erroPreflightFiscalProntidao, setErroPreflightFiscalProntidao] = useState<string | null>(
    null,
  );

  const [dashboardCards, setDashboardCards] = useState<DashboardCards>({
    totalFaturas: 0,
    faturasVencidas: 0,
    valorTotalPendente: 0,
    valorTotalPago: 0,
    faturasPagas: 0,
    faturasDoMes: 0,
  });

  // Hooks para confirmação inteligente
  const confirmacao = useConfirmacaoInteligente();
  const validacao = useValidacaoFinanceira();
  const notificacao = useNotificacaoFinanceira();
  const gatewayUiConfig = getPagamentosGatewayUiConfig();
  const gatewayUiHabilitada = gatewayUiConfig.onlineGatewayUiEnabled;
  const linkPagamentoHabilitado = gatewayUiConfig.paymentLinkEnabled;

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

  const carregarPreflightFiscalProntidao = async () => {
    setErroPreflightFiscalProntidao(null);
    setCarregandoPreflightFiscalProntidao(true);
    try {
      const resultado = await faturamentoService.executarPreflightFiscal();
      setPreflightFiscalProntidao(resultado);
    } catch (error) {
      console.error('Erro ao carregar preflight fiscal:', error);
      setErroPreflightFiscalProntidao('Nao foi possivel validar a prontidao fiscal oficial.');
    } finally {
      setCarregandoPreflightFiscalProntidao(false);
    }
  };

  useEffect(() => {
    if (visaoAtiva !== 'prontidao') {
      return;
    }

    if (preflightFiscalProntidao || carregandoPreflightFiscalProntidao) {
      return;
    }

    void carregarPreflightFiscalProntidao();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visaoAtiva, preflightFiscalProntidao, carregandoPreflightFiscalProntidao]);

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
    setDocumentoFiscalStatus(null);
    setModalDetalhesAberto(true);
  };

  const fecharModalDetalhes = () => {
    setModalDetalhesAberto(false);
    setFaturaDetalhes(null);
    setDocumentoFiscalStatus(null);
    setFiscalActionLoading(false);
  };

  const abrirModalPagamentos = (fatura: Fatura) => {
    setFaturaPagamentos(fatura);
    setModalPagamentosAberto(true);
  };

  const fecharModalPagamentos = () => {
    setModalPagamentosAberto(false);
    setFaturaPagamentos(null);
  };

  const marcarNotificacaoComoLida = (notificacaoId: string) => {
    // Implementar lógica para marcar notificação como lida
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

  const normalizarTipoDocumentoFiscal = (tipo: unknown): TipoDocumentoFiscal | undefined => {
    const tipoNormalizado = String(tipo || '')
      .trim()
      .toLowerCase();
    if (tipoNormalizado === 'nfse' || tipoNormalizado === 'nfe') {
      return tipoNormalizado as TipoDocumentoFiscal;
    }
    return undefined;
  };

  const normalizarAmbienteDocumentoFiscal = (ambiente: unknown): AmbienteDocumentoFiscal => {
    const ambienteNormalizado = String(ambiente || '')
      .trim()
      .toLowerCase();
    return ambienteNormalizado === 'producao' ? 'producao' : 'homologacao';
  };

  const obterTipoDocumentoFiscalDaFatura = (fatura?: Fatura | null): TipoDocumentoFiscal | undefined => {
    const detalhes = fatura?.detalhesTributarios;
    if (!detalhes || typeof detalhes !== 'object' || Array.isArray(detalhes)) {
      return undefined;
    }

    const documentoRaw = (detalhes as Record<string, unknown>).documento;
    if (!documentoRaw || typeof documentoRaw !== 'object' || Array.isArray(documentoRaw)) {
      return undefined;
    }

    return normalizarTipoDocumentoFiscal((documentoRaw as Record<string, unknown>).tipo);
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

  const carregarStatusDocumentoFiscal = async (
    faturaId: number,
    options?: { silencioso?: boolean; usarLoading?: boolean; sincronizar?: boolean },
  ) => {
    const silencioso = options?.silencioso ?? true;
    const usarLoading = options?.usarLoading ?? false;
    const sincronizar = options?.sincronizar ?? false;

    if (usarLoading) {
      setFiscalActionLoading(true);
    }

    try {
      const status = await faturamentoService.obterStatusDocumentoFiscal(faturaId, {
        sincronizar,
      });
      setDocumentoFiscalStatus(status);
      return status;
    } catch (error) {
      if (!silencioso) {
        notificacao.erro.operacaoFalhou(
          'consultar status fiscal',
          obterMensagemErro(error, 'Falha ao consultar status do documento fiscal.'),
        );
      }
      setDocumentoFiscalStatus(null);
      return null;
    } finally {
      if (usarLoading) {
        setFiscalActionLoading(false);
      }
    }
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
    if (!modalDetalhesAberto || !faturaDetalhes?.id) {
      return;
    }

    let ativo = true;

    (async () => {
      try {
        const status = await faturamentoService.obterStatusDocumentoFiscal(faturaDetalhes.id);
        if (ativo) {
          setDocumentoFiscalStatus(status);
        }
      } catch {
        if (ativo) {
          setDocumentoFiscalStatus(null);
        }
      }
    })();

    return () => {
      ativo = false;
    };
  }, [modalDetalhesAberto, faturaDetalhes?.id]);

  // Handlers para funcionalidades avançadas da Semana 2
  const abrirModalGateway = (fatura: Fatura) => {
    if (!gatewayUiHabilitada) {
      notificacao.mostrarAviso('Gateway indisponível', gatewayUiConfig.motivoBloqueio);
      return;
    }
    setFaturaGateway(fatura);
  };

  const fecharModalGateway = () => {
    setFaturaGateway(null);
  };

  const handlePagamentoConcluido = async (_transacao: unknown) => {
    try {
      // Marca como paga no endpoint dedicado para manter sincronizacao com proposta.
      if (faturaGateway) {
        const valorPago = Number(faturaGateway.valorTotal || 0);
        await faturamentoService.marcarFaturaComoPaga(faturaGateway.id, valorPago);
        carregarFaturas();
        fecharModalGateway();
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
    }
  };

  const handleEnviarEmail = async (envios: EnvioEmailAutomacaoPayload[]) => {
    try {
      if (!envios.length) {
        notificacao.mostrarAviso(
          'Seleção necessária',
          'Selecione ao menos uma fatura para envio.',
        );
        return;
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
    } catch (error) {
      console.error('Erro ao enviar emails:', error);
      notificacao.erro.operacaoFalhou(
        'enviar e-mails',
        obterMensagemErro(error, 'Erro ao enviar e-mails.'),
      );
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
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const faturasElegiveis = faturas.filter((fatura) => {
          if (
            ![StatusFatura.PENDENTE, StatusFatura.ENVIADA, StatusFatura.PARCIALMENTE_PAGA].includes(
              fatura.status,
            )
          ) {
            return false;
          }

          const dataVencimento = new Date(fatura.dataVencimento);
          dataVencimento.setHours(0, 0, 0, 0);
          const diffDias = Math.ceil(
            (dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
          );
          return diffDias >= 0 && diffDias <= 3;
        });

        if (!faturasElegiveis.length) {
          return {
            processados: 0,
            sucesso: 0,
            falhas: 0,
            mensagem: 'Nenhuma fatura elegível para lembrete de vencimento.',
          };
        }

        await faturamentoService.enviarLembretesVencimento();

        const resultado: WorkflowExecutionResult = {
          processados: faturasElegiveis.length,
          sucesso: faturasElegiveis.length,
          falhas: 0,
          mensagem: faturasElegiveis.length + ' lembrete(s) de vencimento processado(s).',
        };
        notificacao.mostrarSucesso('Workflow executado', resultado.mensagem);
        return resultado;
      }

      if (acao === 'workflow_cobranca_vencidas') {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const faturasVencidas = faturas.filter((fatura) => {
          if ([StatusFatura.PAGA, StatusFatura.CANCELADA].includes(fatura.status)) return false;
          const dataVencimento = new Date(fatura.dataVencimento);
          dataVencimento.setHours(0, 0, 0, 0);
          return dataVencimento < hoje;
        });

        if (!faturasVencidas.length) {
          return {
            processados: 0,
            sucesso: 0,
            falhas: 0,
            mensagem: 'Nenhuma fatura vencida para cobrança neste momento.',
          };
        }

        const resultados = await Promise.allSettled(
          faturasVencidas.map((fatura) => faturamentoService.enviarFaturaPorEmail(fatura.id)),
        );
        const enviados = resultados.filter((item) => item.status === 'fulfilled').length;
        const simulados = resultados.filter(
          (item) => item.status === 'fulfilled' && Boolean(item.value.simulado),
        ).length;
        const sucesso = enviados - simulados;
        const falhas = resultados.length - enviados;

        if (sucesso > 0) {
          notificacao.mostrarSucesso(
            'Workflow executado',
            sucesso + ' cobrança(s) enviada(s) por e-mail.',
          );
        }
        if (simulados > 0) {
          notificacao.mostrarAviso(
            'Workflow em modo simulado',
            simulados +
              ' envio(s) foram simulados. Configure SMTP na empresa para envio real.',
          );
        }
        if (falhas > 0) {
          const primeiraFalha = resultados.find(
            (item): item is PromiseRejectedResult => item.status === 'rejected',
          );
          notificacao.erro.operacaoFalhou(
            'workflow de cobrança',
            falhas +
              ' envio(s) falharam. ' +
              obterMensagemErro(primeiraFalha?.reason, 'Falha no lote.'),
          );
        }

        return {
          processados: resultados.length,
          sucesso,
          falhas,
          mensagem:
            'Lote de cobrança finalizado: ' +
            sucesso +
            ' envio(s) real(is), ' +
            simulados +
            ' simulado(s), ' +
            falhas +
            ' falha(s).',
        };
      }

      if (acao === 'workflow_sincronizacao_financeira') {
        const tarefas = await Promise.allSettled([
          faturamentoService.verificarFaturasVencidas(),
          faturamentoService.processarCobrancasRecorrentes(),
        ]);

        const sucesso = tarefas.filter((item) => item.status === 'fulfilled').length;
        const falhas = tarefas.length - sucesso;

        await carregarFaturas();

        if (falhas > 0) {
          const primeiraFalha = tarefas.find(
            (item): item is PromiseRejectedResult => item.status === 'rejected',
          );
          const mensagemFalha = obterMensagemErro(
            primeiraFalha?.reason,
            'Falha na sincronização financeira.',
          );
          notificacao.erro.operacaoFalhou('workflow de sincronização', mensagemFalha);
          return {
            processados: tarefas.length,
            sucesso,
            falhas,
            mensagem: 'Sincronização concluída com ' + falhas + ' falha(s).',
          };
        }

        const mensagem = 'Sincronização financeira executada com sucesso.';
        notificacao.mostrarSucesso('Workflow executado', mensagem);
        return {
          processados: tarefas.length,
          sucesso,
          falhas: 0,
          mensagem,
        };
      }

      const mensagem = 'Ação de workflow não mapeada: ' + acao;
      notificacao.mostrarAviso('Workflow indisponível', mensagem);
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

  const criarRascunhoFiscal = async (id: number, payload?: DocumentoFiscalPayload) => {
    const tipoDocumento = payload?.tipo || obterTipoDocumentoFiscalDaFatura(faturaDetalhes);
    const ambiente = normalizarAmbienteDocumentoFiscal(
      payload?.ambiente || documentoFiscalStatus?.ambiente,
    );
    const observacoes =
      payload?.observacoes?.trim() || 'Rascunho fiscal atualizado no painel de faturamento.';
    setFiscalActionLoading(true);
    try {
      const status = await faturamentoService.criarRascunhoDocumentoFiscal(id, {
        tipo: tipoDocumento,
        ambiente,
        observacoes,
      });
      setDocumentoFiscalStatus(status);
      await sincronizarFaturaAtualizada(id);
      notificacao.mostrarSucesso(
        'Rascunho fiscal atualizado',
        'Documento fiscal preparado para emissao.',
      );
    } catch (error) {
      console.error('Erro ao criar rascunho fiscal:', error);
      notificacao.erro.operacaoFalhou(
        'criar rascunho fiscal',
        obterMensagemErro(error, 'Falha ao preparar rascunho do documento fiscal.'),
      );
    } finally {
      setFiscalActionLoading(false);
    }
  };

  const emitirDocumentoFiscal = async (id: number, payload?: DocumentoFiscalPayload) => {
    const tipoDocumento = payload?.tipo || obterTipoDocumentoFiscalDaFatura(faturaDetalhes);
    const ambiente = normalizarAmbienteDocumentoFiscal(
      payload?.ambiente || documentoFiscalStatus?.ambiente,
    );
    const modoProcessamento = payload?.modoProcessamento || documentoFiscalStatus?.modoProcessamento || 'sincrono';
    const contingencia = payload?.contingencia ?? documentoFiscalStatus?.contingencia ?? false;
    const forcarReemissao =
      payload?.forcarReemissao === true || documentoFiscalStatus?.status === 'emitida';
    const observacoes =
      payload?.observacoes?.trim() || 'Emissao fiscal solicitada no painel de faturamento.';
    setFiscalActionLoading(true);
    try {
      const status = await faturamentoService.emitirDocumentoFiscal(id, {
        tipo: tipoDocumento,
        ambiente,
        modoProcessamento,
        contingencia,
        forcarReemissao,
        observacoes,
      });
      setDocumentoFiscalStatus(status);
      await sincronizarFaturaAtualizada(id);
      await carregarFaturas();
      notificacao.mostrarSucesso('Documento fiscal emitido', 'Emissao registrada com sucesso.');
    } catch (error) {
      console.error('Erro ao emitir documento fiscal:', error);
      notificacao.erro.operacaoFalhou(
        'emitir documento fiscal',
        obterMensagemErro(error, 'Falha ao emitir documento fiscal.'),
      );
    } finally {
      setFiscalActionLoading(false);
    }
  };

  const atualizarStatusFiscal = async (id: number) => {
    const status = await carregarStatusDocumentoFiscal(id, {
      silencioso: false,
      usarLoading: true,
      sincronizar: true,
    });
    if (!status) {
      return;
    }
    try {
      await sincronizarFaturaAtualizada(id);
    } catch {}
    notificacao.mostrarSucesso('Status fiscal atualizado', 'Dados fiscais sincronizados.');
  };

  const cancelarOuInutilizarDocumentoFiscal = async (
    id: number,
    payload: DocumentoFiscalCancelamentoPayload,
  ) => {
    const tipoOperacao = payload?.tipoOperacao === 'inutilizar' ? 'inutilizar' : 'cancelar';
    const motivo = String(payload?.motivo || '').trim();
    if (!motivo) {
      notificacao.mostrarAviso(
        'Motivo obrigatorio',
        'Informe o motivo para cancelar ou inutilizar o documento fiscal.',
      );
      return;
    }

    setFiscalActionLoading(true);
    try {
      const status = await faturamentoService.cancelarOuInutilizarDocumentoFiscal(id, {
        tipoOperacao,
        motivo,
        ambiente: normalizarAmbienteDocumentoFiscal(payload.ambiente || documentoFiscalStatus?.ambiente),
      });
      setDocumentoFiscalStatus(status);
      await sincronizarFaturaAtualizada(id);
      await carregarFaturas();
      notificacao.mostrarSucesso(
        tipoOperacao === 'cancelar' ? 'Documento fiscal cancelado' : 'Numeracao inutilizada',
        'Status fiscal atualizado com sucesso.',
      );
    } catch (error) {
      console.error('Erro ao cancelar/inutilizar documento fiscal:', error);
      notificacao.erro.operacaoFalhou(
        'atualizar status fiscal',
        obterMensagemErro(error, 'Falha ao cancelar/inutilizar documento fiscal.'),
      );
    } finally {
      setFiscalActionLoading(false);
    }
  };

  const gerarLinkPagamento = async (id: number) => {
    if (!linkPagamentoHabilitado) {
      notificacao.mostrarAviso('Link de pagamento indisponível', gatewayUiConfig.motivoBloqueio);
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
      notificacao.erro.operacaoFalhou(
        'gerar link de pagamento',
        obterMensagemErro(error, 'Recurso indisponível no backend atual.'),
      );
    }
  };

  const enviarPorEmail = async (id: number) => {
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
        throw new Error('Fatura não encontrada');
      }

      // Preparar dados do pagamento no formato esperado pela API
      const dadosPagamento = {
        faturaId: faturaPagamentos.id,
        valor: pagamento.valor,
        dataPagamento: pagamento.data,
        formaPagamento: pagamento.metodo as FormaPagamento,
        metodoPagamento: pagamento.metodo, // Para compatibilidade com backend
        tipo: 'pagamento', // TipoPagamento.PAGAMENTO
        observacoes: pagamento.observacoes || '',
        transacaoId: `PAG_${Date.now()}_${faturaPagamentos.id}`, // ID único para a transação
        gatewayTransacaoId: `PAG_${Date.now()}_${faturaPagamentos.id}`, // Para processar depois
      };

      // Chamar o serviço real para criar o pagamento
      const pagamentoCreated = await faturamentoService.criarPagamento(dadosPagamento);

      // Processar o pagamento como aprovado automaticamente (para pagamentos manuais)
      if (pagamentoCreated.id) {
        const processarData = {
          gatewayTransacaoId: dadosPagamento.gatewayTransacaoId,
          novoStatus: 'aprovado',
          webhookData: {
            source: 'manual',
            timestamp: new Date().toISOString(),
            userRegistered: true,
          },
        };

        await faturamentoService.processarPagamento(pagamentoCreated.id, processarData);
      }

      notificacao.sucesso.pagamentoRegistrado(pagamento.valor);

      // Estratégia agressiva de atualização do cache após pagamento
      await queryClient.removeQueries({ queryKey: ['faturas-paginadas'] });
      await queryClient.invalidateQueries({ queryKey: ['faturas-paginadas'] });
      await queryClient.refetchQueries({ queryKey: ['faturas-paginadas'] });

      // Recarregar faturas após registrar pagamento
      await carregarFaturas();

      // Fechar modal após sucesso
      fecharModalPagamentos();
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      notificacao.erro.operacaoFalhou(
        'registrar pagamento',
        obterMensagemErro(error, 'Falha ao registrar/processar pagamento.'),
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
        case 'enviar-email':
          for (let i = 0; i < faturasSelecionadasData.length; i++) {
            const fatura = faturasSelecionadasData[i];
            await enviarPorEmail(fatura.id);
            setProgressoAcaoMassa(((i + 1) / faturasSelecionadasData.length) * 100);
          }
          notificacao.mostrarSucesso(
            'E-mails enviados',
            `${faturasSelecionadas.length} e-mail(s) enviado(s) com sucesso.`,
          );
          break;

        case 'baixar-pdfs':
          for (let i = 0; i < faturasSelecionadas.length; i++) {
            const faturaId = faturasSelecionadas[i];
            await baixarPDF(faturaId);
            await new Promise((resolve) => setTimeout(resolve, 500));
            setProgressoAcaoMassa(((i + 1) / faturasSelecionadas.length) * 100);
          }
          break;

        case 'gerar-cobranca': {
          setProgressoAcaoMassa(25);
          const resultadoCobranca = await faturamentoService.gerarCobrancaEmLote(faturasSelecionadas);
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
              `${resultadoCobranca.simuladas} envio(s) processado(s) em simulação. Configure SMTP para envio real.`,
            );
          }

          if (resultadoCobranca.ignoradas > 0) {
            notificacao.mostrarAviso(
              'Faturas ignoradas',
              `${resultadoCobranca.ignoradas} fatura(s) foram ignoradas por status não elegível para cobrança.`,
            );
          }

          if (resultadoCobranca.falhas > 0) {
            const primeiraFalha = resultadoCobranca.resultados.find(
              (item) => !item.enviado && item.motivo !== 'status_nao_elegivel',
            );
            notificacao.erro.operacaoFalhou(
              'gerar cobrança em lote',
              `${resultadoCobranca.falhas} fatura(s) falharam.` +
                (primeiraFalha?.detalhes ? ` ${primeiraFalha.detalhes}` : ''),
            );
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
    const itens: Array<{
      id: string;
      titulo: string;
      detalhe: string;
      status: StatusProntidao;
    }> = [
      {
        id: 'fiscal-preflight',
        titulo: 'Preflight fiscal oficial',
        detalhe: preflightFiscalProntidao
          ? `Provider ${preflightFiscalProntidao.providerEfetivo}: ${preflightFiscalProntidao.readyForOfficialEmission ? 'pronto para emissao oficial' : preflightFiscalProntidao.conectividade.message}`
          : carregandoPreflightFiscalProntidao
            ? 'Validando conectividade e configuracao fiscal oficial...'
            : erroPreflightFiscalProntidao || 'Preflight fiscal ainda nao executado nesta sessao.',
        status: preflightFiscalProntidao
          ? preflightFiscalProntidao.status
          : erroPreflightFiscalProntidao
            ? 'alerta'
            : 'alerta',
      },
      {
        id: 'gateway-online',
        titulo: 'Gateway online habilitado',
        detalhe: gatewayUiHabilitada
          ? 'Pagamento online disponivel para cobranca direta.'
          : gatewayUiConfig.motivoBloqueio || 'Gateway indisponivel no ambiente atual.',
        status: gatewayUiHabilitada ? 'ok' : 'alerta',
      },
      {
        id: 'link-pagamento',
        titulo: 'Geracao de link de pagamento',
        detalhe: linkPagamentoHabilitado
          ? 'Link de pagamento liberado para envio ao cliente.'
          : gatewayUiConfig.motivoBloqueio || 'Link de pagamento desabilitado.',
        status: linkPagamentoHabilitado ? 'ok' : 'alerta',
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
    carregandoPreflightFiscalProntidao,
    erroPreflightFiscalProntidao,
    gatewayUiConfig.motivoBloqueio,
    gatewayUiHabilitada,
    linkPagamentoHabilitado,
    painelDivergencias.estornosPendentesConciliacao,
    painelDivergencias.itensVsTotal,
    painelDivergencias.parciaisSemBaixaFinal,
    preflightFiscalProntidao,
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
    { id: 'prontidao', label: 'Prontidão', icon: Activity },
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
                      type="button"
                      onClick={() => void carregarPreflightFiscalProntidao()}
                      disabled={carregandoPreflightFiscalProntidao}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#159A9C] bg-[#E8F6F6] px-3 text-xs font-semibold text-[#0F7B7D] transition hover:bg-[#DCF1F1] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {carregandoPreflightFiscalProntidao ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Activity className="h-3.5 w-3.5" />
                      )}
                      Executar preflight fiscal
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

                {erroPreflightFiscalProntidao && (
                  <p className="mt-3 rounded-lg border border-[#F4D8D8] bg-[#FFF5F5] px-3 py-2 text-xs text-[#A12D2D]">
                    {erroPreflightFiscalProntidao}
                  </p>
                )}

                {preflightFiscalProntidao && (
                  <div className="mt-3 rounded-lg border border-[#DDEAF0] bg-[#F6FBFD] px-3 py-2 text-xs text-[#365567]">
                    <p>
                      Ultimo preflight: <strong>{new Date(preflightFiscalProntidao.timestamp).toLocaleString('pt-BR')}</strong>
                    </p>
                    <p>
                      Conectividade: <strong>{preflightFiscalProntidao.conectividade.success ? 'OK' : 'Com alerta'}</strong>
                      {' '}| Provider: <strong>{preflightFiscalProntidao.providerEfetivo}</strong>
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
                        disabled={processandoAcaoMassa}
                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition-colors hover:bg-[#0F7B7D] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Download className="h-4 w-4" />
                        Baixar PDFs
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
                            <div key={fatura.id} className={rowClass}>
                              {/* Checkbox */}
                              <div className="col-span-1 flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelecaoFatura(fatura.id)}
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
                              <div className="col-span-1 flex items-center justify-center min-w-[120px]">
                                <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                  {/* Ações principais sempre visíveis */}
                                  <button
                                    onClick={() => abrirModalDetalhes(fatura)}
                                    className="p-2 text-[#159A9C] hover:text-[#0F7B7D] hover:bg-[#159A9C]/10 rounded-lg transition-all duration-200 border border-[#159A9C] hover:border-[#0F7B7D] shadow-sm hover:shadow-md"
                                    title="Ver Detalhes"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>

                                  {fatura.status !== StatusFatura.PAGA &&
                                    fatura.status !== StatusFatura.CANCELADA && (
                                      <button
                                        onClick={() => abrirModalEdicao(fatura)}
                                        className="p-2 text-[#159A9C] hover:text-[#0F7B7D] hover:bg-[#159A9C]/10 rounded-lg transition-all duration-200 border border-[#159A9C] hover:border-[#0F7B7D] shadow-sm hover:shadow-md"
                                        title="Editar Fatura"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                    )}

                                  {/* Menu dropdown para ações secundárias */}
                                  <div className="relative group/menu">
                                    <button
                                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md"
                                      title="Mais ações"
                                    >
                                      <MoreVertical className="w-3 h-3" />
                                    </button>

                                    {/* Dropdown menu compacto */}
                                    <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-50 overflow-hidden">
                                      <div className="py-1">
                                        {fatura.status !== StatusFatura.PAGA && (
                                          <>
                                            <button
                                              onClick={() => enviarPorEmail(fatura.id)}
                                              className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 transition-colors"
                                            >
                                              <Send className="w-3 h-3" />
                                              Enviar Email
                                            </button>
                                            <button
                                              onClick={() => abrirModalPagamentos(fatura)}
                                              className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 transition-colors"
                                            >
                                              <DollarSign className="w-3 h-3" />
                                              Registrar Pgto
                                            </button>
                                            <button
                                              onClick={() => gerarLinkPagamento(fatura.id)}
                                              disabled={!linkPagamentoHabilitado}
                                              title={
                                                !linkPagamentoHabilitado
                                                  ? gatewayUiConfig.motivoBloqueio
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
                                          </>
                                        )}

                                        <button
                                          onClick={() => baixarPDF(fatura.id)}
                                          className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
                                        >
                                          <Download className="w-3 h-3" />
                                          Baixar PDF
                                        </button>

                                        <div className="border-t border-gray-100 my-1"></div>

                                        <button
                                          onClick={() => excluirFatura(fatura.id)}
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
                          className={`bg-white rounded-xl border-2 p-5 transition-all shadow-sm hover:shadow-md ${
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
                        >
                          {/* Header do card aprimorado */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelecaoFatura(fatura.id)}
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
                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => abrirModalDetalhes(fatura)}
                                className="px-4 py-2 text-sm text-[#159A9C] hover:text-[#0F7B7D] hover:bg-[#159A9C]/10 rounded-lg transition-all duration-200 flex items-center gap-2 border border-[#159A9C] hover:border-[#0F7B7D] shadow-sm hover:shadow-md font-medium"
                              >
                                <Eye className="w-4 h-4" />
                                Ver
                              </button>
                              {fatura.status !== StatusFatura.PAGA &&
                                fatura.status !== StatusFatura.CANCELADA && (
                                  <button
                                    onClick={() => abrirModalEdicao(fatura)}
                                    className="px-4 py-2 text-sm text-[#159A9C] hover:text-[#0F7B7D] hover:bg-[#159A9C]/10 rounded-lg transition-all duration-200 flex items-center gap-2 border border-[#159A9C] hover:border-[#0F7B7D] shadow-sm hover:shadow-md font-medium"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                    Editar
                                  </button>
                                )}
                              {fatura.status !== StatusFatura.PAGA && (
                                <button
                                  onClick={() => abrirModalPagamentos(fatura)}
                                  className="px-4 py-2 text-sm bg-[#159A9C] hover:bg-[#0F7B7D] text-white rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md font-medium"
                                >
                                  <DollarSign className="w-4 h-4" />
                                  Pagar
                                </button>
                              )}
                            </div>

                            {/* Menu dropdown mobile aprimorado */}
                            <div className="relative group">
                              <button className="p-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md">
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                                <div className="py-2">
                                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                    Mais Ações
                                  </div>

                                  {fatura.status !== StatusFatura.PAGA && (
                                    <button
                                      onClick={() => abrirModalGateway(fatura)}
                                      disabled={!gatewayUiHabilitada}
                                      title={
                                        !gatewayUiHabilitada
                                          ? gatewayUiConfig.motivoBloqueio
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
                                    onClick={() => baixarPDF(fatura.id)}
                                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-3 transition-colors"
                                  >
                                    <Download className="w-4 h-4" />
                                    <div>
                                      <div className="font-medium">Baixar PDF</div>
                                      <div className="text-xs text-gray-500">Documento</div>
                                    </div>
                                  </button>

                                  <button
                                    onClick={() => enviarPorEmail(fatura.id)}
                                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-3 transition-colors"
                                  >
                                    <Send className="w-4 h-4" />
                                    <div>
                                      <div className="font-medium">Enviar Email</div>
                                      <div className="text-xs text-gray-500">Cobrança</div>
                                    </div>
                                  </button>

                                  {fatura.status !== StatusFatura.PAGA && (
                                    <button
                                      onClick={() => gerarLinkPagamento(fatura.id)}
                                      className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-3 transition-colors"
                                    >
                                      <Link2 className="w-4 h-4" />
                                      <div>
                                        <div className="font-medium">Gerar Link</div>
                                        <div className="text-xs text-gray-500">Pagamento</div>
                                      </div>
                                    </button>
                                  )}

                                  <div className="border-t border-gray-100 my-1"></div>

                                  <button
                                    onClick={() => excluirFatura(fatura.id)}
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
          documentoFiscalStatus={documentoFiscalStatus}
          fiscalActionLoading={fiscalActionLoading}
          onCriarRascunhoFiscal={criarRascunhoFiscal}
          onEmitirDocumentoFiscal={emitirDocumentoFiscal}
          onAtualizarStatusFiscal={atualizarStatusFiscal}
          onCancelarDocumentoFiscal={cancelarOuInutilizarDocumentoFiscal}
          onEstornarPagamento={estornarPagamento}
          onEdit={() => {
            abrirModalEdicao(faturaDetalhes);
            fecharModalDetalhes();
          }}
          onGeneratePaymentLink={gerarLinkPagamento}
          onSendEmail={enviarPorEmail}
          onDownloadPDF={baixarPDF}
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
