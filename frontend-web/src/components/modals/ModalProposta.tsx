/**
 * Modal para criação e edição de propostas comerciais
 * Com formatação de moeda brasileira e validação completa
 */

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { X, Save, FileText, DollarSign, Calendar, User, Target } from 'lucide-react';
import { MoneyInput } from '../common/MoneyInput';

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {proposta ? 'Editar Proposta' : 'Nova Proposta'}
              </h2>
              <p className="text-sm text-gray-500">
                {proposta ? 'Atualize os dados da proposta' : 'Preencha as informações da proposta'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            {/* Layout em 2 colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coluna 1 - Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Informações Básicas
                </h3>

                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título da Proposta *
                  </label>
                  <input
                    {...register('titulo')}
                    type="text"
                    placeholder="Ex: Desenvolvimento de sistema CRM"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.titulo ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.titulo && (
                    <p className="mt-1 text-sm text-red-600">{errors.titulo.message}</p>
                  )}
                </div>

                {/* Cliente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente *
                  </label>
                  <input
                    {...register('cliente')}
                    type="text"
                    placeholder="Nome do cliente"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.cliente ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.cliente && (
                    <p className="mt-1 text-sm text-red-600">{errors.cliente.message}</p>
                  )}
                </div>

                {/* Vendedor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendedor Responsável *
                  </label>
                  <select
                    {...register('vendedor')}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.vendedor ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione o vendedor</option>
                    {vendedores.map(vendedor => (
                      <option key={vendedor.value} value={vendedor.value}>
                        {vendedor.label}
                      </option>
                    ))}
                  </select>
                  {errors.vendedor && (
                    <p className="mt-1 text-sm text-red-600">{errors.vendedor.message}</p>
                  )}
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    {...register('categoria')}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.categoria ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    {categorias.map(categoria => (
                      <option key={categoria.value} value={categoria.value}>
                        {categoria.label}
                      </option>
                    ))}
                  </select>
                  {errors.categoria && (
                    <p className="mt-1 text-sm text-red-600">{errors.categoria.message}</p>
                  )}
                </div>
              </div>

              {/* Coluna 2 - Valores e Datas */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Valores e Prazos
                </h3>

                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor da Proposta *
                  </label>
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
                </div>

                {/* Probabilidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Probabilidade de Fechamento *
                  </label>
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
                  {errors.probabilidade && (
                    <p className="mt-1 text-sm text-red-600">{errors.probabilidade.message}</p>
                  )}
                </div>

                {/* Data de Vencimento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Vencimento *
                  </label>
                  <input
                    {...register('data_vencimento')}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.data_vencimento ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.data_vencimento && (
                    <p className="mt-1 text-sm text-red-600">{errors.data_vencimento.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Descrição - Full Width */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição da Proposta *
              </label>
              <textarea
                {...register('descricao')}
                rows={4}
                placeholder="Descreva detalhadamente os serviços/produtos inclusos na proposta..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                  errors.descricao ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.descricao && (
                <p className="mt-1 text-sm text-red-600">{errors.descricao.message}</p>
              )}
            </div>

            {/* Observações */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações Internas
              </label>
              <textarea
                {...register('observacoes')}
                rows={3}
                placeholder="Observações internas sobre a proposta (opcional)..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                  errors.observacoes ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.observacoes && (
                <p className="mt-1 text-sm text-red-600">{errors.observacoes.message}</p>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={!isValid || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Salvando...' : (proposta ? 'Atualizar' : 'Criar Proposta')}
          </button>
        </div>
      </div>
    </div>
  );
};
