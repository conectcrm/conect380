import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useI18n } from '../../contexts/I18nContext';
import {
  X,
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
  Mail,
  CheckCircle,
  AlertCircle,
  Building2,
  Phone,
  MapPin,
  UserCheck,
  Users,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Hooks e Services
import { useCalculosProposta } from '../../features/propostas/hooks/useCalculosProposta';
import {
  propostasService,
  PropostaCompleta,
  Vendedor,
} from '../../features/propostas/services/propostasService';
import { clientesService, Cliente as ClienteService } from '../../services/clientesService';
import { emailServiceReal } from '../../services/emailServiceReal';
import { gerarTokenNumerico } from '../../utils/tokenUtils';
import { BadgeProdutoSoftware } from '../common/BadgeProdutoSoftware';

// Novos componentes otimizados
import ClienteSearchOptimized from '../search/ClienteSearchOptimizedV2';

// Interfaces (mantendo as mesmas do modal original)
interface Cliente {
  id: string;
  nome: string;
  documento: string;
  email: string;
  telefone: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  tipoPessoa: 'fisica' | 'juridica';
}

interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  descricao?: string;
  unidade: string;
  tipoItem?: string;
  unidadeMedida?: string;
  statusAtivo: boolean;
}

interface ProdutoProposta {
  id?: string;
  produto: Produto;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
  valorTotal: number;
  subtotal: number;
  observacoes?: string;
}

interface FormularioProposta {
  titulo: string;
  numero?: string;
  dataValidade: string;
  observacoes: string;
  vendedor: Vendedor | null;
  cliente: Cliente | null;
  produtos: ProdutoProposta[];
  condicoesGerais: string;
  formaPagamento: string;
  validadeDias: number;
}

// Schema de validação
const schema = yup.object().shape({
  titulo: yup.string().required('Título da proposta é obrigatório'),
  dataValidade: yup.string().required('Data de validade é obrigatória'),
  vendedor: yup.object().nullable().required('Vendedor responsável é obrigatório'),
  cliente: yup.object().nullable().required('Cliente é obrigatório'),
  produtos: yup.array().min(1, 'Adicione pelo menos um produto à proposta'),
  formaPagamento: yup.string().required('Forma de pagamento é obrigatória'),
  validadeDias: yup.number().min(1, 'Validade deve ser pelo menos 1 dia').required(),
});

interface ModalNovaPropostaModernoProps {
  isOpen: boolean;
  onClose: () => void;
  onPropostaCriada?: (proposta: PropostaCompleta) => void;
}

type TabId = 'cliente' | 'produtos' | 'condicoes' | 'resumo';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

const tabs: Tab[] = [
  {
    id: 'cliente',
    label: 'Cliente & Vendedor',
    icon: User,
    description: 'Selecione o cliente e vendedor responsável',
  },
  {
    id: 'produtos',
    label: 'Produtos',
    icon: Package,
    description: 'Adicione produtos e serviços à proposta',
  },
  {
    id: 'condicoes',
    label: 'Condições',
    icon: Calculator,
    description: 'Configure pagamento e condições comerciais',
  },
  {
    id: 'resumo',
    label: 'Resumo',
    icon: FileText,
    description: 'Revise e finalize a proposta',
  },
];

