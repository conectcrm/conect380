import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, Save, Settings } from 'lucide-react';

// Interfaces
interface Configuracao {
  id?: string;
  nome: string;
  descricao: string;
  subcategoriaId: string;
  preco: number;
  multiplicador: number;
  ativa: boolean;
}

interface Subcategoria {
  id: string;
  nome: string;
  categoriaId: string;
  categoria?: {
    nome: string;
    cor: string;
  };
}

interface ModalConfiguracaoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (configuracao: Configuracao) => Promise<void>;
  configuracao?: Configuracao | null;
  subcategoriaAtual?: Subcategoria | null;
  subcategorias: Subcategoria[];
  isLoading?: boolean;
}

// Schema de validação
const configuracaoSchema = yup.object().shape({
  nome: yup.string().required('Nome é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: yup.string().required('Descrição é obrigatória').min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  subcategoriaId: yup.string().required('Subcategoria é obrigatória'),
  preco: yup.number()
    .required('Preço é obrigatório')
    .min(0, 'Preço deve ser maior ou igual a zero')
    .typeError('Preço deve ser um número válido'),
  multiplicador: yup.number()
    .required('Multiplicador é obrigatório')
    .min(0.1, 'Multiplicador deve ser maior que 0')
    .max(10, 'Multiplicador deve ser menor ou igual a 10')
    .typeError('Multiplicador deve ser um número válido'),
  ativa: yup.boolean()
});

const ModalConfiguracao: React.FC<ModalConfiguracaoProps> = ({
  isOpen,
  onClose,
  onSave,
  configuracao,
  subcategoriaAtual,
  subcategorias,
  isLoading = false
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<Configuracao>({
    resolver: yupResolver(configuracaoSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      subcategoriaId: subcategoriaAtual?.id || '',
      preco: 0,
      multiplicador: 1,
      ativa: true
    }
  });

  const watchedPreco = watch('preco', 0);
  const watchedMultiplicador = watch('multiplicador', 1);

  // Reset form quando configuração ou subcategoria atual muda
  useEffect(() => {
    if (configuracao) {
      reset({
        nome: configuracao.nome,
        descricao: configuracao.descricao,
        subcategoriaId: configuracao.subcategoriaId,
        preco: configuracao.preco,
        multiplicador: configuracao.multiplicador,
        ativa: configuracao.ativa
      });
    } else {
      reset({
        nome: '',
        descricao: '',
        subcategoriaId: subcategoriaAtual?.id || '',
        preco: 0,
        multiplicador: 1,
        ativa: true
      });
    }
  }, [configuracao, subcategoriaAtual, reset, isOpen]);

  const onSubmit = async (data: Configuracao) => {
    try {
      setIsSaving(true);

      const configuracaoData: Configuracao = {
        ...data,
        id: configuracao?.id
      };

      await onSave(configuracaoData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      reset();
      onClose();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const precoFinal = watchedPreco * watchedMultiplicador;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {configuracao ? 'Editar Configuração' : 'Nova Configuração'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {configuracao ? 'Atualize as informações da configuração' : 'Crie uma nova configuração'}
                  </p>
                  {subcategoriaAtual && (
                    <div className="mt-2 flex items-center">
                      {subcategoriaAtual.categoria && (
                        <div className={`w-3 h-3 rounded-full bg-${subcategoriaAtual.categoria.cor}-500 mr-2`}></div>
                      )}
                      <span className="text-xs text-gray-600">
                        {subcategoriaAtual.categoria?.nome} → {subcategoriaAtual.nome}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Subcategoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategoria *
                </label>
                <Controller
                  name="subcategoriaId"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione uma subcategoria</option>
                      {subcategorias.map((subcategoria) => (
                        <option key={subcategoria.id} value={subcategoria.id}>
                          {subcategoria.categoria?.nome} → {subcategoria.nome}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.subcategoriaId && (
                  <p className="text-red-500 text-sm mt-1">{errors.subcategoriaId.message}</p>
                )}
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Configuração *
                </label>
                <Controller
                  name="nome"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Ex: Licença Web - 10 usuários"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                />
                {errors.nome && (
                  <p className="text-red-500 text-sm mt-1">{errors.nome.message}</p>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição *
                </label>
                <Controller
                  name="descricao"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      placeholder="Descreva esta configuração e suas características..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                />
                {errors.descricao && (
                  <p className="text-red-500 text-sm mt-1">{errors.descricao.message}</p>
                )}
              </div>

              {/* Preço e Multiplicador */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço Base *
                  </label>
                  <Controller
                    name="preco"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    )}
                  />
                  {errors.preco && (
                    <p className="text-red-500 text-sm mt-1">{errors.preco.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Multiplicador *
                  </label>
                  <Controller
                    name="multiplicador"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="10"
                        placeholder="1.0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                      />
                    )}
                  />
                  {errors.multiplicador && (
                    <p className="text-red-500 text-sm mt-1">{errors.multiplicador.message}</p>
                  )}
                </div>
              </div>

              {/* Cálculo do Preço Final */}
              {(watchedPreco > 0 || watchedMultiplicador !== 1) && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Preço Base:</span>
                    <span className="font-medium">{formatCurrency(watchedPreco)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Multiplicador:</span>
                    <span className="font-medium">{watchedMultiplicador}x</span>
                  </div>
                  <hr className="my-2 border-blue-200" />
                  <div className="flex justify-between items-center text-base font-semibold">
                    <span className="text-blue-900">Preço Final:</span>
                    <span className="text-blue-900">{formatCurrency(precoFinal)}</span>
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="flex items-center">
                  <Controller
                    name="ativa"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    )}
                  />
                  <span className="ml-2 text-sm text-gray-700">Configuração ativa</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse mt-6 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6">
                <button
                  type="submit"
                  disabled={isSaving || isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#159A9C] text-base font-medium text-white hover:bg-[#0F7B7D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#159A9C] sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {configuracao ? 'Atualizar' : 'Criar'} Configuração
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSaving}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-100"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalConfiguracao;
