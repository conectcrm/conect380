import {
  canTransitionSubscriptionStatus,
  hasSubscriptionAccess,
  SUBSCRIPTION_TRANSITIONS,
} from './subscription-state-machine';
import {
  CANONICAL_ASSINATURA_STATUS_VALUES,
  toCanonicalAssinaturaStatus,
} from './entities/assinatura-empresa.entity';

describe('subscription-state-machine', () => {
  it('normaliza status legados para canonicos', () => {
    expect(toCanonicalAssinaturaStatus('ativa')).toBe('active');
    expect(toCanonicalAssinaturaStatus('pendente')).toBe('trial');
    expect(toCanonicalAssinaturaStatus('suspensa')).toBe('suspended');
    expect(toCanonicalAssinaturaStatus('cancelada')).toBe('canceled');
  });

  it('aceita transicoes validas do ciclo de cobranca', () => {
    expect(canTransitionSubscriptionStatus('trial', 'active')).toBe(true);
    expect(canTransitionSubscriptionStatus('active', 'past_due')).toBe(true);
    expect(canTransitionSubscriptionStatus('past_due', 'active')).toBe(true);
    expect(canTransitionSubscriptionStatus('past_due', 'suspended')).toBe(true);
    expect(canTransitionSubscriptionStatus('active', 'canceled')).toBe(true);
    expect(canTransitionSubscriptionStatus('suspended', 'active')).toBe(true);
    expect(canTransitionSubscriptionStatus('suspended', 'canceled')).toBe(true);
  });

  it('rejeita transicoes invalidas', () => {
    expect(canTransitionSubscriptionStatus('active', 'trial')).toBe(false);
    expect(canTransitionSubscriptionStatus('trial', 'past_due')).toBe(false);
    expect(canTransitionSubscriptionStatus('canceled', 'active')).toBe(false);
    expect(canTransitionSubscriptionStatus('canceled', 'trial')).toBe(false);
  });

  it('cobre a matriz completa de transicoes canonicas (validas e invalidas)', () => {
    for (const fromStatus of CANONICAL_ASSINATURA_STATUS_VALUES) {
      for (const toStatus of CANONICAL_ASSINATURA_STATUS_VALUES) {
        const expected =
          fromStatus === toStatus || SUBSCRIPTION_TRANSITIONS[fromStatus].includes(toStatus);
        expect(canTransitionSubscriptionStatus(fromStatus, toStatus)).toBe(expected);
      }
    }
  });

  it('permite acesso apenas para trial, active e past_due', () => {
    expect(hasSubscriptionAccess('trial')).toBe(true);
    expect(hasSubscriptionAccess('active')).toBe(true);
    expect(hasSubscriptionAccess('past_due')).toBe(true);
    expect(hasSubscriptionAccess('suspended')).toBe(false);
    expect(hasSubscriptionAccess('canceled')).toBe(false);
  });
});
