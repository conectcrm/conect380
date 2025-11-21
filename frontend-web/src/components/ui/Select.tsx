import React from 'react';

type SelectBaseProps = React.SelectHTMLAttributes<HTMLSelectElement>;

interface SelectProps extends SelectBaseProps {
  onValueChange?: (value: string) => void;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', children, onValueChange, onChange, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        onChange(event);
      }
      if (onValueChange) {
        onValueChange(event.target.value);
      }
    };

    return (
      <select
        ref={ref}
        className={`w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
        onChange={handleChange}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export const SelectTrigger = Select;

export const SelectValue: React.FC<{ placeholder?: string }> = () => null;

export const SelectContent: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  children: React.ReactNode;
}

export const SelectItem = React.forwardRef<HTMLOptionElement, SelectItemProps>(
  ({ className = '', children, ...props }, ref) => (
    <option
      ref={ref}
      className={`py-2 px-3 text-gray-900 ${className}`.trim()}
      {...props}
    >
      {children}
    </option>
  )
);
SelectItem.displayName = 'SelectItem';

export const Option = SelectItem;

interface SeparatorProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const Separator: React.FC<SeparatorProps> = ({ className = '', orientation = 'horizontal' }) => {
  const baseClasses = orientation === 'horizontal' ? 'w-full h-px my-4' : 'h-full w-px mx-4';
  return <hr className={`${baseClasses} bg-gray-200 ${className}`.trim()} />;
};

interface AlertProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive';
}

export const Alert: React.FC<AlertProps> = ({ children, className = '', variant = 'default' }) => {
  const baseClass = 'rounded-lg border p-4';
  const variantClass =
    variant === 'destructive'
      ? 'border-red-300 bg-red-50 text-red-900'
      : 'border-blue-300 bg-blue-50 text-blue-900';

  return <div className={`${baseClass} ${variantClass} ${className}`.trim()}>{children}</div>;
};

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const AlertDescription: React.FC<AlertDescriptionProps> = ({ children, className = '' }) => (
  <p className={`text-sm ${className}`.trim()}>{children}</p>
);
