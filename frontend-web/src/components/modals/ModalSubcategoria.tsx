import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, Save, Tag } from 'lucide-react';

// Interfaces
interface Subcategoria {
  id?: string;
  nome: string;
  descricao: string;
  categoriaId: string;
  ativa: boolean;
}

interface Categoria {
  id: string;
  nome: string;
  cor: string;
}

interface ModalSubcategoriaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subcategoria: Subcategoria) => Promise<void>;
  subcategoria?: Subcategoria | null;
  categoriaAtual?: Categoria | null;
  categorias: Categoria[];
  isLoading?: boolean;
}

// Schema de validação
const subcategoriaSchema = yup.object().shape({
  nome: yup.string().required('Nome é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: yup
    .string()
    .required('Descrição é obrigatória')
    .min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  categoriaId: yup.string().required('Categoria é obrigatória'),
  ativa: yup.boolean(),
});

const ModalSubcategoria: React.FC<ModalSubcategoriaProps> = ({
  isOpen,
  onClose,
  onSave,
  subcategoria,
  categoriaAtual,
  categorias,
  isLoading = false,
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Subcategoria>({
    resolver: yupResolver(subcategoriaSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      categoriaId: categoriaAtual?.id || '',
      ativa: true,
    },
  });

  // Reset form quando subcategoria ou categoria atual muda
  useEffect(() => {
    if (subcategoria) {
      reset({
        nome: subcategoria.nome,
        descricao: subcategoria.descricao,
        categoriaId: subcategoria.categoriaId,
        ativa: subcategoria.ativa,
      });
    } else {
      reset({
        nome: '',
        descricao: '',
        categoriaId: categoriaAtual?.id || '',
        ativa: true,
      });
    }
  }, [subcategoria, categoriaAtual, reset, isOpen]);

  const onSubmit = async (data: Subcategoria) => {
    try {
      setIsSaving(true);

      const subcategoriaData: Subcategoria = {
        ...data,
        id: subcategoria?.id,
      };

      await onSave(subcategoriaData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar subcategoria:', error);
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
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                  <Tag className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {subcategoria ? 'Editar Subcategoria' : 'Nova Subcategoria'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {subcategoria
                      ? 'Atualize as informações da subcategoria'
                      : 'Crie uma nova subcategoria'}
                  </p>
                  {categoriaAtual && (
                    <div className="mt-2 flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full bg-${categoriaAtual.cor}-500 mr-2`}
                      ></div>
                      <span className="text-xs text-gray-600">
                        Categoria: {categoriaAtual.nome}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                <Controller
                  name="categoriaId"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categorias.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.categoriaId && (
                  <p className="text-red-500 text-sm mt-1">{errors.categoriaId.message}</p>
                )}
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Subcategoria *
                </label>
                <Controller
                  name="nome"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Ex: Sistema de Gestão"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  )}
                />
                {errors.nome && <p className="text-red-500 text-sm mt-1">{errors.nome.message}</p>}
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                <Controller
                  name="descricao"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      placeholder="Descreva esta subcategoria..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  )}
                />
                {errors.descricao && (
                  <p className="text-red-500 text-sm mt-1">{errors.descricao.message}</p>
                )}
              </div>

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
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                    )}
                  />
                  <span className="ml-2 text-sm text-gray-700">Subcategoria ativa</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse mt-6 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6">
                <button
                  type="submit"
                  disabled={isSaving || isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {subcategoria ? 'Atualizar' : 'Criar'} Subcategoria
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSaving}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-100"
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

export default ModalSubcategoria;
