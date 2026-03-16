import React from 'react';
import {
  systemBrandingUrlResolver,
  useSystemBranding,
} from '../../contexts/SystemBrandingContext';

type Conect360LogoVariant = 'full' | 'full-light' | 'icon' | 'loading' | 'mono' | 'icon-mono';
type Conect360LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface Conect360LogoProps {
  variant?: Conect360LogoVariant;
  size?: Conect360LogoSize;
  className?: string;
  alt?: string;
}

const sizeClassMap: Record<Conect360LogoSize, string> = {
  xs: 'h-6',
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12',
  xl: 'h-16',
  '2xl': 'h-20',
};

type Conect360LogoDynamicVariant = 'full' | 'full-light' | 'icon' | 'loading';
type Conect360LogoDynamicField = 'logoFullUrl' | 'logoFullLightUrl' | 'logoIconUrl' | 'loadingLogoUrl';

const dynamicVariantMap: Record<Conect360LogoDynamicVariant, Conect360LogoDynamicField> = {
  full: 'logoFullUrl',
  'full-light': 'logoFullLightUrl',
  icon: 'logoIconUrl',
  loading: 'loadingLogoUrl',
};

const Conect360Logo: React.FC<Conect360LogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  alt = 'Logo',
}) => {
  const { branding } = useSystemBranding();

  const dynamicField =
    variant === 'full' || variant === 'full-light' || variant === 'icon' || variant === 'loading'
      ? dynamicVariantMap[variant]
      : null;
  const fallbackField: Conect360LogoDynamicField =
    variant === 'icon' || variant === 'loading' || variant === 'icon-mono'
      ? 'logoIconUrl'
      : 'logoFullUrl';

  const preferred = dynamicField ? branding[dynamicField] : '';
  const fallback = branding[fallbackField];
  const src = systemBrandingUrlResolver(preferred || fallback || '');

  const sizeClass = sizeClassMap[size];
  const widthClass = 'w-auto';

  if (!src) {
    return (
      <span
        className={`${sizeClass} ${widthClass} inline-flex items-center font-semibold text-[#1D3E4F] ${className}`.trim()}
      >
        CRM
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClass} ${widthClass} select-none ${className}`.trim()}
      draggable={false}
      loading="eager"
      decoding="async"
    />
  );
};

export default React.memo(Conect360Logo);
