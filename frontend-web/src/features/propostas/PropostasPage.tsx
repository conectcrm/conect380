import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../contexts/I18nContext';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
import { ModalProposta } from '../../components/modals/ModalProposta';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  MoreVertical,
  DollarSign,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Settings
} from 'lucide-react';

// Dados mock para desenvolvimento
const mockPropostas = [
  {
    id: '001',
    numero: 'PROP-2025-001',
    cliente: 'Tech Solutions Ltda',
    cliente_contato: 'João Silva Santos',
    titulo: 'Sistema de Gestão Empresarial',
    valor: 85000,
    status: 'aprovada',
    data_criacao: '2025-01-10',
    data_vencimento: '2025-02-10',
    data_aprovacao: '2025-01-18',
    vendedor: 'Maria Santos',
    descricao: 'Desenvolvimento de sistema completo de gestão empresarial com módulos financeiro, RH e vendas.',
    probabilidade: 95,
    categoria: 'software'
  },
  {
    id: '002',
    numero: 'PROP-2025-002', 
    cliente: 'StartupXYZ',
    cliente_contato: 'Maria Santos Oliveira',
    titulo: 'Consultoria em Marketing Digital',
    valor: 25000,
    status: 'negociacao',
    data_criacao: '2025-01-15',
    data_vencimento: '2025-02-15',
    data_aprovacao: null,
    vendedor: 'Pedro Costa',
    descricao: 'Consultoria especializada em estratégias de marketing digital e crescimento.',
    probabilidade: 70,
    categoria: 'consultoria'
  },
  {
    id: '003',
    numero: 'PROP-2025-003',
    cliente: 'Empresa ABC',
    cliente_contato: 'Carlos Mendes',
    titulo: 'Treinamento Corporativo',
    valor: 15000,
    status: 'enviada',
    data_criacao: '2025-01-18',
    data_vencimento: '2025-02-18',
    data_aprovacao: null,
    vendedor: 'Ana Silva',
    descricao: 'Programa de treinamento corporativo em liderança e gestão de equipes.',
    probabilidade: 50,
    categoria: 'treinamento'
  },
  {
    id: '004',
    numero: 'PROP-2025-004',
    cliente: 'Freelancer Design',
    cliente_contato: 'Pedro Costa Lima',
    titulo: 'Identidade Visual Completa',
    valor: 8000,
    status: 'rejeitada',
    data_criacao: '2025-01-05',
    data_vencimento: '2025-01-20',
    data_aprovacao: null,
    vendedor: 'Maria Santos',
    descricao: 'Criação de identidade visual completa incluindo logo, manual de marca e materiais gráficos.',
    probabilidade: 20,
    categoria: 'design'
  }
];

const PropostasPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [propostas, setPropostas] = useState(mockPropostas);
  const [filteredPropostas, setFilteredPropostas] = useState(mockPropostas);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('todos');
  const [selectedVendedor, setSelectedVendedor] = useState('todos');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Função para salvar proposta
  const handleSaveProposta = async (data: any) => {
    // Simulação de API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const novaProposta = {
      id: String(propostas.length + 1),
      numero: `PROP-${String(propostas.length + 1).padStart(3, '0')}`,
      titulo: data.titulo,
      cliente: data.cliente,
      cliente_contato: data.cliente,
      valor: data.valor,
      status: 'rascunho',
      data_criacao: new Date().toISOString().split('T')[0],
      data_vencimento: data.data_vencimento,
      data_aprovacao: null,
      vendedor: data.vendedor,
      descricao: data.descricao,
      probabilidade: data.probabilidade,
      categoria: data.categoria
    };

    setPropostas(prev => [novaProposta, ...prev]);
    setFilteredPropostas(prev => [novaProposta, ...prev]);
  };

  // Aplicar filtros
  useEffect(() => {
    let filtered = propostas;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(proposta => 
        proposta.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposta.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposta.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposta.cliente_contato.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (selectedStatus !== 'todos') {
      filtered = filtered.filter(proposta => proposta.status === selectedStatus);
    }

    // Filtro por vendedor
    if (selectedVendedor !== 'todos') {
      filtered = filtered.filter(proposta => proposta.vendedor === selectedVendedor);
    }

    setFilteredPropostas(filtered);
  }, [propostas, searchTerm, selectedStatus, selectedVendedor]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovada': return <CheckCircle className="w-4 h-4" />;
      case 'rejeitada': return <XCircle className="w-4 h-4" />;
      case 'negociacao': return <TrendingUp className="w-4 h-4" />;
      case 'enviada': return <Clock className="w-4 h-4" />;
      case 'rascunho': return <Edit className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovada': return 'bg-green-100 text-green-800';
      case 'rejeitada': return 'bg-red-100 text-red-800';
      case 'negociacao': return 'bg-blue-100 text-blue-800';
      case 'enviada': return 'bg-yellow-100 text-yellow-800';
      case 'rascunho': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'aprovada': return 'Aprovada';
      case 'rejeitada': return 'Rejeitada';
      case 'negociacao': return 'Em Negociação';
      case 'enviada': return 'Enviada';
      case 'rascunho': return 'Rascunho';
      default: return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const totalValorPropostas = propostas.reduce((sum, p) => sum + p.valor, 0);
  const valorAprovadas = propostas.filter(p => p.status === 'aprovada').reduce((sum, p) => sum + p.valor, 0);
  const valorNegociacao = propostas.filter(p => p.status === 'negociacao').reduce((sum, p) => sum + p.valor, 0);

  return (
    <div className="min-h-screen bg-[#DEEFE7]">
      <BackToNucleus 
        title="Propostas"
        nucleusName="Vendas" 
        nucleusPath="/nuclei/vendas"
        currentModuleName="Propostas"
      />
      <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#002333]">Propostas</h1>
              <p className="mt-2 text-[#B4BEC9]">Acompanhe suas propostas comerciais</p>
            </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            <button className="px-4 py-2 border border-[#B4BEC9] rounded-lg hover:bg-[#DEEFE7] flex items-center gap-2 text-sm text-[#002333] transition-colors">
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <button 
              onClick={() => navigate('/propostas/nova')}
              className="px-4 py-2 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white rounded-lg hover:shadow-lg flex items-center gap-2 text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Nova Proposta
            </button>
          </div>
        </div>

        {/* Estatísticas rápidas */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-4 rounded-lg border border-[#DEEFE7] shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-[#DEEFE7] rounded-lg">
                <FileText className="w-6 h-6 text-[#159A9C]" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[#B4BEC9]">Total de Propostas</p>
                <p className="text-2xl font-bold text-[#002333]">{propostas.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aprovadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {propostas.filter(p => p.status === 'aprovada').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Em Negociação</p>
                <p className="text-2xl font-bold text-gray-900">
                  {propostas.filter(p => p.status === 'negociacao').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalValorPropostas)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg border shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número, cliente ou título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtro Status */}
          <div className="lg:w-48">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos os Status</option>
              <option value="rascunho">Rascunho</option>
              <option value="enviada">Enviada</option>
              <option value="negociacao">Em Negociação</option>
              <option value="aprovada">Aprovada</option>
              <option value="rejeitada">Rejeitada</option>
            </select>
          </div>

          {/* Filtro Vendedor */}
          <div className="lg:w-48">
            <select
              value={selectedVendedor}
              onChange={(e) => setSelectedVendedor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos os Vendedores</option>
              <option value="Maria Santos">Maria Santos</option>
              <option value="Pedro Costa">Pedro Costa</option>
              <option value="Ana Silva">Ana Silva</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Propostas */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proposta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimento
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPropostas.map((proposta) => (
                <tr key={proposta.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{proposta.numero}</div>
                      <div className="text-sm text-gray-500">{proposta.titulo}</div>
                      <div className="text-xs text-gray-400 flex items-center mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        Criada em {formatDate(proposta.data_criacao)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{proposta.cliente}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {proposta.cliente_contato}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(proposta.status)}`}>
                      {getStatusIcon(proposta.status)}
                      <span className="ml-1">{getStatusText(proposta.status)}</span>
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {proposta.probabilidade}% de chance
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(proposta.valor)}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {proposta.categoria}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {proposta.vendedor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(proposta.data_vencimento)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(proposta.data_vencimento) < new Date() ? 
                        <span className="text-red-600">Vencida</span> : 
                        `${Math.ceil((new Date(proposta.data_vencimento).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} dias`
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 p-1" title="Visualizar">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900 p-1" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 p-1" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600 p-1" title="Mais opções">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="bg-white px-6 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando <span className="font-medium">1</span> a <span className="font-medium">{filteredPropostas.length}</span> de{' '}
              <span className="font-medium">{filteredPropostas.length}</span> resultados
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                Anterior
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                Próximo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Proposta */}
      <ModalProposta
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleSaveProposta}
        isLoading={isLoading}
      />
      </div>
    </div>
  );
};

export default PropostasPage;
