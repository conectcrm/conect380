import React, { useState } from 'react';
import { Eye, Crown, Settings, HelpCircle } from 'lucide-react';

export type PerfilUsuario =
  | 'gerente'
  | 'vendedor'
  | 'operacional'
  | 'financeiro'
  | 'suporte'
  | 'administrador';

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
    avatarBg: 'bg-purple-500',
  },
  {
    value: 'vendedor',
    label: 'Vendedor',
    icon: <Eye className="w-4 h-4" />,
    description: 'Foco em vendas e relacionamentos',
    avatarBg: 'bg-blue-500',
  },
  {
    value: 'operacional',
    label: 'Operacional',
    icon: <Settings className="w-4 h-4" />,
    description: 'Gestão de processos e operações',
    avatarBg: 'bg-green-500',
  },
  {
    value: 'financeiro',
    label: 'Financeiro',
    icon: <Eye className="w-4 h-4" />,
    description: 'Controle financeiro e faturamento',
    avatarBg: 'bg-orange-500',
  },
  {
    value: 'suporte',
    label: 'Suporte',
    icon: <HelpCircle className="w-4 h-4" />,
    description: 'Atendimento e suporte técnico',
    avatarBg: 'bg-emerald-500',
  },
  {
    value: 'administrador',
    label: 'Admin',
    icon: <Settings className="w-4 h-4" />,
    description: 'Acesso total ao sistema',
    avatarBg: 'bg-indigo-500',
  },
];

interface ProfileSelectorDropdownProps {
  currentProfile: PerfilUsuario;
  onProfileChange: (profile: PerfilUsuario) => void;
  onClose: () => void;
}

const ProfileSelectorDropdown: React.FC<ProfileSelectorDropdownProps> = ({
  currentProfile,
  onProfileChange,
  onClose,
}) => {
  const currentProfileData = PERFIS_DISPONIVEIS.find((p) => p.value === currentProfile);

  const handleProfileSelect = (profile: PerfilUsuario) => {
    onProfileChange(profile);
    onClose();
  };

  return (
    <div className="border-t border-gray-100 mt-2">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Alternar Perfil
          </span>
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 ${currentProfileData?.avatarBg} rounded-full flex items-center justify-center`}
            >
              <span className="text-white text-xs font-bold">
                {currentProfileData?.label.charAt(0)}
              </span>
            </div>
            <span className="text-xs text-gray-600 font-medium">{currentProfileData?.label}</span>
          </div>
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto">
          {PERFIS_DISPONIVEIS.map((perfil) => (
            <button
              key={perfil.value}
              onClick={() => handleProfileSelect(perfil.value)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 hover:bg-gray-50 ${
                currentProfile === perfil.value
                  ? 'bg-[#159A9C]/5 border-l-4 border-l-[#159A9C] shadow-sm'
                  : 'hover:shadow-sm'
              }`}
            >
              <div
                className={`w-8 h-8 ${perfil.avatarBg} rounded-lg flex items-center justify-center transition-all duration-200 ${
                  currentProfile === perfil.value ? 'shadow-md' : 'shadow-sm'
                }`}
              >
                <span className="text-white text-xs font-bold">{perfil.label.charAt(0)}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm font-medium ${
                    currentProfile === perfil.value ? 'text-[#159A9C]' : 'text-gray-900'
                  }`}
                >
                  {perfil.label}
                </div>
                <div className="text-xs text-gray-500 truncate">{perfil.description}</div>
              </div>

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

        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
            <span className="font-medium text-yellow-700">💡 Modo Administrador:</span>
            <br />
            Alterne entre perfis para testar diferentes visões do sistema.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSelectorDropdown;
