import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Target,
  ChevronDown,
  ChevronUp,
  Users,
  Building2,
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { KPICard } from '../../../../components/common/KPICard';
import nucleoService, {
  Nucleo,
  CreateNucleoDto,
  TipoDistribuicao,
} from '../../../../services/nucleoService';
import { departamentoService } from '../../../../services/departamentoService';
import ModalGerenciarAgentesNucleo from '../../../../components/atendimento/ModalGerenciarAgentesNucleo';
import { ModalGerenciarDepartamentos } from '../../../../components/atendimento/ModalGerenciarDepartamentos';
import { ModalDepartamento } from '../../../../components/atendimento/ModalDepartamento';
import { useGlobalConfirmation } from '../../../../contexts/GlobalConfirmationContext';

interface NucleoExpanded extends Nucleo {
  departamentos?: any[];
  atendentes?: any[];
}

export const NucleosTab: React.FC = () => {
  const { confirm } = useGlobalConfirmation();
  const [nucleos, setNucleos] = useState<NucleoExpanded[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingNucleo, setEditingNucleo] = useState<Nucleo | null>(null);
  const [expandedNucleos, setExpandedNucleos] = useState<Set<string>>(new Set());

  // Modal de gerenciar agentes
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedNucleoForAgents, setSelectedNucleoForAgents] = useState<Nucleo | null>(null);

  // Modal de gerenciar departamentos
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [selectedNucleoForDepts, setSelectedNucleoForDepts] = useState<Nucleo | null>(null);

  // Modal de criar/editar departamento individual
  const [showDeptFormModal, setShowDeptFormModal] = useState(false);
  const [editingDepartamento, setEditingDepartamento] = useState<any | null>(null);
  const [selectedNucleoForDeptForm, setSelectedNucleoForDeptForm] = useState<Nucleo | null>(null);

  const [formData, setFormData] = useState<CreateNucleoDto>({
    nome: '',
    descricao: '',
    codigo: '',
    cor: '#159A9C',
    tipoDistribuicao: 'manual' as TipoDistribuicao,
    prioridade: 1,
    ativo: true,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    carregarNucleos();
  }, []);

  const carregarNucleos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await nucleoService.listar();

      // Carregar departamentos de cada núcleo
      const nucleosComDepts = await Promise.all(
        data.map(async (nucleo) => {
          try {
            const departamentos = await departamentoService.listarPorNucleo(nucleo.id);
            return { ...nucleo, departamentos };
          } catch (error) {
            console.error(`Erro ao carregar departamentos do núcleo ${nucleo.id}:`, error);
            return { ...nucleo, departamentos: [] };
          }
        }),
      );

      setNucleos(nucleosComDepts);
    } catch (err: unknown) {
      console.error('Erro ao carregar núcleos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar núcleos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNucleo) {
        await nucleoService.atualizar(editingNucleo.id, formData);
      } else {
        await nucleoService.criar(formData);
      }
      setShowDialog(false);
      resetForm();
      carregarNucleos();
    } catch (err: unknown) {
      console.error('Erro ao salvar núcleo:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar núcleo');
    }
  };

  const handleEdit = (nucleo: Nucleo) => {
    setEditingNucleo(nucleo);
    setFormData({
      nome: nucleo.nome,
      descricao: nucleo.descricao || '',
      codigo: nucleo.codigo,
      cor: nucleo.cor || '#159A9C',
      tipoDistribuicao: nucleo.tipoDistribuicao,
      prioridade: nucleo.prioridade,
      ativo: nucleo.ativo,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm('Tem certeza que deseja excluir este núcleo?'))) return;
    try {
      await nucleoService.deletar(id);
      carregarNucleos();
    } catch (err: unknown) {
      console.error('Erro ao deletar núcleo:', err);
      setError(err instanceof Error ? err.message : 'Erro ao deletar núcleo');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      codigo: '',
      cor: '#159A9C',
      tipoDistribuicao: 'manual' as TipoDistribuicao,
      prioridade: 1,
      ativo: true,
    });
    setEditingNucleo(null);
  };

  const toggleExpand = (nucleoId: string) => {
    const newExpanded = new Set(expandedNucleos);
    if (newExpanded.has(nucleoId)) {
      newExpanded.delete(nucleoId);
    } else {
      newExpanded.add(nucleoId);
    }
    setExpandedNucleos(newExpanded);
  };

  const openAgentModal = (nucleo: Nucleo) => {
    setSelectedNucleoForAgents(nucleo);
    setShowAgentModal(true);
  };

  const openDeptModal = (nucleo: Nucleo) => {
    setSelectedNucleoForDepts(nucleo);
    setShowDeptModal(true);
  };

  const handleDeptSaved = () => {
    carregarNucleos();
    setShowDeptFormModal(false);
    setEditingDepartamento(null);
    setSelectedNucleoForDeptForm(null);
  };

  const nucleosFiltrados = nucleos.filter((nucleo) => {
    const matchesSearch =
      nucleo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (nucleo.descricao?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && nucleo.ativo) ||
      (filterStatus === 'inactive' && !nucleo.ativo);
    return matchesSearch && matchesStatus;
  });

  const estatisticas = {
    total: nucleos.length,
    ativos: nucleos.filter((n) => n.ativo).length,
    inativos: nucleos.filter((n) => !n.ativo).length,
    manual: nucleos.filter((n) => n.tipoDistribuicao === 'manual').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-[#159A9C]" />
      </div>
    );
  }

  return (
    <>
      {/* Dashboard Cards - Tema Crevasse */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KPICard
          titulo="Total de Núcleos"
          valor={estatisticas.total}
          icone={Target}
          color="crevasse"
        />

        <KPICard
          titulo="Núcleos Ativos"
          valor={estatisticas.ativos}
          icone={Target}
          color="crevasse"
        />

        <KPICard
          titulo="Distribuição Manual"
          valor={estatisticas.manual}
          icone={Users}
          color="crevasse"
        />

        <KPICard
          titulo="Núcleos Inativos"
          valor={estatisticas.inativos}
          icone={Target}
          color="crevasse"
        />
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar núcleos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
            <button
              onClick={() => setShowDialog(true)}
              className="inline-flex items-center px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Núcleo
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Núcleos */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {nucleosFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-12 text-center">
          <Target className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum núcleo encontrado</h3>
          <p className="text-gray-500 mb-4">Comece criando seu primeiro núcleo de atendimento.</p>
          <button
            onClick={() => setShowDialog(true)}
            className="inline-flex items-center px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Criar Primeiro Núcleo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {nucleosFiltrados.map((nucleo) => {
            const isExpanded = expandedNucleos.has(nucleo.id);

            return (
              <Card key={nucleo.id} className="border-[#DEEFE7]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: nucleo.cor }}
                      />
                      <CardTitle className="text-[#002333]">{nucleo.nome}</CardTitle>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          nucleo.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {nucleo.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleExpand(nucleo.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(nucleo)}
                        className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(nucleo.id)}
                        className="p-2 text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-[#64748B] mb-4">{nucleo.descricao}</p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-[#64748B]">Tipo de Distribuição</p>
                      <p className="text-sm font-medium text-[#002333] capitalize">
                        {nucleo.tipoDistribuicao.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B]">Prioridade</p>
                      <p className="text-sm font-medium text-[#002333]">{nucleo.prioridade}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B]">Código</p>
                      <p className="text-sm font-medium text-[#002333]">{nucleo.codigo}</p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-[#002333] flex items-center">
                          <Building2 className="h-4 w-4 mr-2" />
                          Departamentos ({nucleo.departamentos?.length || 0})
                        </h4>
                        <button
                          onClick={() => openDeptModal(nucleo)}
                          className="text-sm text-[#159A9C] hover:text-[#0F7B7D]"
                        >
                          Gerenciar
                        </button>
                      </div>

                      {nucleo.departamentos && nucleo.departamentos.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {nucleo.departamentos.map((dept) => (
                            <div
                              key={dept.id}
                              className="px-3 py-2 bg-gray-50 rounded-lg text-base font-medium text-[#002333]"
                            >
                              {dept.nome}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-[#002333] flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Atendentes
                        </h4>
                        <button
                          onClick={() => openAgentModal(nucleo)}
                          className="text-sm text-[#159A9C] hover:text-[#0F7B7D]"
                        >
                          Gerenciar
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Criar/Editar Núcleo */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#002333]">
                  {editingNucleo ? 'Editar Núcleo' : 'Novo Núcleo'}
                </h2>
                <button
                  onClick={() => {
                    setShowDialog(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                    placeholder="Ex: SUP, VEN, FIN"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-1">Descrição</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#002333] mb-1">Cor</label>
                    <input
                      type="color"
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      className="w-full h-10 px-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#002333] mb-1">
                      Tipo de Distribuição *
                    </label>
                    <select
                      required
                      value={formData.tipoDistribuicao}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tipoDistribuicao: e.target.value as TipoDistribuicao,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                    >
                      <option value="manual">Manual</option>
                      <option value="round_robin">Round Robin</option>
                      <option value="load_balancing">Carga Balanceada</option>
                      <option value="skill_based">Por Habilidade</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#002333] mb-1">
                      Prioridade *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.prioridade}
                      onChange={(e) =>
                        setFormData({ ...formData, prioridade: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center pt-6">
                    <input
                      type="checkbox"
                      id="ativo"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                      className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                    />
                    <label htmlFor="ativo" className="ml-2 text-sm font-medium text-[#002333]">
                      Núcleo Ativo
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDialog(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors"
                  >
                    {editingNucleo ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modais de Gerenciamento */}
      {showAgentModal && selectedNucleoForAgents && (
        <ModalGerenciarAgentesNucleo
          nucleo={selectedNucleoForAgents}
          isOpen={showAgentModal}
          onClose={() => {
            setShowAgentModal(false);
            setSelectedNucleoForAgents(null);
            carregarNucleos();
          }}
        />
      )}

      {showDeptModal && selectedNucleoForDepts && (
        <ModalGerenciarDepartamentos
          nucleo={selectedNucleoForDepts}
          isOpen={showDeptModal}
          onClose={() => {
            setShowDeptModal(false);
            setSelectedNucleoForDepts(null);
            carregarNucleos();
          }}
        />
      )}

      {showDeptFormModal && selectedNucleoForDeptForm && (
        <ModalDepartamento
          nucleoId={selectedNucleoForDeptForm.id}
          nucleoNome={selectedNucleoForDeptForm.nome}
          departamento={editingDepartamento}
          isOpen={showDeptFormModal}
          onClose={() => {
            setShowDeptFormModal(false);
            setEditingDepartamento(null);
            setSelectedNucleoForDeptForm(null);
            carregarNucleos();
          }}
        />
      )}
    </>
  );
};
