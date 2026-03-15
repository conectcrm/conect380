import React, { useEffect, useId, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, Save, Settings } from 'lucide-react';

interface Configuracao {
  id?: string;
  nome: string;
  descricao: string;
  subcategoriaId: string;
  multiplicador: number;
  ativa: boolean;
}

interface Subcategoria {
  id: string;
  nome: string;
  categoriaId: string;
  precoBase: number;
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

const configuracaoSchema = yup.object().shape({
  nome: yup.string().required('Nome e obrigatorio').min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: yup
    .string()
    .required('Descricao e obrigatoria')
    .min(10, 'Descricao deve ter pelo menos 10 caracteres'),
  subcategoriaId: yup.string().required('Subcategoria e obrigatoria'),
  multiplicador: yup
    .number()
    .required('Multiplicador e obrigatorio')
    .min(0.1, 'Multiplicador deve ser maior que 0')
    .max(10, 'Multiplicador deve ser menor ou igual a 10')
    .typeError('Multiplicador deve ser um numero valido'),
  ativa: yup.boolean(),
});

const labelClass = 'mb-1 block text-sm font-medium text-[#244455]';
const inputClass =
  'w-full rounded-lg border border-[#D4E2E7] px-3 py-2 text-sm text-[#19384C] placeholder:text-[#8AA0AB] focus:border-[#159A9C] focus:outline-none focus:ring-2 focus:ring-[#159A9C]/25';
const inputErrorClass =
  'w-full rounded-lg border border-red-300 px-3 py-2 text-sm text-[#19384C] placeholder:text-[#8AA0AB] focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200';
const primaryButtonClass =
  'inline-flex w-full justify-center rounded-lg border border-transparent bg-[#159A9C] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#117C7E] focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400 sm:ml-3 sm:w-auto';
const secondaryButtonClass =
  'mt-3 inline-flex w-full justify-center rounded-lg border border-[#D4E2E7] bg-white px-4 py-2 text-sm font-medium text-[#244455] shadow-sm transition hover:bg-[#F6FAFB] focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:ring-offset-2 disabled:bg-gray-100 sm:ml-3 sm:mt-0 sm:w-auto';

const ModalConfiguracao: React.FC<ModalConfiguracaoProps> = ({
  isOpen,
  onClose,
  onSave,
  configuracao,
  subcategoriaAtual,
  subcategorias,
  isLoading = false,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<Configuracao>({
    resolver: yupResolver(configuracaoSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      subcategoriaId: subcategoriaAtual?.id || '',
      multiplicador: 1,
      ativa: true,
    },
  });

  const watchedMultiplicador = watch('multiplicador', 1);
  const watchedSubcategoriaId = watch('subcategoriaId', subcategoriaAtual?.id || '');

  const subcategoriaSelecionada = useMemo(
    () => subcategorias.find((subcategoria) => subcategoria.id === watchedSubcategoriaId) || null,
    [subcategorias, watchedSubcategoriaId],
  );

  const precoBaseAtual = Number(
    subcategoriaSelecionada?.precoBase ?? subcategoriaAtual?.precoBase ?? 0,
  );
  const precoFinal = precoBaseAtual * Number(watchedMultiplicador || 1);

  useEffect(() => {
    if (configuracao) {
      reset({
        nome: configuracao.nome,
        descricao: configuracao.descricao,
        subcategoriaId: configuracao.subcategoriaId,
        multiplicador: Number(configuracao.multiplicador || 1),
        ativa: configuracao.ativa,
      });
    } else {
      reset({
        nome: '',
        descricao: '',
        subcategoriaId: subcategoriaAtual?.id || '',
        multiplicador: 1,
        ativa: true,
      });
    }
  }, [configuracao, subcategoriaAtual, reset, isOpen]);

  const onSubmit = async (data: Configuracao) => {
    try {
      setIsSaving(true);
      await onSave({
        ...data,
        id: configuracao?.id,
        multiplicador: Number(data.multiplicador || 1),
      });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar configuracao:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    reset();
    onClose();
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

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
                  <Settings className="h-6 w-6 text-[#159A9C]" />
                </div>
                <div className="ml-4">
                  <h3 id={titleId} className="text-lg font-semibold leading-6 text-[#19384C]">
                    {configuracao ? 'Editar Configuracao' : 'Nova Configuracao'}
                  </h3>
                  <p id={descriptionId} className="text-sm text-[#5F7380]">
                    {configuracao
                      ? 'Atualize a composicao comercial da configuracao'
                      : 'Defina multiplicador e descricao da configuracao'}
                  </p>
                  {subcategoriaAtual && (
                    <div className="mt-2 flex items-center">
                      {subcategoriaAtual.categoria && (
                        <div
                          className={`mr-2 h-3 w-3 rounded-full ${
                            categoriaColorDotClassMap[subcategoriaAtual.categoria.cor] ||
                            categoriaColorDotClassMap.blue
                          }`}
                        />
                      )}
                      <span className="text-xs text-[#5F7380]">
                        {subcategoriaAtual.categoria?.nome}
                        {' -> '}
                        {subcategoriaAtual.nome}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="rounded-lg p-2 text-[#7A8D99] transition-colors hover:bg-[#F6FAFB] hover:text-[#244455] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                aria-label="Fechar modal de configuracao"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4 rounded-xl border border-[#DEE8EC] bg-[#F6FAFB] p-4"
            >
              <div>
                <label className={labelClass}>Subcategoria *</label>
                <Controller
                  name="subcategoriaId"
                  control={control}
                  render={({ field }) => (
                    <select {...field} className={errors.subcategoriaId ? inputErrorClass : inputClass}>
                      <option value="">Selecione uma subcategoria</option>
                      {subcategorias.map((subcategoria) => (
                        <option key={subcategoria.id} value={subcategoria.id}>
                          {subcategoria.categoria?.nome}
                          {' -> '}
                          {subcategoria.nome}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.subcategoriaId && (
                  <p className="mt-1 text-sm text-red-500">{errors.subcategoriaId.message}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Nome da Configuracao *</label>
                <Controller
                  name="nome"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Ex: Pacote Profissional"
                      className={errors.nome ? inputErrorClass : inputClass}
                    />
                  )}
                />
                {errors.nome && <p className="mt-1 text-sm text-red-500">{errors.nome.message}</p>}
              </div>

              <div>
                <label className={labelClass}>Descricao *</label>
                <Controller
                  name="descricao"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      placeholder="Descreva os diferenciais desta configuracao..."
                      className={errors.descricao ? inputErrorClass : inputClass}
                    />
                  )}
                />
                {errors.descricao && (
                  <p className="mt-1 text-sm text-red-500">{errors.descricao.message}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Multiplicador *</label>
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
                      className={errors.multiplicador ? inputErrorClass : inputClass}
                      onChange={(event) => field.onChange(parseFloat(event.target.value) || 1)}
                    />
                  )}
                />
                {errors.multiplicador && (
                  <p className="mt-1 text-sm text-red-500">{errors.multiplicador.message}</p>
                )}
              </div>

              <div className="rounded-lg border border-[#D8E8EF] bg-[#F3F9FC] p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#4F6470]">Preco base da subcategoria:</span>
                  <span className="font-medium text-[#19384C]">{formatCurrency(precoBaseAtual)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-[#4F6470]">Multiplicador:</span>
                  <span className="font-medium text-[#19384C]">{Number(watchedMultiplicador || 1)}x</span>
                </div>
                <hr className="my-2 border-[#C7DEE8]" />
                <div className="flex items-center justify-between text-base font-semibold">
                  <span className="text-[#19384C]">Preco final estimado:</span>
                  <span className="text-[#19384C]">{formatCurrency(precoFinal)}</span>
                </div>
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
                  <span className="ml-2 text-sm text-[#244455]">Configuracao ativa</span>
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
                      {configuracao ? 'Atualizar' : 'Criar'} Configuracao
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

export default ModalConfiguracao;
