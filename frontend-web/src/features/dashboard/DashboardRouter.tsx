import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile, type PerfilUsuario } from '../../contexts/ProfileContext';
import DashboardPage from './DashboardPage';
import FinanceiroDashboard from './FinanceiroDashboard';
import OperacionalDashboard from './OperacionalDashboard';
import SuporteDashboard from './SuporteDashboard';
import VendedorDashboard from './VendedorDashboard';
import DashboardV2Page from '../dashboard-v2/DashboardV2Page';
import { useDashboardV2Flag } from '../dashboard-v2/useDashboardV2';

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

type DashboardRouterProps = {
  forceLegacy?: boolean;
};

const DashboardRouter: React.FC<DashboardRouterProps> = ({ forceLegacy = false }) => {
  const { user } = useAuth();
  const { perfilSelecionado } = useProfile();
  const { flag, loading: dashboardV2FlagLoading } = useDashboardV2Flag(!forceLegacy);

  const userRecord: UserRecord = user;
  const perfilBase = resolveBaseProfile(userRecord);
  const perfilAtivo = canSwitchProfile(userRecord) ? perfilSelecionado : perfilBase;
  const shouldUseDashboardV2 = !forceLegacy && !dashboardV2FlagLoading && flag.enabled;

  const renderDashboard = (): React.ReactNode => {
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
        return shouldUseDashboardV2 ? <DashboardV2Page /> : <DashboardPage />;
      default:
        return shouldUseDashboardV2 ? <DashboardV2Page /> : <DashboardPage />;
    }
  };

  return <div>{renderDashboard()}</div>;
};

export default DashboardRouter;
