import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import {
  X,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { Fornecedor, NovoFornecedor } from '../../../services/fornecedorService';
import { useI18n } from '../../../contexts/I18nContext';

// Interface para os dados do formulário
interface FornecedorFormData {
  // Dados Básicos
  nome: string;
  razaoSocial?: string;
  email?: string;
  telefone?: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
  cpf?: string;
  cnpj?: string;

  // Endereço
  cep?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;

  // Outros
  contato?: string;
  cargo?: string;
  observacoes?: string;
  ativo: boolean;
}

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
const fornecedorSchema = yup.object({
  // Dados Básicos - Obrigatórios
  nome: yup
    .string()
    .required('Nome é obrigatório')
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),

  razaoSocial: yup.string().max(100, 'Razão Social deve ter no máximo 100 caracteres'),

  email: yup
    .string()
    .email('E-mail deve ter formato válido')
    .max(100, 'E-mail deve ter no máximo 100 caracteres'),

  telefone: yup
    .string()
    .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (11) 99999-9999'),

  tipo: yup
    .string()
    .required('Tipo é obrigatório')
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

  // Endereço - Opcionais
  cep: yup.string().matches(/^\d{5}-\d{3}$/, 'CEP deve estar no formato 12345-678'),

  endereco: yup.string().max(200, 'Endereço deve ter no máximo 200 caracteres'),

  numero: yup.string().max(10, 'Número deve ter no máximo 10 caracteres'),

  bairro: yup.string().max(100, 'Bairro deve ter no máximo 100 caracteres'),

  cidade: yup.string().max(100, 'Cidade deve ter no máximo 100 caracteres'),

  estado: yup.string().length(2, 'Estado deve ter 2 caracteres (ex: SP)'),

  // Outros - Opcionais
  contato: yup.string().max(100, 'Contato deve ter no máximo 100 caracteres'),

  cargo: yup.string().max(100, 'Cargo deve ter no máximo 100 caracteres'),

  observacoes: yup.string().max(1000, 'Observações deve ter no máximo 1000 caracteres'),

  ativo: yup.boolean().required('Status é obrigatório'),
});

interface ModalFornecedorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fornecedor: NovoFornecedor) => Promise<void>;
  fornecedor?: Fornecedor | null;
  isLoading?: boolean;
}

