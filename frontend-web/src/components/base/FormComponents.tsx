import React, { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
  errorClassName?: string;
  hint?: string;
}

/**
 * FormField - Componente base para campos de formulário
 * 
 * Componente padronizado para todos os campos de formulário nos modais,
 * garantindo consistência visual e de experiência do usuário.
 * 
 * @example
 * ```tsx
 * <FormField 
 *   label="Nome completo" 
 *   error={errors.nome?.message}
 *   required
 *   hint="Digite o nome completo do cliente"
 * >
 *   <input {...register('nome')} />
 * </FormField>
 * ```
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  children,
  className = '',
  labelClassName = '',
  errorClassName = '',
  hint
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className={`block text-sm font-medium text-gray-700 ${labelClassName}`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {hint && (
        <p className="text-xs text-gray-500 -mt-1 mb-2">{hint}</p>
      )}
      
      {children}
      
      {error && (
        <p className={`text-sm text-red-600 flex items-center ${errorClassName}`}>
          <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
          {error}
        </p>
      )}
    </div>
  );
};

interface BaseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

/**
 * BaseInput - Componente base para inputs
 * 
 * Input padronizado com estilos do Fênix CRM
 */
export const BaseInput: React.FC<BaseInputProps> = ({
  error = false,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const baseClasses = `
    w-full px-3 py-2 border rounded-lg
    focus:outline-none focus:ring-2 focus:ring-[#159A9C]/20 focus:border-[#159A9C]
    transition-all duration-200
    ${error ? 'border-red-300' : 'border-gray-300'}
    ${icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : ''}
    ${className}
  `;

  if (icon) {
    return (
      <div className="relative">
        {iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {icon}
          </div>
        )}
        <input className={baseClasses} {...props} />
        {iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {icon}
          </div>
        )}
      </div>
    );
  }

  return <input className={baseClasses} {...props} />;
};

interface BaseSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

/**
 * BaseSelect - Componente base para selects
 */
export const BaseSelect: React.FC<BaseSelectProps> = ({
  error = false,
  options,
  placeholder = 'Selecione...',
  className = '',
  ...props
}) => {
  const baseClasses = `
    w-full px-3 py-2 border rounded-lg
    focus:outline-none focus:ring-2 focus:ring-[#159A9C]/20 focus:border-[#159A9C]
    transition-all duration-200 bg-white
    ${error ? 'border-red-300' : 'border-gray-300'}
    ${className}
  `;

  return (
    <select className={baseClasses} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

interface BaseTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

/**
 * BaseTextarea - Componente base para textareas
 */
export const BaseTextarea: React.FC<BaseTextareaProps> = ({
  error = false,
  className = '',
  ...props
}) => {
  const baseClasses = `
    w-full px-3 py-2 border rounded-lg
    focus:outline-none focus:ring-2 focus:ring-[#159A9C]/20 focus:border-[#159A9C]
    transition-all duration-200 resize-vertical
    ${error ? 'border-red-300' : 'border-gray-300'}
    ${className}
  `;

  return <textarea className={baseClasses} {...props} />;
};
