/**
 * Modal para criação e edição de propostas comerciais
 * Com formatação de moeda brasileira e validação completa
 * Refatorado para usar o sistema padronizado BaseModal
 */

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { Save, FileText, DollarSign, Calendar, User, Target } from 'lucide-react';
import { MoneyInput } from '../common/MoneyInput';
import { BaseModal, FormField, FormInput, FormTextarea, FormSelect, ModalButton } from './BaseModal';

interface PropostaFormData {
  titulo: string;
  cliente: string;
  vendedor: string;
  valor: number;
  descricao: string;
  probabilidade: number;
  categoria: string;
  data_vencimento: string;
  observacoes?: string;
}

interface ModalPropostaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PropostaFormData) => Promise<void>;
  proposta?: Partial<PropostaFormData>;
  isLoading?: boolean;
}

const schema = yup.object({
  titulo: yup
    .string()
    .required('Título é obrigatório')
    .min(5, 'Título deve ter pelo menos 5 caracteres')
    .max(100, 'Título deve ter no máximo 100 caracteres'),

  cliente: yup
    .string()
    .required('Cliente é obrigatório'),

  vendedor: yup
    .string()
    .required('Vendedor é obrigatório'),

  valor: yup
    .number()
    .transform((value, originalValue) => {
      if (originalValue === '' || originalValue === null || originalValue === undefined) {
        return undefined;
      }
      if (isNaN(value)) {
        return undefined;
      }
      return value;
    })
    .required('Valor é obrigatório')
    .min(0.01, 'Valor deve ser maior que zero'),

  descricao: yup
    .string()
    .required('Descrição é obrigatória')
    .min(10, 'Descrição deve ter pelo menos 10 caracteres')
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),

  probabilidade: yup
    .number()
    .required('Probabilidade é obrigatória')
    .min(0, 'Probabilidade mínima é 0%')
    .max(100, 'Probabilidade máxima é 100%'),

  categoria: yup
    .string()
    .required('Categoria é obrigatória'),

  data_vencimento: yup
    .string()
    .required('Data de vencimento é obrigatória'),

  observacoes: yup
    .string()
    .max(300, 'Observações devem ter no máximo 300 caracteres')
});

