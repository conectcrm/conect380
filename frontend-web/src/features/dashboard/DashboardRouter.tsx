import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile, type PerfilUsuario } from '../../contexts/ProfileContext';
import OperacionalDashboard from './OperacionalDashboard';
import SuporteDashboard from './SuporteDashboard';
import VendedorDashboard from './VendedorDashboard';
import DashboardV2Page from '../dashboard-v2/DashboardV2Page';
import FinanceiroDashboardV2 from '../dashboard-v2/FinanceiroDashboardV2';

type UserRecord =
  | {
      role?: unknown;
      tipo?: unknown;
      perfil?: unknown;
    }
  | null
  | undefined;

const normalizeProfile = (value: unknown): PerfilUsuario | undefined => {
  if (typeof value !== 'string') return undefined;

  switch (value.toLowerCase().trim()) {
    case 'superadmin':
    case 'admin':
    case 'administrador':
      return 'administrador';
    case 'manager':
    case 'gerente':
    case 'gestor':
      return 'gerente';
    case 'vendedor':
      return 'vendedor';
    case 'operacional':
    case 'operacao':
    case 'operacoes':
    case 'user':
    case 'usuario':
      return 'operacional';
    case 'financeiro':
      return 'financeiro';
    case 'suporte':
    case 'support':
      return 'suporte';
    default:
      return undefined;
  }
};

const canSwitchProfile = (user: UserRecord): boolean => {
  if (!user) return false;

  const role = typeof user.role === 'string' ? user.role.toLowerCase().trim() : '';
  const tipo = typeof user.tipo === 'string' ? user.tipo.toLowerCase().trim() : '';
  const perfilNormalizado = normalizeProfile(user.perfil);

  return (
    role === 'superadmin' ||
    role === 'admin' ||
    role === 'manager' ||
    role === 'gerente' ||
    role === 'gestor' ||
    tipo === 'superadmin' ||
    tipo === 'admin' ||
    tipo === 'gerente' ||
    tipo === 'gestor' ||
    perfilNormalizado === 'administrador' ||
    perfilNormalizado === 'gerente'
  );
};

const resolveBaseProfile = (user: UserRecord): PerfilUsuario => {
  if (!user) return 'operacional';

  return (
    normalizeProfile(user.perfil) ||
    normalizeProfile(user.tipo) ||
    normalizeProfile(user.role) ||
    'operacional'
  );
};

const DashboardRouter: React.FC = () => {
  const { user } = useAuth();
  const { perfilSelecionado } = useProfile();

  const userRecord: UserRecord = user;
  const perfilBase = resolveBaseProfile(userRecord);
  const perfilAtivo = canSwitchProfile(userRecord) ? perfilSelecionado : perfilBase;

  const renderDashboard = (): React.ReactNode => {
    switch (perfilAtivo) {
      case 'vendedor':
        return <VendedorDashboard />;
      case 'operacional':
        return <OperacionalDashboard />;
      case 'suporte':
        return <SuporteDashboard />;
      case 'financeiro':
        return <FinanceiroDashboardV2 />;
      case 'gerente':
      case 'administrador':
        return <DashboardV2Page />;
      default:
        return <DashboardV2Page />;
    }
  };

  return <div>{renderDashboard()}</div>;
};

export default DashboardRouter;
