import React from 'react';

interface ConectCRMLogoAltProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'text';
  highContrast?: boolean;
}

export const ConectCRMLogoAlt: React.FC<ConectCRMLogoAltProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  highContrast = false,
}) => {
  const sizeClasses = {
    sm: { container: 'h-8', icon: 'w-8 h-8', text: 'text-lg' },
    md: { container: 'h-10', icon: 'w-10 h-10', text: 'text-xl' },
    lg: { container: 'h-12', icon: 'w-12 h-12', text: 'text-2xl' },
    xl: { container: 'h-16', icon: 'w-16 h-16', text: 'text-3xl' },
  };

  const sizes = sizeClasses[size];

  // Versão com alto contraste para fundos coloridos
  const ConectIconHighContrast = () => (
    <div className={`${sizes.icon} relative flex items-center justify-center`}>
      <div className="relative w-full h-full bg-white rounded-full shadow-lg border-2 border-gray-200 flex items-center justify-center">
        {/* Símbolo "C" moderno */}
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Letra C estilizada */}
            <path
              d="M12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2Z"
              fill="none"
              stroke="#1E293B"
              strokeWidth="2"
            />
            <path d="M8 8C8 8 12 6 16 8" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" />
            <path
              d="M8 16C8 16 12 18 16 16"
              stroke="#0066CC"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="7" cy="12" r="1.5" fill="#FF6B35" />
            <circle cx="17" cy="12" r="1.5" fill="#FF6B35" />
          </svg>
        </div>
      </div>
    </div>
  );

  // Ícone padrão melhorado
  const ConectIcon = () => (
    <div className={`${sizes.icon} relative flex items-center justify-center`}>
      <div className="relative w-full h-full bg-gradient-to-br from-white to-gray-50 rounded-full shadow-md border border-gray-200 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="connectGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>

          {/* Conexões dinâmicas */}
          <path
            d="M6 9L12 6L18 9"
            stroke="url(#connectGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 15L12 18L18 15"
            stroke="url(#connectGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="6" cy="12" r="2" fill="#FF6B35" />
          <circle cx="18" cy="12" r="2" fill="#FF6B35" />
          <circle cx="12" cy="12" r="1.5" fill="#1E293B" />
        </svg>
      </div>
    </div>
  );

  if (variant === 'icon') {
    return (
      <div className={`${className}`}>
        {highContrast ? <ConectIconHighContrast /> : <ConectIcon />}
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`${className} flex items-center`}>
        <span className={`font-bold ${sizes.text}`}>
          <span className="text-gray-900">Conect</span> <span className="text-gray-700">CRM</span>
        </span>
      </div>
    );
  }

  return (
    <div className={`${className} ${sizes.container} flex items-center gap-3`}>
      {highContrast ? <ConectIconHighContrast /> : <ConectIcon />}
      <span className={`font-bold ${sizes.text} whitespace-nowrap`}>
        <span className="text-gray-900">Conect</span> <span className="text-gray-700">CRM</span>
      </span>
    </div>
  );
};

export default ConectCRMLogoAlt;
