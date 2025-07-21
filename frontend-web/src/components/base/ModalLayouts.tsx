import React, { ReactNode } from 'react';

interface ModalSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  icon?: ReactNode;
}

/**
 * ModalSection - Componente para seções dentro de modais
 * 
 * Usado para organizar o conteúdo do modal em seções bem definidas,
 * seguindo o padrão do Fênix CRM.
 */
export const ModalSection: React.FC<ModalSectionProps> = ({
  title,
  subtitle,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
  icon
}) => {
  return (
    <div className={`${className}`}>
      <div className={`mb-4 ${headerClassName}`}>
        <div className="flex items-center">
          {icon && (
            <div className="w-6 h-6 text-[#159A9C] mr-2">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
      <div className={contentClassName}>
        {children}
      </div>
    </div>
  );
};

interface ThreeColumnLayoutProps {
  leftColumn: ReactNode;
  centerColumn: ReactNode;
  rightColumn: ReactNode;
  leftTitle?: string;
  centerTitle?: string;
  rightTitle?: string;
  className?: string;
}

/**
 * ThreeColumnLayout - Layout de 3 colunas para modais
 * 
 * Layout padrão usado no modal de clientes, ideal para formulários
 * complexos que precisam de organização em colunas.
 */
export const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
  leftColumn,
  centerColumn,
  rightColumn,
  leftTitle,
  centerTitle,
  rightTitle,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 ${className}`}>
      {/* Coluna Esquerda */}
      <div className="space-y-6">
        {leftTitle && (
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            {leftTitle}
          </h3>
        )}
        {leftColumn}
      </div>

      {/* Coluna Central */}
      <div className="space-y-6">
        {centerTitle && (
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            {centerTitle}
          </h3>
        )}
        {centerColumn}
      </div>

      {/* Coluna Direita */}
      <div className="space-y-6">
        {rightTitle && (
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            {rightTitle}
          </h3>
        )}
        {rightColumn}
      </div>
    </div>
  );
};

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
  showBorder?: boolean;
}

/**
 * ModalFooter - Footer padronizado para modais
 * 
 * Footer com estilos consistentes para botões de ação.
 */
export const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className = '',
  showBorder = true
}) => {
  return (
    <div className={`
      flex items-center justify-end gap-3 px-6 py-4 bg-gray-50
      ${showBorder ? 'border-t border-gray-200' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

interface StatusPanelProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * StatusPanel - Painel lateral para informações de status
 * 
 * Usado para mostrar informações adicionais, status ou metadados.
 */
export const StatusPanel: React.FC<StatusPanelProps> = ({
  title = 'Informações',
  children,
  className = ''
}) => {
  return (
    <div className={`bg-gray-50 border-l border-gray-200 p-4 ${className}`}>
      {title && (
        <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-2">
          {title}
        </h4>
      )}
      {children}
    </div>
  );
};
