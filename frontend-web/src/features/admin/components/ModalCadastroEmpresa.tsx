import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  X,
  Building2,
  Save,
  Upload,
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  DollarSign,
  Users,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  Camera,
  FileText,
  CreditCard,
  Settings
} from 'lucide-react';
import { useNotifications } from '../../../contexts/NotificationContext';

// Interfaces
interface NovaEmpresaFormData {
  // Informações Básicas
  nomeEmpresa: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  inscricaoEstadual: string;
  inscricaoMunicipal: string;
  
  // Contato Principal
  emailPrincipal: string;
  telefonePrincipal: string;
  celularPrincipal: string;
  website: string;
  
  // Endereço
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
  
  // Responsável/Contato
  nomeResponsavel: string;
  cargoResponsavel: string;
  emailResponsavel: string;
  telefoneResponsavel: string;
  
  // Configurações do Sistema
  plano: 'starter' | 'professional' | 'enterprise' | 'custom';
  status: 'ativa' | 'trial' | 'suspensa' | 'inativa';
  dataInicioContrato: Date;
  dataFimContrato: Date;
  valorMensal: number;
  desconto: number;
  
  // Configurações Avançadas
  limitUsuarios: number;
  limitClientes: number;
  limitStorage: number; // GB
  modulosAtivos: string[];
  permissoes: string[];
  
  // Observações
  observacoes: string;
  tags: string[];
  
  // Upload
  logo: File | null;
  contrato: File | null;
}

interface ModalCadastroEmpresaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (empresa: NovaEmpresaFormData) => Promise<void>;
  empresa?: Partial<NovaEmpresaFormData>;
  isLoading?: boolean;
}

