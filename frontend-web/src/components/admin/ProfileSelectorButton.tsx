import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Crown, Eye, Settings, HelpCircle } from 'lucide-react';
import { safeGetBoundingClientRect, safeGetWindowDimensions } from '../../utils/dom-helper';

export type PerfilUsuario = 'gerente' | 'vendedor' | 'operacional' | 'financeiro' | 'suporte' | 'administrador';

interface ProfileData {
  value: PerfilUsuario;
  label: string;
  icon: React.ReactNode;
  description: string;
  avatarBg: string;
}

const PERFIS_DISPONIVEIS: ProfileData[] = [
  {
    value: 'gerente',
    label: 'Gestor',
    icon: <Crown className="w-4 h-4" />,
    description: 'Visão executiva completa',
    avatarBg: 'bg-purple-500'
  },
  {
    value: 'vendedor',
    label: 'Vendedor',
    icon: <Eye className="w-4 h-4" />,
    description: 'Foco em vendas e relacionamentos',
    avatarBg: 'bg-blue-500'
  },
  {
    value: 'operacional',
    label: 'Operacional',
    icon: <Settings className="w-4 h-4" />,
    description: 'Gestão de processos e operações',
    avatarBg: 'bg-green-500'
  },
  {
    value: 'financeiro',
    label: 'Financeiro',
    icon: <Eye className="w-4 h-4" />,
    description: 'Controle financeiro e faturamento',
    avatarBg: 'bg-orange-500'
  },
  {
    value: 'suporte',
    label: 'Suporte',
    icon: <HelpCircle className="w-4 h-4" />,
    description: 'Atendimento e suporte técnico',
    avatarBg: 'bg-emerald-500'
  },
  {
    value: 'administrador',
    label: 'Admin',
    icon: <Settings className="w-4 h-4" />,
    description: 'Acesso total ao sistema',
    avatarBg: 'bg-indigo-500'
  }
];

interface ProfileSelectorButtonProps {
  currentProfile: PerfilUsuario;
  onProfileChange: (profile: PerfilUsuario) => void;
}

const ProfileSelectorButton: React.FC<ProfileSelectorButtonProps> = ({
  currentProfile,
  onProfileChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentProfileData = PERFIS_DISPONIVEIS.find(p => p.value === currentProfile);

  const handleProfileSelect = (profile: PerfilUsuario) => {
    onProfileChange(profile);
    setIsOpen(false);
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Calcular posição do dropdown
  const getDropdownPosition = () => {
    if (!buttonRef.current) return { top: '100%', left: '0' };

    try {
      const rect = safeGetBoundingClientRect(buttonRef.current);
      const { innerHeight } = safeGetWindowDimensions();
      const dropdownHeight = 400; // altura estimada do dropdown

      // Se não há espaço embaixo, abrir em cima
      if (rect.bottom + dropdownHeight > innerHeight) {
        return {
          bottom: '100%',
          left: '0',
          marginBottom: '8px'
        };
      }
    } catch (error) {
      console.warn('Erro ao calcular posição do dropdown:', error);
      return { top: '100%', left: '0' };
    }

    return {
      top: '100%',
      left: '0',
      marginTop: '8px'
    };
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Setinha elegante e discreta */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg bg-[#159A9C]/10 hover:bg-[#159A9C]/20 transition-all duration-200 group"
        title="Alternar perfil de visualização"
      >
        <ChevronLeft
          className={`w-3 h-3 text-[#159A9C] transition-transform duration-200 ${isOpen ? 'rotate-90' : '-rotate-90'
            } group-hover:scale-110`}
        />
      </button>

      {/* Dropdown flutuante */}
      {isOpen && (
        <>
          {/* Overlay invisível */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div
            className="absolute z-50 w-80 bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden"
            style={getDropdownPosition()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#159A9C]/5 to-[#0F7B7D]/5 px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Alternar Perfil</h3>
                  <p className="text-xs text-gray-600">Visualize o sistema de diferentes perspectivas</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 ${currentProfileData?.avatarBg} rounded-lg flex items-center justify-center shadow-sm`}>
                    <span className="text-white text-sm font-bold">
                      {currentProfileData?.label.charAt(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de perfis */}
            <div className="max-h-72 overflow-y-auto">
              {PERFIS_DISPONIVEIS.map((perfil) => (
                <button
                  key={perfil.value}
                  onClick={() => handleProfileSelect(perfil.value)}
                  className={`w-full flex items-center gap-3 p-4 text-left transition-all duration-200 hover:bg-gray-50 ${currentProfile === perfil.value
                    ? 'bg-[#159A9C]/5 border-r-4 border-r-[#159A9C]'
                    : ''
                    }`}
                >
                  {/* Avatar do perfil */}
                  <div className={`w-10 h-10 ${perfil.avatarBg} rounded-lg flex items-center justify-center transition-all duration-200 ${currentProfile === perfil.value ? 'shadow-lg scale-110' : 'shadow-sm hover:shadow-md hover:scale-105'
                    }`}>
                    <span className="text-white text-sm font-bold">
                      {perfil.label.charAt(0)}
                    </span>
                  </div>

                  {/* Informações do perfil */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold ${currentProfile === perfil.value ? 'text-[#159A9C]' : 'text-gray-900'
                      }`}>
                      {perfil.label}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {perfil.description}
                    </div>
                  </div>

                  {/* Indicador de seleção */}
                  {currentProfile === perfil.value && (
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 bg-[#159A9C] rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Footer com dica */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-4 h-4 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-xs">💡</span>
                </div>
                <span>
                  <strong className="text-yellow-700">Modo Admin:</strong> Teste diferentes visões do sistema
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileSelectorButton;
