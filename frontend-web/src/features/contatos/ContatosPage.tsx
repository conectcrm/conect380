import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Users,
  User,
  Plus,
  Search,
  Phone,
  Mail,
  Building,
  Star,
  Edit,
  Trash2,
  Filter,
  Grid3X3,
  List as ListIcon,
  Loader2,
  MoreVertical,
  Eye,
} from 'lucide-react';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
import ModalNovoContato from '../../components/contatos/ModalNovoContato';
import { contatosService, Contato } from '../../services/contatosService';
import { clientesService, Cliente } from '../../services/clientesService';

const ContatosPage: React.FC = () => {
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [contatosFiltrados, setContatosFiltrados] = useState<Contato[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [clienteFiltro, setClienteFiltro] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showModal, setShowModal] = useState(false);
  const [contatoSelecionado, setContatoSelecionado] = useState<Contato | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados();
  }, []);

  // Filtrar contatos quando mudar busca ou filtro de cliente
  useEffect(() => {
    filtrarContatos();
  }, [contatos, searchTerm, clienteFiltro]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      // Carregar tudo em paralelo
      const [contatosData, clientesData] = await Promise.all([
        contatosService.listarTodos(),
        clientesService.getClientes({ limit: 1000 }),
      ]);

      setContatos(contatosData);
      setClientes(clientesData.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const filtrarContatos = () => {
    let resultado = [...contatos];

    // Filtro por cliente
    if (clienteFiltro) {
      resultado = resultado.filter((c) => c.clienteId === clienteFiltro);
    }

    // Filtro por busca
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      resultado = resultado.filter(
        (contato) =>
          contato.nome.toLowerCase().includes(termo) ||
          contato.email?.toLowerCase().includes(termo) ||
          contato.telefone.includes(termo) ||
          contato.cargo?.toLowerCase().includes(termo) ||
          contato.cliente?.nome.toLowerCase().includes(termo),
      );
    }

    setContatosFiltrados(resultado);
  };

  const handleNovo = () => {
    setContatoSelecionado(null);
    setShowModal(true);
  };

  const handleEditar = (contato: Contato) => {
    setContatoSelecionado(contato);
    setShowModal(true);
  };

  const handleRemover = async (contato: Contato) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`Deseja realmente remover o contato ${contato.nome}?`)) {
      return;
    }

    try {
      await contatosService.remover(contato.id);
      toast.success('Contato removido com sucesso!');
      carregarDados();
    } catch (error) {
      console.error('Erro ao remover contato:', error);
      toast.error('Erro ao remover contato');
    }
  };

  const handleDefinirPrincipal = async (contato: Contato) => {
    try {
      await contatosService.definirPrincipal(contato.id);
      toast.success('Contato definido como principal!');
      carregarDados();
    } catch (error) {
      console.error('Erro ao definir contato principal:', error);
      toast.error('Erro ao definir contato principal');
    }
  };

  const handleSuccess = () => {
    carregarDados();
  };

  // Cliente selecionado
  const clienteSelecionado = clientes.find((c) => c.id === clienteFiltro);

  // Estatísticas
  const totalContatos = contatosFiltrados.length;
  const contatosPrincipais = contatosFiltrados.filter((c) => c.principal).length;
  const contatosAtivos = contatosFiltrados.filter((c) => c.ativo).length;
  const contatosComEmail = contatosFiltrados.filter((c) => c.email).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* BackToNucleus Fixo no Topo */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-3">
          <BackToNucleus nucleusName="CRM" nucleusPath="/crm" />
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="px-6 py-6">
              <div className="flex flex-col sm:flex-row justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                    <Users className="h-8 w-8 mr-3 text-[#159A9C]" />
                    Contatos
                    {loading && (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#159A9C] ml-3"></div>
                    )}
                  </h1>
                  <p className="mt-2 text-[#B4BEC9]">
                    {loading
                      ? 'Carregando contatos...'
                      : clienteFiltro && clienteSelecionado
                        ? `${totalContatos} contatos de ${clienteSelecionado.nome}`
                        : `Gerencie seus ${totalContatos} contatos cadastrados`}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center gap-3">
                  <button
                    onClick={handleNovo}
                    className="bg-[#159A9C] hover:bg-[#0d7a7c] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Contato
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Cards (KPI Cards) */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                      Total de Contatos
                    </p>
                    <p className="mt-2 text-3xl font-bold text-[#002333]">{totalContatos}</p>
                    <p className="mt-3 text-sm text-[#002333]/70">
                      Base completa de contatos cadastrados no sistema.
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                    <Users className="h-6 w-6 text-[#159A9C]" />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                      Principais
                    </p>
                    <p className="mt-2 text-3xl font-bold text-[#002333]">{contatosPrincipais}</p>
                    <p className="mt-3 text-sm text-[#002333]/70">
                      Contatos definidos como principais dos clientes.
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center shadow-sm">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                      Ativos
                    </p>
                    <p className="mt-2 text-3xl font-bold text-[#002333]">{contatosAtivos}</p>
                    <p className="mt-3 text-sm text-[#002333]/70">
                      Contatos ativos e disponíveis para comunicação.
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center shadow-sm">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                      Com E-mail
                    </p>
                    <p className="mt-2 text-3xl font-bold text-[#002333]">{contatosComEmail}</p>
                    <p className="mt-3 text-sm text-[#002333]/70">
                      Contatos com e-mail cadastrado para comunicação.
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                    <Mail className="h-6 w-6 text-[#159A9C]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por Cliente (opcional)
                </label>
                <select
                  value={clienteFiltro}
                  onChange={(e) => setClienteFiltro(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent bg-white"
                >
                  <option value="">Todos os clientes</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome} {cliente.documento ? `- ${cliente.documento}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar Contatos
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, email, telefone, cargo, empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  />
                </div>
              </div>

              {contatosFiltrados.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modo de Visualização
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2.5 rounded-lg transition-colors border ${
                        viewMode === 'grid'
                          ? 'bg-[#159A9C] text-white border-[#159A9C]'
                          : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300'
                      }`}
                      title="Visualização em Grade"
                    >
                      <Grid3X3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2.5 rounded-lg transition-colors border ${
                        viewMode === 'list'
                          ? 'bg-[#159A9C] text-white border-[#159A9C]'
                          : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300'
                      }`}
                      title="Visualização em Lista"
                    >
                      <ListIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-lg shadow-sm border p-12">
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-[#159A9C] mb-4" />
                <p className="text-gray-600">Carregando contatos...</p>
              </div>
            </div>
          )}

          {/* Estado Vazio - Nenhum contato */}
          {!loading && contatosFiltrados.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-12">
              <div className="text-center">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm || clienteFiltro
                    ? 'Nenhum contato encontrado'
                    : 'Nenhum contato cadastrado'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || clienteFiltro
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece adicionando o primeiro contato'}
                </p>
                {!searchTerm && !clienteFiltro && (
                  <button
                    onClick={handleNovo}
                    className="px-4 py-2 bg-[#159A9C] hover:bg-[#0F7B7D] text-white rounded-lg transition-colors inline-flex items-center gap-2 text-sm font-medium shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Contato
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Lista de Contatos - Grid */}
          {!loading && viewMode === 'grid' && contatosFiltrados.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contatosFiltrados.map((contato) => (
                <div
                  key={contato.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#159A9C] to-[#0d7a7d] rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {contato.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          {contato.nome}
                          {contato.principal && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </h3>
                        {contato.cargo && <p className="text-sm text-gray-600">{contato.cargo}</p>}
                        {contato.cliente && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Building className="w-3 h-3" />
                            {contato.cliente.nome}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Menu */}
                    <div className="relative group">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <button
                          onClick={() => handleEditar(contato)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </button>
                        {!contato.principal && (
                          <button
                            onClick={() => handleDefinirPrincipal(contato)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Star className="w-4 h-4" />
                            Definir como Principal
                          </button>
                        )}
                        <button
                          onClick={() => handleRemover(contato)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Informações de Contato */}
                  <div className="space-y-2">
                    {contato.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{contato.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{contatosService.formatarTelefone(contato.telefone)}</span>
                    </div>
                  </div>

                  {/* Observações */}
                  {contato.observacoes && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500 line-clamp-2">{contato.observacoes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Lista de Contatos - Tabela */}
          {!loading && viewMode === 'list' && contatosFiltrados.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cargo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefone
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {contatosFiltrados.map((contato) => (
                    <tr key={contato.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#159A9C] to-[#0d7a7d] rounded-full flex items-center justify-center text-white font-bold">
                            {contato.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {contato.nome}
                              {contato.principal && (
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contato.cliente ? (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Building className="w-3 h-3" />
                            {contato.cliente.nome}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {contato.cargo || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {contato.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {contatosService.formatarTelefone(contato.telefone)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditar(contato)}
                            className="p-2 text-gray-600 hover:text-[#159A9C] hover:bg-gray-100 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {!contato.principal && (
                            <button
                              onClick={() => handleDefinirPrincipal(contato)}
                              className="p-2 text-gray-600 hover:text-yellow-500 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Definir como Principal"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleRemover(contato)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover"
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
          )}

          {/* Modal */}
          <ModalNovoContato
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              setContatoSelecionado(null);
            }}
            onSuccess={handleSuccess}
            contato={contatoSelecionado}
            clienteId={clienteFiltro}
          />
        </div>
      </div>
    </div>
  );
};

export default ContatosPage;
