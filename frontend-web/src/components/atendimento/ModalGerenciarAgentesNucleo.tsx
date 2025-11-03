import React, { useState, useEffect } from 'react';
import { X, Save, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import AgentSelector from './AgentSelector';
import nucleoService, { Nucleo } from '../../services/nucleoService';

// ========================================================================
// INTERFACES
// ========================================================================

interface ModalGerenciarAgentesNucleoProps {
  /** Controla visibilidade do modal */
  isOpen: boolean;
  /** Callback para fechar */
  onClose: () => void;
  /** Núcleo sendo editado */
  nucleo: Nucleo;
  /** Callback após salvar com sucesso */
  onSuccess?: () => void;
}

// ========================================================================
// COMPONENTE PRINCIPAL
// ========================================================================

export const ModalGerenciarAgentesNucleo: React.FC<ModalGerenciarAgentesNucleoProps> = ({
  isOpen,
  onClose,
  nucleo,
  onSuccess,
}) => {
  // ========================================================================
  // STATES
  // ========================================================================

  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    if (isOpen && nucleo) {
      // Carregar IDs dos agentes já atribuídos ao núcleo
      setSelectedAgentIds(nucleo.atendentesIds || []);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, nucleo]);

  // ========================================================================
  // FUNÇÕES
  // ========================================================================

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Atualizar núcleo com novos atendentes
      await nucleoService.atualizar(nucleo.id, {
        atendentesIds: selectedAgentIds,
      });

      setSuccess(`✅ Agentes atualizados com sucesso!`);

      // Aguardar 1.5s para mostrar mensagem de sucesso
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      console.error('Erro ao salvar agentes do núcleo:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao salvar agentes');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================

  const hasChanges = JSON.stringify(selectedAgentIds.sort()) !== JSON.stringify((nucleo.atendentesIds || []).sort());

  // ========================================================================
  // RENDER
  // ========================================================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Gerenciar Agentes
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Núcleo: <span className="font-medium text-gray-900">{nucleo.nome}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={saving}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">
                  ℹ️ Sobre Agentes Diretos do Núcleo
                </p>
                <p className="text-blue-800">
                  Quando um cliente escolhe este núcleo <strong>e não há departamentos configurados</strong>,
                  o bot transfere automaticamente para um dos agentes selecionados aqui.
                </p>
              </div>
            </div>
          </div>

          {/* Agent Selector */}
          <AgentSelector
            selectedAgentIds={selectedAgentIds}
            onSelectionChange={setSelectedAgentIds}
            multiSelect={true}
            onlyActive={true}
            placeholder="Buscar atendente por nome ou email..."
            maxHeight="400px"
          />

          {/* Mensagens de erro/sucesso */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}
        </div>

        {/* Footer com botões */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {selectedAgentIds.length === 0 ? (
              <span className="text-yellow-700 font-medium">
                ⚠️ Nenhum agente selecionado
              </span>
            ) : (
              <span>
                <strong>{selectedAgentIds.length}</strong> agente{selectedAgentIds.length !== 1 ? 's' : ''} selecionado{selectedAgentIds.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              Cancelar
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalGerenciarAgentesNucleo;
