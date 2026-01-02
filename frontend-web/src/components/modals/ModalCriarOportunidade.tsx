import React, { useState, useEffect } from 'react';
import { clientesService, Cliente as ClienteAPI } from '../../services/clientesService';
import {
  X,
  User,
  Building2,
  Calendar,
  DollarSign,
  Target,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Clock,
  Tag,
  FileText,
  Plus,
  Search,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import './ModalCriarOportunidade.css';

interface ModalCriarOportunidadeProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (oportunidade: any) => void;
  isLoading?: boolean;
}

const estagios = [
  {
    value: 'leads',
    label: 'Leads',
    badgeClasses: 'bg-[#DEEFE7] text-[#002333] border border-[#B4BEC9]',
  },
  { value: 'qualification', label: 'Qualificação', badgeClasses: 'bg-[#B4BEC9] text-[#002333]' },
  { value: 'proposal', label: 'Proposta', badgeClasses: 'bg-[#159A9C] text-white' },
  { value: 'negotiation', label: 'Negociação', badgeClasses: 'bg-[#0F7B7D] text-white' },
  { value: 'closing', label: 'Fechamento', badgeClasses: 'bg-[#002333] text-white' },
  { value: 'won', label: 'Ganho', badgeClasses: 'bg-[#159A9C] text-white' },
  {
    value: 'lost',
    label: 'Perdido',
    badgeClasses: 'bg-white text-[#002333] border border-[#B4BEC9]',
  },
];

const prioridades = [
  { value: 'low', label: 'Baixa', textClasses: 'text-[#159A9C]' },
  { value: 'medium', label: 'Média', textClasses: 'text-[#0F7B7D]' },
  { value: 'high', label: 'Alta', textClasses: 'text-[#002333]' },
];

const origens = [
  { value: 'website', label: 'Website' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'email', label: 'E-mail' },
  { value: 'redes_sociais', label: 'Redes Sociais' },
  { value: 'evento', label: 'Evento' },
  { value: 'parceiro', label: 'Parceiro' },
  { value: 'campanha', label: 'Campanha' },
];

const getStageBadgeClasses = (stageValue: string) =>
  estagios.find((estagio) => estagio.value === stageValue)?.badgeClasses ??
  'bg-[#DEEFE7] text-[#002333] border border-[#B4BEC9]';

const getClienteStatusBadgeClasses = (status?: string | null) => {
  switch (status) {
    case 'cliente':
      return 'bg-[#159A9C] text-white';
    case 'lead':
      return 'bg-[#B4BEC9] text-[#002333]';
    case 'prospect':
      return 'bg-white text-[#002333] border border-[#B4BEC9]';
    default:
      return 'bg-[#DEEFE7] text-[#002333]';
  }
};

const getQualityBarClasses = (score: number) => {
  if (score >= 80) return 'bg-[#159A9C]';
  if (score >= 60) return 'bg-[#0F7B7D]';
  return 'bg-[#002333]';
};

const getQualityLabel = (score: number) => {
  if (score >= 80) return '🎯 Excelente';
  if (score >= 60) return '⚡ Boa';
  return '🔧 Precisa melhorar';
};

