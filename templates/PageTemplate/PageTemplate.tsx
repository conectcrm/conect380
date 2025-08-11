import React from 'react';
import { z } from 'zod';
import { Plus, Download, Filter, Search, MoreHorizontal } from 'lucide-react';

// Importar hooks padronizados
import { useEntityCRUD } from '../../frontend-web/src/hooks/base/useEntityCRUD';
import { useSecureForm } from '../../frontend-web/src/hooks/base/useSecureForm';
import { useDataTable } from '../../frontend-web/src/hooks/base/useDataTable';
import { usePermissionControl } from '../../frontend-web/src/hooks/usePermissionControl';

// Importar componentes base
import { Button } from '../../frontend-web/src/components/ui/Button';
import { Input } from '../../frontend-web/src/components/ui/Input';
import { Modal } from '../../frontend-web/src/components/ui/Modal';
import { DataTable } from '../../frontend-web/src/components/ui/DataTable';
import { Card, CardHeader, CardContent } from '../../frontend-web/src/components/ui/Card';

// ==========================================
// CONFIGURAÇÃO DA ENTIDADE - CUSTOMIZAR AQUI
// ==========================================

// 1. Definir interface da entidade
interface {{ENTITY_NAME}} {
  id: string;
  {{ENTITY_FIELDS}}
  createdAt: string;
  updatedAt: string;
}

// 2. Schema de validação
const {{ENTITY_NAME}}Schema = z.object({
  {{ENTITY_SCHEMA_FIELDS}}
});

// 3. Serviço da entidade (implementar)
const {{entity_name}}Service = {
  listar: async (): Promise<{{ENTITY_NAME}}[]> => {
    // TODO: Implementar chamada para API
    const response = await fetch('/api/{{entity_name_plural}}');
    return response.json();
  },
  
  buscarPorId: async (id: string): Promise<{{ENTITY_NAME}}> => {
    const response = await fetch(`/api/{{entity_name_plural}}/${id}`);
    return response.json();
  },
  
  criar: async (data: Partial<{{ENTITY_NAME}}>): Promise<{{ENTITY_NAME}}> => {
    const response = await fetch('/api/{{entity_name_plural}}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  
  atualizar: async (id: string, data: Partial<{{ENTITY_NAME}}>): Promise<{{ENTITY_NAME}}> => {
    const response = await fetch(`/api/{{entity_name_plural}}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  
  deletar: async (id: string): Promise<void> => {
    await fetch(`/api/{{entity_name_plural}}/${id}`, {
      method: 'DELETE'
    });
  }
};

// 4. Configurar colunas da tabela
const tableColumns = [
  {{TABLE_COLUMNS}}
];

// 5. Configurar permissões
const PERMISSIONS = {
  read: ['{{entity_name}}.read', 'admin'],
  create: ['{{entity_name}}.create', 'admin'],
  update: ['{{entity_name}}.update', 'admin'],
  delete: ['{{entity_name}}.delete', 'admin']
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

const {{ENTITY_NAME}}Page: React.FC = () => {
  // Hook de controle de permissões
  const { hasPermission } = usePermissionControl();

  // Hook CRUD principal com todas as funcionalidades
  const [crudState, crudActions] = useEntityCRUD<{{ENTITY_NAME}}>({
    entityName: '{{ENTITY_NAME}}',
    service: {{entity_name}}Service,
    permissions: PERMISSIONS,
    auditConfig: {
      entityType: '{{ENTITY_NAME}}',
      trackActions: ['create', 'update', 'delete']
    }
  });

  // Hook para tabela com filtros e paginação
  const [tableState, tableActions] = useDataTable<{{ENTITY_NAME}}>({
    columns: tableColumns,
    data: crudState.items,
    pagination: { enabled: true, pageSize: 25 },
    sorting: { enabled: true },
    filtering: { enabled: true, globalSearch: true },
    selection: { enabled: true, multiple: true },
    export: { enabled: true, formats: ['csv', 'excel', 'pdf'] },
    actions: {
      enabled: true,
      items: [
        {
          label: 'Editar',
          onClick: (item) => crudActions.abrirModal('edit', item),
          permission: PERMISSIONS.update[0]
        },
        {
          label: 'Deletar',
          onClick: (item) => crudActions.deletar(item.id),
          permission: PERMISSIONS.delete[0],
          variant: 'danger'
        }
      ]
    }
  });

  // Hook para formulário seguro
  const form = useSecureForm<Partial<{{ENTITY_NAME}}>>({
    schema: {{ENTITY_NAME}}Schema,
    onSubmit: async (data) => {
      if (crudState.modalMode === 'create') {
        await crudActions.criar(data);
      } else if (crudState.modalMode === 'edit' && crudState.selectedItem) {
        await crudActions.atualizar(crudState.selectedItem.id, data);
      }
    },
    permissions: {
      write: PERMISSIONS.create
    },
    auditConfig: {
      entityType: '{{ENTITY_NAME}}',
      entityId: crudState.selectedItem?.id
    },
    securityConfig: {
      requireConfirmation: crudState.modalMode === 'edit',
      sanitizeFields: [{{SANITIZE_FIELDS}}]
    }
  });

  // Carregar dados do item selecionado no formulário
  React.useEffect(() => {
    if (crudState.selectedItem && crudState.modalMode === 'edit') {
      {{FORM_RESET_CODE}}
    } else if (crudState.modalMode === 'create') {
      form.reset();
    }
  }, [crudState.selectedItem, crudState.modalMode]);

  // Verificar permissão de leitura
  if (!hasPermission(PERMISSIONS.read)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{{ENTITY_DISPLAY_NAME}}</h1>
          <p className="text-gray-600">Gerencie {{entity_name_plural}} do sistema</p>
        </div>
        
        <div className="flex gap-3">
          {hasPermission(PERMISSIONS.create) && (
            <Button
              onClick={() => crudActions.abrirModal('create')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo {{ENTITY_DISPLAY_NAME}}
            </Button>
          )}
          
          <Button
            variant="secondary"
            onClick={() => tableActions.exportData('excel')}
            disabled={tableState.isExporting}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros e busca */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar {{entity_name_plural}}..."
                  value={tableState.globalFilter}
                  onChange={(e) => tableActions.setGlobalFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Button
              variant="secondary"
              onClick={() => {/* TODO: Abrir modal de filtros avançados */}}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent>
          <DataTable
            state={tableState}
            actions={tableActions}
            loading={crudState.isLoading}
          />
        </CardContent>
      </Card>

      {/* Modal de formulário */}
      <Modal
        isOpen={crudState.isModalOpen}
        onClose={crudActions.fecharModal}
        title={`${crudState.modalMode === 'create' ? 'Novo' : 'Editar'} {{ENTITY_DISPLAY_NAME}}`}
        size="lg"
      >
        <form onSubmit={form.handleSubmit(form.submitSecure)} className="space-y-4">
          {{FORM_FIELDS}}
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={crudActions.fecharModal}
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              disabled={form.security.isSubmitting}
              loading={form.security.isSubmitting}
            >
              {crudState.modalMode === 'create' ? 'Criar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Status da página */}
      <div className="text-sm text-gray-500">
        Mostrando {tableState.paginatedData.length} de {tableState.totalItems} {{entity_name_plural}}
        {tableState.selectedItems.length > 0 && (
          <span> • {tableState.selectedItems.length} selecionado(s)</span>
        )}
      </div>
    </div>
  );
};

export default {{ENTITY_NAME}}Page;
