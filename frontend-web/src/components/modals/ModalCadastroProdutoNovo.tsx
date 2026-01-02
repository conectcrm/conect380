/**
 * Modal de Cadastro de Produto - Fênix CRM
 * Seguindo padrões de usabilidade dos CRMs mais conceituados
 * (HubSpot, Pipedrive, Salesforce, RD Station)
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, Tag, Package, DollarSign } from 'lucide-react';
import { MoneyInput } from '../common/MoneyInput';

// Tipos de dados
interface ProdutoFormData {
  nome: string;
  tipoItem: 'produto' | 'servico' | 'licenca' | 'modulo' | 'plano';
  categoria: string;
  precoUnitario: number;
  frequencia: 'unico' | 'mensal' | 'anual';
  unidadeMedida: 'unidade' | 'saca' | 'hectare' | 'pacote' | 'licenca';
  status: boolean;
  descricao?: string;
  tags?: string[];
  variacoes?: string[];
}

interface ModalCadastroProdutoProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProdutoFormData) => void;
  produtoEditando?: ProdutoFormData | null;
  loading?: boolean;
}

// Schema de validação Yup
const schema = yup.object({
  nome: yup
    .string()
    .required('Nome do produto é obrigatório')
    .min(3, 'Nome deve ter pelo menos 3 caracteres'),
  tipoItem: yup
    .string()
    .required('Tipo do item é obrigatório')
    .oneOf(['produto', 'servico', 'licenca', 'modulo', 'plano'], 'Tipo inválido'),
  categoria: yup
    .string()
    .required('Categoria é obrigatória'),
  precoUnitario: yup
    .number()
    .required('Preço unitário é obrigatório')
    .min(0.01, 'Preço deve ser maior que zero'),
  frequencia: yup
    .string()
    .required('Frequência é obrigatória')
    .oneOf(['unico', 'mensal', 'anual'], 'Frequência inválida'),
  unidadeMedida: yup
    .string()
    .required('Unidade de medida é obrigatória')
    .oneOf(['unidade', 'saca', 'hectare', 'pacote', 'licenca'], 'Unidade inválida'),
  status: yup
    .boolean()
    .required('Status é obrigatório'),
  descricao: yup.string(),
  tags: yup.array().of(yup.string()),
  variacoes: yup.array().of(yup.string()),
});

// Opções para os selects
const tiposItem = [
  { value: 'produto', label: 'Produto' },
  { value: 'servico', label: 'Serviço' },
  { value: 'licenca', label: 'Licença' },
  { value: 'modulo', label: 'Módulo' },
  { value: 'plano', label: 'Plano' },
];

const frequencias = [
  { value: 'unico', label: 'Único' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'anual', label: 'Anual' },
];

const unidadesMedida = [
  { value: 'unidade', label: 'Unidade' },
  { value: 'saca', label: 'Saca' },
  { value: 'hectare', label: 'Hectare' },
  { value: 'pacote', label: 'Pacote' },
  { value: 'licenca', label: 'Licença' },
];

const categoriasSugeridas = [
  'Software',
  'Hardware',
  'Consultoria',
  'Marketing',
  'Vendas',
  'Suporte',
  'Treinamento',
  'Licenciamento',
];

export const ModalCadastroProduto: React.FC<ModalCadastroProdutoProps> = ({
  isOpen,
  onClose,
  onSubmit,
  produtoEditando,
  loading = false,
}) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showVariacoes, setShowVariacoes] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    watch,
    setValue,
  } = useForm<ProdutoFormData>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      nome: '',
      tipoItem: 'produto',
      categoria: '',
      precoUnitario: 0,
      frequencia: 'unico',
      unidadeMedida: 'unidade',
      status: true,
      descricao: '',
      tags: [],
      variacoes: [],
    },
  });

  const watchedFields = watch();

  // Monitora mudanças para detectar dados não salvos
  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty]);

  // Preenche formulário quando está editando
  useEffect(() => {
    if (produtoEditando) {
      reset(produtoEditando);
    } else {
      reset({
        nome: '',
        tipoItem: 'produto',
        categoria: '',
        precoUnitario: 0,
        frequencia: 'unico',
        unidadeMedida: 'unidade',
        status: true,
        descricao: '',
        tags: [],
        variacoes: [],
      });
    }
  }, [produtoEditando, reset]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm(
        'Você tem alterações não salvas. Deseja realmente fechar?'
      );
      if (!confirmClose) return;
    }
    onClose();
    setHasUnsavedChanges(false);
  };

  const onFormSubmit = (data: ProdutoFormData) => {
    onSubmit(data);
    setHasUnsavedChanges(false);
  };

  const adicionarTag = () => {
    if (tagInput.trim() && !watchedFields.tags?.includes(tagInput.trim())) {
      const novasTags = [...(watchedFields.tags || []), tagInput.trim()];
      setValue('tags', novasTags, { shouldValidate: true });
      setTagInput('');
    }
  };

  const removerTag = (tagParaRemover: string) => {
    const tagsFiltradas = watchedFields.tags?.filter(tag => tag !== tagParaRemover) || [];
    setValue('tags', tagsFiltradas, { shouldValidate: true });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal - Formato Paisagem */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="relative w-[calc(100%-2rem)] sm:w-[700px] md:w-[900px] lg:w-[1100px] xl:w-[1300px] max-w-[1600px] bg-white rounded-xl shadow-2xl transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {produtoEditando ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <p className="text-sm text-gray-500">
                  Preencha as informações do produto
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body - Layout Paisagem Otimizado */}
          <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
              {/* Grid Principal - 3 Colunas para maximizar uso do espaço */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* COLUNA 1 - Informações Básicas */}
                <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      Informações Básicas
                    </h3>
                  </div>

                  {/* Nome do Produto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Produto *
                    </label>
                    <input
                      {...register('nome')}
                      type="text"
                      placeholder="Digite o nome do produto"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.nome ? 'border-red-300' : 'border-gray-300'
                        }`}
                    />
                    {errors.nome && (
                      <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
                    )}
                  </div>

                  {/* Tipo do Item */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo do Item *
                    </label>
                    <select
                      {...register('tipoItem')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.tipoItem ? 'border-red-300' : 'border-gray-300'
                        }`}
                    >
                      {tiposItem.map(tipo => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                    {errors.tipoItem && (
                      <p className="mt-1 text-sm text-red-600">{errors.tipoItem.message}</p>
                    )}
                  </div>

                  {/* Categoria */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria *
                    </label>
                    <input
                      {...register('categoria')}
                      type="text"
                      list="categorias"
                      placeholder="Digite ou selecione uma categoria"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.categoria ? 'border-red-300' : 'border-gray-300'
                        }`}
                    />
                    <datalist id="categorias">
                      {categoriasSugeridas.map(categoria => (
                        <option key={categoria} value={categoria} />
                      ))}
                    </datalist>
                    {errors.categoria && (
                      <p className="mt-1 text-sm text-red-600">{errors.categoria.message}</p>
                    )}
                  </div>
                </div>

                {/* COLUNA 2 - Preço e Configurações */}
                <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      Preço e Configurações
                    </h3>
                  </div>

                  {/* Preço Unitário */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Preço Unitário *
                    </label>
                    <Controller
                      name="precoUnitario"
                      control={control}
                      render={({ field }) => (
                        <MoneyInput
                          value={field.value}
                          onChange={(value) => field.onChange(value)}
                          placeholder="R$ 0,00"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.precoUnitario ? 'border-red-300' : 'border-gray-300'
                            }`}
                        />
                      )}
                    />
                    {errors.precoUnitario && (
                      <p className="mt-1 text-sm text-red-600">{errors.precoUnitario.message}</p>
                    )}
                  </div>

                  {/* Frequência */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequência *
                    </label>
                    <select
                      {...register('frequencia')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.frequencia ? 'border-red-300' : 'border-gray-300'
                        }`}
                    >
                      {frequencias.map(freq => (
                        <option key={freq.value} value={freq.value}>
                          {freq.label}
                        </option>
                      ))}
                    </select>
                    {errors.frequencia && (
                      <p className="mt-1 text-sm text-red-600">{errors.frequencia.message}</p>
                    )}
                  </div>

                  {/* Unidade de Medida */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidade de Medida *
                    </label>
                    <select
                      {...register('unidadeMedida')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.unidadeMedida ? 'border-red-300' : 'border-gray-300'
                        }`}
                    >
                      {unidadesMedida.map(unidade => (
                        <option key={unidade.value} value={unidade.value}>
                          {unidade.label}
                        </option>
                      ))}
                    </select>
                    {errors.unidadeMedida && (
                      <p className="mt-1 text-sm text-red-600">{errors.unidadeMedida.message}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          {...register('status')}
                          type="radio"
                          value="true"
                          className="mr-2 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Ativo</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          {...register('status')}
                          type="radio"
                          value="false"
                          className="mr-2 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Inativo</span>
                      </label>
                    </div>
                    {errors.status && (
                      <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                    )}
                  </div>
                </div>

                {/* COLUNA 3 - Descrição e Tags */}
                <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      Detalhes Adicionais
                    </h3>
                  </div>
                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <textarea
                      {...register('descricao')}
                      rows={3}
                      placeholder="Descreva as características do produto..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Tag className="w-4 h-4 inline mr-1" />
                      Tags
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarTag())}
                        placeholder="Digite uma tag e pressione Enter"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={adicionarTag}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    {watchedFields.tags && watchedFields.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {watchedFields.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removerTag(tag)}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* COLUNA 2 - Configurações */}
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Configurações
                  </h3>
                </div>

                {/* Frequência */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequência *
                  </label>
                  <select
                    {...register('frequencia')}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.frequencia ? 'border-red-300' : 'border-gray-300'
                      }`}
                  >
                    {frequencias.map(freq => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                  {errors.frequencia && (
                    <p className="mt-1 text-sm text-red-600">{errors.frequencia.message}</p>
                  )}
                </div>

                {/* Unidade de Medida */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidade de Medida *
                  </label>
                  <select
                    {...register('unidadeMedida')}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.unidadeMedida ? 'border-red-300' : 'border-gray-300'
                      }`}
                  >
                    {unidadesMedida.map(unidade => (
                      <option key={unidade.value} value={unidade.value}>
                        {unidade.label}
                      </option>
                    ))}
                  </select>
                  {errors.unidadeMedida && (
                    <p className="mt-1 text-sm text-red-600">{errors.unidadeMedida.message}</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        {...register('status')}
                        type="radio"
                        value="true"
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Ativo</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        {...register('status')}
                        type="radio"
                        value="false"
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Inativo</span>
                    </label>
                  </div>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Tags
                  </label>
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarTag())}
                        placeholder="Digite uma tag e pressione Enter"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={adicionarTag}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Adicionar
                      </button>
                    </div>

                    {watchedFields.tags && watchedFields.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {watchedFields.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removerTag(tag)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Variações (Oculto inicialmente) */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowVariacoes(!showVariacoes)}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {showVariacoes ? '− Ocultar' : '+ Adicionar'} Variações do Produto
                  </button>

                  {showVariacoes && (
                    <div className="mt-3">
                      <textarea
                        {...register('variacoes')}
                        rows={3}
                        placeholder="Digite as variações do produto (uma por linha)..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      />
                    </div>
                  )}
                </div>
              </div>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-500">
          {hasUnsavedChanges && '• Alterações não salvas'}
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="submit"
            onClick={handleSubmit(onFormSubmit)}
            disabled={!isValid || loading}
            className={`px-6 py-2 rounded-lg transition-colors ${isValid && !loading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            {loading ? 'Salvando...' : 'Salvar Produto'}
          </button>
        </div>
      </div>
    </div>
      </div >
    </div >
  );
};


