/**
 * Modal de Cadastro de Produto - Layout Paisagem
 * Otimizado para caber todos os campos na mesma tela
 * Versão com modal customizado para alterações não salvas
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, Tag, Package, DollarSign, AlertTriangle } from 'lucide-react';
import { MoneyInput } from '../common/MoneyInput';
import { useProdutosParaPropostas } from '../../shared/produtosAdapter';

// Tipos de dados
interface ProdutoFormData {
  nome: string;
  tipoItem: 'produto' | 'servico' | 'licenca' | 'modulo' | 'aplicativo';
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
    .oneOf(['produto', 'servico', 'licenca', 'modulo', 'aplicativo'], 'Tipo inválido'),
  categoria: yup.string().required('Categoria é obrigatória'),
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
  status: yup.boolean().required('Status é obrigatório'),
  descricao: yup.string().optional(),
  tags: yup.array().of(yup.string()).default([]),
  variacoes: yup.array().of(yup.string()).default([]),
});

// Opções
const tiposItem = [
  { value: 'produto', label: 'Produto' },
  { value: 'servico', label: 'Serviço' },
  { value: 'licenca', label: 'Licença' },
  { value: 'modulo', label: 'Módulo' },
  { value: 'aplicativo', label: 'Aplicativo' },
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

export const ModalCadastroProduto: React.FC<ModalCadastroProdutoProps> = ({
  isOpen,
  onClose,
  onSubmit,
  produtoEditando,
  loading = false,
}) => {
  const [tagInput, setTagInput] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

  // Integração com adapter para categorias dinâmicas
  const { categorias: categoriasDisponiveis } = useProdutosParaPropostas();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isValid, isSubmitting },
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

  // Efeito para detectar mudanças - só após inicialização
  useEffect(() => {
    if (isFormInitialized && isOpen) {
      const subscription = watch((value, { name, type }) => {
        if (type === 'change') {
          setHasUnsavedChanges(true);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [watch, isFormInitialized, isOpen]);

  // Efeito para preencher dados na edição
  useEffect(() => {
    if (isOpen) {
      setHasUnsavedChanges(false);
      setIsFormInitialized(false);

      if (produtoEditando) {
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
          variacoes: produtoEditando.variacoes || [],
        });
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

      // Marca como inicializado após um pequeno delay para evitar detecção de mudança
      setTimeout(() => setIsFormInitialized(true), 100);
    }
  }, [produtoEditando, isOpen, reset]);

  const handleClose = () => {
    if (!isSubmitting) {
      if (hasUnsavedChanges) {
        setShowUnsavedChangesModal(true);
      } else {
        onClose();
        setHasUnsavedChanges(false);
        setIsFormInitialized(false);
      }
    }
  };

  const handleConfirmClose = () => {
    setHasUnsavedChanges(false);
    setIsFormInitialized(false);
    setShowUnsavedChangesModal(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowUnsavedChangesModal(false);
  };

  const onFormSubmit = (data: ProdutoFormData) => {
    onSubmit(data);
    setHasUnsavedChanges(false);
    setIsFormInitialized(false);
  };

  const adicionarTag = () => {
    if (tagInput.trim() && !watchedFields.tags?.includes(tagInput.trim())) {
      const novasTags = [...(watchedFields.tags || []), tagInput.trim()];
      setValue('tags', novasTags, { shouldValidate: true });
      setTagInput('');
    }
  };

  const removerTag = (tagParaRemover: string) => {
    const tagsFiltradas = watchedFields.tags?.filter((tag) => tag !== tagParaRemover) || [];
    setValue('tags', tagsFiltradas, { shouldValidate: true });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal de Confirmação de Alterações Não Salvas */}
      {showUnsavedChangesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-[calc(100%-2rem)] sm:w-[450px] max-w-[500px]">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-500 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">Alterações não salvas</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Você tem alterações não salvas no produto. Deseja realmente sair sem salvar?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Continuar editando
                </button>
                <button
                  onClick={handleConfirmClose}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sair sem salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Principal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal - Layout Paisagem */}
        <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
          <div className="relative w-[calc(100%-2rem)] sm:w-[700px] md:w-[900px] lg:w-[1100px] xl:w-[1200px] max-w-[1400px] bg-white rounded-xl shadow-2xl transform transition-all">
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
                  <p className="text-sm text-gray-500">Preencha as informações do produto</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário em Grid */}
            <form onSubmit={handleSubmit(onFormSubmit)} className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna 1: Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-blue-600" />
                    Informações Básicas
                  </h3>

                  {/* Nome */}
                  <div>
                    <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Produto *
                    </label>
                    <input
                      {...register('nome')}
                      type="text"
                      id="nome"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Digite o nome do produto"
                    />
                    {errors.nome && (
                      <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
                    )}
                  </div>

                  {/* Tipo */}
                  <div>
                    <label
                      htmlFor="tipoItem"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Tipo *
                    </label>
                    <select
                      {...register('tipoItem')}
                      id="tipoItem"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {tiposItem.map((tipo) => (
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
                    <label
                      htmlFor="categoria"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Categoria *
                    </label>
                    <input
                      {...register('categoria')}
                      type="text"
                      id="categoria"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Digite a categoria"
                    />
                    {errors.categoria && (
                      <p className="mt-1 text-sm text-red-600">{errors.categoria.message}</p>
                    )}
                  </div>

                  {/* Preço */}
                  <div>
                    <label
                      htmlFor="precoUnitario"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Preço Unitário *
                    </label>
                    <Controller
                      name="precoUnitario"
                      control={control}
                      render={({ field }) => (
                        <MoneyInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="R$ 0,00"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.precoUnitario ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      )}
                    />
                    {errors.precoUnitario && (
                      <p className="mt-1 text-sm text-red-600">{errors.precoUnitario.message}</p>
                    )}
                  </div>
                </div>

                {/* Coluna 2: Configurações */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                    Configurações
                  </h3>

                  {/* Frequência */}
                  <div>
                    <label
                      htmlFor="frequencia"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Frequência *
                    </label>
                    <select
                      {...register('frequencia')}
                      id="frequencia"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {frequencias.map((freq) => (
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
                    <label
                      htmlFor="unidadeMedida"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Unidade de Medida *
                    </label>
                    <select
                      {...register('unidadeMedida')}
                      id="unidadeMedida"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {unidadesMedida.map((unidade) => (
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={field.value === true}
                              onChange={() => field.onChange(true)}
                              className="mr-2 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-700">Ativo</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={field.value === false}
                              onChange={() => field.onChange(false)}
                              className="mr-2 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">Inativo</span>
                          </label>
                        </div>
                      )}
                    />
                    {errors.status && (
                      <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                    )}
                  </div>

                  {/* Descrição */}
                  <div>
                    <label
                      htmlFor="descricao"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Descrição
                    </label>
                    <textarea
                      {...register('descricao')}
                      id="descricao"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descrição detalhada do produto..."
                    />
                    {errors.descricao && (
                      <p className="mt-1 text-sm text-red-600">{errors.descricao.message}</p>
                    )}
                  </div>
                </div>

                {/* Coluna 3: Tags e Variações */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Tag className="w-5 h-5 mr-2 text-purple-600" />
                    Tags e Variações
                  </h3>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === 'Enter' && (e.preventDefault(), adicionarTag())
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Digite uma tag e pressione Enter"
                      />
                      <button
                        type="button"
                        onClick={adicionarTag}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Adicionar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {watchedFields.tags?.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removerTag(tag)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting || loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>{produtoEditando ? 'Atualizar' : 'Salvar'} Produto</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
