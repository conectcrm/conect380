import React from 'react';
import InputMask from 'react-input-mask';
import { UseFormRegister, FieldError } from 'react-hook-form';

interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  mask?: string;
  required?: boolean;
  error?: FieldError;
  register?: UseFormRegister<any>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  options?: Array<{ value: string; label: string }>;
  rows?: number;
  accept?: string;
  min?: number;
  max?: number;
  step?: number;
  autoComplete?: string;
  helpText?: string;
  onBlur?: (e: any) => void;
  onChange?: (e: any) => void;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = 'text',
  mask,
  required = false,
  error,
  register,
  placeholder,
  disabled = false,
  className = '',
  options,
  rows,
  accept,
  min,
  max,
  step,
  autoComplete,
  helpText,
  onBlur,
  onChange,
  ...props
}) => {
  const baseInputClasses = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${
    error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 hover:border-gray-400'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} ${className}`;

  const renderInput = () => {
    // Select dropdown
    if (type === 'select' && options) {
      return (
        <select
          {...(register && register(name))}
          className={baseInputClasses}
          disabled={disabled}
          {...props}
        >
          <option value="">Selecione uma opção</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    // Textarea
    if (type === 'textarea') {
      return (
        <textarea
          {...(register && register(name))}
          className={baseInputClasses}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows || 4}
          {...props}
        />
      );
    }

    // Input with mask
    if (mask) {
      return (
        <InputMask
          mask={mask}
          {...(register && register(name))}
          className={baseInputClasses}
          placeholder={placeholder}
          disabled={disabled}
          type={type}
          autoComplete={autoComplete}
          onBlur={onBlur}
          onChange={onChange}
          {...props}
        />
      );
    }

    // Regular input
    return (
      <input
        {...(register && register(name))}
        type={type}
        className={baseInputClasses}
        placeholder={placeholder}
        disabled={disabled}
        accept={accept}
        min={min}
        max={max}
        step={step}
        autoComplete={autoComplete}
        onBlur={onBlur}
        onChange={onChange}
        {...props}
      />
    );
  };

  return (
    <div className="mb-4">
      {/* Label */}
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input */}
      {renderInput()}

      {/* Help text */}
      {helpText && !error && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error.message}
        </p>
      )}
    </div>
  );
};

// Componente específico para campos de endereço
interface AddressFieldsProps {
  register: UseFormRegister<any>;
  errors: any;
  prefix?: string;
}

export const AddressFields: React.FC<AddressFieldsProps> = ({
  register,
  errors,
  prefix = 'endereco',
}) => {
  return (
    <div className="space-y-4">
      <FormField
        name={`${prefix}.logradouro`}
        label="Logradouro"
        placeholder="Rua, Avenida, Praça..."
        register={register}
        error={errors[prefix]?.logradouro}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          name={`${prefix}.numero`}
          label="Número"
          placeholder="123"
          register={register}
          error={errors[prefix]?.numero}
        />
        <FormField
          name={`${prefix}.complemento`}
          label="Complemento"
          placeholder="Apto 45"
          register={register}
          error={errors[prefix]?.complemento}
        />
        <FormField
          name={`${prefix}.bairro`}
          label="Bairro"
          placeholder="Centro"
          register={register}
          error={errors[prefix]?.bairro}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          name={`${prefix}.cidade`}
          label="Cidade"
          placeholder="São Paulo"
          register={register}
          error={errors[prefix]?.cidade}
        />
        <FormField
          name={`${prefix}.estado`}
          label="Estado"
          placeholder="SP"
          register={register}
          error={errors[prefix]?.estado}
          helpText="Ex: SP, RJ, MG"
          className="uppercase"
        />
      </div>
    </div>
  );
};

// Componente para campos condicionais de CPF/CNPJ
interface DocumentFieldProps {
  register: UseFormRegister<any>;
  errors: any;
  watchTipo: string;
}

export const DocumentField: React.FC<DocumentFieldProps> = ({ register, errors, watchTipo }) => {
  if (watchTipo === 'pessoa_fisica') {
    return (
      <FormField
        name="cpf"
        label="CPF"
        mask="999.999.999-99"
        placeholder="000.000.000-00"
        required
        register={register}
        error={errors.cpf}
        autoComplete="off"
      />
    );
  }

  if (watchTipo === 'pessoa_juridica') {
    return (
      <FormField
        name="cnpj"
        label="CNPJ"
        mask="99.999.999/9999-99"
        placeholder="00.000.000/0000-00"
        required
        register={register}
        error={errors.cnpj}
        autoComplete="off"
      />
    );
  }

  return null;
};

// Componente para seleção de tags
interface TagsFieldProps {
  name: string;
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  error?: FieldError;
  availableTags?: string[];
  placeholder?: string;
}

export const TagsField: React.FC<TagsFieldProps> = ({
  name,
  label,
  value = [],
  onChange,
  error,
  availableTags = ['Premium', 'VIP', 'Startup', 'Corporativo', 'Lead Quente'],
  placeholder = 'Digite uma tag e pressione Enter',
}) => {
  const [inputValue, setInputValue] = React.useState('');

  const addTag = (tag: string) => {
    if (tag.trim() && !value.includes(tag.trim()) && value.length < 10) {
      onChange([...value, tag.trim()]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>

      {/* Tags existentes */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#DEEFE7] text-[#159A9C] border border-[#159A9C]/20"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[#159A9C] hover:bg-[#159A9C] hover:text-white transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input para nova tag */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        disabled={value.length >= 10}
      />

      {/* Tags sugeridas */}
      {availableTags.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-1">Tags sugeridas:</p>
          <div className="flex flex-wrap gap-1">
            {availableTags
              .filter((tag) => !value.includes(tag))
              .map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="text-xs px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
                  disabled={value.length >= 10}
                >
                  + {tag}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Limite de tags */}
      <p className="mt-1 text-xs text-gray-500">{value.length}/10 tags</p>

      {/* Error message */}
      {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
    </div>
  );
};

export default FormField;
