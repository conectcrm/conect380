import React, { useState, useEffect } from 'react';
import { X, Save, Building2, AlertCircle, Palette, Hash, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { departamentoService } from '../../services/departamentoService';
import { CreateDepartamentoDto } from '../../types/departamentoTypes';

// ========================================================================
// INTERFACES
// ========================================================================

interface ModalDepartamentoProps {
  /** Controla visibilidade do modal */
  isOpen: boolean;
  /** Callback para fechar */
  onClose: () => void;
  /** ID do núcleo ao qual o departamento pertence */
  nucleoId: string;
  /** Nome do núcleo (para exibição) */
  nucleoNome: string;
  /** Departamento sendo editado (undefined = modo criação) */
  departamento?: any;
  /** Callback após salvar com sucesso */
  onSuccess?: () => void;
}

// ========================================================================
// COMPONENTE PRINCIPAL
// ========================================================================

export const ModalDepartamento: React.FC<ModalDepartamentoProps> = ({
  isOpen,
  onClose,
  nucleoId,
  nucleoNome,
  departamento,
  onSuccess,
}) => {
  // ========================================================================
  // STATES
  // ========================================================================

  const [formData, setFormData] = useState<CreateDepartamentoDto>({
    nome: '',
    descricao: '',
    codigo: '',
    nucleoId: nucleoId,
    cor: '#3B82F6',
    icone: 'folder',
    visivelNoBot: true,
    ativo: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    if (isOpen) {
      if (departamento) {
        // Modo edição
        setFormData({
          nome: departamento.nome || '',
          descricao: departamento.descricao || '',
          codigo: departamento.codigo || '',
          nucleoId: nucleoId,
          cor: departamento.cor || '#3B82F6',
          icone: departamento.icone || 'folder',
          visivelNoBot: departamento.visivelNoBot ?? true,
          ativo: departamento.ativo ?? true,
        });
      } else {
        // Modo criação - limpar form
        setFormData({
          nome: '',
          descricao: '',
          codigo: '',
          nucleoId: nucleoId,
          cor: '#3B82F6',
          icone: 'folder',
          visivelNoBot: true,
          ativo: true,
        });
      }
      setError(null);
    }
  }, [isOpen, departamento, nucleoId]);

  // ========================================================================
  // FUNÇÕES
  // ========================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.nome.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!formData.codigo.trim()) {
      setError('Código é obrigatório');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (departamento) {
        // Atualizar departamento existente
        await departamentoService.atualizar(departamento.id, formData);
      } else {
        // Criar novo departamento
        await departamentoService.criar(formData);
      }

      // Sucesso
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      console.error('Erro ao salvar departamento:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao salvar departamento');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // Gerar código automaticamente baseado no nome
  const gerarCodigoAutomatico = () => {
    if (!formData.nome) return;

    const codigo = formData.nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .substring(0, 20);

    setFormData({ ...formData, codigo });
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: formData.cor }}
            >
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {departamento ? 'Editar Departamento' : 'Novo Departamento'}
              </h2>
              <p className="text-sm text-gray-600">Núcleo: {nucleoNome}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Alertas */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Departamento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              onBlur={gerarCodigoAutomatico}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Suporte Técnico"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Nome que aparecerá no menu do bot e na interface
            </p>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              placeholder="Ex: Atendimento para questões técnicas e suporte ao produto"
              disabled={loading}
            />
          </div>

          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) =>
                    setFormData({ ...formData, codigo: e.target.value.toUpperCase() })
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="SUPORTE_TECNICO"
                  required
                  disabled={loading}
                />
              </div>
              <Button
                type="button"
                onClick={gerarCodigoAutomatico}
                variant="outline"
                disabled={loading || !formData.nome}
              >
                Gerar
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Código único para identificação interna (sem espaços)
            </p>
          </div>

          {/* Cor e Ícone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.cor}
                  onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                  className="w-14 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  disabled={loading}
                />
                <input
                  type="text"
                  value={formData.cor}
                  onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#3B82F6"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ícone</label>
              <input
                type="text"
                value={formData.icone}
                onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="folder"
                disabled={loading}
              />
            </div>
          </div>

          {/* Switches */}
          <div className="space-y-4">
            {/* Visível no Bot */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {formData.visivelNoBot ? (
                  <Eye className="h-5 w-5 text-blue-600" />
                ) : (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">Visível no Bot</p>
                  <p className="text-xs text-gray-600">Aparecer como opção no menu do WhatsApp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, visivelNoBot: !formData.visivelNoBot })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.visivelNoBot ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                disabled={loading}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.visivelNoBot ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Ativo */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    formData.ativo ? 'bg-green-100' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      formData.ativo ? 'bg-green-600' : 'bg-gray-400'
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Ativo</p>
                  <p className="text-xs text-gray-600">Departamento está operacional</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, ativo: !formData.ativo })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.ativo ? 'bg-green-600' : 'bg-gray-300'
                }`}
                disabled={loading}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.ativo ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" onClick={handleClose} variant="outline" disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {departamento ? 'Atualizar' : 'Criar'} Departamento
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
