import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast as toastNotify } from 'react-hot-toast';
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
import { BackToNucleus } from '../../components/navigation/BackToNucleus';

// Hooks e Services
import { useCalculosProposta } from './hooks/useCalculosProposta';
import { propostasService, PropostaCompleta } from './services/propostasService';
import { clientesService, Cliente as ClienteService } from '../../services/clientesService';

// Shared adapters para integração entre páginas
import { 
  ProdutoPropostaBase, 
  useProdutosParaPropostas,
  sincronizarProdutos 
} from '../../shared/produtosAdapter';

// Redefinir tipos específicos para propostas
type ProdutoPropostaLocal = {
  produto: ProdutoPropostaBase;
  quantidade: number;
  desconto: number;
  subtotal: number;
};

// Helper function to safely render values
const safeRender = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
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

interface ProdutoCombo {
  produto: ProdutoPropostaBase;
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
  produtos: ProdutoPropostaLocal[];
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
  tipoSelecao: yup.string().oneOf(['personalizado', 'combo']).required('Tipo de seleção é obrigatório'),
  produtos: yup.array().when('tipoSelecao', {
    is: 'personalizado',
    then: (schema) => schema.min(1, 'Adicione pelo menos um produto'),
    otherwise: (schema) => schema.optional()
  }),
  combos: yup.array().when('tipoSelecao', {
    is: 'combo',
    then: (schema) => schema.min(1, 'Selecione pelo menos um combo'),
    otherwise: (schema) => schema.optional()
  }),
  descontoGlobal: yup.number().min(0, 'Desconto não pode ser negativo').max(100, 'Desconto não pode ser superior a 100%').default(0),
  impostos: yup.number().min(0, 'Impostos não podem ser negativos').max(100, 'Impostos não podem ser superiores a 100%').default(12),
  formaPagamento: yup.string().required('Forma de pagamento é obrigatória'),
  validadeDias: yup.number().min(1, 'Validade deve ser de pelo menos 1 dia').max(365, 'Validade não pode ser superior a 365 dias').default(15),
  observacoes: yup.string().max(500, 'Observações devem ter no máximo 500 caracteres').optional(),
  incluirImpostosPDF: yup.boolean().default(true),
  parcelas: yup.number().when('formaPagamento', {
    is: 'parcelado',
    then: (schema) => schema.min(2, 'Mínimo de 2 parcelas').max(12, 'Máximo de 12 parcelas').required('Número de parcelas é obrigatório'),
    otherwise: (schema) => schema.optional()
  })
});

// Dados mock dos clientes (usado como fallback)
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

// Dados mock dos combos (temporário - será integrado ao adapter em futuras versões)
const combosMock: Combo[] = [
  {
    id: 'combo1',
    nome: 'Pacote Startup',
    descricao: 'Sistema básico + consultoria inicial',
    precoOriginal: 899.00,
    precoCombo: 750.00,
    desconto: 16.6,
    categoria: 'Pacote Startup',
    produtos: []  // Será populado dinamicamente
  },
  {
    id: 'combo2',
    nome: 'Pacote E-commerce',
    descricao: 'Loja online completa + marketing',
    precoOriginal: 1199.00,
    precoCombo: 999.00,
    desconto: 16.7,
    categoria: 'Pacote E-commerce',
    produtos: []  // Será populado dinamicamente
  }
];

