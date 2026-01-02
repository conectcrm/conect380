import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowLeft,
  Package,
  Settings,
  List,
  Save,
  X,
} from 'lucide-react';

// Interfaces
interface ConfiguracaoProduto {
  id: string;
  nome: string;
  multiplicador: number;
  descricao: string;
}

interface SubcategoriaProduto {
  id: string;
  nome: string;
  precoBase: number;
  unidade: string;
  configuracoes: ConfiguracaoProduto[];
  camposPersonalizados?: {
    duracao?: boolean;
    usuarios?: boolean;
    modalidade?: boolean;
    recursos?: boolean;
  };
}

interface CategoriaProduto {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  subcategorias: SubcategoriaProduto[];
}

// Dados iniciais completos
const categoriasIniciais: CategoriaProduto[] = [
  {
    id: 'software',
    nome: 'Software & Tecnologia',
    descricao: 'Soluções de software e tecnologia',
    icone: '💻',
    subcategorias: [
      {
        id: 'software-gestao',
        nome: 'Sistema de Gestão',
        precoBase: 299.0,
        unidade: 'licença/mês',
        camposPersonalizados: { usuarios: true, recursos: true, duracao: true },
        configuracoes: [
          {
            id: 'web-basico',
            nome: 'Licença Web - Básico',
            multiplicador: 1,
            descricao: 'Acesso via web, recursos básicos',
          },
          {
            id: 'web-premium',
            nome: 'Licença Web - Premium',
            multiplicador: 1.5,
            descricao: 'Acesso via web, recursos avançados',
          },
          {
            id: 'app-mobile',
            nome: 'App Mobile',
            multiplicador: 1.3,
            descricao: 'Aplicativo móvel nativo',
          },
          {
            id: 'desktop',
            nome: 'Licença Desktop',
            multiplicador: 2,
            descricao: 'Software instalado localmente',
          },
          {
            id: 'hibrido',
            nome: 'Licença Híbrida',
            multiplicador: 2.5,
            descricao: 'Web + Mobile + Desktop',
          },
        ],
      },
      {
        id: 'ecommerce',
        nome: 'E-commerce',
        precoBase: 199.0,
        unidade: 'licença/mês',
        camposPersonalizados: { recursos: true, duracao: true },
        configuracoes: [
          {
            id: 'loja-basica',
            nome: 'Loja Básica',
            multiplicador: 1,
            descricao: 'Até 100 produtos',
          },
          {
            id: 'loja-avancada',
            nome: 'Loja Avançada',
            multiplicador: 2,
            descricao: 'Produtos ilimitados, integrações',
          },
          {
            id: 'marketplace',
            nome: 'Marketplace',
            multiplicador: 3,
            descricao: 'Multi-loja, múltiplos vendedores',
          },
        ],
      },
      {
        id: 'crm',
        nome: 'CRM & Vendas',
        precoBase: 149.0,
        unidade: 'licença/mês',
        camposPersonalizados: { usuarios: true, recursos: true, duracao: true },
        configuracoes: [
          {
            id: 'crm-starter',
            nome: 'CRM Starter',
            multiplicador: 1,
            descricao: 'Funcionalidades básicas de CRM',
          },
          {
            id: 'crm-professional',
            nome: 'CRM Professional',
            multiplicador: 1.8,
            descricao: 'CRM completo com automação',
          },
          {
            id: 'crm-enterprise',
            nome: 'CRM Enterprise',
            multiplicador: 2.5,
            descricao: 'CRM avançado com IA e integrações',
          },
        ],
      },
    ],
  },
  {
    id: 'consultoria',
    nome: 'Consultoria & Serviços',
    descricao: 'Serviços de consultoria especializada',
    icone: '🎯',
    subcategorias: [
      {
        id: 'gestao-empresarial',
        nome: 'Gestão Empresarial',
        precoBase: 150.0,
        unidade: 'hora',
        camposPersonalizados: { modalidade: true, duracao: true },
        configuracoes: [
          {
            id: 'junior',
            nome: 'Consultor Júnior',
            multiplicador: 1,
            descricao: '1-3 anos de experiência',
          },
          {
            id: 'pleno',
            nome: 'Consultor Pleno',
            multiplicador: 1.5,
            descricao: '4-7 anos de experiência',
          },
          {
            id: 'senior',
            nome: 'Consultor Sênior',
            multiplicador: 2,
            descricao: '8+ anos de experiência',
          },
          {
            id: 'especialista',
            nome: 'Especialista',
            multiplicador: 2.5,
            descricao: 'Expert em área específica',
          },
        ],
      },
      {
        id: 'marketing-digital',
        nome: 'Marketing Digital',
        precoBase: 120.0,
        unidade: 'hora',
        camposPersonalizados: { modalidade: true, recursos: true },
        configuracoes: [
          {
            id: 'estrategia',
            nome: 'Estratégia & Planejamento',
            multiplicador: 1.2,
            descricao: 'Desenvolvimento de estratégias',
          },
          {
            id: 'execucao',
            nome: 'Execução de Campanhas',
            multiplicador: 1,
            descricao: 'Implementação e gestão',
          },
          {
            id: 'analise',
            nome: 'Análise & Otimização',
            multiplicador: 1.3,
            descricao: 'Análise de dados e otimização',
          },
        ],
      },
      {
        id: 'transformacao-digital',
        nome: 'Transformação Digital',
        precoBase: 200.0,
        unidade: 'hora',
        camposPersonalizados: { modalidade: true, duracao: true },
        configuracoes: [
          {
            id: 'diagnostico',
            nome: 'Diagnóstico Digital',
            multiplicador: 0.8,
            descricao: 'Avaliação da maturidade digital',
          },
          {
            id: 'estrategia-digital',
            nome: 'Estratégia Digital',
            multiplicador: 1.2,
            descricao: 'Planejamento da transformação',
          },
          {
            id: 'implementacao',
            nome: 'Implementação',
            multiplicador: 1.5,
            descricao: 'Execução da transformação digital',
          },
        ],
      },
    ],
  },
  {
    id: 'treinamento',
    nome: 'Treinamento & Capacitação',
    descricao: 'Programas de treinamento e desenvolvimento',
    icone: '📚',
    subcategorias: [
      {
        id: 'corporativo',
        nome: 'Treinamento Corporativo',
        precoBase: 500.0,
        unidade: 'curso',
        camposPersonalizados: { modalidade: true, usuarios: true, duracao: true },
        configuracoes: [
          {
            id: 'lideranca',
            nome: 'Liderança & Gestão',
            multiplicador: 1,
            descricao: 'Desenvolvimento de líderes',
          },
          {
            id: 'vendas',
            nome: 'Técnicas de Vendas',
            multiplicador: 0.8,
            descricao: 'Capacitação em vendas',
          },
          {
            id: 'atendimento',
            nome: 'Atendimento ao Cliente',
            multiplicador: 0.7,
            descricao: 'Excelência no atendimento',
          },
          {
            id: 'tecnologia',
            nome: 'Capacitação Tecnológica',
            multiplicador: 1.2,
            descricao: 'Treinamento em tecnologias',
          },
        ],
      },
      {
        id: 'tecnico',
        nome: 'Treinamento Técnico',
        precoBase: 350.0,
        unidade: 'curso',
        camposPersonalizados: { modalidade: true, usuarios: true, duracao: true },
        configuracoes: [
          {
            id: 'programacao',
            nome: 'Programação',
            multiplicador: 1.2,
            descricao: 'Linguagens de programação',
          },
          {
            id: 'infraestrutura',
            nome: 'Infraestrutura TI',
            multiplicador: 1.1,
            descricao: 'Servidores, redes e cloud',
          },
          {
            id: 'seguranca',
            nome: 'Segurança da Informação',
            multiplicador: 1.4,
            descricao: 'Cybersegurança e proteção',
          },
        ],
      },
    ],
  },
  {
    id: 'design',
    nome: 'Design & Criação',
    descricao: 'Serviços de design e criação visual',
    icone: '🎨',
    subcategorias: [
      {
        id: 'identidade-visual',
        nome: 'Identidade Visual',
        precoBase: 800.0,
        unidade: 'projeto',
        camposPersonalizados: { recursos: true },
        configuracoes: [
          {
            id: 'logotipo',
            nome: 'Logotipo',
            multiplicador: 0.5,
            descricao: 'Criação de logotipo',
          },
          {
            id: 'identidade-completa',
            nome: 'Identidade Completa',
            multiplicador: 1,
            descricao: 'Logo + manual de marca',
          },
          {
            id: 'branding-completo',
            nome: 'Branding Completo',
            multiplicador: 1.8,
            descricao: 'Identidade + estratégia de marca',
          },
        ],
      },
      {
        id: 'web-design',
        nome: 'Web Design',
        precoBase: 1200.0,
        unidade: 'projeto',
        camposPersonalizados: { recursos: true },
        configuracoes: [
          {
            id: 'landing-page',
            nome: 'Landing Page',
            multiplicador: 0.4,
            descricao: 'Página única',
          },
          {
            id: 'site-institucional',
            nome: 'Site Institucional',
            multiplicador: 1,
            descricao: 'Site completo',
          },
          {
            id: 'ecommerce-design',
            nome: 'E-commerce Design',
            multiplicador: 1.5,
            descricao: 'Loja virtual completa',
          },
        ],
      },
    ],
  },
];

