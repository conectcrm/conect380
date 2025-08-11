import React, { useState, useEffect } from 'react';
import {
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Eye,
  Edit,
  Download,
  Mail,
  MoreVertical,
  CreditCard
} from 'lucide-react';
import { StandardPageTemplate, StandardDataTable } from '../../components/templates';
import type { DashboardCard, TableColumn, TableAction } from '../../components/templates';

// Tipos
interface Fatura {
  id: string;
  numero: string;
  clienteNome: string;
  clienteEmail: string;
  valor: number;
  status: 'rascunho' | 'enviada' | 'paga' | 'vencida' | 'cancelada' | 'pendente';
  dataEmissao: Date;
  dataVencimento: Date;
  dataPagamento?: Date;
  descricao: string;
  tipo: 'recorrente' | 'avulsa' | 'parcela' | 'entrada';
}

type StatusFilter = 'todos' | 'rascunho' | 'enviada' | 'paga' | 'vencida' | 'cancelada' | 'pendente';

// Dados mock para demonstração
const mockFaturas: Fatura[] = [
  {
    id: '1',
    numero: 'FAT-2025-001',
    clienteNome: 'Empresa ABC Ltda',
    clienteEmail: 'contato@empresaabc.com',
    valor: 2500.00,
    status: 'paga',
    dataEmissao: new Date('2025-01-15'),
    dataVencimento: new Date('2025-02-15'),
    dataPagamento: new Date('2025-02-10'),
    descricao: 'Desenvolvimento de sistema CRM - Janeiro 2025',
    tipo: 'recorrente'
  },
  {
    id: '2',
    numero: 'FAT-2025-002',
    clienteNome: 'Tech Solutions S.A.',
    clienteEmail: 'financeiro@techsolutions.com',
    valor: 5000.00,
    status: 'pendente',
    dataEmissao: new Date('2025-02-01'),
    dataVencimento: new Date('2025-03-01'),
    descricao: 'Consultoria em automação - Fevereiro 2025',
    tipo: 'parcela'
  },
  {
    id: '3',
    numero: 'FAT-2025-003',
    clienteNome: 'Inovação Digital ME',
    clienteEmail: 'admin@inovacaodigital.com',
    valor: 1200.00,
    status: 'vencida',
    dataEmissao: new Date('2025-01-10'),
    dataVencimento: new Date('2025-01-25'),
    descricao: 'Manutenção de sistema - Janeiro 2025',
    tipo: 'avulsa'
  },
  {
    id: '4',
    numero: 'FAT-2025-004',
    clienteNome: 'StartupTech Inc.',
    clienteEmail: 'billing@startuptech.com',
    valor: 3750.00,
    status: 'enviada',
    dataEmissao: new Date('2025-02-05'),
    dataVencimento: new Date('2025-03-05'),
    descricao: 'Plataforma de e-commerce - Fevereiro 2025',
    tipo: 'parcela'
  },
  {
    id: '5',
    numero: 'FAT-2025-005',
    clienteNome: 'ConsultoriaMax',
    clienteEmail: 'financeiro@consultoriamax.com.br',
    valor: 8900.00,
    status: 'paga',
    dataEmissao: new Date('2025-01-20'),
    dataVencimento: new Date('2025-02-20'),
    dataPagamento: new Date('2025-02-18'),
    descricao: 'Sistema de gestão integrado - Janeiro 2025',
    tipo: 'entrada'
  }
];

