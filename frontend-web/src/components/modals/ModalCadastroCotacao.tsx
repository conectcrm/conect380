import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import {
  X,
  FileText,
  User,
  Calendar,
  DollarSign,
  Clock,
  Tag,
  Plus,
  Trash2,
  Calculator,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cotacaoService } from '../../services/cotacaoService';
import { fornecedorService } from '../../services/fornecedorService';
import {
  Cotacao,
  CriarCotacaoRequest,
  AtualizarCotacaoRequest,
  StatusCotacao,
  PrioridadeCotacao,
  OrigemCotacao,
  ItemCotacao
} from '../../types/cotacaoTypes';

// Interface para os dados do formulário de solicitação de cotação
interface CotacaoFormData {
  fornecedorId: string;
  titulo: string;
  descricao?: string;
  prioridade: PrioridadeCotacao;
  prazoResposta?: string;
  observacoes?: string;
  condicoesPagamento?: string;
  prazoEntrega?: string;
  localEntrega?: string;
  validadeOrcamento?: number;
  origem: OrigemCotacao;
  tags: string[];
  itens: Omit<ItemCotacao, 'id' | 'valorTotal'>[];
}

// Schema de validação para solicitação de cotação
const schemaValidacao = yup.object({
  fornecedorId: yup.string().required('Fornecedor é obrigatório'),
  titulo: yup.string().required('Título é obrigatório').min(3, 'Título deve ter pelo menos 3 caracteres'),
  descricao: yup.string(),
  prioridade: yup.string().oneOf(['baixa', 'media', 'alta', 'urgente']).required('Prioridade é obrigatória'),
  prazoResposta: yup.string().optional(),
  observacoes: yup.string(),
  condicoesPagamento: yup.string(),
  prazoEntrega: yup.string(),
  validadeOrcamento: yup.number().positive('Validade deve ser um número positivo'),
  origem: yup.string().oneOf(['manual', 'website', 'email', 'telefone', 'whatsapp', 'indicacao']).required('Origem é obrigatória'),
  tags: yup.array().of(yup.string()),
  itens: yup.array().of(
    yup.object({
      descricao: yup.string().required('Descrição do item é obrigatória'),
      quantidade: yup.number().positive('Quantidade deve ser positiva').required('Quantidade é obrigatória'),
      unidade: yup.string().required('Unidade é obrigatória'),
      valorUnitario: yup.number().positive('Valor deve ser positivo').required('Valor unitário é obrigatório'),
      observacoes: yup.string()
    })
  ).min(1, 'Deve ter pelo menos 1 item')
});

interface ModalCadastroCotacaoProps {
  isOpen: boolean;
  onClose: () => void;
  cotacao?: Cotacao | null;
  onSave: (cotacao: Cotacao) => void;
}

