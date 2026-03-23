import React from 'react';
import clsx from 'clsx';
import { Building2, Loader2 } from 'lucide-react';
import { useEmpresaAtiva } from '../../hooks/useEmpresaAtiva';

type ActiveEmpresaBadgeProps = {
  variant?: 'header' | 'page';
  compact?: boolean;
  className?: string;
};

const initialsFromName = (value: string): string => {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return 'EMP';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 3).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const ActiveEmpresaBadge: React.FC<ActiveEmpresaBadgeProps> = ({
  variant = 'header',
  compact = false,
  className,
}) => {
  const empresaAtiva = useEmpresaAtiva();

  if (variant === 'page') {
    return (
      <div
        className={clsx(
          'inline-flex max-w-full items-center gap-2 rounded-xl border border-[#D5E4E8] bg-white/95 px-2.5 py-1.5',
          className,
        )}
        title={empresaAtiva.nome}
        aria-label={`Empresa ativa: ${empresaAtiva.nome}`}
      >
        {empresaAtiva.isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#159A9C]" />
        ) : (
          <Building2 className="h-3.5 w-3.5 text-[#159A9C]" />
        )}
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6A8693]">
          Empresa ativa
        </span>
        <span className="max-w-[220px] truncate text-xs font-semibold text-[#1E3F50]">
          {empresaAtiva.nomeCurto}
        </span>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className={clsx(
          'inline-flex h-8 items-center gap-1 rounded-full border border-[#D2E0E6] bg-white px-2 text-[#1E3F50]',
          className,
        )}
        title={empresaAtiva.nome}
        aria-label={`Empresa ativa: ${empresaAtiva.nome}`}
      >
        {empresaAtiva.isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#159A9C]" />
        ) : (
          <Building2 className="h-3.5 w-3.5 text-[#159A9C]" />
        )}
        <span className="text-[10px] font-bold tracking-[0.04em]">
          {initialsFromName(empresaAtiva.nomeCurto)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'inline-flex h-8 max-w-[190px] items-center gap-1.5 rounded-full border border-[#D2E0E6] bg-[#F8FCFD] px-2.5',
        className,
      )}
      title={empresaAtiva.nome}
      aria-label={`Empresa ativa: ${empresaAtiva.nome}`}
    >
      {empresaAtiva.isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#159A9C]" />
      ) : (
        <Building2 className="h-3.5 w-3.5 text-[#159A9C]" />
      )}
      <span className="max-w-[152px] truncate text-[11px] font-semibold text-[#1E3F50]">
        {empresaAtiva.nomeCurto}
      </span>
    </div>
  );
};

export default React.memo(ActiveEmpresaBadge);
