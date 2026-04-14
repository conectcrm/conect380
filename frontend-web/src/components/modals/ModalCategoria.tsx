import React, { useEffect, useId, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, Save, Package } from 'lucide-react';

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

const categoriaSchema = yup.object().shape({
  nome: yup.string().required('Nome é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: yup
    .string()
    .required('Descrição é obrigatória')
    .min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  cor: yup.string().required('Cor é obrigatória'),
  ativa: yup.boolean(),
});

const coresDisponiveis = [
  { nome: 'Azul', valor: 'blue', classe: 'bg-blue-500' },
  { nome: 'Verde', valor: 'green', classe: 'bg-green-500' },
  { nome: 'Roxo', valor: 'purple', classe: 'bg-purple-500' },
  { nome: 'Laranja', valor: 'orange', classe: 'bg-orange-500' },
  { nome: 'Vermelho', valor: 'red', classe: 'bg-red-500' },
  { nome: 'Amarelo', valor: 'yellow', classe: 'bg-yellow-500' },
  { nome: 'Rosa', valor: 'pink', classe: 'bg-pink-500' },
  { nome: 'Índigo', valor: 'indigo', classe: 'bg-indigo-500' },
];

const labelClass = 'mb-1 block text-sm font-medium text-[#244455]';
const inputClass =
  'w-full rounded-lg border border-[#D4E2E7] px-3 py-2 text-sm text-[#19384C] placeholder:text-[#8AA0AB] focus:border-[#159A9C] focus:outline-none focus:ring-2 focus:ring-[#159A9C]/25';
const inputErrorClass =
  'w-full rounded-lg border border-red-300 px-3 py-2 text-sm text-[#19384C] placeholder:text-[#8AA0AB] focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200';
const primaryButtonClass =
  'inline-flex w-full justify-center rounded-lg border border-transparent bg-[#159A9C] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#117C7E] focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400 sm:ml-3 sm:w-auto';
const secondaryButtonClass =
  'mt-3 inline-flex w-full justify-center rounded-lg border border-[#D4E2E7] bg-white px-4 py-2 text-sm font-medium text-[#244455] shadow-sm transition hover:bg-[#F6FAFB] focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:ring-offset-2 disabled:bg-gray-100 sm:ml-3 sm:mt-0 sm:w-auto';

const ModalCategoria: React.FC<ModalCategoriaProps> = ({
  isOpen,
  onClose,
  onSave,
  categoria,
  isLoading = false,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Categoria>({
    resolver: yupResolver(categoriaSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      cor: 'blue',
      ativa: true,
    },
  });

  useEffect(() => {
    if (categoria) {
      reset({
        nome: categoria.nome,
        descricao: categoria.descricao,
        cor: categoria.cor,
        ativa: categoria.ativa,
      });
    } else {
      reset({
        nome: '',
        descricao: '',
        cor: 'blue',
        ativa: true,
      });
    }
  }, [categoria, reset, isOpen]);

  const onSubmit = async (data: Categoria) => {
    try {
      setIsSaving(true);
      await onSave({
        ...data,
        id: categoria?.id,
      });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-[#0B1F2A]/45 transition-opacity backdrop-blur-[1px]"
          onClick={handleClose}
        />

        <div
          className="inline-block w-full max-w-lg transform overflow-hidden rounded-[20px] border border-[#DCE7EB] bg-white text-left align-bottom shadow-[0_30px_70px_-36px_rgba(16,57,74,0.45)] transition-all sm:my-8 sm:align-middle"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        >
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#F2F8FB] sm:mx-0 sm:h-10 sm:w-10">
                  <Package className="h-6 w-6 text-[#159A9C]" />
                </div>
                <div className="ml-4">
                  <h3 id={titleId} className="text-lg font-semibold leading-6 text-[#19384C]">
                    {categoria ? 'Editar Categoria' : 'Nova Categoria'}
                  </h3>
                  <p id={descriptionId} className="text-sm text-[#5F7380]">
                    {categoria
                      ? 'Atualize as informações da categoria'
                      : 'Crie uma nova categoria de itens'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="rounded-lg p-2 text-[#7A8D99] transition-colors hover:bg-[#F6FAFB] hover:text-[#244455] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                aria-label="Fechar modal de categoria"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-[#DEE8EC] bg-[#F6FAFB] p-4">
              <div>
                <label className={labelClass}>Nome da Categoria *</label>
                <Controller
                  name="nome"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Ex: Software e Tecnologia"
                      className={errors.nome ? inputErrorClass : inputClass}
                    />
                  )}
                />
                {errors.nome && <p className="mt-1 text-sm text-red-500">{errors.nome.message}</p>}
              </div>

              <div>
                <label className={labelClass}>Descrição *</label>
                <Controller
                  name="descricao"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      placeholder="Descreva o que esta categoria engloba..."
                      className={errors.descricao ? inputErrorClass : inputClass}
                    />
                  )}
                />
                {errors.descricao && (
                  <p className="mt-1 text-sm text-red-500">{errors.descricao.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#244455]">Cor da Categoria *</label>
                <Controller
                  name="cor"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {coresDisponiveis.map((cor) => (
                        <button
                          key={cor.valor}
                          type="button"
                          onClick={() => field.onChange(cor.valor)}
                          className={`flex items-center justify-center rounded-lg border-2 p-3 text-sm text-[#244455] transition-all ${
                            field.value === cor.valor
                              ? 'border-[#159A9C] ring-2 ring-[#159A9C]/25'
                              : 'border-[#D4E2E7] hover:border-[#B4BEC9]'
                          }`}
                        >
                          <div className={`h-5 w-5 rounded-full ${cor.classe}`} />
                          <span className="ml-2">{cor.nome}</span>
                        </button>
                      ))}
                    </div>
                  )}
                />
                {errors.cor && <p className="mt-1 text-sm text-red-500">{errors.cor.message}</p>}
              </div>

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
                        className="h-4 w-4 rounded border-[#B4BEC9] text-[#159A9C] focus:ring-[#159A9C]"
                      />
                    )}
                  />
                  <span className="ml-2 text-sm text-[#244455]">Categoria ativa</span>
                </label>
              </div>

              <div className="-mx-4 -mb-4 mt-6 border-t border-[#DEE8EC] bg-white px-4 py-3 sm:-mx-6 sm:-mb-6 sm:flex sm:flex-row-reverse sm:px-6">
                <button type="submit" disabled={isSaving || isLoading} className={primaryButtonClass}>
                  {isSaving ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {categoria ? 'Atualizar' : 'Criar'} Categoria
                    </>
                  )}
                </button>
                <button type="button" onClick={handleClose} disabled={isSaving} className={secondaryButtonClass}>
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
