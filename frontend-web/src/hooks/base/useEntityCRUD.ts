import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';
import { useNotification } from '../useNotification';

interface CRUDOptions<T> {
  entityName: string;
  service: {
    listar: () => Promise<T[]>;
    buscarPorId: (id: string) => Promise<T>;
    criar: (data: Partial<T>) => Promise<T>;
    atualizar: (id: string, data: Partial<T>) => Promise<T>;
    deletar: (id: string) => Promise<void>;
  };
  permissions?: {
    read?: string;
    create?: string;
    update?: string;
    delete?: string;
  };
  auditConfig?: {
    entityType: string;
    trackActions: ('create' | 'update' | 'delete')[];
  };
}

interface CRUDState<T> {
  // Dados
  items: T[];
  selectedItem: T | null;
  
  // Estados de loading
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Estados de UI
  isModalOpen: boolean;
  modalMode: 'create' | 'edit' | 'view';
  
  // Paginação
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  
  // Filtros
  filters: Record<string, any>;
  searchTerm: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface CRUDActions<T> {
  // Ações de dados
  criar: (data: Partial<T>) => Promise<void>;
  atualizar: (id: string, data: Partial<T>) => Promise<void>;
  deletar: (id: string) => Promise<void>;
  buscarPorId: (id: string) => Promise<T | null>;
  recarregar: () => Promise<void>;
  
  // Ações de UI
  abrirModal: (mode: 'create' | 'edit' | 'view', item?: T) => void;
  fecharModal: () => void;
  selecionarItem: (item: T | null) => void;
  
  // Ações de filtro/busca
  setFiltros: (filtros: Record<string, any>) => void;
  setBusca: (termo: string) => void;
  setSorting: (campo: string, ordem?: 'asc' | 'desc') => void;
  irParaPagina: (pagina: number) => void;
  
  // Ações em lote
  deletarSelecionados: (ids: string[]) => Promise<void>;
  exportarDados: (formato: 'csv' | 'excel' | 'pdf') => Promise<void>;
}

export function useEntityCRUD<T extends { id: string }>(
  options: CRUDOptions<T>
): [CRUDState<T>, CRUDActions<T>] {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  
  const [state, setState] = useState<CRUDState<T>>({
    items: [],
    selectedItem: null,
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    isModalOpen: false,
    modalMode: 'create',
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 25,
    filters: {},
    searchTerm: '',
    sortBy: 'id',
    sortOrder: 'desc'
  });

  // Query para listar dados
  const {
    data: items = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: [options.entityName, 'list', state.currentPage, state.filters, state.searchTerm, state.sortBy, state.sortOrder],
    queryFn: () => options.service.listar(),
    enabled: !!user, // Simplificado - sempre habilitado se usuário logado
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: options.service.criar,
    onSuccess: async (newItem) => {
      queryClient.invalidateQueries({ queryKey: [options.entityName] });
      
      // TODO: Implementar auditoria quando necessário
      console.log('CRUD: Created item', newItem);
      
      showNotification({
        tipo: 'sucesso',
        titulo: 'Sucesso!',
        mensagem: `${options.entityName} criado com sucesso.`
      });
      
      setState(prev => ({ ...prev, isModalOpen: false, selectedItem: null }));
    },
    onError: (error: any) => {
      showNotification({
        tipo: 'erro',
        titulo: 'Erro ao criar',
        mensagem: error.message || `Erro ao criar ${options.entityName}.`
      });
    }
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<T> }) => 
      options.service.atualizar(id, data),
    onSuccess: async (updatedItem, variables) => {
      queryClient.invalidateQueries({ queryKey: [options.entityName] });
      
      // TODO: Implementar auditoria quando necessário
      console.log('CRUD: Updated item', updatedItem);
      
      showNotification({
        tipo: 'sucesso',
        titulo: 'Sucesso!',
        mensagem: `${options.entityName} atualizado com sucesso.`
      });
      
      setState(prev => ({ ...prev, isModalOpen: false, selectedItem: null }));
    },
    onError: (error: any) => {
      showNotification({
        tipo: 'erro',
        titulo: 'Erro ao atualizar',
        mensagem: error.message || `Erro ao atualizar ${options.entityName}.`
      });
    }
  });

  // Mutation para deletar
  const deleteMutation = useMutation({
    mutationFn: options.service.deletar,
    onSuccess: async (_, id) => {
      queryClient.invalidateQueries({ queryKey: [options.entityName] });
      
      // TODO: Implementar auditoria quando necessário
      console.log('CRUD: Deleted item', id);
      
      showNotification({
        tipo: 'sucesso',
        titulo: 'Sucesso!',
        mensagem: `${options.entityName} deletado com sucesso.`
      });
    },
    onError: (error: any) => {
      showNotification({
        tipo: 'erro',
        titulo: 'Erro ao deletar',
        mensagem: error.message || `Erro ao deletar ${options.entityName}.`
      });
    }
  });

  // Atualizar estado quando dados mudam
  useEffect(() => {
    setState(prev => ({
      ...prev,
      items,
      isLoading,
      totalItems: items.length
    }));
  }, [items, isLoading]);

  // Ações
  const actions: CRUDActions<T> = {
    // Ações de dados
    criar: useCallback(async (data: Partial<T>) => {
      // TODO: Implementar verificação de permissão quando necessário
      setState(prev => ({ ...prev, isCreating: true }));
      await createMutation.mutateAsync(data);
      setState(prev => ({ ...prev, isCreating: false }));
    }, [createMutation]),

    atualizar: useCallback(async (id: string, data: Partial<T>) => {
      // TODO: Implementar verificação de permissão quando necessário
      setState(prev => ({ ...prev, isUpdating: true }));
      await updateMutation.mutateAsync({ id, data });
      setState(prev => ({ ...prev, isUpdating: false }));
    }, [updateMutation]),

    deletar: useCallback(async (id: string) => {
      // TODO: Implementar verificação de permissão quando necessário
      if (window.confirm(`Tem certeza que deseja deletar este ${options.entityName}?`)) {
        setState(prev => ({ ...prev, isDeleting: true }));
        await deleteMutation.mutateAsync(id);
        setState(prev => ({ ...prev, isDeleting: false }));
      }
    }, [deleteMutation, options.entityName]),

    buscarPorId: useCallback(async (id: string) => {
      try {
        return await options.service.buscarPorId(id);
      } catch (error) {
        showNotification({
          tipo: 'erro',
          titulo: 'Erro ao buscar',
          mensagem: `Erro ao buscar ${options.entityName}.`
        });
        return null;
      }
    }, [options.service, options.entityName]),

    recarregar: useCallback(async () => {
      await refetch();
    }, [refetch]),

    // Ações de UI
    abrirModal: useCallback((mode: 'create' | 'edit' | 'view', item?: T) => {
      setState(prev => ({
        ...prev,
        isModalOpen: true,
        modalMode: mode,
        selectedItem: item || null
      }));
    }, []),

    fecharModal: useCallback(() => {
      setState(prev => ({
        ...prev,
        isModalOpen: false,
        modalMode: 'create',
        selectedItem: null
      }));
    }, []),

    selecionarItem: useCallback((item: T | null) => {
      setState(prev => ({ ...prev, selectedItem: item }));
    }, []),

    // Ações de filtro/busca
    setFiltros: useCallback((filtros: Record<string, any>) => {
      setState(prev => ({ ...prev, filters: filtros, currentPage: 1 }));
    }, []),

    setBusca: useCallback((termo: string) => {
      setState(prev => ({ ...prev, searchTerm: termo, currentPage: 1 }));
    }, []),

    setSorting: useCallback((campo: string, ordem?: 'asc' | 'desc') => {
      setState(prev => ({
        ...prev,
        sortBy: campo,
        sortOrder: ordem || (prev.sortBy === campo && prev.sortOrder === 'asc' ? 'desc' : 'asc')
      }));
    }, []),

    irParaPagina: useCallback((pagina: number) => {
      setState(prev => ({ ...prev, currentPage: pagina }));
    }, []),

    // Ações em lote
    deletarSelecionados: useCallback(async (ids: string[]) => {
      // TODO: Implementar verificação de permissão quando necessário
      if (window.confirm(`Tem certeza que deseja deletar ${ids.length} itens?`)) {
        for (const id of ids) {
          await deleteMutation.mutateAsync(id);
        }
      }
    }, [deleteMutation]),

    exportarDados: useCallback(async (formato: 'csv' | 'excel' | 'pdf') => {
      // TODO: Implementar exportação
      showNotification({
        tipo: 'info',
        titulo: 'Em desenvolvimento',
        mensagem: `Exportação em ${formato} será implementada em breve.`
      });
    }, [])
  };

  return [state, actions];
}
