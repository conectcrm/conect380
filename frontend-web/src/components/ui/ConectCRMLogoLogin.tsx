import React from 'react';

interface ConectCRMLogoLoginProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'icon' | 'text' | 'full';
  className?: string;
}

const ConectCRMLogoLogin: React.FC<ConectCRMLogoLoginProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
}) => {
  const sizes = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16',
    '2xl': 'h-20',
  };

  const iconSize = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    '2xl': 80,
  };

  const textSizes = {
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
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          <defs>
            <linearGradient id="loginPrimaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#159A9C" />
              <stop offset="100%" stopColor="#0F7B7D" />
            </linearGradient>

            <filter id="loginGlow">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(21, 154, 156, 0.3)" />
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(255, 255, 255, 0.6)" />
            </filter>

            <filter id="iconBorder">
              <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="rgba(255, 255, 255, 0.8)" />
            </filter>
          </defs>
          {/* Círculo de fundo com gradiente e borda */}
          <circle
            cx="24"
            cy="24"
            r="23"
            fill="none"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1"
          />
          <circle
            cx="24"
            cy="24"
            r="22"
            fill="url(#loginPrimaryGradient)"
            filter="url(#loginGlow)"
            stroke="rgba(255, 255, 255, 0.6)"
            strokeWidth="0.5"
          />{' '}
          {/* Símbolo "C" em branco */}
          <g>
            <path
              d="M16 24 C16 16, 20 12, 28 12 C32 12, 35 14, 37 16"
              stroke="white"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M16 24 C16 32, 20 36, 28 36 C32 36, 35 34, 37 32"
              stroke="white"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Pontos de conexão */}
            <circle cx="37" cy="16" r="2.5" fill="white" />
            <circle cx="37" cy="32" r="2.5" fill="white" />
            <circle cx="24" cy="24" r="2" fill="white" />
          </g>
        </svg>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <span
          className={`font-bold ${textSizes[size]} bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] bg-clip-text text-transparent drop-shadow-lg`}
          style={{
            filter:
              'drop-shadow(0 2px 4px rgba(255,255,255,0.6)) drop-shadow(0 1px 2px rgba(21,154,156,0.2))',
            textShadow: '0 1px 2px rgba(255,255,255,0.8)',
          }}
        >
          Conect
          <span
            className="text-[#002333]"
            style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
          >
            CRM
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-3 ${className}`}>
      {/* Ícone */}
      <svg
        width={iconSize[size]}
        height={iconSize[size]}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        <defs>
          <linearGradient id="loginFullPrimaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#159A9C" />
            <stop offset="100%" stopColor="#0F7B7D" />
          </linearGradient>

          <filter id="loginFullGlow">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(21, 154, 156, 0.3)" />
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(255, 255, 255, 0.6)" />
          </filter>

          <filter id="iconFullBorder">
            <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="rgba(255, 255, 255, 0.8)" />
          </filter>
        </defs>

        {/* Círculo de fundo com gradiente e borda dupla */}
        <circle
          cx="24"
          cy="24"
          r="23"
          fill="none"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="1"
        />
        <circle
          cx="24"
          cy="24"
          r="22"
          fill="url(#loginFullPrimaryGradient)"
          filter="url(#loginFullGlow)"
          stroke="rgba(255, 255, 255, 0.6)"
          strokeWidth="0.5"
        />

        {/* Símbolo "C" em branco com efeito de borda */}
        <g filter="url(#iconFullBorder)">
          <path
            d="M16 24 C16 16, 20 12, 28 12 C32 12, 35 14, 37 16"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M16 24 C16 32, 20 36, 28 36 C32 36, 35 34, 37 32"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />

          {/* Pontos de conexão com borda clara */}
          <circle
            cx="37"
            cy="16"
            r="3"
            fill="white"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="0.5"
          />
          <circle
            cx="37"
            cy="32"
            r="3"
            fill="white"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="0.5"
          />
          <circle
            cx="24"
            cy="24"
            r="2.5"
            fill="white"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="0.5"
          />
        </g>
      </svg>

      {/* Texto com sombra clara */}
      <span
        className={`font-bold ${textSizes[size]} bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] bg-clip-text text-transparent`}
        style={{
          filter:
            'drop-shadow(0 2px 4px rgba(255,255,255,0.6)) drop-shadow(0 1px 2px rgba(21,154,156,0.2))',
          textShadow: '0 1px 2px rgba(255,255,255,0.8)',
        }}
      >
        Conect
        <span
          className="text-[#002333]"
          style={{
            textShadow: '0 1px 2px rgba(255,255,255,0.8)',
            filter: 'drop-shadow(0 1px 2px rgba(255,255,255,0.6))',
          }}
        >
          CRM
        </span>
      </span>
    </div>
  );
};

export default ConectCRMLogoLogin;
