import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Users,
  UserPlus,
  Settings,
  X,
  Search,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import equipeService, {
  Equipe,
  CreateEquipeDto,
} from '../services/equipeService';

const GestaoEquipesPage: React.FC = () => {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEquipe, setEditingEquipe] = useState<Equipe | null>(null);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [managingEquipeId, setManagingEquipeId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  // Estados de validação
  const [validationErrors, setValidationErrors] = useState<{
    nome?: string;
  }>({});

  const [formData, setFormData] = useState<CreateEquipeDto>({
    nome: '',
    descricao: '',
    cor: '#9333EA',
    icone: 'users',
    ativo: true,
  });

  useEffect(() => {
    carregarEquipes();
  }, []);

  const carregarEquipes = async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await equipeService.listar();
      setEquipes(Array.isArray(dados) ? dados : []);
    } catch (err: unknown) {
      console.error('Erro ao carregar equipes:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao carregar equipes');
      setEquipes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (equipe?: Equipe) => {
    if (equipe) {
      setEditingEquipe(equipe);
      setFormData({
        nome: equipe.nome ?? '',
        descricao: equipe.descricao ?? '',
        cor: equipe.cor || '#9333EA',
        icone: equipe.icone || 'users',
        ativo: equipe.ativo ?? true,
      });
    } else {
      setEditingEquipe(null);
      setValidationErrors({});
      setFormData({
        nome: '',
        descricao: '',
        cor: '#9333EA',
        icone: 'users',
        ativo: true,
      });
    }
    setShowDialog(true);
  };

  const validateForm = (): boolean => {
    const errors: { nome?: string } = {};

    // Validar nome
    if (!formData.nome || formData.nome.trim().length < 3) {
      errors.nome = 'Nome da equipe deve ter pelo menos 3 caracteres';
    } else {
      // Verificar se nome já existe
      const nomeExiste = equipes.some(
        (eq) =>
          eq.nome.toLowerCase() === formData.nome.toLowerCase() &&
          eq.id !== editingEquipe?.id,
      );
      if (nomeExiste) {
        errors.nome = 'Já existe uma equipe com este nome';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    // Validar formulário antes de enviar
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    try {
      setError(null);
      if (editingEquipe) {
        await equipeService.atualizar(editingEquipe.id, formData);
        toast.success('Equipe atualizada com sucesso!');
      } else {
        await equipeService.criar(formData);
        toast.success('Equipe criada com sucesso!');
      }
      setShowDialog(false);
      setEditingEquipe(null);
      carregarEquipes();
    } catch (err: unknown) {
      console.error('Erro ao salvar equipe:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      const errorMsg = normalizedMessage || fallbackMessage || 'Erro ao salvar equipe';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar esta equipe?')) {
      return;
    }

    try {
      setError(null);
      await equipeService.deletar(id);
      toast.success('Equipe deletada com sucesso!');
      carregarEquipes();
    } catch (err: unknown) {
      console.error('Erro ao deletar equipe:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      const errorMsg = normalizedMessage || fallbackMessage || 'Erro ao deletar equipe';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const equipesFiltradas = equipes.filter((eq) =>
    eq.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    eq.descricao?.toLowerCase().includes(busca.toLowerCase())
  );

  const totalEquipes = equipes.length;
  const equipesAtivas = equipes.filter((eq) => eq.ativo).length;
  const equipesInativas = equipes.filter((eq) => !eq.ativo).length;
  const totalMembros = equipes.reduce(
    (acc, eq) => acc + (eq.atendenteEquipes?.length || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus
          nucleusName="Atendimento"
          nucleusPath="/nuclei/atendimento"
        />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="px-6 py-6">
              <div className="flex flex-col sm:flex-row justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                    <Users className="h-8 w-8 mr-3 text-[#9333EA]" />
                    Gestão de Equipes
                    {loading && (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#9333EA] ml-3"></div>
                    )}
                  </h1>
                  <p className="mt-2 text-[#B4BEC9]">
                    {loading ? 'Carregando equipes...' : `Gerencie suas ${totalEquipes} equipes de atendimento`}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center gap-3">
                  <button
                    onClick={carregarEquipes}
                    disabled={loading}
                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleOpenDialog()}
                    className="bg-[#9333EA] hover:bg-[#7E22CE] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <Plus className="w-5 h-5" />
                    Nova Equipe
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total de Equipes</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{totalEquipes}</p>
                  <p className="text-xs text-gray-400 mt-1">📊 Visão geral</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Equipes Ativas</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{equipesAtivas}</p>
                  <p className="text-xs text-green-500 mt-1">✅ Operacionais</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Inativas</p>
                  <p className="text-3xl font-bold text-gray-600 mt-2">{equipesInativas}</p>
                  <p className="text-xs text-gray-500 mt-1">⏸️ Pausadas</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl">
                  <AlertCircle className="w-8 h-8 text-gray-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total de Membros</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{totalMembros}</p>
                  <p className="text-xs text-blue-500 mt-1">👥 Atendentes</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                  <UserPlus className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar Equipes</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou descrição..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Estado vazio */}
          {!loading && equipesFiltradas.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="text-center py-12 px-6">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {busca ? 'Nenhuma equipe encontrada' : 'Nenhuma equipe cadastrada'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {busca
                    ? 'Tente ajustar os filtros de busca'
                    : 'Crie sua primeira equipe para começar a organizar seus atendentes'}
                </p>
                {!busca && (
                  <button
                    onClick={() => handleOpenDialog()}
                    className="bg-[#9333EA] hover:bg-[#7E22CE] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-sm mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Criar Primeira Equipe
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Cards de Equipes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipesFiltradas.map((equipe) => (
              <div key={equipe.id} className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0"
                        style={{ backgroundColor: equipe.cor }}
                      >
                        <Users className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{equipe.nome}</h3>
                        <p className="text-sm">
                          {equipe.ativo ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Ativa
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Inativa
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      <button
                        onClick={() => handleOpenDialog(equipe)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(equipe.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {equipe.descricao && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {equipe.descricao}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <UserPlus className="h-4 w-4" />
                      <span>{equipe.atendenteEquipes?.length || 0} membros</span>
                    </div>
                    <button
                      onClick={() => {
                        setManagingEquipeId(equipe.id);
                        setShowMembersDialog(true);
                      }}
                      className="text-[#9333EA] hover:text-[#7E22CE] text-sm font-medium flex items-center gap-1 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Gerenciar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dialog de Criação/Edição */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingEquipe ? 'Editar Equipe' : 'Nova Equipe'}
              </h2>
              <button
                onClick={() => {
                  setShowDialog(false);
                  setEditingEquipe(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border ${validationErrors.nome ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent transition-colors`}
                  value={formData.nome}
                  onChange={(e) => {
                    setFormData({ ...formData, nome: e.target.value });
                    if (validationErrors.nome) {
                      setValidationErrors({ ...validationErrors, nome: undefined });
                    }
                  }}
                  placeholder="Ex: Suporte Técnico - Nível 1"
                />
                {validationErrors.nome && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.nome}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent transition-colors"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  placeholder="Descrição da equipe"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor
                  </label>
                  <input
                    type="color"
                    className="w-full h-10 rounded-lg cursor-pointer border border-gray-300"
                    value={formData.cor}
                    onChange={(e) =>
                      setFormData({ ...formData, cor: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent transition-colors"
                    value={formData.ativo ? 'true' : 'false'}
                    onChange={(e) =>
                      setFormData({ ...formData, ativo: e.target.value === 'true' })
                    }
                  >
                    <option value="true">Ativa</option>
                    <option value="false">Inativa</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDialog(false);
                  setEditingEquipe(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.nome.trim()}
                className="flex-1 px-4 py-2 bg-[#9333EA] text-white rounded-lg hover:bg-[#7E22CE] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {editingEquipe ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de Gestão de Membros */}
      {showMembersDialog && managingEquipeId && (
        <MembersDialog
          equipeId={managingEquipeId}
          onClose={() => {
            setShowMembersDialog(false);
            setManagingEquipeId(null);
            carregarEquipes();
          }}
        />
      )}
    </div>
  );
};

// Componente de diálogo de membros
interface MembersDialogProps {
  equipeId: string;
  onClose: () => void;
}

interface MembersDialogMember {
  id: string;
  nome: string;
  email: string;
}

interface AvailableAtendente {
  id: string;
  nome: string;
  email: string;
  usuarioId?: string | null;
}

const MembersDialog: React.FC<MembersDialogProps> = ({ equipeId, onClose }) => {
  const [members, setMembers] = useState<MembersDialogMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableAtendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [equipeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [membrosData, usuariosData] = await Promise.all([
        equipeService.listarAtendentes(equipeId),
        equipeService.listarTodosAtendentes(),
      ]);

      const normalizedMembers: MembersDialogMember[] = Array.isArray(membrosData)
        ? membrosData
          .filter(Boolean)
          .map((member: any) => ({
            id:
              member?.id ||
              member?.userId ||
              member?.usuarioId ||
              member?.atendenteId ||
              '',
            nome: member?.nome || member?.user?.nome || 'Sem nome informado',
            email: member?.email || member?.user?.email || 'Sem e-mail informado',
          }))
          .filter((member) => Boolean(member.id))
        : [];

      const normalizedAvailable: AvailableAtendente[] = Array.isArray(usuariosData)
        ? usuariosData
          .filter(Boolean)
          .map((user: any) => ({
            id: user?.id,
            nome: user?.nome || 'Sem nome informado',
            email: user?.email || 'Sem e-mail informado',
            usuarioId: user?.usuarioId || user?.usuario_id || null,
          }))
          .filter((user) => Boolean(user.id))
        : [];

      setMembers(normalizedMembers);
      setAvailableUsers(normalizedAvailable);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar membros e usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (atendente: AvailableAtendente) => {
    if (!atendente?.usuarioId) {
      const errorMsg = 'Atendente sem usuário vinculado. Gere ou associe um usuário antes de adicioná-lo à equipe.';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      setError(null);
      await equipeService.adicionarAtendente(equipeId, atendente.usuarioId, 'membro');
      toast.success('Membro adicionado à equipe!');
      await loadData();
    } catch (err) {
      console.error('Erro ao adicionar membro:', err);
      const errorMsg = 'Erro ao adicionar membro à equipe';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      setError(null);
      await equipeService.removerAtendente(equipeId, userId);
      toast.success('Membro removido da equipe!');
      await loadData();
    } catch (err) {
      console.error('Erro ao remover membro:', err);
      const errorMsg = 'Erro ao remover membro da equipe';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const memberIds = new Set(members.map(m => m.id));
  const filteredAvailableUsers = availableUsers
    .filter((u) => u.usuarioId && !memberIds.has(u.usuarioId))
    .filter((u) =>
      (u.nome ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Gerenciar Membros da Equipe</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Membros Atuais ({members.length})
            </h3>
            {loading ? (
              <p className="text-sm text-gray-500">Carregando...</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum membro na equipe</p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{member.nome}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Adicionar Membros</h3>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {loading ? (
              <p className="text-sm text-gray-500">Carregando...</p>
            ) : filteredAvailableUsers.length === 0 ? (
              <p className="text-sm text-gray-500">
                {searchTerm ? 'Nenhum usuário encontrado' : 'Todos os usuários já estão na equipe'}
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredAvailableUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{user.nome}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {!user.usuarioId && (
                        <p className="text-xs text-amber-600 mt-1">
                          Vincule um usuário para adicionar este atendente à equipe
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddMember(user)}
                      disabled={!user.usuarioId}
                      className={`px-4 py-2 text-sm flex items-center gap-2 rounded-lg transition-colors ${user.usuarioId
                          ? 'bg-[#9333EA] text-white hover:bg-[#7E22CE]'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                      <UserPlus className="h-4 w-4" />
                      Adicionar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GestaoEquipesPage;
