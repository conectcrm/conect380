import React, { useState, useEffect } from 'react';
import {
  Check,
  ChevronDown,
  Download,
  Send,
  FileSignature,
  Receipt,
  Trash2,
  UserCheck,
  AlertTriangle,
  X
} from 'lucide-react';

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
  visible
}) => {
  const [showAcoes, setShowAcoes] = useState(false);
  const [loading, setLoading] = useState(false);

  const quantidade = propostasSelecionadas.length;
  const todaSelecionadas = quantidade === totalPropostas && totalPropostas > 0;

  const acoesMassa = [
    {
      id: 'enviar-email',
      label: 'Enviar por Email',
      icon: Send,
      color: 'blue',
      description: 'Enviar propostas selecionadas por email'
    },
    {
      id: 'gerar-contratos',
      label: 'Gerar Contratos',
      icon: FileSignature,
      color: 'green',
      description: 'Gerar contratos para propostas aprovadas'
    },
    {
      id: 'criar-faturas',
      label: 'Criar Faturas',
      icon: Receipt,
      color: 'purple',
      description: 'Criar faturas em lote'
    },
    {
      id: 'avancar-fluxo',
      label: 'Avançar Fluxo',
      icon: UserCheck,
      color: 'indigo',
      description: 'Avançar para próxima etapa do fluxo'
    },
    {
      id: 'exportar-pdf',
      label: 'Exportar PDF',
      icon: Download,
      color: 'gray',
      description: 'Baixar propostas em PDF'
    },
    {
      id: 'excluir',
      label: 'Excluir',
      icon: Trash2,
      color: 'red',
      description: 'Excluir propostas selecionadas'
    }
  ];

  const handleAcao = async (acaoId: string) => {
    if (quantidade === 0) {
      alert('Selecione pelo menos uma proposta');
      return;
    }

    const acao = acoesMassa.find(a => a.id === acaoId);

    if (acaoId === 'excluir') {
      if (!window.confirm(`Tem certeza que deseja excluir ${quantidade} proposta(s) selecionada(s)?`)) {
        return;
      }
    } else if (acao) {
      if (!window.confirm(`Executar "${acao.label}" em ${quantidade} proposta(s) selecionada(s)?`)) {
        return;
      }
    }

    setLoading(true);
    setShowAcoes(false);

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
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 px-6 py-4 flex items-center gap-4 min-w-[400px]">
        {/* Status da Seleção */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-gray-900">
              {quantidade} de {totalPropostas} selecionada(s)
            </span>
          </div>

          {/* Botões Selecionar/Deselecionar Tudo */}
          <div className="flex items-center gap-1">
            {!todaSelecionadas && (
              <button
                onClick={onSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Selecionar tudo
              </button>
            )}
            {quantidade > 0 && (
              <button
                onClick={onDeselectAll}
                className="text-sm text-gray-600 hover:text-gray-800 hover:underline ml-2"
              >
                Limpar seleção
              </button>
            )}
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Exportar */}
          <button
            onClick={onExportarSelecionadas}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Exportar selecionadas"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>

          {/* Menu de Ações */}
          <div className="relative">
            <button
              onClick={() => setShowAcoes(!showAcoes)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Ações</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAcoes ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {/* Dropdown de Ações */}
            {showAcoes && (
              <div className="absolute bottom-full mb-2 right-0 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10">
                <div className="px-3 py-2 border-b border-gray-100">
                  <h4 className="font-medium text-gray-900">Ações em Massa</h4>
                  <p className="text-sm text-gray-500">Executar em {quantidade} proposta(s)</p>
                </div>

                {acoesMassa.map((acao) => {
                  const Icon = acao.icon;
                  const colorClasses = {
                    blue: 'text-blue-600 hover:bg-blue-50',
                    green: 'text-green-600 hover:bg-green-50',
                    purple: 'text-purple-600 hover:bg-purple-50',
                    indigo: 'text-indigo-600 hover:bg-indigo-50',
                    gray: 'text-gray-600 hover:bg-gray-50',
                    red: 'text-red-600 hover:bg-red-50'
                  };

                  return (
                    <button
                      key={acao.id}
                      onClick={() => handleAcao(acao.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 ${colorClasses[acao.color as keyof typeof colorClasses]} transition-colors`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{acao.label}</div>
                        <div className="text-xs text-gray-500 truncate">{acao.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fechar */}
          <button
            onClick={onDeselectAll}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
