import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Tag,
  Settings,
  Layers,
} from 'lucide-react';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
import ModalCategoria from '../../components/modals/ModalCategoria';
import ModalSubcategoria from '../../components/modals/ModalSubcategoria';
import ModalConfiguracao from '../../components/modais/ModalConfiguracao';
import { categoriasProdutosService } from '../../services/categoriasProdutosService';
import toast from 'react-hot-toast';

// Interfaces
interface Categoria {
  id: string;
  nome: string;
  descricao: string;
  cor: string;
  ativa: boolean;
  subcategorias: Subcategoria[];
}

interface Subcategoria {
  id: string;
  nome: string;
  descricao: string;
  categoriaId: string;
  ativa: boolean;
  configuracoes: Configuracao[];
}

interface Configuracao {
  id: string;
  nome: string;
  descricao: string;
  subcategoriaId: string;
  precoBase: number;
  multiplicador: number;
  ativa: boolean;
}

const CATEGORY_COLOR_CLASS_MAP: Record<string, { border: string; dot: string }> = {
  blue: { border: 'border-blue-500', dot: 'bg-blue-500' },
  green: { border: 'border-green-500', dot: 'bg-green-500' },
  purple: { border: 'border-purple-500', dot: 'bg-purple-500' },
  orange: { border: 'border-orange-500', dot: 'bg-orange-500' },
  red: { border: 'border-red-500', dot: 'bg-red-500' },
  yellow: { border: 'border-yellow-500', dot: 'bg-yellow-500' },
};

