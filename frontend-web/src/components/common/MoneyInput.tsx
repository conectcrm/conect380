/**
 * Componente de Input para valores monetários brasileiros
 * Formatação automática: R$ 1.234,56
 *
 * Funcionalidades:
 * - Fo        if        setValue(name, currency.value, { shouldValidate: true });       setValue(name, currency.value, { shouldValidate: true });(currentValue !== currency.value) {matação em tempo real durante digitação
 * - Separador de milhares (ponto)
 * - Separador decimal (vírgula)
 * - Validação de entrada
 * - Conversão para número
 */

import React, { forwardRef, useEffect, useId } from 'react';
import { useSimpleCurrency } from '../../hooks/useSimpleCurrency';

interface MoneyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value?: number;
  onChange?: (value: number, formattedValue: string) => void;
  showSymbol?: boolean;
  allowNegative?: boolean;
  maxDigits?: number;
  error?: boolean;
  errorMessage?: string;
  label?: string;
  required?: boolean;
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  (
    {
      value = 0,
      onChange,
      showSymbol = true,
      allowNegative = false,
      maxDigits = 12,
      error = false,
      errorMessage,
      label,
      required = false,
      className = '',
      disabled = false,
      placeholder,
      ...props
    },
    ref,
  ) => {
    const currency = useSimpleCurrency(value);

    // Sincroniza valor externo - Remove currency da dependência para evitar loop infinito
    useEffect(() => {
      if (value !== currency.value) {
        currency.setValue(value || 0);
      }
    }, [value, currency.setValue, currency.value]);

    // Handler para mudanças
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = currency.handleChange(event);

      if (onChange) {
        onChange(newValue, currency.displayValue);
      }
    };

    const inputId = useId();
    const errorId = useId();

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <input
            {...props}
            ref={ref}
            id={inputId}
            type="text"
            value={currency.displayValue}
            onChange={handleChange}
            disabled={disabled}
            placeholder={placeholder || (showSymbol ? 'R$ 0,00' : '0,00')}
            aria-invalid={error}
            aria-describedby={error && errorMessage ? errorId : undefined}
            className={`
            w-full px-3 py-2 border rounded-lg 
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
            transition-colors text-right
            ${error ? 'border-red-300' : 'border-gray-300'}
            ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
            ${className}
          `}
          />
        </div>

        {error && errorMessage && (
          <p id={errorId} className="mt-1 text-sm text-red-600">
            {errorMessage}
          </p>
        )}
      </div>
    );
  },
);

MoneyInput.displayName = 'MoneyInput';

// Componente simplificado para uso em formulários do React Hook Form
export interface MoneyFieldProps extends Omit<MoneyInputProps, 'onChange' | 'value'> {
  name: string;
  register?: any;
  setValue?: any;
  getValues?: any;
  trigger?: any;
}

export const MoneyField: React.FC<MoneyFieldProps> = ({
  name,
  register,
  setValue,
  getValues,
  trigger,
  ...props
}) => {
  const currency = useSimpleCurrency(0);

  // Sincroniza com o valor do formulário - Remove currency da dependência para evitar loop infinito
  useEffect(() => {
    if (getValues) {
      const currentValue = getValues(name) || 0;
      if (currentValue !== currency.value) {
        currency.setValue(currentValue);
      }
    }
  }, [getValues, name, currency.setValue, currency.value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    currency.handleChange(event);

    if (setValue) {
      setValue(name, currency.value, { shouldValidate: true });
    }

    if (trigger) {
      trigger(name);
    }
  };

  const handleBlur = () => {
    if (setValue) {
      setValue(name, currency.value, { shouldValidate: true });
    }
  };

  return (
    <MoneyInput
      {...props}
      value={currency.value}
      onChange={() => {}} // Controle manual via handleChange
      ref={register ? register(name) : undefined}
      onBlur={handleBlur}
      onInput={handleChange}
    />
  );
};

export default MoneyInput;
