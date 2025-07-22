import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  Plus, 
  Search, 
  X, 
  FileText, 
  Calculator, 
  User, 
  Package, 
  Trash2,
  CreditCard,
  ArrowLeft,
  Layers
} from 'lucide-react';

// Hooks e Services
import { useCalculosProposta } from './hooks/useCalculosProposta';
import { propostasService, PropostaCompleta } from './services/propostasService';
import { clientesService, Cliente as ClienteService } from '../../services/clientesService';

// Toast simples para demonstração
const toast = {
  success: (message: string) => console.log('✅', message),
  error: (message: string) => console.error('❌', message)
};

// Types e Interfaces Básicas
interface Cliente {
  id: string;
  nome: string;
  documento: string;
  email: string;
  telefone: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  tipoPessoa: 'fisica' | 'juridica';
}

interface ProdutoBase {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  subcategoria?: string;
  tipo?: string;
  descricao?: string;
  unidade: string;
}

interface ProdutoProposta {
  produto: ProdutoBase;
  quantidade: number;
  desconto: number;
  subtotal: number;
}

interface ProdutoCombo {
  produto: ProdutoBase;
  quantidade: number;
}

interface Combo {
  id: string;
  nome: string;
  descricao: string;
  precoOriginal: number;
  precoCombo: number;
  desconto: number;
  categoria: string;
  produtos: ProdutoCombo[];
}

interface ComboSelecionado {
  combo: Combo;
  quantidade: number;
  subtotal: number;
}

interface PropostaFormData {
  cliente: Cliente | null;
  tipoSelecao: 'personalizado' | 'combo';
  produtos: ProdutoProposta[];
  combos: ComboSelecionado[];
  descontoGlobal: number;
  impostos: number;
  formaPagamento: 'avista' | 'parcelado' | 'boleto' | 'cartao';
  parcelas?: number;
  validadeDias: number;
  observacoes: string;
  incluirImpostosPDF: boolean;
}

// Schema de validação
const propostaSchema = yup.object().shape({
  cliente: yup.object().nullable().required('Cliente é obrigatório'),
  tipoSelecao: yup.string().oneOf(['personalizado', 'combo']).required(),
  produtos: yup.array().when('tipoSelecao', {
    is: 'personalizado',
    then: (schema) => schema.min(1, 'Adicione pelo menos um produto'),
    otherwise: (schema) => schema
  }),
  combos: yup.array().when('tipoSelecao', {
    is: 'combo',
    then: (schema) => schema.min(1, 'Selecione pelo menos um combo'),
    otherwise: (schema) => schema
  }),
  descontoGlobal: yup.number().min(0).max(100),
  impostos: yup.number().min(0).max(100),
  formaPagamento: yup.string().required(),
  validadeDias: yup.number().min(1).max(365),
  observacoes: yup.string().max(500),
});

// Dados mock dos clientes
const clientesMockFallback: Cliente[] = [
  {
    id: '1',
    nome: 'João Silva Santos',
    documento: '123.456.789-00',
    email: 'joao@email.com',
    telefone: '(11) 99999-9999',
    endereco: 'Rua das Flores, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567',
    tipoPessoa: 'fisica'
  },
  {
    id: '2',
    nome: 'Maria Santos',
    documento: '987.654.321-00',
    email: 'maria@email.com',
    telefone: '(11) 88888-8888',
    endereco: 'Av. Paulista, 456',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310-100',
    tipoPessoa: 'fisica'
  },
  {
    id: '3',
    nome: 'Empresa ABC Ltda',
    documento: '12.345.678/0001-90',
    email: 'contato@empresaabc.com',
    telefone: '(11) 3333-3333',
    endereco: 'Rua Comercial, 789',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '04567-890',
    tipoPessoa: 'juridica'
  }
];

