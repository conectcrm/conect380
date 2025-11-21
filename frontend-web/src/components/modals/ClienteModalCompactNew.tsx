import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { X, User, MapPin, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Cliente } from '../../services/clientesService';
import { clienteValidationSchemaFixed, ClienteFormDataFixed } from '../../utils/clienteValidationFixed';
import { FormField, AddressFields, DocumentField, TagsField } from '../forms/FormField';

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  cliente?: Cliente | null;
  isLoading?: boolean;
}

const ClienteModalCompact: React.FC<ClienteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  cliente,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    trigger,
    formState: { errors, isValid, isSubmitting, isValidating }
  } = useForm<ClienteFormDataFixed>({
    resolver: yupResolver(clienteValidationSchemaFixed),
    mode: 'onChange',
    reValidateMode: 'onChange',
    criteriaMode: 'all',
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      tipo: 'pessoa_fisica',
      status: 'lead',
      cpf: '',
      cnpj: '',
      empresa: '',
      cargo: '',
      observacoes: '',
      endereco: {
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
      },
      tags: [],
    }
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
      console.log('=== DEBUG MODAL COMPLETO ===');
      console.log('Estado do formulário:', {
        isValid,
        isValidating,
        errors: Object.keys(errors).length > 0 ? errors : 'Nenhum erro',
        isSubmitting,
        isFormValidManual
      });
      console.log('Valores dos campos:', { nome, email, telefone, tipo, status });
      console.log('Validação manual por campo:', {
        nomeValido: Boolean(nome && nome.trim().length > 0),
        emailValido: Boolean(email && email.includes('@') && email.includes('.')),
        telefoneValido: Boolean(telefone && telefone.trim().length > 0),
        tipoValido: tipo === 'pessoa_fisica' || tipo === 'pessoa_juridica',
        statusValido: ['lead', 'prospect', 'cliente', 'inativo'].includes(status || '')
      });

      // Teste direto do schema
      console.log('=== TESTE DIRETO DO SCHEMA ===');
      try {
        const testData = { nome, email, telefone, tipo, status };
        const result = clienteValidationSchemaFixed.validateSync(testData, { abortEarly: false });
        console.log('Schema validação SUCESSO:', result);
      } catch (error) {
        console.log('Schema validação ERRO:', error);
      }
      console.log('========================');
    }
  }, [isOpen, isValid, isFormValidManual, nome, email, telefone, tipo, status]);

  // Trigger de validação inicial quando o modal abre
  useEffect(() => {
    if (isOpen) {
      // Força validação inicial após um pequeno delay
      setTimeout(() => {
        console.log('Forçando trigger de validação...');
        trigger().then((result) => {
          console.log('Resultado do trigger:', result);
        });
      }, 100);

      // Força validação adicional depois de mais tempo
      setTimeout(() => {
        console.log('Forçando trigger adicional...');
        trigger(['nome', 'email', 'telefone', 'tipo', 'status']).then((result) => {
          console.log('Resultado do trigger específico:', result);
        });
      }, 500);
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
          cpf: cliente.documento || '',
          cnpj: cliente.documento || '',
          empresa: cliente.empresa || '',
          cargo: cliente.cargo || '',
          endereco: {
            cep: cliente.cep || '',
            logradouro: cliente.endereco || '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: cliente.cidade || '',
            estado: cliente.estado || '',
          },
          observacoes: cliente.observacoes || '',
          status: cliente.status || 'lead',
          tags: cliente.tags || []
        });
      } else {
        reset({
          nome: '',
          email: '',
          telefone: '',
          tipo: 'pessoa_fisica',
          cpf: '',
          cnpj: '',
          empresa: '',
          cargo: '',
          endereco: {
            cep: '',
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
          },
          observacoes: '',
          status: 'lead',
          tags: []
        });
      }
    }
  }, [cliente, reset, isOpen]);

  // Buscar CEP
  const buscarCEP = async (cep: string) => {
    if (cep && cep.length === 9) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setValue('endereco.logradouro', data.logradouro || '');
          setValue('endereco.bairro', data.bairro || '');
          setValue('endereco.cidade', data.localidade || '');
          setValue('endereco.estado', data.uf || '');
          toast.success('CEP encontrado!');
        } else {
          toast.error('CEP não encontrado');
        }
      } catch (error) {
        toast.error('Erro ao buscar CEP');
      }
    }
  };

  const onSubmit = async (data: ClienteFormDataFixed) => {
    try {
      const clienteData = {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        tipo: data.tipo as 'pessoa_fisica' | 'pessoa_juridica',
        documento: data.tipo === 'pessoa_fisica' ? data.cpf : data.cnpj,
        empresa: data.empresa || '',
        cargo: data.cargo || '',
        endereco: data.endereco?.logradouro || '',
        cidade: data.endereco?.cidade || '',
        estado: data.endereco?.estado || '',
        cep: data.endereco?.cep || '',
        observacoes: data.observacoes || '',
        status: data.status as 'lead' | 'prospect' | 'cliente' | 'inativo',
        tags: data.tags || [],
        data_nascimento: '',
        profissao: '',
        renda: 0
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2">
      <div className="bg-white rounded-lg shadow-xl w-[calc(100%-2rem)] sm:w-[700px] md:w-[900px] lg:w-[1100px] xl:w-[1300px] max-w-[1600px] max-h-[96vh] overflow-hidden flex flex-col">
        {/* Header compacto */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {cliente ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form compacto em formato paisagem */}
        <form onSubmit={handleSubmit(onSubmit, (errors) => {
          console.log('Erros de validação:', errors);
          console.log('Estado do formulário - isValid:', isValid);
          console.log('Campos com erro:', Object.keys(errors));
        })} className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Coluna 1: Dados Básicos */}
              <div className="space-y-3">
                <div className="flex items-center mb-3">
                  <User className="w-5 h-5 text-[#159A9C] mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Dados Básicos</h3>
                </div>

                <FormField
                  name="nome"
                  label="Nome Completo"
                  required
                  register={register}
                  error={errors.nome}
                  placeholder="Digite o nome completo"
                />

                <FormField
                  name="email"
                  label="E-mail"
                  type="email"
                  required
                  register={register}
                  error={errors.email}
                  placeholder="email@exemplo.com"
                />

                <FormField
                  name="telefone"
                  label="Telefone"
                  mask="(99) 99999-9999"
                  register={register}
                  error={errors.telefone}
                  placeholder="(11) 99999-9999"
                />

                <FormField
                  name="tipo"
                  label="Tipo de Cliente"
                  type="select"
                  required
                  register={register}
                  error={errors.tipo}
                  options={[
                    { value: 'pessoa_fisica', label: 'Pessoa Física' },
                    { value: 'pessoa_juridica', label: 'Pessoa Jurídica' }
                  ]}
                />

                {/* Documentos compactos */}
                <DocumentField
                  register={register}
                  errors={errors}
                  watchTipo={watch('tipo')}
                />

                <FormField
                  name="status"
                  label="Status"
                  type="select"
                  required
                  register={register}
                  error={errors.status}
                  options={[
                    { value: 'lead', label: 'Lead' },
                    { value: 'prospect', label: 'Prospect' },
                    { value: 'cliente', label: 'Cliente' },
                    { value: 'inativo', label: 'Inativo' }
                  ]}
                />

                <Controller
                  name="tags"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TagsField
                      name="tags"
                      label="Tags"
                      value={field.value || []}
                      onChange={field.onChange}
                      error={fieldState.error as any}
                    />
                  )}
                />
              </div>

              {/* Coluna 2: Endereço */}
              <div className="space-y-3">
                <div className="flex items-center mb-3">
                  <MapPin className="w-5 h-5 text-[#159A9C] mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Endereço</h3>
                </div>

                {/* CEP com busca automática */}
                <FormField
                  name="endereco.cep"
                  label="CEP"
                  mask="99999-999"
                  register={register}
                  error={errors.endereco?.cep}
                  placeholder="00000-000"
                  helpText="Digite o CEP para buscar automaticamente"
                  onBlur={(e) => buscarCEP(e.target.value)}
                />

                {/* Campos de endereço compactos */}
                <AddressFields
                  register={register}
                  errors={errors}
                  prefix="endereco"
                />
              </div>

              {/* Coluna 3: Observações e Status */}
              <div className="space-y-3">
                <div className="flex items-center mb-3">
                  <FileText className="w-5 h-5 text-[#159A9C] mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Observações</h3>
                </div>

                <FormField
                  name="observacoes"
                  label="Observações"
                  type="textarea"
                  register={register}
                  error={errors.observacoes}
                  placeholder="Digite observações sobre o cliente..."
                  rows={6}
                  helpText="Máximo de 1000 caracteres"
                />

                {/* Status de validação compacto */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Status do Formulário</h4>
                  <div className="space-y-1 text-xs">
                    <div className={`flex items-center ${errors.nome ? 'text-red-600' : 'text-green-600'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${errors.nome ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      Nome {errors.nome ? 'obrigatório' : 'preenchido'}
                    </div>
                    <div className={`flex items-center ${errors.email ? 'text-red-600' : 'text-green-600'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${errors.email ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      E-mail {errors.email ? 'inválido' : 'válido'}
                    </div>
                    <div className={`flex items-center ${errors.tipo ? 'text-red-600' : 'text-green-600'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${errors.tipo ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      Tipo {errors.tipo ? 'obrigatório' : 'selecionado'}
                    </div>
                    <div className={`flex items-center ${(errors.cpf || errors.cnpj) ? 'text-red-600' : 'text-green-600'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${(errors.cpf || errors.cnpj) ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      Documento {(errors.cpf || errors.cnpj) ? 'inválido' : 'válido'}
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className={`text-center font-medium ${isValid ? 'text-green-600' : 'text-orange-600'}`}>
                        Formulário: {isValid ? 'VÁLIDO ✓' : 'INVÁLIDO ✗'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer compacto */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
              {Object.keys(errors).length > 0 ? (
                <span className="text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {Object.keys(errors).length} campo(s) com erro: {Object.keys(errors).join(', ')}
                </span>
              ) : (
                <span className={`flex items-center ${(isValid || isFormValidManual) ? 'text-green-600' : 'text-orange-600'}`}>
                  <User className="w-4 h-4 mr-1" />
                  {(isValid || isFormValidManual) ? 'Formulário válido' : 'Preencha todos os campos obrigatórios'}
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
                {(isSubmitting || isLoading) && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {cliente ? 'Atualizar' : 'Criar'} Cliente (Hook Form: {isValid ? '✓' : '✗'} | Manual: {isFormValidManual ? '✓' : '✗'})
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClienteModalCompact;
