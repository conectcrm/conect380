import React from 'react';
import { ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';

interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableAction<T> {
  label: string;
  onClick: (item: T) => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'danger' | 'success';
  show?: (item: T) => boolean;
}

interface StandardDataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];

  // Selection
  selectable?: boolean;
  selectedItems?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  getItemId?: (item: T) => string;

  // Sorting
  sortConfig?: {
    key: string;
    direction: 'asc' | 'desc';
  };
  onSort?: (key: string) => void;

  // Pagination
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
  };

  // Loading
  loading?: boolean;

  // Empty state
  emptyState?: {
    title: string;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
}

export function StandardDataTable<T>({
  data,
  columns,
  actions,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  getItemId,
  sortConfig,
  onSort,
  pagination,
  loading = false,
  emptyState
}: StandardDataTableProps<T>) {

  const handleSelectAll = () => {
    if (!getItemId || !onSelectionChange) return;

    const allIds = data.map(item => getItemId(item));
    const allSelected = allIds.every(id => selectedItems.includes(id));

    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(allIds);
    }
  };

  const handleSelectItem = (item: T) => {
    if (!getItemId || !onSelectionChange) return;

    const itemId = getItemId(item);
    const isSelected = selectedItems.includes(itemId);

    if (isSelected) {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    } else {
      onSelectionChange([...selectedItems, itemId]);
    }
  };

  const renderCell = (item: T, column: TableColumn<T>) => {
    if (column.render) {
      return column.render(item);
    }

    const value = (item as any)[column.key];
    return value?.toString() || '';
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return null;
    }

    return sortConfig.direction === 'asc' ?
      <ChevronUp className="w-4 h-4 ml-1" /> :
      <ChevronDown className="w-4 h-4 ml-1" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#159A9C] mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    const EmptyIcon = emptyState?.icon;

    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-12 text-center">
          {EmptyIcon && <EmptyIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />}
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {emptyState?.title || 'Nenhum item encontrado'}
          </h3>
          {emptyState?.description && (
            <p className="text-gray-500 mb-6">{emptyState.description}</p>
          )}
          {emptyState?.action && (
            <button
              onClick={emptyState.action.onClick}
              className="bg-[#159A9C] text-white px-6 py-3 rounded-lg hover:bg-[#138A8C] transition-colors"
            >
              {emptyState.action.label}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Selection column */}
              {selectable && (
                <th className="w-12 px-6 py-3">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selectedItems.length === data.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                  />
                </th>
              )}

              {/* Data columns */}
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.width || ''}`}
                >
                  {column.sortable && onSort ? (
                    <button
                      onClick={() => onSort(column.key as string)}
                      className="flex items-center hover:text-gray-700 transition-colors"
                    >
                      {column.label}
                      {getSortIcon(column.key as string)}
                    </button>
                  ) : (
                    <span>{column.label}</span>
                  )}
                </th>
              ))}

              {/* Actions column */}
              {actions && actions.length > 0 && (
                <th className="w-20 px-6 py-3 text-center">
                  <span className="sr-only">Ações</span>
                </th>
              )}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, rowIndex) => {
              const itemId = getItemId?.(item);
              const isSelected = itemId ? selectedItems.includes(itemId) : false;

              return (
                <tr
                  key={rowIndex}
                  className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''
                    }`}
                >
                  {/* Selection column */}
                  {selectable && itemId && (
                    <td className="w-12 px-6 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectItem(item)}
                        className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                      />
                    </td>
                  )}

                  {/* Data columns */}
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.align === 'center' ? 'text-center' :
                          column.align === 'right' ? 'text-right' : 'text-left'
                        }`}
                    >
                      {renderCell(item, column)}
                    </td>
                  ))}

                  {/* Actions column */}
                  {actions && actions.length > 0 && (
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="relative group inline-block">
                        <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown menu */}
                        <div className="absolute right-0 top-8 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                          <div className="py-1">
                            {actions.map((action, actionIndex) => {
                              const show = action.show ? action.show(item) : true;
                              if (!show) return null;

                              const ActionIcon = action.icon;

                              return (
                                <button
                                  key={actionIndex}
                                  onClick={() => action.onClick(item)}
                                  className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-gray-100 transition-colors ${action.variant === 'danger' ? 'text-red-700 hover:bg-red-50' :
                                      action.variant === 'success' ? 'text-green-700 hover:bg-green-50' :
                                        'text-gray-700'
                                    }`}
                                >
                                  {ActionIcon && <ActionIcon className="w-4 h-4" />}
                                  <span>{action.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
          <div className="text-sm text-gray-500">
            Mostrando {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} a{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} de{' '}
            {pagination.totalItems} resultados
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>

            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const page = i + 1;
              const isCurrentPage = page === pagination.currentPage;

              return (
                <button
                  key={page}
                  onClick={() => pagination.onPageChange(page)}
                  className={`px-3 py-2 text-sm border rounded-md ${isCurrentPage
                      ? 'bg-[#159A9C] border-[#159A9C] text-white'
                      : 'border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StandardDataTable;
