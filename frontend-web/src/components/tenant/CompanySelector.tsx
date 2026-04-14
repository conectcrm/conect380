import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Building2, Check, ChevronDown, Loader2 } from 'lucide-react';
import { useEmpresas, type EmpresaInfo } from '../../contexts/EmpresaContextAPIReal';
import { useEmpresaAtiva } from '../../hooks/useEmpresaAtiva';
import { resolveAvatarUrl } from '../../utils/avatar';

type CompanySelectorProps = {
  className?: string;
  compact?: boolean;
  onCompanyChanged?: (empresaId: string) => void;
};

const initialsFromName = (value: string): string => {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'EM';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const formatCnpj = (value?: string | null): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length !== 14) {
    return trimmed;
  }

  return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2, 5)}.${digitsOnly.slice(5, 8)}/${digitsOnly.slice(8, 12)}-${digitsOnly.slice(12, 14)}`;
};

const getEmpresaLogoUrl = (empresa: EmpresaInfo | null | undefined): string | null => {
  if (!empresa) {
    return null;
  }

  const logoCandidate =
    empresa.configuracoes?.geral?.logo ??
    empresa.configuracoes?.logo ??
    (empresa as unknown as { logo?: string | null }).logo ??
    null;

  if (typeof logoCandidate !== 'string') {
    return null;
  }

  const normalized = logoCandidate.trim();
  if (!normalized) {
    return null;
  }

  return resolveAvatarUrl(normalized);
};

type AvatarInput = {
  isLoading: boolean;
  logoUrl: string | null;
  initials: string;
  compact?: boolean;
};

const CompanyAvatar: React.FC<AvatarInput> = ({
  isLoading,
  logoUrl,
  initials,
  compact = false,
}) => {
  const sizeClass = compact ? 'h-5 w-5 rounded-md' : 'h-5 w-5 rounded-md';
  const initialsClass = compact ? 'text-[9px]' : 'text-[9px]';

  if (isLoading) {
    return (
      <span
        className={clsx(
          'inline-flex items-center justify-center overflow-hidden border border-[#D6E4EA] bg-[#F2F8FA] text-[#159A9C]',
          sizeClass,
        )}
        aria-hidden="true"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      </span>
    );
  }

  if (logoUrl) {
    return (
      <span
        className={clsx(
          'inline-flex items-center justify-center overflow-hidden border border-[#D6E4EA] bg-white',
          sizeClass,
        )}
        aria-hidden="true"
      >
        <img src={logoUrl} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center border border-[#D6E4EA] bg-[#F2F8FA] font-semibold text-[#4A6777]',
        sizeClass,
        initialsClass,
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
};

const CompanySelector: React.FC<CompanySelectorProps> = ({
  className,
  compact = false,
  onCompanyChanged,
}) => {
  const { empresas, empresaAtiva, switchEmpresa, loading } = useEmpresas();
  const empresaAtivaHeader = useEmpresaAtiva();
  const activeCompanyId = empresaAtiva?.id ?? empresaAtivaHeader.id;
  const [open, setOpen] = useState(false);
  const [switchingCompanyId, setSwitchingCompanyId] = useState<string | null>(null);
  const selectorRef = useRef<HTMLDivElement>(null);

  const activeCompanyLogoUrl = useMemo((): string | null => {
    const fromContext = getEmpresaLogoUrl(empresaAtiva);
    if (fromContext) {
      return fromContext;
    }
    return empresaAtivaHeader.logoUrl;
  }, [empresaAtiva, empresaAtivaHeader.logoUrl]);

  const activeCompanyInitials = useMemo(
    () => initialsFromName(empresaAtivaHeader.nomeCurto),
    [empresaAtivaHeader.nomeCurto],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent): void => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleSwitchCompany = async (companyId: string): Promise<void> => {
    if (switchingCompanyId || companyId === activeCompanyId) {
      setOpen(false);
      return;
    }

    try {
      setSwitchingCompanyId(companyId);
      await switchEmpresa(companyId);
      onCompanyChanged?.(companyId);
      setOpen(false);
    } catch {
      // O contexto de empresas já exibe notificação em caso de erro.
    } finally {
      setSwitchingCompanyId(null);
    }
  };

  return (
    <div ref={selectorRef} className={clsx('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={clsx(
          'group inline-flex h-8 items-center gap-2 border transition-all duration-150',
          'border-[#D2E0E6] bg-white text-[#24485C] shadow-[0_1px_0_rgba(255,255,255,0.9)]',
          'hover:border-[#BFD3DC] hover:bg-[#F6FBFC] hover:shadow-[0_4px_14px_-10px_rgba(0,35,51,0.45)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/30',
          open ? 'border-[#9FC4D2] bg-[#EEF7FA]' : '',
          compact ? 'rounded-md px-1.5 pr-1' : 'max-w-[248px] rounded-lg px-2.5 pr-2',
        )}
        title={empresaAtivaHeader.nome}
        aria-label={`Empresa ativa: ${empresaAtivaHeader.nome}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <CompanyAvatar
          isLoading={empresaAtivaHeader.isLoading}
          logoUrl={activeCompanyLogoUrl}
          initials={activeCompanyInitials}
          compact={compact}
        />

        {!compact ? (
          <span className="max-w-[188px] truncate text-[13px] font-semibold leading-none text-[#22475A]">
            {empresaAtivaHeader.nomeCurto}
          </span>
        ) : null}
        <ChevronDown
          className={clsx(
            compact ? 'h-3.5 w-3.5' : 'h-4 w-4',
            'shrink-0 text-[#6B8694] transition-transform duration-150',
            open ? 'rotate-180' : '',
          )}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Selecionar empresa ativa"
          className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,336px)] overflow-hidden rounded-xl border border-[#D8E5E9] bg-white shadow-[0_24px_48px_-32px_rgba(7,36,51,0.78)]"
        >
          <div className="border-b border-[#E6EEF2] px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#67808D]">
              Contexto da empresa
            </p>
          </div>
          <div className="max-h-72 overflow-y-auto p-1.5">
            {empresas.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg px-2.5 py-3 text-sm text-[#627D8B]">
                <Building2 className="h-4 w-4 text-[#89A0AD]" />
                Nenhuma empresa disponível.
              </div>
            ) : (
              empresas.map((empresa) => {
                const isCurrent = empresa.id === activeCompanyId;
                const isSwitching = switchingCompanyId === empresa.id;
                const optionLogo = getEmpresaLogoUrl(empresa);
                const optionInitials = initialsFromName(empresa.nome);
                const cnpj = formatCnpj(empresa.cnpj);
                const contextLabel = isCurrent ? 'Empresa ativa' : empresa.plano.nome;
                const subtitle = cnpj ? `CNPJ ${cnpj} • ${contextLabel}` : contextLabel;
                return (
                  <button
                    key={empresa.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isCurrent}
                    disabled={Boolean(switchingCompanyId) || loading}
                    onClick={() => void handleSwitchCompany(empresa.id)}
                    className={clsx(
                      'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors',
                      isCurrent ? 'bg-[#EEF7FA]' : 'hover:bg-[#F6FBFC]',
                      isSwitching ? 'cursor-progress' : '',
                    )}
                    title={cnpj ? `${empresa.nome} - CNPJ ${cnpj}` : empresa.nome}
                  >
                    <CompanyAvatar
                      isLoading={isSwitching}
                      logoUrl={optionLogo}
                      initials={optionInitials}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-[#214557]">
                        {empresa.nome}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-[#6A8694]">
                        {subtitle}
                      </span>
                    </span>
                    {isSwitching ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#159A9C]" aria-hidden="true" />
                    ) : isCurrent ? (
                      <Check className="h-4 w-4 text-[#159A9C]" aria-hidden="true" />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default React.memo(CompanySelector);
