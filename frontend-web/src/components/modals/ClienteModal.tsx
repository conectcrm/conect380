import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { X, User, Building, MapPin, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Cliente } from '../../services/clientesService';
import { clienteValidationSchema, ClienteFormData } from '../../utils/validation';
import { FormField, AddressFields, DocumentField, TagsField } from '../forms/FormField';

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  cliente?: Cliente | null;
  isLoading?: boolean;
}

const ClienteModal: React.FC<ClienteModalProps> = ({
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
    formState: { errors, isValid, isSubmitting }
  } = useForm<ClienteFormData>({
    resolver: yupResolver(clienteValidationSchema),
    mode: 'onChange', // Validação em tempo real
    defaultValues: {
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
    }
  });

  const watchTipo = watch('tipo');
  const watchTags = watch('tags') || [];

  // Carregar dados do cliente para edição
  useEffect(() => {
    if (isOpen) {
      if (cliente) {
        // Modo edição - carregar dados do cliente
        reset({
          nome: cliente.nome || '',
          email: cliente.email || '',
          telefone: cliente.telefone || '',
          tipo: cliente.tipo || 'pessoa_fisica',
          cpf: cliente.tipo === 'pessoa_fisica' ? cliente.documento : '',
          cnpj: cliente.tipo === 'pessoa_juridica' ? cliente.documento : '',
          empresa: cliente.empresa || '',
          cargo: cliente.cargo || '',
          endereco: {
            cep: cliente.cep || '',
            logradouro: cliente.endereco?.split(',')[0] || '',
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
        // Modo criação - só limpar na primeira abertura
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
      setCurrentTab('dados-basicos');
    }
  }, [cliente, reset, isOpen]); // Adicionado isOpen como dependência

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

  const onSubmit = async (data: ClienteFormData) => {
    try {
      // Preparar dados para envio
      const clienteData = {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        tipo: data.tipo,
        documento: data.tipo === 'pessoa_fisica' ? data.cpf! : data.cnpj!,
        empresa: data.empresa || '',
        cargo: data.cargo || '',
        endereco: [
          data.endereco?.logradouro,
          data.endereco?.numero,
          data.endereco?.bairro
        ].filter(Boolean).join(', '),
        cidade: data.endereco?.cidade || '',
        estado: data.endereco?.estado || '',
        cep: data.endereco?.cep || '',
        observacoes: data.observacoes || '',
        status: data.status,
        tags: data.tags || [],
        // Campos obrigatórios do backend
        site: '',
        data_nascimento: '',
        genero: '',
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[96vh] overflow-hidden flex flex-col">
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
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
                  control={control}
                  watch={watch}
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
                    { value: 'cliente_ativo', label: 'Cliente Ativo' },
                    { value: 'cliente_inativo', label: 'Cliente Inativo' },
                    { value: 'prospecto', label: 'Prospecto' }
                  ]}
                />

                <TagsField
                  name="tags"
                  label="Tags"
                  control={control}
                  error={errors.tags}
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
                  {Object.keys(errors).length} campo(s) com erro
                </span>
              ) : (
                <span className="text-green-600 flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Formulário válido
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
                disabled={!isValid || isSubmitting || isLoading}
                className="px-6 py-2 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {(isSubmitting || isLoading) && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {cliente ? 'Atualizar' : 'Criar'} Cliente
              </button>
            </div>
          </div>
        </form>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Dados Básicos */}
            <div className="space-y-6">
                {/* Nome e Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="nome"
                    label="Nome Completo"
                    required
                    register={register}
                    error={errors.nome}
                    placeholder="Digite o nome completo"
                    autoComplete="name"
                  />
                  <FormField
                    name="email"
                    label="E-mail"
                    type="email"
                    required
                    register={register}
                    error={errors.email}
                    placeholder="email@exemplo.com"
                    autoComplete="email"
                  />
                </div>

                {/* Telefone e Tipo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="telefone"
                    label="Telefone"
                    mask="(99) 99999-9999"
                    required
                    register={register}
                    error={errors.telefone}
                    placeholder="(11) 99999-9999"
                    autoComplete="tel"
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
                </div>

                {/* CPF/CNPJ condicional */}
                <DocumentField
                  register={register}
                  errors={errors}
                  watchTipo={watchTipo}
                />

                {/* Campos para Pessoa Jurídica */}
                {watchTipo === 'pessoa_juridica' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      name="empresa"
                      label="Nome da Empresa"
                      required
                      register={register}
                      error={errors.empresa}
                      placeholder="Nome da empresa"
                    />
                    <FormField
                      name="cargo"
                      label="Cargo"
                      register={register}
                      error={errors.cargo}
                      placeholder="Cargo na empresa"
                    />
                  </div>
                )}

                {/* Status */}
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

                {/* Tags */}
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                    <TagsField
                      name="tags"
                      label="Tags"
                      value={field.value || []}
                      onChange={field.onChange}
                      error={errors.tags as any}
                      availableTags={['Premium', 'VIP', 'Startup', 'Corporativo', 'Lead Quente', 'Indicação']}
                    />
                  )}
                />
              </div>

            {/* Endereço */}
            <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Informações de Endereço
                </h3>
                
                {/* CEP com busca automática */}
                <FormField
                  name="endereco.cep"
                  label="CEP"
                  mask="99999-999"
                  register={register}
                  error={errors.endereco?.cep}
                  placeholder="00000-000"
                  helpText="Digite o CEP para buscar o endereço automaticamente"
                  onBlur={(e) => buscarCEP(e.target.value)}
                />

                {/* Campos de endereço */}
                <AddressFields
                  register={register}
                  errors={errors}
                  prefix="endereco"
                />
              </div>

            {/* Observações */}
            <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Informações Adicionais
                </h3>
                
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
              </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
              {Object.keys(errors).length > 0 && (
                <span className="text-red-600">
                  ⚠️ Verifique os campos obrigatórios
                </span>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!isValid || isSubmitting || isLoading}
                className="px-4 py-2 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {(isSubmitting || isLoading) && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {cliente ? 'Atualizar' : 'Criar'} Cliente
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClienteModal;
