import React, { useState, useEffect, useMemo } from 'react';
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
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { ContaPagar, StatusContaPagar, FiltrosContasPagar, ResumoFinanceiro } from '../../../types/financeiro';

interface ContasPagarPageProps {
  className?: string;
}

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
  const [filtros, setFiltros] = useState<FiltrosContasPagar>({});
  const [termoBusca, setTermoBusca] = useState('');
  const [contasSelecionadas, setContasSelecionadas] = useState<string[]>([]);

  // Carregamento inicial dos dados
  useEffect(() => {
    carregarDados();
  }, [filtros]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Aqui você faria as chamadas para sua API
      // const contasResponse = await api.get('/contas-pagar', { params: filtros });
      // const resumoResponse = await api.get('/contas-pagar/resumo');
      
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
            atualizadoEm: '2024-01-01'
          },
          descricao: 'Licenças de software mensal',
          numeroDocumento: 'NF-001234',
          dataEmissao: '2024-01-01',
          dataVencimento: '2024-01-15',
          valorOriginal: 2500.00,
          valorDesconto: 0,
          valorMulta: 0,
          valorJuros: 0,
          valorTotal: 2500.00,
          valorPago: 0,
          valorRestante: 2500.00,
          status: StatusContaPagar.EM_ABERTO,
          categoria: 'tecnologia' as any,
          prioridade: 'alta' as any,
          recorrente: true,
          frequenciaRecorrencia: 'mensal',
          necessitaAprovacao: false,
          anexos: [],
          observacoes: 'Pagamento mensal das licenças',
          criadoPor: 'user1',
          criadoEm: '2024-01-01',
          atualizadoEm: '2024-01-01',
          tags: ['software', 'recorrente']
        }
      ];

      const mockResumo: ResumoFinanceiro = {
        totalVencendoHoje: 5420.30,
        quantidadeVencendoHoje: 3,
        totalMes: 45230.80,
        quantidadeMes: 28,
        totalAtrasado: 12450.00,
        quantidadeAtrasado: 5,
        totalPagoMes: 38920.50,
        quantidadePagoMes: 22,
        proximosVencimentos: mockContas.slice(0, 5)
      };

      setContas(mockContas);
      setResumoFinanceiro(mockResumo);
    } catch (err) {
      setError('Erro ao carregar dados das contas a pagar');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Funções de manipulação
  const handleNovaConta = () => {
    setContaSelecionada(null);
    setModalContaAberto(true);
  };

  const handleEditarConta = (conta: ContaPagar) => {
    setContaSelecionada(conta);
    setModalContaAberto(true);
  };

  const handleRegistrarPagamento = (conta: ContaPagar) => {
    setContaSelecionada(conta);
    setModalPagamentoAberto(true);
  };

  const handleExcluirConta = async (contaId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta conta?')) {
      try {
        // await api.delete(`/contas-pagar/${contaId}`);
        setContas(contas.filter(c => c.id !== contaId));
      } catch (err) {
        console.error('Erro ao excluir conta:', err);
      }
    }
  };

  const handleAcaoMassa = async (acao: string) => {
    if (contasSelecionadas.length === 0) {
      alert('Selecione pelo menos uma conta');
      return;
    }

    // Implementar ações em massa
    console.log('Ação em massa:', acao, contasSelecionadas);
  };

  // Filtros e busca
  const contasFiltradas = useMemo(() => {
    return contas.filter(conta => {
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

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
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
        <button 
          onClick={carregarDados}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-gray-50 min-h-screen ${className}`}>
      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contas a Pagar</h1>
            <p className="text-gray-600 mt-1">Gerencie todas as suas obrigações financeiras</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter size={20} />
              Filtros
            </button>
            <button
              onClick={handleNovaConta}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Nova Conta
            </button>
          </div>
        </div>

        {/* Cards de resumo */}
        {resumoFinanceiro && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Vencendo Hoje</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatarMoeda(resumoFinanceiro.totalVencendoHoje)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {resumoFinanceiro.quantidadeVencendoHoje} conta(s)
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total do Mês</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatarMoeda(resumoFinanceiro.totalMes)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {resumoFinanceiro.quantidadeMes} conta(s)
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Em Atraso</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatarMoeda(resumoFinanceiro.totalAtrasado)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {resumoFinanceiro.quantidadeAtrasado} conta(s)
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pago no Mês</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatarMoeda(resumoFinanceiro.totalPagoMes)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {resumoFinanceiro.quantidadePagoMes} conta(s)
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtros avançados */}
      {mostrarFiltros && (
        <FiltrosAvancados
          filtros={filtros}
          onFiltrosChange={setFiltros}
          onFechar={() => setMostrarFiltros(false)}
        />
      )}

      {/* Barra de pesquisa e ações */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
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
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Marcar como Pago
                </button>
                <button
                  onClick={() => handleAcaoMassa('excluir')}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Excluir Selecionadas
                </button>
              </>
            )}
            <button
              onClick={() => {/* Implementar exportação */}}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              <Download size={16} />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de contas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <TableContasPagar
          contas={contasFiltradas}
          contasSelecionadas={contasSelecionadas}
          onContasSelecionadasChange={setContasSelecionadas}
          onEditarConta={handleEditarConta}
          onRegistrarPagamento={handleRegistrarPagamento}
          onExcluirConta={handleExcluirConta}
        />
      </div>

      {/* Modais */}
      {modalContaAberto && (
        <ModalContaPagar
          conta={contaSelecionada}
          onClose={() => setModalContaAberto(false)}
          onSave={(conta) => {
            // Implementar salvamento
            console.log('Salvar conta:', conta);
            setModalContaAberto(false);
            carregarDados();
          }}
        />
      )}

      {modalPagamentoAberto && contaSelecionada && (
        <ModalPagamento
          conta={contaSelecionada}
          onClose={() => setModalPagamentoAberto(false)}
          onSave={(pagamento) => {
            // Implementar registro de pagamento
            console.log('Registrar pagamento:', pagamento);
            setModalPagamentoAberto(false);
            carregarDados();
          }}
        />
      )}
    </div>
  );
};

export default ContasPagarPage;
