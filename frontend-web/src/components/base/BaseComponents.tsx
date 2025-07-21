import React from 'react';
import { Check, X, AlertTriangle, Clock } from 'lucide-react';

interface BaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

/**
 * BaseButton - Componente base para botões
 * 
 * Botão padronizado seguindo o design system do Fênix CRM
 */
export const BaseButton: React.FC<BaseButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary: 'bg-[#159A9C] text-white hover:bg-[#137B7D] focus:ring-[#159A9C]/20 shadow-sm',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-200 shadow-sm',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-200 shadow-sm',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-200 shadow-sm',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-200 shadow-sm',
    ghost: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:ring-gray-200'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className="w-4 h-4 mr-2">{icon}</span>
      )}
      
      {children}
      
      {!loading && icon && iconPosition === 'right' && (
        <span className="w-4 h-4 ml-2">{icon}</span>
      )}
    </button>
  );
};

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'success' | 'error' | 'warning';
  text?: string;
  size?: 'sm' | 'md';
}

/**
 * StatusBadge - Badge para status
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  size = 'md'
}) => {
  const statusConfig = {
    active: { color: 'bg-green-100 text-green-800 border-green-200', icon: Check },
    inactive: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: X },
    pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
    success: { color: 'bg-green-100 text-green-800 border-green-200', icon: Check },
    error: { color: 'bg-red-100 text-red-800 border-red-200', icon: X },
    warning: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertTriangle }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm'
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full border
      ${config.color}
      ${sizeClasses[size]}
    `}>
      <Icon className="w-3 h-3 mr-1" />
      {text || status}
    </span>
  );
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

/**
 * LoadingSpinner - Spinner de carregamento
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'text-[#159A9C]',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`animate-spin ${sizeClasses[size]} ${color} ${className}`}>
      <div className="w-full h-full border-2 border-current border-t-transparent rounded-full"></div>
    </div>
  );
};
