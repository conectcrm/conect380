import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  DollarSign,
  Building,
  X,
  Save,
  Upload,
  FileText,
  Paperclip
} from 'lucide-react';
import { BackToNucleus } from '../../../components/navigation/BackToNucleus';

// TODO: Importar tipos específicos da entidade
interface MinhaEntidade {
  id: string;
  nome: string;
  valor: number;
  status: string;
  dataVencimento: string;
  // ... outros campos
}

interface FiltrosEntidade {
  dataInicio?: string;
  dataFim?: string;
  status?: string[];
  valorMin?: number;
  valorMax?: number;
}

interface ResumoEntidade {
  total: number;
  quantidade: number;
  totalMes: number;
  quantidadeMes: number;
  totalAtrasado: number;
  quantidadeAtrasado: number;
  totalPago: number;
  quantidadePago: number;
}

// TODO: Renomear componente
const TemplatePage: React.FC = () => {
  // Estados principais
  const [dados, setDados] = useState<MinhaEntidade[]>([]);
  const [itemSelecionado, setItemSelecionado] = useState<MinhaEntidade | null>(null);
  const [resumo, setResumo] = useState<ResumoEntidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados dos modais
  const [modalAberto, setModalAberto] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Estados de filtros e busca
  const [filtros, setFiltros] = useState<FiltrosEntidade>({});
  const [termoBusca, setTermoBusca] = useState('');
  const [itensSelecionados, setItensSelecionados] = useState<string[]>([]);

  // Carregamento inicial dos dados
  useEffect(() => {
    carregarDados();
  }, [filtros]);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Implementar chamada à API
      const mockDados: MinhaEntidade[] = [
        {
          id: '1',
          nome: 'Item Exemplo',
          valor: 1500.00,
          status: 'ativo',
          dataVencimento: '2024-01-15'
        }
      ];

      const mockResumo: ResumoEntidade = {
        total: 45230.80,
        quantidade: 28,
        totalMes: 38920.50,
        quantidadeMes: 22,
        totalAtrasado: 12450.00,
        quantidadeAtrasado: 5,
        totalPago: 33470.30,
        quantidadePago: 17
      };

      setDados(mockDados);
      setResumo(mockResumo);
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  // Funções de manipulação
  const handleNovo = () => {
    setItemSelecionado(null);
    setModalAberto(true);
  };

  const handleEditar = (item: MinhaEntidade) => {
    setItemSelecionado(item);
    setModalAberto(true);
  };

  const handleExcluir = async (itemId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      try {
        // TODO: Implementar chamada à API de exclusão
        setDados(dados.filter(item => item.id !== itemId));
      } catch (err) {
        console.error('Erro ao excluir item:', err);
      }
    }
  };

  const handleAcaoMassa = async (acao: string) => {
    if (itensSelecionados.length === 0) {
      alert('Selecione pelo menos um item');
      return;
    }
    // TODO: Implementar ações em massa
    console.log('Ação em massa:', acao, itensSelecionados);
  };

  const handleSalvar = (dados: any) => {
    console.log('Salvar dados:', dados);
    setModalAberto(false);
    carregarDados();
  };

  // Filtros e busca
  const dadosFiltrados = useMemo(() => {
    return dados.filter(item => {
      if (termoBusca) {
        const termo = termoBusca.toLowerCase();
        return (
          item.nome.toLowerCase().includes(termo) ||
          item.id.toLowerCase().includes(termo)
        );
      }
      return true;
    });
  }, [dados, termoBusca]);

  // Funções de formatação
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800';
      case 'inativo':
        return 'bg-gray-100 text-gray-800';
      case 'pendente':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Estados de loading e erro
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-2">{error}</div>
        <button 
          onClick={carregarDados}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Navegação de volta ao núcleo */}
      <BackToNucleus 
        nucleusPath="/nuclei/SEU_NUCLEO"
        nucleusName="Seu Núcleo"
      />

      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Título da Página</h1>
            <p className="text-gray-600 mt-1">Descrição da funcionalidade</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter size={20} />
              Filtros
            </button>
            <button
              onClick={handleNovo}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Novo Item
            </button>
          </div>
        </div>

        {/* Cards de resumo - OBRIGATÓRIO */}
        {resumo && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Atual</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatarMoeda(resumo.total)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {resumo.quantidade} item(s)
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total do Mês</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatarMoeda(resumo.totalMes)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {resumo.quantidadeMes} item(s)
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Em Atraso</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatarMoeda(resumo.totalAtrasado)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {resumo.quantidadeAtrasado} item(s)
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Processados</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatarMoeda(resumo.totalPago)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {resumo.quantidadePago} item(s)
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TODO: Implementar componente de filtros avançados */}
        {mostrarFiltros && (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filtros Avançados</h3>
              <button
                onClick={() => setMostrarFiltros(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-500">
              TODO: Implementar componente FiltrosAvancados
            </p>
          </div>
        )}
      </div>

      {/* Barra de pesquisa e ações */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nome, código..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {itensSelecionados.length > 0 && (
              <>
                <button
                  onClick={() => handleAcaoMassa('ativar')}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Ativar Selecionados
                </button>
                <button
                  onClick={() => handleAcaoMassa('excluir')}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Excluir Selecionados
                </button>
              </>
            )}
            <button className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">
              <Download size={16} />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de dados */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setItensSelecionados(dados.map(item => item.id));
                      } else {
                        setItensSelecionados([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dadosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="text-gray-500 text-lg mb-4">Nenhum registro encontrado</div>
                    <button
                      onClick={handleNovo}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Criar Primeiro Item
                    </button>
                  </td>
                </tr>
              ) : (
                dadosFiltrados.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={itensSelecionados.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setItensSelecionados([...itensSelecionados, item.id]);
                          } else {
                            setItensSelecionados(itensSelecionados.filter(id => id !== item.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.nome}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatarMoeda(item.valor)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatarData(item.dataVencimento)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditar(item)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleExcluir(item.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - TODO: Implementar modal profissional */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {itemSelecionado ? 'Editar Item' : 'Novo Item'}
              </h2>
              <button
                onClick={() => setModalAberto(false)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">
                TODO: Implementar formulário completo com wizard se necessário
              </p>
              
              {/* Template básico de formulário com formatação monetária */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Digite o nome"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0,00"
                      // TODO: Implementar handleMoneyChange e formatarMoedaInput
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setModalAberto(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSalvar({})}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatePage;
