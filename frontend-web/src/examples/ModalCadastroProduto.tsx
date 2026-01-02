import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { SelectField } from '../components/common/SelectField';
import { X, Save, Package, Tag, Plus, Trash2 } from 'lucide-react';
import { useSimpleCurrency } from '../hooks/useSimpleCurrency';

// Tipos
interface ProdutoFormData {
  nome: string;
  tipo: string;
  categoria: string;
  precoUnitario: number;
  frequencia: string;
  unidadeMedida: string;
  status: string;
  descricao?: string;
  tags: string[];
}

interface ModalCadastroProdutoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProdutoFormData) => Promise<void>;
  produto?: ProdutoFormData | null;
  isLoading?: boolean;
}

// Schema de validação
const schema = yup.object({
  nome: yup.string().required('Nome é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres'),

  tipo: yup.string().required('Tipo do item é obrigatório'),

  categoria: yup.string().required('Categoria é obrigatória'),

  precoUnitario: yup
    .number()
    .transform((value, originalValue) => {
      // Se for string vazia ou só espaços, retorna undefined para que o required funcione
      if (originalValue === '' || originalValue === null || originalValue === undefined) {
        return undefined;
      }
      // Se for NaN, retorna undefined
      if (isNaN(value)) {
        return undefined;
      }
      return value;
    })
    .required('Preço unitário é obrigatório')
    .min(0.01, 'Preço deve ser maior que zero'),

  frequencia: yup.string().required('Frequência é obrigatória'),

  unidadeMedida: yup.string().required('Unidade de medida é obrigatória'),

  status: yup.string().required('Status é obrigatório'),

  descricao: yup.string().max(500, 'Descrição deve ter no máximo 500 caracteres'),

  tags: yup.array().of(yup.string()).default([]),
});

/**
 * ModalCadastroProduto - Modal horizontal para cadastro de produtos
 *
 * Modal paisagem (horizontal) com layout em 2 colunas, limpo e responsivo.
 * Serve para todos os segmentos de negócio.
 */
