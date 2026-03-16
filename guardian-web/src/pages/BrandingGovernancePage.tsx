import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

type SystemMaintenanceSeverity = 'info' | 'warning' | 'critical';
type BrandingAssetKind = 'logo-full' | 'logo-full-light' | 'logo-icon' | 'loading-logo' | 'favicon';
type BrandingFormAssetField =
  | 'logoFullUrl'
  | 'logoFullLightUrl'
  | 'logoIconUrl'
  | 'loadingLogoUrl'
  | 'faviconUrl';

type BrandingAdminData = {
  logoFullUrl: string | null;
  logoFullLightUrl: string | null;
  logoIconUrl: string | null;
  loadingLogoUrl: string | null;
  faviconUrl: string | null;
  maintenanceEnabled: boolean;
  maintenanceTitle: string | null;
  maintenanceMessage: string | null;
  maintenanceStartsAt: string | null;
  maintenanceExpectedEndAt: string | null;
  maintenanceSeverity: SystemMaintenanceSeverity;
};

type BrandingAdminResponse = {
  data?: BrandingAdminData;
  updatedAt?: string | null;
};

type BrandingAssetUploadResponse = {
  success?: boolean;
  message?: string;
  data?: {
    url?: string;
    branding?: BrandingAdminResponse;
  };
};

type BrandingFormState = {
  logoFullUrl: string;
  logoFullLightUrl: string;
  logoIconUrl: string;
  loadingLogoUrl: string;
  faviconUrl: string;
  maintenanceEnabled: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
  maintenanceStartsAt: string;
  maintenanceExpectedEndAt: string;
  maintenanceSeverity: SystemMaintenanceSeverity;
};

type BrandingAssetConfig = {
  kind: BrandingAssetKind;
  field: BrandingFormAssetField;
  label: string;
  placeholder: string;
  accept: string;
};

const BRANDING_ASSET_CONFIGS: BrandingAssetConfig[] = [
  {
    kind: 'logo-full',
    field: 'logoFullUrl',
    label: 'Logo principal (escura)',
    placeholder: '/uploads/system-branding/logo-full.png',
    accept: 'image/png,image/jpeg,image/webp,image/svg+xml',
  },
  {
    kind: 'logo-full-light',
    field: 'logoFullLightUrl',
    label: 'Logo principal (clara)',
    placeholder: '/uploads/system-branding/logo-full-light.png',
    accept: 'image/png,image/jpeg,image/webp,image/svg+xml',
  },
  {
    kind: 'logo-icon',
    field: 'logoIconUrl',
    label: 'Logo icone',
    placeholder: '/uploads/system-branding/logo-icon.png',
    accept: 'image/png,image/jpeg,image/webp,image/svg+xml',
  },
  {
    kind: 'loading-logo',
    field: 'loadingLogoUrl',
    label: 'Logo de carregamento',
    placeholder: '/uploads/system-branding/loading-logo.png',
    accept: 'image/png,image/jpeg,image/webp,image/svg+xml',
  },
  {
    kind: 'favicon',
    field: 'faviconUrl',
    label: 'Favicon',
    placeholder: '/uploads/system-branding/favicon.ico',
    accept: 'image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon',
  },
];

const createEmptyFormState = (): BrandingFormState => ({
  logoFullUrl: '',
  logoFullLightUrl: '',
  logoIconUrl: '',
  loadingLogoUrl: '',
  faviconUrl: '',
  maintenanceEnabled: false,
  maintenanceTitle: '',
  maintenanceMessage: '',
  maintenanceStartsAt: '',
  maintenanceExpectedEndAt: '',
  maintenanceSeverity: 'warning',
});

const parseErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    if (Array.isArray(message) && message.length > 0) {
      return String(message[0]);
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

const toDateTimeLocalValue = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toIsoOrNull = (value: string): string | null => {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
};

const toNullableTrimmed = (value: string): string | null => {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

export const BrandingGovernancePage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<BrandingAssetKind | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Partial<Record<BrandingAssetKind, File>>>({});
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [form, setForm] = useState<BrandingFormState>(() => createEmptyFormState());

  const updateAssetField = useCallback((field: BrandingFormAssetField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<BrandingAdminResponse>('/admin/system-branding');
      const data = response.data?.data;
      setForm({
        logoFullUrl: data?.logoFullUrl ?? '',
        logoFullLightUrl: data?.logoFullLightUrl ?? '',
        logoIconUrl: data?.logoIconUrl ?? '',
        loadingLogoUrl: data?.loadingLogoUrl ?? '',
        faviconUrl: data?.faviconUrl ?? '',
        maintenanceEnabled: Boolean(data?.maintenanceEnabled),
        maintenanceTitle: data?.maintenanceTitle ?? '',
        maintenanceMessage: data?.maintenanceMessage ?? '',
        maintenanceStartsAt: toDateTimeLocalValue(data?.maintenanceStartsAt),
        maintenanceExpectedEndAt: toDateTimeLocalValue(data?.maintenanceExpectedEndAt),
        maintenanceSeverity: data?.maintenanceSeverity ?? 'warning',
      });
      setUpdatedAt(response.data?.updatedAt ?? null);
    } catch (loadError) {
      setError(parseErrorMessage(loadError, 'Falha ao carregar configuracoes de branding.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const updatedAtLabel = useMemo(() => {
    if (!updatedAt) {
      return 'Sem atualizacao registrada';
    }

    const date = new Date(updatedAt);
    if (Number.isNaN(date.getTime())) {
      return 'Sem atualizacao registrada';
    }

    return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }, [updatedAt]);

  const handleFileSelection = useCallback(
    (kind: BrandingAssetKind, nextFile?: File) => {
      setSelectedFiles((current) => ({ ...current, [kind]: nextFile }));
    },
    [],
  );

  const handleUploadAsset = useCallback(
    async (asset: BrandingAssetConfig) => {
      const file = selectedFiles[asset.kind];
      if (!file) {
        setError(`Selecione um arquivo para ${asset.label}.`);
        return;
      }

      setUploadingKind(asset.kind);
      setError(null);
      setFeedback(null);

      try {
        const payload = new FormData();
        payload.append('file', file);

        const response = await api.post<BrandingAssetUploadResponse>(
          `/admin/system-branding/assets/${asset.kind}`,
          payload,
        );

        const uploadedUrl = response.data?.data?.url;
        const fallbackUrl = response.data?.data?.branding?.data?.[asset.field] ?? '';
        const resolvedUrl =
          typeof uploadedUrl === 'string' && uploadedUrl.trim().length > 0
            ? uploadedUrl
            : fallbackUrl;

        if (resolvedUrl) {
          updateAssetField(asset.field, resolvedUrl);
        }

        setSelectedFiles((current) => ({ ...current, [asset.kind]: undefined }));
        setFeedback(response.data?.message || `${asset.label} enviado com sucesso.`);
        await loadData();
      } catch (uploadError) {
        setError(parseErrorMessage(uploadError, `Falha ao enviar arquivo para ${asset.label}.`));
      } finally {
        setUploadingKind(null);
      }
    },
    [loadData, selectedFiles, updateAssetField],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    setFeedback(null);

    try {
      await api.put('/admin/system-branding', {
        logoFullUrl: toNullableTrimmed(form.logoFullUrl),
        logoFullLightUrl: toNullableTrimmed(form.logoFullLightUrl),
        logoIconUrl: toNullableTrimmed(form.logoIconUrl),
        loadingLogoUrl: toNullableTrimmed(form.loadingLogoUrl),
        faviconUrl: toNullableTrimmed(form.faviconUrl),
        maintenanceEnabled: form.maintenanceEnabled,
        maintenanceTitle: toNullableTrimmed(form.maintenanceTitle),
        maintenanceMessage: toNullableTrimmed(form.maintenanceMessage),
        maintenanceStartsAt: toIsoOrNull(form.maintenanceStartsAt),
        maintenanceExpectedEndAt: toIsoOrNull(form.maintenanceExpectedEndAt),
        maintenanceSeverity: form.maintenanceSeverity,
      });

      setFeedback('Branding global atualizado com sucesso.');
      await loadData();
    } catch (saveError) {
      setError(parseErrorMessage(saveError, 'Falha ao salvar configuracoes de branding.'));
    } finally {
      setSaving(false);
    }
  }, [form, loadData]);

  const isBusy = saving || uploadingKind !== null;

  return (
    <div className="page-grid">
      <section className="card dashboard-span-full">
        <h2>Branding global do sistema</h2>
        <p className="subtle">
          Configuracao central de logos, favicon e banner de manutencao exibido no app principal.
        </p>
        <p className="subtle-inline">Ultima atualizacao: {updatedAtLabel}</p>

        {loading ? (
          <p className="subtle">Carregando configuracoes...</p>
        ) : (
          <>
            <div className="plan-editor-shell">
              <h3>Assets visuais</h3>
              <p className="subtle">
                Envie arquivos para armazenar no servidor ou mantenha uma URL externa se preferir.
              </p>
              <div className="branding-asset-grid">
                {BRANDING_ASSET_CONFIGS.map((asset) => (
                  <div key={asset.kind} className="branding-asset-card">
                    <label>
                      {asset.label}
                      <input
                        type="text"
                        value={form[asset.field]}
                        onChange={(event) => updateAssetField(asset.field, event.target.value)}
                        placeholder={asset.placeholder}
                        disabled={isBusy}
                      />
                    </label>
                    <label>
                      Arquivo local
                      <input
                        type="file"
                        accept={asset.accept}
                        onChange={(event) =>
                          handleFileSelection(asset.kind, event.target.files?.[0] || undefined)
                        }
                        disabled={isBusy}
                      />
                    </label>
                    <div className="inline-actions">
                      <button
                        type="button"
                        className="button secondary tiny"
                        onClick={() => void handleUploadAsset(asset)}
                        disabled={isBusy || !selectedFiles[asset.kind]}
                      >
                        {uploadingKind === asset.kind ? 'Enviando...' : 'Enviar arquivo'}
                      </button>
                    </div>
                    <small className="subtle-inline">
                      {selectedFiles[asset.kind]
                        ? `Selecionado: ${selectedFiles[asset.kind]?.name}`
                        : 'Nenhum arquivo selecionado'}
                    </small>
                  </div>
                ))}
              </div>
            </div>

            <div className="plan-editor-shell">
              <h3>Banner de manutencao</h3>
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={form.maintenanceEnabled}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, maintenanceEnabled: event.target.checked }))
                  }
                  disabled={isBusy}
                />
                Exibir banner para todos os usuarios
              </label>
              <div className="plan-form-grid">
                <label>
                  Titulo
                  <input
                    type="text"
                    value={form.maintenanceTitle}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, maintenanceTitle: event.target.value }))
                    }
                    placeholder="Manutencao programada"
                    disabled={isBusy}
                  />
                </label>
                <label>
                  Severidade
                  <select
                    value={form.maintenanceSeverity}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        maintenanceSeverity: event.target.value as SystemMaintenanceSeverity,
                      }))
                    }
                    disabled={isBusy}
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </label>
                <label>
                  Inicio previsto
                  <input
                    type="datetime-local"
                    value={form.maintenanceStartsAt}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, maintenanceStartsAt: event.target.value }))
                    }
                    disabled={isBusy}
                  />
                </label>
                <label>
                  Fim previsto
                  <input
                    type="datetime-local"
                    value={form.maintenanceExpectedEndAt}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        maintenanceExpectedEndAt: event.target.value,
                      }))
                    }
                    disabled={isBusy}
                  />
                </label>
              </div>
              <label>
                Mensagem
                <textarea
                  rows={4}
                  value={form.maintenanceMessage}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, maintenanceMessage: event.target.value }))
                  }
                  placeholder="O sistema pode apresentar instabilidade durante o deploy."
                  disabled={isBusy}
                />
              </label>
            </div>

            <div className="inline-actions">
              <button
                type="button"
                className="button primary"
                onClick={() => void handleSave()}
                disabled={isBusy}
              >
                {saving ? 'Salvando...' : 'Salvar branding'}
              </button>
              <button
                type="button"
                className="button ghost"
                onClick={() => void loadData()}
                disabled={isBusy}
              >
                Recarregar
              </button>
            </div>
          </>
        )}

        {feedback ? <p className="success-text">{feedback}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
      </section>
    </div>
  );
};
