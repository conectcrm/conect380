// Templates padronizados para páginas do ConectCRM
// Baseado no padrão estabelecido pela tela de Fornecedores

export { default as StandardPageTemplate } from './StandardPageTemplate';
export { default as StandardDataTable } from './StandardDataTable';

// Tipos auxiliares para templates
export interface DashboardCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'red' | 'purple' | 'yellow' | 'indigo';
  bgGradient?: string;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableAction<T> {
  label: string;
  onClick: (item: T) => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'danger' | 'success';
  show?: (item: T) => boolean;
}

export interface PaginationConfig {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export interface FilterConfig {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}

export interface SearchConfig {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
}

export interface BulkActionsConfig {
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  actions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'danger';
  }>;
}

export interface ActionConfig {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'outline' | 'danger';
}

export interface EmptyStateConfig {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
  };
}
