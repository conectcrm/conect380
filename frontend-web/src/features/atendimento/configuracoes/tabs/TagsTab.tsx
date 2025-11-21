import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, Search, X, AlertCircle } from 'lucide-react';
import tagsService, { Tag as TagItem } from '../../../../services/tagsService';

export const TagsTab: React.FC = () => {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);

  // Cores predefinidas para tags (padrão Zendesk/Intercom)
  const CORES_PRESET = [
    { value: '#EF4444', label: 'Vermelho' },
    { value: '#F97316', label: 'Laranja' },
    { value: '#F59E0B', label: 'Amarelo' },
    { value: '#10B981', label: 'Verde' },
    { value: '#14B8A6', label: 'Teal' },
    { value: '#06B6D4', label: 'Ciano' },
    { value: '#3B82F6', label: 'Azul' },
    { value: '#6366F1', label: 'Índigo' },
    { value: '#8B5CF6', label: 'Roxo' },
    { value: '#EC4899', label: 'Rosa' },
    { value: '#64748B', label: 'Cinza' },
  ];

  const [formData, setFormData] = useState({
    nome: '',
    cor: CORES_PRESET[0].value,
    descricao: '',
    ativo: true,
  });

  useEffect(() => {
    carregarTags();
  }, []);

  const carregarTags = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar tags da API com contagem de uso
      const response = await tagsService.listar(false, true);
      setTags(response);
    } catch (err: unknown) {
      console.error('Erro ao carregar tags:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar tags');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (editingTag) {
        // Atualizar tag existente
        await tagsService.atualizar(editingTag.id, formData);
      } else {
        // Criar nova tag
        await tagsService.criar(formData);
      }

      await carregarTags();
      setShowDialog(false);
      resetForm();
    } catch (err: unknown) {
      console.error('Erro ao salvar tag:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar tag';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta tag?')) return;

    try {
      setLoading(true);
      setError(null);

      // Deletar tag (soft delete no backend)
      await tagsService.deletar(id);
      await carregarTags();
    } catch (err: unknown) {
      console.error('Erro ao deletar tag:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar tag';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tag: TagItem) => {
    setEditingTag(tag);
    setFormData({
      nome: tag.nome,
      cor: tag.cor,
      descricao: tag.descricao || '',
      ativo: tag.ativo,
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingTag(null);
    setFormData({
      nome: '',
      cor: CORES_PRESET[0].value,
      descricao: '',
      ativo: true,
    });
  };

  const tagsFiltradas = tags.filter(tag =>
    tag.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading state
  if (loading && tags.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#159A9C]"></div>
      </div>
    );
  }

  // Error state
  if (error && tags.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-6">
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Tag className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Sistema de Tags Flexível</h3>
            <p className="text-sm text-blue-700">
              Tags permitem categorização flexível. Um ticket pode ter múltiplas tags (ex: "Urgente" + "VIP" + "Comercial").
              Substitui o sistema rígido de departamentos, oferecendo mais flexibilidade.
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Novo */}
      <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            />
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Nova Tag
          </button>
        </div>
      </div>

      {/* Grid de Tags */}
      {tagsFiltradas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-12 text-center">
          <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'Nenhuma tag encontrada' : 'Nenhuma tag cadastrada'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm
              ? 'Tente buscar com outros termos'
              : 'Comece criando sua primeira tag para organizar tickets'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => {
                resetForm();
                setShowDialog(true);
              }}
              className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Criar Primeira Tag
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tagsFiltradas.map((tag) => (
            <div
              key={tag.id}
              className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header do Card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: `${tag.cor}20` }}
                  >
                    <Tag className="h-5 w-5" style={{ color: tag.cor }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#002333] text-lg">
                      {tag.nome}
                    </h3>
                    {tag.usageCount !== undefined && (
                      <p className="text-xs text-gray-500">
                        {tag.usageCount} ticket{tag.usageCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(tag)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Deletar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Descrição */}
              {tag.descricao && (
                <p className="text-sm text-gray-600 mb-4">
                  {tag.descricao}
                </p>
              )}

              {/* Preview da Tag */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Preview:</span>
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${tag.cor}20`,
                    color: tag.cor,
                  }}
                >
                  {tag.nome}
                </span>
              </div>

              {/* Status */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tag.ativo
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                    }`}
                >
                  {tag.ativo ? 'Ativa' : 'Inativa'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação/Edição */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-[#002333]">
                {editingTag ? 'Editar Tag' : 'Nova Tag'}
              </h2>
              <button
                onClick={() => {
                  setShowDialog(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Tag *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  placeholder="Ex: Urgente, VIP, Comercial..."
                />
              </div>

              {/* Cor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor da Tag *
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {CORES_PRESET.map((cor) => (
                    <button
                      key={cor.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, cor: cor.value })}
                      className={`w-10 h-10 rounded-full transition-all ${formData.cor === cor.value
                          ? 'ring-2 ring-offset-2 ring-[#159A9C] scale-110'
                          : 'hover:scale-105'
                        }`}
                      style={{ backgroundColor: cor.value }}
                      title={cor.label}
                    />
                  ))}
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  rows={3}
                  placeholder="Descreva quando usar esta tag..."
                />
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview
                </label>
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${formData.cor}20`,
                    color: formData.cor,
                  }}
                >
                  {formData.nome || 'Nome da Tag'}
                </span>
              </div>

              {/* Ativo */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                />
                <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700">
                  Tag ativa
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowDialog(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.nome.trim() || loading}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {editingTag ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
