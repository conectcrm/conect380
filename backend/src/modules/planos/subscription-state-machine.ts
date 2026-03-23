import {
  AssinaturaStatus,
  CanonicalAssinaturaStatus,
  toCanonicalAssinaturaStatus,
} from './entities/assinatura-empresa.entity';

export const SUBSCRIPTION_ACCESS_STATUSES: readonly CanonicalAssinaturaStatus[] = [
  'trial',
  'active',
  'past_due',
];

export const SUBSCRIPTION_TRANSITIONS: Record<
  CanonicalAssinaturaStatus,
  readonly CanonicalAssinaturaStatus[]
> = {
  trial: ['active', 'canceled'],
  active: ['past_due', 'suspended', 'canceled'],
  past_due: ['active', 'suspended', 'canceled'],
  suspended: ['active', 'canceled'],
  canceled: [],
};

export function canTransitionSubscriptionStatus(
  fromStatus: AssinaturaStatus | CanonicalAssinaturaStatus,
  toStatus: AssinaturaStatus | CanonicalAssinaturaStatus,
): boolean {
  const from = toCanonicalAssinaturaStatus(fromStatus);
  const to = toCanonicalAssinaturaStatus(toStatus);

  if (from === to) {
    return true;
  }

  return SUBSCRIPTION_TRANSITIONS[from].includes(to);
}

export function hasSubscriptionAccess(
  status: AssinaturaStatus | CanonicalAssinaturaStatus,
): boolean {
  const canonical = toCanonicalAssinaturaStatus(status);
  return SUBSCRIPTION_ACCESS_STATUSES.includes(canonical);
}
