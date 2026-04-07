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
  placement?: 'center' | 'right-drawer' | 'page';
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
  modalClassName = '',
  placement = 'center',
}) => {
  const maxWidthValues: Record<NonNullable<BaseModalProps['maxWidth']>, string> = {
    sm: '24rem',
    md: '28rem',
    lg: '32rem',
    xl: '36rem',
    '2xl': '42rem',
    '3xl': '48rem',
    '4xl': '56rem',
    '5xl': '64rem',
    '6xl': '72rem',
    '7xl': '80rem',
  };

  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  const isRightDrawer = placement === 'right-drawer';
  const isPage = placement === 'page';

  React.useEffect(() => {
    if (isOpen && !isPage) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (!isPage) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isOpen, handleKeyDown, isPage]);

  if (!isOpen) return null;
  if (isPage) {
    return (
      <div className={`w-full ${overlayClassName}`}>
        <div
          className={`
            relative w-full overflow-hidden
            bg-white rounded-2xl
            border border-[#B4BEC9]/35 shadow-sm
            ${modalClassName}
          `}
        >
          <div className="flex items-center justify-between border-b border-[#B4BEC9]/30 bg-gradient-to-r from-[#159A9C] to-[#1BB5B8] p-6">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              {subtitle && <p className="text-sm text-white/80 mt-1">{subtitle}</p>}
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

          <div>{children}</div>
        </div>
      </div>
    );
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300 ${
        isRightDrawer ? 'items-stretch justify-end p-0' : 'items-center justify-center p-4'
      } ${overlayClassName}`}
      onClick={handleOverlayClick}
    >
      <div
        className={`
          relative bg-white shadow-2xl
          transform transition-all duration-300
          border border-gray-200
          ${
            isRightDrawer
              ? 'h-full w-full rounded-none border-y-0 border-r-0'
              : 'w-full rounded-xl scale-100'
          }
          ${modalClassName}
        `}
        style={
          isRightDrawer
            ? { maxHeight: '100vh', maxWidth: maxWidthValues[maxWidth], width: '100%' }
            : { maxHeight: '90vh', maxWidth: maxWidthValues[maxWidth] }
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#159A9C] to-[#1BB5B8]">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            {subtitle && <p className="text-sm text-white/80 mt-1">{subtitle}</p>}
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
        <div
          className="overflow-y-auto"
          style={{ maxHeight: isRightDrawer ? 'calc(100vh - 140px)' : 'calc(90vh - 140px)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
