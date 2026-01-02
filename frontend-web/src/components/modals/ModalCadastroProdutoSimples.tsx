import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { SelectField } from '../common/SelectField';
import { X, Package, Tag, FileText, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';

// Interface para os dados do formulário
interface ProdutoFormData {
  // Dados Básicos
  nome: string;
  codigo: string;
  categoria: string;
  preco: number;
  custoUnitario?: number;
  unidadeMedida: string;
  status: 'ativo' | 'inativo' | 'descontinuado';

  // Estoque
  controlarEstoque: boolean;
  estoqueMinimo?: number;
  estoqueAtual?: number;

  // Detalhes
  descricao?: string;
  observacoes?: string;
  tags: string[];

  // Configurações específicas
  tipoPlano?: 'basico' | 'premium' | 'enterprise';
  modulos?: string[];
  licencas?: string[];
}

// Schema de validação
const produtoSchema = yup.object({
  // Dados Básicos - Obrigatórios
  nome: yup
    .string()
    .required('Nome é obrigatório')
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),

  codigo: yup
    .string()
    .required('Código é obrigatório')
    .matches(
      /^[A-Z0-9-_]+$/,
      'Código deve conter apenas letras maiúsculas, números, hífen e underscore',
    )
    .max(20, 'Código deve ter no máximo 20 caracteres'),

  categoria: yup.string().required('Categoria é obrigatória'),

  preco: yup
    .number()
    .required('Preço é obrigatório')
    .min(0, 'Preço deve ser maior ou igual a zero'),

  custoUnitario: yup.number().min(0, 'Custo unitário deve ser maior ou igual a zero'),

  unidadeMedida: yup.string().required('Unidade de medida é obrigatória'),

  status: yup
    .string()
    .required('Status é obrigatório')
    .oneOf(['ativo', 'inativo', 'descontinuado'], 'Status inválido'),

  // Estoque - Opcionais
  controlarEstoque: yup.boolean(),

  estoqueMinimo: yup.number().when('controlarEstoque', {
    is: true,
    then: (schema) => schema.min(0, 'Estoque mínimo deve ser maior ou igual a zero'),
    otherwise: (schema) => schema.notRequired(),
  }),

  estoqueAtual: yup.number().when('controlarEstoque', {
    is: true,
    then: (schema) => schema.min(0, 'Estoque atual deve ser maior ou igual a zero'),
    otherwise: (schema) => schema.notRequired(),
  }),

  // Detalhes - Opcionais
  descricao: yup.string().max(500, 'Descrição deve ter no máximo 500 caracteres'),

  observacoes: yup.string().max(1000, 'Observações deve ter no máximo 1000 caracteres'),

  tags: yup.array().of(yup.string()).max(10, 'Máximo de 10 tags permitidas'),

  // Configurações específicas - Opcionais
  tipoPlano: yup.string().oneOf(['basico', 'premium', 'enterprise'], 'Tipo de plano inválido'),

  modulos: yup.array().of(yup.string()),

  licencas: yup.array().of(yup.string()),
});

interface ModalCadastroProdutoSimplesProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (produto: any) => Promise<void>;
  produto?: any;
  isLoading?: boolean;
}

