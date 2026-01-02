import React from 'react';

interface FenixLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
}

const FenixLogo: React.FC<FenixLogoProps> = ({ className = '', size = 'md', variant = 'full' }) => {
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-12 w-auto',
  };

  if (variant === 'icon') {
    return (
      <div className={`flex items-center justify-center ${sizeClasses[size]} ${className}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-blue-600"
        >
          <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
          <path
            d="M2 17L12 22L22 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`flex items-center justify-center ${sizeClasses[size]} mr-2`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-blue-600"
        >
          <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
          <path
            d="M2 17L12 22L22 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="text-xl font-bold text-gray-800">Fenix CRM</span>
    </div>
  );
};

export default FenixLogo;
