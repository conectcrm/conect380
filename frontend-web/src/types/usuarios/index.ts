export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  VENDEDOR = 'vendedor',
  USER = 'user',
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  role: UserRole;
  permissoes?: string[];
  empresa_id: string;
  avatar_url?: string;
  idioma_preferido: string;
  configuracoes?: {
    tema?: string;
    notificacoes?: {
      email?: boolean;
      push?: boolean;
    };
  };
  ativo: boolean;
  ultimo_login?: Date;
  created_at: Date;
  updated_at: Date;
  empresa?: {
    id: string;
    nome: string;
    slug: string;
  };
}

export interface NovoUsuario {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  role: UserRole;
  permissoes?: string[];
  empresa_id: string;
  avatar_url?: string;
  idioma_preferido?: string;
  configuracoes?:  {
    tema?: string;
    notificacoes?: {
      email?: boolean;
      push?: boolean;
    };
  };
  ativo?: boolean;
}

export interface AtualizarUsuario {
  id: string;
  nome?: string;
  email?: string;
  telefone?: string;
  role?: UserRole;
  permissoes?: string[];
  avatar_url?: string;
  idioma_preferido?: string;
  configuracoes?: {
    tema?: string;
    notificacoes?: {
      email?: boolean;
      push?: boolean;
    };
  };
  ativo?: boolean;
}

export interface FiltrosUsuarios {
  busca?: string;
  role?: UserRole | '';
  ativo?: boolean | '';
  empresa_id?: string;
  ordenacao?: 'nome' | 'email' | 'role' | 'created_at' | 'ultimo_login';
  direcao?: 'asc' | 'desc';
  dataInicio?: string;
  dataFim?: string;
  ultimoLoginInicio?: string;
  ultimoLoginFim?: string;
}

export interface EstatisticasUsuarios {
  totalUsuarios: number;
  usuariosAtivos: number;
  usuariosInativos: number;
  distribuicaoPorRole: Record<UserRole, number>;
  ultimosLogins: number;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrador',
  [UserRole.MANAGER]: 'Gerente',
  [UserRole.VENDEDOR]: 'Vendedor',
  [UserRole.USER]: 'Usuário',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'bg-red-100 text-red-800',
  [UserRole.MANAGER]: 'bg-blue-100 text-blue-800',
  [UserRole.VENDEDOR]: 'bg-green-100 text-green-800',
  [UserRole.USER]: 'bg-gray-100 text-gray-800',
};
