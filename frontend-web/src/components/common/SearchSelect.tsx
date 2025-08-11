import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, Loader2, User, FileText } from 'lucide-react';

interface SearchSelectOption {
  id: string | number;
  label: string;
  subtitle?: string;
  extra?: string;
}

interface SearchSelectProps {
  options: SearchSelectOption[];
  value: SearchSelectOption | null;
  onChange: (option: SearchSelectOption | null) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: 'user' | 'file' | React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

export default function SearchSelect({
  options,
  value,
  onChange,
  onSearch,
  placeholder = "Buscar...",
  label,
  required = false,
  loading = false,
  disabled = false,
  icon = 'user',
  emptyMessage = "Nenhum item encontrado",
  className = ""
}: SearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<SearchSelectOption[]>(options);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Renderizar ícone
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }

    switch (icon) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'file':
        return <FileText className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  // Filtrar opções localmente
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOptions(options);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = options.filter(option =>
      option.label.toLowerCase().includes(query) ||
      option.subtitle?.toLowerCase().includes(query) ||
      option.extra?.toLowerCase().includes(query)
    );
    setFilteredOptions(filtered);
  }, [options, searchQuery]);

  // Busca externa (para buscar no servidor)
  useEffect(() => {
    if (onSearch && searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        onSearch(searchQuery);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, onSearch]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOptionSelect = (option: SearchSelectOption) => {
    onChange(option);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Campo principal */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {renderIcon()}
        </div>

        <input
          type="text"
          value={isOpen ? searchQuery : (value?.label || '')}
          onChange={handleSearchChange}
          onFocus={handleInputFocus}
          placeholder={value ? value.label : placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
            }`}
        />

        {/* Botões laterais */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {loading && (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          )}

          {value && !disabled && (
            <button
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              type="button"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {!disabled && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              type="button"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Carregando...</p>
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">{emptyMessage}</p>
            </div>
          ) : (
            <div className="py-1">
              {filteredOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(option)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                  type="button"
                >
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {option.label}
                      </div>
                      {option.subtitle && (
                        <div className="text-sm text-gray-500">
                          {option.subtitle}
                        </div>
                      )}
                      {option.extra && (
                        <div className="text-xs text-gray-400">
                          {option.extra}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
