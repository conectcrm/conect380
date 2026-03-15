/**
 * Componente base padronizado para todos os modais do sistema
 * Implementa o design system estabelecido no ModalNovaProposta
 */

import React from 'react';
import { X, Check } from 'lucide-react';
import { ModalStyles, ModalSize } from './ModalStyles';

interface ModalStep {
  id: string;
  titulo: string;
  icone: React.ComponentType<{ className?: string }>;
  descricao?: string;
}

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: ModalSize;
  children: React.ReactNode;

  // Para modais com etapas
  steps?: ModalStep[];
  currentStep?: number;

  // Footer customizável
  footer?: React.ReactNode;

  // Classes extras
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'large',
  children,
  steps,
  currentStep = 0,
  footer,
  className = '',
  headerClassName = '',
  contentClassName = '',
}) => {
  const titleId = React.useId();
  const subtitleId = React.useId();

  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={ModalStyles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`${ModalStyles.container[size]} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
      >
        {/* Header do Modal */}
        <div className={`${ModalStyles.header.container} ${headerClassName}`}>
          <div className={ModalStyles.header.content}>
            <div>
              <h2 id={titleId} className={ModalStyles.header.title}>
                {title}
              </h2>
              {subtitle && (
                <p id={subtitleId} className={ModalStyles.header.subtitle}>
                  {subtitle}
                </p>
              )}
            </div>
            <button onClick={onClose} className={ModalStyles.header.closeButton} type="button">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Bar (se houver etapas) */}
          {steps && steps.length > 0 && (
            <div className={ModalStyles.progressBar.container}>
              <div className={ModalStyles.progressBar.wrapper}>
                {steps.map((step, index) => {
                  const Icone = step.icone;
                  const isAtual = index === currentStep;
                  const isConcluida = index < currentStep;

                  return (
                    <div key={step.id} className={ModalStyles.progressBar.step.container}>
                      <div
                        className={`
                        ${ModalStyles.progressBar.step.icon.base}
                        ${
                          isConcluida
                            ? ModalStyles.progressBar.step.icon.completed
                            : isAtual
                              ? ModalStyles.progressBar.step.icon.current
                              : ModalStyles.progressBar.step.icon.pending
                        }
                      `}
                      >
                        {isConcluida ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Icone className="h-3 w-3" />
                        )}
                      </div>
                      <span
                        className={`
                        ${ModalStyles.progressBar.step.label.base}
                        ${
                          isAtual
                            ? ModalStyles.progressBar.step.label.current
                            : ModalStyles.progressBar.step.label.other
                        }
                      `}
                      >
                        {step.titulo}
                      </span>
                      {index < steps.length - 1 && (
                        <div
                          className={`
                          ${ModalStyles.progressBar.step.separator.base}
                          ${
                            isConcluida
                              ? ModalStyles.progressBar.step.separator.completed
                              : ModalStyles.progressBar.step.separator.pending
                          }
                        `}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Conteúdo do Modal */}
        <div className={ModalStyles.content.container}>
          <div className={`${ModalStyles.content.wrapper} ${contentClassName}`}>{children}</div>
        </div>

        {/* Footer (se fornecido) */}
        {footer && <div className={ModalStyles.footer.container}>{footer}</div>}
      </div>
    </div>
  );
};

// Componentes auxiliares para formulários
interface FormFieldProps {
  label: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  helpText,
  error,
  required = false,
  children,
  className = '',
}) => {
  return (
    <div className={className}>
      <label className={`${ModalStyles.typography.label} ${ModalStyles.form.fieldSpacing}`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {helpText && (
          <span className={`${ModalStyles.typography.helpText} ${ModalStyles.form.helpSpacing}`}>
            ({helpText})
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className={`${ModalStyles.typography.error} ${ModalStyles.form.errorSpacing}`}>
          {error}
        </p>
      )}
    </div>
  );
};

// Componente para input padronizado
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  error = false,
  className = '',
  ...props
}) => {
  return (
    <input
      {...props}
      className={`
        ${ModalStyles.form.input}
        ${error ? 'border-red-300' : ''}
        ${className}
      `}
    />
  );
};

// Componente para select padronizado
interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  error = false,
  className = '',
  options,
  placeholder,
  ...props
}) => {
  return (
    <select
      {...props}
      className={`
        ${ModalStyles.form.select}
        ${error ? 'border-red-300' : ''}
        ${className}
      `}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

// Componente para textarea padronizado
interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  error = false,
  className = '',
  ...props
}) => {
  return (
    <textarea
      {...props}
      className={`
        ${ModalStyles.form.textarea}
        ${error ? 'border-red-300' : ''}
        ${className}
      `}
    />
  );
};

// Componente para botões padronizados
interface ModalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'normal' | 'small';
  icon?: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}

export const ModalButton: React.FC<ModalButtonProps> = ({
  variant = 'secondary',
  size = 'normal',
  icon: Icon,
  loading = false,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const baseClass =
    size === 'small'
      ? `${ModalStyles.button[variant]} ${ModalStyles.button.small}`
      : ModalStyles.button[variant];

  return (
    <button {...props} disabled={disabled || loading} className={`${baseClass} ${className}`}>
      {loading ? (
        <div className={`${ModalStyles.utils.loading} h-4 w-4 border-current mr-2`}></div>
      ) : Icon ? (
        <Icon
          className={`${size === 'small' ? ModalStyles.button.iconSmall : ModalStyles.button.icon} mr-1`}
        />
      ) : null}
      {children}
    </button>
  );
};

// Componente para cards padronizados
interface ModalCardProps {
  variant?: 'default' | 'selected' | 'info' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const ModalCard: React.FC<ModalCardProps> = ({
  variant = 'default',
  children,
  className = '',
  onClick,
}) => {
  const cardClass = `${ModalStyles.card.base} ${ModalStyles.card[variant]}`;
  const clickableClass = onClick ? 'cursor-pointer hover:shadow-sm transition-all' : '';

  return (
    <div className={`${cardClass} ${clickableClass} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
};