export const ModalNovaPropostaModerno: React.FC<ModalNovaPropostaModernoProps> = ({
  isOpen,
  onClose,
  onPropostaCriada,
}) => {
  // Estados principais
  const [activeTab, setActiveTab] = useState<TabId>('cliente');

  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Form setup
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    trigger,
    formState: { errors, isValid },
  } = useForm<FormularioProposta>({
    resolver: yupResolver(schema),
    defaultValues: {
      titulo: '',
      numero: `PROP-${Date.now()}`,
      dataValidade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias a partir de hoje
      observacoes: '',
      vendedor: null,
      cliente: null,
      produtos: [],
      condicoesGerais: 'Proposta válida conforme condições apresentadas.',
      formaPagamento: '',
      validadeDias: 30,
    },
    mode: 'onChange',
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'produtos',
  });

  // Watch values com useCallback para evitar re-renders
  const watchedTitulo = watch('titulo');
  const watchedVendedor = watch('vendedor');
  const watchedCliente = watch('cliente');
  const watchedProdutos = watch('produtos');

  // Cálculos usando o hook
  const { totais } = useCalculosProposta(
    watchedProdutos || [],
    0, // desconto global
    12, // impostos
  );

  // Controle de execução única com useRef
  const executionRef = useRef(false);
  const initializationRef = useRef(false);

  // Carregar dados iniciais com controle anti-duplicação
  useEffect(() => {
    if (isOpen && !executionRef.current && !initializationRef.current) {
      console.log('Primeira execução - Modal aberto');
      executionRef.current = true;
      initializationRef.current = true;

      const timer = setTimeout(() => {
        carregarDadosIniciais();
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset completo quando modal fecha
  useEffect(() => {
    if (!isOpen && executionRef.current) {
      console.log('Reset completo - Modal fechado');
      executionRef.current = false;
      initializationRef.current = false;
      setIsInitialized(false);
      setActiveTab('cliente');
    }
  }, [isOpen]);

  // Função específica para recarregar APENAS clientes (sem vendedores)
  const recarregarApenasCLientes = useCallback(async () => {
    try {
      console.log('Recarregando apenas clientes...');
      const response = await clientesService.getClientes({ limit: 100 });
      const clientesData = response.data.map(
        (cliente: ClienteService): Cliente => ({
          id: cliente.id || '',
          nome: cliente.nome,
          documento: cliente.documento || '',
          email: cliente.email,
          telefone: cliente.telefone || '',
          endereco: cliente.endereco || '',
          cidade: cliente.cidade || '',
          estado: cliente.estado || '',
          tipoPessoa:
            cliente.tipo === 'pessoa_fisica' ? ('fisica' as const) : ('juridica' as const),
        }),
      );

      setClientes(clientesData);
      console.log('Clientes recarregados:', clientesData.length);
    } catch (error) {
      console.error('Erro ao recarregar clientes:', error);
      toast.error('Erro ao recarregar lista de clientes');
    }
  }, []);

  const carregarDadosIniciais = useCallback(async () => {
    // Múltiplas verificações para evitar execuções duplas
    if (isLoading || !isOpen) {
      console.log('Carregamento bloqueado - isLoading:', isLoading, 'isOpen:', isOpen);
      return;
    }

    console.log('Iniciando carregamento único de dados...');
    setIsLoading(true);

    try {
      // Carregar vendedores com Promise separada e timeout
      let vendedoresData: Vendedor[] = [];
      try {
        const vendedoresTimer = setTimeout(async () => {
          try {
            vendedoresData = await propostasService.obterVendedores();
            console.log('Vendedores carregados:', vendedoresData.length);
          } catch (error) {
            console.error('Erro ao carregar vendedores:', error);
            vendedoresData = [];
          }
        }, 600); // 600ms delay para vendedores

        await new Promise((resolve) => setTimeout(resolve, 650)); // Aguarda o timeout + margem
        clearTimeout(vendedoresTimer);
      } catch (error) {
        console.error('Erro no timeout de vendedores:', error);
        vendedoresData = [];
      }

      // Carregar clientes
      let clientesData: Cliente[] = [];
      try {
        const response = await clientesService.getClientes({ limit: 100 });
        clientesData = response.data.map(
          (cliente: ClienteService): Cliente => ({
            id: cliente.id || '',
            nome: cliente.nome,
            documento: cliente.documento || '',
            email: cliente.email,
            telefone: cliente.telefone || '',
            endereco: cliente.endereco || '',
            cidade: cliente.cidade || '',
            estado: cliente.estado || '',
            tipoPessoa:
              cliente.tipo === 'pessoa_fisica' ? ('fisica' as const) : ('juridica' as const),
          }),
        );
        console.log('Clientes carregados:', clientesData.length);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        clientesData = [];
      }

      // Atualizar estados apenas uma vez
      setVendedores(vendedoresData);
      setClientes(clientesData);
      setProdutos([]); // Mock temporário

      console.log(
        'Dados carregados com sucesso - Vendedores:',
        vendedoresData.length,
        'Clientes:',
        clientesData.length,
      );
    } catch (error) {
      console.error('Erro geral ao carregar dados:', error);
      toast.error('Erro ao carregar dados iniciais');
    } finally {
      setIsLoading(false);
      console.log('Carregamento finalizado');
    }
  }, []); // Dependências vazias para evitar re-criação

  // Validação por aba
  const validateTab = useCallback(
    async (tabId: TabId): Promise<boolean> => {
      switch (tabId) {
        case 'cliente':
          return await trigger(['vendedor', 'cliente']);
        case 'produtos':
          return await trigger(['produtos']);
        case 'condicoes':
          return await trigger(['formaPagamento', 'validadeDias']);
        case 'resumo':
          return await trigger();
        default:
          return true;
      }
    },
    [trigger],
  );

  // Navegação entre abas
  const handleTabChange = useCallback(
    async (tabId: TabId) => {
      const isCurrentTabValid = await validateTab(activeTab);
      if (isCurrentTabValid || tabId === activeTab) {
        setActiveTab(tabId);
      } else {
        toast.error('Complete os campos obrigatórios antes de continuar');
      }
    },
    [activeTab, validateTab],
  );

  // Status da aba (completa, erro, ativa)
  const getTabStatus = useCallback(
    (tabId: TabId) => {
      const hasErrors = (field: keyof FormularioProposta) => errors[field];

      switch (tabId) {
        case 'cliente':
          if (hasErrors('vendedor') || hasErrors('cliente')) return 'error';
          if (watchedVendedor && watchedCliente) return 'completed';
          return activeTab === tabId ? 'active' : 'pending';

        case 'produtos':
          if (hasErrors('produtos')) return 'error';
          if (watchedProdutos && watchedProdutos.length > 0) return 'completed';
          return activeTab === tabId ? 'active' : 'pending';

        case 'condicoes':
          if (hasErrors('formaPagamento') || hasErrors('validadeDias')) return 'error';
          const formaPagamento = watch('formaPagamento');
          const validadeDias = watch('validadeDias');
          if (formaPagamento && validadeDias) return 'completed';
          return activeTab === tabId ? 'active' : 'pending';

        case 'resumo':
          return activeTab === tabId ? 'active' : 'pending';

        default:
          return 'pending';
      }
    },
    [errors, watchedVendedor, watchedCliente, watchedProdutos, activeTab, watch],
  );

  // Adicionar produto
  const handleAddProduto = useCallback(
    (produto: Produto) => {
      const subtotal = produto.preco;
      const novoProduto: ProdutoProposta = {
        produto,
        quantidade: 1,
        precoUnitario: produto.preco,
        desconto: 0,
        valorTotal: produto.preco,
        subtotal: subtotal,
        observacoes: '',
      };
      append(novoProduto);
    },
    [append],
  );

  // Atualizar produto
  const handleUpdateProduto = useCallback(
    (index: number, field: string, value: any) => {
      const produto = watchedProdutos[index];
      const updatedProduto = { ...produto, [field]: value };

      // Recalcular valor total e subtotal
      if (field === 'quantidade' || field === 'precoUnitario' || field === 'desconto') {
        const subtotalSemDesconto = updatedProduto.quantidade * updatedProduto.precoUnitario;
        const desconto = (subtotalSemDesconto * updatedProduto.desconto) / 100;
        updatedProduto.valorTotal = subtotalSemDesconto - desconto;
        updatedProduto.subtotal = updatedProduto.valorTotal;
      }

      update(index, updatedProduto);
    },
    [watchedProdutos, update],
  );

  // Submeter proposta
  const onSubmit = async (data: FormularioProposta) => {
    setIsSaving(true);
    try {
      const propostaData: PropostaCompleta = {
        ...data,
        status: 'rascunho',
        dataValidade: new Date(Date.now() + data.validadeDias * 24 * 60 * 60 * 1000),
        subtotal: totais.subtotal,
        total: totais.total,
        descontoGlobal: 0,
        impostos: 12,
        incluirImpostosPDF: true,
        vendedor: data.vendedor || {
          id: '',
          nome: 'Vendedor Padrão',
          email: '',
          tipo: 'vendedor' as const,
          ativo: true,
        },
      };

      const proposta = await propostasService.criarProposta(propostaData);

      toast.success('Proposta criada com sucesso!');

      if (onPropostaCriada) {
        onPropostaCriada(proposta);
      }

      handleClose();
    } catch (error) {
      console.error('Erro ao criar proposta:', error);
      const friendlyMessage = error instanceof Error ? error.message : 'Erro ao criar proposta';
      toast.error(friendlyMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = useCallback(() => {
    reset();
    setActiveTab('cliente');
    onClose();
  }, [reset, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-[calc(100%-2rem)] sm:w-[700px] md:w-[900px] lg:w-[1100px] xl:w-[1200px] max-w-[1400px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nova Proposta</h2>
            <p className="text-sm text-gray-500 mt-1">
              Crie uma nova proposta comercial em 4 etapas simples
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const status = getTabStatus(tab.id);
              const IconComponent = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all min-w-fit ${
                    status === 'active'
                      ? 'bg-teal-100 text-teal-800 border border-teal-300'
                      : status === 'completed'
                        ? 'bg-green-50 text-green-800 border border-green-300 hover:bg-green-100'
                        : status === 'error'
                          ? 'bg-red-50 text-red-800 border border-red-300 hover:bg-red-100'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : status === 'error' ? (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <IconComponent className="w-5 h-5" />
                    )}
                    <div className="text-left">
                      <div className="font-medium text-sm">{tab.label}</div>
                      <div className="text-xs opacity-75 hidden lg:block">{tab.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-6">
              {/* Aba Cliente */}
              {activeTab === 'cliente' && (
                <div className="h-full">
                  {/* Header simplificado */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Informações Iniciais da Proposta
                    </h3>
                    <p className="text-gray-600">Preencha os dados básicos e selecione o cliente</p>
                  </div>

                  {/* Layout em duas colunas conforme imagem */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                    {/* Coluna Esquerda: Informações da Proposta */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">
                          Informações da Proposta
                        </h4>

                        <div className="space-y-4">
                          {/* Título da Proposta */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Título da Proposta *
                            </label>
                            <Controller
                              name="titulo"
                              control={control}
                              rules={{ required: 'Título é obrigatório' }}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="text"
                                  placeholder="Digite o título da proposta"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                              )}
                            />
                            {errors.titulo && (
                              <p className="text-sm text-red-600 mt-1">{errors.titulo.message}</p>
                            )}
                          </div>

                          {/* Número da Proposta */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Número da Proposta
                            </label>
                            <Controller
                              name="numero"
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="text"
                                  placeholder="Auto-gerado"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                                  readOnly
                                />
                              )}
                            />
                          </div>

                          {/* Data de Validade */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Válida até *
                            </label>
                            <Controller
                              name="dataValidade"
                              control={control}
                              rules={{ required: 'Data de validade é obrigatória' }}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="date"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                              )}
                            />
                            {errors.dataValidade && (
                              <p className="text-sm text-red-600 mt-1">
                                {errors.dataValidade.message}
                              </p>
                            )}
                          </div>

                          {/* Vendedor Responsável */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Vendedor Responsável *
                            </label>
                            <Controller
                              name="vendedor"
                              control={control}
                              rules={{ required: 'Vendedor é obrigatório' }}
                              render={({ field }) => (
                                <select
                                  {...field}
                                  value={field.value?.id || ''}
                                  onChange={(e) => {
                                    console.log(
                                      'Seletor de vendedor - onChange disparado:',
                                      e.target.value,
                                    );
                                    const vendedorSelecionado = vendedores.find(
                                      (v) => v.id === e.target.value,
                                    );
                                    field.onChange(vendedorSelecionado || null);
                                    console.log(
                                      'Vendedor selecionado:',
                                      vendedorSelecionado?.nome || 'Nenhum',
                                    );
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                  onClick={() => {
                                    console.log(
                                      'Seletor de vendedor clicado - NÃO deve recarregar dados',
                                    );
                                  }}
                                >
                                  <option value="">Selecione um vendedor</option>
                                  {vendedores.map((vendedor) => (
                                    <option key={vendedor.id} value={vendedor.id}>
                                      {vendedor.nome} - {vendedor.email}
                                    </option>
                                  ))}
                                </select>
                              )}
                            />
                            {errors.vendedor && (
                              <p className="text-sm text-red-600 mt-1">{errors.vendedor.message}</p>
                            )}
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
                                  rows={4}
                                  placeholder="Observações adicionais sobre a proposta..."
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                                />
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Coluna Direita: Clientes */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Clientes</h4>

                        {/* Busca de Clientes */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pesquisar clientes
                          </label>
                          <Controller
                            name="cliente"
                            control={control}
                            rules={{ required: 'Cliente é obrigatório' }}
                            render={({ field }) => (
                              <ClienteSearchOptimized
                                clientes={clientes}
                                selectedCliente={field.value}
                                onClienteSelect={field.onChange}
                                isLoading={isLoading}
                                onNewCliente={() => {
                                  toast.success('Funcionalidade em desenvolvimento');
                                }}
                              />
                            )}
                          />
                          {errors.cliente && (
                            <p className="text-sm text-red-600 mt-2">{errors.cliente.message}</p>
                          )}
                        </div>

                        {/* Lista de clientes */}
                        <div className="border border-gray-300 rounded-lg">
                          <div className="bg-gray-50 px-4 py-2 border-b border-gray-300">
                            <h5 className="text-sm font-medium text-gray-700">Lista de clientes</h5>
                          </div>
                          <div className="p-4 h-96 overflow-y-auto">
                            {isLoading ? (
                              <div className="flex items-center justify-center h-32">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                <span className="ml-2 text-gray-500">Carregando clientes...</span>
                              </div>
                            ) : clientes.length > 0 ? (
                              <div className="space-y-2">
                                {clientes.slice(0, 10).map((cliente) => (
                                  <div
                                    key={cliente.id}
                                    onClick={() => {
                                      setValue('cliente', cliente);
                                    }}
                                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                      watchedCliente?.id === cliente.id
                                        ? 'border-teal-500 bg-teal-50'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        {cliente.tipoPessoa === 'juridica' ? (
                                          <Building2 className="w-4 h-4 text-gray-500" />
                                        ) : (
                                          <User className="w-4 h-4 text-gray-500" />
                                        )}
                                        <div>
                                          <p className="font-medium text-gray-900 text-sm">
                                            {cliente.nome}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {cliente.documento}
                                          </p>
                                        </div>
                                      </div>
                                      {watchedCliente?.id === cliente.id && (
                                        <CheckCircle className="w-4 h-4 text-teal-500" />
                                      )}
                                    </div>
                                    {cliente.email && (
                                      <p className="text-xs text-gray-500 mt-1 ml-6">
                                        {cliente.email}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">Nenhum cliente encontrado</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Outras abas continuam... */}
              {activeTab === 'produtos' && (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aba Produtos</h3>
                  <p className="text-gray-500">
                    Conteúdo da aba produtos será implementado aqui...
                  </p>
                </div>
              )}

              {activeTab === 'condicoes' && (
                <div className="text-center py-12">
                  <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aba Condições</h3>
                  <p className="text-gray-500">
                    Conteúdo da aba condições será implementado aqui...
                  </p>
                </div>
              )}

              {activeTab === 'resumo' && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aba Resumo</h3>
                  <p className="text-gray-500">Conteúdo da aba resumo será implementado aqui...</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Etapa {tabs.findIndex((t) => t.id === activeTab) + 1} de {tabs.length}
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>

                  {activeTab === 'resumo' ? (
                    <button
                      type="submit"
                      disabled={isSaving || !isValid}
                      className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Salvando...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Criar Proposta</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const currentIndex = tabs.findIndex((t) => t.id === activeTab);
                        if (currentIndex < tabs.length - 1) {
                          handleTabChange(tabs[currentIndex + 1].id);
                        }
                      }}
                      className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      Próxima Etapa
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalNovaPropostaModerno;
