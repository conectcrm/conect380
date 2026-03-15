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

const staticVariantPathMap: Record<'mono' | 'icon-mono', string> = {
  mono: '/brand/conect360-logo-monochrome.svg',
  'icon-mono': '/brand/conect360-logo-icon-monochrome.svg',
};

const Conect360Logo: React.FC<Conect360LogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  alt = 'Conect360',
}) => {
  const { branding } = useSystemBranding();

  const dynamicField =
    variant === 'full' || variant === 'full-light' || variant === 'icon' || variant === 'loading'
      ? dynamicVariantMap[variant]
      : null;

  const staticSrc =
    variant === 'mono' || variant === 'icon-mono'
      ? staticVariantPathMap[variant]
      : '/brand/conect360-logo-horizontal.svg';

  const src = dynamicField
    ? systemBrandingUrlResolver(branding[dynamicField])
    : systemBrandingUrlResolver(staticSrc);

  const sizeClass = sizeClassMap[size];
  const widthClass = 'w-auto';

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
