/**
 * PÁGINA: Gestão de Skills dos Atendentes
 * Módulo: Atendimento
 * Funcionalidade: CRUD de habilidades/competências dos atendentes
 */

import React, { useState, useEffect } from 'react';
import {
  Star,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  Award,
  Users,
} from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import {
  distribuicaoAvancadaService,
  AtendenteSkill,
  CreateAtendenteSkillDto,
} from '../services/distribuicaoAvancadaService';
import { useGlobalConfirmation } from '../contexts/GlobalConfirmationContext';

const GestaoSkillsPage: React.FC = () => {
  const { confirm } = useGlobalConfirmation();
  // Estados
  const [skills, setSkills] = useState<AtendenteSkill[]>([]);
  const [skillsDisponiveis, setSkillsDisponiveis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingSkill, setEditingSkill] = useState<AtendenteSkill | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateAtendenteSkillDto>({
    atendenteId: '',
    skill: '',
    nivel: 3,
    ativo: true,
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      const [skillsData, skillsDisponiveisData] = await Promise.all([
        distribuicaoAvancadaService.listarSkills(),
        distribuicaoAvancadaService.listarSkillsDisponiveis(),
      ]);

      setSkills(skillsData);
      setSkillsDisponiveis(skillsDisponiveisData);
    } catch (err: unknown) {
      console.error('Erro ao carregar dados:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const skillsFiltradas = skills.filter((skill) => {
    const searchLower = busca.toLowerCase();
    return (
      skill.skill.toLowerCase().includes(searchLower) ||
      skill.atendente?.nome?.toLowerCase().includes(searchLower) ||
      false
    );
  });

  const handleNovo = () => {
    setEditingSkill(null);
    setFormData({
      atendenteId: '',
      skill: '',
      nivel: 3,
      ativo: true,
    });
    setShowDialog(true);
  };

  const handleEdit = (skill: AtendenteSkill) => {
    setEditingSkill(skill);
    setFormData({
      atendenteId: skill.atendenteId,
      skill: skill.skill,
      nivel: skill.nivel,
      ativo: skill.ativo,
    });
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      if (editingSkill) {
        // Atualizar skill existente
        await distribuicaoAvancadaService.atualizarSkill(editingSkill.id, {
          nivel: formData.nivel,
          ativo: formData.ativo,
        });
      } else {
        // Criar nova skill
        await distribuicaoAvancadaService.criarSkill(formData);
      }

      setShowDialog(false);
      await carregarDados();
    } catch (err: unknown) {
      console.error('Erro ao salvar skill:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao salvar skill');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm('Deseja realmente deletar esta skill?'))) return;

    try {
      setLoading(true);
      setError(null);

      await distribuicaoAvancadaService.deletarSkill(id);
      await carregarDados();
    } catch (err: unknown) {
      console.error('Erro ao deletar skill:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao deletar skill');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (nivel: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= nivel ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Agrupar skills por atendente
  const skillsPorAtendente = skillsFiltradas.reduce(
    (acc, skill) => {
      const atendenteId = skill.atendenteId;
      if (!acc[atendenteId]) {
        acc[atendenteId] = {
          atendente: skill.atendente,
          skills: [],
        };
      }
      acc[atendenteId].skills.push(skill);
      return acc;
    },
    {} as Record<string, { atendente: any; skills: AtendenteSkill[] }>,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com BackToNucleus */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="Atendimento" nucleusPath="/atendimento" />
      </div>

      {/* Container principal */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header da página */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#002333] flex items-center gap-3">
                  <Award className="h-8 w-8 text-[#159A9C]" />
                  Gestão de Skills
                </h1>
                <p className="text-[#002333]/70 mt-2">
                  Gerenciar habilidades e competências dos atendentes
                </p>
              </div>
              <button
                onClick={handleNovo}
                disabled={loading}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Nova Skill
              </button>
            </div>
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Erro</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Barra de busca e ações */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#B4BEC9]" />
                <input
                  type="text"
                  placeholder="Buscar por skill ou atendente..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#B4BEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                />
              </div>
              <button
                onClick={carregarDados}
                disabled={loading}
                className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && skills.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 text-[#159A9C] animate-spin mx-auto mb-4" />
              <p className="text-[#002333]/70">Carregando skills...</p>
            </div>
          ) : Object.keys(skillsPorAtendente).length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Award className="h-16 w-16 text-[#B4BEC9] mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[#002333] mb-2">
                Nenhuma skill cadastrada
              </h2>
              <p className="text-[#002333]/70 mb-6">
                Comece adicionando skills aos atendentes para habilitar distribuição baseada em
                competências.
              </p>
              <button
                onClick={handleNovo}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors flex items-center gap-2 text-sm font-medium mx-auto"
              >
                <Plus className="h-4 w-4" />
                Adicionar Primeira Skill
              </button>
            </div>
          ) : (
            /* Grid de Atendentes com Skills */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(skillsPorAtendente).map(([atendenteId, { atendente, skills }]) => (
                <div
                  key={atendenteId}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow"
                >
                  {/* Header do Card - Atendente */}
                  <div className="p-6 border-b bg-gradient-to-r from-[#159A9C]/5 to-transparent">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-full bg-[#159A9C]/10 flex items-center justify-center flex-shrink-0">
                        <Users className="h-6 w-6 text-[#159A9C]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#002333] truncate">
                          {atendente?.nome || 'Atendente desconhecido'}
                        </h3>
                        <p className="text-sm text-[#002333]/70">
                          {skills.length} skill{skills.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Skills */}
                  <div className="p-6 space-y-3">
                    {skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-[#002333] text-sm truncate">
                              {skill.skill}
                            </p>
                            {!skill.ativo && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 flex-shrink-0">
                                Inativo
                              </span>
                            )}
                          </div>
                          {renderStars(skill.nivel)}
                        </div>
                        <div className="flex gap-1 ml-3 flex-shrink-0">
                          <button
                            onClick={() => handleEdit(skill)}
                            className="p-2 text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(skill.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Deletar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criar/Editar */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-[#002333]">
                {editingSkill ? 'Editar Skill' : 'Nova Skill'}
              </h2>
              <button
                onClick={() => setShowDialog(false)}
                className="text-[#002333]/70 hover:text-[#002333]"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Atendente (apenas na criação) */}
              {!editingSkill && (
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-2">
                    ID do Atendente *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.atendenteId}
                    onChange={(e) => setFormData({ ...formData, atendenteId: e.target.value })}
                    className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                    placeholder="UUID do atendente"
                  />
                </div>
              )}

              {/* Skill */}
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-2">Skill *</label>
                {editingSkill ? (
                  <input
                    type="text"
                    disabled
                    value={formData.skill}
                    className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                ) : (
                  <select
                    required
                    value={formData.skill}
                    onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                    className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  >
                    <option value="">Selecione uma skill</option>
                    {skillsDisponiveis.map((skill) => (
                      <option key={skill} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Nível */}
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-2">
                  Nível de Proficiência *
                </label>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formData.nivel}
                    onChange={(e) => setFormData({ ...formData, nivel: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#002333]/70">Básico</span>
                    <div className="flex items-center gap-2">
                      {renderStars(formData.nivel)}
                      <span className="text-sm font-medium text-[#002333]">
                        Nível {formData.nivel}
                      </span>
                    </div>
                    <span className="text-sm text-[#002333]/70">Expert</span>
                  </div>
                </div>
              </div>

              {/* Ativo */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-[#B4BEC9] rounded"
                />
                <label htmlFor="ativo" className="text-sm font-medium text-[#002333]">
                  Skill ativa (considerada na distribuição)
                </label>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="flex-1 px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {loading ? 'Salvando...' : editingSkill ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestaoSkillsPage;
