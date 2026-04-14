import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  User,
  Plus,
  Search,
  Phone,
  Mail,
  Building,
  Star,
  Edit,
  Trash2,
  Grid3X3,
  List as ListIcon,
  MoreVertical,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import ModalNovoContato from '../../components/contatos/ModalNovoContato';
import { contatosService, Contato } from '../../services/contatosService';
import { clientesService, Cliente } from '../../services/clientesService';
import { useGlobalConfirmation } from '../../contexts/GlobalConfirmationContext';
import {
  EmptyState,
  FiltersBar,
  LoadingSkeleton,
  PageHeader,
  DataTableCard,
  SectionCard,
} from '../../components/layout-v2';

const ContatosPage: React.FC = () => {
  const { confirm } = useGlobalConfirmation();
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [contatosFiltrados, setContatosFiltrados] = useState<Contato[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clienteFiltro, setClienteFiltro] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showModal, setShowModal] = useState(false);
  const [contatoSelecionado, setContatoSelecionado] = useState<Contato | null>(null);

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
      setError(null);
      // Carregar tudo em paralelo
      const [contatosData, clientesData] = await Promise.all([
        contatosService.listarTodos(),
        clientesService.getClientes({ limit: 1000 }),
      ]);

      setContatos(contatosData);
      setClientes(clientesData.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Nao foi possivel carregar os contatos.');
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
    if (!(await confirm(`Deseja realmente remover o contato ${contato.nome}?`))) {
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

  // Indicadores operacionais
  const totalContatos = contatosFiltrados.length;
  const contatosPrincipais = contatosFiltrados.filter((c) => c.principal).length;
  const contatosComEmailValido = contatosFiltrados.filter((c) => Boolean(c.email?.trim())).length;
  const contatosVinculadosCliente = contatosFiltrados.filter((c) =>
    Boolean(c.clienteId || c.cliente?.id),
  ).length;
  const contatosSemEmail = totalContatos - contatosComEmailValido;
  const contatosSemCliente = totalContatos - contatosVinculadosCliente;
  const contatosComPendencia = contatosFiltrados.filter(
    (c) => !c.email?.trim() || !(c.clienteId || c.cliente?.id),
  ).length;
  const contatosProntosAbordagem = contatosFiltrados.filter(
    (c) => c.ativo && Boolean(c.email?.trim()) && Boolean(c.clienteId || c.cliente?.id),
  ).length;
  const qualidadeCadastroPercentual =
    totalContatos > 0 ? Math.round(((totalContatos - contatosComPendencia) / totalContatos) * 100) : 0;
  const pageDescription =
    'Foque em contatos prioritarios, base pronta para abordagem e pendencias que bloqueiam a acao comercial.';

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-[18px] border-[#CBDAE2] bg-gradient-to-br from-white via-white to-[#F4FAFF] p-5 shadow-[0_24px_46px_-34px_rgba(16,57,74,0.38)]">
        <PageHeader
          eyebrow={
            <span className="inline-flex items-center rounded-full border border-[#BFD9E2] bg-[#EFF8FB] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#3F6A7C]">
              Nucleo Comercial
            </span>
          }
          title={
            <span className="text-[27px] font-bold leading-[1.03] tracking-[-0.018em] text-[#002333] sm:text-[28px]">
              Contatos
            </span>
          }
          titleClassName="leading-none sm:inline-flex sm:items-center"
          description={pageDescription}
          descriptionClassName="max-w-[74ch] text-[12px] leading-[1.4] text-[#5B7A89] sm:border-l sm:border-[#D7E5EC] sm:pl-3 sm:text-[13px]"
          inlineDescriptionOnDesktop
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={carregarDados}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button
                onClick={handleNovo}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition hover:bg-[#117C7E]"
              >
                <Plus className="h-4 w-4" />
                Novo contato
              </button>
            </div>
          }
        />

        <section className="space-y-3 rounded-2xl border border-[#D4E1E8] bg-white/95 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5F7B89]">
              Resumo essencial:
            </span>
            <span className="inline-flex items-center rounded-full border border-[#D7E6EC] bg-[#F5FAFC] px-2.5 py-1 text-xs font-semibold text-[#345362]">
              Base: {loading ? '--' : totalContatos}
            </span>
            <span className="inline-flex items-center rounded-full border border-[#BFE8E9] bg-[#EEFBFB] px-2.5 py-1 text-xs font-semibold text-[#0F7B7D]">
              Prioritarios: {loading ? '--' : contatosPrincipais}
            </span>
            <span className="inline-flex items-center rounded-full border border-[#BEE6CF] bg-[#F1FBF5] px-2.5 py-1 text-xs font-semibold text-[#137A42]">
              Prontos para abordagem: {loading ? '--' : contatosProntosAbordagem}
            </span>
            <span className="inline-flex items-center rounded-full border border-[#F4C7CF] bg-[#FFF4F6] px-2.5 py-1 text-xs font-semibold text-[#B4233A]">
              Pendencias cadastrais: {loading ? '--' : contatosComPendencia}
            </span>
          </div>

          <div className="rounded-xl border border-[#D7E6EC] bg-[#F9FCFE] px-3 py-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[#5F7B89]">
              <span>Qualidade de cadastro para acao comercial</span>
              <span>{loading ? '--' : `${qualidadeCadastroPercentual}%`}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#DDEBF0]">
              <div
                className="h-full rounded-full bg-[#1E66B4] transition-all"
                style={{ width: `${qualidadeCadastroPercentual}%` }}
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#5B7A89]">
              <span>Sem e-mail: {loading ? '--' : contatosSemEmail}</span>
              <span>•</span>
              <span>Sem cliente vinculado: {loading ? '--' : contatosSemCliente}</span>
            </div>
          </div>
        </section>

        <FiltersBar className="space-y-4 rounded-2xl border border-[#D4E1E8] bg-gradient-to-br from-[#F7FBFD] to-[#F1F7FA] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
          <div className="flex w-full flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_280px_auto]">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#385A6A]">Buscar contatos</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A95A3]" />
                  <input
                    type="text"
                    placeholder="Nome, e-mail, telefone, cargo ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white pl-10 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#385A6A]">Cliente</label>
                <select
                  value={clienteFiltro}
                  onChange={(e) => setClienteFiltro(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                >
                  <option value="">Todos os clientes</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome} {cliente.documento ? `- ${cliente.documento}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-lg transition-colors border ${
                    viewMode === 'grid'
                      ? 'bg-[#159A9C] text-white border-[#159A9C]'
                      : 'bg-white text-[#486572] hover:bg-[#F4FAFC] border-[#D1E1E8]'
                  }`}
                  title="Visualizacao em grade"
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-lg transition-colors border ${
                    viewMode === 'list'
                      ? 'bg-[#159A9C] text-white border-[#159A9C]'
                      : 'bg-white text-[#486572] hover:bg-[#F4FAFC] border-[#D1E1E8]'
                  }`}
                  title="Visualizacao em lista"
                >
                  <ListIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setClienteFiltro('');
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB]"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>
        </FiltersBar>
      </SectionCard>

      {loading && <LoadingSkeleton lines={6} />}

      {!loading && error && (
        <EmptyState
          icon={<AlertTriangle className="w-5 h-5" />}
          title="Erro ao carregar contatos"
          description={error}
          action={
            <button
              onClick={carregarDados}
              className="px-4 py-2 bg-[#159A9C] hover:bg-[#0F7B7D] text-white rounded-lg transition-colors inline-flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
          }
        />
      )}

      {!loading && !error && contatosFiltrados.length === 0 && (
        <EmptyState
          icon={<User className="w-5 h-5" />}
          title={
            searchTerm || clienteFiltro ? 'Nenhum contato encontrado' : 'Nenhum contato cadastrado'
          }
          description={
            searchTerm || clienteFiltro
              ? 'Tente ajustar os filtros de busca.'
              : 'Comece adicionando o primeiro contato.'
          }
          action={
            !searchTerm && !clienteFiltro ? (
              <button
                onClick={handleNovo}
                className="px-4 py-2 bg-[#159A9C] hover:bg-[#0F7B7D] text-white rounded-lg transition-colors inline-flex items-center gap-2 text-sm font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Novo Contato
              </button>
            ) : undefined
          }
        />
      )}

      {/* Lista de Contatos - Grid */}
      {!loading && !error && viewMode === 'grid' && contatosFiltrados.length > 0 && (
        <DataTableCard className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {contatosFiltrados.map((contato) => (
              <div
                key={contato.id}
                className="bg-white border border-[#DCE7EB] rounded-2xl p-5 hover:shadow-[0_14px_26px_-20px_rgba(16,57,74,0.35)] transition-shadow"
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
        </DataTableCard>
      )}

      {/* Lista de Contatos - Tabela */}
      {!loading && !error && viewMode === 'list' && contatosFiltrados.length > 0 && (
        <DataTableCard>
          <div className="bg-white border border-[#DCE7EB] rounded-[18px] overflow-hidden">
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
                    Acoes
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
        </DataTableCard>
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
  );
};

export default ContatosPage;

