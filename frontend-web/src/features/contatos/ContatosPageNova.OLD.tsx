import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Download,
  Upload,
  MoreVertical,
  Check,
  X,
  Edit,
  Trash2,
  Mail,
  Phone,
  MessageSquare,
  Eye,
  UserPlus,
} from 'lucide-react';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
import { ContatoMetrics } from '../../components/contatos/ContatoMetrics';
import { ContatoFilters } from '../../components/contatos/ContatoFilters';
import { ContatoCard } from '../../components/contatos/ContatoCard';
import { ModalContato } from '../../components/contatos/ModalContato';
import ModalNovoContato from '../../components/contatos/ModalNovoContato';
import { Contato, contatosService } from './services/contatosService';
import ErrorBoundary from '../../components/ErrorBoundary';
import { safeRender, validateAndSanitizeContact } from '../../utils/safeRender';

export const ContatosPage: React.FC = () => {
  // Estados principais
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [statusFilter, setStatusFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [proprietarioFilter, setProprietarioFilter] = useState('todos');
  const [fonteFilter, setFonteFilter] = useState('todas');

  // Seleção
  const [selectedContatos, setSelectedContatos] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Modais
  const [modalNovoContato, setModalNovoContato] = useState(false);
  const [modalVisualizarContato, setModalVisualizarContato] = useState(false);
  const [contatoSelecionado, setContatoSelecionado] = useState<Contato | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Ações em massa
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Mock data para desenvolvimento
  useEffect(() => {
    const mockContatos: Contato[] = [
      {
        id: '1',
        nome: 'João Silva',
        email: 'joao@empresa.com',
        telefone: '(11) 99999-9999',
        empresa: 'Tech Corp',
        cargo: 'Gerente de TI',
        status: 'ativo',
        tipo: 'cliente',
        fonte: 'website',
        proprietario: 'Ana Costa',
        data_criacao: new Date().toISOString(),
        data_ultima_interacao: new Date().toISOString(),
        valor_potencial: 50000,
        pontuacao_lead: 85,
        tags: ['VIP', 'B2B'],
        notas: 'Cliente importante',
        anexos: [],
        atividades_recentes: 5,
        oportunidades_abertas: 2,
        vendas_realizadas: 3,
        valor_total_vendas: 150000,
        categoria: 'premium',
      },
      {
        id: '2',
        nome: 'Maria Santos',
        email: 'maria@startup.com',
        telefone: '(11) 88888-8888',
        empresa: 'StartUp Inovadora',
        cargo: 'CEO',
        status: 'prospecto',
        tipo: 'lead',
        fonte: 'linkedin',
        proprietario: 'Carlos Silva',
        data_criacao: new Date().toISOString(),
        data_ultima_interacao: new Date().toISOString(),
        valor_potencial: 75000,
        pontuacao_lead: 92,
        tags: ['Inovação', 'Startup'],
        notas: 'Interessada em soluções tech',
        anexos: [],
        atividades_recentes: 3,
        oportunidades_abertas: 1,
        vendas_realizadas: 0,
        valor_total_vendas: 0,
        categoria: 'prospect',
      },
    ];

    setTimeout(() => {
      setContatos(mockContatos);
      setLoading(false);
    }, 1000);
  }, []);

  // Filtrar contatos
  const contatosFiltrados = contatos.filter((contato) => {
    const matchSearch =
      !searchTerm ||
      contato.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contato.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contato.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contato.telefone.includes(searchTerm);

    const matchStatus = statusFilter === 'todos' || contato.status === statusFilter;
    const matchTipo = tipoFilter === 'todos' || contato.tipo === tipoFilter;
    const matchProprietario =
      proprietarioFilter === 'todos' || contato.proprietario === proprietarioFilter;
    const matchFonte = fonteFilter === 'todas' || contato.fonte === fonteFilter;

    return matchSearch && matchStatus && matchTipo && matchProprietario && matchFonte;
  });

  // Gerenciar seleção
  const handleToggleSelect = (id: string) => {
    setSelectedContatos((prev) =>
      prev.includes(id) ? prev.filter((contactId) => contactId !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedContatos([]);
    } else {
      setSelectedContatos(contatosFiltrados.map((contato) => contato.id));
    }
    setSelectAll(!selectAll);
  };

  // Atualizar estado do "Selecionar Todos"
  useEffect(() => {
    const allSelected =
      contatosFiltrados.length > 0 && selectedContatos.length === contatosFiltrados.length;
    setSelectAll(allSelected);
    setShowBulkActions(selectedContatos.length > 0);
  }, [selectedContatos, contatosFiltrados]);

  // Ações do contato
  const handleViewContato = (contato: Contato) => {
    setContatoSelecionado(contato);
    setIsEditing(false);
    setModalVisualizarContato(true);
  };

  const handleEditContato = (contato: Contato) => {
    setContatoSelecionado(contato);
    setIsEditing(true);
    setModalNovoContato(true);
  };

  const handleDeleteContato = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este contato?')) {
      try {
        setContatos((prev) => prev.filter((contato) => contato.id !== id));
        setSelectedContatos((prev) => prev.filter((contactId) => contactId !== id));
      } catch (error) {
        console.error('Erro ao excluir contato:', error);
      }
    }
  };

  const handleSaveContato = async (dadosContato: Partial<Contato>) => {
    try {
      if (isEditing && contatoSelecionado) {
        const contatoAtualizado = { ...contatoSelecionado, ...dadosContato };
        setContatos((prev) =>
          prev.map((contato) =>
            contato.id === contatoSelecionado.id ? contatoAtualizado : contato,
          ),
        );
      } else {
        const novoContato: Contato = {
          id: Date.now().toString(),
          nome: dadosContato.nome || '',
          email: dadosContato.email || '',
          telefone: dadosContato.telefone || '',
          empresa: dadosContato.empresa || '',
          cargo: dadosContato.cargo || '',
          status: dadosContato.status || 'prospecto',
          tipo: dadosContato.tipo || 'lead',
          fonte: dadosContato.fonte || 'manual',
          proprietario: dadosContato.proprietario || 'Sistema',
          data_criacao: new Date().toISOString(),
          data_ultima_interacao: new Date().toISOString(),
          valor_potencial: dadosContato.valor_potencial || 0,
          pontuacao_lead: dadosContato.pontuacao_lead || 50,
          tags: dadosContato.tags || [],
          notas: dadosContato.notas || '',
          anexos: dadosContato.anexos || [],
          atividades_recentes: 0,
          oportunidades_abertas: 0,
          vendas_realizadas: 0,
          valor_total_vendas: 0,
          categoria: dadosContato.categoria || 'geral',
        };
        setContatos((prev) => [novoContato, ...prev]);
      }

      setModalNovoContato(false);
      setContatoSelecionado(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar contato:', error);
    }
  };

  // Resetar filtros
  const resetFilters = () => {
    setStatusFilter('todos');
    setTipoFilter('todos');
    setProprietarioFilter('todos');
    setFonteFilter('todas');
    setSearchTerm('');
  };

  // Ações em massa
  const handleBulkDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir ${selectedContatos.length} contatos?`)) {
      try {
        setContatos((prev) => prev.filter((contato) => !selectedContatos.includes(contato.id)));
        setSelectedContatos([]);
      } catch (error) {
        console.error('Erro ao excluir contatos:', error);
      }
    }
  };

  const handleBulkEmail = () => {
    const emails = contatos
      .filter((contato) => selectedContatos.includes(contato.id))
      .map((contato) => contato.email)
      .join(';');

    window.open(`mailto:${emails}`);
  };

  const handleExportContatos = () => {
    const contatosParaExportar = contatos.filter((contato) =>
      selectedContatos.length > 0 ? selectedContatos.includes(contato.id) : true,
    );

    // Gerar CSV simples
    const headers = ['Nome', 'Email', 'Telefone', 'Empresa', 'Cargo', 'Status'];
    const csvRows = [
      headers.join(','),
      ...contatosParaExportar.map((contato) =>
        [
          contato.nome,
          contato.email,
          contato.telefone,
          contato.empresa,
          contato.cargo,
          contato.status,
        ].join(','),
      ),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'contatos.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#159A9C] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando contatos...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <BackToNucleus nucleusName="Contatos" nucleusPath="/contatos" />

        <div className="p-4 md:p-6">
          {/* Header Principal - Título no topo como solicitado */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                  <UserPlus className="h-8 w-8 mr-3 text-[#159A9C]" />
                  Contatos
                </h1>
                <p className="mt-2 text-[#B4BEC9]">
                  Gerencie seus {contatosFiltrados.length} contatos e leads de forma centralizada
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex gap-3">
                <button
                  onClick={handleExportContatos}
                  className="px-4 py-2 border border-[#B4BEC9] rounded-lg hover:bg-[#DEEFE7] flex items-center gap-2 text-sm text-[#002333] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setContatoSelecionado(null);
                    setModalNovoContato(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white rounded-lg hover:shadow-lg flex items-center gap-2 text-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Novo Contato
                </button>
              </div>
            </div>
          </div>

          {/* Métricas - Mock simples */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserPlus className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Total de Contatos</div>
                  <div className="text-2xl font-bold text-gray-900">{contatos.length}</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Ativos</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {contatos.filter((c) => c.status === 'ativo').length}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Eye className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Prospectos</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {contatos.filter((c) => c.status === 'prospecto').length}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MessageSquare className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Leads</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {contatos.filter((c) => c.tipo === 'lead').length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controles e Filtros */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
            <div className="flex flex-col gap-4">
              {/* Barra de busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email, empresa ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                />
              </div>

              {/* Controles */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Primeira linha de controles */}
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  {/* Filtros */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors text-sm ${
                      showFilters
                        ? 'bg-[#159A9C] text-white border-[#159A9C]'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    Filtros
                  </button>

                  {/* Seleção múltipla */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-[#159A9C] bg-gray-100 border-gray-300 rounded focus:ring-[#159A9C] focus:ring-2"
                    />
                    <span className="text-sm text-gray-700">
                      <span className="hidden sm:inline">Selecionar todos</span>
                      <span className="sm:hidden">Sel. todos</span>
                    </span>
                  </label>
                </div>

                {/* Modo de visualização */}
                <div className="flex border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${
                      viewMode === 'grid'
                        ? 'bg-[#159A9C] text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    } rounded-l-lg transition-colors`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${
                      viewMode === 'list'
                        ? 'bg-[#159A9C] text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    } rounded-r-lg transition-colors border-l border-gray-300`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Ações em massa */}
            {showBulkActions && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-blue-700 font-medium">
                    {selectedContatos.length} contato(s) selecionado(s)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleBulkEmail}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                      Email
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Painel de Filtros Simples */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                    >
                      <option value="todos">Todos</option>
                      <option value="ativo">Ativo</option>
                      <option value="prospecto">Prospecto</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={tipoFilter}
                      onChange={(e) => setTipoFilter(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                    >
                      <option value="todos">Todos</option>
                      <option value="cliente">Cliente</option>
                      <option value="lead">Lead</option>
                      <option value="prospecto">Prospecto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fonte</label>
                    <select
                      value={fonteFilter}
                      onChange={(e) => setFonteFilter(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                    >
                      <option value="todas">Todas</option>
                      <option value="website">Website</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="referencia">Referência</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={resetFilters}
                      className="w-full p-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Limpar Filtros
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lista de Contatos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {contatosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Nenhum contato encontrado
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ||
                  statusFilter !== 'todos' ||
                  tipoFilter !== 'todos' ||
                  fonteFilter !== 'todas'
                    ? 'Tente ajustar os filtros ou busca.'
                    : 'Comece criando um novo contato.'}
                </p>
                {!searchTerm &&
                  statusFilter === 'todos' &&
                  tipoFilter === 'todos' &&
                  fonteFilter === 'todas' && (
                    <div className="mt-6">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setContatoSelecionado(null);
                          setModalNovoContato(true);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#159A9C] hover:bg-[#0d7a7d]"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Contato
                      </button>
                    </div>
                  )}
              </div>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6'
                    : 'divide-y divide-gray-200'
                }
              >
                {contatosFiltrados.map((contato) => (
                  <div
                    key={contato.id}
                    className={`${
                      viewMode === 'grid'
                        ? 'bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
                        : 'p-4 hover:bg-gray-50 transition-colors'
                    }`}
                  >
                    {/* Checkbox de seleção */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedContatos.includes(contato.id)}
                        onChange={() => handleToggleSelect(contato.id)}
                        className="mt-1 w-4 h-4 text-[#159A9C] bg-gray-100 border-gray-300 rounded focus:ring-[#159A9C] focus:ring-2"
                      />

                      <div className="flex-1 min-w-0">
                        {/* Header do contato */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {(() => {
                                try {
                                  const safeContato = validateAndSanitizeContact(contato);
                                  return safeRender(safeContato.nome);
                                } catch {
                                  return 'Nome não disponível';
                                }
                              })()}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {safeRender(contato.cargo)} - {safeRender(contato.empresa)}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                contato.status === 'ativo'
                                  ? 'bg-green-100 text-green-800'
                                  : contato.status === 'prospecto'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {(() => {
                                try {
                                  const safeContato = validateAndSanitizeContact(contato);
                                  return safeRender(safeContato.status);
                                } catch {
                                  return 'Status não disponível';
                                }
                              })()}
                            </span>
                          </div>
                        </div>

                        {/* Informações de contato */}
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">
                              {(() => {
                                try {
                                  const safeContato = validateAndSanitizeContact(contato);
                                  return safeRender(safeContato.email);
                                } catch {
                                  return 'Email não disponível';
                                }
                              })()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>
                              {(() => {
                                try {
                                  const safeContato = validateAndSanitizeContact(contato);
                                  return safeRender(safeContato.telefone);
                                } catch {
                                  return 'Telefone não disponível';
                                }
                              })()}
                            </span>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="mt-4 flex items-center gap-2">
                          <button
                            onClick={() => handleViewContato(contato)}
                            className="flex-1 px-3 py-2 text-sm font-medium text-[#159A9C] bg-[#159A9C]/10 rounded-lg hover:bg-[#159A9C]/20 transition-colors"
                          >
                            <Eye className="w-4 h-4 inline mr-1" />
                            Visualizar
                          </button>
                          <button
                            onClick={() => handleEditContato(contato)}
                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteContato(contato.id)}
                            className="px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modais Simples - Mock */}
        {modalNovoContato && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {isEditing ? 'Editar Contato' : 'Novo Contato'}
              </h2>
              <p className="text-gray-600 mb-4">
                Modal de {isEditing ? 'edição' : 'criação'} será implementado aqui.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setModalNovoContato(false);
                    setContatoSelecionado(null);
                    setIsEditing(false);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setModalNovoContato(false);
                    setContatoSelecionado(null);
                    setIsEditing(false);
                  }}
                  className="flex-1 px-4 py-2 text-white bg-[#159A9C] rounded-lg hover:bg-[#0d7a7d] transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {modalVisualizarContato && contatoSelecionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {contatoSelecionado.nome || 'Contato sem nome'}
                </h2>
                <button
                  onClick={() => {
                    setModalVisualizarContato(false);
                    setContatoSelecionado(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <strong>Email:</strong> {contatoSelecionado.email || 'Não informado'}
                </div>
                <div>
                  <strong>Telefone:</strong> {contatoSelecionado.telefone || 'Não informado'}
                </div>
                <div>
                  <strong>Empresa:</strong> {contatoSelecionado.empresa || 'Não informado'}
                </div>
                <div>
                  <strong>Cargo:</strong> {contatoSelecionado.cargo || 'Não informado'}
                </div>
                <div>
                  <strong>Status:</strong> {contatoSelecionado.status || 'Não informado'}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setModalVisualizarContato(false);
                    handleEditContato(contatoSelecionado);
                  }}
                  className="px-4 py-2 text-white bg-[#159A9C] rounded-lg hover:bg-[#0d7a7d] transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => {
                    setModalVisualizarContato(false);
                    setContatoSelecionado(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};
