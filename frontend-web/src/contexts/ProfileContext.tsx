import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type PerfilUsuario =
  | 'gerente'
  | 'vendedor'
  | 'operacional'
  | 'financeiro'
  | 'suporte'
  | 'administrador';

interface ProfileContextData {
  perfilSelecionado: PerfilUsuario;
  setPerfilSelecionado: (perfil: PerfilUsuario) => void;
}

const ProfileContext = createContext<ProfileContextData | undefined>(undefined);
const PROFILE_STORAGE_KEY = 'selectedProfileId';
const PERFIS_VALIDOS: PerfilUsuario[] = [
  'administrador',
  'gerente',
  'vendedor',
  'operacional',
  'financeiro',
  'suporte',
];

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [perfilSelecionado, setPerfilSelecionado] = useState<PerfilUsuario>(() => {
    if (typeof window === 'undefined') {
      return 'administrador';
    }

    const perfilSalvo = localStorage.getItem(PROFILE_STORAGE_KEY) as PerfilUsuario | null;
    if (perfilSalvo && PERFIS_VALIDOS.includes(perfilSalvo)) {
      return perfilSalvo;
    }

    return 'administrador';
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem(PROFILE_STORAGE_KEY, perfilSelecionado);
  }, [perfilSelecionado]);

  const value = {
    perfilSelecionado,
    setPerfilSelecionado,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = (): ProfileContextData => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile deve ser usado dentro de um ProfileProvider');
  }
  return context;
};

export default ProfileContext;
