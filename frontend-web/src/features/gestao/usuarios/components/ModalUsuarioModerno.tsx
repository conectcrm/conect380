/**
 * Modal Moderno de Cadastro/Edição de Usuários
 * Inspirado nos melhores CRMs do mercado (Salesforce, HubSpot, Pipedrive)
 * Layout paisagem otimizado com validação robusta e UX moderna
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Save, 
  Loader2,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Building,
  AlertCircle,
  CheckCircle,
  Info,
  UserPlus,
  Edit3,
  Lock,
  Globe,
  Calendar,
  Badge
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Usuario, NovoUsuario, AtualizarUsuario, UserRole, ROLE_LABELS } from '../../../../types/usuarios/index';

// Funções utilitárias para formatação de telefone
const formatarTelefone = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const numeros = value.replace(/\D/g, '');
  
  // Aplica a formatação baseada no número de dígitos
  if (numeros.length <= 2) {
    return `(${numeros}`;
  } else if (numeros.length <= 7) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  } else if (numeros.length <= 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  } else {
    // Limita a 11 dígitos (celular com DDD)
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
  }
};

const validarTelefone = (telefone: string): boolean => {
  if (!telefone) return true; // Campo opcional
  
  // Remove formatação
  const numeros = telefone.replace(/\D/g, '');
  
  // Verifica se tem 10 (fixo) ou 11 (celular) dígitos
  if (numeros.length !== 10 && numeros.length !== 11) {
    return false;
  }
  
  // Verifica DDD válido (códigos de área brasileiros)
  const ddd = parseInt(numeros.slice(0, 2));
  const dddsValidos = [
    11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
    21, 22, 24, // RJ/ES
    27, 28, // ES
    31, 32, 33, 34, 35, 37, 38, // MG
    41, 42, 43, 44, 45, 46, // PR
    47, 48, 49, // SC
    51, 53, 54, 55, // RS
    61, // DF/GO
    62, 64, // GO/TO
    63, // TO
    65, 66, // MT
    67, // MS
    68, // AC
    69, // RO
    71, 73, 74, 75, 77, // BA
    79, // SE
    81, 87, // PE
    82, // AL
    83, // PB
    84, // RN
    85, 88, // CE
    86, 89, // PI
    91, 93, 94, // PA
    92, 97, // AM
    95, // RR
    96, // AP
    98, 99 // MA
  ];
  
  if (!dddsValidos.includes(ddd)) {
    return false;
  }
  
  // Para celular (11 dígitos), o primeiro dígito deve ser 9
  if (numeros.length === 11 && numeros[2] !== '9') {
    return false;
  }
  
  return true;
};

// Schema de validação aprimorado
const schemaBase = {
  nome: yup.string()
    .required('Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  
  email: yup.string()
    .required('Email é obrigatório')
    .email('Email deve ter um formato válido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
  
  telefone: yup.string()
    .nullable()
    .transform(value => value || null)
    .test('telefone-valido', 'Telefone deve ter um formato válido (10 ou 11 dígitos com DDD válido)', function(value) {
      return validarTelefone(value || '');
    }),
  
  role: yup.string()
    .required('Perfil é obrigatório')
    .oneOf(Object.values(UserRole), 'Perfil inválido'),
  
  ativo: yup.boolean().required()
};

const schemaNovo = yup.object().shape({
  ...schemaBase,
  senha: yup.string()
    .required('Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(50, 'Senha deve ter no máximo 50 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número')
});

const schemaEdicao = yup.object().shape({
  ...schemaBase,
  senha: yup.string()
    .nullable()
    .transform(value => value || null)
    .test('senha-opcional', 'Senha deve ter pelo menos 6 caracteres', function(value) {
      if (!value) return true; // Se não há valor, é válido (campo opcional)
      return value.length >= 6;
    })
    .test('senha-max', 'Senha deve ter no máximo 50 caracteres', function(value) {
      if (!value) return true;
      return value.length <= 50;
    })
    .test('senha-formato', 'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número', function(value) {
      if (!value) return true;
      return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value);
    })
});

interface ModalUsuarioModernoProps {
  usuario?: Usuario;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSubmit: (dados: NovoUsuario | AtualizarUsuario) => Promise<Usuario | null>;
}

interface FormData {
  nome: string;
  email: string;
  senha?: string | null;
  telefone?: string;
  role: UserRole;
  ativo: boolean;
}

const roleIcons = {
  [UserRole.ADMIN]: <Badge className="w-4 h-4" />,
  [UserRole.MANAGER]: <UserCheck className="w-4 h-4" />,
  [UserRole.VENDEDOR]: <User className="w-4 h-4" />,
  [UserRole.USER]: <User className="w-4 h-4" />
};

export const ModalUsuarioModerno: React.FC<ModalUsuarioModernoProps> = ({
  usuario,
  isOpen,
  onClose,
  onSuccess,
  onSubmit
}) => {
  // Hooks
  const isEdit = !!usuario;
  const [showSenha, setShowSenha] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Importa o contexto de autenticação
  // @ts-ignore
  const { user } = require('../../../../hooks/useAuth').useAuth();

  // Configuração do form
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid, isDirty }
  } = useForm<FormData>({
    resolver: yupResolver(isEdit ? schemaEdicao : schemaNovo),
    mode: 'onChange',
    defaultValues: {
      nome: '',
      email: '',
      senha: '',
      telefone: '',
      role: UserRole.USER,
      ativo: true
    }
  });

  // Watch para validação em tempo real
  const watchedSenha = watch('senha');
  const watchedRole = watch('role');

  // Reset form quando modal abre/fecha ou usuário muda
  useEffect(() => {
    if (isOpen) {
      if (usuario) {
        reset({
          nome: usuario.nome || '',
          email: usuario.email || '',
          senha: '',
          telefone: usuario.telefone || '',
          role: usuario.role,
          ativo: usuario.ativo
        });
      } else {
        reset({
          nome: '',
          email: '',
          senha: '',
          telefone: '',
          role: UserRole.USER,
          ativo: true
        });
      }
      setShowSenha(false);
    }
  }, [isOpen, usuario, reset]);

  // Função para fechar modal com confirmação se houver mudanças
  const handleClose = useCallback(() => {
    if (isDirty) {
      if (window.confirm('Existem alterações não salvas. Deseja realmente sair?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  // Atalhos de teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC para fechar
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
      
      // Ctrl+Enter para salvar
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(onFormSubmit)();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, handleSubmit]);

  // Submit do formulário
  const onFormSubmit = async (data: FormData) => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      let dados: NovoUsuario | AtualizarUsuario;
      
      if (isEdit) {
        dados = {
          id: usuario!.id,
          nome: data.nome?.trim() || '',
          email: data.email?.trim().toLowerCase() || '',
          telefone: data.telefone?.trim() || undefined,
          role: data.role,
          ativo: data.ativo
        };

        // Adiciona senha apenas se foi preenchida
        if (data.senha && data.senha.trim()) {
          (dados as any).senha = data.senha.trim();
        }
      } else {
        dados = {
          nome: data.nome?.trim() || '',
          email: data.email?.trim().toLowerCase() || '',
          senha: data.senha || '',
          telefone: data.telefone?.trim() || undefined,
          role: data.role,
          empresa_id: user?.empresa?.id || '',
          ativo: data.ativo
        };
      }

      const resultado = await onSubmit(dados);
      if (resultado) {
        toast.success(isEdit ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
        onSuccess();
      }
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      toast.error(error.message || 'Erro ao salvar usuário');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para avaliar força da senha
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    let label = '';
    let color = '';

    // Critérios
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    // Classificação
    if (strength <= 2) {
      label = 'Fraca';
      color = 'text-red-500';
    } else if (strength <= 4) {
      label = 'Média';
      color = 'text-yellow-500';
    } else {
      label = 'Forte';
      color = 'text-green-500';
    }

    return { strength, label, color };
  };

  const passwordStrength = getPasswordStrength(watchedSenha);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity backdrop-blur-sm" 
          onClick={handleClose} 
        />

        {/* Modal Container - Paisagem */}
        <div className="inline-block w-full max-w-4xl bg-white rounded-2xl shadow-2xl transform transition-all align-middle">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#159A9C] to-[#0f7b7d] px-8 py-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-xl">
                  {isEdit ? <Edit3 className="w-6 h-6 text-white" /> : <UserPlus className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
                  </h3>
                  <p className="text-[#a8e6e7] text-sm">
                    {isEdit ? 'Atualize as informações do usuário' : 'Adicione um novo membro à equipe'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleClose}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit(onFormSubmit)} className="p-8">
            
            {/* Grid Layout - 2 colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Coluna Esquerda - Informações Básicas */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 pb-3 border-b border-gray-200">
                  <User className="w-5 h-5 text-[#159A9C]" />
                  <h4 className="text-lg font-semibold text-gray-900">Informações Pessoais</h4>
                </div>

                {/* Nome */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Nome completo *
                  </label>
                  <Controller
                    name="nome"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          {...field}
                          type="text"
                          placeholder="Digite o nome completo"
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-[#159A9C] focus:ring-opacity-20 focus:border-[#159A9C] transition-all duration-200 ${
                            errors.nome 
                              ? 'border-red-300 bg-red-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        />
                      </div>
                    )}
                  />
                  {errors.nome && (
                    <div className="flex items-center mt-2 text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">{errors.nome.message}</span>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Email *
                  </label>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          {...field}
                          type="email"
                          placeholder="usuario@empresa.com"
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-[#159A9C] focus:ring-opacity-20 focus:border-[#159A9C] transition-all duration-200 ${
                            errors.email 
                              ? 'border-red-300 bg-red-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        />
                      </div>
                    )}
                  />
                  {errors.email && (
                    <div className="flex items-center mt-2 text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">{errors.email.message}</span>
                    </div>
                  )}
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Telefone
                    <span className="text-gray-500 font-normal ml-1">(opcional)</span>
                  </label>
                  <Controller
                    name="telefone"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          {...field}
                          type="tel"
                          value={value}
                          onChange={(e) => {
                            const valorFormatado = formatarTelefone(e.target.value);
                            onChange(valorFormatado);
                          }}
                          placeholder="(11) 99999-9999"
                          maxLength={15}
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-[#159A9C] focus:ring-opacity-20 focus:border-[#159A9C] transition-all duration-200 ${
                            errors.telefone 
                              ? 'border-red-300 bg-red-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        />
                      </div>
                    )}
                  />
                  {errors.telefone && (
                    <div className="flex items-center mt-2 text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">{errors.telefone.message}</span>
                    </div>
                  )}
                  {!errors.telefone && (
                    <div className="flex items-center mt-2 text-gray-500">
                      <Info className="w-4 h-4 mr-1" />
                      <span className="text-sm">Formato: (11) 99999-9999 ou (11) 9999-9999</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna Direita - Configurações de Acesso */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 pb-3 border-b border-gray-200">
                  <Shield className="w-5 h-5 text-[#159A9C]" />
                  <h4 className="text-lg font-semibold text-gray-900">Configurações de Acesso</h4>
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    {isEdit ? 'Nova senha (deixe em branco para manter atual)' : 'Senha *'}
                  </label>
                  <Controller
                    name="senha"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          {...field}
                          type={showSenha ? 'text' : 'password'}
                          placeholder={isEdit ? 'Digite uma nova senha (opcional)' : 'Digite uma senha segura'}
                          autoComplete="new-password"
                          className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:ring-4 focus:ring-[#159A9C] focus:ring-opacity-20 focus:border-[#159A9C] transition-all duration-200 ${
                            errors.senha 
                              ? 'border-red-300 bg-red-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSenha(!showSenha)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    )}
                  />
                  
                  {/* Indicador de força da senha */}
                  {watchedSenha && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">Força da senha:</span>
                        <span className={`font-medium ${passwordStrength.color}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength.strength <= 2 ? 'bg-red-500' :
                            passwordStrength.strength <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Recomendamos: 8+ caracteres, maiúsculas, minúsculas, números
                      </div>
                    </div>
                  )}

                  {errors.senha && (
                    <div className="flex items-center mt-2 text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">{errors.senha.message}</span>
                    </div>
                  )}
                </div>

                {/* Perfil */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Perfil de acesso *
                  </label>
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                          {...field}
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-[#159A9C] focus:ring-opacity-20 focus:border-[#159A9C] transition-all duration-200 appearance-none bg-white ${
                            errors.role 
                              ? 'border-red-300 bg-red-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  />
                  {errors.role && (
                    <div className="flex items-center mt-2 text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">{errors.role.message}</span>
                    </div>
                  )}
                  
                  {/* Descrição do perfil selecionado */}
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      {roleIcons[watchedRole]}
                      <span className="text-sm font-medium text-gray-700">
                        {ROLE_LABELS[watchedRole]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {watchedRole === UserRole.ADMIN && 'Acesso total ao sistema, incluindo configurações e gestão de usuários.'}
                      {watchedRole === UserRole.MANAGER && 'Acesso de gerenciamento com permissões avançadas para relatórios e equipes.'}
                      {watchedRole === UserRole.VENDEDOR && 'Acesso focado em vendas com permissões para clientes e oportunidades.'}
                      {watchedRole === UserRole.USER && 'Acesso padrão às funcionalidades principais do sistema.'}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Status da conta
                  </label>
                  <Controller
                    name="ativo"
                    control={control}
                    render={({ field: { onChange, onBlur, name, ref, value } }) => (
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => onChange(e.target.checked)}
                            onBlur={onBlur}
                            name={name}
                            ref={ref}
                            className="sr-only"
                          />
                          <div 
                            onClick={() => onChange(!value)}
                            className={`w-12 h-6 rounded-full cursor-pointer flex items-center transition-colors duration-200 ${
                              value ? 'bg-[#159A9C]' : 'bg-gray-300'
                            }`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                              value ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {value ? (
                            <>
                              <UserCheck className="w-5 h-5 text-green-500" />
                              <span className="text-sm font-medium text-green-700">Usuário ativo</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-5 h-5 text-red-500" />
                              <span className="text-sm font-medium text-red-700">Usuário inativo</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    {watch('ativo') 
                      ? 'O usuário poderá fazer login e acessar o sistema normalmente.'
                      : 'O usuário não poderá fazer login até que seja reativado.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-between pt-8 border-t border-gray-200 mt-8">
              {/* Info de atalhos */}
              <div className="text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">ESC</kbd>
                    <span>Cancelar</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd>
                    <span>Salvar</span>
                  </span>
                </div>
              </div>

              {/* Botões */}
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="bg-gradient-to-r from-[#159A9C] to-[#0f7b7d] text-white px-8 py-3 rounded-xl font-medium hover:from-[#138a8c] hover:to-[#0d6b6d] transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{isEdit ? 'Atualizando...' : 'Criando...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>{isEdit ? 'Atualizar Usuário' : 'Criar Usuário'}</span>
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
