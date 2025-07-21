import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useI18n } from '../../contexts/I18nContext';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
import ModalCadastroCliente from '../../components/modals/ModalCadastroCliente';
import { clientesService, Cliente, ClienteFilters, PaginatedClientes } from '../../services/clientesService';
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
  Loader2
} from 'lucide-react';

// Dados mock para fallback
const mockClientes: Cliente[] = [
  {
    id: '1',
    nome: 'João Silva Santos',
    email: 'joao@empresa.com',
    telefone: '(11) 99999-9999',
    empresa: 'Tech Solutions Ltda',
    cargo: 'CEO',
    endereco: 'São Paulo, SP',
    status: 'cliente',
    tipo: 'pessoa_juridica',
    tags: ['Premium', 'VIP'],
    created_at: '2024-01-10'
  },
  {
    id: '2', 
    nome: 'Maria Santos Oliveira',
    email: 'maria@startup.com',
    telefone: '(11) 88888-8888',
    empresa: 'StartupXYZ',
    cargo: 'CTO',
    endereco: 'Rio de Janeiro, RJ',
    status: 'prospect',
    tipo: 'pessoa_juridica',
    tags: ['Startup', 'Tech'],
    created_at: '2024-01-08'
  },
  {
    id: '3',
    nome: 'Pedro Costa Lima',
    email: 'pedro@freelancer.com',
    telefone: '(11) 77777-7777',
    empresa: 'Freelancer',
    cargo: 'Designer',
    endereco: 'Belo Horizonte, MG',
    status: 'inativo',
    tipo: 'pessoa_fisica',
    tags: ['Freelancer'],
    created_at: '2024-01-01'
  }
];

const ClientesPage: React.FC = () => {
  const { t } = useI18n();
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
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
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
      
      console.log('✅ Clientes carregados do servidor:', data.data.length);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      
      // Mostrar notificação de aviso sobre fallback
      toast.error('Erro ao carregar dados do servidor. Exibindo dados de exemplo.', {
        duration: 4000,
        position: 'top-right',
        icon: '⚠️',
      });
      
      // Fallback para dados mock em caso de erro
      setClientes(mockClientes);
      setClientesData({
        data: mockClientes,
        total: mockClientes.length,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      console.log('📝 Usando dados mock:', mockClientes.length, 'clientes');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar estatísticas
  const loadEstatisticas = async () => {
    try {
      // Tentar buscar estatísticas do servidor primeiro
      const stats = await clientesService.getEstartisticas();
      setEstatisticas(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas do servidor, calculando localmente:', error);
      // Sempre calcular estatísticas dos dados locais como fallback
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
    const inativos = clientes.filter(c => c.status === 'inativo').length;

    console.log('📊 Estatísticas calculadas:', {
      total,
      ativos,
      prospects,
      leads,
      inativos,
      dados: clientes.map(c => ({ nome: c.nome, status: c.status }))
    });

    setEstatisticas({ total, ativos, prospects, leads });
  };

  useEffect(() => {
    loadClientes();
  }, [filters]);

  useEffect(() => {
    // Sempre recalcular estatísticas quando os dados mudarem
    calcularEstatisticasLocais();
  }, [clientes]);

  // Carregar estatísticas do servidor na primeira carga
  useEffect(() => {
    if (clientes.length > 0) {
      loadEstatisticas();
    }
  }, []); // Executar apenas uma vez

  // Handlers para filtros
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleStatusChange = (status: string) => {
    setFilters(prev => ({ ...prev, status: status === 'todos' ? '' : status, page: 1 }));
  };

  const handleTipoChange = (tipo: string) => {
    setFilters(prev => ({ ...prev, tipo: tipo === 'todos' ? '' : tipo, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Handler para salvar cliente (criar/editar)
  const handleSaveCliente = async (clienteData: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>) => {
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
      <BackToNucleus 
        title="Clientes"
        nucleusName="CRM" 
        nucleusPath="/nuclei/crm"
        currentModuleName="Clientes"
      />
      <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#002333]">Clientes</h1>
              <p className="mt-2 text-[#B4BEC9]">Gerencie seus clientes e contatos</p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-3">
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

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
              />
            </div>

            {/* Filtro por Status */}
            <select
              value={filters.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            >
              <option value="">Todos os Status</option>
              <option value="lead">Lead</option>
              <option value="prospect">Prospect</option>
              <option value="cliente">Cliente</option>
              <option value="inativo">Inativo</option>
            </select>

            {/* Filtro por Tipo */}
            <select
              value={filters.tipo}
              onChange={(e) => handleTipoChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            >
              <option value="">Todos os Tipos</option>
              <option value="pessoa_fisica">Pessoa Física</option>
              <option value="pessoa_juridica">Pessoa Jurídica</option>
            </select>

            {/* Filtro por Ordenação */}
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                setFilters(prev => ({ ...prev, sortBy, sortOrder: sortOrder as 'ASC' | 'DESC' }));
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
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Criado em
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clientes.map((cliente) => (
                      <tr key={cliente.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-[#DEEFE7] flex items-center justify-center">
                                <User className="h-5 w-5 text-[#159A9C]" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{cliente.nome}</div>
                              {cliente.empresa && (
                                <div className="text-sm text-gray-500">{cliente.empresa}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{cliente.email}</div>
                          {cliente.telefone && (
                            <div className="text-sm text-gray-500">{cliente.telefone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {cliente.tipo === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(cliente.status)}`}>
                            {getStatusText(cliente.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cliente.created_at ? new Date(cliente.created_at).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEditCliente(cliente)}
                              className="text-[#159A9C] hover:text-[#0F7B7D] p-1 rounded-lg hover:bg-[#DEEFE7] transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCliente(cliente.id!)}
                              className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50 transition-colors"
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

              {/* Paginação */}
              {clientesData && clientesData.totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(Math.max(1, (clientesData.page || 1) - 1))}
                      disabled={!clientesData.page || clientesData.page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => handlePageChange(Math.min(clientesData.totalPages, (clientesData.page || 1) + 1))}
                      disabled={!clientesData.page || clientesData.page === clientesData.totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próximo
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Mostrando{' '}
                        <span className="font-medium">
                          {((clientesData.page || 1) - 1) * (clientesData.limit || 10) + 1}
                        </span>{' '}
                        até{' '}
                        <span className="font-medium">
                          {Math.min((clientesData.page || 1) * (clientesData.limit || 10), clientesData.total)}
                        </span>{' '}
                        de{' '}
                        <span className="font-medium">{clientesData.total}</span> resultados
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => handlePageChange(Math.max(1, (clientesData.page || 1) - 1))}
                          disabled={!clientesData.page || clientesData.page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        
                        {/* Números das páginas */}
                        {Array.from({ length: Math.min(5, clientesData.totalPages) }, (_, i) => {
                          const page = i + 1;
                          const isCurrentPage = page === clientesData.page;
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                isCurrentPage
                                  ? 'z-10 bg-[#159A9C] border-[#159A9C] text-white'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}

                        <button
                          onClick={() => handlePageChange(Math.min(clientesData.totalPages, (clientesData.page || 1) + 1))}
                          disabled={!clientesData.page || clientesData.page === clientesData.totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
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
    </div>
  );
};

export default ClientesPage;
