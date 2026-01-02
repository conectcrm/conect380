// Utilitários de validação para o Fênix CRM
import * as yup from 'yup';

// Expressões regulares
export const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
export const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
export const telefoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
export const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

// Validação de CPF
export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/[^\d]/g, '');

  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false; // CPF com todos os dígitos iguais

  let sum = 0;
  let remainder;

  // Validação do primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

  return true;
};

// Validação de CNPJ
export const validateCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');

  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false; // CNPJ com todos os dígitos iguais

  let length = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, length);
  const digits = cleanCNPJ.substring(length);
  let sum = 0;
  let pos = length - 7;

  // Validação do primeiro dígito verificador
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  // Validação do segundo dígito verificador
  length = length + 1;
  numbers = cleanCNPJ.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
};

// Formatação de moeda
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Formatação de telefone
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

// Esquema de validação para clientes
export const clienteValidationSchema = yup.object({
  nome: yup
    .string()
    .required('Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),

  email: yup
    .string()
    .required('E-mail é obrigatório')
    .email('E-mail deve ter um formato válido')
    .max(255, 'E-mail deve ter no máximo 255 caracteres'),

  telefone: yup
    .string()
    .required('Telefone é obrigatório')
    .matches(telefoneRegex, 'Telefone deve seguir o formato (11) 99999-9999'),

  tipo: yup
    .string()
    .required('Tipo de cliente é obrigatório')
    .oneOf(['pessoa_fisica', 'pessoa_juridica'], 'Tipo de cliente inválido'),

  cpf: yup.string().when('tipo', {
    is: 'pessoa_fisica',
    then: (schema) =>
      schema
        .required('CPF é obrigatório para pessoa física')
        .matches(cpfRegex, 'CPF deve seguir o formato 000.000.000-00')
        .test('cpf-valid', 'CPF inválido', (value) => {
          if (!value) return false;
          return validateCPF(value);
        }),
    otherwise: (schema) => schema.nullable().optional(),
  }),

  cnpj: yup.string().when('tipo', {
    is: 'pessoa_juridica',
    then: (schema) =>
      schema
        .required('CNPJ é obrigatório para pessoa jurídica')
        .matches(cnpjRegex, 'CNPJ deve seguir o formato 00.000.000/0000-00')
        .test('cnpj-valid', 'CNPJ inválido', (value) => {
          if (!value) return false;
          return validateCNPJ(value);
        }),
    otherwise: (schema) => schema.nullable().optional(),
  }),

  empresa: yup.string().when('tipo', {
    is: 'pessoa_juridica',
    then: (schema) =>
      schema
        .required('Nome da empresa é obrigatório para pessoa jurídica')
        .min(2, 'Nome da empresa deve ter pelo menos 2 caracteres')
        .max(200, 'Nome da empresa deve ter no máximo 200 caracteres'),
    otherwise: (schema) => schema.optional(),
  }),

  cargo: yup.string().optional().max(100, 'Cargo deve ter no máximo 100 caracteres'),

  endereco: yup
    .object({
      cep: yup
        .string()
        .optional()
        .matches(/^\d{5}-\d{3}$/, 'CEP deve seguir o formato 00000-000'),

      logradouro: yup.string().optional().max(200, 'Logradouro deve ter no máximo 200 caracteres'),

      numero: yup.string().optional().max(20, 'Número deve ter no máximo 20 caracteres'),

      complemento: yup
        .string()
        .optional()
        .max(100, 'Complemento deve ter no máximo 100 caracteres'),

      bairro: yup.string().optional().max(100, 'Bairro deve ter no máximo 100 caracteres'),

      cidade: yup.string().optional().max(100, 'Cidade deve ter no máximo 100 caracteres'),

      estado: yup.string().optional().length(2, 'Estado deve ter 2 caracteres'),
    })
    .optional(),

  observacoes: yup.string().optional().max(1000, 'Observações devem ter no máximo 1000 caracteres'),

  status: yup
    .string()
    .required('Status é obrigatório')
    .oneOf(['lead', 'prospect', 'cliente', 'inativo'], 'Status inválido'),

  tags: yup.array().of(yup.string()).optional().max(10, 'Máximo de 10 tags permitidas'),
});

// Validação de usuário
export const userValidationSchema = yup.object({
  nome: yup
    .string()
    .required('Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),

  email: yup.string().required('E-mail é obrigatório').email('E-mail deve ter um formato válido'),

  senha: yup
    .string()
    .required('Senha é obrigatória')
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número',
    ),

  confirmarSenha: yup
    .string()
    .required('Confirmação de senha é obrigatória')
    .oneOf([yup.ref('senha')], 'Senhas não coincidem'),

  role: yup
    .string()
    .required('Função é obrigatória')
    .oneOf(['admin', 'manager', 'vendedor', 'financeiro'], 'Função inválida'),
});

// Validação de empresa
export const empresaValidationSchema = yup.object({
  nome: yup
    .string()
    .required('Razão social é obrigatória')
    .min(2, 'Razão social deve ter pelo menos 2 caracteres')
    .max(200, 'Razão social deve ter no máximo 200 caracteres'),

  cnpj: yup
    .string()
    .required('CNPJ é obrigatório')
    .matches(cnpjRegex, 'CNPJ deve seguir o formato 00.000.000/0000-00')
    .test('cnpj-valid', 'CNPJ inválido', validateCNPJ),

  email: yup.string().required('E-mail é obrigatório').email('E-mail deve ter um formato válido'),

  telefone: yup
    .string()
    .required('Telefone é obrigatório')
    .matches(telefoneRegex, 'Telefone deve seguir o formato (11) 99999-9999'),
});

// Validação de proposta
export const propostaValidationSchema = yup.object({
  titulo: yup
    .string()
    .required('Título é obrigatório')
    .min(5, 'Título deve ter pelo menos 5 caracteres')
    .max(200, 'Título deve ter no máximo 200 caracteres'),

  valor: yup
    .number()
    .required('Valor é obrigatório')
    .positive('Valor deve ser positivo')
    .min(0.01, 'Valor deve ser maior que zero'),

  cliente_id: yup.string().required('Cliente é obrigatório'),

  data_vencimento: yup
    .date()
    .required('Data de vencimento é obrigatória')
    .min(new Date(), 'Data de vencimento deve ser futura'),

  descricao: yup.string().optional().max(2000, 'Descrição deve ter no máximo 2000 caracteres'),

  status: yup
    .string()
    .required('Status é obrigatório')
    .oneOf(['rascunho', 'enviada', 'em_negociacao', 'aprovada', 'rejeitada'], 'Status inválido'),
});

// Tipos para TypeScript
export interface ClienteFormData {
  nome: string;
  email: string;
  telefone: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
  cpf?: string;
  cnpj?: string;
  empresa?: string;
  cargo?: string;
  endereco?: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
  };
  observacoes?: string;
  status: 'lead' | 'prospect' | 'cliente' | 'inativo';
  tags?: string[];
}

export interface UserFormData {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  role: 'admin' | 'manager' | 'vendedor' | 'financeiro';
}

export interface EmpresaFormData {
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
}

export interface PropostaFormData {
  titulo: string;
  valor: number;
  cliente_id: string;
  data_vencimento: Date;
  descricao?: string;
  status: 'rascunho' | 'enviada' | 'em_negociacao' | 'aprovada' | 'rejeitada';
}