export const ModalProposta: React.FC<ModalPropostaProps> = ({
  isOpen,
  onClose,
  onSave,
  proposta,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    reset,
    setValue,
    watch
  } = useForm<PropostaFormData>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      titulo: '',
      cliente: '',
      vendedor: '',
      valor: 0,
      descricao: '',
      probabilidade: 50,
      categoria: 'consultoria',
      data_vencimento: '',
      observacoes: ''
    }
  });

  // Opções para os selects
  const categorias = [
    { value: 'consultoria', label: 'Consultoria' },
    { value: 'desenvolvimento', label: 'Desenvolvimento' },
    { value: 'design', label: 'Design' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'treinamento', label: 'Treinamento' },
    { value: 'suporte', label: 'Suporte' },
    { value: 'licenca', label: 'Licença' },
    { value: 'outros', label: 'Outros' }
  ];

  const vendedores = [
    { value: 'João Silva', label: 'João Silva' },
    { value: 'Maria Santos', label: 'Maria Santos' },
    { value: 'Pedro Costa', label: 'Pedro Costa' },
    { value: 'Ana Oliveira', label: 'Ana Oliveira' }
  ];

  // Reset form quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      if (proposta) {
        reset(proposta as PropostaFormData);
      } else {
        reset({
          titulo: '',
          cliente: '',
          vendedor: '',
          valor: 0,
          descricao: '',
          probabilidade: 50,
          categoria: 'consultoria',
          data_vencimento: '',
          observacoes: ''
        });
      }
    }
  }, [proposta, reset, isOpen]);

  const onSubmit = async (data: PropostaFormData) => {
    const toastId = toast.loading(
      proposta ? 'Atualizando proposta...' : 'Criando proposta...'
    );

    try {
      await onSave(data);

      toast.success(
        proposta ? 'Proposta atualizada com sucesso!' : 'Proposta criada com sucesso!',
        { id: toastId }
      );

      setTimeout(() => {
        handleClose();
      }, 1000);

    } catch (error) {
      toast.error(
        'Erro ao salvar proposta. Tente novamente.',
        { id: toastId }
      );
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  const footerContent = (
    <div className="flex items-center justify-end gap-3">
      <ModalButton
        type="button"
        variant="secondary"
        onClick={handleClose}
      >
        Cancelar
      </ModalButton>
      <ModalButton
        onClick={handleSubmit(onSubmit)}
        disabled={!isValid || isLoading}
        variant="primary"
        icon={Save}
        loading={isLoading}
      >
        {proposta ? 'Atualizar' : 'Criar Proposta'}
      </ModalButton>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={proposta ? 'Editar Proposta' : 'Nova Proposta'}
      subtitle={proposta ? 'Atualize os dados da proposta' : 'Preencha as informações da proposta'}
      size="large"
      footer={footerContent}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Layout em 2 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna 1 - Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-base font-medium text-gray-900 flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4" />
              Informações Básicas
            </h3>

            <FormField
              label="Título da Proposta"
              required
              error={errors.titulo?.message}
            >
              <FormInput
                {...register('titulo')}
                type="text"
                placeholder="Ex: Desenvolvimento de sistema CRM"
                error={!!errors.titulo}
              />
            </FormField>

            <FormField
              label="Cliente"
              required
              error={errors.cliente?.message}
            >
              <FormInput
                {...register('cliente')}
                type="text"
                placeholder="Nome do cliente"
                error={!!errors.cliente}
              />
            </FormField>

            <FormField
              label="Vendedor Responsável"
              required
              error={errors.vendedor?.message}
            >
              <FormSelect
                {...register('vendedor')}
                options={vendedores}
                placeholder="Selecione o vendedor"
                error={!!errors.vendedor}
              />
            </FormField>

            <FormField
              label="Categoria"
              required
              error={errors.categoria?.message}
            >
              <FormSelect
                {...register('categoria')}
                options={categorias}
                error={!!errors.categoria}
              />
            </FormField>
          </div>

          {/* Coluna 2 - Valores e Datas */}
          <div className="space-y-4">
            <h3 className="text-base font-medium text-gray-900 flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4" />
              Valores e Prazos
            </h3>

            <FormField
              label="Valor da Proposta"
              required
              error={errors.valor?.message}
            >
              <Controller
                name="valor"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <MoneyInput
                    value={value}
                    onChange={(numericValue) => onChange(numericValue)}
                    error={!!errors.valor}
                    errorMessage={errors.valor?.message}
                    showSymbol={true}
                    placeholder="R$ 0,00"
                  />
                )}
              />
            </FormField>

            <FormField
              label="Probabilidade de Fechamento"
              required
              error={errors.probabilidade?.message}
            >
              <div className="flex items-center gap-3">
                <input
                  {...register('probabilidade')}
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-600 min-w-[50px]">
                  {watch('probabilidade')}%
                </span>
              </div>
            </FormField>

            <FormField
              label="Data de Vencimento"
              required
              error={errors.data_vencimento?.message}
            >
              <FormInput
                {...register('data_vencimento')}
                type="date"
                min={new Date().toISOString().split('T')[0]}
                error={!!errors.data_vencimento}
              />
            </FormField>
          </div>
        </div>

        {/* Descrição - Full Width */}
        <FormField
          label="Descrição da Proposta"
          required
          error={errors.descricao?.message}
        >
          <FormTextarea
            {...register('descricao')}
            rows={4}
            placeholder="Descreva detalhadamente os serviços/produtos inclusos na proposta..."
            error={!!errors.descricao}
          />
        </FormField>

        {/* Observações */}
        <FormField
          label="Observações Internas"
          error={errors.observacoes?.message}
        >
          <FormTextarea
            {...register('observacoes')}
            rows={3}
            placeholder="Observações internas sobre a proposta (opcional)..."
            error={!!errors.observacoes}
          />
        </FormField>
      </form>
    </BaseModal>
  );
};
