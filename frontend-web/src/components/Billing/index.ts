// Componentes de Billing
export { BillingDashboard } from './BillingDashboard';
export { PlanSelection } from './PlanSelection';
export { UsageMeter } from './UsageMeter';
export { SubscriptionGuard, useSubscriptionGuard } from './SubscriptionGuard';
export { UpgradePrompt } from './UpgradePrompt';

// Componentes Administrativos
export { AdminDashboard } from './Admin/AdminDashboard';
export { PlanosAdmin } from './Admin/PlanosAdmin';
export { ModulosAdmin } from './Admin/ModulosAdmin';
export { PlanoFormModal } from './Admin/PlanoFormModal';

// Hook principal
export { useSubscription } from '../../hooks/useSubscription';

// Tipos
export type {
  Plano,
  ModuloSistema,
  AssinaturaEmpresa,
  LimitesInfo,
} from '../../hooks/useSubscription';
