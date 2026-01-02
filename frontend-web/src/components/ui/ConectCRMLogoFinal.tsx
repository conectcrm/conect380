import React from 'react';

interface ConectCRMLogoFinalProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'icon' | 'text' | 'full';
  className?: string;
}

const ConectCRMLogoFinal: React.FC<ConectCRMLogoFinalProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
}) => {
  const sizes = {
    xs: 'h-6',
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16',
    '2xl': 'h-20',
  };

  const iconSize = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    '2xl': 80,
  };

  const textSizes = {
    xs: 'text-base',
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
    '2xl': 'text-4xl',
  };

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <svg
          width={iconSize[size]}
          height={iconSize[size]}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg transform transition-all duration-300 hover:scale-110"
        >
          <defs>
            <linearGradient id="finalIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#159A9C" />
              <stop offset="50%" stopColor="#1DB5B8" />
              <stop offset="100%" stopColor="#0F7B7D" />
            </linearGradient>

            <linearGradient id="finalIconHighlight" x1="0%" y1="0%" x2="50%" y2="50%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.3)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>

            <filter id="finalIconShadow">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(21, 154, 156, 0.25)" />
            </filter>
          </defs>

          {/* Fundo quadrado arredondado com gradiente melhorado */}
          <rect
            x="4"
            y="4"
            width="56"
            height="56"
            rx="16"
            ry="16"
            fill="url(#finalIconGradient)"
            filter="url(#finalIconShadow)"
          />

          {/* Highlight sutil no topo */}
          <rect
            x="4"
            y="4"
            width="56"
            height="28"
            rx="16"
            ry="16"
            fill="url(#finalIconHighlight)"
          />

          {/* Letra "C" em branco com melhor espessura */}
          <path
            d="M20 32 C20 22, 25 17, 35 17 C40 17, 44 19, 47 22"
            stroke="white"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M20 32 C20 42, 25 47, 35 47 C40 47, 44 45, 47 42"
            stroke="white"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Pontos de conexão com destaque */}
          <circle cx="47" cy="22" r="3.5" fill="white" opacity="0.9" />
          <circle cx="47" cy="42" r="3.5" fill="white" opacity="0.9" />
          <circle cx="47" cy="22" r="2" fill="rgba(255, 255, 255, 1)" />
          <circle cx="47" cy="42" r="2" fill="rgba(255, 255, 255, 1)" />
        </svg>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <div className="flex flex-col">
          <span
            className={`font-black ${textSizes[size]} text-[#002333] leading-tight tracking-wider uppercase`}
          >
            CONECT
          </span>
          <span
            className={`font-bold ${textSizes[size]} text-[#159A9C] leading-tight tracking-wide -mt-1`}
          >
            CRM
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-3 ${className}`}>
      {/* Ícone */}
      <svg
        width={iconSize[size]}
        height={iconSize[size]}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg flex-shrink-0 transform transition-all duration-300 hover:scale-110"
      >
        <defs>
          <linearGradient id="finalFullIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#159A9C" />
            <stop offset="50%" stopColor="#1DB5B8" />
            <stop offset="100%" stopColor="#0F7B7D" />
          </linearGradient>

          <linearGradient id="finalFullIconHighlight" x1="0%" y1="0%" x2="50%" y2="50%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.3)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </linearGradient>

          <filter id="finalFullIconShadow">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(21, 154, 156, 0.25)" />
          </filter>
        </defs>

        {/* Fundo quadrado arredondado com gradiente melhorado */}
        <rect
          x="4"
          y="4"
          width="56"
          height="56"
          rx="16"
          ry="16"
          fill="url(#finalFullIconGradient)"
          filter="url(#finalFullIconShadow)"
        />

        {/* Highlight sutil no topo */}
        <rect
          x="4"
          y="4"
          width="56"
          height="28"
          rx="16"
          ry="16"
          fill="url(#finalFullIconHighlight)"
        />

        {/* Letra "C" em branco com melhor espessura */}
        <path
          d="M20 32 C20 22, 25 17, 35 17 C40 17, 44 19, 47 22"
          stroke="white"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M20 32 C20 42, 25 47, 35 47 C40 47, 44 45, 47 42"
          stroke="white"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Pontos de conexão com destaque */}
        <circle cx="47" cy="22" r="3.5" fill="white" opacity="0.9" />
        <circle cx="47" cy="42" r="3.5" fill="white" opacity="0.9" />
        <circle cx="47" cy="22" r="2" fill="rgba(255, 255, 255, 1)" />
        <circle cx="47" cy="42" r="2" fill="rgba(255, 255, 255, 1)" />
      </svg>

      {/* Texto */}
      <div className="flex flex-col">
        <span
          className={`font-black ${textSizes[size]} text-[#002333] leading-tight tracking-wider uppercase`}
        >
          CONECT
        </span>
        <span
          className={`font-bold ${textSizes[size]} text-[#159A9C] leading-tight tracking-wide -mt-1`}
        >
          CRM
        </span>
      </div>
    </div>
  );
};

export default ConectCRMLogoFinal;
