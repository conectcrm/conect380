import { IsString, IsEmail, IsOptional, IsBoolean, IsUUID, MaxLength } from 'class-validator';

/**
 * DTO para criação de um novo contato
 */
export class CreateContatoDto {
  @IsString()
  @MaxLength(255)
  nome: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsString()
  @MaxLength(50)
  telefone: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cargo?: string;

  @IsOptional()
  @IsBoolean()
  principal?: boolean;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

/**
 * DTO para atualização de um contato existente
 */
export class UpdateContatoDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nome?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cargo?: string;

  @IsOptional()
  @IsBoolean()
  principal?: boolean;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

/**
 * DTO de resposta para contato
 */
export class ResponseContatoDto {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  principal: boolean;
  ativo: boolean;
  observacoes: string;
  clienteId: string;

  /**
   * Cliente vinculado (quando a relação for carregada)
   */
  cliente?: {
    id: string;
    nome: string;
    documento: string;
    tipo: string;
    email?: string;
    telefone?: string;
  };

  createdAt: Date;
  updatedAt: Date;

  /**
   * Nome completo formatado com cargo
   * Ex: "João Silva (Gerente Comercial)"
   */
  nomeCompleto: string;

  /**
   * Telefone formatado
   * Ex: "(11) 99999-9999"
   */
  telefoneFormatado: string;

  constructor(contato: any) {
    this.id = contato.id;
    this.nome = contato.nome;
    this.email = contato.email;
    this.telefone = contato.telefone;
    this.cargo = contato.cargo;
    this.principal = contato.principal;
    this.ativo = contato.ativo;
    this.observacoes = contato.observacoes;
    this.clienteId = contato.clienteId;
    this.createdAt = contato.createdAt;
    this.updatedAt = contato.updatedAt;

    // Incluir dados do cliente se estiver disponível
    if (contato.cliente) {
      this.cliente = {
        id: contato.cliente.id,
        nome: contato.cliente.nome,
        documento: contato.cliente.documento,
        tipo: contato.cliente.tipo,
        email: contato.cliente.email,
        telefone: contato.cliente.telefone,
      };
    }

    // Campos calculados
    this.nomeCompleto = contato.cargo
      ? `${contato.nome} (${contato.cargo})`
      : contato.nome;

    this.telefoneFormatado = this.formatarTelefone(contato.telefone);
  }

  private formatarTelefone(telefone: string): string {
    if (!telefone) {
      return '';
    }

    const trimmed = telefone.trim();

    if (trimmed.startsWith('+')) {
      const digits = trimmed.slice(1).replace(/\D/g, '');

      if (trimmed.startsWith('+55') && digits.length >= 12) {
        const local = digits.slice(2);
        if (local.length === 11) {
          return `+55 (${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
        }
        if (local.length === 10) {
          return `+55 (${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
        }
      }

      return `+${digits}`;
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
}
