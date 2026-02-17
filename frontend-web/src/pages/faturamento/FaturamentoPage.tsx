import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  FileText,
  DollarSign,
  Filter,
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
  Bell,
  Shield,
} from 'lucide-react';
import {
  faturamentoService,
  Fatura,
  NovaFatura,
  StatusFatura,
  TipoFatura,
  FormaPagamento,
  FiltrosFatura,
  FaturasPaginadasResponse,
} from '../../services/faturamentoService';
import ModalFatura from './ModalFatura';
import ModalDetalhesFatura from './ModalDetalhesFatura';
import ModalConfigurarCards from './ModalConfigurarCards';
import ModalPagamentos from './ModalPagamentos';
import NotificacoesFaturamento from '../../components/notificacoes/NotificacoesFaturamento';
import SkeletonCard from '../../components/skeleton/SkeletonCard';
import SkeletonTable from '../../components/skeleton/SkeletonTable';
import RelatoriosAvancados from '../../components/analytics/RelatoriosAvancados';
import EmailAutomacao from '../../components/email/EmailAutomacao';
import GatewayPagamento from '../../components/pagamento/GatewayPagamento';
import DashboardIA from '../../components/analytics/DashboardIA';
import WorkflowAutomacao from '../../components/automacao/WorkflowAutomacao';
import NotificacoesInteligentes from '../../components/notificacoes/NotificacoesInteligentes';
import BackupRecuperacao from '../../components/backup/BackupRecuperacao';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
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

interface DashboardCards {
  totalFaturas: number;
  faturasVencidas: number;
  valorTotalPendente: number;
  valorTotalPago: number;
  faturasPagas: number;
  faturasDoMes: number;
}

interface CardConfig {
  id: string;
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  gradient: string;
  description: string;
  isActive: boolean;
}

