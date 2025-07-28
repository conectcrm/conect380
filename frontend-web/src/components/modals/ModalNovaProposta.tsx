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
  // Estados principais
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
          console.error('Erro ao carregar clientes:', error);
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
          console.error('Erro ao carregar vendedores:', error);
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
        } catch (error) {
          console.error('Erro ao carregar produtos:', error);
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
        previewWindow.document.write(previewResult.htmlContent);
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
      await propostasService.enviarPorWhatsApp(proposta.id, formData.cliente.telefone);

      toast.success('Proposta enviada via WhatsApp!');
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
      await propostasService.enviarPorEmail(proposta.id, formData.cliente.email);

      toast.success('Proposta enviada por e-mail!');
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

      // Enviar e-mail para o cliente (opcional)
      try {
        const enviarEmail = window.confirm(
          '📧 Deseja enviar a proposta por e-mail para o cliente agora?\n\n' +
          `Cliente: ${data.cliente?.nome}\n` +
          `E-mail: ${data.cliente?.email}\n` +
          `Token: ${tokenPortal}`
        );

        if (enviarEmail && data.cliente && data.vendedor) {
          toast.loading('📧 Enviando e-mail para o cliente...', { id: 'email-envio' });

          const emailData = {
            cliente: {
              nome: data.cliente.nome,
              email: data.cliente.email
            },
            proposta: {
              numero: propostaCriada.numero,
              valorTotal: totaisCombinados.total,
              dataValidade: new Date(Date.now() + validadeDias * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
              token: tokenPortal
            },
            vendedor: {
              nome: data.vendedor.nome,
              email: data.vendedor.email,
              telefone: data.vendedor.telefone || '(11) 99999-9999'
            },
            empresa: {
              nome: process.env.REACT_APP_EMPRESA_NOME || 'ConectCRM',
              email: process.env.REACT_APP_EMPRESA_EMAIL || 'contato@conectcrm.com',
              telefone: process.env.REACT_APP_EMPRESA_TELEFONE || '(11) 99999-9999',
              endereco: process.env.REACT_APP_EMPRESA_ENDERECO || 'São Paulo/SP'
            },
            portalUrl: process.env.REACT_APP_PORTAL_URL || window.location.origin + '/portal'
          };

          const resultadoEmail = await emailServiceReal.enviarPropostaParaCliente(emailData);

          if (resultadoEmail.success) {
            toast.success('✅ E-mail enviado com sucesso!', { id: 'email-envio' });
            console.log('📧 E-mail enviado:', {
              messageId: resultadoEmail.messageId,
              provider: resultadoEmail.provider,
              timestamp: resultadoEmail.timestamp
            });
          } else {
            toast.error(`❌ Erro ao enviar e-mail: ${resultadoEmail.error}`, { id: 'email-envio' });
            console.error('❌ Erro no envio:', resultadoEmail);
          }
        }
      } catch (emailError) {
        console.error('❌ Erro ao enviar e-mail:', emailError);
        toast.error('⚠️ Proposta criada, mas houve erro no envio do e-mail.', { id: 'email-envio' });
      }

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="modal-content modal-nova-proposta bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-auto h-[85vh] max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header do Modal */}
        <div className="bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white p-3 md:p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-bold">Nova Proposta</h2>
              <p className="text-blue-100 text-xs md:text-sm">Crie uma proposta comercial personalizada</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 md:mt-4">
            <div className="flex items-center justify-between gap-1 md:gap-2 mb-2">
              {etapas.map((etapa, index) => {
                const Icone = etapa.icone;
                const isAtual = index === etapaAtual;
                const isConcluida = index < etapaAtual;

                return (
                  <div key={etapa.id} className="flex items-center flex-1 min-w-0">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors flex-shrink-0 ${isConcluida
                      ? 'bg-white text-[#159A9C] border-white'
                      : isAtual
                        ? 'bg-white text-[#159A9C] border-white'
                        : 'bg-transparent text-white border-white/50'
                      }`}>
                      {isConcluida ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Icone className="h-3 w-3" />
                      )}
                    </div>
                    <span className={`ml-1 md:ml-2 text-xs font-medium truncate ${isAtual ? 'text-white' : 'text-blue-100'
                      }`}>
                      {etapa.titulo}
                    </span>
                    {index < etapas.length - 1 && (
                      <div className={`w-3 md:w-6 h-0.5 mx-1 md:mx-2 transition-colors flex-shrink-0 ${isConcluida ? 'bg-white' : 'bg-white/30'
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
          <div className="p-3 md:p-4">{/* Aqui vai todo o conteúdo das etapas existente */}
            {/* Etapa 1: Seleção de Cliente */}
            {etapaAtual === 0 && (
              <div className="space-y-3 md:space-y-4">
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Informações da Proposta</h3>

                  {/* Grid layout para aproveitar melhor o espaço */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
                    {/* Campo Título da Proposta */}
                    <div className="xl:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Título da Proposta
                        <span className="text-xs text-gray-500 font-normal ml-1">
                          (Opcional - será gerado automaticamente)
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                          />
                        )}
                      />
                      {watchedTitulo && (
                        <p className="text-xs text-gray-600 mt-1">
                          <strong>Título atual:</strong> {watchedTitulo}
                        </p>
                      )}
                    </div>

                    {/* Campo Vendedor Responsável */}
                    <div className="xl:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vendedor Responsável *
                        <span className="text-xs text-gray-500 font-normal ml-1">
                          (Selecionado automaticamente)
                        </span>
                      </label>

                      {isLoadingVendedores ? (
                        <div className="p-3 text-center text-gray-500 flex items-center justify-center border border-gray-300 rounded-lg">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#159A9C] mr-2"></div>
                          <span className="text-sm">Carregando vendedores...</span>
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
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
                        <p className="text-red-500 text-xs mt-1">{errors.vendedor.message}</p>
                      )}

                      {/* Resumo do Vendedor Selecionado - Compacto */}
                      {watchedVendedor && (
                        <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-blue-900 mb-1 flex items-center">
                                <Check className="h-3 w-3 mr-1" />
                                Vendedor Selecionado
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 text-xs text-blue-700">
                                <div><strong>Nome:</strong> {watchedVendedor.nome}</div>
                                <div><strong>Email:</strong> {watchedVendedor.email}</div>
                                <div><strong>Tipo:</strong> {watchedVendedor.tipo}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <hr className="border-gray-200 my-4" />
                  <h4 className="text-base font-semibold text-gray-900 mb-3">Selecionar Cliente</h4>

                  {/* Campo de busca do cliente - Compacto */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Buscar Cliente
                        <span className="text-xs text-gray-500 font-normal ml-1">
                          (Digite para filtrar)
                        </span>
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Nome, documento ou email..."
                          value={buscarCliente}
                          onChange={(e) => setBuscarCliente(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
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
                                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${isSelected
                                    ? 'border-[#159A9C] bg-[#159A9C]/5 shadow-sm'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      {/* Nome do Cliente */}
                                      <div className="flex items-center mb-2">
                                        <h4 className={`font-semibold text-sm truncate ${isSelected ? 'text-[#159A9C]' : 'text-gray-900'
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
                                          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium mr-2 ${cliente.tipoPessoa === 'fisica'
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
                                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected
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

                    {/* Resumo do Cliente Selecionado - Compacto */}
                    {watchedCliente && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded border border-green-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-green-900 mb-1 flex items-center">
                              <Check className="h-3 w-3 mr-1" />
                              Cliente Selecionado
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
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
                            className="text-gray-400 hover:text-red-500 transition-colors ml-3"
                            title="Remover cliente selecionado"
                          >
                            <X className="h-4 w-4" />
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

        {/* Footer com botões de navegação - Mais compacto */}
        <div className="border-t border-gray-200 p-3 md:p-4 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Etapa {etapaAtual + 1} de {etapas.length}
            </div>

            <div className="flex items-center space-x-2">
              {etapaAtual > 0 && (
                <button
                  onClick={etapaAnterior}
                  className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Anterior</span>
                  <span className="sm:hidden">Ant.</span>
                </button>
              )}

              {etapaAtual < etapas.length - 1 ? (
                <button
                  onClick={proximaEtapa}
                  className="flex items-center px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm"
                >
                  <span className="hidden sm:inline">Próximo</span>
                  <span className="sm:hidden">Próx.</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {/* Ações rápidas - Mais compactas */}
                  <div className="flex items-center space-x-1">
                    {/* Pré-visualizar */}
                    <button
                      onClick={handlePreview}
                      disabled={!isValid}
                      className="flex items-center px-2 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Pré-visualizar proposta"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      <span className="hidden lg:inline">Preview</span>
                    </button>

                    {/* Salvar como rascunho */}
                    <button
                      onClick={handleSaveAsDraft}
                      disabled={!isValid}
                      className="flex items-center px-2 py-1.5 border border-amber-300 text-amber-700 rounded hover:bg-amber-50 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Salvar como rascunho"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      <span className="hidden lg:inline">Rascunho</span>
                    </button>

                    {/* Enviar por WhatsApp */}
                    <button
                      onClick={handleSendWhatsApp}
                      disabled={!isValid}
                      className="flex items-center px-2 py-1.5 border border-green-300 text-green-700 rounded hover:bg-green-50 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Enviar por WhatsApp"
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      <span className="hidden lg:inline">WhatsApp</span>
                    </button>

                    {/* Enviar por E-mail */}
                    <button
                      onClick={handleSendEmail}
                      disabled={!isValid}
                      className="flex items-center px-2 py-1.5 border border-blue-300 text-blue-700 rounded hover:bg-blue-50 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Enviar por e-mail"
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      <span className="hidden lg:inline">E-mail</span>
                    </button>
                  </div>

                  {/* Botão principal */}
                  <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isLoading || !isValid}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white rounded-lg hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        <span className="hidden sm:inline">Criando...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Gerar Proposta</span>
                        <span className="sm:hidden">Gerar</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
