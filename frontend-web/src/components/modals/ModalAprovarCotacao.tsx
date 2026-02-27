import React, { useEffect, useRef, useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { Cotacao } from '../../types/cotacaoTypes';
import { cotacaoService } from '../../services/cotacaoService';

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
  const [cotacaoDetalhada, setCotacaoDetalhada] = useState<Cotacao>(cotacao);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);
  const [erroDetalhes, setErroDetalhes] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const carregarDetalhes = async () => {
      setCotacaoDetalhada(cotacao);
      setErroDetalhes(null);
      setLoadingDetalhes(true);

      try {
        const response = await cotacaoService.buscarPorId(cotacao.id);
        if (!cancelled) {
          setCotacaoDetalhada(response);
        }
      } catch (err) {
        console.error('Erro ao carregar detalhes da cotacao para aprovacao:', err);
        if (!cancelled) {
          setErroDetalhes('Nao foi possivel carregar os itens completos desta cotacao.');
        }
      } finally {
        if (!cancelled) {
          setLoadingDetalhes(false);
        }
      }
    };

    void carregarDetalhes();

    return () => {
      cancelled = true;
    };
  }, [cotacao]);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, [cotacao.id]);

  useEffect(() => {
    if (acao) {
      textareaRef.current?.focus();
    }
  }, [acao]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!loading) {
          onClose();
        }
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('disabled'));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!active || !dialog.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
    };
  }, [loading, onClose]);

  const cotacaoExibida = cotacaoDetalhada ?? cotacao;
  const itensExibidos = Array.isArray(cotacaoExibida.itens) ? cotacaoExibida.itens : [];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value || 0));

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
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-[#0F172A]/35 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-aprovar-cotacao-title"
    >
      <div
        ref={dialogRef}
        className="flex max-h-[92vh] w-[calc(100%-2rem)] max-w-[960px] flex-col overflow-hidden rounded-2xl border border-[#DCE8EC] bg-white shadow-[0_24px_70px_-28px_rgba(15,57,74,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between border-b border-[#DCE8EC] bg-white px-5 py-4 sm:px-6">
          <h2 id="modal-aprovar-cotacao-title" className="text-xl font-bold text-[#002333] sm:text-2xl">
            Avaliar Cotação
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-[#DEEFE7]"
            disabled={loading}
            type="button"
            aria-label="Fechar"
          >
            <X className="h-6 w-6 text-[#002333]" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-4 bg-[#DEEFE7]/30 px-5 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-[#002333]/60">Número</p>
                <p className="text-base font-bold text-[#002333]">{cotacaoExibida.numero}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#002333]/60">Fornecedor</p>
                <p className="text-base font-semibold text-[#002333]">
                  {cotacaoExibida.fornecedor?.nome || 'N/A'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-[#002333]/60">Título</p>
              <p className="text-base font-semibold text-[#002333]">{cotacaoExibida.titulo}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-[#002333]/60">Valor Total</p>
              <p className="text-2xl font-bold text-[#159A9C]">
                {formatCurrency(cotacaoExibida.valorTotal)}
              </p>
            </div>
          </div>

          <div className="px-5 pb-4 pt-5 sm:px-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#002333]">Itens da cotação</h3>
              <span className="text-sm text-[#002333]/60">
                {loadingDetalhes ? 'Carregando...' : `${itensExibidos.length} item(ns)`}
              </span>
            </div>

            {erroDetalhes && (
              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-amber-700">{erroDetalhes}</p>
              </div>
            )}

            {loadingDetalhes ? (
              <div className="space-y-2">
                {[1, 2].map((idx) => (
                  <div
                    key={idx}
                    className="h-16 animate-pulse rounded-xl border border-[#E3EDF0] bg-[#F7FBFC]"
                  />
                ))}
              </div>
            ) : itensExibidos.length > 0 ? (
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {itensExibidos.map((item, index) => (
                  <div
                    key={item.id || `${index}-${item.descricao}`}
                    className="rounded-xl border border-[#E3EDF0] bg-white p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#002333]">{item.descricao}</p>
                        <p className="mt-1 text-sm text-[#002333]/70">
                          {Number(item.quantidade || 0)} {item.unidade || 'un'} x{' '}
                          {formatCurrency(item.valorUnitario)}
                        </p>
                        {item.observacoes && (
                          <p className="mt-1 text-xs text-[#002333]/60">{item.observacoes}</p>
                        )}
                      </div>
                      <p className="shrink-0 text-sm font-bold text-[#159A9C]">
                        {formatCurrency(item.valorTotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-[#E3EDF0] bg-[#F8FBFC] p-3">
                <p className="text-sm text-[#355563]">
                  Nenhum item foi carregado. Revise os detalhes antes de aprovar ou reprovar.
                </p>
              </div>
            )}
          </div>

          {!acao && (
            <div className="space-y-4 px-5 pb-6 pt-2 sm:px-6">
              <p className="font-medium text-[#002333]">Escolha uma ação para esta cotação:</p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <button
                  onClick={() => setAcao('aprovar')}
                  className="group rounded-xl border-2 border-green-200 p-6 transition-all hover:border-green-400 hover:bg-green-50"
                  type="button"
                >
                  <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-600 transition-transform group-hover:scale-110" />
                  <p className="text-lg font-bold text-[#002333]">Aprovar</p>
                  <p className="mt-1 text-sm text-[#002333]/60">Autorizar esta cotação</p>
                </button>

                <button
                  onClick={() => setAcao('reprovar')}
                  className="group rounded-xl border-2 border-red-200 p-6 transition-all hover:border-red-400 hover:bg-red-50"
                  type="button"
                >
                  <XCircle className="mx-auto mb-3 h-12 w-12 text-red-600 transition-transform group-hover:scale-110" />
                  <p className="text-lg font-bold text-[#002333]">Reprovar</p>
                  <p className="mt-1 text-sm text-[#002333]/60">Rejeitar esta cotação</p>
                </button>
              </div>
            </div>
          )}

          {acao && (
            <div className="space-y-4 px-5 pb-6 pt-2 sm:px-6">
              <div className="mb-4 flex items-center gap-3">
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
                <label className="mb-2 block text-sm font-medium text-[#002333]">
                  Justificativa {acao === 'reprovar' && <span className="text-red-600">*</span>}
                </label>
                <textarea
                  ref={textareaRef}
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  placeholder={
                    acao === 'aprovar'
                      ? 'Comentários adicionais (opcional)'
                      : 'Descreva o motivo da reprovação (obrigatório)'
                  }
                  className="w-full resize-none rounded-lg border border-[#B4BEC9] px-4 py-3 text-[#002333] focus:border-transparent focus:ring-2 focus:ring-[#159A9C]"
                  rows={5}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {acao && (
          <div className="shrink-0 border-t border-[#E1EAEE] bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-6">
            <div className="flex gap-3">
              <button
                onClick={() => setAcao(null)}
                className="flex-1 rounded-lg border border-[#B4BEC9] bg-white px-4 py-2 font-medium text-[#002333] transition-colors hover:bg-gray-50"
                disabled={loading}
                type="button"
              >
                Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || (acao === 'reprovar' && !justificativa.trim())}
                type="button"
                className={`flex-1 rounded-lg px-4 py-2 font-medium text-white transition-colors disabled:cursor-not-allowed ${
                  acao === 'aprovar'
                    ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-300'
                    : 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
                }`}
              >
                {loading
                  ? 'Processando...'
                  : `Confirmar ${acao === 'aprovar' ? 'Aprovação' : 'Reprovação'}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalAprovarCotacao;
