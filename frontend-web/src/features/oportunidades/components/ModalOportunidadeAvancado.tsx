import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Building,
  DollarSign,
  Target,
  Calendar,
  Phone,
  Mail,
  Globe,
  AlertCircle,
  Plus,
  Star,
  Briefcase,
  TrendingUp,
  Clock,
  Tag,
  Users,
  FileText,
  Save,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Hooks e Services
import { useOportunidades } from '../hooks/useOportunidades';
import { clientesService } from '../../../services/clientesService';
import ErrorBoundary from '../../../components/ErrorBoundary';

// Types
import {
  NovaOportunidade,
  AtualizarOportunidade,
  Oportunidade,
  EstagioOportunidade,
  PrioridadeOportunidade,
  OrigemOportunidade,
} from '../../../types/oportunidades/index';

// Interfaces
interface Cliente {
  id: string; // UUID string
  nome: string;
  email?: string;
  telefone?: string;
  empresa?: string;
  documento?: string;
  tipoPessoa?: 'fisica' | 'juridica';
}

interface Responsavel {
  id: string;
  nome: string;
  email: string;
  avatar?: string;
}

interface ModalOportunidadeAvancadoProps {
  isOpen: boolean;
  onClose: () => void;
  oportunidade?: Oportunidade; // Para edição
  onSuccess?: () => void;
}

// Schema de validação
const oportunidadeSchema = yup.object({
  titulo: yup
    .string()
    .required('Título é obrigatório')
    .min(3, 'Título deve ter pelo menos 3 caracteres')
    .max(100, 'Título deve ter no máximo 100 caracteres'),
  descricao: yup.string().max(500, 'Descrição deve ter no máximo 500 caracteres'),
  valor: yup
    .number()
    .transform((value, originalValue) => {
      // Se o valor original for string vazia ou null/undefined, retorna undefined
      if (originalValue === '' || originalValue == null) return undefined;
      // Se for um número válido, retorna o número
      return isNaN(value) ? undefined : value;
    })
    .required('Valor é obrigatório')
    .min(0.01, 'Valor deve ser maior que zero')
    .max(999999999, 'Valor muito alto'),
  probabilidade: yup
    .number()
    .required('Probabilidade é obrigatória')
    .min(0, 'Probabilidade mínima é 0%')
    .max(100, 'Probabilidade máxima é 100%'),
  dataFechamentoEsperado: yup
    .date()
    .required('Data de fechamento esperada é obrigatória')
    .min(new Date(), 'Data deve ser futura'),
  nomeContato: yup.string().when('clienteId', {
    is: (val: any) => !val,
    then: (schema) =>
      schema.required('Nome do contato é obrigatório quando cliente não selecionado'),
    otherwise: (schema) => schema,
  }),
  emailContato: yup
    .string()
    .email('Email inválido')
    .when('clienteId', {
      is: (val: any) => !val,
      then: (schema) => schema.required('Email é obrigatório quando cliente não selecionado'),
      otherwise: (schema) => schema,
    }),
  telefoneContato: yup.string().matches(/^[\d\s\(\)\-\+]+$/, 'Telefone inválido'),
});

type OportunidadeFormData = yup.InferType<typeof oportunidadeSchema> & {
  estagio: EstagioOportunidade;
  prioridade: PrioridadeOportunidade;
  origem: OrigemOportunidade;
  clienteId?: string; // Alterado de number para string
  responsavelId: string;
  empresaContato?: string;
  tags: string[];
};