export const ModalCadastroCotacao: React.FC<ModalCadastroCotacaoProps> = ({
  isOpen,
  onClose,
  cotacao,
  onSave
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loadingFornecedores, setLoadingFornecedores] = useState(false);
  const [novaTag, setNovaTag] = useState('');
  const [activeTab, setActiveTab] = useState<'dados' | 'itens' | 'configuracoes'>('dados');

  const isEditing = !!cotacao;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    getValues
  } = useForm<CotacaoFormData>({
    resolver: yupResolver(schemaValidacao),
    defaultValues: {
      prioridade: 'media',
      origem: 'manual',
      tags: [],
      itens: [{ descricao: '', quantidade: 1, unidade: 'un', valorUnitario: 0, observacoes: '', ordem: 1 }],
      validadeOrcamento: 30
    }
  });

  const watchedItens = watch('itens');
  const watchedTags = watch('tags');

  // Carregar fornecedores
  useEffect(() => {
    carregarFornecedores();
  }, []);

  // Preencher dados para edição
  useEffect(() => {
    if (isEditing && cotacao) {
      const dadosFormulario: CotacaoFormData = {
        fornecedorId: cotacao.fornecedorId,
        titulo: cotacao.titulo,
        descricao: cotacao.descricao || '',
        prioridade: cotacao.prioridade,
        prazoResposta: cotacao.prazoResposta ? cotacao.prazoResposta.split('T')[0] : '', // Converter para formato de input date
        observacoes: cotacao.observacoes || '',
        condicoesPagamento: cotacao.condicoesPagamento || '',
        prazoEntrega: cotacao.prazoEntrega || '',
        validadeOrcamento: cotacao.validadeOrcamento || 30,
        origem: cotacao.origem,
        tags: cotacao.tags || [],
        itens: cotacao.itens.map(item => ({
          produtoId: item.produtoId,
          descricao: item.descricao,
          quantidade: item.quantidade,
          unidade: item.unidade,
          valorUnitario: item.valorUnitario,
          observacoes: item.observacoes,
          ordem: item.ordem
        }))
      };

      reset(dadosFormulario);
    } else {
      reset({
        prioridade: 'media',
        origem: 'manual',
        tags: [],
        itens: [{ descricao: '', quantidade: 1, unidade: 'un', valorUnitario: 0, observacoes: '', ordem: 1 }],
        validadeOrcamento: 30
      });
    }
  }, [cotacao, isEditing, reset]);

  const carregarFornecedores = async () => {
    setLoadingFornecedores(true);
    try {
      const fornecedoresData = await fornecedorService.buscarFornecedores({ ativo: true });
      setFornecedores(fornecedoresData);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      toast.error('Erro ao carregar fornecedores');
    } finally {
      setLoadingFornecedores(false);
    }
  };

  const calcularValorTotal = () => {
    return watchedItens.reduce((total, item) => {
      return total + (item.quantidade * item.valorUnitario);
    }, 0);
  };

  const adicionarItem = () => {
    const itensAtuais = getValues('itens');
    setValue('itens', [
      ...itensAtuais,
      {
        descricao: '',
        quantidade: 1,
        unidade: 'un',
        valorUnitario: 0,
        observacoes: '',
        ordem: itensAtuais.length + 1
      }
    ]);
  };

  const removerItem = (index: number) => {
    const itensAtuais = getValues('itens');
    if (itensAtuais.length > 1) {
      setValue('itens', itensAtuais.filter((_, i) => i !== index));
    }
  };

  const adicionarTag = () => {
    if (novaTag.trim() && !watchedTags.includes(novaTag.trim())) {
      setValue('tags', [...watchedTags, novaTag.trim()]);
      setNovaTag('');
    }
  };

  const removerTag = (tag: string) => {
    setValue('tags', watchedTags.filter(t => t !== tag));
  };

  const onSubmit = async (data: CotacaoFormData) => {
    setIsSubmitting(true);
    try {
      let novaCotacao: Cotacao;

      if (isEditing && cotacao) {
        const dadosAtualizacao: AtualizarCotacaoRequest = {
          titulo: data.titulo,
          descricao: data.descricao,
          prioridade: data.prioridade,
          prazoResposta: data.prazoResposta,
          observacoes: data.observacoes,
          condicoesPagamento: data.condicoesPagamento,
          prazoEntrega: data.prazoEntrega,
          localEntrega: data.localEntrega,
          validadeOrcamento: data.validadeOrcamento,
          tags: data.tags,
          itens: data.itens
        };

        novaCotacao = await cotacaoService.atualizar(cotacao.id, dadosAtualizacao);
        toast.success('Cotação atualizada com sucesso!');
      } else {
        const dadosCriacao: CriarCotacaoRequest = {
          fornecedorId: data.fornecedorId,
          titulo: data.titulo,
          descricao: data.descricao,
          prioridade: data.prioridade,
          prazoResposta: data.prazoResposta,
          observacoes: data.observacoes,
          condicoesPagamento: data.condicoesPagamento,
          prazoEntrega: data.prazoEntrega,
          localEntrega: data.localEntrega,
          validadeOrcamento: data.validadeOrcamento,
          origem: data.origem,
          tags: data.tags,
          itens: data.itens
        };

        novaCotacao = await cotacaoService.criar(dadosCriacao);
        toast.success('Cotação criada com sucesso!');
      }

      onSave(novaCotacao);
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar cotação:', error);
      toast.error(error.message || 'Erro ao salvar cotação');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getPrioridadeColor = (prioridade: PrioridadeCotacao) => {
    const colors = {
      baixa: 'bg-green-100 text-green-800',
      media: 'bg-yellow-100 text-yellow-800',
      alta: 'bg-orange-100 text-orange-800',
      urgente: 'bg-red-100 text-red-800'
    };
    return colors[prioridade] || colors.media;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-[#159A9C]">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-white" />
            <h2 className="text-xl font-semibold text-white">
              {isEditing ? 'Editar Cotação' : 'Nova Cotação'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'dados', label: 'Dados Básicos', icon: FileText },
              { id: 'itens', label: 'Itens', icon: Calculator },
              { id: 'configuracoes', label: 'Configurações', icon: Tag }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === id
                  ? 'border-[#159A9C] text-[#159A9C]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Tab: Dados Básicos */}
            {activeTab === 'dados' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fornecedor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fornecedor *
                    </label>
                    <select
                      {...register('fornecedorId')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${errors.fornecedorId ? 'border-red-300' : 'border-gray-300'
                        }`}
                      disabled={loadingFornecedores}
                    >
                      <option value="">Selecione um fornecedor</option>
                      {fornecedores.map(fornecedor => (
                        <option key={fornecedor.id} value={fornecedor.id}>
                          {fornecedor.nome}
                        </option>
                      ))}
                    </select>
                    {errors.fornecedorId && (
                      <p className="text-red-500 text-sm mt-1">{errors.clienteId.message}</p>
                    )}
                  </div>

                  {/* Prioridade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prioridade *
                    </label>
                    <select
                      {...register('prioridade')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${errors.prioridade ? 'border-red-300' : 'border-gray-300'
                        }`}
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                    {errors.prioridade && (
                      <p className="text-red-500 text-sm mt-1">{errors.prioridade.message}</p>
                    )}
                  </div>

                  {/* Título */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título *
                    </label>
                    <input
                      type="text"
                      {...register('titulo')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${errors.titulo ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Ex: Sistema ERP para Empresa ABC"
                    />
                    {errors.titulo && (
                      <p className="text-red-500 text-sm mt-1">{errors.titulo.message}</p>
                    )}
                  </div>

                  {/* Descrição */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <textarea
                      {...register('descricao')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                      placeholder="Descreva os detalhes da cotação..."
                    />
                  </div>

                  {/* Prazo de Resposta */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prazo de Resposta
                    </label>
                    <input
                      type="date"
                      {...register('prazoResposta')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${errors.prazoResposta ? 'border-red-300' : 'border-gray-300'
                        }`}
                    />
                    {errors.prazoResposta && (
                      <p className="text-red-500 text-sm mt-1">{errors.prazoResposta.message}</p>
                    )}
                  </div>

                  {/* Origem */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Origem *
                    </label>
                    <select
                      {...register('origem')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${errors.origem ? 'border-red-300' : 'border-gray-300'
                        }`}
                      disabled={isEditing}
                    >
                      <option value="manual">Manual</option>
                      <option value="website">Website</option>
                      <option value="email">Email</option>
                      <option value="telefone">Telefone</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="indicacao">Indicação</option>
                    </select>
                    {errors.origem && (
                      <p className="text-red-500 text-sm mt-1">{errors.origem.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Itens */}
            {activeTab === 'itens' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Itens da Cotação</h3>
                  <button
                    type="button"
                    onClick={adicionarItem}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0d7a7c] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Item</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {watchedItens.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-700">Item {index + 1}</h4>
                        {watchedItens.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removerItem(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Descrição */}
                        <div className="lg:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descrição *
                          </label>
                          <input
                            type="text"
                            {...register(`itens.${index}.descricao`)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                            placeholder="Descrição do item"
                          />
                        </div>

                        {/* Quantidade */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Qtd *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            {...register(`itens.${index}.quantidade`)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                            min="0"
                          />
                        </div>

                        {/* Unidade */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Unidade *
                          </label>
                          <select
                            {...register(`itens.${index}.unidade`)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                          >
                            <option value="un">Unidade</option>
                            <option value="kg">Quilograma</option>
                            <option value="m">Metro</option>
                            <option value="m²">Metro²</option>
                            <option value="l">Litro</option>
                            <option value="h">Hora</option>
                            <option value="pç">Peça</option>
                          </select>
                        </div>

                        {/* Valor Unitário */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Valor Unit. *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            {...register(`itens.${index}.valorUnitario`)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                            min="0"
                          />
                        </div>

                        {/* Observações */}
                        <div className="lg:col-span-5">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Observações
                          </label>
                          <input
                            type="text"
                            {...register(`itens.${index}.observacoes`)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                            placeholder="Observações sobre o item"
                          />
                        </div>

                        {/* Valor Total do Item */}
                        <div className="lg:col-span-5 flex justify-end">
                          <div className="text-right">
                            <span className="text-sm text-gray-500">Valor Total: </span>
                            <span className="font-medium text-lg text-[#159A9C]">
                              R$ {(item.quantidade * item.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Valor Total Geral */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-end">
                    <div className="text-right">
                      <span className="text-lg text-gray-700">Valor Total da Cotação: </span>
                      <span className="font-bold text-2xl text-[#159A9C]">
                        R$ {calcularValorTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Configurações */}
            {activeTab === 'configuracoes' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Condições de Pagamento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Condições de Pagamento
                    </label>
                    <textarea
                      {...register('condicoesPagamento')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                      placeholder="Ex: À vista com 5% de desconto, ou 3x sem juros"
                    />
                  </div>

                  {/* Prazo de Entrega */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prazo de Entrega
                    </label>
                    <input
                      type="text"
                      {...register('prazoEntrega')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                      placeholder="Ex: 15 dias úteis após confirmação"
                    />
                  </div>

                  {/* Validade do Orçamento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Validade do Orçamento (dias)
                    </label>
                    <input
                      type="number"
                      {...register('validadeOrcamento')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                      min="1"
                      max="365"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {watchedTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#159A9C] text-white"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removerTag(tag)}
                          className="ml-2 text-white hover:text-gray-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={novaTag}
                      onChange={(e) => setNovaTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarTag())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                      placeholder="Digite uma tag e pressione Enter"
                    />
                    <button
                      type="button"
                      onClick={adicionarTag}
                      className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0d7a7c] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    {...register('observacoes')}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                    placeholder="Observações gerais sobre a cotação..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
              {activeTab === 'itens' && (
                <span>
                  Total: R$ {calcularValorTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0d7a7c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isEditing ? 'Atualizar' : 'Criar'} Cotação</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalCadastroCotacao;
