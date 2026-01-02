import React, { useState, useRef, useEffect } from 'react';
import { Users, ChevronDown } from 'lucide-react';

export type PerfilUsuario =
  | 'gerente'
  | 'vendedor'
  | 'operacional'
  | 'financeiro'
  | 'suporte'
  | 'administrador';

interface ProfileSelectorDropdownProps {
  currentProfile: PerfilUsuario;
  onProfileChange: (profile: PerfilUsuario) => void;
}

export const ProfileSelectorDropdown: React.FC<ProfileSelectorDropdownProps> = ({
  currentProfile,
  onProfileChange,
}) => {
  const [showProfiles, setShowProfiles] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Perfis disponíveis
  const availableProfiles: Array<{
    id: PerfilUsuario;
    nome: string;
    descricao: string;
  }> = [
    {
      id: 'administrador',
      nome: 'Administrador',
      descricao: 'Acesso total ao sistema',
    },
    {
      id: 'gerente',
      nome: 'Gerente',
      descricao: 'Gestão de equipes e relatórios',
    },
    {
      id: 'vendedor',
      nome: 'Vendedor',
      descricao: 'Gestão de vendas e clientes',
    },
    {
      id: 'operacional',
      nome: 'Operacional',
      descricao: 'Operações e processos',
    },
    {
      id: 'financeiro',
      nome: 'Financeiro',
      descricao: 'Gestão financeira',
    },
    {
      id: 'suporte',
      nome: 'Suporte',
      descricao: 'Atendimento ao cliente',
    },
  ];

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfiles(false);
      }
    };

    if (showProfiles) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfiles]);

  const handleProfileSelect = (profile: PerfilUsuario) => {
    onProfileChange(profile);
    setShowProfiles(false);
  };

  const getTipoColor = (tipo: PerfilUsuario) => {
    switch (tipo) {
      case 'administrador':
        return 'bg-red-100 text-red-800';
      case 'gerente':
        return 'bg-blue-100 text-blue-800';
      case 'vendedor':
        return 'bg-green-100 text-green-800';
      case 'operacional':
        return 'bg-purple-100 text-purple-800';
      case 'financeiro':
        return 'bg-yellow-100 text-yellow-800';
      case 'suporte':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrentProfile = () => {
    return availableProfiles.find((p) => p.id === currentProfile) || availableProfiles[0];
  };

  const current = getCurrentProfile();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão da setinha */}
      <button
        onClick={() => setShowProfiles(!showProfiles)}
        className="p-1.5 rounded-full hover:bg-[#159A9C]/10 transition-colors"
        title="Selecionar Perfil"
      >
        <ChevronDown
          className={`w-3 h-3 text-gray-400 transition-transform ${showProfiles ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown de perfis - Independente */}
      {showProfiles && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Header do dropdown */}
          <div className="p-4 bg-gradient-to-r from-[#159A9C]/5 to-[#0F7B7D]/5 border-b">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#159A9C]" />
              <h3 className="font-semibold text-gray-900">Selecionar Perfil</h3>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Perfil atual:{' '}
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTipoColor(currentProfile)}`}
              >
                {current.nome}
              </span>
            </p>
          </div>

          {/* Lista de perfis */}
          <div className="max-h-72 overflow-y-auto">
            {availableProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleProfileSelect(profile.id)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-l-4 ${
                  currentProfile === profile.id
                    ? 'bg-blue-50 border-blue-500'
                    : 'border-transparent hover:border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {profile.nome}
                      {currentProfile === profile.id && (
                        <span className="text-xs text-blue-600">● Ativo</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{profile.descricao}</div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getTipoColor(profile.id)} ml-3`}
                  >
                    {profile.nome}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
