import React from 'react';

interface ConectCRMLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'text';
  theme?: 'light' | 'dark';
}

export const ConectCRMLogo: React.FC<ConectCRMLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  theme = 'light'
}) => {
  const sizeClasses = {
    sm: { container: 'h-8', icon: 'w-8 h-8', text: 'text-lg' },
    md: { container: 'h-10', icon: 'w-10 h-10', text: 'text-xl' },
    lg: { container: 'h-12', icon: 'w-12 h-12', text: 'text-2xl' },
    xl: { container: 'h-16', icon: 'w-16 h-16', text: 'text-3xl' }
  };

  const themeClasses = {
    light: {
      primary: '#1E293B', // Azul escuro para melhor contraste
      secondary: '#0F172A', // Azul muito escuro
      accent: '#FF6B35',
      text: '#1F2937',
      iconBg: '#FFFFFF', // Fundo branco para o ícone
      iconBorder: '#E2E8F0' // Borda cinza clara
    },
    dark: {
      primary: '#FFFFFF', // Branco para tema escuro
      secondary: '#F1F5F9', // Cinza muito claro
      accent: '#F59E0B',
      text: '#F9FAFB',
      iconBg: '#1E293B', // Fundo escuro para o ícone
      iconBorder: '#475569' // Borda cinza escura
    }
  };

  const colors = themeClasses[theme];
  const sizes = sizeClasses[size];

  // Ícone moderno do Conect CRM
  const ConectIcon = () => (
    <div className={`${sizes.icon} relative flex items-center justify-center`}>
      <svg
        viewBox="0 0 60 60"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle com gradiente */}
        <defs>
          <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.iconBg} />
            <stop offset="100%" stopColor={colors.iconBg} />
          </linearGradient>
          <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </linearGradient>
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.accent} />
            <stop offset="100%" stopColor="#FF8A65" />
          </linearGradient>
        </defs>
        
        {/* Círculo principal */}
        <circle
          cx="30"
          cy="30"
          r="28"
          fill="url(#backgroundGradient)"
          stroke={colors.iconBorder}
          strokeWidth="2"
        />
        
        {/* Símbolo de conexão central - letra "C" estilizada */}
        <path
          d="M20 30 C20 20, 30 15, 40 20"
          stroke="url(#iconGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M20 30 C20 40, 30 45, 40 40"
          stroke="url(#iconGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Pontos de conexão */}
        <circle cx="18" cy="30" r="3" fill={colors.primary} />
        <circle cx="42" cy="22" r="2.5" fill="url(#accentGradient)" />
        <circle cx="42" cy="38" r="2.5" fill="url(#accentGradient)" />
        
        {/* Linhas de conexão dinâmicas */}
        <path
          d="M42 22 L48 16"
          stroke="url(#accentGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M42 38 L48 44"
          stroke="url(#accentGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M18 30 L12 30"
          stroke={colors.primary}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );

  if (variant === 'icon') {
    return (
      <div className={`${className}`}>
        <ConectIcon />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`${className} flex items-center`}>
        <span 
          className={`font-bold ${sizes.text}`}
          style={{ color: colors.text }}
        >
          <span style={{ color: colors.primary }}>Conect</span>{' '}
          <span style={{ color: colors.secondary }}>CRM</span>
        </span>
      </div>
    );
  }

  return (
    <div className={`${className} ${sizes.container} flex items-center gap-3`}>
      <ConectIcon />
      <span 
        className={`font-bold ${sizes.text} whitespace-nowrap`}
        style={{ color: colors.text }}
      >
        <span style={{ color: colors.primary }}>Conect</span>{' '}
        <span style={{ color: colors.secondary }}>CRM</span>
      </span>
    </div>
  );
};

export default ConectCRMLogo;
