/**
 * GESTÃO DE USUÁRIOS - CONECT CRM
 *
 * Tela unificada de gestão de usuários do sistema.
 * Substitui a antiga GestaoAtendentesPage, consolidando gestão de:
 * - Usuários gerais (todos os roles)
 * - Atendentes (usuários com permissão ATENDIMENTO)
 *
 * Padrão: HubSpot/Salesforce/Pipedrive
 * Tema: Crevasse Professional
 * Cor primary: #159A9C (Crevasse-2 teal)
 */

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  Users,
  Shield,
  UserCheck,
  Key,
  Mail,
  Phone,
  Upload,
  Copy,
  ChevronDown,
  Info,
} from 'lucide-react';
import { BackToNucleus } from '../../../components/navigation/BackToNucleus';
import { usuariosService } from '../../../services/usuariosService';
import {
  Usuario,
  NovoUsuario,
  AtualizarUsuario,
  UserRole,
  PermissionCatalogResponse,
  ROLE_LABELS,
  ROLE_COLORS,
  STATUS_ATENDENTE_LABELS,
  STATUS_ATENDENTE_COLORS,
} from '../../../types/usuarios';

type AbaAtiva = 'todos' | 'atendentes';

type FeedbackState = {
  type: 'success' | 'error' | 'info';
  message: string;
  title?: string;
};

type ConfirmDialogState = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  onConfirm?: () => Promise<void> | void;
  errorMessage?: string;
};

type ApiErrorResponse = {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
};

const extractApiMessage = (error: unknown): string | undefined => {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const message = (error as ApiErrorResponse).response?.data?.message;
  if (Array.isArray(message)) {
    return message.join('. ');
  }

  return typeof message === 'string' ? message : undefined;
};

