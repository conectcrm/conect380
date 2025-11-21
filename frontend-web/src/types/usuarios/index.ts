export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  VENDEDOR = 'vendedor',
  USER = 'user',
}

export enum StatusAtendente {
  DISPONIVEL = 'DISPONIVEL',
  OCUPADO = 'OCUPADO',
  AUSENTE = 'AUSENTE',
  OFFLINE = 'OFFLINE',
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
  deve_trocar_senha?: boolean;
  ultimo_login?: Date;
  created_at: Date;
  updated_at: Date;
  empresa?: {
    id: string;
    nome: string;
    slug: string;
  };
  // Campos específicos para atendentes (quando permissoes inclui 'ATENDIMENTO')
  status_atendente?: StatusAtendente;
  capacidade_maxima?: number;
  tickets_ativos?: number;
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
  configuracoes?: {
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
  limite?: number;
  pagina?: number;
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

export const STATUS_ATENDENTE_LABELS: Record<StatusAtendente, string> = {
  [StatusAtendente.DISPONIVEL]: 'Disponível',
  [StatusAtendente.OCUPADO]: 'Ocupado',
  [StatusAtendente.AUSENTE]: 'Ausente',
  [StatusAtendente.OFFLINE]: 'Offline',
};

export const STATUS_ATENDENTE_COLORS: Record<StatusAtendente, string> = {
  [StatusAtendente.DISPONIVEL]: 'bg-green-100 text-green-800',
  [StatusAtendente.OCUPADO]: 'bg-yellow-100 text-yellow-800',
  [StatusAtendente.AUSENTE]: 'bg-orange-100 text-orange-800',
  [StatusAtendente.OFFLINE]: 'bg-gray-100 text-gray-800',
};