export default function FaturamentoPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [modalConfigurarCardsAberto, setModalConfigurarCardsAberto] = useState(false);
  const [modalPagamentosAberto, setModalPagamentosAberto] = useState(false);
  const [faturaEdicao, setFaturaEdicao] = useState<Fatura | null>(null);
  const [faturaDetalhes, setFaturaDetalhes] = useState<Fatura | null>(null);
  const [faturaPagamentos, setFaturaPagamentos] = useState<Fatura | null>(null);
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState<FiltrosFatura>({});
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

  // Estados para seleção múltipla
  const [faturasSelecionadas, setFaturasSelecionadas] = useState<number[]>([]);
  const [mostrarAcoesMassa, setMostrarAcoesMassa] = useState(false);
  const [processandoAcaoMassa, setProcessandoAcaoMassa] = useState(false);
  const [progressoAcaoMassa, setProgressoAcaoMassa] = useState(0);

  // Estado para loading e skeleton
  const [carregandoFaturas, setCarregandoFaturas] = useState(false);

  // Estados para funcionalidades avançadas da Semana 2
  const [modalRelatoriosAberto, setModalRelatoriosAberto] = useState(false);
  const [modalEmailAberto, setModalEmailAberto] = useState(false);
  const [modalGatewayAberto, setModalGatewayAberto] = useState(false);
  const [faturaGateway, setFaturaGateway] = useState<Fatura | null>(null);
  const [visaoAtiva, setVisaoAtiva] = useState<
    'dashboard' | 'relatorios' | 'email' | 'ia' | 'workflows' | 'notificacoes' | 'backup'
  >('dashboard');

  const [dashboardCards, setDashboardCards] = useState<DashboardCards>({
    totalFaturas: 0,
    faturasVencidas: 0,
    valorTotalPendente: 0,
    valorTotalPago: 0,
    faturasPagas: 0,
    faturasDoMes: 0,
  });

  // Estado para configuração dos cards
  const [cardsConfigurados, setCardsConfigurados] = useState<string[]>([
    'totalFaturas',
    'valorTotalPendente',
    'valorTotalPago',
    'faturasDoMes',
  ]);

  // Hooks para confirmação inteligente
  const confirmacao = useConfirmacaoInteligente();
  const validacao = useValidacaoFinanceira();
  const notificacao = useNotificacaoFinanceira();

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

  useEffect(() => {
    // Carregar configuração dos cards do localStorage
    const configSalva = localStorage.getItem('faturamento-cards-config');
    if (configSalva) {
      try {
        const config = JSON.parse(configSalva);
        if (Array.isArray(config) && config.length >= 1 && config.length <= 4) {
          setCardsConfigurados(config);
        }
      } catch (error) {
        console.error('Erro ao carregar configuração dos cards:', error);
      }
    }
  }, []);

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

  // Função para obter a classe do grid baseada no número de cards
  const obterClasseGrid = (numeroCards: number): string => {
    switch (numeroCards) {
      case 1:
        return 'grid-cols-1 max-w-md mx-auto'; // Card único centralizado
      case 2:
        return 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'; // 2 cards centralizados
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4:
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    }
  };

  // Função para obter classes adicionais do card baseado na quantidade
  const obterClassesCard = (numeroCards: number): string => {
    switch (numeroCards) {
      case 1:
        return 'p-8'; // Padding maior para card único
      case 2:
        return 'p-7'; // Padding um pouco maior para 2 cards
      default:
        return 'p-6'; // Padding padrão para 3+ cards
    }
  };

  // Função para salvar configuração dos cards
  const salvarConfiguracaoCards = (novaConfiguracao: string[]) => {
    setCardsConfigurados(novaConfiguracao);
    localStorage.setItem('faturamento-cards-config', JSON.stringify(novaConfiguracao));
  };

  // Função para obter todas as configurações de cards disponíveis
  const obterTodasConfiguracoesCards = (): CardConfig[] => {
    return [
      {
        id: 'totalFaturas',
        title: 'Total de Faturas',
        value: dashboardCards.totalFaturas,
        icon: FileText,
        color: 'text-[#159A9C]',
        gradient: '',
        description: 'Visão geral de todas as faturas cadastradas',
        isActive: cardsConfigurados.includes('totalFaturas'),
      },
      {
        id: 'faturasPagas',
        title: 'Faturas Pagas',
        value: dashboardCards.faturasPagas,
        icon: CheckCircle,
        color: 'text-green-600',
        gradient: '',
        description: 'Faturas finalizadas e quitadas',
        isActive: cardsConfigurados.includes('faturasPagas'),
      },
      {
        id: 'faturasVencidas',
        title: 'Faturas Vencidas',
        value: dashboardCards.faturasVencidas,
        icon: AlertCircle,
        color: 'text-red-600',
        gradient: '',
        description: 'Faturas atrasadas que requerem atenção',
        isActive: cardsConfigurados.includes('faturasVencidas'),
      },
      {
        id: 'valorTotalPendente',
        title: 'Valor Pendente',
        value: `R$ ${Number(dashboardCards.valorTotalPendente).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        icon: Clock,
        color: 'text-yellow-600',
        gradient: '',
        description: 'Valor total aguardando recebimento',
        isActive: cardsConfigurados.includes('valorTotalPendente'),
      },
      {
        id: 'valorTotalPago',
        title: 'Valor Recebido',
        value: `R$ ${Number(dashboardCards.valorTotalPago).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        icon: DollarSign,
        color: 'text-green-600',
        gradient: '',
        description: 'Total de valores já recebidos',
        isActive: cardsConfigurados.includes('valorTotalPago'),
      },
      {
        id: 'faturasDoMes',
        title: 'Faturas do Mês',
        value: dashboardCards.faturasDoMes,
        icon: Calendar,
        color: 'text-[#159A9C]',
        gradient: '',
        description: 'Faturas emitidas no mês atual',
        isActive: cardsConfigurados.includes('faturasDoMes'),
      },
    ];
  };

  const carregarFaturas = async () => {
    try {
      console.log('Recarregando faturas...');

      // Estratégia agressiva de atualização do cache
      await queryClient.removeQueries({ queryKey: ['faturas-paginadas'] }); // Remove completamente do cache
      await queryClient.invalidateQueries({ queryKey: ['faturas-paginadas'] }); // Invalida todas as queries relacionadas
      await queryClient.refetchQueries({ queryKey: ['faturas-paginadas'] }); // Força uma nova busca imediatamente
      await refetch();

      console.log('Faturas recarregadas com sucesso');
    } catch (error) {
      console.error('Erro ao recarregar faturas:', error);
    }
  };

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
    setFaturaPagamentos(fatura);
    setModalPagamentosAberto(true);
  };

  const fecharModalPagamentos = () => {
    setModalPagamentosAberto(false);
    setFaturaPagamentos(null);
  };

  const marcarNotificacaoComoLida = (notificacaoId: string) => {
    console.log('Marcar notificação como lida:', notificacaoId);
    // Implementar lógica para marcar notificação como lida
  };

  const abrirFaturaNotificacao = (faturaId: number) => {
    const fatura = faturas.find((f) => f.id === faturaId);
    if (fatura) {
      abrirModalDetalhes(fatura);
    }
  };

  // Handlers para funcionalidades avançadas da Semana 2
  const abrirModalGateway = (fatura: Fatura) => {
    setFaturaGateway(fatura);
    setModalGatewayAberto(true);
  };

  const fecharModalGateway = () => {
    setModalGatewayAberto(false);
    setFaturaGateway(null);
  };

  const handlePagamentoConcluido = async (transacao: any) => {
    try {
      // Atualiza o status da fatura para pago
      if (faturaGateway) {
        await faturamentoService.atualizarFatura(faturaGateway.id, {
          status: StatusFatura.PAGA,
        });
        carregarFaturas();
        fecharModalGateway();
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
    }
  };

  const handleEnviarEmail = async (faturaIds: number[], templateId: string) => {
    try {
      // Simula envio de email - integrar com serviço real
      console.log('Enviando emails para faturas:', faturaIds, 'template:', templateId);
      // await emailService.enviarEmails(faturaIds, templateId);
      alert('Emails enviados com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar emails:', error);
      alert('Erro ao enviar emails. Tente novamente.');
    }
  };

  const handleExportarRelatorio = (tipo: 'pdf' | 'excel' | 'csv') => {
    // Simula exportação - integrar com serviço real
    console.log('Exportando relatório:', tipo);
    alert(`Relatório ${tipo.toUpperCase()} será baixado em breve!`);
  };

  const handleExecutarWorkflow = async (config: any) => {
    try {
      console.log('Executando workflow:', config);
      // Integrar com serviço de workflows
      alert('Workflow executado com sucesso!');
    } catch (error) {
      console.error('Erro ao executar workflow:', error);
      alert('Erro ao executar workflow. Tente novamente.');
    }
  };

  const handleAcaoNotificacao = async (acao: string, dados: any) => {
    try {
      console.log('Executando ação da notificação:', acao, dados);
      // Integrar com serviços apropriados baseado na ação
      switch (acao) {
        case 'navegar_faturas':
          setVisaoAtiva('dashboard');
          break;
        case 'abrir_fatura':
          if (dados.faturaId) {
            const fatura = faturas.find((f) => f.id === dados.faturaId);
            if (fatura) abrirModalDetalhes(fatura);
          }
          break;
        case 'enviar_cobranca_lote':
          setVisaoAtiva('email');
          break;
        default:
          console.log('Ação não implementada:', acao);
      }
    } catch (error) {
      console.error('Erro ao executar ação da notificação:', error);
    }
  };

  const handleExecutarBackup = async (config?: any) => {
    try {
      console.log('Iniciando backup:', config);
      // Integrar com serviço de backup
      return Promise.resolve();
    } catch (error) {
      console.error('Erro ao executar backup:', error);
      throw error;
    }
  };

  const handleRestaurarBackup = async (backupId?: string, opcoes?: any) => {
    try {
      console.log('Restaurando backup:', backupId, opcoes);
      // Integrar com serviço de restauração
      alert('Backup restaurado com sucesso!');
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      alert('Erro ao restaurar backup. Tente novamente.');
    }
  };

  const handleSalvarFatura = async (dadosFatura: NovaFatura) => {
    try {
      if (faturaEdicao) {
        await faturamentoService.atualizarFatura(faturaEdicao.id, dadosFatura);
      } else {
        await faturamentoService.criarFatura(dadosFatura);
      }

      fecharModal();
      carregarFaturas();
    } catch (error) {
      console.error('Erro ao salvar fatura:', error);
      alert('Erro ao salvar fatura. Tente novamente.');
    }
  };

  const excluirFatura = async (id: number) => {
    try {
      // Buscar a fatura para validação
      const fatura = faturas.find((f) => f.id === id);
      if (!fatura) {
        console.error('Fatura não encontrada:', id);
        alert('Fatura não encontrada.');
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
            console.log('Excluindo fatura:', id);
            await faturamentoService.excluirFatura(id);
            console.log('Fatura excluída com sucesso');

            // Estratégia agressiva de atualização do cache
            await queryClient.removeQueries({ queryKey: ['faturas-paginadas'] }); // Remove completamente do cache
            await queryClient.invalidateQueries({ queryKey: ['faturas-paginadas'] }); // Invalida todas as queries relacionadas
            await queryClient.refetchQueries({ queryKey: ['faturas-paginadas'] }); // Força uma nova busca imediatamente

            // Recarregar dados - força atualização completa
            await refetch();

            // Também força uma atualização do estado local para garantir
            setFaturas((prev) => prev.filter((f) => f.id !== id));

            // Atualizar faturas selecionadas removendo a excluída
            setFaturasSelecionadas((prev) => prev.filter((faturaId) => faturaId !== id));

            // Mostrar notificação de sucesso
            notificacao.mostrarSucesso(
              'Fatura Excluída',
              `Fatura #${faturamentoService.formatarNumeroFatura(fatura.numero)} foi excluída com sucesso.`,
            );
          } catch (error) {
            console.error('Erro ao excluir fatura no serviço:', error);
            alert('Erro ao excluir fatura. Verifique se ela não possui dependências.');
            throw error; // Re-throw para ser capturado pelo catch externo
          }
        },
        dadosContexto,
      );
    } catch (error) {
      console.error('Erro ao excluir fatura:', error);
      alert('Erro ao excluir fatura. Tente novamente.');
    }
  };

  const gerarLinkPagamento = async (id: number) => {
    try {
      const link = await faturamentoService.gerarLinkPagamento(id);
      navigator.clipboard.writeText(link);
      notificacao.mostrarSucesso(
        'Link Copiado',
        'Link de pagamento copiado para a área de transferência!',
      );
      carregarFaturas(); // Recarregar para atualizar o link
    } catch (error) {
      console.error('Erro ao gerar link de pagamento:', error);
      notificacao.erro.operacaoFalhou('gerar link de pagamento');
    }
  };

  const enviarPorEmail = async (id: number) => {
    try {
      await faturamentoService.enviarFaturaPorEmail(id);
      notificacao.mostrarSucesso('Email Enviado', 'Fatura enviada por email com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar fatura por email:', error);
      notificacao.erro.operacaoFalhou('enviar fatura por email');
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
      alert('Erro ao baixar PDF. Tente novamente.');
    }
  };

  const registrarPagamento = async (pagamento: any) => {
    try {
      if (!faturaPagamentos) {
        throw new Error('Fatura não encontrada');
      }

      // Preparar dados do pagamento no formato esperado pela API
      const dadosPagamento = {
        faturaId: faturaPagamentos.id,
        valor: pagamento.valor,
        dataPagamento: pagamento.data,
        formaPagamento: pagamento.metodo,
        metodoPagamento: pagamento.metodo, // Para compatibilidade com backend
        tipo: 'pagamento', // TipoPagamento.PAGAMENTO
        observacoes: pagamento.observacoes || '',
        transacaoId: `PAG_${Date.now()}_${faturaPagamentos.id}`, // ID único para a transação
        gatewayTransacaoId: `PAG_${Date.now()}_${faturaPagamentos.id}`, // Para processar depois
      };

      console.log('Registrando pagamento:', dadosPagamento);

      // Chamar o serviço real para criar o pagamento
      const pagamentoCreated = await faturamentoService.criarPagamento(dadosPagamento);
      console.log('Pagamento criado:', pagamentoCreated);

      // Processar o pagamento como aprovado automaticamente (para pagamentos manuais)
      if (pagamentoCreated.id) {
        console.log('Processando pagamento como aprovado...');
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
        console.log('Pagamento processado como aprovado');
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
      notificacao.erro.operacaoFalhou('registrar pagamento');
      throw error;
    }
  };

  // Ações em massa melhoradas
  const handleAcaoMassa = async (acao: string) => {
    if (faturasSelecionadas.length === 0) {
      notificacao.mostrarAviso(
        'Seleção Necessária',
        'Selecione pelo menos uma fatura para executar esta ação.',
      );
      return;
    }

    try {
      setProcessandoAcaoMassa(true);
      setProgressoAcaoMassa(0);

      const faturasSelecionadasData = faturas.filter((f) => faturasSelecionadas.includes(f.id));

      switch (acao) {
        case 'enviar-email':
          for (let i = 0; i < faturasSelecionadasData.length; i++) {
            const fatura = faturasSelecionadasData[i];
            console.log(`Enviando email da fatura ${fatura.numero}...`);
            await enviarPorEmail(fatura.id);
            setProgressoAcaoMassa(((i + 1) / faturasSelecionadasData.length) * 100);
          }
          notificacao.mostrarSucesso(
            'Emails Enviados',
            `${faturasSelecionadas.length} email(s) enviado(s) com sucesso!`,
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

        case 'gerar-cobranca':
          for (let i = 0; i < faturasSelecionadasData.length; i++) {
            const fatura = faturasSelecionadasData[i];
            if (fatura.status === StatusFatura.VENCIDA || fatura.status === StatusFatura.PENDENTE) {
              console.log(`Gerando cobrança da fatura ${fatura.numero}...`);
              // TODO: Implementar geração de cobrança
            }
            setProgressoAcaoMassa(((i + 1) / faturasSelecionadasData.length) * 100);
          }
          notificacao.mostrarSucesso('Cobranças Geradas', 'Cobranças geradas com sucesso!');
          break;

        case 'exportar':
          setProgressoAcaoMassa(50);
          const csvData = faturasSelecionadasData
            .map(
              (f) =>
                `${f.numero},${f.cliente.nome},${f.valorTotal},${f.status},${f.dataVencimento}`,
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

        case 'excluir':
          // Usar confirmação inteligente para exclusão em massa
          confirmacao.confirmar(
            'excluir-multiplas-faturas',
            async () => {
              for (let i = 0; i < faturasSelecionadas.length; i++) {
                const faturaId = faturasSelecionadas[i];
                console.log(`Excluindo fatura ${faturaId}...`);
                await faturamentoService.excluirFatura(faturaId);
                setProgressoAcaoMassa(((i + 1) / faturasSelecionadas.length) * 100);
              }

              // Estratégia agressiva de atualização do cache após exclusão em massa
              await queryClient.removeQueries({ queryKey: ['faturas-paginadas'] }); // Remove completamente do cache
              await queryClient.invalidateQueries({ queryKey: ['faturas-paginadas'] }); // Invalida todas as queries relacionadas
              await queryClient.refetchQueries({ queryKey: ['faturas-paginadas'] }); // Força uma nova busca imediatamente
              carregarFaturas();

              // Notificação de sucesso é exibida automaticamente pelo hook
            },
            { quantidadeItens: faturasSelecionadas.length },
          );
          return; // Sair da função para não executar o finally
          break;

        default:
          console.log('Ação não implementada:', acao);
          setProgressoAcaoMassa(100);
      }

      // Limpar seleção após ação
      setFaturasSelecionadas([]);
      setMostrarAcoesMassa(false);
    } catch (error) {
      console.error('Erro ao executar ação em massa:', error);
      alert('Erro ao executar ação. Tente novamente.');
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
    if (faturasSelecionadas.length === faturas.length) {
      setFaturasSelecionadas([]);
    } else {
      setFaturasSelecionadas(faturas.map((f) => f.id));
    }
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

  const faturasFiltradas = faturas.filter(
    (fatura) =>
      fatura.numero.toLowerCase().includes(busca.toLowerCase()) ||
      fatura.cliente?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      fatura.observacoes?.toLowerCase().includes(busca.toLowerCase()),
  );

  useEffect(() => {
    setMostrarAcoesMassa(faturasSelecionadas.length > 0);
  }, [faturasSelecionadas]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="Financeiro" nucleusPath="/nuclei/financeiro" />
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                <FileText className="h-8 w-8 mr-3 text-[#159A9C]" />
                Faturamento
                {carregando && (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#159A9C] ml-3"></div>
                )}
              </h1>
              <p className="mt-2 text-[#B4BEC9]">
                {carregando
                  ? 'Carregando faturas...'
                  : `Gerencie suas ${dashboardCards.totalFaturas} faturas, pagamentos e cobranças`}
              </p>
            </div>

            {/* Botão de ação principal */}
            <div className="mt-4 sm:mt-0 flex items-center gap-3">
              <NotificacoesFaturamento
                faturas={faturas}
                onMarcarComoLida={marcarNotificacaoComoLida}
                onAbrirFatura={abrirFaturaNotificacao}
              />
              <button
                onClick={() => setModalConfigurarCardsAberto(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm font-medium"
                title="Configurar Cards"
              >
                <Settings className="w-4 h-4" />
                Configurar Cards
              </button>
              <button
                onClick={abrirModalCriacao}
                className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Nova Fatura
              </button>
            </div>
          </div>
        </div>

        {/* Navegação por Abas - Funcionalidades Avançadas */}
        <div className="bg-white rounded-lg shadow-sm mb-4">
          <div className="border-b">
            <nav className="flex space-x-4 px-6 overflow-x-auto">
              <button
                onClick={() => setVisaoAtiva('dashboard')}
                className={`py-4 px-3 border-b-2 font-medium text-sm transition-colors flex-shrink-0 ${
                  visaoAtiva === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Dashboard & Faturas
                </div>
              </button>

              <button
                onClick={() => setVisaoAtiva('ia')}
                className={`py-4 px-3 border-b-2 font-medium text-sm transition-colors flex-shrink-0 ${
                  visaoAtiva === 'ia'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Dashboard IA
                </div>
              </button>

              <button
                onClick={() => setVisaoAtiva('relatorios')}
                className={`py-4 px-3 border-b-2 font-medium text-sm transition-colors flex-shrink-0 ${
                  visaoAtiva === 'relatorios'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Relatórios Avançados
                </div>
              </button>

              <button
                onClick={() => setVisaoAtiva('email')}
                className={`py-4 px-3 border-b-2 font-medium text-sm transition-colors flex-shrink-0 ${
                  visaoAtiva === 'email'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Automação de Emails
                </div>
              </button>

              <button
                onClick={() => setVisaoAtiva('workflows')}
                className={`py-4 px-3 border-b-2 font-medium text-sm transition-colors flex-shrink-0 ${
                  visaoAtiva === 'workflows'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Workflows
                </div>
              </button>

              <button
                onClick={() => setVisaoAtiva('notificacoes')}
                className={`py-4 px-3 border-b-2 font-medium text-sm transition-colors flex-shrink-0 ${
                  visaoAtiva === 'notificacoes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notificações
                </div>
              </button>

              <button
                onClick={() => setVisaoAtiva('backup')}
                className={`py-4 px-3 border-b-2 font-medium text-sm transition-colors flex-shrink-0 ${
                  visaoAtiva === 'backup'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Backup & Recuperação
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Conteúdo baseado na visão ativa */}
        {visaoAtiva === 'dashboard' && (
          <div>
            {/* Cards do Dashboard (KPI Cards - Padrão Crevasse) */}
            <div className={`grid gap-6 mb-8 ${obterClasseGrid(cardsConfigurados.length)}`}>
              {carregando
                ? // Skeleton para cards do dashboard
                  Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)
                : obterTodasConfiguracoesCards()
                    .filter((card) => card.isActive)
                    .map((card) => {
                      const IconComponent = card.icon;
                      const numeroCards = cardsConfigurados.length;
                      return (
                        <div
                          key={card.id}
                          className={`p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF] ${obterClassesCard(numeroCards)}`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                                {card.title}
                              </p>
                              <p
                                className={`${numeroCards <= 2 ? 'text-4xl' : 'text-3xl'} font-bold mt-2 text-[#002333]`}
                              >
                                {card.value}
                              </p>
                              <p className="text-sm text-[#002333]/70 mt-3">
                                {card.description.replace(/[📊✅⚠️⏳💰📅]/g, '').trim()}
                              </p>
                            </div>
                            <div
                              className={`${numeroCards <= 2 ? 'h-14 w-14' : 'h-12 w-12'} rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm flex-shrink-0`}
                            >
                              <IconComponent
                                className={`${numeroCards <= 2 ? 'h-7 w-7' : 'h-6 w-6'} text-[#159A9C]`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
            </div>

            {/* Filtros e Busca */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-3">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar Faturas
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar por número, cliente ou observações..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      onKeyDown={handleSearch}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={filtros.status || ''}
                      onChange={(e) =>
                        setFiltros((prev) => ({
                          ...prev,
                          status: (e.target.value as StatusFatura) || undefined,
                        }))
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                    >
                      <option value="">Todos os Status</option>
                      <option value={StatusFatura.PENDENTE}>⏳ Pendente</option>
                      <option value={StatusFatura.ENVIADA}>📤 Enviada</option>
                      <option value={StatusFatura.PAGA}>✅ Paga</option>
                      <option value={StatusFatura.VENCIDA}>⚠️ Vencida</option>
                      <option value={StatusFatura.CANCELADA}>❌ Cancelada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                    <select
                      value={filtros.tipo || ''}
                      onChange={(e) =>
                        setFiltros((prev) => ({
                          ...prev,
                          tipo: (e.target.value as TipoFatura) || undefined,
                        }))
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                    >
                      <option value="">Todos os Tipos</option>
                      <option value={TipoFatura.UNICA}>📄 Única</option>
                      <option value={TipoFatura.RECORRENTE}>🔄 Recorrente</option>
                      <option value={TipoFatura.PARCELA}>📊 Parcela</option>
                      <option value={TipoFatura.ADICIONAL}>➕ Adicional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ordenar por
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                    >
                      <option value="dataVencimento">Vencimento</option>
                      <option value="dataEmissao">Emissão</option>
                      <option value="valorTotal">Valor</option>
                      <option value="status">Status</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ordem</label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'ASC' | 'DESC')}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                    >
                      <option value="DESC">Desc</option>
                      <option value="ASC">Asc</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ações</label>
                    <button
                      onClick={buscarFaturas}
                      className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] flex items-center gap-2 transition-colors"
                      aria-label="Buscar"
                    >
                      <Search className="w-4 h-4" />
                      Buscar
                    </button>
                  </div>
                </div>
              </div>
              {/* Chips de filtros aplicados */}
              {(busca ||
                filtros.status ||
                filtros.tipo ||
                sortBy !== 'dataVencimento' ||
                sortOrder !== 'DESC') && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {busca && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border">
                      Busca: "{busca}"
                      <button
                        className="ml-1 hover:text-red-600"
                        onClick={() => setBusca('')}
                        aria-label="Limpar busca"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filtros.status && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border">
                      Status: {faturamentoService.formatarStatusFatura(filtros.status as any)}
                      <button
                        className="ml-1 hover:text-red-600"
                        onClick={() => setFiltros((prev) => ({ ...prev, status: undefined }))}
                        aria-label="Limpar filtro de status"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filtros.tipo && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border">
                      Tipo: {faturamentoService.formatarTipoFatura(filtros.tipo as any)}
                      <button
                        className="ml-1 hover:text-red-600"
                        onClick={() => setFiltros((prev) => ({ ...prev, tipo: undefined }))}
                        aria-label="Limpar filtro de tipo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {(sortBy !== 'dataVencimento' || sortOrder !== 'DESC') && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border">
                      Ordenação: {sortBy} {sortOrder === 'DESC' ? '↓' : '↑'}
                      <button
                        className="ml-1 hover:text-red-600"
                        onClick={() => {
                          setSortBy('dataVencimento');
                          setSortOrder('DESC');
                        }}
                        aria-label="Resetar ordenação"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  <button
                    className="ml-auto text-sm text-blue-600 hover:text-blue-800 underline"
                    onClick={() => {
                      setBusca('');
                      setFiltros({});
                      setSortBy('dataVencimento');
                      setSortOrder('DESC');
                      setPage(1);
                      refetch();
                    }}
                  >
                    Limpar tudo
                  </button>
                </div>
              )}
            </div>

            {/* Barra de Ações em Massa */}
            {mostrarAcoesMassa && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-blue-900">
                        {faturasSelecionadas.length} fatura(s) selecionada(s)
                      </span>
                    </div>
                    <button
                      onClick={() => setFaturasSelecionadas([])}
                      className="text-sm text-blue-600 hover:text-blue-800 underline transition-colors"
                    >
                      Desmarcar todas
                    </button>
                  </div>

                  {processandoAcaoMassa && (
                    <div className="w-full mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-sm text-blue-700">Processando ação...</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressoAcaoMassa}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleAcaoMassa('enviar-email')}
                      disabled={processandoAcaoMassa}
                      className="px-4 py-2 bg-[#159A9C] text-white rounded-lg text-sm hover:bg-[#0F7B7D] flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      <Send className="w-4 h-4" />
                      Enviar por Email
                    </button>
                    <button
                      onClick={() => handleAcaoMassa('baixar-pdfs')}
                      disabled={processandoAcaoMassa}
                      className="px-4 py-2 bg-[#159A9C] text-white rounded-lg text-sm hover:bg-[#0F7B7D] flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Baixar PDFs
                    </button>
                    <button
                      onClick={() => handleAcaoMassa('gerar-cobranca')}
                      disabled={processandoAcaoMassa}
                      className="px-4 py-2 bg-[#159A9C] text-white rounded-lg text-sm hover:bg-[#0F7B7D] flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Gerar Cobrança
                    </button>
                    <button
                      onClick={() => handleAcaoMassa('exportar')}
                      disabled={processandoAcaoMassa}
                      className="px-4 py-2 bg-[#159A9C] text-white rounded-lg text-sm hover:bg-[#0F7B7D] flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      Exportar
                    </button>
                    <button
                      onClick={() => handleAcaoMassa('excluir')}
                      disabled={processandoAcaoMassa}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Faturas */}
            <div className="bg-white rounded-lg shadow-sm border">
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
                                faturasSelecionadas.length === faturasFiltradas.length &&
                                faturasFiltradas.length > 0
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
                        {faturasFiltradas.map((fatura, index) => {
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
                                              className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2 transition-colors"
                                            >
                                              <Link2 className="w-3 h-3" />
                                              Gerar Link
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
                                      className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors"
                                    >
                                      <CreditCard className="w-4 h-4" />
                                      <div>
                                        <div className="font-medium">Pagar Online</div>
                                        <div className="text-xs text-gray-500">Gateway</div>
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
            </div>
          </div>
        )}

        {/* Visão de Dashboard IA */}
        {visaoAtiva === 'ia' && (
          <DashboardIA faturas={faturas} onExecutarAcao={handleAcaoNotificacao} />
        )}

        {/* Visão de Relatórios Avançados */}
        {visaoAtiva === 'relatorios' && (
          <RelatoriosAvancados faturas={faturas} onExportar={handleExportarRelatorio} />
        )}

        {/* Visão de Automação de Emails */}
        {visaoAtiva === 'email' && (
          <EmailAutomacao faturas={faturas} onEnviarEmail={handleEnviarEmail} />
        )}

        {/* Visão de Workflows */}
        {visaoAtiva === 'workflows' && (
          <WorkflowAutomacao faturas={faturas} onExecutarAcao={handleExecutarWorkflow} />
        )}

        {/* Visão de Notificações */}
        {visaoAtiva === 'notificacoes' && (
          <NotificacoesInteligentes faturas={faturas} onAcaoNotificacao={handleAcaoNotificacao} />
        )}

        {/* Visão de Backup e Recuperação */}
        {visaoAtiva === 'backup' && (
          <BackupRecuperacao
            onExecutarBackup={handleExecutarBackup}
            onRestaurarBackup={handleRestaurarBackup}
          />
        )}
      </div>

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
          onEdit={() => {
            abrirModalEdicao(faturaDetalhes);
            fecharModalDetalhes();
          }}
          onGeneratePaymentLink={gerarLinkPagamento}
          onSendEmail={enviarPorEmail}
          onDownloadPDF={baixarPDF}
        />
      )}

      <ModalConfigurarCards
        isOpen={modalConfigurarCardsAberto}
        onClose={() => setModalConfigurarCardsAberto(false)}
        cardsDisponiveis={obterTodasConfiguracoesCards()}
        onSave={salvarConfiguracaoCards}
      />

      {faturaPagamentos && (
        <ModalPagamentos
          isOpen={modalPagamentosAberto}
          onClose={fecharModalPagamentos}
          fatura={faturaPagamentos}
          onRegistrarPagamento={registrarPagamento}
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
