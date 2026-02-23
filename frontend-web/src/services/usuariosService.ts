import { api } from './api';
import {
  Usuario,
  NovoUsuario,
  AtualizarUsuario,
  FiltrosUsuarios,
  EstatisticasUsuarios,
  PermissionCatalogResponse,
  UserRole,
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

  async criarUsuario(usuario: NovoUsuario): Promise<Usuario> {
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
    return this.formatarUsuario(response.data.data);
  }

  async atualizarUsuario(usuario: AtualizarUsuario): Promise<Usuario> {
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
    return this.formatarUsuario(response.data.data);
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
    const notificacoes = usuario.configuracoes?.notificacoes;

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
        tema: usuario.configuracoes?.tema || 'light',
        notificacoes: {
          email:
            typeof notificacoes?.email === 'boolean'
              ? notificacoes.email
              : true,
          push:
            typeof notificacoes?.push === 'boolean'
              ? notificacoes.push
              : true,
        },
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
      const distribuicaoPorRole = {
        [UserRole.SUPERADMIN]: 0,
        [UserRole.ADMIN]: 0,
        [UserRole.MANAGER]: 0,
        [UserRole.VENDEDOR]: 0,
        [UserRole.USER]: 0,
        [UserRole.FINANCEIRO]: 0,
        ...(backendData.por_perfil?.financeiro !== undefined
          ? { [UserRole.FINANCEIRO]: Number(backendData.por_perfil.financeiro) || 0 }
          : {}),
        ...(backendData.por_perfil || {}),
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
          [UserRole.MANAGER]: 0,
          [UserRole.VENDEDOR]: 0,
          [UserRole.USER]: 0,
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
  private formatarUsuario(usuario: any): Usuario {
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
      configuracoes: usuario.configuracoes || {
        tema: 'light',
        notificacoes: {
          email: true,
          push: true,
        },
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
