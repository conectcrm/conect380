import React, { useMemo } from 'react';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { useSystemBranding } from '../../contexts/SystemBrandingContext';

const formatDateTime = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleString('pt-BR');
};

const SystemMaintenanceBanner: React.FC = () => {
  const { branding } = useSystemBranding();
  const banner = branding.maintenanceBanner;

  const bannerMeta = useMemo(() => {
    if (banner.severity === 'critical') {
      return {
        container:
          'border-[#F2B8BE] bg-gradient-to-r from-[#FFF5F6] via-[#FFF8F9] to-[#FFF5F6] text-[#8F1D2C]',
        title: 'text-[#7D1826]',
        Icon: ShieldAlert,
      };
    }

    if (banner.severity === 'info') {
      return {
        container:
          'border-[#B9DBE7] bg-gradient-to-r from-[#F1FBFF] via-[#F7FDFF] to-[#F1FBFF] text-[#1F5C73]',
        title: 'text-[#1A5167]',
        Icon: Info,
      };
    }

    return {
      container:
        'border-[#F2D7A6] bg-gradient-to-r from-[#FFF9EE] via-[#FFFDF7] to-[#FFF9EE] text-[#815A0A]',
      title: 'text-[#6C4A08]',
      Icon: AlertTriangle,
    };
  }, [banner.severity]);

  if (!banner.enabled) {
    return null;
  }

  const startsAt = formatDateTime(banner.startsAt);
  const expectedEndAt = formatDateTime(banner.expectedEndAt);
  const Icon = bannerMeta.Icon;

  return (
    <section
      role="status"
      aria-live="polite"
      className={`mt-3 rounded-xl border px-4 py-3 shadow-[0_14px_24px_-22px_rgba(7,36,51,0.55)] ${bannerMeta.container}`}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${bannerMeta.title}`}>{banner.title}</p>
          <p className="mt-1 text-sm leading-relaxed">{banner.message}</p>

          {startsAt || expectedEndAt ? (
            <p className="mt-2 text-xs font-medium opacity-90">
              Janela: {startsAt || 'imediata'}
              {expectedEndAt ? ` - previsao de termino ${expectedEndAt}` : ''}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default React.memo(SystemMaintenanceBanner);

