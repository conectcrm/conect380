import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import { useEmpresaAtiva } from '../../hooks/useEmpresaAtiva';

type ActiveEmpresaBadgeProps = {
  variant?: 'header' | 'page';
  compact?: boolean;
  className?: string;
};

const initialsFromName = (value: string): string => {
  const parts = value.trim().split(/\s+/).filter(Boolean);

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
  const initials = initialsFromName(empresaAtiva.nomeCurto);

  const renderAvatar = (
    shapeClass: string,
    sizeClass: string,
    textClass: string,
  ): React.ReactNode => {
    if (empresaAtiva.isLoading) {
      return (
        <span
          className={clsx(
            'inline-flex items-center justify-center overflow-hidden border border-[#D4E3E8] bg-[#F2F8FA] text-[#159A9C]',
            shapeClass,
            sizeClass,
          )}
          aria-hidden="true"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        </span>
      );
    }

    if (empresaAtiva.logoUrl) {
      return (
        <span
          className={clsx(
            'inline-flex items-center justify-center overflow-hidden border border-[#D4E3E8] bg-white',
            shapeClass,
            sizeClass,
          )}
          aria-hidden="true"
        >
          <img src={empresaAtiva.logoUrl} alt="" className="h-full w-full object-cover" />
        </span>
      );
    }

    return (
      <span
        className={clsx(
          'inline-flex items-center justify-center border border-[#D4E3E8] bg-[#F2F8FA] font-semibold text-[#4A6777]',
          shapeClass,
          sizeClass,
          textClass,
        )}
        aria-hidden="true"
      >
        {initials}
      </span>
    );
  };

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
        {renderAvatar('rounded-md', 'h-5 w-5', 'text-[9px]')}
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
        {renderAvatar('rounded-full', 'h-5 w-5', 'text-[8px]')}
        <span className="text-[10px] font-bold tracking-[0.04em]">{initials}</span>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'inline-flex h-8 max-w-[220px] items-center gap-2 rounded-lg border border-[#D7E4E9] bg-white px-2.5',
        className,
      )}
      title={empresaAtiva.nome}
      aria-label={`Empresa ativa: ${empresaAtiva.nome}`}
    >
      {renderAvatar('rounded-md', 'h-5 w-5', 'text-[9px]')}
      <span className="max-w-[176px] truncate text-[12px] font-medium leading-none text-[#24485C]">
        {empresaAtiva.nomeCurto}
      </span>
    </div>
  );
};

export default React.memo(ActiveEmpresaBadge);
