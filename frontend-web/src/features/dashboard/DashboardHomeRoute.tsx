import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile, type PerfilUsuario } from '../../contexts/ProfileContext';
import DashboardV2Page from '../dashboard-v2/DashboardV2Page';
import { useDashboardV2Flag } from '../dashboard-v2/useDashboardV2';
import DashboardRouter from './DashboardRouter';

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

const DashboardHomeRoute: React.FC = () => {
  const { user } = useAuth();
  const { perfilSelecionado } = useProfile();

  const userRecord: UserRecord = user;
  const perfilBase = resolveBaseProfile(userRecord);
  const perfilAtivo = canSwitchProfile(userRecord) ? perfilSelecionado : perfilBase;

  const supportsDashboardV2 = perfilAtivo === 'administrador' || perfilAtivo === 'gerente';
  const { flag, loading: dashboardV2FlagLoading } = useDashboardV2Flag(supportsDashboardV2);

  if (supportsDashboardV2 && dashboardV2FlagLoading) {
    return (
      <div className="space-y-5">
        <div className="h-10 w-44 animate-pulse rounded-xl bg-[#E4EFEB]" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-56 animate-pulse rounded-[22px] bg-[#E4EFEB]" />
          ))}
        </div>
      </div>
    );
  }

  if (supportsDashboardV2 && flag.enabled) {
    return <DashboardV2Page />;
  }

  return <DashboardRouter forceLegacy />;
};

export default DashboardHomeRoute;
