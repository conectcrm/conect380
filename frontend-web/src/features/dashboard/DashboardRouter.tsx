import React, { Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile, type PerfilUsuario } from '../../contexts/ProfileContext';
import { useDashboardV2Flag } from '../dashboard-v2/useDashboardV2';

type UserRecord =
  | {
      role?: unknown;
      tipo?: unknown;
      perfil?: unknown;
    }
  | null
  | undefined;

const OperacionalDashboard = React.lazy(() => import('./OperacionalDashboard'));
const SuporteDashboard = React.lazy(() => import('./SuporteDashboard'));
const VendedorDashboard = React.lazy(() => import('./VendedorDashboard'));
const DashboardLegacyFallback = React.lazy(() => import('./DashboardLegacyFallback'));
const DashboardV2Page = React.lazy(() => import('../dashboard-v2/DashboardV2Page'));
const FinanceiroDashboardV2 = React.lazy(() => import('../dashboard-v2/FinanceiroDashboardV2'));

const DashboardLoadingState: React.FC = () => (
  <div className="space-y-3">
    <div className="h-9 w-56 animate-pulse rounded-xl bg-[#E6EFF0]" />
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-[14px] bg-[#E6EFF0]" />
      ))}
    </div>
  </div>
);

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
  const perfilExigeDashboardV2 =
    perfilAtivo === 'financeiro' || perfilAtivo === 'gerente' || perfilAtivo === 'administrador';
  const {
    loading: dashboardV2FlagLoading,
    error: dashboardV2FlagError,
    flag: dashboardV2Flag,
  } = useDashboardV2Flag(perfilExigeDashboardV2);

  if (perfilExigeDashboardV2 && dashboardV2FlagLoading) {
    return <DashboardLoadingState />;
  }

  const renderDashboard = (): React.ReactNode => {
    switch (perfilAtivo) {
      case 'vendedor':
        return <VendedorDashboard />;
      case 'operacional':
        return <OperacionalDashboard />;
      case 'suporte':
        return <SuporteDashboard />;
      case 'financeiro':
        if (!dashboardV2Flag.enabled) {
          return (
            <DashboardLegacyFallback
              reason={dashboardV2FlagError || 'Dashboard V2 desabilitado para esta empresa.'}
            />
          );
        }
        return <FinanceiroDashboardV2 />;
      case 'gerente':
      case 'administrador':
        if (!dashboardV2Flag.enabled) {
          return (
            <DashboardLegacyFallback
              reason={dashboardV2FlagError || 'Dashboard V2 desabilitado para esta empresa.'}
            />
          );
        }
        return <DashboardV2Page />;
      default:
        if (perfilExigeDashboardV2 && !dashboardV2Flag.enabled) {
          return (
            <DashboardLegacyFallback
              reason={dashboardV2FlagError || 'Dashboard V2 desabilitado para esta empresa.'}
            />
          );
        }
        return <DashboardV2Page />;
    }
  };

  return <Suspense fallback={<DashboardLoadingState />}>{renderDashboard()}</Suspense>;
};

export default DashboardRouter;
