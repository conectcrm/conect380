import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Building2,
  Mail,
  MapPin,
  Phone,
  Loader2,
  X,
} from 'lucide-react';
import { Fornecedor, NovoFornecedor } from '../../../services/fornecedorService';
import { useI18n } from '../../../contexts/I18nContext';

interface FornecedorFormData {
  nome: string;
  razaoSocial?: string;
  email?: string;
  telefone?: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
  cpf?: string;
  cnpj?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  contato?: string;
  cargo?: string;
  observacoes?: string;
  ativo: boolean;
}

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

const fornecedorSchema = yup.object({
  nome: yup
    .string()
    .required('Nome é obrigatório')
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),

  razaoSocial: yup.string().max(100, 'Razão social deve ter no máximo 100 caracteres'),

  email: yup
    .string()
    .email('E-mail deve ter formato válido')
    .max(100, 'E-mail deve ter no máximo 100 caracteres')
    .nullable(),

  telefone: yup
    .string()
    .matches(/^$|^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (11) 99999-9999')
    .nullable(),

  tipo: yup
    .string()
    .required('Tipo é obrigatório')
    .oneOf(['pessoa_fisica', 'pessoa_juridica'], 'Tipo inválido'),

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

  cep: yup.string().matches(/^$|^\d{5}-\d{3}$/, 'CEP deve estar no formato 12345-678'),
  endereco: yup.string().max(200, 'Endereço deve ter no máximo 200 caracteres'),
  numero: yup.string().max(10, 'Número deve ter no máximo 10 caracteres'),
  bairro: yup.string().max(100, 'Bairro deve ter no máximo 100 caracteres'),
  cidade: yup.string().max(100, 'Cidade deve ter no máximo 100 caracteres'),
  estado: yup.string().length(2, 'Estado deve ter 2 caracteres (ex: SP)').nullable(),

  contato: yup.string().max(100, 'Contato deve ter no máximo 100 caracteres'),
  cargo: yup.string().max(100, 'Cargo deve ter no máximo 100 caracteres'),
  observacoes: yup.string().max(1000, 'Observações deve ter no máximo 1000 caracteres'),
  ativo: yup.boolean().required(),
});

interface ModalFornecedorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fornecedor: NovoFornecedor) => Promise<void>;
  fornecedor?: Fornecedor | null;
  isLoading?: boolean;
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors';

