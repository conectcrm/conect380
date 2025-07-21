import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useResponsive, useBodyOverflow } from '../../hooks/useResponsive';
import {
  ResponsiveModal,
  AdaptiveColumns,
  ResponsiveCard
} from '../layout/ResponsiveLayout';
import {
  FormField,
  BaseInput,
  BaseSelect,
  BaseTextarea,
  BaseButton,
  StatusPanel,
  StatusBadge
} from '../base';
import { 
  Save, 
  X, 
  Package, 
  Plus, 
  Trash2, 
  Settings,
  Layers,
  Zap,
  Globe,
  Smartphone,
  Shield,
  Target,
  Briefcase
} from 'lucide-react';
import { useSegmentoConfig, type SegmentoConfig as SegmentoConfigType, SEGMENTOS_CONFIGURACAO } from '../../hooks/useSegmentoConfig';

// Tipos base (usando os tipos do hook)
import type { CampoPersonalizado, ConfiguracaoModulo, ConfiguracaoLicenca } from '../../hooks/useSegmentoConfig';

interface ProdutoAvancadoFormData {
  // Dados básicos
  nome: string;
  codigo: string;
  categoria: string;
  tipoProduto: 'produto_fisico' | 'servico' | 'plano' | 'licenca' | 'modulo' | 'combo';
  status: string;
  descricao?: string;
  
  // Precificação flexível
  tipoPreco: 'fixo' | 'variavel' | 'por_modulo' | 'por_licenca' | 'customizado';
  precoBase?: number;
  precoMinimo?: number;
  precoMaximo?: number;
  
  // Configurações de módulos (para planos)
  modulos: ConfiguracaoModulo[];
  
  // Configurações de licenças
  licencas: ConfiguracaoLicenca[];
  
  // Campos personalizados dinâmicos
  camposPersonalizados: CampoPersonalizado[];
  
  // Metadados para diferentes segmentos
  segmento: string;
  tags: string[];
  
  // Configurações específicas do negócio
  configuracoes: Record<string, any>;
}

interface ModalCadastroProdutoAvancadoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProdutoAvancadoFormData) => Promise<void>;
  produto?: ProdutoAvancadoFormData | null;
  isLoading?: boolean;
  segmentoConfig?: SegmentoConfigType;
}

// Schema dinâmico baseado no tipo de produto
const createDynamicSchema = (tipoProduto: string, segmento: string) => {
  const baseSchema: any = {
    nome: yup.string().required('Nome é obrigatório').min(3, 'Nome deve ter pelo menos 3 caracteres'),
    codigo: yup.string().required('Código é obrigatório'),
    categoria: yup.string().required('Categoria é obrigatória'),
    tipoProduto: yup.string().required('Tipo de produto é obrigatório'),
    status: yup.string().required('Status é obrigatório'),
    tipoPreco: yup.string().required('Tipo de preço é obrigatório')
  };

  // Adicionar validações específicas baseadas no tipo
  if (tipoProduto === 'plano_sistema') {
    baseSchema.precoBase = yup.number().required('Preço base é obrigatório').min(0, 'Preço deve ser positivo');
  }

  return yup.object(baseSchema);
};

/**
 * ModalCadastroProdutoAvancado - Modal flexível para diferentes tipos de produto
 * 
 * Características:
 * - Configuração dinâmica por segmento
 * - Campos personalizáveis por tipo de produto
 * - Suporte a módulos e licenças
 * - Precificação flexível
 * - Interface adaptativa
 */