const CategoriasProdutosPage: React.FC = () => {
  // Estados
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'categorias' | 'subcategorias' | 'configuracoes'>(
    'categorias',
  );
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [selectedSubcategoria, setSelectedSubcategoria] = useState<Subcategoria | null>(null);

  // Estados do modal
  const [showModalCategoria, setShowModalCategoria] = useState(false);
  const [showModalSubcategoria, setShowModalSubcategoria] = useState(false);
  const [showModalConfiguracao, setShowModalConfiguracao] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Carregar categorias do service
  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    try {
      setLoading(true);
      const categoriasData = await categoriasProdutosService.listarCategorias();
      const categoriaSelecionadaId = selectedCategoria?.id;
      const subcategoriaSelecionadaId = selectedSubcategoria?.id;

      // Converter para formato da interface local
      const categoriasConvertidas: Categoria[] = categoriasData.map((cat) => ({
        id: cat.id,
        nome: cat.nome,
        descricao: cat.descricao,
        cor: cat.cor || 'blue',
        ativa: cat.ativo,
        subcategorias: cat.subcategorias
          ? cat.subcategorias.map((sub) => ({
              id: sub.id,
              nome: sub.nome,
              descricao: sub.descricao || '',
              categoriaId: cat.id,
              ativa: sub.ativo,
              configuracoes: sub.configuracoes
                ? sub.configuracoes.map((conf) => ({
                    id: conf.id,
                    nome: conf.nome,
                    descricao: conf.descricao || '',
                    subcategoriaId: sub.id,
                    precoBase: sub.precoBase || 0,
                    multiplicador: conf.multiplicador || 1,
                    ativa: conf.ativo,
                  }))
                : [],
            }))
          : [],
      }));

      setCategorias(categoriasConvertidas);

      if (categoriaSelecionadaId) {
        const categoriaAtualizada = categoriasConvertidas.find(
          (categoria) => categoria.id === categoriaSelecionadaId,
        );
        setSelectedCategoria(categoriaAtualizada || null);

        if (categoriaAtualizada && subcategoriaSelecionadaId) {
          const subcategoriaAtualizada = categoriaAtualizada.subcategorias.find(
            (subcategoria) => subcategoria.id === subcategoriaSelecionadaId,
          );
          setSelectedSubcategoria(subcategoriaAtualizada || null);
        } else if (!categoriaAtualizada) {
          setSelectedSubcategoria(null);
        }
      }

      // Se não há categorias, adicionar algumas padrão
      if (categoriasConvertidas.length === 0) {
        await criarCategoriasIniciais();
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const criarCategoriasIniciais = async () => {
    try {
      const categoriasIniciais = [
        { nome: 'Software', descricao: 'Produtos de software', icone: '💻', cor: 'blue' },
        { nome: 'Hardware', descricao: 'Equipamentos e hardware', icone: '🖥️', cor: 'green' },
        { nome: 'Consultoria', descricao: 'Serviços de consultoria', icone: '🎯', cor: 'purple' },
        { nome: 'Treinamento', descricao: 'Cursos e treinamentos', icone: '📚', cor: 'orange' },
      ];

      for (const categoria of categoriasIniciais) {
        await categoriasProdutosService.criarCategoria(categoria);
      }

      toast.success('Categorias iniciais criadas!');
      await carregarCategorias();
    } catch (error) {
      console.error('Erro ao criar categorias iniciais:', error);
    }
  };

  // Formatação de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getCategoryColorClasses = (cor?: string) => {
    if (!cor) {
      return CATEGORY_COLOR_CLASS_MAP.blue;
    }

    return CATEGORY_COLOR_CLASS_MAP[cor] || CATEGORY_COLOR_CLASS_MAP.blue;
  };

  // Funções de manipulação
  const handleNovaCategoria = () => {
    setEditingItem(null);
    setShowModalCategoria(true);
  };

  const handleEditarCategoria = (categoria: Categoria) => {
    setEditingItem(categoria);
    setShowModalCategoria(true);
  };

  const handleNovaSubcategoria = () => {
    if (!selectedCategoria) {
      toast.error('Selecione uma categoria primeiro');
      return;
    }
    setEditingItem(null);
    setShowModalSubcategoria(true);
  };

  const handleEditarSubcategoria = (subcategoria: Subcategoria) => {
    setEditingItem(subcategoria);
    setShowModalSubcategoria(true);
  };

  const handleNovaConfiguracao = () => {
    if (!selectedSubcategoria) {
      toast.error('Selecione uma subcategoria primeiro');
      return;
    }
    setEditingItem(null);
    setShowModalConfiguracao(true);
  };

  const handleEditarConfiguracao = (configuracao: Configuracao) => {
    setEditingItem(configuracao);
    setShowModalConfiguracao(true);
  };

  const handleExcluirCategoria = async (categoria: Categoria) => {
    const confirmado = window.confirm(
      `Excluir a categoria "${categoria.nome}"? Todas as subcategorias e configurações vinculadas também serão removidas.`,
    );

    if (!confirmado) {
      return;
    }

    try {
      await categoriasProdutosService.excluirCategoria(categoria.id);

      if (selectedCategoria?.id === categoria.id) {
        setSelectedCategoria(null);
        setSelectedSubcategoria(null);
      }

      toast.success('Categoria excluída com sucesso!');
      await carregarCategorias();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast.error('Erro ao excluir categoria');
    }
  };

  const handleExcluirSubcategoria = async (subcategoria: Subcategoria) => {
    const confirmado = window.confirm(`Excluir a subcategoria "${subcategoria.nome}"?`);

    if (!confirmado) {
      return;
    }

    try {
      await categoriasProdutosService.excluirSubcategoria(subcategoria.id);

      if (selectedSubcategoria?.id === subcategoria.id) {
        setSelectedSubcategoria(null);
      }

      toast.success('Subcategoria excluída com sucesso!');
      await carregarCategorias();
    } catch (error) {
      console.error('Erro ao excluir subcategoria:', error);
      toast.error('Erro ao excluir subcategoria');
    }
  };

  const handleExcluirConfiguracao = async (configuracao: Configuracao) => {
    const confirmado = window.confirm(`Excluir a configuração "${configuracao.nome}"?`);

    if (!confirmado) {
      return;
    }

    try {
      await categoriasProdutosService.excluirConfiguracao(configuracao.id);
      toast.success('Configuração excluída com sucesso!');
      await carregarCategorias();
    } catch (error) {
      console.error('Erro ao excluir configuração:', error);
      toast.error('Erro ao excluir configuração');
    }
  };

  // Funções de salvar
  const handleSalvarCategoria = async (categoriaData: any) => {
    try {
      if (editingItem) {
        await categoriasProdutosService.atualizarCategoria({
          id: editingItem.id,
          nome: categoriaData.nome,
          descricao: categoriaData.descricao,
          icone: categoriaData.icone,
          cor: categoriaData.cor,
          ativo: categoriaData.ativa,
        });
        toast.success('Categoria atualizada com sucesso!');
      } else {
        await categoriasProdutosService.criarCategoria({
          nome: categoriaData.nome,
          descricao: categoriaData.descricao,
          icone: categoriaData.icone || '📁',
          cor: categoriaData.cor || 'blue',
          ativo: categoriaData.ativa,
        });
        toast.success('Categoria criada com sucesso!');
      }

      await carregarCategorias();
      setShowModalCategoria(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleSalvarSubcategoria = async (subcategoriaData: any) => {
    try {
      const categoriaId = subcategoriaData.categoriaId || subcategoriaData.categoria_id;
      const payload = {
        categoria_id: categoriaId,
        nome: subcategoriaData.nome,
        descricao: subcategoriaData.descricao,
        precoBase: Number(subcategoriaData.precoBase || 0),
        unidade: subcategoriaData.unidade || 'unidade',
        camposPersonalizados: subcategoriaData.camposPersonalizados,
        ativo: subcategoriaData.ativa ?? subcategoriaData.ativo,
      };

      if (editingItem) {
        await categoriasProdutosService.atualizarSubcategoria({
          id: editingItem.id,
          ...payload,
        });
        toast.success('Subcategoria atualizada com sucesso!');
      } else {
        await categoriasProdutosService.criarSubcategoria(payload);
        toast.success('Subcategoria criada com sucesso!');
      }

      await carregarCategorias();
      setShowModalSubcategoria(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao salvar subcategoria:', error);
      toast.error('Erro ao salvar subcategoria');
    }
  };

  const handleSalvarConfiguracao = async (configuracaoData: any) => {
    try {
      const subcategoriaId = configuracaoData.subcategoriaId || configuracaoData.subcategoria_id;
      const payload = {
        subcategoria_id: subcategoriaId,
        nome: configuracaoData.nome,
        descricao: configuracaoData.descricao,
        multiplicador: Number(configuracaoData.multiplicador || 1),
        ativo: configuracaoData.ativa ?? configuracaoData.ativo,
      };

      if (editingItem) {
        await categoriasProdutosService.atualizarConfiguracao({
          id: editingItem.id,
          ...payload,
        });
        toast.success('Configuração atualizada com sucesso!');
      } else {
        await categoriasProdutosService.criarConfiguracao(payload);
        toast.success('Configuração criada com sucesso!');
      }

      await carregarCategorias();
      setShowModalConfiguracao(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    }
  };

  // Renderização do conteúdo por aba
  const renderCategorias = () => (
    <div className="space-y-4">
      {categorias
        .filter((cat) => cat.nome.toLowerCase().includes(searchTerm.toLowerCase()))
        .map((categoria) => (
          <div
            key={categoria.id}
            className={`bg-white rounded-lg p-6 border-l-4 ${getCategoryColorClasses(categoria.cor).border} shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
              selectedCategoria?.id === categoria.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => {
              setSelectedCategoria(categoria);
              setSelectedSubcategoria(null);
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-4 h-4 rounded-full ${getCategoryColorClasses(categoria.cor).dot}`}></div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{categoria.nome}</h3>
                  <p className="text-gray-600">{categoria.descricao}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm">
                    <span className="text-gray-500">
                      {categoria.subcategorias.length} subcategorias
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        categoria.ativa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {categoria.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditarCategoria(categoria);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExcluirCategoria(categoria);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
    </div>
  );

  const renderSubcategorias = () => {
    if (!selectedCategoria) {
      return (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma categoria</h3>
          <p className="text-gray-500">
            Escolha uma categoria na aba anterior para ver suas subcategorias
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${getCategoryColorClasses(selectedCategoria.cor).dot}`}
            ></div>
            <span className="font-medium text-blue-900">
              Subcategorias de: {selectedCategoria.nome}
            </span>
          </div>
        </div>

        {selectedCategoria.subcategorias
          .filter((sub) => sub.nome.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((subcategoria) => (
            <div
              key={subcategoria.id}
              className={`bg-white rounded-lg p-4 border shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                selectedSubcategoria?.id === subcategoria.id ? 'ring-2 ring-green-500' : ''
              }`}
              onClick={() => setSelectedSubcategoria(subcategoria)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-md font-semibold text-gray-900">{subcategoria.nome}</h4>
                  <p className="text-gray-600 text-sm">{subcategoria.descricao}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm">
                    <span className="text-gray-500">
                      {subcategoria.configuracoes.length} configurações
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        subcategoria.ativa
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {subcategoria.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditarSubcategoria(subcategoria);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExcluirSubcategoria(subcategoria);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    );
  };

  const renderConfiguracoes = () => {
    if (!selectedSubcategoria) {
      return (
        <div className="text-center py-12">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma subcategoria</h3>
          <p className="text-gray-500">Escolha uma subcategoria para ver suas configurações</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-green-50 p-4 rounded-lg mb-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-green-700" />
            <span className="font-medium text-green-900">
              Configurações de: {selectedSubcategoria.nome}
            </span>
          </div>
        </div>

        {selectedSubcategoria.configuracoes
          .filter((conf) => conf.nome.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((configuracao) => (
            <div key={configuracao.id} className="bg-white rounded-lg p-4 border shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h5 className="text-md font-semibold text-gray-900">{configuracao.nome}</h5>
                  <p className="text-gray-600 text-sm">{configuracao.descricao}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm">
                    <span className="text-gray-700">
                      <strong>Preço Base:</strong> {formatCurrency(configuracao.precoBase)}
                    </span>
                    <span className="text-gray-700">
                      <strong>Multiplicador:</strong> {configuracao.multiplicador}x
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        configuracao.ativa
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {configuracao.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditarConfiguracao(configuracao)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleExcluirConfiguracao(configuracao)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#DEEFE7]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-[#DEEFE7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackToNucleus
                nucleusName="Produtos"
                nucleusPath="/produtos"
                currentModuleName="Gestão de Categorias"
              />
              <div>
                <p className="text-[#B4BEC9]">
                  Configure categorias, subcategorias e tipos de produtos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs de Navegação */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('categorias')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'categorias'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Package className="h-4 w-4 mr-2" />
                Categorias
              </button>
              <button
                onClick={() => setActiveTab('subcategorias')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'subcategorias'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Tag className="h-4 w-4 mr-2" />
                Subcategorias
              </button>
              <button
                onClick={() => setActiveTab('configuracoes')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'configuracoes'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </button>
            </div>

            {/* Botão de adicionar */}
            <div className="flex items-center space-x-3">
              {activeTab === 'categorias' && (
                <button
                  onClick={handleNovaCategoria}
                  className="flex items-center px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </button>
              )}
              {activeTab === 'subcategorias' && (
                <button
                  onClick={handleNovaSubcategoria}
                  className="flex items-center px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Subcategoria
                </button>
              )}
              {activeTab === 'configuracoes' && (
                <button
                  onClick={handleNovaConfiguracao}
                  className="flex items-center px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Configuração
                </button>
              )}
            </div>
          </div>

          {/* Busca */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conteúdo por Aba */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'categorias' && renderCategorias()}
          {activeTab === 'subcategorias' && renderSubcategorias()}
          {activeTab === 'configuracoes' && renderConfiguracoes()}
        </div>
      </div>

      {/* Modais */}
      <ModalCategoria
        isOpen={showModalCategoria}
        onClose={() => {
          setShowModalCategoria(false);
          setEditingItem(null);
        }}
        onSave={handleSalvarCategoria}
        categoria={editingItem}
      />

      <ModalSubcategoria
        isOpen={showModalSubcategoria}
        onClose={() => {
          setShowModalSubcategoria(false);
          setEditingItem(null);
        }}
        onSave={handleSalvarSubcategoria}
        subcategoria={editingItem}
        categoriaAtual={selectedCategoria}
        categorias={categorias}
      />

      <ModalConfiguracao
        isOpen={showModalConfiguracao}
        onClose={() => {
          setShowModalConfiguracao(false);
          setEditingItem(null);
        }}
        onSave={handleSalvarConfiguracao}
        configuracao={editingItem}
        subcategoriaAtual={selectedSubcategoria}
        subcategorias={categorias.flatMap((cat) =>
          cat.subcategorias.map((sub) => ({
            ...sub,
            categoria: { nome: cat.nome, cor: cat.cor },
          })),
        )}
      />
    </div>
  );
};

export default CategoriasProdutosPage;

