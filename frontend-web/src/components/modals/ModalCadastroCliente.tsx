import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useI18n } from '../../contexts/I18nContext';
import {
  X,
  User,
  Mail,
  Phone,
  FileText,
  MapPin,
  Building,
  Tag,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';

// Função para validar CPF
const validarCPF = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(digits[10]);
};

// Função para validar CNPJ
const validarCNPJ = (cnpj: string): boolean => {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(digits[i]) * weights1[i];
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;

  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(digits[i]) * weights2[i];
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;

  return digit1 === parseInt(digits[12]) && digit2 === parseInt(digits[13]);
};

// Schema de validação com Yup
const clienteSchema = yup.object({
  // Dados Básicos - Obrigatórios
  nome: yup
    .string()
    .required('Nome é obrigatório')
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),

  email: yup
    .string()
    .required('E-mail é obrigatório')
    .email('E-mail deve ter formato válido')
    .max(100, 'E-mail deve ter no máximo 100 caracteres'),

  telefone: yup
    .string()
    .required('Telefone é obrigatório')
    .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (11) 99999-9999'),

  tipo: yup
    .string()
    .required('Tipo de cliente é obrigatório')
    .oneOf(['pessoa_fisica', 'pessoa_juridica'], 'Tipo deve ser Pessoa Física ou Jurídica'),

  cpf: yup.string().when('tipo', {
    is: 'pessoa_fisica',
    then: (schema) =>
      schema
        .required('CPF é obrigatório para Pessoa Física')
        .test('cpf-valido', 'CPF inválido', (value) => {
          if (!value) return false;
          return validarCPF(value);
        }),
    otherwise: (schema) => schema.notRequired(),
  }),

  cnpj: yup.string().when('tipo', {
    is: 'pessoa_juridica',
    then: (schema) =>
      schema
        .required('CNPJ é obrigatório para Pessoa Jurídica')
        .test('cnpj-valido', 'CNPJ inválido', (value) => {
          if (!value) return false;
          return validarCNPJ(value);
        }),
    otherwise: (schema) => schema.notRequired(),
  }),

  status: yup
    .string()
    .required('Status é obrigatório')
    .oneOf(['cliente', 'lead', 'prospect', 'inativo'], 'Status inválido'),

  // Endereço - Obrigatórios
  cep: yup
    .string()
    .required('CEP é obrigatório')
    .matches(/^\d{5}-\d{3}$/, 'CEP deve estar no formato 12345-678'),

  logradouro: yup
    .string()
    .required('Logradouro é obrigatório')
    .max(200, 'Logradouro deve ter no máximo 200 caracteres'),

  numero: yup
    .string()
    .required('Número é obrigatório')
    .max(10, 'Número deve ter no máximo 10 caracteres'),

  complemento: yup.string().max(100, 'Complemento deve ter no máximo 100 caracteres'),

  bairro: yup
    .string()
    .required('Bairro é obrigatório')
    .max(100, 'Bairro deve ter no máximo 100 caracteres'),

  cidade: yup
    .string()
    .required('Cidade é obrigatória')
    .max(100, 'Cidade deve ter no máximo 100 caracteres'),

  estado: yup
    .string()
    .required('Estado é obrigatório')
    .length(2, 'Estado deve ter 2 caracteres (ex: SP)'),

  // Observações e Tags - Opcionais
  tags: yup.array().of(yup.string()).max(10, 'Máximo de 10 tags permitidas'),

  observacoes: yup.string().max(1000, 'Observações deve ter no máximo 1000 caracteres'),
});

interface ModalCadastroClienteProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cliente: any) => Promise<void>;
  cliente?: any;
  isLoading?: boolean;
}

interface ClienteFormData {
  nome: string;
  email: string;
  telefone: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
  cpf?: string;
  cnpj?: string;
  status: 'cliente' | 'lead' | 'prospect' | 'inativo';
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  tags: string[];
  observacoes?: string;
}

