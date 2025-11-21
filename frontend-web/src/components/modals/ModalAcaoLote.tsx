import React, { useState } from 'react';
import { CheckCircle, XCircle, X, AlertCircle } from 'lucide-react';

interface ModalAcaoLoteProps {
  tipo: 'aprovar' | 'reprovar';
  quantidadeCotacoes: number;
  onClose: () => void;
  onConfirmar: (justificativa?: string) => Promise<void>;
}

const ModalAcaoLote: React.FC<ModalAcaoLoteProps> = ({
  tipo,
  quantidadeCotacoes,
  onClose,
  onConfirmar,
}) => {
  const [justificativa, setJustificativa] = useState('');
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');

  const handleConfirmar = async () => {
    // Validar justificativa obrigatória para reprovação
    if (tipo === 'reprovar' && justificativa.trim().length < 10) {
      setErro('Justificativa deve ter no mínimo 10 caracteres para reprovação');
      return;
    }

    setErro('');
    setProcessando(true);

    try {
      await onConfirmar(justificativa || undefined);
      onClose();
    } catch (error: any) {
      setErro(error.message || 'Erro ao processar ação');
    } finally {
      setProcessando(false);
    }
  };

  const isAprovar = tipo === 'aprovar';
  const corPrincipal = isAprovar ? 'green' : 'red';
  const Icone = isAprovar ? CheckCircle : XCircle;
  const titulo = isAprovar
    ? `Aprovar ${quantidadeCotacoes} Cotação(ões)`
    : `Reprovar ${quantidadeCotacoes} Cotação(ões)`;
  const mensagem = isAprovar
    ? `Você está prestes a aprovar ${quantidadeCotacoes} cotação(ões) de uma vez.`
    : `Você está prestes a reprovar ${quantidadeCotacoes} cotação(ões) de uma vez.`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`px-6 py-4 border-b bg-${corPrincipal}-50 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${corPrincipal}-100`}>
              <Icone className={`h-6 w-6 text-${corPrincipal}-600`} />
            </div>
            <h2 className="text-xl font-bold text-[#002333]">{titulo}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={processando}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {/* Alerta */}
          <div className={`p-4 rounded-lg bg-${corPrincipal}-50 border border-${corPrincipal}-200 flex items-start gap-3`}>
            <AlertCircle className={`h-5 w-5 text-${corPrincipal}-600 flex-shrink-0 mt-0.5`} />
            <div>
              <p className="text-sm font-semibold text-[#002333] mb-1">
                Confirmação de Ação em Lote
              </p>
              <p className="text-sm text-gray-700">{mensagem}</p>
              {isAprovar && (
                <p className="text-xs text-gray-600 mt-2">
                  💡 Emails de notificação serão enviados para todas as cotações aprovadas.
                </p>
              )}
              {!isAprovar && (
                <p className="text-xs text-gray-600 mt-2">
                  ⚠️ Esta ação não pode ser desfeita e emails de notificação serão enviados.
                </p>
              )}
            </div>
          </div>

          {/* Campo de Justificativa */}
          <div>
            <label className="block text-sm font-semibold text-[#002333] mb-2">
              Justificativa {!isAprovar && <span className="text-red-600">*</span>}
              {isAprovar && <span className="text-gray-500 font-normal">(opcional)</span>}
            </label>
            <textarea
              value={justificativa}
              onChange={(e) => {
                setJustificativa(e.target.value);
                setErro('');
              }}
              placeholder={
                isAprovar
                  ? 'Descreva o motivo da aprovação (opcional)...'
                  : 'Descreva o motivo da reprovação (obrigatório, mínimo 10 caracteres)...'
              }
              rows={4}
              disabled={processando}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-${corPrincipal}-500 focus:border-${corPrincipal}-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none`}
            />
            <p className="text-xs text-gray-500 mt-1">
              {justificativa.length} / 1000 caracteres
            </p>
          </div>

          {/* Mensagem de Erro */}
          {erro && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{erro}</p>
            </div>
          )}

          {/* Estatísticas */}
          <div className="grid grid-cols-1 gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cotações selecionadas:</span>
              <span className="text-sm font-bold text-[#002333]">{quantidadeCotacoes}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Ação:</span>
              <span className={`text-sm font-bold text-${corPrincipal}-600`}>
                {isAprovar ? 'Aprovar todas' : 'Reprovar todas'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer com Botões */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={processando}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={processando || (!isAprovar && justificativa.trim().length < 10)}
            className={`px-6 py-2 bg-${corPrincipal}-600 text-white rounded-lg hover:bg-${corPrincipal}-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {processando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Processando...
              </>
            ) : (
              <>
                <Icone className="h-4 w-4" />
                {isAprovar ? `Aprovar ${quantidadeCotacoes}` : `Reprovar ${quantidadeCotacoes}`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAcaoLote;
