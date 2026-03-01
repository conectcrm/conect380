import React, { forwardRef } from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

interface PercentInputProps extends Omit<NumericFormatProps, 'value' | 'onValueChange'> {
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
      placeholder = '0,00%',
      min = 0,
      max = 100,
      decimalScale = 2,
      ...props
    },
    ref,
  ) => {
    const handleValueChange = (values: { floatValue?: number }) => {
      const { floatValue } = values;
      let nextValue = floatValue || 0;

      if (min !== undefined && nextValue < min) {
        nextValue = min;
      }
      if (max !== undefined && nextValue > max) {
        nextValue = max;
      }

      if (onValueChange) {
        onValueChange(nextValue);
      }
    };

    const composedClassName =
      className ||
      `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        error ? 'border-red-300 focus:ring-red-500' : ''
      } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`;

    const isAllowed = (values: { floatValue?: number }) => {
      const { floatValue } = values;

      if (floatValue === undefined) return true;
      if (min !== undefined && floatValue < min) return false;
      if (max !== undefined && floatValue > max) return false;

      return true;
    };

    return (
      <>
        {label && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <NumericFormat
              {...props}
              getInputRef={ref}
              value={value === 0 ? '' : value || ''}
              onValueChange={handleValueChange}
              suffix="%"
              thousandSeparator="."
              decimalSeparator=","
              decimalScale={decimalScale}
              fixedDecimalScale={false}
              allowNegative={false}
              allowLeadingZeros={false}
              placeholder={placeholder}
              className={composedClassName}
              disabled={disabled}
              isAllowed={isAllowed}
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
          <NumericFormat
            {...props}
            getInputRef={ref}
            value={value === 0 ? '' : value || ''}
            onValueChange={handleValueChange}
            suffix="%"
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={decimalScale}
            fixedDecimalScale={false}
            allowNegative={false}
            allowLeadingZeros={false}
            placeholder={placeholder}
            className={composedClassName}
            disabled={disabled}
            isAllowed={isAllowed}
          />
        )}
      </>
    );
  },
);

PercentInput.displayName = 'PercentInput';

export default PercentInput;
