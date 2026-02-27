import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  Loader2,
  AlertCircle,
  FileText,
  Activity,
  Plus,
  Edit3,
  DollarSign,
  User,
  MessageSquare,
  CheckCircle,
  Clock,
  TrendingUp,
  Building2,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { Oportunidade, NovaOportunidade } from '../../types/oportunidades';
import {
  EstagioOportunidade,
  PrioridadeOportunidade,
  OrigemOportunidade,
} from '../../types/oportunidades/enums';
import { Usuario } from '../../types/usuarios';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalConfirmation } from '../../contexts/GlobalConfirmationContext';
import InputMoeda from '../common/InputMoeda';
import { Cliente, clientesService } from '../../services/clientesService';

// ========================================
// INTERFACES E TIPOS
// ========================================

interface ModalOportunidadeProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NovaOportunidade) => Promise<void>;
  oportunidade?: Oportunidade | null;
  estagioInicial?: EstagioOportunidade;
  usuarios?: Usuario[];
  loadingUsuarios?: boolean;
}

interface ValidationError {
  field: string;
  message: string;
}

type TabType = 'detalhes' | 'atividades';

// ========================================
// CONSTANTES E CONFIGURAÇÕES
// ========================================

const ESTAGIOS_LABELS: Record<EstagioOportunidade, string> = {
  [EstagioOportunidade.LEADS]: 'Leads',
  [EstagioOportunidade.QUALIFICACAO]: 'Qualificação',
  [EstagioOportunidade.PROPOSTA]: 'Proposta',
  [EstagioOportunidade.NEGOCIACAO]: 'Negociação',
  [EstagioOportunidade.FECHAMENTO]: 'Fechamento',
  [EstagioOportunidade.GANHO]: 'Ganho',
  [EstagioOportunidade.PERDIDO]: 'Perdido',
};

const PRIORIDADES_LABELS: Record<PrioridadeOportunidade, string> = {
  [PrioridadeOportunidade.BAIXA]: 'Baixa',
  [PrioridadeOportunidade.MEDIA]: 'Média',
  [PrioridadeOportunidade.ALTA]: 'Alta',
};

const PRIORIDADES_CORES: Record<PrioridadeOportunidade, string> = {
  [PrioridadeOportunidade.BAIXA]: 'bg-gray-100 text-gray-800',
  [PrioridadeOportunidade.MEDIA]: 'bg-yellow-100 text-yellow-800',
  [PrioridadeOportunidade.ALTA]: 'bg-red-100 text-red-800',
};

const ORIGENS_LABELS: Record<OrigemOportunidade, string> = {
  [OrigemOportunidade.WEBSITE]: 'Website',
  [OrigemOportunidade.INDICACAO]: 'Indicação',
  [OrigemOportunidade.TELEFONE]: 'Telefone',
  [OrigemOportunidade.EMAIL]: 'E-mail',
  [OrigemOportunidade.REDES_SOCIAIS]: 'Redes Sociais',
  [OrigemOportunidade.EVENTO]: 'Evento',
  [OrigemOportunidade.PARCEIRO]: 'Parceiro',
  [OrigemOportunidade.CAMPANHA]: 'Campanha',
};

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