const ModalCadastroProdutoSimples: React.FC<ModalCadastroProdutoSimplesProps> = ({
  isOpen,
  onClose,
  onSave,
  produto,
  isLoading = false,
}) => {
  // Estados locais
  const [currentTab, setCurrentTab] = useState<'dados' | 'estoque' | 'detalhes' | 'configuracoes'>(
    'dados',
  );
  const [tagInput, setTagInput] = useState('');
  const [moduloInput, setModuloInput] = useState('');
  const [licencaInput, setLicencaInput] = useState('');

  // Listas pré-definidas
  const categorias = [
    { value: 'software', label: 'Software/Sistema' },
    { value: 'licenca', label: 'Licenças' },
    { value: 'servico', label: 'Serviços' },
    { value: 'consultoria', label: 'Consultoria' },
    { value: 'hardware', label: 'Hardware' },
    { value: 'outro', label: 'Outro' },
  ];

  const unidadesMedida = [
    { value: 'unidade', label: 'Unidade' },
    { value: 'licenca', label: 'Licença' },
    { value: 'mes', label: 'Mês' },
    { value: 'ano', label: 'Ano' },
    { value: 'hora', label: 'Hora' },
    { value: 'dia', label: 'Dia' },
  ];

  const tiposPlano = [
    { value: 'basico', label: 'Básico' },
    { value: 'premium', label: 'Premium' },
    { value: 'enterprise', label: 'Enterprise' },
  ];

  const modulosDisponiveis = [
    'Confinamento',
    'Reprodutivo',
    'Agrícola',
    'Financeiro',
    'Contratos',
    'Relatórios',
    'Dashboard',
    'API',
  ];

  const licencasDisponiveis = [
    'MB Task',
    'MB Curral',
    'MB Web',
    'MB Mobile',
    'Licença Admin',
    'Licença Usuário',
    'Licença Viewer',
  ];

  // Configuração do React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
    trigger,
  } = useForm<ProdutoFormData>({
    resolver: yupResolver(produtoSchema),
    mode: 'onChange',
    defaultValues: {
      nome: '',
      codigo: '',
      categoria: '',
      preco: 0,
      custoUnitario: 0,
      unidadeMedida: 'unidade',
      status: 'ativo',
      controlarEstoque: false,
      estoqueMinimo: 0,
      estoqueAtual: 0,
      descricao: '',
      observacoes: '',
      tags: [],
      tipoPlano: 'basico',
      modulos: [],
      licencas: [],
    },
  });

  // Observar mudanças nos campos
  const watchedStatus = watch('status');
  const watchedControlarEstoque = watch('controlarEstoque');
  const watchedTags = watch('tags') || [];
  const watchedModulos = watch('modulos') || [];
  const watchedLicencas = watch('licencas') || [];
  const watchedCategoria = watch('categoria');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (produto) {
        // Modo edição
        reset({
          nome: produto.nome || '',
          codigo: produto.codigo || '',
          categoria: produto.categoria || '',
          preco: produto.preco || 0,
          custoUnitario: produto.custoUnitario || 0,
          unidadeMedida: produto.unidadeMedida || 'unidade',
          status: produto.status || 'ativo',
          controlarEstoque: produto.controlarEstoque || false,
          estoqueMinimo: produto.estoqueMinimo || 0,
          estoqueAtual: produto.estoqueAtual || 0,
          descricao: produto.descricao || '',
          observacoes: produto.observacoes || '',
          tags: produto.tags || [],
          tipoPlano: produto.tipoPlano || 'basico',
          modulos: produto.modulos || [],
          licencas: produto.licencas || [],
        });
      } else {
        // Modo criação
        reset({
          nome: '',
          codigo: '',
          categoria: '',
          preco: 0,
          custoUnitario: 0,
          unidadeMedida: 'unidade',
          status: 'ativo',
          controlarEstoque: false,
          estoqueMinimo: 0,
          estoqueAtual: 0,
          descricao: '',
          observacoes: '',
          tags: [],
          tipoPlano: 'basico',
          modulos: [],
          licencas: [],
        });
      }
      setCurrentTab('dados');
    }
  }, [isOpen, produto, reset]);

  // Submissão do formulário
  const onSubmit = async (data: ProdutoFormData) => {
    const loadingToastId = toast.loading(
      produto ? 'Atualizando produto...' : 'Cadastrando produto...',
    );

    try {
      await onSave(data);

      toast.success(
        produto ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!',
        { id: loadingToastId },
      );

      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error(produto ? 'Erro ao atualizar produto' : 'Erro ao cadastrar produto', {
        id: loadingToastId,
      });
    }
  };

  // Fechar modal
  const handleClose = () => {
    reset();
    setCurrentTab('dados');
    setTagInput('');
    setModuloInput('');
    setLicencaInput('');
    onClose();
  };

  // Adicionar tag
  const adicionarTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim()) && watchedTags.length < 10) {
      const novasTags = [...watchedTags, tagInput.trim()];
      setValue('tags', novasTags);
      setTagInput('');
      trigger('tags');
    }
  };

  // Remover tag
  const removerTag = (tag: string) => {
    const novasTags = watchedTags.filter((t) => t !== tag);
    setValue('tags', novasTags);
    trigger('tags');
  };

  // Adicionar módulo
  const adicionarModulo = () => {
    if (moduloInput && !watchedModulos.includes(moduloInput)) {
      const novosModulos = [...watchedModulos, moduloInput];
      setValue('modulos', novosModulos);
      setModuloInput('');
    }
  };

  // Remover módulo
  const removerModulo = (modulo: string) => {
    const novosModulos = watchedModulos.filter((m) => m !== modulo);
    setValue('modulos', novosModulos);
  };

  // Adicionar licença
  const adicionarLicenca = () => {
    if (licencaInput && !watchedLicencas.includes(licencaInput)) {
      const novasLicencas = [...watchedLicencas, licencaInput];
      setValue('licencas', novasLicencas);
      setLicencaInput('');
    }
  };

  // Remover licença
  const removerLicenca = (licenca: string) => {
    const novasLicencas = watchedLicencas.filter((l) => l !== licenca);
    setValue('licencas', novasLicencas);
  };

  // Gerar código automático baseado no nome
  const gerarCodigo = () => {
    const nome = watch('nome');
    if (nome) {
      const codigo = nome
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 15);
      setValue('codigo', codigo);
      trigger('codigo');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        ></div>

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl w-[calc(100%-2rem)] sm:w-[600px] md:w-[700px] lg:w-[900px] xl:w-[1000px] max-w-[1100px] max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {produto ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <p className="text-sm text-gray-500">
                  {produto
                    ? 'Atualize as informações do produto'
                    : 'Preencha os dados do novo produto'}
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

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'dados', label: 'Dados Básicos', icon: Package },
                { key: 'estoque', label: 'Estoque', icon: Tag },
                { key: 'detalhes', label: 'Detalhes', icon: FileText },
                { key: 'configuracoes', label: 'Configurações', icon: CheckCircle },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setCurrentTab(key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    currentTab === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
              {/* Tab: Dados Básicos */}
              {currentTab === 'dados' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nome */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Produto *
                      </label>
                      <input
                        {...register('nome')}
                        type="text"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.nome ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Ex: Sistema Completo Agronegócio"
                      />
                      {errors.nome && (
                        <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
                      )}
                    </div>

                    {/* Código */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código do Produto *
                      </label>
                      <div className="flex gap-2">
                        <input
                          {...register('codigo')}
                          type="text"
                          className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.codigo ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Ex: SCA_PREMIUM"
                          style={{ textTransform: 'uppercase' }}
                        />
                        <button
                          type="button"
                          onClick={gerarCodigo}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                          title="Gerar código automático"
                        >
                          Auto
                        </button>
                      </div>
                      {errors.codigo && (
                        <p className="mt-1 text-sm text-red-600">{errors.codigo.message}</p>
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
                        placeholder="Selecione..."
                        error={!!errors.categoria}
                      />
                      {errors.categoria && (
                        <p className="mt-1 text-sm text-red-600">{errors.categoria.message}</p>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status *
                      </label>
                      <SelectField
                        {...register('status')}
                        options={[
                          { value: 'ativo', label: 'Ativo' },
                          { value: 'inativo', label: 'Inativo' },
                          { value: 'descontinuado', label: 'Descontinuado' },
                        ]}
                        error={!!errors.status}
                      />
                      {errors.status && (
                        <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                      )}
                    </div>

                    {/* Preço */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preço de Venda *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">R$</span>
                        <input
                          {...register('preco', { valueAsNumber: true })}
                          type="number"
                          step="0.01"
                          min="0"
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.preco ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="0,00"
                        />
                      </div>
                      {errors.preco && (
                        <p className="mt-1 text-sm text-red-600">{errors.preco.message}</p>
                      )}
                    </div>

                    {/* Custo Unitário */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custo Unitário
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">R$</span>
                        <input
                          {...register('custoUnitario', { valueAsNumber: true })}
                          type="number"
                          step="0.01"
                          min="0"
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.custoUnitario ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="0,00"
                        />
                      </div>
                      {errors.custoUnitario && (
                        <p className="mt-1 text-sm text-red-600">{errors.custoUnitario.message}</p>
                      )}
                    </div>

                    {/* Unidade de Medida */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unidade de Medida *
                      </label>
                      <SelectField
                        {...register('unidadeMedida')}
                        options={unidadesMedida}
                        error={!!errors.unidadeMedida}
                      />
                      {errors.unidadeMedida && (
                        <p className="mt-1 text-sm text-red-600">{errors.unidadeMedida.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Status Alert */}
                  {watchedStatus === 'descontinuado' && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <p className="text-sm text-yellow-800">
                          Produtos descontinuados não aparecerão nas vendas e não poderão ser
                          comercializados.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Estoque */}
              {currentTab === 'estoque' && (
                <div className="space-y-6">
                  {/* Controlar Estoque */}
                  <div className="flex items-center gap-3">
                    <input
                      {...register('controlarEstoque')}
                      type="checkbox"
                      id="controlarEstoque"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="controlarEstoque" className="text-sm font-medium text-gray-700">
                      Controlar estoque deste produto
                    </label>
                  </div>

                  {watchedControlarEstoque && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Estoque Mínimo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estoque Mínimo
                        </label>
                        <input
                          {...register('estoqueMinimo', { valueAsNumber: true })}
                          type="number"
                          min="0"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.estoqueMinimo ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="0"
                        />
                        {errors.estoqueMinimo && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.estoqueMinimo.message}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          Quantidade mínima para alertas de reposição
                        </p>
                      </div>

                      {/* Estoque Atual */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estoque Atual
                        </label>
                        <input
                          {...register('estoqueAtual', { valueAsNumber: true })}
                          type="number"
                          min="0"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.estoqueAtual ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="0"
                        />
                        {errors.estoqueAtual && (
                          <p className="mt-1 text-sm text-red-600">{errors.estoqueAtual.message}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          Quantidade disponível em estoque
                        </p>
                      </div>
                    </div>
                  )}

                  {!watchedControlarEstoque && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        <p className="text-sm text-blue-800">
                          O estoque não será controlado para este produto. Ideal para serviços ou
                          produtos digitais.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Detalhes */}
              {currentTab === 'detalhes' && (
                <div className="space-y-6">
                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      {...register('descricao')}
                      rows={4}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                        errors.descricao ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Descreva as características e funcionalidades do produto..."
                    />
                    {errors.descricao && (
                      <p className="mt-1 text-sm text-red-600">{errors.descricao.message}</p>
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
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            adicionarTag();
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Digite uma tag e pressione Enter"
                        maxLength={20}
                      />
                      <button
                        type="button"
                        onClick={adicionarTag}
                        disabled={!tagInput.trim() || watchedTags.length >= 10}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removerTag(tag)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {errors.tags && (
                      <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Tags ajudam na organização e busca de produtos ({watchedTags.length}/10)
                    </p>
                  </div>

                  {/* Observações */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observações Internas
                    </label>
                    <textarea
                      {...register('observacoes')}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                        errors.observacoes ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Informações internas sobre o produto..."
                    />
                    {errors.observacoes && (
                      <p className="mt-1 text-sm text-red-600">{errors.observacoes.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Estas observações são apenas para uso interno
                    </p>
                  </div>
                </div>
              )}

              {/* Tab: Configurações */}
              {currentTab === 'configuracoes' && (
                <div className="space-y-6">
                  {/* Mostrar apenas se categoria for software */}
                  {watchedCategoria === 'software' && (
                    <>
                      {/* Tipo de Plano */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Plano
                        </label>
                        <SelectField {...register('tipoPlano')} options={tiposPlano} />
                      </div>

                      {/* Módulos */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Módulos Inclusos
                        </label>
                        <div className="flex gap-2 mb-2">
                          <SelectField
                            value={moduloInput}
                            onChange={(e) => setModuloInput(e.target.value)}
                            options={modulosDisponiveis
                              .filter((modulo) => !watchedModulos.includes(modulo))
                              .map((modulo) => ({ value: modulo, label: modulo }))}
                            placeholder="Selecione um módulo..."
                            className="flex-1"
                          />
                          <button
                            type="button"
                            onClick={adicionarModulo}
                            disabled={!moduloInput}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Lista de Módulos */}
                        {watchedModulos.length > 0 && (
                          <div className="space-y-2">
                            {watchedModulos.map((modulo, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg"
                              >
                                <span className="text-sm text-green-800">{modulo}</span>
                                <button
                                  type="button"
                                  onClick={() => removerModulo(modulo)}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Licenças */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Licenças Incluídas
                        </label>
                        <div className="flex gap-2 mb-2">
                          <SelectField
                            value={licencaInput}
                            onChange={(e) => setLicencaInput(e.target.value)}
                            options={licencasDisponiveis
                              .filter((licenca) => !watchedLicencas.includes(licenca))
                              .map((licenca) => ({ value: licenca, label: licenca }))}
                            placeholder="Selecione uma licença..."
                            className="flex-1"
                          />
                          <button
                            type="button"
                            onClick={adicionarLicenca}
                            disabled={!licencaInput}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Lista de Licenças */}
                        {watchedLicencas.length > 0 && (
                          <div className="space-y-2">
                            {watchedLicencas.map((licenca, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-purple-50 border border-purple-200 rounded-lg"
                              >
                                <span className="text-sm text-purple-800">{licenca}</span>
                                <button
                                  type="button"
                                  onClick={() => removerLicenca(licenca)}
                                  className="text-purple-600 hover:text-purple-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {watchedCategoria !== 'software' && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Configurações específicas estão disponíveis apenas para produtos da
                        categoria "Software/Sistema"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isValid || isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {produto ? 'Atualizar Produto' : 'Salvar Produto'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalCadastroProdutoSimples;
export { ModalCadastroProdutoSimples };
