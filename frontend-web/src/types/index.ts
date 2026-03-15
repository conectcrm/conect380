// Tipos comuns da aplicação
export interface User {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  role:
  | 'superadmin'
  | 'admin'
  | 'manager'
  | 'gerente'
  | 'vendedor'
  | 'user'
  | 'suporte'
  | 'financeiro'
  | string;
  permissoes?: string[];
  permissions?: string[];
  roles?: string[];
  avatar_url?: string;
  configuracoes?: {
    tema?: string;
    notificacoes?: {
      email?: boolean;
      push?: boolean;
    };
    seguranca?: {
      mfa_login_habilitado?: boolean;
    };
    mfa_login_habilitado?: boolean;
  };
  idioma_preferido: string;
  ultimo_login?: string | Date | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
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

export interface LoginSuccessData {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface TrocarSenhaActionData {
  userId: string;
  email: string;
  nome: string;
}

export interface MfaRequiredActionData {
  challengeId: string;
  email: string;
  expiresInSeconds: number;
  canResendAfterSeconds: number;
  deliveryChannel?: 'email' | 'dev_fallback';
  devCode?: string;
}

export interface LoginResponse {
  success: boolean;
  action?: 'TROCAR_SENHA' | 'MFA_REQUIRED';
  data:
  | LoginSuccessData
  | TrocarSenhaActionData
  | MfaRequiredActionData;
  message: string;
}
