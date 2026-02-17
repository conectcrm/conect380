import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'success' | 'warning';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const baseClasses =
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors';

  const variantClasses = {
    default: 'bg-[#159A9C]/10 text-[#159A9C] hover:bg-[#159A9C]/20',
    destructive: 'bg-red-100 text-red-800 hover:bg-red-200',
    outline: 'border border-gray-300 text-gray-700 bg-transparent',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    success: 'bg-green-100 text-green-800 hover:bg-green-200',
    warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>{children}</span>
  );
};
