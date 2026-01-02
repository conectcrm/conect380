import React, { useState, useMemo } from 'react';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  PieChart,
  FileText,
  Download,
  Filter,
  Search,
  Eye,
  Edit,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react';

// Tipos
interface Transacao {
  id: string;
  tipo: 'receita' | 'despesa';
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  status: 'pendente' | 'concluida' | 'cancelada';
  formaPagamento: string;
  cliente?: string;
  observacoes?: string;
}

interface RelatorioFinanceiro {
  periodo: string;
  receitas: number;
  despesas: number;
  lucroLiquido: number;
  contasReceber: number;
  contasPagar: number;
  fluxoCaixa: number;
}

// Mock data
const transacoesMock: Transacao[] = [
  {
    id: '1',
    tipo: 'receita',
    categoria: 'Vendas',
    descricao: 'Venda Sistema ERP - Tech Solutions',
    valor: 15000.0,
    data: '2024-12-10T10:30:00Z',
    status: 'concluida',
    formaPagamento: 'Transferência Bancária',
    cliente: 'Tech Solutions Ltda',
    observacoes: 'Pagamento à vista com 5% de desconto',
  },
  {
    id: '2',
    tipo: 'despesa',
    categoria: 'Operacional',
    descricao: 'Licenças de Software',
    valor: 2500.0,
    data: '2024-12-09T14:20:00Z',
    status: 'concluida',
    formaPagamento: 'Cartão de Crédito',
    observacoes: 'Renovação anual das licenças',
  },
  {
    id: '3',
    tipo: 'receita',
    categoria: 'Consultoria',
    descricao: 'Serviços de Consultoria - Indústria ABC',
    valor: 8500.0,
    data: '2024-12-08T16:45:00Z',
    status: 'pendente',
    formaPagamento: 'Boleto Bancário',
    cliente: 'Indústria ABC S.A.',
    observacoes: 'Vencimento em 30 dias',
  },
  {
    id: '4',
    tipo: 'despesa',
    categoria: 'Marketing',
    descricao: 'Campanha Google Ads',
    valor: 1200.0,
    data: '2024-12-07T09:15:00Z',
    status: 'concluida',
    formaPagamento: 'Débito Automático',
    observacoes: 'Campanha mensal de dezembro',
  },
  {
    id: '5',
    tipo: 'receita',
    categoria: 'Manutenção',
    descricao: 'Suporte Técnico Mensal - Empresa XYZ',
    valor: 3200.0,
    data: '2024-12-06T11:30:00Z',
    status: 'concluida',
    formaPagamento: 'PIX',
    cliente: 'Empresa XYZ Comércio',
    observacoes: 'Pagamento recorrente mensal',
  },
  {
    id: '6',
    tipo: 'despesa',
    categoria: 'Infraestrutura',
    descricao: 'Servidor Cloud AWS',
    valor: 850.0,
    data: '2024-12-05T08:00:00Z',
    status: 'concluida',
    formaPagamento: 'Cartão de Crédito',
    observacoes: 'Fatura mensal do servidor',
  },
];

const relatorioMock: RelatorioFinanceiro = {
  periodo: 'Dezembro 2024',
  receitas: 26700.0,
  despesas: 4550.0,
  lucroLiquido: 22150.0,
  contasReceber: 8500.0,
  contasPagar: 1200.0,
  fluxoCaixa: 29350.0,
};

const FinanceiroPage: React.FC = () => {
  // Estados
  const [transacoes] = useState<Transacao[]>(transacoesMock);
  const [relatorio] = useState<RelatorioFinanceiro>(relatorioMock);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState('30dias');

  // Transações filtradas
  const transacoesFiltradas = useMemo(() => {
    return transacoes.filter((transacao) => {
      const matchesSearch =
        transacao.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transacao.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transacao.cliente && transacao.cliente.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesTipo = tipoFilter === 'todos' || transacao.tipo === tipoFilter;
      const matchesStatus = statusFilter === 'todos' || transacao.status === statusFilter;
      const matchesCategoria =
        categoriaFilter === 'todas' || transacao.categoria === categoriaFilter;

      return matchesSearch && matchesTipo && matchesStatus && matchesCategoria;
    });
  }, [transacoes, searchTerm, tipoFilter, statusFilter, categoriaFilter]);

  // Categorias únicas
  const categorias = useMemo(() => {
    const categoriasSet = new Set(transacoes.map((t) => t.categoria));
    return Array.from(categoriasSet);
  }, [transacoes]);

  // Funções auxiliares
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      concluida: 'bg-green-100 text-green-800',
      pendente: 'bg-yellow-100 text-yellow-800',
      cancelada: 'bg-red-100 text-red-800',
    };

    const icons = {
      concluida: CheckCircle,
      pendente: Clock,
      cancelada: XCircle,
    };

    const Icon = icons[status as keyof typeof icons];

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}
      >
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTipoIcon = (tipo: string) => {
    return tipo === 'receita' ? (
      <ArrowUpRight className="h-4 w-4 text-green-500" />
    ) : (
      <ArrowDownLeft className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="CRM" nucleusPath="/nuclei/crm" currentModuleName="Financeiro" />
      </div>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-gray-600">Controle financeiro e relatórios</p>
          </div>
          <div className="flex space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              <FileText className="h-4 w-4 mr-2" />
              Nova Transação
            </button>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Receitas</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(relatorio.receitas)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Despesas</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(relatorio.despesas)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Lucro Líquido</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(relatorio.lucroLiquido)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Contas a Receber</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(relatorio.contasReceber)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Contas a Pagar</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(relatorio.contasPagar)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <PieChart className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Fluxo de Caixa</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(relatorio.fluxoCaixa)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar transações por descrição, categoria ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Período */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7dias">Últimos 7 dias</option>
                <option value="30dias">Últimos 30 dias</option>
                <option value="90dias">Últimos 90 dias</option>
                <option value="ano">Este ano</option>
              </select>
            </div>

            {/* Botão Filtros Mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </button>
          </div>

          {/* Filtros */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${showFilters ? 'block' : 'hidden sm:grid'}`}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos os tipos</option>
                <option value="receita">Receitas</option>
                <option value="despesa">Despesas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos os status</option>
                <option value="concluida">Concluída</option>
                <option value="pendente">Pendente</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todas">Todas as categorias</option>
                {categorias.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Transações */}
        <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
          {/* Header da tabela */}
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Transações ({transacoesFiltradas.length})
              </h3>
            </div>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Forma de Pagamento
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transacoesFiltradas.map((transacao) => (
                  <tr key={transacao.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transacao.descricao}
                        </div>
                        <div className="text-sm text-gray-500">{transacao.categoria}</div>
                        {transacao.cliente && (
                          <div className="text-sm text-gray-500">Cliente: {transacao.cliente}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTipoIcon(transacao.tipo)}
                        <span
                          className={`ml-2 text-sm font-medium ${
                            transacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transacao.tipo.charAt(0).toUpperCase() + transacao.tipo.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${
                          transacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transacao.tipo === 'receita' ? '+' : '-'}
                        {formatCurrency(transacao.valor)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transacao.data)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(transacao.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transacao.formaPagamento}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {transacoesFiltradas.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Nenhuma transação encontrada
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Tente ajustar os filtros ou adicionar uma nova transação.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceiroPage;