const getErrorMessage = (error: unknown, fallback?: string): string => {
  const apiMessage = extractApiMessage(error);
  if (apiMessage) {
    return apiMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback ?? 'Erro inesperado';
};

const PERMISSAO_ATENDIMENTO_TOKENS = new Set([
  'ATENDIMENTO',
  'ATENDIMENTO_DLQ_MANAGE',
  'ATENDIMENTO_CHATS_READ',
  'ATENDIMENTO_CHATS_REPLY',
  'ATENDIMENTO_TICKETS_READ',
  'ATENDIMENTO_TICKETS_CREATE',
  'ATENDIMENTO_TICKETS_UPDATE',
  'ATENDIMENTO_TICKETS_ASSIGN',
  'ATENDIMENTO_TICKETS_CLOSE',
  'ATENDIMENTO_FILAS_MANAGE',
  'ATENDIMENTO_SLA_MANAGE',
  'atendimento.dlq.manage',
  'atendimento.chats.read',
  'atendimento.chats.reply',
  'atendimento.tickets.read',
  'atendimento.tickets.create',
  'atendimento.tickets.update',
  'atendimento.tickets.assign',
  'atendimento.tickets.close',
  'atendimento.filas.manage',
  'atendimento.sla.manage',
]);

type PermissaoModalOption = { value: string; label: string; legacy?: boolean };
type PermissaoModalGroup = {
  id: string;
  label: string;
  description?: string;
  roles: string[];
  options: PermissaoModalOption[];
};

type PermissionCatalogState = {
  groups: PermissaoModalGroup[];
  defaultsByRole: Record<string, string[]>;
};

const PERMISSOES_MODAL_GROUPS_FALLBACK: PermissaoModalGroup[] = [
  {
    id: 'insights',
    label: 'Dashboards e Relatorios',
    description: 'Visualizacao de indicadores e analises',
    roles: [
      UserRole.USER,
      UserRole.VENDEDOR,
      UserRole.FINANCEIRO,
      UserRole.MANAGER,
      UserRole.ADMIN,
      UserRole.SUPERADMIN,
    ],
    options: [
      { value: 'dashboard.read', label: 'Dashboard: visualizar' },
      { value: 'relatorios.read', label: 'Relatorios: visualizar' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    description: 'Clientes, leads, oportunidades, produtos e agenda',
    roles: [
      UserRole.USER,
      UserRole.VENDEDOR,
      UserRole.FINANCEIRO,
      UserRole.MANAGER,
      UserRole.ADMIN,
      UserRole.SUPERADMIN,
    ],
    options: [
      { value: 'crm.clientes.read', label: 'Clientes: visualizar' },
      { value: 'crm.clientes.create', label: 'Clientes: criar' },
      { value: 'crm.clientes.update', label: 'Clientes: editar' },
      { value: 'crm.clientes.delete', label: 'Clientes: excluir' },
      { value: 'crm.leads.read', label: 'Leads: visualizar' },
      { value: 'crm.leads.create', label: 'Leads: criar' },
      { value: 'crm.leads.update', label: 'Leads: editar' },
      { value: 'crm.leads.delete', label: 'Leads: excluir' },
      { value: 'crm.oportunidades.read', label: 'Oportunidades: visualizar' },
      { value: 'crm.oportunidades.create', label: 'Oportunidades: criar' },
      { value: 'crm.oportunidades.update', label: 'Oportunidades: editar' },
      { value: 'crm.oportunidades.delete', label: 'Oportunidades: excluir' },
      { value: 'crm.produtos.read', label: 'Produtos: visualizar' },
      { value: 'crm.produtos.create', label: 'Produtos: criar' },
      { value: 'crm.produtos.update', label: 'Produtos: editar' },
      { value: 'crm.produtos.delete', label: 'Produtos: excluir' },
      { value: 'crm.agenda.read', label: 'Agenda: visualizar' },
      { value: 'crm.agenda.create', label: 'Agenda: criar' },
      { value: 'crm.agenda.update', label: 'Agenda: editar' },
      { value: 'crm.agenda.delete', label: 'Agenda: excluir' },
    ],
  },
  {
    id: 'atendimento',
    label: 'Atendimento',
    description: 'Controle de acesso para chats e tickets',
    roles: [
      UserRole.USER,
      UserRole.VENDEDOR,
      UserRole.MANAGER,
      UserRole.ADMIN,
      UserRole.SUPERADMIN,
    ],
    options: [
      { value: 'atendimento.chats.read', label: 'Chats: visualizar' },
      { value: 'atendimento.chats.reply', label: 'Chats: responder' },
      { value: 'atendimento.tickets.read', label: 'Tickets: visualizar' },
      { value: 'atendimento.tickets.create', label: 'Tickets: criar ticket' },
      { value: 'atendimento.tickets.update', label: 'Tickets: editar ticket' },
      { value: 'atendimento.tickets.assign', label: 'Tickets: atribuir' },
      { value: 'atendimento.tickets.close', label: 'Tickets: encerrar/reabrir' },
      { value: 'atendimento.filas.manage', label: 'Filas: gerenciar' },
      { value: 'atendimento.sla.manage', label: 'SLA: gerenciar' },
      { value: 'atendimento.dlq.manage', label: 'Atendimento: DLQ' },
      { value: 'ATENDIMENTO', label: 'Atendimento (legado)' },
    ],
  },
  {
    id: 'comercial',
    label: 'Comercial',
    description: 'Acesso aos recursos comerciais',
    roles: [
      UserRole.USER,
      UserRole.VENDEDOR,
      UserRole.FINANCEIRO,
      UserRole.MANAGER,
      UserRole.ADMIN,
      UserRole.SUPERADMIN,
    ],
    options: [
      { value: 'comercial.propostas.read', label: 'Propostas: visualizar' },
      { value: 'comercial.propostas.create', label: 'Propostas: criar' },
      { value: 'comercial.propostas.update', label: 'Propostas: editar' },
      { value: 'comercial.propostas.delete', label: 'Propostas: excluir' },
      { value: 'comercial.propostas.send', label: 'Propostas: enviar' },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    description: 'Faturamento e pagamentos',
    roles: [UserRole.FINANCEIRO, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPERADMIN],
    options: [
      { value: 'financeiro.faturamento.read', label: 'Faturamento: visualizar' },
      { value: 'financeiro.faturamento.manage', label: 'Faturamento: gerenciar' },
      { value: 'financeiro.pagamentos.read', label: 'Pagamentos: visualizar' },
      { value: 'financeiro.pagamentos.manage', label: 'Pagamentos: gerenciar' },
    ],
  },
  {
    id: 'configuracoes',
    label: 'Configuracoes',
    description: 'Empresa, integracoes e automacoes',
    roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPERADMIN],
    options: [
      { value: 'config.empresa.read', label: 'Empresa: visualizar configuracoes' },
      { value: 'config.empresa.update', label: 'Empresa: atualizar configuracoes' },
      { value: 'config.integracoes.manage', label: 'Integracoes: gerenciar' },
      { value: 'config.automacoes.manage', label: 'Automacoes: gerenciar' },
    ],
  },
  {
    id: 'administracao',
    label: 'Administracao',
    description: 'Permissoes de gestao de usuarios e governanca',
    roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPERADMIN],
    options: [
      { value: 'users.read', label: 'Usuarios: visualizar' },
      { value: 'users.create', label: 'Usuarios: criar' },
      { value: 'users.update', label: 'Usuarios: editar' },
      { value: 'users.reset-password', label: 'Usuarios: resetar senha' },
      { value: 'users.status.update', label: 'Usuarios: alterar status' },
      { value: 'users.bulk.update', label: 'Usuarios: acao em massa' },
      { value: 'planos.manage', label: 'Planos: gerenciar' },
      { value: 'admin.empresas.manage', label: 'Empresas: administracao' },
    ],
  },
];

const DEFAULT_PERMISSION_CATALOG: PermissionCatalogState = {
  groups: PERMISSOES_MODAL_GROUPS_FALLBACK,
  defaultsByRole: {},
};

const getRoleCandidates = (role?: UserRole): string[] => {
  const selectedRole = role ?? UserRole.USER;

  if (selectedRole === UserRole.MANAGER) {
    return [UserRole.MANAGER, 'gerente'];
  }

  if (selectedRole === UserRole.USER) {
    return [UserRole.USER, 'suporte'];
  }

  return [selectedRole];
};

const getPermissionGroupsByRole = (
  catalog: PermissionCatalogState,
  role?: UserRole,
): PermissaoModalGroup[] => {
  const roleCandidates = new Set(getRoleCandidates(role));
  return catalog.groups.filter((group) => group.roles.some((groupRole) => roleCandidates.has(groupRole)));
};

const getVisiblePermissionValuesByRole = (
  catalog: PermissionCatalogState,
  role?: UserRole,
): Set<string> => {
  const groups = getPermissionGroupsByRole(catalog, role);
  return new Set(groups.flatMap((group) => group.options.map((option) => option.value)));
};

const getRecommendedPermissionsByRole = (
  catalog: PermissionCatalogState,
  role?: UserRole,
): string[] => {
  const roleCandidates = getRoleCandidates(role);

  for (const candidate of roleCandidates) {
    const defaults = catalog.defaultsByRole[candidate];
    if (Array.isArray(defaults) && defaults.length > 0) {
      return defaults;
    }
  }

  return [];
};

const getGroupPermissionValues = (group: PermissaoModalGroup): string[] =>
  Array.from(new Set(group.options.map((option) => option.value)));

const mapPermissionCatalogPayload = (payload: PermissionCatalogResponse): PermissionCatalogState => {
  const groups = Array.isArray(payload.groups)
    ? payload.groups
        .filter(
          (group) =>
            group &&
            typeof group.id === 'string' &&
            typeof group.label === 'string' &&
            Array.isArray(group.roles) &&
            Array.isArray(group.options),
        )
        .map((group) => ({
          id: group.id,
          label: group.label,
          description: group.description,
          roles: group.roles.filter((role) => typeof role === 'string'),
          options: group.options
            .filter(
              (option) =>
                option &&
                typeof option.value === 'string' &&
                option.value.trim().length > 0 &&
                typeof option.label === 'string' &&
                option.label.trim().length > 0,
            )
            .map((option) => ({
              value: option.value,
              label: option.label,
              legacy: Boolean(option.legacy),
            })),
        }))
        .filter((group) => group.options.length > 0 && group.roles.length > 0)
    : [];

  return {
    groups: groups.length > 0 ? groups : DEFAULT_PERMISSION_CATALOG.groups,
    defaultsByRole:
      payload.defaultsByRole && typeof payload.defaultsByRole === 'object'
        ? payload.defaultsByRole
        : DEFAULT_PERMISSION_CATALOG.defaultsByRole,
  };
};

const GestaoUsuariosPage: React.FC = () => {
  // Estados principais
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUsuariosSistema, setTotalUsuariosSistema] = useState(0);
  const [busca, setBusca] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('todos');
  const [permissionCatalog, setPermissionCatalog] = useState<PermissionCatalogState | null>(null);

  // Filtros
  const [filtroRole, setFiltroRole] = useState<UserRole | ''>('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [apenasAtendentes, setApenasAtendentes] = useState(false);

  // Estados de UI
  const [showDialog, setShowDialog] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [usuariosSelecionados, setUsuariosSelecionados] = useState<string[]>([]);
  const [showResetSenhaDialog, setShowResetSenhaDialog] = useState(false);
  const [usuarioResetSenha, setUsuarioResetSenha] = useState<Usuario | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<NovoUsuario>>({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    role: UserRole.USER,
    permissoes: [],
    ativo: true,
    idioma_preferido: 'pt-BR',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    description: '',
  });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [resetSenhaLoading, setResetSenhaLoading] = useState(false);
  const [novaSenhaGerada, setNovaSenhaGerada] = useState<string | null>(null);
  const [resetSenhaError, setResetSenhaError] = useState<string | null>(null);

  const showFeedback = (type: FeedbackState['type'], message: string, title?: string): void => {
    setFeedback({ type, message, title });
  };

  const dismissFeedback = (): void => setFeedback(null);

  const feedbackStyles: Record<FeedbackState['type'], { container: string; icon: string }> = {
    success: {
      container: 'bg-white border border-[#159A9C]/40 text-[#002333] shadow-lg shadow-[#159A9C]/10',
      icon: 'text-[#159A9C]',
    },
    error: {
      container: 'bg-white border border-red-200 text-red-700 shadow-lg shadow-red-200/70',
      icon: 'text-red-500',
    },
    info: {
      container: 'bg-white border border-sky-200 text-sky-700 shadow-lg shadow-sky-200/70',
      icon: 'text-sky-500',
    },
  };

  useEffect(() => {
    if (!feedback) return;
    const timeoutId = window.setTimeout(() => {
      setFeedback(null);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const feedbackIconMap: Record<FeedbackState['type'], React.ElementType> = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };

  const getConfirmButtonClasses = (variant?: 'primary' | 'danger'): string =>
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      : 'bg-[#159A9C] hover:bg-[#0F7B7D] focus:ring-[#159A9C]';

  const openConfirmDialog = (config: Omit<ConfirmDialogState, 'open'>): void => {
    setConfirmDialog({
      open: true,
      ...config,
      errorMessage: undefined,
    });
  };

  const closeConfirmDialog = (): void => {
    setConfirmLoading(false);
    setConfirmDialog({
      open: false,
      title: '',
      description: '',
      confirmLabel: undefined,
      cancelLabel: undefined,
      variant: undefined,
      onConfirm: undefined,
      errorMessage: undefined,
    });
  };

  const handleConfirmDialog = async (): Promise<void> => {
    if (!confirmDialog.onConfirm) {
      closeConfirmDialog();
      return;
    }

    try {
      setConfirmLoading(true);
      await confirmDialog.onConfirm();
      closeConfirmDialog();
    } catch (error) {
      console.error('Erro na ação confirmada:', error);
      setConfirmLoading(false);
      const message = getErrorMessage(error, 'Não foi possível concluir a ação. Tente novamente.');
      setConfirmDialog((prev) => ({
        ...prev,
        errorMessage: message,
      }));
      showFeedback('error', message);
    }
  };

  // Carregar dados ao montar componente
  useEffect(() => {
    carregarDados();
    carregarCatalogoPermissoes();
  }, []);

  // Atualizar lista quando aba muda
  useEffect(() => {
    if (abaAtiva === 'atendentes') {
      setApenasAtendentes(true);
    } else {
      setApenasAtendentes(false);
    }
  }, [abaAtiva]);

  const carregarDados = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const { usuarios: lista, total } = await usuariosService.listarUsuarios({
        limite: 1000,
        pagina: 1,
      });
      setUsuarios(lista);
      setTotalUsuariosSistema(total);
    } catch (err: unknown) {
      console.error('Erro ao carregar usuários:', err);
      setError(getErrorMessage(err, 'Erro ao carregar usuários'));
      setUsuarios([]);
      setTotalUsuariosSistema(0);
    } finally {
      setLoading(false);
    }
  };

  const carregarCatalogoPermissoes = async (): Promise<void> => {
    try {
      const catalogo = await usuariosService.obterCatalogoPermissoes();
      setPermissionCatalog(mapPermissionCatalogPayload(catalogo));
    } catch (err: unknown) {
      console.warn('Nao foi possivel carregar catalogo de permissoes, fallback local sera usado.', err);
      setPermissionCatalog(null);
    }
  };

  // Filtrar usuários
  const usuariosFiltrados = usuarios.filter((usuario) => {
    // Filtro de busca (nome ou email)
    if (busca) {
      const buscaLower = busca.toLowerCase();
      const matchNome = usuario.nome?.toLowerCase().includes(buscaLower);
      const matchEmail = usuario.email?.toLowerCase().includes(buscaLower);
      if (!matchNome && !matchEmail) return false;
    }

    // Filtro de role
    if (filtroRole && usuario.role !== filtroRole) return false;

    // Filtro de status
    if (filtroStatus === 'ativos' && !usuario.ativo) return false;
    if (filtroStatus === 'inativos' && usuario.ativo) return false;

    // Filtro de atendentes
    if (apenasAtendentes) {
      const temPermissaoAtendimento =
        usuario.permissoes?.some((perm) => PERMISSAO_ATENDIMENTO_TOKENS.has(perm)) ?? false;
      if (!temPermissaoAtendimento) return false;
    }

    return true;
  });

  // Calcular KPIs
  const totalUsuarios = totalUsuariosSistema;
  const usuariosAtivos = usuarios.filter((u) => u.ativo).length;
  const administradores = usuarios.filter(
    (u) => u.role === UserRole.ADMIN || u.role === UserRole.SUPERADMIN,
  ).length;
  const onlineHoje = usuarios.filter((u) => {
    if (!u.ultimo_login) return false;
    const hoje = new Date();
    const ultimoLogin = new Date(u.ultimo_login);
    return ultimoLogin.toDateString() === hoje.toDateString();
  }).length;

  const handleOpenDialog = (usuario?: Usuario): void => {
    setFormError(null);
    if (usuario) {
      setEditingUsuario(usuario);
      setFormData({
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone || '',
        role: usuario.role,
        permissoes: usuario.permissoes || [],
        ativo: usuario.ativo,
        avatar_url: usuario.avatar_url,
        idioma_preferido: usuario.idioma_preferido || 'pt-BR',
      });
    } else {
      setEditingUsuario(null);
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        senha: '',
        role: UserRole.USER,
        permissoes: [],
        ativo: true,
        idioma_preferido: 'pt-BR',
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = (): void => {
    setShowDialog(false);
    setEditingUsuario(null);
    setFormError(null);
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      senha: '',
      role: UserRole.USER,
      permissoes: [],
      ativo: true,
      idioma_preferido: 'pt-BR',
    });
  };

  const handleSave = async (): Promise<void> => {
    try {
      setFormError(null);
      let successMessage = '';

      if (editingUsuario) {
        const dadosAtualizacao: AtualizarUsuario = {
          id: editingUsuario.id,
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          role: formData.role,
          permissoes: formData.permissoes,
          ativo: formData.ativo,
          avatar_url: formData.avatar_url,
          idioma_preferido: formData.idioma_preferido,
        };
        await usuariosService.atualizarUsuario(dadosAtualizacao);
        setUsuarios((prev) =>
          prev.map((u) => (u.id === editingUsuario.id ? { ...u, ...dadosAtualizacao } : u)),
        );
        successMessage = 'Usuário atualizado com sucesso.';
      } else {
        if (!formData.senha) {
          setFormError('Senha é obrigatória para criar novo usuário.');
          return;
        }
        const novoUsuario = await usuariosService.criarUsuario(formData as NovoUsuario);
        setUsuarios((prev) => [...prev, novoUsuario]);
        successMessage = 'Usuário criado com sucesso.';
      }

      handleCloseDialog();
      await carregarDados();
      showFeedback('success', successMessage);
    } catch (err: unknown) {
      console.error('Erro ao salvar usuário:', err);
      const message = getErrorMessage(err, 'Erro ao salvar usuário');
      setFormError(message);
      showFeedback('error', message);
    }
  };

  const handleDelete = (usuario: Usuario): void => {
    openConfirmDialog({
      title: 'Excluir usuário',
      description: `Deseja realmente excluir o usuário "${usuario.nome}"? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await usuariosService.excluirUsuario(usuario.id);
          setUsuarios((prev) => prev.filter((u) => u.id !== usuario.id));
          showFeedback('success', `Usuário "${usuario.nome}" excluído com sucesso.`);
        } catch (err: unknown) {
          console.error('Erro ao excluir usuário:', err);
          const message = getErrorMessage(err, 'Erro ao excluir usuário');
          throw new Error(message);
        }
      },
    });
  };

  const handleToggleStatus = async (usuario: Usuario): Promise<void> => {
    try {
      const novoStatus = !usuario.ativo;
      await usuariosService.alterarStatusUsuario(usuario.id, novoStatus);
      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuario.id ? { ...u, ativo: novoStatus } : u)),
      );
      showFeedback(
        'success',
        `Usuário "${usuario.nome}" ${novoStatus ? 'ativado' : 'desativado'} com sucesso.`,
      );
    } catch (err: unknown) {
      console.error('Erro ao alterar status:', err);
      showFeedback('error', getErrorMessage(err, 'Erro ao alterar status do usuário'));
    }
  };

  const handleResetSenha = (usuario: Usuario): void => {
    setUsuarioResetSenha(usuario);
    setNovaSenhaGerada(null);
    setResetSenhaError(null);
    setResetSenhaLoading(false);
    setShowResetSenhaDialog(true);
  };

  const handleConfirmResetSenha = async (): Promise<void> => {
    if (!usuarioResetSenha) return;

    try {
      setResetSenhaLoading(true);
      setResetSenhaError(null);
      const novaSenha = await usuariosService.resetarSenha(usuarioResetSenha.id);
      setNovaSenhaGerada(novaSenha);
      showFeedback('success', `Senha temporária gerada para ${usuarioResetSenha.email}.`);
    } catch (err: unknown) {
      console.error('Erro ao resetar senha:', err);
      const message = getErrorMessage(err, 'Erro ao resetar senha do usuário');
      setResetSenhaError(message);
      showFeedback('error', message);
    } finally {
      setResetSenhaLoading(false);
    }
  };

  const handleCloseResetSenhaDialog = (): void => {
    setShowResetSenhaDialog(false);
    setUsuarioResetSenha(null);
    setNovaSenhaGerada(null);
    setResetSenhaError(null);
    setResetSenhaLoading(false);
  };

  const handleCopyNovaSenha = async (): Promise<void> => {
    if (!novaSenhaGerada) return;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(novaSenhaGerada);
        showFeedback('success', 'Senha temporária copiada para a área de transferência.');
      } else {
        throw new Error('Recurso de copiar não disponível');
      }
    } catch (err) {
      console.error('Erro ao copiar senha temporária:', err);
      showFeedback('error', 'Não foi possível copiar a senha automaticamente. Copie manualmente.');
    }
  };

  const handleToggleSelecionado = (usuarioId: string): void => {
    setUsuariosSelecionados((prev) =>
      prev.includes(usuarioId) ? prev.filter((id) => id !== usuarioId) : [...prev, usuarioId],
    );
  };

  const handleSelecionarTodos = (): void => {
    if (usuariosSelecionados.length === usuariosFiltrados.length) {
      setUsuariosSelecionados([]);
    } else {
      setUsuariosSelecionados(usuariosFiltrados.map((u) => u.id));
    }
  };

  const handleBulkAction = (acao: 'ativar' | 'desativar' | 'excluir'): void => {
    if (usuariosSelecionados.length === 0) {
      showFeedback('info', 'Selecione pelo menos um usuário para realizar a ação.');
      return;
    }

    const quantidade = usuariosSelecionados.length;
    const descricaoAcao = `Deseja ${acao} ${quantidade} usuário(s) selecionado(s)?`;
    const tituloAcao =
      acao === 'excluir' ? 'Excluir usuários selecionados' : 'Atualizar status dos usuários';

    openConfirmDialog({
      title: tituloAcao,
      description: descricaoAcao,
      confirmLabel: acao === 'excluir' ? 'Excluir' : 'Confirmar',
      cancelLabel: 'Cancelar',
      variant: acao === 'excluir' ? 'danger' : 'primary',
      onConfirm: async () => {
        try {
          if (acao === 'ativar' || acao === 'desativar') {
            const novoStatus = acao === 'ativar';
            await Promise.all(
              usuariosSelecionados.map((id) =>
                usuariosService.alterarStatusUsuario(id, novoStatus),
              ),
            );
            setUsuarios((prev) =>
              prev.map((u) =>
                usuariosSelecionados.includes(u.id) ? { ...u, ativo: novoStatus } : u,
              ),
            );
            showFeedback(
              'success',
              `Usuários ${novoStatus ? 'ativados' : 'desativados'} com sucesso.`,
            );
          } else {
            await Promise.all(usuariosSelecionados.map((id) => usuariosService.excluirUsuario(id)));
            setUsuarios((prev) => prev.filter((u) => !usuariosSelecionados.includes(u.id)));
            showFeedback('success', 'Usuários excluídos com sucesso.');
          }

          setUsuariosSelecionados([]);
        } catch (err: unknown) {
          console.error(`Erro ao ${acao} usuários:`, err);
          const message = getErrorMessage(err, `Erro ao ${acao} usuários`);
          throw new Error(message);
        }
      },
    });
  };

  const catalogoPermissoes = permissionCatalog ?? DEFAULT_PERMISSION_CATALOG;

  const normalizePermissionsForRole = (role: UserRole, currentPermissions: string[] = []): string[] => {
    const visibleValues = getVisiblePermissionValuesByRole(catalogoPermissoes, role);
    const retainedPermissions = currentPermissions.filter(
      (permission) => visibleValues.has(permission) || permission === 'ATENDIMENTO',
    );
    const recommendedPermissions = getRecommendedPermissionsByRole(catalogoPermissoes, role);
    const nextPermissions =
      retainedPermissions.length > 0 ? retainedPermissions : [...recommendedPermissions];

    return Array.from(new Set(nextPermissions));
  };

  const handleRoleChange = (role: UserRole): void => {
    setFormData((prev) => ({
      ...prev,
      role,
      permissoes: normalizePermissionsForRole(role, prev.permissoes || []),
    }));
  };

  const handleTogglePermissao = (permissao: string): void => {
    setFormData((prev) => ({
      ...prev,
      permissoes: prev.permissoes?.includes(permissao)
        ? prev.permissoes.filter((p) => p !== permissao)
        : [...(prev.permissoes || []), permissao],
    }));
  };

  const handleTogglePermissoesDoGrupo = (grupo: PermissaoModalGroup, selecionado: boolean): void => {
    const groupValues = getGroupPermissionValues(grupo);
    if (groupValues.length === 0) {
      return;
    }

    setFormData((prev) => {
      const nextPermissions = new Set(prev.permissoes || []);

      if (selecionado) {
        groupValues.forEach((value) => nextPermissions.add(value));
      } else {
        groupValues.forEach((value) => nextPermissions.delete(value));
      }

      return {
        ...prev,
        permissoes: Array.from(nextPermissions),
      };
    });
  };

  const formatarDataHora = (data?: Date | string): string => {
    if (!data) return '-';
    const d = new Date(data);
    return (
      d.toLocaleDateString('pt-BR') +
      ' ' +
      d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  };

  const roleSelecionadoFormulario = (formData.role as UserRole) || UserRole.USER;
  const gruposPermissaoDoFormulario = getPermissionGroupsByRole(
    catalogoPermissoes,
    roleSelecionadoFormulario,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {feedback && (
        <div className="fixed top-24 right-8 z-50 w-full max-w-sm">
          <div
            className={`flex items-start gap-3 rounded-xl px-4 py-3 backdrop-blur-sm ${feedbackStyles[feedback.type].container}`}
          >
            {(() => {
              const IconComponent = feedbackIconMap[feedback.type];
              return (
                <IconComponent
                  className={`h-5 w-5 mt-0.5 flex-shrink-0 ${feedbackStyles[feedback.type].icon}`}
                />
              );
            })()}
            <div className="flex-1">
              {feedback.title && (
                <p className="text-sm font-semibold leading-5 text-inherit">{feedback.title}</p>
              )}
              <p className="text-sm leading-5 text-inherit">{feedback.message}</p>
            </div>
            <button
              type="button"
              onClick={dismissFeedback}
              aria-label="Fechar mensagem"
              className="flex-shrink-0 rounded-full p-1 text-inherit transition-colors hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header com BackToNucleus */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="Configurações" nucleusPath="/nuclei/configuracoes" />
      </div>

      {/* Container principal */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header da página */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                  <Users className="h-8 w-8 mr-3 text-[#159A9C]" />
                  Gestão de Usuários
                </h1>
                <p className="text-gray-600 mt-1">
                  Gerencie usuários, permissões e atendentes do sistema
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={carregarDados}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>

                <button
                  onClick={() => handleOpenDialog()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Novo Usuário
                </button>
              </div>
            </div>
          </div>
          {/* Dashboard Cards (4 KPIs) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Card 1 - Total de Usuários */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                  <p className="text-3xl font-bold text-[#002333] mt-2">{totalUsuarios}</p>
                </div>
                <div className="p-4 bg-[#159A9C]/10 rounded-xl">
                  <Users className="h-8 w-8 text-[#159A9C]" />
                </div>
              </div>
            </div>

            {/* Card 2 - Usuários Ativos */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                  <p className="text-3xl font-bold text-[#002333] mt-2">{usuariosAtivos}</p>
                </div>
                <div className="p-4 bg-green-500/10 rounded-xl">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Card 3 - Administradores */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Administradores</p>
                  <p className="text-3xl font-bold text-[#002333] mt-2">{administradores}</p>
                </div>
                <div className="p-4 bg-red-500/10 rounded-xl">
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </div>

            {/* Card 4 - Online Hoje */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Online Hoje</p>
                  <p className="text-3xl font-bold text-[#002333] mt-2">{onlineHoje}</p>
                </div>
                <div className="p-4 bg-[#159A9C]/10 rounded-xl">
                  <UserCheck className="h-8 w-8 text-[#159A9C]" />
                </div>
              </div>
            </div>
          </div>

          {/* Abas */}
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="border-b">
              <div className="flex">
                <button
                  onClick={() => setAbaAtiva('todos')}
                  className={`px-6 py-3 font-medium transition-colors border-b-2 ${abaAtiva === 'todos'
                      ? 'border-[#159A9C] text-[#159A9C]'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Todos os Usuários
                </button>
                <button
                  onClick={() => setAbaAtiva('atendentes')}
                  className={`px-6 py-3 font-medium transition-colors border-b-2 ${abaAtiva === 'atendentes'
                      ? 'border-[#159A9C] text-[#159A9C]'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Atendentes
                </button>
              </div>
            </div>

            {/* Barra de busca e filtros */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  />
                </div>

                {/* Filtro Role */}
                <div className="relative">
                  <select
                    value={filtroRole}
                    onChange={(e) => setFiltroRole(e.target.value as UserRole | '')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent appearance-none bg-white pr-10"
                  >
                    <option value="">Todos os papéis</option>
                    <option value={UserRole.SUPERADMIN}>Super Admin</option>
                    <option value={UserRole.ADMIN}>Administrador</option>
                    <option value={UserRole.MANAGER}>Gerente</option>
                    <option value={UserRole.FINANCEIRO}>Financeiro</option>
                    <option value={UserRole.VENDEDOR}>Vendedor</option>
                    <option value={UserRole.USER}>Usuário</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>

                {/* Filtro Status */}
                <div className="relative">
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value as typeof filtroStatus)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent appearance-none bg-white pr-10"
                  >
                    <option value="todos">Todos os status</option>
                    <option value="ativos">Apenas ativos</option>
                    <option value="inativos">Apenas inativos</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>

                {/* Checkbox Apenas Atendentes (só aparece na aba "Todos") */}
                {abaAtiva === 'todos' && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="apenasAtendentes"
                      checked={apenasAtendentes}
                      onChange={(e) => setApenasAtendentes(e.target.checked)}
                      className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                    />
                    <label
                      htmlFor="apenasAtendentes"
                      className="ml-2 text-sm text-gray-700 cursor-pointer"
                    >
                      Apenas atendentes
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ações em massa */}
          {usuariosSelecionados.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {usuariosSelecionados.length} usuário(s) selecionado(s)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkAction('ativar')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Ativar
                  </button>
                  <button
                    onClick={() => handleBulkAction('desativar')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                  >
                    Desativar
                  </button>
                  <button
                    onClick={() => handleBulkAction('excluir')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <RefreshCw className="h-8 w-8 text-[#159A9C] animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Carregando usuários...</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-900 font-medium mb-2">Erro ao carregar dados</p>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={carregarDados}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && usuariosFiltrados.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-900 font-medium mb-2">
                {busca || filtroRole || filtroStatus !== 'todos' || apenasAtendentes
                  ? 'Nenhum usuário encontrado'
                  : 'Nenhum usuário cadastrado'}
              </p>
              <p className="text-gray-600 mb-4">
                {busca || filtroRole || filtroStatus !== 'todos' || apenasAtendentes
                  ? 'Tente ajustar os filtros de busca'
                  : 'Crie seu primeiro usuário para começar'}
              </p>
              {!busca && !filtroRole && filtroStatus === 'todos' && !apenasAtendentes && (
                <button
                  onClick={() => handleOpenDialog()}
                  className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Usuário
                </button>
              )}
            </div>
          )}

          {/* Tabela de usuários */}
          {!loading && !error && usuariosFiltrados.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            usuariosSelecionados.length === usuariosFiltrados.length &&
                            usuariosFiltrados.length > 0
                          }
                          onChange={handleSelecionarTodos}
                          className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Papel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      {abaAtiva === 'atendentes' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status Atendente
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Último Login
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usuariosFiltrados.map((usuario) => (
                      <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={usuariosSelecionados.includes(usuario.id)}
                            onChange={() => handleToggleSelecionado(usuario.id)}
                            className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {usuario.avatar_url ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={usuario.avatar_url}
                                  alt={usuario.nome}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] flex items-center justify-center">
                                  <span className="text-white font-medium text-sm">
                                    {usuario.nome?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {usuario.nome}
                              </div>
                              <div className="text-sm text-gray-500">{usuario.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[usuario.role]}`}
                          >
                            {ROLE_LABELS[usuario.role]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${usuario.ativo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {usuario.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        {abaAtiva === 'atendentes' && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            {usuario.status_atendente ? (
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_ATENDENTE_COLORS[usuario.status_atendente]}`}
                              >
                                {STATUS_ATENDENTE_LABELS[usuario.status_atendente]}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatarDataHora(usuario.ultimo_login)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenDialog(usuario)}
                              className="text-[#159A9C] hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(usuario)}
                              className={`${usuario.ativo
                                  ? 'text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50'
                                  : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                                } p-1 rounded transition-colors`}
                              title={usuario.ativo ? 'Desativar' : 'Ativar'}
                            >
                              {usuario.ativo ? (
                                <AlertCircle className="h-4 w-4" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleResetSenha(usuario)}
                              className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-50 rounded transition-colors"
                              title="Resetar senha"
                            >
                              <Key className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(usuario)}
                              className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criar/Editar Usuário */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
                </h2>
                <button
                  onClick={handleCloseDialog}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nome || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  placeholder="Nome completo do usuário"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.telefone || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, telefone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              {/* Senha (apenas ao criar) */}
              {!editingUsuario && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.senha || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, senha: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
              )}

              {/* Papel/Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Papel <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role || UserRole.USER}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  required
                >
                  {editingUsuario?.role === UserRole.SUPERADMIN && (
                    <option value={UserRole.SUPERADMIN}>Super Admin</option>
                  )}
                  <option value={UserRole.USER}>Usuário</option>
                  <option value={UserRole.VENDEDOR}>Vendedor</option>
                  <option value={UserRole.FINANCEIRO}>Financeiro</option>
                  <option value={UserRole.MANAGER}>Gerente</option>
                  <option value={UserRole.ADMIN}>Administrador</option>
                </select>
              </div>
              {/* Permissões */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissões</label>
                <div className="space-y-4 border border-gray-300 rounded-lg p-4 bg-gray-50/50">
                  {gruposPermissaoDoFormulario.map((grupo) => {
                    const groupValues = getGroupPermissionValues(grupo);
                    const selectedCount = groupValues.filter((value) =>
                      formData.permissoes?.includes(value),
                    ).length;
                    const allSelected = groupValues.length > 0 && selectedCount === groupValues.length;
                    const partiallySelected = selectedCount > 0 && !allSelected;

                    return (
                      <div key={grupo.id} className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[#002333]">{grupo.label}</p>
                            {grupo.description && (
                              <p className="text-xs text-gray-500 mt-0.5">{grupo.description}</p>
                            )}
                          </div>
                          <label className="flex items-center cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={(element) => {
                                if (element) {
                                  element.indeterminate = partiallySelected;
                                }
                              }}
                              onChange={(event) =>
                                handleTogglePermissoesDoGrupo(grupo, event.target.checked)
                              }
                              className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                            />
                            <span className="ml-2 text-xs font-medium text-gray-600 whitespace-nowrap">
                              Selecionar todos ({selectedCount}/{groupValues.length})
                            </span>
                          </label>
                        </div>
                        <div className="space-y-2 mt-3">
                          {grupo.options.map((permOption) => (
                            <label key={permOption.value} className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.permissoes?.includes(permOption.value) || false}
                                onChange={() => handleTogglePermissao(permOption.value)}
                                className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">{permOption.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {gruposPermissaoDoFormulario.length === 0 && (
                    <p className="text-sm text-gray-500">
                      Nenhuma permissão disponível para o papel selecionado.
                    </p>
                  )}
                </div>
              </div>
              {/* Avatar URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Avatar (URL)</label>
                <div className="relative">
                  <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    value={formData.avatar_url || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, avatar_url: e.target.value }))
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                    placeholder="https://exemplo.com/avatar.jpg"
                  />
                </div>
              </div>

              {/* Status Ativo */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo || false}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ativo: e.target.checked }))}
                  className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                />
                <label htmlFor="ativo" className="ml-2 text-sm text-gray-700 cursor-pointer">
                  Usuário ativo
                </label>
              </div>
            </div>

            {formError && (
              <div className="px-6">
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              </div>
            )}

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={handleCloseDialog}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors"
              >
                {editingUsuario ? 'Salvar Alterações' : 'Criar Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reset de Senha */}
      {showResetSenhaDialog && usuarioResetSenha && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Resetar senha do usuário</h2>
                <button
                  onClick={handleCloseResetSenhaDialog}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {resetSenhaError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {resetSenhaError}
                </div>
              )}

              {novaSenhaGerada ? (
                <>
                  <div>
                    <p className="text-gray-700">
                      Uma senha temporária foi gerada para o usuário{' '}
                      <span className="font-medium">{usuarioResetSenha.nome}</span>.
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Compartilhe esta senha de forma segura e oriente o usuário a alterá-la após o
                      próximo acesso.
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      No próximo login, o sistema solicitará obrigatoriamente o cadastro de uma nova
                      senha pessoal.
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#B4BEC9] bg-[#DEEFE7] px-4 py-3">
                    <span className="text-xs uppercase text-[#002333]/70">Senha temporária</span>
                    <p className="mt-1 font-mono text-lg font-semibold text-[#002333] break-all">
                      {novaSenhaGerada}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Registre esta senha de forma segura. Ela não ficará visível novamente.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-700">
                    Geraremos uma senha temporária forte e segura para que o usuário acesse
                    novamente a plataforma.
                  </p>
                  <div className="rounded-lg border border-[#B4BEC9] bg-white px-4 py-3">
                    <p className="text-sm text-gray-600">Usuário selecionado</p>
                    <p className="font-medium text-[#002333]">{usuarioResetSenha.nome}</p>
                    <p className="text-sm text-gray-600">{usuarioResetSenha.email}</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Após a geração, exibiremos a senha temporária para compartilhamento. Ao acessar
                    com ela, o sistema exigirá o cadastro de uma nova senha definitiva.
                  </p>
                </>
              )}
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={handleCloseResetSenhaDialog}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {novaSenhaGerada ? 'Fechar' : 'Cancelar'}
              </button>
              {novaSenhaGerada ? (
                <button
                  onClick={handleCopyNovaSenha}
                  className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copiar senha
                </button>
              ) : (
                <button
                  onClick={handleConfirmResetSenha}
                  disabled={resetSenhaLoading}
                  className={`px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2 ${resetSenhaLoading ? 'bg-[#159A9C]/80 cursor-not-allowed' : 'bg-[#159A9C] hover:bg-[#0F7B7D]'}`}
                >
                  {resetSenhaLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
                  {resetSenhaLoading ? 'Gerando...' : 'Gerar senha temporária'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-[#002333] bg-opacity-50"
            aria-hidden="true"
            onClick={closeConfirmDialog}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-[#002333]">
                  {confirmDialog.title || 'Confirmação necessária'}
                </h3>
                {confirmDialog.description && (
                  <p className="mt-2 text-sm text-gray-600">{confirmDialog.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={closeConfirmDialog}
                aria-label="Fechar confirmação"
                className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {confirmDialog.errorMessage && (
              <div className="px-6 py-4 bg-red-50 border-t border-red-100">
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-white/70 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{confirmDialog.errorMessage}</span>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={closeConfirmDialog}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
              >
                {confirmDialog.cancelLabel || 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDialog}
                disabled={confirmLoading}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmLoading ? 'cursor-not-allowed opacity-80' : ''
                  } ${getConfirmButtonClasses(confirmDialog.variant)}`}
              >
                {confirmLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  confirmDialog.confirmLabel || 'Confirmar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestaoUsuariosPage;
