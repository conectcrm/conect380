import React, { forwardRef } from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

interface MoneyInputNoPrefixProps extends Omit<NumericFormatProps, 'value' | 'onValueChange'> {
  value?: number;
  onValueChange?: (value: number) => void;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

const MoneyInputNoPrefix = forwardRef<HTMLInputElement, MoneyInputNoPrefixProps>(({
  value,
  onValueChange,
  label,
  error,
  required = false,
  className = "",
  disabled = false,
  placeholder = "0,00",
  ...props
}, ref) => {

  const handleValueChange = (values: any) => {
    const { floatValue } = values;
    if (onValueChange) {
      onValueChange(floatValue || 0);
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
            decimalScale={2}
            fixedDecimalScale={true}
            placeholder={placeholder}
            allowNegative={false}
            allowLeadingZeros={false}
            className={className || `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${error ? 'border-red-300 focus:ring-red-500' : ''
              } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
            disabled={disabled}
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
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
          decimalScale={2}
          fixedDecimalScale={true}
          placeholder={placeholder}
          allowNegative={false}
          allowLeadingZeros={false}
          className={className || `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${error ? 'border-red-300 focus:ring-red-500' : ''
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
          disabled={disabled}
        />
      )}
    </>
  );
});

MoneyInputNoPrefix.displayName = 'MoneyInputNoPrefix';

export default MoneyInputNoPrefix;
