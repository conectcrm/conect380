import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  DollarSign,
  Building,
  X,
} from 'lucide-react';
import { BackToNucleus } from '../../../components/navigation/BackToNucleus';
import ModalConfirmacao from '../../../components/common/ModalConfirmacao';
import { useConfirmacaoInteligente } from '../../../hooks/useConfirmacaoInteligente';
import {
  ContaPagar,
  StatusContaPagar,
  ResumoFinanceiro,
  NovaContaPagar,
  RegistrarPagamento,
  STATUS_LABELS,
  CATEGORIA_LABELS,
  CategoriaContaPagar,
  FormaPagamento,
  PrioridadePagamento,
} from '../../../types/financeiro';

// Importar os novos componentes aprimorados
import ModalContaPagar from '../../../features/financeiro/components/ModalContaPagarNovo';

interface ContasPagarPageProps {
  className?: string;
}

type FeedbackMensagem = {
  tipo: 'erro' | 'sucesso' | 'info';
  mensagem: string;
};

const FEEDBACK_ESTILOS: Record<FeedbackMensagem['tipo'], string> = {
  erro: 'bg-red-50 border-red-200 text-red-700',
  sucesso: 'bg-green-50 border-green-200 text-green-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
};

const ContasPagarPage: React.FC<ContasPagarPageProps> = ({ className }) => {
  // Estados principais
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [contaSelecionada, setContaSelecionada] = useState<ContaPagar | null>(null);
  const [resumoFinanceiro, setResumoFinanceiro] = useState<ResumoFinanceiro | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados dos modais
  const [modalContaAberto, setModalContaAberto] = useState(false);
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Estados de filtros e busca
  const [termoBusca, setTermoBusca] = useState('');
  const [contasSelecionadas, setContasSelecionadas] = useState<string[]>([]);
  const [feedbackMensagem, setFeedbackMensagem] = useState<FeedbackMensagem | null>(null);

  // Hooks para confirmação inteligente
  const confirmacao = useConfirmacaoInteligente();

  const carregarDados = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Mock data para demonstração
      const mockContas: ContaPagar[] = [
        {
          id: '1',
          numero: 'CP-001',
          fornecedorId: 'forn1',
          fornecedor: {
            id: 'forn1',
            nome: 'Tech Solutions Ltda',
            cnpjCpf: '12.345.678/0001-90',
            email: 'contato@techsolutions.com',
            ativo: true,
            criadoEm: '2024-01-01',
            atualizadoEm: '2024-01-01',
          },
          descricao: 'Licenças de software mensal',
          numeroDocumento: 'NF-001234',
          dataEmissao: '2024-01-01',
          dataVencimento: '2024-01-15',
          valorOriginal: 2500.0,
          valorDesconto: 0,
          valorMulta: 0,
          valorJuros: 0,
          valorTotal: 2500.0,
          valorPago: 0,
          valorRestante: 2500.0,
          status: StatusContaPagar.EM_ABERTO,
          categoria: CategoriaContaPagar.TECNOLOGIA,
          prioridade: PrioridadePagamento.ALTA,
          recorrente: true,
          frequenciaRecorrencia: 'mensal',
          necessitaAprovacao: false,
          anexos: [],
          observacoes: 'Pagamento mensal das licenças',
          criadoPor: 'user1',
          criadoEm: '2024-01-01',
          atualizadoEm: '2024-01-01',
          tags: ['software', 'recorrente'],
        },
        {
          id: '2',
          numero: 'CP-002',
          fornecedorId: 'forn2',
          fornecedor: {
            id: 'forn2',
            nome: 'Papelaria Central',
            cnpjCpf: '98.765.432/0001-10',
            email: 'vendas@papelaria.com',
            ativo: true,
            criadoEm: '2024-01-01',
            atualizadoEm: '2024-01-01',
          },
          descricao: 'Material de escritório',
          numeroDocumento: 'NF-567890',
          dataEmissao: '2024-01-10',
          dataVencimento: '2024-01-20',
          valorOriginal: 450.0,
          valorDesconto: 50.0,
          valorMulta: 0,
          valorJuros: 0,
          valorTotal: 400.0,
          valorPago: 400.0,
          valorRestante: 0,
          status: StatusContaPagar.PAGO,
          categoria: CategoriaContaPagar.ESCRITORIO,
          prioridade: PrioridadePagamento.MEDIA,
          recorrente: false,
          necessitaAprovacao: false,
          dataPagamento: '2024-01-18',
          tipoPagamento: FormaPagamento.PIX,
          anexos: [],
          criadoPor: 'user1',
          criadoEm: '2024-01-10',
          atualizadoEm: '2024-01-18',
          tags: ['material', 'escritorio'],
        },
      ];

      const mockResumo: ResumoFinanceiro = {
        totalVencendoHoje: 5420.3,
        quantidadeVencendoHoje: 3,
        totalMes: 45230.8,
        quantidadeMes: 28,
        totalAtrasado: 12450.0,
        quantidadeAtrasado: 5,
        totalPagoMes: 38920.5,
        quantidadePagoMes: 22,
        proximosVencimentos: mockContas.slice(0, 5),
      };

      setContas(mockContas);
      setResumoFinanceiro(mockResumo);
      setFeedbackMensagem(null);
    } catch {
      setError('Erro ao carregar dados das contas a pagar');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregamento inicial dos dados
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Funções de manipulação
  const handleNovaConta = (): void => {
    setContaSelecionada(null);
    setModalContaAberto(true);
  };

  const handleEditarConta = (conta: ContaPagar): void => {
    setContaSelecionada(conta);
    setModalContaAberto(true);
  };

  const handleRegistrarPagamento = (conta: ContaPagar): void => {
    setContaSelecionada(conta);
    setModalPagamentoAberto(true);
  };

  const handleExcluirConta = (contaId: string): void => {
    try {
      const conta = contas.find((c) => c.id === contaId);
      if (!conta) {
        setFeedbackMensagem({ tipo: 'erro', mensagem: 'Conta não encontrada para exclusão.' });
        return;
      }

      const tipoConfirmacao =
        conta.status === StatusContaPagar.PAGO ? 'estornar-pagamento' : 'excluir-transacao';

      const dadosContexto = {
        numero: conta.numero,
        valor: conta.valorTotal,
        cliente: conta.fornecedor?.nome,
        status: STATUS_LABELS[conta.status],
      };

      confirmacao.confirmar(
        tipoConfirmacao,
        async () => {
          setContas((prev) => prev.filter((c) => c.id !== contaId));
          setFeedbackMensagem({
            tipo: 'sucesso',
            mensagem: `Conta ${conta.numero} removida com sucesso.`,
          });
        },
        dadosContexto,
      );
    } catch {
      setFeedbackMensagem({
        tipo: 'erro',
        mensagem: 'Não foi possível excluir a conta selecionada.',
      });
    }
  };

  const handleAcaoMassa = (acao: 'marcar_pago' | 'excluir'): void => {
    if (contasSelecionadas.length === 0) {
      setFeedbackMensagem({
        tipo: 'erro',
        mensagem: 'Selecione pelo menos uma conta para realizar essa ação.',
      });
      return;
    }

    const acaoDescricao = acao === 'marcar_pago' ? 'marcar como pago' : 'excluir';
    setFeedbackMensagem({
      tipo: 'info',
      mensagem: `Solicitação para ${acaoDescricao} ${contasSelecionadas.length} conta(s) registrada.`,
    });
  };

  const handleSalvarConta = async (conta: NovaContaPagar): Promise<void> => {
    try {
      setModalContaAberto(false);
      await carregarDados();
      setFeedbackMensagem({
        tipo: 'sucesso',
        mensagem: `${conta.descricao} salva com sucesso.`,
      });
    } catch {
      setFeedbackMensagem({ tipo: 'erro', mensagem: 'Não foi possível salvar a conta.' });
    }
  };

  const handleSalvarPagamento = async (pagamento: RegistrarPagamento): Promise<void> => {
    try {
      setModalPagamentoAberto(false);
      await carregarDados();
      const contaReferencia = pagamento.contaId || contaSelecionada?.numero || 'conta';
      setFeedbackMensagem({
        tipo: 'sucesso',
        mensagem: `Pagamento da ${contaReferencia} registrado com sucesso.`,
      });
    } catch {
      setFeedbackMensagem({ tipo: 'erro', mensagem: 'Não foi possível registrar o pagamento.' });
    }
  };

  // Filtros e busca
  const contasFiltradas = useMemo<ContaPagar[]>(() => {
    return contas.filter((conta) => {
      if (termoBusca) {
        const termo = termoBusca.toLowerCase();
        return (
          conta.numero.toLowerCase().includes(termo) ||
          conta.fornecedor.nome.toLowerCase().includes(termo) ||
          conta.descricao.toLowerCase().includes(termo) ||
          conta.numeroDocumento?.toLowerCase().includes(termo)
        );
      }
      return true;
    });
  }, [contas, termoBusca]);

  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarData = (data: string): string => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const getStatusIcon = (status: StatusContaPagar): React.ReactNode => {
    switch (status) {
      case StatusContaPagar.PAGO:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case StatusContaPagar.VENCIDO:
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case StatusContaPagar.AGENDADO:
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusColor = (status: StatusContaPagar): string => {
    switch (status) {
      case StatusContaPagar.PAGO:
        return 'bg-green-100 text-green-800';
      case StatusContaPagar.VENCIDO:
        return 'bg-red-100 text-red-800';
      case StatusContaPagar.AGENDADO:
        return 'bg-blue-100 text-blue-800';
      case StatusContaPagar.CANCELADO:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-2">{error}</div>
        <button onClick={carregarDados} className="text-blue-600 hover:text-blue-800 underline">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className ?? ''}`}>
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusPath="/nuclei/financeiro" nucleusName="Financeiro" />
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                <CreditCard className="h-8 w-8 mr-3 text-[#159A9C]" />
                Contas a Pagar
                {loading && (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#159A9C] ml-3"></div>
                )}
              </h1>
              <p className="mt-2 text-[#B4BEC9]">
                {loading
                  ? 'Carregando contas...'
                  : `Gerencie suas ${contasFiltradas.length} obrigações financeiras`}
              </p>
            </div>

            {/* Botão de ação principal */}
            <div className="mt-4 sm:mt-0 flex items-center gap-3">
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filtros
              </button>
              <button
                onClick={handleNovaConta}
                className="bg-[#159A9C] hover:bg-[#0F7B7D] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Nova Conta
              </button>
            </div>
          </div>
        </div>

        {feedbackMensagem && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg border text-sm font-medium ${FEEDBACK_ESTILOS[feedbackMensagem.tipo]}`}
          >
            {feedbackMensagem.mensagem}
          </div>
        )}

        {/* Cards de Dashboard */}
        {resumoFinanceiro && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-[#DEEFE7] p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Vencendo Hoje
                  </p>
                  <p className="text-3xl font-bold text-[#002333] mt-2">
                    {formatarMoeda(resumoFinanceiro.totalVencendoHoje)}
                  </p>
                  <p className="text-sm text-[#002333]/70 mt-3">
                    ⏰ {resumoFinanceiro.quantidadeVencendoHoje} conta(s)
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center shadow-sm">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[#DEEFE7] p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Total do Mês
                  </p>
                  <p className="text-3xl font-bold text-[#002333] mt-2">
                    {formatarMoeda(resumoFinanceiro.totalMes)}
                  </p>
                  <p className="text-sm text-[#002333]/70 mt-3">
                    📅 {resumoFinanceiro.quantidadeMes} conta(s)
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                  <Calendar className="w-6 h-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[#DEEFE7] p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Em Atraso
                  </p>
                  <p className="text-3xl font-bold text-[#002333] mt-2">
                    {formatarMoeda(resumoFinanceiro.totalAtrasado)}
                  </p>
                  <p className="text-sm text-[#002333]/70 mt-3">
                    🚨 {resumoFinanceiro.quantidadeAtrasado} conta(s)
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center shadow-sm">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[#DEEFE7] p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Pago no Mês
                  </p>
                  <p className="text-3xl font-bold text-[#002333] mt-2">
                    {formatarMoeda(resumoFinanceiro.totalPagoMes)}
                  </p>
                  <p className="text-sm text-[#002333]/70 mt-3">
                    ✅ {resumoFinanceiro.quantidadePagoMes} conta(s)
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center shadow-sm">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros Simples */}
        {mostrarFiltros && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar Contas
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por fornecedor, número ou descrição..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setMostrarFiltros(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barra de pesquisa e ações */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Buscar por número, fornecedor, descrição..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {contasSelecionadas.length > 0 && (
              <>
                <button
                  onClick={() => handleAcaoMassa('marcar_pago')}
                  className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm font-medium"
                >
                  Marcar como Pago
                </button>
                <button
                  onClick={() => handleAcaoMassa('excluir')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Excluir Selecionadas
                </button>
              </>
            )}
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium">
              <Download size={16} />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Contas a Pagar */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Lista de Contas a Pagar</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white border-b border-gray-200">
              <tr>
                <th className="w-12 px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setContasSelecionadas(contas.map((c) => c.id));
                      } else {
                        setContasSelecionadas([]);
                      }
                    }}
                    className="w-4 h-4 text-[#159A9C] bg-gray-100 border-gray-300 rounded focus:ring-[#159A9C] focus:ring-2"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Número
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Fornecedor
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Descrição
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Categoria
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Vencimento
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Valor
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Status
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contasFiltradas.map((conta) => {
                const isVencida =
                  new Date(conta.dataVencimento) < new Date() &&
                  conta.status === StatusContaPagar.EM_ABERTO;
                const isVencendoHoje =
                  new Date(conta.dataVencimento).toDateString() === new Date().toDateString();

                return (
                  <tr
                    key={conta.id}
                    className={`hover:bg-gray-50 transition-colors ${isVencida ? 'bg-red-50' : isVencendoHoje ? 'bg-orange-50' : ''
                      }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={contasSelecionadas.includes(conta.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setContasSelecionadas([...contasSelecionadas, conta.id]);
                          } else {
                            setContasSelecionadas(
                              contasSelecionadas.filter((id) => id !== conta.id),
                            );
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{conta.numero}</div>
                        {conta.recorrente && (
                          <div className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Recorrente
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{conta.fornecedor.nome}</div>
                      <div className="text-sm text-gray-500">{conta.fornecedor.cnpjCpf}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="text-sm text-gray-900 max-w-xs truncate"
                        title={conta.descricao}
                      >
                        {conta.descricao}
                      </div>
                      {conta.numeroDocumento && (
                        <div className="text-sm text-gray-500">Doc: {conta.numeroDocumento}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {CATEGORIA_LABELS[conta.categoria] || conta.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm ${isVencida
                            ? 'text-red-600 font-medium'
                            : isVencendoHoje
                              ? 'text-orange-600 font-medium'
                              : 'text-gray-900'
                          }`}
                      >
                        {formatarData(conta.dataVencimento)}
                      </div>
                      {(isVencida || isVencendoHoje) && (
                        <div className="text-xs text-gray-500">
                          {isVencida ? 'Vencida' : 'Vence hoje'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatarMoeda(conta.valorTotal)}
                      </div>
                      {conta.valorPago > 0 && (
                        <div className="text-xs text-green-600">
                          Pago: {formatarMoeda(conta.valorPago)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(conta.status)}
                        <span
                          className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(conta.status)}`}
                        >
                          {STATUS_LABELS[conta.status]}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {conta.status === StatusContaPagar.EM_ABERTO && (
                          <button
                            onClick={() => handleRegistrarPagamento(conta)}
                            className="text-green-600 hover:text-green-800 p-1 rounded"
                            title="Registrar Pagamento"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditarConta(conta)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExcluirConta(conta.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Profissional para Nova Conta */}
      {modalContaAberto && (
        <ModalContaPagar
          conta={contaSelecionada}
          onClose={() => setModalContaAberto(false)}
          onSave={handleSalvarConta}
        />
      )}

      {/* Modal simplificado para Pagamento */}
      {modalPagamentoAberto && contaSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Registrar Pagamento
              </h2>
              <button
                onClick={() => setModalPagamentoAberto(false)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">Conta: {contaSelecionada.numero}</p>
                <p className="text-sm text-gray-600">
                  Fornecedor: {contaSelecionada.fornecedor.nome}
                </p>
                <p className="text-lg font-semibold text-red-600">
                  Valor Restante: {formatarMoeda(contaSelecionada.valorRestante)}
                </p>
              </div>
              <p className="text-sm text-gray-500">
                Modal completo implementado no componente separado ModalPagamento.tsx
              </p>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setModalPagamentoAberto(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSalvarPagamento({} as RegistrarPagamento)}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] text-sm font-medium"
              >
                Registrar Pagamento
              </button>
            </div>
          </div>
        </div>
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
    </div>
  );
};

export default ContasPagarPage;
