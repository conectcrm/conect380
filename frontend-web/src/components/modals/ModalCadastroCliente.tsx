import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { AlertCircle, Building, Clock, Mail, User, X, Loader2 } from 'lucide-react';

type ClienteTipo = 'pessoa_fisica' | 'pessoa_juridica';
type PhoneCountry = {
  iso2: string;
  name: string;
  flag: string;
  dialCode: string;
  minLength: number;
  maxLength: number;
  sample: string;
};

interface ModalCadastroClienteProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cliente: Record<string, unknown>) => Promise<void>;
  cliente?: ClienteModalData;
  isLoading?: boolean;
}

interface ClienteModalData {
  id?: string;
  nome?: string;
  email?: string;
  telefone?: string;
  tipo?: ClienteTipo;
  documento?: string;
  status?: 'cliente' | 'lead' | 'prospect' | 'inativo';
  empresa?: string;
  cargo?: string;
  site?: string;
  data_nascimento?: string;
  genero?: string;
  profissao?: string;
  renda?: number | null;
  cep?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  tags?: string[];
  observacoes?: string;
}

interface ClienteFormData {
  nome: string;
  email?: string;
  telefone?: string;
  tipo: ClienteTipo;
  cpf?: string;
  cnpj?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  observacoes?: string;
}

const validarCPF = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += parseInt(digits[i], 10) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += parseInt(digits[i], 10) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(digits[10], 10);
};

const validarCNPJ = (cnpj: string): boolean => {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i += 1) sum += parseInt(digits[i], 10) * weights1[i];
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;

  sum = 0;
  for (let i = 0; i < 13; i += 1) sum += parseInt(digits[i], 10) * weights2[i];
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;

  return digit1 === parseInt(digits[12], 10) && digit2 === parseInt(digits[13], 10);
};

const PHONE_COUNTRIES: PhoneCountry[] = [
  {
    iso2: 'BR',
    name: 'Brasil',
    flag: '🇧🇷',
    dialCode: '55',
    minLength: 10,
    maxLength: 11,
    sample: '11999998888',
  },
  {
    iso2: 'US',
    name: 'Estados Unidos',
    flag: '🇺🇸',
    dialCode: '1',
    minLength: 10,
    maxLength: 10,
    sample: '2015550123',
  },
  {
    iso2: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    dialCode: '1',
    minLength: 10,
    maxLength: 10,
    sample: '4165550123',
  },
  {
    iso2: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    dialCode: '52',
    minLength: 10,
    maxLength: 10,
    sample: '5512345678',
  },
  {
    iso2: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    dialCode: '54',
    minLength: 10,
    maxLength: 10,
    sample: '1123456789',
  },
  {
    iso2: 'CL',
    name: 'Chile',
    flag: '🇨🇱',
    dialCode: '56',
    minLength: 9,
    maxLength: 9,
    sample: '912345678',
  },
  {
    iso2: 'CO',
    name: 'Colombia',
    flag: '🇨🇴',
    dialCode: '57',
    minLength: 10,
    maxLength: 10,
    sample: '3001234567',
  },
  {
    iso2: 'PE',
    name: 'Peru',
    flag: '🇵🇪',
    dialCode: '51',
    minLength: 9,
    maxLength: 9,
    sample: '912345678',
  },
  {
    iso2: 'PT',
    name: 'Portugal',
    flag: '🇵🇹',
    dialCode: '351',
    minLength: 9,
    maxLength: 9,
    sample: '912345678',
  },
  {
    iso2: 'ES',
    name: 'Espanha',
    flag: '🇪🇸',
    dialCode: '34',
    minLength: 9,
    maxLength: 9,
    sample: '612345678',
  },
  {
    iso2: 'FR',
    name: 'Franca',
    flag: '🇫🇷',
    dialCode: '33',
    minLength: 9,
    maxLength: 9,
    sample: '612345678',
  },
  {
    iso2: 'DE',
    name: 'Alemanha',
    flag: '🇩🇪',
    dialCode: '49',
    minLength: 10,
    maxLength: 11,
    sample: '15123456789',
  },
  {
    iso2: 'IT',
    name: 'Italia',
    flag: '🇮🇹',
    dialCode: '39',
    minLength: 9,
    maxLength: 10,
    sample: '3123456789',
  },
  {
    iso2: 'GB',
    name: 'Reino Unido',
    flag: '🇬🇧',
    dialCode: '44',
    minLength: 10,
    maxLength: 10,
    sample: '7400123456',
  },
  {
    iso2: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    dialCode: '61',
    minLength: 9,
    maxLength: 9,
    sample: '412345678',
  },
  {
    iso2: 'JP',
    name: 'Japao',
    flag: '🇯🇵',
    dialCode: '81',
    minLength: 10,
    maxLength: 10,
    sample: '9012345678',
  },
];

