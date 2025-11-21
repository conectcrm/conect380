import { api } from './api';

export interface RegistrarEmpresaPayload {
  empresa: {
    nome: string;
    cnpj: string;
    email: string;
    telefone: string;
    endereco: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  usuario: {
    nome: string;
    email: string;
    senha: string;
    telefone: string;
  };
  plano: string;
  aceitarTermos: boolean;
}

export interface EmpresaResponse {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  plano: string;
  subdominio?: string;
  ativo?: boolean;
  status?: 'ativa' | 'inativa' | 'trial' | 'suspensa';
  data_criacao?: string;
  data_expiracao?: string;
  email_verificado?: boolean;
  created_at?: string;
  updated_at?: string;
  configuracoes?: Record<string, unknown> | null;
  limites?: {
    usuarios?: number;
    clientes?: number;
    armazenamento?: string;
  } | null;
  usuario_admin?: {
    id: string;
    nome: string;
    email: string;
    telefone: string;
  };
  usuarios?: Array<{
    id: string;
    nome: string;
    email: string;
    role: string;
    ativo: boolean;
  }>;
}

export interface VerificacaoEmailResponse {
  message: string;
  success: boolean;
}

export interface RegistrarEmpresaResponse {
  success: boolean;
  message: string;
  data: EmpresaResponse;
}

class EmpresaService {
  // Registrar nova empresa
  async registrarEmpresa(dados: RegistrarEmpresaPayload): Promise<RegistrarEmpresaResponse> {
    try {
      const response = await api.post<RegistrarEmpresaResponse>('/empresas/registro', dados);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao registrar empresa:', error);
      throw new Error(
        error.response?.data?.message ||
        'Erro ao registrar empresa. Tente novamente.'
      );
    }
  }

  // Verificar disponibilidade de CNPJ
  async verificarCNPJ(cnpj: string): Promise<{ disponivel: boolean; message?: string }> {
    try {
      const response = await api.get(`/empresas/verificar-cnpj/${cnpj.replace(/\D/g, '')}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao verificar CNPJ:', error);
      return {
        disponivel: false,
        message: 'Erro ao verificar CNPJ'
      };
    }
  }

  // Verificar disponibilidade de email
  async verificarEmail(email: string): Promise<{ disponivel: boolean; message?: string }> {
    try {
      const response = await api.get(`/empresas/verificar-email/${encodeURIComponent(email)}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao verificar email:', error);
      return {
        disponivel: false,
        message: 'Erro ao verificar email'
      };
    }
  }

  // Verificar email de ativação
  async verificarEmailAtivacao(token: string): Promise<VerificacaoEmailResponse> {
    try {
      const response = await api.post('/empresas/verificar-email', { token });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao verificar email de ativação:', error);
      throw new Error(
        error.response?.data?.message ||
        'Token inválido ou expirado'
      );
    }
  }

  // Reenviar email de ativação
  async reenviarEmailAtivacao(email: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/empresas/reenviar-ativacao', { email });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao reenviar email:', error);
      throw new Error(
        error.response?.data?.message ||
        'Erro ao reenviar email de ativação'
      );
    }
  }

