import axios from 'axios';
import {
  Usuario,
  NovoUsuario,
  AtualizarUsuario,
  FiltrosUsuarios,
  EstatisticasUsuarios
} from '../types/usuarios/index';
import { User } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface ListarUsuariosResponse {
  usuarios: Usuario[];
  total: number;
  pagina: number;
  limite: number;
}

class UsuariosService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/users`,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  constructor() {
    // Interceptor para adicionar token de autenticação
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // CRUD Usuários
  async listarUsuarios(filtros?: Partial<FiltrosUsuarios>): Promise<ListarUsuariosResponse> {
    const response = await this.api.get('/', { params: filtros });

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
    const response = await this.api.get(`/${id}`);
    return this.formatarUsuario(response.data);
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
          push: true
        }
      },
      ativo: usuario.ativo !== undefined ? usuario.ativo : true
    };

    const response = await this.api.post('/', dadosBackend);
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
      ativo: dados.ativo
    };

    const response = await this.api.put(`/${id}`, dadosBackend);
    return this.formatarUsuario(response.data.data);
  }

  async excluirUsuario(id: string): Promise<void> {
    await this.api.delete(`/${id}`);
  }

  async alterarStatusUsuario(id: string, ativo: boolean): Promise<Usuario> {
    const response = await this.api.patch(`/${id}/status`, { ativo });
    return this.formatarUsuario(response.data.data);
  }

  // Listar usuários com permissão de atendimento
  async listarAtendentes(): Promise<Usuario[]> {
    const response = await this.api.get('/atendentes');
    return response.data.data.map((usuario: any) => this.formatarUsuario(usuario));
  }

  // Buscar usuários da equipe/empresa
  async buscarUsuariosEquipe(): Promise<User[]> {
    try {
      const response = await this.api.get('/team');
      return response.data.data.map((usuario: any) => this.formatarUsuarioParaUser(usuario));
    } catch (error) {
      console.error('Erro ao buscar usuários da equipe:', error);
      throw error;
    }
  }

  // Buscar perfil do usuário atual
  async buscarPerfilAtual(): Promise<User> {
    try {
      const response = await this.api.get('/profile');
      return this.formatarUsuarioParaUser(response.data.data);
    } catch (error) {
      console.error('Erro ao buscar perfil atual:', error);
      throw error;
    }
  }

  // Formatador específico para o tipo User (usado no contexto de autenticação)
  private formatarUsuarioParaUser(usuario: any): User {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      role: usuario.role,
      avatar_url: usuario.avatar_url,
      idioma_preferido: usuario.idioma_preferido || 'pt-BR',
      empresa: {
        id: usuario.empresa_id || '1',
        nome: usuario.empresa?.nome || 'Empresa',
        slug: usuario.empresa?.slug || 'empresa'
      }
    };
  }

  async resetarSenha(id: string): Promise<string> {
    const response = await this.api.put(`/${id}/reset-senha`);
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
      const response = await this.api.get('/estatisticas');

      // O backend retorna um objeto com {success: true, data: {...}}
      const backendData = response.data.data || response.data;

      // Mapear os dados do backend para o formato esperado pelo frontend
      return {
        totalUsuarios: backendData.total || 0,
        usuariosAtivos: backendData.ativos || 0,
        usuariosInativos: backendData.inativos || 0,
        distribuicaoPorRole: backendData.por_perfil || {
          admin: 0,
          manager: 0,
          vendedor: 0,
          user: 0
        },
        ultimosLogins: backendData.ativos_30_dias || 0
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      // Retornar valores vazios em caso de erro
      return {
        totalUsuarios: 0,
        usuariosAtivos: 0,
        usuariosInativos: 0,
        distribuicaoPorRole: {
          admin: 0,
          manager: 0,
          vendedor: 0,
          user: 0
        },
        ultimosLogins: 0
      };
    }
  }

  // Método para obter perfil do usuário logado
  async obterPerfil(): Promise<Usuario> {
    const response = await this.api.get('/profile');
    return this.formatarUsuario(response.data.data);
  }

  // Método para atualizar perfil do usuário logado
  async atualizarPerfil(dados: Partial<NovoUsuario>): Promise<Usuario> {
    const response = await this.api.put('/profile', dados);
    return this.formatarUsuario(response.data.data);
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
          push: true
        }
      },
      ativo: usuario.ativo,
      deve_trocar_senha: Boolean(usuario.deve_trocar_senha),
      ultimo_login: usuario.ultimo_login ? new Date(usuario.ultimo_login) : undefined,
      created_at: new Date(usuario.created_at),
      updated_at: new Date(usuario.updated_at),
      empresa: usuario.empresa
    };
  }
}

export const usuariosService = new UsuariosService();
export default usuariosService;