const DEFAULT_PHONE_COUNTRY_ISO = 'BR';

const sanitizePhoneDigits = (value: string): string => value.replace(/\D/g, '');

const getPhoneCountryByIso = (iso2?: string): PhoneCountry =>
  PHONE_COUNTRIES.find((country) => country.iso2 === iso2) ??
  PHONE_COUNTRIES.find((country) => country.iso2 === DEFAULT_PHONE_COUNTRY_ISO) ??
  PHONE_COUNTRIES[0];

const toE164 = (country: PhoneCountry, nationalNumber: string): string => {
  const cleanDigits = sanitizePhoneDigits(nationalNumber).replace(/^0+/, '');
  if (!cleanDigits) {
    return '';
  }

  return `+${country.dialCode}${cleanDigits}`;
};

const parsePhoneValue = (value?: string): { country: PhoneCountry; nationalNumber: string } => {
  const baseCountry = getPhoneCountryByIso(DEFAULT_PHONE_COUNTRY_ISO);
  if (!value || value.trim() === '') {
    return { country: baseCountry, nationalNumber: '' };
  }

  const raw = value.trim();
  const digits = sanitizePhoneDigits(raw);
  if (!digits) {
    return { country: baseCountry, nationalNumber: '' };
  }

  // Compatibilidade para numeros legados sem +55.
  if (!raw.startsWith('+') && digits.length <= 11) {
    return { country: baseCountry, nationalNumber: digits };
  }

  const sortedCountries = [...PHONE_COUNTRIES].sort(
    (left, right) => right.dialCode.length - left.dialCode.length,
  );
  const matchedCountry = sortedCountries.find((country) => digits.startsWith(country.dialCode));

  if (!matchedCountry) {
    return { country: baseCountry, nationalNumber: digits };
  }

  return {
    country: matchedCountry,
    nationalNumber: digits.slice(matchedCountry.dialCode.length),
  };
};

const isValidE164Phone = (value: string): boolean => {
  if (!/^\+\d{8,15}$/.test(value)) {
    return false;
  }

  const digits = sanitizePhoneDigits(value);
  const sortedCountries = [...PHONE_COUNTRIES].sort(
    (left, right) => right.dialCode.length - left.dialCode.length,
  );
  const matchedCountry = sortedCountries.find((country) => digits.startsWith(country.dialCode));

  if (!matchedCountry) {
    return digits.length >= 8 && digits.length <= 15;
  }

  const nationalNumberLength = digits.slice(matchedCountry.dialCode.length).length;
  return (
    nationalNumberLength >= matchedCountry.minLength &&
    nationalNumberLength <= matchedCountry.maxLength
  );
};

const formatarCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  }
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
};

