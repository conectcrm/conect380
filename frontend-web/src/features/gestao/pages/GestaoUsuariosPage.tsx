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

import React, { useState, useEffect, useMemo } from 'react';
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
  Key,
  Mail,
  Phone,
  Upload,
  Copy,
} from 'lucide-react';
import {
  DataTableCard,
  EmptyState,
  FiltersBar,
  InlineStats,
  LoadingSkeleton,
  PageHeader,
  SectionCard,
} from '../../../components/layout-v2';
import ActiveEmpresaBadge from '../../../components/tenant/ActiveEmpresaBadge';
import { toastService } from '../../../services/toastService';
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
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [usuarioDetalhes, setUsuarioDetalhes] = useState<Usuario | null>(null);
  const [usuariosSelecionados, setUsuariosSelecionados] = useState<string[]>([]);
  const [tableDensity, setTableDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [paginaAtualUsuarios, setPaginaAtualUsuarios] = useState(1);
  const [itensPorPaginaUsuarios, setItensPorPaginaUsuarios] = useState(10);
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
  const [permissionSearch, setPermissionSearch] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    description: '',
  });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [resetSenhaLoading, setResetSenhaLoading] = useState(false);
  const [novaSenhaGerada, setNovaSenhaGerada] = useState<string | null>(null);
  const [resetSenhaError, setResetSenhaError] = useState<string | null>(null);

  const showFeedback = (
    type: 'success' | 'error' | 'info',
    message: string,
    title?: string,
  ): void => {
    const normalizedMessage = title ? `${title}. ${message}` : message;

    if (type === 'success') {
      toastService.success(normalizedMessage);
      return;
    }

    if (type === 'info') {
      toastService.info(normalizedMessage);
      return;
    }

    toastService.error(normalizedMessage);
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

  useEffect(() => {
    setPaginaAtualUsuarios(1);
  }, [busca, filtroRole, filtroStatus, apenasAtendentes, abaAtiva]);

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

  const totalPaginasUsuarios = Math.max(
    1,
    Math.ceil(usuariosFiltrados.length / itensPorPaginaUsuarios),
  );
  const paginaAtualUsuariosAjustada = Math.min(paginaAtualUsuarios, totalPaginasUsuarios);
  const indiceInicialUsuarios = (paginaAtualUsuariosAjustada - 1) * itensPorPaginaUsuarios;
  const indiceFinalUsuarios = indiceInicialUsuarios + itensPorPaginaUsuarios;
  const usuariosVisiveis = usuariosFiltrados.slice(indiceInicialUsuarios, indiceFinalUsuarios);
  const exibicaoUsuariosInicio =
    usuariosFiltrados.length > 0 ? indiceInicialUsuarios + 1 : 0;
  const exibicaoUsuariosFim = Math.min(indiceFinalUsuarios, usuariosFiltrados.length);
  const idsUsuariosVisiveis = usuariosVisiveis.map((usuario) => usuario.id);

  useEffect(() => {
    if (paginaAtualUsuarios !== paginaAtualUsuariosAjustada) {
      setPaginaAtualUsuarios(paginaAtualUsuariosAjustada);
    }
  }, [paginaAtualUsuarios, paginaAtualUsuariosAjustada]);

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
    setPermissionSearch('');
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

  const handleOpenDetailsDialog = (usuario: Usuario): void => {
    setUsuarioDetalhes(usuario);
    setShowDetailsDialog(true);
  };

  const handleCloseDetailsDialog = (): void => {
    setShowDetailsDialog(false);
    setUsuarioDetalhes(null);
  };

  const handleCloseDialog = (): void => {
    setShowDialog(false);
    setEditingUsuario(null);
    setFormError(null);
    setPermissionSearch('');
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
    if (idsUsuariosVisiveis.length === 0) return;

    const todosVisiveisSelecionados = idsUsuariosVisiveis.every((id) =>
      usuariosSelecionados.includes(id),
    );

    if (todosVisiveisSelecionados) {
      setUsuariosSelecionados((prev) => prev.filter((id) => !idsUsuariosVisiveis.includes(id)));
      return;
    }

    setUsuariosSelecionados((prev) => Array.from(new Set([...prev, ...idsUsuariosVisiveis])));
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

  const permissionLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    catalogoPermissoes.groups.forEach((group) => {
      group.options.forEach((option) => {
        map.set(option.value, option.label);
      });
    });
    return map;
  }, [catalogoPermissoes.groups]);

  const roleSelecionadoFormulario = (formData.role as UserRole) || UserRole.USER;
  const gruposPermissaoDoFormulario = getPermissionGroupsByRole(
    catalogoPermissoes,
    roleSelecionadoFormulario,
  );
  const permissionSearchNormalized = permissionSearch.trim().toLowerCase();
  const gruposPermissaoFiltrados = gruposPermissaoDoFormulario
    .map((grupo) => {
      if (!permissionSearchNormalized) {
        return grupo;
      }

      const groupMatch =
        grupo.label.toLowerCase().includes(permissionSearchNormalized) ||
        grupo.description?.toLowerCase().includes(permissionSearchNormalized);

      const options = groupMatch
        ? grupo.options
        : grupo.options.filter(
            (option) =>
              option.label.toLowerCase().includes(permissionSearchNormalized) ||
              option.value.toLowerCase().includes(permissionSearchNormalized),
          );

      return {
        ...grupo,
        options,
      };
    })
    .filter((grupo) => grupo.options.length > 0);
  const filtrosAtivos = Boolean(busca || filtroRole || filtroStatus !== 'todos' || apenasAtendentes);
  const todosFiltradosSelecionados =
    idsUsuariosVisiveis.length > 0 &&
    idsUsuariosVisiveis.every((id) => usuariosSelecionados.includes(id));
  const algunsFiltradosSelecionados =
    !todosFiltradosSelecionados &&
    idsUsuariosVisiveis.some((id) => usuariosSelecionados.includes(id));
  const podeCriarPrimeiroUsuario =
    !busca && !filtroRole && filtroStatus === 'todos' && !apenasAtendentes;
  const modalLabelClass = 'mb-2 block text-sm font-semibold text-[#284858]';
  const modalInputClass =
    'h-10 w-full rounded-xl border border-[#CFDDE2] bg-[#FBFDFE] px-3 text-sm text-[#244455] outline-none transition focus:border-[#159A9C]/45 focus:ring-2 focus:ring-[#159A9C]/15';
  const modalInputWithIconClass =
    'h-10 w-full rounded-xl border border-[#CFDDE2] bg-[#FBFDFE] pl-10 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#159A9C]/45 focus:ring-2 focus:ring-[#159A9C]/15';
  const modalCheckboxClass =
    'h-4 w-4 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]';
  const desktopCellPaddingClass = tableDensity === 'compact' ? 'px-6 py-2.5' : 'px-6 py-4';

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title="Gestao de Usuarios"
          description="Gerencie usuarios, papeis e permissoes do sistema."
          filters={<ActiveEmpresaBadge variant="page" />}
          actions={
            <>
              <button
                onClick={carregarDados}
                disabled={loading}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#CFDDE2] bg-white px-4 text-sm font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button
                onClick={() => handleOpenDialog()}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#159A9C] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0F7B7D]"
              >
                <Plus className="h-4 w-4" />
                Novo Usuario
              </button>
            </>
          }
        />

        {!loading && (
          <InlineStats
            stats={[
              { label: 'Total', value: String(totalUsuarios), tone: 'neutral' },
              { label: 'Ativos', value: String(usuariosAtivos), tone: 'accent' },
              { label: 'Administradores', value: String(administradores), tone: 'warning' },
              { label: 'Online hoje', value: String(onlineHoje), tone: 'neutral' },
            ]}
          />
        )}
      </SectionCard>

      <FiltersBar className="p-4">
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAbaAtiva('todos')}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                abaAtiva === 'todos'
                  ? 'bg-[#159A9C] text-white shadow-sm'
                  : 'border border-[#D3E0E5] bg-white text-[#4F6C7B] hover:bg-[#F3F8FA]'
              }`}
            >
              Todos os usuarios
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva('atendentes')}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                abaAtiva === 'atendentes'
                  ? 'bg-[#159A9C] text-white shadow-sm'
                  : 'border border-[#D3E0E5] bg-white text-[#4F6C7B] hover:bg-[#F3F8FA]'
              }`}
            >
              Atendentes
            </button>

            {abaAtiva === 'atendentes' ? (
              <span className="rounded-full border border-[#D6E5EA] bg-[#F6FBFC] px-3 py-1 text-xs font-medium text-[#607B89]">
                Filtro de atendimento ativo
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8AA0AB]" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                className="h-10 w-full rounded-lg border border-[#CFDDE2] bg-white pl-9 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#159A9C]/45 focus:ring-2 focus:ring-[#159A9C]/15"
              />
            </div>

            <select
              value={filtroRole}
              onChange={(event) => setFiltroRole(event.target.value as UserRole | '')}
              className="h-10 w-full rounded-lg border border-[#CFDDE2] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#159A9C]/45 focus:ring-2 focus:ring-[#159A9C]/15"
            >
              <option value="">Todos os papeis</option>
              <option value={UserRole.SUPERADMIN}>Super Admin</option>
              <option value={UserRole.ADMIN}>Administrador</option>
              <option value={UserRole.MANAGER}>Gerente</option>
              <option value={UserRole.FINANCEIRO}>Financeiro</option>
              <option value={UserRole.VENDEDOR}>Vendedor</option>
              <option value={UserRole.USER}>Usuario</option>
            </select>

            <select
              value={filtroStatus}
              onChange={(event) => setFiltroStatus(event.target.value as typeof filtroStatus)}
              className="h-10 w-full rounded-lg border border-[#CFDDE2] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#159A9C]/45 focus:ring-2 focus:ring-[#159A9C]/15"
            >
              <option value="todos">Todos os status</option>
              <option value="ativos">Apenas ativos</option>
              <option value="inativos">Apenas inativos</option>
            </select>

            <div className="flex items-center">
              {abaAtiva === 'todos' ? (
                <label
                  htmlFor="apenasAtendentes"
                  className="inline-flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-[#CFDDE2] bg-white px-3 text-sm text-[#355061]"
                >
                  <input
                    type="checkbox"
                    id="apenasAtendentes"
                    checked={apenasAtendentes}
                    onChange={(event) => setApenasAtendentes(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                  />
                  Apenas atendentes
                </label>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setBusca('');
                    setFiltroRole('');
                    setFiltroStatus('todos');
                  }}
                  className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-[#CFDDE2] bg-white px-3 text-sm font-medium text-[#486475] transition-colors hover:bg-[#F6FBFC]"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#6A8795]">
              Exibindo {usuariosFiltrados.length} de {totalUsuarios} usuarios.
            </p>
            {filtrosAtivos ? (
              <button
                type="button"
                onClick={() => {
                  setBusca('');
                  setFiltroRole('');
                  setFiltroStatus('todos');
                  if (abaAtiva === 'todos') {
                    setApenasAtendentes(false);
                  }
                }}
                className="inline-flex items-center rounded-lg border border-[#CFDDE2] bg-white px-3 py-1.5 text-xs font-semibold text-[#486475] transition-colors hover:bg-[#F6FBFC]"
              >
                Limpar filtros
              </button>
            ) : null}
          </div>

          {filtrosAtivos ? (
            <div className="flex flex-wrap items-center gap-2">
              {busca ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#D8E6EA] bg-[#F7FBFC] px-3 py-1 text-xs text-[#4F6C7B]">
                  Busca:
                  <strong className="font-semibold text-[#214251]">{busca}</strong>
                </span>
              ) : null}
              {filtroRole ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#D8E6EA] bg-[#F7FBFC] px-3 py-1 text-xs text-[#4F6C7B]">
                  Papel:
                  <strong className="font-semibold text-[#214251]">
                    {ROLE_LABELS[filtroRole as UserRole] ?? filtroRole}
                  </strong>
                </span>
              ) : null}
              {filtroStatus !== 'todos' ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#D8E6EA] bg-[#F7FBFC] px-3 py-1 text-xs text-[#4F6C7B]">
                  Status:
                  <strong className="font-semibold text-[#214251]">
                    {filtroStatus === 'ativos' ? 'Ativos' : 'Inativos'}
                  </strong>
                </span>
              ) : null}
              {apenasAtendentes ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#CDE7E2] bg-[#EDF8F6] px-3 py-1 text-xs text-[#0F7B7D]">
                  Apenas atendentes
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </FiltersBar>

      {usuariosSelecionados.length > 0 && (
        <SectionCard className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#607B89]">
              {usuariosSelecionados.length} usuario(s) selecionado(s)
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleBulkAction('ativar')}
                className="inline-flex items-center rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                Ativar
              </button>
              <button
                onClick={() => handleBulkAction('desativar')}
                className="inline-flex items-center rounded-lg bg-yellow-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-yellow-700"
              >
                Desativar
              </button>
              <button
                onClick={() => handleBulkAction('excluir')}
                className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </SectionCard>
      )}

      {loading && <LoadingSkeleton lines={8} />}

      {!loading && error && (
        <EmptyState
          icon={<AlertCircle className="h-5 w-5" />}
          title="Erro ao carregar usuarios"
          description={error}
          action={
            <button
              onClick={carregarDados}
              className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0F7B7D]"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          }
        />
      )}

      {!loading && !error && usuariosFiltrados.length === 0 && (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title={filtrosAtivos ? 'Nenhum usuario encontrado' : 'Nenhum usuario cadastrado'}
          description={
            filtrosAtivos
              ? 'Tente ajustar os filtros para ampliar os resultados.'
              : 'Crie o primeiro usuario para iniciar a operacao.'
          }
          action={
            podeCriarPrimeiroUsuario ? (
              <button
                onClick={() => handleOpenDialog()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0F7B7D]"
              >
                <Plus className="h-4 w-4" />
                Criar primeiro usuario
              </button>
            ) : undefined
          }
        />
      )}

      {!loading && !error && usuariosFiltrados.length > 0 && (
        <DataTableCard>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4EDF1] bg-[#FBFDFE] px-4 py-3">
            <div className="text-sm text-[#607B89]">
              <strong className="font-semibold text-[#1D3B4D]">{usuariosFiltrados.length}</strong>{' '}
              registro(s)
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex overflow-hidden rounded-lg border border-[#D7E5EA] bg-white">
                <button
                  type="button"
                  onClick={() => setTableDensity('comfortable')}
                  className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    tableDensity === 'comfortable'
                      ? 'bg-[#159A9C] text-white'
                      : 'text-[#62808E] hover:bg-[#F5FAFB]'
                  }`}
                >
                  Confortavel
                </button>
                <button
                  type="button"
                  onClick={() => setTableDensity('compact')}
                  className={`border-l border-[#E2EDF1] px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    tableDensity === 'compact'
                      ? 'bg-[#159A9C] text-white'
                      : 'text-[#62808E] hover:bg-[#F5FAFB]'
                  }`}
                >
                  Compacta
                </button>
              </div>
              <span className="rounded-full border border-[#D7E5EA] bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#62808E]">
                {abaAtiva === 'atendentes' ? 'Visao Atendimento' : 'Visao Geral'}
              </span>
            </div>
          </div>

          <div className="divide-y divide-[#E7EFF2] md:hidden">
            {usuariosVisiveis.map((usuario) => (
              <article
                key={`mobile-${usuario.id}`}
                className="space-y-3 px-4 py-4 cursor-pointer transition-colors hover:bg-[#F8FCFD]"
                onClick={() => handleOpenDetailsDialog(usuario)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={usuariosSelecionados.includes(usuario.id)}
                    onChange={() => handleToggleSelecionado(usuario.id)}
                    onClick={(event) => event.stopPropagation()}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                  />
                  {usuario.avatar_url ? (
                    <img
                      className="h-11 w-11 rounded-full object-cover"
                      src={usuario.avatar_url}
                      alt={usuario.nome}
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] text-sm font-semibold text-white">
                      {usuario.nome?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#17374B]">{usuario.nome}</p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-[#6A8795]">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{usuario.email}</span>
                    </div>
                    {usuario.telefone ? (
                      <div className="mt-1 flex items-center gap-1 text-xs text-[#6A8795]">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{usuario.telefone}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_COLORS[usuario.role]}`}
                  >
                    {ROLE_LABELS[usuario.role]}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      usuario.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                  {abaAtiva === 'atendentes' && usuario.status_atendente ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_ATENDENTE_COLORS[usuario.status_atendente]}`}
                    >
                      {STATUS_ATENDENTE_LABELS[usuario.status_atendente]}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#E6EEF2] bg-[#FAFCFD] px-3 py-2">
                  <span className="text-xs text-[#6A8795]">Ultimo login</span>
                  <span className="text-xs font-medium text-[#355061]">
                    {formatarDataHora(usuario.ultimo_login)}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2" onClick={(event) => event.stopPropagation()}>
                  <button
                    onClick={() => handleOpenDialog(usuario)}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-[#D6E5EA] bg-white text-[#159A9C] transition-colors hover:bg-[#EAF8F6]"
                    title="Editar"
                    aria-label={`Editar ${usuario.nome}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(usuario)}
                    className={`inline-flex h-9 items-center justify-center rounded-lg border transition-colors ${
                      usuario.ativo
                        ? 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                        : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                    title={usuario.ativo ? 'Desativar' : 'Ativar'}
                    aria-label={`${usuario.ativo ? 'Desativar' : 'Ativar'} ${usuario.nome}`}
                  >
                    {usuario.ativo ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleResetSenha(usuario)}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-purple-200 bg-purple-50 text-purple-700 transition-colors hover:bg-purple-100"
                    title="Resetar senha"
                    aria-label={`Resetar senha de ${usuario.nome}`}
                  >
                    <Key className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(usuario)}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 transition-colors hover:bg-red-100"
                    title="Excluir"
                    aria-label={`Excluir ${usuario.nome}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden max-h-[68vh] md:block overflow-auto">
            <table className="min-w-full divide-y divide-[#E2ECF0]">
              <thead className="sticky top-0 z-10 bg-[#F6FAFB]">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={todosFiltradosSelecionados}
                          ref={(element) => {
                            if (element) {
                              element.indeterminate = algunsFiltradosSelecionados;
                            }
                          }}
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
                  <tbody className="bg-white divide-y divide-[#E7EFF2]">
                    {usuariosVisiveis.map((usuario) => (
                      <tr
                        key={usuario.id}
                        className="cursor-pointer transition-colors hover:bg-[#F8FCFD]"
                        onClick={() => handleOpenDetailsDialog(usuario)}
                      >
                        <td className={desktopCellPaddingClass}>
                          <input
                            type="checkbox"
                            checked={usuariosSelecionados.includes(usuario.id)}
                            onChange={() => handleToggleSelecionado(usuario.id)}
                            onClick={(event) => event.stopPropagation()}
                            className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                          />
                        </td>
                        <td className={`${desktopCellPaddingClass} whitespace-nowrap`}>
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
                        <td className={`${desktopCellPaddingClass} whitespace-nowrap`}>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[usuario.role]}`}
                          >
                            {ROLE_LABELS[usuario.role]}
                          </span>
                        </td>
                        <td className={`${desktopCellPaddingClass} whitespace-nowrap`}>
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
                          <td className={`${desktopCellPaddingClass} whitespace-nowrap`}>
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
                        <td className={`${desktopCellPaddingClass} whitespace-nowrap text-sm text-gray-500`}>
                          {formatarDataHora(usuario.ultimo_login)}
                        </td>
                        <td className={`${desktopCellPaddingClass} whitespace-nowrap text-right text-sm font-medium`}>
                          <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
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
          <div className="flex flex-col gap-3 border-t border-[#E4EDF1] bg-[#FBFDFE] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-[#607B89]">
              Mostrando{' '}
              <strong className="font-semibold text-[#1D3B4D]">
                {exibicaoUsuariosInicio}-{exibicaoUsuariosFim}
              </strong>{' '}
              de <strong className="font-semibold text-[#1D3B4D]">{usuariosFiltrados.length}</strong>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 rounded-lg border border-[#D7E5EA] bg-white px-3 py-1.5 text-xs font-medium text-[#607B89]">
                <span>Exibir</span>
                <select
                  value={itensPorPaginaUsuarios}
                  onChange={(event) => {
                    setItensPorPaginaUsuarios(Number(event.target.value));
                    setPaginaAtualUsuarios(1);
                  }}
                  className="rounded-md border border-[#D7E5EA] bg-white px-2 py-1 text-xs font-semibold text-[#355061] outline-none focus:border-[#159A9C]/45"
                >
                  {[10, 20, 50].map((qtde) => (
                    <option key={qtde} value={qtde}>
                      {qtde}
                    </option>
                  ))}
                </select>
              </label>

              <div className="inline-flex items-center gap-1 rounded-lg border border-[#D7E5EA] bg-white p-1">
                <button
                  type="button"
                  onClick={() =>
                    setPaginaAtualUsuarios((prev) => Math.max(1, prev - 1))
                  }
                  disabled={paginaAtualUsuariosAjustada <= 1}
                  className="rounded-md px-2.5 py-1 text-xs font-semibold text-[#355061] transition-colors hover:bg-[#F3F8FA] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="px-1 text-xs font-medium text-[#607B89]">
                  Pagina {paginaAtualUsuariosAjustada} de {totalPaginasUsuarios}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPaginaAtualUsuarios((prev) =>
                      Math.min(totalPaginasUsuarios, prev + 1),
                    )
                  }
                  disabled={paginaAtualUsuariosAjustada >= totalPaginasUsuarios}
                  className="rounded-md px-2.5 py-1 text-xs font-semibold text-[#355061] transition-colors hover:bg-[#F3F8FA] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Proxima
                </button>
              </div>
            </div>
          </div>
        </DataTableCard>
      )}

      {showDetailsDialog && usuarioDetalhes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#072433]/55 p-4 backdrop-blur-[1px]">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#DCE7EB] bg-white shadow-[0_30px_60px_-30px_rgba(7,36,51,0.55)]">
            <div className="border-b border-[#E5EEF2] px-6 py-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Detalhes do usuário</h2>
                <button
                  onClick={handleCloseDetailsDialog}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-[#F3F8FA] hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="space-y-5 px-6 py-5 sm:px-7">
              <div className="flex items-center gap-4">
                {usuarioDetalhes.avatar_url ? (
                  <img
                    className="h-14 w-14 rounded-full object-cover"
                    src={usuarioDetalhes.avatar_url}
                    alt={usuarioDetalhes.nome}
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] text-lg font-semibold text-white">
                    {usuarioDetalhes.nome?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-[#17374B]">{usuarioDetalhes.nome}</p>
                  <p className="truncate text-sm text-[#607B89]">{usuarioDetalhes.email}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#E3EDF1] bg-[#FAFCFD] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6A8795]">Papel</p>
                  <p className="mt-1 text-sm font-semibold text-[#1D3B4D]">{ROLE_LABELS[usuarioDetalhes.role]}</p>
                </div>
                <div className="rounded-xl border border-[#E3EDF1] bg-[#FAFCFD] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6A8795]">Status</p>
                  <p className="mt-1 text-sm font-semibold text-[#1D3B4D]">
                    {usuarioDetalhes.ativo ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                <div className="rounded-xl border border-[#E3EDF1] bg-[#FAFCFD] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6A8795]">Telefone</p>
                  <p className="mt-1 text-sm font-semibold text-[#1D3B4D]">{usuarioDetalhes.telefone || '-'}</p>
                </div>
                <div className="rounded-xl border border-[#E3EDF1] bg-[#FAFCFD] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6A8795]">Idioma</p>
                  <p className="mt-1 text-sm font-semibold text-[#1D3B4D]">
                    {usuarioDetalhes.idioma_preferido || '-'}
                  </p>
                </div>
                <div className="rounded-xl border border-[#E3EDF1] bg-[#FAFCFD] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6A8795]">Último login</p>
                  <p className="mt-1 text-sm font-semibold text-[#1D3B4D]">
                    {formatarDataHora(usuarioDetalhes.ultimo_login)}
                  </p>
                </div>
                <div className="rounded-xl border border-[#E3EDF1] bg-[#FAFCFD] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6A8795]">Criado em</p>
                  <p className="mt-1 text-sm font-semibold text-[#1D3B4D]">
                    {formatarDataHora(usuarioDetalhes.created_at)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[#E3EDF1] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                  Permissões ({usuarioDetalhes.permissoes?.length || 0})
                </p>
                {usuarioDetalhes.permissoes && usuarioDetalhes.permissoes.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {usuarioDetalhes.permissoes.map((permissao) => (
                      <span
                        key={permissao}
                        className="inline-flex items-center rounded-full border border-[#D7E5EA] bg-[#F6FAFB] px-2.5 py-1 text-xs font-medium text-[#355061]"
                      >
                        {permissionLabelMap.get(permissao) || permissao}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[#607B89]">Nenhuma permissão atribuída.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-[#E5EEF2] px-6 py-4">
              <button
                onClick={handleCloseDetailsDialog}
                className="inline-flex h-10 items-center rounded-lg border border-[#D1DFE5] px-4 text-sm font-semibold text-[#355061] transition-colors hover:bg-[#F4F9FA]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criar/Editar Usuário */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#072433]/55 p-4 backdrop-blur-[1px]">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#DCE7EB] bg-white shadow-[0_30px_60px_-30px_rgba(7,36,51,0.55)]">
            <div className="border-b border-[#E5EEF2] px-6 py-5">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
                </h2>
                <button
                  onClick={handleCloseDialog}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-[#F3F8FA] hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5 sm:px-7">
              <div className="grid gap-4 md:grid-cols-2">
              {/* Nome */}
              <div>
                <label className={modalLabelClass}>
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nome || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                  className={modalInputClass}
                  placeholder="Nome completo do usuário"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className={modalLabelClass}>
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className={modalInputWithIconClass}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
              </div>

              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Telefone */}
                <div>
                  <label className={modalLabelClass}>Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.telefone || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, telefone: e.target.value }))
                      }
                      className={modalInputWithIconClass}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                {/* Papel/Role */}
                <div>
                  <label className={modalLabelClass}>
                    Papel <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role || UserRole.USER}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className={modalInputClass}
                    required
                  >
                    {editingUsuario?.role === UserRole.SUPERADMIN && (
                      <option value={UserRole.SUPERADMIN}>Super Admin</option>
                    )}
                    <option value={UserRole.USER}>Usu??rio</option>
                    <option value={UserRole.VENDEDOR}>Vendedor</option>
                    <option value={UserRole.FINANCEIRO}>Financeiro</option>
                    <option value={UserRole.MANAGER}>Gerente</option>
                    <option value={UserRole.ADMIN}>Administrador</option>
                  </select>
                </div>
              </div>

              {/* Senha (apenas ao criar) */}
              {!editingUsuario && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={modalLabelClass}>
                      Senha <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.senha || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, senha: e.target.value }))}
                      className={modalInputClass}
                      placeholder="M??nimo 6 caracteres"
                      required
                    />
                  </div>
                </div>
              )}
              {/* Permissões */}
              <div>
                <label className={modalLabelClass}>Permissões</label>
                <div className="rounded-xl border border-[#DCE7EB] bg-[#F9FBFC] p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E5EEF2] bg-white px-3 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#607B89]">
                      Selecionadas
                    </span>
                    <span className="rounded-full bg-[#EEF7F5] px-2.5 py-1 text-xs font-semibold text-[#0F7B7D]">
                      {(formData.permissoes || []).length}
                    </span>
                  </div>
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8AA2AF]" />
                      <input
                        type="text"
                        value={permissionSearch}
                        onChange={(e) => setPermissionSearch(e.target.value)}
                        className={modalInputWithIconClass}
                        placeholder="Buscar permissao por nome ou chave"
                      />
                    </div>
                    {permissionSearchNormalized && (
                      <button
                        type="button"
                        onClick={() => setPermissionSearch('')}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-[#CFDDE2] bg-white px-3 text-sm font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC]"
                      >
                        Limpar busca
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                  {gruposPermissaoFiltrados.map((grupo) => {
                    const groupValues = getGroupPermissionValues(grupo);
                    const selectedCount = groupValues.filter((value) =>
                      formData.permissoes?.includes(value),
                    ).length;
                    const allSelected = groupValues.length > 0 && selectedCount === groupValues.length;
                    const partiallySelected = selectedCount > 0 && !allSelected;

                    return (
                      <div key={grupo.id} className="rounded-xl border border-[#E1EBEF] bg-white p-3.5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-[#002333]">{grupo.label}</p>
                            {grupo.description && (
                              <p className="text-xs text-gray-500 mt-0.5">{grupo.description}</p>
                            )}
                          </div>
                          <label className="inline-flex items-center cursor-pointer select-none rounded-lg border border-[#E1EBEF] bg-[#FAFCFD] px-2.5 py-1.5">
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
                              className={modalCheckboxClass}
                            />
                            <span className="ml-2 text-xs font-medium text-gray-600 whitespace-nowrap">
                              {permissionSearchNormalized
                                ? 'Selecionar visiveis'
                                : 'Selecionar todos'}{' '}
                              ({selectedCount}/{groupValues.length})
                            </span>
                          </label>
                        </div>
                        <div className="mt-3 grid gap-2">
                          {grupo.options.map((permOption) => (
                            <label
                              key={permOption.value}
                              className="flex cursor-pointer items-center rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:border-[#E4EDF1] hover:bg-[#FAFCFD]"
                            >
                              <input
                                type="checkbox"
                                checked={formData.permissoes?.includes(permOption.value) || false}
                                onChange={() => handleTogglePermissao(permOption.value)}
                                className={modalCheckboxClass}
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
                  {gruposPermissaoDoFormulario.length > 0 &&
                    gruposPermissaoFiltrados.length === 0 &&
                    permissionSearchNormalized && (
                      <p className="text-sm text-gray-500">
                        Nenhuma permissao encontrada para o filtro informado.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                {/* Avatar URL */}
                <div>
                  <label className={modalLabelClass}>Avatar (URL)</label>
                  {formData.avatar_url ? (
                    <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-[#E3EDF1] bg-white px-2.5 py-1.5">
                      <img
                        src={formData.avatar_url}
                        alt="Preview avatar"
                        className="h-7 w-7 rounded-full object-cover"
                      />
                      <span className="text-xs font-medium text-[#607B89]">Previa</span>
                    </div>
                  ) : null}
                  <div className="relative">
                    <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="url"
                      value={formData.avatar_url || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, avatar_url: e.target.value }))
                      }
                      className={modalInputWithIconClass}
                      placeholder="https://exemplo.com/avatar.jpg"
                    />
                  </div>
                </div>

                {/* Status Ativo */}
                <div className="flex h-10 items-center rounded-xl border border-[#E3EDF1] bg-[#FBFDFE] px-3 py-2 md:mb-[1px]">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={formData.ativo || false}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ativo: e.target.checked }))}
                    className={modalCheckboxClass}
                  />
                  <label htmlFor="ativo" className="ml-2 cursor-pointer text-sm font-medium text-[#355061] whitespace-nowrap">
                    Usu??rio ativo
                  </label>
                </div>
              </div>
            </div>

            {formError && (
              <div className="px-6 sm:px-7">
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              </div>
            )}

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[#E5EEF2] bg-white/95 px-6 py-4 backdrop-blur sm:px-7">
              <button
                onClick={handleCloseDialog}
                className="inline-flex h-10 items-center rounded-lg border border-[#CFDDE2] bg-white px-4 text-sm font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="inline-flex h-10 items-center rounded-lg bg-[#159A9C] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0F7B7D]"
              >
                {editingUsuario ? 'Salvar Alterações' : 'Criar Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reset de Senha */}
      {showResetSenhaDialog && usuarioResetSenha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#072433]/55 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-md rounded-2xl border border-[#DCE7EB] bg-white shadow-[0_30px_60px_-30px_rgba(7,36,51,0.55)]">
            <div className="border-b border-[#E5EEF2] px-6 py-5">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Resetar senha do usuário</h2>
                <button
                  onClick={handleCloseResetSenhaDialog}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-[#F3F8FA] hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
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

            <div className="flex justify-end gap-3 border-t border-[#E5EEF2] bg-white px-6 py-4">
              <button
                onClick={handleCloseResetSenhaDialog}
                className="inline-flex h-10 items-center rounded-lg border border-[#CFDDE2] bg-white px-4 text-sm font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC]"
              >
                {novaSenhaGerada ? 'Fechar' : 'Cancelar'}
              </button>
              {novaSenhaGerada ? (
                <button
                  onClick={handleCopyNovaSenha}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#159A9C] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0F7B7D]"
                >
                  <Copy className="h-4 w-4" />
                  Copiar senha
                </button>
              ) : (
                <button
                  onClick={handleConfirmResetSenha}
                  disabled={resetSenhaLoading}
                  className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-colors ${resetSenhaLoading ? 'bg-[#159A9C]/80 cursor-not-allowed' : 'bg-[#159A9C] hover:bg-[#0F7B7D]'}`}
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
