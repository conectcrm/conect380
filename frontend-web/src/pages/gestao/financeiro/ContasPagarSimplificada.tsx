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
  Building,
  X,
  Save,
  Upload
} from 'lucide-react';
import { BackToNucleus } from '../../../components/navigation/BackToNucleus';
import { 
  ContaPagar, 
  StatusContaPagar, 
  FiltrosContasPagar, 
  ResumoFinanceiro,
  NovaContaPagar,
  RegistrarPagamento,
  STATUS_LABELS,
  CATEGORIA_LABELS,
  FORMA_PAGAMENTO_LABELS,
  CategoriaContaPagar,
  FormaPagamento,
  PrioridadePagamento
} from '../../../types/financeiro';

// Importar os novos componentes aprimorados
import FiltrosAvancados from './components/FiltrosAvancados';
import ModalContaPagar from './components/ModalContaPagarNovo';

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
          tags: ['software', 'recorrente']
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
            atualizadoEm: '2024-01-01'
          },
          descricao: 'Material de escritório',
          numeroDocumento: 'NF-567890',
          dataEmissao: '2024-01-10',
          dataVencimento: '2024-01-20',
          valorOriginal: 450.00,
          valorDesconto: 50.00,
          valorMulta: 0,
          valorJuros: 0,
          valorTotal: 400.00,
          valorPago: 400.00,
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
          tags: ['material', 'escritorio']
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
    console.log('Ação em massa:', acao, contasSelecionadas);
  };

  const handleSalvarConta = (conta: NovaContaPagar) => {
    console.log('Salvar conta:', conta);
    setModalContaAberto(false);
    carregarDados();
  };

  const handleSalvarPagamento = (pagamento: RegistrarPagamento) => {
    console.log('Registrar pagamento:', pagamento);
    setModalPagamentoAberto(false);
    carregarDados();
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

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const getStatusIcon = (status: StatusContaPagar) => {
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

  const getStatusColor = (status: StatusContaPagar) => {
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
      {/* Navegação de volta ao núcleo */}
      <BackToNucleus 
        nucleusPath="/nuclei/financeiro"
        nucleusName="Financeiro"
      />

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

        {/* Filtros Avançados */}
        {mostrarFiltros && (
          <FiltrosAvancados
            filtros={filtros}
            onFiltrosChange={setFiltros}
            onFechar={() => setMostrarFiltros(false)}
          />
        )}
      </div>

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
            <button className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">
              <Download size={16} />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de contas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setContasSelecionadas(contas.map(c => c.id));
                      } else {
                        setContasSelecionadas([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fornecedor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contasFiltradas.map((conta) => {
                const isVencida = new Date(conta.dataVencimento) < new Date() && conta.status === StatusContaPagar.EM_ABERTO;
                const isVencendoHoje = new Date(conta.dataVencimento).toDateString() === new Date().toDateString();
                
                return (
                  <tr 
                    key={conta.id} 
                    className={`hover:bg-gray-50 transition-colors ${
                      isVencida ? 'bg-red-50' : isVencendoHoje ? 'bg-orange-50' : ''
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
                            setContasSelecionadas(contasSelecionadas.filter(id => id !== conta.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{conta.numero}</div>
                        {conta.recorrente && (
                          <div className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Recorrente
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{conta.fornecedor.nome}</div>
                      <div className="text-sm text-gray-500">{conta.fornecedor.cnpjCpf}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={conta.descricao}>
                        {conta.descricao}
                      </div>
                      {conta.numeroDocumento && (
                        <div className="text-sm text-gray-500">Doc: {conta.numeroDocumento}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {CATEGORIA_LABELS[conta.categoria] || conta.categoria}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className={`text-sm ${
                        isVencida ? 'text-red-600 font-medium' : 
                        isVencendoHoje ? 'text-orange-600 font-medium' : 
                        'text-gray-900'
                      }`}>
                        {formatarData(conta.dataVencimento)}
                      </div>
                      {(isVencida || isVencendoHoje) && (
                        <div className="text-xs text-gray-500">
                          {isVencida ? 'Vencida' : 'Vence hoje'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatarMoeda(conta.valorTotal)}
                      </div>
                      {conta.valorPago > 0 && (
                        <div className="text-xs text-green-600">
                          Pago: {formatarMoeda(conta.valorPago)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(conta.status)}
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(conta.status)}`}>
                          {STATUS_LABELS[conta.status]}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {conta.status === StatusContaPagar.EM_ABERTO && (
                          <button
                            onClick={() => handleRegistrarPagamento(conta)}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Registrar Pagamento"
                          >
                            <CreditCard size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditarConta(conta)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleExcluirConta(conta.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
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
                <p className="text-sm text-gray-600">Fornecedor: {contaSelecionada.fornecedor.nome}</p>
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
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Registrar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContasPagarPage;
