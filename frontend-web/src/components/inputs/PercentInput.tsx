import React, { forwardRef } from 'react';
import { PatternFormat, PatternFormatProps } from 'react-number-format';

interface PercentInputProps extends Omit<PatternFormatProps, 'value' | 'onValueChange' | 'format'> {
  value?: number;
  onValueChange?: (value: number) => void;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  decimalScale?: number;
}

const PercentInput = forwardRef<HTMLInputElement, PercentInputProps>(
  (
    {
      value = 0,
      onValueChange,
      label,
      error,
      required = false,
      className = '',
      disabled = false,
      placeholder = '0%',
      min = 0,
      max = 100,
      decimalScale = 2,
      ...props
    },
    ref,
  ) => {
    const handleValueChange = (values: any) => {
      const { floatValue } = values;
      let newValue = floatValue || 0;

      // Aplicar validações de min/max
      if (min !== undefined && newValue < min) {
        newValue = min;
      }
      if (max !== undefined && newValue > max) {
        newValue = max;
      }

      if (onValueChange) {
        onValueChange(newValue);
      }
    };

    return (
      <>
        {label && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <PatternFormat
              {...props}
              getInputRef={ref}
              value={value || ''}
              onValueChange={handleValueChange}
              format="##,##%"
              allowEmptyFormatting={false}
              placeholder={placeholder}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? 'border-red-300 focus:ring-red-500' : ''
              } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              disabled={disabled}
              isAllowed={(values) => {
                const { floatValue } = values;

                // Permite valores vazios
                if (floatValue === undefined) return true;

                // Validações de min/max
                if (min !== undefined && floatValue < min) return false;
                if (max !== undefined && floatValue > max) return false;

                return true;
              }}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            {(min !== undefined || max !== undefined) && (
              <p className="text-xs text-gray-500">
                {min !== undefined && max !== undefined
                  ? `Percentual entre ${min}% e ${max}%`
                  : min !== undefined
                    ? `Percentual mínimo: ${min}%`
                    : `Percentual máximo: ${max}%`}
              </p>
            )}
          </div>
        )}

        {!label && (
          <PatternFormat
            {...props}
            getInputRef={ref}
            value={value || ''}
            onValueChange={handleValueChange}
            format="##,##%"
            allowEmptyFormatting={false}
            placeholder={placeholder}
            className={
              className ||
              `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? 'border-red-300 focus:ring-red-500' : ''
              } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`
            }
            disabled={disabled}
            isAllowed={(values) => {
              const { floatValue } = values;

              // Permite valores vazios
              if (floatValue === undefined) return true;

              // Validações de min/max
              if (min !== undefined && floatValue < min) return false;
              if (max !== undefined && floatValue > max) return false;

              return true;
            }}
          />
        )}
      </>
    );
  },
);

PercentInput.displayName = 'PercentInput';

export default PercentInput;
