import React, { useEffect, useState } from 'react';
import { X, RotateCcw, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface VersaoFluxo {
  numero: number;
  timestamp: string;
  autor: string;
  descricao?: string;
  publicada: boolean;
}

interface ModalHistoricoVersoesProps {
  open: boolean;
  fluxoId: string;
  onClose: () => void;
  onRestore: () => void;
}

export const ModalHistoricoVersoes: React.FC<ModalHistoricoVersoesProps> = ({
  open,
  fluxoId,
  onClose,
  onRestore,
}) => {
  const [versoes, setVersoes] = useState<VersaoFluxo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<number | null>(null);

  useEffect(() => {
    if (open && fluxoId) {
      carregarHistorico();
    }
  }, [open, fluxoId]);

  const carregarHistorico = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/fluxos/${fluxoId}/historico`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar histórico');
      }

      const data = await response.json();
      setVersoes(data.data || []);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar histórico de versões');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (numeroVersao: number) => {
    const versao = versoes.find(v => v.numero === numeroVersao);
    const confirmMessage = versao?.publicada
      ? `⚠️ Esta versão está publicada. Tem certeza que deseja restaurar para a versão ${numeroVersao}?\n\nIsso criará um novo snapshot da versão atual antes de restaurar.`
      : `Tem certeza que deseja restaurar para a versão ${numeroVersao}?\n\nA versão atual será salva antes de restaurar.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setRestoring(numeroVersao);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/fluxos/${fluxoId}/restaurar-versao`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ numeroVersao }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao restaurar versão');
      }

      const data = await response.json();
      console.log('✅ Versão restaurada:', data);

      // Mostrar mensagem de sucesso
      alert(`✅ Versão ${numeroVersao} restaurada com sucesso!`);

      // Recarregar histórico e notificar parent
      await carregarHistorico();
      onRestore();
      onClose();
    } catch (err) {
      console.error('Erro ao restaurar versão:', err);
      setError(err instanceof Error ? err.message : 'Erro ao restaurar versão');
      alert(`❌ Erro ao restaurar versão: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setRestoring(null);
    }
  };

  const formatarData = (timestamp: string) => {
    const date = new Date(timestamp);
    const agora = new Date();
    const diffMs = agora.getTime() - date.getTime();
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMinutos / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffMinutos < 1) return 'Agora mesmo';
    if (diffMinutos < 60) return `há ${diffMinutos}min`;
    if (diffHoras < 24) return `há ${diffHoras}h`;
    if (diffDias < 7) return `há ${diffDias}d`;

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-[calc(100%-2rem)] sm:w-[600px] md:w-[750px] lg:w-[850px] xl:w-[900px] max-w-[1000px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-[#002333] flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              Histórico de Versões
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {versoes.length > 0
                ? `${versoes.length} versão(ões) salva(s)`
                : 'Nenhuma versão salva ainda'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
              <p className="text-sm text-gray-600 mt-4">Carregando histórico...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Erro ao carregar histórico</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && versoes.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma versão salva ainda
              </h3>
              <p className="text-gray-600 mb-2">
                As versões são salvas automaticamente quando você publica o fluxo.
              </p>
              <p className="text-sm text-gray-500">
                Você também pode salvar versões manualmente a qualquer momento.
              </p>
            </div>
          )}

          {!loading && !error && versoes.length > 0 && (
            <div className="space-y-4">
              {versoes.map((versao, index) => (
                <div
                  key={`${versao.numero}-${index}`}
                  className={`border rounded-xl p-4 transition-all ${versao.publicada
                    ? 'border-green-300 bg-green-50/50 hover:border-green-400 hover:shadow-md'
                    : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                    }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-xl font-bold text-purple-600">
                          v{versao.numero}
                        </span>
                        {versao.publicada && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            PUBLICADA
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          {formatarData(versao.timestamp)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 mb-1 font-medium">
                        {versao.descricao || 'Sem descrição'}
                      </p>

                      <p className="text-xs text-gray-500">
                        Autor: {versao.autor || 'Sistema'}
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handleRestore(versao.numero)}
                        disabled={loading || restoring !== null}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${restoring === versao.numero
                          ? 'bg-purple-200 text-purple-900 cursor-wait'
                          : 'text-purple-600 bg-purple-50 hover:bg-purple-100 active:bg-purple-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {restoring === versao.numero ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                            Restaurando...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4" />
                            Restaurar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
            <p>
              <strong>Dica:</strong> Ao restaurar uma versão, a versão atual será salva automaticamente
              antes da restauração, garantindo que nada seja perdido.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalHistoricoVersoes;
