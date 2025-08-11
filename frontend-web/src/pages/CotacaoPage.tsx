import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { 
  Plus, 
  Download, 
  Filter, 
  Search, 
  FileText, 
  Mail, 
  Copy, 
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  User,
  Tag,
  Clock,
  AlertCircle
} from 'lucide-react';

// Hooks padronizados
import { useEntityCRUD } from '../hooks/base/useEntityCRUD';
import { useSecureForm } from '../hooks/base/useSecureForm';
import { useDataTable } from '../hooks/base/useDataTable';
import { usePermissionControl } from '../hooks/usePermissionControl';
import { useNotification } from '../hooks/useNotification';

// Componentes UI
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/ui/DataTable';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';

// Serviços e tipos
import { cotacaoService } from '../services/cotacaoService';
import { clienteService } from '../services/clienteService';
import { 
  Cotacao, 
  CriarCotacaoRequest, 
  StatusCotacao, 
  PrioridadeCotacao,
  OrigemCotacao,
  ItemCotacao
} from '../types/cotacaoTypes';

// Schema de validação
const CotacaoSchema = z.object({
  clienteId: z.string().min(1, 'Cliente é obrigatório'),
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']),
  dataVencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  observacoes: z.string().optional(),
  condicoesPagamento: z.string().optional(),
  prazoEntrega: z.string().optional(),
  validadeOrcamento: z.number().min(1).max(365).optional(),
  origem: z.enum(['manual', 'website', 'email', 'telefone', 'whatsapp', 'indicacao']),
  itens: z.array(z.object({
    descricao: z.string().min(1, 'Descrição do item é obrigatória'),
    quantidade: z.number().min(1, 'Quantidade deve ser maior que 0'),
    unidade: z.string().min(1, 'Unidade é obrigatória'),
    valorUnitario: z.number().min(0, 'Valor unitário deve ser positivo')
  })).min(1, 'Pelo menos um item é obrigatório')
});

