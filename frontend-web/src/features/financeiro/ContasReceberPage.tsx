import React, { useState } from 'react';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  User,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  CreditCard,
  FileText,
  Mail
} from 'lucide-react';

interface ContaReceber {
  id: string;
  numero: string;
  cliente: string;
  empresa: string;
  descricao: string;
  valor: number;
  valorPago: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'pendente' | 'vencida' | 'paga' | 'cancelada';
  diasAtraso: number;
  formaPagamento: string;
  observacoes?: string;
  responsavel: string;
  categoria: string;
}

const ContasReceberPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterVencimento, setFilterVencimento] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [selectedConta, setSelectedConta] = useState<ContaReceber | null>(null);

  // Dados mockados para demonstração
  const contas: ContaReceber[] = [
    {
      id: '1',
      numero: 'CR-2025-001',
      cliente: 'João Silva',
      empresa: 'Tech Solutions Ltda',
      descricao: 'Pagamento Sistema CRM - Janeiro/2025',
      valor: 2500,
      valorPago: 0,
      dataVencimento: '2025-01-25',
      status: 'pendente',
      diasAtraso: 0,
      formaPagamento: 'Boleto Bancário',
      responsavel: 'Maria Santos',
      categoria: 'Licença de Software'
    },
    {
      id: '2',
      numero: 'CR-2025-002',
      cliente: 'Ana Costa',
      empresa: 'Comércio Brasil S.A.',
      descricao: 'Consultoria Marketing Digital - Projeto E-commerce',
      valor: 5000,
      valorPago: 5000,
      dataVencimento: '2025-01-15',
      dataPagamento: '2025-01-14',
      status: 'paga',
      diasAtraso: 0,
      formaPagamento: 'Transferência Bancária',
      responsavel: 'Carlos Lima',
      categoria: 'Consultoria',
      observacoes: 'Pagamento realizado antes do vencimento'
    },
    {
      id: '3',
      numero: 'CR-2025-003',
      cliente: 'Pedro Oliveira',
      empresa: 'StartupTech',
      descricao: 'Desenvolvimento App Mobile - 1ª Parcela',
      valor: 15000,
      valorPago: 0,
      dataVencimento: '2025-01-10',
      status: 'vencida',
      diasAtraso: 9,
      formaPagamento: 'PIX',
      responsavel: 'Ana Silva',
      categoria: 'Desenvolvimento',
      observacoes: 'Cliente solicitou prorrogação por dificuldades financeiras'
    },
    {
      id: '4',
      numero: 'CR-2025-004',
      cliente: 'Roberto Santos',
      empresa: 'Indústria XYZ',
      descricao: 'Manutenção Sistema - Dezembro/2024',
      valor: 1500,
      valorPago: 750,
      dataVencimento: '2025-01-05',
      status: 'vencida',
      diasAtraso: 14,
      formaPagamento: 'Boleto Bancário',
      responsavel: 'Lucas Pereira',
      categoria: 'Manutenção',
      observacoes: 'Pagamento parcial realizado, aguardando restante'
    },
    {
      id: '5',
      numero: 'CR-2025-005',
      cliente: 'Fernanda Lima',
      empresa: 'Consultoria ABC',
      descricao: 'Hospedagem Premium - Anual',
      valor: 3600,
      valorPago: 0,
      dataVencimento: '2025-02-01',
      status: 'pendente',
      diasAtraso: 0,
      formaPagamento: 'Cartão de Crédito',
      responsavel: 'Maria Santos',
      categoria: 'Hospedagem'
    }
  ];

  const filteredContas = contas.filter(conta => {
    const matchesSearch = conta.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.descricao.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'todos' || conta.status === filterStatus;

    let matchesVencimento = true;
    if (filterVencimento === 'vencidas') {
      matchesVencimento = conta.status === 'vencida';
    } else if (filterVencimento === 'vencendo') {
      const hoje = new Date();
      const vencimento = new Date(conta.dataVencimento);
      const diffDays = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
      matchesVencimento = diffDays <= 7 && diffDays >= 0;
    }

    return matchesSearch && matchesStatus && matchesVencimento;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'vencida': return 'bg-red-100 text-red-800';
      case 'paga': return 'bg-green-100 text-green-800';
      case 'cancelada': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'vencida': return 'Vencida';
      case 'paga': return 'Paga';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return <Clock className="w-4 h-4" />;
      case 'vencida': return <AlertTriangle className="w-4 h-4" />;
      case 'paga': return <CheckCircle className="w-4 h-4" />;
      case 'cancelada': return <XCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getVencimentoStatus = (dataVencimento: string, status: string) => {
    if (status === 'paga') return 'paga';

    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diffDays = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) return 'vencida';
    if (diffDays <= 7) return 'vencendo';
    return 'normal';
  };

  const getVencimentoColor = (dataVencimento: string, status: string) => {
    const vencimentoStatus = getVencimentoStatus(dataVencimento, status);
    switch (vencimentoStatus) {
      case 'vencida': return 'text-red-600';
      case 'vencendo': return 'text-yellow-600';
      case 'paga': return 'text-green-600';
      default: return 'text-[#002333]';
    }
  };

  const handleViewConta = (conta: ContaReceber) => {
    setSelectedConta(conta);
    setShowModal(true);
  };

  const getResumoFinanceiro = () => {
    const totalPendente = contas
      .filter(c => c.status === 'pendente')
      .reduce((total, c) => total + c.valor, 0);

    const totalVencidas = contas
      .filter(c => c.status === 'vencida')
      .reduce((total, c) => total + c.valor, 0);

    const totalRecebido = contas
      .filter(c => c.status === 'paga')
      .reduce((total, c) => total + c.valorPago, 0);

    const totalGeral = contas.reduce((total, c) => total + c.valor, 0);

    return {
      totalPendente,
      totalVencidas,
      totalRecebido,
      totalGeral,
      contasPendentes: contas.filter(c => c.status === 'pendente').length,
      contasVencidas: contas.filter(c => c.status === 'vencida').length
    };
  };

  const resumo = getResumoFinanceiro();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus
          nucleusName="Financeiro"
          nucleusPath="/nuclei/financeiro"
        />
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                <DollarSign className="h-8 w-8 mr-3 text-[#159A9C]" />
                Contas a Receber
              </h1>
              <p className="mt-2 text-[#B4BEC9]">
                Gerencie seus recebimentos e controle inadimplência de {contas.length} contas
              </p>
            </div>

            {/* Botão de ação principal */}
            <div className="mt-4 sm:mt-0 flex items-center gap-3">
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors">
                <Download className="w-4 h-4" />
                Exportar
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                <Plus className="w-5 h-5" />
                Nova Conta
              </button>
            </div>
          </div>
        </div>

        {/* Cards de Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total a Receber</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(resumo.totalGeral)}</p>
                <p className="text-xs text-gray-400 mt-1">💰 Valor total</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pendentes</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{formatCurrency(resumo.totalPendente)}</p>
                <p className="text-xs text-yellow-500 mt-1">⏳ {resumo.contasPendentes} contas</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Vencidas</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{formatCurrency(resumo.totalVencidas)}</p>
                <p className="text-xs text-red-500 mt-1">🚨 {resumo.contasVencidas} contas</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-red-100 to-red-200 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Recebido</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(resumo.totalRecebido)}</p>
                <p className="text-xs text-green-500 mt-1">✅ Este mês</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
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
                  placeholder="Buscar por número, cliente, empresa ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="pendente">⏳ Pendente</option>
                  <option value="vencida">🚨 Vencida</option>
                  <option value="paga">✅ Paga</option>
                  <option value="cancelada">🚫 Cancelada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vencimento
                </label>
                <select
                  value={filterVencimento}
                  onChange={(e) => setFilterVencimento(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                >
                  <option value="todos">Todos os Prazos</option>
                  <option value="vencidas">🚨 Vencidas</option>
                  <option value="vencendo">⚠️ Vencendo (7 dias)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Contas */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Lista de Contas a Receber</h2>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Conta
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Cliente
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
                      <Calendar className="w-4 h-4" />
                      Vencimento
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Status
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Forma Pagamento
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Responsável
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContas.map((conta) => (
                  <tr key={conta.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-[#002333]">{conta.numero}</div>
                        <div className="text-sm text-[#B4BEC9]">{conta.descricao}</div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#159A9C] text-white mt-1">
                          {conta.categoria}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-[#002333]">{conta.cliente}</div>
                        <div className="text-sm text-[#B4BEC9] flex items-center">
                          <Building className="w-4 h-4 mr-1" />
                          {conta.empresa}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-bold text-[#159A9C]">{formatCurrency(conta.valor)}</div>
                        {conta.valorPago > 0 && (
                          <div className="text-xs text-green-600">
                            Pago: {formatCurrency(conta.valorPago)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${getVencimentoColor(conta.dataVencimento, conta.status)}`}>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(conta.dataVencimento).toLocaleDateString('pt-BR')}
                        </div>
                        {conta.diasAtraso > 0 && (
                          <div className="text-xs text-red-600">
                            {conta.diasAtraso} dias de atraso
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(conta.status)}`}>
                        {getStatusIcon(conta.status)}
                        {getStatusLabel(conta.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <CreditCard className="w-4 h-4 mr-1" />
                        {conta.formaPagamento}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-1" />
                        {conta.responsavel}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewConta(conta)}
                          className="text-gray-600 hover:text-gray-800 p-1 rounded"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-blue-600 hover:text-blue-800 p-1 rounded" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-800 p-1 rounded" title="Enviar Cobrança">
                          <Mail className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800 p-1 rounded" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredContas.length === 0 && (
            <div className="p-8 text-center">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma conta encontrada</h3>
              <p className="text-gray-600 mb-4">
                Tente ajustar os filtros ou criar uma nova conta a receber.
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nova Conta
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Visualização */}
      {showModal && selectedConta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#002333]">Detalhes da Conta a Receber</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-[#002333] mb-3">Informações da Conta</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-[#B4BEC9]">Número</label>
                      <p className="text-[#002333] font-medium">{selectedConta.numero}</p>
                    </div>
                    <div>
                      <label className="text-sm text-[#B4BEC9]">Descrição</label>
                      <p className="text-[#002333]">{selectedConta.descricao}</p>
                    </div>
                    <div>
                      <label className="text-sm text-[#B4BEC9]">Categoria</label>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#159A9C] text-white">
                        {selectedConta.categoria}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm text-[#B4BEC9]">Valor Total</label>
                      <p className="text-[#159A9C] font-bold text-xl">{formatCurrency(selectedConta.valor)}</p>
                    </div>
                    {selectedConta.valorPago > 0 && (
                      <div>
                        <label className="text-sm text-[#B4BEC9]">Valor Pago</label>
                        <p className="text-green-600 font-bold text-lg">{formatCurrency(selectedConta.valorPago)}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-[#002333] mb-3">Cliente</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-[#B4BEC9]">Nome</label>
                      <p className="text-[#002333] font-medium">{selectedConta.cliente}</p>
                    </div>
                    <div>
                      <label className="text-sm text-[#B4BEC9]">Empresa</label>
                      <p className="text-[#002333]">{selectedConta.empresa}</p>
                    </div>
                    <div>
                      <label className="text-sm text-[#B4BEC9]">Responsável</label>
                      <p className="text-[#002333]">{selectedConta.responsavel}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-[#002333] mb-3">Datas e Pagamento</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-[#B4BEC9]">Data de Vencimento</label>
                      <p className={`font-medium ${getVencimentoColor(selectedConta.dataVencimento, selectedConta.status)}`}>
                        {new Date(selectedConta.dataVencimento).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {selectedConta.dataPagamento && (
                      <div>
                        <label className="text-sm text-[#B4BEC9]">Data de Pagamento</label>
                        <p className="text-green-600">{new Date(selectedConta.dataPagamento).toLocaleDateString('pt-BR')}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm text-[#B4BEC9]">Forma de Pagamento</label>
                      <p className="text-[#002333]">{selectedConta.formaPagamento}</p>
                    </div>
                    {selectedConta.diasAtraso > 0 && (
                      <div>
                        <label className="text-sm text-[#B4BEC9]">Dias de Atraso</label>
                        <p className="text-red-600 font-bold">{selectedConta.diasAtraso} dias</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-[#002333] mb-3">Status</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-[#B4BEC9]">Status Atual</label>
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedConta.status)}`}>
                          {getStatusIcon(selectedConta.status)}
                          {getStatusLabel(selectedConta.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedConta.observacoes && (
                  <div className="lg:col-span-2">
                    <h4 className="font-semibold text-[#002333] mb-3">Observações</h4>
                    <div className="p-4 bg-[#DEEFE7] rounded-lg">
                      <p className="text-[#002333]">{selectedConta.observacoes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#B4BEC9] text-[#002333] rounded-lg hover:bg-[#DEEFE7] transition-colors"
                >
                  Fechar
                </button>
                {selectedConta.status !== 'paga' && (
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Registrar Pagamento
                  </button>
                )}
                <button className="px-4 py-2 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white rounded-lg hover:shadow-lg transition-all">
                  Editar Conta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContasReceberPage;