const NovaPropostaPage: React.FC = () => {
  // Hooks
  const navigate = useNavigate();
  
  // Integração com adapter de produtos
  const { produtos: produtosDisponiveis, buscarProdutos, categorias, subcategoriasPorCategoria } = useProdutosParaPropostas();
  
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
        const response = await clientesService.getClientes({ limit: 100 }); // Carregar mais clientes
        
        // Converter clientes do serviço para o formato esperado
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
        toastNotify.error('Erro ao carregar clientes. Usando dados de exemplo.');
        // Usar dados mock como fallback
        setClientes(clientesMockFallback);
      } finally {
        setIsLoadingClientes(false);
      }
    };

    carregarClientes();
  }, []);
  
  // Estados para filtros de categoria hierárquica
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] = useState('');
  
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
    return buscarProdutos({
      categoria: categoriaSelecionada || undefined,
      subcategoria: subcategoriaSelecionada || undefined,
      termo: buscarProduto || undefined
    });
  }, [buscarProduto, categoriaSelecionada, subcategoriaSelecionada, buscarProdutos]);

  // Opções de filtros hierárquicos usando o adapter
  const categoriasDisponiveis = useMemo(() => {
    return categorias;
  }, [categorias]);

  const subcategoriasDisponiveis = useMemo(() => {
    if (!categoriaSelecionada) return [];
    return subcategoriasPorCategoria(categoriaSelecionada);
  }, [categoriaSelecionada, subcategoriasPorCategoria]);

  // Função para resetar filtros hierárquicos quando categoria muda
  const handleCategoriaChange = (categoria: string) => {
    setCategoriaSelecionada(categoria);
    setSubcategoriaSelecionada('');
  };

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

  const handleAdicionarProduto = (produto: ProdutoPropostaBase) => {
    const novoProduto: ProdutoPropostaLocal = {
      produto,
      quantidade: 1,
      desconto: 0,
      subtotal: produto.preco
    };

    adicionarProduto(novoProduto);
    setBuscarProduto('');
    setShowProdutoSearch(false);
    // Limpar filtros após adicionar produto
    setCategoriaSelecionada('');
    setSubcategoriaSelecionada('');
    toastNotify.success(`${produto.nome} adicionado à proposta!`);
    
    // Sincronizar com outras páginas
    sincronizarProdutos();
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
    toastNotify.success(`${combo.nome} adicionado à proposta!`);
  };

  const onSubmit = async (data: PropostaFormData) => {
    try {
      console.log('📝 Iniciando criação da proposta...');
      console.log('💾 Dados do formulário:', data);
      
      // Validação adicional antes de enviar
      if (!clienteSelecionado) {
        toastNotify.error('Selecione um cliente para continuar!');
        return;
      }
      
      const produtosCount = data.produtos?.length || 0;
      const combosCount = data.combos?.length || 0;
      
      if (produtosCount === 0 && combosCount === 0) {
        toastNotify.error('Adicione pelo menos um produto ou combo à proposta!');
        return;
      }
      
      setIsGeneratingPDF(true);
      
      // Toast de loading
      const loadingToastId = toastNotify.loading('Criando proposta...');
      
      const propostaData = {
        ...data,
        cliente: clienteSelecionado,
        subtotal: totaisCombinados.subtotal,
        total: totaisCombinados.total,
        dataValidade: new Date(Date.now() + data.validadeDias * 24 * 60 * 60 * 1000),
        dataCriacao: new Date(),
        status: 'rascunho' as const,
        numero: `PROP-${Date.now().toString().slice(-6)}`
      };

      console.log('📋 Dados da proposta a serem salvos:', propostaData);

      // Usar o serviço real de propostas
      const propostaCriada = await propostasService.criarProposta(propostaData);
      
      console.log('✅ Proposta criada com sucesso:', propostaCriada);
      
      // Remover toast de loading e mostrar sucesso
      toastNotify.dismiss(loadingToastId);
      toastNotify.success(`Proposta ${propostaCriada.numero} criada com sucesso!`);
      
      // Reset do formulário
      reset();
      setClienteSelecionado(null);
      setBuscarCliente('');
      setCategoriaSelecionada('');
      setSubcategoriaSelecionada('');
      setBuscarProduto('');
      setBuscarCombo('');
      
      // Navegar para lista de propostas
      console.log('🔄 Redirecionando para lista de propostas...');
      setTimeout(() => {
        navigate('/propostas');
      }, 1500);
      
    } catch (error) {
      console.error('❌ Erro ao criar proposta:', error);
      
      // Remover toast de loading se ainda estiver ativo
      try {
        toastNotify.dismiss();
      } catch (dismissError) {
        console.log('Toast já foi removido');
      }
      
      let errorMessage = 'Erro inesperado ao criar proposta. Tente novamente.';
      
      if (error instanceof Error) {
        // Tratar erros específicos
        if (error.message.includes('Cliente não encontrado')) {
          errorMessage = 'Cliente não encontrado. Selecione um cliente válido.';
        } else if (error.message.includes('pelo menos um produto')) {
          errorMessage = 'Adicione pelo menos um produto ou combo à proposta.';
        } else if (error.message.includes('maior que zero')) {
          errorMessage = 'O valor total da proposta deve ser maior que zero.';
        } else if (error.message.includes('comunicação')) {
          errorMessage = 'Falha na comunicação com o servidor. Verifique sua conexão e tente novamente.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Mostrar erro com toast e alert para debug
      toastNotify.error(errorMessage);
      
      // Log detalhado para debug
      console.log('🔍 Debug - Informações do erro:', {
        errorType: error?.constructor?.name,
        errorMessage: error?.message,
        clienteValido: !!clienteSelecionado,
        totalProdutos: watchedProdutos?.length || 0,
        totalCombos: watchedCombos?.length || 0,
        valorTotal: totaisCombinados.total
      });
    } finally {
      setIsGeneratingPDF(false);
      console.log('🔄 Processo finalizado');
    }
  };

  return (
    <div className="min-h-screen bg-[#DEEFE7]">
      {/* Header com botão de voltar */}
      <div className="bg-white shadow-sm border-b border-[#DEEFE7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackToNucleus 
                nucleusName="Propostas"
                nucleusPath="/propostas"
                currentModuleName="Nova Proposta"
              />
              <div>
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
                          <div className="font-medium text-gray-900">{safeRender(cliente.nome)}</div>
                          <div className="text-sm text-gray-600">{safeRender(cliente.documento)}</div>
                          <div className="text-sm text-gray-500">{safeRender(cliente.email)}</div>
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
                    <div><strong>Nome:</strong> {safeRender(clienteSelecionado.nome)}</div>
                    <div><strong>Documento:</strong> {safeRender(clienteSelecionado.documento)}</div>
                    <div><strong>Email:</strong> {safeRender(clienteSelecionado.email)}</div>
                    <div><strong>Telefone:</strong> {safeRender(clienteSelecionado.telefone)}</div>
                    {clienteSelecionado.endereco && (
                      <div><strong>Endereço:</strong> {safeRender(clienteSelecionado.endereco)}</div>
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
                      {/* Filtros Hierárquicos de Categoria */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Categoria
                          </label>
                          <select
                            value={categoriaSelecionada}
                            onChange={(e) => handleCategoriaChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            <option value="">Todas as categorias</option>
                            {categoriasDisponiveis.map((categoria) => (
                              <option key={categoria} value={categoria}>
                                {categoria}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subcategoria
                          </label>
                          <select
                            value={subcategoriaSelecionada}
                            onChange={(e) => setSubcategoriaSelecionada(e.target.value)}
                            disabled={!categoriaSelecionada}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="">Todas as subcategorias</option>
                            {subcategoriasDisponiveis.map((subcategoria) => (
                              <option key={subcategoria} value={subcategoria}>
                                {subcategoria}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Filtro de Busca Textual */}
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar produto por nome ou descrição..."
                          value={buscarProduto}
                          onChange={(e) => setBuscarProduto(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>

                      {/* Botão para limpar filtros */}
                      {(categoriaSelecionada || subcategoriaSelecionada || buscarProduto) && (
                        <div className="mb-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setCategoriaSelecionada('');
                              setSubcategoriaSelecionada('');
                              setBuscarProduto('');
                            }}
                            className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Limpar filtros
                          </button>
                        </div>
                      )}

                      {/* Indicador de resultados */}
                      <div className="mb-3 text-sm text-gray-600">
                        {produtosFiltrados.length === 0 ? (
                          <span className="text-orange-600">Nenhum produto encontrado</span>
                        ) : (
                          <span>
                            {produtosFiltrados.length} produto{produtosFiltrados.length !== 1 ? 's' : ''} encontrado{produtosFiltrados.length !== 1 ? 's' : ''}
                            {(categoriaSelecionada || subcategoriaSelecionada) && (
                              <span className="ml-2 font-medium">
                                {categoriaSelecionada && `em ${categoriaSelecionada}`}
                                {subcategoriaSelecionada && ` → ${subcategoriaSelecionada}`}
                              </span>
                            )}
                          </span>
                        )}
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
                                <div className="font-medium text-gray-900 mb-1">{safeRender(produto.nome)}</div>
                                <div className="text-sm text-gray-600 mb-2">{safeRender(produto.descricao)}</div>
                                <div className="flex flex-wrap gap-1">
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                    {safeRender(produto.categoria)}
                                  </span>
                                  {produto.subcategoria && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                      {safeRender(produto.subcategoria)}
                                    </span>
                                  )}
                                  {produto.tipo && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                      {safeRender(produto.tipo)}
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
                            <h4 className="font-medium text-gray-900">{safeRender(field.produto.nome)}</h4>
                            <p className="text-sm text-gray-600 mb-2">{safeRender(field.produto.descricao)}</p>
                            
                            {/* Tags com informações do produto */}
                            <div className="flex flex-wrap gap-1">
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {safeRender(field.produto.categoria)}
                              </span>
                              {field.produto.subcategoria && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                  {safeRender(field.produto.subcategoria)}
                                </span>
                              )}
                              {field.produto.tipo && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                  {safeRender(field.produto.tipo)}
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
                                <div className="font-medium text-gray-900">{safeRender(combo.nome)}</div>
                                <div className="text-sm text-gray-600 mb-2">{safeRender(combo.categoria)}</div>
                                <div className="text-xs text-gray-500">{safeRender(combo.descricao)}</div>
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
                                    {item.quantidade}x {item.produto?.nome || 'Produto sem nome'}
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
                            <h4 className="font-medium text-gray-900">{safeRender(field.combo.nome)}</h4>
                            <p className="text-sm text-gray-600">{safeRender(field.combo.categoria)}</p>
                            <div className="text-xs text-gray-500 mt-1">{safeRender(field.combo.descricao)}</div>
                            
                            {/* Produtos incluídos no combo */}
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="text-xs text-gray-500 mb-1">Produtos incluídos:</div>
                              <div className="flex flex-wrap gap-1">
                                {field.combo.produtos.map((item, idx) => (
                                  <span 
                                    key={idx}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                                  >
                                    {item.quantidade}x {item.produto?.nome || 'Produto sem nome'}
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
                {/* Debug Info (apenas para desenvolvimento) */}
                <div className="mb-4 text-xs text-gray-500 space-y-1">
                  <div>Cliente: {clienteSelecionado ? '✅' : '❌'} {clienteSelecionado?.nome || 'Nenhum'}</div>
                  <div>Produtos: {watchedProdutos?.length || 0} item(s)</div>
                  <div>Combos: {watchedCombos?.length || 0} item(s)</div>
                  <div>Formulário válido: {isValid ? '✅' : '❌'}</div>
                  <div>Total: {formatCurrency(totaisCombinados.total)}</div>
                </div>
                
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={!isValid || isGeneratingPDF}
                    onClick={() => {
                      console.log('🔘 Botão clicado');
                      console.log('📊 Estado atual:', {
                        isValid,
                        isGeneratingPDF,
                        clienteSelecionado: clienteSelecionado?.nome,
                        produtos: watchedProdutos?.length,
                        combos: watchedCombos?.length,
                        errors
                      });
                    }}
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
                      console.log('🧹 Limpando formulário...');
                      reset();
                      setClienteSelecionado(null);
                      setBuscarCliente('');
                      setCategoriaSelecionada('');
                      setSubcategoriaSelecionada('');
                      setBuscarProduto('');
                      setBuscarCombo('');
                      toastNotify.success('Formulário limpo!');
                    }}
                    className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Limpar Formulário
                  </button>
                  
                  {/* Botão de debug para testar validação */}
                  <button
                    type="button"
                    onClick={() => {
                      console.log('🔍 Debug - Verificando erros...');
                      console.log('❌ Erros atuais:', errors);
                      console.log('📋 Dados do formulário:', watch());
                      console.log('✅ Formulário válido:', isValid);
                      
                      // Exibir erros específicos
                      if (Object.keys(errors).length > 0) {
                        Object.entries(errors).forEach(([field, error]) => {
                          console.log(`❌ Campo ${field}: ${error?.message}`);
                        });
                        
                        toastNotify.error(`Encontrados ${Object.keys(errors).length} erro(s) no formulário. Verifique o console.`);
                      } else {
                        toastNotify.success('Nenhum erro encontrado no formulário!');
                      }
                    }}
                    className="w-full px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                  >
                    🔍 Debug - Verificar Erros
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
