import React, { useState, useEffect, useCallback, useRef } from 'react';
import clsx from 'clsx';
import {
  X,
  Save,
  Upload,
  Trash2,
  Plus,
  Calendar,
  DollarSign,
  FileText,
  Building,
  Tag,
  AlertCircle,
  CreditCard,
  RefreshCw,
  Check,
  Paperclip,
  Eye,
} from 'lucide-react';
import SearchSelect from '../../../components/common/SearchSelect';
import { shellFieldTokens } from '../../../components/layout-v2';
import {
  ContaBancaria,
  ContaPagar,
  NovaContaPagar,
  CategoriaContaPagar,
  FormaPagamento,
  PrioridadePagamento,
  CATEGORIA_LABELS,
  FORMA_PAGAMENTO_LABELS,
  PRIORIDADE_LABELS,
} from '../../../types/financeiro';

interface ModalContaPagarProps {
  conta?: ContaPagar | null;
  fornecedores?: Array<{ id: string; nome: string; cnpjCpf?: string }>;
  fornecedoresLoading?: boolean;
  fornecedoresError?: string | null;
  contasBancarias?: ContaBancaria[];
  contasBancariasLoading?: boolean;
  contasBancariasError?: string | null;
  onClose: () => void;
  onSave: (conta: NovaContaPagar) => Promise<void> | void;
}

