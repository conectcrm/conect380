import React, { useState, useMemo } from 'react';
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiDownload,
  FiPackage,
  FiBarChart,
  FiTrendingUp,
  FiTrendingDown,
  FiEye,
  FiEdit,
  FiTrash2,
  FiAlertTriangle,
  FiCheck,
  FiX,
  FiDollarSign,
  FiShoppingCart,
} from 'react-icons/fi';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';

interface Produto {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  custoUnitario: number;
  estoque: {
    atual: number;
    minimo: number;
    maximo: number;
  };
  status: 'ativo' | 'inativo' | 'descontinuado';
  vendas: {
    mes: number;
    total: number;
  };
  fornecedor: string;
  sku: string;
  descricao: string;
  criadoEm: string;
  atualizadoEm: string;
}

const produtosMock: Produto[] = [
  {
    id: '1',
    nome: 'Sistema ERP Básico',
    categoria: 'Software',
    preco: 2500.0,
    custoUnitario: 1200.0,
    estoque: {
      atual: 20,
      minimo: 10,
      maximo: 100,
    },
    status: 'ativo',
    vendas: {
      mes: 15,
      total: 145,
    },
    fornecedor: 'TechSoft Solutions',
    sku: 'ERP-BAS-001',
    descricao: 'Sistema ERP completo para pequenas e médias empresas',
    criadoEm: '2024-01-15T00:00:00Z',
    atualizadoEm: '2024-12-15T00:00:00Z',
  },
  {
    id: '2',
    nome: 'Consultoria em TI',
    categoria: 'Serviços',
    preco: 5000.0,
    custoUnitario: 3500.0,
    estoque: {
      atual: 0,
      minimo: 0,
      maximo: 0,
    },
    status: 'ativo',
    vendas: {
      mes: 8,
      total: 89,
    },
    fornecedor: 'Interno',
    sku: 'CONS-TI-001',
    descricao: 'Serviço de consultoria especializada em tecnologia da informação',
    criadoEm: '2024-02-01T00:00:00Z',
    atualizadoEm: '2024-12-08T00:00:00Z',
  },
  {
    id: '3',
    nome: 'Licença CRM Premium',
    categoria: 'Software',
    preco: 800.0,
    custoUnitario: 400.0,
    estoque: {
      atual: 5,
      minimo: 15,
      maximo: 50,
    },
    status: 'ativo',
    vendas: {
      mes: 25,
      total: 234,
    },
    fornecedor: 'CRM Tech Corp',
    sku: 'CRM-PREM-001',
    descricao: 'Licença premium do sistema CRM com funcionalidades avançadas',
    criadoEm: '2024-03-10T00:00:00Z',
    atualizadoEm: '2024-12-11T00:00:00Z',
  },
  {
    id: '4',
    nome: 'Hardware Server Rack',
    categoria: 'Hardware',
    preco: 15000.0,
    custoUnitario: 11000.0,
    estoque: {
      atual: 3,
      minimo: 2,
      maximo: 10,
    },
    status: 'inativo',
    vendas: {
      mes: 2,
      total: 18,
    },
    fornecedor: 'ServerMax Hardware',
    sku: 'HW-SERV-001',
    descricao: 'Servidor rack de alta performance para data centers',
    criadoEm: '2024-01-20T00:00:00Z',
    atualizadoEm: '2024-11-30T00:00:00Z',
  },
  {
    id: '5',
    nome: 'Suporte Técnico Premium',
    categoria: 'Serviços',
    preco: 1200.0,
    custoUnitario: 800.0,
    estoque: {
      atual: 0,
      minimo: 0,
      maximo: 0,
    },
    status: 'ativo',
    vendas: {
      mes: 12,
      total: 156,
    },
    fornecedor: 'Interno',
    sku: 'SUP-PREM-001',
    descricao: 'Suporte técnico premium 24/7 com SLA de 2 horas',
    criadoEm: '2024-04-05T00:00:00Z',
    atualizadoEm: '2024-12-12T00:00:00Z',
  },
];

const statusConfig = {
  ativo: {
    label: 'Ativo',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: FiCheck,
  },
  inativo: {
    label: 'Inativo',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: FiX,
  },
  descontinuado: {
    label: 'Descontinuado',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: FiAlertTriangle,
  },
};

const ProdutosPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtrar produtos
  const produtosFiltrados = useMemo(() => {
    return produtosMock.filter((produto) => {
      const matchesSearch =
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.fornecedor.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'todos' || produto.status === statusFilter;
      const matchesCategoria = categoriaFilter === 'todas' || produto.categoria === categoriaFilter;

      return matchesSearch && matchesStatus && matchesCategoria;
    });
  }, [searchTerm, statusFilter, categoriaFilter]);

  // Calcular estatísticas
  const estatisticas = useMemo(() => {
    const totalProdutos = produtosMock.length;
    const produtosAtivos = produtosMock.filter((p) => p.status === 'ativo').length;
    const vendasMes = produtosMock.reduce((sum, p) => sum + p.vendas.mes, 0);
    const valorTotal = produtosMock.reduce((sum, p) => sum + p.preco * p.vendas.mes, 0);
    const estoquesBaixos = produtosMock.filter(
      (p) => p.estoque.atual <= p.estoque.minimo && p.categoria !== 'Serviços',
    ).length;

    return { totalProdutos, produtosAtivos, vendasMes, valorTotal, estoquesBaixos };
  }, []);

  const categorias = [...new Set(produtosMock.map((produto) => produto.categoria))];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getEstoqueStatus = (produto: Produto) => {
    if (produto.categoria === 'Serviços') return null;

    if (produto.estoque.atual <= produto.estoque.minimo) {
      return { label: 'Baixo', color: 'text-red-600', icon: FiAlertTriangle };
    } else if (produto.estoque.atual >= produto.estoque.maximo * 0.8) {
      return { label: 'Alto', color: 'text-green-600', icon: FiCheck };
    } else {
      return { label: 'Normal', color: 'text-yellow-600', icon: FiCheck };
    }
  };

  const openModal = (produto: Produto) => {
    setSelectedProduto(produto);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProduto(null);
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#DEEFE7]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6">
            <div className="flex-1 min-w-0">
              <BackToNucleus title="Produtos" nucleusName="CRM" nucleusPath="/nuclei/crm" />
              <p className="mt-1 text-sm text-gray-500">
                Gestão completa do catálogo de produtos e serviços
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 flex flex-col sm:flex-row gap-3">
              <button className="inline-flex items-center px-4 py-2 border border-[#159A9C] text-sm font-medium rounded-lg text-[#159A9C] bg-white hover:bg-[#DEEFE7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#159A9C] transition-colors">
                {/* @ts-ignore */}
                <FiDownload className="w-4 h-4 mr-2" />
                Exportar
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#159A9C] hover:bg-[#0d7a7d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#159A9C] transition-colors">
                {/* @ts-ignore */}
                <FiPlus className="w-4 h-4 mr-2" />
                Novo Produto
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Produtos</p>
                <p className="text-2xl font-bold text-[#002333]">{estatisticas.totalProdutos}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiPackage className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{estatisticas.produtosAtivos}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vendas/Mês</p>
                <p className="text-2xl font-bold text-[#159A9C]">{estatisticas.vendasMes}</p>
              </div>
              <div className="w-12 h-12 bg-[#DEEFE7] rounded-lg flex items-center justify-center">
                <FiShoppingCart className="w-6 h-6 text-[#159A9C]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita/Mês</p>
                <p className="text-2xl font-bold text-[#002333]">
                  {formatCurrency(estatisticas.valorTotal)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiDollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
                <p className="text-2xl font-bold text-red-600">{estatisticas.estoquesBaixos}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <FiAlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Pesquisa */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pesquisa */}
            <div className="lg:col-span-2">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, SKU ou fornecedor..."
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
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="descontinuado">Descontinuado</option>
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
                {categorias.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de Produtos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendas
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
                {produtosFiltrados.map((produto) => {
                  const StatusIcon = statusConfig[produto.status].icon;
                  const estoqueStatus = getEstoqueStatus(produto);

                  return (
                    <tr key={produto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-[#002333]">{produto.nome}</div>
                          <div className="text-sm text-gray-500">{produto.sku}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#B4BEC9] text-[#002333]">
                          {produto.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-[#002333]">
                            {formatCurrency(produto.preco)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Custo: {formatCurrency(produto.custoUnitario)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {produto.categoria === 'Serviços' ? (
                          <span className="text-sm text-gray-500">N/A</span>
                        ) : (
                          <div>
                            <div className="text-sm font-medium text-[#002333]">
                              {produto.estoque.atual}
                            </div>
                            {estoqueStatus && (
                              <div className={`text-xs flex items-center ${estoqueStatus.color}`}>
                                <estoqueStatus.icon className="w-3 h-3 mr-1" />
                                {estoqueStatus.label}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-[#002333]">
                            {produto.vendas.mes}/mês
                          </div>
                          <div className="text-sm text-gray-500">Total: {produto.vendas.total}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig[produto.status].color}`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[produto.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openModal(produto)}
                            className="text-[#159A9C] hover:text-[#0d7a7d] p-1 rounded-lg hover:bg-[#DEEFE7] transition-colors"
                            title="Visualizar"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            className="text-blue-600 hover:text-blue-800 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Editar"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50 transition-colors"
                            title="Excluir"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {produtosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiPackage className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-500">
                Tente ajustar os filtros ou adicionar um novo produto.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {isModalOpen && selectedProduto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#002333]">Detalhes do Produto</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Informações Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <p className="text-sm text-[#002333] font-medium">{selectedProduto.nome}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <p className="text-sm text-[#002333]">{selectedProduto.sku}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <p className="text-sm text-[#002333]">{selectedProduto.descricao}</p>
              </div>

              {/* Categoria e Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#B4BEC9] text-[#002333]">
                    {selectedProduto.categoria}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig[selectedProduto.status].color}`}
                  >
                    {statusConfig[selectedProduto.status].label}
                  </span>
                </div>
              </div>

              {/* Valores */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-base font-medium text-[#002333] mb-4">
                  Informações Financeiras
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço de Venda
                    </label>
                    <p className="text-lg font-semibold text-[#002333]">
                      {formatCurrency(selectedProduto.preco)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custo Unitário
                    </label>
                    <p className="text-lg font-semibold text-red-600">
                      {formatCurrency(selectedProduto.custoUnitario)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Margem</label>
                    <p className="text-lg font-semibold text-green-600">
                      {(
                        ((selectedProduto.preco - selectedProduto.custoUnitario) /
                          selectedProduto.preco) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                </div>
              </div>

              {/* Estoque */}
              {selectedProduto.categoria !== 'Serviços' && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-base font-medium text-[#002333] mb-4">Controle de Estoque</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Atual</label>
                      <p className="text-lg font-semibold text-[#002333]">
                        {selectedProduto.estoque.atual}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mínimo</label>
                      <p className="text-lg font-semibold text-yellow-600">
                        {selectedProduto.estoque.minimo}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Máximo</label>
                      <p className="text-lg font-semibold text-blue-600">
                        {selectedProduto.estoque.maximo}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Vendas */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-base font-medium text-[#002333] mb-4">Performance de Vendas</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vendas este Mês
                    </label>
                    <p className="text-lg font-semibold text-[#159A9C]">
                      {selectedProduto.vendas.mes}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total de Vendas
                    </label>
                    <p className="text-lg font-semibold text-[#002333]">
                      {selectedProduto.vendas.total}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Receita este Mês
                    </label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(selectedProduto.preco * selectedProduto.vendas.mes)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fornecedor */}
              <div className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                <p className="text-sm text-[#002333]">{selectedProduto.fornecedor}</p>
              </div>

              {/* Datas */}
              <div className="border-t border-gray-200 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Criado em
                    </label>
                    <p className="text-sm text-[#002333]">{formatDate(selectedProduto.criadoEm)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Última atualização
                    </label>
                    <p className="text-sm text-[#002333]">
                      {formatDate(selectedProduto.atualizadoEm)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#159A9C] transition-colors"
              >
                Fechar
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-[#159A9C] border border-transparent rounded-lg hover:bg-[#0d7a7d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#159A9C] transition-colors">
                Editar Produto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProdutosPage;
