import React, { useEffect, useId, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, Save, Tag, DollarSign, SlidersHorizontal } from 'lucide-react';

interface CamposPersonalizados {
  duracao?: boolean;
  usuarios?: boolean;
  modalidade?: boolean;
  recursos?: boolean;
}

interface Subcategoria {
  id?: string;
  nome: string;
  descricao: string;
  categoriaId: string;
  precoBase: number;
  unidade: string;
  camposPersonalizados?: CamposPersonalizados;
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

const categoriaColorDotClassMap: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  pink: 'bg-pink-500',
  indigo: 'bg-indigo-500',
};

const unidadesDisponiveis = [
  { value: 'unidade', label: 'Unidade' },
  { value: 'pacote', label: 'Pacote' },
  { value: 'licenca', label: 'Licença' },
  { value: 'hora', label: 'Hora' },
  { value: 'dia', label: 'Dia' },
  { value: 'mensal', label: 'Mensal' },
];

const subcategoriaSchema = yup.object().shape({
  nome: yup.string().required('Nome é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: yup
    .string()
    .required('Descrição é obrigatória')
    .min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  categoriaId: yup.string().required('Categoria é obrigatória'),
  precoBase: yup
    .number()
    .required('Preço base é obrigatório')
    .min(0, 'Preço base deve ser maior ou igual a zero')
    .typeError('Preço base deve ser um número válido'),
  unidade: yup.string().required('Unidade é obrigatória'),
  camposPersonalizados: yup
    .object({
      duracao: yup.boolean().optional(),
      usuarios: yup.boolean().optional(),
      modalidade: yup.boolean().optional(),
      recursos: yup.boolean().optional(),
    })
    .optional(),
  ativa: yup.boolean(),
});

const defaultCamposPersonalizados: CamposPersonalizados = {
  duracao: false,
  usuarios: false,
  modalidade: false,
  recursos: false,
};

const labelClass = 'mb-1 block text-sm font-medium text-[#244455]';
const inputClass =
  'w-full rounded-lg border border-[#D4E2E7] px-3 py-2 text-sm text-[#19384C] placeholder:text-[#8AA0AB] focus:border-[#159A9C] focus:outline-none focus:ring-2 focus:ring-[#159A9C]/25';
const inputErrorClass =
  'w-full rounded-lg border border-red-300 px-3 py-2 text-sm text-[#19384C] placeholder:text-[#8AA0AB] focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200';
const primaryButtonClass =
  'inline-flex w-full justify-center rounded-lg border border-transparent bg-[#159A9C] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#117C7E] focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400 sm:ml-3 sm:w-auto';
const secondaryButtonClass =
  'mt-3 inline-flex w-full justify-center rounded-lg border border-[#D4E2E7] bg-white px-4 py-2 text-sm font-medium text-[#244455] shadow-sm transition hover:bg-[#F6FAFB] focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:ring-offset-2 disabled:bg-gray-100 sm:ml-3 sm:mt-0 sm:w-auto';

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
  const titleId = useId();
  const descriptionId = useId();

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
      precoBase: 0,
      unidade: 'unidade',
      camposPersonalizados: defaultCamposPersonalizados,
      ativa: true,
    },
  });

  useEffect(() => {
    if (subcategoria) {
      reset({
        nome: subcategoria.nome,
        descricao: subcategoria.descricao,
        categoriaId: subcategoria.categoriaId,
        precoBase: Number(subcategoria.precoBase || 0),
        unidade: subcategoria.unidade || 'unidade',
        camposPersonalizados: {
          ...defaultCamposPersonalizados,
          ...(subcategoria.camposPersonalizados || {}),
        },
        ativa: subcategoria.ativa,
      });
    } else {
      reset({
        nome: '',
        descricao: '',
        categoriaId: categoriaAtual?.id || '',
        precoBase: 0,
        unidade: 'unidade',
        camposPersonalizados: defaultCamposPersonalizados,
        ativa: true,
      });
    }
  }, [subcategoria, categoriaAtual, reset, isOpen]);

  const onSubmit = async (data: Subcategoria) => {
    try {
      setIsSaving(true);
      await onSave({
        ...data,
        id: subcategoria?.id,
        precoBase: Number(data.precoBase || 0),
      });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar subcategoria:', error);
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
          className="inline-block w-full max-w-2xl transform overflow-hidden rounded-[20px] border border-[#DCE7EB] bg-white text-left align-bottom shadow-[0_30px_70px_-36px_rgba(16,57,74,0.45)] transition-all sm:my-8 sm:align-middle"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        >
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#F2F8FB] sm:mx-0 sm:h-10 sm:w-10">
                  <Tag className="h-6 w-6 text-[#159A9C]" />
                </div>
                <div className="ml-4">
                  <h3 id={titleId} className="text-lg font-semibold leading-6 text-[#19384C]">
                    {subcategoria ? 'Editar Subcategoria' : 'Nova Subcategoria'}
                  </h3>
                  <p id={descriptionId} className="text-sm text-[#5F7380]">
                    {subcategoria
                      ? 'Atualize os detalhes comerciais da subcategoria'
                      : 'Defina estrutura e base comercial da nova subcategoria'}
                  </p>
                  {categoriaAtual && (
                    <div className="mt-2 flex items-center">
                      <div
                        className={`mr-2 h-3 w-3 rounded-full ${
                          categoriaColorDotClassMap[categoriaAtual.cor] || categoriaColorDotClassMap.blue
                        }`}
                      />
                      <span className="text-xs text-[#5F7380]">Categoria: {categoriaAtual.nome}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="rounded-lg p-2 text-[#7A8D99] transition-colors hover:bg-[#F6FAFB] hover:text-[#244455] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                aria-label="Fechar modal de subcategoria"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-[#DEE8EC] bg-[#F6FAFB] p-4">
              <div>
                <label className={labelClass}>Categoria *</label>
                <Controller
                  name="categoriaId"
                  control={control}
                  render={({ field }) => (
                    <select {...field} className={errors.categoriaId ? inputErrorClass : inputClass}>
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
                  <p className="mt-1 text-sm text-red-500">{errors.categoriaId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Nome da Subcategoria *</label>
                  <Controller
                    name="nome"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="Ex: Sistema de Gestão"
                        className={errors.nome ? inputErrorClass : inputClass}
                      />
                    )}
                  />
                  {errors.nome && <p className="mt-1 text-sm text-red-500">{errors.nome.message}</p>}
                </div>

                <div>
                  <label className="mb-1 flex items-center text-sm font-medium text-[#244455]">
                    <DollarSign className="mr-1 h-4 w-4 text-[#159A9C]" />
                    Preço Base *
                  </label>
                  <Controller
                    name="precoBase"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        className={errors.precoBase ? inputErrorClass : inputClass}
                        onChange={(event) => field.onChange(Number(event.target.value || 0))}
                      />
                    )}
                  />
                  {errors.precoBase && (
                    <p className="mt-1 text-sm text-red-500">{errors.precoBase.message}</p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Unidade *</label>
                  <Controller
                    name="unidade"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className={errors.unidade ? inputErrorClass : inputClass}>
                        {unidadesDisponiveis.map((unidade) => (
                          <option key={unidade.value} value={unidade.value}>
                            {unidade.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.unidade && (
                    <p className="mt-1 text-sm text-red-500">{errors.unidade.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Descrição *</label>
                  <Controller
                    name="descricao"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={3}
                        placeholder="Descreva escopo, público e regras comerciais desta subcategoria..."
                        className={errors.descricao ? inputErrorClass : inputClass}
                      />
                    )}
                  />
                  {errors.descricao && (
                    <p className="mt-1 text-sm text-red-500">{errors.descricao.message}</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-[#D4E2E7] bg-white p-3">
                <label className="mb-3 flex items-center text-sm font-medium text-[#244455]">
                  <SlidersHorizontal className="mr-2 h-4 w-4 text-[#159A9C]" />
                  Campos Personalizáveis
                </label>

                <Controller
                  name="camposPersonalizados"
                  control={control}
                  render={({ field }) => {
                    const value = { ...defaultCamposPersonalizados, ...(field.value || {}) };

                    return (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <label className="flex items-center text-sm text-[#244455]">
                          <input
                            type="checkbox"
                            checked={Boolean(value.duracao)}
                            onChange={(event) =>
                              field.onChange({ ...value, duracao: event.target.checked })
                            }
                            className="mr-2 h-4 w-4 rounded border-[#B4BEC9] text-[#159A9C] focus:ring-[#159A9C]"
                          />
                          Duração
                        </label>
                        <label className="flex items-center text-sm text-[#244455]">
                          <input
                            type="checkbox"
                            checked={Boolean(value.usuarios)}
                            onChange={(event) =>
                              field.onChange({ ...value, usuarios: event.target.checked })
                            }
                            className="mr-2 h-4 w-4 rounded border-[#B4BEC9] text-[#159A9C] focus:ring-[#159A9C]"
                          />
                          Usuários
                        </label>
                        <label className="flex items-center text-sm text-[#244455]">
                          <input
                            type="checkbox"
                            checked={Boolean(value.modalidade)}
                            onChange={(event) =>
                              field.onChange({ ...value, modalidade: event.target.checked })
                            }
                            className="mr-2 h-4 w-4 rounded border-[#B4BEC9] text-[#159A9C] focus:ring-[#159A9C]"
                          />
                          Modalidade
                        </label>
                        <label className="flex items-center text-sm text-[#244455]">
                          <input
                            type="checkbox"
                            checked={Boolean(value.recursos)}
                            onChange={(event) =>
                              field.onChange({ ...value, recursos: event.target.checked })
                            }
                            className="mr-2 h-4 w-4 rounded border-[#B4BEC9] text-[#159A9C] focus:ring-[#159A9C]"
                          />
                          Recursos
                        </label>
                      </div>
                    );
                  }}
                />
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
                  <span className="ml-2 text-sm text-[#244455]">Subcategoria ativa</span>
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
                      {subcategoria ? 'Atualizar' : 'Criar'} Subcategoria
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

export default ModalSubcategoria;
