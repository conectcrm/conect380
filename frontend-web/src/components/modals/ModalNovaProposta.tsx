import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useI18n } from '../../contexts/I18nContext';
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
  DollarSign,
  Eye,
  Save,
  MessageCircle,
  Mail
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Hooks e Services
import { useCalculosProposta } from '../../features/propostas/hooks/useCalculosProposta';
import { propostasService, PropostaCompleta, Vendedor } from '../../features/propostas/services/propostasService';
import { clientesService, Cliente as ClienteService } from '../../services/clientesService';
import { emailServiceReal } from '../../services/emailServiceReal';
import { gerarTokenNumerico } from '../../utils/tokenUtils';
import { BadgeProdutoSoftware } from '../common/BadgeProdutoSoftware';

// Novos componentes otimizados
import ClienteSearchOptimizedV2 from '../search/ClienteSearchOptimizedV2';
import ResponsiveStepIndicator from '../navigation/ResponsiveStepIndicator';
import ModalCadastroCliente from './ModalCadastroCliente';

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
  // Propriedades opcionais para compatibilidade com o search component
  observacoes?: string;
  ativo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  subcategoria?: string;
  tipo?: 'produto' | 'combo' | 'software'; // Adicionando software
  descricao?: string;
  unidade: string; // Mudando para obrigatório para compatibilidade
  // Campos específicos para software
  tipoItem?: 'produto' | 'servico' | 'licenca' | 'modulo' | 'aplicativo';
  tipoLicenciamento?: string;
  periodicidadeLicenca?: string;
  renovacaoAutomatica?: boolean;
  quantidadeLicencas?: number;
  // Campos para combos
  precoOriginal?: number;
  desconto?: number;
  produtosCombo?: Produto[];
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

