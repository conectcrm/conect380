import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'ref'> {
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ options, placeholder = "Selecione...", error = false, className = '', ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={`
            w-full px-3 py-2 border rounded-lg
            bg-white text-gray-900
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            appearance-none cursor-pointer
            transition-colors duration-200
            ${error ? 'border-red-300' : 'border-gray-300'}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" className="text-gray-500">
              {placeholder}
            </option>
          )}
          {options.map(option => (
            <option 
              key={option.value} 
              value={option.value}
              className="text-gray-900 bg-white"
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Ícone de dropdown customizado */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';
