import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  CreditCard,
  Calendar,
  User,
  Eye,
  Edit,
  Trash2,
  Check,
  Clock,
  AlertTriangle,
  X
} from 'lucide-react';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';

interface ContaPagar {
  id: string;
  numero: string;
  fornecedor: string;
  cnpjCpf: string;
  descricao: string;
  dataVencimento: string;
  dataEmissao: string;
  valor: number;
  valorPago: number;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  categoria: string;
  formaPagamento?: string;
  dataPagamento?: string;
  observacoes?: string;
  anexos?: string[];
}

const contasPagar: ContaPagar[] = [
  {
    id: '1',
    numero: 'CP-2024-001',
    fornecedor: 'Tech Solutions Ltda',
    cnpjCpf: '12.345.678/0001-90',
    descricao: 'Licenças de software - Microsoft Office',
    dataVencimento: '2024-01-15',
    dataEmissao: '2024-01-01',
    valor: 2500.00,
    valorPago: 2500.00,
    status: 'pago',
    categoria: 'Software',
    formaPagamento: 'Transferência Bancária',
    dataPagamento: '2024-01-14'
  },
  {
    id: '2',
    numero: 'CP-2024-002',
    fornecedor: 'Material Office Suprimentos',
    cnpjCpf: '98.765.432/0001-10',
    descricao: 'Material de escritório e suprimentos',
    dataVencimento: '2024-01-20',
    dataEmissao: '2024-01-05',
    valor: 850.75,
    valorPago: 0,
    status: 'pendente',
    categoria: 'Materiais'
  },
  {
    id: '3',
    numero: 'CP-2024-003',
    fornecedor: 'Energia Elétrica S.A.',
    cnpjCpf: '11.222.333/0001-44',
    descricao: 'Conta de energia elétrica - Dezembro/2023',
    dataVencimento: '2024-01-10',
    dataEmissao: '2023-12-28',
    valor: 1200.30,
    valorPago: 0,
    status: 'vencido',
    categoria: 'Utilidades'
  },
  {
    id: '4',
    numero: 'CP-2024-004',
    fornecedor: 'WebHost Pro',
    cnpjCpf: '55.666.777/0001-88',
    descricao: 'Hospedagem e domínio - Plano anual',
    dataVencimento: '2024-01-25',
    dataEmissao: '2024-01-10',
    valor: 1800.00,
    valorPago: 0,
    status: 'pendente',
    categoria: 'Tecnologia'
  },
  {
    id: '5',
    numero: 'CP-2024-005',
    fornecedor: 'Consultoria Jurídica Lima & Associados',
    cnpjCpf: '44.555.666/0001-22',
    descricao: 'Honorários advocatícios - Janeiro/2024',
    dataVencimento: '2024-01-30',
    dataEmissao: '2024-01-15',
    valor: 3500.00,
    valorPago: 0,
    status: 'pendente',
    categoria: 'Serviços Profissionais'
  }
];

const statusConfig = {
  pendente: { 
    label: 'Pendente', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock
  },
  pago: { 
    label: 'Pago', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Check
  },
  vencido: { 
    label: 'Vencido', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle
  },
  cancelado: { 
    label: 'Cancelado', 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: X
  }
};

const ContasPagarPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');
  const [vencimentoFilter, setVencimentoFilter] = useState<string>('todos');
  const [selectedConta, setSelectedConta] = useState<ContaPagar | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtrar contas
  const contasFiltradas = useMemo(() => {
    return contasPagar.filter(conta => {
      const matchesSearch = conta.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           conta.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           conta.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'todos' || conta.status === statusFilter;
      const matchesCategoria = categoriaFilter === 'todas' || conta.categoria === categoriaFilter;
      
      let matchesVencimento = true;
      if (vencimentoFilter === 'vencidas') {
        const hoje = new Date();
        const vencimento = new Date(conta.dataVencimento);
        matchesVencimento = vencimento < hoje && conta.status !== 'pago';
      } else if (vencimentoFilter === 'vencendo') {
        const hoje = new Date();
        const proximaSemana = new Date();
        proximaSemana.setDate(hoje.getDate() + 7);
        const vencimento = new Date(conta.dataVencimento);
        matchesVencimento = vencimento >= hoje && vencimento <= proximaSemana && conta.status !== 'pago';
      }
      
      return matchesSearch && matchesStatus && matchesCategoria && matchesVencimento;
    });
  }, [searchTerm, statusFilter, categoriaFilter, vencimentoFilter]);

  // Calcular estatísticas
  const estatisticas = useMemo(() => {
    const total = contasPagar.reduce((sum, conta) => sum + conta.valor, 0);
    const pago = contasPagar
      .filter(conta => conta.status === 'pago')
      .reduce((sum, conta) => sum + conta.valorPago, 0);
    const pendente = contasPagar
      .filter(conta => conta.status === 'pendente')
      .reduce((sum, conta) => sum + conta.valor, 0);
    const vencido = contasPagar
      .filter(conta => conta.status === 'vencido')
      .reduce((sum, conta) => sum + conta.valor, 0);

    return { total, pago, pendente, vencido };
  }, []);

  const categorias = Array.from(new Set(contasPagar.map(conta => conta.categoria)));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const openModal = (conta: ContaPagar) => {
    setSelectedConta(conta);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedConta(null);
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#DEEFE7]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6">
            <div className="flex-1 min-w-0">
              <BackToNucleus 
                title="Contas a Pagar"
                nucleusName="Financeiro"
                nucleusPath="/nuclei/financeiro"
              />
              <p className="mt-1 text-sm text-gray-500">
                Controle e gestão de todas as contas a pagar da empresa
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 flex flex-col sm:flex-row gap-3">
              <button className="inline-flex items-center px-4 py-2 border border-[#159A9C] text-sm font-medium rounded-lg text-[#159A9C] bg-white hover:bg-[#DEEFE7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#159A9C] transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#159A9C] hover:bg-[#0d7a7d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#159A9C] transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Nova Conta
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total a Pagar</p>
                <p className="text-2xl font-bold text-[#002333]">{formatCurrency(estatisticas.total)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pago</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(estatisticas.pago)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendente</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(estatisticas.pendente)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vencido</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(estatisticas.vencido)}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Pesquisa */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Pesquisa */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Pesquisar por fornecedor, número ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro Status */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
              >
                <option value="todos">Todos os Status</option>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="vencido">Vencido</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {/* Filtro Categoria */}
            <div>
              <select
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
              >
                <option value="todas">Todas as Categorias</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>
            </div>

            {/* Filtro Vencimento */}
            <div>
              <select
                value={vencimentoFilter}
                onChange={(e) => setVencimentoFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
              >
                <option value="todos">Todos os Vencimentos</option>
                <option value="vencidas">Vencidas</option>
                <option value="vencendo">Vencendo (7 dias)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de Contas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fornecedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contasFiltradas.map((conta) => {
                  const StatusIcon = statusConfig[conta.status].icon;
                  return (
                    <tr key={conta.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-[#002333]">{conta.numero}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{conta.descricao}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-[#002333]">{conta.fornecedor}</div>
                          <div className="text-sm text-gray-500">{conta.cnpjCpf}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#B4BEC9] text-[#002333]">
                          {conta.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#002333]">
                        {formatDate(conta.dataVencimento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#002333]">
                        {formatCurrency(conta.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig[conta.status].color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[conta.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openModal(conta)}
                            className="text-[#159A9C] hover:text-[#0d7a7d] p-1 rounded-lg hover:bg-[#DEEFE7] transition-colors"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="text-blue-600 hover:text-blue-800 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50 transition-colors"
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

          {contasFiltradas.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma conta encontrada</h3>
              <p className="text-gray-500">Tente ajustar os filtros ou adicionar uma nova conta a pagar.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {isModalOpen && selectedConta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#002333]">Detalhes da Conta</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Informações Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                  <p className="text-sm text-[#002333] font-medium">{selectedConta.numero}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig[selectedConta.status].color}`}>
                    {statusConfig[selectedConta.status].label}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <p className="text-sm text-[#002333]">{selectedConta.descricao}</p>
              </div>

              {/* Fornecedor */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-base font-medium text-[#002333] mb-4">Fornecedor</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <p className="text-sm text-[#002333]">{selectedConta.fornecedor}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ/CPF</label>
                    <p className="text-sm text-[#002333]">{selectedConta.cnpjCpf}</p>
                  </div>
                </div>
              </div>

              {/* Valores e Datas */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-base font-medium text-[#002333] mb-4">Informações Financeiras</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                    <p className="text-lg font-semibold text-[#002333]">{formatCurrency(selectedConta.valor)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor Pago</label>
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(selectedConta.valorPago)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Emissão</label>
                    <p className="text-sm text-[#002333]">{formatDate(selectedConta.dataEmissao)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</label>
                    <p className="text-sm text-[#002333]">{formatDate(selectedConta.dataVencimento)}</p>
                  </div>
                  {selectedConta.dataPagamento && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data do Pagamento</label>
                        <p className="text-sm text-[#002333]">{formatDate(selectedConta.dataPagamento)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                        <p className="text-sm text-[#002333]">{selectedConta.formaPagamento}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Categoria */}
              <div className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#B4BEC9] text-[#002333]">
                  {selectedConta.categoria}
                </span>
              </div>

              {/* Observações */}
              {selectedConta.observacoes && (
                <div className="border-t border-gray-200 pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <p className="text-sm text-[#002333]">{selectedConta.observacoes}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#159A9C] transition-colors"
              >
                Fechar
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-[#159A9C] border border-transparent rounded-lg hover:bg-[#0d7a7d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#159A9C] transition-colors"
              >
                Editar Conta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContasPagarPage;