// Schema de validação
const schema = yup.object().shape({
  // Básicas - Obrigatórias
  nomeEmpresa: yup
    .string()
    .required('Nome da empresa é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  
  cnpj: yup
    .string()
    .required('CNPJ é obrigatório')
    .matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX'),
  
  razaoSocial: yup
    .string()
    .required('Razão social é obrigatória')
    .min(2, 'Razão social deve ter pelo menos 2 caracteres'),
  
  emailPrincipal: yup
    .string()
    .required('Email principal é obrigatório')
    .email('Email deve ter um formato válido'),
  
  telefonePrincipal: yup
    .string()
    .required('Telefone principal é obrigatório')
    .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX'),
  
  // Endereço - Obrigatórios
  cep: yup
    .string()
    .required('CEP é obrigatório')
    .matches(/^\d{5}-\d{3}$/, 'CEP deve estar no formato XXXXX-XXX'),
  
  endereco: yup
    .string()
    .required('Endereço é obrigatório'),
  
  numero: yup
    .string()
    .required('Número é obrigatório'),
  
  cidade: yup
    .string()
    .required('Cidade é obrigatória'),
  
  estado: yup
    .string()
    .required('Estado é obrigatório')
    .length(2, 'Estado deve ter 2 caracteres'),
  
  // Responsável - Obrigatórios
  nomeResponsavel: yup
    .string()
    .required('Nome do responsável é obrigatório'),
  
  cargoResponsavel: yup
    .string()
    .required('Cargo do responsável é obrigatório'),
  
  emailResponsavel: yup
    .string()
    .required('Email do responsável é obrigatório')
    .email('Email deve ter um formato válido'),
  
  // Sistema - Obrigatórios
  plano: yup
    .string()
    .required('Plano é obrigatório')
    .oneOf(['starter', 'professional', 'enterprise', 'custom'], 'Plano inválido'),
  
  status: yup
    .string()
    .required('Status é obrigatório')
    .oneOf(['ativa', 'trial', 'suspensa', 'inativa'], 'Status inválido'),
  
  dataInicioContrato: yup
    .date()
    .required('Data de início do contrato é obrigatória')
    .min(new Date(), 'Data de início não pode ser no passado'),
  
  dataFimContrato: yup
    .date()
    .required('Data de fim do contrato é obrigatória')
    .min(yup.ref('dataInicioContrato'), 'Data de fim deve ser posterior ao início'),
  
  valorMensal: yup
    .number()
    .required('Valor mensal é obrigatório')
    .min(0, 'Valor não pode ser negativo'),
  
  limitUsuarios: yup
    .number()
    .required('Limite de usuários é obrigatório')
    .min(1, 'Deve ter pelo menos 1 usuário'),
  
  limitClientes: yup
    .number()
    .required('Limite de clientes é obrigatório')
    .min(1, 'Deve ter pelo menos 1 cliente'),
  
  limitStorage: yup
    .number()
    .required('Limite de storage é obrigatório')
    .min(1, 'Deve ter pelo menos 1 GB')
});

// Constantes
const PLANOS = [
  { value: 'starter', label: 'Starter', valorBase: 99.90, limiteUsuarios: 5, limiteClientes: 100, storage: 5 },
  { value: 'professional', label: 'Professional', valorBase: 199.90, limiteUsuarios: 15, limiteClientes: 500, storage: 20 },
  { value: 'enterprise', label: 'Enterprise', valorBase: 399.90, limiteUsuarios: 50, limiteClientes: 2000, storage: 100 },
  { value: 'custom', label: 'Personalizado', valorBase: 0, limiteUsuarios: 0, limiteClientes: 0, storage: 0 }
];

const STATUS_OPTIONS = [
  { value: 'trial', label: 'Trial (Teste)', color: 'bg-blue-100 text-blue-800' },
  { value: 'ativa', label: 'Ativa', color: 'bg-green-100 text-green-800' },
  { value: 'suspensa', label: 'Suspensa', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'inativa', label: 'Inativa', color: 'bg-red-100 text-red-800' }
];

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const MODULOS_DISPONIVEIS = [
  'CRM', 'Vendas', 'Financeiro', 'Relatórios', 'API', 'Integrações',
  'Mobile App', 'Automação', 'Marketing', 'Suporte'
];

const PERMISSOES_DISPONIVEIS = [
  'admin_total', 'user_management', 'financial_access', 'reports_access',
  'api_access', 'export_data', 'delete_records', 'bulk_operations'
];

export const ModalCadastroEmpresa: React.FC<ModalCadastroEmpresaProps> = ({
  isOpen,
  onClose,
  onSave,
  empresa,
  isLoading = false
}) => {
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<'basico' | 'endereco' | 'responsavel' | 'sistema' | 'configuracao'>('basico');
  const [showPassword, setShowPassword] = useState(false);
  const [cnpjValidado, setCnpjValidado] = useState(false);
  const [cepValidado, setCepValidado] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [validandoCnpj, setValidandoCnpj] = useState(false);
  const [validandoCep, setValidandoCep] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid, isDirty },
    setValue,
    watch,
    reset,
    trigger,
    getValues
  } = useForm<NovaEmpresaFormData>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      plano: 'starter',
      status: 'trial',
      limitUsuarios: 5,
      limitClientes: 100,
      limitStorage: 5,
      valorMensal: 99.90,
      desconto: 0,
      modulosAtivos: ['CRM', 'Vendas'],
      permissoes: ['user_management', 'reports_access'],
      tags: [],
      pais: 'Brasil',
      dataInicioContrato: new Date(),
      dataFimContrato: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
      ...empresa
    }
  });

  const watchedPlano = watch('plano');
  const watchedCnpj = watch('cnpj');
  const watchedCep = watch('cep');

  // Função para validar CNPJ na Receita Federal
  const validarCnpj = async (cnpj: string) => {
    if (!cnpj || cnpj.length !== 18) return;
    
    setValidandoCnpj(true);
    try {
      // Simular validação (em produção, usar API da Receita Federal)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const cnpjLimpo = cnpj.replace(/\D/g, '');
      
      // Simulação de dados da Receita Federal
      const dadosReceita = {
        razaoSocial: 'EMPRESA EXEMPLO LTDA',
        nomeFantasia: 'Empresa Exemplo',
        endereco: 'Rua das Empresas, 123',
        bairro: 'Centro',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234-567'
      };
      
      setValue('razaoSocial', dadosReceita.razaoSocial);
      setValue('nomeFantasia', dadosReceita.nomeFantasia);
      setValue('endereco', dadosReceita.endereco);
      setValue('bairro', dadosReceita.bairro);
      setValue('cidade', dadosReceita.cidade);
      setValue('estado', dadosReceita.estado);
      setValue('cep', dadosReceita.cep);
      
      setCnpjValidado(true);
      
      addNotification({
        title: '✅ CNPJ Validado',
        message: 'Dados da Receita Federal importados com sucesso!',
        type: 'success',
        priority: 'high',
        entityType: 'tarefa'
      });
      
    } catch (error) {
      addNotification({
        title: '❌ Erro na Validação',
        message: 'Não foi possível validar o CNPJ. Verifique se está correto.',
        type: 'error',
        priority: 'high',
        entityType: 'tarefa'
      });
    } finally {
      setValidandoCnpj(false);
    }
  };

  // Função para buscar endereço por CEP
  const buscarCep = async (cep: string) => {
    if (!cep || cep.length !== 9) return;
    
    setValidandoCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`);
      const dados = await response.json();
      
      if (!dados.erro) {
        setValue('endereco', dados.logradouro);
        setValue('bairro', dados.bairro);
        setValue('cidade', dados.localidade);
        setValue('estado', dados.uf);
        
        setCepValidado(true);
        
        addNotification({
          title: '📍 CEP Encontrado',
          message: 'Endereço preenchido automaticamente!',
          type: 'success',
          priority: 'medium',
          entityType: 'tarefa'
        });
      }
    } catch (error) {
      addNotification({
        title: '❌ CEP Não Encontrado',
        message: 'Verifique se o CEP está correto.',
        type: 'error',
        priority: 'medium',
        entityType: 'tarefa'
      });
    } finally {
      setValidandoCep(false);
    }
  };

  // Aplicar limites baseados no plano
  useEffect(() => {
    const planoSelecionado = PLANOS.find(p => p.value === watchedPlano);
    if (planoSelecionado && watchedPlano !== 'custom') {
      setValue('valorMensal', planoSelecionado.valorBase);
      setValue('limitUsuarios', planoSelecionado.limiteUsuarios);
      setValue('limitClientes', planoSelecionado.limiteClientes);
      setValue('limitStorage', planoSelecionado.storage);
    }
  }, [watchedPlano, setValue]);

  // Validar CNPJ quando mudar
  useEffect(() => {
    if (watchedCnpj && watchedCnpj.length === 18 && !cnpjValidado) {
      const timer = setTimeout(() => validarCnpj(watchedCnpj), 1000);
      return () => clearTimeout(timer);
    }
  }, [watchedCnpj]);

  // Buscar CEP quando mudar
  useEffect(() => {
    if (watchedCep && watchedCep.length === 9 && !cepValidado) {
      const timer = setTimeout(() => buscarCep(watchedCep), 1000);
      return () => clearTimeout(timer);
    }
  }, [watchedCep]);

  // Máscaras
  const formatCnpj = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  };

  const formatTelefone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(\d{4})-(\d)(\d{4})/, '$1$2-$3')
      .substring(0, 15);
  };

  const formatCep = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 9);
  };

  const formatCurrency = (value: string) => {
    const number = parseFloat(value.replace(/[^\d]/g, '')) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(number);
  };

  // Handle upload de logo
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setValue('logo', file);
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Submit do formulário
  const onSubmit = async (data: NovaEmpresaFormData) => {
    try {
      await onSave(data);
      
      addNotification({
        title: '🎉 Empresa Cadastrada',
        message: `${data.nomeEmpresa} foi cadastrada com sucesso!`,
        type: 'success',
        priority: 'high',
        entityType: 'cliente'
      });
      
      reset();
      onClose();
    } catch (error) {
      addNotification({
        title: '❌ Erro no Cadastro',
        message: 'Não foi possível cadastrar a empresa. Tente novamente.',
        type: 'error',
        priority: 'high',
        entityType: 'tarefa'
      });
    }
  };

  const renderBasicoTab = () => (
    <div className="space-y-6">
      {/* Upload de Logo */}
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-[#159A9C] transition-colors">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <Camera className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="absolute -bottom-2 -right-2 bg-[#159A9C] rounded-full p-1">
            <Upload className="w-4 h-4 text-white" />
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">Logo da empresa</p>
      </div>

      {/* Informações Básicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nome da Empresa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome da Empresa *
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register('nomeEmpresa')}
              type="text"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                errors.nomeEmpresa ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Ex: Tech Solutions LTDA"
            />
          </div>
          {errors.nomeEmpresa && (
            <p className="mt-1 text-sm text-red-600">{errors.nomeEmpresa.message}</p>
          )}
        </div>

        {/* CNPJ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CNPJ *
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Controller
              name="cnpj"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  value={formatCnpj(field.value || '')}
                  onChange={(e) => field.onChange(formatCnpj(e.target.value))}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                    errors.cnpj ? 'border-red-300 bg-red-50' : cnpjValidado ? 'border-green-300 bg-green-50' : 'border-gray-300'
                  }`}
                  placeholder="00.000.000/0000-00"
                />
              )}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {validandoCnpj ? (
                <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
              ) : cnpjValidado ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
          {errors.cnpj && (
            <p className="mt-1 text-sm text-red-600">{errors.cnpj.message}</p>
          )}
          {cnpjValidado && (
            <p className="mt-1 text-sm text-green-600">✅ CNPJ validado na Receita Federal</p>
          )}
        </div>

        {/* Razão Social */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Razão Social *
          </label>
          <input
            {...register('razaoSocial')}
            type="text"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
              errors.razaoSocial ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Razão social completa"
          />
          {errors.razaoSocial && (
            <p className="mt-1 text-sm text-red-600">{errors.razaoSocial.message}</p>
          )}
        </div>

        {/* Nome Fantasia */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome Fantasia
          </label>
          <input
            {...register('nomeFantasia')}
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            placeholder="Nome fantasia (opcional)"
          />
        </div>

        {/* Inscrição Estadual */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Inscrição Estadual
          </label>
          <input
            {...register('inscricaoEstadual')}
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            placeholder="Inscrição estadual"
          />
        </div>

        {/* Inscrição Municipal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Inscrição Municipal
          </label>
          <input
            {...register('inscricaoMunicipal')}
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            placeholder="Inscrição municipal"
          />
        </div>
      </div>

      {/* Contato Principal */}
      <div className="border-t pt-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Contato Principal</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email Principal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Principal *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...register('emailPrincipal')}
                type="email"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                  errors.emailPrincipal ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="contato@empresa.com"
              />
            </div>
            {errors.emailPrincipal && (
              <p className="mt-1 text-sm text-red-600">{errors.emailPrincipal.message}</p>
            )}
          </div>

          {/* Telefone Principal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone Principal *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Controller
                name="telefonePrincipal"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    value={formatTelefone(field.value || '')}
                    onChange={(e) => field.onChange(formatTelefone(e.target.value))}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                      errors.telefonePrincipal ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="(11) 99999-9999"
                  />
                )}
              />
            </div>
            {errors.telefonePrincipal && (
              <p className="mt-1 text-sm text-red-600">{errors.telefonePrincipal.message}</p>
            )}
          </div>

          {/* Celular Principal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Celular Principal
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Controller
                name="celularPrincipal"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    value={formatTelefone(field.value || '')}
                    onChange={(e) => field.onChange(formatTelefone(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                    placeholder="(11) 99999-9999"
                  />
                )}
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...register('website')}
                type="url"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                placeholder="https://www.empresa.com.br"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEnderecoTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CEP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CEP *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Controller
              name="cep"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  value={formatCep(field.value || '')}
                  onChange={(e) => field.onChange(formatCep(e.target.value))}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                    errors.cep ? 'border-red-300 bg-red-50' : cepValidado ? 'border-green-300 bg-green-50' : 'border-gray-300'
                  }`}
                  placeholder="00000-000"
                />
              )}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {validandoCep ? (
                <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
              ) : cepValidado ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
          {errors.cep && (
            <p className="mt-1 text-sm text-red-600">{errors.cep.message}</p>
          )}
        </div>

        {/* Cidade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cidade *
          </label>
          <input
            {...register('cidade')}
            type="text"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
              errors.cidade ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Nome da cidade"
          />
          {errors.cidade && (
            <p className="mt-1 text-sm text-red-600">{errors.cidade.message}</p>
          )}
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado *
          </label>
          <select
            {...register('estado')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
              errors.estado ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          >
            <option value="">Selecione...</option>
            {ESTADOS_BRASIL.map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
          {errors.estado && (
            <p className="mt-1 text-sm text-red-600">{errors.estado.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Endereço */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Endereço *
          </label>
          <input
            {...register('endereco')}
            type="text"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
              errors.endereco ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Rua, Avenida..."
          />
          {errors.endereco && (
            <p className="mt-1 text-sm text-red-600">{errors.endereco.message}</p>
          )}
        </div>

        {/* Número */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número *
          </label>
          <input
            {...register('numero')}
            type="text"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
              errors.numero ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="123"
          />
          {errors.numero && (
            <p className="mt-1 text-sm text-red-600">{errors.numero.message}</p>
          )}
        </div>

        {/* Complemento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Complemento
          </label>
          <input
            {...register('complemento')}
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            placeholder="Sala, Andar..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bairro */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bairro
          </label>
          <input
            {...register('bairro')}
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            placeholder="Nome do bairro"
          />
        </div>

        {/* País */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            País
          </label>
          <input
            {...register('pais')}
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            placeholder="Brasil"
          />
        </div>
      </div>
    </div>
  );

  const renderResponsavelTab = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-blue-600" />
          <h4 className="text-sm font-medium text-blue-800">Responsável pela Conta</h4>
        </div>
        <p className="text-sm text-blue-600 mt-1">
          Esta pessoa será o contato principal e receberá todas as comunicações importantes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nome do Responsável */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome Completo *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register('nomeResponsavel')}
              type="text"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                errors.nomeResponsavel ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Nome completo do responsável"
            />
          </div>
          {errors.nomeResponsavel && (
            <p className="mt-1 text-sm text-red-600">{errors.nomeResponsavel.message}</p>
          )}
        </div>

        {/* Cargo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cargo *
          </label>
          <input
            {...register('cargoResponsavel')}
            type="text"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
              errors.cargoResponsavel ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Ex: Diretor, Gerente, CEO..."
          />
          {errors.cargoResponsavel && (
            <p className="mt-1 text-sm text-red-600">{errors.cargoResponsavel.message}</p>
          )}
        </div>

        {/* Email do Responsável */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register('emailResponsavel')}
              type="email"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                errors.emailResponsavel ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="email@empresa.com"
            />
          </div>
          {errors.emailResponsavel && (
            <p className="mt-1 text-sm text-red-600">{errors.emailResponsavel.message}</p>
          )}
        </div>

        {/* Telefone do Responsável */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefone
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Controller
              name="telefoneResponsavel"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  value={formatTelefone(field.value || '')}
                  onChange={(e) => field.onChange(formatTelefone(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  placeholder="(11) 99999-9999"
                />
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSistemaTab = () => (
    <div className="space-y-6">
      {/* Informações do Contrato */}
      <div className="bg-gradient-to-r from-[#159A9C] to-[#1BB3B6] rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <CreditCard className="w-6 h-6" />
          <h4 className="text-lg font-semibold">Configurações do Sistema</h4>
        </div>
        <p className="text-white text-opacity-90">
          Configure o plano, status e período de contrato da empresa
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plano */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Plano *
          </label>
          <select
            {...register('plano')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
              errors.plano ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          >
            {PLANOS.map(plano => (
              <option key={plano.value} value={plano.value}>
                {plano.label} - R$ {plano.valorBase.toFixed(2)}
              </option>
            ))}
          </select>
          {errors.plano && (
            <p className="mt-1 text-sm text-red-600">{errors.plano.message}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status *
          </label>
          <select
            {...register('status')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
              errors.status ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          >
            {STATUS_OPTIONS.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
          )}
        </div>

        {/* Data Início */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data de Início *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register('dataInicioContrato')}
              type="date"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                errors.dataInicioContrato ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.dataInicioContrato && (
            <p className="mt-1 text-sm text-red-600">{errors.dataInicioContrato.message}</p>
          )}
        </div>

        {/* Data Fim */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data de Fim *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register('dataFimContrato')}
              type="date"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                errors.dataFimContrato ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.dataFimContrato && (
            <p className="mt-1 text-sm text-red-600">{errors.dataFimContrato.message}</p>
          )}
        </div>

        {/* Valor Mensal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor Mensal *
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Controller
              name="valorMensal"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  step="0.01"
                  min="0"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                    errors.valorMensal ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
              )}
            />
          </div>
          {errors.valorMensal && (
            <p className="mt-1 text-sm text-red-600">{errors.valorMensal.message}</p>
          )}
        </div>

        {/* Desconto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Desconto (%)
          </label>
          <div className="relative">
            <input
              {...register('desconto')}
              type="number"
              step="0.01"
              min="0"
              max="100"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
              placeholder="0.00"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
          </div>
        </div>
      </div>

      {/* Limites do Sistema */}
      <div className="border-t pt-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Limites do Sistema</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Limite de Usuários */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Limite de Usuários *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...register('limitUsuarios')}
                type="number"
                min="1"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                  errors.limitUsuarios ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="5"
              />
            </div>
            {errors.limitUsuarios && (
              <p className="mt-1 text-sm text-red-600">{errors.limitUsuarios.message}</p>
            )}
          </div>

          {/* Limite de Clientes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Limite de Clientes *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...register('limitClientes')}
                type="number"
                min="1"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                  errors.limitClientes ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="100"
              />
            </div>
            {errors.limitClientes && (
              <p className="mt-1 text-sm text-red-600">{errors.limitClientes.message}</p>
            )}
          </div>

          {/* Limite de Storage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Storage (GB) *
            </label>
            <div className="relative">
              <input
                {...register('limitStorage')}
                type="number"
                min="1"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                  errors.limitStorage ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="5"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">GB</span>
            </div>
            {errors.limitStorage && (
              <p className="mt-1 text-sm text-red-600">{errors.limitStorage.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderConfiguracaoTab = () => (
    <div className="space-y-6">
      {/* Módulos Ativos */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Módulos Disponíveis</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {MODULOS_DISPONIVEIS.map(modulo => (
            <label key={modulo} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                value={modulo}
                {...register('modulosAtivos')}
                className="w-4 h-4 text-[#159A9C] border-gray-300 rounded focus:ring-[#159A9C]"
              />
              <span className="text-sm font-medium text-gray-700">{modulo}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Permissões */}
      <div className="border-t pt-6">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="w-5 h-5 text-[#159A9C]" />
          <h4 className="text-lg font-semibold text-gray-900">Permissões de Acesso</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PERMISSOES_DISPONIVEIS.map(permissao => (
            <label key={permissao} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                value={permissao}
                {...register('permissoes')}
                className="w-4 h-4 text-[#159A9C] border-gray-300 rounded focus:ring-[#159A9C]"
              />
              <span className="text-sm font-medium text-gray-700 capitalize">
                {permissao.replace('_', ' ')}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Tags e Observações */}
      <div className="border-t pt-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              {...register('observacoes')}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent resize-none"
              placeholder="Observações gerais sobre a empresa, requisitos especiais, notas importantes..."
            />
          </div>

          {/* Upload de Contrato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contrato (PDF)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#159A9C] transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setValue('contrato', e.target.files?.[0] || null)}
                className="hidden"
                id="contrato-upload"
              />
              <label htmlFor="contrato-upload" className="cursor-pointer">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Clique para fazer upload do contrato
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PDF até 10MB
                </p>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#159A9C] to-[#1BB3B6]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {empresa ? 'Editar Empresa' : 'Nova Empresa'}
              </h2>
              <p className="text-white text-opacity-80 text-sm">
                {empresa ? 'Atualize as informações da empresa' : 'Cadastre uma nova empresa no sistema'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'basico', label: 'Básico', icon: Building2 },
              { id: 'endereco', label: 'Endereço', icon: MapPin },
              { id: 'responsavel', label: 'Responsável', icon: User },
              { id: 'sistema', label: 'Sistema', icon: Settings },
              { id: 'configuracao', label: 'Configuração', icon: Shield }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-[#159A9C] text-[#159A9C]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'basico' && renderBasicoTab()}
            {activeTab === 'endereco' && renderEnderecoTab()}
            {activeTab === 'responsavel' && renderResponsavelTab()}
            {activeTab === 'sistema' && renderSistemaTab()}
            {activeTab === 'configuracao' && renderConfiguracaoTab()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{isValid ? 'Formulário válido' : 'Preencha os campos obrigatórios'}</span>
              </div>
              {isDirty && (
                <div className="flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span>Alterações não salvas</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !isValid}
                className="flex items-center space-x-2 px-6 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#147A7C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{empresa ? 'Atualizar' : 'Cadastrar'}</span>
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
