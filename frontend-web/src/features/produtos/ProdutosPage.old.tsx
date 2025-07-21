import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Package,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  Check,
  X,
  DollarSign,
  ShoppingCart
} from 'lucide-react';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
import { ModalCadastroProduto } from '../../components/modals/ModalCadastroProdutoLandscape';
import toast from 'react-hot-toast';

// Interface para o novo modal
interface ProdutoFormData {
  nome: string;
  tipoItem: 'produto' | 'servico' | 'licenca' | 'modulo' | 'plano';
  categoria: string;
  precoUnitario: number;
  frequencia: 'unico' | 'mensal' | 'anual';
  unidadeMedida: 'unidade' | 'saca' | 'hectare' | 'pacote' | 'licenca';
  status: boolean;
  descricao?: string;
  tags?: string[];
  variacoes?: string[];
}

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
    preco: 2500.00,
    custoUnitario: 1200.00,
    estoque: {
      atual: 20,
      minimo: 10,
      maximo: 100
    },
    status: 'ativo',
    vendas: {
      mes: 15,
      total: 145
    },
    fornecedor: 'TechSoft Solutions',
    sku: 'ERP-BAS-001',
    descricao: 'Sistema ERP completo para pequenas e médias empresas',
    criadoEm: '2024-01-15T00:00:00Z',
    atualizadoEm: '2024-12-15T00:00:00Z'
  },
  {
    id: '2',
    nome: 'Consultoria em TI',
    categoria: 'Serviços',
    preco: 5000.00,
    custoUnitario: 3500.00,
    estoque: {
      atual: 0,
      minimo: 0,
      maximo: 0
    },
    status: 'ativo',
    vendas: {
      mes: 8,
      total: 89
    },
    fornecedor: 'Interno',
    sku: 'CONS-TI-001',
    descricao: 'Serviço de consultoria especializada em tecnologia da informação',
    criadoEm: '2024-02-01T00:00:00Z',
    atualizadoEm: '2024-12-08T00:00:00Z'
  },
  {
    id: '3',
    nome: 'Licença CRM Premium',
    categoria: 'Software',
    preco: 800.00,
    custoUnitario: 400.00,
    estoque: {
      atual: 5,
      minimo: 15,
      maximo: 50
    },
    status: 'ativo',
    vendas: {
      mes: 25,
      total: 234
    },
    fornecedor: 'CRM Tech Corp',
    sku: 'CRM-PREM-001',
    descricao: 'Licença premium do sistema CRM com funcionalidades avançadas',
    criadoEm: '2024-03-10T00:00:00Z',
    atualizadoEm: '2024-12-11T00:00:00Z'
  },
  {
    id: '4',
    nome: 'Hardware Server Rack',
    categoria: 'Hardware',
    preco: 15000.00,
    custoUnitario: 11000.00,
    estoque: {
      atual: 3,
      minimo: 2,
      maximo: 10
    },
    status: 'inativo',
    vendas: {
      mes: 2,
      total: 18
    },
    fornecedor: 'ServerMax Hardware',
    sku: 'HW-SERV-001',
    descricao: 'Servidor rack de alta performance para data centers',
    criadoEm: '2024-01-20T00:00:00Z',
    atualizadoEm: '2024-11-30T00:00:00Z'
  },
  {
    id: '5',
    nome: 'Suporte Técnico Premium',
    categoria: 'Serviços',
    preco: 1200.00,
    custoUnitario: 800.00,
    estoque: {
      atual: 0,
      minimo: 0,
      maximo: 0
    },
    status: 'ativo',
    vendas: {
      mes: 12,
      total: 156
    },
    fornecedor: 'Interno',
    sku: 'SUP-PREM-001',
    descricao: 'Suporte técnico premium 24/7 com SLA de 2 horas',
    criadoEm: '2024-04-05T00:00:00Z',
    atualizadoEm: '2024-12-12T00:00:00Z'
  }
];

const statusConfig = {
  ativo: { 
    label: 'Ativo', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Check
  },
  inativo: { 
    label: 'Inativo', 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: X
  },
  descontinuado: { 
    label: 'Descontinuado', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle
  }
};