const ModalFornecedor: React.FC<ModalFornecedorProps> = ({
  isOpen,
  onClose,
  onSave,
  fornecedor,
  isLoading = false,
}) => {
  const { t } = useI18n();

  // Estados para funcionalidades extras
  const [isLoadingCep, setIsLoadingCep] = useState(false);
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
  } = useForm<FornecedorFormData>({
    resolver: yupResolver(fornecedorSchema),
    mode: 'onChange', // Validação em tempo real
    defaultValues: {
      nome: '',
      razaoSocial: '',
      email: '',
      telefone: '',
      tipo: 'pessoa_juridica',
      cpf: '',
      cnpj: '',
      cep: '',
      endereco: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      contato: '',
      cargo: '',
      observacoes: '',
      ativo: true,
    },
  });

  // Observar mudanças nos campos
  const watchedTipo = watch('tipo');
  const watchedCep = watch('cep');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (fornecedor) {
        // Modo edição - mapeando do fornecedor para form
        const tipoDetectado =
          fornecedor.cnpjCpf?.replace(/\D/g, '').length === 14
            ? 'pessoa_juridica'
            : 'pessoa_fisica';
        reset({
          nome: fornecedor.nome || '',
          razaoSocial: fornecedor.razaoSocial || '',
          email: fornecedor.email || '',
          telefone: fornecedor.telefone || '',
          tipo: tipoDetectado,
          cpf: tipoDetectado === 'pessoa_fisica' ? fornecedor.cnpjCpf : '',
          cnpj: tipoDetectado === 'pessoa_juridica' ? fornecedor.cnpjCpf : '',
          cep: fornecedor.cep || '',
          endereco: fornecedor.endereco || '',
          numero: fornecedor.numero || '',
          bairro: fornecedor.bairro || '',
          cidade: fornecedor.cidade || '',
          estado: fornecedor.estado || '',
          contato: fornecedor.contato || '',
          cargo: fornecedor.cargo || '',
          observacoes: fornecedor.observacoes || '',
          ativo: fornecedor.ativo,
        });
      } else {
        // Modo criação
        reset({
          nome: '',
          razaoSocial: '',
          email: '',
          telefone: '',
          tipo: 'pessoa_juridica',
          cpf: '',
          cnpj: '',
          cep: '',
          endereco: '',
          numero: '',
          bairro: '',
          cidade: '',
          estado: '',
          contato: '',
          cargo: '',
          observacoes: '',
          ativo: true,
        });
      }
    }
  }, [isOpen, fornecedor, reset]);

  // Função para buscar endereço por CEP
  const buscarCep = async (cep: string) => {
    if (cep.length !== 9) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setValue('endereco', data.logradouro || '');
        setValue('bairro', data.bairro || '');
        setValue('cidade', data.localidade || '');
        setValue('estado', data.uf || '');

        // Trigger validation for updated fields
        await trigger(['endereco', 'bairro', 'cidade', 'estado']);

        toast.success('Endereço preenchido automaticamente!', {
          duration: 2000,
          position: 'top-right',
        });
      } else {
        toast.error('CEP não encontrado', {
          duration: 3000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP', {
        duration: 3000,
        position: 'top-right',
      });
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
  const onSubmit = async (data: FornecedorFormData) => {
    try {
      // Mostrar toast de carregamento
      const loadingToast = toast.loading(
        fornecedor ? 'Atualizando fornecedor...' : 'Cadastrando fornecedor...',
      );

      // Preparar dados para envio - mapeando do form para NovoFornecedor
      const fornecedorData: NovoFornecedor = {
        nome: data.nome,
        razaoSocial: data.razaoSocial || '',
        email: data.email || '',
        telefone: data.telefone?.replace(/\D/g, '') || '', // Remove formatação
        cnpjCpf:
          data.tipo === 'pessoa_fisica'
            ? data.cpf?.replace(/\D/g, '') || ''
            : data.cnpj?.replace(/\D/g, '') || '',
        cep: data.cep?.replace(/\D/g, '') || '', // Remove formatação
        endereco: data.endereco || '',
        numero: data.numero || '',
        bairro: data.bairro || '',
        cidade: data.cidade || '',
        estado: data.estado || '',
        contato: data.contato || '',
        cargo: data.cargo || '',
        observacoes: data.observacoes || '',
        ativo: data.ativo,
      };

      await onSave(fornecedorData);

      // Remover toast de carregamento e mostrar sucesso
      toast.dismiss(loadingToast);
      toast.success(
        fornecedor ? 'Fornecedor atualizado com sucesso!' : 'Fornecedor cadastrado com sucesso!',
        {
          duration: 4000,
          position: 'top-right',
          icon: '✅',
        },
      );

      onClose();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);

      // Mostrar toast de erro
      toast.error(
        fornecedor
          ? 'Erro ao atualizar fornecedor. Tente novamente.'
          : 'Erro ao cadastrar fornecedor. Tente novamente.',
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
    const camposObrigatorios = ['nome', 'tipo'];

    // Adicionar CPF ou CNPJ dependendo do tipo
    if (watchedTipo === 'pessoa_fisica') {
      camposObrigatorios.push('cpf');
    } else {
      camposObrigatorios.push('cnpj');
    }

    let validosCount = 0;
    camposObrigatorios.forEach((campo) => {
      if (
        touchedFields[campo as keyof FornecedorFormData] &&
        !errors[campo as keyof FornecedorFormData]
      ) {
        validosCount++;
      }
    });

    return { validosCount, totalCount: camposObrigatorios.length };
  };

  const { validosCount, totalCount } = contarCamposValidos();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 bg-black bg-opacity-50">
        <div className="relative w-[calc(100%-2rem)] sm:w-[700px] md:w-[900px] lg:w-[1100px] xl:w-[1300px] max-w-[1600px] bg-white rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-[#DEEFE7] rounded-lg">
                <Building2 className="w-5 h-5 text-[#159A9C]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#002333]">
                  {fornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                </h2>
                <p className="text-sm text-[#B4BEC9]">Preencha os dados do fornecedor abaixo</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Toggle Status Panel */}
              <button
                type="button"
                onClick={() => setShowStatusPanel(!showStatusPanel)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title={showStatusPanel ? 'Ocultar painel de status' : 'Mostrar painel de status'}
              >
                {showStatusPanel ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>

              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex">
            {/* Form Content */}
            <div className={`${showStatusPanel ? 'w-3/4' : 'w-full'} p-6`}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Layout em 3 colunas */}
                <div className="grid grid-cols-3 gap-8">
                  {/* COLUNA 1: DADOS BÁSICOS */}
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-2 mb-4">
                      <h3 className="text-lg font-semibold text-[#002333] flex items-center">
                        <Building2 className="w-5 h-5 mr-2 text-[#159A9C]" />
                        Dados Básicos
                      </h3>
                    </div>

                    {/* Nome */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome/Razão Social *
                      </label>
                      <input
                        {...register('nome')}
                        type="text"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${
                          errors.nome ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Digite o nome do fornecedor"
                      />
                      {errors.nome && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {errors.nome.message}
                        </p>
                      )}
                    </div>

                    {/* Razão Social */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome Fantasia
                      </label>
                      <input
                        {...register('razaoSocial')}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                        placeholder="Nome fantasia"
                      />
                    </div>

                    {/* Tipo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Pessoa *
                      </label>
                      <select
                        {...register('tipo')}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${
                          errors.tipo ? 'border-red-300' : 'border-gray-300'
                        }`}
                        onChange={(e) => {
                          setValue('tipo', e.target.value as 'pessoa_fisica' | 'pessoa_juridica');
                          // Limpar CPF/CNPJ ao trocar tipo
                          setValue('cpf', '');
                          setValue('cnpj', '');
                        }}
                      >
                        <option value="pessoa_juridica">Pessoa Jurídica</option>
                        <option value="pessoa_fisica">Pessoa Física</option>
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
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${
                            errors.cpf ? 'border-red-300' : 'border-gray-300'
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
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${
                            errors.cnpj ? 'border-red-300' : 'border-gray-300'
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
                    <div className="flex items-center mt-4">
                      <input
                        {...register('ativo')}
                        type="checkbox"
                        id="ativo"
                        className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                      />
                      <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700">
                        Fornecedor ativo
                      </label>
                    </div>
                  </div>

                  {/* COLUNA 2: CONTATO */}
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-2 mb-4">
                      <h3 className="text-lg font-semibold text-[#002333] flex items-center">
                        <Phone className="w-5 h-5 mr-2 text-[#159A9C]" />
                        Contato
                      </h3>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                      <input
                        {...register('email')}
                        type="email"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="email@exemplo.com"
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
                        Telefone
                      </label>
                      <input
                        {...register('telefone')}
                        type="text"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${
                          errors.telefone ? 'border-red-300' : 'border-gray-300'
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

                    {/* Contato */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('common.contactPerson')}
                      </label>
                      <input
                        {...register('contato')}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                        placeholder="Nome do responsável"
                      />
                    </div>

                    {/* Cargo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('common.position')}
                      </label>
                      <input
                        {...register('cargo')}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                        placeholder="Cargo do responsável"
                      />
                    </div>

                    {/* Observações */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observações
                      </label>
                      <textarea
                        {...register('observacoes')}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                        placeholder="Observações adicionais..."
                      />
                      {errors.observacoes && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {errors.observacoes.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* COLUNA 3: ENDEREÇO */}
                  <div className="space-y-4">
                    <div className="border-b border-gray-200 pb-2 mb-4">
                      <h3 className="text-lg font-semibold text-[#002333] flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-[#159A9C]" />
                        Endereço
                      </h3>
                    </div>

                    {/* CEP */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                      <div className="relative">
                        <input
                          {...register('cep')}
                          type="text"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${
                            errors.cep ? 'border-red-300' : 'border-gray-300'
                          } ${isLoadingCep ? 'pr-10' : ''}`}
                          placeholder="00000-000"
                          onChange={(e) => {
                            const formatted = formatarCep(e.target.value);
                            setValue('cep', formatted);
                          }}
                        />
                        {isLoadingCep && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-[#159A9C]" />
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

                    {/* Endereço */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Logradouro
                      </label>
                      <input
                        {...register('endereco')}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                        placeholder="Rua, avenida, etc."
                      />
                    </div>

                    {/* Número */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                      <input
                        {...register('numero')}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                        placeholder="123"
                      />
                    </div>

                    {/* Bairro */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                      <input
                        {...register('bairro')}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                        placeholder="Bairro"
                      />
                    </div>

                    {/* Cidade */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                      <input
                        {...register('cidade')}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                        placeholder="Cidade"
                      />
                    </div>

                    {/* Estado */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <input
                        {...register('estado')}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                        placeholder="SP"
                        maxLength={2}
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                    disabled={isLoading}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !isValid}
                    className="px-6 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : fornecedor ? (
                      t('common.update')
                    ) : (
                      t('common.register')
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Status Panel */}
            {showStatusPanel && (
              <div className="w-1/4 bg-gray-50 border-l border-gray-200 p-6">
                <div className="space-y-6">
                  {/* Progress */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Progresso do Cadastro
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Campos obrigatórios</span>
                        <span>
                          {validosCount}/{totalCount}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#159A9C] h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${totalCount > 0 ? (validosCount / totalCount) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Status dos Campos</h4>
                    <div className="space-y-2">
                      {[
                        { key: 'nome', label: 'Nome' },
                        { key: 'tipo', label: 'Tipo' },
                        {
                          key: watchedTipo === 'pessoa_fisica' ? 'cpf' : 'cnpj',
                          label: watchedTipo === 'pessoa_fisica' ? 'CPF' : 'CNPJ',
                        },
                      ].map((campo) => (
                        <div key={campo.key} className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">{campo.label}</span>
                          {touchedFields[campo.key as keyof FornecedorFormData] ? (
                            errors[campo.key as keyof FornecedorFormData] ? (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tips */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Dicas</h4>
                    <div className="space-y-2 text-xs text-gray-600">
                      <p>• O CEP será preenchido automaticamente</p>
                      <p>• Use CPF para pessoas físicas</p>
                      <p>• Use CNPJ para empresas</p>
                      <p>• Campos com * são obrigatórios</p>
                    </div>
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

export default ModalFornecedor;
