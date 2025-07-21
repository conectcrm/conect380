import * as yup from 'yup';

// Schema super simplificado para debug - apenas os essenciais
export const simpleClienteValidationSchema = yup.object({
  nome: yup.string().required('Nome é obrigatório'),
  email: yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
  telefone: yup.string().required('Telefone é obrigatório'),
  tipo: yup.string().required('Tipo é obrigatório'),
  status: yup.string().required('Status é obrigatório'),
});

export type SimpleClienteFormData = yup.InferType<typeof simpleClienteValidationSchema>;