const ProdutosPage: React.FC = () => {
  // Função para carregar produtos do localStorage
  const carregarProdutosSalvos = (): Produto[] => {
    try {
      const produtosSalvos = localStorage.getItem('fenixcrm_produtos');
      if (produtosSalvos) {
        const produtos = JSON.parse(produtosSalvos);
        // Combinar produtos salvos com produtos mock (sem duplicatas)
        const produtosMockIds = produtosMock.map(p => p.id);
        const produtosFiltrados = produtos.filter((p: Produto) => !produtosMockIds.includes(p.id));
        return [...produtosFiltrados, ...produtosMock];
      }
      return produtosMock;
    } catch (error) {
      console.error('Erro ao carregar produtos do localStorage:', error);
      return produtosMock;
    }
  };

  // Função para salvar produtos no localStorage
  const salvarProdutos = (novosProdutos: Produto[]) => {
    try {
      // Salvar apenas produtos que não são do mock (produtos criados pelo usuário)
      const produtosMockIds = produtosMock.map(p => p.id);
      const produtosUsuario = novosProdutos.filter(p => !produtosMockIds.includes(p.id));
      localStorage.setItem('fenixcrm_produtos', JSON.stringify(produtosUsuario));
    } catch (error) {
      console.error('Erro ao salvar produtos no localStorage:', error);
    }
  };

  const [produtos, setProdutos] = useState<Produto[]>(carregarProdutosSalvos());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para o modal de cadastro
  const [showModalAvancado, setShowModalAvancado] = useState(false);
  const [produtoParaEditar, setProdutoParaEditar] = useState<ProdutoFormData & { produtoId?: string } | null>(null);
  const [isLoadingSave, setIsLoadingSave] = useState(false);
  
  // Estados para confirmação de exclusão
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<Produto | null>(null);

  // Filtrar produtos
  const produtosFiltrados = useMemo(() => {
    return produtos.filter(produto => {
      const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           produto.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           produto.fornecedor.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'todos' || produto.status === statusFilter;
      const matchesCategoria = categoriaFilter === 'todas' || produto.categoria === categoriaFilter;
      
      return matchesSearch && matchesStatus && matchesCategoria;
    });
  }, [produtos, searchTerm, statusFilter, categoriaFilter]);

  // Calcular estatísticas
  const estatisticas = useMemo(() => {
    const totalProdutos = produtos.length;
    const produtosAtivos = produtos.filter(p => p.status === 'ativo').length;
    const vendasMes = produtos.reduce((sum, p) => sum + p.vendas.mes, 0);
    const valorTotal = produtos.reduce((sum, p) => sum + (p.preco * p.vendas.mes), 0);
    const estoquesBaixos = produtos.filter(p => p.estoque.atual <= p.estoque.minimo && p.categoria !== 'Serviços').length;

    return { totalProdutos, produtosAtivos, vendasMes, valorTotal, estoquesBaixos };
  }, [produtos]);

  const categorias = Array.from(new Set(produtos.map(produto => produto.categoria)));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getEstoqueStatus = (produto: Produto) => {
    if (produto.categoria === 'Serviços') return null;
    
    if (produto.estoque.atual <= produto.estoque.minimo) {
      return { label: 'Baixo', color: 'text-red-600', icon: AlertTriangle };
    } else if (produto.estoque.atual >= produto.estoque.maximo * 0.8) {
      return { label: 'Alto', color: 'text-green-600', icon: Check };
    } else {
      return { label: 'Normal', color: 'text-yellow-600', icon: Check };
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
  
  // Funções para o modal de cadastro
  const handleNovoProduto = () => {
    setProdutoParaEditar(null);
    setShowModalAvancado(true);
  };
  
  const handleEditarProduto = (produto: Produto) => {
    // Converter produto existente para formato do novo modal
    setProdutoParaEditar({
      produtoId: produto.id, // Adicionar ID para identificação única
      nome: produto.nome,
      tipoItem: 'produto', // Mapear para as opções do novo modal
      categoria: produto.categoria,
      precoUnitario: produto.preco,
      frequencia: 'unico',
      unidadeMedida: 'unidade',
      status: produto.status === 'ativo',
      descricao: produto.descricao,
      tags: [],
      variacoes: []
    });
    setShowModalAvancado(true);
  };
  
  const handleExcluirProduto = (produto: Produto) => {
    setProdutoParaExcluir(produto);
    setShowConfirmDelete(true);
  };
  
  const confirmarExclusao = () => {
    if (produtoParaExcluir) {
      setProdutos(prevProdutos => {
        const produtosFiltrados = prevProdutos.filter(p => p.id !== produtoParaExcluir.id);
        salvarProdutos(produtosFiltrados);
        return produtosFiltrados;
      });
      toast.success(`Produto "${produtoParaExcluir.nome}" excluído com sucesso!`);
      setShowConfirmDelete(false);
      setProdutoParaExcluir(null);
    }
  };
  
  const cancelarExclusao = () => {
    setShowConfirmDelete(false);
    setProdutoParaExcluir(null);
  };

  // Função para limpar produtos criados pelo usuário (útil para desenvolvimento/testes)
  const limparProdutosUsuario = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os produtos criados por você? Os produtos de exemplo permanecerão.')) {
      localStorage.removeItem('fenixcrm_produtos');
      setProdutos(produtosMock);
      toast.success('Produtos do usuário limpos com sucesso!');
    }
  };
  
  const handleSaveProduto = async (data: ProdutoFormData) => {
    setIsLoadingSave(true);
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Converter formato do novo modal para formato da API existente
      const produtoParaAPI = {
        nome: data.nome,
        categoria: data.categoria,
        preco: data.precoUnitario,
        descricao: data.descricao,
        status: data.status ? 'ativo' : 'inativo'
      };
      
      if (produtoParaEditar && produtoParaEditar.produtoId) {
        // Lógica de atualização aqui
        console.log('Atualizando produto:', produtoParaAPI);
        
        // Atualizar produto existente usando o ID
        setProdutos(prevProdutos => {
          const produtosAtualizados = prevProdutos.map(produto => {
            if (produto.id === produtoParaEditar.produtoId) {
              return {
                ...produto,
                nome: data.nome,
                categoria: data.categoria,
                preco: data.precoUnitario,
                status: data.status ? 'ativo' : 'inativo' as 'ativo' | 'inativo' | 'descontinuado',
                descricao: data.descricao || produto.descricao,
                atualizadoEm: new Date().toISOString()
              };
            }
            return produto;
          });
          salvarProdutos(produtosAtualizados);
          return produtosAtualizados;
        });
        
        toast.success('Produto atualizado com sucesso!');
      } else {
        // Lógica de criação aqui
        console.log('Criando produto:', produtoParaAPI);
        
        // Criar novo produto com dados completos
        const novoProduto: Produto = {
          id: Date.now().toString(), // ID simples para exemplo
          nome: data.nome,
          categoria: data.categoria,
          preco: data.precoUnitario,
          custoUnitario: data.precoUnitario * 0.7, // 70% do preço como custo padrão
          estoque: {
            atual: data.tipoItem === 'produto' ? 10 : 0, // Produtos físicos têm estoque inicial
            minimo: data.tipoItem === 'produto' ? 5 : 0,
            maximo: data.tipoItem === 'produto' ? 100 : 0
          },
          status: data.status ? 'ativo' : 'inativo' as 'ativo' | 'inativo' | 'descontinuado',
          vendas: {
            mes: 0,
            total: 0
          },
          fornecedor: 'Interno',
          sku: `${data.tipoItem.toUpperCase()}-${Date.now()}`,
          descricao: data.descricao || '',
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString()
        };
        
        // Adicionar produto ao estado
        setProdutos(prevProdutos => {
          const novosProdutos = [novoProduto, ...prevProdutos];
          salvarProdutos(novosProdutos);
          return novosProdutos;
        });
        
        toast.success('Produto criado com sucesso!');
      }
      
      setShowModalAvancado(false);
      setProdutoParaEditar(null);
      
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      throw error; // Modal tratará o erro
    } finally {
      setIsLoadingSave(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#DEEFE7]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6">
            <div className="flex-1 min-w-0">
              <BackToNucleus 
                title="Produtos"
                nucleusName="CRM"
                nucleusPath="/nuclei/crm"
              />
              <p className="mt-1 text-sm text-gray-500">
                Gestão completa do catálogo de produtos e serviços
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 flex flex-col sm:flex-row gap-3">
              <button className="inline-flex items-center px-4 py-2 border border-[#159A9C] text-sm font-medium rounded-lg text-[#159A9C] bg-white hover:bg-[#DEEFE7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#159A9C] transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </button>
              
              {/* Botão para limpar dados do usuário (modo desenvolvimento) */}
              {process.env.NODE_ENV === 'development' && (
                <button 
                  onClick={limparProdutosUsuario}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  title="Limpar produtos criados pelo usuário"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Dados
                </button>
              )}
              
              <button 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#159A9C] hover:bg-[#0d7a7d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#159A9C] transition-colors"
                onClick={handleNovoProduto}
              >
                <Plus className="w-4 h-4 mr-2" />
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
                <Package className="w-6 h-6 text-blue-600" />
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
                <Check className="w-6 h-6 text-green-600" />
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
                <ShoppingCart className="w-6 h-6 text-[#159A9C]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita/Mês</p>
                <p className="text-2xl font-bold text-[#002333]">{formatCurrency(estatisticas.valorTotal)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
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
                <AlertTriangle className="w-6 h-6 text-red-600" />
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria}>{categoria}</option>
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
                        <div className="flex items-center space-x-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-[#002333]">{produto.nome}</span>
                              {!produtosMock.find(p => p.id === produto.id) && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                  Novo
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{produto.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#B4BEC9] text-[#002333]">
                          {produto.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-[#002333]">{formatCurrency(produto.preco)}</div>
                          <div className="text-sm text-gray-500">Custo: {formatCurrency(produto.custoUnitario)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {produto.categoria === 'Serviços' ? (
                          <span className="text-sm text-gray-500">N/A</span>
                        ) : (
                          <div>
                            <div className="text-sm font-medium text-[#002333]">{produto.estoque.atual}</div>
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
                          <div className="text-sm font-medium text-[#002333]">{produto.vendas.mes}/mês</div>
                          <div className="text-sm text-gray-500">Total: {produto.vendas.total}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig[produto.status].color}`}>
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
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditarProduto(produto)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleExcluirProduto(produto)}
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

          {produtosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-500">Tente ajustar os filtros ou adicionar um novo produto.</p>
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
                <X className="w-5 h-5" />
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
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig[selectedProduto.status].color}`}>
                    {statusConfig[selectedProduto.status].label}
                  </span>
                </div>
              </div>

              {/* Valores */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-base font-medium text-[#002333] mb-4">Informações Financeiras</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Venda</label>
                    <p className="text-lg font-semibold text-[#002333]">{formatCurrency(selectedProduto.preco)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custo Unitário</label>
                    <p className="text-lg font-semibold text-red-600">{formatCurrency(selectedProduto.custoUnitario)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Margem</label>
                    <p className="text-lg font-semibold text-green-600">
                      {(((selectedProduto.preco - selectedProduto.custoUnitario) / selectedProduto.preco) * 100).toFixed(1)}%
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
                      <p className="text-lg font-semibold text-[#002333]">{selectedProduto.estoque.atual}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mínimo</label>
                      <p className="text-lg font-semibold text-yellow-600">{selectedProduto.estoque.minimo}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Máximo</label>
                      <p className="text-lg font-semibold text-blue-600">{selectedProduto.estoque.maximo}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Vendas */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-base font-medium text-[#002333] mb-4">Performance de Vendas</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendas este Mês</label>
                    <p className="text-lg font-semibold text-[#159A9C]">{selectedProduto.vendas.mes}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total de Vendas</label>
                    <p className="text-lg font-semibold text-[#002333]">{selectedProduto.vendas.total}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Receita este Mês</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Criado em</label>
                    <p className="text-sm text-[#002333]">{formatDate(selectedProduto.criadoEm)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Última atualização</label>
                    <p className="text-sm text-[#002333]">{formatDate(selectedProduto.atualizadoEm)}</p>
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
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-[#159A9C] border border-transparent rounded-lg hover:bg-[#0d7a7d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#159A9C] transition-colors"
              >
                Editar Produto
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Cadastro de Produto - Layout Horizontal */}
      <ModalCadastroProduto
        isOpen={showModalAvancado}
        onClose={() => {
          setShowModalAvancado(false);
          setProdutoParaEditar(null);
        }}
        onSubmit={handleSaveProduto}
        produtoEditando={produtoParaEditar}
        loading={isLoadingSave}
      />

      {/* Modal de Confirmação de Exclusão */}
      {showConfirmDelete && produtoParaExcluir && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={cancelarExclusao}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Excluir Produto
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Tem certeza que deseja excluir o produto <strong>"{produtoParaExcluir.nome}"</strong>? 
                      Esta ação não poderá ser desfeita.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmarExclusao}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  Excluir
                </button>
                <button
                  type="button"
                  onClick={cancelarExclusao}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProdutosPage;