export const FaturamentoPage: React.FC = () => {
  const [faturas] = useState<Fatura[]>(mockFaturas);
  const [filteredFaturas, setFilteredFaturas] = useState<Fatura[]>(mockFaturas);
  const [selectedFaturas, setSelectedFaturas] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [loading, setLoading] = useState(false);

  // Estatísticas calculadas
  const totalFaturas = faturas.length;
  const faturasPagas = faturas.filter(f => f.status === 'paga').length;
  const faturasVencidas = faturas.filter(f => f.status === 'vencida').length;
  const faturasPendentes = faturas.filter(f => f.status === 'pendente').length;
  const valorTotal = faturas.reduce((total, f) => total + f.valor, 0);
  const valorRecebido = faturas.filter(f => f.status === 'paga').reduce((total, f) => total + f.valor, 0);
  const valorVencido = faturas.filter(f => f.status === 'vencida').reduce((total, f) => total + f.valor, 0);

  // Dashboard Cards
  const dashboardCards: DashboardCard[] = [
    {
      title: 'Total de Faturas',
      value: totalFaturas,
      subtitle: '📊 Visão geral',
      icon: FileText,
      color: 'blue'
    },
    {
      title: 'Valor Total Faturado',
      value: valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      subtitle: '💰 Faturamento bruto',
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Faturas Vencidas',
      value: faturasVencidas,
      subtitle: `${valorVencido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em atraso`,
      icon: AlertCircle,
      color: 'red'
    },
    {
      title: 'Faturas Pendentes',
      value: faturasPendentes,
      subtitle: '⏳ Aguardando pagamento',
      icon: Clock,
      color: 'yellow'
    }
  ];

  // Aplicar filtros
  useEffect(() => {
    let filtered = faturas;

    // Filtro por status
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(fatura => fatura.status === statusFilter);
    }

    // Filtro por tipo
    if (tipoFilter !== 'todos') {
      filtered = filtered.filter(fatura => fatura.tipo === tipoFilter);
    }

    // Busca por texto
    if (searchTerm) {
      filtered = filtered.filter(fatura =>
        fatura.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fatura.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fatura.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFaturas(filtered);
  }, [faturas, statusFilter, tipoFilter, searchTerm]);

  // Funções de manipulação
  const handleCriarFatura = () => {
    console.log('Criar nova fatura');
  };

  const handleExportarCSV = () => {
    console.log('Exportar para CSV');
  };

  const handleExportarExcel = () => {
    console.log('Exportar para Excel');
  };

  const handleViewFatura = (fatura: Fatura) => {
    console.log('Visualizar fatura:', fatura.id);
  };

  const handleEditFatura = (fatura: Fatura) => {
    console.log('Editar fatura:', fatura.id);
  };

  const handleDownloadPDF = (fatura: Fatura) => {
    console.log('Download PDF:', fatura.id);
  };

  const handleEnviarEmail = (fatura: Fatura) => {
    console.log('Enviar por email:', fatura.id);
  };

  const handleMarcarComoPaga = (fatura: Fatura) => {
    console.log('Marcar como paga:', fatura.id);
  };

  const handleExcluirFatura = (fatura: Fatura) => {
    if (window.confirm('Tem certeza que deseja excluir esta fatura?')) {
      console.log('Excluir fatura:', fatura.id);
    }
  };

  // Configuração das colunas da tabela
  const tableColumns: TableColumn<Fatura>[] = [
    {
      key: 'numero',
      label: 'Número',
      sortable: true,
      render: (fatura) => (
        <div className="font-medium text-[#159A9C]">
          {fatura.numero}
        </div>
      )
    },
    {
      key: 'clienteNome',
      label: 'Cliente',
      sortable: true,
      render: (fatura) => (
        <div>
          <div className="font-medium text-gray-900">{fatura.clienteNome}</div>
          <div className="text-sm text-gray-500">{fatura.clienteEmail}</div>
        </div>
      )
    },
    {
      key: 'valor',
      label: 'Valor',
      sortable: true,
      align: 'right',
      render: (fatura) => (
        <span className="font-bold text-gray-900">
          {fatura.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (fatura) => getStatusBadge(fatura.status)
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (fatura) => (
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
          {fatura.tipo}
        </span>
      )
    },
    {
      key: 'dataVencimento',
      label: 'Vencimento',
      sortable: true,
      render: (fatura) => (
        <div className="text-sm">
          {fatura.dataVencimento.toLocaleDateString('pt-BR')}
        </div>
      )
    }
  ];

  // Ações da tabela
  const tableActions: TableAction<Fatura>[] = [
    {
      label: 'Visualizar',
      onClick: handleViewFatura,
      icon: Eye
    },
    {
      label: 'Editar',
      onClick: handleEditFatura,
      icon: Edit,
      show: (fatura) => fatura.status !== 'paga'
    },
    {
      label: 'Download PDF',
      onClick: handleDownloadPDF,
      icon: Download
    },
    {
      label: 'Enviar por Email',
      onClick: handleEnviarEmail,
      icon: Mail
    },
    {
      label: 'Marcar como Paga',
      onClick: handleMarcarComoPaga,
      icon: CheckCircle,
      variant: 'success',
      show: (fatura) => fatura.status !== 'paga'
    },
    {
      label: 'Excluir',
      onClick: handleExcluirFatura,
      icon: X,
      variant: 'danger',
      show: (fatura) => fatura.status === 'rascunho'
    }
  ];

  // Função para obter badge do status
  const getStatusBadge = (status: Fatura['status']) => {
    const statusConfig = {
      rascunho: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Rascunho', icon: Edit },
      enviada: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Enviada', icon: Mail },
      paga: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paga', icon: CheckCircle },
      vencida: { bg: 'bg-red-100', text: 'text-red-800', label: 'Vencida', icon: AlertCircle },
      cancelada: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelada', icon: X },
      pendente: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente', icon: Clock }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  return (
    <StandardPageTemplate
      title="Faturamento"
      subtitle="Gerencie faturas, cobranças e recebimentos"
      backTo="/financeiro"

      dashboardCards={dashboardCards}

      primaryAction={{
        label: 'Nova Fatura',
        onClick: handleCriarFatura,
        icon: Plus
      }}

      secondaryActions={[
        {
          label: 'Exportar CSV',
          onClick: handleExportarCSV,
          variant: 'outline'
        },
        {
          label: 'Exportar Excel',
          onClick: handleExportarExcel,
          variant: 'outline'
        }
      ]}

      bulkActions={selectedFaturas.length > 0 ? {
        selectedCount: selectedFaturas.length,
        onSelectAll: () => setSelectedFaturas(faturas.map(f => f.id)),
        onDeselectAll: () => setSelectedFaturas([]),
        actions: [
          {
            label: 'Marcar como Enviadas',
            onClick: () => console.log('Marcar como enviadas:', selectedFaturas)
          },
          {
            label: 'Exportar Selecionadas',
            onClick: () => console.log('Exportar selecionadas:', selectedFaturas),
            variant: 'outline'
          },
          {
            label: 'Excluir Selecionadas',
            onClick: () => console.log('Excluir selecionadas:', selectedFaturas),
            variant: 'danger'
          }
        ]
      } : undefined}

      searchConfig={{
        placeholder: 'Buscar por número, cliente, descrição...',
        value: searchTerm,
        onChange: setSearchTerm
      }}

      filters={[
        {
          label: 'Status',
          value: statusFilter,
          options: [
            { label: 'Todos os Status', value: 'todos' },
            { label: '📝 Rascunho', value: 'rascunho' },
            { label: '📧 Enviada', value: 'enviada' },
            { label: '✅ Paga', value: 'paga' },
            { label: '⏰ Pendente', value: 'pendente' },
            { label: '🚨 Vencida', value: 'vencida' },
            { label: '❌ Cancelada', value: 'cancelada' }
          ],
          onChange: (value) => setStatusFilter(value as StatusFilter)
        },
        {
          label: 'Tipo',
          value: tipoFilter,
          options: [
            { label: 'Todos os Tipos', value: 'todos' },
            { label: 'Recorrente', value: 'recorrente' },
            { label: 'Avulsa', value: 'avulsa' },
            { label: 'Parcela', value: 'parcela' },
            { label: 'Entrada', value: 'entrada' }
          ],
          onChange: setTipoFilter
        }
      ]}

      loading={loading}
    >
      <StandardDataTable
        data={filteredFaturas}
        columns={tableColumns}
        actions={tableActions}
        selectable={true}
        selectedItems={selectedFaturas}
        onSelectionChange={setSelectedFaturas}
        getItemId={(fatura) => fatura.id}
        emptyState={{
          title: 'Nenhuma fatura encontrada',
          description: 'Não há faturas que correspondam aos filtros aplicados.',
          icon: FileText,
          action: {
            label: 'Criar Nova Fatura',
            onClick: handleCriarFatura
          }
        }}
      />
    </StandardPageTemplate>
  );
};

export default FaturamentoPage;
