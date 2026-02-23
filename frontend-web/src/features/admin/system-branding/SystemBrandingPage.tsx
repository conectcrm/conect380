import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BackToNucleus } from '../../../components/navigation/BackToNucleus';
import Conect360Logo from '../../../components/ui/Conect360Logo';
import { systemBrandingUrlResolver, useSystemBranding } from '../../../contexts/SystemBrandingContext';
import systemBrandingService, {
  type SystemBrandingAdminData,
  type SystemBrandingEffectiveConfig,
} from '../../../services/systemBrandingService';
import { getErrorMessage } from '../../../utils/errorHandling';

type BrandingField = keyof SystemBrandingAdminData;

interface BrandingFieldMeta {
  field: BrandingField;
  label: string;
  helpText: string;
  maxDimension: number;
}

const BRANDING_FIELDS: BrandingFieldMeta[] = [
  {
    field: 'logoFullUrl',
    label: 'Logo principal (fundo claro)',
    helpText:
      'Usada no header, sidebar expandida e login mobile. Se a logo de fundo escuro ficar vazia, esta será usada no login desktop.',
    maxDimension: 1800,
  },
  {
    field: 'logoFullLightUrl',
    label: 'Logo para fundo escuro (Login desktop)',
    helpText: 'Versão recomendada para a coluna escura da tela de login.',
    maxDimension: 1800,
  },
  {
    field: 'logoIconUrl',
    label: 'Logo ícone',
    helpText: 'Usada no menu colapsado, favicon fallback e notificações.',
    maxDimension: 800,
  },
  {
    field: 'loadingLogoUrl',
    label: 'Logo do loading inicial',
    helpText:
      'Usada na tela de carregamento inicial do sistema (antes das rotas renderizarem). Se ficar vazia, usa a Logo ícone como fallback.',
    maxDimension: 800,
  },
  {
    field: 'faviconUrl',
    label: 'Favicon',
    helpText: 'Ícone da aba do navegador (aceita PNG, SVG e ICO).',
    maxDimension: 256,
  },
];

const EMPTY_FORM: SystemBrandingAdminData = {
  logoFullUrl: null,
  logoFullLightUrl: null,
  logoIconUrl: null,
  loadingLogoUrl: null,
  faviconUrl: null,
};

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });

const processImageFile = async (file: File, maxDimension: number): Promise<string> => {
  if (file.type === 'image/svg+xml') {
    return readAsDataUrl(file);
  }

  const dataUrl = await readAsDataUrl(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível carregar a imagem selecionada.'));
    img.src = dataUrl;
  });

  const scaleFactor = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scaleFactor));
  const height = Math.max(1, Math.round(image.height * scaleFactor));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Não foi possível processar a imagem.');
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/png', 0.92);
};

const formatUpdatedAt = (value: string | null): string => {
  if (!value) {
    return 'Ainda não configurado';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Atualizado recentemente';
  }

  return parsed.toLocaleString('pt-BR');
};

