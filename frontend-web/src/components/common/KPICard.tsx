import React from 'react';
import { LucideIcon } from 'lucide-react';
import { LoaderIcon, ArrowUpIcon, ArrowDownIcon } from '../icons';

interface KPICardProps {
  title?: string;
  titulo?: string;
  value?: string | number;
  valor?: string | number;
  subtitle?: string;
  descricao?: string;
  icon?: React.ReactNode;
  icone?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  isLoading?: boolean;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'crevasse';
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    text: 'text-blue-600',
    border: 'border-blue-200',
  },
  green: {
    bg: 'bg-green-50',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    text: 'text-green-600',
    border: 'border-green-200',
  },
  purple: {
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    text: 'text-purple-600',
    border: 'border-purple-200',
  },
  orange: {
    bg: 'bg-orange-50',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    text: 'text-orange-600',
    border: 'border-orange-200',
  },
  red: {
    bg: 'bg-red-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    text: 'text-red-600',
    border: 'border-red-200',
  },
  // Tema Crevasse - Paleta oficial do sistema
  crevasse: {
    bg: 'bg-white',
    iconBg: 'bg-[#DEEFE7]',
    iconColor: 'text-[#159A9C]',
    text: 'text-[#002333]',
    border: 'border-[#DEEFE7]',
  },
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  titulo,
  value,
  valor,
  subtitle,
  descricao,
  icon,
  icone,
  trend,
  isLoading = false,
  color = 'crevasse',
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) => {
  // Suportar props em português e inglês
  const displayTitle = titulo || title || '';
  const displayValue = valor ?? value ?? '';
  const displaySubtitle = descricao || subtitle;

  // Se icone (LucideIcon) for passado, renderizar como componente
  const Icon = icone;
  const displayIcon = Icon ? <Icon className="h-8 w-8" /> : icon;

  const colors = colorClasses[color];
  const cardId = React.useId();
  const valueId = `${cardId}-value`;
  const trendId = `${cardId}-trend`;

  // Gera aria-label automático se não fornecido
  const autoAriaLabel =
    ariaLabel ||
    `${displayTitle}: ${typeof displayValue === 'number' ? displayValue.toLocaleString('pt-BR') : displayValue}${trend ? `, tendência ${trend.isPositive ? 'positiva' : 'negativa'} de ${trend.value}%` : ''}`;

  if (isLoading) {
    return (
      <div
        className={`bg-white rounded-xl shadow-sm border p-4 sm:p-6 ${className}`}
        role="status"
        aria-label="Carregando dados do indicador"
        aria-live="polite"
      >
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div
            className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-20 sm:w-24"
            aria-hidden="true"
          ></div>
          <div className={`p-2 sm:p-3 rounded-xl ${colors.iconBg}`} aria-hidden="true">
            <LoaderIcon size={20} className={`sm:w-6 sm:h-6 ${colors.iconColor}`} />
          </div>
        </div>
        <div className="space-y-1 sm:space-y-2">
          <div
            className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse w-16 sm:w-20"
            aria-hidden="true"
          ></div>
          <div
            className="h-2 sm:h-3 bg-gray-200 rounded animate-pulse w-24 sm:w-32"
            aria-hidden="true"
          ></div>
        </div>
        <span className="sr-only">Carregando indicador: {displayTitle}</span>
      </div>
    );
  }

  return (
    <article
      className={`
        bg-white rounded-xl shadow-sm border hover:shadow-md
        transition-all duration-200 p-4 sm:p-6 ${colors.border} ${className}
        focus-within:ring-2 focus-within:ring-[#159A9C]/40 focus-within:ring-offset-2
      `}
      role="region"
      aria-label={autoAriaLabel}
      aria-describedby={ariaDescribedBy}
      tabIndex={0}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3
          className="text-xs sm:text-sm font-medium text-gray-600 truncate pr-2"
          id={`${cardId}-title`}
        >
          {displayTitle}
        </h3>
        <div
          className={`p-2 sm:p-3 rounded-xl ${colors.iconBg} flex-shrink-0`}
          aria-label={`Ícone do indicador ${displayTitle}`}
          role="img"
        >
          <div className={colors.iconColor} aria-hidden="true">
            {displayIcon}
          </div>
        </div>
      </div>

      {/* Value */}
      <div className="space-y-1 sm:space-y-2">
        <p
          className="text-xl sm:text-3xl font-bold text-gray-900 break-all"
          id={valueId}
          aria-label={`Valor: ${typeof displayValue === 'number' ? displayValue.toLocaleString('pt-BR') : displayValue}`}
        >
          {typeof displayValue === 'number' ? displayValue.toLocaleString('pt-BR') : displayValue}
        </p>

        {/* Trend and Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
          {displaySubtitle && (
            <p
              className="text-xs sm:text-sm text-gray-500 truncate"
              aria-label={`Descrição: ${displaySubtitle}`}
            >
              {displaySubtitle}
            </p>
          )}

          {trend && (
            <div
              className={`
                flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-full self-start sm:self-auto
                ${trend.isPositive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}
              `}
              id={trendId}
              role="status"
              aria-label={`Tendência ${trend.isPositive ? 'positiva' : 'negativa'} de ${Math.abs(trend.value)}% ${trend.label}`}
            >
              {trend.isPositive ? (
                <ArrowUpIcon size={10} aria-hidden="true" />
              ) : (
                <ArrowDownIcon size={10} aria-hidden="true" />
              )}
              <span className="whitespace-nowrap" aria-hidden="true">
                {Math.abs(trend.value)}%
              </span>
              <span className="text-gray-500 hidden sm:inline" aria-hidden="true">
                {trend.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
