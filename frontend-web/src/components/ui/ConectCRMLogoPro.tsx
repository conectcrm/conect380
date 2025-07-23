import React from 'react';

interface ConectCRMLogoProProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'full' | 'icon' | 'text';
  adaptive?: boolean;
}

export const ConectCRMLogoPro: React.FC<ConectCRMLogoProProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  adaptive = true
}) => {
  const sizeClasses = {
    xs: { container: 'h-6', icon: 'w-6 h-6', text: 'text-sm' },
    sm: { container: 'h-8', icon: 'w-8 h-8', text: 'text-base' },
    md: { container: 'h-10', icon: 'w-10 h-10', text: 'text-lg' },
    lg: { container: 'h-12', icon: 'w-12 h-12', text: 'text-xl' },
    xl: { container: 'h-16', icon: 'w-16 h-16', text: 'text-2xl' },
    '2xl': { container: 'h-20', icon: 'w-20 h-20', text: 'text-3xl' }
  };

  const sizes = sizeClasses[size];

  // Ícone principal com design adaptativo
  const ConectIcon = () => (
    <div className={`${sizes.icon} relative flex items-center justify-center`}>
      {adaptive ? (
        // Versão adaptativa com fundo que funciona em qualquer contexto
        <div className="relative w-full h-full">
          <svg
            viewBox="0 0 48 48"
            className="w-full h-full drop-shadow-lg"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Gradientes do sistema */}
              <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#159A9C" />
                <stop offset="100%" stopColor="#0F7B7D" />
              </linearGradient>
              
              <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                <stop offset="100%" stopColor="rgba(248,250,252,0.95)" />
              </linearGradient>
              
              <filter id="softShadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.1)" />
              </filter>
              
              <filter id="iconGlow">
                <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#159A9C" floodOpacity="0.3" />
              </filter>
            </defs>
            
            {/* Fundo adaptativo com borda suave */}
            <circle
              cx="24"
              cy="24"
              r="22"
              fill="url(#backgroundGradient)"
              stroke="rgba(21, 154, 156, 0.2)"
              strokeWidth="1"
              filter="url(#softShadow)"
            />
            
            {/* Anel interno decorativo */}
            <circle
              cx="24"
              cy="24"
              r="18"
              fill="none"
              stroke="url(#primaryGradient)"
              strokeWidth="1"
              opacity="0.3"
            />
            
            {/* Símbolo principal - "C" conectado */}
            <g filter="url(#iconGlow)">
              {/* Arco principal do C */}
              <path
                d="M16 24 C16 16, 20 12, 28 12 C32 12, 35 14, 37 16"
                stroke="url(#primaryGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M16 24 C16 32, 20 36, 28 36 C32 36, 35 34, 37 32"
                stroke="url(#primaryGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              
              {/* Pontos de conexão */}
              <circle cx="14" cy="24" r="2.5" fill="#159A9C" />
              <circle cx="37" cy="16" r="2" fill="#3B82F6" />
              <circle cx="37" cy="32" r="2" fill="#3B82F6" />
              
              {/* Linhas de conexão dinâmicas */}
              <path
                d="M37 16 L40 13"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.8"
              />
              <path
                d="M37 32 L40 35"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.8"
              />
              <path
                d="M14 24 L11 24"
                stroke="#159A9C"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          </svg>
        </div>
      ) : (
        // Versão simples sem fundo
        <div className="relative w-full h-full flex items-center justify-center">
          <svg
            viewBox="0 0 32 32"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="simpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#159A9C" />
                <stop offset="100%" stopColor="#0F7B7D" />
              </linearGradient>
            </defs>
            
            {/* Letra C estilizada */}
            <path
              d="M10 16 C10 10, 13 8, 19 8 C22 8, 24 9, 25 10"
              stroke="url(#simpleGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M10 16 C10 22, 13 24, 19 24 C22 24, 24 23, 25 22"
              stroke="url(#simpleGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            
            <circle cx="8" cy="16" r="2" fill="#159A9C" />
            <circle cx="25" cy="10" r="1.5" fill="#3B82F6" />
            <circle cx="25" cy="22" r="1.5" fill="#3B82F6" />
          </svg>
        </div>
      )}
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
        <span className={`font-bold ${sizes.text} bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] bg-clip-text text-transparent`}>
          Conect
        </span>
        <span className={`font-bold ${sizes.text} text-gray-700 ml-1`}>
          CRM
        </span>
      </div>
    );
  }

  return (
    <div className={`${className} ${sizes.container} flex items-center gap-3`}>
      <ConectIcon />
      <div className="flex items-baseline">
        <span className={`font-bold ${sizes.text} bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] bg-clip-text text-transparent`}>
          Conect
        </span>
        <span className={`font-bold ${sizes.text} text-gray-700 ml-1`}>
          CRM
        </span>
      </div>
    </div>
  );
};

export default ConectCRMLogoPro;
