import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../contexts/I18nContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
import ModalCadastroCliente from '../../components/modals/ModalCadastroCliente';
import { ModalDetalhesCliente } from '../../components/modals/ModalDetalhesCliente';
import { ClienteCard } from '../../components/clientes';
import {
  clientesService,
  Cliente,
  ClienteFilters,
  PaginatedClientes,
} from '../../services/clientesService';
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
  List,
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
    sortOrder: 'DESC',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? 'cards' : 'table',
  );
  const [selectedClientes, setSelectedClientes] = useState<string[]>([]);
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    ativos: 0,
    prospects: 0,
    leads: 0,
  });

  // Alternância automática para cards em breakpoints pequenos
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 640px)');

    const ensureCardsView = () => {
      if (mediaQuery.matches) {
        setViewMode((current) => (current === 'cards' ? current : 'cards'));
      }
    };

    ensureCardsView();

    const listener = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setViewMode((current) => (current === 'cards' ? current : 'cards'));
      }
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', listener);
    } else {
      mediaQuery.addListener(listener);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', listener);
      } else {
        mediaQuery.removeListener(listener);
      }
    };
  }, []);

  // Ref para rastrear se é a primeira montagem (evitar execução desnecessária)
  const isFirstMount = useRef(true);

  // Função para calcular estatísticas baseadas nos dados carregados
  const calcularEstatisticasLocais = (clientesData: Cliente[]) => {
    if (clientesData.length === 0) {
      setEstatisticas({ total: 0, ativos: 0, prospects: 0, leads: 0 });
      return;
    }

    const total = clientesData.length;
    const ativos = clientesData.filter((c) => c.status === 'cliente').length;
    const prospects = clientesData.filter((c) => c.status === 'prospect').length;
    const leads = clientesData.filter((c) => c.status === 'lead').length;

    setEstatisticas({ total, ativos, prospects, leads });
  };

  // Carregar clientes (memoizado para evitar loops)
  const loadClientes = useCallback(async () => {
    try {
      setIsLoading(true);

      const data = await clientesService.getClientes(filters);
      setClientesData(data);
      setClientes(data.data);

      // Calcular estatísticas locais após carregar dados
      calcularEstatisticasLocais(data.data);
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
        totalPages: 0,
      });
      calcularEstatisticasLocais([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    filters.page,
    filters.limit,
    filters.search,
    filters.status,
    filters.tipo,
    filters.sortBy,
    filters.sortOrder,
  ]);

  // Aplicar filtros com debounce para busca
  useEffect(() => {
    // Pular execução na primeira montagem (valores iniciais vazios)
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const delayDebounce = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchTerm,
        status: selectedStatus,
        tipo: selectedTipo,
        page: 1, // Reset para primeira página quando filtros mudam
      }));
    }, 300); // 300ms de delay para busca

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, selectedStatus, selectedTipo]);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  // Notificação de boas-vindas removida - usar apenas toast para feedback imediato

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
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleSort = (column: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'ASC' ? 'DESC' : 'ASC',
      page: 1,
    }));
  };

  // Handlers para seleção em massa
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClientes(clientes.map((c) => c.id!));
    } else {
      setSelectedClientes([]);
    }
  };

  const handleSelectCliente = (clienteId: string, checked: boolean) => {
    if (checked) {
      setSelectedClientes((prev) => [...prev, clienteId]);
    } else {
      setSelectedClientes((prev) => prev.filter((id) => id !== clienteId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedClientes.length === 0) return;

    const confirmMessage = `Tem certeza que deseja excluir ${selectedClientes.length} cliente(s) selecionado(s)?`;
    if (window.confirm(confirmMessage)) {
      try {
        const loadingToast = toast.loading(`Excluindo ${selectedClientes.length} cliente(s)...`);

        // Excluir todos os clientes selecionados
        await Promise.all(selectedClientes.map((id) => clientesService.deleteCliente(id)));

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
        ids: selectedClientes,
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
  const handleSaveCliente = async (
    clienteData: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>,
  ) => {
    try {
      setIsModalLoading(true);

      if (selectedCliente) {
        // Editar cliente existente
        await clientesService.updateCliente(selectedCliente.id!, clienteData);
        console.log('✅ Cliente editado:', clienteData.nome);
      } else {
        // Criar novo cliente
        await clientesService.createCliente(clienteData);
        console.log('✅ Novo cliente criado:', clienteData.nome);
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
        const cliente = clientes.find((c) => c.id === id);
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
      a.download = 'clientes.csv';
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
  };

  const handleAvatarUpdate = async (clienteId: string, avatar: UploadResult) => {
    try {
      // TODO: Implementar API call para atualizar avatar
      toast.success('Avatar atualizado com sucesso!');
      // Atualizar localmente
      setClientes((prev) =>
        prev.map((c) => (c.id === clienteId ? { ...c, avatar: avatar.url } : c)),
      );
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
      case 'cliente':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'prospect':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'lead':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inativo':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'cliente':
        return 'Cliente';
      case 'prospect':
        return 'Prospect';
      case 'lead':
        return 'Lead';
      case 'inativo':
        return 'Inativo';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="CRM" nucleusPath="/nuclei/crm" />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                  <Users className="h-8 w-8 mr-3 text-[#159A9C]" />
                  Clientes
                  {isLoading && (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#159A9C] ml-3"></div>
                  )}
                </h1>
                <p className="mt-2 text-[#B4BEC9]">
                  {isLoading
                    ? 'Carregando clientes...'
                    : `Gerencie seus ${estatisticas.total} clientes e contatos`}
                </p>
              </div>

              {/* Botão de ação principal */}
              <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Botões de visualização */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'cards'
                      ? 'bg-white text-[#159A9C] shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                      }`}
                    title="Visualizar em cards"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'table'
                      ? 'bg-white text-[#159A9C] shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                      }`}
                    title="Visualizar em lista"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleExportClientes}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-[#B4BEC9] text-sm font-medium rounded-lg text-[#002333] bg-white hover:bg-[#DEEFE7] focus:outline-none focus:ring-2 focus:ring-[#159A9C] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCliente(null);
                    setShowCreateModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] hover:from-[#0F7B7D] hover:to-[#0C6062] focus:outline-none focus:ring-2 focus:ring-[#159A9C] transition-all shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  Novo Cliente
                </button>
              </div>
            </div>
          </div>

          {/* Cards de Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl shadow-sm border border-[#DEEFE7] bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#002333]/70 uppercase tracking-wider">
                    Total de Clientes
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{estatisticas.total}</p>
                  <p className="mt-1 text-xs text-[#002333]/70">📊 Visão geral</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-[#DEEFE7] to-white rounded-xl shadow-inner">
                  <Users className="w-6 h-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl shadow-sm border border-[#DEEFE7] bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#002333]/70 uppercase tracking-wider">
                    Clientes Ativos
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{estatisticas.ativos}</p>
                  <p className="mt-1 text-xs text-[#002333]/70">✅ Ativos</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-[#DEEFE7] to-white rounded-xl shadow-inner">
                  <User className="w-6 h-6 text-[#0F7B7D]" />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl shadow-sm border border-[#DEEFE7] bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#002333]/70 uppercase tracking-wider">
                    Prospects
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{estatisticas.prospects}</p>
                  <p className="mt-1 text-xs text-[#002333]/70">🎯 Em prospecção</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-[#DEEFE7] to-white rounded-xl shadow-inner">
                  <Eye className="w-6 h-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl shadow-sm border border-[#DEEFE7] bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#002333]/70 uppercase tracking-wider">
                    Leads
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">{estatisticas.leads}</p>
                  <p className="mt-1 text-xs text-[#002333]/70">🚀 Potenciais</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-[#DEEFE7] to-white rounded-xl shadow-inner">
                  <Tag className="w-6 h-6 text-[#159A9C]" />
                </div>
              </div>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-6">
            <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap gap-4 items-stretch sm:items-end">
              <div className="flex-1 min-w-full sm:min-w-[260px] lg:min-w-[320px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar Clientes
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, email, empresa..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full">
                <div className="w-full sm:w-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                  >
                    <option value="">Todos os Status</option>
                    <option value="lead">🚀 Lead</option>
                    <option value="prospect">🎯 Prospect</option>
                    <option value="cliente">✅ Cliente</option>
                    <option value="inativo">❌ Inativo</option>
                  </select>
                </div>

                <div className="w-full sm:w-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                  <select
                    value={selectedTipo}
                    onChange={(e) => handleTipoChange(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                  >
                    <option value="">Todos os Tipos</option>
                    <option value="pessoa_fisica">👤 Pessoa Física</option>
                    <option value="pessoa_juridica">🏢 Pessoa Jurídica</option>
                  </select>
                </div>

                <div className="w-full sm:w-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ações</label>
                  <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full">
                    <button
                      onClick={handleClearFilters}
                      className="flex-1 sm:flex-initial px-4 py-2 border border-[#B4BEC9] text-sm font-medium rounded-lg text-[#002333] bg-white hover:bg-[#DEEFE7] focus:outline-none focus:ring-2 focus:ring-[#159A9C] flex items-center justify-center gap-2 transition-colors"
                    >
                      <Filter className="w-4 h-4" />
                      Limpar
                    </button>

                    <button
                      onClick={handleExportClientes}
                      disabled={clientes.length === 0}
                      className="flex-1 sm:flex-initial px-3 py-2 rounded-lg text-white bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] hover:from-[#0F7B7D] hover:to-[#0C6062] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                      title="Exportar clientes"
                    >
                      <Download className="w-4 h-4" />
                      Exportar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Clientes */}
          <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#159A9C]" />
                <p className="mt-2 text-gray-500">Carregando clientes...</p>
              </div>
            ) : clientes.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum cliente encontrado
                </h3>
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
                              <span className="ml-2 text-[#159A9C] font-medium">(filtrados)</span>
                            )}
                            {selectedClientes.length > 0 && (
                              <span className="ml-2 text-[#159A9C] font-semibold">
                                ({selectedClientes.length} selecionado
                                {selectedClientes.length !== 1 ? 's' : ''})
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
                                className="text-sm px-3 py-1.5 rounded-md text-white bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] hover:from-[#0F7B7D] hover:to-[#0C6062] flex items-center space-x-1 transition-all"
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
                            <th
                              className="w-12 px-6 py-3 text-left"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={
                                  selectedClientes.length === clientes.length && clientes.length > 0
                                }
                                onChange={(e) => handleSelectAll(e.target.checked)}
                                className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                              />
                            </th>
                            <th className="w-1/2 px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              <button
                                onClick={() => handleSort('nome')}
                                className="flex items-center space-x-1 hover:text-[#159A9C] transition-colors"
                              >
                                <span>Cliente</span>
                                <ChevronRight
                                  className={`w-3 h-3 transition-transform ${filters.sortBy === 'nome'
                                    ? filters.sortOrder === 'ASC'
                                      ? 'rotate-90'
                                      : 'rotate-270'
                                    : 'text-gray-400'
                                    }`}
                                />
                              </button>
                            </th>
                            <th className="w-32 px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              <button
                                onClick={() => handleSort('status')}
                                className="flex items-center space-x-1 hover:text-[#159A9C] transition-colors"
                              >
                                <span>Status</span>
                                <ChevronRight
                                  className={`w-3 h-3 transition-transform ${filters.sortBy === 'status'
                                    ? filters.sortOrder === 'ASC'
                                      ? 'rotate-90'
                                      : 'rotate-270'
                                    : 'text-gray-400'
                                    }`}
                                />
                              </button>
                            </th>
                            <th className="w-40 px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                              <button
                                onClick={() => handleSort('created_at')}
                                className="flex items-center space-x-1 hover:text-[#159A9C] transition-colors"
                              >
                                <span>Criado em</span>
                                <ChevronRight
                                  className={`w-3 h-3 transition-transform ${filters.sortBy === 'created_at'
                                    ? filters.sortOrder === 'ASC'
                                      ? 'rotate-90'
                                      : 'rotate-270'
                                    : 'text-gray-400'
                                    }`}
                                />
                              </button>
                            </th>
                            <th className="w-32 px-4 lg:px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {clientes.map((cliente, index) => (
                            <tr
                              key={cliente.id}
                              className={`transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-[#DEEFE7]/60`}
                              onClick={() => handleViewCliente(cliente)}
                            >
                              {/* Checkbox de Seleção */}
                              <td className="w-12 px-6 py-3" onClick={(e) => e.stopPropagation()}>
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
                              <td className="px-6 py-3">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] flex items-center justify-center text-white font-semibold text-xs">
                                      {cliente.nome
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .substring(0, 2)
                                        .toUpperCase()}
                                    </div>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-[#159A9C] hover:underline truncate">
                                      {cliente.nome}
                                    </p>
                                    {cliente.empresa && (
                                      <p className="text-xs text-gray-500 truncate">
                                        {cliente.empresa}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Status Compacto */}
                              <td className="px-4 lg:px-6 py-3">
                                <div className="flex items-center space-x-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${cliente.status === 'cliente'
                                      ? 'bg-green-500'
                                      : cliente.status === 'prospect'
                                        ? 'bg-[#159A9C]'
                                        : cliente.status === 'lead'
                                          ? 'bg-yellow-500'
                                          : 'bg-gray-400'
                                      }`}
                                  ></div>
                                  <span className="text-sm text-gray-700 capitalize">
                                    {getStatusText(cliente.status)}
                                  </span>
                                </div>
                              </td>

                              {/* Data de Criação Compacta */}
                              <td className="px-4 lg:px-6 py-3">
                                <div className="text-sm text-gray-700">
                                  {cliente.created_at
                                    ? new Date(cliente.created_at).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                    })
                                    : '-'}
                                </div>
                              </td>

                              {/* Ações */}
                              <td className="px-4 lg:px-6 py-3 text-right">
                                <div className="flex items-center justify-end space-x-1">
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
                                    className="p-1.5 text-gray-400 hover:text-[#159A9C] hover:bg-[#DEEFE7] rounded-lg transition-colors"
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
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-gray-700">
                        Exibindo{' '}
                        <span className="font-medium">
                          {((clientesData.page || 1) - 1) * (clientesData.limit || 10) + 1}
                        </span>{' '}
                        a{' '}
                        <span className="font-medium">
                          {Math.min(
                            (clientesData.page || 1) * (clientesData.limit || 10),
                            clientesData.total,
                          )}
                        </span>{' '}
                        de <span className="font-medium">{clientesData.total}</span> registros
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                        {/* Primeira página */}
                        <button
                          onClick={() => handlePageChange(1)}
                          disabled={!clientesData.page || clientesData.page === 1}
                          className="hidden sm:inline-flex px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Primeira
                        </button>

                        {/* Página anterior */}
                        <button
                          onClick={() =>
                            handlePageChange(Math.max(1, (clientesData.page || 1) - 1))
                          }
                          disabled={!clientesData.page || clientesData.page === 1}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span className="hidden sm:inline">Anterior</span>
                        </button>

                        {/* Páginas numéricas */}
                        <div className="flex flex-wrap gap-1">
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
                          onClick={() =>
                            handlePageChange(
                              Math.min(clientesData.totalPages, (clientesData.page || 1) + 1),
                            )
                          }
                          disabled={
                            !clientesData.page || clientesData.page === clientesData.totalPages
                          }
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="hidden sm:inline">Próxima</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Última página */}
                        <button
                          onClick={() => handlePageChange(clientesData.totalPages)}
                          disabled={
                            !clientesData.page || clientesData.page === clientesData.totalPages
                          }
                          className="hidden sm:inline-flex px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
