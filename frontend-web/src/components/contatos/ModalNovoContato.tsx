import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Building, FileText, Loader2, Mail, Phone, Star, User, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ClienteSelect, { ClienteSelectValue } from '../selects/ClienteSelect';
import {
  contatosService,
  Contato,
  CreateContatoDto,
  UpdateContatoDto,
} from '../../services/contatosService';

interface ModalNovoContatoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contato?: Contato;
  clienteId?: string;
  clienteNome?: string;
}

interface FormErrors {
  nome?: string;
  telefone?: string;
  email?: string;
  clienteId?: string;
}

interface ContatoFormData {
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  principal: boolean;
  observacoes: string;
}

type ErrorWithResponseMessage = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

type PhoneCountry = {
  iso2: string;
  name: string;
  flag: string;
  dialCode: string;
  minLength: number;
  maxLength: number;
  sample: string;
};

const DEFAULT_FORM_DATA: ContatoFormData = {
  nome: '',
  email: '',
  telefone: '',
  cargo: '',
  principal: false,
  observacoes: '',
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
const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#159A9C]';

const getApiErrorMessage = (error: unknown): string | null => {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const apiError = error as ErrorWithResponseMessage;
  const message = apiError.response?.data?.message;
  return typeof message === 'string' && message.trim() ? message : null;
};

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

  // Compatibilidade para registros antigos sem DDI.
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

const ModalNovoContato: React.FC<ModalNovoContatoProps> = ({
  isOpen,
  onClose,
  onSuccess,
  contato,
  clienteId: clienteIdProp,
  clienteNome,
}) => {
  const [loading, setLoading] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteSelectValue | null>(null);
  const [phoneCountryIso, setPhoneCountryIso] = useState(DEFAULT_PHONE_COUNTRY_ISO);
  const [phoneNationalNumber, setPhoneNationalNumber] = useState('');
  const [formData, setFormData] = useState<ContatoFormData>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});

  const selectedPhoneCountry = useMemo(
    () => getPhoneCountryByIso(phoneCountryIso),
    [phoneCountryIso],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (contato) {
      const parsedPhone = parsePhoneValue(contato.telefone || '');
      const initialNationalNumber = sanitizePhoneDigits(parsedPhone.nationalNumber).slice(
        0,
        parsedPhone.country.maxLength,
      );

      setFormData({
        nome: contato.nome || '',
        email: contato.email || '',
        telefone: toE164(parsedPhone.country, initialNationalNumber),
        cargo: contato.cargo || '',
        principal: contato.principal || false,
        observacoes: contato.observacoes || '',
      });
      setPhoneCountryIso(parsedPhone.country.iso2);
      setPhoneNationalNumber(initialNationalNumber);

      if (contato.cliente) {
        setClienteSelecionado({
          id: contato.cliente.id,
          nome: contato.cliente.nome,
          documento: contato.cliente.documento,
          email: contato.cliente.email,
          telefone: contato.cliente.telefone,
          tipo: contato.cliente.tipo,
        });
      } else {
        setClienteSelecionado(null);
      }

      return;
    }

    setFormData(DEFAULT_FORM_DATA);
    setPhoneCountryIso(DEFAULT_PHONE_COUNTRY_ISO);
    setPhoneNationalNumber('');
    setClienteSelecionado(
      clienteIdProp
        ? {
            id: clienteIdProp,
            nome: clienteNome || 'Cliente selecionado',
          }
        : null,
    );
  }, [clienteIdProp, clienteNome, contato, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setErrors({});
    }
  }, [isOpen]);

  const handleClienteSelecionado = (cliente: ClienteSelectValue | null): void => {
    setClienteSelecionado(cliente);
    if (errors.clienteId) {
      setErrors((prev) => ({ ...prev, clienteId: undefined }));
    }
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    const { name, value, type } = event.target;
    const checked = (event.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePhoneCountryChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const nextCountry = getPhoneCountryByIso(event.target.value);
    const normalizedNationalNumber = phoneNationalNumber.slice(0, nextCountry.maxLength);

    setPhoneCountryIso(nextCountry.iso2);
    setPhoneNationalNumber(normalizedNationalNumber);
    setFormData((prev) => ({
      ...prev,
      telefone: toE164(nextCountry, normalizedNationalNumber),
    }));

    if (errors.telefone) {
      setErrors((prev) => ({ ...prev, telefone: undefined }));
    }
  };

  const handlePhoneNumberChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const nextNationalNumber = sanitizePhoneDigits(event.target.value).slice(
      0,
      selectedPhoneCountry.maxLength,
    );

    setPhoneNationalNumber(nextNationalNumber);
    setFormData((prev) => ({
      ...prev,
      telefone: toE164(selectedPhoneCountry, nextNationalNumber),
    }));

    if (errors.telefone) {
      setErrors((prev) => ({ ...prev, telefone: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!clienteSelecionado && !contato && !clienteIdProp) {
      newErrors.clienteId = 'Selecione um cliente.';
    }

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome e obrigatorio.';
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone e obrigatorio.';
    } else if (!isValidE164Phone(formData.telefone.trim())) {
      newErrors.telefone = 'Telefone internacional invalido para o pais selecionado.';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail invalido.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!validate()) {
      toast.error('Por favor, corrija os erros do formulario.');
      return;
    }

    setLoading(true);

    try {
      const telefoneNormalizado = formData.telefone.trim();

      if (contato) {
        const updateData: UpdateContatoDto = {
          nome: formData.nome.trim(),
          email: formData.email.trim() || undefined,
          telefone: telefoneNormalizado,
          cargo: formData.cargo.trim() || undefined,
          principal: formData.principal,
          observacoes: formData.observacoes.trim() || undefined,
        };

        await contatosService.atualizar(contato.id, updateData);
        toast.success('Contato atualizado com sucesso!');
      } else {
        const clienteId = clienteSelecionado?.id || clienteIdProp;
        if (!clienteId) {
          toast.error('Cliente nao selecionado.');
          return;
        }

        const createData: CreateContatoDto = {
          nome: formData.nome.trim(),
          email: formData.email.trim() || undefined,
          telefone: telefoneNormalizado,
          cargo: formData.cargo.trim() || undefined,
          principal: formData.principal,
          observacoes: formData.observacoes.trim() || undefined,
        };

        await contatosService.criar(clienteId, createData);
        toast.success('Contato criado com sucesso!');
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Erro ao salvar contato:', error);
      toast.error(getApiErrorMessage(error) || 'Erro ao salvar contato.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        onClick={loading ? undefined : onClose}
      />

      <div className="relative flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="relative flex w-full max-w-[980px] max-h-[92vh] flex-col overflow-hidden rounded-xl border border-[#DCE8EC] bg-white shadow-2xl">
          <div className="sticky top-0 z-10 border-b border-[#E4EDF0] bg-white px-6 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-[#002333]">
                  {contato ? 'Editar contato' : 'Novo contato'}
                </h2>
                <p className="text-sm text-[#607B89]">
                  Cadastro padronizado com layout v2 e telefone internacional.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Fechar modal"
                disabled={loading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="space-y-4 rounded-xl border border-[#DCE8EC] bg-white p-4">
                <div className="border-b border-gray-200 pb-2">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-[#002333]">
                    <User className="h-4 w-4 text-[#159A9C]" />
                    Dados principais
                  </h3>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Nome *</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#89A5B3]" />
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      className={`${inputClass} pl-9`}
                      placeholder="Digite o nome completo"
                      disabled={loading}
                    />
                  </div>
                  {errors.nome && (
                    <p className="mt-1 flex items-center text-xs text-red-600">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      {errors.nome}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Telefone *</label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[210px_1fr]">
                    <select
                      value={phoneCountryIso}
                      onChange={handlePhoneCountryChange}
                      className={inputClass}
                      disabled={loading}
                    >
                      {PHONE_COUNTRIES.map((country) => (
                        <option key={country.iso2} value={country.iso2}>
                          {country.flag} +{country.dialCode} {country.name}
                        </option>
                      ))}
                    </select>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#89A5B3]" />
                      <input
                        type="tel"
                        value={phoneNationalNumber}
                        onChange={handlePhoneNumberChange}
                        className={`${inputClass} pl-9`}
                        placeholder={selectedPhoneCountry.sample}
                        disabled={loading}
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                  {errors.telefone && (
                    <p className="mt-1 flex items-center text-xs text-red-600">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      {errors.telefone}
                    </p>
                  )}
                  {!errors.telefone &&
                  phoneNationalNumber.length > 0 &&
                  phoneNationalNumber.length < selectedPhoneCountry.minLength ? (
                    <p className="mt-1 text-xs text-[#8A6D3B]">
                      Numero incompleto para {selectedPhoneCountry.name}.
                    </p>
                  ) : null}
                  {!errors.telefone && formData.telefone ? (
                    <p className="mt-1 text-xs text-[#607B89]">
                      Formato salvo: {formData.telefone}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">E-mail</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#89A5B3]" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`${inputClass} pl-9`}
                      placeholder="email@empresa.com"
                      disabled={loading}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 flex items-center text-xs text-red-600">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Cargo</label>
                  <div className="relative">
                    <Building className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#89A5B3]" />
                    <input
                      type="text"
                      name="cargo"
                      value={formData.cargo}
                      onChange={handleInputChange}
                      className={`${inputClass} pl-9`}
                      placeholder="Ex: Gerente de compras"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-[#DCE8EC] bg-[#F8FCFB] p-3">
                  <label
                    htmlFor="principal"
                    className="flex cursor-pointer items-start gap-3 text-sm text-[#355061]"
                  >
                    <input
                      id="principal"
                      name="principal"
                      type="checkbox"
                      checked={formData.principal}
                      onChange={handleInputChange}
                      className="mt-0.5 h-4 w-4 rounded border-[#BFD0D8] text-[#159A9C] focus:ring-[#159A9C]"
                      disabled={loading}
                    />
                    <span className="inline-flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Definir como contato principal
                    </span>
                  </label>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-4">
                <div className="border-b border-gray-200 pb-2">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-[#002333]">
                    <Building className="h-4 w-4 text-[#159A9C]" />
                    Vinculo e detalhes
                  </h3>
                </div>

                {!contato ? (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Cliente *
                    </label>
                    <ClienteSelect
                      value={clienteSelecionado}
                      onChange={handleClienteSelecionado}
                      label={null}
                      error={errors.clienteId}
                      disabled={loading || Boolean(clienteIdProp)}
                    />
                    {errors.clienteId && (
                      <p className="mt-1 flex items-center text-xs text-red-600">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        {errors.clienteId}
                      </p>
                    )}
                  </div>
                ) : contato.cliente ? (
                  <div className="rounded-lg border border-[#DCE8EC] bg-white p-3 text-sm text-[#355061]">
                    <p className="font-medium text-[#244455]">Cliente vinculado</p>
                    <p className="mt-1">{contato.cliente.nome}</p>
                  </div>
                ) : null}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Observacoes
                  </label>
                  <div className="relative">
                    <FileText className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#89A5B3]" />
                    <textarea
                      name="observacoes"
                      value={formData.observacoes}
                      onChange={handleInputChange}
                      rows={7}
                      className={`${inputClass} resize-none pl-9`}
                      placeholder="Informacoes internas sobre este contato"
                      disabled={loading}
                    />
                  </div>
                </div>

                <p className="rounded-md border border-[#DCE8EC] bg-[#F6FBFC] px-3 py-2 text-xs text-[#355061]">
                  Telefone salvo no padrao internacional (E.164), com selecao de pais e DDI.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 mt-6 border-t border-gray-200 bg-gray-50 px-1 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-center text-sm text-gray-500 sm:text-left">
                  Campos obrigatorios: nome, telefone e cliente (na criacao).
                </p>

                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] px-6 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {loading ? 'Salvando...' : contato ? 'Salvar alteracoes' : 'Criar contato'}
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

export default ModalNovoContato;
