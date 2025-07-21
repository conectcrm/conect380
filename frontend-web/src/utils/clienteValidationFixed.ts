import * as yup from 'yup';

// Schema completo mas funcional para o modal
export const clienteValidationSchemaFixed = yup.object({
  // Campos obrigatórios
  nome: yup.string().required('Nome é obrigatório'),
  email: yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
  telefone: yup.string().required('Telefone é obrigatório'),
  tipo: yup.string().oneOf(['pessoa_fisica', 'pessoa_juridica'], 'Tipo inválido').required('Tipo é obrigatório'),
  status: yup.string().oneOf(['lead', 'prospect', 'cliente', 'inativo'], 'Status inválido').required('Status é obrigatório'),

  // Campos opcionais mas que existem no formulário
  cpf: yup.string().notRequired(),
  cnpj: yup.string().notRequired(),
  empresa: yup.string().notRequired(),
  cargo: yup.string().notRequired(),
  observacoes: yup.string().notRequired(),
  
  // Endereço como objeto opcional
  endereco: yup.object({
    cep: yup.string().notRequired(),
    logradouro: yup.string().notRequired(),
    numero: yup.string().notRequired(),
    complemento: yup.string().notRequired(),
    bairro: yup.string().notRequired(),
    cidade: yup.string().notRequired(),
    estado: yup.string().notRequired(),
  }).notRequired().default({}),

  // Tags como array opcional
  tags: yup.array().of(yup.string()).notRequired().default([])
});

export type ClienteFormDataFixed = yup.InferType<typeof clienteValidationSchemaFixed>;