const CategoriasProdutosPage: React.FC = () => {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<CategoriaProduto[]>(categoriasIniciais);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'categoria' | 'subcategoria' | 'configuracao'>(
    'categoria',
  );
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaProduto | null>(null);
  const [selectedSubcategoria, setSelectedSubcategoria] = useState<SubcategoriaProduto | null>(
    null,
  );

  // Formulário para nova categoria
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    icone: '',
    precoBase: 0,
    unidade: '',
    multiplicador: 1,
    camposPersonalizados: {
      duracao: false,
      usuarios: false,
      modalidade: false,
      recursos: false,
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSave = () => {
    if (modalType === 'categoria') {
      const novaCategoria: CategoriaProduto = {
        id: editingItem ? editingItem.id : `cat-${Date.now()}`,
        nome: formData.nome,
        descricao: formData.descricao,
        icone: formData.icone,
        subcategorias: editingItem ? editingItem.subcategorias : [],
      };

      if (editingItem) {
        setCategorias((prev) =>
          prev.map((cat) => (cat.id === editingItem.id ? novaCategoria : cat)),
        );
      } else {
        setCategorias((prev) => [...prev, novaCategoria]);
      }
    } else if (modalType === 'subcategoria' && selectedCategoria) {
      const novaSubcategoria: SubcategoriaProduto = {
        id: editingItem ? editingItem.id : `sub-${Date.now()}`,
        nome: formData.nome,
        precoBase: formData.precoBase,
        unidade: formData.unidade,
        camposPersonalizados: formData.camposPersonalizados,
        configuracoes: editingItem ? editingItem.configuracoes : [],
      };

      setCategorias((prev) =>
        prev.map((cat) => {
          if (cat.id === selectedCategoria.id) {
            const subcategorias = editingItem
              ? cat.subcategorias.map((sub) => (sub.id === editingItem.id ? novaSubcategoria : sub))
              : [...cat.subcategorias, novaSubcategoria];
            return { ...cat, subcategorias };
          }
          return cat;
        }),
      );
    } else if (modalType === 'configuracao' && selectedCategoria && selectedSubcategoria) {
      const novaConfiguracao: ConfiguracaoProduto = {
        id: editingItem ? editingItem.id : `conf-${Date.now()}`,
        nome: formData.nome,
        multiplicador: formData.multiplicador,
        descricao: formData.descricao,
      };

      setCategorias((prev) =>
        prev.map((cat) => {
          if (cat.id === selectedCategoria.id) {
            const subcategorias = cat.subcategorias.map((sub) => {
              if (sub.id === selectedSubcategoria.id) {
                const configuracoes = editingItem
                  ? sub.configuracoes.map((conf) =>
                      conf.id === editingItem.id ? novaConfiguracao : conf,
                    )
                  : [...sub.configuracoes, novaConfiguracao];
                return { ...sub, configuracoes };
              }
              return sub;
            });
            return { ...cat, subcategorias };
          }
          return cat;
        }),
      );
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      icone: '',
      precoBase: 0,
      unidade: '',
      multiplicador: 1,
      camposPersonalizados: {
        duracao: false,
        usuarios: false,
        modalidade: false,
        recursos: false,
      },
    });
    setEditingItem(null);
    setShowModal(false);
  };

  const handleEdit = (item: any, type: 'categoria' | 'subcategoria' | 'configuracao') => {
    setEditingItem(item);
    setModalType(type);
    setFormData({
      nome: item.nome || '',
      descricao: item.descricao || '',
      icone: item.icone || '',
      precoBase: item.precoBase || 0,
      unidade: item.unidade || '',
      multiplicador: item.multiplicador || 1,
      camposPersonalizados: item.camposPersonalizados || {
        duracao: false,
        usuarios: false,
        modalidade: false,
        recursos: false,
      },
    });
    setShowModal(true);
  };

  const handleDelete = (id: string, type: 'categoria' | 'subcategoria' | 'configuracao') => {
    if (type === 'categoria') {
      setCategorias((prev) => prev.filter((cat) => cat.id !== id));
    } else if (type === 'subcategoria' && selectedCategoria) {
      setCategorias((prev) =>
        prev.map((cat) => {
          if (cat.id === selectedCategoria.id) {
            return { ...cat, subcategorias: cat.subcategorias.filter((sub) => sub.id !== id) };
          }
          return cat;
        }),
      );
    } else if (type === 'configuracao' && selectedCategoria && selectedSubcategoria) {
      setCategorias((prev) =>
        prev.map((cat) => {
          if (cat.id === selectedCategoria.id) {
            const subcategorias = cat.subcategorias.map((sub) => {
              if (sub.id === selectedSubcategoria.id) {
                return {
                  ...sub,
                  configuracoes: sub.configuracoes.filter((conf) => conf.id !== id),
                };
              }
              return sub;
            });
            return { ...cat, subcategorias };
          }
          return cat;
        }),
      );
    }
  };

  const filteredCategorias = categorias.filter(
    (cat) =>
      cat.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.descricao.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#DEEFE7]">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/propostas')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-[#002333]">Gestão de Categorias</h1>
                <p className="text-[#B4BEC9]">
                  Gerencie categorias, subcategorias e configurações de produtos
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setModalType('categoria');
                setEditingItem(null);
                setShowModal(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white rounded-lg hover:shadow-lg flex items-center gap-2 text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Nova Categoria
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Busca */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lista de Categorias */}
        <div className="space-y-6">
          {filteredCategorias.map((categoria) => (
            <div key={categoria.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Header da Categoria */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{categoria.icone}</span>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{categoria.nome}</h2>
                      <p className="text-sm text-gray-600">{categoria.descricao}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedCategoria(categoria);
                        setModalType('subcategoria');
                        setEditingItem(null);
                        setShowModal(true);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      Subcategoria
                    </button>
                    <button
                      onClick={() => handleEdit(categoria, 'categoria')}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(categoria.id, 'categoria')}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Subcategorias */}
              <div className="p-4">
                {categoria.subcategorias.map((subcategoria) => (
                  <div key={subcategoria.id} className="mb-4 border border-gray-200 rounded-lg">
                    <div className="p-3 bg-blue-50 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{subcategoria.nome}</h3>
                          <p className="text-sm text-gray-600">
                            Preço base: {formatCurrency(subcategoria.precoBase)} por{' '}
                            {subcategoria.unidade}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedCategoria(categoria);
                              setSelectedSubcategoria(subcategoria);
                              setModalType('configuracao');
                              setEditingItem(null);
                              setShowModal(true);
                            }}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            <Plus className="w-3 h-3 inline mr-1" />
                            Config
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCategoria(categoria);
                              handleEdit(subcategoria, 'subcategoria');
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCategoria(categoria);
                              handleDelete(subcategoria.id, 'subcategoria');
                            }}
                            className="p-1 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Configurações */}
                    <div className="p-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {subcategoria.configuracoes.map((config) => (
                          <div
                            key={config.id}
                            className="p-2 border border-gray-200 rounded bg-gray-50"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {config.nome}
                                </div>
                                <div className="text-xs text-gray-600">{config.descricao}</div>
                                <div className="text-xs text-green-600">
                                  {config.multiplicador}x ={' '}
                                  {formatCurrency(subcategoria.precoBase * config.multiplicador)}
                                </div>
                              </div>
                              <div className="flex space-x-1 ml-2">
                                <button
                                  onClick={() => {
                                    setSelectedCategoria(categoria);
                                    setSelectedSubcategoria(subcategoria);
                                    handleEdit(config, 'configuracao');
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedCategoria(categoria);
                                    setSelectedSubcategoria(subcategoria);
                                    handleDelete(config.id, 'configuracao');
                                  }}
                                  className="p-1 text-red-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingItem ? 'Editar' : 'Nova'}{' '}
                {modalType === 'categoria'
                  ? 'Categoria'
                  : modalType === 'subcategoria'
                    ? 'Subcategoria'
                    : 'Configuração'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome da categoria"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descrição detalhada"
                />
              </div>

              {modalType === 'categoria' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ícone (Emoji)
                  </label>
                  <input
                    type="text"
                    value={formData.icone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, icone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="📦"
                  />
                </div>
              )}

              {modalType === 'subcategoria' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço Base (R$)
                    </label>
                    <input
                      type="number"
                      value={formData.precoBase}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          precoBase: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="299.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                    <input
                      type="text"
                      value={formData.unidade}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, unidade: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="licença/mês, hora, projeto"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campos Personalizados
                    </label>
                    <div className="space-y-2">
                      {Object.entries(formData.camposPersonalizados).map(([key, value]) => (
                        <label key={key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                camposPersonalizados: {
                                  ...prev.camposPersonalizados,
                                  [key]: e.target.checked,
                                },
                              }))
                            }
                            className="mr-2"
                          />
                          <span className="text-sm capitalize">{key}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {modalType === 'configuracao' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Multiplicador
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.multiplicador}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        multiplicador: parseFloat(e.target.value) || 1,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="1.5"
                  />
                  {selectedSubcategoria && (
                    <p className="text-xs text-gray-500 mt-1">
                      Preço final:{' '}
                      {formatCurrency(
                        (selectedSubcategoria.precoBase || 0) * formData.multiplicador,
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Salvar
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriasProdutosPage;
