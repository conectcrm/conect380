import { api } from './api';
import {
  AccessReviewReport,
  AccessReviewReportSummaryEntry,
  AccessReviewReportUser,
  Usuario,
  NovoUsuario,
  AtualizarUsuario,
  FiltrosUsuarios,
  EstatisticasUsuarios,
  PermissionCatalogResponse,
  UserAccessChangeRequest,
  UserAccessChangeStatus,
  UserRole,
  UsuarioMutationResult,
  RecertifyAccessResult,
} from '../types/usuarios/index';
import { User } from '../types';

export interface ListarUsuariosResponse {
  usuarios: Usuario[];
  total: number;
  pagina: number;
  limite: number;
}

export interface UploadAvatarResponse {
  id: string;
  nome?: string;
  email?: string;
  avatar_url?: string | null;
}

export interface AprovarSolicitacaoAcessoResult {
  request: UserAccessChangeRequest;
  applied_user?: Usuario | null;
}

export interface AccessReviewReportFilters {
  role?: UserRole | '';
  include_inactive?: boolean;
  limit?: number;
}

export type PrivacyRequestType = 'data_export' | 'account_anonymization' | 'account_deletion';

export interface PrivacyRequestResponse {
  protocolo: string;
  status: string;
  tipo: PrivacyRequestType;
  criado_em: string;
  observacao?: string;
}

export interface AdminPrivacyRequestItem {
  id: string;
  protocolo: string;
  created_at: string;
  updated_at?: string | null;
  status: 'open' | 'in_review' | 'completed' | 'rejected';
  type: PrivacyRequestType;
  reason?: string | null;
  resolution_note?: string | null;
  requested_at?: string | null;
  handled_at?: string | null;
  handled_by?: {
    id?: string | null;
    nome?: string | null;
    email?: string | null;
  } | null;
  requester?: {
    id?: string | null;
    nome?: string | null;
    email?: string | null;
  } | null;
}

class UsuariosService {
  private readonly basePath = '/users';
  private readonly requestTimeoutMs = 30000;

  private getUrl(path: string = ''): string {
    return `${this.basePath}${path}`;
  }

  // CRUD Usuários
  async listarUsuarios(filtros?: Partial<FiltrosUsuarios>): Promise<ListarUsuariosResponse> {
    const response = await api.get(this.getUrl(), { params: filtros });

    const payload = response.data;

    const paginaBase = filtros?.pagina ?? 1;
    const limiteBase = filtros?.limite ?? 10;

    let usuariosRaw: any[] = [];
    let total = 0;
    let pagina = paginaBase;
    let limite = limiteBase;

    if (Array.isArray(payload)) {
      usuariosRaw = payload;
      total = payload.length;
    } else if (payload?.data) {
      const data = payload.data;
      if (Array.isArray(data)) {
        usuariosRaw = data;
        total = data.length;
      } else {
        usuariosRaw = data?.items || data?.usuarios || [];
        total = typeof data?.total === 'number' ? data.total : usuariosRaw.length;
        pagina = data?.pagina ?? paginaBase;
        limite = data?.limite ?? limiteBase;
      }
    } else {
      usuariosRaw = payload?.items || payload?.usuarios || [];
      total = typeof payload?.total === 'number' ? payload.total : usuariosRaw.length;
    }

    return {
      usuarios: usuariosRaw.map((usuario: any) => this.formatarUsuario(usuario)),
      total,
      pagina,
      limite,
    };
  }

  async obterUsuario(id: string): Promise<Usuario> {
    const response = await api.get(this.getUrl(`/${id}`));
    return this.formatarUsuario(response.data);
  }

  async obterCatalogoPermissoes(): Promise<PermissionCatalogResponse> {
    const response = await api.get(this.getUrl('/permissoes/catalogo'));
    const payload = response.data?.data ?? response.data ?? {};

    return {
      version: typeof payload.version === 'string' ? payload.version : 'unknown',
      groups: Array.isArray(payload.groups) ? payload.groups : [],
      defaultsByRole:
        payload.defaultsByRole && typeof payload.defaultsByRole === 'object'
          ? payload.defaultsByRole
          : {},
      allPermissions: Array.isArray(payload.allPermissions) ? payload.allPermissions : [],
      legacyAssignablePermissions: Array.isArray(payload.legacyAssignablePermissions)
        ? payload.legacyAssignablePermissions
        : [],
    };
  }

  private isAccessChangeRequestPayload(data: unknown): data is UserAccessChangeRequest {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const value = data as Record<string, unknown>;
    return (
      typeof value.id === 'string' &&
      typeof value.action === 'string' &&
      typeof value.status === 'string' &&
      typeof value.created_at === 'string'
    );
  }

