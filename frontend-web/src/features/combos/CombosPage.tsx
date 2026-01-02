import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Package,
  BarChart3,
  TrendingUp,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Copy,
  Play,
  Pause,
  ArrowLeft,
  Layers,
  Tag,
  Calendar,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
import { combosService, Combo, ComboEstatisticas } from '../../services/combosService';

const statusConfig = {
  ativo: {
    label: 'Ativo',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Check,
  },
  inativo: {
    label: 'Inativo',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Pause,
  },
  rascunho: {
    label: 'Rascunho',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Edit,
  },
};

const CombosPage: React.FC = () => {
  const navigate = useNavigate();

  // Estados principais
  const [combos, setCombos] = useState<Combo[]>([]);
  const [estatisticas, setEstatisticas] = useState<ComboEstatisticas>({
    totalCombos: 0,
    combosAtivos: 0,
    vendasMes: 0,
    faturamentoMes: 0,
    combosPopulares: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Carregar dados
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      const [combosData, estatisticasData] = await Promise.all([
        combosService.listarCombos(),
        combosService.obterEstatisticas(),
      ]);
      setCombos(combosData);
      setEstatisticas(estatisticasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar combos');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtros
  const combosFiltrados = useMemo(() => {
    return combos.filter((combo) => {
      const matchesSearch =
        searchTerm === '' ||
        combo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        combo.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        combo.categoria.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'todos' || combo.status === statusFilter;
      const matchesCategoria = categoriaFilter === 'todas' || combo.categoria === categoriaFilter;

      return matchesSearch && matchesStatus && matchesCategoria;
    });
  }, [combos, searchTerm, statusFilter, categoriaFilter]);

  const categorias = Array.from(new Set(combos.map((combo) => combo.categoria)));

  // Formatação
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: Date) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Ações
  const handleDuplicarCombo = async (combo: Combo) => {
    try {
      const comboDuplicado = await combosService.duplicarCombo(combo.id);
      setCombos((prev) => [...prev, comboDuplicado]);
      toast.success(`Combo "${combo.nome}" duplicado com sucesso!`);
    } catch (error) {
      toast.error('Erro ao duplicar combo');
    }
  };

  const handleAlterarStatus = async (combo: Combo) => {
    try {
      const novoStatus = combo.status === 'ativo' ? 'inativo' : 'ativo';
      const comboAtualizado = await combosService.alterarStatusCombo(combo.id, novoStatus);

      setCombos((prev) => prev.map((c) => (c.id === combo.id ? comboAtualizado : c)));

      toast.success(`Combo ${novoStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error) {
      toast.error('Erro ao alterar status do combo');
    }
  };

  const handleExcluirCombo = async () => {
    if (!selectedCombo) return;

    try {
      await combosService.excluirCombo(selectedCombo.id);
      setCombos((prev) => prev.filter((c) => c.id !== selectedCombo.id));
      toast.success('Combo excluído com sucesso!');
      setShowDeleteModal(false);
      setSelectedCombo(null);
    } catch (error) {
      toast.error('Erro ao excluir combo');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#DEEFE7] flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#159A9C] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando combos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#DEEFE7]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-[#DEEFE7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackToNucleus
                nucleusName="Produtos"
                nucleusPath="/nuclei/produtos"
                currentModuleName="Combos de Produtos"
              />
              <div>
                <p className="text-[#B4BEC9]">Gerencie pacotes e ofertas especiais</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/combos/novo')}
              className="bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Novo Combo</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Layers className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Combos</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.totalCombos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Combos Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.combosAtivos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-[#DEEFE7] rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[#159A9C]" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vendas/Mês</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.vendasMes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Faturamento/Mês</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(estatisticas.faturamentoMes)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por nome, descrição ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
              >
                <option value="todos">Todos os Status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="rascunho">Rascunho</option>
              </select>
            </div>

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

        {/* Lista de Combos */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Combo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preços
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produtos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {combosFiltrados.map((combo) => {
                  const StatusIcon = statusConfig[combo.status].icon;

                  return (
                    <tr key={combo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{combo.nome}</div>
                          <div className="text-sm text-gray-500">{combo.descricao}</div>
                          {combo.tags && combo.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {combo.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                              {combo.tags.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  +{combo.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {combo.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-500 line-through">
                            {formatCurrency(combo.precoOriginal)}
                          </div>
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(combo.precoCombo)}
                          </div>
                          <div className="text-xs text-green-500">
                            {combo.desconto.toFixed(1)}% off
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {combo.produtos.length} produtos
                        </div>
                        <div className="text-xs text-gray-500">
                          {combo.produtos
                            .slice(0, 2)
                            .map((p) => p.produto.nome)
                            .join(', ')}
                          {combo.produtos.length > 2 && '...'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig[combo.status].color}`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[combo.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(combo.dataCreacao)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/combos/${combo.id}`)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/combos/${combo.id}/editar`)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicarCombo(combo)}
                            className="text-green-600 hover:text-green-800 p-1 rounded-lg hover:bg-green-50 transition-colors"
                            title="Duplicar"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAlterarStatus(combo)}
                            className={`p-1 rounded-lg transition-colors ${
                              combo.status === 'ativo'
                                ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                            }`}
                            title={combo.status === 'ativo' ? 'Desativar' : 'Ativar'}
                          >
                            {combo.status === 'ativo' ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCombo(combo);
                              setShowDeleteModal(true);
                            }}
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

            {combosFiltrados.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Layers className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum combo encontrado</h3>
                <p className="text-gray-500">Tente ajustar os filtros ou criar um novo combo.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && selectedCombo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 ml-3">Confirmar Exclusão</h3>
            </div>

            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o combo "{selectedCombo.nome}"? Esta ação não pode ser
              desfeita.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedCombo(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluirCombo}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CombosPage;
