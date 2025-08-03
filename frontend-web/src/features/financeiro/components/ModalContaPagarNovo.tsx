import React, { useState, useEffect } from 'react';
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
  User,
  CreditCard,
  RefreshCw,
  ChevronDown,
  Check,
  Paperclip,
  Eye
} from 'lucide-react';
import { 
  ContaPagar, 
  NovaContaPagar, 
  CategoriaContaPagar, 
  FormaPagamento,
  PrioridadePagamento,
  CATEGORIA_LABELS,
  FORMA_PAGAMENTO_LABELS,
  PRIORIDADE_LABELS
} from '../../../types/financeiro';

interface ModalContaPagarProps {
  conta?: ContaPagar | null;
  onClose: () => void;
  onSave: (conta: NovaContaPagar) => void;
}

const ModalContaPagar: React.FC<ModalContaPagarProps> = ({
  conta,
  onClose,
  onSave
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
    prioridade: PrioridadePagamento.MEDIA
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [anexos, setAnexos] = useState<File[]>([]);
  const [novaTag, setNovaTag] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [fornecedorDropdownAberto, setFornecedorDropdownAberto] = useState(false);

  // Mock de dados - em produção viriam da API
  const fornecedoresMock = [
    { id: 'forn1', nome: 'Tech Solutions Ltda', cnpjCpf: '12.345.678/0001-90' },
    { id: 'forn2', nome: 'Papelaria Central', cnpjCpf: '98.765.432/0001-10' },
    { id: 'forn3', nome: 'Escritório Legal', cnpjCpf: '11.222.333/0001-44' },
    { id: 'forn4', nome: 'Marketing Digital Pro', cnpjCpf: '55.666.777/0001-88' },
    { id: 'forn5', nome: 'Infraestrutura Cloud', cnpjCpf: '99.888.777/0001-22' }
  ];

  const contasBancariasMock = [
    { id: 'conta1', nome: 'Conta Corrente - Banco do Brasil', banco: 'Banco do Brasil' },
    { id: 'conta2', nome: 'Conta Poupança - Caixa', banco: 'Caixa Econômica' },
    { id: 'conta3', nome: 'Conta Empresarial - Santander', banco: 'Santander' }
  ];

  const etapas = [
    { id: 0, nome: 'Informações Básicas', icon: FileText },
    { id: 1, nome: 'Valores e Pagamento', icon: DollarSign },
    { id: 2, nome: 'Classificação', icon: Tag },
    { id: 3, nome: 'Anexos e Observações', icon: Paperclip }
  ];

  // Preencher formulário ao editar
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
        prioridade: conta.prioridade
      });
    }
  }, [conta]);

  const handleInputChange = (campo: keyof NovaContaPagar, valor: any) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));

    // Limpar erro do campo
    if (errors[campo]) {
      setErrors(prev => ({
        ...prev,
        [campo]: ''
      }));
    }
  };

  // Estados para controlar os valores formatados dos inputs
  const [valorOriginalInput, setValorOriginalInput] = useState('');
  const [valorDescontoInput, setValorDescontoInput] = useState('');

  // Atualizar inputs formatados quando formData muda (carregamento inicial ou edição)
  useEffect(() => {
    if (formData.valorOriginal > 0) {
      const formatted = formatCurrency((formData.valorOriginal * 100).toString());
      setValorOriginalInput(formatted ? `R$ ${formatted}` : '');
    }
    if (formData.valorDesconto > 0) {
      const formatted = formatCurrency((formData.valorDesconto * 100).toString());
      setValorDescontoInput(formatted ? `R$ ${formatted}` : '');
    }
  }, [conta]); // Apenas quando conta muda (edição)

  // Formatação automática de campos monetários (igual ao modal de oportunidades)
  const formatCurrency = (value: string): string => {
    // Remove todos os caracteres não numéricos
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue || numericValue === '0') return '';
    
    // Converte para número e formata
    const formattedValue = (parseInt(numericValue) / 100).toFixed(2);
    return formattedValue.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Handler para valor original (usando formatação automática)
  const handleValorOriginalChange = (valorInput: string) => {
    // Remove o "R$ " se existir para evitar formatação dupla
    const cleanValue = valorInput.replace(/^R\$\s*/, '');
    const formatted = formatCurrency(cleanValue);
    const formattedValue = formatted ? `R$ ${formatted}` : '';
    
    setValorOriginalInput(formattedValue);
    
    // Converte para valor numérico para cálculos
    const valorNumerico = formattedValue ? parseFloat(formattedValue.replace(/[^\d,]/g, '').replace(',', '.')) : 0;
    setFormData(prev => ({
      ...prev,
      valorOriginal: valorNumerico
    }));

    // Limpar erro do campo
    if (errors.valorOriginal) {
      setErrors(prev => ({
        ...prev,
        valorOriginal: ''
      }));
    }
  };

  // Handler para valor desconto (usando formatação automática)
  const handleValorDescontoChange = (valorInput: string) => {
    // Remove o "R$ " se existir para evitar formatação dupla
    const cleanValue = valorInput.replace(/^R\$\s*/, '');
    const formatted = formatCurrency(cleanValue);
    const formattedValue = formatted ? `R$ ${formatted}` : '';
    
    setValorDescontoInput(formattedValue);
    
    // Converte para valor numérico para cálculos
    const valorNumerico = formattedValue ? parseFloat(formattedValue.replace(/[^\d,]/g, '').replace(',', '.')) : 0;
    setFormData(prev => ({
      ...prev,
      valorDesconto: valorNumerico
    }));

    // Limpar erro do campo
    if (errors.valorDesconto) {
      setErrors(prev => ({
        ...prev,
        valorDesconto: ''
      }));
    }
  };

  // Handler específico para campos numéricos que permite valores vazios
  const handleNumericChange = (campo: keyof NovaContaPagar, value: string) => {
    if (value === '') {
      // Permitir campo vazio durante a edição
      setFormData(prev => ({
        ...prev,
        [campo]: '' as any
      }));
    } else {
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue)) {
        setFormData(prev => ({
          ...prev,
          [campo]: numericValue
        }));
      }
    }

    // Limpar erro do campo
    if (errors[campo]) {
      setErrors(prev => ({
        ...prev,
        [campo]: ''
      }));
    }
  };

  // Handler específico para campos inteiros
  const handleIntegerChange = (campo: keyof NovaContaPagar, value: string, defaultValue: number = 1) => {
    if (value === '') {
      // Permitir campo vazio durante a edição
      setFormData(prev => ({
        ...prev,
        [campo]: defaultValue as any
      }));
    } else {
      const intValue = parseInt(value);
      if (!isNaN(intValue) && intValue > 0) {
        setFormData(prev => ({
          ...prev,
          [campo]: intValue
        }));
      }
    }

    // Limpar erro do campo
    if (errors[campo]) {
      setErrors(prev => ({
        ...prev,
        [campo]: ''
      }));
    }
  };

  const handleAdicionarTag = () => {
    if (novaTag.trim() && !formData.tags?.includes(novaTag.trim())) {
      handleInputChange('tags', [...(formData.tags || []), novaTag.trim()]);
      setNovaTag('');
    }
  };

  const handleRemoverTag = (tag: string) => {
    handleInputChange('tags', formData.tags?.filter(t => t !== tag) || []);
  };

  const handleAnexoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAnexos(prev => [...prev, ...files]);
  };

  const handleRemoverAnexo = (index: number) => {
    setAnexos(prev => prev.filter((_, i) => i !== index));
  };

  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {};

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

  const handleSalvar = async () => {
    if (!validarFormulario()) {
      return;
    }

    setSalvando(true);
    try {
      const dadosParaSalvar = {
        ...formData,
        anexos: anexos
      };

      await onSave(dadosParaSalvar);
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
    } finally {
      setSalvando(false);
    }
  };

  const proximaEtapa = () => {
    if (etapaAtual < etapas.length - 1) {
      setEtapaAtual(etapaAtual + 1);
    }
  };

  const etapaAnterior = () => {
    if (etapaAtual > 0) {
      setEtapaAtual(etapaAtual - 1);
    }
  };

  const podeAvancar = () => {
    switch (etapaAtual) {
      case 0:
        return formData.fornecedorId && formData.descricao.trim();
      case 1:
        return (Number(formData.valorOriginal) || 0) > 0 && formData.dataVencimento;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderEtapaIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {etapas.map((etapa, index) => {
        const Icon = etapa.icon;
        const isActive = index === etapaAtual;
        const isCompleted = index < etapaAtual;
        
        return (
          <div key={etapa.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              isActive 
                ? 'border-blue-600 bg-blue-600 text-white' 
                : isCompleted 
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-gray-300 bg-white text-gray-400'
            }`}>
              {isCompleted ? (
                <Check className="h-5 w-5" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
            </div>
            
            {index < etapas.length - 1 && (
              <div className={`w-16 h-1 mx-2 ${
                index < etapaAtual ? 'bg-green-600' : 'bg-gray-300'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderConteudoEtapa = () => {
    switch (etapaAtual) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Informações Básicas</h3>
              <p className="text-sm text-gray-600">Dados principais da conta a pagar</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fornecedor */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fornecedor *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setFornecedorDropdownAberto(!fornecedorDropdownAberto)}
                    className={`w-full px-4 py-3 border rounded-lg text-left flex items-center justify-between bg-white ${
                      errors.fornecedorId ? 'border-red-500' : 'border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  >
                    <div className="flex items-center space-x-3">
                      <Building className="h-5 w-5 text-gray-400" />
                      <span className={formData.fornecedorId ? 'text-gray-900' : 'text-gray-500'}>
                        {formData.fornecedorId 
                          ? fornecedoresMock.find(f => f.id === formData.fornecedorId)?.nome || 'Fornecedor não encontrado'
                          : 'Selecione um fornecedor'
                        }
                      </span>
                    </div>
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </button>
                  
                  {fornecedorDropdownAberto && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {fornecedoresMock.map((fornecedor) => (
                        <button
                          key={fornecedor.id}
                          type="button"
                          onClick={() => {
                            handleInputChange('fornecedorId', fornecedor.id);
                            setFornecedorDropdownAberto(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                        >
                          <div className="font-medium text-gray-900">{fornecedor.nome}</div>
                          <div className="text-sm text-gray-500">{fornecedor.cnpjCpf}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.fornecedorId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.fornecedorId}
                  </p>
                )}
              </div>

              {/* Descrição */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.descricao}
                    onChange={(e) => handleInputChange('descricao', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg ${
                      errors.descricao ? 'border-red-500' : 'border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: NF-123456"
                />
              </div>

              {/* Data de Emissão */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Emissão
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.dataEmissao}
                    onChange={(e) => handleInputChange('dataEmissao', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <h3 className="text-lg font-semibold text-gray-900">Valores e Pagamento</h3>
              <p className="text-sm text-gray-600">Configure valores e forma de pagamento</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Data de Vencimento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Vencimento *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.dataVencimento}
                    onChange={(e) => handleInputChange('dataVencimento', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg ${
                      errors.dataVencimento ? 'border-red-500' : 'border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
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
                  <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={valorOriginalInput}
                    onChange={(e) => handleValorOriginalChange(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg ${
                      errors.valorOriginal ? 'border-red-500' : 'border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
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
                  <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={valorDescontoInput}
                    onChange={(e) => handleValorDescontoChange(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg ${
                      errors.valorDesconto ? 'border-red-500' : 'border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Total
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={(() => {
                      const valorTotal = (Number(formData.valorOriginal) || 0) - (Number(formData.valorDesconto) || 0);
                      if (valorTotal <= 0) return 'R$ 0,00';
                      const formatted = formatCurrency((valorTotal * 100).toString());
                      return `R$ ${formatted}`;
                    })()}
                    readOnly
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forma de Pagamento
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <select
                    value={formData.tipoPagamento}
                    onChange={(e) => handleInputChange('tipoPagamento', e.target.value as FormaPagamento)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(FORMA_PAGAMENTO_LABELS).map(([valor, label]) => (
                      <option key={valor} value={valor}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conta Bancária */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conta Bancária
                </label>
                <select
                  value={formData.contaBancariaId}
                  onChange={(e) => handleInputChange('contaBancariaId', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione uma conta</option>
                  {contasBancariasMock.map((conta) => (
                    <option key={conta.id} value={conta.id}>{conta.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recorrência */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  id="recorrente"
                  checked={formData.recorrente}
                  onChange={(e) => handleInputChange('recorrente', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="recorrente" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
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
                      onChange={(e) => handleInputChange('frequenciaRecorrencia', e.target.value as any)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      onChange={(e) => handleIntegerChange('numeroParcelas', e.target.value, 1)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <h3 className="text-lg font-semibold text-gray-900">Classificação</h3>
              <p className="text-sm text-gray-600">Organize e categorize a conta</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <select
                    value={formData.categoria}
                    onChange={(e) => handleInputChange('categoria', e.target.value as CategoriaContaPagar)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(CATEGORIA_LABELS).map(([valor, label]) => (
                      <option key={valor} value={valor}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prioridade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridade
                </label>
                <select
                  value={formData.prioridade}
                  onChange={(e) => handleInputChange('prioridade', e.target.value as PrioridadePagamento)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(PRIORIDADE_LABELS).map(([valor, label]) => (
                    <option key={valor} value={valor}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={novaTag}
                      onChange={(e) => setNovaTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAdicionarTag()}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Adicionar tag..."
                    />
                    <button
                      type="button"
                      onClick={handleAdicionarTag}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
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
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoverTag(tag)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
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
              <h3 className="text-lg font-semibold text-gray-900">Anexos e Observações</h3>
              <p className="text-sm text-gray-600">Adicione documentos e observações</p>
            </div>

            <div className="space-y-6">
              {/* Upload de Anexos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anexos
                </label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Clique para fazer upload ou arraste arquivos aqui</p>
                    <p className="text-xs text-gray-500">Formatos aceitos: PDF, DOC, DOCX, JPG, PNG (Máx: 10MB)</p>
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
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Paperclip className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">{anexo.name}</span>
                          <span className="text-xs text-gray-500">({(anexo.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            className="p-1 text-gray-400 hover:text-gray-600"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {conta ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
              </h2>
              <p className="text-sm text-gray-600">
                {etapas[etapaAtual].nome}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="p-6 border-b border-gray-100">
          {renderEtapaIndicator()}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {renderConteudoEtapa()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            {etapaAtual > 0 && (
              <button
                onClick={etapaAnterior}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Anterior
              </button>
            )}
          </div>

          <div className="text-sm text-gray-500">
            Etapa {etapaAtual + 1} de {etapas.length}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            
            {etapaAtual < etapas.length - 1 ? (
              <button
                onClick={proximaEtapa}
                disabled={!podeAvancar()}
                className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
                  podeAvancar()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
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