  private formatarSolicitacaoAcesso(data: any): UserAccessChangeRequest {
    return {
      id: data.id,
      empresa_id: data.empresa_id,
      action: data.action,
      status: data.status as UserAccessChangeStatus,
      target_user_id: data.target_user_id ?? null,
      request_payload: data.request_payload ?? {},
      request_reason: data.request_reason ?? null,
      decision_reason: data.decision_reason ?? null,
      decided_at: data.decided_at ?? null,
      applied_at: data.applied_at ?? null,
      applied_user_id: data.applied_user_id ?? null,
      created_at: data.created_at,
      updated_at: data.updated_at ?? null,
      requested_by: data.requested_by ?? null,
      decided_by: data.decided_by ?? null,
      target_user: data.target_user ?? null,
      applied_user: data.applied_user ?? null,
    };
  }

  async criarUsuario(usuario: NovoUsuario): Promise<UsuarioMutationResult> {
    const dadosBackend = {
      nome: usuario.nome,
      email: usuario.email,
      senha: usuario.senha,
      telefone: usuario.telefone,
      role: usuario.role,
      permissoes: usuario.permissoes || [],
      empresa_id: usuario.empresa_id,
      avatar_url: usuario.avatar_url,
      idioma_preferido: usuario.idioma_preferido || 'pt-BR',
      configuracoes: usuario.configuracoes || {
        tema: 'light',
        notificacoes: {
          email: true,
          push: true,
        },
      },
      ativo: usuario.ativo !== undefined ? usuario.ativo : true,
    };

    const response = await api.post(this.getUrl(), dadosBackend);
    const payload = response.data;
    const data = payload?.data ?? payload;

    if (this.isAccessChangeRequestPayload(data)) {
      return {
        mode: 'pending_approval',
        request: this.formatarSolicitacaoAcesso(data),
        message: payload?.message,
      };
    }

    return {
      mode: 'applied',
      usuario: this.formatarUsuario(data),
      message: payload?.message,
    };
  }

  async atualizarUsuario(usuario: AtualizarUsuario): Promise<UsuarioMutationResult> {
    const { id, ...dados } = usuario;

    const dadosBackend = {
      nome: dados.nome,
      email: dados.email,
      telefone: dados.telefone,
      role: dados.role,
      permissoes: dados.permissoes,
      avatar_url: dados.avatar_url,
      idioma_preferido: dados.idioma_preferido,
      configuracoes: dados.configuracoes,
      ativo: dados.ativo,
    };

    const response = await api.put(this.getUrl(`/${id}`), dadosBackend);
    const payload = response.data;
    const data = payload?.data ?? payload;

    if (this.isAccessChangeRequestPayload(data)) {
      return {
        mode: 'pending_approval',
        request: this.formatarSolicitacaoAcesso(data),
        message: payload?.message,
      };
    }

    return {
      mode: 'applied',
      usuario: this.formatarUsuario(data),
      message: payload?.message,
    };
  }

  async excluirUsuario(id: string): Promise<void> {
    await api.delete(this.getUrl(`/${id}`));
  }

  async alterarStatusUsuario(id: string, ativo: boolean): Promise<Usuario> {
    const response = await api.patch(this.getUrl(`/${id}/status`), { ativo });
    return this.formatarUsuario(response.data.data);
  }

  // Listar usuários com permissão de atendimento
  async listarAtendentes(): Promise<Usuario[]> {
    const response = await api.get(this.getUrl('/atendentes'));
    return response.data.data.map((usuario: any) => this.formatarUsuario(usuario));
  }

  // Buscar usuários da equipe/empresa
  async buscarUsuariosEquipe(): Promise<User[]> {
    try {
      const response = await api.get(this.getUrl('/team'));
      return response.data.data.map((usuario: any) => this.formatarUsuarioParaUser(usuario));
    } catch (error) {
      console.error('Erro ao buscar usuários da equipe:', error);
      throw error;
    }
  }

  // Buscar perfil do usuário atual
  async buscarPerfilAtual(): Promise<User> {
    try {
      const response = await api.get(this.getUrl('/profile'));
      return this.formatarUsuarioParaUser(response.data.data);
    } catch (error) {
      console.error('Erro ao buscar perfil atual:', error);
      throw error;
    }
  }

