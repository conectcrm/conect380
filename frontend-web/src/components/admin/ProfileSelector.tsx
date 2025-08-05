import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  User,
  Shield,
  Settings,
  Users,
  DollarSign,
  HeadphonesIcon,
  Crown,
  ChevronDown,
  Check,
  LogOut,
  Globe
} from 'lucide-react';

type PerfilUsuario = 'gestor' | 'admin' | 'vendedor' | 'operacional' | 'financeiro' | 'suporte';

interface PerfilOption {
  value: PerfilUsuario;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  avatarBg: string;
}

const PERFIS_DISPONIVEIS: PerfilOption[] = [
  {
    value: 'admin',
    label: 'Super-Admin',
    description: 'Acesso total ao sistema',
    icon: <Crown className="w-4 h-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    avatarBg: 'bg-purple-500'
  },
  {
    value: 'gestor',
    label: 'Gestor/Diretor',
    description: 'Dashboard estratégico e visão geral',
    icon: <Shield className="w-4 h-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    avatarBg: 'bg-blue-500'
  },
  {
    value: 'vendedor',
    label: 'Vendedor',
    description: 'Dashboard pessoal com gamificação',
    icon: <User className="w-4 h-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    avatarBg: 'bg-green-500'
  },
  {
    value: 'operacional',
    label: 'Operacional',
    description: 'Gestão de processos e tickets',
    icon: <Settings className="w-4 h-4" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    avatarBg: 'bg-orange-500'
  },
  {
    value: 'financeiro',
    label: 'Financeiro',
    description: 'Controle financeiro e fluxo de caixa',
    icon: <DollarSign className="w-4 h-4" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    avatarBg: 'bg-emerald-500'
  },
  {
    value: 'suporte',
    label: 'Suporte',
    description: 'Atendimento ao cliente e tickets',
    icon: <HeadphonesIcon className="w-4 h-4" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    avatarBg: 'bg-indigo-500'
  }
];

interface ProfileSelectorProps {
  currentProfile: PerfilUsuario;
  onProfileChange: (profile: PerfilUsuario) => void;
  className?: string;
}

const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  currentProfile,
  onProfileChange,
  className = ''
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Verificar se o usuário é administrador
  const isAdmin = (user as any)?.perfil === 'admin' || (user as any)?.tipo === 'admin' || (user as any)?.role === 'admin';

  const currentProfileData = PERFIS_DISPONIVEIS.find(p => p.value === currentProfile);

  const handleProfileSelect = (profile: PerfilUsuario) => {
    onProfileChange(profile);
    setIsOpen(false);
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    if (!isAdmin) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAdmin]);

  // Se não for admin, não mostrar o seletor
  if (!isAdmin) {
    return null;
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Botão Principal - Estilo da imagem */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors w-full min-w-[280px]"
      >
        {/* Avatar com iniciais */}
        <div className={`w-10 h-10 ${currentProfileData?.avatarBg || 'bg-gray-500'} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
          {currentProfileData?.label.substring(0, 2).toUpperCase() || 'SA'}
        </div>

        {/* Informações do perfil */}
        <div className="flex-1 text-left">
          <div className="font-semibold text-gray-900">
            {currentProfileData?.label || 'Super-Admin'}
          </div>
          <div className="text-sm text-gray-500">
            Multsoft (estrutura de árvore)
          </div>
        </div>

        {/* Ícone dropdown */}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu - Estilo da imagem */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2 min-w-[320px]">
          {/* Header com informações do usuário */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                SA
              </div>
              <div>
                <div className="font-semibold text-gray-900">Super-Admin</div>
                <div className="text-xs text-gray-500">Multsoft (estrutura de árvore)</div>
              </div>
            </div>
          </div>

          {/* Seção de Perfis */}
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              PERFIS
            </div>

            {PERFIS_DISPONIVEIS.map((perfil) => (
              <button
                key={perfil.value}
                onClick={() => handleProfileSelect(perfil.value)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left
                  ${currentProfile === perfil.value ? 'bg-blue-50 border-r-2 border-blue-500' : ''}
                `}
              >
                <div className={`w-6 h-6 ${perfil.avatarBg} rounded-full flex items-center justify-center text-white text-xs`}>
                  {perfil.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {perfil.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {perfil.description}
                  </div>
                </div>
                {currentProfile === perfil.value && (
                  <Check className="w-4 h-4 text-blue-500" />
                )}
              </button>
            ))}
          </div>

          {/* Divisor */}
          <div className="border-t border-gray-100 my-2"></div>

          {/* Opções do Sistema */}
          <div className="py-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
              <Settings className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">Modo de depuração desativado</span>
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
              <Globe className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">Português do Brasil</span>
              <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
            </button>
          </div>

          {/* Divisor */}
          <div className="border-t border-gray-100 my-2"></div>

          {/* Links de Ajuda */}
          <div className="py-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">Ajuda</span>
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">Sobre</span>
            </button>
          </div>

          {/* Divisor */}
          <div className="border-t border-gray-100 my-2"></div>

          {/* Configurações e Sair */}
          <div className="py-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
              <Settings className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">Minhas configurações</span>
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left text-red-600">
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSelector;
