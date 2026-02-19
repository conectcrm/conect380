import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import DashboardPage from './DashboardPage';

const DashboardRouter: React.FC = () => {
  const { user } = useAuth();
  const { perfilSelecionado } = useProfile();

  // Determina o perfil do usuario (pode vir do contexto ou API)
  const perfilOriginal = (user as any)?.perfil || 'administrador';

  // Verifica se e administrador
  const isAdmin =
    perfilOriginal === 'administrador' ||
    (user as any)?.tipo === 'admin' ||
    (user as any)?.role === 'admin' ||
    (user as any)?.role === 'superadmin' ||
    (user as any)?.tipo === 'superadmin';

  // O perfil ativo e o selecionado (se admin) ou o original
  const perfilAtivo = isAdmin ? perfilSelecionado : perfilOriginal;

  const renderDashboard = () => {
    switch (perfilAtivo) {
      case 'vendedor':
      case 'operacional':
      case 'suporte':
      case 'financeiro':
      case 'gerente':
      case 'administrador':
        return <DashboardPage />;
      default:
        return <DashboardPage />;
    }
  };

  return <div>{renderDashboard()}</div>;
};

export default DashboardRouter;
