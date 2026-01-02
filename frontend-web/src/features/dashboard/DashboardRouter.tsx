import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import DashboardPage from './DashboardPage'; // Dashboard do Gestor
import VendedorDashboard from './VendedorDashboard';
import OperacionalDashboard from './OperacionalDashboard';
import FinanceiroDashboard from './FinanceiroDashboard';
import SuporteDashboard from './SuporteDashboard';

const DashboardRouter: React.FC = () => {
  const { user } = useAuth();
  const { perfilSelecionado } = useProfile();

  // Determinar o perfil do usuário (pode vir do contexto ou API)
  const perfilOriginal = (user as any)?.perfil || 'administrador';

  // Verificar se é administrador
  const isAdmin =
    perfilOriginal === 'administrador' ||
    (user as any)?.tipo === 'admin' ||
    (user as any)?.role === 'admin' ||
    (user as any)?.role === 'superadmin' ||
    (user as any)?.tipo === 'superadmin';

  // O perfil ativo é o selecionado (se admin) ou o original
  const perfilAtivo = isAdmin ? perfilSelecionado : perfilOriginal;

  // Roteamento baseado no perfil
  const renderDashboard = () => {
    switch (perfilAtivo) {
      case 'vendedor':
        return <VendedorDashboard />;

      case 'operacional':
        return <OperacionalDashboard />;

      case 'suporte':
        return <SuporteDashboard />;

      case 'financeiro':
        return <FinanceiroDashboard />;

      case 'gerente':
      case 'administrador':
        return <DashboardPage />; // Dashboard atual (para gestores)

      default:
        return <DashboardPage />; // Fallback para dashboard do gestor
    }
  };

  return (
    <div>
      {/* Dashboard baseado no perfil */}
      {renderDashboard()}
    </div>
  );
};

export default DashboardRouter;
