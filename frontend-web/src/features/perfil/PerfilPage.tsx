import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bell,
  BellRing,
  Building,
  Camera,
  Download,
  Eye,
  EyeOff,
  FileWarning,
  Globe,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  Save,
  Shield,
  ShieldAlert,
  Trash2,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { InlineStats, PageHeader, SectionCard } from '../../components/layout-v2';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../hooks/useAuth';
import { usuariosService } from '../../services/usuariosService';
import { resolveAvatarUrl } from '../../utils/avatar';
import type { User as AuthUser } from '../../types';

type ProfileFormState = {
  nome: string;
  telefone: string;
  idioma_preferido: string;
  notificacoes_email: boolean;
  notificacoes_push: boolean;
};

type PasswordFormState = {
  senhaAtual: string;
  senhaNova: string;
  confirmarSenha: string;
};

const PASSWORD_MIN_LENGTH = 6;
const REQUEST_TIMEOUT_MS = 30000;
const NOTIFICATION_PREFS_HIGHLIGHT_MS = 2400;

const DEFAULT_PROFILE_FORM: ProfileFormState = {
  nome: '',
  telefone: '',
  idioma_preferido: 'pt-BR',
  notificacoes_email: true,
  notificacoes_push: true,
};

const DEFAULT_PASSWORD_FORM: PasswordFormState = {
  senhaAtual: '',
  senhaNova: '',
  confirmarSenha: '',
};

const fieldLabelClassName = 'mb-2 block text-sm font-medium text-[#355061]';
const fieldLabelWithIconClassName = 'mb-2 flex items-center gap-2 text-sm font-medium text-[#355061]';
const inputClassName =
  'w-full rounded-lg border border-[#CFDDE2] bg-white px-3 py-2.5 text-sm text-[#19384C] outline-none shadow-sm transition focus:border-[#159A9C] focus:ring-4 focus:ring-[#159A9C]/15';
const inputWithTrailingButtonClassName = `${inputClassName} pr-11`;
const readonlyInputClassName =
  'w-full rounded-lg border border-[#E5EEF2] bg-[#F7FAFB] px-3 py-2.5 text-sm text-[#607B89] shadow-sm';
const selectClassName = `${inputClassName} bg-white`;
const checkboxClassName = 'h-4 w-4 rounded border-[#BFD0D8] text-[#159A9C] focus:ring-[#159A9C]';
const preferenceToggleRowClassName =
  'flex items-start justify-between gap-3 rounded-lg border border-[#E5EEF2] bg-[#FBFDFD] px-3 py-2.5';
const sidebarInfoRowClassName =
  'flex items-center gap-3 rounded-lg border border-[#E5EEF2] bg-[#FBFDFD] px-3 py-2.5 text-sm text-[#355061]';
const sectionSubtitleClassName = 'mt-1 text-sm text-[#607B89]';
const activityRowClassName =
  'flex items-center justify-between rounded-lg border border-[#E5EEF2] bg-[#FBFDFD] px-4 py-3';
const profileSaveButtonClassName =
  'inline-flex items-center gap-2 rounded-lg border border-[#159A9C] px-4 py-2 text-sm font-semibold text-[#159A9C] transition hover:bg-[#159A9C] hover:text-white disabled:cursor-not-allowed disabled:opacity-60';
const passwordSaveButtonClassName =
  'inline-flex items-center gap-2 rounded-lg bg-[#002333] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#001a25] disabled:cursor-not-allowed disabled:opacity-60';

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrador',
  manager: 'Gerente',
  gerente: 'Gerente',
  vendedor: 'Vendedor',
  suporte: 'Suporte',
  user: 'Suporte',
  financeiro: 'Financeiro',
};