// Configuração da tabela
const tableColumns = [
  {
    key: 'numero',
    title: 'Número',
    type: 'text',
    sortable: true,
    filterable: true,
    width: '120px'
  },
  {
    key: 'titulo',
    title: 'Título',
    type: 'text',
    sortable: true,
    filterable: true,
    render: (value: string, item: Cotacao) => (
      <div>
        <div className="font-medium">{value}</div>
        <div className="text-sm text-gray-500">{item.cliente?.nome}</div>
      </div>
    )
  },
  {
    key: 'status',
    title: 'Status',
    type: 'custom',
    sortable: true,
    filterable: true,
    render: (value: StatusCotacao) => <StatusBadge status={value} />
  },
  {
    key: 'prioridade',
    title: 'Prioridade',
    type: 'custom',
    sortable: true,
    filterable: true,
    render: (value: PrioridadeCotacao) => <PrioridadeBadge prioridade={value} />
  },
  {
    key: 'valorTotal',
    title: 'Valor Total',
    type: 'currency',
    sortable: true,
    filterable: false,
    render: (value: number) => (
      <span className="font-medium">
        {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </span>
    )
  },
  {
    key: 'dataVencimento',
    title: 'Vencimento',
    type: 'date',
    sortable: true,
    filterable: true,
    render: (value: string) => {
      const date = new Date(value);
      const isVencida = date < new Date() && date.toDateString() !== new Date().toDateString();
      return (
        <span className={isVencida ? 'text-red-600 font-medium' : ''}>
          {date.toLocaleDateString('pt-BR')}
        </span>
      );
    }
  },
  {
    key: 'responsavel',
    title: 'Responsável',
    type: 'text',
    sortable: true,
    filterable: true,
    render: (value: any) => value?.nome || '-'
  }
];

// Permissões
const PERMISSIONS = {
  read: ['cotacao.read', 'admin'],
  create: ['cotacao.create', 'admin'],
  update: ['cotacao.update', 'admin'],
  delete: ['cotacao.delete', 'admin'],
  approve: ['cotacao.approve', 'admin'],
  export: ['cotacao.export', 'admin']
};

const CotacaoPage: React.FC = () => {
  const { hasPermission } = usePermissionControl();
  const { showNotification } = useNotification();
  
  // Estados locais
  const [clientes, setClientes] = useState<any[]>([]);
  const [modalItens, setModalItens] = useState(false);
  const [activeTab, setActiveTab] = useState('lista');

  // Hook CRUD principal
  const [crudState, crudActions] = useEntityCRUD<Cotacao>({
    entityName: 'Cotação',
    service: cotacaoService,
    permissions: PERMISSIONS,
    auditConfig: {
      entityType: 'COTACAO',
      trackActions: ['create', 'update', 'delete']
    }
  });

  // Hook para tabela
  const [tableState, tableActions] = useDataTable<Cotacao>({
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
          label: 'Visualizar',
          icon: <Eye className="w-4 h-4" />,
          onClick: (item) => crudActions.abrirModal('view', item),
          permission: PERMISSIONS.read[0]
        },
        {
          label: 'Editar',
          icon: <Edit className="w-4 h-4" />,
          onClick: (item) => crudActions.abrirModal('edit', item),
          permission: PERMISSIONS.update[0]
        },
        {
          label: 'Duplicar',
          icon: <Copy className="w-4 h-4" />,
          onClick: (item) => duplicarCotacao(item),
          permission: PERMISSIONS.create[0]
        },
        {
          label: 'Gerar PDF',
          icon: <FileText className="w-4 h-4" />,
          onClick: (item) => gerarPDF(item),
          permission: PERMISSIONS.read[0]
        },
        {
          label: 'Enviar Email',
          icon: <Mail className="w-4 h-4" />,
          onClick: (item) => enviarEmail(item),
          permission: PERMISSIONS.read[0]
        },
        {
          label: 'Deletar',
          icon: <Trash2 className="w-4 h-4" />,
          onClick: (item) => crudActions.deletar(item.id),
          permission: PERMISSIONS.delete[0],
          variant: 'danger'
        }
      ]
    }
  });

  // Hook para formulário
  const form = useSecureForm<CriarCotacaoRequest>({
    schema: CotacaoSchema,
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
      entityType: 'COTACAO',
      entityId: crudState.selectedItem?.id
    },
    securityConfig: {
      requireConfirmation: crudState.modalMode === 'edit',
      sanitizeFields: ['titulo', 'descricao', 'observacoes']
    }
  });

  // Carregar dados iniciais
  useEffect(() => {
    carregarClientes();
  }, []);

  // Carregar dados do formulário quando selecionar item
  useEffect(() => {
    if (crudState.selectedItem && crudState.modalMode === 'edit') {
      const cotacao = crudState.selectedItem;
      form.reset({
        clienteId: cotacao.clienteId,
        titulo: cotacao.titulo,
        descricao: cotacao.descricao || '',
        prioridade: cotacao.prioridade,
        dataVencimento: cotacao.dataVencimento.split('T')[0],
        observacoes: cotacao.observacoes || '',
        condicoesPagamento: cotacao.condicoesPagamento || '',
        prazoEntrega: cotacao.prazoEntrega || '',
        validadeOrcamento: cotacao.validadeOrcamento || 30,
        origem: cotacao.origem,
        itens: cotacao.itens || []
      });
    } else if (crudState.modalMode === 'create') {
      form.reset({
        prioridade: 'media',
        origem: 'manual',
        validadeOrcamento: 30,
        itens: []
      });
    }
  }, [crudState.selectedItem, crudState.modalMode]);

  const carregarClientes = async () => {
    try {
      const clientesData = await clienteService.listar();
      setClientes(clientesData);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const duplicarCotacao = async (cotacao: Cotacao) => {
    try {
      await cotacaoService.duplicar(cotacao.id);
      await crudActions.recarregar();
      showNotification({
        tipo: 'sucesso',
        titulo: 'Cotação duplicada',
        mensagem: 'A cotação foi duplicada com sucesso.'
      });
    } catch (error) {
      showNotification({
        tipo: 'erro',
        titulo: 'Erro ao duplicar',
        mensagem: 'Não foi possível duplicar a cotação.'
      });
    }
  };

  const gerarPDF = async (cotacao: Cotacao) => {
    try {
      const blob = await cotacaoService.gerarPDF(cotacao.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cotacao-${cotacao.numero}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showNotification({
        tipo: 'erro',
        titulo: 'Erro ao gerar PDF',
        mensagem: 'Não foi possível gerar o PDF da cotação.'
      });
    }
  };

  const enviarEmail = async (cotacao: Cotacao) => {
    // TODO: Implementar modal de envio de email
    showNotification({
      tipo: 'info',
      titulo: 'Em desenvolvimento',
      mensagem: 'Funcionalidade de envio por email será implementada em breve.'
    });
  };

  const alterarStatus = async (cotacao: Cotacao, novoStatus: StatusCotacao) => {
    try {
      await cotacaoService.alterarStatus(cotacao.id, novoStatus);
      await crudActions.recarregar();
      showNotification({
        tipo: 'sucesso',
        titulo: 'Status alterado',
        mensagem: `Status da cotação alterado para ${getStatusLabel(novoStatus)}.`
      });
    } catch (error) {
      showNotification({
        tipo: 'erro',
        titulo: 'Erro ao alterar status',
        mensagem: 'Não foi possível alterar o status da cotação.'
      });
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Cotações e Orçamentos</h1>
          <p className="text-gray-600">Gerencie cotações e orçamentos do sistema</p>
        </div>
        
        <div className="flex gap-3">
          {hasPermission(PERMISSIONS.create) && (
            <Button
              onClick={() => crudActions.abrirModal('create')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Cotação
            </Button>
          )}
          
          {hasPermission(PERMISSIONS.export) && (
            <Button
              variant="secondary"
              onClick={() => tableActions.exportData('excel')}
              disabled={tableState.isExporting}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          )}
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total de Cotações</p>
                <p className="text-2xl font-bold">{tableState.totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold">
                  {crudState.items
                    .reduce((sum, item) => sum + item.valorTotal, 0)
                    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold">
                  {crudState.items.filter(item => 
                    ['rascunho', 'enviada', 'em_analise'].includes(item.status)
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Vencidas</p>
                <p className="text-2xl font-bold">
                  {crudState.items.filter(item => 
                    new Date(item.dataVencimento) < new Date() && 
                    !['aprovada', 'convertida', 'cancelada'].includes(item.status)
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="lista">Lista de Cotações</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="calendario">Calendário</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-6">
          {/* Filtros e busca */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar cotações..."
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
        </TabsContent>

        <TabsContent value="kanban">
          <div className="text-center py-12">
            <p className="text-gray-500">Visualização Kanban será implementada em breve</p>
          </div>
        </TabsContent>

        <TabsContent value="calendario">
          <div className="text-center py-12">
            <p className="text-gray-500">Visualização de Calendário será implementada em breve</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de formulário */}
      <CotacaoModal
        isOpen={crudState.isModalOpen}
        onClose={crudActions.fecharModal}
        mode={crudState.modalMode}
        cotacao={crudState.selectedItem}
        form={form}
        clientes={clientes}
      />

      {/* Status da página */}
      <div className="text-sm text-gray-500">
        Mostrando {tableState.paginatedData.length} de {tableState.totalItems} cotações
        {tableState.selectedItems.length > 0 && (
          <span> • {tableState.selectedItems.length} selecionada(s)</span>
        )}
      </div>
    </div>
  );
};

// Componentes auxiliares
const StatusBadge: React.FC<{ status: StatusCotacao }> = ({ status }) => {
  const configs = {
    rascunho: { color: 'gray', label: 'Rascunho' },
    enviada: { color: 'blue', label: 'Enviada' },
    em_analise: { color: 'yellow', label: 'Em Análise' },
    aprovada: { color: 'green', label: 'Aprovada' },
    rejeitada: { color: 'red', label: 'Rejeitada' },
    vencida: { color: 'red', label: 'Vencida' },
    convertida: { color: 'green', label: 'Convertida' },
    cancelada: { color: 'gray', label: 'Cancelada' }
  };

  const config = configs[status];
  return (
    <Badge variant={config.color as any}>
      {config.label}
    </Badge>
  );
};

const PrioridadeBadge: React.FC<{ prioridade: PrioridadeCotacao }> = ({ prioridade }) => {
  const configs = {
    baixa: { color: 'gray', label: 'Baixa' },
    media: { color: 'blue', label: 'Média' },
    alta: { color: 'yellow', label: 'Alta' },
    urgente: { color: 'red', label: 'Urgente' }
  };

  const config = configs[prioridade];
  return (
    <Badge variant={config.color as any}>
      {config.label}
    </Badge>
  );
};

const getStatusLabel = (status: StatusCotacao): string => {
  const labels = {
    rascunho: 'Rascunho',
    enviada: 'Enviada',
    em_analise: 'Em Análise',
    aprovada: 'Aprovada',
    rejeitada: 'Rejeitada',
    vencida: 'Vencida',
    convertida: 'Convertida',
    cancelada: 'Cancelada'
  };
  return labels[status];
};

// Modal de cotação (implementação simplificada)
const CotacaoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view';
  cotacao?: Cotacao | null;
  form: any;
  clientes: any[];
}> = ({ isOpen, onClose, mode, cotacao, form, clientes }) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${mode === 'create' ? 'Nova' : mode === 'edit' ? 'Editar' : 'Visualizar'} Cotação`}
      size="xl"
    >
      <form onSubmit={form.handleSubmit(form.submitSecure)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Cliente</label>
            <Select
              {...form.register('clienteId')}
              disabled={mode === 'view' || !form.canEditField('clienteId')}
              error={form.formState.errors.clienteId?.message}
              required
            >
              <option value="">Selecione um cliente</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Título</label>
            <Input
              {...form.register('titulo')}
              disabled={mode === 'view' || !form.canEditField('titulo')}
              error={form.formState.errors.titulo?.message}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Prioridade</label>
            <Select
              {...form.register('prioridade')}
              disabled={mode === 'view' || !form.canEditField('prioridade')}
              error={form.formState.errors.prioridade?.message}
              required
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Data de Vencimento</label>
            <Input
              type="date"
              {...form.register('dataVencimento')}
              disabled={mode === 'view' || !form.canEditField('dataVencimento')}
              error={form.formState.errors.dataVencimento?.message}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Descrição</label>
            <Textarea
              {...form.register('descricao')}
              disabled={mode === 'view' || !form.canEditField('descricao')}
              error={form.formState.errors.descricao?.message}
              rows={3}
            />
          </div>
        </div>

        {/* TODO: Implementar seção de itens */}
        
        {mode !== 'view' && (
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              disabled={form.security.isSubmitting}
              loading={form.security.isSubmitting}
            >
              {mode === 'create' ? 'Criar' : 'Salvar'}
            </Button>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default CotacaoPage;