const ModalCadastroCliente: React.FC<ModalCadastroClienteProps> = ({
  isOpen,
  onClose,
  onSave,
  cliente,
  isLoading = false,
}) => {
  // Hook de internacionalização
  const { t } = useI18n();

  // Estados para funcionalidades extras
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tagsDisponiveis] = useState([
    'VIP',
    'Premium',
    'Corporativo',
    'Startup',
    'SMB',
    'Enterprise',
    'Freelancer',
    'Consultor',
    'Agência',
    'E-commerce',
    'SaaS',
    'Fintech',
  ]);
  const [showStatusPanel, setShowStatusPanel] = useState(true);

  // Configuração do React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
    setValue,
    watch,
    reset,
    trigger,
  } = useForm<ClienteFormData>({
    resolver: yupResolver(clienteSchema),
    mode: 'onChange', // Validação em tempo real
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      tipo: 'pessoa_fisica',
      cpf: '',
      cnpj: '',
      status: 'lead',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      tags: [],
      observacoes: '',
    },
  });

  // Observar mudanças nos campos
  const watchedTipo = watch('tipo');
  const watchedCep = watch('cep');
  const watchedTags = watch('tags') || [];
  const watchedObservacoes = watch('observacoes') || '';

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (cliente) {
        // Modo edição
        reset({
          nome: cliente.nome || '',
          email: cliente.email || '',
          telefone: cliente.telefone || '',
          tipo: cliente.tipo || 'pessoa_fisica',
          cpf: cliente.documento && cliente.tipo === 'pessoa_fisica' ? cliente.documento : '',
          cnpj: cliente.documento && cliente.tipo === 'pessoa_juridica' ? cliente.documento : '',
          status: cliente.status || 'lead',
          cep: cliente.cep || '',
          logradouro: cliente.endereco?.split(',')[0] || '',
          numero: cliente.endereco?.split(',')[1] || '',
          complemento: cliente.endereco?.split(',')[2] || '',
          bairro: cliente.endereco?.split(',')[3] || '',
          cidade: cliente.cidade || '',
          estado: cliente.estado || '',
          tags: cliente.tags || [],
          observacoes: cliente.observacoes || '',
        });
      } else {
        // Modo criação
        reset({
          nome: '',
          email: '',
          telefone: '',
          tipo: 'pessoa_fisica',
          cpf: '',
          cnpj: '',
          status: 'lead',
          cep: '',
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
          tags: [],
          observacoes: '',
        });
      }
    }
  }, [isOpen, cliente, reset]);

  // Função para buscar endereço por CEP
  const buscarCep = async (cep: string) => {
    if (cep.length !== 9) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setValue('logradouro', data.logradouro || '');
        setValue('bairro', data.bairro || '');
        setValue('cidade', data.localidade || '');
        setValue('estado', data.uf || '');

        // Trigger validation for updated fields
        await trigger(['logradouro', 'bairro', 'cidade', 'estado']);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setIsLoadingCep(false);
    }
  };

  // Effect para buscar CEP automaticamente
  useEffect(() => {
    if (watchedCep && watchedCep.length === 9) {
      buscarCep(watchedCep);
    }
  }, [watchedCep]);

  // Função para adicionar tag
  const adicionarTag = (tag: string) => {
    const tagLimpa = tag.trim();
    if (tagLimpa && !watchedTags.includes(tagLimpa) && watchedTags.length < 10) {
      setValue('tags', [...watchedTags, tagLimpa]);
      setTagInput('');
    }
  };

  // Função para remover tag
  const removerTag = (tagParaRemover: string) => {
    setValue(
      'tags',
      watchedTags.filter((tag) => tag !== tagParaRemover),
    );
  };

  // Função para formatar telefone
  const formatarTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  // Função para formatar CPF
  const formatarCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Função para formatar CNPJ
  const formatarCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  // Função para formatar CEP
  const formatarCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  // Handler para submit
  const onSubmit = async (data: ClienteFormData) => {
    try {
      // Mostrar toast de carregamento
      const loadingToast = toast.loading(
        cliente ? 'Atualizando cliente...' : 'Cadastrando cliente...',
      );

      // Preparar dados para envio
      const clienteData = {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone.replace(/\D/g, ''), // Remove formatação
        tipo: data.tipo,
        documento:
          data.tipo === 'pessoa_fisica'
            ? data.cpf?.replace(/\D/g, '')
            : data.cnpj?.replace(/\D/g, ''),
        status: data.status,
        cep: data.cep.replace(/\D/g, ''), // Remove formatação
        endereco: `${data.logradouro}, ${data.numero}${data.complemento ? ', ' + data.complemento : ''}, ${data.bairro}`,
        cidade: data.cidade,
        estado: data.estado,
        tags: data.tags,
        observacoes: data.observacoes || '',
      };

      await onSave(clienteData);

      // Remover toast de carregamento e mostrar sucesso
      toast.dismiss(loadingToast);
      toast.success(
        cliente ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!',
        {
          duration: 4000,
          position: 'top-right',
          icon: '✅',
        },
      );
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);

      // Mostrar toast de erro
      toast.error(
        cliente
          ? 'Erro ao atualizar cliente. Tente novamente.'
          : 'Erro ao cadastrar cliente. Tente novamente.',
        {
          duration: 5000,
          position: 'top-right',
          icon: '❌',
        },
      );
    }
  };

  // Função para contar campos válidos
  const contarCamposValidos = () => {
    const camposObrigatorios = [
      'nome',
      'email',
      'telefone',
      'tipo',
      'status',
      'cep',
      'logradouro',
      'numero',
      'bairro',
      'cidade',
      'estado',
    ];

    // Adicionar CPF ou CNPJ dependendo do tipo
    if (watchedTipo === 'pessoa_fisica') {
      camposObrigatorios.push('cpf');
    } else {
      camposObrigatorios.push('cnpj');
    }

    let validosCount = 0;
    camposObrigatorios.forEach((campo) => {
      if (
        touchedFields[campo as keyof ClienteFormData] &&
        !errors[campo as keyof ClienteFormData]
      ) {
        validosCount++;
      }
    });

    return { validosCount, totalCount: camposObrigatorios.length };
  };

  const { validosCount, totalCount } = contarCamposValidos();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 overflow-y-auto py-6 px-4">
      <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl flex flex-col max-h-full sm:max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-[#DEEFE7] rounded-lg">
              <User className="w-5 h-5 text-[#159A9C]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#002333]">
                {cliente ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <p className="text-sm text-[#B4BEC9]">Preencha os dados do cliente abaixo</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setShowStatusPanel(!showStatusPanel)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title={showStatusPanel ? 'Ocultar painel de status' : 'Mostrar painel de status'}
            >
              {showStatusPanel ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>

            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-1 min-h-0 flex-col lg:flex-row overflow-hidden">
            <div
              className={`flex-1 min-h-0 p-6 overflow-y-auto overscroll-y-contain touch-pan-y ${showStatusPanel ? 'lg:pr-4' : ''}`}
            >
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Layout em 3 colunas */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {/* COLUNA 1: DADOS BÁSICOS */}
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-2 mb-4">
                      <h3 className="text-lg font-semibold text-[#002333] flex items-center">
                        <User className="w-5 h-5 mr-2 text-[#159A9C]" />
                        Dados Básicos
                      </h3>
                    </div>

                    {/* Nome */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome Completo *
                      </label>
                      <input
                        {...register('nome')}
                        type="text"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${errors.nome ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="Digite o nome completo"
                      />
                      {errors.nome && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {errors.nome.message}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-mail *
                      </label>
                      <input
                        {...register('email')}
                        type="email"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${errors.email ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="Digite o e-mail"
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* Telefone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone *
                      </label>
                      <input
                        {...register('telefone')}
                        type="text"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${errors.telefone ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="(11) 99999-9999"
                        onChange={(e) => {
                          const formatted = formatarTelefone(e.target.value);
                          setValue('telefone', formatted);
                        }}
                      />
                      {errors.telefone && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {errors.telefone.message}
                        </p>
                      )}
                    </div>

                    {/* Tipo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Cliente *
                      </label>
                      <select
                        {...register('tipo')}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${errors.tipo ? 'border-red-300' : 'border-gray-300'
                          }`}
                        onChange={(e) => {
                          setValue('tipo', e.target.value as 'pessoa_fisica' | 'pessoa_juridica');
                          // Limpar CPF/CNPJ ao trocar tipo
                          setValue('cpf', '');
                          setValue('cnpj', '');
                        }}
                      >
                        <option value="pessoa_fisica">Pessoa Física</option>
                        <option value="pessoa_juridica">Pessoa Jurídica</option>
                      </select>
                      {errors.tipo && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {errors.tipo.message}
                        </p>
                      )}
                    </div>

                    {/* CPF/CNPJ */}
                    {watchedTipo === 'pessoa_fisica' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CPF *
                        </label>
                        <input
                          {...register('cpf')}
                          type="text"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${errors.cpf ? 'border-red-300' : 'border-gray-300'
                            }`}
                          placeholder="000.000.000-00"
                          onChange={(e) => {
                            const formatted = formatarCPF(e.target.value);
                            setValue('cpf', formatted);
                          }}
                        />
                        {errors.cpf && (
                          <p className="mt-1 text-xs text-red-600 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {errors.cpf.message}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CNPJ *
                        </label>
                        <input
                          {...register('cnpj')}
                          type="text"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${errors.cnpj ? 'border-red-300' : 'border-gray-300'
                            }`}
                          placeholder="00.000.000/0000-00"
                          onChange={(e) => {
                            const formatted = formatarCNPJ(e.target.value);
                            setValue('cnpj', formatted);
                          }}
                        />
                        {errors.cnpj && (
                          <p className="mt-1 text-xs text-red-600 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {errors.cnpj.message}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status *
                      </label>
                      <select
                        {...register('status')}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${errors.status ? 'border-red-300' : 'border-gray-300'
                          }`}
                      >
                        <option value="lead">Lead</option>
                        <option value="prospect">Prospect</option>
                        <option value="cliente">Cliente</option>
                        <option value="inativo">Inativo</option>
                      </select>
                      {errors.status && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {errors.status.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* COLUNA 2: ENDEREÇO */}
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-2 mb-4">
                      <h3 className="text-lg font-semibold text-[#002333] flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-[#159A9C]" />
                        Endereço
                      </h3>
                    </div>

                    {/* CEP */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CEP *</label>
                      <div className="relative">
                        <input
                          {...register('cep')}
                          type="text"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${errors.cep ? 'border-red-300' : 'border-gray-300'
                            }`}
                          placeholder="12345-678"
                          onChange={(e) => {
                            const formatted = formatarCep(e.target.value);
                            setValue('cep', formatted);
                          }}
                        />
                        {isLoadingCep && (
                          <div className="absolute right-3 top-2.5">
                            <Clock className="w-4 h-4 text-[#159A9C] animate-spin" />
                          </div>
                        )}
                      </div>
                      {errors.cep && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {errors.cep.message}
                        </p>
                      )}
                    </div>

                    {/* Logradouro */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Logradouro *
                      </label>
                      <input
                        {...register('logradouro')}
                        type="text"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${errors.logradouro ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="Rua, Avenida, etc."
                      />
                      {errors.logradouro && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {errors.logradouro.message}
                        </p>
                      )}
                    </div>

                    {/* Número e Complemento */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Número *
                        </label>
                        <input
                          {...register('numero')}
                          type="text"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${errors.numero ? 'border-red-300' : 'border-gray-300'
                            }`}
                          placeholder="123"
                        />
                        {errors.numero && (
                          <p className="mt-1 text-xs text-red-600 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {errors.numero.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('common.complement')}
                        </label>
                        <input
                          {...register('complemento')}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                          placeholder="Apto, Sala, etc."
                        />
                      </div>
                    </div>

                    {/* Bairro */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('common.neighborhood')} *
                      </label>
                      <input
                        {...register('bairro')}
                        type="text"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${errors.bairro ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="Nome do bairro"
                      />
                      {errors.bairro && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {errors.bairro.message}
                        </p>
                      )}
                    </div>

                    {/* Cidade e Estado */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cidade *
                        </label>
                        <input
                          {...register('cidade')}
                          type="text"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${errors.cidade ? 'border-red-300' : 'border-gray-300'
                            }`}
                          placeholder="Nome da cidade"
                        />
                        {errors.cidade && (
                          <p className="mt-1 text-xs text-red-600 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {errors.cidade.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estado *
                        </label>
                        <input
                          {...register('estado')}
                          type="text"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${errors.estado ? 'border-red-300' : 'border-gray-300'
                            }`}
                          placeholder="SP"
                          maxLength={2}
                          style={{ textTransform: 'uppercase' }}
                        />
                        {errors.estado && (
                          <p className="mt-1 text-xs text-red-600 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {errors.estado.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* COLUNA 3: OBSERVAÇÕES E TAGS */}
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-2 mb-4">
                      <h3 className="text-lg font-semibold text-[#002333] flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-[#159A9C]" />
                        Observações
                      </h3>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags ({watchedTags.length}/10)
                      </label>

                      {/* Tags existentes */}
                      {watchedTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {watchedTags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#DEEFE7] text-[#159A9C] border border-[#159A9C]/20"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => removerTag(tag)}
                                className="ml-1.5 hover:text-red-500 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Input para adicionar tags */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              adicionarTag(tagInput);
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                          placeholder="Digite uma tag"
                          disabled={watchedTags.length >= 10}
                        />
                        <button
                          type="button"
                          onClick={() => adicionarTag(tagInput)}
                          disabled={!tagInput.trim() || watchedTags.length >= 10}
                          className="px-3 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                        >
                          <Tag className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Tags sugeridas */}
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-2">Sugestões:</p>
                        <div className="flex flex-wrap gap-1">
                          {tagsDisponiveis
                            .filter((tag) => !watchedTags.includes(tag))
                            .slice(0, 6)
                            .map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => adicionarTag(tag)}
                                disabled={watchedTags.length >= 10}
                                className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {tag}
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>

                    {/* Observações */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observações ({watchedObservacoes.length}/1000)
                      </label>
                      <textarea
                        {...register('observacoes')}
                        rows={8}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors resize-none ${errors.observacoes ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="Adicione observações sobre o cliente..."
                      />
                      {errors.observacoes && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {errors.observacoes.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer com botões */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-500 text-center sm:text-left">
                    {t('form.requiredFields')}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>

                    <button
                      type="submit"
                      disabled={!isValid || isLoading}
                      className={`w-full sm:w-auto px-6 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${isValid && !isLoading
                        ? 'bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white hover:shadow-lg'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>
                        {isLoading
                          ? 'Criando cliente...'
                          : cliente
                            ? 'Salvar Alterações'
                            : 'Criar Cliente'}
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Status Panel (sidebar) */}
            {showStatusPanel && (
              <div className="w-full lg:w-72 bg-gray-50 border-t border-gray-200 lg:border-t-0 lg:border-l p-6 overflow-y-auto overscroll-y-contain touch-pan-y min-h-0">
                <div className="lg:sticky lg:top-6">
                  <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-[#159A9C]" />
                    Status do Formulário
                  </h3>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progresso</span>
                      <span>
                        {validosCount}/{totalCount}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(validosCount / totalCount) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Validação geral */}
                  <div className="space-y-3">
                    <div
                      className={`flex items-center space-x-2 p-2 rounded-lg ${isValid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                      {isValid ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">
                        {isValid ? 'Formulário válido' : 'Formulário incompleto'}
                      </span>
                    </div>
                  </div>

                  {/* Lista de campos */}
                  <div className="mt-6 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Campos obrigatórios:</h4>

                    {[
                      { key: 'nome', label: 'Nome completo' },
                      { key: 'email', label: 'E-mail' },
                      { key: 'telefone', label: 'Telefone' },
                      { key: 'tipo', label: 'Tipo' },
                      {
                        key: watchedTipo === 'pessoa_fisica' ? 'cpf' : 'cnpj',
                        label: watchedTipo === 'pessoa_fisica' ? 'CPF' : 'CNPJ',
                      },
                      { key: 'status', label: 'Status' },
                      { key: 'cep', label: 'CEP' },
                      { key: 'logradouro', label: 'Logradouro' },
                      { key: 'numero', label: 'Número' },
                      { key: 'bairro', label: 'Bairro' },
                      { key: 'cidade', label: 'Cidade' },
                      { key: 'estado', label: 'Estado' },
                    ].map(({ key, label }) => {
                      const hasError = !!errors[key as keyof ClienteFormData];
                      const isTouched = touchedFields[key as keyof ClienteFormData];
                      const isFieldValid = isTouched && !hasError;

                      return (
                        <div key={key} className="flex items-center space-x-2 text-sm">
                          {isFieldValid ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : hasError ? (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                          )}
                          <span
                            className={`${isFieldValid
                              ? 'text-green-700'
                              : hasError
                                ? 'text-red-700'
                                : 'text-gray-600'
                              }`}
                          >
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalCadastroCliente;