const extractErrorMessage = (error: unknown, fallback: string): string => {
  const apiMessage = (error as { response?: { data?: { message?: string | string[] } } })?.response
    ?.data?.message;

  if (Array.isArray(apiMessage)) {
    const joined = apiMessage.filter((item) => typeof item === 'string').join(' ');
    if (joined.trim()) {
      return joined;
    }
  }

  if (typeof apiMessage === 'string' && apiMessage.trim()) {
    return apiMessage;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

const formatDateLabel = (value?: string | Date | null): string => {
  if (!value) {
    return 'Sem registro';
  }

  const parsedDate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Sem registro';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsedDate);
};

const resolveRoleLabel = (role?: string): string => {
  if (!role) {
    return 'Usuario';
  }

  const normalized = role.toLowerCase();
  return ROLE_LABELS[normalized] || role;
};

const buildProfileState = (user: AuthUser | null): ProfileFormState => ({
  nome: user?.nome || '',
  telefone: user?.telefone || '',
  idioma_preferido: user?.idioma_preferido || 'pt-BR',
  notificacoes_email:
    typeof user?.configuracoes?.notificacoes?.email === 'boolean'
      ? user.configuracoes.notificacoes.email
      : true,
  notificacoes_push:
    typeof user?.configuracoes?.notificacoes?.push === 'boolean'
      ? user.configuracoes.notificacoes.push
      : true,
});

const areProfileStatesEqual = (left: ProfileFormState, right: ProfileFormState): boolean =>
  left.nome.trim() === right.nome.trim() &&
  left.telefone.trim() === right.telefone.trim() &&
  left.idioma_preferido === right.idioma_preferido &&
  left.notificacoes_email === right.notificacoes_email &&
  left.notificacoes_push === right.notificacoes_push;

const PerfilPage: React.FC = () => {
  const location = useLocation();
  const { user, updateUser } = useAuth();
  const { settings: notificationCenterSettings, updateSettings: updateNotificationCenterSettings } =
    useNotifications();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [privacyExporting, setPrivacyExporting] = useState(false);
  const [privacyRequestingType, setPrivacyRequestingType] = useState<
    null | 'account_anonymization' | 'account_deletion'
  >(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState>(DEFAULT_PROFILE_FORM);
  const [baselineProfileForm, setBaselineProfileForm] =
    useState<ProfileFormState>(DEFAULT_PROFILE_FORM);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(DEFAULT_PASSWORD_FORM);
  const [showPassword, setShowPassword] = useState({
    atual: false,
    nova: false,
    confirmacao: false,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const notificationPrefsSectionRef = useRef<HTMLDivElement | null>(null);
  const [highlightNotificationPrefs, setHighlightNotificationPrefs] = useState(false);

  useEffect(() => {
    setAvatarPreview(resolveAvatarUrl(user?.avatar_url || null));
  }, [user?.avatar_url]);

  useEffect(() => {
    const nextProfileState = buildProfileState(user);
    setProfileForm(nextProfileState);
    setBaselineProfileForm(nextProfileState);
    setPendingAvatarFile(null);
  }, [
    user?.id,
    user?.nome,
    user?.telefone,
    user?.idioma_preferido,
    user?.configuracoes?.notificacoes?.email,
    user?.configuracoes?.notificacoes?.push,
  ]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = (params.get('section') || '').toLowerCase();
    const shouldFocusNotifications = section === 'notifications' || section === 'notificacoes';

    if (!shouldFocusNotifications) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      notificationPrefsSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      notificationPrefsSectionRef.current?.focus();
      setHighlightNotificationPrefs(true);
    }, 80);

    const clearHighlightId = window.setTimeout(() => {
      setHighlightNotificationPrefs(false);
    }, NOTIFICATION_PREFS_HIGHLIGHT_MS);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearTimeout(clearHighlightId);
    };
  }, [location.search]);

  const nomeLimpo = profileForm.nome.trim();
  const hasAvatarPending = Boolean(pendingAvatarFile);

  const hasProfileChanges = useMemo(
    () => !areProfileStatesEqual(profileForm, baselineProfileForm),
    [profileForm, baselineProfileForm],
  );

  const canSaveProfile =
    Boolean(user) &&
    nomeLimpo.length >= 3 &&
    (hasProfileChanges || hasAvatarPending) &&
    !profileSaving &&
    !avatarUploading;

  const passwordValidation = useMemo(
    () => ({
      senhaAtualValida: passwordForm.senhaAtual.trim().length > 0,
      tamanhoMinimo: passwordForm.senhaNova.length >= PASSWORD_MIN_LENGTH,
      diferenteAtual:
        passwordForm.senhaAtual.trim().length > 0 &&
        passwordForm.senhaNova.length > 0 &&
        passwordForm.senhaAtual.trim() !== passwordForm.senhaNova,
      confirmacaoValida:
        passwordForm.senhaNova.length > 0 && passwordForm.senhaNova === passwordForm.confirmarSenha,
    }),
    [passwordForm],
  );

  const canSavePassword =
    Boolean(user?.id) &&
    passwordValidation.senhaAtualValida &&
    passwordValidation.tamanhoMinimo &&
    passwordValidation.diferenteAtual &&
    passwordValidation.confirmacaoValida &&
    !passwordSaving;

  const browserNotificationStateLabel = useMemo(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'Não suportado neste navegador';
    }

    switch (Notification.permission) {
      case 'granted':
        return 'Permissão concedida';
      case 'denied':
        return 'Permissão bloqueada no navegador';
      default:
        return 'Permissão ainda não solicitada';
    }
  }, [notificationCenterSettings.browserNotifications]);

  const profileHeaderStats = useMemo(
    () => [
      {
        label: 'Perfil',
        value: hasProfileChanges || hasAvatarPending ? 'Pendente' : 'Sincronizado',
        tone: (hasProfileChanges || hasAvatarPending ? 'warning' : 'accent') as
          | 'warning'
          | 'accent',
      },
      {
        label: 'Email',
        value: profileForm.notificacoes_email ? 'Ativo' : 'Desligado',
        tone: (profileForm.notificacoes_email ? 'accent' : 'neutral') as 'accent' | 'neutral',
      },
      {
        label: 'In-app',
        value: profileForm.notificacoes_push ? 'Ativo' : 'Desligado',
        tone: (profileForm.notificacoes_push ? 'accent' : 'neutral') as 'accent' | 'neutral',
      },
      {
        label: 'Navegador',
        value: notificationCenterSettings.browserNotifications ? 'Ativo' : 'Desligado',
        tone: (notificationCenterSettings.browserNotifications ? 'accent' : 'neutral') as
          | 'accent'
          | 'neutral',
      },
    ],
    [
      hasAvatarPending,
      hasProfileChanges,
      notificationCenterSettings.browserNotifications,
      profileForm.notificacoes_email,
      profileForm.notificacoes_push,
    ],
  );

  const handleAvatarPick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Formato invalido. Use JPG, PNG ou WEBP.');
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Tamanho maximo: 2MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);

    setPendingAvatarFile(file);
    toast.success('Foto selecionada. Clique em "Salvar alteracoes" para aplicar.');
    event.target.value = '';
  };

  const handleProfileChange = <T extends keyof ProfileFormState>(
    field: T,
    value: ProfileFormState[T],
  ) => {
    setProfileForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleNotificationCenterSoundToggle = (enabled: boolean) => {
    updateNotificationCenterSettings({ soundEnabled: enabled });
    toast.success(enabled ? 'Som de notificações ativado.' : 'Som de notificações desativado.');
  };

  const handleNotificationCenterBrowserToggle = async (enabled: boolean) => {
    if (!enabled) {
      updateNotificationCenterSettings({ browserNotifications: false });
      toast.success('Notificações do navegador desativadas.');
      return;
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Este navegador não suporta notificações do sistema.');
      updateNotificationCenterSettings({ browserNotifications: false });
      return;
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      try {
        permission = await Notification.requestPermission();
      } catch (error) {
        console.error('Erro ao solicitar permissão de notificações:', error);
        toast.error('Não foi possível solicitar permissão de notificações.');
        updateNotificationCenterSettings({ browserNotifications: false });
        return;
      }
    }

    if (permission !== 'granted') {
      updateNotificationCenterSettings({ browserNotifications: false });
      toast.error(
        permission === 'denied'
          ? 'Permissão de notificações bloqueada no navegador.'
          : 'Permissão de notificações não concedida.',
      );
      return;
    }

    updateNotificationCenterSettings({ browserNotifications: true });
    toast.success('Notificações do navegador ativadas.');
  };

  const handleSaveProfile = async () => {
    if (!user) {
      return;
    }

    if (!hasProfileChanges && !hasAvatarPending) {
      toast('Nenhuma alteracao pendente.');
      return;
    }

    if (nomeLimpo.length < 3) {
      toast.error('Informe um nome com pelo menos 3 caracteres.');
      return;
    }

    try {
      setProfileSaving(true);

      const telefoneLimpo = profileForm.telefone.trim();
      const existingConfig = user.configuracoes || {};
      let nextProfileState = profileForm;
      let avatarUrlFinal = user.avatar_url;
      let updatedAtFinal = user.updated_at || new Date();
      let configuracoesFinais = {
        ...existingConfig,
        notificacoes: {
          ...(existingConfig.notificacoes || {}),
          email: profileForm.notificacoes_email,
          push: profileForm.notificacoes_push,
        },
      };

      const payloadConfig = {
        ...existingConfig,
        notificacoes: {
          ...(existingConfig.notificacoes || {}),
          email: profileForm.notificacoes_email,
          push: profileForm.notificacoes_push,
        },
      };

      if (hasProfileChanges) {
        const updatedUser = await withTimeout(
          usuariosService.atualizarPerfil({
            nome: nomeLimpo,
            telefone: telefoneLimpo,
            idioma_preferido: profileForm.idioma_preferido,
            configuracoes: payloadConfig,
          }),
          REQUEST_TIMEOUT_MS,
          'A atualizacao de perfil demorou demais para responder.',
        );

        nextProfileState = {
          nome: updatedUser.nome || nomeLimpo,
          telefone: (updatedUser.telefone || telefoneLimpo || '').trim(),
          idioma_preferido: updatedUser.idioma_preferido || profileForm.idioma_preferido,
          notificacoes_email:
            typeof updatedUser.configuracoes?.notificacoes?.email === 'boolean'
              ? updatedUser.configuracoes.notificacoes.email
              : profileForm.notificacoes_email,
          notificacoes_push:
            typeof updatedUser.configuracoes?.notificacoes?.push === 'boolean'
              ? updatedUser.configuracoes.notificacoes.push
              : profileForm.notificacoes_push,
        };

        setProfileForm(nextProfileState);
        setBaselineProfileForm(nextProfileState);

        configuracoesFinais = {
          ...(user.configuracoes || {}),
          ...(updatedUser.configuracoes || {}),
          notificacoes: {
            ...(user.configuracoes?.notificacoes || {}),
            ...(updatedUser.configuracoes?.notificacoes || {}),
            email: nextProfileState.notificacoes_email,
            push: nextProfileState.notificacoes_push,
          },
        };

        updatedAtFinal = updatedUser.updated_at || new Date();
        avatarUrlFinal = updatedUser.avatar_url || avatarUrlFinal;
      }

      if (pendingAvatarFile) {
        setAvatarUploading(true);
        const avatarPayload = await withTimeout(
          usuariosService.uploadAvatarPerfil(pendingAvatarFile),
          REQUEST_TIMEOUT_MS,
          'O upload do avatar demorou demais para responder.',
        );
        avatarUrlFinal = avatarPayload.avatar_url || avatarUrlFinal;
        setPendingAvatarFile(null);
      }

      updateUser({
        nome: nextProfileState.nome,
        telefone: nextProfileState.telefone,
        idioma_preferido: nextProfileState.idioma_preferido,
        avatar_url: avatarUrlFinal || undefined,
        configuracoes: configuracoesFinais,
        updated_at: updatedAtFinal,
      });

      toast.success(
        hasProfileChanges && hasAvatarPending
          ? 'Perfil e avatar salvos com sucesso.'
          : hasAvatarPending
            ? 'Avatar salvo com sucesso.'
            : 'Perfil salvo com sucesso.',
      );
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast.error(extractErrorMessage(error, 'Nao foi possivel salvar o perfil.'));
    } finally {
      setProfileSaving(false);
      setAvatarUploading(false);
    }
  };

  const handlePasswordFieldChange = <T extends keyof PasswordFormState>(
    field: T,
    value: PasswordFormState[T],
  ) => {
    setPasswordForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSavePassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user?.id) {
      return;
    }

    if (!passwordValidation.senhaAtualValida) {
      toast.error('Informe sua senha atual.');
      return;
    }

    if (!passwordValidation.tamanhoMinimo) {
      toast.error(`A nova senha deve ter ao menos ${PASSWORD_MIN_LENGTH} caracteres.`);
      return;
    }

    if (!passwordValidation.diferenteAtual) {
      toast.error('A nova senha deve ser diferente da senha atual.');
      return;
    }

    if (!passwordValidation.confirmacaoValida) {
      toast.error('A confirmacao da nova senha nao confere.');
      return;
    }

    try {
      setPasswordSaving(true);

      await usuariosService.atualizarSenhaPerfil({
        senha_atual: passwordForm.senhaAtual,
        senha_nova: passwordForm.senhaNova,
        confirmar_senha: passwordForm.confirmarSenha,
      });

      setPasswordForm(DEFAULT_PASSWORD_FORM);
      setShowPassword({ atual: false, nova: false, confirmacao: false });
      toast.success('Senha atualizada com sucesso.');
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      toast.error(extractErrorMessage(error, 'Nao foi possivel atualizar a senha.'));
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleExportOwnData = async () => {
    if (!user?.id) {
      return;
    }

    try {
      setPrivacyExporting(true);
      const payload = await usuariosService.exportarDadosPerfil();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateLabel = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `conectcrm-meus-dados-${dateLabel}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Exportacao de dados gerada com sucesso.');
    } catch (error) {
      console.error('Erro ao exportar dados do perfil:', error);
      toast.error(extractErrorMessage(error, 'Nao foi possivel exportar seus dados.'));
    } finally {
      setPrivacyExporting(false);
    }
  };

  const handleCreatePrivacyRequest = async (
    type: 'account_anonymization' | 'account_deletion',
  ) => {
    const confirmationMessage =
      type === 'account_deletion'
        ? 'Confirmar registro da solicitacao de exclusao de conta? A conta nao sera excluida automaticamente.'
        : 'Confirmar registro da solicitacao de anonimização de dados? Nenhuma alteracao sera aplicada automaticamente.';

    if (typeof window !== 'undefined' && !window.confirm(confirmationMessage)) {
      return;
    }

    try {
      setPrivacyRequestingType(type);
      const response = await usuariosService.solicitarPrivacidadePerfil({ type });
      toast.success(`Solicitacao registrada. Protocolo: ${response.protocolo}`);
    } catch (error) {
      console.error('Erro ao registrar solicitacao LGPD:', error);
      toast.error(extractErrorMessage(error, 'Nao foi possivel registrar a solicitacao LGPD.'));
    } finally {
      setPrivacyRequestingType(null);
    }
  };

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title="Meu Perfil"
          description="Edite seus dados, preferencias de conta e seguranca."
          actions={
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={!canSaveProfile}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#159A9C] px-4 text-sm font-semibold text-white transition hover:bg-[#12888A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {profileSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar alteracoes
                </>
              )}
            </button>
          }
        />

        <InlineStats stats={profileHeaderStats} />
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <SectionCard className="p-6 xl:col-span-1">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#159A9C] to-[#0F7B7D]">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={user?.nome || 'Usuario'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-white" />
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleAvatarSelected}
                />

                <button
                  type="button"
                  onClick={handleAvatarPick}
                  disabled={avatarUploading}
                  className="absolute bottom-0 right-0 inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                  title="Alterar avatar"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <h2 className="text-lg font-semibold text-gray-900">{user?.nome || 'Usuario'}</h2>
              <p className="mt-1 text-sm text-gray-600">{resolveRoleLabel(user?.role)}</p>
              {hasAvatarPending && (
                <p className="mt-2 text-xs font-medium text-[#159A9C]">
                  Nova foto pendente. Clique em salvar alteracoes.
                </p>
              )}

              <div className="mt-4 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />
                Conta ativa
              </div>
            </div>

              <div className="mt-6 space-y-3 border-t border-[#E5EEF2] pt-6">
              <div className={sidebarInfoRowClassName}>
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="truncate">{user?.email || '-'}</span>
              </div>
              <div className={sidebarInfoRowClassName}>
                <Building className="h-4 w-4 text-gray-400" />
                <span className="truncate">{user?.empresa?.nome || 'Empresa'}</span>
              </div>
              <div className={sidebarInfoRowClassName}>
                <Shield className="h-4 w-4 text-gray-400" />
                <span>{resolveRoleLabel(user?.role)}</span>
              </div>
              <div className={sidebarInfoRowClassName}>
                <Globe className="h-4 w-4 text-gray-400" />
                <span>{profileForm.idioma_preferido || 'pt-BR'}</span>
              </div>
            </div>
          </SectionCard>

          <div className="space-y-6 xl:col-span-2">
            <SectionCard className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#002333]">Informacoes pessoais</h3>
                <p className={sectionSubtitleClassName}>
                  Esses dados aparecem no sistema e no seu perfil.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="perfil-nome" className={fieldLabelClassName}>
                    Nome completo
                  </label>
                  <input
                    id="perfil-nome"
                    type="text"
                    value={profileForm.nome}
                    onChange={(event) => handleProfileChange('nome', event.target.value)}
                    className={inputClassName}
                    placeholder="Seu nome completo"
                  />
                  {profileForm.nome.trim().length > 0 && profileForm.nome.trim().length < 3 && (
                    <p className="mt-2 text-xs text-red-600">O nome precisa ter pelo menos 3 caracteres.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="perfil-email" className={fieldLabelClassName}>
                    Email
                  </label>
                  <input
                    id="perfil-email"
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className={readonlyInputClassName}
                  />
                </div>

                <div>
                  <label
                    htmlFor="perfil-telefone"
                    className={fieldLabelWithIconClassName}
                  >
                    <Phone className="h-4 w-4 text-gray-400" />
                    Telefone
                  </label>
                  <input
                    id="perfil-telefone"
                    type="tel"
                    value={profileForm.telefone}
                    onChange={(event) => handleProfileChange('telefone', event.target.value)}
                    className={inputClassName}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <label htmlFor="perfil-idioma" className={fieldLabelClassName}>
                    Idioma preferido
                  </label>
                  <select
                    id="perfil-idioma"
                    value={profileForm.idioma_preferido}
                    onChange={(event) => handleProfileChange('idioma_preferido', event.target.value)}
                    className={selectClassName}
                  >
                    <option value="pt-BR">Portugues (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Espanol</option>
                  </select>
                </div>
              </div>

              <div
                id="perfil-notification-preferences"
                ref={notificationPrefsSectionRef}
                tabIndex={-1}
                className={`mt-6 space-y-4 rounded-xl border bg-gray-50 p-4 outline-none transition-all ${
                  highlightNotificationPrefs
                    ? 'border-[#159A9C] ring-4 ring-[#159A9C]/15'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <Bell className="h-4 w-4 text-[#159A9C]" />
                      Preferencias de notificacao
                    </h4>
                    <p className="mt-1 text-xs text-gray-600">
                      Ajuste envio de avisos da conta e comportamento do centro de notificacoes.
                    </p>
                  </div>
                  {highlightNotificationPrefs ? (
                    <span className="rounded-full border border-[#BDE5DE] bg-[#F4FBF9] px-2.5 py-1 text-[11px] font-semibold text-[#0F7B7D]">
                      Secao destacada
                    </span>
                  ) : null}
                </div>

                <div className="space-y-3 rounded-lg border border-[#E5EEF2] bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <Mail className="h-4 w-4 text-gray-400" />
                    Preferencias da conta
                  </div>

                  <label className={preferenceToggleRowClassName}>
                    <span className="text-sm text-gray-700">Receber avisos por email</span>
                    <input
                      type="checkbox"
                      checked={profileForm.notificacoes_email}
                      onChange={(event) =>
                        handleProfileChange('notificacoes_email', event.target.checked)
                      }
                      className={checkboxClassName}
                    />
                  </label>

                  <label className={preferenceToggleRowClassName}>
                    <span className="text-sm text-gray-700">Receber alertas in-app</span>
                    <input
                      type="checkbox"
                      checked={profileForm.notificacoes_push}
                      onChange={(event) =>
                        handleProfileChange('notificacoes_push', event.target.checked)
                      }
                      className={checkboxClassName}
                    />
                  </label>
                </div>

                <div className="space-y-3 rounded-lg border border-[#E5EEF2] bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <BellRing className="h-4 w-4 text-[#159A9C]" />
                    Centro de notificacoes (navegador)
                  </div>

                  <label className={preferenceToggleRowClassName}>
                    <div>
                      <span className="text-sm text-gray-700">Notificacoes do navegador</span>
                      <p className="mt-1 text-xs text-gray-500">{browserNotificationStateLabel}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationCenterSettings.browserNotifications}
                      onChange={(event) => {
                        void handleNotificationCenterBrowserToggle(event.target.checked);
                      }}
                      className={`mt-0.5 ${checkboxClassName}`}
                    />
                  </label>

                  <label className={preferenceToggleRowClassName}>
                    <div className="inline-flex items-start gap-2">
                      {notificationCenterSettings.soundEnabled ? (
                        <Volume2 className="mt-0.5 h-4 w-4 text-gray-400" />
                      ) : (
                        <VolumeX className="mt-0.5 h-4 w-4 text-gray-400" />
                      )}
                      <div>
                        <span className="text-sm text-gray-700">Som de notificacoes</span>
                        <p className="mt-1 text-xs text-gray-500">
                          Controla o som local do sino e alertas da central.
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationCenterSettings.soundEnabled}
                      onChange={(event) =>
                        handleNotificationCenterSoundToggle(event.target.checked)
                      }
                      className={`mt-0.5 ${checkboxClassName}`}
                    />
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={!canSaveProfile}
                  className={profileSaveButtonClassName}
                >
                  {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {profileSaving ? 'Salvando...' : 'Salvar dados'}
                </button>
              </div>
            </SectionCard>

            <SectionCard className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#002333]">Seguranca da conta</h3>
                <p className={sectionSubtitleClassName}>
                  Atualize sua senha para manter sua conta protegida.
                </p>
              </div>

              <form onSubmit={handleSavePassword} className="space-y-4">
                <div>
                  <label
                    htmlFor="senha-atual"
                    className={fieldLabelWithIconClassName}
                  >
                    <LockKeyhole className="h-4 w-4 text-gray-400" />
                    Senha atual
                  </label>
                  <div className="relative">
                    <input
                      id="senha-atual"
                      type={showPassword.atual ? 'text' : 'password'}
                      value={passwordForm.senhaAtual}
                      onChange={(event) => handlePasswordFieldChange('senhaAtual', event.target.value)}
                      className={inputWithTrailingButtonClassName}
                      placeholder="Digite sua senha atual"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((previous) => ({ ...previous, atual: !previous.atual }))}
                      className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-gray-500 hover:text-gray-700"
                    >
                      {showPassword.atual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="senha-nova" className={fieldLabelClassName}>
                      Nova senha
                    </label>
                    <div className="relative">
                      <input
                        id="senha-nova"
                        type={showPassword.nova ? 'text' : 'password'}
                        value={passwordForm.senhaNova}
                        onChange={(event) => handlePasswordFieldChange('senhaNova', event.target.value)}
                        className={inputWithTrailingButtonClassName}
                        placeholder="Minimo 6 caracteres"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((previous) => ({ ...previous, nova: !previous.nova }))}
                        className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-gray-500 hover:text-gray-700"
                      >
                        {showPassword.nova ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="senha-confirmar" className={fieldLabelClassName}>
                      Confirmar nova senha
                    </label>
                    <div className="relative">
                      <input
                        id="senha-confirmar"
                        type={showPassword.confirmacao ? 'text' : 'password'}
                        value={passwordForm.confirmarSenha}
                        onChange={(event) =>
                          handlePasswordFieldChange('confirmarSenha', event.target.value)
                        }
                        className={inputWithTrailingButtonClassName}
                        placeholder="Repita a nova senha"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((previous) => ({
                            ...previous,
                            confirmacao: !previous.confirmacao,
                          }))
                        }
                        className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-gray-500 hover:text-gray-700"
                      >
                        {showPassword.confirmacao ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
                  <p className={passwordValidation.senhaAtualValida ? 'text-green-700' : ''}>
                    {passwordValidation.senhaAtualValida ? 'OK' : 'Pendente'} Senha atual informada
                  </p>
                  <p className={passwordValidation.tamanhoMinimo ? 'text-green-700' : ''}>
                    {passwordValidation.tamanhoMinimo ? 'OK' : 'Pendente'} Minimo de{' '}
                    {PASSWORD_MIN_LENGTH} caracteres
                  </p>
                  <p className={passwordValidation.diferenteAtual ? 'text-green-700' : ''}>
                    {passwordValidation.diferenteAtual ? 'OK' : 'Pendente'} Nova senha diferente da atual
                  </p>
                  <p className={passwordValidation.confirmacaoValida ? 'text-green-700' : ''}>
                    {passwordValidation.confirmacaoValida ? 'OK' : 'Pendente'} Confirmacao igual a nova
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!canSavePassword}
                  className={passwordSaveButtonClassName}
                  >
                    {passwordSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LockKeyhole className="h-4 w-4" />
                    )}
                    {passwordSaving ? 'Atualizando senha...' : 'Atualizar senha'}
                  </button>
                </div>
              </form>
            </SectionCard>

            <SectionCard className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#002333]">Privacidade e LGPD</h3>
                <p className={sectionSubtitleClassName}>
                  Exporte seus dados e registre solicitacoes formais de privacidade.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-[#E5EEF2] bg-[#FBFDFD] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <Download className="h-4 w-4 text-[#159A9C]" />
                        Exportar meus dados
                      </h4>
                      <p className="mt-1 text-xs text-gray-600">
                        Gera um arquivo JSON com perfil, empresa, atividades e notificacoes recentes.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportOwnData}
                      disabled={privacyExporting}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#159A9C] px-4 text-sm font-semibold text-[#159A9C] transition hover:bg-[#159A9C] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {privacyExporting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Exportando...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Baixar JSON
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-[#F4D8D8] bg-[#FFF9F9] p-4">
                  <div className="mb-3 flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-4 w-4 text-[#C26A6A]" />
                    <div>
                      <h4 className="text-sm font-semibold text-[#7A2F2F]">
                        Solicitacoes de privacidade (nao automaticas)
                      </h4>
                      <p className="mt-1 text-xs text-[#8B5A5A]">
                        Essas acoes registram um protocolo para avaliacao administrativa. Nenhuma exclusao
                        ou anonimização e aplicada automaticamente.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => void handleCreatePrivacyRequest('account_anonymization')}
                      disabled={privacyRequestingType !== null}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#E6C98C] bg-white px-4 text-sm font-semibold text-[#A06A00] transition hover:bg-[#FFF8E8] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {privacyRequestingType === 'account_anonymization' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileWarning className="h-4 w-4" />
                      )}
                      Solicitar anonimização
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleCreatePrivacyRequest('account_deletion')}
                      disabled={privacyRequestingType !== null}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#E7B4B4] bg-white px-4 text-sm font-semibold text-[#B13E3E] transition hover:bg-[#FFF4F4] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {privacyRequestingType === 'account_deletion' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Solicitar exclusao
                    </button>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard className="p-6">
              <h3 className="text-lg font-semibold text-[#002333]">Atividade recente</h3>

              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <div className={activityRowClassName}>
                  <span>Ultimo login</span>
                  <span className="font-medium text-gray-900">{formatDateLabel(user?.ultimo_login)}</span>
                </div>
                <div className={activityRowClassName}>
                  <span>Ultima atualizacao de perfil</span>
                  <span className="font-medium text-gray-900">{formatDateLabel(user?.updated_at)}</span>
                </div>
                <div className={activityRowClassName}>
                  <span>Criacao da conta</span>
                  <span className="font-medium text-gray-900">{formatDateLabel(user?.created_at)}</span>
                </div>
              </div>
            </SectionCard>
          </div>
      </div>
    </div>
  );
};

export default PerfilPage;
