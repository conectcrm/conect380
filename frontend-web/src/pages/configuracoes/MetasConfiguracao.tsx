import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Edit,
  Trash2,
  Calendar,
  User,
  MapPin,
  DollarSign,
  Save,
  X,
  TrendingUp,
  Users,
  Building2
} from 'lucide-react';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';

interface Meta {
  id: string;
  tipo: 'mensal' | 'trimestral' | 'anual';
  periodo: string;
  vendedor?: string;
  regiao?: string;
  valor: number;
  descricao: string;
  ativa: boolean;
  criadaEm: string;
}

interface FormularioMeta {
  tipo: 'mensal' | 'trimestral' | 'anual';
  periodo: string;
  vendedor: string;
  regiao: string;
  valor: string;
  descricao: string;
}

const MetasConfiguracao: React.FC = () => {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);

  const [formulario, setFormulario] = useState<FormularioMeta>({
    tipo: 'mensal',
    periodo: '',
    vendedor: 'Todos',
    regiao: 'Todas',
    valor: '',
    descricao: ''
  });

  // Carregar metas da API
  useEffect(() => {
    carregarMetas();
  }, []);

  const carregarMetas = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/metas');
      if (response.ok) {
        const data = await response.json();
        setMetas(data);
      } else {
        console.error('Erro ao carregar metas');
        // Fallback para dados mock em caso de erro
        const metasIniciais: Meta[] = [
          {
            id: '1',
            tipo: 'mensal',
            periodo: '2025-01',
            vendedor: 'Todos',
            regiao: 'Todas',
            valor: 450000,
            descricao: 'Meta geral mensal para toda equipe',
            ativa: true,
            criadaEm: '2025-01-01'
          },
          {
            id: '2',
            tipo: 'trimestral',
            periodo: '2025-Q1',
            vendedor: 'João Silva',
            regiao: 'São Paulo',
            valor: 300000,
            descricao: 'Meta específica para João Silva na região SP',
            ativa: true,
            criadaEm: '2025-01-01'
          }
        ];
        setMetas(metasIniciais);
      }
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dadosMeta = {
        tipo: formulario.tipo,
        periodo: formulario.periodo,
        vendedorId: formulario.vendedor === 'Todos' ? undefined : parseInt(formulario.vendedor),
        regiao: formulario.regiao === 'Todas' ? undefined : formulario.regiao,
        valor: parseFloat(formulario.valor.replace(/[^\d,]/g, '').replace(',', '.')),
        descricao: formulario.descricao
      };

      let response;

      if (editingMeta) {
        // Atualizar meta existente
        response = await fetch(`http://localhost:3001/metas/${editingMeta.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dadosMeta),
        });
      } else {
        // Criar nova meta
        response = await fetch('http://localhost:3001/metas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dadosMeta),
        });
      }

      if (response.ok) {
        const metaSalva = await response.json();

        // Converter a resposta da API para o formato do frontend
        const metaFormatada: Meta = {
          id: metaSalva.id.toString(),
          tipo: metaSalva.tipo,
          periodo: metaSalva.periodo,
          vendedor: metaSalva.vendedorId ? `Vendedor ${metaSalva.vendedorId}` : 'Todos',
          regiao: metaSalva.regiao || 'Todas',
          valor: metaSalva.valor,
          descricao: metaSalva.descricao,
          ativa: metaSalva.ativa,
          criadaEm: new Date(metaSalva.criadaEm).toISOString().split('T')[0]
        };

        if (editingMeta) {
          setMetas(prev => prev.map(meta => meta.id === editingMeta.id ? metaFormatada : meta));
        } else {
          setMetas(prev => [...prev, metaFormatada]);
        }

        resetForm();

        // Mostrar mensagem de sucesso
        console.log(editingMeta ? 'Meta atualizada com sucesso!' : 'Meta criada com sucesso!');
      } else {
        const errorData = await response.json();
        console.error('Erro ao salvar meta:', errorData);
        throw new Error(errorData.message || 'Erro ao salvar meta');
      }
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      alert(`Erro ao salvar meta: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormulario({
      tipo: 'mensal',
      periodo: '',
      vendedor: 'Todos',
      regiao: 'Todas',
      valor: '',
      descricao: ''
    });
    setShowForm(false);
    setEditingMeta(null);
  };

  const handleEdit = (meta: Meta) => {
    setEditingMeta(meta);
    setFormulario({
      tipo: meta.tipo,
      periodo: meta.periodo,
      vendedor: meta.vendedor || 'Todos',
      regiao: meta.regiao || 'Todas',
      valor: meta.valor.toLocaleString('pt-BR'),
      descricao: meta.descricao
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta meta?')) {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3001/metas/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setMetas(prev => prev.filter(meta => meta.id !== id));
          console.log('Meta excluída com sucesso!');
        } else {
          const errorData = await response.json();
          console.error('Erro ao excluir meta:', errorData);
          throw new Error(errorData.message || 'Erro ao excluir meta');
        }
      } catch (error) {
        console.error('Erro ao excluir meta:', error);
        alert(`Erro ao excluir meta: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatarPeriodo = (tipo: string, periodo: string) => {
    switch (tipo) {
      case 'mensal':
        const [ano, mes] = periodo.split('-');
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${meses[parseInt(mes) - 1]} ${ano}`;
      case 'trimestral':
        return periodo.replace('Q', 'T');
      case 'anual':
        return periodo;
      default:
        return periodo;
    }
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus
          nucleusName="Configurações"
          nucleusPath="/nuclei/configuracoes"
          currentModuleName="Metas Comerciais"
        />
      </div>

      <div className="p-6">
        {/* Header da página */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Configuração de Metas</h2>
            <p className="text-gray-600 mt-1">
              Defina metas de vendas por período, vendedor ou região para acompanhar performance
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Meta
          </button>
        </div>

        {/* Lista de Metas */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Metas Configuradas
            </h3>
          </div>

          <div className="divide-y">
            {metas.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Nenhuma meta configurada</p>
                <p>Crie sua primeira meta para começar o acompanhamento</p>
              </div>
            ) : (
              metas.map((meta) => (
                <div key={meta.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.tipo === 'mensal' ? 'bg-blue-100 text-blue-800' :
                          meta.tipo === 'trimestral' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                          {meta.tipo}
                        </span>

                        <span className="text-lg font-semibold text-gray-900">
                          {formatarValor(meta.valor)}
                        </span>

                        <span className="text-sm text-gray-500">
                          {formatarPeriodo(meta.tipo, meta.periodo)}
                        </span>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        {meta.vendedor && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {meta.vendedor}
                          </div>
                        )}

                        {meta.regiao && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {meta.regiao}
                          </div>
                        )}

                        {!meta.vendedor && !meta.regiao && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Building2 className="w-4 h-4" />
                            Meta Geral
                          </div>
                        )}
                      </div>

                      {meta.descricao && (
                        <p className="text-sm text-gray-600 mt-2">{meta.descricao}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(meta)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Editar meta"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(meta.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Excluir meta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Formulário de Nova Meta */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingMeta ? 'Editar Meta' : 'Nova Meta'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tipo de Meta */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Meta
                    </label>
                    <select
                      value={formulario.tipo}
                      onChange={(e) => setFormulario(prev => ({ ...prev, tipo: e.target.value as 'mensal' | 'trimestral' | 'anual' }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="mensal">Mensal</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>

                  {/* Período */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Período
                    </label>
                    <input
                      type={formulario.tipo === 'mensal' ? 'month' : 'text'}
                      value={formulario.periodo}
                      onChange={(e) => setFormulario(prev => ({ ...prev, periodo: e.target.value }))}
                      placeholder={
                        formulario.tipo === 'trimestral' ? 'Ex: 2025-Q1' :
                          formulario.tipo === 'anual' ? 'Ex: 2025' : ''
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Vendedor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendedor
                    </label>
                    <select
                      value={formulario.vendedor}
                      onChange={(e) => setFormulario(prev => ({ ...prev, vendedor: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Todos">Todos os vendedores</option>
                      <option value="João Silva">João Silva</option>
                      <option value="Maria Santos">Maria Santos</option>
                      <option value="Carlos Oliveira">Carlos Oliveira</option>
                    </select>
                  </div>

                  {/* Região */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Região
                    </label>
                    <select
                      value={formulario.regiao}
                      onChange={(e) => setFormulario(prev => ({ ...prev, regiao: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Todas">Todas as regiões</option>
                      <option value="São Paulo">São Paulo</option>
                      <option value="Rio de Janeiro">Rio de Janeiro</option>
                      <option value="Minas Gerais">Minas Gerais</option>
                      <option value="Sul">Região Sul</option>
                      <option value="Norte">Região Norte</option>
                    </select>
                  </div>
                </div>

                {/* Valor da Meta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor da Meta
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={formulario.valor}
                      onChange={(e) => {
                        const valor = e.target.value.replace(/\D/g, '');
                        const formatado = new Intl.NumberFormat('pt-BR').format(parseInt(valor) || 0);
                        setFormulario(prev => ({ ...prev, valor: formatado }));
                      }}
                      placeholder="450.000"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição (Opcional)
                  </label>
                  <textarea
                    value={formulario.descricao}
                    onChange={(e) => setFormulario(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Descreva o objetivo desta meta..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Botões */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Salvando...' : editingMeta ? 'Atualizar' : 'Criar Meta'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Metas</p>
                <p className="text-2xl font-bold text-gray-900">{metas.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Metas Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{metas.filter(m => m.ativa).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatarValor(metas.reduce((acc, meta) => acc + meta.valor, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetasConfiguracao;
