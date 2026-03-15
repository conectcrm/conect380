import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { authService } from '../../services/authService';
import './sales-celebration.css';

export const SALES_CELEBRATION_EVENT = 'conectcrm:sales-celebration';

type SalesCelebrationKind = 'venda-concluida' | 'proposta-aprovada';
type SalesCelebrationIntensity = 'high' | 'medium';

export type SalesCelebrationPayload = {
  kind?: SalesCelebrationKind;
  title?: string;
  subtitle?: string;
  intensity?: SalesCelebrationIntensity;
};

type CelebrationState = {
  id: number;
  kind: SalesCelebrationKind;
  intensity: SalesCelebrationIntensity;
  title: string;
  subtitle: string;
};

const CONFETTI_COLORS = ['#DEEFE7', '#B4BEC9', '#FBBF24', '#34D399', '#D1FAE5', '#F97316'];

function resolveIntensityByRole(role?: unknown): SalesCelebrationIntensity {
  const normalizedRole = typeof role === 'string' ? role.trim().toLowerCase() : '';
  if (normalizedRole === 'vendedor') {
    return 'high';
  }

  if (
    normalizedRole === 'gerente' ||
    normalizedRole === 'manager' ||
    normalizedRole === 'admin' ||
    normalizedRole === 'superadmin'
  ) {
    return 'medium';
  }

  return 'medium';
}

function resolvePayload(
  payload: SalesCelebrationPayload | undefined,
  roleBasedIntensity: SalesCelebrationIntensity,
): Omit<CelebrationState, 'id'> {
  const intensity = payload?.intensity || roleBasedIntensity;
  if (payload?.kind === 'proposta-aprovada') {
    return {
      kind: 'proposta-aprovada',
      intensity,
      title: payload.title || 'Proposta aprovada!',
      subtitle: payload.subtitle || 'A negociacao avancou para a etapa vencedora.',
    };
  }

  return {
    kind: 'venda-concluida',
    intensity,
    title: payload?.title || 'Venda concluida!',
    subtitle: payload?.subtitle || 'A oportunidade foi marcada como ganha.',
  };
}

export function triggerSalesCelebration(payload?: SalesCelebrationPayload): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<SalesCelebrationPayload>(SALES_CELEBRATION_EVENT, { detail: payload }));
}

const SalesCelebrationHost: React.FC = () => {
  const [state, setState] = useState<CelebrationState | null>(null);
  const timerRef = useRef<number | null>(null);
  const intensity = state?.intensity || 'medium';

  const confettiStyles = useMemo<React.CSSProperties[]>(
    () =>
      Array.from({ length: intensity === 'high' ? 96 : 66 }, (_, index) => {
        const total = intensity === 'high' ? 96 : 66;
        const ratio = index / Math.max(total - 1, 1);
        const wave = Math.sin(index * 1.7) * 5.8;
        const x = (ratio - 0.5) * 104 + wave;
        const drop = 58 + (index % 11) * 4.1;
        const rotate = (index % 2 === 0 ? 1 : -1) * (170 + index * 9);
        const delay = (index % 17) * 24;
        const duration =
          (intensity === 'high' ? 1040 : 920) + (index % 7) * (intensity === 'high' ? 130 : 90);
        const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
        const drift = ((index % 9) - 4) * 2.8;
        const width = 5 + (index % 3);
        const height = 10 + (index % 5) * 2;

        return {
          ['--x' as string]: `${x}vw`,
          ['--drop' as string]: `${drop}vh`,
          ['--rotate' as string]: `${rotate}deg`,
          ['--delay' as string]: `${delay}ms`,
          ['--duration' as string]: `${duration}ms`,
          ['--color' as string]: color,
          ['--drift' as string]: `${drift}vw`,
          ['--width' as string]: `${width}px`,
          ['--height' as string]: `${height}px`,
        } as React.CSSProperties;
      }),
    [intensity],
  );

  const burstStyles = useMemo<React.CSSProperties[]>(
    () =>
      Array.from({ length: intensity === 'high' ? 18 : 12 }, (_, index) => {
        const total = intensity === 'high' ? 18 : 12;
        const angle = (Math.PI * 2 * index) / total;
        const radius = 78 + (index % 3) * 20;
        const tx = Math.round(Math.cos(angle) * radius);
        const ty = Math.round(Math.sin(angle) * radius);
        const rotate = Math.round((angle * 180) / Math.PI);
        const delay = (index % 6) * 24 + 20;
        const color = CONFETTI_COLORS[(index + 2) % CONFETTI_COLORS.length];

        return {
          ['--tx' as string]: `${tx}px`,
          ['--ty' as string]: `${ty}px`,
          ['--rotate' as string]: `${rotate}deg`,
          ['--delay' as string]: `${delay}ms`,
          ['--color' as string]: color,
        } as React.CSSProperties;
      }),
    [intensity],
  );

  const sparkleStyles = useMemo<React.CSSProperties[]>(
    () =>
      Array.from({ length: intensity === 'high' ? 24 : 14 }, (_, index) => {
        const total = intensity === 'high' ? 24 : 14;
        const ratio = index / Math.max(total - 1, 1);
        const x = (ratio - 0.5) * 92;
        const y = 8 + (index % 6) * 8 + (index % 2 === 0 ? 0 : 4);
        const delay = 90 + (index % 10) * 92;
        const duration = (intensity === 'high' ? 620 : 560) + (index % 4) * 95;

        return {
          ['--x' as string]: `${x}vw`,
          ['--y' as string]: `${y}vh`,
          ['--delay' as string]: `${delay}ms`,
          ['--duration' as string]: `${duration}ms`,
        } as React.CSSProperties;
      }),
    [intensity],
  );

  useEffect(() => {
    const clearBodyClasses = () => {
      document.body.classList.remove('sales-celebration-active');
      document.body.classList.remove('sales-celebration-high');
      document.body.classList.remove('sales-celebration-medium');
    };

    const clearTimer = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const onCelebrate = (event: Event) => {
      const customEvent = event as CustomEvent<SalesCelebrationPayload>;
      const currentUser = authService.getUser();
      const roleBasedIntensity = resolveIntensityByRole(currentUser?.role);
      const normalized = resolvePayload(customEvent.detail, roleBasedIntensity);

      clearTimer();
      clearBodyClasses();
      setState({
        id: Date.now(),
        ...normalized,
      });
      document.body.classList.add('sales-celebration-active');
      document.body.classList.add(
        normalized.intensity === 'high' ? 'sales-celebration-high' : 'sales-celebration-medium',
      );

      timerRef.current = window.setTimeout(() => {
        setState(null);
        clearBodyClasses();
        timerRef.current = null;
      }, 2600);
    };

    window.addEventListener(SALES_CELEBRATION_EVENT, onCelebrate as EventListener);

    return () => {
      clearTimer();
      clearBodyClasses();
      window.removeEventListener(SALES_CELEBRATION_EVENT, onCelebrate as EventListener);
    };
  }, []);

  if (!state) return null;

  return (
    <div className="sales-celebration-overlay" aria-live="polite" aria-atomic="true">
      <div key={state.id} className={`sales-celebration-stage is-${state.intensity}`}>
        <span className="sales-celebration-veil" />
        <span className="sales-celebration-spotlight" />
        <div className="sales-celebration-banner-slot">
          <span className="sales-celebration-comet" />
          <div className="sales-celebration-banner">
            <span className="sales-celebration-glow" />
            <div className="sales-celebration-header">
              <span className="sales-celebration-icon-wrap" aria-hidden="true">
                {state.kind === 'proposta-aprovada' ? (
                  <Sparkles className="sales-celebration-icon" />
                ) : (
                  <Trophy className="sales-celebration-icon" />
                )}
              </span>
              <div className="sales-celebration-copy">
                <div className="sales-celebration-title">{state.title}</div>
                <div className="sales-celebration-subtitle">{state.subtitle}</div>
              </div>
            </div>
            {burstStyles.map((style, index) => (
              <span
                key={`${state.id}-burst-${index}`}
                className="sales-celebration-burst-piece"
                style={style}
              />
            ))}
          </div>
        </div>
        {confettiStyles.map((style, index) => (
          <span
            key={`${state.id}-confetti-${index}`}
            className={`sales-celebration-confetti ${index % 2 === 0 ? 'is-front' : 'is-back'}`}
            style={style}
          />
        ))}
        {sparkleStyles.map((style, index) => (
          <span key={`${state.id}-sparkle-${index}`} className="sales-celebration-sparkle" style={style} />
        ))}
      </div>
    </div>
  );
};

export default SalesCelebrationHost;