export const ModalOportunidadeAvancado: React.FC<ModalOportunidadeAvancadoProps> = ({
  isOpen,
  onClose,
  oportunidade,
  onSuccess,
}) => {
  const { criarOportunidade, atualizarOportunidade } = useOportunidades();

  // Estados
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clientesBusca, setClientesBusca] = useState('');
  const [showClienteForm, setShowClienteForm] = useState(false);
  const [responsaveis] = useState<Responsavel[]>([
    { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', nome: 'Admin Teste', email: 'admin@teste.com' },
    { id: '2', nome: 'Maria Santos', email: 'maria@empresa.com' },
  ]);

  const isEdit = !!oportunidade;

  // Form setup
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<OportunidadeFormData>({
    resolver: yupResolver(oportunidadeSchema),
    defaultValues: {
      titulo: oportunidade?.titulo || '',
      descricao: oportunidade?.descricao || '',
      valor: oportunidade?.valor || undefined, // Usar undefined ao invés de 0
      probabilidade: oportunidade?.probabilidade || 50,
      estagio: oportunidade?.estagio || EstagioOportunidade.LEADS,
      prioridade: oportunidade?.prioridade || PrioridadeOportunidade.MEDIA,
      origem: oportunidade?.origem || OrigemOportunidade.WEBSITE,
      clienteId: oportunidade?.cliente?.id ? String(oportunidade.cliente.id) : undefined, // Converter para string se existir
      responsavelId: oportunidade?.responsavel?.id || 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      nomeContato: oportunidade?.nomeContato || '',
      emailContato: oportunidade?.emailContato || '',
      telefoneContato: oportunidade?.telefoneContato || '',
      empresaContato: oportunidade?.empresaContato || '',
      tags: oportunidade?.tags || [],
      dataFechamentoEsperado: oportunidade?.dataFechamentoEsperado
        ? new Date(oportunidade.dataFechamentoEsperado)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    mode: 'onChange',
  });

  const watchedValues = watch();

  // Carregar clientes
  useEffect(() => {
    const carregarClientes = async () => {
      try {
        const response = await clientesService.getClientes({ limit: 100 });

        // Debug: Verificar se algum cliente tem propriedades como objeto
        response.data.forEach((cliente, index) => {
          if (
            typeof cliente.nome === 'object' ||
            typeof cliente.email === 'object' ||
            typeof cliente.telefone === 'object'
          ) {
            console.warn(`🚨 CLIENTE ${index} TEM PROPRIEDADES COMO OBJETO:`, {
              id: cliente.id,
              nome: cliente.nome,
              email: cliente.email,
              telefone: cliente.telefone,
              documento: cliente.documento,
            });
          }
        });

        const clientesFormatados = response.data.map((cliente) => ({
          id: cliente.id || '', // Manter como string UUID
          nome: typeof cliente.nome === 'string' ? cliente.nome : String(cliente.nome || ''),
          email: typeof cliente.email === 'string' ? cliente.email : String(cliente.email || ''),
          telefone:
            typeof cliente.telefone === 'string'
              ? cliente.telefone
              : String(cliente.telefone || ''),
          empresa:
            typeof cliente.empresa === 'string' ? cliente.empresa : String(cliente.empresa || ''),
          documento:
            typeof cliente.documento === 'string'
              ? cliente.documento
              : String(cliente.documento || ''),
          tipoPessoa: (cliente.tipo === 'pessoa_fisica' ? 'fisica' : 'juridica') as
            | 'fisica'
            | 'juridica',
        }));
        console.log('Clientes carregados:', clientesFormatados);
        setClientes(clientesFormatados);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
      }
    };

    if (isOpen) {
      carregarClientes();
    }
  }, [isOpen]);

  // Filtrar clientes baseado na busca
  const clientesFiltrados = clientes.filter(
    (cliente) =>
      cliente.nome.toLowerCase().includes(clientesBusca.toLowerCase()) ||
      cliente.email?.toLowerCase().includes(clientesBusca.toLowerCase()),
  );

  // Configurações dos estágios
  const estagiosConfig = {
    [EstagioOportunidade.LEADS]: {
      nome: 'Leads',
      cor: 'bg-gray-100 text-gray-800',
      probabilidade: 10,
    },
    [EstagioOportunidade.QUALIFICACAO]: {
      nome: 'Qualificação',
      cor: 'bg-blue-100 text-blue-800',
      probabilidade: 25,
    },
    [EstagioOportunidade.PROPOSTA]: {
      nome: 'Proposta',
      cor: 'bg-yellow-100 text-yellow-800',
      probabilidade: 50,
    },
    [EstagioOportunidade.NEGOCIACAO]: {
      nome: 'Negociação',
      cor: 'bg-orange-100 text-orange-800',
      probabilidade: 75,
    },
    [EstagioOportunidade.FECHAMENTO]: {
      nome: 'Fechamento',
      cor: 'bg-green-100 text-green-800',
      probabilidade: 90,
    },
  };

  const prioridadesConfig = {
    [PrioridadeOportunidade.BAIXA]: { nome: 'Baixa', cor: 'bg-green-100 text-green-800' },
    [PrioridadeOportunidade.MEDIA]: { nome: 'Média', cor: 'bg-yellow-100 text-yellow-800' },
    [PrioridadeOportunidade.ALTA]: { nome: 'Alta', cor: 'bg-red-100 text-red-800' },
  };

  const origensConfig = {
    [OrigemOportunidade.WEBSITE]: { nome: 'Website', icone: Globe },
    [OrigemOportunidade.TELEFONE]: { nome: 'Telefone', icone: Phone },
    [OrigemOportunidade.EMAIL]: { nome: 'Email', icone: Mail },
    [OrigemOportunidade.REDES_SOCIAIS]: { nome: 'Redes Sociais', icone: Users },
    [OrigemOportunidade.INDICACAO]: { nome: 'Indicação', icone: Star },
    [OrigemOportunidade.EVENTO]: { nome: 'Evento', icone: Calendar },
    [OrigemOportunidade.PARCEIRO]: { nome: 'Parceiro', icone: Briefcase },
  };

  // Handlers
  const handleEstagioChange = (estagio: EstagioOportunidade) => {
    setValue('estagio', estagio);
    setValue('probabilidade', estagiosConfig[estagio].probabilidade);
  };

  const handleClienteSelect = (cliente: Cliente) => {
    setValue('clienteId', cliente.id);
    setValue('nomeContato', cliente.nome);
    setValue('emailContato', cliente.email || '');
    setValue('telefoneContato', cliente.telefone || '');
    setValue('empresaContato', cliente.empresa || '');
    setClientesBusca('');
    setShowClienteForm(false);
  };

  const onSubmit = async (data: OportunidadeFormData) => {
    try {
      setIsSubmitting(true);

      console.log('Dados do formulário:', data);

      // Validação extra para o valor
      if (!data.valor || isNaN(data.valor) || data.valor <= 0) {
        toast.error('Por favor, insira um valor válido para a oportunidade');
        setIsSubmitting(false);
        return;
      }

      const oportunidadeData: NovaOportunidade = {
        titulo: data.titulo,
        descricao: data.descricao || undefined,
        valor: data.valor,
        probabilidade: data.probabilidade,
        estagio: data.estagio,
        prioridade: data.prioridade,
        origem: data.origem,
        tags: data.tags?.length ? data.tags : undefined,
        dataFechamentoEsperado: data.dataFechamentoEsperado || undefined,
        responsavel_id: data.responsavelId,
        cliente_id: data.clienteId || undefined,
        nomeContato: data.nomeContato || undefined,
        emailContato: data.emailContato || undefined,
        telefoneContato: data.telefoneContato || undefined,
        empresaContato: data.empresaContato || undefined,
      };

      console.log('Dados limpos a serem enviados:', oportunidadeData);

      if (isEdit && oportunidade) {
        await atualizarOportunidade({
          id: oportunidade.id,
          ...oportunidadeData,
        });
        toast.success('Oportunidade atualizada com sucesso!');
      } else {
        await criarOportunidade(oportunidadeData);
        toast.success('Oportunidade criada com sucesso!');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar oportunidade:', error);
      toast.error('Erro ao salvar oportunidade');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (!isOpen) return null;

  return (
    <ErrorBoundary>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

          <div className="relative w-[calc(100%-2rem)] sm:w-[700px] md:w-[800px] lg:w-[900px] xl:w-[1000px] max-w-[1100px] bg-white rounded-xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#159A9C] rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {isEdit ? 'Editar Oportunidade' : 'Nova Oportunidade'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {isEdit
                      ? 'Atualize as informações da oportunidade'
                      : 'Preencha os dados da nova oportunidade'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                {[
                  { number: 1, title: 'Informações Básicas', icon: FileText },
                  { number: 2, title: 'Contato & Cliente', icon: User },
                  { number: 3, title: 'Configurações', icon: Target },
                  { number: 4, title: 'Revisão', icon: Check },
                ].map((stepItem) => {
                  const StepIcon = stepItem.icon;
                  const isActive = step === stepItem.number;
                  const isCompleted = step > stepItem.number;

                  return (
                    <div key={stepItem.number} className="flex items-center space-x-2">
                      <div
                        className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${
                        isActive
                          ? 'bg-[#159A9C] text-white'
                          : isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                      }
                    `}
                      >
                        {isCompleted ? <Check className="w-4 h-4" /> : stepItem.number}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          isActive
                            ? 'text-[#159A9C]'
                            : isCompleted
                              ? 'text-green-600'
                              : 'text-gray-500'
                        }`}
                      >
                        {stepItem.title}
                      </span>
                      {stepItem.number < 4 && (
                        <div
                          className={`w-8 h-px ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit as any)}>
              <div className="p-6 min-h-[500px]">
                {/* Step 1: Informações Básicas */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Título */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Título da Oportunidade *
                        </label>
                        <Controller
                          name="titulo"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              placeholder="Ex: Implementação de CRM para empresa X"
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                                errors.titulo ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                          )}
                        />
                        {errors.titulo && (
                          <p className="mt-1 text-sm text-red-600">{errors.titulo.message}</p>
                        )}
                      </div>

                      {/* Valor */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Valor da Oportunidade *
                        </label>
                        <Controller
                          name="valor"
                          control={control}
                          render={({ field: { onChange, value, ...field } }) => (
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                {...field}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0,00"
                                value={value || ''}
                                onChange={(e) => {
                                  const numValue = parseFloat(e.target.value);
                                  onChange(isNaN(numValue) ? undefined : numValue);
                                }}
                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                                  errors.valor ? 'border-red-300' : 'border-gray-300'
                                }`}
                              />
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                                {value && !isNaN(value) ? formatCurrency(value) : 'R$ 0,00'}
                              </div>
                            </div>
                          )}
                        />
                        {errors.valor && (
                          <p className="mt-1 text-sm text-red-600">{errors.valor.message}</p>
                        )}
                      </div>

                      {/* Data de Fechamento */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Data de Fechamento Esperada *
                        </label>
                        <Controller
                          name="dataFechamentoEsperado"
                          control={control}
                          render={({ field: { value, onChange } }) => (
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="date"
                                value={
                                  value instanceof Date ? value.toISOString().split('T')[0] : value
                                }
                                onChange={(e) => onChange(new Date(e.target.value))}
                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                                  errors.dataFechamentoEsperado
                                    ? 'border-red-300'
                                    : 'border-gray-300'
                                }`}
                              />
                            </div>
                          )}
                        />
                        {errors.dataFechamentoEsperado && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.dataFechamentoEsperado.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Descrição */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrição
                      </label>
                      <Controller
                        name="descricao"
                        control={control}
                        render={({ field }) => (
                          <textarea
                            {...field}
                            rows={4}
                            placeholder="Descreva os detalhes da oportunidade..."
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent resize-none ${
                              errors.descricao ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                        )}
                      />
                      {errors.descricao && (
                        <p className="mt-1 text-sm text-red-600">{errors.descricao.message}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Contato & Cliente */}
                {step === 2 && (
                  <div className="space-y-6">
                    {/* Seleção de Cliente */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cliente
                      </label>
                      <div className="space-y-3">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Buscar cliente existente..."
                            value={clientesBusca}
                            onChange={(e) => setClientesBusca(e.target.value)}
                            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          />
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>

                        {clientesBusca && clientesFiltrados.length > 0 && (
                          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                            {clientesFiltrados.map((cliente) => (
                              <button
                                key={cliente.id}
                                type="button"
                                onClick={() => handleClienteSelect(cliente)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{cliente.nome}</div>
                                <div className="text-sm text-gray-500">
                                  {cliente.email} • {cliente.telefone}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setShowClienteForm(!showClienteForm)}
                          className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#159A9C] hover:text-[#159A9C] transition-colors"
                        >
                          <Plus className="w-4 h-4 inline mr-2" />
                          {showClienteForm ? 'Usar cliente existente' : 'Adicionar novo contato'}
                        </button>
                      </div>
                    </div>

                    {/* Formulário de Contato */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome do Contato *
                        </label>
                        <Controller
                          name="nomeContato"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              placeholder="Nome completo"
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                                errors.nomeContato ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                          )}
                        />
                        {errors.nomeContato && (
                          <p className="mt-1 text-sm text-red-600">{errors.nomeContato.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <Controller
                          name="emailContato"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="email"
                              placeholder="email@exemplo.com"
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                                errors.emailContato ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                          )}
                        />
                        {errors.emailContato && (
                          <p className="mt-1 text-sm text-red-600">{errors.emailContato.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Telefone
                        </label>
                        <Controller
                          name="telefoneContato"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="tel"
                              placeholder="(11) 99999-9999"
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                                errors.telefoneContato ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                          )}
                        />
                        {errors.telefoneContato && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.telefoneContato.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Empresa
                        </label>
                        <Controller
                          name="empresaContato"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              placeholder="Nome da empresa"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Configurações */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Estágio */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estágio da Oportunidade
                        </label>
                        <Controller
                          name="estagio"
                          control={control}
                          render={({ field }) => (
                            <div className="grid grid-cols-1 gap-2">
                              {Object.entries(estagiosConfig).map(([key, config]) => (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => handleEstagioChange(key as EstagioOportunidade)}
                                  className={`
                                  p-3 rounded-lg border-2 text-left transition-all
                                  ${
                                    field.value === key
                                      ? 'border-[#159A9C] bg-[#159A9C]/5'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }
                                `}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{config.nome}</span>
                                    <span
                                      className={`px-2 py-1 text-xs rounded-full ${config.cor}`}
                                    >
                                      {config.probabilidade}%
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        />
                      </div>

                      {/* Probabilidade */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Probabilidade de Fechamento
                        </label>
                        <Controller
                          name="probabilidade"
                          control={control}
                          render={({ field }) => (
                            <div className="space-y-3">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                              />
                              <div className="flex justify-between text-sm text-gray-500">
                                <span>0%</span>
                                <span className="font-medium text-[#159A9C]">{field.value}%</span>
                                <span>100%</span>
                              </div>
                            </div>
                          )}
                        />
                      </div>

                      {/* Prioridade */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prioridade
                        </label>
                        <Controller
                          name="prioridade"
                          control={control}
                          render={({ field }) => (
                            <div className="flex space-x-2">
                              {Object.entries(prioridadesConfig).map(([key, config]) => (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => field.onChange(key)}
                                  className={`
                                  flex-1 p-3 rounded-lg border-2 text-center transition-all
                                  ${
                                    field.value === key
                                      ? 'border-[#159A9C] bg-[#159A9C]/5'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }
                                `}
                                >
                                  <span className={`px-2 py-1 rounded-full text-sm ${config.cor}`}>
                                    {config.nome}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        />
                      </div>

                      {/* Origem */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Origem da Oportunidade
                        </label>
                        <Controller
                          name="origem"
                          control={control}
                          render={({ field }) => (
                            <select
                              value={field.value}
                              onChange={field.onChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                            >
                              {Object.entries(origensConfig).map(([key, config]) => (
                                <option key={key} value={key}>
                                  {config.nome}
                                </option>
                              ))}
                            </select>
                          )}
                        />
                      </div>

                      {/* Responsável */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Responsável
                        </label>
                        <Controller
                          name="responsavelId"
                          control={control}
                          render={({ field }) => (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {responsaveis.map((responsavel) => (
                                <button
                                  key={responsavel.id}
                                  type="button"
                                  onClick={() => field.onChange(responsavel.id)}
                                  className={`
                                  p-4 rounded-lg border-2 text-left transition-all
                                  ${
                                    field.value === responsavel.id
                                      ? 'border-[#159A9C] bg-[#159A9C]/5'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }
                                `}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                      <User className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <div>
                                      <div className="font-medium">{responsavel.nome}</div>
                                      <div className="text-sm text-gray-500">
                                        {responsavel.email}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Revisão */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Revisão da Oportunidade
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Título</label>
                            <p className="text-gray-900">{watchedValues.titulo}</p>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-500">Valor</label>
                            <p className="text-2xl font-bold text-[#159A9C]">
                              {watchedValues.valor && !isNaN(watchedValues.valor)
                                ? formatCurrency(watchedValues.valor)
                                : 'R$ 0,00'}
                            </p>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Probabilidade
                            </label>
                            <p className="text-gray-900">{watchedValues.probabilidade}%</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Contato</label>
                            <p className="text-gray-900">{watchedValues.nomeContato}</p>
                            <p className="text-sm text-gray-500">{watchedValues.emailContato}</p>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-500">Estágio</label>
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-sm ${
                                estagiosConfig[watchedValues.estagio].cor
                              }`}
                            >
                              {estagiosConfig[watchedValues.estagio].nome}
                            </span>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-500">Prioridade</label>
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-sm ${
                                prioridadesConfig[watchedValues.prioridade].cor
                              }`}
                            >
                              {prioridadesConfig[watchedValues.prioridade].nome}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200">
                <div className="flex space-x-3">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Anterior
                    </button>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>

                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={() => setStep(step + 1)}
                      disabled={
                        (step === 1 &&
                          (!watchedValues.titulo ||
                            !watchedValues.valor ||
                            isNaN(watchedValues.valor) ||
                            watchedValues.valor <= 0 ||
                            !watchedValues.dataFechamentoEsperado)) ||
                        (step === 2 && (!watchedValues.nomeContato || !watchedValues.emailContato))
                      }
                      className="flex items-center px-6 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#138A8C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Próximo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting || !isValid}
                      className="flex items-center px-6 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#138A8C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {isEdit ? 'Atualizar' : 'Criar'} Oportunidade
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};