const ModalOportunidadeRefatorado: React.FC<ModalOportunidadeProps> = ({
  isOpen,
  onClose,
  onSave,
  oportunidade,
  estagioInicial = EstagioOportunidade.LEADS,
  usuarios = [],
  loadingUsuarios = false,
}) => {
  const { user } = useAuth();
  const { confirm } = useGlobalConfirmation();
  const [activeTab, setActiveTab] = useState<TabType>('detalhes');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Estados para autocomplete de clientes
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);

  // Estado do formulário
  const [formData, setFormData] = useState<NovaOportunidade>({
    titulo: '',
    descricao: '',
    valor: 0,
    probabilidade: 50,
    estagio: estagioInicial,
    prioridade: PrioridadeOportunidade.MEDIA,
    origem: OrigemOportunidade.WEBSITE,
    tags: [],
    dataFechamentoEsperado: '',
    responsavel_id: user?.id || '',
    cliente_id: '',
    nomeContato: '',
    emailContato: '',
    telefoneContato: '',
    empresaContato: '',
  });

  // Carregar clientes ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      carregarClientes();
    }
  }, [isOpen]);

  const carregarClientes = async () => {
    try {
      setLoadingClientes(true);
      const response = await clientesService.getClientes({ limit: 100 });
      setClientes(response.data || []);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
    } finally {
      setLoadingClientes(false);
    }
  };

  // Filtrar clientes conforme busca
  useEffect(() => {
    if (buscaCliente.trim()) {
      const filtrados = clientes.filter(
        (c) =>
          c.nome.toLowerCase().includes(buscaCliente.toLowerCase()) ||
          c.email?.toLowerCase().includes(buscaCliente.toLowerCase()) ||
          c.documento?.includes(buscaCliente),
      );
      setClientesFiltrados(filtrados);
    } else {
      setClientesFiltrados([]);
    }
  }, [buscaCliente, clientes]);

  // Resetar formulário quando o modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      if (oportunidade) {
        // Modo edição: preencher com dados existentes
        setFormData({
          titulo: oportunidade.titulo,
          descricao: oportunidade.descricao || '',
          valor: Number(oportunidade.valor),
          probabilidade: oportunidade.probabilidade,
          estagio: oportunidade.estagio,
          prioridade: oportunidade.prioridade,
          origem: oportunidade.origem,
          tags: oportunidade.tags || [],
          dataFechamentoEsperado: oportunidade.dataFechamentoEsperado
            ? new Date(oportunidade.dataFechamentoEsperado).toISOString().split('T')[0]
            : '',
          responsavel_id: oportunidade.responsavel?.id || '',
          cliente_id: oportunidade.cliente?.id || '',
          nomeContato: oportunidade.nomeContato || '',
          emailContato: oportunidade.emailContato || '',
          telefoneContato: oportunidade.telefoneContato || '',
          empresaContato: oportunidade.empresaContato || '',
        });
      } else {
        // Modo criação: valores padrão
        setFormData({
          titulo: '',
          descricao: '',
          valor: 0,
          probabilidade: 50,
          estagio: estagioInicial,
          prioridade: PrioridadeOportunidade.MEDIA,
          origem: OrigemOportunidade.WEBSITE,
          tags: [],
          dataFechamentoEsperado: '',
          responsavel_id: user?.id || '',
          cliente_id: '',
          nomeContato: '',
          emailContato: '',
          telefoneContato: '',
          empresaContato: '',
        });
      }
      setErrors([]);
      setActiveTab('detalhes');
    }
  }, [isOpen, oportunidade, estagioInicial, user]);

  useEffect(() => {
    if (!isOpen || oportunidade) {
      return;
    }

    if (user?.id) {
      setFormData((prev) => ({
        ...prev,
        responsavel_id: prev.responsavel_id || user.id,
      }));
    }
  }, [isOpen, oportunidade, user]);

  // ========================================
  // VALIDAÇÕES
  // ========================================

  const validateForm = (): ValidationError[] => {
    const newErrors: ValidationError[] = [];

    // Título obrigatório
    if (!formData.titulo.trim()) {
      newErrors.push({ field: 'titulo', message: 'Título é obrigatório' });
    } else if (formData.titulo.trim().length < 3) {
      newErrors.push({ field: 'titulo', message: 'Título deve ter pelo menos 3 caracteres' });
    }

    // Valor não pode ser negativo
    if (formData.valor < 0) {
      newErrors.push({ field: 'valor', message: 'Valor não pode ser negativo' });
    }

    // Probabilidade deve estar entre 0 e 100
    if (formData.probabilidade < 0 || formData.probabilidade > 100) {
      newErrors.push({ field: 'probabilidade', message: 'Probabilidade deve estar entre 0 e 100' });
    }

    // Responsável obrigatório
    if (!formData.responsavel_id) {
      newErrors.push({ field: 'responsavel_id', message: 'Responsável é obrigatório' });
    }

    // Validar cliente_id ou dados de contato
    if (!formData.cliente_id && !formData.nomeContato?.trim()) {
      newErrors.push({
        field: 'contato',
        message: 'Informe um cliente cadastrado ou pelo menos o nome do contato',
      });
    }

    // Validar e-mail se preenchido
    if (formData.emailContato && !isValidEmail(formData.emailContato)) {
      newErrors.push({ field: 'emailContato', message: 'E-mail inválido' });
    }

    // Validar telefone se preenchido (formato básico)
    if (formData.telefoneContato && !isValidPhone(formData.telefoneContato)) {
      newErrors.push({ field: 'telefoneContato', message: 'Telefone inválido' });
    }

    return newErrors;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    // Aceita telefones com 10 ou 11 dígitos (com ou sem DDD)
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  };

  // ========================================
  // HANDLERS
  // ========================================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpar erro do campo específico quando usuário começa a digitar
    setErrors((prev) => prev.filter((err) => err.field !== name));
  };

  const handleNumberChange = (name: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData((prev) => ({ ...prev, [name]: numValue }));
    setErrors((prev) => prev.filter((err) => err.field !== name));
  };

  const handleValorChange = (valor: number) => {
    setFormData((prev) => ({ ...prev, valor }));
    setErrors((prev) => prev.filter((err) => err.field !== 'valor'));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();

      // Evitar duplicatas
      if (!formData.tags?.includes(newTag)) {
        setFormData((prev) => ({
          ...prev,
          tags: [...(prev.tags || []), newTag],
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }));
  };

  const handleBuscaClienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setBuscaCliente(valor);
    setShowClienteDropdown(true);

    // Se limpar, resetar cliente selecionado
    if (!valor) {
      setClienteSelecionado(null);
      setFormData((prev) => ({
        ...prev,
        cliente_id: '',
        nomeContato: '',
        emailContato: '',
        telefoneContato: '',
        empresaContato: '',
      }));
    }
  };

  const handleSelecionarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setBuscaCliente(cliente.nome);
    setShowClienteDropdown(false);

    // Preencher formulário com dados do cliente
    setFormData((prev) => ({
      ...prev,
      cliente_id: cliente.id || '',
      nomeContato: cliente.nome,
      emailContato: cliente.email || '',
      telefoneContato: cliente.telefone || '',
      empresaContato: cliente.empresa || '',
    }));

    // Limpar erro de contato
    setErrors((prev) => prev.filter((err) => err.field !== 'contato'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar formulário
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      // Scroll para o topo para mostrar os erros
      const modalContent = document.querySelector('.modal-content');
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
      return;
    }

    try {
      setLoading(true);
      setErrors([]);

      const responsavelId = formData.responsavel_id || user?.id || '';

      if (!responsavelId) {
        setErrors([{ field: 'responsavel_id', message: 'Responsável é obrigatório' }]);
        setLoading(false);
        return;
      }

      const payload: NovaOportunidade = {
        ...formData,
        responsavel_id: responsavelId,
        cliente_id: formData.cliente_id?.trim() || '',
      };

      await onSave(payload);

      // Mostrar mensagem de sucesso
      setShowSuccessMessage(true);

      // Fechar modal após 1 segundo
      setTimeout(() => {
        setShowSuccessMessage(false);
        onClose();
      }, 1000);
    } catch (err: unknown) {
      console.error('Erro ao salvar oportunidade:', err);

      // Tratar erro da API
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar oportunidade';
      setErrors([{ field: 'general', message: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (loading) return; // Não permitir fechar enquanto está salvando

    // Verificar se há mudanças não salvas
    const hasChanges = oportunidade
      ? formData.titulo !== oportunidade.titulo ||
        formData.descricao !== (oportunidade.descricao || '') ||
        formData.valor !== Number(oportunidade.valor)
      : formData.titulo.trim() !== '' || formData.descricao.trim() !== '';

    if (hasChanges) {
      const confirmClose = await confirm('Você tem alterações não salvas. Deseja realmente fechar?');
      if (!confirmClose) return;
    }

    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') void handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleClose]);

  // ========================================
  // HELPERS
  // ========================================

  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const getFieldError = (field: string): string | undefined => {
    return errors.find((err) => err.field === field)?.message;
  };

  const generalError = errors.find((err) => err.field === 'general');

  // Calcular progresso do formulário
  const progressoPreenchimento = useMemo(() => {
    const camposObrigatorios = [
      formData.titulo,
      formData.responsavel_id,
      formData.cliente_id || formData.nomeContato,
    ];
    const camposOpcionais = [
      formData.descricao,
      formData.emailContato,
      formData.telefoneContato,
      formData.empresaContato,
      formData.dataFechamentoEsperado,
    ];

    const totalCampos = camposObrigatorios.length + camposOpcionais.length;
    const camposPreenchidos = [
      ...camposObrigatorios.filter(Boolean),
      ...camposOpcionais.filter(Boolean),
    ].length;

    return Math.round((camposPreenchidos / totalCampos) * 100);
  }, [formData]);

  // ========================================
  // RENDER
  // ========================================

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-oportunidade-title"
      onClick={() => void handleClose()}
    >
      <div
        className="bg-white rounded-xl w-[calc(100%-2rem)] sm:w-[700px] md:w-[900px] lg:w-[1000px] xl:w-[1100px] max-w-[1200px] max-h-[90vh] overflow-hidden shadow-2xl modal-content flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==================== HEADER ==================== */}
        <div className="sticky top-0 bg-white border-b border-[#DEEFE7] px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#159A9C]/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-[#159A9C]" />
            </div>
            <div>
              <h2 id="modal-oportunidade-title" className="text-2xl font-bold text-[#002333]">
                {oportunidade ? 'Editar Oportunidade' : 'Nova Oportunidade'}
              </h2>
              <p className="text-sm text-[#002333]/60 mt-0.5">
                {oportunidade ? `ID: ${oportunidade.id}` : 'Preencha os campos abaixo'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Indicador de progresso */}
            {!oportunidade && progressoPreenchimento > 0 && (
              <div className="hidden md:flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#159A9C] transition-all duration-300"
                    style={{ width: `${progressoPreenchimento}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-[#002333]/60">
                  {progressoPreenchimento}%
                </span>
              </div>
            )}

            <button
              onClick={handleClose}
              disabled={loading}
              type="button"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Fechar"
              aria-label="Fechar"
            >
              <X className="h-5 w-5 text-[#002333]" />
            </button>
          </div>
        </div>

        {/* ==================== TABS ==================== */}
        {oportunidade && (
          <div className="sticky top-[73px] bg-white border-b border-[#DEEFE7] z-10">
            <div className="px-6 flex gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('detalhes')}
                disabled={loading}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors disabled:opacity-50 ${
                  activeTab === 'detalhes'
                    ? 'border-[#159A9C] text-[#159A9C]'
                    : 'border-transparent text-[#002333]/60 hover:text-[#002333]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Detalhes
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('atividades')}
                disabled={loading}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors disabled:opacity-50 ${
                  activeTab === 'atividades'
                    ? 'border-[#159A9C] text-[#159A9C]'
                    : 'border-transparent text-[#002333]/60 hover:text-[#002333]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Atividades
                  {oportunidade.atividades && oportunidade.atividades.length > 0 && (
                    <span className="px-2 py-0.5 bg-[#159A9C]/10 text-[#159A9C] rounded-full text-xs font-semibold">
                      {oportunidade.atividades.length}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ==================== FORM CONTENT ==================== */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Mensagem de Sucesso */}
            {showSuccessMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 animate-fade-in">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Sucesso!</p>
                  <p className="text-sm text-green-700">
                    Oportunidade {oportunidade ? 'atualizada' : 'criada'} com sucesso
                  </p>
                </div>
              </div>
            )}

            {/* Erros Gerais */}
            {generalError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Erro ao salvar</p>
                  <p className="text-sm text-red-700">{generalError.message}</p>
                </div>
              </div>
            )}

            {/* Lista de Erros de Validação */}
            {errors.length > 0 && !generalError && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800 mb-2">
                      Corrija os seguintes erros:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {errors
                        .filter((err) => err.field !== 'general')
                        .map((err, idx) => (
                          <li key={idx} className="text-sm text-amber-700">
                            {err.message}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== ABA DETALHES ==================== */}
            {activeTab === 'detalhes' && (
              <>
                {/* Informações Básicas */}
                <div className="bg-[#DEEFE7]/30 rounded-lg p-6 border border-[#DEEFE7]">
                  <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#159A9C]" />
                    Informações Básicas
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Título */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#002333] mb-2">
                        Título <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="titulo"
                        value={formData.titulo}
                        onChange={handleChange}
                        placeholder="Ex: Implantação CRM - Empresa XYZ"
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm transition-colors ${
                          getFieldError('titulo')
                            ? 'border-red-300 bg-red-50'
                            : 'border-[#B4BEC9] bg-white'
                        }`}
                        required
                        disabled={loading}
                      />
                      {getFieldError('titulo') && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {getFieldError('titulo')}
                        </p>
                      )}
                    </div>

                    {/* Descrição */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#002333] mb-2">
                        Descrição
                      </label>
                      <textarea
                        name="descricao"
                        value={formData.descricao}
                        onChange={handleChange}
                        placeholder="Descreva os detalhes da oportunidade, requisitos, expectativas..."
                        rows={4}
                        className="w-full px-4 py-2.5 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm resize-none"
                        disabled={loading}
                      />
                      <p className="mt-1 text-xs text-[#002333]/60">
                        {formData.descricao.length}/500 caracteres
                      </p>
                    </div>

                    {/* Valor */}
                    <InputMoeda
                      value={formData.valor}
                      onChange={handleValorChange}
                      label="Valor Estimado"
                      placeholder="0,00"
                      required
                      disabled={loading}
                      error={getFieldError('valor')}
                      hint="Digite apenas números • Formatação automática"
                      name="valor"
                    />

                    {/* Probabilidade com Heat Map */}
                    <div>
                      <label className="block text-sm font-medium text-[#002333] mb-2">
                        Probabilidade de Fechamento <span className="text-red-600">*</span>
                      </label>

                      {/* Barra de Probabilidade com Gradiente */}
                      <div className="relative mb-3">
                        {/* Background gradiente (heat map) */}
                        <div className="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 via-green-400 to-green-600 opacity-20"></div>

                        {/* Slider */}
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={formData.probabilidade}
                          onChange={(e) => handleNumberChange('probabilidade', e.target.value)}
                          className="absolute top-0 w-full h-3 bg-transparent appearance-none cursor-pointer slider-heat"
                          disabled={loading}
                          style={{
                            background: `linear-gradient(to right, 
                              rgb(239 68 68) 0%, 
                              rgb(251 191 36) 25%, 
                              rgb(74 222 128) 50%, 
                              rgb(34 197 94) 75%, 
                              rgb(22 163 74) 100%) 0% / ${formData.probabilidade}% 100% no-repeat transparent`,
                          }}
                        />
                      </div>

                      {/* Indicador de valor e status */}
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                            formData.probabilidade <= 20
                              ? 'bg-red-100 text-red-700'
                              : formData.probabilidade <= 40
                                ? 'bg-orange-100 text-orange-700'
                                : formData.probabilidade <= 60
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : formData.probabilidade <= 80
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-green-200 text-green-800'
                          }`}
                        >
                          <TrendingUp className="h-4 w-4" />
                          <span>{formData.probabilidade}%</span>
                        </div>

                        <span
                          className={`text-xs font-medium ${
                            formData.probabilidade <= 20
                              ? 'text-red-600'
                              : formData.probabilidade <= 40
                                ? 'text-orange-600'
                                : formData.probabilidade <= 60
                                  ? 'text-yellow-600'
                                  : formData.probabilidade <= 80
                                    ? 'text-green-600'
                                    : 'text-green-700'
                          }`}
                        >
                          {formData.probabilidade <= 20
                            ? '❄️ Improvável'
                            : formData.probabilidade <= 40
                              ? '🌤️ Baixa'
                              : formData.probabilidade <= 60
                                ? '☀️ Moderada'
                                : formData.probabilidade <= 80
                                  ? '🔥 Alta'
                                  : '🚀 Muito Alta'}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs text-[#002333]/60">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Estágio */}
                    <div>
                      <label className="block text-sm font-medium text-[#002333] mb-2">
                        Estágio do Pipeline <span className="text-red-600">*</span>
                      </label>
                      <select
                        name="estagio"
                        value={formData.estagio}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm bg-white"
                        required
                        disabled={loading}
                      >
                        {Object.entries(ESTAGIOS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Prioridade */}
                    <div>
                      <label className="block text-sm font-medium text-[#002333] mb-2">
                        Prioridade <span className="text-red-600">*</span>
                      </label>
                      <select
                        name="prioridade"
                        value={formData.prioridade}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm bg-white"
                        required
                        disabled={loading}
                      >
                        {Object.entries(PRIORIDADES_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      {formData.prioridade && (
                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORIDADES_CORES[formData.prioridade]}`}
                          >
                            {PRIORIDADES_LABELS[formData.prioridade]}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Origem */}
                    <div>
                      <label className="block text-sm font-medium text-[#002333] mb-2">
                        Origem do Lead <span className="text-red-600">*</span>
                      </label>
                      <select
                        name="origem"
                        value={formData.origem}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm bg-white"
                        required
                        disabled={loading}
                      >
                        {Object.entries(ORIGENS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Data de Fechamento Esperado */}
                    <div>
                      <label className="block text-sm font-medium text-[#002333] mb-2">
                        Data de Fechamento Esperado
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <CalendarIcon className="h-4 w-4 text-[#002333]/60" />
                        </div>
                        <input
                          type="date"
                          name="dataFechamentoEsperado"
                          value={
                            typeof formData.dataFechamentoEsperado === 'string'
                              ? formData.dataFechamentoEsperado
                              : formData.dataFechamentoEsperado instanceof Date
                                ? formData.dataFechamentoEsperado.toISOString().split('T')[0]
                                : ''
                          }
                          onChange={handleChange}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full pl-10 pr-4 py-2.5 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm bg-white"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#002333] mb-2">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-[#159A9C]" />
                          Tags
                        </div>
                      </label>
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder="Digite uma tag e pressione Enter"
                        className="w-full px-4 py-2.5 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                        disabled={loading}
                      />
                      {formData.tags && formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#159A9C]/10 text-[#159A9C] rounded-full text-sm font-medium hover:bg-[#159A9C]/20 transition-colors"
                            >
                              <Tag className="h-3 w-3" />
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                disabled={loading}
                                className="hover:text-[#0F7B7D] disabled:opacity-50"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-xs text-[#002333]/60">
                        Use tags para categorizar e filtrar oportunidades
                      </p>
                    </div>
                  </div>
                </div>

                {/* Informações de Contato */}
                <div className="bg-blue-50/50 rounded-lg p-6 border border-blue-100">
                  <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Informações de Contato
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Cliente Cadastrado - Autocomplete */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#002333] mb-2">
                        Cliente Cadastrado
                      </label>
                      <div className="relative">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-[#002333]/60" />
                          </div>
                          <input
                            type="text"
                            value={buscaCliente}
                            onChange={handleBuscaClienteChange}
                            onFocus={() => setShowClienteDropdown(true)}
                            placeholder="Buscar cliente por nome, e-mail ou documento..."
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm ${
                              clienteSelecionado
                                ? 'border-green-300 bg-green-50'
                                : 'border-[#B4BEC9] bg-white'
                            }`}
                            disabled={loading || loadingClientes}
                          />
                          {loadingClientes && (
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                              <Loader2 className="h-4 w-4 animate-spin text-[#159A9C]" />
                            </div>
                          )}
                        </div>

                        {/* Dropdown de Clientes */}
                        {showClienteDropdown && clientesFiltrados.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-[#B4BEC9] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {clientesFiltrados.map((cliente) => (
                              <button
                                key={cliente.id}
                                type="button"
                                onClick={() => handleSelecionarCliente(cliente)}
                                className="w-full px-4 py-3 text-left hover:bg-[#DEEFE7] transition-colors border-b border-[#DEEFE7] last:border-b-0"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-[#002333]">
                                      {cliente.nome}
                                    </p>
                                    {cliente.email && (
                                      <p className="text-xs text-[#002333]/60 mt-0.5 flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {cliente.email}
                                      </p>
                                    )}
                                    {cliente.telefone && (
                                      <p className="text-xs text-[#002333]/60 mt-0.5 flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {cliente.telefone}
                                      </p>
                                    )}
                                  </div>
                                  {cliente.empresa && (
                                    <span className="text-xs text-[#002333]/40 flex items-center gap-1">
                                      <Building2 className="h-3 w-3" />
                                      {cliente.empresa}
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Estado vazio */}
                        {showClienteDropdown &&
                          buscaCliente &&
                          clientesFiltrados.length === 0 &&
                          !loadingClientes && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-[#B4BEC9] rounded-lg shadow-lg p-4 text-center">
                              <p className="text-sm text-[#002333]/60">Nenhum cliente encontrado</p>
                            </div>
                          )}
                      </div>

                      {clienteSelecionado ? (
                        <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Cliente selecionado: {clienteSelecionado.nome}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-[#002333]/60 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Ou preencha os dados do contato abaixo
                        </p>
                      )}
                    </div>

                    {/* Nome Contato */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#002333] mb-2">
                        Nome do Contato{' '}
                        {!formData.cliente_id && <span className="text-red-600">*</span>}
                      </label>
                      <input
                        type="text"
                        name="nomeContato"
                        value={formData.nomeContato}
                        onChange={handleChange}
                        placeholder="João Silva"
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm ${
                          getFieldError('contato')
                            ? 'border-red-300 bg-red-50'
                            : 'border-[#B4BEC9] bg-white'
                        }`}
                        disabled={loading}
                      />
                    </div>

                    {/* Email Contato */}
                    <div>
                      <label className="block text-sm font-medium text-[#002333] mb-2">
                        E-mail do Contato
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-[#002333]/60" />
                        </div>
                        <input
                          type="email"
                          name="emailContato"
                          value={formData.emailContato}
                          onChange={handleChange}
                          placeholder="joao@empresa.com.br"
                          className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm ${
                            getFieldError('emailContato')
                              ? 'border-red-300 bg-red-50'
                              : 'border-[#B4BEC9] bg-white'
                          }`}
                          disabled={loading}
                        />
                      </div>
                      {getFieldError('emailContato') && (
                        <p className="mt-1 text-xs text-red-600">{getFieldError('emailContato')}</p>
                      )}
                    </div>

                    {/* Telefone Contato */}
                    <div>
                      <label className="block text-sm font-medium text-[#002333] mb-2">
                        Telefone do Contato
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-[#002333]/60" />
                        </div>
                        <input
                          type="tel"
                          name="telefoneContato"
                          value={formData.telefoneContato}
                          onChange={handleChange}
                          placeholder="(11) 98765-4321"
                          className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm ${
                            getFieldError('telefoneContato')
                              ? 'border-red-300 bg-red-50'
                              : 'border-[#B4BEC9] bg-white'
                          }`}
                          disabled={loading}
                        />
                      </div>
                      {getFieldError('telefoneContato') && (
                        <p className="mt-1 text-xs text-red-600">
                          {getFieldError('telefoneContato')}
                        </p>
                      )}
                    </div>

                    {/* Empresa Contato */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#002333] mb-2">
                        Empresa do Contato
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Building2 className="h-4 w-4 text-[#002333]/60" />
                        </div>
                        <input
                          type="text"
                          name="empresaContato"
                          value={formData.empresaContato}
                          onChange={handleChange}
                          placeholder="Empresa XYZ Ltda"
                          className="w-full pl-10 pr-4 py-2.5 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm bg-white"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Responsável */}
                <div className="bg-purple-50/50 rounded-lg p-6 border border-purple-100">
                  <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-600" />
                    Atribuição
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-[#002333] mb-2">
                      Responsável pela Oportunidade <span className="text-red-600">*</span>
                    </label>
                    <select
                      name="responsavel_id"
                      value={formData.responsavel_id}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm bg-white ${
                        getFieldError('responsavel_id')
                          ? 'border-red-300 bg-red-50'
                          : 'border-[#B4BEC9]'
                      }`}
                      required
                      disabled={loading || loadingUsuarios}
                    >
                      <option value="">
                        {loadingUsuarios ? 'Carregando usuários...' : 'Selecione um responsável'}
                      </option>
                      {usuarios.map((usuario) => (
                        <option key={usuario.id} value={usuario.id}>
                          {usuario.nome} {usuario.id === user?.id ? '(Você)' : ''}
                        </option>
                      ))}
                    </select>
                    {getFieldError('responsavel_id') && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('responsavel_id')}
                      </p>
                    )}
                    {usuarios.length === 0 && !loadingUsuarios && (
                      <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Nenhum usuário disponível
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ==================== ABA ATIVIDADES ==================== */}
            {activeTab === 'atividades' && oportunidade && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-[#002333] flex items-center gap-2">
                    <Activity className="h-5 w-5 text-[#159A9C]" />
                    Histórico de Atividades
                  </h3>
                  <p className="text-sm text-[#002333]/60">
                    {oportunidade.atividades?.length || 0}{' '}
                    {(oportunidade.atividades?.length || 0) === 1 ? 'atividade' : 'atividades'}
                  </p>
                </div>

                {/* Timeline de Atividades */}
                {oportunidade.atividades && oportunidade.atividades.length > 0 ? (
                  <div className="relative">
                    {/* Linha vertical do timeline */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#DEEFE7]" />

                    {/* Lista de atividades */}
                    <div className="space-y-6">
                      {oportunidade.atividades.map((atividade, index) => (
                        <div key={atividade.id} className="relative flex gap-4">
                          {/* Ícone da atividade */}
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#159A9C]/10 border-2 border-white flex items-center justify-center relative z-10 shadow-sm">
                            <Activity className="h-5 w-5 text-[#159A9C]" />
                          </div>

                          {/* Conteúdo da atividade */}
                          <div className="flex-1 bg-white rounded-lg p-4 border border-[#DEEFE7] shadow-sm">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <p className="text-sm font-medium text-[#002333]">
                                {atividade.descricao}
                              </p>
                              <span className="text-xs text-[#002333]/60 whitespace-nowrap">
                                {new Date(atividade.dataAtividade).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            {/* Usuário responsável */}
                            {atividade.criadoPor && (
                              <p className="text-xs text-[#002333]/40 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {atividade.criadoPor.nome}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Estado vazio
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#DEEFE7] mb-4">
                      <Activity className="h-8 w-8 text-[#159A9C]/60" />
                    </div>
                    <p className="text-sm font-medium text-[#002333]/60 mb-1">
                      Nenhuma atividade registrada
                    </p>
                    <p className="text-xs text-[#002333]/40">
                      As atividades aparecerão aqui conforme você interage com a oportunidade
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ==================== FOOTER BUTTONS ==================== */}
          <div className="sticky bottom-0 bg-white border-t border-[#DEEFE7] px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {formData.valor > 0 && (
                <div className="hidden sm:block">
                  <p className="text-xs text-[#002333]/60">Valor estimado</p>
                  <p className="text-sm font-bold text-[#002333]">
                    {formatarMoeda(formData.valor)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {oportunidade ? 'Atualizar Oportunidade' : 'Criar Oportunidade'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalOportunidadeRefatorado;
