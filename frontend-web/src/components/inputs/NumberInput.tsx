import React, { forwardRef } from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

interface NumberInputProps extends Omit<NumericFormatProps, 'value' | 'onValueChange'> {
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
  allowDecimals?: boolean;
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onValueChange,
      label,
      error,
      required = false,
      className = '',
      disabled = false,
      placeholder = '0',
      min,
      max,
      decimalScale = 0,
      allowDecimals = false,
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
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <NumericFormat
              {...props}
              getInputRef={ref}
              value={value === 0 ? '' : value || ''}
              onValueChange={handleValueChange}
              thousandSeparator="."
              decimalSeparator=","
              decimalScale={allowDecimals ? decimalScale : 0}
              fixedDecimalScale={allowDecimals}
              placeholder={placeholder}
              allowNegative={false}
              allowLeadingZeros={false}
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
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}

        {!label && (
          <NumericFormat
            {...props}
            getInputRef={ref}
            value={value === 0 ? '' : value || ''}
            onValueChange={handleValueChange}
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={allowDecimals ? decimalScale : 0}
            fixedDecimalScale={allowDecimals}
            placeholder={placeholder}
            allowNegative={false}
            allowLeadingZeros={false}
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

NumberInput.displayName = 'NumberInput';

export default NumberInput;
