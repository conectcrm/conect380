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

    // Campos calculados
    this.nomeCompleto = contato.cargo
      ? `${contato.nome} (${contato.cargo})`
      : contato.nome;

    this.telefoneFormatado = this.formatarTelefone(contato.telefone);
  }

  private formatarTelefone(telefone: string): string {
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length === 11) {
      return `(${numeros.substr(0, 2)}) ${numeros.substr(2, 5)}-${numeros.substr(7)}`;
    }
    return telefone;
  }
}
