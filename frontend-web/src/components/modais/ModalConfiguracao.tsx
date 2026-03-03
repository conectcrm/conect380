import React, { useState, useEffect, useMemo } from 'react';
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
  nome: yup.string().required('Nome é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: yup
    .string()
    .required('Descrição é obrigatória')
    .min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  subcategoriaId: yup.string().required('Subcategoria é obrigatória'),
  multiplicador: yup
    .number()
    .required('Multiplicador é obrigatório')
    .min(0.1, 'Multiplicador deve ser maior que 0')
    .max(10, 'Multiplicador deve ser menor ou igual a 10')
    .typeError('Multiplicador deve ser um número válido'),
  ativa: yup.boolean(),
});

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
      console.error('Erro ao salvar configuração:', error);
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
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        <div className="inline-block w-full max-w-2xl transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {configuracao ? 'Editar Configuração' : 'Nova Configuração'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {configuracao
                      ? 'Atualize a composição comercial da configuração'
                      : 'Defina multiplicador e descrição da configuração'}
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Subcategoria *</label>
                <Controller
                  name="subcategoriaId"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <p className="mt-1 text-sm text-red-500">{errors.subcategoriaId.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nome da Configuração *
                </label>
                <Controller
                  name="nome"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Ex: Pacote Profissional"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                />
                {errors.nome && <p className="mt-1 text-sm text-red-500">{errors.nome.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Descrição *</label>
                <Controller
                  name="descricao"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      placeholder="Descreva os diferenciais desta configuração..."
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                />
                {errors.descricao && (
                  <p className="mt-1 text-sm text-red-500">{errors.descricao.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(event) => field.onChange(parseFloat(event.target.value) || 1)}
                    />
                  )}
                />
                {errors.multiplicador && (
                  <p className="mt-1 text-sm text-red-500">{errors.multiplicador.message}</p>
                )}
              </div>

              <div className="rounded-md bg-blue-50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Preço Base da Subcategoria:</span>
                  <span className="font-medium">{formatCurrency(precoBaseAtual)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-gray-600">Multiplicador:</span>
                  <span className="font-medium">{Number(watchedMultiplicador || 1)}x</span>
                </div>
                <hr className="my-2 border-blue-200" />
                <div className="flex items-center justify-between text-base font-semibold">
                  <span className="text-blue-900">Preço Final Estimado:</span>
                  <span className="text-blue-900">{formatCurrency(precoFinal)}</span>
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
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    )}
                  />
                  <span className="ml-2 text-sm text-gray-700">Configuração ativa</span>
                </label>
              </div>

              <div className="-mx-4 -mb-4 mt-6 bg-gray-50 px-4 py-3 sm:-mx-6 sm:-mb-6 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="submit"
                  disabled={isSaving || isLoading}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-[#159A9C] px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-[#0F7B7D] focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {isSaving ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {configuracao ? 'Atualizar' : 'Criar'} Configuração
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSaving}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-100 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
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
