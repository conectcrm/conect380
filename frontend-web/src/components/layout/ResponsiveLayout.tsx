import React from 'react';
import { useResponsive, useModalDimensions } from '../../hooks/useResponsive';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
  padding?: boolean;
  overflow?: 'auto' | 'hidden' | 'visible';
}

/**
 * Layout responsivo global que se adapta a qualquer tamanho de tela
 */
export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className = '',
  maxWidth = '1400px',
  padding = true,
  overflow = 'visible'
}) => {
  const { isMobile, isTablet } = useResponsive();

  const layoutClasses = [
    'responsive-container',
    'w-full',
    'mx-auto',
    overflow === 'hidden' && 'overflow-hidden',
    overflow === 'auto' && 'overflow-auto',
    padding && (isMobile ? 'px-4 py-2' : isTablet ? 'px-6 py-4' : 'px-8 py-6'),
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={layoutClasses}
      style={{ 
        maxWidth,
        overflowX: 'hidden'
      }}
    >
      {children}
    </div>
  );
};

interface AdaptiveColumnsProps {
  children: React.ReactNode;
  minWidth?: number;
  gap?: string;
  className?: string;
}

/**
 * Sistema de colunas que se adapta automaticamente
 */
export const AdaptiveColumns: React.FC<AdaptiveColumnsProps> = ({
  children,
  minWidth = 280,
  gap = 'clamp(1rem, 3vw, 2rem)',
  className = ''
}) => {
  const { width } = useResponsive();
  
  const getColumns = () => {
    const availableWidth = width - 64; // Margem
    const columns = Math.floor(availableWidth / minWidth);
    return Math.max(1, columns);
  };

  return (
    <div 
      className={`adaptive-columns ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${getColumns()}, 1fr)`,
        gap,
        width: '100%',
        overflowX: 'hidden'
      }}
    >
      {children}
    </div>
  );
};

interface ResponsiveModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  maxWidth?: string;
  className?: string;
  preventClose?: boolean;
}

/**
 * Modal totalmente responsivo sem scroll horizontal
 */
export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  children,
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidth = '4xl',
  className = '',
  preventClose = false
}) => {
  const { isMobile } = useResponsive();
  const { modalStyle, shouldUseFullscreen } = useModalDimensions(maxWidth);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !preventClose) {
      onClose();
    }
  };

  const modalClasses = [
    'modal-content',
    'custom-scroll',
    shouldUseFullscreen && 'h-full w-full rounded-none',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className="modal-overlay bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        className={modalClasses}
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || subtitle) && (
          <div className="modal-header">
            {title && (
              <h2 className="heading-responsive font-semibold text-gray-900 mb-1">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-responsive text-gray-600">
                {subtitle}
              </p>
            )}
            {!preventClose && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fechar modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: string;
  className?: string;
}

/**
 * Grid responsivo com breakpoints customizáveis
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'clamp(1rem, 3vw, 2rem)',
  className = ''
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getColumns = () => {
    if (isMobile) return columns.mobile || 1;
    if (isTablet) return columns.tablet || 2;
    if (isDesktop) return columns.desktop || 3;
    return 1;
  };

  return (
    <div 
      className={`responsive-grid ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${getColumns()}, 1fr)`,
        gap,
        width: '100%',
        overflowX: 'hidden'
      }}
    >
      {children}
    </div>
  );
};

interface ResponsiveCardProps {
  children: React.ReactNode;
  padding?: boolean;
  shadow?: boolean;
  border?: boolean;
  className?: string;
}

/**
 * Card responsivo que se adapta ao conteúdo
 */
export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  padding = true,
  shadow = true,
  border = true,
  className = ''
}) => {
  const { isMobile } = useResponsive();

  const cardClasses = [
    'card',
    'bg-white',
    border && 'border border-gray-200',
    shadow && (isMobile ? 'shadow-sm' : 'shadow-md'),
    padding && 'padding-responsive',
    'overflow-hidden',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses}>
      {children}
    </div>
  );
};
