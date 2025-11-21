import React, { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { Cotacao } from '../../types/cotacaoTypes';

interface ModalAprovarCotacaoProps {
  cotacao: Cotacao;
  onClose: () => void;
  onAprovar: (justificativa?: string) => Promise<void>;
  onReprovar: (justificativa: string) => Promise<void>;
}

const ModalAprovarCotacao: React.FC<ModalAprovarCotacaoProps> = ({
  cotacao,
  onClose,
  onAprovar,
  onReprovar,
}) => {
  const [acao, setAcao] = useState<'aprovar' | 'reprovar' | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (acao === 'reprovar' && !justificativa.trim()) {
        setError('Justificativa é obrigatória para reprovar');
        return;
      }

      if (acao === 'aprovar') {
        await onAprovar(justificativa.trim() || undefined);
      } else if (acao === 'reprovar') {
        await onReprovar(justificativa.trim());
      }

      onClose();
    } catch (err: unknown) {
      console.error('Erro ao processar aprovação:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar aprovação';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#DEEFE7]">
          <h2 className="text-2xl font-bold text-[#002333]">
            Avaliar Cotação
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#DEEFE7] rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-6 w-6 text-[#002333]" />
          </button>
        </div>

        {/* Informações da Cotação */}
        <div className="p-6 space-y-4 bg-[#DEEFE7]/30">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[#002333]/60 font-medium">Número</p>
              <p className="text-base font-bold text-[#002333]">{cotacao.numero}</p>
            </div>
            <div>
              <p className="text-sm text-[#002333]/60 font-medium">Fornecedor</p>
              <p className="text-base font-semibold text-[#002333]">
                {cotacao.fornecedor?.nome || 'N/A'}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-[#002333]/60 font-medium">Título</p>
            <p className="text-base font-semibold text-[#002333]">{cotacao.titulo}</p>
          </div>

          <div>
            <p className="text-sm text-[#002333]/60 font-medium">Valor Total</p>
            <p className="text-2xl font-bold text-[#159A9C]">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(cotacao.valorTotal)}
            </p>
          </div>
        </div>

        {/* Ações */}
        {!acao && (
          <div className="p-6 space-y-4">
            <p className="text-[#002333] font-medium">
              Escolha uma ação para esta cotação:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setAcao('aprovar')}
                className="p-6 border-2 border-green-200 rounded-xl hover:bg-green-50 hover:border-green-400 transition-all group"
              >
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-lg font-bold text-[#002333]">Aprovar</p>
                <p className="text-sm text-[#002333]/60 mt-1">
                  Autorizar esta cotação
                </p>
              </button>

              <button
                onClick={() => setAcao('reprovar')}
                className="p-6 border-2 border-red-200 rounded-xl hover:bg-red-50 hover:border-red-400 transition-all group"
              >
                <XCircle className="h-12 w-12 text-red-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-lg font-bold text-[#002333]">Reprovar</p>
                <p className="text-sm text-[#002333]/60 mt-1">
                  Rejeitar esta cotação
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Formulário de Justificativa */}
        {acao && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              {acao === 'aprovar' ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <h3 className="text-lg font-bold text-[#002333]">
                {acao === 'aprovar' ? 'Aprovar Cotação' : 'Reprovar Cotação'}
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#002333] mb-2">
                Justificativa {acao === 'reprovar' && <span className="text-red-600">*</span>}
              </label>
              <textarea
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder={
                  acao === 'aprovar'
                    ? 'Comentários adicionais (opcional)'
                    : 'Descreva o motivo da reprovação (obrigatório)'
                }
                className="w-full px-4 py-3 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent resize-none text-[#002333]"
                rows={5}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setAcao(null)}
                className="flex-1 px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={loading}
              >
                Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || (acao === 'reprovar' && !justificativa.trim())}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${acao === 'aprovar'
                    ? 'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300'
                    : 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300'
                  } disabled:cursor-not-allowed`}
              >
                {loading ? 'Processando...' : `Confirmar ${acao === 'aprovar' ? 'Aprovação' : 'Reprovação'}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalAprovarCotacao;
