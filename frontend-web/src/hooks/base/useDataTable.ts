import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Column<T> {
  key: keyof T | string;
  title: string;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'custom';
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (value: any, item: T) => React.ReactNode;
  hidden?: boolean;
  permission?: string;
}

interface FilterConfig {
  type: 'text' | 'select' | 'date' | 'range' | 'boolean';
  options?: { label: string; value: any }[];
  placeholder?: string;
}

interface DataTableOptions<T> {
  columns: Column<T>[];
  data?: T[];
  queryKey?: string[];
  queryFn?: () => Promise<T[]>;
  pagination?: {
    enabled: boolean;
    pageSize: number;
    pageSizeOptions?: number[];
  };
  sorting?: {
    enabled: boolean;
    multiSort?: boolean;
  };
  filtering?: {
    enabled: boolean;
    globalSearch?: boolean;
    columnFilters?: Record<string, FilterConfig>;
  };
  selection?: {
    enabled: boolean;
    multiple?: boolean;
  };
  export?: {
    enabled: boolean;
    formats?: ('csv' | 'excel' | 'pdf')[];
  };
  actions?: {
    enabled: boolean;
    items: Array<{
      label: string;
      icon?: React.ReactNode;
      onClick: (item: T) => void;
      permission?: string;
      variant?: 'primary' | 'secondary' | 'danger';
    }>;
  };
}

interface TableState<T> {
  // Dados
  originalData: T[];
  filteredData: T[];
  paginatedData: T[];

  // Paginação
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;

  // Ordenação
  sortBy: string | null;
  sortOrder: 'asc' | 'desc';
  multiSortConfig: Array<{ field: string; order: 'asc' | 'desc' }>;

  // Filtros
  globalFilter: string;
  columnFilters: Record<string, any>;

  // Seleção
  selectedItems: T[];
  selectedItemIds: Set<string>;

  // Estados de UI
  isLoading: boolean;
  isExporting: boolean;

  // Configuração de colunas
  visibleColumns: string[];
  columnWidths: Record<string, string>;
}

interface TableActions<T> {
  // Paginação
  goToPage: (page: number) => void;
  changePageSize: (size: number) => void;
  nextPage: () => void;
  previousPage: () => void;

  // Ordenação
  sortBy: (field: string) => void;
  addSort: (field: string, order: 'asc' | 'desc') => void;
  clearSort: () => void;

  // Filtros
  setGlobalFilter: (value: string) => void;
  setColumnFilter: (column: string, value: any) => void;
  clearFilters: () => void;

  // Seleção
  selectItem: (item: T, selected: boolean) => void;
  selectAll: (selected: boolean) => void;
  clearSelection: () => void;

  // Colunas
  toggleColumn: (columnKey: string) => void;
  resizeColumn: (columnKey: string, width: string) => void;
  resetColumns: () => void;

  // Exportação
  exportData: (format: 'csv' | 'excel' | 'pdf', selectedOnly?: boolean) => Promise<void>;

  // Utilitários
  refreshData: () => Promise<void>;
  getSelectedData: () => T[];
}