const formatarCNPJ = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 14);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8)
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  if (numbers.length <= 12) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  }
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12)}`;
};

const formatarCep = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 8);
  if (numbers.length <= 5) return numbers;
  return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
};

const defaultValues: ClienteFormData = {
  nome: '',
  email: '',
  telefone: '',
  tipo: 'pessoa_fisica',
  cpf: '',
  cnpj: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  observacoes: '',
};

const clienteSchema = yup
  .object({
    tipo: yup.string().required().oneOf(['pessoa_fisica', 'pessoa_juridica']),
    cpf: yup.string().when('tipo', {
      is: 'pessoa_fisica',
      then: (schema) =>
        schema.required('CPF e obrigatorio').test('cpf-valido', 'CPF invalido', (value) => {
          if (!value || value.trim() === '') return false;
          return validarCPF(value);
        }),
      otherwise: (schema) => schema.notRequired(),
    }),
    cnpj: yup.string().when('tipo', {
      is: 'pessoa_juridica',
      then: (schema) =>
        schema.required('CNPJ e obrigatorio').test('cnpj-valido', 'CNPJ invalido', (value) => {
          if (!value || value.trim() === '') return false;
          return validarCNPJ(value);
        }),
      otherwise: (schema) => schema.notRequired(),
    }),
    nome: yup.string().required('Nome e obrigatorio').min(3).max(100),
    email: yup
      .string()
      .transform((value) => {
        if (typeof value !== 'string') return value;
        const trimmed = value.trim();
        return trimmed === '' ? undefined : trimmed;
      })
      .email('E-mail invalido')
      .max(100),
    telefone: yup
      .string()
      .transform((value) => {
        if (typeof value !== 'string') return value;
        const trimmed = value.trim();
        return trimmed === '' ? undefined : trimmed;
      })
      .test(
        'telefone-formato',
        'Telefone internacional invalido para o pais selecionado.',
        (value) => !value || isValidE164Phone(value),
      ),
    cep: yup.string().test('cep-valido', 'CEP invalido', (value) => {
      if (!value || value.trim() === '') return true;
      return /^\d{5}-\d{3}$/.test(value);
    }),
    observacoes: yup.string().max(1000),
  })
  .test(
    'contato-obrigatorio',
    'Informe pelo menos um contato: e-mail ou telefone.',
    function validateContato(value) {
      if (value?.email?.trim() || value?.telefone?.trim()) {
        return true;
      }

      return this.createError({
        path: 'telefone',
        message: 'Informe pelo menos um contato: e-mail ou telefone.',
      });
    },
  );

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#159A9C]';

const ModalCadastroCliente: React.FC<ModalCadastroClienteProps> = ({
  isOpen,
  onClose,
  onSave,
  cliente,
  isLoading = false,
}) => {
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [phoneCountryIso, setPhoneCountryIso] = useState(DEFAULT_PHONE_COUNTRY_ISO);
  const [phoneNationalNumber, setPhoneNationalNumber] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
    trigger,
  } = useForm<ClienteFormData>({
    resolver: yupResolver(clienteSchema),
    mode: 'onChange',
    defaultValues,
  });

  const watchedTipo = watch('tipo');
  const watchedCpf = watch('cpf') || '';
  const watchedCnpj = watch('cnpj') || '';
  const watchedCep = watch('cep') || '';
  const watchedObservacoes = watch('observacoes') || '';
  const watchedNome = watch('nome') || '';
  const watchedEmail = watch('email') || '';
  const watchedTelefone = watch('telefone') || '';
  const selectedPhoneCountry = useMemo(
    () => getPhoneCountryByIso(phoneCountryIso),
    [phoneCountryIso],
  );

  const completion = useMemo(() => {
    const tipoValido = Boolean(watchedTipo && !errors.tipo);
    const documentoValido =
      watchedTipo === 'pessoa_fisica'
        ? Boolean(watchedCpf.trim() && !errors.cpf)
        : Boolean(watchedCnpj.trim() && !errors.cnpj);
    const nomeValido = watchedNome.trim().length >= 3 && !errors.nome;
    const contatoPreenchido = Boolean(watchedEmail.trim() || watchedTelefone.trim());
    const contatoValido = contatoPreenchido && !errors.email && !errors.telefone;

    return {
      validCount:
        Number(tipoValido) + Number(documentoValido) + Number(nomeValido) + Number(contatoValido),
      totalCount: 4,
    };
  }, [
    errors.cnpj,
    errors.cpf,
    errors.email,
    errors.nome,
    errors.telefone,
    errors.tipo,
    watchedCnpj,
    watchedCpf,
    watchedEmail,
    watchedNome,
    watchedTelefone,
    watchedTipo,
  ]);

  useEffect(() => {
    if (!isOpen) return;

    if (cliente) {
      const parsedPhone = parsePhoneValue(cliente.telefone || '');
      const enderecoParts = (cliente.endereco || '')
        .split(',')
        .map((value: string) => value.trim())
        .filter(Boolean);

      reset({
        nome: cliente.nome || '',
        email: cliente.email || '',
        telefone: toE164(parsedPhone.country, parsedPhone.nationalNumber),
        tipo: cliente.tipo || 'pessoa_fisica',
        cpf: cliente.tipo === 'pessoa_fisica' ? formatarCPF(cliente.documento || '') : '',
        cnpj: cliente.tipo === 'pessoa_juridica' ? formatarCNPJ(cliente.documento || '') : '',
        cep: formatarCep(cliente.cep || ''),
        logradouro: enderecoParts[0] || '',
        numero: enderecoParts[1] || '',
        complemento: enderecoParts.length >= 4 ? enderecoParts[2] : '',
        bairro: enderecoParts.length >= 4 ? enderecoParts[3] : enderecoParts[2] || '',
        cidade: cliente.cidade || '',
        estado: cliente.estado || '',
        observacoes: cliente.observacoes || '',
      });

      setPhoneCountryIso(parsedPhone.country.iso2);
      setPhoneNationalNumber(parsedPhone.nationalNumber);
    } else {
      reset(defaultValues);
      setPhoneCountryIso(DEFAULT_PHONE_COUNTRY_ISO);
      setPhoneNationalNumber('');
    }
  }, [cliente, isOpen, reset]);

  useEffect(() => {
    if (!isOpen || watchedCep.length !== 9) {
      return;
    }

    let active = true;

    const buscarCep = async (): Promise<void> => {
      setIsLoadingCep(true);
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${watchedCep.replace('-', '')}/json/`,
        );
        const data = await response.json();

        if (!active || data?.erro) return;

        setValue('logradouro', data.logradouro || '', { shouldDirty: true, shouldValidate: true });
        setValue('bairro', data.bairro || '', { shouldDirty: true, shouldValidate: true });
        setValue('cidade', data.localidade || '', { shouldDirty: true, shouldValidate: true });
        setValue('estado', data.uf || '', { shouldDirty: true, shouldValidate: true });

        await trigger(['logradouro', 'bairro', 'cidade', 'estado']);
      } catch (error) {
        if (active) {
          console.error('Erro ao buscar CEP:', error);
        }
      } finally {
        if (active) {
          setIsLoadingCep(false);
        }
      }
    };

    buscarCep().catch(() => {
      // Erro tratado no bloco try/catch acima.
    });

    return () => {
      active = false;
    };
  }, [isOpen, setValue, trigger, watchedCep]);

  const onSubmit = async (data: ClienteFormData): Promise<void> => {
    const loadingToast = toast.loading(
      cliente ? 'Atualizando cliente...' : 'Cadastrando cliente...',
    );

    try {
      const endereco = [data.logradouro, data.numero, data.complemento, data.bairro]
        .map((parte) => parte?.trim())
        .filter(Boolean)
        .join(', ');
      const legacyProfileData = cliente
        ? {
            empresa: cliente.empresa,
            cargo: cliente.cargo,
            site: cliente.site,
            data_nascimento: cliente.data_nascimento,
            genero: cliente.genero,
            profissao: cliente.profissao,
            renda: cliente.renda,
            tags: cliente.tags,
          }
        : {};

      const payload = {
        ...legacyProfileData,
        nome: data.nome.trim(),
        email: data.email?.trim() || '',
        telefone: data.telefone?.trim() || undefined,
        tipo: data.tipo,
        documento:
          data.tipo === 'pessoa_fisica'
            ? data.cpf?.replace(/\D/g, '')
            : data.cnpj?.replace(/\D/g, ''),
        status: cliente?.status ?? 'cliente',
        cep: data.cep ? data.cep.replace(/\D/g, '') : undefined,
        endereco: endereco || undefined,
        cidade: data.cidade?.trim() || undefined,
        estado: data.estado?.trim().toUpperCase() || undefined,
        observacoes: data.observacoes?.trim() || '',
      };

      const sanitizedPayload = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined),
      );

      await onSave(sanitizedPayload);

      toast.dismiss(loadingToast);
      toast.success(
        cliente ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.',
        {
          icon: '!',
        },
      );
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.dismiss(loadingToast);
      toast.error(cliente ? 'Erro ao atualizar cliente.' : 'Erro ao cadastrar cliente.', {
        icon: '!',
      });
    }
  };

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
                  {cliente ? 'Editar cliente' : 'Novo cliente'}
                </h2>
                <p className="text-sm text-[#607B89]">
                  Cadastro basico para criacao rapida com campos avancados opcionais.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Fechar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#DCE8EC] bg-[#F6FBFC] px-3 py-1 text-xs font-medium text-[#355061]">
              <User className="h-3.5 w-3.5 text-[#159A9C]" />
              Basico: {completion.validCount}/{completion.totalCount}
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4 rounded-xl border border-[#DCE8EC] bg-white p-4">
                <div className="border-b border-gray-200 pb-2">
                  <h3 className="text-base font-semibold text-[#002333] flex items-center gap-2">
                    <User className="h-4 w-4 text-[#159A9C]" />
                    Cadastro basico
                  </h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de cadastro *
                  </label>
                  <select
                    {...register('tipo')}
                    className={inputClass}
                    onChange={(event) => {
                      const nextTipo = event.target.value as ClienteTipo;
                      setValue('tipo', nextTipo, { shouldDirty: true, shouldValidate: true });
                      if (nextTipo === 'pessoa_fisica') {
                        setValue('cnpj', '', { shouldDirty: true, shouldValidate: true });
                      } else {
                        setValue('cpf', '', { shouldDirty: true, shouldValidate: true });
                      }
                    }}
                  >
                    <option value="pessoa_fisica">Pessoa fisica</option>
                    <option value="pessoa_juridica">Pessoa juridica</option>
                  </select>
                </div>

                {watchedTipo === 'pessoa_fisica' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
                    <input
                      {...register('cpf')}
                      type="text"
                      className={inputClass}
                      placeholder="000.000.000-00"
                      onChange={(event) =>
                        setValue('cpf', formatarCPF(event.target.value), {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ *</label>
                    <input
                      {...register('cnpj')}
                      type="text"
                      className={inputClass}
                      placeholder="00.000.000/0000-00"
                      onChange={(event) =>
                        setValue('cnpj', formatarCNPJ(event.target.value), {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                    {errors.cnpj && (
                      <p className="mt-1 text-xs text-red-600 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.cnpj.message}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome completo *
                  </label>
                  <input
                    {...register('nome')}
                    type="text"
                    className={inputClass}
                    placeholder="Digite o nome completo"
                  />
                  {errors.nome && (
                    <p className="mt-1 text-xs text-red-600 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.nome.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#89A5B3]" />
                    <input
                      {...register('email')}
                      type="email"
                      className={`${inputClass} pl-9`}
                      placeholder="Digite o e-mail"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[190px_1fr]">
                    <select
                      value={phoneCountryIso}
                      onChange={(event) => {
                        const nextCountry = getPhoneCountryByIso(event.target.value);
                        setPhoneCountryIso(nextCountry.iso2);
                        setValue('telefone', toE164(nextCountry, phoneNationalNumber), {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                      className={inputClass}
                    >
                      {PHONE_COUNTRIES.map((country) => (
                        <option key={country.iso2} value={country.iso2}>
                          {country.flag} +{country.dialCode} {country.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={phoneNationalNumber}
                      className={inputClass}
                      placeholder={selectedPhoneCountry.sample}
                      onChange={(event) => {
                        const onlyDigits = sanitizePhoneDigits(event.target.value).slice(
                          0,
                          selectedPhoneCountry.maxLength,
                        );
                        setPhoneNationalNumber(onlyDigits);
                        setValue('telefone', toE164(selectedPhoneCountry, onlyDigits), {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    />
                  </div>
                  {errors.telefone && (
                    <p className="mt-1 text-xs text-red-600 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.telefone.message}
                    </p>
                  )}
                  {!errors.telefone &&
                  phoneNationalNumber.length > 0 &&
                  phoneNationalNumber.length < selectedPhoneCountry.minLength ? (
                    <p className="mt-1 text-xs text-[#8A6D3B]">
                      Numero incompleto para {selectedPhoneCountry.name}.
                    </p>
                  ) : null}
                  {!errors.telefone && watchedTelefone ? (
                    <p className="mt-1 text-xs text-[#607B89]">Formato salvo: {watchedTelefone}</p>
                  ) : null}
                </div>

                <p className="rounded-md border border-[#DCE8EC] bg-[#F6FBFC] px-3 py-2 text-xs text-[#355061]">
                  Obrigatorio: tipo, CPF/CNPJ, nome e pelo menos um contato (e-mail ou telefone).
                </p>
              </div>

              <div className="space-y-4 rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-4">
                <div className="border-b border-gray-200 pb-2">
                  <h3 className="text-base font-semibold text-[#002333] flex items-center gap-2">
                    <Building className="h-4 w-4 text-[#159A9C]" />
                    Cadastro avancado
                  </h3>
                </div>

                <div className="space-y-3 rounded-lg border border-[#DCE8EC] bg-white p-3">
                  <h4 className="text-sm font-semibold text-[#244455]">Endereco</h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                    <div className="relative">
                      <input
                        {...register('cep')}
                        type="text"
                        className={inputClass}
                        placeholder="12345-678"
                        onChange={(event) =>
                          setValue('cep', formatarCep(event.target.value), {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      />
                      {isLoadingCep ? (
                        <Clock className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-[#159A9C]" />
                      ) : null}
                    </div>
                    {errors.cep && (
                      <p className="mt-1 text-xs text-red-600 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.cep.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      {...register('logradouro')}
                      type="text"
                      className={inputClass}
                      placeholder="Logradouro"
                    />
                    <input
                      {...register('numero')}
                      type="text"
                      className={inputClass}
                      placeholder="Numero"
                    />
                  </div>
                  <input
                    {...register('complemento')}
                    type="text"
                    className={inputClass}
                    placeholder="Complemento"
                  />
                  <input
                    {...register('bairro')}
                    type="text"
                    className={inputClass}
                    placeholder="Bairro"
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <input
                      {...register('cidade')}
                      type="text"
                      className={`${inputClass} sm:col-span-2`}
                      placeholder="Cidade"
                    />
                    <input
                      {...register('estado')}
                      type="text"
                      maxLength={2}
                      className={inputClass}
                      placeholder="UF"
                      onChange={(event) =>
                        setValue('estado', event.target.value.toUpperCase(), {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-[#DCE8EC] bg-white p-3">
                  <h4 className="text-sm font-semibold text-[#244455]">Observacoes internas</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observacoes ({watchedObservacoes.length}/1000)
                    </label>
                    <textarea
                      {...register('observacoes')}
                      rows={6}
                      className={`${inputClass} resize-none`}
                      placeholder="Observacoes sobre o cliente"
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
            </div>

            <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 px-1 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-500 text-center sm:text-left">
                  Obrigatorio no cadastro basico: tipo, CPF/CNPJ, nome e um contato.
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={!isValid || isLoading}
                    className={`w-full sm:w-auto px-6 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      isValid && !isLoading
                        ? 'bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white hover:shadow-lg'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>
                      {isLoading ? 'Salvando...' : cliente ? 'Salvar alteracoes' : 'Criar cliente'}
                    </span>
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

export default ModalCadastroCliente;
