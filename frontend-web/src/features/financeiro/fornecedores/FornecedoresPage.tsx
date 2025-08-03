import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit3, Trash2, Building2, Phone, Mail, MapPin, Filter, Download, MoreVertical, FileSpreadsheet, Eye } from 'lucide-react';
import { fornecedorService, Fornecedor, NovoFornecedor } from '../../../services/fornecedorService';
import ModalFornecedor from '../components/ModalFornecedor';
import ModalDetalhesFornecedor from '../components/ModalDetalhesFornecedor';
import { BackToNucleus } from '../../../components/navigation/BackToNucleus';
import { exportToCSV, exportToExcel, formatDateForExport, formatStatusForExport, ExportColumn } from '../../../utils/exportUtils';

interface DashboardCards {
  totalFornecedores: number;
  fornecedoresAtivos: number;
  fornecedoresInativos: number;
  fornecedoresCadastradosHoje: number;
}

export default function FornecedoresPage() {
  const navigate = useNavigate();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [fornecedorEdicao, setFornecedorEdicao] = useState<Fornecedor | null>(null);
  const [fornecedorDetalhes, setFornecedorDetalhes] = useState<Fornecedor | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  // Estados para seleção múltipla
  const [fornecedoresSelecionados, setFornecedoresSelecionados] = useState<string[]>([]);
  const [mostrarAcoesMassa, setMostrarAcoesMassa] = useState(false);

  const [dashboardCards, setDashboardCards] = useState<DashboardCards>({
    totalFornecedores: 0,
    fornecedoresAtivos: 0,
    fornecedoresInativos: 0,
    fornecedoresCadastradosHoje: 0
  });

  useEffect(() => {
    carregarFornecedores();
  }, [filtroStatus]);

  const carregarFornecedores = async () => {
    try {
      setCarregando(true);
      const filtros = {
        busca: busca.trim(),
        ativo: filtroStatus === 'todos' ? undefined : filtroStatus === 'ativo'
      };

      const dados = await fornecedorService.listarFornecedores(filtros);
      setFornecedores(dados);

      // Calcular estatísticas para o dashboard
      const total = dados.length;
      const ativos = dados.filter(f => f.ativo).length;
      const inativos = total - ativos;
      const hoje = new Date().toDateString();
      const cadastradosHoje = dados.filter(f =>
        new Date(f.criadoEm).toDateString() === hoje
      ).length;

      setDashboardCards({
        totalFornecedores: total,
        fornecedoresAtivos: ativos,
        fornecedoresInativos: inativos,
        fornecedoresCadastradosHoje: cadastradosHoje
      });
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    } finally {
      setCarregando(false);
    }
  };

  const buscarFornecedores = async () => {
    if (busca.trim() === '') {
      carregarFornecedores();
      return;
    }

    try {
      setCarregando(true);
      const filtros = {
        busca: busca.trim(),
        ativo: filtroStatus === 'todos' ? undefined : filtroStatus === 'ativo'
      };

      const dados = await fornecedorService.listarFornecedores(filtros);
      setFornecedores(dados);
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
    } finally {
      setCarregando(false);
    }
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      buscarFornecedores();
    }
  };

  const abrirModalEdicao = (fornecedor: Fornecedor) => {
    setFornecedorEdicao(fornecedor);
    setModalAberto(true);
  };

  const abrirModalCriacao = () => {
    setFornecedorEdicao(null);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setFornecedorEdicao(null);
  };

  const abrirModalDetalhes = (fornecedor: Fornecedor) => {
    setFornecedorDetalhes(fornecedor);
    setModalDetalhesAberto(true);
  };

  const fecharModalDetalhes = () => {
    setModalDetalhesAberto(false);
    setFornecedorDetalhes(null);
  };

  const handleSalvarFornecedor = async (dadosFornecedor: NovoFornecedor | Partial<NovoFornecedor>) => {
    try {
      if (fornecedorEdicao) {
        await fornecedorService.atualizarFornecedor(fornecedorEdicao.id, dadosFornecedor);
      } else {
        await fornecedorService.criarFornecedor(dadosFornecedor as NovoFornecedor);
      }

      fecharModal();
      carregarFornecedores();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
    }
  };

  const excluirFornecedor = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      return;
    }

    try {
      await fornecedorService.excluirFornecedor(id);
      carregarFornecedores();
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
    }
  };

  const formatarCNPJCPF = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length === 11) {
      // CPF
      return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (numeros.length === 14) {
      // CNPJ
      return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return valor;
  };

  // Funções de exportação
  const exportarParaCSV = () => {
    const columns: ExportColumn[] = [
      { key: 'nome', label: 'Nome' },
      { key: 'cnpjCpf', label: 'CNPJ/CPF', format: formatarCNPJCPF },
      { key: 'email', label: 'E-mail' },
      { key: 'telefone', label: 'Telefone' },
      { key: 'endereco', label: 'Endereço' },
      { key: 'cidade', label: 'Cidade' },
      { key: 'estado', label: 'Estado' },
      { key: 'cep', label: 'CEP' },
      { key: 'contato', label: 'Contato' },
      { key: 'cargo', label: 'Cargo' },
      { key: 'ativo', label: 'Status', format: formatStatusForExport },
      { key: 'criadoEm', label: 'Data de Cadastro', format: formatDateForExport }
    ];

    const filename = `fornecedores_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(fornecedores, columns, filename);
  };

  const exportarParaExcel = () => {
    const columns: ExportColumn[] = [
      { key: 'nome', label: 'Nome' },
      { key: 'cnpjCpf', label: 'CNPJ/CPF', format: formatarCNPJCPF },
      { key: 'email', label: 'E-mail' },
      { key: 'telefone', label: 'Telefone' },
      { key: 'endereco', label: 'Endereço' },
      { key: 'cidade', label: 'Cidade' },
      { key: 'estado', label: 'Estado' },
      { key: 'cep', label: 'CEP' },
      { key: 'contato', label: 'Contato' },
      { key: 'cargo', label: 'Cargo' },
      { key: 'ativo', label: 'Status', format: formatStatusForExport },
      { key: 'criadoEm', label: 'Data de Cadastro', format: formatDateForExport }
    ];

    const filename = `fornecedores_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportToExcel(fornecedores, columns, filename, 'Fornecedores');
  };

  // Funções de seleção múltipla
  const toggleSelecionarFornecedor = (fornecedorId: string) => {
    setFornecedoresSelecionados(prev => {
      const novaSelecao = prev.includes(fornecedorId)
        ? prev.filter(id => id !== fornecedorId)
        : [...prev, fornecedorId];

      setMostrarAcoesMassa(novaSelecao.length > 0);
      return novaSelecao;
    });
  };

  const selecionarTodos = () => {
    const todosIds = fornecedores.map(f => f.id);
    setFornecedoresSelecionados(todosIds);
    setMostrarAcoesMassa(todosIds.length > 0);
  };

  const deselecionarTodos = () => {
    setFornecedoresSelecionados([]);
    setMostrarAcoesMassa(false);
  };

  const ativarSelecionados = async () => {
    if (!window.confirm(`Tem certeza que deseja ativar ${fornecedoresSelecionados.length} fornecedor(es)?`)) {
      return;
    }

    try {
      for (const id of fornecedoresSelecionados) {
        await fornecedorService.atualizarFornecedor(id, { ativo: true });
      }

      deselecionarTodos();
      carregarFornecedores();
    } catch (error) {
      console.error('Erro ao ativar fornecedores:', error);
    }
  };

  const desativarSelecionados = async () => {
    if (!window.confirm(`Tem certeza que deseja desativar ${fornecedoresSelecionados.length} fornecedor(es)?`)) {
      return;
    }

    try {
      for (const id of fornecedoresSelecionados) {
        await fornecedorService.atualizarFornecedor(id, { ativo: false });
      }

      deselecionarTodos();
      carregarFornecedores();
    } catch (error) {
      console.error('Erro ao desativar fornecedores:', error);
    }
  };

  const excluirSelecionados = async () => {
    if (!window.confirm(`Tem certeza que deseja excluir ${fornecedoresSelecionados.length} fornecedor(es)? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      for (const id of fornecedoresSelecionados) {
        await fornecedorService.excluirFornecedor(id);
      }

      deselecionarTodos();
      carregarFornecedores();
    } catch (error) {
      console.error('Erro ao excluir fornecedores:', error);
    }
  };

  const exportarSelecionados = () => {
    const fornecedoresFiltrados = fornecedores.filter(f => fornecedoresSelecionados.includes(f.id));

    const columns: ExportColumn[] = [
      { key: 'nome', label: 'Nome' },
      { key: 'cnpjCpf', label: 'CNPJ/CPF', format: formatarCNPJCPF },
      { key: 'email', label: 'E-mail' },
      { key: 'telefone', label: 'Telefone' },
      { key: 'endereco', label: 'Endereço' },
      { key: 'cidade', label: 'Cidade' },
      { key: 'estado', label: 'Estado' },
      { key: 'cep', label: 'CEP' },
      { key: 'contato', label: 'Contato' },
      { key: 'cargo', label: 'Cargo' },
      { key: 'ativo', label: 'Status', format: formatStatusForExport },
      { key: 'criadoEm', label: 'Data de Cadastro', format: formatDateForExport }
    ];

    const filename = `fornecedores_selecionados_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportToExcel(fornecedoresFiltrados, columns, filename, 'Fornecedores Selecionados');
  };

  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length === 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (numeros.length === 11) {
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return valor;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus
          nucleusName="Financeiro"
          nucleusPath="/nuclei/financeiro"
          currentModuleName="Fornecedores"
        />
      </div>

      <div className="p-6 space-y-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
            <p className="text-gray-600">Gerencie seus fornecedores e parceiros comerciais</p>
          </div>
          <button
            onClick={abrirModalCriacao}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Fornecedor
          </button>
        </div>

        {/* Cards de Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Fornecedores</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardCards.totalFornecedores}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fornecedores Ativos</p>
                <p className="text-2xl font-bold text-green-600">{dashboardCards.fornecedoresAtivos}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fornecedores Inativos</p>
                <p className="text-2xl font-bold text-red-600">{dashboardCards.fornecedoresInativos}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Building2 className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cadastrados Hoje</p>
                <p className="text-2xl font-bold text-purple-600">{dashboardCards.fornecedoresCadastradosHoje}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Plus className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por nome, CNPJ/CPF, email..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  onKeyPress={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value as 'todos' | 'ativo' | 'inativo')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
              </select>

              <button
                onClick={buscarFornecedores}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Buscar
              </button>

              {/* Botões de Exportação */}
              <div className="relative">
                <div className="flex gap-1">
                  <button
                    onClick={exportarParaCSV}
                    disabled={fornecedores.length === 0}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Exportar para CSV"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>

                  <button
                    onClick={exportarParaExcel}
                    disabled={fornecedores.length === 0}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Exportar para Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Ações em Massa */}
        {mostrarAcoesMassa && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-900">
                  {fornecedoresSelecionados.length} fornecedor(es) selecionado(s)
                </span>
                <button
                  onClick={deselecionarTodos}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Desmarcar todos
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={ativarSelecionados}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Ativar
                </button>
                <button
                  onClick={desativarSelecionados}
                  className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                >
                  Desativar
                </button>
                <button
                  onClick={exportarSelecionados}
                  className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700"
                >
                  Exportar
                </button>
                <button
                  onClick={excluirSelecionados}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Fornecedores */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Lista de Fornecedores</h2>
          </div>

          {carregando ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando fornecedores...</p>
            </div>
          ) : fornecedores.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum fornecedor encontrado</h3>
              <p className="text-gray-600 mb-4">
                {busca || filtroStatus !== 'todos'
                  ? 'Tente ajustar os filtros ou criar um novo fornecedor.'
                  : 'Comece criando seu primeiro fornecedor.'
                }
              </p>
              <button
                onClick={abrirModalCriacao}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Criar Primeiro Fornecedor
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={fornecedoresSelecionados.length === fornecedores.length && fornecedores.length > 0}
                        onChange={(e) => e.target.checked ? selecionarTodos() : deselecionarTodos()}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fornecedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CNPJ/CPF
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localização
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
                  {fornecedores.map((fornecedor) => (
                    <tr key={fornecedor.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={fornecedoresSelecionados.includes(fornecedor.id)}
                          onChange={() => toggleSelecionarFornecedor(fornecedor.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {fornecedor.nome}
                          </div>
                          {fornecedor.contato && (
                            <div className="text-sm text-gray-500">
                              {fornecedor.contato} {fornecedor.cargo && `- ${fornecedor.cargo}`}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatarCNPJCPF(fornecedor.cnpjCpf)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {fornecedor.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-3 h-3 mr-1" />
                              {fornecedor.email}
                            </div>
                          )}
                          {fornecedor.telefone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-3 h-3 mr-1" />
                              {formatarTelefone(fornecedor.telefone)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {fornecedor.cidade && fornecedor.estado ? (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-3 h-3 mr-1" />
                            {fornecedor.cidade}, {fornecedor.estado}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${fornecedor.ativo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(fornecedor.criadoEm).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => abrirModalDetalhes(fornecedor)}
                            className="text-gray-600 hover:text-gray-800 p-1 rounded"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => abrirModalEdicao(fornecedor)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded"
                            title="Editar fornecedor"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => excluirFornecedor(fornecedor.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded"
                            title="Excluir fornecedor"
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
        </div>

        {/* Modal de Fornecedor */}
        {modalAberto && (
          <ModalFornecedor
            isOpen={modalAberto}
            onClose={fecharModal}
            onSave={handleSalvarFornecedor}
            fornecedor={fornecedorEdicao}
          />
        )}

        {/* Modal de Detalhes do Fornecedor */}
        {modalDetalhesAberto && fornecedorDetalhes && (
          <ModalDetalhesFornecedor
            isOpen={modalDetalhesAberto}
            onClose={fecharModalDetalhes}
            fornecedor={fornecedorDetalhes}
            onEdit={abrirModalEdicao}
          />
        )}
      </div>
    </div>
  );
}
