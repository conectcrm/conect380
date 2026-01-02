import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  DollarSign,
  Percent,
  Save,
  X,
  Search,
  Loader2,
  Tag,
  Calendar,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { combosService, ComboFormData, Combo } from '../../services/combosService';
import { useProdutosParaPropostas, ProdutoPropostaBase } from '../../shared/produtosAdapter';

// Schema de validação
const comboSchema = yup.object({
  nome: yup.string().required('Nome é obrigatório').min(3, 'Nome deve ter pelo menos 3 caracteres'),
  descricao: yup
    .string()
    .required('Descrição é obrigatória')
    .min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  categoria: yup.string().required('Categoria é obrigatória'),
  produtos: yup.array().min(2, 'Adicione pelo menos 2 produtos ao combo'),
  tipoDesconto: yup
    .string()
    .oneOf(['percentual', 'fixo'])
    .required('Tipo de desconto é obrigatório'),
  descontoPercentual: yup.number().when('tipoDesconto', {
    is: 'percentual',
    then: (schema) =>
      schema
        .required('Desconto percentual é obrigatório')
        .min(0.1, 'Desconto deve ser maior que 0')
        .max(90, 'Desconto não pode ser maior que 90%'),
    otherwise: (schema) => schema.optional(),
  }),
  precoFixo: yup.number().when('tipoDesconto', {
    is: 'fixo',
    then: (schema) =>
      schema.required('Preço fixo é obrigatório').min(0.01, 'Preço deve ser maior que 0'),
    otherwise: (schema) => schema.optional(),
  }),
  status: yup.string().oneOf(['ativo', 'inativo', 'rascunho']).required('Status é obrigatório'),
});

const NovoComboPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  // Estados
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showProdutoSearch, setShowProdutoSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [comboOriginal, setComboOriginal] = useState<Combo | null>(null);

  // Produtos
  const { produtos: produtosDisponiveis, buscarProdutos, categorias } = useProdutosParaPropostas();

  // Form
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<ComboFormData>({
    resolver: yupResolver(comboSchema),
    mode: 'onChange',
    defaultValues: {
      nome: '',
      descricao: '',
      categoria: '',
      produtos: [],
      tipoDesconto: 'percentual',
      descontoPercentual: 10,
      precoFixo: 0,
      status: 'rascunho',
      tags: [],
      condicoes: '',
    },
  });

  const {
    fields: produtos,
    append: adicionarProduto,
    remove: removerProduto,
    update: atualizarProduto,
  } = useFieldArray({
    control,
    name: 'produtos',
  });

  // Watch values
  const watchedProdutos = watch('produtos');
  const watchedTipoDesconto = watch('tipoDesconto');
  const watchedDescontoPercentual = watch('descontoPercentual');
  const watchedPrecoFixo = watch('precoFixo');

  // Carregar combo para edição
  useEffect(() => {
    if (isEditing && id) {
      carregarCombo();
    }
  }, [id, isEditing]);

  const carregarCombo = async () => {
    try {
      setIsLoading(true);
      const combo = await combosService.buscarComboPorId(id!);
      if (combo) {
        setComboOriginal(combo);
        reset({
          nome: combo.nome,
          descricao: combo.descricao,
          categoria: combo.categoria,
          produtos: combo.produtos,
          tipoDesconto: combo.desconto > 0 ? 'percentual' : 'fixo',
          descontoPercentual: combo.desconto,
          precoFixo: combo.precoCombo,
          status: combo.status,
          tags: combo.tags || [],
          validadeInicio: combo.validadeInicio,
          validadeFim: combo.validadeFim,
          condicoes: combo.condicoes || '',
        });
      } else {
        toast.error('Combo não encontrado');
        navigate('/combos');
      }
    } catch (error) {
      toast.error('Erro ao carregar combo');
      navigate('/combos');
    } finally {
      setIsLoading(false);
    }
  };

  // Cálculos
  const precoOriginal =
    watchedProdutos?.reduce((total, item) => total + item.produto.preco * item.quantidade, 0) || 0;

  const precoCombo =
    watchedTipoDesconto === 'percentual'
      ? precoOriginal * (1 - (watchedDescontoPercentual || 0) / 100)
      : watchedPrecoFixo || 0;

  const economia = precoOriginal - precoCombo;
  const percentualDesconto = precoOriginal > 0 ? (economia / precoOriginal) * 100 : 0;

  // Filtrar produtos
  const produtosFiltrados = buscarProdutos({
    termo: searchTerm,
  }).filter((produto) => !watchedProdutos?.some((item) => item.produto.id === produto.id));

  // Handlers
  const handleAdicionarProduto = (produto: ProdutoPropostaBase) => {
    adicionarProduto({
      produto,
      quantidade: 1,
    });
    setSearchTerm('');
    setShowProdutoSearch(false);
    toast.success(`${produto.nome} adicionado ao combo!`);
  };

  const handleQuantidadeChange = (index: number, quantidade: number) => {
    if (quantidade < 1) return;
    const produtoAtual = watchedProdutos[index];
    atualizarProduto(index, {
      ...produtoAtual,
      quantidade,
    });
  };

  const onSubmit = async (data: ComboFormData) => {
    try {
      setIsSaving(true);

      if (isEditing && id) {
        await combosService.atualizarCombo(id, data);
        toast.success('Combo atualizado com sucesso!');
      } else {
        await combosService.criarCombo(data);
        toast.success('Combo criado com sucesso!');
      }

      navigate('/combos');
    } catch (error) {
      toast.error('Erro ao salvar combo');
    } finally {
      setIsSaving(false);
    }
  };

  // Formatação
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#DEEFE7] flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#159A9C] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando combo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#DEEFE7]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-[#DEEFE7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/combos')}
                className="flex items-center text-[#159A9C] hover:text-[#0F7B7D] transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Voltar
              </button>
              <div>
                <h1 className="text-2xl font-bold text-[#002333]">
                  {isEditing ? 'Editar Combo' : 'Novo Combo'}
                </h1>
                <p className="text-[#B4BEC9]">
                  {isEditing
                    ? 'Atualize as informações do combo'
                    : 'Crie um novo pacote de produtos'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
      >
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Coluna 1: Informações Básicas */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Package className="h-5 w-5 mr-2 text-[#159A9C]" />
              Informações Básicas
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Combo *
                </label>
                <Controller
                  name="nome"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Ex: Pacote Startup Digital"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                        errors.nome ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  )}
                />
                {errors.nome && <p className="text-red-500 text-sm mt-1">{errors.nome.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                <Controller
                  name="descricao"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      placeholder="Descreva o que está incluído no combo..."
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                        errors.descricao ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  )}
                />
                {errors.descricao && (
                  <p className="text-red-500 text-sm mt-1">{errors.descricao.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                <Controller
                  name="categoria"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                        errors.categoria ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Selecione uma categoria</option>
                      <option value="Pacote Startup">Pacote Startup</option>
                      <option value="Pacote Enterprise">Pacote Enterprise</option>
                      <option value="Pacote E-commerce">Pacote E-commerce</option>
                      <option value="Pacote Consultoria">Pacote Consultoria</option>
                      <option value="Pacote Treinamento">Pacote Treinamento</option>
                    </select>
                  )}
                />
                {errors.categoria && (
                  <p className="text-red-500 text-sm mt-1">{errors.categoria.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                    >
                      <option value="rascunho">Rascunho</option>
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                    <input
                      value={field.value?.join(', ') || ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            .split(',')
                            .map((tag) => tag.trim())
                            .filter(Boolean),
                        )
                      }
                      type="text"
                      placeholder="startup, digital, básico"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                    />
                  )}
                />
                <p className="text-xs text-gray-500 mt-1">Separe as tags por vírgula</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condições de Venda
                </label>
                <Controller
                  name="condicoes"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={2}
                      placeholder="Ex: Válido até 31/12/2024, não cumulativo com outras promoções..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Coluna 2: Produtos */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Package className="h-5 w-5 mr-2 text-green-600" />
                Produtos do Combo
              </h2>
              <button
                type="button"
                onClick={() => setShowProdutoSearch(!showProdutoSearch)}
                className="flex items-center text-[#159A9C] hover:text-[#0F7B7D] text-sm font-medium"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Produto
              </button>
            </div>

            {/* Busca de Produtos */}
            {showProdutoSearch && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar produto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {produtosFiltrados.map((produto) => (
                    <div
                      key={produto.id}
                      onClick={() => handleAdicionarProduto(produto)}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-white cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{produto.nome}</div>
                          <div className="text-sm text-gray-600">{produto.descricao}</div>
                          <div className="flex gap-1 mt-1">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {produto.categoria}
                            </span>
                            {produto.tipo && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                {produto.tipo}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-medium text-green-600">
                            {formatCurrency(produto.preco)}
                          </div>
                          <div className="text-xs text-gray-500">por {produto.unidade}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {produtosFiltrados.length === 0 && (
                    <p className="text-gray-500 text-center py-4">Nenhum produto encontrado</p>
                  )}
                </div>
              </div>
            )}

            {/* Lista de Produtos Adicionados */}
            <div className="space-y-3">
              {produtos.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{field.produto.nome}</h4>
                      <p className="text-sm text-gray-600">{field.produto.descricao}</p>
                      <div className="flex gap-1 mt-1">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {field.produto.categoria}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removerProduto(index)}
                      className="text-red-500 hover:text-red-700 ml-4"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={field.quantidade}
                        onChange={(e) =>
                          handleQuantidadeChange(index, parseInt(e.target.value) || 1)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subtotal
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                        {formatCurrency(field.produto.preco * field.quantidade)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {produtos.length === 0 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Nenhum produto adicionado</p>
                  <p className="text-sm text-gray-400">
                    Clique em "Adicionar Produto" para começar
                  </p>
                </div>
              )}
            </div>

            {errors.produtos && (
              <p className="text-red-500 text-sm mt-2">{errors.produtos.message}</p>
            )}
          </div>

          {/* Coluna 3: Preços e Resumo */}
          <div className="space-y-6">
            {/* Card de Preços */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-purple-600" />
                Definição de Preços
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Desconto *
                  </label>
                  <Controller
                    name="tipoDesconto"
                    control={control}
                    render={({ field }) => (
                      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => field.onChange('percentual')}
                          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            field.value === 'percentual'
                              ? 'bg-white text-purple-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          <Percent className="h-4 w-4 mr-2" />
                          Percentual
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange('fixo')}
                          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            field.value === 'fixo'
                              ? 'bg-white text-purple-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Preço Fixo
                        </button>
                      </div>
                    )}
                  />
                </div>

                {watchedTipoDesconto === 'percentual' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Desconto (%)
                    </label>
                    <Controller
                      name="descontoPercentual"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min="0"
                          max="90"
                          step="0.1"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            errors.descontoPercentual ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      )}
                    />
                    {errors.descontoPercentual && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.descontoPercentual.message}
                      </p>
                    )}
                  </div>
                )}

                {watchedTipoDesconto === 'fixo' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço do Combo
                    </label>
                    <Controller
                      name="precoFixo"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min="0"
                          step="0.01"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            errors.precoFixo ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      )}
                    />
                    {errors.precoFixo && (
                      <p className="text-red-500 text-sm mt-1">{errors.precoFixo.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Card de Resumo */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Combo</h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Produtos:</span>
                  <span className="font-medium">{produtos.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Preço Original:</span>
                  <span className="font-medium">{formatCurrency(precoOriginal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Preço do Combo:</span>
                  <span className="font-medium text-green-600">{formatCurrency(precoCombo)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Economia:</span>
                  <span className="font-medium text-green-600">{formatCurrency(economia)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-3">
                  <span className="text-gray-600">Desconto:</span>
                  <span className="font-bold text-green-600">{percentualDesconto.toFixed(1)}%</span>
                </div>
              </div>

              {precoCombo >= precoOriginal && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ O preço do combo deve ser menor que o preço original
                  </p>
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={!isValid || isSaving || precoCombo >= precoOriginal}
                  className="w-full bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isEditing ? 'Atualizar Combo' : 'Criar Combo'}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/combos')}
                  disabled={isSaving}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NovoComboPage;
