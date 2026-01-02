import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { X, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Cliente } from '../../services/clientesService';
import { simpleClienteValidationSchema, SimpleClienteFormData } from '../../utils/simpleValidation';

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  cliente?: Cliente | null;
  isLoading?: boolean;
}

const ClienteModalSimple: React.FC<ClienteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  cliente,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    trigger,
    formState: { errors, isValid, isSubmitting, isValidating },
  } = useForm<SimpleClienteFormData>({
    resolver: yupResolver(simpleClienteValidationSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    criteriaMode: 'all',
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      tipo: 'pessoa_fisica',
      status: 'lead',
    },
  });

  // Valores atuais do formulário
  const nome = watch('nome');
  const email = watch('email');
  const telefone = watch('telefone');
  const tipo = watch('tipo');
  const status = watch('status');

  // Validação manual simples para debug
  const isFormValidManual = React.useMemo(() => {
    const validNome = Boolean(nome && nome.trim().length > 0);
    const validEmail = Boolean(email && email.includes('@') && email.includes('.'));
    const validTelefone = Boolean(telefone && telefone.trim().length > 0);
    const validTipo = tipo === 'pessoa_fisica' || tipo === 'pessoa_juridica';
    const validStatus = ['lead', 'prospect', 'cliente', 'inativo'].includes(status || '');

    return validNome && validEmail && validTelefone && validTipo && validStatus;
  }, [nome, email, telefone, tipo, status]);

  // Debug logs mais detalhados - apenas quando necessário
  React.useEffect(() => {
    if (isOpen) {
      console.log('=== DEBUG MODAL SIMPLES ===');
      console.log('Estado do formulário:', {
        isValid,
        isValidating,
        errors: Object.keys(errors).length > 0 ? errors : 'Nenhum erro',
        isSubmitting,
        isFormValidManual,
      });
      console.log('Valores dos campos:', { nome, email, telefone, tipo, status });
      console.log('Validação manual por campo:', {
        nomeValido: Boolean(nome && nome.trim().length > 0),
        emailValido: Boolean(email && email.includes('@') && email.includes('.')),
        telefoneValido: Boolean(telefone && telefone.trim().length > 0),
        tipoValido: tipo === 'pessoa_fisica' || tipo === 'pessoa_juridica',
        statusValido: ['lead', 'prospect', 'cliente', 'inativo'].includes(status || ''),
      });
      console.log('========================');
    }
  }, [isOpen, isValid, isFormValidManual, nome, email, telefone, tipo, status]);

  // Trigger de validação inicial quando o modal abre
  useEffect(() => {
    if (isOpen) {
      // Força validação inicial após um pequeno delay
      setTimeout(() => {
        trigger();
      }, 100);
    }
  }, [isOpen, trigger]);

  // Atualizar formulário quando cliente mudar
  useEffect(() => {
    if (isOpen) {
      if (cliente) {
        reset({
          nome: cliente.nome || '',
          email: cliente.email || '',
          telefone: cliente.telefone || '',
          tipo: cliente.tipo || 'pessoa_fisica',
          status: cliente.status || 'lead',
        });
      } else {
        reset({
          nome: '',
          email: '',
          telefone: '',
          tipo: 'pessoa_fisica',
          status: 'lead',
        });
      }
    }
  }, [isOpen, cliente, reset]);

  const onSubmit = async (data: SimpleClienteFormData) => {
    try {
      const clienteData = {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        tipo: data.tipo as 'pessoa_fisica' | 'pessoa_juridica',
        documento: '', // Simplificado
        empresa: '',
        cargo: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        observacoes: '',
        status: data.status as 'lead' | 'prospect' | 'cliente' | 'inativo',
        tags: [],
        data_nascimento: '',
        profissao: '',
        renda: 0,
      };

      await onSave(clienteData);
      toast.success(cliente ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente. Tente novamente.');
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[calc(100%-2rem)] sm:w-[700px] md:w-[800px] lg:w-[900px] xl:w-[1000px] max-w-[1100px] max-h-[90vh] overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white">
            <h2 className="text-xl font-semibold">
              {cliente ? 'Editar Cliente' : 'Novo Cliente'} (Versão Simples)
            </h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-white hover:text-gray-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  {...register('nome')}
                  type="text"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                    errors.nome ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Digite o nome completo"
                />
                {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-mail *</label>
                <input
                  {...register('email')}
                  type="email"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="email@exemplo.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone *</label>
                <input
                  {...register('telefone')}
                  type="tel"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                    errors.telefone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="(11) 99999-9999"
                />
                {errors.telefone && (
                  <p className="mt-1 text-sm text-red-600">{errors.telefone.message}</p>
                )}
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
                <select
                  {...register('tipo')}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                    errors.tipo ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="pessoa_fisica">Pessoa Física</option>
                  <option value="pessoa_juridica">Pessoa Jurídica</option>
                </select>
                {errors.tipo && <p className="mt-1 text-sm text-red-600">{errors.tipo.message}</p>}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                <select
                  {...register('status')}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                    errors.status ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="lead">Lead</option>
                  <option value="prospect">Prospect</option>
                  <option value="cliente">Cliente</option>
                  <option value="inativo">Inativo</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div className="flex items-center text-sm">
              {isValidating ? (
                <span className="flex items-center text-blue-600">
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Validando...
                </span>
              ) : (
                <span
                  className={`flex items-center ${isValid || isFormValidManual ? 'text-green-600' : 'text-orange-600'}`}
                >
                  <User className="w-4 h-4 mr-1" />
                  {isValid || isFormValidManual
                    ? 'Formulário válido'
                    : 'Preencha todos os campos obrigatórios'}
                  <span className="ml-2 text-xs">
                    (Hook: {isValid ? '✓' : '✗'} | Manual: {isFormValidManual ? '✓' : '✗'})
                  </span>
                </span>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={(!isValid && !isFormValidManual) || isSubmitting || isLoading}
                className="px-6 py-2 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {(isSubmitting || isLoading) && <Loader2 className="w-4 h-4 animate-spin" />}
                {cliente ? 'Atualizar' : 'Criar'} Cliente
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClienteModalSimple;
