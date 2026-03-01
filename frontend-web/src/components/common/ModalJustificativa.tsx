import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface ModalJustificativaProps {
  isOpen: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  minLength?: number;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (justificativa: string) => Promise<void> | void;
}

const ModalJustificativa: React.FC<ModalJustificativaProps> = ({
  isOpen,
  title,
  description,
  placeholder = 'Informe a justificativa...',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  minLength = 1,
  loading = false,
  onClose,
  onConfirm,
}) => {
  const [justificativa, setJustificativa] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setJustificativa('');
      setErro(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, loading, onClose]);

  const justificativaNormalizada = useMemo(() => justificativa.trim(), [justificativa]);
  const justificativaValida = justificativaNormalizada.length >= minLength;

  const handleConfirmar = async () => {
    if (!justificativaValida) {
      setErro(
        minLength > 1
          ? `A justificativa deve ter no minimo ${minLength} caracteres.`
          : 'Informe a justificativa.',
      );
      return;
    }

    setErro(null);

    try {
      await onConfirm(justificativaNormalizada);
    } catch (error) {
      const mensagem =
        error instanceof Error && error.message
          ? error.message
          : 'Nao foi possivel concluir esta acao.';
      setErro(mensagem);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0D1F2A]/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-[0_26px_55px_-30px_rgba(10,36,52,0.5)]">
        <div className="flex items-start justify-between border-b border-[#E2ECEF] px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF5E9] text-[#A86400]">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-[#173A4D]">{title}</h3>
              {description ? <p className="mt-1 text-sm text-[#5E7784]">{description}</p> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5E7784] transition hover:bg-[#F4F8FA] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-6 py-5">
          <label htmlFor="justificativa-financeiro" className="text-sm font-medium text-[#244455]">
            Justificativa
          </label>
          <textarea
            id="justificativa-financeiro"
            rows={5}
            value={justificativa}
            onChange={(event) => {
              setJustificativa(event.target.value);
              if (erro) {
                setErro(null);
              }
            }}
            placeholder={placeholder}
            disabled={loading}
            className="w-full resize-none rounded-xl border border-[#D4E2E7] bg-white px-3 py-2 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 disabled:cursor-not-allowed disabled:bg-[#F6FAFB]"
          />
          {erro ? <p className="text-xs font-medium text-[#B4233A]">{erro}</p> : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-[#E2ECEF] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-9 items-center rounded-lg border border-[#D4E2E7] bg-white px-4 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void handleConfirmar()}
            disabled={loading}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#C03449] px-4 text-sm font-medium text-white transition hover:bg-[#A32A3D] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalJustificativa;
