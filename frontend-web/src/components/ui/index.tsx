import React, { useCallback, useContext, useMemo, useState } from 'react';

// Componentes básicos usando classes CSS do Tailwind
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={`card ${className || ''}`}>{children}</div>;

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={`card-header ${className || ''}`}>{children}</div>;

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <h3 className={`card-title ${className || ''}`}>{children}</h3>;

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={`p-6 ${className || ''}`}>{children}</div>;

export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  disabled,
}) => {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'bg-transparent hover:bg-gray-100',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${className || ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className,
  type = 'text',
  ...props
}) => <input type={type} {...props} className={`input-field ${className || ''}`} />;

export const Label: React.FC<{
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}> = ({ children, htmlFor, className }) => (
  <label
    htmlFor={htmlFor}
    className={`block text-sm font-medium text-gray-700 mb-1 ${className || ''}`}
  >
    {children}
  </label>
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className,
  rows = 3,
  ...props
}) => <textarea {...props} rows={rows} className={`input-field resize-none ${className || ''}`} />;

type SwitchBaseProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'checked' | 'disabled'
>;

export const Switch: React.FC<
  {
    checked?: boolean;
    defaultChecked?: boolean;
    onChange?: (checked: boolean) => void;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
  } & SwitchBaseProps
> = ({ checked, defaultChecked, onChange, onCheckedChange, disabled, className, ...rest }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.target.checked);
    onCheckedChange?.(event.target.checked);
  };

  return (
    <label
      className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}
    >
      <input
        type="checkbox"
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only peer"
        {...rest}
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  );
};

type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'default'
  | 'outline'
  | 'destructive';

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}> = ({ children, variant = 'primary', className }) => {
  const variantClasses: Record<BadgeVariant, string> = {
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    default: 'bg-blue-100 text-blue-800',
    outline: 'border border-gray-300 text-gray-700 bg-transparent',
    destructive: 'bg-red-100 text-red-800',
  };

  const resolvedVariant = variantClasses[variant] ? variant : 'primary';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        variantClasses[resolvedVariant]
      } ${className || ''}`}
    >
      {children}
    </span>
  );
};

export const Alert: React.FC<{
  children: React.ReactNode;
  variant?: 'info' | 'warning' | 'error' | 'success';
  className?: string;
}> = ({ children, variant = 'info', className }) => {
  const variantClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  };

  return (
    <div className={`border rounded-lg p-4 ${variantClasses[variant]} ${className || ''}`}>
      {children}
    </div>
  );
};

export const AlertDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={`text-sm ${className || ''}`}>{children}</div>;

// Componentes de Tabs
interface TabsContextValue {
  value: string;
  onChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

export const Tabs: React.FC<{
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}> = ({ children, value, defaultValue, onValueChange, className }) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const isControlled = value !== undefined;
  const activeValue = isControlled ? value! : internalValue;

  const handleChange = useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [isControlled, onValueChange],
  );

  const contextValue = useMemo<TabsContextValue>(
    () => ({ value: activeValue, onChange: handleChange }),
    [activeValue, handleChange],
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={className || ''}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={`flex space-x-1 rounded-lg bg-gray-100 p-1 ${className || ''}`}>{children}</div>
);

export const TabsTrigger: React.FC<{
  children: React.ReactNode;
  value: string;
  className?: string;
}> = ({ children, value, className }) => {
  const context = useContext(TabsContext);

  const isActive = context?.value === value;

  const handleClick = useCallback(() => {
    context?.onChange(value);
  }, [context, value]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
        isActive ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
      } ${className || ''}`}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{
  children: React.ReactNode;
  value: string;
  className?: string;
}> = ({ children, value, className }) => {
  const context = useContext(TabsContext);

  if (context && context.value !== value) {
    return null;
  }

  return <div className={`mt-4 ${className || ''}`}>{children}</div>;
};

// Componentes de Select
export const Select: React.FC<{
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}> = ({ children }) => <div className="relative">{children}</div>;

export const SelectTrigger: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <button className={`input-field flex items-center justify-between ${className || ''}`}>
    {children}
  </button>
);

export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => (
  <span className="text-gray-500">{placeholder}</span>
);

export const SelectContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
    {children}
  </div>
);

export const SelectItem: React.FC<{
  children: React.ReactNode;
  value: string;
  onClick?: () => void;
}> = ({ children, onClick }) => (
  <div onClick={onClick} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
    {children}
  </div>
);

// Componentes de Table
export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <table className={`w-full border-collapse ${className || ''}`}>{children}</table>;

export const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="bg-gray-50">{children}</thead>
);

export const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody className="divide-y divide-gray-200">{children}</tbody>
);

export const TableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <tr className={className}>{children}</tr>;

export const TableHead: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <th
    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className || ''}`}
  >
    {children}
  </th>
);

export const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className || ''}`}>
    {children}
  </td>
);

// Componentes de Dialog/Modal
interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined);

export const Dialog: React.FC<{
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}> = ({ children, open, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? !!open : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const contextValue = useMemo<DialogContextValue>(
    () => ({ open: currentOpen, setOpen }),
    [currentOpen, setOpen],
  );

  return <DialogContext.Provider value={contextValue}>{children}</DialogContext.Provider>;
};

export const DialogContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  const context = useContext(DialogContext);

  if (!context?.open) {
    return null;
  }

  const handleBackdropClick = () => {
    context.setOpen(false);
  };

  const handleContentClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white rounded-lg shadow-xl max-w-md w-full mx-4 ${className || ''}`}
        onClick={handleContentClick}
      >
        {children}
      </div>
    </div>
  );
};

export const DialogHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-6 py-4 border-b">{children}</div>
);

export const DialogTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-lg font-semibold">{children}</h2>
);

export const DialogTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({
  children,
  asChild = false,
}) => {
  const context = useContext(DialogContext);

  if (!context) {
    return <>{children}</>;
  }

  const handleClick: React.MouseEventHandler<HTMLElement> = (event) => {
    if (React.isValidElement(children) && typeof children.props.onClick === 'function') {
      children.props.onClick(event);
    }

    if (!event.defaultPrevented) {
      context.setOpen(true);
    }
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
    } as Record<string, unknown>);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="px-4 py-2 rounded-md border border-gray-300 bg-white"
    >
      {children}
    </button>
  );
};

export const Checkbox: React.FC<{
  id?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}> = ({ id, checked, onChange, onCheckedChange, disabled, className }) => {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const nextChecked = event.target.checked;
    onChange?.(nextChecked);
    onCheckedChange?.(nextChecked);
  };

  return (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={handleChange}
      disabled={disabled}
      className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${className || ''}`}
    />
  );
};

// Componentes de Progress
export const Progress: React.FC<{ value?: number; className?: string }> = ({
  value = 0,
  className,
}) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className || ''}`}>
    <div
      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    ></div>
  </div>
);