export function useDataTable<T extends { id: string }>(
  options: DataTableOptions<T>,
): [TableState<T>, TableActions<T>] {
  // Estados locais
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(options.pagination?.pageSize || 25);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [multiSortConfig, setMultiSortConfig] = useState<
    Array<{ field: string; order: 'asc' | 'desc' }>
  >([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({});
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    options.columns.filter((col) => !col.hidden).map((col) => col.key as string),
  );
  const [columnWidths, setColumnWidths] = useState<Record<string, string>>({});
  const [isExporting, setIsExporting] = useState(false);

  // Query para dados (se fornecida)
  const {
    data: queryData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: options.queryKey || ['table-data'],
    queryFn: options.queryFn || (() => Promise.resolve([])),
    enabled: !!options.queryFn,
    staleTime: 5 * 60 * 1000,
  });

  const originalData = options.data || queryData || [];

  // Aplicar filtros
  const filteredData = useMemo(() => {
    let data = [...originalData];

    // Filtro global
    if (globalFilter && options.filtering?.globalSearch) {
      const searchTerm = globalFilter.toLowerCase();
      data = data.filter((item) =>
        options.columns.some((col) => {
          if (!col.filterable) return false;
          const value = getNestedValue(item, col.key as string);
          return value?.toString().toLowerCase().includes(searchTerm);
        }),
      );
    }

    // Filtros por coluna
    Object.entries(columnFilters).forEach(([column, filterValue]) => {
      if (filterValue !== null && filterValue !== '' && filterValue !== undefined) {
        data = data.filter((item) => {
          const value = getNestedValue(item, column);

          // Diferentes tipos de filtro
          if (typeof filterValue === 'string') {
            return value?.toString().toLowerCase().includes(filterValue.toLowerCase());
          } else if (typeof filterValue === 'boolean') {
            return value === filterValue;
          } else if (Array.isArray(filterValue)) {
            return filterValue.includes(value);
          } else if (filterValue.min !== undefined || filterValue.max !== undefined) {
            const numValue = Number(value);
            return (
              (filterValue.min === undefined || numValue >= filterValue.min) &&
              (filterValue.max === undefined || numValue <= filterValue.max)
            );
          }

          return true;
        });
      }
    });

    return data;
  }, [originalData, globalFilter, columnFilters, options.columns, options.filtering?.globalSearch]);

  // Aplicar ordenação
  const sortedData = useMemo(() => {
    if (!sortBy && multiSortConfig.length === 0) return filteredData;

    const data = [...filteredData];

    if (options.sorting?.multiSort && multiSortConfig.length > 0) {
      // Ordenação múltipla
      data.sort((a, b) => {
        for (const { field, order } of multiSortConfig) {
          const aValue = getNestedValue(a, field);
          const bValue = getNestedValue(b, field);

          const comparison = compareValues(aValue, bValue);
          if (comparison !== 0) {
            return order === 'asc' ? comparison : -comparison;
          }
        }
        return 0;
      });
    } else if (sortBy) {
      // Ordenação simples
      data.sort((a, b) => {
        const aValue = getNestedValue(a, sortBy);
        const bValue = getNestedValue(b, sortBy);

        const comparison = compareValues(aValue, bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return data;
  }, [filteredData, sortBy, sortOrder, multiSortConfig, options.sorting?.multiSort]);

  // Aplicar paginação
  const paginatedData = useMemo(() => {
    if (!options.pagination?.enabled) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, options.pagination?.enabled]);

  // Calcular totais
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Itens selecionados
  const selectedItems = useMemo(() => {
    return originalData.filter((item) => selectedItemIds.has(item.id));
  }, [originalData, selectedItemIds]);

  // Estado consolidado
  const state: TableState<T> = {
    originalData,
    filteredData,
    paginatedData,
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    sortBy,
    sortOrder,
    multiSortConfig,
    globalFilter,
    columnFilters,
    selectedItems,
    selectedItemIds,
    isLoading,
    isExporting,
    visibleColumns,
    columnWidths,
  };

  // Ações
  const actions: TableActions<T> = {
    // Paginação
    goToPage: useCallback(
      (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
      },
      [totalPages],
    ),

    changePageSize: useCallback((size: number) => {
      setPageSize(size);
      setCurrentPage(1);
    }, []),

    nextPage: useCallback(() => {
      if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
      }
    }, [currentPage, totalPages]),

    previousPage: useCallback(() => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }, [currentPage]),

    // Ordenação
    sortBy: useCallback(
      (field: string) => {
        if (sortBy === field) {
          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
          setSortBy(field);
          setSortOrder('asc');
        }
        setCurrentPage(1);
      },
      [sortBy, sortOrder],
    ),

    addSort: useCallback((field: string, order: 'asc' | 'desc') => {
      setMultiSortConfig((prev) => {
        const existing = prev.findIndex((s) => s.field === field);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { field, order };
          return updated;
        }
        return [...prev, { field, order }];
      });
      setCurrentPage(1);
    }, []),

    clearSort: useCallback(() => {
      setSortBy(null);
      setMultiSortConfig([]);
    }, []),

    // Filtros
    setGlobalFilter: useCallback((value: string) => {
      setGlobalFilter(value);
      setCurrentPage(1);
    }, []),

    setColumnFilter: useCallback((column: string, value: any) => {
      setColumnFilters((prev) => ({
        ...prev,
        [column]: value,
      }));
      setCurrentPage(1);
    }, []),

    clearFilters: useCallback(() => {
      setGlobalFilter('');
      setColumnFilters({});
      setCurrentPage(1);
    }, []),

    // Seleção
    selectItem: useCallback((item: T, selected: boolean) => {
      setSelectedItemIds((prev) => {
        const newSet = new Set(prev);
        if (selected) {
          newSet.add(item.id);
        } else {
          newSet.delete(item.id);
        }
        return newSet;
      });
    }, []),

    selectAll: useCallback(
      (selected: boolean) => {
        if (selected) {
          setSelectedItemIds(new Set(paginatedData.map((item) => item.id)));
        } else {
          setSelectedItemIds(new Set());
        }
      },
      [paginatedData],
    ),

    clearSelection: useCallback(() => {
      setSelectedItemIds(new Set());
    }, []),

    // Colunas
    toggleColumn: useCallback((columnKey: string) => {
      setVisibleColumns((prev) => {
        if (prev.includes(columnKey)) {
          return prev.filter((key) => key !== columnKey);
        } else {
          return [...prev, columnKey];
        }
      });
    }, []),

    resizeColumn: useCallback((columnKey: string, width: string) => {
      setColumnWidths((prev) => ({
        ...prev,
        [columnKey]: width,
      }));
    }, []),

    resetColumns: useCallback(() => {
      setVisibleColumns(
        options.columns.filter((col) => !col.hidden).map((col) => col.key as string),
      );
      setColumnWidths({});
    }, [options.columns]),

    // Exportação
    exportData: useCallback(
      async (format: 'csv' | 'excel' | 'pdf', selectedOnly = false) => {
        setIsExporting(true);
        try {
          const dataToExport = selectedOnly ? selectedItems : filteredData;

          // TODO: Implementar exportação real
          console.log(`Exporting ${dataToExport.length} items as ${format}`);

          // Simular delay de exportação
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error('Export error:', error);
        } finally {
          setIsExporting(false);
        }
      },
      [selectedItems, filteredData],
    ),

    // Utilitários
    refreshData: useCallback(async () => {
      if (refetch) {
        await refetch();
      }
    }, [refetch]),

    getSelectedData: useCallback(() => {
      return selectedItems;
    }, [selectedItems]),
  };

  return [state, actions];
}

// Utilitários
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function compareValues(a: any, b: any): number {
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : 1;
  if (b === null || b === undefined) return -1;

  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b);
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  return String(a).localeCompare(String(b));
}
