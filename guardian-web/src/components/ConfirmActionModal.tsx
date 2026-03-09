import { useEffect, useMemo, useState } from 'react';

export type ConfirmActionModalStatus = 'idle' | 'loading' | 'error' | 'success';

type ConfirmActionModalProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  reasonRequired?: boolean;
  reasonPlaceholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  closeLabel?: string;
  loading?: boolean;
  loadingLabel?: string;
  status?: ConfirmActionModalStatus;
  statusMessage?: string | null;
  maxReasonLength?: number;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
};

export const ConfirmActionModal = ({
  open,
  title,
  subtitle,
  reasonRequired = false,
  reasonPlaceholder = 'Descreva o contexto da decisao guardian',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  closeLabel = 'Fechar',
  loading = false,
  loadingLabel = 'Processando...',
  status,
  statusMessage,
  maxReasonLength = 2000,
  onCancel,
  onConfirm,
}: ConfirmActionModalProps) => {
  const [reason, setReason] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const resolvedStatus: ConfirmActionModalStatus = status ?? (loading ? 'loading' : 'idle');
  const isLoading = resolvedStatus === 'loading';
  const isSuccess = resolvedStatus === 'success';
  const resolvedStatusMessage =
    resolvedStatus === 'loading'
      ? statusMessage?.trim() || 'Processando acao e registrando auditoria guardian...'
      : statusMessage?.trim() || null;

  useEffect(() => {
    if (!open) {
      setReason('');
      setLocalError(null);
      return;
    }

    if (resolvedStatus !== 'error') {
      setLocalError(null);
    }
  }, [open, resolvedStatus]);

  const normalizedReason = useMemo(() => reason.trim(), [reason]);

  if (!open) {
    return null;
  }

  const handleConfirm = () => {
    if (isLoading || isSuccess) {
      return;
    }

    if (reasonRequired && !normalizedReason) {
      setLocalError('Motivo obrigatorio para esta acao.');
      return;
    }

    setLocalError(null);
    onConfirm(normalizedReason);
  };

  const handleCancel = () => {
    if (isLoading) {
      return;
    }
    onCancel();
  };

  return (
    <div className="modal-backdrop" onClick={handleCancel}>
      <section
        className="modal-card"
        data-status={resolvedStatus}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guardian-confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="guardian-confirm-title">{title}</h3>
        {subtitle ? <p className="subtle">{subtitle}</p> : null}

        {resolvedStatus !== 'idle' && resolvedStatusMessage ? (
          <div className={`modal-status ${resolvedStatus}`} aria-live="polite">
            <p>{resolvedStatusMessage}</p>
          </div>
        ) : null}

        {!isSuccess ? (
          <label>
            Motivo {reasonRequired ? '(obrigatorio)' : '(opcional)'}
            <textarea
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (localError) {
                  setLocalError(null);
                }
              }}
              placeholder={reasonPlaceholder}
              rows={4}
              maxLength={maxReasonLength}
              disabled={isLoading}
            />
          </label>
        ) : null}

        {localError ? <p className="error-text compact">{localError}</p> : null}

        {isSuccess ? (
          <div className="inline-actions modal-actions">
            <button type="button" className="button primary" onClick={handleCancel}>
              {closeLabel}
            </button>
          </div>
        ) : (
          <div className="inline-actions modal-actions">
            <button type="button" className="button ghost" disabled={isLoading} onClick={handleCancel}>
              {cancelLabel}
            </button>
            <button
              type="button"
              className="button primary"
              disabled={isLoading}
              onClick={handleConfirm}
            >
              {isLoading ? loadingLabel : confirmLabel}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