  // Obter informações da empresa pelo subdomínio
  async obterEmpresaPorSubdominio(subdominio: string): Promise<EmpresaResponse> {
    try {
      const response = await api.get(`/empresas/subdominio/${subdominio}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao obter empresa:', error);
      throw new Error(
        error.response?.data?.message ||
        'Empresa não encontrada'
      );
    }
  }

  // Obter planos disponíveis
  async obterPlanos(): Promise<Array<{
    id: string;
    nome: string;
    preco: number;
    descricao: string;
    recursos: string[];
    limites: {
      usuarios: number;
      clientes: number;
      armazenamento: string;
    };
  }>> {
    try {
      const response = await api.get('/empresas/planos');
      return response.data;
    } catch (error: any) {
      console.error('Erro ao obter planos:', error);
      // Retornar planos padrão em caso de erro
      return [
        {
          id: 'starter',
          nome: 'Starter',
          preco: 99,
          descricao: 'Ideal para pequenas empresas',
          recursos: [
            'Até 3 usuários',
            'Até 1.000 clientes',
            'Módulos básicos',
            '5GB de armazenamento',
            'Suporte por email'
          ],
          limites: {
            usuarios: 3,
            clientes: 1000,
            armazenamento: '5GB'
          }
        },
        {
          id: 'professional',
          nome: 'Professional',
          preco: 299,
          descricao: 'Para empresas em crescimento',
          recursos: [
            'Até 10 usuários',
            'Até 10.000 clientes',
            'Todos os módulos',
            '50GB de armazenamento',
            'White label básico',
            'Suporte prioritário'
          ],
          limites: {
            usuarios: 10,
            clientes: 10000,
            armazenamento: '50GB'
          }
        },
        {
          id: 'enterprise',
          nome: 'Enterprise',
          preco: 899,
          descricao: 'Para grandes operações',
          recursos: [
            'Usuários ilimitados',
            'Clientes ilimitados',
            'API completa',
            '500GB de armazenamento',
            'White label completo',
            'Suporte dedicado'
          ],
          limites: {
            usuarios: -1, // ilimitado
            clientes: -1, // ilimitado
            armazenamento: '500GB'
          }
        }
      ];
    }
  }

  // Validar CNPJ via Receita Federal (opcional)
  async validarCNPJReceita(cnpj: string): Promise<{
    valido: boolean;
    empresa?: {
      nome: string;
      situacao: string;
      endereco: string;
      telefone?: string;
    };
    message?: string;
  }> {
    try {
      // Esta seria uma integração com API da Receita Federal
      // Por enquanto, retornar validação básica
      const cnpjLimpo = cnpj.replace(/\D/g, '');

      // Validação básica de CNPJ
      if (cnpjLimpo.length !== 14) {
        return {
          valido: false,
          message: 'CNPJ deve ter 14 dígitos'
        };
      }

      // TODO: Implementar validação real com Receita Federal
      return {
        valido: true,
        empresa: {
          nome: 'Empresa de Exemplo',
          situacao: 'ATIVA',
          endereco: 'Endereço de exemplo'
        }
      };
    } catch (error) {
      console.error('Erro ao validar CNPJ:', error);
      return {
        valido: false,
        message: 'Erro ao validar CNPJ'
      };
    }
  }

  // Buscar CEP via ViaCEP
  async buscarCEP(cep: string): Promise<{
    cep: string;
    logradouro: string;
    bairro: string;
    localidade: string;
    uf: string;
    erro?: boolean;
  }> {
    try {
      const cepLimpo = cep.replace(/\D/g, '');
      if (cepLimpo.length !== 8) {
        throw new Error('CEP deve ter 8 dígitos');
      }

      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      throw new Error('CEP inválido ou não encontrado');
    }
  }

  // Obter empresa por ID
  async obterEmpresaPorId(id: string): Promise<EmpresaResponse> {
    try {
      const response = await api.get(`/empresas/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao obter empresa:', error);
      throw new Error(
        error.response?.data?.message ||
        'Erro ao buscar dados da empresa'
      );
    }
  }

  // Atualizar dados da empresa
  async atualizarEmpresa(id: string, dados: Partial<{
    nome: string;
    cnpj: string;
    email: string;
    telefone: string;
    endereco: string;
    cidade: string;
    estado: string;
    cep: string;
  }>): Promise<EmpresaResponse> {
    try {
      const response = await api.put(`/empresas/${id}`, dados);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar empresa:', error);
      throw new Error(
        error.response?.data?.message ||
        'Erro ao atualizar dados da empresa'
      );
    }
  }
}

export const empresaService = new EmpresaService();
