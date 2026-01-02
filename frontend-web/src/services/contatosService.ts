import { api } from './api';
import { getErrorMessage } from '../utils/errorHandling';

/**
 * Interface Contato - Alinhada com backend
 * Representa contatos (funcionários) vinculados a clientes (empresas)
 */
export interface Contato {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  principal: boolean;
  ativo: boolean;
  observacoes: string;
  clienteId: string;
  cliente?: {
    id: string;
    nome: string;
    documento: string;
    tipo: 'pessoa_fisica' | 'pessoa_juridica';
    email?: string;
    telefone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO para criação de contato
 */
export interface CreateContatoDto {
  nome: string;
  email?: string;
  telefone: string;
  cargo?: string;
  principal?: boolean;
  observacoes?: string;
}

/**
 * DTO para atualização de contato
 */
export interface UpdateContatoDto {
  nome?: string;
  email?: string;
  telefone?: string;
  cargo?: string;
  principal?: boolean;
  ativo?: boolean;
  observacoes?: string;
}

/**
 * Service para gerenciar contatos
 * Endpoints: /api/crm/clientes/:clienteId/contatos e /api/crm/contatos/:id
 */
class ContatosService {
  private readonly baseUrl = '/api/crm';
  private readonly errorPrefix = '[ContatosService]';

  private async handleRequest<T>(request: () => Promise<{ data: T }>, context: string): Promise<T> {
    try {
      const response = await request();
      return response.data;
    } catch (err: unknown) {
      console.error(`${this.errorPrefix} ${context}:`, err);
      throw new Error(getErrorMessage(err, context));
    }
  }

  private async handleVoidRequest(request: () => Promise<unknown>, context: string): Promise<void> {
    try {
      await request();
    } catch (err: unknown) {
      console.error(`${this.errorPrefix} ${context}:`, err);
      throw new Error(getErrorMessage(err, context));
    }
  }

  /**
   * Lista TODOS os contatos da empresa (de todos os clientes)
   * GET /api/crm/contatos
   */
  async listarTodos(): Promise<Contato[]> {
    return this.handleRequest(
      () => api.get<Contato[]>(`${this.baseUrl}/contatos`),
      'Erro ao listar todos os contatos',
    );
  }

  /**
   * Lista todos os contatos de um cliente específico
   * GET /api/crm/clientes/:clienteId/contatos
   */
  async listarPorCliente(clienteId: string): Promise<Contato[]> {
    return this.handleRequest(
      () => api.get<Contato[]>(`${this.baseUrl}/clientes/${clienteId}/contatos`),
      'Erro ao listar contatos do cliente',
    );
  }

  /**
   * Busca um contato específico por ID
   * GET /api/crm/contatos/:id
   */
  async buscarPorId(contatoId: string): Promise<Contato> {
    return this.handleRequest(
      () => api.get<Contato>(`${this.baseUrl}/contatos/${contatoId}`),
      'Erro ao buscar contato',
    );
  }

  /**
   * Cria um novo contato para um cliente
   * POST /api/crm/clientes/:clienteId/contatos
   */
  async criar(clienteId: string, data: CreateContatoDto): Promise<Contato> {
    return this.handleRequest(
      () => api.post<Contato>(`${this.baseUrl}/clientes/${clienteId}/contatos`, data),
      'Erro ao criar contato',
    );
  }

  /**
   * Atualiza um contato existente
   * PATCH /api/crm/contatos/:id
   */
  async atualizar(contatoId: string, data: UpdateContatoDto): Promise<Contato> {
    return this.handleRequest(
      () => api.patch<Contato>(`${this.baseUrl}/contatos/${contatoId}`, data),
      'Erro ao atualizar contato',
    );
  }

  /**
   * Remove um contato (soft delete)
   * DELETE /api/crm/contatos/:id
   */
  async remover(contatoId: string): Promise<void> {
    await this.handleVoidRequest(
      () => api.delete(`${this.baseUrl}/contatos/${contatoId}`),
      'Erro ao remover contato',
    );
  }

  /**
   * Define um contato como principal
   * PATCH /api/crm/contatos/:id/principal
   */
  async definirPrincipal(contatoId: string): Promise<Contato> {
    return this.handleRequest(
      () => api.patch<Contato>(`${this.baseUrl}/contatos/${contatoId}/principal`),
      'Erro ao definir contato principal',
    );
  }

  /**
   * Formata telefone para exibição
   * (11) 99999-9999
   */
  formatarTelefone(telefone: string): string {
    if (!telefone) {
      return '';
    }

    const trimmed = telefone.trim();

    if (trimmed.startsWith('+')) {
      // Já está no formato internacional
      const numeros = trimmed.slice(1).replace(/\D/g, '');
      if (trimmed.startsWith('+55') && numeros.length >= 12) {
        const local = numeros.slice(2);
        if (local.length === 11) {
          return `+55 (${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
        }
        if (local.length === 10) {
          return `+55 (${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
        }
      }
      return `+${numeros}`;
    }

    const numeros = trimmed.replace(/\D/g, '');
    if (numeros.length === 11) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    }
    if (numeros.length === 10) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
    }
    return trimmed;
  }

  /**
   * Normaliza telefone removendo caracteres especiais
   */
  normalizarTelefone(telefone: string): string {
    if (!telefone) {
      return '';
    }

    let valor = telefone.trim();

    if (!valor) {
      return '';
    }

    if (valor.startsWith('00')) {
      valor = `+${valor.slice(2)}`;
    }

    valor = valor.replace(/\s+/g, '').replace(/[()\-]/g, '');

    if (valor.startsWith('+')) {
      const digits = valor.slice(1).replace(/\D/g, '');
      if (!digits) {
        return '';
      }
      const limited = digits.slice(0, 15);
      return `+${limited}`;
    }

    const digitsOnly = valor.replace(/\D/g, '');
    if (!digitsOnly) {
      return '';
    }

    if (digitsOnly.length > 11 && digitsOnly.length <= 15) {
      return `+${digitsOnly}`;
    }

    if (digitsOnly.length >= 8 && digitsOnly.length <= 11) {
      return `+55${digitsOnly}`;
    }

    return `+${digitsOnly.slice(0, 15)}`;
  }

  /**
   * Retorna nome completo com cargo
   * Ex: "João Silva (Gerente Comercial)"
   */
  getNomeCompleto(contato: Contato): string {
    return contato.cargo ? `${contato.nome} (${contato.cargo})` : contato.nome;
  }
}

export const contatosService = new ContatosService();
