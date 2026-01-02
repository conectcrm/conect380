// Tipos comuns da aplicação
export interface User {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  role: 'superadmin' | 'admin' | 'manager' | 'vendedor' | 'user';
  avatar_url?: string;
  idioma_preferido: string;
  empresa: {
    id: string;
    nome: string;
    slug: string;
    cnpj?: string;
    plano?: string;
    ativo?: boolean;
    subdominio?: string;
  };
}

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
  documento?: string;
  status: 'lead' | 'prospect' | 'cliente' | 'inativo';
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  empresa?: string;
  cargo?: string;
  origem?: string;
  tags?: string[];
  observacoes?: string;
  valor_estimado: number;
  ultimo_contato?: Date;
  proximo_contato?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  success: boolean;
  action?: 'TROCAR_SENHA'; // ✅ Ação de trocar senha (primeiro acesso)
  data:
  | {
    access_token: string;
    user: User;
  }
  | {
    userId: string;
    email: string;
    nome: string;
  }; // ✅ Data pode ser token+user OU dados para trocar senha
  message: string;
}
