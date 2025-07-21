import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'full';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'full',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-10 h-10 text-lg'
  };

  const logoIcon = (
    <div 
      className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg transition-all duration-200 hover:shadow-xl ${className}`}
    >
      F
    </div>
  );

  if (variant === 'icon') {
    return logoIcon;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {logoIcon}
      <h1 className={`font-bold text-gray-900 ${
        size === 'sm' ? 'text-base' : 
        size === 'md' ? 'text-lg' : 
        'text-xl'
      }`}>
        Fênix CRM
      </h1>
    </div>
  );
};

export default Logo;