export const ModalCadastroProduto: React.FC<ModalCadastroProdutoProps> = ({
  isOpen,
  onClose,
  onSave,
  produto,
  isLoading = false,
}) => {
  const [tagInput, setTagInput] = useState('');

  // Hook para formatação de moeda (versão simplificada)
  const preco = useSimpleCurrency(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
    watch,
  } = useForm<ProdutoFormData>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      nome: '',
      tipo: '',
      categoria: '',
      precoUnitario: 0,
      frequencia: '',
      unidadeMedida: '',
      status: 'ativo',
      descricao: '',
      tags: [],
    },
  });

  const watchedTags = watch('tags') || [];

  // Opções para os selects
  const tiposItem = [
    { value: 'produto', label: 'Produto' },
    { value: 'servico', label: 'Serviço' },
    { value: 'licenca', label: 'Licença' },
    { value: 'modulo', label: 'Módulo' },
    { value: 'plano', label: 'Plano' },
  ];

  const categorias = [
    { value: 'tecnologia', label: 'Tecnologia' },
    { value: 'consultoria', label: 'Consultoria' },
    { value: 'software', label: 'Software' },
    { value: 'hardware', label: 'Hardware' },
    { value: 'servicos-gerais', label: 'Serviços Gerais' },
    { value: 'educacao', label: 'Educação' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'vendas', label: 'Vendas' },
    { value: 'operacional', label: 'Operacional' },
    { value: 'outros', label: 'Outros' },
  ];

  const frequencias = [
    { value: 'unico', label: 'Único' },
    { value: 'mensal', label: 'Mensal' },
    { value: 'anual', label: 'Anual' },
  ];

  const unidadesMedida = [
    { value: 'unidade', label: 'Unidade' },
    { value: 'pacote', label: 'Pacote' },
    { value: 'hectare', label: 'Hectare' },
    { value: 'saca', label: 'Saca' },
    { value: 'licenca', label: 'Licença' },
    { value: 'hora', label: 'Hora' },
    { value: 'dia', label: 'Dia' },
    { value: 'mes', label: 'Mês' },
    { value: 'projeto', label: 'Projeto' },
  ];

  const statusOptions = [
    { value: 'ativo', label: 'Ativo' },
    { value: 'inativo', label: 'Inativo' },
  ];

  // Reset form quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      if (produto) {
        reset(produto);
        preco.setValue(produto.precoUnitario || 0);
      } else {
        reset({
          nome: '',
          tipo: '',
          categoria: '',
          precoUnitario: 0,
          frequencia: '',
          unidadeMedida: '',
          status: 'ativo',
          descricao: '',
          tags: [],
        });
        preco.setValue(0);
      }
    }
  }, [produto, reset, isOpen, preco]);

  const onSubmit = async (data: ProdutoFormData) => {
    const toastId = toast.loading(produto ? 'Atualizando produto...' : 'Cadastrando produto...');

    try {
      // Garante que o preço formatado seja incluído nos dados
      const dadosComPreco = {
        ...data,
        precoUnitario: preco.value,
      };

      await onSave(dadosComPreco);

      toast.success(
        produto ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!',
        { id: toastId },
      );

      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);

      toast.error(
        produto
          ? 'Erro ao atualizar produto. Tente novamente.'
          : 'Erro ao cadastrar produto. Tente novamente.',
        { id: toastId },
      );
    }
  };

  const handleClose = () => {
    reset();
    setTagInput('');
    onClose();
  };

  // Funções para gerenciar tags
  const adicionarTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      const novasTags = [...watchedTags, tagInput.trim()];
      setValue('tags', novasTags);
      setTagInput('');
    }
  };

  const removerTag = (tagParaRemover: string) => {
    const novasTags = watchedTags.filter((tag) => tag !== tagParaRemover);
    setValue('tags', novasTags);
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      adicionarTag();
    }
  };

  // Formatação de moeda
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-[calc(100%-2rem)] sm:w-[700px] md:w-[800px] lg:w-[900px] xl:w-[1000px] max-w-[1100px]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {produto ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <p className="text-sm text-gray-500">
                  Preencha as informações do produto ou serviço
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-6">
              {/* Grid 2 colunas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* COLUNA 1 - Campos Principais */}
                <div className="space-y-4">
                  {/* Nome do Produto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Produto *
                    </label>
                    <input
                      {...register('nome')}
                      type="text"
                      placeholder="Digite o nome do produto ou serviço"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.nome ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.nome && (
                      <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
                    )}
                  </div>

                  {/* Tipo do Item */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo do Item *
                    </label>
                    <SelectField
                      {...register('tipo')}
                      options={tiposItem}
                      placeholder="Selecione o tipo..."
                      error={!!errors.tipo}
                    />
                    {errors.tipo && (
                      <p className="mt-1 text-sm text-red-600">{errors.tipo.message}</p>
                    )}
                  </div>

                  {/* Categoria */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria *
                    </label>
                    <SelectField
                      {...register('categoria')}
                      options={categorias}
                      placeholder="Selecione a categoria..."
                      error={!!errors.categoria}
                    />
                    {errors.categoria && (
                      <p className="mt-1 text-sm text-red-600">{errors.categoria.message}</p>
                    )}
                  </div>

                  {/* Preço Unitário */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço Unitário *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={preco.displayValue}
                        onChange={(e) => {
                          console.log('Input onChange:', e.target.value);
                          const novoValor = preco.handleChange(e);
                          console.log('Valor numérico (síncrono):', novoValor);
                        }}
                        onBlur={() => {
                          // Atualiza o valor no React Hook Form quando sai do campo
                          setValue('precoUnitario', preco.value, { shouldValidate: true });
                        }}
                        placeholder="R$ 0,00"
                        className={`w-full pr-3 pl-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-right ${
                          errors.precoUnitario ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.precoUnitario && (
                      <p className="mt-1 text-sm text-red-600">{errors.precoUnitario.message}</p>
                    )}
                  </div>
                </div>

                {/* COLUNA 2 - Configurações */}
                <div className="space-y-4">
                  {/* Frequência */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequência *
                    </label>
                    <SelectField
                      {...register('frequencia')}
                      options={frequencias}
                      placeholder="Selecione a frequência..."
                      error={!!errors.frequencia}
                    />
                    {errors.frequencia && (
                      <p className="mt-1 text-sm text-red-600">{errors.frequencia.message}</p>
                    )}
                  </div>

                  {/* Unidade de Medida */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidade de Medida *
                    </label>
                    <SelectField
                      {...register('unidadeMedida')}
                      options={unidadesMedida}
                      placeholder="Selecione a unidade..."
                      error={!!errors.unidadeMedida}
                    />
                    {errors.unidadeMedida && (
                      <p className="mt-1 text-sm text-red-600">{errors.unidadeMedida.message}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                    <SelectField
                      {...register('status')}
                      options={statusOptions}
                      error={!!errors.status}
                    />
                    {errors.status && (
                      <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                    )}
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={handleTagKeyPress}
                        placeholder="Digite uma tag e pressione Enter"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={adicionarTag}
                        disabled={!tagInput.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Lista de Tags */}
                    {watchedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {watchedTags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                            <button
                              type="button"
                              onClick={() => removerTag(tag)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Descrição - Span completo */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  {...register('descricao')}
                  rows={3}
                  placeholder="Descreva detalhes adicionais sobre o produto ou serviço..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors ${
                    errors.descricao ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.descricao && (
                  <p className="mt-1 text-sm text-red-600">{errors.descricao.message}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!isValid || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Produto
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/**
 * Exemplo de uso:
 *
 * ```tsx
 * const [showModal, setShowModal] = useState(false);
 * const [produtoSelecionado, setProdutoSelecionado] = useState(null);
 * const [isLoading, setIsLoading] = useState(false);
 *
 * const handleSaveProduto = async (data) => {
 *   setIsLoading(true);
 *   try {
 *     if (produtoSelecionado) {
 *       await produtoService.update(produtoSelecionado.id, data);
 *     } else {
 *       await produtoService.create(data);
 *     }
 *     // Recarregar lista após sucesso...
 *     await recarregarProdutos();
 *   } finally {
 *     setIsLoading(false);
 *   }
 * };
 *
 * return (
 *   <>
 *     <button
 *       onClick={() => setShowModal(true)}
 *       className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
 *     >
 *       Novo Produto
 *     </button>
 *
 *     <ModalCadastroProduto
 *       isOpen={showModal}
 *       onClose={() => {
 *         setShowModal(false);
 *         setProdutoSelecionado(null);
 *       }}
 *       onSave={handleSaveProduto}
 *       produto={produtoSelecionado}
 *       isLoading={isLoading}
 *     />
 *   </>
 * );
 * ```
 *
 * Estrutura dos dados:
 * ```tsx
 * const produtoExemplo = {
 *   nome: "Plano Premium",
 *   tipo: "plano",
 *   categoria: "software",
 *   precoUnitario: 299.90,
 *   frequencia: "mensal",
 *   unidadeMedida: "licenca",
 *   status: "ativo",
 *   descricao: "Plano completo com todos os recursos",
 *   tags: ["premium", "completo", "crm"]
 * };
 * ```
 */
