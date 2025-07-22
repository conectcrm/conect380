import React, { useState, useMemo, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  X, 
  ArrowLeft, 
  ArrowRight,
  Check,
  User, 
  Package, 
  Calculator,
  FileText,
  Search,
  Plus,
  Trash2,
  Edit,
  CreditCard,
  Calendar,
  DollarSign
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Hooks e Services
import { useCalculosProposta } from '../../features/propostas/hooks/useCalculosProposta';
import { propostasService, PropostaCompleta, Vendedor } from '../../features/propostas/services/propostasService';
import { clientesService, Cliente as ClienteService } from '../../services/clientesService';

// Interfaces
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

interface Produto {
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
  produto: Produto;
  quantidade: number;
  desconto: number;
  subtotal: number;
}

interface PropostaFormData {
  titulo?: string; // Novo campo opcional para título da proposta
  vendedor: Vendedor | null; // Novo campo obrigatório para vendedor responsável
  cliente: Cliente | null;
  produtos: ProdutoProposta[];
  descontoGlobal: number;
  impostos: number;
  formaPagamento: 'avista' | 'parcelado' | 'boleto' | 'cartao';
  parcelas?: number;
  validadeDias: number;
  observacoes: string;
  incluirImpostosPDF: boolean;
}

// Schema de validação por etapa
const etapaSchemas = {
  cliente: yup.object().shape({
    vendedor: yup.object().nullable().required('Vendedor responsável é obrigatório'),
    cliente: yup.object().nullable().required('Cliente é obrigatório'),
  }),
  produtos: yup.object().shape({
    produtos: yup.array().min(1, 'Adicione pelo menos um produto à proposta'),
  }),
  condicoes: yup.object().shape({
    formaPagamento: yup.string().required('Forma de pagamento é obrigatória'),
    validadeDias: yup.number().min(1, 'Validade deve ser pelo menos 1 dia').required(),
  }),
  resumo: yup.object().shape({
    // Validação final opcional
  })
};

const schema = yup.object().shape({
  ...etapaSchemas.cliente.fields,
  ...etapaSchemas.produtos.fields,
  ...etapaSchemas.condicoes.fields,
  ...etapaSchemas.resumo.fields,
});

interface ModalNovaPropostaProps {
  isOpen: boolean;
  onClose: () => void;
  onPropostaCriada?: (proposta: PropostaCompleta) => void;
}

export const ModalNovaProposta: React.FC<ModalNovaPropostaProps> = ({
  isOpen,
  onClose,
  onPropostaCriada
}) => {
  // Estados do wizard
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para dados
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoadingClientes, setIsLoadingClientes] = useState(false);
  const [buscarCliente, setBuscarCliente] = useState('');
  
  // Estados para vendedores
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [isLoadingVendedores, setIsLoadingVendedores] = useState(false);
  const [vendedorAtual, setVendedorAtual] = useState<Vendedor | null>(null);
  
  // Estados para produtos
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<Produto[]>([]);
  const [isLoadingProdutos, setIsLoadingProdutos] = useState(false);
  const [buscarProduto, setBuscarProduto] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [tipoSelecionado, setTipoSelecionado] = useState(''); // 'produto', 'combo' ou ''
  const [showProdutoSearch, setShowProdutoSearch] = useState(false);

  // Etapas do wizard
  const etapas = [
    { id: 'cliente', titulo: 'Cliente', icone: User, descricao: 'Selecione o cliente' },
    { id: 'produtos', titulo: 'Produtos', icone: Package, descricao: 'Adicione produtos e serviços' },
    { id: 'condicoes', titulo: 'Condições', icone: Calculator, descricao: 'Configure condições e totais' },
    { id: 'resumo', titulo: 'Resumo', icone: FileText, descricao: 'Revise e gere a proposta' }
  ];

  // React Hook Form
  const { control, handleSubmit, watch, setValue, reset, formState: { errors, isValid } } = useForm<PropostaFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      titulo: '', // Será preenchido automaticamente
      vendedor: null, // Será preenchido com vendedor atual
      cliente: null,
      produtos: [],
      descontoGlobal: 0,
      impostos: 12,
      formaPagamento: 'avista',
      validadeDias: 15,
      observacoes: '',
      incluirImpostosPDF: true
    },
    mode: 'onChange'
  });

  // Field arrays
  const { fields: produtos, append: adicionarProduto, remove: removerProduto } = useFieldArray({
    control,
    name: 'produtos'
  });

  // Watch dos campos
  const watchedTitulo = watch('titulo');
  const watchedVendedor = watch('vendedor');
  const watchedCliente = watch('cliente');
  const watchedProdutos = watch('produtos');
  const watchedDescontoGlobal = watch('descontoGlobal');
  const watchedImpostos = watch('impostos');

  // Hook de cálculos
  const { totais: totaisCombinados } = useCalculosProposta(
    watchedProdutos || [],
    watchedDescontoGlobal || 0,
    watchedImpostos || 12
  );

  // Carregar clientes
  useEffect(() => {
    if (isOpen) {
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
        } catch (error) {
          console.error('❌ Erro ao carregar clientes:', error);
          toast.error('Erro ao carregar clientes');
        } finally {
          setIsLoadingClientes(false);
        }
      };

      carregarClientes();
    }
  }, [isOpen]);

  // Carregar vendedores e vendedor atual
  useEffect(() => {
    if (isOpen) {
      const carregarVendedores = async () => {
        try {
          setIsLoadingVendedores(true);
          
          // Carregar lista de vendedores
          const vendedores = await propostasService.obterVendedores();
          setVendedores(vendedores);
          
          // Carregar vendedor atual (usuário logado)
          const vendedorAtual = await propostasService.obterVendedorAtual();
          setVendedorAtual(vendedorAtual);
          
          // Definir vendedor atual como padrão
          if (vendedorAtual) {
            setValue('vendedor', vendedorAtual);
          }
        } catch (error) {
          console.error('❌ Erro ao carregar vendedores:', error);
          toast.error('Erro ao carregar vendedores');
        } finally {
          setIsLoadingVendedores(false);
        }
      };

      carregarVendedores();
    }
  }, [isOpen, setValue]);

  // Carregar produtos
  useEffect(() => {
    if (isOpen) {
      const carregarProdutos = async () => {
        try {
          setIsLoadingProdutos(true);
          const produtosCarregados = await propostasService.obterProdutos();
          setProdutosDisponiveis(produtosCarregados);
          console.log(`📦 ${produtosCarregados.length} produtos carregados para propostas`);
        } catch (error) {
          console.error('❌ Erro ao carregar produtos:', error);
          toast.error('Erro ao carregar produtos');
        } finally {
          setIsLoadingProdutos(false);
        }
      };

      carregarProdutos();
    }
  }, [isOpen]);

  // Reset form quando modal abre
  useEffect(() => {
    if (isOpen) {
      reset();
      setEtapaAtual(0);
      setBuscarCliente('');
      setBuscarProduto('');
      setCategoriaSelecionada('');
      setTipoSelecionado('');
      setShowProdutoSearch(false);
    }
  }, [isOpen, reset]);

  // Gerar título automático quando cliente for selecionado
  useEffect(() => {
    if (watchedCliente && (!watchedTitulo || watchedTitulo === '')) {
      const tituloAutomatico = propostasService.gerarTituloAutomatico(watchedCliente);
      setValue('titulo', tituloAutomatico);
    }
  }, [watchedCliente, watchedTitulo, setValue]);

  // Filtrar clientes
  const clientesFiltrados = useMemo(() => {
    if (!buscarCliente) return clientes;
    return clientes.filter(cliente =>
      cliente.nome.toLowerCase().includes(buscarCliente.toLowerCase()) ||
      cliente.documento.includes(buscarCliente) ||
      cliente.email.toLowerCase().includes(buscarCliente.toLowerCase())
    );
  }, [buscarCliente, clientes]);

  // Filtrar produtos
  const produtosFiltrados = useMemo(() => {
    let filtered = produtosDisponiveis;
    
    if (categoriaSelecionada) {
      filtered = filtered.filter(p => p.categoria === categoriaSelecionada);
    }
    
    if (tipoSelecionado) {
      filtered = filtered.filter(p => p.tipo === tipoSelecionado);
    }
    
    if (buscarProduto) {
      filtered = filtered.filter(p =>
        p.nome.toLowerCase().includes(buscarProduto.toLowerCase()) ||
        p.categoria.toLowerCase().includes(buscarProduto.toLowerCase()) ||
        p.descricao?.toLowerCase().includes(buscarProduto.toLowerCase())
      );
    }
    
    return filtered;
  }, [produtosDisponiveis, buscarProduto, categoriaSelecionada, tipoSelecionado]);

  // Categorias únicas
  const categorias = useMemo(() => {
    return [...new Set(produtosDisponiveis.map(p => p.categoria))];
  }, [produtosDisponiveis]);

  // Funções auxiliares
  const handleSelecionarCliente = (cliente: Cliente) => {
    setValue('cliente', cliente);
    setBuscarCliente('');
    toast.success(`Cliente ${cliente.nome} selecionado!`);
  };

  const handleAdicionarProduto = (produto: Produto) => {
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

  const calcularSubtotalProduto = (produto: Produto, quantidade: number, desconto: number) => {
    const subtotalBruto = produto.preco * quantidade;
    const descontoValor = (subtotalBruto * desconto) / 100;
    return subtotalBruto - descontoValor;
  };

  // Validar etapa atual
  const validarEtapa = async (etapa: number) => {
    const etapaKey = Object.keys(etapaSchemas)[etapa] as keyof typeof etapaSchemas;
    try {
      await etapaSchemas[etapaKey].validate(watch(), { abortEarly: false });
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        error.errors.forEach(err => toast.error(err));
      }
      return false;
    }
  };

  // Navegação entre etapas
  const proximaEtapa = async () => {
    const etapaValida = await validarEtapa(etapaAtual);
    if (etapaValida && etapaAtual < etapas.length - 1) {
      setEtapaAtual(etapaAtual + 1);
    }
  };

  const etapaAnterior = () => {
    if (etapaAtual > 0) {
      setEtapaAtual(etapaAtual - 1);
    }
  };

  // Submissão final
  const onSubmit = async (data: PropostaFormData) => {
    try {
      setIsLoading(true);
      
      const propostaData: PropostaCompleta = {
        ...data,
        subtotal: totaisCombinados.subtotal,
        total: totaisCombinados.total,
        dataValidade: new Date(Date.now() + data.validadeDias * 24 * 60 * 60 * 1000),
        status: 'rascunho'
      };

      const propostaCriada = await propostasService.criarProposta(propostaData);
      
      toast.success(`Proposta ${propostaCriada.numero} criada com sucesso!`);
      
      if (onPropostaCriada) {
        onPropostaCriada(propostaCriada);
      }
      
      onClose();
    } catch (error) {
      console.error('❌ Erro ao criar proposta:', error);
      toast.error('Erro ao criar proposta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 md:p-6">
      <div className="modal-content modal-nova-proposta bg-white rounded-xl shadow-2xl w-full max-w-5xl mx-auto h-[80vh] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header do Modal */}
        <div className="bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white p-4 md:p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">Nova Proposta</h2>
              <p className="text-blue-100 text-sm md:text-base">Crie uma proposta comercial personalizada</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1"
            >
              <X className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 md:mt-6">
            <div className="flex items-center justify-between gap-2 md:gap-4 mb-2">
              {etapas.map((etapa, index) => {
                const Icone = etapa.icone;
                const isAtual = index === etapaAtual;
                const isConcluida = index < etapaAtual;
                
                return (
                  <div key={etapa.id} className="flex items-center flex-1 min-w-0">
                    <div className={`flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full border-2 transition-colors flex-shrink-0 ${
                      isConcluida 
                        ? 'bg-white text-[#159A9C] border-white' 
                        : isAtual 
                        ? 'bg-white text-[#159A9C] border-white' 
                        : 'bg-transparent text-white border-white/50'
                    }`}>
                      {isConcluida ? (
                        <Check className="h-3 w-3 md:h-4 md:w-4" />
                      ) : (
                        <Icone className="h-3 w-3 md:h-4 md:w-4" />
                      )}
                    </div>
                    <span className={`ml-1 md:ml-2 text-xs md:text-sm font-medium truncate ${
                      isAtual ? 'text-white' : 'text-blue-100'
                    }`}>
                      {etapa.titulo}
                    </span>
                    {index < etapas.length - 1 && (
                      <div className={`w-4 md:w-8 h-0.5 mx-1 md:mx-4 transition-colors flex-shrink-0 ${
                        isConcluida ? 'bg-white' : 'bg-white/30'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Conteúdo das Etapas */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">{/* Aqui vai todo o conteúdo das etapas existente */}
          {/* Etapa 1: Seleção de Cliente */}
          {etapaAtual === 0 && (
            <div className="space-y-4 md:space-y-6">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-6">Informações da Proposta</h3>
                
                {/* Campo Título da Proposta */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título da Proposta
                    <span className="text-xs text-gray-500 font-normal ml-2">
                      (Opcional - será gerado automaticamente se não preenchido)
                    </span>
                  </label>
                  <Controller
                    name="titulo"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="Ex: João Silva - 21/07/2025"
                        className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                      />
                    )}
                  />
                  {watchedTitulo && (
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Título atual:</strong> {watchedTitulo}
                    </p>
                  )}
                </div>

                {/* Campo Vendedor Responsável */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendedor Responsável *
                    <span className="text-xs text-gray-500 font-normal ml-2">
                      (Selecionado automaticamente com seu usuário)
                    </span>
                  </label>
                  
                  {isLoadingVendedores ? (
                    <div className="p-4 text-center text-gray-500 flex items-center justify-center border border-gray-300 rounded-lg">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#159A9C] mr-2"></div>
                      Carregando vendedores...
                    </div>
                  ) : (
                    <Controller
                      name="vendedor"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          value={field.value?.id || ''}
                          onChange={(e) => {
                            const vendedorSelecionado = vendedores.find(v => v.id === e.target.value);
                            field.onChange(vendedorSelecionado || null);
                          }}
                          className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                        >
                          <option value="">Selecione um vendedor</option>
                          {vendedores.map((vendedor) => (
                            <option key={vendedor.id} value={vendedor.id}>
                              {vendedor.nome} ({vendedor.tipo})
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  )}
                  
                  {errors.vendedor && (
                    <p className="text-red-500 text-sm mt-2">{errors.vendedor.message}</p>
                  )}

                  {/* Resumo do Vendedor Selecionado */}
                  {watchedVendedor && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900 mb-1 flex items-center">
                            <Check className="h-4 w-4 mr-2" />
                            Vendedor Selecionado
                          </h4>
                          <div className="text-sm text-blue-700">
                            <div><strong>Nome:</strong> {watchedVendedor.nome}</div>
                            <div><strong>Email:</strong> {watchedVendedor.email}</div>
                            <div><strong>Tipo:</strong> {watchedVendedor.tipo}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <hr className="border-gray-200 my-6" />
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Selecionar Cliente</h4>
                
                {/* Campo de busca do cliente */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar Cliente
                      <span className="text-xs text-gray-500 font-normal ml-2">
                        (Digite para filtrar ou visualize todos abaixo)
                      </span>
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Nome, documento ou email..."
                        value={buscarCliente}
                        onChange={(e) => setBuscarCliente(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Lista de Cards de Clientes */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Selecione o Cliente *
                      </label>
                      {clientesFiltrados.length > 0 && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''} 
                          {buscarCliente ? ' encontrado' : ' disponível'}{clientesFiltrados.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Container dos Cards */}
                    <div className="border border-gray-200 rounded-lg bg-gray-50 max-h-[300px] overflow-y-auto">
                      {isLoadingClientes ? (
                        <div className="p-8 text-center text-gray-500 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#159A9C] mr-2"></div>
                          Carregando clientes...
                        </div>
                      ) : clientesFiltrados.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <div className="font-medium">
                            {buscarCliente ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                          </div>
                          {buscarCliente && (
                            <div className="text-sm mt-1">
                              Tente ajustar os termos de busca
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-2 space-y-2">
                          {clientesFiltrados.map((cliente) => {
                            const isSelected = watchedCliente?.id === cliente.id;
                            return (
                              <div
                                key={cliente.id}
                                onClick={() => handleSelecionarCliente(cliente)}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                                  isSelected 
                                    ? 'border-[#159A9C] bg-[#159A9C]/5 shadow-sm' 
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    {/* Nome do Cliente */}
                                    <div className="flex items-center mb-2">
                                      <h4 className={`font-semibold text-sm truncate ${
                                        isSelected ? 'text-[#159A9C]' : 'text-gray-900'
                                      }`}>
                                        {cliente.nome}
                                      </h4>
                                      {isSelected && (
                                        <Check className="h-4 w-4 text-[#159A9C] ml-2 flex-shrink-0" />
                                      )}
                                    </div>

                                    {/* Informações do Cliente */}
                                    <div className="space-y-1">
                                      {/* Documento */}
                                      <div className="flex items-center text-xs text-gray-600">
                                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium mr-2 ${
                                          cliente.tipoPessoa === 'fisica' 
                                            ? 'bg-blue-100 text-blue-700' 
                                            : 'bg-green-100 text-green-700'
                                        }`}>
                                          {cliente.tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'}
                                        </span>
                                        <span className="truncate">{cliente.documento}</span>
                                      </div>

                                      {/* Email */}
                                      <div className="flex items-center text-xs text-gray-600">
                                        <span className="w-12 text-gray-500">Email:</span>
                                        <span className="truncate">{cliente.email}</span>
                                      </div>

                                      {/* Telefone */}
                                      {cliente.telefone && (
                                        <div className="flex items-center text-xs text-gray-600">
                                          <span className="w-12 text-gray-500">Tel:</span>
                                          <span className="truncate">{cliente.telefone}</span>
                                        </div>
                                      )}

                                      {/* Endereço (se disponível) */}
                                      {cliente.endereco && (
                                        <div className="flex items-center text-xs text-gray-500 mt-2">
                                          <span className="w-12">End:</span>
                                          <span className="truncate">{cliente.endereco}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Indicador Visual */}
                                  <div className="ml-3 flex-shrink-0">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                      isSelected 
                                        ? 'border-[#159A9C] bg-[#159A9C]' 
                                        : 'border-gray-300'
                                    }`}>
                                      {isSelected && (
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {errors.cliente && (
                    <p className="text-red-500 text-sm mt-2">{errors.cliente.message}</p>
                  )}

                  {/* Resumo do Cliente Selecionado */}
                  {watchedCliente && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-green-900 mb-2 flex items-center">
                            <Check className="h-4 w-4 mr-2" />
                            Cliente Selecionado
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div><strong>Nome:</strong> {watchedCliente.nome}</div>
                            <div><strong>Documento:</strong> {watchedCliente.documento}</div>
                            <div><strong>Email:</strong> {watchedCliente.email}</div>
                            <div><strong>Telefone:</strong> {watchedCliente.telefone}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setValue('cliente', null);
                            setBuscarCliente('');
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors ml-4"
                          title="Remover cliente selecionado"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Etapa 2: Produtos e Serviços */}
          {etapaAtual === 1 && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">Produtos e Serviços</h3>
                <button
                  onClick={() => setShowProdutoSearch(!showProdutoSearch)}
                  className="flex items-center justify-center space-x-2 text-[#159A9C] font-medium px-4 py-2 border border-[#159A9C] rounded-lg hover:bg-[#159A9C] hover:text-white transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar Produto</span>
                </button>
              </div>

              {/* Busca de Produtos */}
              {showProdutoSearch && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Filtro por tipo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo
                      </label>
                      <select
                        value={tipoSelecionado}
                        onChange={(e) => setTipoSelecionado(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                      >
                        <option value="">Todos os tipos</option>
                        <option value="produto">Produtos</option>
                        <option value="combo">Combos</option>
                      </select>
                    </div>
                    
                    {/* Filtro por categoria */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoria
                      </label>
                      <select
                        value={categoriaSelecionada}
                        onChange={(e) => setCategoriaSelecionada(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                      >
                        <option value="">Todas as categorias</option>
                        {categorias.map(categoria => (
                          <option key={categoria} value={categoria}>{categoria}</option>
                        ))}
                      </select>
                    </div>

                    {/* Busca textual */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Buscar
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Nome, categoria ou descrição..."
                          value={buscarProduto}
                          onChange={(e) => setBuscarProduto(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="flex items-center justify-between text-sm text-gray-600 bg-white px-3 py-2 rounded border">
                    <div className="flex items-center gap-4">
                      <span>
                        <strong>{produtosFiltrados.length}</strong> itens encontrados
                      </span>
                      <span>•</span>
                      <span>
                        {produtosFiltrados.filter(p => p.tipo === 'produto').length} produtos
                      </span>
                      <span>•</span>
                      <span>
                        {produtosFiltrados.filter(p => p.tipo === 'combo').length} combos
                      </span>
                    </div>
                    {(tipoSelecionado || categoriaSelecionada || buscarProduto) && (
                      <button
                        onClick={() => {
                          setTipoSelecionado('');
                          setCategoriaSelecionada('');
                          setBuscarProduto('');
                        }}
                        className="text-[#159A9C] hover:text-[#0F7173] font-medium"
                      >
                        Limpar filtros
                      </button>
                    )}
                  </div>

                  {/* Lista de produtos */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                    {isLoadingProdutos ? (
                      <div className="col-span-2 p-8 text-center text-gray-500 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#159A9C] mr-2"></div>
                        Carregando produtos...
                      </div>
                    ) : produtosFiltrados.length === 0 ? (
                      <div className="col-span-2 p-8 text-center text-gray-500">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <div className="font-medium">
                          {buscarProduto ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                        </div>
                        {buscarProduto && (
                          <div className="text-sm mt-1">
                            Tente ajustar os termos de busca
                          </div>
                        )}
                        {!buscarProduto && (
                          <div className="text-sm mt-1">
                            Cadastre produtos na tela de produtos para vê-los aqui
                          </div>
                        )}
                      </div>
                    ) : (
                      produtosFiltrados.map((produto) => (
                      <div
                        key={produto.id}
                        onClick={() => handleAdicionarProduto(produto)}
                        className={`product-card p-4 border rounded-lg hover:bg-white cursor-pointer transition-colors ${
                          produto.tipo === 'combo' 
                            ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="product-name font-medium text-gray-900">{produto.nome}</div>
                            {produto.tipo === 'combo' && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">
                                <Package className="w-3 h-3" />
                                COMBO
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-[#159A9C]">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco)}
                            </div>
                            {produto.tipo === 'combo' && produto.precoOriginal && (
                              <div className="text-sm text-gray-500 line-through">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.precoOriginal)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="product-description text-sm text-gray-600 mb-2">{produto.descricao}</div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            <span className={`px-2 py-1 text-xs rounded ${
                              produto.tipo === 'combo' 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {produto.categoria}
                            </span>
                            {produto.subcategoria && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                {produto.subcategoria}
                              </span>
                            )}
                            {produto.tipo === 'combo' && produto.desconto && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                                -{produto.desconto.toFixed(1)}%
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {produto.unidade}
                          </div>
                        </div>
                      </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Lista de produtos adicionados */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Produtos Adicionados</h4>
                {produtos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    Nenhum produto adicionado. Clique em "Adicionar Produto" para começar.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {produtos.map((field, index) => (
                      <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium text-gray-900">{field.produto.nome}</h5>
                              {field.produto.tipo === 'combo' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">
                                  <Package className="w-3 h-3" />
                                  COMBO
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{field.produto.descricao}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Quantidade
                                </label>
                                <Controller
                                  name={`produtos.${index}.quantidade`}
                                  control={control}
                                  render={({ field: controllerField }) => (
                                    <input
                                      {...controllerField}
                                      type="number"
                                      min="1"
                                      step="1"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                                      onChange={(e) => {
                                        const quantidade = parseInt(e.target.value) || 1;
                                        controllerField.onChange(quantidade);
                                        const produtoAtual = watchedProdutos?.[index];
                                        if (produtoAtual) {
                                          const subtotal = calcularSubtotalProduto(
                                            produtoAtual.produto, 
                                            quantidade, 
                                            produtoAtual.desconto || 0
                                          );
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
                                  render={({ field: controllerField }) => (
                                    <input
                                      {...controllerField}
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                                      onChange={(e) => {
                                        const desconto = parseFloat(e.target.value) || 0;
                                        controllerField.onChange(desconto);
                                        const produtoAtual = watchedProdutos?.[index];
                                        if (produtoAtual) {
                                          const subtotal = calcularSubtotalProduto(
                                            produtoAtual.produto, 
                                            produtoAtual.quantidade || 1, 
                                            desconto
                                          );
                                          setValue(`produtos.${index}.subtotal`, subtotal);
                                        }
                                      }}
                                    />
                                  )}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Subtotal
                                </label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-medium text-[#159A9C]">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(field.subtotal)}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => removerProduto(index)}
                            className="text-red-500 hover:text-red-700 ml-4 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {errors.produtos && (
                  <p className="text-red-500 text-sm mt-2">{errors.produtos.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Etapa 3: Condições e Totais */}
          {etapaAtual === 2 && (
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">Condições e Totais</h3>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Condições */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Condições</h4>
                  
                  {/* Desconto Global */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Desconto Global (%)
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                        />
                      )}
                    />
                  </div>

                  {/* Impostos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                        />
                      )}
                    />
                  </div>

                  {/* Forma de Pagamento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Forma de Pagamento *
                    </label>
                    <Controller
                      name="formaPagamento"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                        >
                          <option value="avista">À Vista</option>
                          <option value="parcelado">Parcelado</option>
                          <option value="boleto">Boleto</option>
                          <option value="cartao">Cartão</option>
                        </select>
                      )}
                    />
                    {errors.formaPagamento && (
                      <p className="text-red-500 text-sm mt-1">{errors.formaPagamento.message}</p>
                    )}
                  </div>

                  {/* Validade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Validade (dias) *
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                        />
                      )}
                    />
                    {errors.validadeDias && (
                      <p className="text-red-500 text-sm mt-1">{errors.validadeDias.message}</p>
                    )}
                  </div>

                  {/* Observações */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observações
                    </label>
                    <Controller
                      name="observacoes"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="Observações adicionais sobre a proposta..."
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Totais */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Totais</h4>
                  
                  <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totaisCombinados.subtotal)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Desconto:</span>
                      <span className="font-medium text-red-600">
                        -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totaisCombinados.desconto)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Impostos:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totaisCombinados.impostos)}
                      </span>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold text-gray-900">Total:</span>
                        <span className="text-lg font-bold text-[#159A9C]">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totaisCombinados.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Etapa 4: Resumo */}
          {etapaAtual === 3 && (
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">Resumo da Proposta</h3>

              {/* Cliente */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Cliente
                </h4>
                {watchedCliente && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div><strong>Nome:</strong> {watchedCliente.nome}</div>
                    <div><strong>Email:</strong> {watchedCliente.email}</div>
                    <div><strong>Documento:</strong> {watchedCliente.documento}</div>
                    <div><strong>Telefone:</strong> {watchedCliente.telefone}</div>
                  </div>
                )}
              </div>

              {/* Produtos */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Produtos ({produtos.length})
                </h4>
                <div className="space-y-2">
                  {produtos.map((produto, index) => (
                    <div key={produto.id} className="flex justify-between text-sm">
                      <span>{produto.produto.nome} (x{produto.quantidade})</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totais */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Calculator className="h-4 w-4 mr-2" />
                  Totais
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totaisCombinados.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Desconto Global ({watchedDescontoGlobal}%):</span>
                    <span className="text-red-600">-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totaisCombinados.desconto)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impostos ({watchedImpostos}%):</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totaisCombinados.impostos)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-[#159A9C]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totaisCombinados.total)}</span>
                  </div>
                </div>
              </div>

              {/* Condições */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Condições
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div><strong>Forma de Pagamento:</strong> {watch('formaPagamento')}</div>
                  <div><strong>Validade:</strong> {watch('validadeDias')} dias</div>
                  {watch('observacoes') && (
                    <div className="md:col-span-2"><strong>Observações:</strong> {watch('observacoes')}</div>
                  )}
                </div>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Footer com botões de navegação */}
        <div className="border-t border-gray-200 p-4 md:p-6 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-xs md:text-sm text-gray-500">
              Etapa {etapaAtual + 1} de {etapas.length}
            </div>

            <div className="flex items-center space-x-2 md:space-x-3">
              {etapaAtual > 0 && (
                <button
                  onClick={etapaAnterior}
                  className="flex items-center px-3 md:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Anterior</span>
                  <span className="sm:hidden">Ant.</span>
                </button>
              )}

              {etapaAtual < etapas.length - 1 ? (
                <button
                  onClick={proximaEtapa}
                  className="flex items-center px-4 md:px-6 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm"
                >
                  <span className="hidden sm:inline">Próximo</span>
                  <span className="sm:hidden">Próx.</span>
                  <ArrowRight className="h-4 w-4 ml-1 md:ml-2" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isLoading || !isValid}
                  className="flex items-center px-4 md:px-6 py-2 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white rounded-lg hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1 md:mr-2"></div>
                      <span className="hidden sm:inline">Criando...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Gerar Proposta</span>
                      <span className="sm:hidden">Gerar</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