export const ModalCadastroProdutoAvancado: React.FC<ModalCadastroProdutoAvancadoProps> = ({
  isOpen,
  onClose,
  onSave,
  produto,
  isLoading = false,
  segmentoConfig = SEGMENTOS_CONFIGURACAO.agropecuario // Padrão agropecuário
}) => {
  const { isMobile, isTablet } = useResponsive();
  const { lockScroll, unlockScroll } = useBodyOverflow();
  
  // Estado local
  const [segmentoAtivo, setSegmentoAtivo] = useState(segmentoConfig.id);
  const [tipoProdutoSelecionado, setTipoProdutoSelecionado] = useState<string>('');
  const [tabAtiva, setTabAtiva] = useState<'basico' | 'avancado' | 'modulos' | 'licencas' | 'personalizados'>('basico');

  const schema = createDynamicSchema(tipoProdutoSelecionado, segmentoAtivo);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    setValue,
    control
  } = useForm<ProdutoAvancadoFormData>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      nome: '',
      codigo: '',
      categoria: '',
      tipoProduto: 'produto_fisico',
      status: 'ativo',
      descricao: '',
      tipoPreco: 'fixo',
      modulos: [],
      licencas: [],
      camposPersonalizados: [],
      segmento: segmentoConfig.id,
      tags: [],
      configuracoes: {}
    }
  });

  // Field arrays para módulos e licenças
  const { fields: modulosFields, append: appendModulo, remove: removeModulo } = useFieldArray({
    control,
    name: 'modulos'
  });

  const { fields: licencasFields, append: appendLicenca, remove: removeLicenca } = useFieldArray({
    control,
    name: 'licencas'
  });

  // Watchers
  const tipoProduto = watch('tipoProduto');
  const tipoPreco = watch('tipoPreco');
  const statusAtual = watch('status');

  // Gerenciar scroll do body
  useEffect(() => {
    if (isOpen) {
      lockScroll();
    } else {
      unlockScroll();
    }
    return () => unlockScroll();
  }, [isOpen, lockScroll, unlockScroll]);

  // Reset form quando abrir/fechar
  useEffect(() => {
    if (isOpen) {
      if (produto) {
        reset(produto);
        setTipoProdutoSelecionado(produto.tipoProduto);
      } else {
        reset({
          nome: '',
          codigo: '',
          categoria: '',
          tipoProduto: 'produto_fisico',
          status: 'ativo',
          descricao: '',
          tipoPreco: 'fixo',
          modulos: [],
          licencas: [],
          camposPersonalizados: [],
          segmento: segmentoConfig.id,
          tags: [],
          configuracoes: {}
        });
      }
      setTabAtiva('basico');
    }
  }, [isOpen, produto, reset, segmentoConfig.id]);

  // Atualizar tipo de produto selecionado
  useEffect(() => {
    setTipoProdutoSelecionado(tipoProduto);
  }, [tipoProduto]);

  // Opções para selects
  const statusOptions = [
    { value: 'ativo', label: 'Ativo' },
    { value: 'inativo', label: 'Inativo' },
    { value: 'descontinuado', label: 'Descontinuado' },
    { value: 'desenvolvimento', label: 'Em Desenvolvimento' }
  ];

  const tiposPreco = [
    { value: 'fixo', label: 'Preço Fixo' },
    { value: 'variavel', label: 'Preço Variável' },
    { value: 'por_modulo', label: 'Por Módulo' },
    { value: 'por_licenca', label: 'Por Licença' },
    { value: 'customizado', label: 'Customizado' }
  ];

  // Funções para gerenciar módulos
  const adicionarModulo = () => {
    const config = segmentoConfig.tiposProduto.find(t => t.value === tipoProdutoSelecionado);
    if (config?.modulosDisponiveis && config.modulosDisponiveis.length > 0) {
      appendModulo({
        id: Date.now().toString(),
        nome: config.modulosDisponiveis[0],
        incluido: true,
        quantidade: 1
      });
    }
  };

  const adicionarLicenca = () => {
    const config = segmentoConfig.tiposProduto.find(t => t.value === tipoProdutoSelecionado);
    if (config?.licencasDisponiveis && config.licencasDisponiveis.length > 0) {
      appendLicenca({
        id: Date.now().toString(),
        nome: config.licencasDisponiveis[0],
        tipo: 'web',
        quantidade: 1
      });
    }
  };

  // Submissão do formulário
  const onSubmit = async (data: ProdutoAvancadoFormData) => {
    const toastId = toast.loading(
      produto ? 'Atualizando produto...' : 'Cadastrando produto...'
    );

    try {
      await onSave(data);
      
      toast.success(
        produto ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!',
        { id: toastId }
      );
      
      setTimeout(() => {
        handleClose();
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error(
        produto ? 'Erro ao atualizar produto' : 'Erro ao cadastrar produto',
        { id: toastId }
      );
    }
  };

  const handleClose = () => {
    reset();
    setTabAtiva('basico');
    onClose();
  };

  // Configuração atual do tipo de produto
  const configTipoProduto = segmentoConfig.tiposProduto.find(t => t.value === tipoProdutoSelecionado);

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      title={produto ? 'Editar Produto' : 'Novo Produto'}
      subtitle={`Segmento: ${segmentoConfig.nome}`}
      maxWidth="7xl"
      className="produto-avancado-modal"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col min-h-[90vh]">
        {/* Tabs de navegação */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'basico', label: 'Dados Básicos', icon: Package },
              { id: 'avancado', label: 'Configurações', icon: Settings },
              { id: 'modulos', label: 'Módulos', icon: Layers, show: ['plano', 'combo'].includes(tipoProdutoSelecionado) },
              { id: 'licencas', label: 'Licenças', icon: Shield, show: ['plano', 'licenca', 'combo'].includes(tipoProdutoSelecionado) },
              { id: 'personalizados', label: 'Campos Extras', icon: Target }
            ].filter(tab => tab.show !== false).map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTabAtiva(tab.id as any)}
                  className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors ${
                    tabAtiva === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Conteúdo das tabs */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {tabAtiva === 'basico' && (
            <AdaptiveColumns minWidth={isMobile ? 280 : isTablet ? 320 : 350}>
              {/* Informações Básicas */}
              <ResponsiveCard>
                <h3 className="font-semibold text-gray-900 mb-4 text-responsive border-b pb-2 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Informações Básicas
                </h3>
                <div className="space-y-4">
                  <FormField
                    label="Nome do Produto"
                    error={errors.nome?.message}
                    required
                  >
                    <BaseInput
                      {...register('nome')}
                      placeholder="Ex: Plano Professional Agro"
                      error={!!errors.nome}
                      className="w-full"
                    />
                  </FormField>

                  <FormField
                    label="Código/SKU"
                    error={errors.codigo?.message}
                    required
                  >
                    <BaseInput
                      {...register('codigo')}
                      placeholder="Ex: PROF-AGRO-001"
                      error={!!errors.codigo}
                      style={{ textTransform: 'uppercase' }}
                      className="w-full"
                    />
                  </FormField>

                  <FormField
                    label="Tipo de Produto"
                    error={errors.tipoProduto?.message}
                    required
                  >
                    <BaseSelect
                      {...register('tipoProduto')}
                      error={!!errors.tipoProduto}
                      options={segmentoConfig.tiposProduto.map(tipo => ({
                        value: tipo.value,
                        label: tipo.label
                      }))}
                      className="w-full"
                    />
                  </FormField>

                  <FormField
                    label="Categoria"
                    error={errors.categoria?.message}
                    required
                  >
                    <BaseSelect
                      {...register('categoria')}
                      error={!!errors.categoria}
                      options={segmentoConfig.categorias}
                      placeholder="Selecione a categoria..."
                      className="w-full"
                    />
                  </FormField>

                  <FormField
                    label="Status"
                    error={errors.status?.message}
                    required
                  >
                    <BaseSelect
                      {...register('status')}
                      error={!!errors.status}
                      options={statusOptions}
                      className="w-full"
                    />
                  </FormField>
                </div>
              </ResponsiveCard>

              {/* Precificação */}
              <ResponsiveCard>
                <h3 className="font-semibold text-gray-900 mb-4 text-responsive border-b pb-2 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-green-600" />
                  Precificação
                </h3>
                <div className="space-y-4">
                  <FormField
                    label="Tipo de Precificação"
                    error={errors.tipoPreco?.message}
                    required
                  >
                    <BaseSelect
                      {...register('tipoPreco')}
                      error={!!errors.tipoPreco}
                      options={tiposPreco}
                      className="w-full"
                    />
                  </FormField>

                  {(tipoPreco === 'fixo' || tipoPreco === 'variavel') && (
                    <FormField
                      label="Preço Base"
                      error={errors.precoBase?.message}
                      required={tipoPreco === 'fixo'}
                    >
                      <BaseInput
                        {...register('precoBase', { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        error={!!errors.precoBase}
                        className="w-full"
                      />
                    </FormField>
                  )}

                  {tipoPreco === 'variavel' && (
                    <>
                      <FormField
                        label="Preço Mínimo"
                        error={errors.precoMinimo?.message}
                      >
                        <BaseInput
                          {...register('precoMinimo', { valueAsNumber: true })}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          error={!!errors.precoMinimo}
                          className="w-full"
                        />
                      </FormField>

                      <FormField
                        label="Preço Máximo"
                        error={errors.precoMaximo?.message}
                      >
                        <BaseInput
                          {...register('precoMaximo', { valueAsNumber: true })}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          error={!!errors.precoMaximo}
                          className="w-full"
                        />
                      </FormField>
                    </>
                  )}

                  {tipoPreco === 'customizado' && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-800 text-sm">
                        Precificação customizada será definida individualmente para cada cliente.
                      </p>
                    </div>
                  )}
                </div>
              </ResponsiveCard>

              {/* Observações e Status */}
              <ResponsiveCard>
                <h3 className="font-semibold text-gray-900 mb-4 text-responsive border-b pb-2">
                  Observações e Status
                </h3>
                <div className="space-y-4">
                  <FormField
                    label="Descrição"
                    error={errors.descricao?.message}
                    hint="Descrição detalhada do produto"
                  >
                    <BaseTextarea
                      {...register('descricao')}
                      rows={4}
                      placeholder="Descreva as características e benefícios do produto..."
                      error={!!errors.descricao}
                      className="w-full resize-none"
                    />
                  </FormField>

                  <StatusPanel title="Status Atual">
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Status
                        </label>
                        <div className="mt-1">
                          <StatusBadge
                            status={
                              statusAtual === 'ativo' ? 'success' : 
                              statusAtual === 'desenvolvimento' ? 'active' :
                              statusAtual === 'inativo' ? 'warning' : 'error'
                            }
                            text={statusOptions.find(s => s.value === statusAtual)?.label}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        {configTipoProduto?.icon && (
                          <configTipoProduto.icon className="w-4 h-4 mr-2 flex-shrink-0" />
                        )}
                        <span>{configTipoProduto?.label || 'Tipo não selecionado'}</span>
                      </div>
                    </div>
                  </StatusPanel>
                </div>
              </ResponsiveCard>
            </AdaptiveColumns>
          )}

          {tabAtiva === 'avancado' && (
            <div className="space-y-6">
              <ResponsiveCard>
                <h3 className="font-semibold text-gray-900 mb-4 text-responsive border-b pb-2 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  Configurações Específicas do Tipo
                </h3>
                
                {configTipoProduto?.campos && configTipoProduto.campos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {configTipoProduto.campos.map((campo, index) => (
                      <FormField
                        key={campo.id}
                        label={campo.nome}
                        required={campo.obrigatorio}
                        hint={campo.ajuda}
                      >
                        {campo.tipo === 'texto' && (
                          <BaseInput
                            placeholder={campo.placeholder}
                            className="w-full"
                          />
                        )}
                        {campo.tipo === 'numero' && (
                          <BaseInput
                            type="number"
                            placeholder={campo.placeholder}
                            className="w-full"
                          />
                        )}
                        {campo.tipo === 'select' && campo.opcoes && (
                          <BaseSelect
                            options={campo.opcoes.map(opcao => ({ value: opcao, label: opcao }))}
                            placeholder={campo.placeholder}
                            className="w-full"
                          />
                        )}
                        {campo.tipo === 'textarea' && (
                          <BaseTextarea
                            rows={3}
                            placeholder={campo.placeholder}
                            className="w-full resize-none"
                          />
                        )}
                      </FormField>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhuma configuração específica para este tipo de produto.</p>
                  </div>
                )}
              </ResponsiveCard>
            </div>
          )}

          {tabAtiva === 'modulos' && (
            <div className="space-y-6">
              <ResponsiveCard>
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    Módulos do Sistema
                  </h3>
                  <BaseButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={adicionarModulo}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Adicionar Módulo
                  </BaseButton>
                </div>

                {modulosFields.length > 0 ? (
                  <div className="space-y-3">
                    {modulosFields.map((modulo, index) => (
                      <div key={modulo.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <FormField label="Módulo">
                            <BaseSelect
                              {...register(`modulos.${index}.nome` as const)}
                              options={configTipoProduto?.modulosDisponiveis?.map(mod => ({ 
                                value: mod, 
                                label: mod 
                              })) || []}
                              className="w-full"
                            />
                          </FormField>
                          
                          <FormField label="Incluído">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                {...register(`modulos.${index}.incluido` as const)}
                                className="rounded border-gray-300 text-blue-600"
                              />
                              <span className="ml-2 text-sm">Incluído no plano</span>
                            </label>
                          </FormField>
                          
                          <FormField label="Quantidade">
                            <BaseInput
                              type="number"
                              min="1"
                              {...register(`modulos.${index}.quantidade` as const, { valueAsNumber: true })}
                              className="w-full"
                            />
                          </FormField>
                          
                          <div>
                            <BaseButton
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={() => removeModulo(index)}
                              icon={<Trash2 className="w-4 h-4" />}
                            >
                              Remover
                            </BaseButton>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <FormField label="Observações">
                            <BaseInput
                              {...register(`modulos.${index}.observacoes` as const)}
                              placeholder="Observações sobre este módulo..."
                              className="w-full"
                            />
                          </FormField>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum módulo adicionado.</p>
                    <p className="text-sm">Clique em "Adicionar Módulo" para começar.</p>
                  </div>
                )}
              </ResponsiveCard>
            </div>
          )}

          {tabAtiva === 'licencas' && (
            <div className="space-y-6">
              <ResponsiveCard>
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    Licenças de Aplicativos
                  </h3>
                  <BaseButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={adicionarLicenca}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Adicionar Licença
                  </BaseButton>
                </div>

                {licencasFields.length > 0 ? (
                  <div className="space-y-3">
                    {licencasFields.map((licenca, index) => (
                      <div key={licenca.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <FormField label="Aplicativo">
                            <BaseSelect
                              {...register(`licencas.${index}.nome` as const)}
                              options={configTipoProduto?.licencasDisponiveis?.map(lic => ({ 
                                value: lic, 
                                label: lic 
                              })) || []}
                              className="w-full"
                            />
                          </FormField>
                          
                          <FormField label="Tipo">
                            <BaseSelect
                              {...register(`licencas.${index}.tipo` as const)}
                              options={[
                                { value: 'web', label: 'Web' },
                                { value: 'mobile', label: 'Mobile' },
                                { value: 'desktop', label: 'Desktop' }
                              ]}
                              className="w-full"
                            />
                          </FormField>
                          
                          <FormField label="Quantidade">
                            <BaseInput
                              type="number"
                              min="1"
                              {...register(`licencas.${index}.quantidade` as const, { valueAsNumber: true })}
                              className="w-full"
                            />
                          </FormField>
                          
                          <div>
                            <BaseButton
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={() => removeLicenca(index)}
                              icon={<Trash2 className="w-4 h-4" />}
                            >
                              Remover
                            </BaseButton>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <FormField label="Observações">
                            <BaseInput
                              {...register(`licencas.${index}.observacoes` as const)}
                              placeholder="Observações sobre esta licença..."
                              className="w-full"
                            />
                          </FormField>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhuma licença adicionada.</p>
                    <p className="text-sm">Clique em "Adicionar Licença" para começar.</p>
                  </div>
                )}
              </ResponsiveCard>
            </div>
          )}

          {tabAtiva === 'personalizados' && (
            <div className="space-y-6">
              <ResponsiveCard>
                <h3 className="font-semibold text-gray-900 mb-4 text-responsive border-b pb-2 flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  Campos Personalizados
                </h3>
                
                {segmentoConfig.camposPersonalizados.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {segmentoConfig.camposPersonalizados.map((campo, index) => (
                      <FormField
                        key={campo.id}
                        label={campo.nome}
                        required={campo.obrigatorio}
                        hint={campo.ajuda}
                      >
                        {campo.tipo === 'multiselect' && campo.opcoes && (
                          <div className="space-y-2">
                            {campo.opcoes.map(opcao => (
                              <label key={opcao} className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-blue-600"
                                />
                                <span className="ml-2 text-sm">{opcao}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        {campo.tipo === 'select' && campo.opcoes && (
                          <BaseSelect
                            options={campo.opcoes.map(opcao => ({ value: opcao, label: opcao }))}
                            placeholder={campo.placeholder}
                            className="w-full"
                          />
                        )}
                      </FormField>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum campo personalizado configurado para este segmento.</p>
                  </div>
                )}
              </ResponsiveCard>
            </div>
          )}
        </div>

        {/* Footer responsivo */}
        <div className="flex-shrink-0 border-t border-gray-200 mt-6 pt-4">
          <div className={`flex gap-3 ${isMobile ? 'flex-col-reverse' : 'justify-end'}`}>
            <BaseButton
              type="button"
              variant="secondary"
              onClick={handleClose}
              icon={<X className="w-4 h-4" />}
              className={isMobile ? 'w-full justify-center' : ''}
            >
              Cancelar
            </BaseButton>
            
            <BaseButton
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={!isValid}
              icon={<Save className="w-4 h-4" />}
              className={isMobile ? 'w-full justify-center' : ''}
            >
              {produto ? 'Atualizar Produto' : 'Salvar Produto'}
            </BaseButton>
          </div>
        </div>
      </form>
    </ResponsiveModal>
  );
};

export default ModalCadastroProdutoAvancado;
