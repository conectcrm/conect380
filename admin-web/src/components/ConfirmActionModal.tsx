import { useEffect, useMemo, useState } from 'react';

type ConfirmActionModalProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  reasonRequired?: boolean;
  reasonPlaceholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  maxReasonLength?: number;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
};

export const ConfirmActionModal = ({
  open,
  title,
  subtitle,
  reasonRequired = false,
  reasonPlaceholder = 'Descreva o contexto da decisao administrativa',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
  maxReasonLength = 2000,
  onCancel,
  onConfirm,
}: ConfirmActionModalProps) => {
  const [reason, setReason] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReason('');
      setLocalError(null);
    }
  }, [open]);

  const normalizedReason = useMemo(() => reason.trim(), [reason]);

  if (!open) {
    return null;
  }

  const handleConfirm = () => {
    if (reasonRequired && !normalizedReason) {
      setLocalError('Motivo obrigatorio para esta acao.');
      return;
    }

    setLocalError(null);
    onConfirm(normalizedReason);
  };

  const handleCancel = () => {
    if (loading) {
      return;
    }
    onCancel();
  };

  return (
    <div className="modal-backdrop" onClick={handleCancel}>
      <section className="modal-card" onClick={(event) => event.stopPropagation()}>
        <h3>{title}</h3>
        {subtitle ? <p className="subtle">{subtitle}</p> : null}

        <label>
          Motivo {reasonRequired ? '(obrigatorio)' : '(opcional)'}
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={reasonPlaceholder}
            rows={4}
            maxLength={maxReasonLength}
            disabled={loading}
          />
        </label>

        {localError ? <p className="error-text compact">{localError}</p> : null}

        <div className="inline-actions modal-actions">
          <button type="button" className="button ghost" disabled={loading} onClick={handleCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="button primary"
            disabled={loading}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
};