const ModalContaPagar: React.FC<ModalContaPagarProps> = ({
  conta,
  fornecedores,
  fornecedoresLoading = false,
  fornecedoresError = null,
  contasBancarias,
  contasBancariasLoading = false,
  contasBancariasError = null,
  onClose,
  onSave,
}) => {
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [formData, setFormData] = useState<NovaContaPagar>({
    fornecedorId: '',
    descricao: '',
    numeroDocumento: '',
    dataEmissao: new Date().toISOString().split('T')[0],
    dataVencimento: new Date().toISOString().split('T')[0],
    valorOriginal: 0,
    valorDesconto: 0,
    categoria: CategoriaContaPagar.OUTROS,
    centroCustoId: '',
    tipoPagamento: FormaPagamento.PIX,
    contaBancariaId: '',
    observacoes: '',
    tags: [],
    recorrente: false,
    frequenciaRecorrencia: 'mensal',
    numeroParcelas: 1,
    prioridade: PrioridadePagamento.MEDIA,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [anexos, setAnexos] = useState<File[]>([]);
  const [novaTag, setNovaTag] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const fornecedoresDisponiveis = fornecedores ?? [];
  const contasBancariasDisponiveis = contasBancarias ?? [];
  const fornecedorOptions = fornecedoresDisponiveis.map((fornecedor) => ({
    id: fornecedor.id,
    label: fornecedor.nome,
    subtitle: fornecedor.cnpjCpf || '',
  }));
  const fornecedorSelecionado =
    fornecedorOptions.find((option) => option.id === formData.fornecedorId) || null;
  const fieldClass = shellFieldTokens.base;
  const fieldWithIconClass = shellFieldTokens.withIcon;
  const readOnlyFieldWithIconClass = shellFieldTokens.readOnlyWithIcon;
  const textareaFieldClass = shellFieldTokens.textarea;
  const invalidFieldClass = shellFieldTokens.invalid;
  const etapas = [
    { id: 0, nome: 'Informações Básicas', icon: FileText },
    { id: 1, nome: 'Valores e Pagamento', icon: DollarSign },
    { id: 2, nome: 'Classificação', icon: Tag },
    { id: 3, nome: 'Anexos e Observações', icon: Paperclip },
  ];

  // Preencher formulario ao editar
  useEffect(() => {
    if (conta) {
      setFormData({
        fornecedorId: conta.fornecedorId,
        descricao: conta.descricao,
        numeroDocumento: conta.numeroDocumento || '',
        dataEmissao: conta.dataEmissao,
        dataVencimento: conta.dataVencimento,
        valorOriginal: conta.valorOriginal,
        valorDesconto: conta.valorDesconto,
        categoria: conta.categoria,
        centroCustoId: '',
        tipoPagamento: conta.tipoPagamento,
        contaBancariaId: conta.contaBancariaId || '',
        observacoes: conta.observacoes || '',
        tags: conta.tags || [],
        recorrente: conta.recorrente,
        frequenciaRecorrencia: conta.frequenciaRecorrencia,
        prioridade: conta.prioridade,
      });
    }
  }, [conta]);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, [conta?.id]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!salvando) onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!active || !dialog.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, salvando]);

  const handleInputChange = <K extends keyof NovaContaPagar>(
    campo: K,
    valor: NovaContaPagar[K],
  ): void => {
    const campoKey = campo as string;
    setFormData((prev) => ({
      ...prev,
      [campo]: valor,
    }));

    // Limpar erro do campo
    if (errors[campoKey]) {
      setErrors((prev) => ({
        ...prev,
        [campoKey]: '',
      }));
    }
  };

  // Estados para controlar os valores formatados dos inputs
  const [valorOriginalInput, setValorOriginalInput] = useState('');
  const [valorDescontoInput, setValorDescontoInput] = useState('');

  // Atualizar inputs formatados quando formData muda (carregamento inicial ou edicao)
  const formatCurrency = useCallback((value: string): string => {
    // Remove todos os caracteres nao numericos
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue || numericValue === '0') return '';

    // Converte para numero e formata
    const formattedValue = (parseInt(numericValue) / 100).toFixed(2);
    return formattedValue.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }, []);

  useEffect(() => {
    if (conta?.valorOriginal && conta.valorOriginal > 0) {
      const formatted = formatCurrency((conta.valorOriginal * 100).toString());
      setValorOriginalInput(formatted ? `R$ ${formatted}` : '');
    } else {
      setValorOriginalInput('');
    }

    if (conta?.valorDesconto && conta.valorDesconto > 0) {
      const formatted = formatCurrency((conta.valorDesconto * 100).toString());
      setValorDescontoInput(formatted ? `R$ ${formatted}` : '');
    } else {
      setValorDescontoInput('');
    }
  }, [conta, formatCurrency]);

  // Handler para valor original (usando formatacao automatica)
  const handleValorOriginalChange = (valorInput: string): void => {
    // Remove o "R$ " se existir para evitar formatacao dupla
    const cleanValue = valorInput.replace(/^R\$\s*/, '');
    const formatted = formatCurrency(cleanValue);
    const formattedValue = formatted ? `R$ ${formatted}` : '';

    setValorOriginalInput(formattedValue);

    // Converte para valor numerico para calculos
    const valorNumerico = formattedValue
      ? parseFloat(formattedValue.replace(/[^\d,]/g, '').replace(',', '.'))
      : 0;
    setFormData((prev) => ({
      ...prev,
      valorOriginal: valorNumerico,
    }));

    // Limpar erro do campo
    if (errors.valorOriginal) {
      setErrors((prev) => ({
        ...prev,
        valorOriginal: '',
      }));
    }
  };

  // Handler para valor desconto (usando formatacao automatica)
  const handleValorDescontoChange = (valorInput: string): void => {
    // Remove o "R$ " se existir para evitar formatacao dupla
    const cleanValue = valorInput.replace(/^R\$\s*/, '');
    const formatted = formatCurrency(cleanValue);
    const formattedValue = formatted ? `R$ ${formatted}` : '';

    setValorDescontoInput(formattedValue);

    // Converte para valor numerico para calculos
    const valorNumerico = formattedValue
      ? parseFloat(formattedValue.replace(/[^\d,]/g, '').replace(',', '.'))
      : 0;
    setFormData((prev) => ({
      ...prev,
      valorDesconto: valorNumerico,
    }));

    // Limpar erro do campo
    if (errors.valorDesconto) {
      setErrors((prev) => ({
        ...prev,
        valorDesconto: '',
      }));
    }
  };

  // Handler especifico para campos inteiros
  const handleIntegerChange = (value: string, defaultValue = 1): void => {
    if (value === '') {
      // Permitir campo vazio durante a edicao
      setFormData((prev) => ({
        ...prev,
        numeroParcelas: defaultValue,
      }));
    } else {
      const intValue = parseInt(value);
      if (!isNaN(intValue) && intValue > 0) {
        setFormData((prev) => ({
          ...prev,
          numeroParcelas: intValue,
        }));
      }
    }

    // Limpar erro do campo
    if (errors.numeroParcelas) {
      setErrors((prev) => ({
        ...prev,
        numeroParcelas: '',
      }));
    }
  };

  const handleAdicionarTag = (): void => {
    if (novaTag.trim() && !formData.tags?.includes(novaTag.trim())) {
      handleInputChange('tags', [...(formData.tags || []), novaTag.trim()]);
      setNovaTag('');
    }
  };

  const handleRemoverTag = (tag: string): void => {
    handleInputChange('tags', formData.tags?.filter((t) => t !== tag) || []);
  };

  const handleAnexoChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(event.target.files || []);
    setAnexos((prev) => [...prev, ...files]);
  };

  const handleRemoverAnexo = (index: number): void => {
    setAnexos((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePreviewAnexo = (anexo: File): void => {
    const url = URL.createObjectURL(anexo);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {};

    if (fornecedoresLoading) {
      novosErros.fornecedorId = 'Aguarde o carregamento dos fornecedores';
    }

    if (fornecedoresError) {
      novosErros.fornecedorId = 'Não foi possível carregar fornecedores';
    }

    if (!fornecedoresLoading && !fornecedoresError && fornecedoresDisponiveis.length === 0) {
      novosErros.fornecedorId = 'Nenhum fornecedor disponível para seleção';
    }

    if (!formData.fornecedorId) {
      novosErros.fornecedorId = 'Fornecedor é obrigatório';
    }

    if (!formData.descricao.trim()) {
      novosErros.descricao = 'Descrição é obrigatória';
    }

    if (!formData.dataVencimento) {
      novosErros.dataVencimento = 'Data de vencimento é obrigatória';
    }

    if (!formData.valorOriginal || Number(formData.valorOriginal) <= 0) {
      novosErros.valorOriginal = 'Valor deve ser maior que zero';
    }

    const valorOriginalNum = Number(formData.valorOriginal) || 0;
    const valorDescontoNum = Number(formData.valorDesconto) || 0;

    if (formData.valorDesconto && valorDescontoNum >= valorOriginalNum) {
      novosErros.valorDesconto = 'Desconto não pode ser maior ou igual ao valor original';
    }

    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvar = async (): Promise<void> => {
    if (!validarFormulario()) {
      setErroGeral('Corrija os campos destacados para continuar.');
      return;
    }

    setSalvando(true);
    setErroGeral(null);
    try {
      const dadosParaSalvar = {
        ...formData,
        anexos: anexos,
      };

      await onSave(dadosParaSalvar);
    } catch {
      setErroGeral('Não foi possível salvar a conta. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const proximaEtapa = (): void => {
    if (etapaAtual < etapas.length - 1) {
      setEtapaAtual((prev) => Math.min(prev + 1, etapas.length - 1));
    }
  };

  const etapaAnterior = (): void => {
    if (etapaAtual > 0) {
      setEtapaAtual((prev) => Math.max(prev - 1, 0));
    }
  };

  const podeAvancar = (): boolean => {
    switch (etapaAtual) {
      case 0:
        return Boolean(
          !fornecedoresLoading &&
            !fornecedoresError &&
            fornecedoresDisponiveis.length > 0 &&
            formData.fornecedorId &&
            formData.descricao.trim(),
        );
      case 1:
        return (Number(formData.valorOriginal) || 0) > 0 && Boolean(formData.dataVencimento);
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderEtapaIndicator = (): React.ReactNode => (
    <div className="flex items-center justify-center mb-8">
      {etapas.map((etapa, index) => {
        const Icon = etapa.icon;
        const isActive = index === etapaAtual;
        const isCompleted = index < etapaAtual;

        return (
          <div key={etapa.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                isActive
                  ? 'border-[#159A9C] bg-[#159A9C] text-white'
                  : isCompleted
                    ? 'border-[#0F7B7D] bg-[#0F7B7D] text-white'
                    : 'border-[#D4E2E7] bg-white text-gray-400'
              }`}
            >
              {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            </div>

            {index < etapas.length - 1 && (
              <div
                className={`w-16 h-1 mx-2 ${index < etapaAtual ? 'bg-[#0F7B7D]' : 'bg-gray-300'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderConteudoEtapa = (): React.ReactNode => {
    switch (etapaAtual) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-[#19384C]">Informações Básicas</h3>
              <p className="text-sm text-[#4F6D7B]">Dados principais da conta a pagar</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fornecedor */}
              <div className="lg:col-span-2">
                {fornecedoresLoading && (
                  <div className="mb-3 rounded-lg border border-[#DCE8EC] bg-[#F8FBFC] px-4 py-3 text-sm text-[#5E7A88]">
                    Carregando fornecedores...
                  </div>
                )}
                {fornecedoresError && (
                  <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {fornecedoresError}
                  </div>
                )}
                {!fornecedoresLoading &&
                  !fornecedoresError &&
                  fornecedoresDisponiveis.length === 0 && (
                    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      Nenhum fornecedor ativo disponivel. Cadastre ou ative um fornecedor antes de
                      criar a conta.
                    </div>
                  )}
                <label className="block text-sm font-medium text-gray-700 mb-2">Fornecedor *</label>
                <SearchSelect
                  options={fornecedorOptions}
                  value={fornecedorSelecionado}
                  onChange={(option) =>
                    handleInputChange('fornecedorId', option ? String(option.id) : '')
                  }
                  placeholder="Buscar fornecedor por nome ou CNPJ..."
                  loading={fornecedoresLoading}
                  disabled={
                    fornecedoresLoading ||
                    Boolean(fornecedoresError) ||
                    fornecedoresDisponiveis.length === 0
                  }
                  icon={<Building className="h-4 w-4" />}
                  emptyMessage="Nenhum fornecedor encontrado"
                  error={errors.fornecedorId}
                  inputClassName={clsx(
                    fieldWithIconClass,
                    errors.fornecedorId && invalidFieldClass,
                  )}
                  dropdownClassName="border-[#D4E2E7] shadow-[0_16px_34px_-20px_rgba(15,57,74,0.42)]"
                />
              </div>

              {/* Descrição */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição *</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.descricao}
                    onChange={(e) => handleInputChange('descricao', e.target.value)}
                    className={clsx(fieldWithIconClass, errors.descricao && invalidFieldClass)}
                    placeholder="Ex: Licenças de software mensais"
                  />
                </div>
                {errors.descricao && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.descricao}
                  </p>
                )}
              </div>

              {/* Número do Documento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número do Documento
                </label>
                <input
                  type="text"
                  value={formData.numeroDocumento}
                  onChange={(e) => handleInputChange('numeroDocumento', e.target.value)}
                  className={fieldClass}
                  placeholder="Ex: NF-123456"
                />
              </div>

              {/* Data de Emissão */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Emissão
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.dataEmissao}
                    onChange={(e) => handleInputChange('dataEmissao', e.target.value)}
                    className={fieldWithIconClass}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-[#19384C]">Valores e Pagamento</h3>
              <p className="text-sm text-[#4F6D7B]">Configure valores e forma de pagamento</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Data de Vencimento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Vencimento *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.dataVencimento}
                    onChange={(e) => handleInputChange('dataVencimento', e.target.value)}
                    className={clsx(fieldWithIconClass, errors.dataVencimento && invalidFieldClass)}
                  />
                </div>
                {errors.dataVencimento && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.dataVencimento}
                  </p>
                )}
              </div>

              {/* Valor Original */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Original *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={valorOriginalInput}
                    onChange={(e) => handleValorOriginalChange(e.target.value)}
                    className={clsx(fieldWithIconClass, errors.valorOriginal && invalidFieldClass)}
                    placeholder="0,00"
                  />
                </div>
                {errors.valorOriginal && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.valorOriginal}
                  </p>
                )}
              </div>

              {/* Valor de Desconto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor de Desconto
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={valorDescontoInput}
                    onChange={(e) => handleValorDescontoChange(e.target.value)}
                    className={clsx(fieldWithIconClass, errors.valorDesconto && invalidFieldClass)}
                    placeholder="0,00"
                  />
                </div>
                {errors.valorDesconto && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.valorDesconto}
                  </p>
                )}
              </div>

              {/* Valor Total */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valor Total</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={(() => {
                      const valorTotal =
                        (Number(formData.valorOriginal) || 0) -
                        (Number(formData.valorDesconto) || 0);
                      if (valorTotal <= 0) return 'R$ 0,00';
                      const formatted = formatCurrency((valorTotal * 100).toString());
                      return `R$ ${formatted}`;
                    })()}
                    readOnly
                    className={readOnlyFieldWithIconClass}
                  />
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forma de Pagamento
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <select
                    value={formData.tipoPagamento}
                    onChange={(e) =>
                      handleInputChange('tipoPagamento', e.target.value as FormaPagamento)
                    }
                    className={fieldWithIconClass}
                  >
                    {Object.entries(FORMA_PAGAMENTO_LABELS).map(([valor, label]) => (
                      <option key={valor} value={valor}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conta Banc�ria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conta Banc�ria
                </label>
                {contasBancariasLoading && (
                  <div className="mb-2 rounded-lg border border-[#DCE8EC] bg-[#F8FBFC] px-3 py-2 text-xs text-[#5E7A88]">
                    Carregando contas bancarias...
                  </div>
                )}
                {contasBancariasError && (
                  <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    {contasBancariasError}
                  </div>
                )}
                <select
                  value={formData.contaBancariaId}
                  onChange={(e) => handleInputChange('contaBancariaId', e.target.value)}
                  className={fieldClass}
                  disabled={contasBancariasLoading}
                >
                  <option value="">Selecione uma conta</option>
                  {contasBancariasDisponiveis.map((conta) => (
                    <option key={conta.id} value={conta.id}>
                      {conta.nome} - {conta.banco}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recorrência */}
            <div className="border-t border-[#E1EAEE] pt-6">
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  id="recorrente"
                  checked={formData.recorrente}
                  onChange={(e) => handleInputChange('recorrente', e.target.checked)}
                  className="h-4 w-4 text-[#159A9C] border-[#D4E2E7] rounded focus:ring-[#1A9E87]/15"
                />
                <label
                  htmlFor="recorrente"
                  className="text-sm font-medium text-gray-700 flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Conta recorrente</span>
                </label>
              </div>

              {formData.recorrente && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequência
                    </label>
                    <select
                      value={formData.frequenciaRecorrencia}
                      onChange={(e) =>
                        handleInputChange(
                          'frequenciaRecorrencia',
                          e.target.value as NovaContaPagar['frequenciaRecorrencia'],
                        )
                      }
                      className={fieldClass}
                    >
                      <option value="mensal">Mensal</option>
                      <option value="bimestral">Bimestral</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="semestral">Semestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Parcelas
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.numeroParcelas}
                      onChange={(e) => handleIntegerChange(e.target.value, 1)}
                      className={fieldClass}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-[#19384C]">Classificação</h3>
              <p className="text-sm text-[#4F6D7B]">Organize e categorize a conta</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <select
                    value={formData.categoria}
                    onChange={(e) =>
                      handleInputChange('categoria', e.target.value as CategoriaContaPagar)
                    }
                    className={fieldWithIconClass}
                  >
                    {Object.entries(CATEGORIA_LABELS).map(([valor, label]) => (
                      <option key={valor} value={valor}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prioridade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
                <select
                  value={formData.prioridade}
                  onChange={(e) =>
                    handleInputChange('prioridade', e.target.value as PrioridadePagamento)
                  }
                  className={fieldClass}
                >
                  {Object.entries(PRIORIDADE_LABELS).map(([valor, label]) => (
                    <option key={valor} value={valor}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={novaTag}
                      onChange={(e) => setNovaTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAdicionarTag();
                        }
                      }}
                      className={clsx(fieldClass, 'flex-1')}
                      placeholder="Adicionar tag..."
                    />
                    <button
                      type="button"
                      onClick={handleAdicionarTag}
                      className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Adicionar</span>
                    </button>
                  </div>

                  {formData.tags && formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#EAF7F4] text-[#1F6F63]"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoverTag(tag)}
                            className="ml-2 text-[#159A9C] hover:text-[#0F7B7D]"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-[#19384C]">Anexos e Observações</h3>
              <p className="text-sm text-[#4F6D7B]">Adicione documentos e observações</p>
            </div>

            <div className="space-y-6">
              {/* Upload de Anexos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Anexos</label>
                <div className="relative border-2 border-dashed border-[#D4E2E7] rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Clique para fazer upload ou arraste arquivos aqui
                    </p>
                    <p className="text-xs text-[#607B89]">
                      Formatos aceitos: PDF, DOC, DOCX, JPG, PNG (Máx: 10MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleAnexoChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                {anexos.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {anexos.map((anexo, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-[#F8FBFC] rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Paperclip className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">{anexo.name}</span>
                          <span className="text-xs text-[#607B89]">
                            ({(anexo.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handlePreviewAnexo(anexo)}
                            className="p-1 text-gray-400 hover:text-[#4F6D7B]"
                            aria-label={`Visualizar anexo ${anexo.name}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoverAnexo(index)}
                            className="p-1 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  rows={4}
                  className={textareaFieldClass}
                  placeholder="Adicione observações sobre esta conta..."
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-[#0F172A]/35 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="flex w-[calc(100%-2rem)] max-w-[1100px] max-h-[95vh] flex-col overflow-hidden rounded-2xl border border-[#DCE8EC] bg-white shadow-[0_24px_70px_-28px_rgba(15,57,74,0.45)] sm:w-[600px] md:w-[700px] lg:w-[900px] xl:w-[1000px]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-conta-pagar-title"
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-6 border-b border-[#DCE8EC] bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[#ECF7F3]">
              <FileText className="h-6 w-6 text-[#159A9C]" />
            </div>
            <div>
              <h2 id="modal-conta-pagar-title" className="text-2xl font-bold text-[#19384C]">
                {conta ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
              </h2>
              <p className="text-sm text-[#4F6D7B]">{etapas[etapaAtual].nome}</p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-[#4F6D7B] transition-colors rounded-lg hover:bg-gray-100"
            type="button"
            aria-label="Fechar modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Progress Indicator */}
          <div className="p-6 border-b border-[#EEF3F5] space-y-4">
            {renderEtapaIndicator()}
            {erroGeral && (
              <div className="px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
                {erroGeral}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">{renderConteudoEtapa()}</div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between p-6 border-t border-[#E1EAEE] bg-[#F8FBFC]">
          <div className="flex items-center space-x-2">
            {etapaAtual > 0 && (
              <button
                onClick={etapaAnterior}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-[#D4E2E7] rounded-lg hover:bg-[#F6FAF9] transition-colors"
              >
                Anterior
              </button>
            )}
          </div>

          <div className="text-sm text-[#607B89]">
            Etapa {etapaAtual + 1} de {etapas.length}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-[#D4E2E7] rounded-lg hover:bg-[#F6FAF9] transition-colors"
            >
              Cancelar
            </button>

            {etapaAtual < etapas.length - 1 ? (
              <button
                onClick={proximaEtapa}
                disabled={!podeAvancar()}
                className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
                  podeAvancar()
                    ? 'bg-[#159A9C] text-white hover:bg-[#0F7B7D]'
                    : 'bg-gray-300 text-[#607B89] cursor-not-allowed'
                }`}
              >
                Continuar
              </button>
            ) : (
              <button
                onClick={handleSalvar}
                disabled={salvando || !podeAvancar()}
                className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                  salvando || !podeAvancar()
                    ? 'bg-gray-300 text-[#607B89] cursor-not-allowed'
                    : 'bg-[#0F7B7D] text-white hover:bg-[#0C6668]'
                }`}
              >
                {salvando ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Salvar Conta</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalContaPagar;