export const ModalCriarOportunidade: React.FC<ModalCriarOportunidadeProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    valor: '',
    probabilidade: 50,
    estagio: 'leads',
    prioridade: 'medium',
    origem: 'website',
    dataFechamentoEsperado: '',

    // Cliente ou contato
    clienteExistente: null as ClienteAPI | null,
    nomeContato: '',
    emailContato: '',
    telefoneContato: '',
    empresaContato: '',

    // Tags
    tags: [] as string[],
    novaTag: '',
  });

  const [step, setStep] = useState(1);
  const [searchCliente, setSearchCliente] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [tipoContato, setTipoContato] = useState<'existente' | 'novo'>('existente');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clientes, setClientes] = useState<ClienteAPI[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);

  // Sugestões inteligentes de probabilidade baseadas no estágio (inspirado no Salesforce)
  const getSuggestedProbability = (estagio: string): number => {
    const probabilities: Record<string, number> = {
      leads: 20,
      qualification: 40,
      proposal: 65,
      negotiation: 80,
      closing: 90,
      won: 100,
      lost: 0,
    };
    return probabilities[estagio] || 50;
  };

  // Sistema de pontuação de qualidade da oportunidade (inspirado no HubSpot)
  const calculateQualityScore = (): { score: number; feedback: string[] } => {
    let score = 0;
    const feedback: string[] = [];

    // Título (10 pontos)
    if (formData.titulo && formData.titulo.length >= 5) {
      score += 10;
    } else {
      feedback.push('Adicione um título mais descritivo');
    }

    // Valor (15 pontos)
    if (formData.valor && formData.valor.trim() !== '' && formData.valor !== 'R$ ') {
      const numericValue = parseFloat(formData.valor.replace(/[^\d,]/g, '').replace(',', '.'));
      if (!isNaN(numericValue) && numericValue > 0) {
        score += 15;
      }
    } else {
      feedback.push('Defina o valor da oportunidade');
    }

    // Data de fechamento (10 pontos)
    if (formData.dataFechamentoEsperado) {
      score += 10;
    } else {
      feedback.push('Defina uma data de fechamento');
    }

    // Probabilidade realista (15 pontos)
    const suggestedProb = getSuggestedProbability(formData.estagio);
    if (Math.abs(formData.probabilidade - suggestedProb) <= 20) {
      score += 15;
    } else {
      feedback.push('Ajuste a probabilidade para o estágio atual');
    }

    // Contato completo (25 pontos)
    if (tipoContato === 'existente' && formData.clienteExistente) {
      score += 25;
    } else if (tipoContato === 'novo') {
      let contactScore = 0;
      if (formData.nomeContato) contactScore += 8;
      if (formData.emailContato && !errors.emailContato) contactScore += 10;
      if (formData.telefoneContato && !errors.telefoneContato) contactScore += 4;
      if (formData.empresaContato) contactScore += 3;
      score += contactScore;

      if (contactScore < 25) {
        feedback.push('Complete as informações de contato');
      }
    }

    // Descrição (10 pontos)
    if (formData.descricao && formData.descricao.length >= 20) {
      score += 10;
    } else {
      feedback.push('Adicione uma descrição detalhada');
    }

    // Tags (15 pontos)
    if (formData.tags.length >= 2) {
      score += 15;
    } else {
      feedback.push('Adicione tags para melhor categorização');
    }

    return { score, feedback };
  };

  const { score: qualityScore, feedback: qualityFeedback } = calculateQualityScore();
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#159A9C]';
    if (score >= 60) return 'text-[#0F7B7D]';
    return 'text-[#002333]';
  };

  // Buscar clientes da API
  const buscarClientes = async (termo: string = '') => {
    if (loadingClientes) return;

    setLoadingClientes(true);
    try {
      let clientesData: ClienteAPI[] = [];

      if (termo.trim()) {
        // Se há termo de busca, usar search
        clientesData = await clientesService.searchClientes(termo);
      } else {
        // Senão, buscar todos (limitado)
        const response = await clientesService.getClientes({ limit: 50 });
        clientesData = response.data;
      }

      setClientes(clientesData);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setClientes([]);
    } finally {
      setLoadingClientes(false);
    }
  };

  // Auto-ajuste da probabilidade quando o estágio muda
  useEffect(() => {
    const suggestedProb = getSuggestedProbability(formData.estagio);
    if (Math.abs(formData.probabilidade - suggestedProb) > 20) {
      setFormData((prev) => ({ ...prev, probabilidade: suggestedProb }));
    }
  }, [formData.estagio]);

  // Buscar clientes ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      buscarClientes();
    }
  }, [isOpen]);

  // Buscar clientes quando o termo de busca muda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchCliente) {
        buscarClientes(searchCliente);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timer);
  }, [searchCliente]);

  const clientesFiltrados = clientes.filter(
    (cliente) =>
      cliente.nome.toLowerCase().includes(searchCliente.toLowerCase()) ||
      (cliente.empresa && cliente.empresa.toLowerCase().includes(searchCliente.toLowerCase())) ||
      cliente.email.toLowerCase().includes(searchCliente.toLowerCase()),
  );

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      valor: '',
      probabilidade: 50,
      estagio: 'leads',
      prioridade: 'medium',
      origem: 'website',
      dataFechamentoEsperado: '',
      clienteExistente: null,
      nomeContato: '',
      emailContato: '',
      telefoneContato: '',
      empresaContato: '',
      tags: [],
      novaTag: '',
    });
    setStep(1);
    setSearchCliente('');
    setTipoContato('existente');
    setErrors({});
    setClientes([]);
    setShowClienteDropdown(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Validações avançadas inspiradas em Salesforce, HubSpot e Pipedrive
  const validateField = (fieldName: string, value: any): string => {
    switch (fieldName) {
      case 'titulo':
        if (!value || value.trim().length === 0) {
          return 'Título é obrigatório';
        }
        if (value.length < 3) {
          return 'Título deve ter pelo menos 3 caracteres';
        }
        if (value.length > 255) {
          return 'Título deve ter no máximo 255 caracteres';
        }
        // Regex para caracteres especiais perigosos
        if (/[<>\"'&]/.test(value)) {
          return 'Título contém caracteres inválidos';
        }
        return '';

      case 'valor':
        if (!value || value.trim() === '' || value.trim() === 'R$') {
          return 'Valor é obrigatório';
        }
        const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
        if (!cleanValue) {
          return 'Valor é obrigatório';
        }
        const numericValue = parseFloat(cleanValue);
        if (isNaN(numericValue)) {
          return 'Valor deve ser um número válido';
        }
        if (numericValue < 0) {
          return 'Valor não pode ser negativo';
        }
        if (numericValue > 999999999.99) {
          return 'Valor muito alto (máximo: R$ 999.999.999,99)';
        }
        return '';

      case 'probabilidade':
        if (value < 0 || value > 100) {
          return 'Probabilidade deve estar entre 0% e 100%';
        }
        return '';

      case 'dataFechamentoEsperado':
        if (!value) {
          return 'Data de fechamento é obrigatória';
        }
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
          return 'Data de fechamento não pode ser no passado';
        }

        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 5);
        if (selectedDate > maxDate) {
          return 'Data de fechamento muito distante (máximo 5 anos)';
        }
        return '';

      case 'nomeContato':
        if (tipoContato === 'novo' && (!value || value.trim().length === 0)) {
          return 'Nome do contato é obrigatório';
        }
        if (value && value.length < 2) {
          return 'Nome deve ter pelo menos 2 caracteres';
        }
        if (value && value.length > 100) {
          return 'Nome deve ter no máximo 100 caracteres';
        }
        // Regex para validar nome (apenas letras, espaços e alguns caracteres especiais)
        if (value && !/^[a-zA-ZÀ-ÿ\s\-\'\.]+$/.test(value)) {
          return 'Nome contém caracteres inválidos';
        }
        return '';

      case 'emailContato':
        if (tipoContato === 'novo' && (!value || value.trim().length === 0)) {
          return 'E-mail do contato é obrigatório';
        }
        if (value) {
          // Regex robusta para validação de email
          const emailRegex =
            /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
          if (!emailRegex.test(value)) {
            return 'E-mail inválido';
          }
          if (value.length > 254) {
            return 'E-mail muito longo';
          }
        }
        return '';

      case 'telefoneContato':
        if (value) {
          // Remove formatação para validação
          const cleanPhone = value.replace(/\D/g, '');
          if (cleanPhone.length < 10) {
            return 'Telefone deve ter pelo menos 10 dígitos';
          }
          if (cleanPhone.length > 15) {
            return 'Telefone deve ter no máximo 15 dígitos';
          }
          // Validação básica de DDD brasileiro
          if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
            const ddd = cleanPhone.substring(0, 2);
            const validDDDs = [
              '11',
              '12',
              '13',
              '14',
              '15',
              '16',
              '17',
              '18',
              '19',
              '21',
              '22',
              '24',
              '27',
              '28',
              '31',
              '32',
              '33',
              '34',
              '35',
              '37',
              '38',
              '41',
              '42',
              '43',
              '44',
              '45',
              '46',
              '47',
              '48',
              '49',
              '51',
              '53',
              '54',
              '55',
              '61',
              '62',
              '63',
              '64',
              '65',
              '66',
              '67',
              '68',
              '69',
              '71',
              '73',
              '74',
              '75',
              '77',
              '79',
              '81',
              '82',
              '83',
              '84',
              '85',
              '86',
              '87',
              '88',
              '89',
              '91',
              '92',
              '93',
              '94',
              '95',
              '96',
              '97',
              '98',
              '99',
            ];
            if (!validDDDs.includes(ddd)) {
              return 'DDD inválido';
            }
          }
        }
        return '';

      case 'empresaContato':
        if (tipoContato === 'novo' && (!value || value.trim().length === 0)) {
          return 'Empresa do contato é obrigatória';
        }
        if (value && value.length < 2) {
          return 'Nome da empresa deve ter pelo menos 2 caracteres';
        }
        if (value && value.length > 200) {
          return 'Nome da empresa deve ter no máximo 200 caracteres';
        }
        return '';

      case 'clienteExistente':
        if (tipoContato === 'existente' && !value) {
          return 'Selecione um cliente existente';
        }
        return '';

      case 'descricao':
        if (value && value.length > 1000) {
          return 'Descrição deve ter no máximo 1000 caracteres';
        }
        return '';

      default:
        return '';
    }
  };

  // Formatação automática de campos (como nos melhores CRMs)
  const formatCurrency = (value: string): string => {
    // Remove todos os caracteres não numéricos
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue || numericValue === '0') return '';

    // Converte para número e formata
    const formattedValue = (parseInt(numericValue) / 100).toFixed(2);
    return formattedValue.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatPhone = (value: string): string => {
    const cleanValue = value.replace(/\D/g, '');

    if (cleanValue.length <= 10) {
      return cleanValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  const handleInputChange = (fieldName: string, value: any) => {
    let formattedValue = value;

    // Aplicar formatação automática
    if (fieldName === 'valor') {
      // Remove o "R$ " se existir para evitar formatação dupla
      const cleanValue = value.replace(/^R\$\s*/, '');
      const formatted = formatCurrency(cleanValue);
      formattedValue = formatted ? `R$ ${formatted}` : '';
    } else if (fieldName === 'telefoneContato') {
      formattedValue = formatPhone(value);
    } else if (fieldName === 'nomeContato' || fieldName === 'empresaContato') {
      // Capitalizar primeira letra de cada palavra
      formattedValue = value.replace(/\b\w/g, (l: string) => l.toUpperCase());
    } else if (fieldName === 'emailContato') {
      // Converter para minúsculas
      formattedValue = value.toLowerCase();
    }

    setFormData((prev) => ({ ...prev, [fieldName]: formattedValue }));

    // Validação em tempo real
    const error = validateField(fieldName, formattedValue);
    setErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));
  };

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      // Validações do Passo 1
      newErrors.titulo = validateField('titulo', formData.titulo);
      newErrors.valor = validateField('valor', formData.valor);
      newErrors.probabilidade = validateField('probabilidade', formData.probabilidade);
      newErrors.dataFechamentoEsperado = validateField(
        'dataFechamentoEsperado',
        formData.dataFechamentoEsperado,
      );
      newErrors.descricao = validateField('descricao', formData.descricao);

      // Validação de lógica de negócio (inspirada no Salesforce)
      if (formData.estagio === 'won' && formData.probabilidade < 100) {
        newErrors.probabilidade = 'Oportunidades ganhas devem ter 100% de probabilidade';
      }
      if (formData.estagio === 'lost' && formData.probabilidade > 0) {
        newErrors.probabilidade = 'Oportunidades perdidas devem ter 0% de probabilidade';
      }
    }

    if (stepNumber === 2) {
      // Validações do Passo 2
      if (tipoContato === 'existente') {
        newErrors.clienteExistente = validateField('clienteExistente', formData.clienteExistente);
      } else {
        newErrors.nomeContato = validateField('nomeContato', formData.nomeContato);
        newErrors.emailContato = validateField('emailContato', formData.emailContato);
        newErrors.telefoneContato = validateField('telefoneContato', formData.telefoneContato);
        newErrors.empresaContato = validateField('empresaContato', formData.empresaContato);
      }
    }

    // Filtrar erros vazios
    const filteredErrors = Object.fromEntries(
      Object.entries(newErrors).filter(([_, value]) => value !== ''),
    );

    setErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  };

  const validateStep_old = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.titulo.trim()) {
        newErrors.titulo = 'Título é obrigatório';
      }
      if (!formData.valor) {
        newErrors.valor = 'Valor é obrigatório';
      }
    }

    if (stepNumber === 2) {
      if (tipoContato === 'existente' && !formData.clienteExistente) {
        newErrors.clienteExistente = 'Selecione um cliente';
      }
      if (tipoContato === 'novo') {
        if (!formData.nomeContato.trim()) {
          newErrors.nomeContato = 'Nome do contato é obrigatório';
        }
        if (!formData.emailContato.trim()) {
          newErrors.emailContato = 'E-mail é obrigatório';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
    setErrors({});
  };

  const handleSelectCliente = (cliente: ClienteAPI) => {
    setFormData((prev) => ({ ...prev, clienteExistente: cliente }));
    setSearchCliente(cliente.nome);
    setShowClienteDropdown(false);
  };

  const handleAddTag = () => {
    if (formData.novaTag.trim() && !formData.tags.includes(formData.novaTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, prev.novaTag.trim()],
        novaTag: '',
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = () => {
    if (validateStep(1) && validateStep(2)) {
      const cleanValue = formData.valor.replace(/[^\d,]/g, '').replace(',', '.');
      const numericValue = parseFloat(cleanValue);

      const oportunidadeData = {
        titulo: formData.titulo,
        descricao: formData.descricao || undefined,
        valor: !isNaN(numericValue) ? numericValue : 0,
        probabilidade: formData.probabilidade,
        estagio: formData.estagio, // 'leads', 'qualification', etc.
        prioridade: formData.prioridade, // 'low', 'medium', 'high'
        origem: formData.origem, // 'website', 'indicacao', etc.
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        dataFechamentoEsperado: formData.dataFechamentoEsperado || undefined,
        responsavel_id: 'a47ac10b-58cc-4372-a567-0e02b2c3d480', // ID do usuário admin (string)
        cliente_id: formData.clienteExistente?.id || undefined,
        nomeContato: tipoContato === 'novo' ? formData.nomeContato : undefined,
        emailContato: tipoContato === 'novo' ? formData.emailContato : undefined,
        telefoneContato: tipoContato === 'novo' ? formData.telefoneContato : undefined,
        empresaContato: tipoContato === 'novo' ? formData.empresaContato : undefined,
      };

      console.log('🔍 Dados detalhados a serem enviados:', {
        ...oportunidadeData,
        tipos: {
          titulo: typeof oportunidadeData.titulo,
          valor: typeof oportunidadeData.valor,
          probabilidade: typeof oportunidadeData.probabilidade,
          estagio: typeof oportunidadeData.estagio,
          prioridade: typeof oportunidadeData.prioridade,
          origem: typeof oportunidadeData.origem,
          responsavel_id: typeof oportunidadeData.responsavel_id,
          cliente_id: typeof oportunidadeData.cliente_id,
        },
      });
      onSave(oportunidadeData);
    }
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="modal-criar-oportunidade bg-white rounded-xl shadow-2xl w-[calc(100%-2rem)] sm:w-[700px] md:w-[900px] lg:w-[1100px] xl:w-[1200px] max-w-[1400px] max-h-[85vh] min-h-[600px] overflow-hidden flex flex-col my-4">
        {/* Header */}
        <div className="header-gradient flex items-center justify-between p-6 border-b border-[#DEEFE7]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Nova Oportunidade</h2>
              <p className="text-white text-opacity-80 text-sm">
                Passo {step} de 3 -{' '}
                {step === 1
                  ? 'Informações Básicas'
                  : step === 2
                    ? 'Cliente & Contato'
                    : 'Finalização'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-white border-b border-[#DEEFE7]">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`progress-step w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber
                      ? step === stepNumber
                        ? 'active'
                        : 'completed'
                      : 'bg-[#DEEFE7] text-[#B4BEC9]'
                  }`}
                >
                  {step > stepNumber ? <CheckCircle2 className="w-4 h-4" /> : stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`progress-line w-24 h-1 mx-2 ${
                      step > stepNumber ? 'completed' : ''
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div
          className="p-6 flex-1 overflow-y-auto custom-scrollbar"
          style={{ maxHeight: 'calc(100vh - 280px)' }}
        >
          {/* Step 1: Informações Básicas */}
          {step === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Coluna Esquerda */}
              <div className="space-y-6">
                <div className="bg-white border border-[#DEEFE7] p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-[#159A9C]" />
                    Detalhes da Oportunidade
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#002333] mb-2">
                        Título da Oportunidade *
                      </label>
                      <input
                        type="text"
                        value={formData.titulo}
                        onChange={(e) => handleInputChange('titulo', e.target.value)}
                        className={`form-input w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                          errors.titulo ? 'error border-red-300' : 'border-[#B4BEC9]'
                        }`}
                        placeholder="Ex: Sistema CRM para empresa ABC"
                      />
                      {errors.titulo && (
                        <p className="error-message mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.titulo}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#002333] mb-2">
                        Descrição
                      </label>
                      <textarea
                        value={formData.descricao}
                        onChange={(e) => handleInputChange('descricao', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                        placeholder="Descreva os detalhes da oportunidade..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#002333] mb-2">
                          Valor Estimado *
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B4BEC9]" />
                          {/* PADRÃO OBRIGATÓRIO: Formatação automática igual à documentação do sistema */}
                          <input
                            type="text" // SEMPRE text, nunca number para campos monetários
                            value={formData.valor}
                            onChange={(e) => handleInputChange('valor', e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                              errors.valor ? 'border-red-300' : 'border-[#B4BEC9]'
                            }`}
                            placeholder="R$ 0,00"
                          />
                        </div>
                        {errors.valor && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.valor}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#002333] mb-2">
                          Data de Fechamento Esperada *
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B4BEC9]" />
                          <input
                            type="date"
                            value={formData.dataFechamentoEsperado}
                            onChange={(e) =>
                              handleInputChange('dataFechamentoEsperado', e.target.value)
                            }
                            className={`form-input w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                              errors.dataFechamentoEsperado
                                ? 'error border-red-300'
                                : 'border-[#B4BEC9]'
                            }`}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        {errors.dataFechamentoEsperado && (
                          <p className="error-message mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.dataFechamentoEsperado}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-[#B4BEC9]">
                          💡 Dica: Oportunidades com prazo definido têm 40% mais chance de
                          fechamento
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna Direita */}
              <div className="space-y-6">
                <div className="bg-white border border-[#DEEFE7] p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-[#159A9C]" />
                    Configurações de Vendas
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#002333] mb-2">
                        Estágio do Pipeline
                      </label>
                      <select
                        value={formData.estagio}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, estagio: e.target.value }))
                        }
                        className="w-full px-4 py-3 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                      >
                        {estagios.map((estagio) => (
                          <option key={estagio.value} value={estagio.value}>
                            {estagio.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#002333] mb-2">
                        Probabilidade de Fechamento: {formData.probabilidade}%
                        {formData.probabilidade >= 80 && (
                          <span className="ml-2 text-xs text-[#159A9C]">🎯 Alta probabilidade</span>
                        )}
                        {formData.probabilidade <= 20 && (
                          <span className="ml-2 text-xs text-[#002333] opacity-70">
                            ⚠️ Baixa probabilidade
                          </span>
                        )}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.probabilidade}
                        onChange={(e) =>
                          handleInputChange('probabilidade', parseInt(e.target.value))
                        }
                        className="probability-slider w-full h-2 bg-[#DEEFE7] rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #159A9C 0%, #159A9C ${formData.probabilidade}%, #DEEFE7 ${formData.probabilidade}%, #DEEFE7 100%)`,
                        }}
                      />
                      <div className="flex justify-between text-xs text-[#B4BEC9] mt-1">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                      {errors.probabilidade && (
                        <p className="error-message mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.probabilidade}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-[#B4BEC9]">
                        💡 Ajuste baseado no estágio: Leads (10-30%), Qualificação (30-50%),
                        Proposta (50-80%)
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#002333] mb-2">
                          Prioridade
                        </label>
                        <select
                          value={formData.prioridade}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, prioridade: e.target.value }))
                          }
                          className="w-full px-4 py-3 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                        >
                          {prioridades.map((prioridade) => (
                            <option key={prioridade.value} value={prioridade.value}>
                              {prioridade.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#002333] mb-2">
                          Origem
                        </label>
                        <select
                          value={formData.origem}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, origem: e.target.value }))
                          }
                          className="w-full px-4 py-3 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                        >
                          {origens.map((origem) => (
                            <option key={origem.value} value={origem.value}>
                              {origem.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview Card */}
                <div className="bg-white border-2 border-dashed border-[#DEEFE7] p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-[#0F7B7D] mb-3">
                    Preview da Oportunidade
                  </h4>
                  <div className="space-y-2">
                    <div className="font-medium text-[#002333]">
                      {formData.titulo || 'Título da oportunidade'}
                    </div>
                    <div className="text-2xl font-bold text-[#159A9C]">
                      {formData.valor || 'R$ 0,00'}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStageBadgeClasses(formData.estagio)}`}
                      >
                        {estagios.find((e) => e.value === formData.estagio)?.label}
                      </span>
                      <span className="text-sm text-[#B4BEC9]">
                        {formData.probabilidade}% de chance
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Cliente & Contato */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Tipo de Contato */}
              <div className="bg-white border border-[#DEEFE7] p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-[#159A9C]" />
                  Informações do Cliente
                </h3>

                <div className="flex space-x-4 mb-6">
                  <button
                    onClick={() => setTipoContato('existente')}
                    className={`contact-type-button px-6 py-3 rounded-lg font-medium transition-colors ${
                      tipoContato === 'existente'
                        ? 'active'
                        : 'bg-white text-[#0F7B7D] border border-[#B4BEC9] hover:border-[#159A9C]'
                    }`}
                  >
                    Cliente Existente
                  </button>
                  <button
                    onClick={() => setTipoContato('novo')}
                    className={`contact-type-button px-6 py-3 rounded-lg font-medium transition-colors ${
                      tipoContato === 'novo'
                        ? 'active'
                        : 'bg-white text-[#0F7B7D] border border-[#B4BEC9] hover:border-[#159A9C]'
                    }`}
                  >
                    Novo Contato
                  </button>
                </div>

                {tipoContato === 'existente' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#002333] mb-2">
                        Buscar Cliente *
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B4BEC9]" />
                        <input
                          type="text"
                          value={searchCliente}
                          onChange={(e) => {
                            setSearchCliente(e.target.value);
                            setShowClienteDropdown(true);
                          }}
                          onFocus={() => setShowClienteDropdown(true)}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                            errors.clienteExistente ? 'border-red-300' : 'border-[#B4BEC9]'
                          }`}
                          placeholder="Digite o nome ou empresa do cliente..."
                        />
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B4BEC9]" />
                      </div>

                      {showClienteDropdown && (
                        <div className="cliente-dropdown absolute z-10 w-full mt-1">
                          {loadingClientes ? (
                            <div className="p-4 text-center text-[#B4BEC9]">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#159A9C] mx-auto mb-2"></div>
                              Buscando clientes...
                            </div>
                          ) : clientesFiltrados.length > 0 ? (
                            clientesFiltrados.map((cliente) => (
                              <div
                                key={cliente.id}
                                onClick={() => handleSelectCliente(cliente)}
                                className="cliente-dropdown-item"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-[#002333]">{cliente.nome}</div>
                                    <div className="text-sm text-[#B4BEC9]">
                                      {cliente.empresa || 'Sem empresa'}
                                    </div>
                                    <div className="text-sm text-[#B4BEC9]">{cliente.email}</div>
                                  </div>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getClienteStatusBadgeClasses(cliente.status)}`}
                                  >
                                    {cliente.status}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : searchCliente ? (
                            <div className="p-4 text-center text-[#B4BEC9]">
                              Nenhum cliente encontrado para "{searchCliente}"
                            </div>
                          ) : (
                            <div className="p-4 text-center text-[#B4BEC9]">
                              Digite para buscar clientes...
                            </div>
                          )}
                        </div>
                      )}

                      {errors.clienteExistente && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.clienteExistente}
                        </p>
                      )}
                    </div>

                    {formData.clienteExistente && (
                      <div className="bg-white p-4 rounded-lg border border-[#DEEFE7]">
                        <h4 className="text-sm font-medium text-[#0F7B7D] mb-3">
                          Cliente Selecionado
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-[#B4BEC9]" />
                            <span className="font-medium">{formData.clienteExistente.nome}</span>
                          </div>
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 mr-2 text-[#B4BEC9]" />
                            <span className="text-[#0F7B7D]">
                              {formData.clienteExistente.empresa}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-[#B4BEC9]" />
                            <span className="text-[#0F7B7D]">
                              {formData.clienteExistente.email}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-[#B4BEC9]" />
                            <span className="text-[#0F7B7D]">
                              {formData.clienteExistente.telefone}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#002333] mb-2">
                          Nome do Contato *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B4BEC9]" />
                          <input
                            type="text"
                            value={formData.nomeContato}
                            onChange={(e) => handleInputChange('nomeContato', e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                              errors.nomeContato ? 'border-red-300' : 'border-[#B4BEC9]'
                            }`}
                            placeholder="Nome completo"
                          />
                        </div>
                        {errors.nomeContato && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.nomeContato}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#002333] mb-2">
                          E-mail *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B4BEC9]" />
                          <input
                            type="email"
                            value={formData.emailContato}
                            onChange={(e) => handleInputChange('emailContato', e.target.value)}
                            className={`form-input w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                              errors.emailContato
                                ? 'error border-red-300'
                                : formData.emailContato && !errors.emailContato
                                  ? 'border-[#159A9C]'
                                  : 'border-[#B4BEC9]'
                            }`}
                            placeholder="email@empresa.com"
                          />
                          {formData.emailContato && !errors.emailContato && (
                            <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#159A9C]" />
                          )}
                        </div>
                        {errors.emailContato && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.emailContato}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#002333] mb-2">
                          Telefone
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B4BEC9]" />
                          <input
                            type="tel"
                            value={formData.telefoneContato}
                            onChange={(e) => handleInputChange('telefoneContato', e.target.value)}
                            className={`form-input w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                              errors.telefoneContato
                                ? 'error border-red-300'
                                : formData.telefoneContato &&
                                    !errors.telefoneContato &&
                                    formData.telefoneContato.length > 10
                                  ? 'border-[#159A9C]'
                                  : 'border-[#B4BEC9]'
                            }`}
                            placeholder="(11) 99999-9999"
                          />
                          {formData.telefoneContato &&
                            !errors.telefoneContato &&
                            formData.telefoneContato.length > 10 && (
                              <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#159A9C]" />
                            )}
                        </div>
                        {errors.telefoneContato && (
                          <p className="error-message mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.telefoneContato}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#002333] mb-2">
                          Empresa
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B4BEC9]" />
                          <input
                            type="text"
                            value={formData.empresaContato}
                            onChange={(e) => handleInputChange('empresaContato', e.target.value)}
                            className={`form-input w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                              errors.empresaContato ? 'error border-red-300' : 'border-[#B4BEC9]'
                            }`}
                            placeholder="Nome da empresa"
                          />
                        </div>
                        {errors.empresaContato && (
                          <p className="error-message mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.empresaContato}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Finalização */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Widget de Qualidade da Oportunidade */}
              <div className="bg-white border border-[#DEEFE7] p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-[#159A9C]" />
                  Qualidade da Oportunidade
                </h3>
                <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0 mb-4">
                  <div className="flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border-4 border-[#DEEFE7] flex items-center justify-center bg-[#DEEFE7] bg-opacity-40">
                      <span className={`text-2xl font-bold ${getScoreColor(qualityScore)}`}>
                        {qualityScore}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#002333]">Score de Qualidade</span>
                      <span className={`text-sm font-semibold ${getScoreColor(qualityScore)}`}>
                        {getQualityLabel(qualityScore)}
                      </span>
                    </div>
                    <div className="w-full bg-[#DEEFE7] rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getQualityBarClasses(qualityScore)}`}
                        style={{ width: `${qualityScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {qualityFeedback.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-[#002333]">
                      💡 Sugestões de melhoria:
                    </h4>
                    <ul className="space-y-1">
                      {qualityFeedback.map((suggestion, index) => (
                        <li key={index} className="text-sm text-[#0F7B7D] flex items-center">
                          <span className="w-1.5 h-1.5 bg-[#159A9C] rounded-full mr-2" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="bg-white border border-[#DEEFE7] p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-[#159A9C]" />
                  Tags e Categorização
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#002333] mb-2">
                      Tags (opcional)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={formData.novaTag}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, novaTag: e.target.value }))
                        }
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        className="flex-1 px-4 py-3 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                        placeholder="Digite uma tag e pressione Enter"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-4 py-3 bg-[#159A9C] text-white rounded-lg hover:bg-[#127577] transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    {formData.tags.length > 0 && (
                      <div className="tag-input flex flex-wrap gap-2 mt-3 min-h-0 p-2">
                        {formData.tags.map((tag, index) => (
                          <span key={index} className="tag-item">
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="tag-remove ml-2"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Resumo Final */}
              <div className="preview-card bg-white border border-[#DEEFE7] p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center">
                  <CheckCircle2 className="w-5 h-5 mr-2 text-[#159A9C]" />
                  Resumo da Oportunidade
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-[#0F7B7D]">Título:</span>
                      <div className="text-[#002333]">{formData.titulo}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[#0F7B7D]">Valor:</span>
                      <div className="text-2xl font-bold text-[#159A9C]">
                        {formData.valor || 'R$ 0,00'}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[#0F7B7D]">Estágio:</span>
                      <div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStageBadgeClasses(formData.estagio)}`}
                        >
                          {estagios.find((e) => e.value === formData.estagio)?.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-[#0F7B7D]">Cliente:</span>
                      <div className="text-[#002333]">
                        {formData.clienteExistente
                          ? formData.clienteExistente.nome
                          : formData.nomeContato}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[#0F7B7D]">Empresa:</span>
                      <div className="text-[#002333]">
                        {formData.clienteExistente
                          ? formData.clienteExistente.empresa
                          : formData.empresaContato}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[#0F7B7D]">Probabilidade:</span>
                      <div className="text-[#002333]">{formData.probabilidade}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[#DEEFE7] bg-white">
          <div className="flex space-x-3">
            {step > 1 && (
              <button
                onClick={handlePrevStep}
                className="px-6 py-3 border border-[#B4BEC9] text-[#002333] rounded-lg hover:bg-[#DEEFE7] transition-colors"
              >
                Voltar
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-6 py-3 border border-[#B4BEC9] text-[#002333] rounded-lg hover:bg-[#DEEFE7] transition-colors"
            >
              Cancelar
            </button>

            {step < 3 ? (
              <button
                onClick={handleNextStep}
                className="px-6 py-3 bg-[#159A9C] text-white rounded-lg hover:bg-[#127577] transition-colors flex items-center"
              >
                Próximo
                <ChevronDown className="w-4 h-4 ml-2 rotate-[-90deg]" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-8 py-3 bg-[#159A9C] text-white rounded-lg hover:bg-[#127577] transition-colors flex items-center disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Criar Oportunidade
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
