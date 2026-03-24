import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Settings,
  Save,
  RotateCcw,
  Info,
  Shield,
  Users,
  Mail,
  Building2,
  Send,
  CheckCircle,
  XCircle,
  Upload,
  X,
  ImageIcon,
  FileText,
} from 'lucide-react';
import { LoadingSkeleton, PageHeader, SectionCard } from '../../components/layout-v2';
import { ConfiguracoesEmpresa, empresaConfigService } from '../../services/empresaConfigService';
import { oportunidadesService } from '../../services/oportunidadesService';
import { empresaService, EmpresaResponse } from '../../services/empresaService';
import { useAuth } from '../../hooks/useAuth';
import { useGlobalConfirmation } from '../../contexts/GlobalConfirmationContext';
import { userHasPermission } from '../../config/menuConfig';
import { toastService } from '../../services/toastService';
import { SalesFeatureFlagsDecision } from '../../types/oportunidades/index';
import {
  DocumentoFiscalConectividadeDiagnostico,
  DocumentoFiscalConfiguracaoDiagnostico,
  DocumentoFiscalPreflightDiagnostico,
  faturamentoService,
} from '../../services/faturamentoService';

const EMPRESA_CONFIG_TABS = [
  { id: 'geral', label: 'Geral', icon: Settings },
  { id: 'seguranca', label: 'Segurança', icon: Shield },
  { id: 'usuarios', label: 'Usuários e Permissões', icon: Users },
  { id: 'email', label: 'Email/SMTP', icon: Mail },
  { id: 'fiscal', label: 'Fiscal', icon: FileText },
] as const;

type EmpresaConfigTabId = (typeof EMPRESA_CONFIG_TABS)[number]['id'];

type SalesFeatureFlagsForm = {
  pipelineDraftWithoutPlaceholder: boolean;
  opportunityPreliminaryItems: boolean;
  strictPropostaTransitions: boolean;
  discountPolicyPerTenant: boolean;
};

const DEFAULT_SALES_FEATURE_FLAGS_FORM: SalesFeatureFlagsForm = {
  pipelineDraftWithoutPlaceholder: true,
  opportunityPreliminaryItems: true,
  strictPropostaTransitions: true,
  discountPolicyPerTenant: true,
};

const mapSalesFeatureFlagsDecisionToForm = (
  decision?: SalesFeatureFlagsDecision | null,
): SalesFeatureFlagsForm => ({
  pipelineDraftWithoutPlaceholder: Boolean(decision?.pipelineDraftWithoutPlaceholder?.enabled),
  opportunityPreliminaryItems: Boolean(decision?.opportunityPreliminaryItems?.enabled),
  strictPropostaTransitions: Boolean(decision?.strictPropostaTransitions?.enabled),
  discountPolicyPerTenant: Boolean(decision?.discountPolicyPerTenant?.enabled),
});

const isValidEmpresaConfigTab = (tab: string | null): tab is EmpresaConfigTabId =>
  Boolean(tab && EMPRESA_CONFIG_TABS.some((item) => item.id === tab));

const ConfiguracaoEmpresaPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { confirm } = useGlobalConfirmation();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<EmpresaConfigTabId>('geral');
  const [config, setConfig] = useState<ConfiguracoesEmpresa | null>(null);
  const [empresa, setEmpresa] = useState<EmpresaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState<Partial<ConfiguracoesEmpresa>>({});
  const [salesFlagsForm, setSalesFlagsForm] = useState<SalesFeatureFlagsForm>(
    DEFAULT_SALES_FEATURE_FLAGS_FORM,
  );
  const [salesFlagsLoaded, setSalesFlagsLoaded] = useState(false);
  const [empresaData, setEmpresaData] = useState<Partial<EmpresaResponse>>({});
  const [testingSMTP, setTestingSMTP] = useState(false);
  const [smtpTestResult, setSMTPTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [fiscalConfigDiagnostico, setFiscalConfigDiagnostico] =
    useState<DocumentoFiscalConfiguracaoDiagnostico | null>(null);
  const [fiscalConectividadeDiagnostico, setFiscalConectividadeDiagnostico] =
    useState<DocumentoFiscalConectividadeDiagnostico | null>(null);
  const [fiscalPreflightDiagnostico, setFiscalPreflightDiagnostico] =
    useState<DocumentoFiscalPreflightDiagnostico | null>(null);
  const [fiscalDiagErro, setFiscalDiagErro] = useState<string | null>(null);
  const [showFiscalRecommendations, setShowFiscalRecommendations] = useState(false);
  const [loadingFiscalConfigDiagnostico, setLoadingFiscalConfigDiagnostico] = useState(false);
  const [testingFiscalConectividade, setTestingFiscalConectividade] = useState(false);
  const [runningFiscalPreflight, setRunningFiscalPreflight] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canUpdateConfig = userHasPermission(user, 'config.empresa.update');

  const extractErrorMessage = (err: unknown, fallback: string): string => {
    const responseData = (err as any)?.response?.data;
    const backendMessage = responseData?.message;
    if (Array.isArray(backendMessage)) {
      return backendMessage.join(', ');
    }
    if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
      return backendMessage;
    }
    if (err instanceof Error && err.message.trim().length > 0) {
      return err.message;
    }
    return fallback;
  };

  const carregarDiagnosticoConfigFiscal = async () => {
    try {
      setLoadingFiscalConfigDiagnostico(true);
      setFiscalDiagErro(null);
      setShowFiscalRecommendations(false);
      const diagnostico = await faturamentoService.obterDiagnosticoConfiguracaoFiscal();
      setFiscalConfigDiagnostico(diagnostico);
    } catch (err: unknown) {
      const message = extractErrorMessage(
        err,
        'Nao foi possivel carregar o diagnostico da configuracao fiscal.',
      );
      setFiscalDiagErro(message);
      toastService.error(message);
    } finally {
      setLoadingFiscalConfigDiagnostico(false);
    }
  };

  const testarConectividadeFiscal = async () => {
    try {
      setTestingFiscalConectividade(true);
      setFiscalDiagErro(null);
      const diagnostico = await faturamentoService.testarConectividadeFiscal();
      setFiscalConectividadeDiagnostico(diagnostico);
      toastService.success('Teste de conectividade fiscal concluido.');
    } catch (err: unknown) {
      const message = extractErrorMessage(
        err,
        'Nao foi possivel testar a conectividade fiscal.',
      );
      setFiscalDiagErro(message);
      toastService.error(message);
    } finally {
      setTestingFiscalConectividade(false);
    }
  };

  const executarPreflightFiscal = async () => {
    try {
      setRunningFiscalPreflight(true);
      setFiscalDiagErro(null);
      setShowFiscalRecommendations(false);
      const diagnostico = await faturamentoService.executarPreflightFiscal();
      setFiscalPreflightDiagnostico(diagnostico);
      setFiscalConfigDiagnostico(diagnostico.configuracao);
      setFiscalConectividadeDiagnostico(diagnostico.conectividade);

      if (diagnostico.status === 'ok') {
        toastService.success('Preflight fiscal concluido sem bloqueios.');
      } else if (diagnostico.status === 'alerta') {
        toastService.warning('Preflight fiscal concluido com alertas.');
      } else {
        toastService.error('Preflight fiscal identificou bloqueios de emissao oficial.');
      }
    } catch (err: unknown) {
      const message = extractErrorMessage(err, 'Nao foi possivel executar o preflight fiscal.');
      setFiscalDiagErro(message);
      toastService.error(message);
    } finally {
      setRunningFiscalPreflight(false);
    }
  };

  const handleTabChange = (tabId: EmpresaConfigTabId) => {
    setActiveTab(tabId);
    const nextParams = new URLSearchParams(searchParams);
    if (tabId === 'geral') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', tabId);
    }
    setSearchParams(nextParams, { replace: true });
  };

  // empresaId removido - backend pega do JWT automaticamente

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl === 'backup') {
      setActiveTab('seguranca');
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('tab', 'seguranca');
      setSearchParams(nextParams, { replace: true });
      return;
    }
    if (isValidEmpresaConfigTab(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [activeTab, searchParams, setSearchParams]);

  useEffect(() => {
    if (activeTab !== 'fiscal' || fiscalConfigDiagnostico || loadingFiscalConfigDiagnostico) {
      return;
    }
    void carregarDiagnosticoConfigFiscal();
  }, [activeTab, fiscalConfigDiagnostico, loadingFiscalConfigDiagnostico]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const empresaId = user?.empresa?.id;
    if (!empresaId) {
      setLoading(false);
      setError('Usuário não possui empresa associada');
      return;
    }

    void carregarConfig(empresaId);
  }, [authLoading, user?.empresa?.id]);

  const carregarConfig = async (empresaId: string) => {
    try {
      setLoading(true);
      setError(null);

      const [configData, empresaInfo, salesFeatureFlagsData] = await Promise.all([
        empresaConfigService.getConfig(),
        empresaService.obterEmpresaPorId(empresaId),
        oportunidadesService.obterSalesFeatureFlags().catch(() => null),
      ]);

      setConfig(configData);
      setFormData(configData);
      setEmpresa(empresaInfo);
      setEmpresaData(empresaInfo);
      if (salesFeatureFlagsData) {
        setSalesFlagsForm(mapSalesFeatureFlagsDecisionToForm(salesFeatureFlagsData));
        setSalesFlagsLoaded(true);
      } else {
        setSalesFlagsForm(DEFAULT_SALES_FEATURE_FLAGS_FORM);
        setSalesFlagsLoaded(false);
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ConfiguracoesEmpresa, value: any) => {
    if (!canUpdateConfig) {
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSalesFlagChange = (field: keyof SalesFeatureFlagsForm, value: boolean) => {
    if (!canUpdateConfig || !salesFlagsLoaded) {
      return;
    }

    setSalesFlagsForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleEmpresaInputChange = (field: keyof EmpresaResponse, value: any) => {
    if (!canUpdateConfig) {
      return;
    }
    setEmpresaData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!canUpdateConfig) {
      setError('Você não possui permissão para atualizar as configurações da empresa.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Pegar empresaId do usuario autenticado
      const empresaId = user?.empresa?.id;
      if (!empresaId) {
        throw new Error('Usuário não possui empresa associada');
      }

      if (process.env.NODE_ENV !== 'production') {
        console.debug('Enviando configurações da empresa (resumo):', {
          activeTab,
          hasLogo: Boolean(formData.logoUrl),
          emailsHabilitados: Boolean(formData.emailsHabilitados),
          smtpConfigurado: Boolean(formData.smtpUsuario && formData.smtpSenha),
        });
      }

      const updatedConfig = await empresaConfigService.updateConfig(formData);
      setConfig(updatedConfig);
      setFormData(updatedConfig);
      if (salesFlagsLoaded) {
        const updatedSalesFlags = await oportunidadesService.atualizarSalesFeatureFlags(
          salesFlagsForm,
        );
        setSalesFlagsForm(mapSalesFeatureFlagsDecisionToForm(updatedSalesFlags));
      }

      const updatedEmpresa = await empresaService.atualizarEmpresa(empresaId, empresaData);
      setEmpresa(updatedEmpresa);
      setEmpresaData(updatedEmpresa);

      setHasChanges(false);
      toastService.success('Configurações salvas com sucesso!');
    } catch (err: any) {
      console.error('Erro ao salvar:', err);

      // Extrair mensagem de erro detalhada do backend
      const errorMessage = err?.response?.data?.message;
      const detailedError = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage || err.message || 'Erro desconhecido ao salvar';

      setError(detailedError);
      toastService.error(`Erro ao salvar: ${detailedError}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!canUpdateConfig) {
      setError('Você não possui permissão para restaurar as configurações.');
      return;
    }

    if (
      !(await confirm(
        'Tem certeza que deseja restaurar todas as configurações para os valores padrão?',
      ))
    )
      return;
    try {
      setSaving(true);
      setError(null);
      // empresaId vem do JWT no backend
      const reset = await empresaConfigService.resetConfig();
      setConfig(reset);
      setFormData(reset);
      setFiscalConfigDiagnostico(null);
      setFiscalConectividadeDiagnostico(null);
      setFiscalPreflightDiagnostico(null);
      setFiscalDiagErro(null);
      if (salesFlagsLoaded) {
        const currentSalesFlags = await oportunidadesService.obterSalesFeatureFlags().catch(() => null);
        if (currentSalesFlags) {
          setSalesFlagsForm(mapSalesFeatureFlagsDecisionToForm(currentSalesFlags));
        }
      }
      setHasChanges(false);
      toastService.success('Configurações restauradas!');
    } catch (err: unknown) {
      console.error('Erro ao resetar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao resetar');
    } finally {
      setSaving(false);
    }
  };

  const canvasHasTransparency = (
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): boolean => {
    try {
      const imageData = context.getImageData(0, 0, width, height);
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] < 255) {
          return true;
        }
      }
    } catch {
      // Se o navegador bloquear leitura de pixels, usa fallback sem transparência.
      return false;
    }

    return false;
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Redimensionar para max 500x500 mantendo proporção
          const MAX_WIDTH = 500;
          const MAX_HEIGHT = 500;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          // Criar canvas para redimensionar
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Erro ao processar imagem'));
            return;
          }

          // Desenhar imagem redimensionada
          ctx.drawImage(img, 0, 0, width, height);

          // Converter para base64 preservando transparência quando necessário.
          const hasTransparency = canvasHasTransparency(ctx, width, height);
          const outputMimeType = hasTransparency ? 'image/png' : 'image/jpeg';
          const compressedBase64 = hasTransparency
            ? canvas.toDataURL(outputMimeType)
            : canvas.toDataURL(outputMimeType, 0.82);

          // Verificar tamanho final (base64 ~= 1.37x o tamanho em bytes)
          const sizeInBytes = (compressedBase64.length * 3) / 4;
          const sizeInKB = Math.round(sizeInBytes / 1024);

          console.log(
            `Imagem processada: ${sizeInKB}KB (${width}x${height}) [${hasTransparency ? 'PNG' : 'JPEG'}]`,
          );

          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Erro ao carregar imagem'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUpdateConfig) {
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toastService.warning('Selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho original (max 10MB antes da compressão)
    if (file.size > 10 * 1024 * 1024) {
      toastService.warning('A imagem deve ter no máximo 10MB.');
      return;
    }

    setUploadingLogo(true);

    try {
      // Comprimir e redimensionar imagem
      const compressedBase64 = await compressImage(file);

      // Atualizar preview e form
      setLogoPreview(compressedBase64);
      handleInputChange('logoUrl', compressedBase64);

      // Feedback visual
      const sizeInKB = Math.round((compressedBase64.length * 3) / 4 / 1024);
      console.log(`Logo processada com sucesso: ${sizeInKB}KB`);
    } catch (err) {
      console.error('Erro ao fazer upload da logo:', err);
      toastService.error('Erro ao processar a imagem. Tente novamente ou escolha outra imagem.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    if (!canUpdateConfig) {
      return;
    }

    setLogoPreview(null);
    handleInputChange('logoUrl', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTestSMTP = async () => {
    if (!canUpdateConfig) {
      return;
    }

    setTestingSMTP(true);
    setSMTPTestResult(null);

    try {
      const response = await empresaConfigService.testSMTP({
        servidorSMTP: formData.servidorSMTP,
        portaSMTP: formData.portaSMTP,
        smtpUsuario: formData.smtpUsuario,
        smtpSenha: formData.smtpSenha,
      });
      setSMTPTestResult(response);
    } catch (err: any) {
      console.error('Erro ao testar SMTP:', err);
      setSMTPTestResult({
        success: false,
        message:
          err?.response?.data?.message ||
          (err instanceof Error ? err.message : 'Erro ao testar conexão SMTP'),
      });
    } finally {
      setTestingSMTP(false);
    }
  };
  const canUploadLogo = canUpdateConfig && !uploadingLogo;
  const fiscalBlockers = fiscalPreflightDiagnostico?.blockers || fiscalConfigDiagnostico?.blockers || [];
  const fiscalWarnings = fiscalPreflightDiagnostico?.warnings || fiscalConfigDiagnostico?.warnings || [];
  const fiscalRecommendations =
    fiscalPreflightDiagnostico?.recommendations || fiscalConfigDiagnostico?.recommendations || [];
  const fiscalStatus: 'ok' | 'alerta' | 'bloqueio' | null = fiscalPreflightDiagnostico
    ? fiscalPreflightDiagnostico.status
    : fiscalConfigDiagnostico
      ? fiscalConfigDiagnostico.readyForOfficialEmission
        ? 'ok'
        : fiscalBlockers.length > 0
          ? 'bloqueio'
          : 'alerta'
      : null;
  const fiscalStatusLabel =
    fiscalStatus === 'ok'
      ? 'Pronto para emissao oficial'
      : fiscalStatus === 'bloqueio'
        ? 'Bloqueios de configuracao'
        : fiscalStatus === 'alerta'
          ? 'Configuracao com alertas'
          : 'Sem diagnostico executado';
  const fiscalStatusClasses =
    fiscalStatus === 'ok'
      ? 'border-green-200 bg-green-50 text-green-800'
      : fiscalStatus === 'bloqueio'
        ? 'border-red-200 bg-red-50 text-red-800'
        : fiscalStatus === 'alerta'
          ? 'border-amber-200 bg-amber-50 text-amber-800'
          : 'border-[#DCE6EA] bg-[#F8FBFC] text-[#355061]';
  const fiscalProviderEfetivo =
    fiscalPreflightDiagnostico?.providerEfetivo || fiscalConfigDiagnostico?.providerEfetivo || '';
  const fiscalProviderConfigurado = String(formData.fiscalProvider || '')
    .trim()
    .toLowerCase();
  const fiscalProviderPersonalizado =
    fiscalProviderConfigurado.length > 0 &&
    !['fiscal_oficial', 'fiscal_stub_local'].includes(fiscalProviderConfigurado);
  const fiscalProviderSelectValue = fiscalProviderPersonalizado
    ? '__custom__'
    : fiscalProviderConfigurado || '__fallback__';
  const fiscalRequireOfficialHabilitado = Boolean(formData.fiscalRequireOfficialProvider);
  const fiscalConflitoProviderStub =
    fiscalRequireOfficialHabilitado && fiscalProviderConfigurado === 'fiscal_stub_local';
  const fiscalDependenciaFallbackGlobal =
    fiscalRequireOfficialHabilitado && fiscalProviderConfigurado.length === 0;
  const fiscalProviderEfetivoNormalizado = String(fiscalProviderEfetivo || '')
    .trim()
    .toLowerCase();
  const fiscalProviderForaDeSincronia =
    fiscalProviderConfigurado.length > 0 &&
    fiscalProviderEfetivoNormalizado.length > 0 &&
    fiscalProviderConfigurado !== fiscalProviderEfetivoNormalizado;
  const fiscalConfigurationSources = fiscalConfigDiagnostico?.configurationSources;
  const fiscalGlobalFallbackFields = fiscalConfigDiagnostico?.globalFallbackFields || [];
  const fiscalUsingGlobalFallback = Boolean(
    fiscalConfigDiagnostico?.usingGlobalFallback ?? fiscalGlobalFallbackFields.length > 0,
  );
  const fiscalSourceLabel = (source?: string): string => {
    if (source === 'tenant') return 'empresa';
    if (source === 'env') return 'global';
    if (source === 'state') return 'estado';
    return 'padrao';
  };
  const fiscalFieldLabelMap: Record<string, string> = {
    provider: 'Provider',
    requireOfficialProvider: 'Exigir oficial',
    officialHttpEnabled: 'Integracao HTTP',
    officialBaseUrl: 'URL base',
    officialApiToken: 'Token API',
    officialWebhookSecret: 'Secret webhook',
    officialStrictResponse: 'Validacao estrita',
    webhookAllowInsecure: 'Webhook inseguro',
    officialCorrelationHeader: 'Header correlacao',
  };
  const fiscalGlobalFallbackSummary = fiscalGlobalFallbackFields
    .slice(0, 4)
    .map((field) => fiscalFieldLabelMap[field] || field)
    .join(', ');
  const fiscalGlobalFallbackSummaryText =
    fiscalGlobalFallbackSummary || 'configuracoes nao detalhadas';

  const formatarMensagemFiscal = (mensagem: string): string => {
    return String(mensagem || '')
      .replace(/FISCAL_PROVIDER/g, 'provider fiscal')
      .replace(/FISCAL_OFFICIAL_HTTP_ENABLED/g, 'integracao HTTP oficial')
      .replace(/FISCAL_OFFICIAL_BASE_URL/g, 'URL base oficial')
      .replace(/FISCAL_OFFICIAL_WEBHOOK_SECRET/g, 'segredo do webhook fiscal')
      .replace(/FISCAL_OFFICIAL_WEBHOOK_ALLOW_INSECURE/g, 'modo webhook inseguro')
      .replace(/FISCAL_OFFICIAL_STRICT_RESPONSE/g, 'validacao estrita de contrato');
  };

  const fiscalRecommendationsPreview = showFiscalRecommendations
    ? fiscalRecommendations
    : fiscalRecommendations.slice(0, 2);

  if (loading || authLoading) {
    return (
      <div className="space-y-4 pt-1 sm:pt-2">
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 pt-1 sm:pt-2">
      <SectionCard className="p-5">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-3">
              <Settings className="h-7 w-7 text-[#159A9C]" />
              <span>Configurações da Empresa</span>
            </span>
          }
          description="Gerencie todas as configurações do sistema"
          actions={
            hasChanges ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                <Info className="h-4 w-4 mr-1" />
                Alterações pendentes
              </span>
            ) : null
          }
        />
      </SectionCard>

      {error && (
        <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </div>
      )}

      {!canUpdateConfig && (
        <div className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          Você possui acesso somente leitura para as configurações da empresa.
        </div>
      )}

      <SectionCard className="overflow-hidden">
        <div className="border-b px-6 py-3">
          <div className="flex gap-4 overflow-x-auto">
            {EMPRESA_CONFIG_TABS.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id ? 'text-[#159A9C] border-b-2 border-[#159A9C]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <IconComponent className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
              {activeTab === 'geral' && (
                <div className="space-y-8">
                  {/* Seção 1: Informações da Empresa */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                      <Building2 className="h-5 w-5 text-[#159A9C]" />
                      <h3 className="text-lg font-semibold text-[#002333]">
                        Informações da Empresa
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome da Empresa
                        </label>
                        <input
                          type="text"
                          value={empresaData.nome || ''}
                          onChange={(e) => handleEmpresaInputChange('nome', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="Razão Social"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
                        <input
                          type="text"
                          value={empresaData.cnpj || ''}
                          onChange={(e) => handleEmpresaInputChange('cnpj', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="00.000.000/0000-00"
                          maxLength={18}
                        />
                        <p className="text-xs text-gray-500 mt-1">Formato: 00.000.000/0000-00</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Principal
                        </label>
                        <input
                          type="email"
                          value={empresaData.email || ''}
                          onChange={(e) => handleEmpresaInputChange('email', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="contato@empresa.com.br"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Telefone
                        </label>
                        <input
                          type="tel"
                          value={empresaData.telefone || ''}
                          onChange={(e) => handleEmpresaInputChange('telefone', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                        />
                        <p className="text-xs text-gray-500 mt-1">Formato: (00) 00000-0000</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Endereço Completo
                        </label>
                        <input
                          type="text"
                          value={empresaData.endereco || ''}
                          onChange={(e) => handleEmpresaInputChange('endereco', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="Rua, Número, Complemento, Bairro"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cidade
                        </label>
                        <input
                          type="text"
                          value={empresaData.cidade || ''}
                          onChange={(e) => handleEmpresaInputChange('cidade', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="Nome da cidade"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estado (UF)
                        </label>
                        <select
                          value={empresaData.estado || ''}
                          onChange={(e) => handleEmpresaInputChange('estado', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                        >
                          <option value="">Selecione...</option>
                          <option value="AC">Acre</option>
                          <option value="AL">Alagoas</option>
                          <option value="AP">Amapá</option>
                          <option value="AM">Amazonas</option>
                          <option value="BA">Bahia</option>
                          <option value="CE">Ceará</option>
                          <option value="DF">Distrito Federal</option>
                          <option value="ES">Espírito Santo</option>
                          <option value="GO">Goiás</option>
                          <option value="MA">Maranhão</option>
                          <option value="MT">Mato Grosso</option>
                          <option value="MS">Mato Grosso do Sul</option>
                          <option value="MG">Minas Gerais</option>
                          <option value="PA">Pará</option>
                          <option value="PB">Paraíba</option>
                          <option value="PR">Paraná</option>
                          <option value="PE">Pernambuco</option>
                          <option value="PI">Piauí</option>
                          <option value="RJ">Rio de Janeiro</option>
                          <option value="RN">Rio Grande do Norte</option>
                          <option value="RS">Rio Grande do Sul</option>
                          <option value="RO">Rondônia</option>
                          <option value="RR">Roraima</option>
                          <option value="SC">Santa Catarina</option>
                          <option value="SP">São Paulo</option>
                          <option value="SE">Sergipe</option>
                          <option value="TO">Tocantins</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                        <input
                          type="text"
                          value={empresaData.cep || ''}
                          onChange={(e) => handleEmpresaInputChange('cep', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="00000-000"
                          maxLength={9}
                        />
                        <p className="text-xs text-gray-500 mt-1">Formato: 00000-000</p>
                      </div>
                    </div>
                  </div>

                  {/* Seção 2: Identidade Visual */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                      <Settings className="h-5 w-5 text-[#159A9C]" />
                      <h3 className="text-lg font-semibold text-[#002333]">Identidade Visual</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Descrição
                        </label>
                        <textarea
                          value={formData.descricao || ''}
                          onChange={(e) => handleInputChange('descricao', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="Breve descrição sobre a empresa"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Site</label>
                        <input
                          type="url"
                          value={formData.site || ''}
                          onChange={(e) => handleInputChange('site', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="https://exemplo.com.br"
                        />
                      </div>

                      {/* Upload de Logo */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Logo da Empresa
                        </label>
                        <div className="flex items-start gap-6">
                          {/* Preview da Logo */}
                          <div className="flex-shrink-0">
                            {logoPreview || formData.logoUrl ? (
                              <div className="relative group">
                                <div className="w-32 h-32 bg-white rounded-lg border-2 border-gray-300 flex items-center justify-center overflow-hidden shadow-sm">
                                  <img
                                    src={logoPreview || formData.logoUrl || ''}
                                    alt="Logo da empresa"
                                    className="max-w-full max-h-full object-contain"
                                  />
                                </div>
                                <button
                                  onClick={handleRemoveLogo}
                                  disabled={!canUpdateConfig}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                                  title="Remover logo"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-32 h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <ImageIcon className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Upload Area */}
                          <div className="flex-1">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              disabled={!canUploadLogo}
                              className="hidden"
                              id="logo-upload"
                            />
                            <label
                              htmlFor={canUploadLogo ? 'logo-upload' : undefined}
                              className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                                canUploadLogo
                                  ? 'bg-[#159A9C] text-white hover:bg-[#0F7B7D] cursor-pointer'
                                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              }`}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {uploadingLogo ? 'Enviando...' : 'Fazer Upload'}
                            </label>
                            <p className="text-xs text-gray-500 mt-2">
                              ⬢ Formatos aceitos: JPG, PNG, SVG
                              <br />
                              ⬢ Tamanho máximo: 10MB (será otimizada automaticamente)
                              <br />
                              ⬢ Recomendado: Imagens quadradas (1:1)
                              <br />⬢ A imagem será redimensionada para 500x500px mantendo a
                              proporção
                            </p>
                            <div className="mt-3 p-3 bg-[#DEEFE7] rounded-lg border border-[#B4BEC9]">
                              <p className="text-xs text-[#002333]">
                                <Info className="h-3 w-3 inline mr-1" />
                                Esta logo aparecerá em propostas, relatórios e no portal do cliente.
                                A compressão automática garante carregamento rápido.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cor Primária
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={formData.corPrimaria || '#159A9C'}
                            onChange={(e) => handleInputChange('corPrimaria', e.target.value)}
                            className="h-12 w-20 border border-gray-300 rounded-lg cursor-pointer"
                          />
                          <div className="flex-1">
                            <input
                              type="text"
                              value={formData.corPrimaria || '#159A9C'}
                              onChange={(e) => handleInputChange('corPrimaria', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] font-mono text-sm"
                              placeholder="#159A9C"
                              pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                            />
                          </div>
                          <div
                            className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
                            style={{ backgroundColor: formData.corPrimaria || '#159A9C' }}
                            title="Preview da cor"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Cor principal usada em botões e destaques
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cor Secundária
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={formData.corSecundaria || '#002333'}
                            onChange={(e) => handleInputChange('corSecundaria', e.target.value)}
                            className="h-12 w-20 border border-gray-300 rounded-lg cursor-pointer"
                          />
                          <div className="flex-1">
                            <input
                              type="text"
                              value={formData.corSecundaria || '#002333'}
                              onChange={(e) => handleInputChange('corSecundaria', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] font-mono text-sm"
                              placeholder="#002333"
                              pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                            />
                          </div>
                          <div
                            className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
                            style={{ backgroundColor: formData.corSecundaria || '#002333' }}
                            title="Preview da cor"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Cor usada em textos e elementos secundários
                        </p>
                      </div>

                      {/* Preview de Branding */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Preview do Branding
                        </label>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border-2 border-gray-200">
                          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
                            {/* Cabeçalho com logo */}
                            <div className="flex items-center justify-between mb-4 pb-4 border-b">
                              {logoPreview || formData.logoUrl ? (
                                <div className="h-12 flex items-center">
                                  <img
                                    src={logoPreview || formData.logoUrl || ''}
                                    alt="Logo preview"
                                    className="max-h-12 w-auto object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="h-12 w-24 bg-gray-200 rounded flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                              <span className="text-xs text-gray-500 font-medium">Preview</span>
                            </div>

                            {/* Exemplo de botão com cor primária */}
                            <button
                              className="w-full px-4 py-2.5 text-white rounded-lg font-medium mb-3 transition-opacity hover:opacity-90 shadow-sm"
                              style={{ backgroundColor: formData.corPrimaria || '#159A9C' }}
                              disabled
                            >
                              Botão Primário
                            </button>

                            {/* Exemplo de texto com cor secundária */}
                            <p
                              className="text-base font-semibold mb-2"
                              style={{ color: formData.corSecundaria || '#002333' }}
                            >
                              Título de Exemplo
                            </p>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              Esta é uma prévia de como as cores personalizadas e a logo da sua
                              empresa aparecerão em propostas comerciais, relatórios e documentos
                              oficiais.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Aba Segurança */}
              {activeTab === 'seguranca' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-[#002333] mb-4">
                    Configurações de Segurança
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 2FA */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Autenticação 2FA
                        </label>
                        <p className="text-xs text-gray-500">Exigir segundo fator para login</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.autenticacao2FA || false}
                        onChange={(e) => handleInputChange('autenticacao2FA', e.target.checked)}
                        className="h-5 w-5 text-[#159A9C] focus:ring-[#159A9C] rounded"
                      />
                    </div>

                    {/* Sessão Expiração */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tempo de Sessão (minutos)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="480"
                        value={formData.sessaoExpiracaoMinutos || 30}
                        onChange={(e) =>
                          handleInputChange('sessaoExpiracaoMinutos', parseInt(e.target.value))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                      />
                      <p className="text-xs text-gray-500 mt-1">Entre 5 e 480 minutos (8 horas)</p>
                    </div>

                    <div className="md:col-span-2 rounded-lg border border-[#DCE6EA] bg-[#F8FBFC] p-4">
                      <p className="text-sm font-medium text-[#244455]">Escopo desta tela</p>
                      <p className="mt-1 text-xs text-[#607B89]">
                        Mantemos aqui apenas controles com efeito operacional validado:
                        Autenticação 2FA e tempo de sessão. Regras avançadas (complexidade de
                        senha, whitelist de IP e políticas de TLS) seguem gestão central de
                        infraestrutura e segurança.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'usuarios' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#002333] flex items-center gap-2">
                    <Users className="h-6 w-6 text-[#159A9C]" />
                    Configurações de Usuários e Permissões
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Dupla aprovação para mudanças sensíveis */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Dupla aprovação para acessos sensíveis
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Novos usuários e mudanças críticas de acesso ficam pendentes de segunda
                          aprovação.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.aprovacaoNovoUsuario || false}
                        onChange={(e) =>
                          handleInputChange('aprovacaoNovoUsuario', e.target.checked)
                        }
                        className="h-5 w-5 text-[#159A9C] rounded focus:ring-[#159A9C] cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alçada de aprovação financeira (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.alcadaAprovacaoFinanceira ?? 0}
                        onChange={(e) =>
                          handleInputChange(
                            'alcadaAprovacaoFinanceira',
                            Number(e.target.value || 0),
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Contas a pagar com valor total igual ou acima deste valor exigem aprovação.
                        Use 0 para desativar a regra automática e liberar fluxo direto.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Limite de desconto comercial (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.comercialLimiteDescontoPercentual ?? 10}
                        onChange={(e) =>
                          handleInputChange(
                            'comercialLimiteDescontoPercentual',
                            Number(e.target.value || 0),
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Descontos acima deste percentual exigem governanca interna da proposta.
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Aprovacao interna comercial habilitada
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Quando ativo, propostas acima da alcada de desconto ficam pendentes ate
                          decisao interna.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.comercialAprovacaoInternaHabilitada ?? true}
                        onChange={(e) =>
                          handleInputChange(
                            'comercialAprovacaoInternaHabilitada',
                            e.target.checked,
                          )
                        }
                        className="h-5 w-5 text-[#159A9C] rounded focus:ring-[#159A9C] cursor-pointer"
                      />
                    </div>

                    <div className="md:col-span-2 rounded-lg border border-[#DCE6EA] bg-[#F8FBFC] p-4">
                      <p className="text-sm font-medium text-[#244455]">
                        Rollout comercial por tenant
                      </p>
                      <p className="mt-1 text-xs text-[#607B89]">
                        Controle fino de comportamento do pipeline e proposta por empresa, sem
                        depender de deploy.
                      </p>

                      {!salesFlagsLoaded ? (
                        <p className="mt-3 text-xs text-amber-700">
                          Nao foi possivel carregar os feature flags comerciais para esta empresa.
                        </p>
                      ) : (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Rascunho sem placeholder
                              </p>
                              <p className="text-xs text-gray-500">
                                Evita item generico automatico ao gerar proposta pelo pipeline.
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={salesFlagsForm.pipelineDraftWithoutPlaceholder}
                              onChange={(e) =>
                                handleSalesFlagChange(
                                  'pipelineDraftWithoutPlaceholder',
                                  e.target.checked,
                                )
                              }
                              disabled={!canUpdateConfig}
                              className="h-5 w-5 text-[#159A9C] rounded focus:ring-[#159A9C] cursor-pointer"
                            />
                          </div>

                          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Itens preliminares na oportunidade
                              </p>
                              <p className="text-xs text-gray-500">
                                Habilita CRUD e copia de itens preliminares para o rascunho.
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={salesFlagsForm.opportunityPreliminaryItems}
                              onChange={(e) =>
                                handleSalesFlagChange('opportunityPreliminaryItems', e.target.checked)
                              }
                              disabled={!canUpdateConfig}
                              className="h-5 w-5 text-[#159A9C] rounded focus:ring-[#159A9C] cursor-pointer"
                            />
                          </div>

                          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Transicoes estritas da proposta
                              </p>
                              <p className="text-xs text-gray-500">
                                Bloqueia rascunho para aprovada sem envio e sem override.
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={salesFlagsForm.strictPropostaTransitions}
                              onChange={(e) =>
                                handleSalesFlagChange('strictPropostaTransitions', e.target.checked)
                              }
                              disabled={!canUpdateConfig}
                              className="h-5 w-5 text-[#159A9C] rounded focus:ring-[#159A9C] cursor-pointer"
                            />
                          </div>

                          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Politica de desconto por empresa
                              </p>
                              <p className="text-xs text-gray-500">
                                Aplica alcada comercial do tenant em vez do padrao global.
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={salesFlagsForm.discountPolicyPerTenant}
                              onChange={(e) =>
                                handleSalesFlagChange('discountPolicyPerTenant', e.target.checked)
                              }
                              disabled={!canUpdateConfig}
                              className="h-5 w-5 text-[#159A9C] rounded focus:ring-[#159A9C] cursor-pointer"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Informativo */}
                    <div className="flex items-start gap-3 p-4 bg-[#DEEFE7] rounded-lg border border-[#B4BEC9]">
                      <Info className="h-5 w-5 text-[#159A9C] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-[#002333]">Escopo desta aba</p>
                        <p className="text-[11px] text-[#0F4C5C] mt-1">
                          Inclui tambem governanca comercial de descontos em propostas.
                        </p>
                        <p className="text-xs text-[#002333] mt-1">
                          Esta aba controla regras operacionais entre módulos: governança de acessos
                          (dupla aprovação) e aprovação financeira por alçada. Limites de usuários e
                          expiração de convites seguem política de plano.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'email' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#002333] flex items-center gap-2">
                    <Mail className="h-6 w-6 text-[#159A9C]" />
                    Configurações de Email / SMTP
                  </h2>

                  {/* Toggle Principal */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Habilitar Envio de Emails
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Ative para permitir que o sistema envie emails automaticamente
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.emailsHabilitados || false}
                      onChange={(e) => {
                        handleInputChange('emailsHabilitados', e.target.checked);
                        if (!e.target.checked) {
                          setSMTPTestResult(null);
                        }
                      }}
                      className="h-5 w-5 text-[#159A9C] rounded focus:ring-[#159A9C] cursor-pointer"
                    />
                  </div>

                  {/* Campos SMTP (mostrar apenas se habilitado) */}
                  {formData.emailsHabilitados && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Servidor SMTP */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Servidor SMTP <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.servidorSMTP || ''}
                            onChange={(e) => handleInputChange('servidorSMTP', e.target.value)}
                            placeholder="smtp.gmail.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                          />
                          <p className="text-xs text-gray-500 mt-1">Endereço do servidor SMTP</p>
                        </div>

                        {/* Porta SMTP */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Porta SMTP
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="65535"
                            value={formData.portaSMTP || 587}
                            onChange={(e) =>
                              handleInputChange('portaSMTP', parseInt(e.target.value))
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Porta padrão: 587 (TLS) ou 465 (SSL)
                          </p>
                        </div>

                        {/* Usuário SMTP */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Usuário SMTP <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            value={formData.smtpUsuario || ''}
                            onChange={(e) => handleInputChange('smtpUsuario', e.target.value)}
                            placeholder="seu-email@empresa.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Email usado para autenticação
                          </p>
                        </div>

                        {/* Senha SMTP */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Senha SMTP <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            value={formData.smtpSenha || ''}
                            onChange={(e) => handleInputChange('smtpSenha', e.target.value)}
                            placeholder="************"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                          />
                          <p className="text-xs text-gray-500 mt-1">Senha ou token de aplicativo</p>
                        </div>
                      </div>

                      {/* Botão Testar Conexão */}
                      <div className="border-t pt-6">
                        <button
                          onClick={handleTestSMTP}
                          disabled={
                            !canUpdateConfig ||
                            testingSMTP ||
                            !formData.servidorSMTP ||
                            !formData.smtpUsuario ||
                            !formData.smtpSenha
                          }
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Send className="h-4 w-4" />
                          {testingSMTP ? 'Testando Conexão...' : 'Testar Conexão SMTP'}
                        </button>

                        {/* Resultado do Teste */}
                        {smtpTestResult && (
                          <div
                            className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                              smtpTestResult.success
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-red-50 border border-red-200'
                            }`}
                          >
                            {smtpTestResult.success ? (
                              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p
                                className={`text-sm font-medium ${
                                  smtpTestResult.success ? 'text-green-900' : 'text-red-900'
                                }`}
                              >
                                {smtpTestResult.success ? 'Teste Bem-Sucedido' : 'Falha no Teste'}
                              </p>
                              <p
                                className={`text-xs mt-1 ${
                                  smtpTestResult.success ? 'text-green-700' : 'text-red-700'
                                }`}
                              >
                                {smtpTestResult.message}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Informativo */}
                      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-900">Configuração Gmail</p>
                          <p className="text-xs text-amber-700 mt-1">
                            Para Gmail, use <strong>smtp.gmail.com</strong> porta{' '}
                            <strong>587</strong> e gere uma
                            <a
                              href="https://myaccount.google.com/apppasswords"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline ml-1 hover:text-amber-800"
                            >
                              senha de aplicativo
                            </a>
                            .
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'fiscal' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#002333] flex items-center gap-2">
                    <FileText className="h-6 w-6 text-[#159A9C]" />
                    Configuracoes fiscais por empresa
                  </h2>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                      <h3 className="text-base font-semibold text-[#002333]">Configuracao do tenant</h3>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Provider fiscal da empresa
                        </label>
                        <select
                          value={fiscalProviderSelectValue}
                          onChange={(e) => {
                            const selected = e.target.value;
                            if (selected === '__fallback__') {
                              handleInputChange('fiscalProvider', '');
                              return;
                            }
                            if (selected === '__custom__') {
                              if (!fiscalProviderPersonalizado) {
                                handleInputChange('fiscalProvider', 'custom_provider');
                              }
                              return;
                            }
                            handleInputChange('fiscalProvider', selected);
                          }}
                          disabled={!canUpdateConfig}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] disabled:bg-gray-50 disabled:cursor-not-allowed"
                        >
                          <option value="__fallback__">Usar fallback global</option>
                          <option value="fiscal_oficial">Provider oficial</option>
                          <option value="fiscal_stub_local">Stub local</option>
                          <option value="__custom__">Provider customizado</option>
                        </select>
                        {fiscalProviderPersonalizado && (
                          <input
                            type="text"
                            value={formData.fiscalProvider || ''}
                            onChange={(e) => handleInputChange('fiscalProvider', e.target.value)}
                            placeholder="nome_do_provider"
                            disabled={!canUpdateConfig}
                            className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] disabled:bg-gray-50 disabled:cursor-not-allowed"
                          />
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Deixe vazio para usar o fallback global do backend.
                        </p>
                        {fiscalConflitoProviderStub && (
                          <p className="text-xs text-red-600 mt-1">
                            Provider stub nao atende a exigencia de emissao oficial.
                          </p>
                        )}
                        {fiscalDependenciaFallbackGlobal && (
                          <p className="text-xs text-amber-700 mt-1">
                            Com exigencia oficial ativa, depender do fallback global pode gerar variacao entre
                            empresas.
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Integracao HTTP oficial habilitada
                          </label>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(formData.fiscalOfficialHttpEnabled)}
                          onChange={(e) =>
                            handleInputChange('fiscalOfficialHttpEnabled', e.target.checked)
                          }
                          disabled={!canUpdateConfig}
                          className="h-5 w-5 text-[#159A9C] rounded focus:ring-[#159A9C] cursor-pointer disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Exigir provider oficial
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              Bloqueia emissao com stub para esta empresa.
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(formData.fiscalRequireOfficialProvider)}
                            onChange={(e) =>
                              handleInputChange('fiscalRequireOfficialProvider', e.target.checked)
                            }
                            disabled={!canUpdateConfig}
                            className="h-5 w-5 text-[#159A9C] rounded focus:ring-[#159A9C] cursor-pointer disabled:cursor-not-allowed"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Validacao estrita de contrato
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              Rejeita retorno fora do mapeamento esperado.
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(formData.fiscalOfficialStrictResponse)}
                            onChange={(e) =>
                              handleInputChange('fiscalOfficialStrictResponse', e.target.checked)
                            }
                            disabled={!canUpdateConfig}
                            className="h-5 w-5 text-[#159A9C] rounded focus:ring-[#159A9C] cursor-pointer disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          URL base do provider oficial
                        </label>
                        <input
                          type="url"
                          value={formData.fiscalOfficialBaseUrl || ''}
                          onChange={(e) =>
                            handleInputChange('fiscalOfficialBaseUrl', e.target.value)
                          }
                          placeholder="https://api.seu-provedor-fiscal.com"
                          disabled={!canUpdateConfig}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] disabled:bg-gray-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Webhook sem assinatura (contingencia)
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              Usar apenas em ambiente controlado.
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(formData.fiscalOfficialWebhookAllowInsecure)}
                            onChange={(e) =>
                              handleInputChange(
                                'fiscalOfficialWebhookAllowInsecure',
                                e.target.checked,
                              )
                            }
                            disabled={!canUpdateConfig}
                            className="h-5 w-5 text-[#159A9C] rounded focus:ring-[#159A9C] cursor-pointer disabled:cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Header de correlacao
                          </label>
                          <input
                            type="text"
                            value={formData.fiscalOfficialCorrelationHeader || ''}
                            onChange={(e) =>
                              handleInputChange('fiscalOfficialCorrelationHeader', e.target.value)
                            }
                            placeholder="X-Correlation-Id"
                            disabled={!canUpdateConfig}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] disabled:bg-gray-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Token de API oficial
                          </label>
                          <input
                            type="password"
                            value={formData.fiscalOfficialApiToken || ''}
                            onChange={(e) =>
                              handleInputChange('fiscalOfficialApiToken', e.target.value)
                            }
                            placeholder="************"
                            disabled={!canUpdateConfig}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] disabled:bg-gray-50 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Segredo do webhook fiscal
                          </label>
                          <input
                            type="password"
                            value={formData.fiscalOfficialWebhookSecret || ''}
                            onChange={(e) =>
                              handleInputChange('fiscalOfficialWebhookSecret', e.target.value)
                            }
                            placeholder="************"
                            disabled={!canUpdateConfig}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] disabled:bg-gray-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-base font-semibold text-[#002333]">Diagnostico fiscal</h3>
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${fiscalStatusClasses}`}
                        >
                          {fiscalStatusLabel}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void carregarDiagnosticoConfigFiscal()}
                          disabled={loadingFiscalConfigDiagnostico}
                          className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {loadingFiscalConfigDiagnostico
                            ? 'Atualizando diagnostico...'
                            : 'Atualizar diagnostico'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void testarConectividadeFiscal()}
                          disabled={testingFiscalConectividade}
                          className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {testingFiscalConectividade
                            ? 'Testando conectividade...'
                            : 'Testar conectividade'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void executarPreflightFiscal()}
                          disabled={runningFiscalPreflight}
                          className="px-3 py-2 text-sm font-medium bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:opacity-50"
                        >
                          {runningFiscalPreflight ? 'Executando preflight...' : 'Executar preflight'}
                        </button>
                      </div>

                      {hasChanges && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                          Existem alteracoes pendentes. Salve antes de confiar no diagnostico.
                        </div>
                      )}

                      {fiscalDiagErro && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                          {fiscalDiagErro}
                        </div>
                      )}

                      <div className="rounded-lg border border-[#DCE6EA] bg-[#F8FBFC] p-4">
                        <p className="text-sm font-medium text-[#244455]">Resumo de prontidao</p>
                        <div className="mt-2 space-y-1 text-xs text-[#355061]">
                          <p>
                            Provider efetivo:{' '}
                            <span className="font-semibold">
                              {fiscalProviderEfetivo || 'nao informado'}
                            </span>
                          </p>
                          <p>
                            Integracao HTTP oficial:{' '}
                            <span className="font-semibold">
                              {fiscalConfigDiagnostico?.officialHttpEnabled ? 'ativa' : 'inativa'}
                            </span>
                          </p>
                          <p>
                            Validacao estrita:{' '}
                            <span className="font-semibold">
                              {fiscalConfigDiagnostico?.officialStrictResponse ? 'ativa' : 'inativa'}
                            </span>
                          </p>
                          {fiscalConfigurationSources?.provider && (
                            <p>
                              Origem do provider:{' '}
                              <span className="font-semibold">
                                {fiscalSourceLabel(fiscalConfigurationSources.provider)}
                              </span>
                            </p>
                          )}
                          {fiscalConfigurationSources?.officialBaseUrl && (
                            <p>
                              Origem da URL base:{' '}
                              <span className="font-semibold">
                                {fiscalSourceLabel(fiscalConfigurationSources.officialBaseUrl)}
                              </span>
                            </p>
                          )}
                          {fiscalPreflightDiagnostico?.timestamp && (
                            <p>
                              Ultimo preflight:{' '}
                              <span className="font-semibold">
                                {new Date(fiscalPreflightDiagnostico.timestamp).toLocaleString('pt-BR')}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>

                      {fiscalProviderForaDeSincronia && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                          O provider do formulario ainda nao bate com o provider efetivo do
                          diagnostico. Salve e rode o preflight novamente.
                        </div>
                      )}

                      {fiscalUsingGlobalFallback && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                          Esta empresa ainda depende de fallback global em:{' '}
                          {fiscalGlobalFallbackSummaryText}
                          {fiscalGlobalFallbackFields.length > 4
                            ? ` e mais ${fiscalGlobalFallbackFields.length - 4} campo(s).`
                            : '.'}
                        </div>
                      )}

                      {fiscalConectividadeDiagnostico && (
                        <div
                          className={`rounded-lg border px-3 py-2 text-sm ${
                            fiscalConectividadeDiagnostico.success
                              ? 'border-green-200 bg-green-50 text-green-800'
                              : fiscalConectividadeDiagnostico.attempted
                                ? 'border-amber-200 bg-amber-50 text-amber-800'
                                : 'border-[#DCE6EA] bg-[#F8FBFC] text-[#355061]'
                          }`}
                        >
                          <p className="font-medium">
                            {fiscalConectividadeDiagnostico.success
                              ? 'Conectividade validada'
                              : 'Conectividade pendente/limitada'}
                          </p>
                          <p className="text-xs mt-1">{fiscalConectividadeDiagnostico.message}</p>
                          <p className="text-xs mt-2">
                            {fiscalConectividadeDiagnostico.method || '-'} /{' '}
                            {fiscalConectividadeDiagnostico.httpStatus ?? '-'} |{' '}
                            {fiscalConectividadeDiagnostico.latencyMs != null
                              ? `${fiscalConectividadeDiagnostico.latencyMs}ms`
                              : '-'}
                          </p>
                        </div>
                      )}

                      {fiscalBlockers.length > 0 && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                          <p className="text-sm font-medium text-red-900">Bloqueios</p>
                          <ul className="mt-1 space-y-1 text-xs text-red-700">
                            {fiscalBlockers.map((item, index) => (
                              <li key={`fiscal-blocker-${index}`}>- {formatarMensagemFiscal(item)}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {fiscalWarnings.length > 0 && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <p className="text-sm font-medium text-amber-900">Alertas</p>
                          <ul className="mt-1 space-y-1 text-xs text-amber-700">
                            {fiscalWarnings.map((item, index) => (
                              <li key={`fiscal-warning-${index}`}>- {formatarMensagemFiscal(item)}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {fiscalRecommendations.length > 0 && (
                        <div className="rounded-lg border border-[#B4BEC9] bg-[#DEEFE7] p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-[#002333]">Acoes sugeridas</p>
                            {fiscalRecommendations.length > 2 && (
                              <button
                                type="button"
                                onClick={() => setShowFiscalRecommendations((prev) => !prev)}
                                className="text-xs text-[#0F7B7D] hover:underline"
                              >
                                {showFiscalRecommendations ? 'Mostrar menos' : 'Mostrar mais'}
                              </button>
                            )}
                          </div>
                          <ul className="mt-1 space-y-1 text-xs text-[#355061]">
                            {fiscalRecommendationsPreview.map((item, index) => (
                              <li key={`fiscal-recommendation-${index}`}>
                                - {formatarMensagemFiscal(item)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {fiscalBlockers.length === 0 &&
                        fiscalWarnings.length === 0 &&
                        fiscalRecommendations.length === 0 &&
                        !fiscalConectividadeDiagnostico && (
                          <div className="rounded-lg border border-[#DCE6EA] bg-[#F8FBFC] p-3 text-xs text-[#607B89]">
                            Rode o preflight para carregar os apontamentos desta empresa.
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab !== 'geral' &&
                activeTab !== 'seguranca' &&
                activeTab !== 'usuarios' &&
                activeTab !== 'email' &&
                activeTab !== 'fiscal' && (
                  <div className="text-center py-12 text-gray-500">
                    <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>
                      Aba "{EMPRESA_CONFIG_TABS.find((t) => t.id === activeTab)?.label}" em
                      desenvolvimento
                    </p>
                  </div>
                )}
            </div>
      </SectionCard>

      <div className="sticky bottom-4 z-10">
        <SectionCard className="p-5">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
            <button
              onClick={handleReset}
              disabled={saving || !canUpdateConfig}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar Padrões
            </button>
            <button
              onClick={handleSave}
              disabled={!canUpdateConfig || !hasChanges || saving}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default ConfiguracaoEmpresaPage;