const SystemBrandingPage: React.FC = () => {
  const { refreshBranding } = useSystemBranding();

  const [formData, setFormData] = useState<SystemBrandingAdminData>(EMPTY_FORM);
  const [effectiveData, setEffectiveData] = useState<SystemBrandingEffectiveConfig | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingField, setUploadingField] = useState<BrandingField | null>(null);

  const loadBranding = useCallback(async () => {
    setLoading(true);
    try {
      const response = await systemBrandingService.getAdminBranding();
      setFormData(response.data);
      setEffectiveData(response.effective);
      setUpdatedAt(response.updatedAt);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível carregar o branding global.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBranding();
  }, [loadBranding]);

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: BrandingField,
    maxDimension: number,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem válido.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 10MB.');
      return;
    }

    setUploadingField(field);
    try {
      const processedImage = await processImageFile(file, maxDimension);
      setFormData((current) => ({
        ...current,
        [field]: processedImage,
      }));
      toast.success('Imagem carregada com sucesso.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Falha ao processar a imagem.'));
    } finally {
      setUploadingField(null);
    }
  };

  const handleRemoveField = (field: BrandingField) => {
    setFormData((current) => ({
      ...current,
      [field]: null,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await systemBrandingService.updateBranding(formData);
      setFormData(response.data);
      setEffectiveData(response.effective);
      setUpdatedAt(response.updatedAt);
      await refreshBranding();
      toast.success('Branding global atualizado com sucesso.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível salvar o branding.'));
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    const confirmed = window.confirm(
      'Deseja restaurar o branding para o padrão original do sistema em todas as telas?',
    );
    if (!confirmed) {
      return;
    }

    setSaving(true);
    try {
      const response = await systemBrandingService.updateBranding({
        logoFullUrl: null,
        logoFullLightUrl: null,
        logoIconUrl: null,
        loadingLogoUrl: null,
        faviconUrl: null,
      });
      setFormData(response.data);
      setEffectiveData(response.effective);
      setUpdatedAt(response.updatedAt);
      await refreshBranding();
      toast.success('Branding padrão restaurado com sucesso.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível restaurar o branding padrão.'));
    } finally {
      setSaving(false);
    }
  };

  const resolvedPreviewData = useMemo(() => {
    if (!effectiveData) {
      return null;
    }

    return {
      logoFullUrl: formData.logoFullUrl || effectiveData.logoFullUrl,
      logoFullLightUrl: formData.logoFullLightUrl || effectiveData.logoFullLightUrl,
      logoIconUrl: formData.logoIconUrl || effectiveData.logoIconUrl,
      loadingLogoUrl: formData.loadingLogoUrl || effectiveData.loadingLogoUrl,
      faviconUrl: formData.faviconUrl || effectiveData.faviconUrl,
    };
  }, [effectiveData, formData]);

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <BackToNucleus nucleusName="Administração" nucleusPath="/nuclei/administracao" />

      <section className="rounded-2xl border border-[#D6E3E8] bg-white p-4 shadow-[0_24px_48px_-42px_rgba(6,35,52,0.55)] sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#002333] sm:text-3xl">
              Branding Global do Sistema
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-[#5B7482]">
              Defina aqui a identidade visual oficial do Conect para todo o sistema. As mudanças são
              aplicadas em login, sidebar, header e favicon para todas as propriedades.
            </p>
            <p className="mt-2 text-xs text-[#7E95A0]">
              Última atualização: <span className="font-semibold text-[#315567]">{formatUpdatedAt(updatedAt)}</span>
            </p>
          </div>

          <div className="flex w-full flex-wrap gap-2 md:w-auto md:justify-end">
            <button
              type="button"
              onClick={() => void loadBranding()}
              disabled={loading || saving}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#D4E3E7] bg-white px-4 py-2 text-sm font-semibold text-[#244759] hover:bg-[#F5FAFC] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
            >
              <RefreshCw className="h-4 w-4" />
              Recarregar
            </button>
            <button
              type="button"
              onClick={() => void handleResetToDefault()}
              disabled={loading || saving}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#F3D7DB] bg-white px-4 py-2 text-sm font-semibold text-[#AA3044] hover:bg-[#FFF5F7] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar padrão
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={loading || saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] px-4 py-2 text-sm font-semibold text-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar branding
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-[#D6E3E8] bg-white p-8 text-center sm:p-10">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#159A9C]" />
          <p className="mt-3 text-sm text-[#5B7482]">Carregando configuração de branding...</p>
        </div>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-2">
            {BRANDING_FIELDS.map((fieldMeta) => {
              const isUploading = uploadingField === fieldMeta.field;
              const hasCustomValue = Boolean(formData[fieldMeta.field]);
              const previewValue = resolvedPreviewData?.[fieldMeta.field];
              const inputId = `branding-upload-${fieldMeta.field}`;

              return (
                <article
                  key={fieldMeta.field}
                  className="rounded-2xl border border-[#D8E4E8] bg-white p-4 shadow-[0_20px_36px_-42px_rgba(7,36,51,0.7)] sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-[#0C2F42]">{fieldMeta.label}</h2>
                      <p className="mt-1 text-xs text-[#64808D]">{fieldMeta.helpText}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        hasCustomValue
                          ? 'bg-[#159A9C]/15 text-[#0F7B7D]'
                          : 'bg-[#E8EEF2] text-[#496372]'
                      }`}
                    >
                      {hasCustomValue ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Personalizada
                        </>
                      ) : (
                        'Padrão'
                      )}
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl border border-dashed border-[#D2E0E6] bg-[#F8FCFD] p-4">
                    {previewValue ? (
                      <img
                        src={systemBrandingUrlResolver(previewValue)}
                        alt={fieldMeta.label}
                        className="mx-auto max-h-24 w-auto object-contain"
                      />
                    ) : (
                      <div className="flex h-24 items-center justify-center text-[#7E95A0]">
                        <ImagePlus className="mr-2 h-4 w-4" />
                        Sem imagem configurada
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <input
                      id={inputId}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => void handleUpload(event, fieldMeta.field, fieldMeta.maxDimension)}
                    />
                    <label
                      htmlFor={inputId}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#D2E0E6] bg-white px-3 py-2 text-sm font-semibold text-[#234858] hover:bg-[#F5FAFC]"
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {isUploading ? 'Processando...' : 'Enviar imagem'}
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveField(fieldMeta.field)}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#F1D4D9] bg-white px-3 py-2 text-sm font-semibold text-[#AD3347] hover:bg-[#FFF5F7]"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="rounded-2xl border border-[#D8E4E8] bg-white p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-[#0C2F42]">Prévia rápida no sistema</h2>
            <p className="mt-1 text-sm text-[#64808D]">
              Esta seção simula os contextos mais comuns onde a marca aparece.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-[#D8E4E8] bg-[#F9FCFD] p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6C8793]">
                  Header / fundo claro
                </p>
                <Conect360Logo variant="full" size="lg" className="h-12 w-auto" />
              </div>

              <div className="rounded-xl border border-[#0F2E3F]/10 bg-[#0D3C55] p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#BFD7E3]">
                  Login / fundo escuro
                </p>
                <Conect360Logo variant="full-light" size="lg" className="h-14 w-auto" />
              </div>

              <div className="rounded-xl border border-[#D8E4E8] bg-[#F9FCFD] p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6C8793]">
                  Ícone / menu e aba
                </p>
                <div className="flex items-center gap-4">
                  <Conect360Logo variant="icon" size="md" className="h-10 w-10" />
                  {resolvedPreviewData?.faviconUrl ? (
                    <img
                      src={systemBrandingUrlResolver(resolvedPreviewData.faviconUrl)}
                      alt="Favicon"
                      className="h-8 w-8 rounded-md border border-[#D8E4E8] object-contain bg-white p-1"
                    />
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border border-[#D8E4E8] bg-[#F9FCFD] p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6C8793]">
                  Loading inicial
                </p>
                <div className="flex items-center gap-4">
                  <Conect360Logo variant="loading" size="md" className="h-10 w-10" />
                  <div className="text-sm font-medium text-[#0C2F42]">Carregando aplicação...</div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default SystemBrandingPage;

