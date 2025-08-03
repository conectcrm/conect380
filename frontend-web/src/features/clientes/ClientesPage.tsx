import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../contexts/I18nContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
import ModalCadastroCliente from '../../components/modals/ModalCadastroCliente';
import { ModalDetalhesCliente } from '../../components/modals/ModalDetalhesCliente';
import { ClienteCard } from '../../components/clientes';
import { clientesService, Cliente, ClienteFilters, PaginatedClientes } from '../../services/clientesService';
import { UploadResult } from '../../services/uploadService';
import {
  Users,
  User,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Phone,
  Mail,
  Building,
  MapPin,
  Tag,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Grid3X3,
  List
} from 'lucide-react';



const ClientesPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { addNotification, addReminder } = useNotifications();
  const [clientesData, setClientesData] = useState<PaginatedClientes | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filters, setFilters] = useState<ClienteFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    tipo: '',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [selectedClientes, setSelectedClientes] = useState<string[]>([]);
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    ativos: 0,
    prospects: 0,
    leads: 0
  });

  // Carregar clientes
  const loadClientes = async () => {
    try {
      setIsLoading(true);

      const data = await clientesService.getClientes(filters);
      setClientesData(data);
      setClientes(data.data);

    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error);

      toast.error('Erro ao carregar clientes do servidor. Verifique sua conexão.', {
        duration: 5000,
        position: 'top-right',
        icon: '❌',
      });

      // Em caso de erro, manter dados vazios
      setClientes([]);
      setClientesData({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar estatísticas
  const loadEstatisticas = async () => {
    try {
      const stats = await clientesService.getEstartisticas();
      setEstatisticas(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas do servidor:', error);
      // Em caso de erro, calcular estatísticas dos dados locais
      calcularEstatisticasLocais();
    }
  };

  // Função para calcular estatísticas baseadas nos dados carregados
  const calcularEstatisticasLocais = () => {
    if (clientes.length === 0) {
      setEstatisticas({ total: 0, ativos: 0, prospects: 0, leads: 0 });
      return;
    }

    const total = clientes.length;
    const ativos = clientes.filter(c => c.status === 'cliente').length;
    const prospects = clientes.filter(c => c.status === 'prospect').length;
    const leads = clientes.filter(c => c.status === 'lead').length;

    setEstatisticas({ total, ativos, prospects, leads });
  };

  // Aplicar filtros com debounce para busca
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const newFilters = {
        ...filters,
        search: searchTerm,
        status: selectedStatus,
        tipo: selectedTipo,
        page: 1 // Reset para primeira página quando filtros mudam
      };

      setFilters(newFilters);
    }, 300); // 300ms de delay para busca

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, selectedStatus, selectedTipo]);

  useEffect(() => {
    loadClientes();
  }, [filters]);

  useEffect(() => {
    // Recalcular estatísticas quando os dados mudarem
    calcularEstatisticasLocais();
  }, [clientes]);

  useEffect(() => {
    // Carregar estatísticas do servidor na primeira carga
    loadEstatisticas();

    // Notificação de boas-vindas (apenas uma vez)
    const hasWelcomeNotification = localStorage.getItem('conect_welcome_notification');
    if (!hasWelcomeNotification) {
      setTimeout(() => {
        addNotification({
          title: 'Bem-vindo ao Sistema de Clientes! 🎉',
          message: 'Sistema de notificações ativo. Você receberá atualizações sobre suas ações.',
          type: 'success',
          priority: 'high'
        });
        localStorage.setItem('conect_welcome_notification', 'true');
      }, 1000);
    }
  }, []);

  // Handlers para filtros simplificados
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
  };

  const handleTipoChange = (tipo: string) => {
    setSelectedTipo(tipo);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setSelectedTipo('');
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleSort = (column: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'ASC' ? 'DESC' : 'ASC',
      page: 1
    }));
  };

  // Handlers para seleção em massa
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClientes(clientes.map(c => c.id!));
    } else {
      setSelectedClientes([]);
    }
  };

  const handleSelectCliente = (clienteId: string, checked: boolean) => {
    if (checked) {
      setSelectedClientes(prev => [...prev, clienteId]);
    } else {
      setSelectedClientes(prev => prev.filter(id => id !== clienteId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedClientes.length === 0) return;

    const confirmMessage = `Tem certeza que deseja excluir ${selectedClientes.length} cliente(s) selecionado(s)?`;
    if (window.confirm(confirmMessage)) {
      try {
        const loadingToast = toast.loading(`Excluindo ${selectedClientes.length} cliente(s)...`);

        // Excluir todos os clientes selecionados
        await Promise.all(selectedClientes.map(id => clientesService.deleteCliente(id)));

        // Recarregar lista
        await loadClientes();

        // Limpar seleção
        setSelectedClientes([]);

        toast.dismiss(loadingToast);
        toast.success(`${selectedClientes.length} cliente(s) excluído(s) com sucesso!`, {
          duration: 4000,
          position: 'top-right',
          icon: '✅',
        });
      } catch (error) {
        console.error('Erro ao excluir clientes:', error);
        toast.error('Erro ao excluir clientes. Tente novamente.', {
          duration: 5000,
          position: 'top-right',
          icon: '❌',
        });
      }
    }
  };

  const handleBulkExport = async () => {
    if (selectedClientes.length === 0) return;

    try {
      // Filtrar apenas os clientes selecionados
      const selectedFilters = {
        ...filters,
        ids: selectedClientes
      };

      const blob = await clientesService.exportClientes(selectedFilters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `clientes-selecionados-${selectedClientes.length}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`${selectedClientes.length} cliente(s) exportado(s) com sucesso!`);
    } catch (error) {
      console.error('Erro ao exportar clientes selecionados:', error);
      toast.error('Erro ao exportar clientes selecionados. Tente novamente.');
    }
  };

  // Handler para salvar cliente (criar/editar)
  const handleSaveCliente = async (clienteData: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsModalLoading(true);

      if (selectedCliente) {
        // Editar cliente existente
        await clientesService.updateCliente(selectedCliente.id!, clienteData);
        console.log('✅ Cliente editado:', clienteData.nome);

        // Notificação de cliente editado
        addNotification({
          title: 'Cliente Atualizado',
          message: `Cliente ${clienteData.nome} foi atualizado com sucesso`,
          type: 'success',
          priority: 'medium'
        });
      } else {
        // Criar novo cliente
        await clientesService.createCliente(clienteData);
        console.log('✅ Novo cliente criado:', clienteData.nome);

        // Notificação de novo cliente
        addNotification({
          title: 'Novo Cliente',
          message: `Cliente ${clienteData.nome} foi cadastrado com sucesso`,
          type: 'success',
          priority: 'high'
        });

        // Criar lembrete para primeiro contato
        addReminder({
          title: 'Primeiro Contato',
          entityType: 'cliente',
          entityId: clienteData.nome, // Temporário até ter ID
          dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
          isRecurring: false
        });
      }

      // Recarregar a lista de clientes
      await loadClientes();

      // Fechar modal
      setShowCreateModal(false);
      setSelectedCliente(null);

      console.log('🔄 Lista recarregada, estatísticas serão recalculadas automaticamente');
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      throw error;
    } finally {
      setIsModalLoading(false);
    }
  };

  // Handler para excluir cliente
  const handleDeleteCliente = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        const loadingToast = toast.loading('Excluindo cliente...');

        // Buscar nome do cliente antes de excluir para notificação
        const cliente = clientes.find(c => c.id === id);
        const nomeCliente = cliente?.nome || 'Cliente';

        await clientesService.deleteCliente(id);
        await loadClientes();

        toast.dismiss(loadingToast);
        toast.success('Cliente excluído com sucesso!', {
          duration: 4000,
          position: 'top-right',
          icon: '✅',
        });
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        toast.error('Erro ao excluir cliente. Tente novamente.', {
          duration: 5000,
          position: 'top-right',
          icon: '❌',
        });
      }
    }
  };

  // Handler para exportar clientes
  const handleExportClientes = async () => {
    try {
      const blob = await clientesService.exportClientes(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'clientes.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar clientes:', error);
      alert('Erro ao exportar clientes. Tente novamente.');
    }
  };

  // Handler para abrir modal de edição
  const handleEditCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowCreateModal(true);
  };

  const handleViewCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowDetailsModal(true);

    // Notificação de interação
    addNotification({
      title: 'Cliente Visualizado',
      message: `Você está visualizando ${cliente.nome}`,
      type: 'info',
      priority: 'low'
    });
  };

  const handleAvatarUpdate = async (clienteId: string, avatar: UploadResult) => {
    try {
      // TODO: Implementar API call para atualizar avatar
      toast.success('Avatar atualizado com sucesso!');
      // Atualizar localmente
      setClientes(prev => prev.map(c =>
        c.id === clienteId ? { ...c, avatar: avatar.url } : c
      ));
    } catch (error) {
      toast.error('Erro ao atualizar avatar');
    }
  };

  const handleAttachmentAdd = async (clienteId: string, attachment: UploadResult) => {
    try {
      // TODO: Implementar API call para adicionar anexo
      toast.success(`Anexo ${attachment.fileName} adicionado com sucesso!`);
    } catch (error) {
      toast.error('Erro ao adicionar anexo');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cliente': return 'bg-green-100 text-green-800 border-green-200';
      case 'prospect': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'lead': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inativo': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'cliente': return 'Cliente';
      case 'prospect': return 'Prospect';
      case 'lead': return 'Lead';
      case 'inativo': return 'Inativo';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-[#DEEFE7]">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus
          nucleusName="CRM"
          nucleusPath="/nuclei/crm"
          currentModuleName="Clientes"
        />
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mt-2 text-[#B4BEC9]">Gerencie seus clientes e contatos</p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-3">
              {/* Botões de visualização */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 text-sm transition-colors ${viewMode === 'cards'
                      ? 'bg-[#159A9C] text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 text-sm transition-colors ${viewMode === 'table'
                      ? 'bg-[#159A9C] text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleExportClientes}
                className="px-4 py-2 border border-[#B4BEC9] rounded-lg hover:bg-[#DEEFE7] flex items-center gap-2 text-sm text-[#002333] transition-colors"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
              <button
                onClick={() => {
                  setSelectedCliente(null);
                  setShowCreateModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white rounded-lg hover:shadow-lg flex items-center gap-2 text-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Novo Cliente
              </button>
            </div>
          </div>

          {/* Estatísticas rápidas */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-4 rounded-lg border border-[#DEEFE7] shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-[#DEEFE7] rounded-lg">
                  <Users className="w-6 h-6 text-[#159A9C]" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#B4BEC9]">Total de Clientes</p>
                  <p className="text-2xl font-bold text-[#002333]">{estatisticas.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-[#DEEFE7] shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#B4BEC9]">Clientes Ativos</p>
                  <p className="text-2xl font-bold text-[#002333]">{estatisticas.ativos}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-[#DEEFE7] shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Users className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#B4BEC9]">Prospects</p>
                  <p className="text-2xl font-bold text-[#002333]">{estatisticas.prospects}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-[#DEEFE7] shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#B4BEC9]">Leads</p>
                  <p className="text-2xl font-bold text-[#002333]">{estatisticas.leads}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros Redesenhados */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col space-y-4">
            {/* Título e botão limpar */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
              <button
                onClick={handleClearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Limpar todos os filtros
              </button>
            </div>

            {/* Grid de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Busca */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Nome, email, empresa..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filtro por Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                >
                  <option value="">Todos os Status</option>
                  <option value="lead">Lead</option>
                  <option value="prospect">Prospect</option>
                  <option value="cliente">Cliente</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>

              {/* Filtro por Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={selectedTipo}
                  onChange={(e) => handleTipoChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                >
                  <option value="">Todos os Tipos</option>
                  <option value="pessoa_fisica">Pessoa Física</option>
                  <option value="pessoa_juridica">Pessoa Jurídica</option>
                </select>
              </div>

              {/* Filtro por Ordenação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ordenação
                </label>
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    setFilters(prev => ({ ...prev, sortBy, sortOrder: sortOrder as 'ASC' | 'DESC', page: 1 }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                >
                  <option value="created_at-DESC">Mais recentes</option>
                  <option value="created_at-ASC">Mais antigos</option>
                  <option value="nome-ASC">Nome A-Z</option>
                  <option value="nome-DESC">Nome Z-A</option>
                </select>
              </div>
            </div>

            {/* Filtros ativos */}
            {(searchTerm || selectedStatus || selectedTipo) && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-600">Filtros ativos:</span>
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Busca: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedStatus && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Status: {selectedStatus}
                    <button
                      onClick={() => setSelectedStatus('')}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedTipo && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Tipo: {selectedTipo === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                    <button
                      onClick={() => setSelectedTipo('')}
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabela de Clientes */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#159A9C]" />
              <p className="mt-2 text-gray-500">Carregando clientes...</p>
            </div>
          ) : clientes.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum cliente encontrado</h3>
              <p className="text-gray-500 mb-4">Comece criando seu primeiro cliente.</p>
              <button
                onClick={() => {
                  setSelectedCliente(null);
                  setShowCreateModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white rounded-lg hover:shadow-lg flex items-center gap-2 text-sm transition-all mx-auto"
              >
                <Plus className="w-4 h-4" />
                Criar Primeiro Cliente
              </button>
            </div>
          ) : (
            <>
              {/* Renderização Condicional: Cards ou Tabela */}
              {viewMode === 'cards' ? (
                /* Visualização em Grid - Compacto e focado */
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                    {clientes.map((cliente) => (
                      <ClienteCard
                        key={cliente.id}
                        cliente={cliente}
                        onEdit={handleEditCliente}
                        onDelete={handleDeleteCliente}
                        onView={handleViewCliente}
                        onAvatarUpdate={handleAvatarUpdate}
                        onAttachmentAdd={handleAttachmentAdd}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                /* Visualização em Lista - Estilo Salesforce */
                <div>
                  {/* Header da lista com ações em massa e indicadores de filtros */}
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-700">
                          {clientes.length} de {clientesData?.total || clientes.length} registros
                          {(searchTerm || selectedStatus || selectedTipo) && (
                            <span className="ml-2 text-blue-600 font-medium">
                              (filtrados)
                            </span>
                          )}
                          {selectedClientes.length > 0 && (
                            <span className="ml-2 text-[#159A9C] font-semibold">
                              ({selectedClientes.length} selecionado{selectedClientes.length !== 1 ? 's' : ''})
                            </span>
                          )}
                        </span>
                        <select
                          className="text-sm border-gray-300 rounded-md focus:ring-[#159A9C] focus:border-[#159A9C]"
                          value={filters.limit}
                          onChange={(e) => handleLimitChange(Number(e.target.value))}
                        >
                          <option value={10}>Exibir: 10 registros</option>
                          <option value={25}>Exibir: 25 registros</option>
                          <option value={50}>Exibir: 50 registros</option>
                          <option value={100}>Exibir: 100 registros</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Ações em massa - aparecem quando há seleção */}
                        {selectedClientes.length > 0 && (
                          <>
                            <button
                              onClick={handleBulkExport}
                              className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 flex items-center space-x-1 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              <span>Exportar ({selectedClientes.length})</span>
                            </button>
                            <button
                              onClick={handleBulkDelete}
                              className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 flex items-center space-x-1 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Excluir ({selectedClientes.length})</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={handleExportClientes}
                          className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1"
                        >
                          <Download className="w-4 h-4" />
                          <span>Exportar Todos</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tabela Compacta - Dados Essenciais */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedClientes.length === clientes.length && clientes.length > 0}
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <button
                              onClick={() => handleSort('nome')}
                              className="flex items-center space-x-1 hover:text-[#159A9C] transition-colors"
                            >
                              <span>Cliente</span>
                              <ChevronRight className={`w-3 h-3 transition-transform ${filters.sortBy === 'nome'
                                  ? filters.sortOrder === 'ASC' ? 'rotate-90' : 'rotate-270'
                                  : 'text-gray-400'
                                }`} />
                            </button>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <button
                              onClick={() => handleSort('status')}
                              className="flex items-center space-x-1 hover:text-[#159A9C] transition-colors"
                            >
                              <span>Status</span>
                              <ChevronRight className={`w-3 h-3 transition-transform ${filters.sortBy === 'status'
                                  ? filters.sortOrder === 'ASC' ? 'rotate-90' : 'rotate-270'
                                  : 'text-gray-400'
                                }`} />
                            </button>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <button
                              onClick={() => handleSort('created_at')}
                              className="flex items-center space-x-1 hover:text-[#159A9C] transition-colors"
                            >
                              <span>Criado em</span>
                              <ChevronRight className={`w-3 h-3 transition-transform ${filters.sortBy === 'created_at'
                                  ? filters.sortOrder === 'ASC' ? 'rotate-90' : 'rotate-270'
                                  : 'text-gray-400'
                                }`} />
                            </button>
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {clientes.map((cliente, index) => (
                          <tr
                            key={cliente.id}
                            className={`hover:bg-blue-50 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                              }`}
                            onClick={() => handleViewCliente(cliente)}
                          >
                            {/* Checkbox de Seleção */}
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedClientes.includes(cliente.id!)}
                                onChange={(e) => {
                                  handleSelectCliente(cliente.id!, e.target.checked);
                                }}
                                className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                              />
                            </td>

                            {/* Cliente - Nome, Empresa, Avatar */}
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] flex items-center justify-center text-white font-semibold text-xs">
                                    {cliente.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-[#0070F3] hover:underline truncate">
                                    {cliente.nome}
                                  </p>
                                  {cliente.empresa && (
                                    <p className="text-xs text-gray-500 truncate">{cliente.empresa}</p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Status Compacto */}
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${cliente.status === 'cliente' ? 'bg-green-500' :
                                    cliente.status === 'prospect' ? 'bg-blue-500' :
                                      cliente.status === 'lead' ? 'bg-yellow-500' : 'bg-gray-400'
                                  }`}></div>
                                <span className="text-sm text-gray-700 capitalize">
                                  {getStatusText(cliente.status)}
                                </span>
                              </div>
                            </td>

                            {/* Data de Criação Compacta */}
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-700">
                                {cliente.created_at ? new Date(cliente.created_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                }) : '-'}
                              </div>
                            </td>

                            {/* Ações */}
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewCliente(cliente);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-[#159A9C] hover:bg-[#DEEFE7] rounded-lg transition-colors"
                                  title="Ver detalhes"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditCliente(cliente);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCliente(cliente.id!);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Paginação estilo Salesforce */}
              {clientesData && clientesData.totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-700">
                        Exibindo{' '}
                        <span className="font-medium">
                          {((clientesData.page || 1) - 1) * (clientesData.limit || 10) + 1}
                        </span>{' '}
                        a{' '}
                        <span className="font-medium">
                          {Math.min((clientesData.page || 1) * (clientesData.limit || 10), clientesData.total)}
                        </span>{' '}
                        de{' '}
                        <span className="font-medium">{clientesData.total}</span> registros
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Primeira página */}
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={!clientesData.page || clientesData.page === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Primeira
                      </button>

                      {/* Página anterior */}
                      <button
                        onClick={() => handlePageChange(Math.max(1, (clientesData.page || 1) - 1))}
                        disabled={!clientesData.page || clientesData.page === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Anterior</span>
                      </button>

                      {/* Páginas numéricas */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, clientesData.totalPages) }, (_, i) => {
                          const startPage = Math.max(1, (clientesData.page || 1) - 2);
                          const page = startPage + i;
                          if (page > clientesData.totalPages) return null;

                          const isCurrentPage = page === clientesData.page;
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-1 text-sm border rounded ${isCurrentPage
                                  ? 'bg-[#159A9C] border-[#159A9C] text-white'
                                  : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>

                      {/* Próxima página */}
                      <button
                        onClick={() => handlePageChange(Math.min(clientesData.totalPages, (clientesData.page || 1) + 1))}
                        disabled={!clientesData.page || clientesData.page === clientesData.totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        <span>Próxima</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Última página */}
                      <button
                        onClick={() => handlePageChange(clientesData.totalPages)}
                        disabled={!clientesData.page || clientesData.page === clientesData.totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Última
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      <ModalCadastroCliente
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedCliente(null);
        }}
        onSave={handleSaveCliente}
        cliente={selectedCliente}
        isLoading={isModalLoading}
      />

      {/* Modal de Detalhes */}
      <ModalDetalhesCliente
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedCliente(null);
        }}
        cliente={selectedCliente}
        onEdit={(cliente) => {
          setShowDetailsModal(false);
          setSelectedCliente(cliente);
          setShowCreateModal(true);
        }}
        onDelete={handleDeleteCliente}
        onAvatarUpdate={handleAvatarUpdate}
        onAttachmentAdd={handleAttachmentAdd}
      />
    </div>
  );
};

export default ClientesPage;
