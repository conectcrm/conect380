import React, { useState } from 'react';
import { Check, Download, Trash2, X } from 'lucide-react';
import { useGlobalConfirmation } from '../../../contexts/GlobalConfirmationContext';

interface SelecaoMultiplaProps {
  propostasSelecionadas: string[];
  totalPropostas: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onExportarSelecionadas: () => void;
  onAcoesMassa: (acao: string) => void;
  visible: boolean;
}

export const SelecaoMultipla: React.FC<SelecaoMultiplaProps> = ({
  propostasSelecionadas,
  totalPropostas,
  onSelectAll,
  onDeselectAll,
  onExportarSelecionadas,
  onAcoesMassa,
  visible,
}) => {
  const { confirm } = useGlobalConfirmation();
  const [loading, setLoading] = useState(false);

  const quantidade = propostasSelecionadas.length;
  const todaSelecionadas = quantidade === totalPropostas && totalPropostas > 0;

  const handleAcao = async (acaoId: string) => {
    if (quantidade === 0) {
      return;
    }

    if (acaoId === 'excluir') {
      if (
        !(await confirm(`Tem certeza que deseja excluir ${quantidade} proposta(s) selecionada(s)?`))
      ) {
        return;
      }
    }

    setLoading(true);

    try {
      await onAcoesMassa(acaoId);
    } catch (error) {
      console.error('Erro ao executar ação em massa:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!visible || quantidade === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="min-w-0 w-[calc(100vw-1rem)] max-w-xl rounded-2xl border border-[#D4E2E7] bg-white px-4 py-4 shadow-[0_20px_50px_-24px_rgba(15,57,74,0.45)] sm:w-auto sm:min-w-[400px] sm:max-w-none sm:px-6">
        {/* Status da Seleção */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-[#159A9C]">
              <Check className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-[#19384C]">
              {quantidade} de {totalPropostas} selecionada(s)
            </span>
          </div>

          {/* Botões Selecionar/Deselecionar Tudo */}
          <div className="flex items-center gap-1">
            {!todaSelecionadas && (
              <button
                type="button"
                onClick={onSelectAll}
                className="text-sm font-medium text-[#159A9C] transition hover:text-[#0F7B7D] hover:underline"
              >
                Selecionar tudo
              </button>
            )}
            {quantidade > 0 && (
              <button
                type="button"
                onClick={onDeselectAll}
                className="ml-2 text-sm font-medium text-[#607B89] transition hover:text-[#244455] hover:underline"
              >
                Limpar seleção
              </button>
            )}
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="ml-auto flex items-center gap-2">
          {/* Exportar */}
          <button
            type="button"
            onClick={onExportarSelecionadas}
            className="inline-flex items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 py-2 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB]"
            title="Exportar selecionadas"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>

          <button
            type="button"
            onClick={() => void handleAcao('excluir')}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#DC2626] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60"
            title="Excluir propostas selecionadas"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Excluir
              </>
            )}
          </button>

          {/* Fechar */}
          <button
            type="button"
            onClick={onDeselectAll}
            className="rounded-lg p-2 text-[#8BA0AA] transition hover:bg-[#F6FAFB] hover:text-[#244455]"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelecaoMultipla;
