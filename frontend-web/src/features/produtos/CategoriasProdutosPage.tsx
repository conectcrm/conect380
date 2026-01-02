import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowLeft,
  Package,
  Tag,
  Settings,
  Layers,
  Save,
  X,
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

// Dados mock iniciais
const mockCategorias: Categoria[] = [
  {
    id: 'cat1',
    nome: 'Software & Tecnologia',
    descricao: 'Produtos de software, aplicativos e soluções tecnológicas',
    cor: 'blue',
    ativa: true,
    subcategorias: [
      {
        id: 'sub1',
        nome: 'Sistema de Gestão',
        descricao: 'Sistemas ERP, CRM e gestão empresarial',
        categoriaId: 'cat1',
        ativa: true,
        configuracoes: [
          {
            id: 'conf1',
            nome: 'Licença Web Básica',
            descricao: 'Acesso via web, até 5 usuários',
            subcategoriaId: 'sub1',
            precoBase: 299.0,
            multiplicador: 1.0,
            ativa: true,
          },
          {
            id: 'conf2',
            nome: 'Licença Web Premium',
            descricao: 'Acesso via web, usuários ilimitados',
            subcategoriaId: 'sub1',
            precoBase: 449.0,
            multiplicador: 1.5,
            ativa: true,
          },
        ],
      },
      {
        id: 'sub2',
        nome: 'E-commerce',
        descricao: 'Soluções para comércio eletrônico',
        categoriaId: 'cat1',
        ativa: true,
        configuracoes: [
          {
            id: 'conf3',
            nome: 'Loja Básica',
            descricao: 'Até 100 produtos',
            subcategoriaId: 'sub2',
            precoBase: 199.0,
            multiplicador: 1.0,
            ativa: true,
          },
          {
            id: 'conf4',
            nome: 'Loja Avançada',
            descricao: 'Produtos ilimitados',
            subcategoriaId: 'sub2',
            precoBase: 399.0,
            multiplicador: 2.0,
            ativa: true,
          },
        ],
      },
    ],
  },
  {
    id: 'cat2',
    nome: 'Consultoria & Serviços',
    descricao: 'Serviços de consultoria e assessoria especializada',
    cor: 'green',
    ativa: true,
    subcategorias: [
      {
        id: 'sub3',
        nome: 'Gestão Empresarial',
        descricao: 'Consultoria em processos e gestão',
        categoriaId: 'cat2',
        ativa: true,
        configuracoes: [
          {
            id: 'conf5',
            nome: 'Consultor Júnior',
            descricao: '1-3 anos de experiência',
            subcategoriaId: 'sub3',
            precoBase: 150.0,
            multiplicador: 1.0,
            ativa: true,
          },
          {
            id: 'conf6',
            nome: 'Consultor Sênior',
            descricao: '8+ anos de experiência',
            subcategoriaId: 'sub3',
            precoBase: 300.0,
            multiplicador: 2.0,
            ativa: true,
          },
        ],
      },
    ],
  },
];

const CategoriasProdutosPage: React.FC = () => {
  const navigate = useNavigate();

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
                    precoBase: conf.precoBase || 0,
                    ativa: conf.ativo,
                  }))
                : [],
            }))
          : [],
      }));

      setCategorias(categoriasConvertidas);

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

  // Cores disponíveis para categorias
  const coresDisponiveis = [
    { nome: 'Azul', valor: 'blue', classe: 'bg-blue-500' },
    { nome: 'Verde', valor: 'green', classe: 'bg-green-500' },
    { nome: 'Roxo', valor: 'purple', classe: 'bg-purple-500' },
    { nome: 'Laranja', valor: 'orange', classe: 'bg-orange-500' },
    { nome: 'Vermelho', valor: 'red', classe: 'bg-red-500' },
    { nome: 'Amarelo', valor: 'yellow', classe: 'bg-yellow-500' },
  ];

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

  // Funções de salvar
  const handleSalvarCategoria = async (categoriaData: any) => {
    try {
      if (editingItem) {
        // Editar categoria existente
        const categoriaAtualizada = await categoriasProdutosService.atualizarCategoria({
          id: editingItem.id,
          nome: categoriaData.nome,
          descricao: categoriaData.descricao,
          icone: categoriaData.icone,
          cor: categoriaData.cor,
        });

        setCategorias((prev) =>
          prev.map((cat) => (cat.id === editingItem.id ? { ...cat, ...categoriaData } : cat)),
        );

        toast.success('Categoria atualizada com sucesso!');
      } else {
        // Criar nova categoria
        const novaCategoria = await categoriasProdutosService.criarCategoria({
          nome: categoriaData.nome,
          descricao: categoriaData.descricao,
          icone: categoriaData.icone || '📁',
          cor: categoriaData.cor || 'blue',
        });

        const categoriaNormalizada: Categoria = {
          id: novaCategoria.id,
          nome: novaCategoria.nome,
          descricao: novaCategoria.descricao,
          cor: novaCategoria.cor || 'blue',
          ativa: novaCategoria.ativo,
          subcategorias: [],
        };

        setCategorias((prev) => [...prev, categoriaNormalizada]);
        toast.success('Categoria criada com sucesso!');
      }

      setShowModalCategoria(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleSalvarSubcategoria = async (subcategoriaData: any) => {
    try {
      if (editingItem) {
        // Editar subcategoria existente
        setCategorias((prev) =>
          prev.map((cat) => ({
            ...cat,
            subcategorias: cat.subcategorias.map((sub) =>
              sub.id === editingItem.id ? { ...sub, ...subcategoriaData } : sub,
            ),
          })),
        );
      } else {
        // Criar nova subcategoria
        const novaSubcategoria: Subcategoria = {
          id: Date.now().toString(),
          ...subcategoriaData,
          configuracoes: [],
        };
        setCategorias((prev) =>
          prev.map((cat) =>
            cat.id === subcategoriaData.categoriaId
              ? { ...cat, subcategorias: [...cat.subcategorias, novaSubcategoria] }
              : cat,
          ),
        );
      }
      setShowModalSubcategoria(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao salvar subcategoria:', error);
    }
  };

  const handleSalvarConfiguracao = async (configuracaoData: any) => {
    try {
      if (editingItem) {
        // Editar configuração existente
        setCategorias((prev) =>
          prev.map((cat) => ({
            ...cat,
            subcategorias: cat.subcategorias.map((sub) => ({
              ...sub,
              configuracoes: sub.configuracoes.map((conf) =>
                conf.id === editingItem.id ? { ...conf, ...configuracaoData } : conf,
              ),
            })),
          })),
        );
      } else {
        // Criar nova configuração
        const novaConfiguracao: Configuracao = {
          id: Date.now().toString(),
          ...configuracaoData,
        };
        setCategorias((prev) =>
          prev.map((cat) => ({
            ...cat,
            subcategorias: cat.subcategorias.map((sub) =>
              sub.id === configuracaoData.subcategoriaId
                ? { ...sub, configuracoes: [...sub.configuracoes, novaConfiguracao] }
                : sub,
            ),
          })),
        );
      }
      setShowModalConfiguracao(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
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
            className={`bg-white rounded-lg p-6 border-l-4 border-${categoria.cor}-500 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
              selectedCategoria?.id === categoria.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => {
              setSelectedCategoria(categoria);
              setSelectedSubcategoria(null);
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-4 h-4 rounded-full bg-${categoria.cor}-500`}></div>
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
                    // handleExcluirCategoria(categoria);
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
            <div className={`w-3 h-3 rounded-full bg-${selectedCategoria.cor}-500`}></div>
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
                      // handleExcluirSubcategoria(subcategoria);
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
                    onClick={() => {
                      // handleExcluirConfiguracao(configuracao);
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
