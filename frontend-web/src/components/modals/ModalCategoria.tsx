import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, Save, Package } from 'lucide-react';

// Interfaces
interface Categoria {
  id?: string;
  nome: string;
  descricao: string;
  cor: string;
  ativa: boolean;
}

interface ModalCategoriaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoria: Categoria) => Promise<void>;
  categoria?: Categoria | null;
  isLoading?: boolean;
}

// Schema de validação
const categoriaSchema = yup.object().shape({
  nome: yup.string().required('Nome é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: yup.string().required('Descrição é obrigatória').min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  cor: yup.string().required('Cor é obrigatória'),
  ativa: yup.boolean()
});

// Cores disponíveis
const coresDisponiveis = [
  { nome: 'Azul', valor: 'blue', classe: 'bg-blue-500', classeHover: 'hover:bg-blue-600' },
  { nome: 'Verde', valor: 'green', classe: 'bg-green-500', classeHover: 'hover:bg-green-600' },
  { nome: 'Roxo', valor: 'purple', classe: 'bg-purple-500', classeHover: 'hover:bg-purple-600' },
  { nome: 'Laranja', valor: 'orange', classe: 'bg-orange-500', classeHover: 'hover:bg-orange-600' },
  { nome: 'Vermelho', valor: 'red', classe: 'bg-red-500', classeHover: 'hover:bg-red-600' },
  { nome: 'Amarelo', valor: 'yellow', classe: 'bg-yellow-500', classeHover: 'hover:bg-yellow-600' },
  { nome: 'Rosa', valor: 'pink', classe: 'bg-pink-500', classeHover: 'hover:bg-pink-600' },
  { nome: 'Índigo', valor: 'indigo', classe: 'bg-indigo-500', classeHover: 'hover:bg-indigo-600' }
];

const ModalCategoria: React.FC<ModalCategoriaProps> = ({
  isOpen,
  onClose,
  onSave,
  categoria,
  isLoading = false
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<Categoria>({
    resolver: yupResolver(categoriaSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      cor: 'blue',
      ativa: true
    }
  });

  // Reset form quando categoria muda
  useEffect(() => {
    if (categoria) {
      reset({
        nome: categoria.nome,
        descricao: categoria.descricao,
        cor: categoria.cor,
        ativa: categoria.ativa
      });
    } else {
      reset({
        nome: '',
        descricao: '',
        cor: 'blue',
        ativa: true
      });
    }
  }, [categoria, reset, isOpen]);

  const onSubmit = async (data: Categoria) => {
    try {
      setIsSaving(true);
      
      const categoriaData: Categoria = {
        ...data,
        id: categoria?.id
      };

      await onSave(categoriaData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
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
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {categoria ? 'Editar Categoria' : 'Nova Categoria'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {categoria ? 'Atualize as informações da categoria' : 'Crie uma nova categoria de produtos'}
                  </p>
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
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Categoria *
                </label>
                <Controller
                  name="nome"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Ex: Software & Tecnologia"
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
                      placeholder="Descreva o que esta categoria engloba..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                />
                {errors.descricao && (
                  <p className="text-red-500 text-sm mt-1">{errors.descricao.message}</p>
                )}
              </div>

              {/* Cor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor da Categoria *
                </label>
                <Controller
                  name="cor"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-4 gap-2">
                      {coresDisponiveis.map((cor) => (
                        <button
                          key={cor.valor}
                          type="button"
                          onClick={() => field.onChange(cor.valor)}
                          className={`
                            flex items-center justify-center p-3 rounded-lg border-2 transition-all
                            ${field.value === cor.valor 
                              ? 'border-gray-400 ring-2 ring-blue-500' 
                              : 'border-gray-200 hover:border-gray-300'
                            }
                          `}
                        >
                          <div className={`w-6 h-6 rounded-full ${cor.classe}`} />
                          <span className="ml-2 text-sm text-gray-700">{cor.nome}</span>
                        </button>
                      ))}
                    </div>
                  )}
                />
                {errors.cor && (
                  <p className="text-red-500 text-sm mt-1">{errors.cor.message}</p>
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
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    )}
                  />
                  <span className="ml-2 text-sm text-gray-700">Categoria ativa</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse mt-6 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6">
                <button
                  type="submit"
                  disabled={isSaving || isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {categoria ? 'Atualizar' : 'Criar'} Categoria
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

export default ModalCategoria;
