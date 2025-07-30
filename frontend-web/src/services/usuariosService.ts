import axios from 'axios';
import {
  Usuario,
  NovoUsuario,
  AtualizarUsuario,
  FiltrosUsuarios,
  EstatisticasUsuarios
} from '../types/usuarios/index';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // CRUD Usuários
  async listarUsuarios(filtros?: Partial<FiltrosUsuarios>): Promise<Usuario[]> {
    console.log('Frontend - Chamando listarUsuarios com filtros:', filtros);
    const response = await this.api.get('/', { params: filtros });
    console.log('Frontend - Resposta do backend:', response.data);
    return response.data.map((usuario: any) => this.formatarUsuario(usuario));
  }

  async obterUsuario(id: string): Promise<Usuario> {
    const response = await this.api.get(`/${id}`);
    return this.formatarUsuario(response.data);
  }

  async criarUsuario(usuario: NovoUsuario): Promise<Usuario> {
    console.log('Service - Dados recebidos:', usuario);

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

    console.log('Service - Dados transformados:', dadosBackend);

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

  async resetarSenha(id: string): Promise<{ novaSenha: string }> {
    const response = await this.api.post(`/${id}/reset-senha`);
    return response.data;
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
      ultimo_login: usuario.ultimo_login ? new Date(usuario.ultimo_login) : undefined,
      created_at: new Date(usuario.created_at),
      updated_at: new Date(usuario.updated_at),
      empresa: usuario.empresa
    };
  }
}

export const usuariosService = new UsuariosService();
export default usuariosService;
