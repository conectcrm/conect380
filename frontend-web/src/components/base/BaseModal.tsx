import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  showCloseButton?: boolean;
  overlayClassName?: string;
  modalClassName?: string;
}

/**
 * BaseModal - Componente base para modais do Fênix CRM
 * 
 * Este é o componente padrão para todos os modais do sistema, seguindo
 * as melhores práticas de UX/UI inspiradas em CRMs profissionais.
 * 
 * Características:
 * - Design responsivo
 * - Animações suaves
 * - Acessibilidade completa
 * - Cores padronizadas do Fênix CRM
 * - Estrutura flexível para diferentes tipos de conteúdo
 * 
 * @example
 * ```tsx
 * <BaseModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="Cadastro de Cliente"
 *   subtitle="Preencha as informações do cliente"
 *   maxWidth="4xl"
 * >
 *   <form>
 *     // Conteúdo do modal
 *   </form>
 * </BaseModal>
 * ```
 */
export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '4xl',
  showCloseButton = true,
  overlayClassName = '',
  modalClassName = ''
}) => {
  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl'
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300 ${overlayClassName}`}
      onClick={handleOverlayClick}
    >
      <div 
        className={`
          relative w-full ${maxWidthClasses[maxWidth]} 
          bg-white rounded-xl shadow-2xl 
          transform transition-all duration-300 scale-100
          border border-gray-200
          ${modalClassName}
        `}
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#159A9C] to-[#1BB5B8]">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-white/80 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="
                ml-4 p-2 text-white/80 hover:text-white 
                hover:bg-white/10 rounded-lg transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-white/30
              "
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