// Produtos organizados por categoria e tipo
const produtosMock: ProdutoBase[] = [
  // Software - Licenças Web
  {
    id: 'sw1',
    nome: 'Sistema de Gestão - Licença Web Básica',
    preco: 299.00,
    categoria: 'Software',
    subcategoria: 'Sistema de Gestão',
    tipo: 'Licença Web Básica',
    descricao: 'Acesso via web, recursos básicos, até 5 usuários',
    unidade: 'licença/mês'
  },
  {
    id: 'sw2',
    nome: 'Sistema de Gestão - Licença Web Premium',
    preco: 449.00,
    categoria: 'Software',
    subcategoria: 'Sistema de Gestão',
    tipo: 'Licença Web Premium',
    descricao: 'Acesso via web, recursos avançados, usuários ilimitados',
    unidade: 'licença/mês'
  },
  // Software - App Mobile
  {
    id: 'sw3',
    nome: 'Sistema de Gestão - App Mobile',
    preco: 389.00,
    categoria: 'Software',
    subcategoria: 'Sistema de Gestão',
    tipo: 'App Mobile',
    descricao: 'Aplicativo móvel nativo iOS/Android',
    unidade: 'licença/mês'
  },
  // Software - E-commerce
  {
    id: 'sw4',
    nome: 'E-commerce - Loja Básica',
    preco: 199.00,
    categoria: 'Software',
    subcategoria: 'E-commerce',
    tipo: 'Loja Básica',
    descricao: 'Até 100 produtos, design básico',
    unidade: 'licença/mês'
  },
  {
    id: 'sw5',
    nome: 'E-commerce - Loja Avançada',
    preco: 399.00,
    categoria: 'Software',
    subcategoria: 'E-commerce',
    tipo: 'Loja Avançada',
    descricao: 'Produtos ilimitados, integrações, relatórios',
    unidade: 'licença/mês'
  },
  // Consultoria
  {
    id: 'cons1',
    nome: 'Consultoria Gestão Empresarial - Júnior',
    preco: 150.00,
    categoria: 'Consultoria',
    subcategoria: 'Gestão Empresarial',
    tipo: 'Consultor Júnior',
    descricao: 'Consultor com 1-3 anos de experiência',
    unidade: 'hora'
  },
  {
    id: 'cons2',
    nome: 'Consultoria Gestão Empresarial - Sênior',
    preco: 300.00,
    categoria: 'Consultoria',
    subcategoria: 'Gestão Empresarial',
    tipo: 'Consultor Sênior',
    descricao: 'Consultor com 8+ anos de experiência',
    unidade: 'hora'
  },
  {
    id: 'cons3',
    nome: 'Consultoria Marketing Digital - Estratégia',
    preco: 180.00,
    categoria: 'Consultoria',
    subcategoria: 'Marketing Digital',
    tipo: 'Estratégia & Planejamento',
    descricao: 'Desenvolvimento de estratégias de marketing',
    unidade: 'hora'
  },
  // Treinamento
  {
    id: 'train1',
    nome: 'Treinamento Corporativo - Liderança',
    preco: 500.00,
    categoria: 'Treinamento',
    subcategoria: 'Corporativo',
    tipo: 'Liderança & Gestão',
    descricao: 'Programa de desenvolvimento de líderes',
    unidade: 'curso'
  },
  {
    id: 'train2',
    nome: 'Treinamento Corporativo - Vendas',
    preco: 400.00,
    categoria: 'Treinamento',
    subcategoria: 'Corporativo',
    tipo: 'Técnicas de Vendas',
    descricao: 'Capacitação em técnicas de vendas',
    unidade: 'curso'
  }
];

const combosMock: Combo[] = [
  {
    id: 'combo1',
    nome: 'Pacote Startup Digital',
    descricao: 'Solução completa para startups - Software Web + Consultoria',
    precoOriginal: 899.00,
    precoCombo: 750.00,
    desconto: 16.6,
    categoria: 'Pacote Startup',
    produtos: [
      { produto: produtosMock[0], quantidade: 1 }, // Sistema Web Básico
      { produto: produtosMock[5], quantidade: 8 }  // 8h Consultoria Júnior
    ]
  },
  {
    id: 'combo2',
    nome: 'Pacote Empresarial Completo',
    descricao: 'Solução enterprise com múltiplas licenças e treinamento',
    precoOriginal: 1799.00,
    precoCombo: 1499.00,
    desconto: 16.7,
    categoria: 'Pacote Enterprise',
    produtos: [
      { produto: produtosMock[1], quantidade: 2 }, // 2 Licenças Premium
      { produto: produtosMock[2], quantidade: 1 }, // 1 App Mobile
      { produto: produtosMock[8], quantidade: 1 }  // 1 Treinamento Liderança
    ]
  },
  {
    id: 'combo3',
    nome: 'Pacote E-commerce Plus',
    descricao: 'E-commerce completo com consultoria especializada',
    precoOriginal: 979.00,
    precoCombo: 850.00,
    desconto: 13.2,
    categoria: 'Pacote E-commerce',
    produtos: [
      { produto: produtosMock[4], quantidade: 1 }, // E-commerce Avançado
      { produto: produtosMock[7], quantidade: 10 } // 10h Marketing Digital
    ]
  }
];

