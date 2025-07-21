/**
 * Modal de Cadastro de Produto - Layout Paisagem
 * Otimizado para caber todos os campos na mesma tela
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, Tag, Package, DollarSign } from 'lucide-react';
import { MoneyInput } from '../common/MoneyInput';
import { useProdutosParaPropostas } from '../../shared/produtosAdapter';

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

// Schema de validação
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
    .min(0, 'Preço deve ser maior que zero'),
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
  descricao: yup
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  tags: yup
    .array()
    .of(yup.string())
    .default([]),
  variacoes: yup
    .array()
    .of(yup.string())
    .default([])
});

// Opções
const tiposItem = [
  { value: 'produto', label: 'Produto' },
  { value: 'servico', label: 'Serviço' },
  { value: 'licenca', label: 'Licença' },
  { value: 'modulo', label: 'Módulo' },
  { value: 'plano', label: 'Plano' }
];

const frequencias = [
  { value: 'unico', label: 'Único' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'anual', label: 'Anual' }
];

const unidadesMedida = [
  { value: 'unidade', label: 'Unidade' },
  { value: 'saca', label: 'Saca' },
  { value: 'hectare', label: 'Hectare' },
  { value: 'pacote', label: 'Pacote' },
  { value: 'licenca', label: 'Licença' }
];

export const ModalCadastroProduto: React.FC<ModalCadastroProdutoProps> = ({
  isOpen,
  onClose,
  onSubmit,
  produtoEditando,
  loading = false
}) => {
  const [tagInput, setTagInput] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Integração com adapter para categorias dinâmicas
  const { categorias: categoriasDisponiveis } = useProdutosParaPropostas();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isValid }
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
      variacoes: []
    }
  });

  const watchedFields = watch();

  // Efeito para detectar mudanças
  useEffect(() => {
    const subscription = watch(() => {
      setHasUnsavedChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Efeito para preencher dados na edição
  useEffect(() => {
    if (produtoEditando && isOpen) {
      reset({
        nome: produtoEditando.nome || '',
        tipoItem: produtoEditando.tipoItem || 'produto',
        categoria: produtoEditando.categoria || '',
        precoUnitario: produtoEditando.precoUnitario || 0,
        frequencia: produtoEditando.frequencia || 'unico',
        unidadeMedida: produtoEditando.unidadeMedida || 'unidade',
        status: produtoEditando.status ?? true,
        descricao: produtoEditando.descricao || '',
        tags: produtoEditando.tags || [],
        variacoes: produtoEditando.variacoes || []
      });
      setHasUnsavedChanges(false);
    } else if (!produtoEditando && isOpen) {
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
        variacoes: []
      });
      setHasUnsavedChanges(false);
    }
  }, [produtoEditando, isOpen, reset]);

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
      
      {/* Modal - Layout Paisagem */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="relative w-full max-w-6xl bg-white rounded-xl shadow-2xl transform transition-all">
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

          {/* Body */}
          <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
              {/* Grid Principal - 3 Colunas */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COLUNA 1 - Informações Básicas */}
                <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-2">
                    <h3 className="text-base font-medium text-gray-900">
                      Informações Básicas
                    </h3>
                  </div>

                  {/* Nome do Produto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Produto *
                    </label>
                    <input
                      {...register('nome')}
                      type="text"
                      placeholder="Digite o nome do produto"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.nome ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.nome && (
                      <p className="mt-1 text-xs text-red-600">{errors.nome.message}</p>
                    )}
                  </div>

                  {/* Tipo do Item */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo do Item *
                    </label>
                    <select
                      {...register('tipoItem')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.tipoItem ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      {tiposItem.map(tipo => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                    {errors.tipoItem && (
                      <p className="mt-1 text-xs text-red-600">{errors.tipoItem.message}</p>
                    )}
                  </div>

                  {/* Categoria */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria *
                    </label>
                    <input
                      {...register('categoria')}
                      type="text"
                      list="categorias"
                      placeholder="Digite ou selecione uma categoria"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.categoria ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <datalist id="categorias">
                      {categoriasDisponiveis.map(categoria => (
                        <option key={categoria} value={categoria} />
                      ))}
                    </datalist>
                    {errors.categoria && (
                      <p className="mt-1 text-xs text-red-600">{errors.categoria.message}</p>
                    )}
                  </div>
                </div>

                {/* COLUNA 2 - Preço e Configurações */}
                <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-2">
                    <h3 className="text-base font-medium text-gray-900">
                      Preço e Configurações
                    </h3>
                  </div>

                  {/* Preço Unitário */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                            errors.precoUnitario ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      )}
                    />
                    {errors.precoUnitario && (
                      <p className="mt-1 text-xs text-red-600">{errors.precoUnitario.message}</p>
                    )}
                  </div>

                  {/* Frequência */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequência *
                    </label>
                    <select
                      {...register('frequencia')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.frequencia ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      {frequencias.map(freq => (
                        <option key={freq.value} value={freq.value}>
                          {freq.label}
                        </option>
                      ))}
                    </select>
                    {errors.frequencia && (
                      <p className="mt-1 text-xs text-red-600">{errors.frequencia.message}</p>
                    )}
                  </div>

                  {/* Unidade de Medida */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidade de Medida *
                    </label>
                    <select
                      {...register('unidadeMedida')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.unidadeMedida ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      {unidadesMedida.map(unidade => (
                        <option key={unidade.value} value={unidade.value}>
                          {unidade.label}
                        </option>
                      ))}
                    </select>
                    {errors.unidadeMedida && (
                      <p className="mt-1 text-xs text-red-600">{errors.unidadeMedida.message}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      <p className="mt-1 text-xs text-red-600">{errors.status.message}</p>
                    )}
                  </div>
                </div>

                {/* COLUNA 3 - Descrição e Tags */}
                <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-2">
                    <h3 className="text-base font-medium text-gray-900">
                      Detalhes Adicionais
                    </h3>
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      {...register('descricao')}
                      rows={4}
                      placeholder="Descreva as características do produto..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      <div className="mt-2 flex flex-wrap gap-1">
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

              {/* Footer com botões */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      {produtoEditando ? 'Atualizar' : 'Salvar'} Produto
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