const ModalFornecedor: React.FC<ModalFornecedorProps> = ({
  isOpen,
  onClose,
  onSave,
  fornecedor,
  isLoading = false,
}) => {
  const { t } = useI18n();
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [showAdvancedSection, setShowAdvancedSection] = useState(false);

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
    mode: 'onChange',
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

  const watchedTipo = watch('tipo');
  const watchedCep = watch('cep');

  useEffect(() => {
    if (!isOpen) return;

    if (fornecedor) {
      const tipoDetectado =
        fornecedor.cnpjCpf?.replace(/\D/g, '').length === 14 ? 'pessoa_juridica' : 'pessoa_fisica';

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
      setShowAdvancedSection(true);
      return;
    }

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
    setShowAdvancedSection(false);
  }, [fornecedor, isOpen, reset]);

  const buscarCep = async (cep: string) => {
    if (cep.length !== 9) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setValue('endereco', data.logradouro || '', { shouldDirty: true });
        setValue('bairro', data.bairro || '', { shouldDirty: true });
        setValue('cidade', data.localidade || '', { shouldDirty: true });
        setValue('estado', data.uf || '', { shouldDirty: true });

        await trigger(['endereco', 'bairro', 'cidade', 'estado']);
        toast.success('Endereço preenchido automaticamente!', { duration: 2000 });
      } else {
        toast.error('CEP não encontrado', { duration: 3000 });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP', { duration: 3000 });
    } finally {
      setIsLoadingCep(false);
    }
  };

  useEffect(() => {
    if (watchedCep && watchedCep.length === 9) {
      void buscarCep(watchedCep);
    }
  }, [watchedCep]);

  const formatarTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (!numbers) return '';
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, (_m, ddd, p1, p2) =>
        p2 ? `(${ddd}) ${p1}-${p2}` : `(${ddd}) ${p1}`,
      );
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, (_m, ddd, p1, p2) =>
      p2 ? `(${ddd}) ${p1}-${p2}` : `(${ddd}) ${p1}`,
    );
  };

  const formatarCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatarCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 14);
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  };

  const formatarCep = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 8);
    return numbers.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
  };

  const onSubmit = async (data: FornecedorFormData) => {
    try {
      const loadingToast = toast.loading(
        fornecedor ? 'Atualizando fornecedor...' : 'Cadastrando fornecedor...',
      );

      const fornecedorData: NovoFornecedor = {
        nome: data.nome,
        razaoSocial: data.razaoSocial || '',
        email: data.email || '',
        telefone: data.telefone?.replace(/\D/g, '') || '',
        cnpjCpf:
          data.tipo === 'pessoa_fisica'
            ? data.cpf?.replace(/\D/g, '') || ''
            : data.cnpj?.replace(/\D/g, '') || '',
        cep: data.cep?.replace(/\D/g, '') || '',
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

      toast.dismiss(loadingToast);
      toast.success(
        fornecedor ? 'Fornecedor atualizado com sucesso!' : 'Fornecedor cadastrado com sucesso!',
        { duration: 3500 },
      );

      onClose();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      toast.error(
        fornecedor
          ? 'Erro ao atualizar fornecedor. Tente novamente.'
          : 'Erro ao cadastrar fornecedor. Tente novamente.',
      );
    }
  };

  const contarCamposValidos = () => {
    const camposObrigatorios = ['nome', 'tipo'] as Array<keyof FornecedorFormData>;
    if (watchedTipo === 'pessoa_fisica') camposObrigatorios.push('cpf');
    else camposObrigatorios.push('cnpj');

    const validosCount = camposObrigatorios.filter((campo) => {
      const touched = touchedFields[campo];
      const hasError = errors[campo];
      return touched && !hasError;
    }).length;

    return { validosCount, totalCount: camposObrigatorios.length };
  };

  const { validosCount, totalCount } = contarCamposValidos();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="relative flex w-full max-w-[1100px] max-h-[92vh] flex-col overflow-hidden rounded-xl border border-[#DCE8EC] bg-white shadow-2xl">
          <div className="sticky top-0 z-10 border-b border-[#E4EDF0] bg-white px-6 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-[#002333]">
                  {fornecedor ? 'Editar fornecedor' : 'Novo fornecedor'}
                </h2>
                <p className="text-sm text-[#607B89]">
                  Cadastro rápido com campos básicos e seção avançada opcional.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#DCE8EC] bg-[#F6FBFC] px-3 py-1 text-xs font-medium text-[#355061]">
              <Building2 className="h-3.5 w-3.5 text-[#159A9C]" />
              Básico: {validosCount}/{totalCount}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4 rounded-xl border border-[#DCE8EC] bg-white p-4">
                <div className="border-b border-gray-200 pb-2">
                  <h3 className="text-base font-semibold text-[#002333] flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#159A9C]" />
                    Cadastro básico
                  </h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome / Razão social *</label>
                  <input
                    {...register('nome')}
                    type="text"
                    className={`${inputClass} ${errors.nome ? 'border-red-300' : ''}`}
                    placeholder="Digite o nome do fornecedor"
                  />
                  {errors.nome ? (
                    <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.nome.message}</p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome fantasia</label>
                  <input {...register('razaoSocial')} type="text" className={inputClass} placeholder="Nome fantasia" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de pessoa *</label>
                  <select
                    {...register('tipo')}
                    className={`${inputClass} ${errors.tipo ? 'border-red-300' : ''}`}
                    onChange={(e) => {
                      setValue('tipo', e.target.value as 'pessoa_fisica' | 'pessoa_juridica', {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setValue('cpf', '', { shouldDirty: true, shouldValidate: true });
                      setValue('cnpj', '', { shouldDirty: true, shouldValidate: true });
                    }}
                  >
                    <option value="pessoa_juridica">Pessoa Jurídica</option>
                    <option value="pessoa_fisica">Pessoa Física</option>
                  </select>
                  {errors.tipo ? (
                    <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.tipo.message}</p>
                  ) : null}
                </div>

                {watchedTipo === 'pessoa_fisica' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
                    <input
                      {...register('cpf')}
                      type="text"
                      className={`${inputClass} ${errors.cpf ? 'border-red-300' : ''}`}
                      placeholder="000.000.000-00"
                      onChange={(e) =>
                        setValue('cpf', formatarCPF(e.target.value), { shouldDirty: true, shouldValidate: true })
                      }
                    />
                    {errors.cpf ? (
                      <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.cpf.message}</p>
                    ) : null}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ *</label>
                    <input
                      {...register('cnpj')}
                      type="text"
                      className={`${inputClass} ${errors.cnpj ? 'border-red-300' : ''}`}
                      placeholder="00.000.000/0000-00"
                      onChange={(e) =>
                        setValue('cnpj', formatarCNPJ(e.target.value), { shouldDirty: true, shouldValidate: true })
                      }
                    />
                    {errors.cnpj ? (
                      <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.cnpj.message}</p>
                    ) : null}
                  </div>
                )}

                <div className="flex items-center pt-1">
                  <input
                    {...register('ativo')}
                    type="checkbox"
                    id="ativo"
                    className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                  />
                  <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700">Fornecedor ativo</label>
                </div>

                <p className="rounded-md border border-[#DCE8EC] bg-[#F6FBFC] px-3 py-2 text-xs text-[#355061]">
                  Obrigatório: tipo, nome e CPF/CNPJ.
                </p>
              </div>

              <div className="space-y-4 rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <h3 className="text-base font-semibold text-[#002333] flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#159A9C]" />
                    Contato principal
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedSection((prev) => !prev)}
                    className="text-xs font-medium text-[#159A9C] hover:text-[#0F7B7D]"
                  >
                    {showAdvancedSection ? 'Ocultar avançado' : 'Mostrar avançado'}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    {...register('email')}
                    type="email"
                    className={`${inputClass} ${errors.email ? 'border-red-300' : ''}`}
                    placeholder="email@exemplo.com"
                  />
                  {errors.email ? (
                    <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.email.message}</p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    {...register('telefone')}
                    type="text"
                    className={`${inputClass} ${errors.telefone ? 'border-red-300' : ''}`}
                    placeholder="(11) 99999-9999"
                    onChange={(e) =>
                      setValue('telefone', formatarTelefone(e.target.value), {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                  {errors.telefone ? (
                    <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.telefone.message}</p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.contactPerson')}</label>
                  <input {...register('contato')} type="text" className={inputClass} placeholder="Nome do responsável" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.position')}</label>
                  <input {...register('cargo')} type="text" className={inputClass} placeholder="Cargo do responsável" />
                </div>
              </div>
            </div>

            {showAdvancedSection ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4 rounded-xl border border-[#DCE8EC] bg-white p-4">
                  <div className="border-b border-gray-200 pb-2">
                    <h3 className="text-base font-semibold text-[#002333] flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#159A9C]" />
                      Endereço
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                    <div className="relative">
                      <input
                        {...register('cep')}
                        type="text"
                        className={`${inputClass} ${errors.cep ? 'border-red-300' : ''} ${isLoadingCep ? 'pr-10' : ''}`}
                        placeholder="00000-000"
                        onChange={(e) =>
                          setValue('cep', formatarCep(e.target.value), { shouldDirty: true, shouldValidate: true })
                        }
                      />
                      {isLoadingCep ? (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 className="h-4 w-4 animate-spin text-[#159A9C]" /></div>
                      ) : null}
                    </div>
                    {errors.cep ? (
                      <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.cep.message}</p>
                    ) : null}
                  </div>

                  <input {...register('endereco')} type="text" className={inputClass} placeholder="Logradouro" />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input {...register('numero')} type="text" className={inputClass} placeholder="Número" />
                    <input {...register('bairro')} type="text" className={inputClass} placeholder="Bairro" />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <input {...register('cidade')} type="text" className={`${inputClass} sm:col-span-2`} placeholder="Cidade" />
                    <input
                      {...register('estado')}
                      type="text"
                      maxLength={2}
                      className={inputClass}
                      placeholder="UF"
                      onChange={(e) =>
                        setValue('estado', e.target.value.toUpperCase(), { shouldDirty: true, shouldValidate: true })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-[#DCE8EC] bg-white p-4">
                  <div className="border-b border-gray-200 pb-2">
                    <h3 className="text-base font-semibold text-[#002333] flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#159A9C]" />
                      Observações
                    </h3>
                  </div>
                  <textarea
                    {...register('observacoes')}
                    rows={6}
                    className={`${inputClass} resize-none`}
                    placeholder="Observações adicionais..."
                  />
                  {errors.observacoes ? (
                    <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.observacoes.message}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 px-1 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-500 text-center sm:text-left">
                  Para contas a pagar, o essencial é identificar corretamente o fornecedor.
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
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
                    className="px-6 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
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
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalFornecedor;