  // Formatador específico para o tipo User (usado no contexto de autenticação)
  private formatarUsuarioParaUser(usuario: any): User {
    const existingConfig =
      usuario.configuracoes && typeof usuario.configuracoes === 'object' ? usuario.configuracoes : {};
    const notificacoes = existingConfig.notificacoes;
    const nestedMfaPreference = existingConfig?.seguranca?.mfa_login_habilitado;
    const legacyMfaPreference = existingConfig?.mfa_login_habilitado;
    const mfaLoginHabilitado =
      typeof nestedMfaPreference === 'boolean'
        ? nestedMfaPreference
        : typeof legacyMfaPreference === 'boolean'
          ? legacyMfaPreference
          : undefined;

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      role: usuario.role,
      permissoes: usuario.permissoes || usuario.permissions || [],
      permissions: usuario.permissions || usuario.permissoes || [],
      avatar_url: usuario.avatar_url,
      configuracoes: {
        ...existingConfig,
        tema: existingConfig.tema || 'light',
        notificacoes: {
          ...(existingConfig.notificacoes || {}),
          email:
            typeof notificacoes?.email === 'boolean'
              ? notificacoes.email
              : true,
          push:
            typeof notificacoes?.push === 'boolean'
              ? notificacoes.push
              : true,
        },
        seguranca: {
          ...(existingConfig.seguranca || {}),
          ...(typeof mfaLoginHabilitado === 'boolean'
            ? { mfa_login_habilitado: mfaLoginHabilitado }
            : {}),
        },
        ...(typeof mfaLoginHabilitado === 'boolean'
          ? { mfa_login_habilitado: mfaLoginHabilitado }
          : {}),
      },
      idioma_preferido: usuario.idioma_preferido || 'pt-BR',
      ultimo_login: usuario.ultimo_login || null,
      created_at: usuario.created_at || null,
      updated_at: usuario.updated_at || null,
      empresa: {
        id: usuario.empresa_id || usuario.empresa?.id || '1',
        nome: usuario.empresa?.nome || 'Empresa',
        slug: usuario.empresa?.slug || 'empresa',
      },
    };
  }

  async resetarSenha(id: string): Promise<string> {
    const response = await api.put(this.getUrl(`/${id}/reset-senha`));
    const payload = response.data;

    const novaSenha = payload?.data?.novaSenha ?? payload?.novaSenha ?? payload?.data?.senhaTemp;

    if (typeof novaSenha === 'string' && novaSenha.length > 0) {
      return novaSenha;
    }

    if (typeof payload === 'string' && payload.length > 0) {
      return payload;
    }

    throw new Error('Resposta inválida do servidor ao resetar a senha.');
  }

  // Estatísticas
  async obterEstatisticas(): Promise<EstatisticasUsuarios> {
    try {
      const response = await api.get(this.getUrl('/estatisticas'));

      // O backend retorna um objeto com {success: true, data: {...}}
      const backendData = response.data.data || response.data;
      const porPerfil = backendData.por_perfil ?? {};
      const distribuicaoPorRole: Record<UserRole, number> = {
        [UserRole.SUPERADMIN]: Number(porPerfil.superadmin) || 0,
        [UserRole.ADMIN]: Number(porPerfil.admin) || 0,
        [UserRole.GERENTE]: Number(porPerfil.gerente ?? porPerfil.manager) || 0,
        [UserRole.VENDEDOR]: Number(porPerfil.vendedor) || 0,
        [UserRole.SUPORTE]: Number(porPerfil.suporte ?? porPerfil.user) || 0,
        [UserRole.FINANCEIRO]: Number(porPerfil.financeiro) || 0,
      };

      // Mapear os dados do backend para o formato esperado pelo frontend
      return {
        totalUsuarios: backendData.total || 0,
        usuariosAtivos: backendData.ativos || 0,
        usuariosInativos: backendData.inativos || 0,
        distribuicaoPorRole,
        ultimosLogins: backendData.ativos_30_dias || 0,
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      // Retornar valores vazios em caso de erro
      return {
        totalUsuarios: 0,
        usuariosAtivos: 0,
        usuariosInativos: 0,
        distribuicaoPorRole: {
          [UserRole.SUPERADMIN]: 0,
          [UserRole.ADMIN]: 0,
          [UserRole.GERENTE]: 0,
          [UserRole.VENDEDOR]: 0,
          [UserRole.SUPORTE]: 0,
          [UserRole.FINANCEIRO]: 0,
        },
        ultimosLogins: 0,
      };
    }
  }

  // Método para obter perfil do usuário logado
  async obterPerfil(): Promise<Usuario> {
    const response = await api.get(this.getUrl('/profile'));
    return this.formatarUsuario(response.data.data);
  }

  // Método para atualizar perfil do usuário logado
  async atualizarPerfil(dados: Partial<NovoUsuario>): Promise<Usuario> {
    const response = await api.put(this.getUrl('/profile'), dados, {
      timeout: this.requestTimeoutMs,
    });
    return this.formatarUsuario(response.data.data);
  }

  async atualizarSenhaPerfil(dados: {
    senha_atual: string;
    senha_nova: string;
    confirmar_senha?: string;
  }): Promise<void> {
    await api.put(this.getUrl('/profile/password'), dados, {
      timeout: this.requestTimeoutMs,
    });
  }

  async exportarDadosPerfil(): Promise<Record<string, unknown>> {
    const response = await api.get(this.getUrl('/profile/export'), {
      timeout: this.requestTimeoutMs,
    });
    return response.data?.data ?? response.data ?? {};
  }

  async solicitarPrivacidadePerfil(payload: {
    type: PrivacyRequestType;
    reason?: string;
  }): Promise<PrivacyRequestResponse> {
    const response = await api.post(this.getUrl('/profile/privacy-request'), payload, {
      timeout: this.requestTimeoutMs,
    });
    return response.data?.data ?? response.data ?? {};
  }

  async listarSolicitacoesPrivacidade(params?: {
    status?: 'open' | 'in_review' | 'completed' | 'rejected';
    type?: PrivacyRequestType;
    limit?: number;
  }): Promise<AdminPrivacyRequestItem[]> {
    const response = await api.get(this.getUrl('/privacy-requests'), { params });
    return Array.isArray(response.data?.data) ? response.data.data : [];
  }

  async atualizarSolicitacaoPrivacidade(
    id: string,
    payload: {
      status: 'open' | 'in_review' | 'completed' | 'rejected';
      resolution_note?: string;
    },
  ): Promise<AdminPrivacyRequestItem> {
    const response = await api.patch(this.getUrl(`/privacy-requests/${id}`), payload, {
      timeout: this.requestTimeoutMs,
    });
    return response.data?.data ?? response.data ?? {};
  }

  async listarSolicitacoesAcesso(params?: {
    status?: UserAccessChangeStatus;
    limit?: number;
  }): Promise<UserAccessChangeRequest[]> {
    const response = await api.get(this.getUrl('/access-change-requests'), { params });
    const data = Array.isArray(response.data?.data) ? response.data.data : [];
    return data.map((item: any) => this.formatarSolicitacaoAcesso(item));
  }

  async aprovarSolicitacaoAcesso(
    id: string,
    payload?: {
      reason?: string;
    },
  ): Promise<AprovarSolicitacaoAcessoResult> {
    const response = await api.post(this.getUrl(`/access-change-requests/${id}/approve`), payload || {});
    const data = response.data?.data ?? response.data ?? {};

    return {
      request: this.formatarSolicitacaoAcesso(data.request ?? {}),
      applied_user: data.applied_user ? this.formatarUsuario(data.applied_user) : null,
    };
  }

  async rejeitarSolicitacaoAcesso(
    id: string,
    payload?: {
      reason?: string;
    },
  ): Promise<UserAccessChangeRequest> {
    const response = await api.post(this.getUrl(`/access-change-requests/${id}/reject`), payload || {});
    return this.formatarSolicitacaoAcesso(response.data?.data ?? response.data ?? {});
  }

  async gerarRelatorioRevisaoAcessos(
    params?: AccessReviewReportFilters,
  ): Promise<AccessReviewReport> {
    const response = await api.get(this.getUrl('/access-review/report'), { params });
    const payload = response.data?.data ?? response.data ?? {};
    return this.formatarRelatorioRevisaoAcessos(payload);
  }

  async recertificarAcesso(payload: {
    target_user_id: string;
    approved: boolean;
    reason?: string;
  }): Promise<RecertifyAccessResult> {
    const response = await api.post(this.getUrl('/access-review/recertify'), payload, {
      timeout: this.requestTimeoutMs,
    });

    const data = response.data?.data ?? response.data ?? {};

    return {
      decision: data.decision,
      action_taken: data.action_taken,
      activity_id: data.activity_id,
      target_user: this.formatarUsuario(data.target_user ?? {}),
    };
  }

  async uploadAvatarUsuario(id: string, file: File): Promise<UploadAvatarResponse> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post(this.getUrl(`/${id}/avatar`), formData, {
      timeout: this.requestTimeoutMs,
    });
    const payload = response.data?.data ?? response.data ?? {};

    return {
      id: payload.id || id,
      nome: payload.nome,
      email: payload.email,
      avatar_url: payload.avatar_url ?? null,
    };
  }

  async uploadAvatarPerfil(file: File): Promise<UploadAvatarResponse> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post(this.getUrl('/profile/avatar'), formData, {
      timeout: this.requestTimeoutMs,
    });
    const payload = response.data?.data ?? response.data ?? {};

    return {
      id: payload.id || '',
      nome: payload.nome,
      email: payload.email,
      avatar_url: payload.avatar_url ?? null,
    };
  }

  // Formatação de dados
  private formatarRelatorioRevisaoAcessos(data: any): AccessReviewReport {
    const summary = data?.summary ?? {};
    const byProfileRaw = Array.isArray(summary.by_profile) ? summary.by_profile : [];
    const usersRaw = Array.isArray(data?.users) ? data.users : [];

    const by_profile: AccessReviewReportSummaryEntry[] = byProfileRaw.map((entry: any) => ({
      role: String(entry?.role ?? ''),
      total: Number(entry?.total ?? 0),
      ativos: Number(entry?.ativos ?? 0),
      inativos: Number(entry?.inativos ?? 0),
    }));

    const users: AccessReviewReportUser[] = usersRaw.map((user: any) => ({
      id: String(user?.id ?? ''),
      nome: String(user?.nome ?? ''),
      email: String(user?.email ?? ''),
      role: String(user?.role ?? ''),
      ativo: Boolean(user?.ativo),
      permissoes: Array.isArray(user?.permissoes) ? user.permissoes : [],
      ultimo_login:
        typeof user?.ultimo_login === 'string' ? user.ultimo_login : null,
      created_at:
        typeof user?.created_at === 'string' ? user.created_at : null,
      updated_at:
        typeof user?.updated_at === 'string' ? user.updated_at : null,
    }));

    return {
      empresa_id: String(data?.empresa_id ?? ''),
      generated_at:
        typeof data?.generated_at === 'string'
          ? data.generated_at
          : new Date().toISOString(),
      filters: {
        role: typeof data?.filters?.role === 'string' ? data.filters.role : null,
        include_inactive: Boolean(data?.filters?.include_inactive),
        detail_limit: Number(data?.filters?.detail_limit ?? users.length),
      },
      summary: {
        total_users: Number(summary.total_users ?? users.length),
        active_users: Number(summary.active_users ?? 0),
        inactive_users: Number(summary.inactive_users ?? 0),
        by_profile,
      },
      users,
    };
  }

  private formatarUsuario(usuario: any): Usuario {
    const existingConfig =
      usuario.configuracoes && typeof usuario.configuracoes === 'object' ? usuario.configuracoes : {};
    const notificacoes = existingConfig.notificacoes;
    const nestedMfaPreference = existingConfig?.seguranca?.mfa_login_habilitado;
    const legacyMfaPreference = existingConfig?.mfa_login_habilitado;
    const mfaLoginHabilitado =
      typeof nestedMfaPreference === 'boolean'
        ? nestedMfaPreference
        : typeof legacyMfaPreference === 'boolean'
          ? legacyMfaPreference
          : undefined;

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      role: usuario.role,
      permissoes: usuario.permissoes || [],
      empresa_id: usuario.empresa_id,
      avatar_url: usuario.avatar_url,
      idioma_preferido: usuario.idioma_preferido || 'pt-BR',
      configuracoes: {
        ...existingConfig,
        tema: existingConfig.tema || 'light',
        notificacoes: {
          ...(existingConfig.notificacoes || {}),
          email:
            typeof notificacoes?.email === 'boolean'
              ? notificacoes.email
              : true,
          push:
            typeof notificacoes?.push === 'boolean'
              ? notificacoes.push
              : true,
        },
        seguranca: {
          ...(existingConfig.seguranca || {}),
          ...(typeof mfaLoginHabilitado === 'boolean'
            ? { mfa_login_habilitado: mfaLoginHabilitado }
            : {}),
        },
        ...(typeof mfaLoginHabilitado === 'boolean'
          ? { mfa_login_habilitado: mfaLoginHabilitado }
          : {}),
      },
      ativo: usuario.ativo,
      deve_trocar_senha: Boolean(usuario.deve_trocar_senha),
      ultimo_login: usuario.ultimo_login ? new Date(usuario.ultimo_login) : undefined,
      created_at: usuario.created_at ? new Date(usuario.created_at) : new Date(),
      updated_at: usuario.updated_at ? new Date(usuario.updated_at) : new Date(),
      empresa: usuario.empresa,
    };
  }
}

export const usuariosService = new UsuariosService();
export default usuariosService;