const NovaPropostaPage: React.FC = () => {
  // Hooks
  const navigate = useNavigate();
  
  // Estados principais
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoadingClientes, setIsLoadingClientes] = useState(true);
  const [buscarCliente, setBuscarCliente] = useState('');
  const [buscarProduto, setBuscarProduto] = useState('');
  const [buscarCombo, setBuscarCombo] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [showProdutoSearch, setShowProdutoSearch] = useState(false);
  const [showComboSearch, setShowComboSearch] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Carregar clientes do serviço
  useEffect(() => {
    const carregarClientes = async () => {
      try {
        setIsLoadingClientes(true);
        const response = await clientesService.getClientes({ limit: 100 });
        
        const clientesFormatados: Cliente[] = response.data.map((cliente: ClienteService) => ({
          id: cliente.id || '',
          nome: cliente.nome,
          documento: cliente.documento || '',
          email: cliente.email,
          telefone: cliente.telefone || '',
          endereco: cliente.endereco || '',
          cidade: cliente.cidade || '',
          estado: cliente.estado || '',
          cep: cliente.cep || '',
          tipoPessoa: cliente.tipo === 'pessoa_fisica' ? 'fisica' : 'juridica'
        }));
        
        setClientes(clientesFormatados);
        console.log('✅ Clientes carregados:', clientesFormatados.length);
      } catch (error) {
        console.error('❌ Erro ao carregar clientes:', error);
        toast.error('Erro ao carregar clientes. Usando dados de exemplo.');
        setClientes(clientesMockFallback);
      } finally {
        setIsLoadingClientes(false);
      }
    };

    carregarClientes();
  }, []);
  
  // React Hook Form
  const { control, handleSubmit, watch, setValue, reset, formState: { errors, isValid } } = useForm<PropostaFormData>({
    resolver: yupResolver(propostaSchema),
    defaultValues: {
      tipoSelecao: 'personalizado',
      produtos: [],
      combos: [],
      descontoGlobal: 0,
      impostos: 12, // 12% padrão
      formaPagamento: 'avista',
      validadeDias: 15,
      observacoes: '',
      incluirImpostosPDF: true
    }
  });

  // Field arrays
  const { fields: produtos, append: adicionarProduto, remove: removerProduto } = useFieldArray({
    control,
    name: 'produtos'
  });

  const { fields: combos, append: adicionarCombo, remove: removerCombo } = useFieldArray({
    control,
    name: 'combos'
  });

  // Watch dos campos do formulário
  const watchedTipoSelecao = watch('tipoSelecao');
  const watchedProdutos = watch('produtos');
  const watchedCombos = watch('combos');
  const watchedDescontoGlobal = watch('descontoGlobal');
  const watchedImpostos = watch('impostos');

  // Hook de cálculos da proposta
  const { totais, calcularSubtotalProduto } = useCalculosProposta(
    watchedProdutos || [],
    watchedDescontoGlobal || 0,
    watchedImpostos || 0
  );

  // Calcular totais combinados (produtos + combos)
  const totaisCombinados = useMemo(() => {
    const subtotalProdutos = (watchedProdutos || []).reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const subtotalCombos = (watchedCombos || []).reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const subtotalGeral = subtotalProdutos + subtotalCombos;
    
    const descontoValor = (subtotalGeral * (watchedDescontoGlobal || 0)) / 100;
    const subtotalComDesconto = subtotalGeral - descontoValor;
    const impostosValor = (subtotalComDesconto * (watchedImpostos || 0)) / 100;
    const total = subtotalComDesconto + impostosValor;

    return {
      subtotal: subtotalGeral,
      desconto: descontoValor,
      impostos: impostosValor,
      total
    };
  }, [watchedProdutos, watchedCombos, watchedDescontoGlobal, watchedImpostos]);

  // Filtros de busca
  const clientesFiltrados = useMemo(() => {
    let clientesOrdenados = [...clientes].sort((a, b) => a.nome.localeCompare(b.nome));
    
    if (!buscarCliente) return clientesOrdenados;
    
    return clientesOrdenados.filter(cliente =>
      cliente.nome.toLowerCase().includes(buscarCliente.toLowerCase()) ||
      cliente.documento.includes(buscarCliente) ||
      cliente.email.toLowerCase().includes(buscarCliente.toLowerCase())
    );
  }, [buscarCliente, clientes]);

  const produtosFiltrados = useMemo(() => {
    if (!buscarProduto) return produtosMock;
    return produtosMock.filter(produto =>
      produto.nome.toLowerCase().includes(buscarProduto.toLowerCase()) ||
      produto.categoria.toLowerCase().includes(buscarProduto.toLowerCase()) ||
      (produto.subcategoria && produto.subcategoria.toLowerCase().includes(buscarProduto.toLowerCase())) ||
      (produto.tipo && produto.tipo.toLowerCase().includes(buscarProduto.toLowerCase()))
    );
  }, [buscarProduto]);

  const combosFiltrados = useMemo(() => {
    if (!buscarCombo) return combosMock;
    return combosMock.filter(combo =>
      combo.nome.toLowerCase().includes(buscarCombo.toLowerCase()) ||
      combo.categoria.toLowerCase().includes(buscarCombo.toLowerCase())
    );
  }, [buscarCombo]);

  // Formatação de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Funções de manipulação
  const handleSelecionarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setValue('cliente', cliente);
    setBuscarCliente(cliente.nome);
    setShowClienteDropdown(false);
  };

  const handleAdicionarProduto = (produto: ProdutoBase) => {
    const novoProduto: ProdutoProposta = {
      produto,
      quantidade: 1,
      desconto: 0,
      subtotal: produto.preco
    };

    adicionarProduto(novoProduto);
    setBuscarProduto('');
    setShowProdutoSearch(false);
    toast.success(`${produto.nome} adicionado à proposta!`);
  };

  const handleAdicionarCombo = (combo: Combo) => {
    const novoCombo: ComboSelecionado = {
      combo,
      quantidade: 1,
      subtotal: combo.precoCombo
    };

    adicionarCombo(novoCombo);
    setBuscarCombo('');
    setShowComboSearch(false);
    toast.success(`${combo.nome} adicionado à proposta!`);
  };

  const onSubmit = async (data: PropostaFormData) => {
    try {
      setIsGeneratingPDF(true);
      
      const propostaData = {
        ...data,
        cliente: clienteSelecionado,
        subtotal: totaisCombinados.subtotal,
        total: totaisCombinados.total,
        dataValidade: new Date(Date.now() + data.validadeDias * 24 * 60 * 60 * 1000),
        dataCriacao: new Date(),
        status: 'rascunho' as const
      };

      console.log('📝 Criando proposta via serviço real...', propostaData);
      
      // Usar o serviço real de propostas
      const propostaCriada = await propostasService.criarProposta(propostaData);
      
      console.log('✅ Proposta criada com sucesso:', propostaCriada);
      toast.success(`Proposta ${propostaCriada.numero} criada com sucesso!`);
      
      // Reset do formulário
      reset();
      setClienteSelecionado(null);
      setBuscarCliente('');
      
      // Navegação para lista de propostas
      navigate('/propostas');
      
    } catch (error) {
      console.error('❌ Erro ao criar proposta:', error);
      toast.error('Erro ao criar proposta. Tente novamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#DEEFE7]">
      {/* Header com botão de voltar */}
      <div className="bg-white shadow-sm border-b border-[#DEEFE7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-[#159A9C] hover:text-[#0F7B7D] transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Voltar
              </button>
              <div>
                <h1 className="text-2xl font-bold text-[#002333]">Nova Proposta</h1>
                <p className="text-[#B4BEC9]">Crie uma proposta comercial personalizada</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Layout em 3 colunas - Paisagem/Panorâmico */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* COLUNA 1: Seleção de Cliente */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Cliente *
                </h2>
              </div>

              {/* Campo de busca do cliente */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={buscarCliente}
                  onChange={(e) => setBuscarCliente(e.target.value)}
                  onFocus={() => setShowClienteDropdown(true)}
                  onBlur={() => setTimeout(() => setShowClienteDropdown(false), 200)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {/* Dropdown de clientes */}
                {showClienteDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isLoadingClientes ? (
                      <div className="p-4 text-center text-gray-500">
                        Carregando clientes...
                      </div>
                    ) : clientesFiltrados.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        {buscarCliente ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                      </div>
                    ) : (
                      clientesFiltrados.map((cliente) => (
                        <div
                          key={cliente.id}
                          onClick={() => handleSelecionarCliente(cliente)}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{cliente.nome}</div>
                          <div className="text-sm text-gray-600">{cliente.documento}</div>
                          <div className="text-sm text-gray-500">{cliente.email}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {errors.cliente && (
                <p className="text-red-500 text-sm mt-2">{errors.cliente.message}</p>
              )}

              {/* Informações do cliente selecionado */}
              {clienteSelecionado && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-900 mb-2">Cliente Selecionado</h3>
                  <div className="space-y-1 text-sm">
                    <div><strong>Nome:</strong> {clienteSelecionado.nome}</div>
                    <div><strong>Documento:</strong> {clienteSelecionado.documento}</div>
                    <div><strong>Email:</strong> {clienteSelecionado.email}</div>
                    <div><strong>Telefone:</strong> {clienteSelecionado.telefone}</div>
                    {clienteSelecionado.endereco && (
                      <div><strong>Endereço:</strong> {clienteSelecionado.endereco}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* COLUNA 2: Produtos e Serviços */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-green-600" />
                  Produtos & Serviços
                </h2>
              </div>

              {/* Toggle Tipo de Seleção */}
              <div className="mb-6">
                <Controller
                  name="tipoSelecao"
                  control={control}
                  render={({ field }) => (
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => field.onChange('personalizado')}
                        className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          field.value === 'personalizado'
                            ? 'bg-white text-green-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Personalizado
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('combo')}
                        className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          field.value === 'combo'
                            ? 'bg-white text-green-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <Layers className="h-4 w-4 mr-2" />
                        Combos
                      </button>
                    </div>
                  )}
                />
              </div>

              {/* Seção de Produtos Personalizados */}
              {watchedTipoSelecao === 'personalizado' && (
                <div>
                  <div className="flex justify-end mb-4">
                    <button
                      type="button"
                      onClick={() => setShowProdutoSearch(!showProdutoSearch)}
                      className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Adicionar Produto</span>
                    </button>
                  </div>

                  {/* Busca de Produtos */}
                  {showProdutoSearch && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar produto, categoria ou tipo..."
                          value={buscarProduto}
                          onChange={(e) => setBuscarProduto(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {produtosFiltrados.map((produto) => (
                          <div
                            key={produto.id}
                            onClick={() => handleAdicionarProduto(produto)}
                            className="p-4 border border-gray-200 rounded-lg hover:bg-white cursor-pointer transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 mb-1">{produto.nome}</div>
                                <div className="text-sm text-gray-600 mb-2">{produto.descricao}</div>
                                <div className="flex flex-wrap gap-1">
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                    {produto.categoria}
                                  </span>
                                  {produto.subcategoria && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                      {produto.subcategoria}
                                    </span>
                                  )}
                                  {produto.tipo && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                      {produto.tipo}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className="font-medium text-green-600">{formatCurrency(produto.preco)}</div>
                                <div className="text-xs text-gray-500">por {produto.unidade}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lista de Produtos Adicionados */}
                  <div className="space-y-3">
                    {produtos.map((field, index) => (
                      <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{field.produto.nome}</h4>
                            <p className="text-sm text-gray-600 mb-2">{field.produto.descricao}</p>
                            
                            {/* Tags com informações do produto */}
                            <div className="flex flex-wrap gap-1">
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {field.produto.categoria}
                              </span>
                              {field.produto.subcategoria && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                  {field.produto.subcategoria}
                                </span>
                              )}
                              {field.produto.tipo && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                  {field.produto.tipo}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removerProduto(index)}
                            className="text-red-500 hover:text-red-700 ml-4"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quantidade
                            </label>
                            <Controller
                              name={`produtos.${index}.quantidade`}
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="number"
                                  min="1"
                                  step="1"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  onChange={(e) => {
                                    const quantidade = parseInt(e.target.value) || 1;
                                    field.onChange(quantidade);
                                    const produtoAtual = watchedProdutos?.[index];
                                    if (produtoAtual) {
                                      const subtotal = calcularSubtotalProduto(produtoAtual.produto, quantidade, produtoAtual.desconto || 0);
                                      setValue(`produtos.${index}.subtotal`, subtotal);
                                    }
                                  }}
                                />
                              )}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Desconto (%)
                            </label>
                            <Controller
                              name={`produtos.${index}.desconto`}
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  onChange={(e) => {
                                    const desconto = parseFloat(e.target.value) || 0;
                                    field.onChange(desconto);
                                    const produtoAtual = watchedProdutos?.[index];
                                    if (produtoAtual) {
                                      const subtotal = calcularSubtotalProduto(produtoAtual.produto, produtoAtual.quantidade || 1, desconto);
                                      setValue(`produtos.${index}.subtotal`, subtotal);
                                    }
                                  }}
                                />
                              )}
                            />
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Subtotal:</span>
                            <span className="font-medium text-gray-900">
                              {formatCurrency(watchedProdutos?.[index]?.subtotal || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {produtos.length === 0 && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Nenhum produto adicionado</p>
                      </div>
                    )}
                  </div>

                  {errors.produtos && (
                    <p className="text-red-500 text-sm mt-2">{errors.produtos.message}</p>
                  )}
                </div>
              )}

              {/* Seção de Combos */}
              {watchedTipoSelecao === 'combo' && (
                <div>
                  <div className="flex justify-end mb-4">
                    <button
                      type="button"
                      onClick={() => setShowComboSearch(!showComboSearch)}
                      className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Adicionar Combo</span>
                    </button>
                  </div>

                  {/* Busca de Combos */}
                  {showComboSearch && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar combo ou pacote..."
                          value={buscarCombo}
                          onChange={(e) => setBuscarCombo(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {combosFiltrados.map((combo) => (
                          <div
                            key={combo.id}
                            onClick={() => handleAdicionarCombo(combo)}
                            className="p-4 border border-gray-200 rounded-lg hover:bg-white cursor-pointer transition-colors"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{combo.nome}</div>
                                <div className="text-sm text-gray-600 mb-2">{combo.categoria}</div>
                                <div className="text-xs text-gray-500">{combo.descricao}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-400 line-through">
                                  {formatCurrency(combo.precoOriginal)}
                                </div>
                                <div className="font-medium text-green-600">
                                  {formatCurrency(combo.precoCombo)}
                                </div>
                                <div className="text-xs text-green-500">
                                  {combo.desconto.toFixed(1)}% off
                                </div>
                              </div>
                            </div>
                            
                            <div className="border-t border-gray-200 pt-2">
                              <div className="text-xs text-gray-500 mb-1">Inclui:</div>
                              <div className="flex flex-wrap gap-1">
                                {combo.produtos.map((item, idx) => (
                                  <span 
                                    key={idx}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                                  >
                                    {item.quantidade}x {item.produto.nome}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lista de Combos Adicionados */}
                  <div className="space-y-3">
                    {combos.map((field, index) => (
                      <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{field.combo.nome}</h4>
                            <p className="text-sm text-gray-600">{field.combo.categoria}</p>
                            <div className="text-xs text-gray-500 mt-1">{field.combo.descricao}</div>
                            
                            {/* Produtos incluídos no combo */}
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="text-xs text-gray-500 mb-1">Produtos incluídos:</div>
                              <div className="flex flex-wrap gap-1">
                                {field.combo.produtos.map((item, idx) => (
                                  <span 
                                    key={idx}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                                  >
                                    {item.quantidade}x {item.produto.nome}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removerCombo(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quantidade
                            </label>
                            <Controller
                              name={`combos.${index}.quantidade`}
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="number"
                                  min="1"
                                  step="1"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  onChange={(e) => {
                                    const quantidade = parseInt(e.target.value) || 1;
                                    field.onChange(quantidade);
                                    const comboAtual = watchedCombos?.[index];
                                    if (comboAtual) {
                                      const subtotal = comboAtual.combo.precoCombo * quantidade;
                                      setValue(`combos.${index}.subtotal`, subtotal);
                                    }
                                  }}
                                />
                              )}
                            />
                          </div>

                          <div className="flex items-end">
                            <div className="w-full">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Desconto do Combo
                              </label>
                              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600">
                                {field.combo.desconto.toFixed(1)}% (Já aplicado)
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Subtotal:</span>
                            <span className="font-medium text-gray-900">
                              {formatCurrency(watchedCombos?.[index]?.subtotal || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {combos.length === 0 && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Layers className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Nenhum combo selecionado</p>
                      </div>
                    )}
                  </div>

                  {errors.combos && (
                    <p className="text-red-500 text-sm mt-2">{errors.combos.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* COLUNA 3: Totais e Condições */}
            <div className="space-y-6">
              
              {/* Card de Totais */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                  <Calculator className="h-5 w-5 mr-2 text-purple-600" />
                  Totais
                </h2>

                <div className="space-y-4">
                  {/* Desconto Global */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Desconto Geral (%)
                    </label>
                    <Controller
                      name="descontoGlobal"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      )}
                    />
                  </div>

                  {/* Impostos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Impostos (%)
                    </label>
                    <Controller
                      name="impostos"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      )}
                    />
                  </div>

                  {/* Resumo dos Totais */}
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(totaisCombinados.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Desconto:</span>
                      <span className="text-red-600">-{formatCurrency(totaisCombinados.desconto)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Impostos:</span>
                      <span className="text-gray-600">{formatCurrency(totaisCombinados.impostos)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-blue-600">{formatCurrency(totaisCombinados.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card de Condições */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                  <CreditCard className="h-5 w-5 mr-2 text-orange-600" />
                  Condições
                </h2>

                <div className="space-y-4">
                  {/* Forma de Pagamento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Forma de Pagamento
                    </label>
                    <Controller
                      name="formaPagamento"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="avista">À vista</option>
                          <option value="parcelado">Parcelado</option>
                          <option value="boleto">Boleto</option>
                          <option value="cartao">Cartão</option>
                        </select>
                      )}
                    />
                  </div>

                  {/* Parcelas (condicional) */}
                  {watch('formaPagamento') === 'parcelado' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Parcelas
                      </label>
                      <Controller
                        name="parcelas"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="number"
                            min="2"
                            max="12"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        )}
                      />
                    </div>
                  )}

                  {/* Validade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Validade (dias)
                    </label>
                    <Controller
                      name="validadeDias"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min="1"
                          max="365"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                  </div>

                  {/* Observações */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações
                    </label>
                    <Controller
                      name="observacoes"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Observações adicionais sobre a proposta..."
                        />
                      )}
                    />
                  </div>

                  {/* Incluir impostos no PDF */}
                  <div className="flex items-center">
                    <Controller
                      name="incluirImpostosPDF"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                      )}
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Incluir detalhes de impostos no PDF
                    </label>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={!isValid || isGeneratingPDF}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white rounded-lg hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center font-medium transition-all"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Gerando Proposta...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Gerar Proposta
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      reset();
                      setClienteSelecionado(null);
                      setBuscarCliente('');
                    }}
                    className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Limpar Formulário
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NovaPropostaPage;
