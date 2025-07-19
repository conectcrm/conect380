import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantClasses = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
  outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
  ghost: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm min-h-[32px]',
  md: 'px-4 py-2 text-base min-h-[40px]',
  lg: 'px-6 py-3 text-lg min-h-[48px]',
};

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText = 'Carregando...',
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      className = '',
      onClick,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const { announceToScreenReader } = useAccessibility({ announceChanges: true });
    const buttonId = React.useId();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) {
        event.preventDefault();
        return;
      }

      // Anunciar ação para leitores de tela
      if (ariaLabel) {
        announceToScreenReader(`Botão ${ariaLabel} ativado`, 'polite');
      }

      onClick?.(event);
    };

    const baseClasses = `
      accessible-button
      inline-flex items-center justify-center
      font-medium rounded-lg transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      relative overflow-hidden
    `;

    const classes = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      fullWidth ? 'w-full' : '',
      loading ? 'cursor-wait' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        id={buttonId}
        className={classes}
        disabled={disabled || loading}
        onClick={handleClick}
        aria-label={ariaLabel}
        aria-busy={loading}
        aria-describedby={loading ? `${buttonId}-loading` : undefined}
        role="button"
        {...props}
      >
        {/* Loading State */}
        {loading && (
          <>
            <span
              id={`${buttonId}-loading`}
              className="sr-only"
              aria-live="polite"
            >
              {loadingText}
            </span>
            <div
              className="absolute inset-0 flex items-center justify-center bg-inherit"
              aria-hidden="true"
            >
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          </>
        )}

        {/* Button Content */}
        <span className={loading ? 'invisible' : 'flex items-center justify-center gap-2'}>
          {leftIcon && (
            <span aria-hidden="true" className="flex-shrink-0">
              {leftIcon}
            </span>
          )}
          <span>{children}</span>
          {rightIcon && (
            <span aria-hidden="true" className="flex-shrink-0">
              {rightIcon}
            </span>
          )}
        </span>
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';
