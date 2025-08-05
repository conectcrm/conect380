import React, { createContext, useContext, useState, ReactNode } from 'react';

export type PerfilUsuario = 'gerente' | 'vendedor' | 'operacional' | 'financeiro' | 'suporte' | 'administrador';

interface ProfileContextData {
  perfilSelecionado: PerfilUsuario;
  setPerfilSelecionado: (perfil: PerfilUsuario) => void;
}

const ProfileContext = createContext<ProfileContextData | undefined>(undefined);

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [perfilSelecionado, setPerfilSelecionado] = useState<PerfilUsuario>('administrador');

  const value = {
    perfilSelecionado,
    setPerfilSelecionado
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextData => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile deve ser usado dentro de um ProfileProvider');
  }
  return context;
};

export default ProfileContext;
