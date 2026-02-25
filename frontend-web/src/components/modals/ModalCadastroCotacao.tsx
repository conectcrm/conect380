import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
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
  Loader2,
} from 'lucide-react';
import { cotacaoService } from '../../services/cotacaoService';
import { toastService } from '../../services/toastService';
import { useAuth } from '../../hooks/useAuth';
import MoneyInput from '../common/MoneyInput';
import {
  Cotacao,
  CriarCotacaoRequest,
  AtualizarCotacaoRequest,
  StatusCotacao,
  PrioridadeCotacao,
  OrigemCotacao,
  ItemCotacao,
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
  aprovadorId?: string;
  itens: Omit<ItemCotacao, 'id' | 'valorTotal'>[];
}

// Schema de validação para solicitação de cotação
const schemaValidacao = yup.object({
  fornecedorId: yup.string().required('Fornecedor é obrigatório'),
  titulo: yup
    .string()
    .required('Título é obrigatório')
    .min(3, 'Título deve ter pelo menos 3 caracteres'),
  descricao: yup.string(),
  prioridade: yup
    .string()
    .oneOf(['baixa', 'media', 'alta', 'urgente'])
    .required('Prioridade é obrigatória'),
  prazoResposta: yup.string().optional(),
  observacoes: yup.string(),
  condicoesPagamento: yup.string(),
  prazoEntrega: yup.string(),
  validadeOrcamento: yup.number().positive('Validade deve ser um número positivo'),
  origem: yup
    .string()
    .oneOf(['manual', 'website', 'email', 'telefone', 'whatsapp', 'indicacao'])
    .required('Origem é obrigatória'),
  tags: yup.array().of(yup.string()),
  aprovadorId: yup.string().optional(),
  itens: yup
    .array()
    .of(
      yup.object({
        descricao: yup.string().required('Descrição do item é obrigatória'),
        quantidade: yup
          .number()
          .positive('Quantidade deve ser positiva')
          .required('Quantidade é obrigatória'),
        unidade: yup.string().required('Unidade é obrigatória'),
        valorUnitario: yup
          .number()
          .positive('Valor deve ser positivo')
          .required('Valor unitário é obrigatório'),
        observacoes: yup.string(),
      }),
    )
    .min(1, 'Deve ter pelo menos 1 item'),
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
  onSave,
}) => {
  const { user: usuarioLogado } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loadingFornecedores, setLoadingFornecedores] = useState(false);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
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
    getValues,
    control,
  } = useForm<CotacaoFormData>({
    resolver: yupResolver(schemaValidacao),
    defaultValues: {
      prioridade: PrioridadeCotacao.MEDIA,
      origem: OrigemCotacao.MANUAL,
      tags: [],
      itens: [
        {
          descricao: '',
          quantidade: 1,
          unidade: 'un',
          valorUnitario: 0,
          observacoes: '',
          ordem: 1,
        },
      ],
      validadeOrcamento: 30,
    },
  });

  const watchedItens = watch('itens');
  const watchedTags = watch('tags');

  // Carregar metadata de criacao/edicao (fornecedores + aprovadores)
  useEffect(() => {
    carregarMetadataCriacao();
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
        aprovadorId: cotacao.aprovadorId || '',
        itens: cotacao.itens.map((item) => ({
          produtoId: item.produtoId,
          descricao: item.descricao,
          quantidade: item.quantidade,
          unidade: item.unidade,
          valorUnitario: item.valorUnitario,
          observacoes: item.observacoes,
          ordem: item.ordem,
        })),
      };

      reset(dadosFormulario);
    } else {
      reset({
        prioridade: PrioridadeCotacao.MEDIA,
        origem: OrigemCotacao.MANUAL,
        tags: [],
        itens: [
          {
            descricao: '',
            quantidade: 1,
            unidade: 'un',
            valorUnitario: 0,
            observacoes: '',
            ordem: 1,
          },
        ],
        validadeOrcamento: 30,
      });
    }
  }, [cotacao, isEditing, reset]);

  const carregarMetadataCriacao = async () => {
    setLoadingFornecedores(true);
    setLoadingUsuarios(true);
    try {
      const metadata = await cotacaoService.buscarMetadataCriacao();
      setFornecedores(metadata.fornecedores || []);
      setUsuarios(metadata.aprovadores || []);
    } catch (error) {
      console.error('Erro ao carregar metadata da cotação:', error);
      toastService.error('Erro ao carregar fornecedores e aprovadores');
    } finally {
      setLoadingFornecedores(false);
      setLoadingUsuarios(false);
    }
  };

  const calcularValorTotal = () => {
    return watchedItens.reduce((total, item) => {
      return total + item.quantidade * item.valorUnitario;
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
        ordem: itensAtuais.length + 1,
      },
    ]);
  };

  const removerItem = (index: number) => {
    const itensAtuais = getValues('itens');
    if (itensAtuais.length > 1) {
      setValue(
        'itens',
        itensAtuais.filter((_, i) => i !== index),
      );
    }
  };

  const adicionarTag = () => {
    if (novaTag.trim() && !watchedTags.includes(novaTag.trim())) {
      setValue('tags', [...watchedTags, novaTag.trim()]);
      setNovaTag('');
    }
  };

  const removerTag = (tag: string) => {
    setValue(
      'tags',
      watchedTags.filter((t) => t !== tag),
    );
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
          aprovadorId: data.aprovadorId || undefined, // Enviar apenas se selecionado
          tags: data.tags,
          itens: data.itens,
        };

        novaCotacao = await cotacaoService.atualizar(cotacao.id, dadosAtualizacao);
        toastService.success('Cotação atualizada com sucesso!');
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
          aprovadorId: data.aprovadorId || undefined, // Enviar apenas se selecionado
          itens: data.itens,
        };

        novaCotacao = await cotacaoService.criar(dadosCriacao);
        toastService.success('Cotação criada com sucesso!');
      }

      onSave(novaCotacao);
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar cotação:', error);
      toastService.apiError(error, 'Erro ao salvar cotação');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getPrioridadeColor = (prioridade: PrioridadeCotacao) => {
    const colors = {
      baixa: 'bg-gray-100 text-gray-800',
      media: 'bg-blue-100 text-blue-800',
      alta: 'bg-yellow-100 text-yellow-800',
      urgente: 'bg-red-100 text-red-800',
    };
    return colors[prioridade] || colors.media;
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-[#0F172A]/35 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-cadastro-cotacao-title"
    >
      <div
        className="flex max-h-[92vh] w-[calc(100%-2rem)] max-w-[1100px] flex-col overflow-hidden rounded-2xl border border-[#DCE8EC] bg-white shadow-[0_24px_70px_-28px_rgba(15,57,74,0.45)] sm:w-[600px] md:w-[700px] lg:w-[900px] xl:w-[1000px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E1EAEE] bg-white px-5 py-4 sm:px-6">
          <div className="flex items-center space-x-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ECF7F3] text-[#159A9C]">
              <FileText className="w-5 h-5" />
            </div>
            <h2 id="modal-cadastro-cotacao-title" className="text-lg font-semibold text-[#173A4D] sm:text-xl">
              {isEditing ? 'Editar Cotação' : 'Nova Cotação'}
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Fechar modal"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5E7A88] transition-colors hover:bg-[#F2F7F8] hover:text-[#173A4D]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="shrink-0 border-b border-[#E1EAEE]">
          <nav className="flex overflow-x-auto px-4 sm:px-6">
            {[
              { id: 'dados', label: 'Dados Básicos', icon: FileText },
              { id: 'itens', label: 'Itens', icon: Calculator },
              { id: 'configuracoes', label: 'Configurações', icon: Tag },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`shrink-0 whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
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
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                        errors.fornecedorId ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={loadingFornecedores}
                    >
                      <option value="">Selecione um fornecedor</option>
                      {fornecedores.map((fornecedor) => (
                        <option key={fornecedor.id} value={fornecedor.id}>
                          {fornecedor.nome}
                        </option>
                      ))}
                    </select>
                    {errors.fornecedorId && (
                      <p className="text-red-500 text-sm mt-1">{errors.fornecedorId.message}</p>
                    )}
                  </div>

                  {/* Aprovador (opcional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aprovador
                      <span className="text-gray-400 text-xs ml-2">(opcional)</span>
                    </label>
                    <select
                      {...register('aprovadorId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                      disabled={loadingUsuarios}
                    >
                      <option value="">Nenhum (sem aprovação)</option>
                      {usuarios.map((usuario) => (
                        <option key={usuario.id} value={usuario.id}>
                          {usuario.nome} ({usuario.email})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Se selecionado, esta cotação precisará ser aprovada antes de prosseguir.
                    </p>
                  </div>

                  {/* Prioridade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prioridade *
                    </label>
                    <select
                      {...register('prioridade')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                        errors.prioridade ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value={PrioridadeCotacao.BAIXA}>Baixa</option>
                      <option value={PrioridadeCotacao.MEDIA}>Média</option>
                      <option value={PrioridadeCotacao.ALTA}>Alta</option>
                      <option value={PrioridadeCotacao.URGENTE}>Urgente</option>
                    </select>
                    {errors.prioridade && (
                      <p className="text-red-500 text-sm mt-1">{errors.prioridade.message}</p>
                    )}
                  </div>

                  {/* Título */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
                    <input
                      type="text"
                      {...register('titulo')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                        errors.titulo ? 'border-red-300' : 'border-gray-300'
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
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                        errors.prazoResposta ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.prazoResposta && (
                      <p className="text-red-500 text-sm mt-1">{errors.prazoResposta.message}</p>
                    )}
                  </div>

                  {/* Origem */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Origem *</label>
                    <select
                      {...register('origem')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                        errors.origem ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isEditing}
                    >
                      <option value={OrigemCotacao.MANUAL}>Manual</option>
                      <option value={OrigemCotacao.WEBSITE}>Website</option>
                      <option value={OrigemCotacao.EMAIL}>Email</option>
                      <option value={OrigemCotacao.TELEFONE}>Telefone</option>
                      <option value={OrigemCotacao.WHATSAPP}>WhatsApp</option>
                      <option value={OrigemCotacao.INDICACAO}>Indicação</option>
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
                    className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0F7B7D]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Item</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {watchedItens.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-[#DCE8EC] bg-[#F8FBFC] p-4 shadow-[0_8px_20px_-22px_rgba(15,57,74,0.45)]"
                    >
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

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Descrição */}
                        <div className="lg:col-span-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descrição *
                          </label>
                          <input
                            type="text"
                            {...register(`itens.${index}.descricao`)}
                            className="w-full rounded-xl border border-[#D4E2E7] bg-white px-3 py-2 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
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
                            className="w-full rounded-xl border border-[#D4E2E7] bg-white px-3 py-2 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
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
                            className="w-full rounded-xl border border-[#D4E2E7] bg-white px-3 py-2 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
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
                        <div className="lg:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Valor Unitário *
                          </label>
                          <Controller
                            name={`itens.${index}.valorUnitario`}
                            control={control}
                            render={({ field }) => (
                              <MoneyInput
                                value={field.value || 0}
                                onChange={(value) => field.onChange(value)}
                                placeholder="R$ 0,00"
                                className="w-full rounded-xl border border-[#D4E2E7] bg-white px-3 py-2 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                              />
                            )}
                          />
                        </div>

                        {/* Observações */}
                        <div className="lg:col-span-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Observações
                          </label>
                          <input
                            type="text"
                            {...register(`itens.${index}.observacoes`)}
                            className="w-full rounded-xl border border-[#D4E2E7] bg-white px-3 py-2 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                            placeholder="Observações sobre o item"
                          />
                        </div>

                        {/* Valor Total do Item */}
                        <div className="lg:col-span-4 flex justify-end">
                          <div className="rounded-xl border border-[#DCE8EC] bg-white px-4 py-2 text-right">
                            <span className="text-sm text-[#6E8997]">Valor Total: </span>
                            <span className="font-semibold text-lg text-[#159A9C]">
                              R${' '}
                              {(item.quantidade * item.valorUnitario).toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Valor Total Geral */}
                <div className="border-t border-[#E1EAEE] pt-4">
                  <div className="flex justify-end">
                    <div className="rounded-2xl border border-[#CFE0E6] bg-[#F7FBFC] px-5 py-4 text-right shadow-[0_8px_20px_-22px_rgba(15,57,74,0.35)]">
                      <span className="text-lg text-[#4C6A78]">Valor Total da Cotação: </span>
                      <span className="font-bold text-2xl text-[#159A9C]">
                        R${' '}
                        {calcularValorTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                      placeholder="Ex: 15 dias uteis apos confirmacao"
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
                      placeholder="Ex: a vista com 5% de desconto, ou 3x sem juros"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
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
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarTag())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                      placeholder="Digite uma tag e pressione Enter"
                    />
                    <button
                      type="button"
                      onClick={adicionarTag}
                      className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm font-medium"
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
          <div className="sticky bottom-0 z-10 flex shrink-0 items-center justify-between border-t border-[#E1EAEE] bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
            <div className="text-sm text-gray-500">
              {activeTab === 'itens' && (
                <span>
                  Total: R${' '}
                  {calcularValorTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-lg border border-[#B4BEC9] bg-white px-4 py-2 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9]"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0F7B7D] disabled:opacity-50 disabled:cursor-not-allowed"
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