// Função auxiliar para detectar se é produto de software
const isProdutoSoftware = (produto: Produto): boolean => {
  return produto.tipo === 'software' ||
    produto.categoria?.toLowerCase().includes('software') ||
    (produto.tipoItem && ['licenca', 'modulo', 'aplicativo'].includes(produto.tipoItem));
};

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
    validadeDias: yup.number().when('produtos', {
      is: (produtos: ProdutoProposta[]) =>
        produtos && produtos.some(produto => isProdutoSoftware(produto.produto)),
      then: () => yup.number().optional(), // Opcional para software
      otherwise: () => yup.number().min(1, 'Validade deve ser pelo menos 1 dia').required()
    }),
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
  // Hook de internacionalização
  const { t } = useI18n();

  // Estados principais
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para dados
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoadingClientes, setIsLoadingClientes] = useState(false);
  const [buscarCliente, setBuscarCliente] = useState('');

  // Estado para modal de cadastro de cliente
  const [isModalCadastroClienteOpen, setIsModalCadastroClienteOpen] = useState(false);

  // Estados para vendedores
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [isLoadingVendedores, setIsLoadingVendedores] = useState(false);
  const [vendedorAtual, setVendedorAtual] = useState<Vendedor | null>(null);
  const vendedoresCarregadosRef = useRef(false);

  // Refs para controle de carregamento
  const clientesCarregadosRef = useRef(false);
  const produtosCarregadosRef = useRef(false);

  // Estados para produtos
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<Produto[]>([]);
  const [isLoadingProdutos, setIsLoadingProdutos] = useState(false);
  const [buscarProduto, setBuscarProduto] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [tipoSelecionado, setTipoSelecionado] = useState(''); // 'produto', 'combo' ou ''
  const [showProdutoSearch, setShowProdutoSearch] = useState(false);

  // Etapas do wizard
  const etapas = [
    { id: 'cliente', titulo: 'Cliente', icone: User },
    { id: 'produtos', titulo: 'Produtos', icone: Package },
    { id: 'condicoes', titulo: 'Condições', icone: Calculator },
    { id: 'resumo', titulo: 'Resumo', icone: FileText }
  ];

  // React Hook Form
  const { control, handleSubmit, watch, setValue, getValues, reset, formState: { errors, isValid } } = useForm<PropostaFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      titulo: '', // Será preenchido automaticamente
      vendedor: null, // Será preenchido com vendedor atual
      cliente: null,
      produtos: [],
      descontoGlobal: 0,
      impostos: 12,
      formaPagamento: 'avista',
      validadeDias: 15, // Valor padrão, será opcional para software
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

  // Watch dos campos com otimização
  const watchedTitulo = watch('titulo');
  const watchedVendedor = watch('vendedor');
  const watchedCliente = watch('cliente');
  const watchedProdutos = watch('produtos');
  const watchedDescontoGlobal = watch('descontoGlobal');
  const watchedImpostos = watch('impostos');

  // Memoização do vendedor para evitar re-renders
  const vendedorMemoized = useMemo(() => watchedVendedor, [watchedVendedor?.id]);

  // Hook de cálculos
  const { totais: totaisCombinados } = useCalculosProposta(
    watchedProdutos || [],
    watchedDescontoGlobal || 0,
    watchedImpostos || 12
  );

  // Callbacks memorizados para evitar re-renderizações
  const handleClienteSelect = useCallback((cliente: Cliente) => {
    setValue('cliente', cliente);
  }, [setValue]);

  const handleNewCliente = useCallback(() => {
    setIsModalCadastroClienteOpen(true);
  }, []);

  const handleCloseModalCadastroCliente = useCallback(() => {
    setIsModalCadastroClienteOpen(false);
  }, []);

  const handleReloadClientes = useCallback(async () => {
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
        tipoPessoa: cliente.tipo === 'pessoa_fisica' ? 'fisica' : 'juridica',
        observacoes: cliente.observacoes || '',
        ativo: true, // Default para ativo
        createdAt: cliente.created_at || new Date().toISOString(),
        updatedAt: cliente.updated_at || new Date().toISOString()
      }));

      setClientes(clientesFormatados);
      toast.success(`${clientesFormatados.length} clientes atualizados`);
    } catch (error) {
      console.error('Erro ao recarregar clientes:', error);
      toast.error('Erro ao recarregar clientes');
    } finally {
      setIsLoadingClientes(false);
    }
  }, []);

  const handleSaveNewCliente = useCallback(async (clienteData: any) => {
    try {
      setIsLoading(true);

      // Criar o novo cliente
      const novoCliente = await clientesService.createCliente(clienteData);

      // Atualizar a lista de clientes
      await handleReloadClientes();

      // Selecionar automaticamente o cliente recém-criado
      if (novoCliente) {
        const clienteFormatado: Cliente = {
          id: novoCliente.id || '',
          nome: novoCliente.nome,
          documento: novoCliente.documento || '',
          email: novoCliente.email,
          telefone: novoCliente.telefone || '',
          endereco: novoCliente.endereco || '',
          cidade: novoCliente.cidade || '',
          estado: novoCliente.estado || '',
          cep: novoCliente.cep || '',
          tipoPessoa: novoCliente.tipo === 'pessoa_fisica' ? 'fisica' : 'juridica',
          observacoes: novoCliente.observacoes || '',
          ativo: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setValue('cliente', clienteFormatado);

        toast.success('Cliente cadastrado e selecionado com sucesso!');
      }

      // Fechar o modal
      setIsModalCadastroClienteOpen(false);

    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast.error('Erro ao cadastrar cliente. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [setValue, handleReloadClientes]);

  // Callback otimizado para mudança de vendedor
  const handleVendedorChange = useCallback((vendedorId: string, onChange: (value: any) => void) => {
    const vendedorSelecionado = vendedores.find(v => v.id === vendedorId);
    onChange(vendedorSelecionado || null);
  }, [vendedores]);

  // Consolidado: Reset e carregamento de dados ao abrir modal (SEM DEPENDÊNCIAS EXTRAS)
  useEffect(() => {
    if (isOpen) {
      // 1. Reset form preservando vendedor selecionado
      const vendedorSelecionado = getValues('vendedor');
      reset({
        titulo: '',
        vendedor: vendedorSelecionado ?? null,
        cliente: null,
        produtos: [],
        descontoGlobal: 0,
        impostos: 12,
        formaPagamento: 'avista',
        validadeDias: 15,
        observacoes: '',
        incluirImpostosPDF: true
      });

      // 2. Reset UI states
      setEtapaAtual(0);
      setBuscarCliente('');
      setBuscarProduto('');
      setCategoriaSelecionada('');
      setTipoSelecionado('');
      setShowProdutoSearch(false);

      // 3. Carregar dados apenas se não carregados
      const carregarDados = async () => {
        try {
          // Carregar vendedores
          if (!vendedoresCarregadosRef.current) {
            setIsLoadingVendedores(true);
            vendedoresCarregadosRef.current = true;

            const [vendedoresList, vendedorAtual] = await Promise.all([
              propostasService.obterVendedores(),
              propostasService.obterVendedorAtual()
            ]);

            setVendedores(vendedoresList);
            setVendedorAtual(vendedorAtual);

            // Só seta o vendedor se o campo estiver vazio
            const vendedorAtualForm = getValues('vendedor');
            if (vendedorAtual && (vendedorAtualForm === null || vendedorAtualForm === undefined)) {
              setValue('vendedor', vendedorAtual, { shouldDirty: false, shouldTouch: false });
            }
            setIsLoadingVendedores(false);
          }

          // Carregar clientes
          if (!clientesCarregadosRef.current) {
            setIsLoadingClientes(true);
            clientesCarregadosRef.current = true;

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
            setIsLoadingClientes(false);
          }

          // Carregar produtos
          if (!produtosCarregadosRef.current) {
            setIsLoadingProdutos(true);
            produtosCarregadosRef.current = true;

            const produtosCarregados = await propostasService.obterProdutos();
            setProdutosDisponiveis(produtosCarregados);
            setIsLoadingProdutos(false);
          }
        } catch (error) {
          console.error('Erro ao carregar dados:', error);
          toast.error('Erro ao carregar dados');
          // Reset refs em caso de erro
          vendedoresCarregadosRef.current = false;
          clientesCarregadosRef.current = false;
          produtosCarregadosRef.current = false;
          setIsLoadingVendedores(false);
          setIsLoadingClientes(false);
          setIsLoadingProdutos(false);
        }
      };

      carregarDados();
    } else {
      // Ao fechar o modal, resetar refs para próxima abertura
      vendedoresCarregadosRef.current = false;
      clientesCarregadosRef.current = false;
      produtosCarregadosRef.current = false;
    }
  }, [isOpen]); // APENAS isOpen como dependência

  // Gerar título automático quando cliente for selecionado com controle otimizado
  useEffect(() => {
    if (watchedCliente && (!watchedTitulo || watchedTitulo === '')) {
      const tituloAutomatico = propostasService.gerarTituloAutomatico(watchedCliente);
      setValue('titulo', tituloAutomatico, { shouldValidate: false });
    }
  }, [watchedCliente?.id, setValue]); // Otimizado com ID do cliente

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

  // Handlers para as novas ações da última etapa
  const handlePreview = async () => {
    try {
      const formData = watch();

      // Verificar se há produtos de software
      const temProdutosSoftware = formData.produtos?.some(produto => isProdutoSoftware(produto.produto));
      const validadeDias = temProdutosSoftware && !formData.validadeDias ? 30 : (formData.validadeDias || 15);

      const propostaData: PropostaCompleta = {
        ...formData,
        validadeDias,
        status: 'rascunho',
        dataValidade: new Date(Date.now() + validadeDias * 24 * 60 * 60 * 1000),
        subtotal: totaisCombinados.subtotal,
        total: totaisCombinados.total,
        vendedor: formData.vendedor || { id: '', nome: 'Vendedor Padrão', email: '', tipo: 'vendedor' as const, ativo: true }
      };

      const previewResult = await propostasService.previewProposta(JSON.stringify(propostaData));

      // Abrir preview em nova janela
      const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
      if (previewWindow) {
        previewWindow.document.write(previewResult.html);
        previewWindow.document.close();
      }

      toast.success('Preview gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
      toast.error('Erro ao gerar preview da proposta');
    }
  };

  const handleSaveAsDraft = async () => {
    try {
      const formData = watch();

      // Verificar se há produtos de software
      const temProdutosSoftware = formData.produtos?.some(produto => isProdutoSoftware(produto.produto));
      const validadeDias = temProdutosSoftware && !formData.validadeDias ? 30 : (formData.validadeDias || 15);

      const propostaData: PropostaCompleta = {
        ...formData,
        validadeDias,
        status: 'rascunho',
        dataValidade: new Date(Date.now() + validadeDias * 24 * 60 * 60 * 1000),
        subtotal: totaisCombinados.subtotal,
        total: totaisCombinados.total,
        vendedor: formData.vendedor || { id: '', nome: 'Vendedor Padrão', email: '', tipo: 'vendedor' as const, ativo: true }
      };

      await propostasService.criarProposta(propostaData);
      toast.success('Proposta salva como rascunho!');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
      toast.error('Erro ao salvar proposta como rascunho');
    }
  };

  const handleSendWhatsApp = async () => {
    try {
      const formData = watch();

      if (!formData.cliente?.telefone) {
        toast.error('Cliente precisa ter telefone cadastrado para envio via WhatsApp');
        return;
      }

      // Verificar se há produtos de software
      const temProdutosSoftware = formData.produtos?.some(produto => isProdutoSoftware(produto.produto));
      const validadeDias = temProdutosSoftware && !formData.validadeDias ? 30 : (formData.validadeDias || 15);

      const propostaData: PropostaCompleta = {
        ...formData,
        validadeDias,
        status: 'enviada',
        dataValidade: new Date(Date.now() + validadeDias * 24 * 60 * 60 * 1000),
        subtotal: totaisCombinados.subtotal,
        total: totaisCombinados.total,
        vendedor: formData.vendedor || { id: '', nome: 'Vendedor Padrão', email: '', tipo: 'vendedor' as const, ativo: true }
      };

      const proposta = await propostasService.criarProposta(propostaData);
      // await propostasService.enviarPorWhatsApp(proposta.id, formData.cliente.telefone);

      toast.success('Proposta criada! Função de WhatsApp será implementada em breve.');
      onClose();
    } catch (error) {
      console.error('Erro ao enviar via WhatsApp:', error);
      toast.error('Erro ao enviar proposta via WhatsApp');
    }
  };

  const handleSendEmail = async () => {
    try {
      const formData = watch();

      if (!formData.cliente?.email) {
        toast.error('Cliente precisa ter e-mail cadastrado para envio');
        return;
      }

      // Verificar se há produtos de software
      const temProdutosSoftware = formData.produtos?.some(produto => isProdutoSoftware(produto.produto));
      const validadeDias = temProdutosSoftware && !formData.validadeDias ? 30 : (formData.validadeDias || 15);

      const propostaData: PropostaCompleta = {
        ...formData,
        validadeDias,
        status: 'enviada',
        dataValidade: new Date(Date.now() + validadeDias * 24 * 60 * 60 * 1000),
        subtotal: totaisCombinados.subtotal,
        total: totaisCombinados.total,
        vendedor: formData.vendedor || { id: '', nome: 'Vendedor Padrão', email: '', tipo: 'vendedor' as const, ativo: true }
      };

      const proposta = await propostasService.criarProposta(propostaData);
      // await propostasService.enviarPorEmail(proposta.id, formData.cliente.email);

      toast.success('Proposta criada! Função de email será implementada em breve.');
      onClose();
    } catch (error) {
      console.error('Erro ao enviar por e-mail:', error);
      toast.error('Erro ao enviar proposta por e-mail');
    }
  };

  // Submissão final
  const onSubmit = async (data: PropostaFormData) => {
    try {
      setIsLoading(true);

      // Verificar se há produtos de software
      const temProdutosSoftware = data.produtos?.some(produto => isProdutoSoftware(produto.produto));

      // Para produtos de software, usar validade padrão de 30 dias se não especificado
      const validadeDias = temProdutosSoftware && !data.validadeDias ? 30 : (data.validadeDias || 15);

      // Gerar token para o portal do cliente
      const tokenPortal = gerarTokenNumerico();

      const propostaData: PropostaCompleta = {
        ...data,
        validadeDias,
        subtotal: totaisCombinados.subtotal,
        total: totaisCombinados.total,
        dataValidade: new Date(Date.now() + validadeDias * 24 * 60 * 60 * 1000),
        status: 'rascunho',
        tokenPortal
      };

      const propostaCriada = await propostasService.criarProposta(propostaData);

      toast.success(`Proposta ${propostaCriada.numero} criada com sucesso!`);

      // Email removido - usuário pode enviar manualmente pela interface de propostas

      if (onPropostaCriada) {
        onPropostaCriada(propostaCriada);
      }

      onClose();
    } catch (error) {
      console.error('Erro ao criar proposta:', error);
      toast.error('Erro ao criar proposta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 sm:p-2">
      <div className="modal-content modal-nova-proposta bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-6xl mx-auto h-[98vh] max-h-[98vh] overflow-hidden flex flex-col">
        {/* Header do Modal - Compacto */}
        <div className="bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white px-3 py-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold truncate">Nova Proposta</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1 ml-2 flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress Indicator - Compacto */}
        <div className="border-b border-gray-200 px-3 py-2 flex-shrink-0 bg-white">
          <ResponsiveStepIndicator
            steps={etapas}
            currentStep={etapaAtual}
            completedSteps={Array.from({ length: etapaAtual }, (_, i) => i)}
            onStepClick={(stepIndex) => {
              if (stepIndex <= etapaAtual) {
                setEtapaAtual(stepIndex);
              }
            }}
          />
        </div>

        {/* Conteúdo das Etapas - Compacto */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-2 sm:p-3 md:p-4">{/* Conteúdo das etapas com espaçamento reduzido */}
            {/* Etapa 1: Informações Iniciais */}
            {etapaAtual === 0 && (
              <div className="space-y-4">
                {/* Layout em Duas Colunas - Compacto */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                  {/* Coluna 1: Dados da Proposta */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center mb-3">
                      <FileText className="w-4 h-4 text-blue-600 mr-2" />
                      <h4 className="text-base font-semibold text-gray-900">Dados da Proposta</h4>
                    </div>

                    <div className="space-y-3">
                      {/* Título da Proposta */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Título da Proposta
                        </label>
                        <Controller
                          name="titulo"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              placeholder="Ex: Proposta Comercial - Marketing Digital"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                            />
                          )}
                        />
                        <p className="text-xs text-gray-500 mt-0.5">
                          Deixe em branco para gerar automaticamente
                        </p>
                      </div>

                      {/* Data de Validade */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Válida até *
                        </label>
                        <input
                          type="date"
                          defaultValue={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                        />
                      </div>

                      {/* Vendedor Responsável */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vendedor Responsável *
                        </label>
                        {isLoadingVendedores ? (
                          <div className="flex items-center justify-center p-3 border border-dashed border-gray-300 rounded-lg">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#159A9C] mr-2"></div>
                            <span className="text-sm text-gray-600">Carregando...</span>
                          </div>
                        ) : (
                          <Controller
                            name="vendedor"
                            control={control}
                            render={({ field }) => (
                              <select
                                {...field}
                                value={field.value?.id || ''}
                                onChange={(e) => handleVendedorChange(e.target.value, field.onChange)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                              >
                                <option value="">Selecione um vendedor</option>
                                {vendedores.map((vendedor) => (
                                  <option key={vendedor.id} value={vendedor.id}>
                                    {vendedor.nome}
                                  </option>
                                ))}
                              </select>
                            )}
                          />
                        )}
                        {errors.vendedor && (
                          <p className="text-red-600 text-xs mt-1 flex items-center">
                            <X className="w-3 h-3 mr-1" />
                            {errors.vendedor.message}
                          </p>
                        )}
                      </div>

                      {/* Preview do Vendedor */}
                      {vendedorMemoized && (
                        <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded-lg">
                          <div className="flex items-center">
                            <Check className="w-4 h-4 text-green-600 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                {vendedorMemoized.nome}
                              </p>
                              <p className="text-xs text-green-600">
                                {vendedorMemoized.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Observações */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Observações Iniciais
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Observações sobre esta proposta..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Coluna 2: Seleção do Cliente */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center mb-3">
                      <User className="w-4 h-4 text-green-600 mr-2" />
                      <h4 className="text-base font-semibold text-gray-900">Seleção do Cliente</h4>
                    </div>

                    {/* Campo de Busca com melhorias */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="flex items-center justify-between">
                          <span>Buscar Cliente *</span>
                          <span className="text-xs text-gray-500">
                            💡 Use + para cadastrar
                          </span>
                        </span>
                      </label>
                      <ClienteSearchOptimizedV2
                        clientes={clientes}
                        selectedCliente={watchedCliente}
                        onClienteSelect={handleClienteSelect}
                        isLoading={isLoadingClientes}
                        onNewCliente={handleNewCliente}
                        onReloadClientes={handleReloadClientes}
                      />
                      {errors.cliente && (
                        <p className="text-red-600 text-xs mt-1 flex items-center">
                          <X className="w-3 h-3 mr-1" />
                          {errors.cliente.message}
                        </p>
                      )}
                    </div>

                    {/* Preview do Cliente Selecionado - Versão Compacta */}
                    {watchedCliente && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-teal-600" />
                            </div>
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h5 className="text-sm font-semibold text-teal-800 truncate">
                                {watchedCliente.nome}
                              </h5>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                Selecionado
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-teal-600 mt-1">
                              <span>{watchedCliente.documento}</span>
                              {watchedCliente.email && (
                                <span className="truncate">{watchedCliente.email}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Etapa 2: Produtos e Serviços */}
            {etapaAtual === 1 && (
              <div className="space-y-3 md:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">Produtos e Serviços</h3>
                  <button
                    onClick={() => setShowProdutoSearch(!showProdutoSearch)}
                    className="flex items-center justify-center space-x-2 text-[#159A9C] font-medium px-3 py-2 border border-[#159A9C] rounded-lg hover:bg-[#159A9C] hover:text-white transition-all text-sm"
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
                            className={`product-card p-4 border rounded-lg hover:bg-white cursor-pointer transition-colors ${produto.tipo === 'combo'
                              ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50'
                              : isProdutoSoftware(produto)
                                ? 'border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50'
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
                                {produto.tipoItem && (
                                  <BadgeProdutoSoftware
                                    tipoItem={produto.tipoItem}
                                    tamanho="sm"
                                    showLabel={false}
                                  />
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
                                {isProdutoSoftware(produto) && produto.periodicidadeLicenca && (
                                  <div className="text-xs text-purple-600">
                                    / {produto.periodicidadeLicenca}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="product-description text-sm text-gray-600 mb-2">{produto.descricao}</div>

                            <div className="flex items-center justify-between">
                              <div className="flex flex-wrap gap-1">
                                <span className={`px-2 py-1 text-xs rounded ${produto.tipo === 'combo'
                                  ? 'bg-amber-100 text-amber-800'
                                  : isProdutoSoftware(produto)
                                    ? 'bg-purple-100 text-purple-800'
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
                                {isProdutoSoftware(produto) && produto.tipoLicenciamento && (
                                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
                                    {produto.tipoLicenciamento}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {produto.unidade || (isProdutoSoftware(produto) ? 'licenças' : 'unid')}
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
                                    {field.produto.tipoItem && ['licenca', 'modulo', 'aplicativo'].includes(field.produto.tipoItem)
                                      ? 'Quantidade de Licenças'
                                      : 'Quantidade'
                                    }
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
                                        placeholder={field.produto.tipoItem && ['licenca', 'modulo', 'aplicativo'].includes(field.produto.tipoItem)
                                          ? 'Ex: 10 licenças'
                                          : 'Ex: 1'
                                        }
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
                            <option value="avista">{t('common.cashPayment')}</option>
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

                    {/* Validade - Oculto para produtos Software */}
                    {!watchedProdutos?.some(produto => isProdutoSoftware(produto.produto)) && (
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
                    )}

                    {/* Mensagem informativa para produtos Software */}
                    {watchedProdutos?.some(produto => isProdutoSoftware(produto.produto)) && (
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-purple-700">
                              <strong>Produtos de Software detectados:</strong> A validade e garantia são gerenciadas pela periodicidade da licença (mensal/anual).
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

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
                        <span className="text-gray-600">{t('common.subtotal')}:</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totaisCombinados.subtotal)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('common.discount')}:</span>
                        <span className="font-medium text-red-600">
                          -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totaisCombinados.desconto)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('common.taxes')}:</span>
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
                        <span>
                          {produto.produto.nome} (x{produto.quantidade}{' '}
                          {produto.produto.tipoItem && ['licenca', 'modulo', 'aplicativo'].includes(produto.produto.tipoItem)
                            ? 'licenças'
                            : produto.produto.unidade || 'unidades'
                          })
                        </span>
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
                    {!watchedProdutos?.some(produto => isProdutoSoftware(produto.produto)) && (
                      <div><strong>Validade:</strong> {watch('validadeDias')} dias</div>
                    )}
                    {watchedProdutos?.some(produto => isProdutoSoftware(produto.produto)) && (
                      <div><strong>Licenciamento:</strong> Conforme periodicidade dos produtos</div>
                    )}
                    {watch('observacoes') && (
                      <div className="md:col-span-2"><strong>Observações:</strong> {watch('observacoes')}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer com botões de navegação - Compacto */}
        <div className="border-t border-gray-200 p-2 sm:p-3 bg-white flex-shrink-0">
          {/* Mobile: Stack vertical */}
          <div className="sm:hidden space-y-2">
            {/* Progress info */}
            <div className="text-xs text-gray-500 text-center">
              Etapa {etapaAtual + 1} de {etapas.length}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              {etapaAtual > 0 ? (
                <button
                  onClick={etapaAnterior}
                  className="flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Anterior
                </button>
              ) : (
                <div /> // Espaçador
              )}

              {etapaAtual < etapas.length - 1 ? (
                <button
                  onClick={proximaEtapa}
                  className="flex items-center px-3 py-1.5 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm"
                >
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isLoading || !isValid}
                  className="flex items-center px-3 py-1.5 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white rounded-lg hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                      Criando...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      {t('common.generateProposal')}
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Quick actions - Mobile */}
            {etapaAtual === etapas.length - 1 && (
              <div className="flex items-center justify-center space-x-2 pt-2 border-t border-gray-100">
                <button
                  onClick={handlePreview}
                  disabled={!isValid}
                  className="flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs disabled:opacity-50"
                  title="Pré-visualizar"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </button>
                <button
                  onClick={handleSaveAsDraft}
                  disabled={!isValid}
                  className="flex items-center px-3 py-1.5 border border-amber-300 text-amber-700 rounded text-xs disabled:opacity-50"
                  title="Salvar rascunho"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Rascunho
                </button>
              </div>
            )}
          </div>

          {/* Desktop: Horizontal layout - Compacto */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Etapa {etapaAtual + 1} de {etapas.length}
            </div>

            <div className="flex items-center space-x-2">
              {etapaAtual > 0 && (
                <button
                  onClick={etapaAnterior}
                  className="flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Anterior
                </button>
              )}

              {etapaAtual < etapas.length - 1 ? (
                <button
                  onClick={proximaEtapa}
                  className="flex items-center px-3 py-1.5 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm"
                >
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Quick actions - Desktop */}
                  <div className="hidden lg:flex items-center space-x-1">
                    <button
                      onClick={handlePreview}
                      disabled={!isValid}
                      className="flex items-center px-2 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-xs disabled:opacity-50"
                      title="Pré-visualizar proposta"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </button>
                    <button
                      onClick={handleSaveAsDraft}
                      disabled={!isValid}
                      className="flex items-center px-2 py-1.5 border border-amber-300 text-amber-700 rounded hover:bg-amber-50 transition-colors text-xs disabled:opacity-50"
                      title="Salvar como rascunho"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Rascunho
                    </button>
                    <button
                      onClick={handleSendWhatsApp}
                      disabled={!isValid}
                      className="flex items-center px-2 py-1.5 border border-green-300 text-green-700 rounded hover:bg-green-50 transition-colors text-xs disabled:opacity-50"
                      title="Enviar por WhatsApp"
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      WhatsApp
                    </button>
                    <button
                      onClick={handleSendEmail}
                      disabled={!isValid}
                      className="flex items-center px-2 py-1.5 border border-blue-300 text-blue-700 rounded hover:bg-blue-50 transition-colors text-xs disabled:opacity-50"
                      title="Enviar por e-mail"
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      E-mail
                    </button>
                  </div>

                  {/* Main action button */}
                  <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isLoading || !isValid}
                    className="flex items-center px-3 py-1.5 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white rounded-lg hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                        Criando...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-1" />
                        Criar Proposta
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Cadastro de Cliente */}
      <ModalCadastroCliente
        isOpen={isModalCadastroClienteOpen}
        onClose={handleCloseModalCadastroCliente}
        onSave={handleSaveNewCliente}
        isLoading={isLoading}
      />
    </div>
  );
};
